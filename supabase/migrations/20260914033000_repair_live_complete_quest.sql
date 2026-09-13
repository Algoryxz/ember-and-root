-- Migration: 20260914033000_repair_live_complete_quest.sql
-- Description: Repair live quest sealing - remove pg_catalog.greatest/least

CREATE OR REPLACE FUNCTION public.complete_quest(p_request_id uuid, p_quest_id uuid, p_expected_occurrence text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_canonical_payload jsonb;
  v_payload_hash text;
  v_receipt record;
  v_quest record;
  v_timezone text;
  v_current_local_date date;
  v_occurrence_key text;
  v_existing_comp record;
  v_base_xp integer;
  v_daily_xp_awarded integer;
  v_awarded_xp integer;
  v_sparks_awarded integer;
  v_capped_today boolean := false;
  v_completion_id uuid;
  v_prev_level integer;
  v_new_level integer;
  v_new_total_xp integer;
  v_new_sparks integer;
  v_new_branch_xp integer;
  v_branch_spec text;
  v_spec_available boolean := false;
  v_crest_available boolean := false;
  v_ember_relit boolean := false;
  v_ward_consumed boolean := false;
  v_new_streak integer;
  v_longest_streak integer;
  v_today_completions integer;
  v_ember_state text;
  v_event jsonb;
  v_result jsonb;
  v_snapshot jsonb;
BEGIN
  -- 1. Require authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Lock the user's profile row
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for authenticated user' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Derive canonical payload fingerprint internally
  v_canonical_payload := pg_catalog.jsonb_build_object(
    'questId', p_quest_id,
    'expectedOccurrence', COALESCE(p_expected_occurrence, '')
  );
  v_payload_hash := pg_catalog.encode(pg_catalog.sha256(v_canonical_payload::text::bytea), 'hex');

  -- 4. Check mutation receipt for idempotency
  SELECT * INTO v_receipt
  FROM public.mutation_receipts
  WHERE user_id = v_user_id AND request_id = p_request_id;

  IF FOUND THEN
    IF v_receipt.payload_hash = v_payload_hash THEN
      -- Safe replay: return prior result
      RETURN v_receipt.result_event;
    ELSE
      RAISE EXCEPTION 'Idempotency conflict: requestId % was already used with a different payload', p_request_id USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- 5. Load owned active quest
  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest % not found or not owned by caller', p_quest_id USING ERRCODE = 'P0004';
  END IF;

  IF v_quest.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot complete deleted quest %', p_quest_id USING ERRCODE = 'P0005';
  END IF;

  -- 6. Derive current local date in user's saved IANA timezone
  v_timezone := COALESCE(v_profile.timezone, 'UTC');
  BEGIN
    v_current_local_date := (pg_catalog.now() AT TIME ZONE v_timezone)::date;
  EXCEPTION WHEN OTHERS THEN
    v_timezone := 'UTC';
    v_current_local_date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  END;

  -- 7. Resolve valid occurrence key
  IF v_quest.cadence = 'once' THEN
    v_occurrence_key := 'once';
  ELSIF v_quest.cadence = 'daily' THEN
    v_occurrence_key := pg_catalog.to_char(v_current_local_date, 'YYYY-MM-DD');
  ELSE
    v_occurrence_key := 'once';
  END IF;

  IF p_expected_occurrence IS NOT NULL AND p_expected_occurrence != '' AND p_expected_occurrence != v_occurrence_key THEN
    RAISE EXCEPTION 'Occurrence mismatch: expected %, derived %', p_expected_occurrence, v_occurrence_key USING ERRCODE = 'P0006';
  END IF;

  -- 8. Check for duplicate completion on this occurrence
  SELECT * INTO v_existing_comp
  FROM public.quest_completions
  WHERE user_id = v_user_id AND quest_id = p_quest_id AND occurrence_key = v_occurrence_key;

  IF FOUND THEN
    RAISE EXCEPTION 'Quest occurrence % has already been completed', v_occurrence_key USING ERRCODE = 'P0007';
  END IF;

  -- 9. Determine base XP by effort
  v_base_xp := public.base_xp_from_effort(v_quest.effort);

  -- 10. Enforce daily 140 XP cap
  SELECT COALESCE(pg_catalog.sum(xp_awarded), 0)
  INTO v_daily_xp_awarded
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_awarded_xp := LEAST(v_base_xp, GREATEST(0, 140 - v_daily_xp_awarded));
  IF v_awarded_xp < v_base_xp THEN
    v_capped_today := true;
  END IF;

  -- 11. Sparks calculated using integer floor
  v_sparks_awarded := v_awarded_xp / 5;

  -- 12. Create completion record
  v_completion_id := pg_catalog.gen_random_uuid();
  INSERT INTO public.quest_completions (
    id,
    user_id,
    quest_id,
    occurrence_key,
    completed_at,
    local_date,
    quest_title_snapshot,
    quest_attribute_snapshot,
    quest_effort_snapshot,
    xp_awarded,
    sparks_awarded,
    trial_evidence
  ) VALUES (
    v_completion_id,
    v_user_id,
    p_quest_id,
    v_occurrence_key,
    pg_catalog.now(),
    v_current_local_date,
    v_quest.title,
    v_quest.attribute,
    v_quest.effort,
    v_awarded_xp,
    v_sparks_awarded,
    '{}'::jsonb
  );

  -- 13. Derive level transition
  v_prev_level := public.level_from_xp(v_profile.total_xp);
  v_new_total_xp := v_profile.total_xp + v_awarded_xp;
  v_new_level := public.level_from_xp(v_new_total_xp);
  v_new_sparks := v_profile.sparks_balance + v_sparks_awarded;

  -- 14. Increment branch XP
  UPDATE public.branches
  SET xp = xp + v_awarded_xp
  WHERE user_id = v_user_id AND attribute = v_quest.attribute
  RETURNING xp, selected_specialization INTO v_new_branch_xp, v_branch_spec;

  -- 15. If cadence is 'once', archive the quest
  IF v_quest.cadence = 'once' THEN
    UPDATE public.quests
    SET deleted_at = pg_catalog.now()
    WHERE id = p_quest_id;
  END IF;

  -- 16. Record currency ledger entry
  IF v_sparks_awarded > 0 THEN
    INSERT INTO public.currency_ledger (
      user_id,
      amount,
      source_kind,
      source_id,
      created_at
    ) VALUES (
      v_user_id,
      v_sparks_awarded,
      'quest_reward',
      v_completion_id::text,
      pg_catalog.now()
    );
  END IF;

  -- 17. Update streak rules with Bounded Relic (Ember Ward) support
  IF v_profile.last_activity_date IS NULL THEN
    v_new_streak := 1;
    v_ember_relit := false;
  ELSIF v_current_local_date = v_profile.last_activity_date THEN
    v_new_streak := v_profile.current_streak;
    v_ember_relit := false;
  ELSIF v_current_local_date = (v_profile.last_activity_date + 1) THEN
    v_new_streak := v_profile.current_streak + 1;
    v_ember_relit := false;
  ELSIF v_current_local_date = (v_profile.last_activity_date + 2) AND EXISTS (
    SELECT 1 FROM public.inventory WHERE user_id = v_user_id AND item_id = 'ember_ward'
  ) THEN
    -- Consumable relic: Ember Ward protects 1 missed calendar day!
    DELETE FROM public.inventory WHERE user_id = v_user_id AND item_id = 'ember_ward';
    v_new_streak := v_profile.current_streak + 1;
    v_ward_consumed := true;
    v_ember_relit := false;
  ELSE
    -- Gap >= 1 missed day without ward
    v_new_streak := 1;
    v_ember_relit := true;
  END IF;
  v_longest_streak := GREATEST(v_profile.longest_streak, v_new_streak);

  -- 18. Check specialization & crest availability
  IF v_new_branch_xp >= 80 AND v_branch_spec IS NULL THEN
    v_spec_available := true;
  END IF;

  IF v_new_branch_xp >= 160 THEN
    SELECT (completed_at IS NOT NULL AND claimed_at IS NULL) INTO v_crest_available
    FROM public.trials
    WHERE user_id = v_user_id AND attribute = v_quest.attribute;
    v_crest_available := COALESCE(v_crest_available, false);
  END IF;

  -- 19. Determine new Ember state
  SELECT pg_catalog.count(*)
  INTO v_today_completions
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_ember_state := public.ember_state_from_count(v_today_completions);

  -- 20. Update profile row
  UPDATE public.profiles SET
    total_xp = v_new_total_xp,
    sparks_balance = v_new_sparks,
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_current_local_date,
    revision = v_profile.revision + 1,
    updated_at = pg_catalog.now()
  WHERE user_id = v_user_id;

  -- 21. Build MutationEvent
  v_event := pg_catalog.jsonb_build_object(
    'id', v_completion_id,
    'kind', 'quest_completed',
    'xpAwarded', v_awarded_xp,
    'sparksAwarded', v_sparks_awarded,
    'previousLevel', v_prev_level,
    'newLevel', v_new_level,
    'attribute', v_quest.attribute,
    'specializationAvailable', v_spec_available,
    'crestAvailable', v_crest_available,
    'cappedToday', v_capped_today,
    'emberRelit', v_ember_relit,
    'wardConsumed', v_ward_consumed,
    'emberState', v_ember_state
  );

  -- 22. Build updated authoritative GameSnapshot
  v_snapshot := public.get_game_snapshot();

  -- 23. Construct authoritative MutationResult
  v_result := pg_catalog.jsonb_build_object(
    'revision', v_profile.revision + 1,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 24. Store mutation receipt for idempotency
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event,
    created_at
  ) VALUES (
    v_user_id,
    p_request_id,
    'completeQuest',
    v_payload_hash,
    v_result,
    pg_catalog.now()
  );

  RETURN v_result;
END;
$function$

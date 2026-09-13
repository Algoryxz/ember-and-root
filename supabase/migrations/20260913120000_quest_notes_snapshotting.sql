-- Migration: 20260913120000_quest_notes_snapshotting.sql
-- Description: Authoritative snapshotting of quest notes during completion
-- Invariants:
--   1. Writes v_quest.notes to quest_completions.quest_notes_snapshot atomically in complete_quest.
--   2. Includes questNotesSnapshot in returned MutationEvent.
--   3. Guarantees historical note snapshot immutability even if the parent quest's notes are edited or deleted later.

CREATE OR REPLACE FUNCTION public.complete_quest(
  p_request_id uuid,
  p_quest_id uuid,
  p_expected_occurrence text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_canonical_payload jsonb;
  v_payload_hash text;
  v_profile record;
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
  WHERE quest_id = p_quest_id AND occurrence_key = v_occurrence_key;

  IF FOUND THEN
    RAISE EXCEPTION 'Quest % already completed for occurrence %', p_quest_id, v_occurrence_key USING ERRCODE = 'P0007';
  END IF;

  -- 9. Determine base XP by effort tier
  IF v_quest.effort = 'quick' THEN
    v_base_xp := 10;
  ELSIF v_quest.effort = 'standard' THEN
    v_base_xp := 20;
  ELSIF v_quest.effort = 'deep' THEN
    v_base_xp := 35;
  ELSE
    v_base_xp := 20;
  END IF;

  -- 10. Query today's awarded XP for cap enforcement (140 XP daily cap)
  SELECT COALESCE(pg_catalog.sum(xp_awarded), 0)
  INTO v_daily_xp_awarded
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  -- 11. Calculate awarded XP respecting daily cap
  v_awarded_xp := LEAST(v_base_xp, GREATEST(0, 140 - v_daily_xp_awarded));
  IF v_daily_xp_awarded >= 140 OR v_awarded_xp < v_base_xp THEN
    v_capped_today := true;
  END IF;

  -- 12. Calculate Sparks from awarded XP (integer division)
  v_sparks_awarded := v_awarded_xp / 5;

  -- 13. Insert immutable completion snapshot (including current quest.notes)
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
    trial_evidence,
    quest_notes_snapshot
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
    '{}'::jsonb,
    v_quest.notes
  );

  -- 14. Update total XP and Level
  v_prev_level := public.level_from_total_xp(v_profile.total_xp);
  v_new_total_xp := v_profile.total_xp + v_awarded_xp;
  v_new_level := public.level_from_total_xp(v_new_total_xp);
  v_new_sparks := v_profile.sparks_balance + v_sparks_awarded;

  -- 15. Update branch XP for the quest's attribute
  INSERT INTO public.branches (
    user_id,
    attribute,
    xp,
    selected_specialization,
    selected_at
  ) VALUES (
    v_user_id,
    v_quest.attribute,
    v_awarded_xp,
    NULL,
    NULL
  )
  ON CONFLICT (user_id, attribute)
  DO UPDATE SET
    xp = public.branches.xp + EXCLUDED.xp
  RETURNING xp, selected_specialization INTO v_new_branch_xp, v_branch_spec;

  -- 16. Record milestone reflection trial evidence if active
  IF v_quest.trial_id IS NOT NULL THEN
    UPDATE public.trials
    SET evidence = pg_catalog.jsonb_set(
      COALESCE(evidence, '{}'::jsonb),
      '{completion_id}',
      pg_catalog.to_jsonb(v_completion_id::text)
    )
    WHERE id = v_quest.trial_id
      AND user_id = v_user_id
      AND completed_at IS NULL;
  END IF;

  -- 17. Update streak rules
  IF v_profile.last_activity_date IS NULL THEN
    v_new_streak := 1;
    v_ember_relit := false;
  ELSIF v_current_local_date = v_profile.last_activity_date THEN
    v_new_streak := v_profile.current_streak;
    v_ember_relit := false;
  ELSIF v_current_local_date = (v_profile.last_activity_date + 1) THEN
    v_new_streak := v_profile.current_streak + 1;
    v_ember_relit := false;
  ELSE
    -- Gap >= 1 missed day
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

  -- 21. Build MutationEvent with questNotesSnapshot
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
    'emberState', v_ember_state,
    'questNotesSnapshot', v_quest.notes
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
$$;

REVOKE ALL ON FUNCTION public.complete_quest(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest(uuid, uuid, text) TO authenticated;

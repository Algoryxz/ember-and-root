-- =============================================================================
-- Migration: 20260914030000_canonical_quest_sealing.sql
-- Description: Production-authoritative, idempotent consolidation of quest sealing
--              and snapshot RPC dependencies:
--              1. public.base_xp_from_effort(text) with case-insensitive mapping
--              2. public.level_from_total_xp(integer) canonical boundaries
--              3. public.level_from_xp(integer) alias function
--              4. public.ember_state_from_count(integer)
--              5. public.get_game_snapshot() with level resolution fallback
--              6. public.complete_quest(uuid, uuid, text) with in-procedure
--                 defensive exception handling across all helper calls
-- =============================================================================

-- 1. Helper: base_xp_from_effort
CREATE OR REPLACE FUNCTION public.base_xp_from_effort(p_effort text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
AS $$
  SELECT CASE LOWER(TRIM(COALESCE(p_effort, '')))
    WHEN 'quick' THEN 10
    WHEN 'standard' THEN 20
    WHEN 'deep' THEN 35
    ELSE 0
  END;
$$;

COMMENT ON FUNCTION public.base_xp_from_effort(text) IS
  'Authoritative base XP award by effort tier (quick -> 10, standard -> 20, deep -> 35).';

REVOKE ALL ON FUNCTION public.base_xp_from_effort(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.base_xp_from_effort(text) TO authenticated, anon, service_role;

-- 2. Helper: level_from_total_xp
CREATE OR REPLACE FUNCTION public.level_from_total_xp(p_total_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN p_total_xp >= 1600 THEN 10
    WHEN p_total_xp >= 1300 THEN 9
    WHEN p_total_xp >= 1050 THEN 8
    WHEN p_total_xp >= 820 THEN 7
    WHEN p_total_xp >= 620 THEN 6
    WHEN p_total_xp >= 450 THEN 5
    WHEN p_total_xp >= 300 THEN 4
    WHEN p_total_xp >= 180 THEN 3
    WHEN p_total_xp >= 80 THEN 2
    ELSE 1
  END;
$$;

COMMENT ON FUNCTION public.level_from_total_xp(integer) IS
  'Authoritative character level from cumulative total XP according to game progression design.';

REVOKE ALL ON FUNCTION public.level_from_total_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.level_from_total_xp(integer) TO authenticated, anon, service_role;

-- 3. Helper: level_from_xp (alias delegating to level_from_total_xp)
CREATE OR REPLACE FUNCTION public.level_from_xp(p_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
AS $$
  SELECT public.level_from_total_xp(p_xp);
$$;

COMMENT ON FUNCTION public.level_from_xp(integer) IS
  'Canonical alias for level_from_total_xp(integer) ensuring RPC compatibility across all snapshot and progression callers.';

REVOKE ALL ON FUNCTION public.level_from_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.level_from_xp(integer) TO authenticated, anon, service_role;

-- 4. Helper: ember_state_from_count
CREATE OR REPLACE FUNCTION public.ember_state_from_count(p_count integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN p_count >= 2 THEN 'blazing'
    WHEN p_count = 1 THEN 'kindled'
    ELSE 'resting'
  END;
$$;

REVOKE ALL ON FUNCTION public.ember_state_from_count(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ember_state_from_count(integer) TO authenticated, anon, service_role;

-- 5. Public RPC: get_game_snapshot()
CREATE OR REPLACE FUNCTION public.get_game_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_today_xp integer;
  v_today_completions integer;
  v_ember_state text;
  v_display_streak integer;
  v_level integer;
  v_current_local_date date;
  v_timezone text;
  v_branches jsonb;
  v_quests jsonb;
  v_trials jsonb;
  v_inventory jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for authenticated user' USING ERRCODE = 'P0002';
  END IF;

  v_timezone := COALESCE(v_profile.timezone, 'UTC');
  BEGIN
    v_current_local_date := (pg_catalog.now() AT TIME ZONE v_timezone)::date;
  EXCEPTION WHEN OTHERS THEN
    v_timezone := 'UTC';
    v_current_local_date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  END;

  SELECT COALESCE(pg_catalog.sum(xp_awarded), 0)
  INTO v_today_xp
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  SELECT pg_catalog.count(*)
  INTO v_today_completions
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_ember_state := public.ember_state_from_count(v_today_completions);

  IF v_profile.last_activity_date IS NULL OR v_profile.last_activity_date < (v_current_local_date - 1) THEN
    v_display_streak := 0;
  ELSE
    v_display_streak := v_profile.current_streak;
  END IF;

  -- Derive level with fallback to level_from_total_xp
  BEGIN
    v_level := public.level_from_xp(v_profile.total_xp);
  EXCEPTION WHEN undefined_function OR OTHERS THEN
    BEGIN
      v_level := public.level_from_total_xp(v_profile.total_xp);
    EXCEPTION WHEN OTHERS THEN
      v_level := 1;
    END;
  END;

  SELECT COALESCE(
    pg_catalog.jsonb_object_agg(
      attribute,
      pg_catalog.jsonb_build_object(
        'attribute', attribute,
        'xp', xp,
        'specialization', selected_specialization,
        'selectedAt', CASE WHEN selected_at IS NOT NULL THEN pg_catalog.to_char(selected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'sproutAvailable', xp > 0,
        'specializationAvailable', xp >= 80 AND selected_specialization IS NULL,
        'crestAvailable', xp >= 160 AND EXISTS (
          SELECT 1 FROM public.trials t
          WHERE t.user_id = v_user_id
            AND t.attribute = b.attribute
            AND t.completed_at IS NOT NULL
            AND t.crest_claimed_at IS NULL
        ),
        'crestClaimed', EXISTS (
          SELECT 1 FROM public.trials t
          WHERE t.user_id = v_user_id
            AND t.attribute = b.attribute
            AND t.crest_claimed_at IS NOT NULL
        ),
        'trialStarted', EXISTS (
          SELECT 1 FROM public.trials t
          WHERE t.user_id = v_user_id
            AND t.attribute = b.attribute
            AND t.started_at IS NOT NULL
        ),
        'trialComplete', EXISTS (
          SELECT 1 FROM public.trials t
          WHERE t.user_id = v_user_id
            AND t.attribute = b.attribute
            AND t.completed_at IS NOT NULL
        )
      )
    ),
    '{}'::jsonb
  )
  INTO v_branches
  FROM public.branches b
  WHERE user_id = v_user_id;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', q.id,
        'userId', q.user_id,
        'title', q.title,
        'attribute', q.attribute,
        'effort', q.effort,
        'cadence', q.cadence,
        'trialId', q.trial_id,
        'version', q.version,
        'notes', q.notes,
        'createdAt', pg_catalog.to_char(q.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'updatedAt', pg_catalog.to_char(q.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'deletedAt', CASE WHEN q.deleted_at IS NOT NULL THEN pg_catalog.to_char(q.deleted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'currentOccurrenceKey', CASE WHEN q.cadence = 'daily' THEN pg_catalog.to_char(v_current_local_date, 'YYYY-MM-DD') ELSE 'once' END,
        'completedForCurrentOccurrence', EXISTS (
          SELECT 1 FROM public.quest_completions qc
          WHERE qc.quest_id = q.id
            AND qc.occurrence_key = CASE WHEN q.cadence = 'daily' THEN pg_catalog.to_char(v_current_local_date, 'YYYY-MM-DD') ELSE 'once' END
        )
      )
      ORDER BY q.created_at ASC
    ),
    '[]'::jsonb
  )
  INTO v_quests
  FROM public.quests q
  WHERE q.user_id = v_user_id AND q.deleted_at IS NULL;

  SELECT COALESCE(
    pg_catalog.jsonb_object_agg(
      t.attribute,
      pg_catalog.jsonb_build_object(
        'id', t.id,
        'userId', t.user_id,
        'attribute', t.attribute,
        'trialType', t.trial_type,
        'specialization', t.specialization,
        'startedAt', pg_catalog.to_char(t.started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'completedAt', CASE WHEN t.completed_at IS NOT NULL THEN pg_catalog.to_char(t.completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'crestClaimedAt', CASE WHEN t.crest_claimed_at IS NOT NULL THEN pg_catalog.to_char(t.crest_claimed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'requiredDays', t.required_days,
        'distinctDaysCount', t.distinct_days_count,
        'reflectionNotes', t.reflection_notes,
        'lastProgressDate', CASE WHEN t.last_progress_date IS NOT NULL THEN pg_catalog.to_char(t.last_progress_date, 'YYYY-MM-DD') ELSE NULL END
      )
    ),
    '{}'::jsonb
  )
  INTO v_trials
  FROM public.trials t
  WHERE t.user_id = v_user_id;

  SELECT pg_catalog.jsonb_build_object(
    'items', COALESCE(
      pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'itemId', inv.item_id,
          'name', itm.name,
          'slot', itm.slot,
          'sparkCost', itm.spark_cost,
          'acquiredAt', pg_catalog.to_char(inv.acquired_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        )
      ) FILTER (WHERE inv.item_id IS NOT NULL),
      '[]'::jsonb
    )
  )
  INTO v_inventory
  FROM public.inventory inv
  LEFT JOIN public.items itm ON itm.id = inv.item_id
  WHERE inv.user_id = v_user_id;

  RETURN pg_catalog.jsonb_build_object(
    'userId', v_profile.user_id,
    'totalXp', v_profile.total_xp,
    'sparksBalance', v_profile.sparks_balance,
    'currentStreak', v_display_streak,
    'longestStreak', v_profile.longest_streak,
    'level', v_level,
    'emberState', v_ember_state,
    'todayXpAwarded', v_today_xp,
    'equippedItemId', v_profile.equipped_item_id,
    'revision', v_profile.revision,
    'branches', v_branches,
    'quests', v_quests,
    'trials', v_trials,
    'inventory', v_inventory
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_game_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_snapshot() TO authenticated;

-- 6. Public RPC: complete_quest(uuid, uuid, text)
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

  -- 9. Determine base XP by effort (authoritative canonical mapping with defensive in-procedure fallback)
  BEGIN
    v_base_xp := public.base_xp_from_effort(v_quest.effort);
  EXCEPTION WHEN undefined_function OR OTHERS THEN
    CASE LOWER(TRIM(COALESCE(v_quest.effort, '')))
      WHEN 'quick' THEN v_base_xp := 10;
      WHEN 'standard' THEN v_base_xp := 20;
      WHEN 'deep' THEN v_base_xp := 35;
      ELSE v_base_xp := 0;
    END CASE;
  END;

  -- 10. Enforce daily 140 XP cap
  SELECT COALESCE(pg_catalog.sum(xp_awarded), 0)
  INTO v_daily_xp_awarded
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_awarded_xp := pg_catalog.least(v_base_xp, pg_catalog.greatest(0, 140 - v_daily_xp_awarded));
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

  -- 13. Derive level transition (with defensive fallback to level_from_total_xp)
  BEGIN
    v_prev_level := public.level_from_xp(v_profile.total_xp);
  EXCEPTION WHEN undefined_function OR OTHERS THEN
    BEGIN
      v_prev_level := public.level_from_total_xp(v_profile.total_xp);
    EXCEPTION WHEN OTHERS THEN
      v_prev_level := 1;
    END;
  END;
  v_new_total_xp := v_profile.total_xp + v_awarded_xp;
  BEGIN
    v_new_level := public.level_from_xp(v_new_total_xp);
  EXCEPTION WHEN undefined_function OR OTHERS THEN
    BEGIN
      v_new_level := public.level_from_total_xp(v_new_total_xp);
    EXCEPTION WHEN OTHERS THEN
      v_new_level := 1;
    END;
  END;

  -- 14. Calculate sparks
  v_new_sparks := v_profile.sparks_balance + v_sparks_awarded;

  -- 15. Record currency transaction if sparks > 0
  IF v_sparks_awarded > 0 THEN
    INSERT INTO public.currency_ledger (
      user_id,
      amount,
      balance_after,
      transaction_type,
      reference_id,
      created_at
    ) VALUES (
      v_user_id,
      v_sparks_awarded,
      v_new_sparks,
      'quest_completion',
      v_completion_id,
      pg_catalog.now()
    );
  END IF;

  -- 16. Update attribute branch XP
  UPDATE public.branches
  SET xp = xp + v_awarded_xp
  WHERE user_id = v_user_id AND attribute = v_quest.attribute
  RETURNING xp, selected_specialization INTO v_new_branch_xp, v_branch_spec;

  -- 17. Evaluate specialization & crest eligibility
  IF v_new_branch_xp >= 80 AND v_branch_spec IS NULL THEN
    v_spec_available := true;
  END IF;

  IF v_new_branch_xp >= 160 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.trials
      WHERE user_id = v_user_id
        AND attribute = v_quest.attribute
        AND completed_at IS NOT NULL
        AND crest_claimed_at IS NULL
    ) INTO v_crest_available;
  END IF;

  -- 18. Streak & Ember state calculation
  IF v_profile.last_activity_date IS NULL THEN
    v_new_streak := 1;
  ELSIF v_profile.last_activity_date = v_current_local_date THEN
    v_new_streak := v_profile.current_streak;
  ELSIF v_profile.last_activity_date = (v_current_local_date - 1) THEN
    v_new_streak := v_profile.current_streak + 1;
  ELSE
    -- Check Ember Ward protection
    IF v_profile.ward_active THEN
      v_new_streak := v_profile.current_streak + 1;
      v_ward_consumed := true;
    ELSE
      v_new_streak := 1;
      v_ember_relit := true;
    END IF;
  END IF;

  v_longest_streak := pg_catalog.greatest(v_profile.longest_streak, v_new_streak);

  -- 19. Ember state from today's completions
  SELECT pg_catalog.count(*) INTO v_today_completions
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_ember_state := public.ember_state_from_count(v_today_completions);

  -- 20. Update profile
  UPDATE public.profiles
  SET
    total_xp = v_new_total_xp,
    sparks_balance = v_new_sparks,
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_current_local_date,
    ward_active = CASE WHEN v_ward_consumed THEN false ELSE ward_active END,
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
$$;

REVOKE ALL ON FUNCTION public.complete_quest(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest(uuid, uuid, text) TO authenticated;

-- Notify PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- Migration 003: Progression Functions & Atomic complete_quest RPC
-- Ember & Root — Core Workstream
-- ==============================================================================

-- 1. Helper: Level from total XP
-- Level 1: 0 - 99 XP
-- Level 2: 100 - 249 XP
-- Level 3: 250 - 449 XP
-- Level 4: 450 - 699 XP
-- Formula for cumulative XP to reach level L: 25 * (L - 1) * (L + 2)
CREATE OR REPLACE FUNCTION public.level_from_total_xp(p_total_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_lvl integer := 1;
BEGIN
  IF p_total_xp <= 0 THEN
    RETURN 1;
  END IF;

  -- Threshold to reach (v_lvl + 1) is: 25 * (v_lvl) * (v_lvl + 3)
  WHILE p_total_xp >= (25 * v_lvl * (v_lvl + 3)) LOOP
    v_lvl := v_lvl + 1;
  END LOOP;

  RETURN v_lvl;
END;
$$;

-- 2. Helper: Ember state from today's quest completion count
CREATE OR REPLACE FUNCTION public.ember_state_from_count(p_count integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_count <= 0 THEN
    RETURN 'resting';
  ELSIF p_count = 1 THEN
    RETURN 'kindled';
  ELSIF p_count = 2 THEN
    RETURN 'steady';
  ELSE
    RETURN 'bright';
  END IF;
END;
$$;

-- 3. Helper: Authoritative GameSnapshot builder
CREATE OR REPLACE FUNCTION public.get_game_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_profile record;
  v_current_local_date date;
  v_display_streak integer;
  v_today_xp integer;
  v_today_completions integer;
  v_ember_state text;
  v_level integer;
  v_branches jsonb;
  v_trials jsonb := '{}'::jsonb;
  v_equipped_item_id text := NULL;
  v_inventory_items jsonb := '[]'::jsonb;
  v_quests jsonb := '[]'::jsonb;
  v_snapshot jsonb;
BEGIN
  -- 1. Load profile
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2. Compute local date in user's timezone
  BEGIN
    v_current_local_date := (now() AT TIME ZONE COALESCE(v_profile.timezone, 'UTC'))::date;
  EXCEPTION WHEN OTHERS THEN
    v_current_local_date := (now() AT TIME ZONE 'UTC')::date;
  END;

  -- 3. Derived current streak
  -- If last activity is older than yesterday in the saved local timezone, derive current streak as 0
  IF v_profile.last_activity_date IS NULL OR v_profile.last_activity_date < (v_current_local_date - 1) THEN
    v_display_streak := 0;
  ELSE
    v_display_streak := v_profile.current_streak;
  END IF;

  -- 4. Today's stats
  SELECT
    COALESCE(SUM(xp_awarded), 0),
    COUNT(*)
  INTO
    v_today_xp,
    v_today_completions
  FROM public.quest_completions
  WHERE user_id = p_user_id AND local_date = v_current_local_date;

  v_ember_state := public.ember_state_from_count(v_today_completions);
  v_level := public.level_from_total_xp(v_profile.total_xp);

  -- 5. Branches
  WITH attr_branches AS (
    SELECT
      a.attr AS attribute,
      COALESCE(b.xp, 0) AS xp,
      b.selected_specialization AS specialization,
      b.selected_at AS selected_at,
      (COALESCE(b.xp, 0) > 0) AS sprout_available,
      (COALESCE(b.xp, 0) >= 80 AND b.selected_specialization IS NULL) AS specialization_available,
      (COALESCE(b.xp, 0) >= 160 AND t.claimed_at IS NOT NULL) AS crest_available,
      (t.id IS NOT NULL) AS trial_started,
      (t.claimed_at IS NOT NULL) AS trial_complete,
      (t.claimed_at IS NOT NULL) AS crest_claimed
    FROM (VALUES ('mind'), ('body'), ('will'), ('craft')) AS a(attr)
    LEFT JOIN public.branches b ON b.user_id = p_user_id AND b.attribute = a.attr
    LEFT JOIN public.trials t ON t.user_id = p_user_id AND t.attribute = a.attr
  )
  SELECT jsonb_object_agg(
    attribute,
    jsonb_build_object(
      'attribute', attribute,
      'xp', xp,
      'specialization', specialization,
      'selectedAt', CASE WHEN selected_at IS NOT NULL THEN to_char(selected_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
      'sproutAvailable', sprout_available,
      'specializationAvailable', specialization_available,
      'crestAvailable', crest_available,
      'trialStarted', trial_started,
      'trialComplete', trial_complete,
      'crestClaimed', crest_claimed
    )
  ) INTO v_branches FROM attr_branches;

  -- 6. Trials
  SELECT COALESCE(
    jsonb_object_agg(
      attribute,
      jsonb_build_object(
        'id', id,
        'attribute', attribute,
        'specialization', specialization,
        'kind', kind,
        'startedAt', to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'claimedAt', CASE WHEN claimed_at IS NOT NULL THEN to_char(claimed_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'doneCondition', done_condition
      )
    ),
    '{}'::jsonb
  ) INTO v_trials
  FROM public.trials
  WHERE user_id = p_user_id;

  -- 7. Inventory and equipped item
  SELECT item_id INTO v_equipped_item_id
  FROM public.inventory
  WHERE user_id = p_user_id AND equipped = true
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'item', jsonb_build_object(
          'id', i.id,
          'name', itm.name,
          'price', itm.price,
          'visualKey', itm.visual_key
        ),
        'acquiredAt', to_char(i.acquired_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'equipped', i.equipped
      )
    ),
    '[]'::jsonb
  ) INTO v_inventory_items
  FROM public.inventory i
  JOIN public.items itm ON itm.id = i.item_id
  WHERE i.user_id = p_user_id;

  -- 8. Quests
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'userId', q.user_id,
        'title', q.title,
        'attribute', q.attribute,
        'effort', q.effort,
        'cadence', q.cadence,
        'trialId', q.trial_id,
        'version', q.version,
        'deletedAt', CASE WHEN q.deleted_at IS NOT NULL THEN to_char(q.deleted_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'createdAt', to_char(q.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'updatedAt', to_char(q.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ) ORDER BY q.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_quests
  FROM public.quests q
  WHERE q.user_id = p_user_id AND q.deleted_at IS NULL;

  -- Construct final snapshot
  v_snapshot := jsonb_build_object(
    'revision', v_profile.revision,
    'userId', v_profile.user_id,
    'totalXp', v_profile.total_xp,
    'level', v_level,
    'sparksBalance', v_profile.sparks_balance,
    'currentStreak', v_display_streak,
    'longestStreak', v_profile.longest_streak,
    'emberState', v_ember_state,
    'todayXpAwarded', v_today_xp,
    'branches', v_branches,
    'trials', v_trials,
    'equippedItemId', v_equipped_item_id,
    'inventory', jsonb_build_object('items', v_inventory_items),
    'quests', v_quests
  );

  RETURN v_snapshot;
END;
$$;

-- 4. Atomic complete_quest RPC
CREATE OR REPLACE FUNCTION public.complete_quest(
  p_request_id uuid,
  p_quest_id uuid,
  p_payload_hash text DEFAULT '',
  p_expected_occurrence text DEFAULT NULL,
  p_trial_evidence jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
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

  -- Temporarily allow internal progression updates within this transaction
  PERFORM set_config('ember.in_rpc', 'true', true);

  -- 2. Lock the user's profile row
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for authenticated user' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Check mutation receipt for idempotency
  SELECT * INTO v_receipt
  FROM public.mutation_receipts
  WHERE user_id = v_user_id AND request_id = p_request_id;

  IF FOUND THEN
    IF v_receipt.payload_hash = p_payload_hash OR p_payload_hash = '' THEN
      -- Safe replay: return prior result event and current snapshot
      RETURN v_receipt.result_event;
    ELSE
      RAISE EXCEPTION 'Idempotency conflict: requestId % was already used with a different payload', p_request_id USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- 4. Load owned active quest
  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest % not found or not owned by caller', p_quest_id USING ERRCODE = 'P0004';
  END IF;

  IF v_quest.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot complete deleted quest %', p_quest_id USING ERRCODE = 'P0005';
  END IF;

  -- 5. Derive current local date in user's saved IANA timezone
  v_timezone := COALESCE(v_profile.timezone, 'UTC');
  BEGIN
    v_current_local_date := (now() AT TIME ZONE v_timezone)::date;
  EXCEPTION WHEN OTHERS THEN
    v_timezone := 'UTC';
    v_current_local_date := (now() AT TIME ZONE 'UTC')::date;
  END;

  -- 6. Resolve valid occurrence key
  IF v_quest.cadence = 'once' THEN
    v_occurrence_key := 'once';
  ELSIF v_quest.cadence = 'daily' THEN
    v_occurrence_key := to_char(v_current_local_date, 'YYYY-MM-DD');
  ELSE
    v_occurrence_key := 'once';
  END IF;

  IF p_expected_occurrence IS NOT NULL AND p_expected_occurrence != '' AND p_expected_occurrence != v_occurrence_key THEN
    RAISE EXCEPTION 'Occurrence mismatch: expected %, derived %', p_expected_occurrence, v_occurrence_key USING ERRCODE = 'P0006';
  END IF;

  -- 7. Reject already completed occurrence
  SELECT id INTO v_existing_comp
  FROM public.quest_completions
  WHERE quest_id = p_quest_id AND occurrence_key = v_occurrence_key;

  IF FOUND THEN
    RAISE EXCEPTION 'Quest % already completed for occurrence %', p_quest_id, v_occurrence_key USING ERRCODE = 'P0007';
  END IF;

  -- 8. Derive base XP from effort
  CASE v_quest.effort
    WHEN 'quick' THEN v_base_xp := 10;
    WHEN 'standard' THEN v_base_xp := 20;
    WHEN 'deep' THEN v_base_xp := 35;
    ELSE v_base_xp := 0;
  END CASE;

  -- 9. Calculate XP already awarded today
  SELECT COALESCE(SUM(xp_awarded), 0)
  INTO v_daily_xp_awarded
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  -- 10. Enforce remaining 140 XP daily reward ceiling
  v_awarded_xp := LEAST(v_base_xp, GREATEST(0, 140 - v_daily_xp_awarded));
  IF v_daily_xp_awarded >= 140 OR v_awarded_xp < v_base_xp THEN
    v_capped_today := true;
  END IF;

  -- 11. Calculate Sparks from awarded XP (integer division only)
  v_sparks_awarded := v_awarded_xp / 5;

  -- 12. Insert immutable completion snapshot
  v_completion_id := gen_random_uuid();
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
    now(),
    v_current_local_date,
    v_quest.title,
    v_quest.attribute,
    v_quest.effort,
    v_awarded_xp,
    v_sparks_awarded,
    COALESCE(p_trial_evidence, '{}'::jsonb)
  );

  -- 13. Progression levels
  v_prev_level := public.level_from_total_xp(v_profile.total_xp);
  v_new_total_xp := v_profile.total_xp + v_awarded_xp;
  v_new_level := public.level_from_total_xp(v_new_total_xp);
  v_new_sparks := v_profile.sparks_balance + v_sparks_awarded;

  -- 14. Increment correct branch XP
  INSERT INTO public.branches (user_id, attribute, xp)
  VALUES (v_user_id, v_quest.attribute, v_awarded_xp)
  ON CONFLICT (user_id, attribute) DO UPDATE
    SET xp = public.branches.xp + v_awarded_xp
  RETURNING xp, selected_specialization INTO v_new_branch_xp, v_branch_spec;

  -- 15. Insert currency ledger credit if Sparks > 0
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
      now()
    );
  END IF;

  -- 16. Update streak rules
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

  -- 17. Check branch specialization & crest availability
  IF v_new_branch_xp >= 80 AND v_branch_spec IS NULL THEN
    v_spec_available := true;
  END IF;

  IF v_new_branch_xp >= 160 THEN
    SELECT (claimed_at IS NOT NULL) INTO v_crest_available
    FROM public.trials
    WHERE user_id = v_user_id AND attribute = v_quest.attribute;
    v_crest_available := COALESCE(v_crest_available, false);
  END IF;

  -- 18. Determine new Ember state
  SELECT COUNT(*)
  INTO v_today_completions
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_ember_state := public.ember_state_from_count(v_today_completions);

  -- 19. Update profile row
  UPDATE public.profiles SET
    total_xp = v_new_total_xp,
    sparks_balance = v_new_sparks,
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    last_activity_date = v_current_local_date,
    revision = v_profile.revision + 1,
    updated_at = now()
  WHERE user_id = v_user_id;

  -- 20. Build MutationEvent
  v_event := jsonb_build_object(
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
    'emberState', v_ember_state
  );

  -- 21. Build updated GameSnapshot
  v_snapshot := public.get_game_snapshot(v_user_id);

  -- 22. Construct authoritative MutationResult
  v_result := jsonb_build_object(
    'revision', v_profile.revision + 1,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 23. Store mutation receipt for idempotency
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
    COALESCE(p_payload_hash, ''),
    v_result,
    now()
  );

  -- 24. Return result (Transaction commits on RPC completion)
  RETURN v_result;
END;
$$;

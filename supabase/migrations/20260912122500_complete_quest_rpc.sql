-- ==============================================================================
-- Migration 003: Hardened Progression Functions & complete_quest RPC
-- Ember & Root — Core Workstream
--
-- Security:
--   - All functions declare SET search_path = ''
--   - All table and function references are fully qualified
--   - caller identity derived exclusively from auth.uid()
--   - EXECUTE revoked from PUBLIC, granted only to authenticated role
--   - Idempotency hash computed deterministically from canonical inputs
--   - Timestamps normalized to UTC before ISO-8601 serialization
-- ==============================================================================

-- 1. Helper: Level from total XP
CREATE OR REPLACE FUNCTION public.level_from_total_xp(p_total_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v_lvl integer := 1;
BEGIN
  IF p_total_xp <= 0 THEN
    RETURN 1;
  END IF;

  -- Threshold to reach level (v_lvl + 1) is: 25 * v_lvl * (v_lvl + 3)
  WHILE p_total_xp >= (25 * v_lvl * (v_lvl + 3)) LOOP
    v_lvl := v_lvl + 1;
  END LOOP;

  RETURN v_lvl;
END;
$$;

REVOKE ALL ON FUNCTION public.level_from_total_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.level_from_total_xp(integer) TO authenticated;

-- 2. Helper: Ember state from today's quest completion count
CREATE OR REPLACE FUNCTION public.ember_state_from_count(p_count integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
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

REVOKE ALL ON FUNCTION public.ember_state_from_count(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ember_state_from_count(integer) TO authenticated;

-- 3. Public RPC: Authoritative GameSnapshot builder
-- Derives identity solely from auth.uid() — does NOT accept arbitrary user_id
CREATE OR REPLACE FUNCTION public.get_game_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
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
  -- 1. Derive caller from auth.uid()
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Load profile
  SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 3. Compute local date in user's saved IANA timezone
  BEGIN
    v_current_local_date := (pg_catalog.now() AT TIME ZONE pg_catalog.coalesce(v_profile.timezone, 'UTC'))::date;
  EXCEPTION WHEN OTHERS THEN
    v_current_local_date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  END;

  -- 4. Derived current streak
  -- If last activity is older than yesterday in saved local timezone, display streak as 0
  IF v_profile.last_activity_date IS NULL OR v_profile.last_activity_date < (v_current_local_date - 1) THEN
    v_display_streak := 0;
  ELSE
    v_display_streak := v_profile.current_streak;
  END IF;

  -- 5. Today's stats
  SELECT
    pg_catalog.coalesce(pg_catalog.sum(xp_awarded), 0),
    pg_catalog.count(*)
  INTO
    v_today_xp,
    v_today_completions
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_ember_state := public.ember_state_from_count(v_today_completions);
  v_level := public.level_from_total_xp(v_profile.total_xp);

  -- 6. Branches
  WITH attr_branches AS (
    SELECT
      a.attr AS attribute,
      pg_catalog.coalesce(b.xp, 0) AS xp,
      b.selected_specialization AS specialization,
      b.selected_at AS selected_at,
      (pg_catalog.coalesce(b.xp, 0) > 0) AS sprout_available,
      (pg_catalog.coalesce(b.xp, 0) >= 80 AND b.selected_specialization IS NULL) AS specialization_available,
      (pg_catalog.coalesce(b.xp, 0) >= 160 AND t.completed_at IS NOT NULL AND t.claimed_at IS NULL) AS crest_available,
      (t.id IS NOT NULL) AS trial_started,
      (t.completed_at IS NOT NULL) AS trial_complete,
      (t.claimed_at IS NOT NULL) AS crest_claimed
    FROM (VALUES ('mind'), ('body'), ('will'), ('craft')) AS a(attr)
    LEFT JOIN public.branches b ON b.user_id = v_user_id AND b.attribute = a.attr
    LEFT JOIN public.trials t ON t.user_id = v_user_id AND t.attribute = a.attr
  )
  SELECT pg_catalog.jsonb_object_agg(
    attribute,
    pg_catalog.jsonb_build_object(
      'attribute', attribute,
      'xp', xp,
      'specialization', specialization,
      'selectedAt', CASE WHEN selected_at IS NOT NULL THEN pg_catalog.to_char(selected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
      'sproutAvailable', sprout_available,
      'specializationAvailable', specialization_available,
      'crestAvailable', crest_available,
      'trialStarted', trial_started,
      'trialComplete', trial_complete,
      'crestClaimed', crest_claimed
    )
  ) INTO v_branches FROM attr_branches;

  -- 7. Trials
  SELECT pg_catalog.coalesce(
    pg_catalog.jsonb_object_agg(
      attribute,
      pg_catalog.jsonb_build_object(
        'id', id,
        'attribute', attribute,
        'specialization', specialization,
        'kind', kind,
        'startedAt', pg_catalog.to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'requiredDays', required_days,
        'distinctDaysCompleted', distinct_days_completed,
        'milestoneText', milestone_text,
        'completedAt', CASE WHEN completed_at IS NOT NULL THEN pg_catalog.to_char(completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'claimedAt', CASE WHEN claimed_at IS NOT NULL THEN pg_catalog.to_char(claimed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END
      )
    ),
    '{}'::jsonb
  ) INTO v_trials
  FROM public.trials
  WHERE user_id = v_user_id;

  -- 8. Inventory and equipped item
  SELECT item_id INTO v_equipped_item_id
  FROM public.inventory
  WHERE user_id = v_user_id AND equipped = true
  LIMIT 1;

  SELECT pg_catalog.coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'item', pg_catalog.jsonb_build_object(
          'id', i.id,
          'name', itm.name,
          'price', itm.price,
          'visualKey', itm.visual_key
        ),
        'acquiredAt', pg_catalog.to_char(i.acquired_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'equipped', i.equipped
      )
    ),
    '[]'::jsonb
  ) INTO v_inventory_items
  FROM public.inventory i
  JOIN public.items itm ON itm.id = i.item_id
  WHERE i.user_id = v_user_id;

  -- 9. Quests
  SELECT pg_catalog.coalesce(
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
        'deletedAt', CASE WHEN q.deleted_at IS NOT NULL THEN pg_catalog.to_char(q.deleted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') ELSE NULL END,
        'createdAt', pg_catalog.to_char(q.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'updatedAt', pg_catalog.to_char(q.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ) ORDER BY q.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_quests
  FROM public.quests q
  WHERE q.user_id = v_user_id AND q.deleted_at IS NULL;

  -- 10. Assemble final snapshot
  v_snapshot := pg_catalog.jsonb_build_object(
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
    'inventory', pg_catalog.jsonb_build_object('items', v_inventory_items),
    'quests', v_quests
  );

  RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.get_game_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_snapshot() TO authenticated;

-- 4. Public RPC: Update Profile Preferences & Timezone
-- Replaces direct client UPDATE on profiles with a narrow, validated mutation
CREATE OR REPLACE FUNCTION public.update_profile_preferences(
  p_preferences jsonb DEFAULT NULL,
  p_timezone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_updated record;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_timezone IS NOT NULL THEN
    IF pg_catalog.char_length(pg_catalog.trim(p_timezone)) < 1 OR pg_catalog.char_length(p_timezone) > 64 THEN
      RAISE EXCEPTION 'Invalid timezone string' USING ERRCODE = 'P0008';
    END IF;
  END IF;

  UPDATE public.profiles SET
    preferences = pg_catalog.coalesce(p_preferences, preferences),
    timezone = pg_catalog.coalesce(p_timezone, timezone),
    updated_at = pg_catalog.now()
  WHERE user_id = v_user_id
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'userId', v_updated.user_id,
    'timezone', v_updated.timezone,
    'preferences', v_updated.preferences
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_profile_preferences(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_profile_preferences(jsonb, text) TO authenticated;

-- 5. Public RPC: Atomic complete_quest
CREATE OR REPLACE FUNCTION public.complete_quest(
  p_request_id uuid,
  p_quest_id uuid,
  p_expected_occurrence text DEFAULT NULL,
  p_trial_evidence jsonb DEFAULT '{}'::jsonb
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
    'expectedOccurrence', pg_catalog.coalesce(p_expected_occurrence, ''),
    'trialEvidence', pg_catalog.coalesce(p_trial_evidence, '{}'::jsonb)
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
  v_timezone := pg_catalog.coalesce(v_profile.timezone, 'UTC');
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

  -- 8. Reject already completed occurrence
  SELECT id INTO v_existing_comp
  FROM public.quest_completions
  WHERE quest_id = p_quest_id AND occurrence_key = v_occurrence_key;

  IF FOUND THEN
    RAISE EXCEPTION 'Quest % already completed for occurrence %', p_quest_id, v_occurrence_key USING ERRCODE = 'P0007';
  END IF;

  -- 9. Derive base XP from effort
  CASE v_quest.effort
    WHEN 'quick' THEN v_base_xp := 10;
    WHEN 'standard' THEN v_base_xp := 20;
    WHEN 'deep' THEN v_base_xp := 35;
    ELSE v_base_xp := 0;
  END CASE;

  -- 10. Calculate XP already awarded today
  SELECT pg_catalog.coalesce(pg_catalog.sum(xp_awarded), 0)
  INTO v_daily_xp_awarded
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  -- 11. Enforce remaining 140 XP daily reward ceiling
  v_awarded_xp := pg_catalog.least(v_base_xp, pg_catalog.greatest(0, 140 - v_daily_xp_awarded));
  IF v_daily_xp_awarded >= 140 OR v_awarded_xp < v_base_xp THEN
    v_capped_today := true;
  END IF;

  -- 12. Calculate Sparks from awarded XP (integer division)
  v_sparks_awarded := v_awarded_xp / 5;

  -- 13. Insert immutable completion snapshot
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
    pg_catalog.coalesce(p_trial_evidence, '{}'::jsonb)
  );

  -- 14. Compute level progression
  v_prev_level := public.level_from_total_xp(v_profile.total_xp);
  v_new_total_xp := v_profile.total_xp + v_awarded_xp;
  v_new_level := public.level_from_total_xp(v_new_total_xp);
  v_new_sparks := v_profile.sparks_balance + v_sparks_awarded;

  -- 15. Increment branch XP
  INSERT INTO public.branches (user_id, attribute, xp)
  VALUES (v_user_id, v_quest.attribute, v_awarded_xp)
  ON CONFLICT (user_id, attribute) DO UPDATE
    SET xp = public.branches.xp + v_awarded_xp
  RETURNING xp, selected_specialization INTO v_new_branch_xp, v_branch_spec;

  -- 16. Insert currency ledger credit if Sparks > 0
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
  v_longest_streak := pg_catalog.greatest(v_profile.longest_streak, v_new_streak);

  -- 18. Check specialization & crest availability
  IF v_new_branch_xp >= 80 AND v_branch_spec IS NULL THEN
    v_spec_available := true;
  END IF;

  -- Crest available requires: branch XP >= 160 AND completed_at IS NOT NULL AND claimed_at IS NULL
  IF v_new_branch_xp >= 160 THEN
    SELECT (completed_at IS NOT NULL AND claimed_at IS NULL) INTO v_crest_available
    FROM public.trials
    WHERE user_id = v_user_id AND attribute = v_quest.attribute;
    v_crest_available := pg_catalog.coalesce(v_crest_available, false);
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

REVOKE ALL ON FUNCTION public.complete_quest(uuid, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest(uuid, uuid, text, jsonb) TO authenticated;

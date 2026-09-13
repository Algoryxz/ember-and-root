-- =====================================================================
-- Migration: 20260913110000_quest_notes_and_calendar.sql
-- Description: Quest Notes & Path Calendar Extension:
--              1. Adds notes column to public.quests with length guard (<= 1000)
--              2. Adds quest_notes_snapshot to public.quest_completions
--              3. Creates update_quest_notes RPC
--              4. Updates get_game_snapshot to return quest notes
--              5. Creates get_calendar_month RPC for server-authoritative calendar data
-- =====================================================================

-- 1. Extend public.quests with notes
ALTER TABLE public.quests
  ADD COLUMN IF NOT EXISTS notes text NULL;

ALTER TABLE public.quests
  DROP CONSTRAINT IF EXISTS chk_quests_notes_len;

ALTER TABLE public.quests
  ADD CONSTRAINT chk_quests_notes_len
  CHECK (notes IS NULL OR pg_catalog.char_length(notes) <= 1000);

-- 2. Extend public.quest_completions with note snapshot
ALTER TABLE public.quest_completions
  ADD COLUMN IF NOT EXISTS quest_notes_snapshot text NULL;

-- 3. RPC: update_quest_notes
CREATE OR REPLACE FUNCTION public.update_quest_notes(
  p_quest_id uuid,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_cleaned_notes text;
  v_updated record;
BEGIN
  -- Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to update quest notes';
  END IF;

  IF p_quest_id IS NULL THEN
    RAISE EXCEPTION 'Quest ID is required';
  END IF;

  v_cleaned_notes := pg_catalog.btrim(p_notes);
  IF v_cleaned_notes IS NOT NULL AND pg_catalog.char_length(v_cleaned_notes) > 1000 THEN
    RAISE EXCEPTION 'Quest notes cannot exceed 1000 characters';
  END IF;

  IF v_cleaned_notes = '' THEN
    v_cleaned_notes := NULL;
  END IF;

  UPDATE public.quests
  SET
    notes = v_cleaned_notes,
    updated_at = pg_catalog.now()
  WHERE id = p_quest_id
    AND user_id = v_user_id
    AND deleted_at IS NULL
  RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest % not found or not owned by caller', p_quest_id;
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'id', v_updated.id,
    'notes', v_updated.notes,
    'updatedAt', pg_catalog.to_char(v_updated.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_quest_notes(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_quest_notes(uuid, text) TO authenticated;

-- 4. Update get_game_snapshot to output quest notes
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
    v_current_local_date := (pg_catalog.now() AT TIME ZONE COALESCE(v_profile.timezone, 'UTC'))::date;
  EXCEPTION WHEN OTHERS THEN
    v_current_local_date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  END;

  -- 4. Derived current streak
  IF v_profile.last_activity_date IS NULL OR v_profile.last_activity_date < (v_current_local_date - 1) THEN
    v_display_streak := 0;
  ELSE
    v_display_streak := v_profile.current_streak;
  END IF;

  -- 5. Today's stats
  SELECT
    COALESCE(pg_catalog.sum(xp_awarded), 0),
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
      COALESCE(b.xp, 0) AS xp,
      b.selected_specialization AS specialization,
      b.selected_at AS selected_at,
      (COALESCE(b.xp, 0) > 0) AS sprout_available,
      (COALESCE(b.xp, 0) >= 80 AND b.selected_specialization IS NULL) AS specialization_available,
      (COALESCE(b.xp, 0) >= 160 AND t.completed_at IS NOT NULL AND t.claimed_at IS NULL) AS crest_available,
      (t.id IS NOT NULL) AS trial_started,
      (t.completed_at IS NOT NULL) AS trial_complete,
      (t.claimed_at IS NOT NULL) AS crest_claimed
    FROM (
      VALUES ('mind'), ('body'), ('will'), ('craft')
    ) AS a(attr)
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
  ) INTO v_branches
  FROM attr_branches;

  -- 7. Trials
  SELECT COALESCE(
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

  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'item', pg_catalog.jsonb_build_object(
          'id', itm.id,
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

  -- 9. Quests (with notes)
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
        'completedForCurrentOccurrence', (
          CASE
            WHEN q.cadence = 'daily' THEN EXISTS (
              SELECT 1 FROM public.quest_completions qc
              WHERE qc.quest_id = q.id AND qc.occurrence_key = v_current_local_date::text
            )
            WHEN q.cadence = 'once' THEN EXISTS (
              SELECT 1 FROM public.quest_completions qc
              WHERE qc.quest_id = q.id
            )
            ELSE false
          END
        )
      )
      ORDER BY q.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_quests
  FROM public.quests q
  WHERE q.user_id = v_user_id AND q.deleted_at IS NULL;

  -- 10. Assemble GameSnapshot
  v_snapshot := pg_catalog.jsonb_build_object(
    'revision', v_profile.revision,
    'userId', v_user_id,
    'totalXp', v_profile.total_xp,
    'level', v_level,
    'sparksBalance', v_profile.sparks_balance,
    'currentStreak', v_display_streak,
    'longestStreak', v_profile.longest_streak,
    'emberState', v_ember_state,
    'todayXpAwarded', v_today_xp,
    'branches', v_branches,
    'trials', v_trials,
    'equippedItem', v_equipped_item_id,
    'inventory', v_inventory_items,
    'quests', v_quests
  );

  RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.get_game_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_snapshot() TO authenticated;

-- 5. RPC: get_calendar_month
-- Server-authoritative monthly activity aggregation based on user's saved timezone
CREATE OR REPLACE FUNCTION public.get_calendar_month(
  p_year integer,
  p_month integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_timezone text;
  v_start_date date;
  v_end_date date;
  v_today date;
  v_completions jsonb;
  v_notes jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to fetch calendar data';
  END IF;

  SELECT COALESCE(timezone, 'UTC') INTO v_timezone
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    v_timezone := 'UTC';
  END IF;

  -- Defensive date range construction
  BEGIN
    v_start_date := pg_catalog.make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid year or month: %-%', p_year, p_month;
  END;

  -- Current date in user's timezone
  BEGIN
    v_today := (pg_catalog.now() AT TIME ZONE v_timezone)::date;
  EXCEPTION WHEN OTHERS THEN
    v_today := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  END;

  -- Completions in the month range
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', qc.id,
        'questId', qc.quest_id,
        'localDate', qc.local_date::text,
        'title', qc.quest_title_snapshot,
        'attribute', qc.quest_attribute_snapshot,
        'effort', qc.quest_effort_snapshot,
        'xpAwarded', qc.xp_awarded,
        'sparksAwarded', qc.sparks_awarded,
        'notesSnapshot', qc.quest_notes_snapshot,
        'completedAt', pg_catalog.to_char(qc.completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
      ORDER BY qc.completed_at ASC
    ),
    '[]'::jsonb
  ) INTO v_completions
  FROM public.quest_completions qc
  WHERE qc.user_id = v_user_id
    AND qc.local_date >= v_start_date
    AND qc.local_date <= v_end_date;

  -- Journal notes created in that month
  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', jn.id,
        'title', jn.title,
        'body', jn.body,
        'localDate', ((jn.created_at AT TIME ZONE v_timezone)::date)::text,
        'createdAt', pg_catalog.to_char(jn.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
      ORDER BY jn.created_at ASC
    ),
    '[]'::jsonb
  ) INTO v_notes
  FROM public.journal_notes jn
  WHERE jn.user_id = v_user_id
    AND (jn.created_at AT TIME ZONE v_timezone)::date >= v_start_date
    AND (jn.created_at AT TIME ZONE v_timezone)::date <= v_end_date;

  RETURN pg_catalog.jsonb_build_object(
    'year', p_year,
    'month', p_month,
    'timezone', v_timezone,
    'today', v_today::text,
    'startDate', v_start_date::text,
    'endDate', v_end_date::text,
    'completions', v_completions,
    'notes', v_notes
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_calendar_month(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_calendar_month(integer, integer) TO authenticated;

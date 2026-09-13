-- =====================================================================
-- Migration: 20260913131000_satchel_v2_economy.sql
-- Description: Satchel V2 Real Economy & Bounded Relics
--              1. Catalog enhancement (category, description, ember_ward)
--              2. Server-authoritative purchase_item RPC
--              3. Server-authoritative equip_item RPC
--              4. Ember Ward streak preservation in complete_quest
--              5. Authoritative get_game_snapshot() alignment
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Catalog schema expansion and items seeding
-- ---------------------------------------------------------------------
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'cosmetic';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS description text;

-- Update existing launch cosmetics with category and description
UPDATE public.items SET
  category = 'cosmetic',
  description = 'A hand-hammered copper halo that catches the flickering flame.'
WHERE id = 'copper_halo';

UPDATE public.items SET
  category = 'cosmetic',
  description = 'Luminescent forest motes drifting in gentle orbit around the core.'
WHERE id = 'firefly_orbit';

UPDATE public.items SET
  category = 'cosmetic',
  description = 'A weathered stone basin with etched runes that cradle the embers.'
WHERE id = 'engraved_basin';

-- Insert Bounded Relic: Ember Ward (50 Sparks, consumable streak shield)
INSERT INTO public.items (id, name, price, visual_key, category, description)
VALUES (
  'ember_ward',
  'Ember Ward',
  50,
  'ember_ward',
  'relic',
  'A crystallized ember tear. Shields your streak through one day of absence.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  visual_key = EXCLUDED.visual_key,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- ---------------------------------------------------------------------
-- 2. Helper: level_from_xp delegating to level_from_total_xp
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.level_from_xp(p_total_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.level_from_total_xp(p_total_xp);
$$;

REVOKE ALL ON FUNCTION public.level_from_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.level_from_xp(integer) TO authenticated, anon;

-- ---------------------------------------------------------------------
-- 3. Authoritative get_game_snapshot()
-- Aligns snapshot structure with TypeScript contracts (equippedItemId, inventory.items)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_game_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_timezone text;
  v_current_local_date date;
  v_today_xp integer := 0;
  v_today_completions integer := 0;
  v_display_streak integer;
  v_ember_state text;
  v_level integer;
  v_branches jsonb := '{}'::jsonb;
  v_trials jsonb := '{}'::jsonb;
  v_inventory_items jsonb := '[]'::jsonb;
  v_equipped_item_id text := NULL;
  v_quests jsonb := '[]'::jsonb;
  v_snapshot jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Read profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2. Timezone and current local date
  v_timezone := COALESCE(v_profile.timezone, 'UTC');
  BEGIN
    v_current_local_date := (pg_catalog.now() AT TIME ZONE v_timezone)::date;
  EXCEPTION WHEN OTHERS THEN
    v_timezone := 'UTC';
    v_current_local_date := (pg_catalog.now() AT TIME ZONE 'UTC')::date;
  END;

  -- 3. Today's XP awarded (for information only; cap enforced by complete_quest)
  SELECT COALESCE(pg_catalog.sum(xp_awarded), 0)
  INTO v_today_xp
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  -- 4. Today's completion count for Ember state
  SELECT pg_catalog.count(*)
  INTO v_today_completions
  FROM public.quest_completions
  WHERE user_id = v_user_id AND local_date = v_current_local_date;

  v_ember_state := public.ember_state_from_count(v_today_completions);

  -- 5. Streak display logic
  IF v_profile.last_activity_date IS NULL OR v_profile.last_activity_date < (v_current_local_date - 1) THEN
    v_display_streak := 0;
  ELSE
    v_display_streak := v_profile.current_streak;
  END IF;

  -- 6. Character level derived from total_xp
  v_level := public.level_from_xp(v_profile.total_xp);

  -- 7. Branches and Trials
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
            AND t.claimed_at IS NULL
        ),
        'trialStarted', EXISTS (
          SELECT 1 FROM public.trials t
          WHERE t.user_id = v_user_id AND t.attribute = b.attribute
        ),
        'trialComplete', EXISTS (
          SELECT 1 FROM public.trials t
          WHERE t.user_id = v_user_id AND t.attribute = b.attribute AND t.completed_at IS NOT NULL
        ),
        'crestClaimed', EXISTS (
          SELECT 1 FROM public.trials t
          WHERE t.user_id = v_user_id AND t.attribute = b.attribute AND t.claimed_at IS NOT NULL
        )
      )
    ),
    '{}'::jsonb
  ) INTO v_branches
  FROM public.branches b
  WHERE user_id = v_user_id;

  SELECT COALESCE(
    pg_catalog.jsonb_object_agg(
      attribute,
      pg_catalog.jsonb_build_object(
        'id', id,
        'attribute', attribute,
        'specialization', specialization,
        'startedAt', pg_catalog.to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'kind', kind,
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
          'visualKey', itm.visual_key,
          'category', itm.category,
          'description', itm.description
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
    'equippedItemId', v_equipped_item_id,
    'equippedItem', v_equipped_item_id,
    'inventory', pg_catalog.jsonb_build_object('items', v_inventory_items),
    'quests', v_quests
  );

  RETURN v_snapshot;
END;
$$;

REVOKE ALL ON FUNCTION public.get_game_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_game_snapshot() TO authenticated;

-- ---------------------------------------------------------------------
-- 3. RPC: purchase_item
-- Authoritatively purchases an item from public.items, validating Sparks
-- balance, locking the profile row, debiting currency_ledger, and inserting
-- into inventory with idempotency.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_item(
  p_request_id uuid,
  p_item_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_item record;
  v_payload_hash text;
  v_receipt record;
  v_new_balance integer;
  v_new_revision integer;
  v_snapshot jsonb;
  v_event jsonb;
  v_result jsonb;
BEGIN
  -- 1. Require authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required' USING ERRCODE = 'P0002';
  END IF;

  IF p_item_id IS NULL OR pg_catalog.trim(p_item_id) = '' THEN
    RAISE EXCEPTION 'Item ID is required' USING ERRCODE = 'P0003';
  END IF;

  -- 2. Idempotency check via mutation_receipts
  v_payload_hash := pg_catalog.md5(p_item_id);

  SELECT * INTO v_receipt
  FROM public.mutation_receipts
  WHERE user_id = v_user_id AND request_id = p_request_id;

  IF FOUND THEN
    IF v_receipt.payload_hash = v_payload_hash THEN
      -- Return previously committed result
      RETURN v_receipt.result_event;
    ELSE
      RAISE EXCEPTION 'Idempotency conflict: requestId % was already used with a different payload', p_request_id USING ERRCODE = 'P0004';
    END IF;
  END IF;

  -- 3. Lock user profile row for update
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for authenticated user' USING ERRCODE = 'P0005';
  END IF;

  -- 4. Validate item in catalog
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item does not exist: %', p_item_id USING ERRCODE = 'P0006';
  END IF;

  -- 5. Reject duplicate ownership
  IF EXISTS (SELECT 1 FROM public.inventory WHERE user_id = v_user_id AND item_id = p_item_id) THEN
    RAISE EXCEPTION 'Item is already owned: %', p_item_id USING ERRCODE = 'P0007';
  END IF;

  -- 6. Enforce Sparks balance check
  IF v_profile.sparks_balance < v_item.price THEN
    RAISE EXCEPTION 'Insufficient Sparks balance. Price: %, Available: %', v_item.price, v_profile.sparks_balance USING ERRCODE = 'P0008';
  END IF;

  -- 7. Deduct Sparks balance and advance revision
  v_new_balance := v_profile.sparks_balance - v_item.price;
  v_new_revision := v_profile.revision + 1;

  UPDATE public.profiles
  SET sparks_balance = v_new_balance,
      revision = v_new_revision,
      updated_at = pg_catalog.now()
  WHERE user_id = v_user_id;

  -- 8. Insert negative debit into currency_ledger
  INSERT INTO public.currency_ledger (
    user_id,
    amount,
    source_kind,
    source_id,
    created_at
  ) VALUES (
    v_user_id,
    -v_item.price,
    'item_purchase',
    p_request_id::text,
    pg_catalog.now()
  );

  -- 9. Insert item into inventory
  INSERT INTO public.inventory (
    user_id,
    item_id,
    equipped,
    acquired_at
  ) VALUES (
    v_user_id,
    p_item_id,
    false,
    pg_catalog.now()
  );

  -- 10. Fetch updated authoritative snapshot
  v_snapshot := public.get_game_snapshot();

  -- 11. Build MutationEvent and MutationResult
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'item_purchased',
    'itemId', p_item_id,
    'price', v_item.price,
    'sparksBalance', v_new_balance
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 12. Save receipt in mutation_receipts
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
    'purchase_item',
    v_payload_hash,
    v_result,
    pg_catalog.now()
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_item(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_item(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. RPC: equip_item
-- Equips an owned cosmetic adornment, atomically unequipping any other
-- equipped adornment for the authenticated user.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.equip_item(
  p_request_id uuid,
  p_item_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_item record;
  v_payload_hash text;
  v_receipt record;
  v_new_revision integer;
  v_snapshot jsonb;
  v_event jsonb;
  v_result jsonb;
BEGIN
  -- 1. Require authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated' USING ERRCODE = 'P0001';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required' USING ERRCODE = 'P0002';
  END IF;

  IF p_item_id IS NULL OR pg_catalog.trim(p_item_id) = '' THEN
    RAISE EXCEPTION 'Item ID is required' USING ERRCODE = 'P0003';
  END IF;

  -- 2. Idempotency check
  v_payload_hash := pg_catalog.md5(p_item_id);

  SELECT * INTO v_receipt
  FROM public.mutation_receipts
  WHERE user_id = v_user_id AND request_id = p_request_id;

  IF FOUND THEN
    IF v_receipt.payload_hash = v_payload_hash THEN
      RETURN v_receipt.result_event;
    ELSE
      RAISE EXCEPTION 'Idempotency conflict: requestId % was already used with a different payload', p_request_id USING ERRCODE = 'P0004';
    END IF;
  END IF;

  -- 3. Lock profile row
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for authenticated user' USING ERRCODE = 'P0005';
  END IF;

  -- 4. Validate item in catalog and category
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item does not exist: %', p_item_id USING ERRCODE = 'P0006';
  END IF;

  IF v_item.category != 'cosmetic' THEN
    RAISE EXCEPTION 'Only Hearth adornments can be equipped' USING ERRCODE = 'P0007';
  END IF;

  -- 5. Validate ownership in inventory
  IF NOT EXISTS (SELECT 1 FROM public.inventory WHERE user_id = v_user_id AND item_id = p_item_id) THEN
    RAISE EXCEPTION 'Item not owned in inventory: %', p_item_id USING ERRCODE = 'P0008';
  END IF;

  -- 6. Atomically unequip prior item and equip target item
  UPDATE public.inventory
  SET equipped = false
  WHERE user_id = v_user_id AND equipped = true;

  UPDATE public.inventory
  SET equipped = true
  WHERE user_id = v_user_id AND item_id = p_item_id;

  -- 7. Advance profile revision
  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision,
      updated_at = pg_catalog.now()
  WHERE user_id = v_user_id;

  -- 8. Fetch updated authoritative snapshot
  v_snapshot := public.get_game_snapshot();

  -- 9. Build MutationEvent and MutationResult
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'item_equipped',
    'itemId', p_item_id
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 10. Record mutation receipt
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
    'equip_item',
    v_payload_hash,
    v_result,
    pg_catalog.now()
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.equip_item(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.equip_item(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. Update complete_quest with Ember Ward streak protection
-- Consumes an owned ember_ward if exactly 1 calendar day was missed,
-- preserving the player streak without awarding XP or fake completions.
-- ---------------------------------------------------------------------
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

  -- 9. Determine base XP by effort
  v_base_xp := public.base_xp_from_effort(v_quest.effort);

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
$$;

REVOKE ALL ON FUNCTION public.complete_quest(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_quest(uuid, uuid, text) TO authenticated;

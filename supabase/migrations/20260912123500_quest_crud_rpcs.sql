-- =====================================================================
-- Migration: 20260912123500_quest_crud_rpcs.sql
-- Description: Authoritative PostgreSQL RPCs for Quest CRUD:
--              1. create_quest
--              2. update_quest
--              3. soft_delete_quest
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RPC: create_quest
-- Authenticated creation of a new user quest.
-- Derives owner strictly from auth.uid(), rejects client-provided user_id.
-- Enforces title trimmed length 1-120, canonical attribute, effort, cadence.
-- Sets initial version = 1, deleted_at = NULL.
-- Increments profile revision, records idempotency receipt, returns MutationResult.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_quest(
  p_request_id uuid,
  p_title text,
  p_attribute text,
  p_effort text,
  p_cadence text,
  p_trial_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_title text;
  v_quest_id uuid;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_new_revision integer;
  v_snapshot jsonb;
  v_event jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create quest';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  v_title := pg_catalog.btrim(p_title);
  IF v_title IS NULL OR pg_catalog.char_length(v_title) < 1 OR pg_catalog.char_length(v_title) > 120 THEN
    RAISE EXCEPTION 'Quest title must be between 1 and 120 characters';
  END IF;

  IF p_attribute NOT IN ('mind', 'body', 'will', 'craft') THEN
    RAISE EXCEPTION 'Invalid attribute: %', p_attribute;
  END IF;

  IF p_effort NOT IN ('quick', 'standard', 'deep') THEN
    RAISE EXCEPTION 'Invalid effort: %', p_effort;
  END IF;

  IF p_cadence NOT IN ('once', 'daily') THEN
    RAISE EXCEPTION 'Invalid cadence: %', p_cadence;
  END IF;

  IF p_trial_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.trials
      WHERE id = p_trial_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Trial % not found for user', p_trial_id;
    END IF;
  END IF;

  -- 3. Canonical payload hash for idempotency
  v_payload_hash := pg_catalog.encode(
    pg_catalog.sha256(
      (v_title || '|' || p_attribute || '|' || p_effort || '|' || p_cadence || '|' || COALESCE(p_trial_id::text, ''))::bytea
    ),
    'hex'
  );

  -- 4. Check idempotency receipt
  SELECT * INTO v_receipt
  FROM public.mutation_receipts
  WHERE user_id = v_user_id AND request_id = p_request_id;

  IF FOUND THEN
    IF v_receipt.payload_hash = v_payload_hash THEN
      RETURN v_receipt.result_event;
    ELSE
      RAISE EXCEPTION 'request_id_reuse: Request ID already used with different payload';
    END IF;
  END IF;

  -- 5. Lock profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user_id;
  END IF;

  -- 6. Insert new quest
  v_now := pg_catalog.now();
  v_quest_id := pg_catalog.gen_random_uuid();

  INSERT INTO public.quests (
    id,
    user_id,
    title,
    attribute,
    effort,
    cadence,
    trial_id,
    version,
    deleted_at,
    created_at,
    updated_at
  ) VALUES (
    v_quest_id,
    v_user_id,
    v_title,
    p_attribute,
    p_effort,
    p_cadence,
    p_trial_id,
    1,
    NULL,
    v_now,
    v_now
  );

  -- 7. Increment profile revision
  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 8. Build fresh snapshot
  v_snapshot := public.get_game_snapshot();

  -- 9. Build event and result
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'quest_created',
    'questId', v_quest_id
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 10. Persist mutation receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'create_quest',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_quest(uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_quest(uuid, text, text, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. RPC: update_quest
-- Authenticated owner-only update of an existing quest.
-- Validates title trimmed 1-120, canonical attribute, effort, cadence.
-- Enforces optimistic locking via p_expected_version vs quest.version.
-- Increments quest.version and profile revision, updates updated_at server-side.
-- Rejects deleted quests, records idempotency receipt, returns MutationResult.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_quest(
  p_request_id uuid,
  p_quest_id uuid,
  p_expected_version integer,
  p_title text,
  p_attribute text,
  p_effort text,
  p_cadence text,
  p_trial_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_quest record;
  v_title text;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_new_revision integer;
  v_new_quest_version integer;
  v_snapshot jsonb;
  v_event jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to update quest';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  IF p_quest_id IS NULL THEN
    RAISE EXCEPTION 'Quest ID is required';
  END IF;

  IF p_expected_version IS NULL THEN
    RAISE EXCEPTION 'Expected version is required';
  END IF;

  v_title := pg_catalog.btrim(p_title);
  IF v_title IS NULL OR pg_catalog.char_length(v_title) < 1 OR pg_catalog.char_length(v_title) > 120 THEN
    RAISE EXCEPTION 'Quest title must be between 1 and 120 characters';
  END IF;

  IF p_attribute NOT IN ('mind', 'body', 'will', 'craft') THEN
    RAISE EXCEPTION 'Invalid attribute: %', p_attribute;
  END IF;

  IF p_effort NOT IN ('quick', 'standard', 'deep') THEN
    RAISE EXCEPTION 'Invalid effort: %', p_effort;
  END IF;

  IF p_cadence NOT IN ('once', 'daily') THEN
    RAISE EXCEPTION 'Invalid cadence: %', p_cadence;
  END IF;

  IF p_trial_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.trials
      WHERE id = p_trial_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Trial % not found for user', p_trial_id;
    END IF;
  END IF;

  -- 3. Canonical payload hash for idempotency
  v_payload_hash := pg_catalog.encode(
    pg_catalog.sha256(
      (p_quest_id::text || '|' || p_expected_version::text || '|' || v_title || '|' || p_attribute || '|' || p_effort || '|' || p_cadence || '|' || COALESCE(p_trial_id::text, ''))::bytea
    ),
    'hex'
  );

  -- 4. Check idempotency receipt
  SELECT * INTO v_receipt
  FROM public.mutation_receipts
  WHERE user_id = v_user_id AND request_id = p_request_id;

  IF FOUND THEN
    IF v_receipt.payload_hash = v_payload_hash THEN
      RETURN v_receipt.result_event;
    ELSE
      RAISE EXCEPTION 'request_id_reuse: Request ID already used with different payload';
    END IF;
  END IF;

  -- 5. Lock profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user_id;
  END IF;

  -- 6. Lock and validate quest
  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;

  IF v_quest.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot update deleted quest';
  END IF;

  IF v_quest.version <> p_expected_version THEN
    RAISE EXCEPTION 'stale_version_conflict: Expected version % does not match current version %',
      p_expected_version, v_quest.version
      USING ERRCODE = 'P0015';
  END IF;

  -- 7. Update quest
  v_now := pg_catalog.now();
  v_new_quest_version := v_quest.version + 1;

  UPDATE public.quests
  SET
    title = v_title,
    attribute = p_attribute,
    effort = p_effort,
    cadence = p_cadence,
    trial_id = p_trial_id,
    version = v_new_quest_version,
    updated_at = v_now
  WHERE id = p_quest_id AND user_id = v_user_id;

  -- 8. Increment profile revision
  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 9. Build fresh snapshot
  v_snapshot := public.get_game_snapshot();

  -- 10. Build event and result
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'quest_updated',
    'questId', p_quest_id,
    'version', v_new_quest_version
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 11. Persist mutation receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'update_quest',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.update_quest(uuid, uuid, integer, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_quest(uuid, uuid, integer, text, text, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. RPC: soft_delete_quest
-- Authenticated owner-only soft-deletion of a quest.
-- Sets deleted_at = now(), increments quest.version, updates updated_at.
-- Increments profile revision, records idempotency receipt.
-- Preserves immutable completion history in quest_completions table.
-- Returns fresh snapshot which automatically excludes deleted quests.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.soft_delete_quest(
  p_request_id uuid,
  p_quest_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_quest record;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_new_revision integer;
  v_new_quest_version integer;
  v_snapshot jsonb;
  v_event jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to delete quest';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  IF p_quest_id IS NULL THEN
    RAISE EXCEPTION 'Quest ID is required';
  END IF;

  -- 3. Canonical payload hash for idempotency
  v_payload_hash := pg_catalog.encode(
    pg_catalog.sha256(p_quest_id::text::bytea),
    'hex'
  );

  -- 4. Check idempotency receipt
  SELECT * INTO v_receipt
  FROM public.mutation_receipts
  WHERE user_id = v_user_id AND request_id = p_request_id;

  IF FOUND THEN
    IF v_receipt.payload_hash = v_payload_hash THEN
      RETURN v_receipt.result_event;
    ELSE
      RAISE EXCEPTION 'request_id_reuse: Request ID already used with different payload';
    END IF;
  END IF;

  -- 5. Lock profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user_id;
  END IF;

  -- 6. Lock and validate quest
  SELECT * INTO v_quest
  FROM public.quests
  WHERE id = p_quest_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;

  IF v_quest.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Quest is already deleted';
  END IF;

  -- 7. Soft delete quest
  v_now := pg_catalog.now();
  v_new_quest_version := v_quest.version + 1;

  UPDATE public.quests
  SET
    deleted_at = v_now,
    version = v_new_quest_version,
    updated_at = v_now
  WHERE id = p_quest_id AND user_id = v_user_id;

  -- 8. Increment profile revision
  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 9. Build fresh snapshot (get_game_snapshot automatically filters out deleted quests)
  v_snapshot := public.get_game_snapshot();

  -- 10. Build event and result
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'quest_deleted',
    'questId', p_quest_id
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 11. Persist mutation receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'soft_delete_quest',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_quest(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_quest(uuid, uuid) TO authenticated;

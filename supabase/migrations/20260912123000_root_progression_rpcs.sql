-- =====================================================================
-- Migration: 20260912123000_root_progression_rpcs.sql
-- Description: Authoritative PostgreSQL RPCs for Root progression:
--              1. choose_specialization
--              2. start_trial
--              3. progress_trial (with trial_progress_events tracking)
--              4. record_trial_milestone
--              5. claim_trial
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Supporting Table: trial_progress_events
-- Immutably records distinct local calendar days for distinct_days trials.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_progress_events (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_id uuid NOT NULL REFERENCES public.trials(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_trial_progress_date UNIQUE (trial_id, local_date)
);

CREATE INDEX IF NOT EXISTS idx_trial_progress_user_trial
  ON public.trial_progress_events (user_id, trial_id);

ALTER TABLE public.trial_progress_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trial progress events" ON public.trial_progress_events;
CREATE POLICY "Users can view own trial progress events"
  ON public.trial_progress_events
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.trial_progress_events FROM PUBLIC;
GRANT SELECT ON TABLE public.trial_progress_events TO authenticated;

-- Prevent direct mutation of progress events
CREATE OR REPLACE FUNCTION public.prevent_trial_progress_modifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'trial_progress_events is immutable and cannot be updated or deleted';
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_trial_progress_modifications() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_trial_progress_modifications ON public.trial_progress_events;
CREATE TRIGGER trg_prevent_trial_progress_modifications
  BEFORE UPDATE OR DELETE ON public.trial_progress_events
  FOR EACH ROW EXECUTE FUNCTION public.prevent_trial_progress_modifications();

-- ---------------------------------------------------------------------
-- 2. RPC: choose_specialization
-- Commits a branch specialization once the user reaches >= 80 branch XP.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.choose_specialization(
  p_request_id uuid,
  p_attribute text,
  p_specialization text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_branch record;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_new_revision integer;
  v_event jsonb;
  v_snapshot jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to choose specialization';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  IF p_attribute NOT IN ('mind', 'body', 'will', 'craft') THEN
    RAISE EXCEPTION 'Invalid attribute: %', p_attribute;
  END IF;

  IF (p_attribute = 'mind' AND p_specialization NOT IN ('scholar', 'explorer')) OR
     (p_attribute = 'body' AND p_specialization NOT IN ('endurance', 'mobility')) OR
     (p_attribute = 'will' AND p_specialization NOT IN ('focus', 'courage')) OR
     (p_attribute = 'craft' AND p_specialization NOT IN ('builder', 'artisan')) THEN
    RAISE EXCEPTION 'Specialization % is not valid for attribute %', p_specialization, p_attribute;
  END IF;

  -- 3. Concurrency control: Lock user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 4. Idempotency check via mutation_receipts
  v_payload_hash := pg_catalog.md5(pg_catalog.concat_ws(':', 'choose_specialization', p_attribute, p_specialization));

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

  -- 5. Validate branch state
  SELECT * INTO v_branch
  FROM public.branches
  WHERE user_id = v_user_id AND attribute = p_attribute
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Branch % not found for user', p_attribute;
  END IF;

  IF v_branch.xp < 80 THEN
    RAISE EXCEPTION 'Insufficient branch XP for specialization (minimum 80 XP required, currently % XP)', v_branch.xp;
  END IF;

  IF v_branch.selected_specialization IS NOT NULL THEN
    RAISE EXCEPTION 'Specialization has already been chosen for branch %', p_attribute;
  END IF;

  -- 6. Apply specialization mutation
  v_now := pg_catalog.now();

  UPDATE public.branches
  SET
    selected_specialization = p_specialization,
    selected_at = v_now
  WHERE user_id = v_user_id AND attribute = p_attribute;

  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 7. Build fresh authoritative snapshot
  v_snapshot := public.get_game_snapshot();

  -- 8. Build MutationResult event
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'specialization_chosen',
    'attribute', p_attribute,
    'specialization', p_specialization
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 9. Persist mutation receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'choose_specialization',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.choose_specialization(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.choose_specialization(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. RPC: start_trial
-- Starts a server-configured trial for a chosen specialization.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_trial(
  p_request_id uuid,
  p_attribute text,
  p_specialization text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_branch record;
  v_existing_trial record;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_kind text;
  v_required_days integer;
  v_trial_id uuid;
  v_new_revision integer;
  v_event jsonb;
  v_snapshot jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to start trial';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  IF p_attribute NOT IN ('mind', 'body', 'will', 'craft') THEN
    RAISE EXCEPTION 'Invalid attribute: %', p_attribute;
  END IF;

  -- 3. Concurrency control: Lock user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 4. Idempotency check via mutation_receipts
  v_payload_hash := pg_catalog.md5(pg_catalog.concat_ws(':', 'start_trial', p_attribute, p_specialization));

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

  -- 5. Validate branch state
  SELECT * INTO v_branch
  FROM public.branches
  WHERE user_id = v_user_id AND attribute = p_attribute
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Branch % not found for user', p_attribute;
  END IF;

  IF v_branch.selected_specialization IS NULL THEN
    RAISE EXCEPTION 'Must choose a specialization before starting a trial';
  END IF;

  IF v_branch.selected_specialization IS DISTINCT FROM p_specialization THEN
    RAISE EXCEPTION 'Requested specialization % does not match active branch specialization %',
      p_specialization, v_branch.selected_specialization;
  END IF;

  -- 6. Check that trial does not already exist
  SELECT * INTO v_existing_trial
  FROM public.trials
  WHERE user_id = v_user_id AND attribute = p_attribute;

  IF FOUND THEN
    RAISE EXCEPTION 'Trial already exists for branch %', p_attribute;
  END IF;

  -- 7. Server-authoritative Trial configuration
  CASE p_specialization
    WHEN 'scholar' THEN
      v_kind := 'distinct_days';
      v_required_days := 5;
    WHEN 'explorer' THEN
      v_kind := 'milestone_reflection';
      v_required_days := NULL;
    WHEN 'endurance' THEN
      v_kind := 'distinct_days';
      v_required_days := 5;
    WHEN 'mobility' THEN
      v_kind := 'milestone_reflection';
      v_required_days := NULL;
    WHEN 'focus' THEN
      v_kind := 'distinct_days';
      v_required_days := 5;
    WHEN 'courage' THEN
      v_kind := 'milestone_reflection';
      v_required_days := NULL;
    WHEN 'builder' THEN
      v_kind := 'distinct_days';
      v_required_days := 5;
    WHEN 'artisan' THEN
      v_kind := 'milestone_reflection';
      v_required_days := NULL;
    ELSE
      RAISE EXCEPTION 'Unknown specialization: %', p_specialization;
  END CASE;

  -- 8. Insert new trial
  v_now := pg_catalog.now();

  INSERT INTO public.trials (
    user_id,
    attribute,
    specialization,
    kind,
    started_at,
    required_days,
    distinct_days_completed,
    milestone_text,
    completed_at,
    claimed_at
  ) VALUES (
    v_user_id,
    p_attribute,
    p_specialization,
    v_kind,
    v_now,
    v_required_days,
    0,
    NULL,
    NULL,
    NULL
  ) RETURNING id INTO v_trial_id;

  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 9. Build fresh authoritative snapshot
  v_snapshot := public.get_game_snapshot();

  -- 10. Build MutationResult
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'trial_started',
    'attribute', p_attribute,
    'specialization', p_specialization
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 11. Persist receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'start_trial',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.start_trial(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_trial(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. RPC: progress_trial
-- Records evidence for distinct_days trials across distinct local calendar days.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.progress_trial(
  p_request_id uuid,
  p_attribute text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_trial record;
  v_branch record;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_local_date date;
  v_already_progressed_today boolean;
  v_distinct_days integer;
  v_completed_at timestamptz;
  v_crest_available boolean;
  v_new_revision integer;
  v_event jsonb;
  v_snapshot jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to progress trial';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  IF p_attribute NOT IN ('mind', 'body', 'will', 'craft') THEN
    RAISE EXCEPTION 'Invalid attribute: %', p_attribute;
  END IF;

  -- 3. Concurrency control: Lock user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 4. Idempotency check via mutation_receipts
  v_payload_hash := pg_catalog.md5(pg_catalog.concat_ws(':', 'progress_trial', p_attribute));

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

  -- 5. Validate and lock Trial
  SELECT * INTO v_trial
  FROM public.trials
  WHERE user_id = v_user_id AND attribute = p_attribute
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active trial found for branch %', p_attribute;
  END IF;

  IF v_trial.kind IS DISTINCT FROM 'distinct_days' THEN
    RAISE EXCEPTION 'Trial for branch % is not a distinct days trial (kind: %)', p_attribute, v_trial.kind;
  END IF;

  IF v_trial.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Trial for branch % is already completed', p_attribute;
  END IF;

  -- 6. Derive current local date in user's profile timezone
  v_now := pg_catalog.now();
  v_local_date := (v_now AT TIME ZONE COALESCE(v_profile.timezone, 'UTC'))::date;

  -- 7. Reject duplicate progress on same local date
  SELECT EXISTS (
    SELECT 1 FROM public.trial_progress_events
    WHERE trial_id = v_trial.id AND local_date = v_local_date
  ) INTO v_already_progressed_today;

  IF v_already_progressed_today THEN
    RAISE EXCEPTION 'Trial progress already recorded for date % in timezone %', v_local_date, COALESCE(v_profile.timezone, 'UTC');
  END IF;

  -- 8. Insert immutable progress event
  INSERT INTO public.trial_progress_events (
    user_id,
    trial_id,
    local_date,
    created_at
  ) VALUES (
    v_user_id,
    v_trial.id,
    v_local_date,
    v_now
  );

  -- 9. Recompute distinct days from immutable evidence
  SELECT pg_catalog.count(*) INTO v_distinct_days
  FROM public.trial_progress_events
  WHERE trial_id = v_trial.id;

  -- 10. Check trial completion
  IF v_distinct_days >= v_trial.required_days THEN
    v_completed_at := v_now;
  ELSE
    v_completed_at := NULL;
  END IF;

  UPDATE public.trials
  SET
    distinct_days_completed = v_distinct_days,
    completed_at = COALESCE(completed_at, v_completed_at)
  WHERE id = v_trial.id;

  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 11. Read branch to determine crest availability
  SELECT * INTO v_branch
  FROM public.branches
  WHERE user_id = v_user_id AND attribute = p_attribute;

  v_crest_available := (v_branch.xp >= 160 AND v_completed_at IS NOT NULL AND v_trial.claimed_at IS NULL);

  -- 12. Build fresh snapshot
  v_snapshot := public.get_game_snapshot();

  -- 13. Build MutationResult
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'trial_progressed',
    'attribute', p_attribute,
    'distinctDaysCompleted', v_distinct_days,
    'trialComplete', (v_completed_at IS NOT NULL),
    'crestAvailable', v_crest_available
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 14. Persist receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'progress_trial',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.progress_trial(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.progress_trial(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. RPC: record_trial_milestone
-- Completes a milestone_reflection trial with user-authored reflection text.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_trial_milestone(
  p_request_id uuid,
  p_attribute text,
  p_milestone_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_trial record;
  v_branch record;
  v_trimmed_text text;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_crest_available boolean;
  v_new_revision integer;
  v_event jsonb;
  v_snapshot jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to record trial milestone';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  IF p_attribute NOT IN ('mind', 'body', 'will', 'craft') THEN
    RAISE EXCEPTION 'Invalid attribute: %', p_attribute;
  END IF;

  v_trimmed_text := pg_catalog.btrim(p_milestone_text);
  IF v_trimmed_text IS NULL OR pg_catalog.length(v_trimmed_text) = 0 THEN
    RAISE EXCEPTION 'Milestone reflection text cannot be empty';
  END IF;

  IF pg_catalog.length(v_trimmed_text) > 500 THEN
    RAISE EXCEPTION 'Milestone reflection text exceeds maximum length of 500 characters (actual: %)',
      pg_catalog.length(v_trimmed_text);
  END IF;

  -- 3. Concurrency control: Lock user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 4. Idempotency check via mutation_receipts
  v_payload_hash := pg_catalog.md5(pg_catalog.concat_ws(':', 'record_trial_milestone', p_attribute, v_trimmed_text));

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

  -- 5. Validate and lock Trial
  SELECT * INTO v_trial
  FROM public.trials
  WHERE user_id = v_user_id AND attribute = p_attribute
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active trial found for branch %', p_attribute;
  END IF;

  IF v_trial.kind IS DISTINCT FROM 'milestone_reflection' THEN
    RAISE EXCEPTION 'Trial for branch % is not a milestone reflection trial (kind: %)', p_attribute, v_trial.kind;
  END IF;

  IF v_trial.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Trial for branch % is already completed', p_attribute;
  END IF;

  -- 6. Apply milestone completion
  v_now := pg_catalog.now();

  UPDATE public.trials
  SET
    milestone_text = v_trimmed_text,
    completed_at = v_now
  WHERE id = v_trial.id;

  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 7. Read branch to determine crest availability
  SELECT * INTO v_branch
  FROM public.branches
  WHERE user_id = v_user_id AND attribute = p_attribute;

  v_crest_available := (v_branch.xp >= 160 AND v_trial.claimed_at IS NULL);

  -- 8. Build fresh snapshot
  v_snapshot := public.get_game_snapshot();

  -- 9. Build MutationResult
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'trial_milestone_recorded',
    'attribute', p_attribute,
    'milestoneText', v_trimmed_text,
    'trialComplete', true,
    'crestAvailable', v_crest_available
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 10. Persist receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'record_trial_milestone',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.record_trial_milestone(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_trial_milestone(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 6. RPC: claim_trial
-- Permanently claims the crest for a completed trial once branch XP >= 160.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_trial(
  p_request_id uuid,
  p_attribute text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_trial record;
  v_branch record;
  v_payload_hash text;
  v_receipt record;
  v_now timestamptz;
  v_new_revision integer;
  v_event jsonb;
  v_snapshot jsonb;
  v_result jsonb;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to claim trial crest';
  END IF;

  -- 2. Input validation
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID is required';
  END IF;

  IF p_attribute NOT IN ('mind', 'body', 'will', 'craft') THEN
    RAISE EXCEPTION 'Invalid attribute: %', p_attribute;
  END IF;

  -- 3. Concurrency control: Lock user profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 4. Idempotency check via mutation_receipts
  v_payload_hash := pg_catalog.md5(pg_catalog.concat_ws(':', 'claim_trial', p_attribute));

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

  -- 5. Validate and lock Trial
  SELECT * INTO v_trial
  FROM public.trials
  WHERE user_id = v_user_id AND attribute = p_attribute
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No trial found for branch %', p_attribute;
  END IF;

  IF v_trial.completed_at IS NULL THEN
    RAISE EXCEPTION 'Trial objective for branch % has not been completed', p_attribute;
  END IF;

  IF v_trial.claimed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Trial crest for branch % has already been claimed', p_attribute;
  END IF;

  -- 6. Validate branch XP >= 160
  SELECT * INTO v_branch
  FROM public.branches
  WHERE user_id = v_user_id AND attribute = p_attribute
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Branch % not found for user', p_attribute;
  END IF;

  IF v_branch.xp < 160 THEN
    RAISE EXCEPTION 'Insufficient branch XP to claim crest (minimum 160 XP required, currently % XP)', v_branch.xp;
  END IF;

  -- 7. Apply crest claim mutation
  v_now := pg_catalog.now();

  UPDATE public.trials
  SET claimed_at = v_now
  WHERE id = v_trial.id;

  v_new_revision := v_profile.revision + 1;
  UPDATE public.profiles
  SET revision = v_new_revision
  WHERE user_id = v_user_id;

  -- 8. Build fresh snapshot
  v_snapshot := public.get_game_snapshot();

  -- 9. Build MutationResult
  v_event := pg_catalog.jsonb_build_object(
    'id', 'evt-' || p_request_id::text,
    'kind', 'trial_claimed',
    'attribute', p_attribute,
    'specialization', v_trial.specialization
  );

  v_result := pg_catalog.jsonb_build_object(
    'revision', v_new_revision,
    'event', v_event,
    'snapshot', v_snapshot
  );

  -- 10. Persist receipt
  INSERT INTO public.mutation_receipts (
    user_id,
    request_id,
    operation,
    payload_hash,
    result_event
  ) VALUES (
    v_user_id,
    p_request_id,
    'claim_trial',
    v_payload_hash,
    v_result
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_trial(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_trial(uuid, text) TO authenticated;

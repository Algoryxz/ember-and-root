-- ==============================================================================
-- Migration 001: Foundational Game Schema
-- Ember & Root — Core Workstream
--
-- Tables:
--   1. profiles
--   2. quests
--   3. quest_completions
--   4. branches
--   5. trials
--   6. items
--   7. inventory
--   8. currency_ledger
--   9. mutation_receipts
-- ==============================================================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'UTC',
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  sparks_balance integer NOT NULL DEFAULT 0 CHECK (sparks_balance >= 0),
  current_streak integer NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak integer NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date date NULL,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  preferences jsonb NOT NULL DEFAULT '{"sound": true, "reducedMotion": false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

-- 2. Quests
CREATE TABLE IF NOT EXISTS public.quests (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (pg_catalog.char_length(pg_catalog.trim(title)) BETWEEN 1 AND 120),
  attribute text NOT NULL CHECK (attribute IN ('mind', 'body', 'will', 'craft')),
  effort text NOT NULL CHECK (effort IN ('quick', 'standard', 'deep')),
  cadence text NOT NULL CHECK (cadence IN ('once', 'daily')),
  trial_id uuid NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX IF NOT EXISTS idx_quests_user_deleted
  ON public.quests (user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_quests_user_attr_deleted
  ON public.quests (user_id, attribute, deleted_at);

-- 3. Quest Completions (Immutable event history)
CREATE TABLE IF NOT EXISTS public.quest_completions (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  quest_id uuid NOT NULL REFERENCES public.quests(id),
  occurrence_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  local_date date NOT NULL,
  quest_title_snapshot text NOT NULL,
  quest_attribute_snapshot text NOT NULL CHECK (quest_attribute_snapshot IN ('mind', 'body', 'will', 'craft')),
  quest_effort_snapshot text NOT NULL CHECK (quest_effort_snapshot IN ('quick', 'standard', 'deep')),
  xp_awarded integer NOT NULL CHECK (xp_awarded >= 0),
  sparks_awarded integer NOT NULL CHECK (sparks_awarded >= 0),
  trial_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT uq_quest_completions_occurrence UNIQUE (quest_id, occurrence_key)
);

CREATE INDEX IF NOT EXISTS idx_quest_completions_user_date
  ON public.quest_completions (user_id, local_date);

CREATE INDEX IF NOT EXISTS idx_quest_completions_user_completed
  ON public.quest_completions (user_id, completed_at DESC);

-- Enforce immutability on quest_completions
CREATE OR REPLACE FUNCTION public.prevent_completion_modifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'quest_completions rows are immutable and cannot be updated or deleted';
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_completion_modifications() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_completion_modifications ON public.quest_completions;
CREATE TRIGGER trg_prevent_completion_modifications
  BEFORE UPDATE OR DELETE ON public.quest_completions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_completion_modifications();

-- 4. Branches
CREATE TABLE IF NOT EXISTS public.branches (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attribute text NOT NULL CHECK (attribute IN ('mind', 'body', 'will', 'craft')),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  selected_specialization text NULL,
  selected_at timestamptz NULL,
  PRIMARY KEY (user_id, attribute),
  CONSTRAINT valid_specialization_mapping CHECK (
    selected_specialization IS NULL OR
    (attribute = 'mind' AND selected_specialization IN ('scholar', 'explorer')) OR
    (attribute = 'body' AND selected_specialization IN ('endurance', 'mobility')) OR
    (attribute = 'will' AND selected_specialization IN ('focus', 'courage')) OR
    (attribute = 'craft' AND selected_specialization IN ('builder', 'artisan'))
  )
);

-- Enforce finality of specialization selection
CREATE OR REPLACE FUNCTION public.prevent_specialization_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.selected_specialization IS NOT NULL AND NEW.selected_specialization IS DISTINCT FROM OLD.selected_specialization THEN
    RAISE EXCEPTION 'Specialization choice is final and cannot be altered';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_specialization_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_specialization_change ON public.branches;
CREATE TRIGGER trg_prevent_specialization_change
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.prevent_specialization_change();

-- 5. Trials
CREATE TABLE IF NOT EXISTS public.trials (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attribute text NOT NULL CHECK (attribute IN ('mind', 'body', 'will', 'craft')),
  specialization text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('distinct_days', 'milestone_reflection')),
  started_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  required_days integer NULL,
  distinct_days_completed integer NOT NULL DEFAULT 0,
  milestone_text text NULL,
  completed_at timestamptz NULL,
  claimed_at timestamptz NULL,
  CONSTRAINT uq_trials_user_attribute UNIQUE (user_id, attribute),
  CONSTRAINT valid_trial_specialization CHECK (
    (attribute = 'mind' AND specialization IN ('scholar', 'explorer')) OR
    (attribute = 'body' AND specialization IN ('endurance', 'mobility')) OR
    (attribute = 'will' AND specialization IN ('focus', 'courage')) OR
    (attribute = 'craft' AND specialization IN ('builder', 'artisan'))
  ),
  CONSTRAINT valid_trial_kind_shape CHECK (
    (kind = 'distinct_days' AND required_days IS NOT NULL AND required_days > 0 AND distinct_days_completed >= 0 AND milestone_text IS NULL) OR
    (kind = 'milestone_reflection' AND required_days IS NULL AND distinct_days_completed = 0)
  )
);

-- Add foreign key from quests to trials now that trials exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_quests_trial'
  ) THEN
    ALTER TABLE public.quests
      ADD CONSTRAINT fk_quests_trial
      FOREIGN KEY (trial_id) REFERENCES public.trials(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Items (Catalog)
CREATE TABLE IF NOT EXISTS public.items (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  visual_key text NOT NULL
);

-- Seed catalog items exactly
INSERT INTO public.items (id, name, price, visual_key) VALUES
  ('copper_halo',    'Copper Halo',    20, 'copper_halo'),
  ('firefly_orbit',  'Firefly Orbit',  40, 'firefly_orbit'),
  ('engraved_basin', 'Engraved Basin', 60, 'engraved_basin')
ON CONFLICT (id) DO NOTHING;

-- 7. Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.items(id),
  acquired_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  equipped boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, item_id)
);

-- At most one equipped item per user
CREATE UNIQUE INDEX IF NOT EXISTS inventory_one_equipped_per_user
  ON public.inventory (user_id) WHERE equipped = true;

-- 8. Currency Ledger (Immutable)
CREATE TABLE IF NOT EXISTS public.currency_ledger (
  id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('quest_reward', 'item_purchase')),
  source_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_currency_ledger_source UNIQUE (user_id, source_kind, source_id)
);

CREATE OR REPLACE FUNCTION public.prevent_ledger_modifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'currency_ledger rows are immutable and cannot be updated or deleted';
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_ledger_modifications() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_ledger_modifications ON public.currency_ledger;
CREATE TRIGGER trg_prevent_ledger_modifications
  BEFORE UPDATE OR DELETE ON public.currency_ledger
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_modifications();

-- 9. Mutation Receipts (Idempotency)
CREATE TABLE IF NOT EXISTS public.mutation_receipts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  operation text NOT NULL,
  payload_hash text NOT NULL,
  result_event jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  PRIMARY KEY (user_id, request_id)
);

-- 10. Minimal Safe User Bootstrap
-- Creates profile and four attribute branches upon authentication
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert base profile (timezone defaults to UTC until onboarding sets it)
  INSERT INTO public.profiles (user_id, timezone)
  VALUES (NEW.id, 'UTC')
  ON CONFLICT (user_id) DO NOTHING;

  -- Seed the four initial branches with 0 XP
  INSERT INTO public.branches (user_id, attribute, xp)
  VALUES
    (NEW.id, 'mind', 0),
    (NEW.id, 'body', 0),
    (NEW.id, 'will', 0),
    (NEW.id, 'craft', 0)
  ON CONFLICT (user_id, attribute) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

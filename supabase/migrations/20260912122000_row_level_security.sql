-- ==============================================================================
-- Migration 002: Row Level Security Policies
-- Ember & Root — Core Workstream
--
-- Restricts read and write operations on all tables.
-- Progression-changing writes must execute via SECURITY DEFINER RPC functions.
-- ==============================================================================

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Direct client updates to profiles only allowed for preferences and timezone
CREATE POLICY "profiles_owner_update_preferences"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to guard against client tampering with progression columns via direct update
CREATE OR REPLACE FUNCTION public.guard_profile_progression_columns()
RETURNS trigger AS $$
BEGIN
  -- If invoked from regular authenticated context without bypass, reject direct progression changes
  IF current_setting('ember.in_rpc', true) IS NULL OR current_setting('ember.in_rpc', true) != 'true' THEN
    IF NEW.total_xp IS DISTINCT FROM OLD.total_xp OR
       NEW.sparks_balance IS DISTINCT FROM OLD.sparks_balance OR
       NEW.current_streak IS DISTINCT FROM OLD.current_streak OR
       NEW.longest_streak IS DISTINCT FROM OLD.longest_streak OR
       NEW.last_activity_date IS DISTINCT FROM OLD.last_activity_date OR
       NEW.revision IS DISTINCT FROM OLD.revision THEN
      RAISE EXCEPTION 'Direct updates to progression, streak, or balance columns are forbidden. Use RPCs.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_profile_progression ON public.profiles;
CREATE TRIGGER trg_guard_profile_progression
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_progression_columns();

-- 2. Quests
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quests_owner_select"
  ON public.quests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Quests can be managed by owner (or through RPC)
CREATE POLICY "quests_owner_insert"
  ON public.quests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quests_owner_update"
  ON public.quests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Soft delete only; hard delete denied
CREATE POLICY "quests_owner_delete"
  ON public.quests FOR DELETE
  TO authenticated
  USING (false);

-- 3. Quest Completions (Immutable; direct client INSERT/UPDATE/DELETE denied)
ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "completions_owner_select"
  ON public.quest_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No direct client writes to completions
CREATE POLICY "completions_no_client_insert"
  ON public.quest_completions FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 4. Branches (Progression; direct client writes denied)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_owner_select"
  ON public.branches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "branches_no_client_insert"
  ON public.branches FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "branches_no_client_update"
  ON public.branches FOR UPDATE
  TO authenticated
  USING (false);

-- 5. Trials (Progression; direct client writes denied)
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trials_owner_select"
  ON public.trials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "trials_no_client_insert"
  ON public.trials FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "trials_no_client_update"
  ON public.trials FOR UPDATE
  TO authenticated
  USING (false);

-- 6. Items (Catalog is readable by all authenticated users, client writes denied)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_read_all"
  ON public.items FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "items_no_client_insert"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "items_no_client_update"
  ON public.items FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "items_no_client_delete"
  ON public.items FOR DELETE
  TO authenticated
  USING (false);

-- 7. Inventory (Owner reads, writes through shop RPC only)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_owner_select"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "inventory_no_client_insert"
  ON public.inventory FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "inventory_no_client_update"
  ON public.inventory FOR UPDATE
  TO authenticated
  USING (false);

-- 8. Currency Ledger (Immutable history; client writes denied)
ALTER TABLE public.currency_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_owner_select"
  ON public.currency_ledger FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ledger_no_client_insert"
  ON public.currency_ledger FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 9. Mutation Receipts (Internal idempotency log; no direct client access)
ALTER TABLE public.mutation_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipts_owner_select"
  ON public.mutation_receipts FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "receipts_no_client_insert"
  ON public.mutation_receipts FOR INSERT
  TO authenticated
  WITH CHECK (false);

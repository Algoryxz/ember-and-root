-- Migration: 20260913120000_quest_notes_snapshotting.sql
-- Description: Authoritative snapshotting of quest notes during completion
--
-- IMPORTANT:
-- Do not replace public.complete_quest here. That RPC owns progression-critical
-- behavior (XP, Sparks ledger, streaks, idempotency, branch XP, etc.).
-- Snapshot quest notes at the table boundary instead so every completion insert
-- preserves the quest note without risking regression of reward semantics.

CREATE OR REPLACE FUNCTION public.snapshot_quest_notes_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.quest_notes_snapshot IS NULL AND NEW.quest_id IS NOT NULL THEN
    SELECT q.notes
      INTO NEW.quest_notes_snapshot
    FROM public.quests q
    WHERE q.id = NEW.quest_id
      AND q.user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_quest_notes_on_completion() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_snapshot_quest_notes_on_completion
  ON public.quest_completions;

CREATE TRIGGER trg_snapshot_quest_notes_on_completion
BEFORE INSERT ON public.quest_completions
FOR EACH ROW
EXECUTE FUNCTION public.snapshot_quest_notes_on_completion();

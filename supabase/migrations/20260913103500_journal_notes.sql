-- ============================================================================
-- Migration: 20260913103500_journal_notes.sql
-- Description: Personal field journal table and RLS policies for Ember & Root
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.journal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NULL CHECK (char_length(trim(title)) <= 160),
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

-- Index for chronological listing per user
CREATE INDEX IF NOT EXISTS idx_journal_notes_user_created
  ON public.journal_notes(user_id, created_at DESC);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_journal_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_notes_updated_at ON public.journal_notes;
CREATE TRIGGER trg_journal_notes_updated_at
  BEFORE UPDATE ON public.journal_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_journal_notes_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.journal_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read own journal notes" ON public.journal_notes;
CREATE POLICY "Users can read own journal notes"
  ON public.journal_notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journal notes" ON public.journal_notes;
CREATE POLICY "Users can insert own journal notes"
  ON public.journal_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journal notes" ON public.journal_notes;
CREATE POLICY "Users can update own journal notes"
  ON public.journal_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journal notes" ON public.journal_notes;
CREATE POLICY "Users can delete own journal notes"
  ON public.journal_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchJournalNotes } from '@/features/journal/journalAdapter';
import { JournalView } from '@/features/journal/JournalView';
import type { GameSnapshot } from '@/game/contracts';

import type { JournalNote } from '@/features/journal/contracts';

export const metadata = {
  title: 'Field Journal — Ember & Root',
  description: 'Your personal field journal. Record reflections, practices, and observations.',
};

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: snapshot } = await supabase.rpc('get_game_snapshot');
  let initialNotes: JournalNote[] = [];
  let initialError: string | null = null;

  try {
    initialNotes = await fetchJournalNotes(supabase);
  } catch (err: any) {
    initialError = err.message || 'Field Journal archive is currently unreachable.';
  }

  return (
    <div className="world-journal">
      <JournalView
        initialNotes={initialNotes}
        initialError={initialError}
        initialSnapshot={(snapshot as GameSnapshot) ?? undefined}
      />
    </div>
  );
}


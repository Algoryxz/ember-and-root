import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchJournalNotes } from '@/features/journal/journalAdapter';
import { JournalView } from '@/features/journal/JournalView';
import type { GameSnapshot } from '@/game/contracts';

export const metadata = {
  title: 'Field Journal — Ember & Root',
  description: 'Your personal field journal. Record reflections, practices, and observations.',
};

export default async function JournalPage() {
  const supabase = await createClient();
  const { data: snapshot } = await supabase.rpc('get_game_snapshot');
  const initialNotes = await fetchJournalNotes(supabase);

  return (
    <div className="world-journal">
      <JournalView
        initialNotes={initialNotes}
        initialSnapshot={(snapshot as GameSnapshot) ?? undefined}
      />
    </div>
  );
}


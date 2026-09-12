import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { HearthViewWrapper } from './HearthViewWrapper';
import type { GameSnapshot } from '@/game/contracts';

export const metadata = {
  title: 'Hearth — Ember & Root',
};

export default async function HearthPage() {
  const supabase = await createClient();
  const { data: snapshot } = await supabase.rpc('get_game_snapshot');

  return (
    <div className="space-y-6">
      <HearthViewWrapper initialSnapshot={(snapshot as GameSnapshot) ?? undefined} />
    </div>
  );
}

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { RootViewWrapper } from './RootViewWrapper';
import type { GameSnapshot } from '@/game/contracts';

export const metadata = {
  title: 'Root — Ember & Root',
};

export default async function RootPage() {
  const supabase = await createClient();
  const { data: snapshot } = await supabase.rpc('get_game_snapshot');

  return (
    <div className="space-y-6">
      <RootViewWrapper initialSnapshot={(snapshot as GameSnapshot) ?? undefined} />
    </div>
  );
}

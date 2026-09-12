import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HearthViewWrapper } from './HearthViewWrapper';
import type { GameSnapshot } from '@/game/contracts';

export const metadata = {
  title: 'Hearth — Ember & Root',
};

export default async function HearthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load authoritative GameSnapshot via PostgreSQL RPC
  const { data: snapshotData, error: snapshotError } = await supabase.rpc('get_game_snapshot');

  if (snapshotError || !snapshotData) {
    // If profile is missing onboarding timezone, redirect to /onboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .single();

    const prefs = (profile?.preferences as { onboarded?: boolean } | null) || {};
    if (!prefs.onboarded) {
      redirect('/onboard');
    }
  }

  const snapshot = snapshotData as GameSnapshot;

  return (
    <div className="space-y-6">
      <HearthViewWrapper initialSnapshot={snapshot ?? undefined} />
    </div>
  );
}

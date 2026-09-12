import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { GameSnapshot } from '@/game/contracts';
import { SatchelWrapper } from './SatchelWrapper';

export const metadata = {
  title: 'Satchel — Ember & Root',
};

export default async function SatchelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: snapshotData } = await supabase.rpc('get_game_snapshot');

  const fallbackSnapshot: GameSnapshot = {
    revision: 1,
    userId: user.id,
    totalXp: 0,
    level: 1,
    sparksBalance: 0,
    currentStreak: 0,
    longestStreak: 0,
    emberState: 'resting',
    todayXpAwarded: 0,
    branches: {
      mind: { attribute: 'mind', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
      body: { attribute: 'body', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
      will: { attribute: 'will', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
      craft: { attribute: 'craft', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
    },
    trials: {},
    equippedItemId: null,
    inventory: { items: [] },
    quests: [],
  };

  const snapshot = (snapshotData as GameSnapshot) || fallbackSnapshot;

  return (
    <div className="space-y-6">
      <SatchelWrapper initialSnapshot={snapshot} />
    </div>
  );
}


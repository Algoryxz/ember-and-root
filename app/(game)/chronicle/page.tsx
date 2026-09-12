import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { GameSnapshot, AttributeId, Effort } from '@/game/contracts';
import type { ChronicleEntry } from '@/features/chronicle';
import { ChronicleWrapper } from './ChronicleWrapper';

export const metadata = {
  title: 'Chronicle — Ember & Root',
};

export default async function ChroniclePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: snapshotData }, { data: completionsData }] = await Promise.all([
    supabase.rpc('get_game_snapshot'),
    supabase
      .from('quest_completions')
      .select('id, quest_id, quest_title_snapshot, quest_attribute_snapshot, quest_effort_snapshot, xp_awarded, sparks_awarded, local_date, completed_at')
      .order('completed_at', { ascending: false })
      .limit(50),
  ]);

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

  const entries: ChronicleEntry[] = (completionsData || []).map((c) => ({
    id: c.id,
    questId: c.quest_id,
    title: c.quest_title_snapshot,
    attribute: c.quest_attribute_snapshot as AttributeId,
    effort: (c.quest_effort_snapshot || 'standard') as Effort,
    xpAwarded: c.xp_awarded,
    sparksAwarded: c.sparks_awarded,
    localDate: c.local_date,
    completedAt: c.completed_at,
  }));

  return (
    <div className="space-y-6">
      <ChronicleWrapper initialSnapshot={snapshot} entries={entries} />
    </div>
  );
}


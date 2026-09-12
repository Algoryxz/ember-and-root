import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { GameSnapshot } from '@/game/contracts';
import { HearthClient } from './HearthClient';

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

  // Query today's completed quest IDs
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .single();

  const userTimezone = profile?.timezone || 'UTC';
  let todayLocalDate = new Date().toISOString().split('T')[0];
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone });
    todayLocalDate = formatter.format(new Date());
  } catch {
    todayLocalDate = new Date().toISOString().split('T')[0];
  }

  const { data: todayCompletions } = await supabase
    .from('quest_completions')
    .select('quest_id')
    .eq('local_date', todayLocalDate);

  const completedQuestIds = (todayCompletions || []).map((c) => c.quest_id);

  return (
    <HearthClient
      initialSnapshot={snapshot}
      todayCompletedQuestIds={completedQuestIds}
    />
  );
}

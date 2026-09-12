import { describe, it, expect } from 'vitest';
import type { GameSnapshot } from '@/game/contracts';
import type { ChronicleEntry } from '@/features/chronicle/contracts';
import { deriveAchievements } from '@/features/chronicle/chronicleAdapter';

const mockSnapshot: GameSnapshot = {
  revision: 1,
  userId: '00000000-0000-0000-0000-000000000001',
  totalXp: 120,
  level: 2,
  sparksBalance: 24,
  currentStreak: 2,
  longestStreak: 4,
  emberState: 'steady',
  todayXpAwarded: 40,
  branches: {
    mind: { attribute: 'mind', xp: 90, specialization: 'scholar', selectedAt: '2026-09-12T10:00:00Z', sproutAvailable: true, specializationAvailable: true, crestAvailable: false, trialStarted: true, trialComplete: false, crestClaimed: false },
    body: { attribute: 'body', xp: 30, specialization: null, selectedAt: null, sproutAvailable: true, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
    will: { attribute: 'will', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
    craft: { attribute: 'craft', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
  },
  trials: {},
  equippedItemId: null,
  inventory: { items: [] },
  quests: [],
};

const mockEntries: ChronicleEntry[] = [
  {
    id: 'comp-1',
    questId: 'q-1',
    title: 'Morning reflection',
    attribute: 'mind',
    effort: 'quick',
    xpAwarded: 10,
    sparksAwarded: 2,
    localDate: '2026-09-08',
    completedAt: '2026-09-08T08:00:00Z',
  },
  {
    id: 'comp-2',
    questId: 'q-2',
    title: 'Study architecture patterns',
    attribute: 'mind',
    effort: 'deep',
    xpAwarded: 35,
    sparksAwarded: 7,
    localDate: '2026-09-12', // 4-day gap from 09-08 -> triggers Returned achievement
    completedAt: '2026-09-12T09:30:00Z',
  },
];

describe('Chronicle Derived Achievements Logic', () => {
  it('unlocks First Light when at least one quest completion exists', () => {
    const achievements = deriveAchievements(mockSnapshot, mockEntries);
    const firstLight = achievements.find((a) => a.id === 'first_light');

    expect(firstLight?.unlocked).toBe(true);
    expect(firstLight?.unlockedAt).toBe('2026-09-08T08:00:00Z');
  });

  it('keeps First Light locked when completion history is empty', () => {
    const achievements = deriveAchievements(mockSnapshot, []);
    const firstLight = achievements.find((a) => a.id === 'first_light');

    expect(firstLight?.unlocked).toBe(false);
    expect(firstLight?.unlockedAt).toBeNull();
  });

  it('unlocks A Chosen Path when any branch has selected a specialization', () => {
    const achievements = deriveAchievements(mockSnapshot, mockEntries);
    const chosenPath = achievements.find((a) => a.id === 'chosen_path');

    expect(chosenPath?.unlocked).toBe(true);
    expect(chosenPath?.unlockedAt).toBe('2026-09-12T10:00:00Z');
  });

  it('unlocks Returned when completions history contains a date gap >= 2 days', () => {
    const achievements = deriveAchievements(mockSnapshot, mockEntries);
    const returned = achievements.find((a) => a.id === 'returned');

    expect(returned?.unlocked).toBe(true);
    expect(returned?.unlockedAt).toBe('2026-09-12T09:30:00Z');
  });
});

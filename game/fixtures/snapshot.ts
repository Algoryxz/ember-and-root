import type { GameSnapshot } from '../contracts';

/**
 * Deterministic demo snapshot fixture.
 * 
 * Represents the prepared demo state prior to completing the demonstration quest:
 * - Revision: 12
 * - Total XP: 90 (Level 1, threshold to Level 2 is 100)
 * - Sparks Balance: 18
 * - Branches: Mind (70 XP), Body (20 XP), Will (0 XP), Craft (0 XP)
 * - Active demo quest: "Finish Java recursion practice" (Mind, Standard, Daily)
 * 
 * Used by frontend feature teams (Deeptiman, Akriti, Susmita) as the canonical UI fixture.
 */
export const DEMO_SNAPSHOT: GameSnapshot = {
  revision: 12,
  userId: 'fixture-user-id',
  totalXp: 90,
  level: 1,
  sparksBalance: 18,
  currentStreak: 3,
  longestStreak: 7,
  emberState: 'resting',
  todayXpAwarded: 0,
  branches: {
    mind: {
      attribute: 'mind',
      xp: 70,
      specialization: null,
      selectedAt: null,
      sproutAvailable: true,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 20,
      specialization: null,
      selectedAt: null,
      sproutAvailable: true,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 0,
      specialization: null,
      selectedAt: null,
      sproutAvailable: false,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 0,
      specialization: null,
      selectedAt: null,
      sproutAvailable: false,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
  },
  trials: {},
  equippedItemId: null,
  inventory: {
    items: [],
  },
  quests: [
    {
      id: 'q-fixture-1',
      userId: 'fixture-user-id',
      title: 'Finish Java recursion practice',
      attribute: 'mind',
      effort: 'standard',
      cadence: 'daily',
      trialId: null,
      version: 1,
      deletedAt: null,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
    {
      id: 'q-fixture-2',
      userId: 'fixture-user-id',
      title: '30-minute run',
      attribute: 'body',
      effort: 'quick',
      cadence: 'daily',
      trialId: null,
      version: 1,
      deletedAt: null,
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
    },
  ],
};

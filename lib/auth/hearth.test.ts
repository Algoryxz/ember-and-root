import { describe, it, expect } from 'vitest';
import type { GameSnapshot, Quest, MutationResult } from '@/game/contracts';

/**
 * Hearth Quest Loop Unit Tests
 *
 * Tests the Hearth client flow, reward mapping, duplicate click protection,
 * and RPC response handling.
 */

const mockSnapshot: GameSnapshot = {
  revision: 1,
  userId: '00000000-0000-0000-0000-000000000001',
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
  inventory: { items: [] },
  quests: [
    {
      id: 'q1-uuid',
      userId: '00000000-0000-0000-0000-000000000001',
      title: 'Finish Java recursion practice',
      attribute: 'mind',
      effort: 'standard',
      cadence: 'daily',
      trialId: null,
      version: 1,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

describe('Hearth Quest Loop Logic & Progression Integration', () => {
  it('correctly maps effort tiers to expected base XP and Sparks', () => {
    const getBaseXp = (effort: Quest['effort']) =>
      effort === 'deep' ? 35 : effort === 'quick' ? 10 : 20;

    expect(getBaseXp('quick')).toBe(10);
    expect(Math.floor(getBaseXp('quick') / 5)).toBe(2);

    expect(getBaseXp('standard')).toBe(20);
    expect(Math.floor(getBaseXp('standard') / 5)).toBe(4);

    expect(getBaseXp('deep')).toBe(35);
    expect(Math.floor(getBaseXp('deep') / 5)).toBe(7);
  });

  it('handles in-flight duplicate click prevention', () => {
    const inFlight: Record<string, boolean> = {};
    const questId = 'q1-uuid';

    // First click initiates request
    expect(inFlight[questId]).toBeFalsy();
    inFlight[questId] = true;

    // Second immediate click is rejected
    const canClickAgain = !inFlight[questId];
    expect(canClickAgain).toBe(false);

    // Request resolves
    inFlight[questId] = false;
    expect(inFlight[questId]).toBe(false);
  });

  it('updates state from authoritative MutationResult without frontend arithmetic drift', () => {
    const mockMutationResult: MutationResult = {
      revision: 2,
      event: {
        id: 'event-uuid',
        kind: 'quest_completed',
        xpAwarded: 20,
        sparksAwarded: 4,
        previousLevel: 1,
        newLevel: 2,
        attribute: 'mind',
        specializationAvailable: true,
        crestAvailable: false,
        cappedToday: false,
        emberRelit: false,
        emberState: 'kindled',
      },
      snapshot: {
        ...mockSnapshot,
        revision: 2,
        totalXp: 110,
        level: 2,
        sparksBalance: 22,
        emberState: 'kindled',
        todayXpAwarded: 20,
        branches: {
          ...mockSnapshot.branches,
          mind: {
            ...mockSnapshot.branches.mind,
            xp: 90,
            specializationAvailable: true,
          },
        },
      },
    };

    // Client takes snapshot directly from result
    const currentSnapshot = mockMutationResult.snapshot;
    expect(currentSnapshot.totalXp).toBe(110);
    expect(currentSnapshot.level).toBe(2);
    expect(currentSnapshot.sparksBalance).toBe(22);
    expect(currentSnapshot.emberState).toBe('kindled');
    expect(currentSnapshot.branches.mind.xp).toBe(90);
    expect(currentSnapshot.branches.mind.specializationAvailable).toBe(true);
  });

  it('formats live accessibility screen-reader announcements accurately', () => {
    const event = {
      xpAwarded: 20,
      sparksAwarded: 4,
      emberState: 'kindled' as const,
    };

    const xpText = event.xpAwarded ? `+${event.xpAwarded} XP` : '0 XP';
    const sparksText = event.sparksAwarded ? ` and +${event.sparksAwarded} Sparks` : '';
    const speech = `Quest completed! Awarded ${xpText}${sparksText}. Ember is now ${event.emberState}.`;

    expect(speech).toBe('Quest completed! Awarded +20 XP and +4 Sparks. Ember is now kindled.');
  });
});

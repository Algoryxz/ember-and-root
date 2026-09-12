import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { GameSnapshot } from '../../game/contracts';
import {
  chooseSpecializationAction,
  startTrialAction,
  progressSessionTrialAction,
  recordMilestoneAction,
  claimCrestAction,
} from './trialAdapter';
import {
  progressSessionTrialFixtureAdapter,
  recordMilestoneFixtureAdapter,
  claimCrestFixtureAdapter,
} from './trialFixtureAdapter';
import { INITIAL_TREE_STATE } from './fixtures';

const DEMO_SNAPSHOT: GameSnapshot = {
  revision: 1,
  userId: 'user-test',
  totalXp: 160,
  level: 2,
  sparksBalance: 20,
  currentStreak: 1,
  longestStreak: 1,
  emberState: 'kindled',
  todayXpAwarded: 20,
  branches: {
    ...INITIAL_TREE_STATE.branches,
    mind: {
      ...INITIAL_TREE_STATE.branches.mind,
      xp: 160,
      specialization: 'scholar',
      trialStarted: true,
      trialComplete: false,
      crestAvailable: false,
      crestClaimed: false,
    },
    body: {
      ...INITIAL_TREE_STATE.branches.body,
      xp: 80, // Under 160 XP
      specialization: 'mobility',
      trialStarted: true,
      trialComplete: false,
      crestAvailable: false,
      crestClaimed: false,
    },
  },
  trials: {
    mind: {
      id: 'trial-mind-scholar-1',
      attribute: 'mind',
      specialization: 'scholar',
      kind: 'distinct_days',
      requiredDays: 5,
      distinctDaysCompleted: 4,
      startedAt: '2026-09-12T00:00:00.000Z',
      completedAt: null,
      claimedAt: null,
    },
    body: {
      id: 'trial-body-mobility-1',
      attribute: 'body',
      specialization: 'mobility',
      kind: 'milestone_reflection',
      startedAt: '2026-09-12T00:00:00.000Z',
      completedAt: null,
      claimedAt: null,
    },
  },
  equippedItemId: null,
  inventory: { items: [] },
};

describe('Root Trial Adapters — Integration & Contract Verification', () => {
  describe('Production trialAdapter RPC Dispatch & Error Surfacing', () => {
    it('rejects unauthenticated/missing Supabase client without silent fallback', async () => {
      await assert.rejects(
        async () => {
          await chooseSpecializationAction(DEMO_SNAPSHOT, 'mind', 'scholar', null);
        },
        {
          name: 'Error',
          message: /authoritative database client/i,
        }
      );
    });

    it('surfaces database RPC error without mutating snapshot or pretending success', async () => {
      const failingMockClient = {
        rpc: async (_fn: string, _params: any) => {
          return {
            data: null,
            error: { message: 'database transaction aborted by security policy' },
          };
        },
      };

      await assert.rejects(
        async () => {
          await startTrialAction(DEMO_SNAPSHOT, 'mind', 'scholar', failingMockClient);
        },
        {
          name: 'Error',
          message: /database transaction aborted by security policy/i,
        }
      );
    });

    it('dispatches to dedicated trial RPCs and never calls complete_quest', async () => {
      const calls: { fn: string; params: any }[] = [];
      const mockClient = {
        rpc: async (fn: string, params: any) => {
          calls.push({ fn, params });
          return {
            data: {
              revision: 2,
              event: { id: 'evt-test', kind: 'trial_progressed' },
              snapshot: DEMO_SNAPSHOT,
            },
            error: null,
          };
        },
      };

      await progressSessionTrialAction(DEMO_SNAPSHOT, 'mind', mockClient);
      assert.equal(calls[0].fn, 'progress_trial');
      assert.notEqual(calls[0].fn, 'complete_quest');

      await recordMilestoneAction(DEMO_SNAPSHOT, 'body', 'Ran a 10k race', mockClient);
      assert.equal(calls[1].fn, 'record_trial_milestone');
      assert.notEqual(calls[1].fn, 'complete_quest');

      await claimCrestAction(DEMO_SNAPSHOT, 'mind', mockClient);
      assert.equal(calls[2].fn, 'claim_trial');
    });
  });

  describe('Fixture & Mock Adapter Contract Integrity', () => {
    it('sets crestAvailable: true ONLY when branch.xp >= 160 and trial is complete', () => {
      // 1. Mind branch has 160 XP: Completing trial SHOULD make crest available
      const mindResult = progressSessionTrialFixtureAdapter(DEMO_SNAPSHOT, 'mind');
      assert.equal(mindResult.snapshot.branches.mind.trialComplete, true);
      assert.equal(mindResult.snapshot.branches.mind.crestAvailable, true);

      // 2. Body branch has only 80 XP: Completing trial must NOT make crest available
      const bodyResult = recordMilestoneFixtureAdapter(DEMO_SNAPSHOT, 'body', 'Ran a 10k race');
      assert.equal(bodyResult.snapshot.branches.body.trialComplete, true);
      assert.equal(bodyResult.snapshot.branches.body.crestAvailable, false); // Blocked because xp < 160!
    });

    it('clears crestAvailable and sets crestClaimed upon claiming', () => {
      const readySnapshot: GameSnapshot = {
        ...DEMO_SNAPSHOT,
        branches: {
          ...DEMO_SNAPSHOT.branches,
          mind: {
            ...DEMO_SNAPSHOT.branches.mind,
            crestAvailable: true,
            crestClaimed: false,
          },
        },
      };

      const result = claimCrestFixtureAdapter(readySnapshot, 'mind');
      assert.equal(result.snapshot.branches.mind.crestAvailable, false);
      assert.equal(result.snapshot.branches.mind.crestClaimed, true);
      assert.ok(result.snapshot.trials.mind?.claimedAt);
    });
  });
});

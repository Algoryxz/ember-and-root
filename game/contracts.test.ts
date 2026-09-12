import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SPECIALIZATIONS_BY_ATTRIBUTE } from './contracts.ts';
import type { AttributeId, TrialState, BranchState } from './contracts.ts';
import { DEMO_SNAPSHOT } from './fixtures/snapshot.ts';
import { crestAvailable, canonicalCompleteQuestPayload } from './progression.ts';

describe('Ember & Root — Shared Contracts & Fixtures', () => {
  describe('Canonical Identifier System', () => {
    it('enforces exact canonical attribute IDs', () => {
      const canonicalAttrs: AttributeId[] = ['mind', 'body', 'will', 'craft'];
      assert.strictEqual(canonicalAttrs.length, 4);
      assert.deepStrictEqual(Object.keys(SPECIALIZATIONS_BY_ATTRIBUTE), canonicalAttrs);
    });

    it('maps mind to scholar and explorer', () => {
      assert.deepStrictEqual(SPECIALIZATIONS_BY_ATTRIBUTE.mind, ['scholar', 'explorer']);
    });

    it('maps body to endurance and mobility', () => {
      assert.deepStrictEqual(SPECIALIZATIONS_BY_ATTRIBUTE.body, ['endurance', 'mobility']);
    });

    it('maps will to focus and courage', () => {
      assert.deepStrictEqual(SPECIALIZATIONS_BY_ATTRIBUTE.will, ['focus', 'courage']);
    });

    it('maps craft to builder and artisan', () => {
      assert.deepStrictEqual(SPECIALIZATIONS_BY_ATTRIBUTE.craft, ['builder', 'artisan']);
    });
  });

  describe('TrialState Contract Shape', () => {
    it('adheres to distinct_days TrialState schema', () => {
      const distinctDaysTrial: TrialState = {
        id: 'trial-scholar-1',
        attribute: 'mind',
        specialization: 'scholar',
        startedAt: '2026-09-12T00:00:00.000Z',
        kind: 'distinct_days',
        requiredDays: 5,
        distinctDaysCompleted: 5,
        completedAt: '2026-09-17T12:00:00.000Z',
        claimedAt: null,
      };

      assert.strictEqual(distinctDaysTrial.kind, 'distinct_days');
      assert.strictEqual(distinctDaysTrial.requiredDays, 5);
      assert.strictEqual(distinctDaysTrial.distinctDaysCompleted, 5);
      assert.ok(distinctDaysTrial.completedAt !== null);
      assert.strictEqual(distinctDaysTrial.claimedAt, null);
    });

    it('adheres to milestone_reflection TrialState schema', () => {
      const milestoneTrial: TrialState = {
        id: 'trial-courage-1',
        attribute: 'will',
        specialization: 'courage',
        startedAt: '2026-09-12T00:00:00.000Z',
        kind: 'milestone_reflection',
        milestoneText: 'Completed public presentation',
        completedAt: '2026-09-13T10:00:00.000Z',
        claimedAt: '2026-09-13T10:05:00.000Z',
      };

      assert.strictEqual(milestoneTrial.kind, 'milestone_reflection');
      assert.strictEqual(milestoneTrial.milestoneText, 'Completed public presentation');
      assert.ok(milestoneTrial.completedAt !== null);
      assert.ok(milestoneTrial.claimedAt !== null);
    });
  });

  describe('Branch & Crest State Transitions', () => {
    it('verifies crest availability before vs after claim', () => {
      const branch: BranchState = {
        attribute: 'mind',
        xp: 160,
        specialization: 'scholar',
        selectedAt: '2026-09-12T00:00:00.000Z',
        sproutAvailable: true,
        specializationAvailable: false,
        crestAvailable: true,
        trialStarted: true,
        trialComplete: true,
        crestClaimed: false,
      };

      const unclaimedTrial = {
        completedAt: '2026-09-15T00:00:00.000Z',
        claimedAt: null,
      };

      // Before claim: crest is available
      assert.strictEqual(crestAvailable(branch, unclaimedTrial), true);

      // After claim: crest is no longer available, and crestClaimed is true
      const claimedTrial = {
        completedAt: '2026-09-15T00:00:00.000Z',
        claimedAt: '2026-09-15T00:05:00.000Z',
      };
      assert.strictEqual(crestAvailable(branch, claimedTrial), false);
    });
  });

  describe('Idempotency Payload Normalization', () => {
    it('normalizes null or undefined expectedOccurrence', () => {
      const p1 = canonicalCompleteQuestPayload('q-1');
      const p2 = canonicalCompleteQuestPayload('q-1', null);
      assert.strictEqual(p1, p2);
      assert.strictEqual(p1, JSON.stringify({ questId: 'q-1', expectedOccurrence: '' }));
    });
  });

  describe('Demo Snapshot Fixture Contract', () => {
    it('satisfies the prepared demo state specifications', () => {
      assert.strictEqual(DEMO_SNAPSHOT.revision, 12);
      assert.strictEqual(DEMO_SNAPSHOT.totalXp, 90);
      assert.strictEqual(DEMO_SNAPSHOT.level, 1);
      assert.strictEqual(DEMO_SNAPSHOT.sparksBalance, 18);
      assert.strictEqual(DEMO_SNAPSHOT.currentStreak, 3);
      assert.strictEqual(DEMO_SNAPSHOT.longestStreak, 7);
      assert.strictEqual(DEMO_SNAPSHOT.emberState, 'resting');

      // Branches
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.xp, 70);
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.specialization, null);
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.sproutAvailable, true);
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.specializationAvailable, false);
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.trialStarted, false);
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.trialComplete, false);
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.crestAvailable, false);
      assert.strictEqual(DEMO_SNAPSHOT.branches.mind.crestClaimed, false);

      assert.strictEqual(DEMO_SNAPSHOT.branches.body.xp, 20);
      assert.strictEqual(DEMO_SNAPSHOT.branches.body.specialization, null);
      assert.strictEqual(DEMO_SNAPSHOT.branches.body.sproutAvailable, true);

      assert.strictEqual(DEMO_SNAPSHOT.branches.will.xp, 0);
      assert.strictEqual(DEMO_SNAPSHOT.branches.will.specialization, null);
      assert.strictEqual(DEMO_SNAPSHOT.branches.will.sproutAvailable, false);

      assert.strictEqual(DEMO_SNAPSHOT.branches.craft.xp, 0);
      assert.strictEqual(DEMO_SNAPSHOT.branches.craft.specialization, null);
      assert.strictEqual(DEMO_SNAPSHOT.branches.craft.sproutAvailable, false);

      // Quests
      assert.ok(DEMO_SNAPSHOT.quests != null && DEMO_SNAPSHOT.quests.length > 0);
      const demoQuest = DEMO_SNAPSHOT.quests.find(
        (q) => q.title === 'Finish Java recursion practice'
      );
      assert.ok(demoQuest, 'Demo quest must be present');
      assert.strictEqual(demoQuest.attribute, 'mind');
      assert.strictEqual(demoQuest.effort, 'standard');
      assert.strictEqual(demoQuest.currentOccurrenceKey, '2026-09-12');
      assert.strictEqual(demoQuest.completedForCurrentOccurrence, false);

      for (const q of DEMO_SNAPSHOT.quests) {
        assert.ok(typeof q.currentOccurrenceKey === 'string' && q.currentOccurrenceKey.length > 0,
          'Every HearthQuest must contain a non-empty currentOccurrenceKey');
        assert.strictEqual(typeof q.completedForCurrentOccurrence, 'boolean',
          'Every HearthQuest must contain a boolean completedForCurrentOccurrence');
      }
    });
  });
});

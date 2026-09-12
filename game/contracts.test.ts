import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SPECIALIZATIONS_BY_ATTRIBUTE } from './contracts.ts';
import { DEMO_SNAPSHOT } from './fixtures/snapshot.ts';

describe('Ember & Root — Shared Contracts & Fixtures', () => {
  describe('Canonical Specialization Mapping', () => {
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
    });
  });
});

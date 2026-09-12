import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  xpForEffort,
  sparksForXp,
  xpRequiredForNextLevel,
  cumulativeXpForLevel,
  levelFromTotalXp,
  attributeXpRequiredForNextRank,
  cumulativeAttributeXpForRank,
  attributeRankFromXp,
  emberStateFromTodayCompletionCount,
  specializationAvailable,
  crestAvailable,
  updateStreak,
  DAILY_XP_CAP,
} from './progression.ts';

describe('Ember & Root — Progression Reference Math', () => {
  describe('Effort to XP', () => {
    it('awards correct base XP for each effort tier', () => {
      assert.strictEqual(xpForEffort('quick'), 10);
      assert.strictEqual(xpForEffort('standard'), 20);
      assert.strictEqual(xpForEffort('deep'), 35);
    });
  });

  describe('XP to Sparks', () => {
    it('awards sparks at 1 spark per 5 XP using integer semantics', () => {
      assert.strictEqual(sparksForXp(0), 0);
      assert.strictEqual(sparksForXp(9), 1);
      assert.strictEqual(sparksForXp(10), 2);
      assert.strictEqual(sparksForXp(20), 4);
      assert.strictEqual(sparksForXp(35), 7);
      assert.strictEqual(sparksForXp(140), 28);
    });
  });

  describe('Character Level Boundaries', () => {
    it('computes cumulative XP required for each level', () => {
      assert.strictEqual(cumulativeXpForLevel(1), 0);
      assert.strictEqual(cumulativeXpForLevel(2), 100);
      assert.strictEqual(cumulativeXpForLevel(3), 250);
      assert.strictEqual(cumulativeXpForLevel(4), 450);
      assert.strictEqual(cumulativeXpForLevel(5), 700);
    });

    it('computes XP required for next level', () => {
      assert.strictEqual(xpRequiredForNextLevel(1), 100);
      assert.strictEqual(xpRequiredForNextLevel(2), 150);
      assert.strictEqual(xpRequiredForNextLevel(3), 200);
      assert.strictEqual(xpRequiredForNextLevel(4), 250);
    });

    it('determines correct character level at progression boundary thresholds', () => {
      assert.strictEqual(levelFromTotalXp(0), 1);
      assert.strictEqual(levelFromTotalXp(99), 1);
      assert.strictEqual(levelFromTotalXp(100), 2);
      assert.strictEqual(levelFromTotalXp(249), 2);
      assert.strictEqual(levelFromTotalXp(250), 3);
      assert.strictEqual(levelFromTotalXp(449), 3);
      assert.strictEqual(levelFromTotalXp(450), 4);
    });
  });

  describe('Attribute Rank Boundaries', () => {
    it('computes cumulative attribute XP for rank', () => {
      assert.strictEqual(cumulativeAttributeXpForRank(1), 0);
      assert.strictEqual(cumulativeAttributeXpForRank(2), 80);
      assert.strictEqual(cumulativeAttributeXpForRank(3), 200);
      assert.strictEqual(cumulativeAttributeXpForRank(4), 360);
    });

    it('computes attribute XP required for next rank', () => {
      assert.strictEqual(attributeXpRequiredForNextRank(1), 80);
      assert.strictEqual(attributeXpRequiredForNextRank(2), 120);
      assert.strictEqual(attributeXpRequiredForNextRank(3), 160);
    });

    it('determines correct attribute rank at progression boundary thresholds', () => {
      assert.strictEqual(attributeRankFromXp(0), 1);
      assert.strictEqual(attributeRankFromXp(79), 1);
      assert.strictEqual(attributeRankFromXp(80), 2);
      assert.strictEqual(attributeRankFromXp(199), 2);
      assert.strictEqual(attributeRankFromXp(200), 3);
    });
  });

  describe('Ember State Derivation', () => {
    it('maps daily quest completion counts to Ember state', () => {
      assert.strictEqual(emberStateFromTodayCompletionCount(0), 'resting');
      assert.strictEqual(emberStateFromTodayCompletionCount(1), 'kindled');
      assert.strictEqual(emberStateFromTodayCompletionCount(2), 'steady');
      assert.strictEqual(emberStateFromTodayCompletionCount(3), 'bright');
      assert.strictEqual(emberStateFromTodayCompletionCount(10), 'bright');
    });
  });

  describe('Specialization Availability', () => {
    it('evaluates specialization eligibility at 80 XP boundary', () => {
      assert.strictEqual(specializationAvailable({ xp: 79, specialization: null }), false);
      assert.strictEqual(specializationAvailable({ xp: 80, specialization: null }), true);
      assert.strictEqual(specializationAvailable({ xp: 80, specialization: 'scholar' }), false);
      assert.strictEqual(specializationAvailable({ xp: 120, specialization: 'explorer' }), false);
    });
  });

  describe('Crest Availability', () => {
    it('requires 160 XP and completed, unclaimed Trial', () => {
      // Under 160 XP
      assert.strictEqual(crestAvailable({ xp: 159 }, { isComplete: true }), false);

      // 160 XP with incomplete trial
      assert.strictEqual(crestAvailable({ xp: 160 }, { isComplete: false }), false);

      // 160 XP with complete trial, unclaimed
      assert.strictEqual(crestAvailable({ xp: 160 }, { isComplete: true }), true);
      assert.strictEqual(
        crestAvailable({ xp: 160 }, { isComplete: true, claimedAt: null }),
        true
      );

      // Already claimed crest/trial
      assert.strictEqual(
        crestAvailable(
          { xp: 160 },
          { isComplete: true, claimedAt: '2026-09-12T00:00:00Z' }
        ),
        false
      );

      // Distinct days trial evaluator
      assert.strictEqual(
        crestAvailable(
          { xp: 160 },
          { distinctDaysCompleted: 4, requiredDays: 5, claimedAt: null }
        ),
        false
      );
      assert.strictEqual(
        crestAvailable(
          { xp: 160 },
          { distinctDaysCompleted: 5, requiredDays: 5, claimedAt: null }
        ),
        true
      );
    });
  });

  describe('Streak Rules', () => {
    it('sets streak to 1 on very first activity', () => {
      const res = updateStreak(0, 0, null, '2026-09-12');
      assert.strictEqual(res.currentStreak, 1);
      assert.strictEqual(res.longestStreak, 1);
      assert.strictEqual(res.emberRelit, false);
    });

    it('retains streak on same calendar date without incrementing', () => {
      const res = updateStreak(3, 5, '2026-09-12', '2026-09-12');
      assert.strictEqual(res.currentStreak, 3);
      assert.strictEqual(res.longestStreak, 5);
      assert.strictEqual(res.emberRelit, false);
    });

    it('increments streak on consecutive calendar date and updates longest', () => {
      const res = updateStreak(3, 3, '2026-09-11', '2026-09-12');
      assert.strictEqual(res.currentStreak, 4);
      assert.strictEqual(res.longestStreak, 4);
      assert.strictEqual(res.emberRelit, false);
    });

    it('resets current streak to 1 and flags emberRelit after missed date while preserving longest', () => {
      const res = updateStreak(5, 10, '2026-09-09', '2026-09-12');
      assert.strictEqual(res.currentStreak, 1);
      assert.strictEqual(res.longestStreak, 10);
      assert.strictEqual(res.emberRelit, true);
    });
  });

  describe('Daily XP Cap Constant', () => {
    it('is exactly 140 XP per local day', () => {
      assert.strictEqual(DAILY_XP_CAP, 140);
    });
  });
});

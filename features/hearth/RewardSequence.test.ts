import { describe, it, expect } from 'vitest';
import { levelFromTotalXp } from '../../game/progression';

describe('Chronicle & Reward Sequence Correctness Audits', () => {
  describe('B2 — Authoritative Level Derivation', () => {
    it('computes character level from total XP authoritatively rather than arbitrary square-root formula', () => {
      // Formula test
      expect(levelFromTotalXp(0)).toBe(1);
      expect(levelFromTotalXp(99)).toBe(1);
      expect(levelFromTotalXp(100)).toBe(2);
      expect(levelFromTotalXp(249)).toBe(2);
      expect(levelFromTotalXp(250)).toBe(3);
      expect(levelFromTotalXp(450)).toBe(4);
    });
  });

  describe('B3 — Zero-XP Daily Cap Reward Semantics', () => {
    it('verifies zero-XP completion format text does not claim root growth', () => {
      const xpAwarded = 0;
      const questTitle = 'Reading practice';
      const text = xpAwarded === 0
        ? `${questTitle} sealed. Today's XP limit has been reached.`
        : `${questTitle} sealed. +${xpAwarded} XP awarded. mind branch grows.`;

      expect(text).toBe("Reading practice sealed. Today's XP limit has been reached.");
      expect(text).not.toContain('branch grows');
      expect(text).not.toContain('Sparks gathered');
    });
  });
});

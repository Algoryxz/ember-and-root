import { describe, it, expect } from 'vitest';

/**
 * Economy & Streak Math Reference Functions
 * Mirrors PostgreSQL RPC progression rules in 20260913131000_satchel_v2_economy.sql
 */

interface ProfileState {
  sparksBalance: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

interface ItemDefinition {
  id: string;
  name: string;
  price: number;
  category: 'cosmetic' | 'relic';
}

function evaluatePurchase(
  profile: ProfileState,
  item: ItemDefinition,
  inventory: string[]
): {
  success: boolean;
  error?: string;
  newBalance?: number;
  ledgerDebit?: number;
  newInventory?: string[];
} {
  if (inventory.includes(item.id)) {
    return { success: false, error: `Item is already owned: ${item.id}` };
  }
  if (profile.sparksBalance < item.price) {
    return {
      success: false,
      error: `Insufficient Sparks balance. Required: ${item.price}, Available: ${profile.sparksBalance}`,
    };
  }
  return {
    success: true,
    newBalance: profile.sparksBalance - item.price,
    ledgerDebit: -item.price,
    newInventory: [...inventory, item.id],
  };
}

function evaluateStreakWithRelic(
  lastActivityDate: string | null,
  currentLocalDate: string,
  currentStreak: number,
  longestStreak: number,
  inventory: string[]
): {
  newStreak: number;
  newLongest: number;
  emberRelit: boolean;
  wardConsumed: boolean;
  remainingInventory: string[];
} {
  if (!lastActivityDate) {
    return {
      newStreak: 1,
      newLongest: Math.max(longestStreak, 1),
      emberRelit: false,
      wardConsumed: false,
      remainingInventory: [...inventory],
    };
  }

  const last = new Date(lastActivityDate);
  const curr = new Date(currentLocalDate);
  const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day: streak unchanged
    return {
      newStreak: currentStreak,
      newLongest: Math.max(longestStreak, currentStreak),
      emberRelit: false,
      wardConsumed: false,
      remainingInventory: [...inventory],
    };
  }

  if (diffDays === 1) {
    // Consecutive day: regular streak increment
    const nextStreak = currentStreak + 1;
    return {
      newStreak: nextStreak,
      newLongest: Math.max(longestStreak, nextStreak),
      emberRelit: false,
      wardConsumed: false,
      remainingInventory: [...inventory],
    };
  }

  if (diffDays === 2 && inventory.includes('ember_ward')) {
    // Exactly 1 missed day + Ember Ward present:
    // Consume ward, shield streak!
    const nextStreak = currentStreak + 1;
    return {
      newStreak: nextStreak,
      newLongest: Math.max(longestStreak, nextStreak),
      emberRelit: false,
      wardConsumed: true,
      remainingInventory: inventory.filter((i) => i !== 'ember_ward'),
    };
  }

  // Gap >= 1 missed day without ward (or gap >= 2 missed days)
  return {
    newStreak: 1,
    newLongest: Math.max(longestStreak, 1),
    emberRelit: true,
    wardConsumed: false,
    remainingInventory: [...inventory],
  };
}

describe('Satchel V2 — Real Economy & Ledger Invariants', () => {
  const items: Record<string, ItemDefinition> = {
    copper_halo: { id: 'copper_halo', name: 'Copper Halo', price: 20, category: 'cosmetic' },
    firefly_orbit: { id: 'firefly_orbit', name: 'Firefly Orbit', price: 40, category: 'cosmetic' },
    engraved_basin: { id: 'engraved_basin', name: 'Engraved Basin', price: 60, category: 'cosmetic' },
    ember_ward: { id: 'ember_ward', name: 'Ember Ward', price: 50, category: 'relic' },
  };

  describe('Purchase Math & Currency Ledger', () => {
    it('allows purchasing affordable item and records exact negative ledger debit', () => {
      const profile: ProfileState = {
        sparksBalance: 25,
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: '2026-09-12',
      };

      const res = evaluatePurchase(profile, items.copper_halo, []);
      expect(res.success).toBe(true);
      expect(res.newBalance).toBe(5);
      expect(res.ledgerDebit).toBe(-20);
      expect(res.newInventory).toContain('copper_halo');
    });

    it('rejects purchase when sparks balance is insufficient and preserves balance', () => {
      const profile: ProfileState = {
        sparksBalance: 5,
        currentStreak: 3,
        longestStreak: 5,
        lastActivityDate: '2026-09-12',
      };

      const res = evaluatePurchase(profile, items.firefly_orbit, ['copper_halo']);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Insufficient Sparks balance');
      expect(res.newBalance).toBeUndefined();
    });

    it('rejects duplicate purchase for already owned item', () => {
      const profile: ProfileState = {
        sparksBalance: 100,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: '2026-09-12',
      };

      const res = evaluatePurchase(profile, items.copper_halo, ['copper_halo']);
      expect(res.success).toBe(false);
      expect(res.error).toContain('already owned');
    });

    it('maintains strict balance invariant: sparksBalance >= 0', () => {
      const profile: ProfileState = {
        sparksBalance: 20,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: '2026-09-12',
      };

      const res = evaluatePurchase(profile, items.copper_halo, []);
      expect(res.success).toBe(true);
      expect(res.newBalance).toBe(0);
      expect(res.newBalance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bounded Relic — Ember Ward Streak Shield', () => {
    it('consumes Ember Ward on 1 missed day and preserves streak increment', () => {
      // User last completed a quest on 2026-09-10. Today is 2026-09-12 (missed 2026-09-11).
      const res = evaluateStreakWithRelic(
        '2026-09-10',
        '2026-09-12',
        5,
        10,
        ['ember_ward', 'copper_halo']
      );

      expect(res.wardConsumed).toBe(true);
      expect(res.newStreak).toBe(6);
      expect(res.newLongest).toBe(10);
      expect(res.emberRelit).toBe(false);
      expect(res.remainingInventory).not.toContain('ember_ward');
      expect(res.remainingInventory).toContain('copper_halo');
    });

    it('resets streak to 1 if user missed 1 day without Ember Ward', () => {
      const res = evaluateStreakWithRelic(
        '2026-09-10',
        '2026-09-12',
        5,
        10,
        ['copper_halo'] // no ember_ward
      );

      expect(res.wardConsumed).toBe(false);
      expect(res.newStreak).toBe(1);
      expect(res.emberRelit).toBe(true);
    });

    it('resets streak if gap is 2 or more missed days even if holding Ember Ward', () => {
      // User last completed a quest on 2026-09-09. Today is 2026-09-12 (missed 2 days: 10th and 11th).
      const res = evaluateStreakWithRelic(
        '2026-09-09',
        '2026-09-12',
        5,
        10,
        ['ember_ward']
      );

      expect(res.wardConsumed).toBe(false);
      expect(res.newStreak).toBe(1);
      expect(res.emberRelit).toBe(true);
      // Ward is NOT wasted on an unshieldable 2+ day gap
      expect(res.remainingInventory).toContain('ember_ward');
    });

    it('does not consume Ember Ward on consecutive calendar day completion', () => {
      const res = evaluateStreakWithRelic(
        '2026-09-11',
        '2026-09-12',
        5,
        10,
        ['ember_ward']
      );

      expect(res.wardConsumed).toBe(false);
      expect(res.newStreak).toBe(6);
      expect(res.remainingInventory).toContain('ember_ward');
    });

    it('does not consume Ember Ward on same day completion', () => {
      const res = evaluateStreakWithRelic(
        '2026-09-12',
        '2026-09-12',
        5,
        10,
        ['ember_ward']
      );

      expect(res.wardConsumed).toBe(false);
      expect(res.newStreak).toBe(5);
      expect(res.remainingInventory).toContain('ember_ward');
    });
  });
});

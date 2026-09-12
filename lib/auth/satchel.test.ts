import { describe, it, expect } from 'vitest';
import type { GameSnapshot } from '@/game/contracts';
import { CATALOG_ITEMS } from '@/features/satchel/contracts';
import { purchaseItemAction, equipItemAction } from '@/features/satchel/satchelAdapter';

const baseSnapshot: GameSnapshot = {
  revision: 1,
  userId: '00000000-0000-0000-0000-000000000001',
  totalXp: 120,
  level: 2,
  sparksBalance: 25,
  currentStreak: 2,
  longestStreak: 5,
  emberState: 'steady',
  todayXpAwarded: 40,
  branches: {
    mind: { attribute: 'mind', xp: 40, specialization: null, selectedAt: null, sproutAvailable: true, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
    body: { attribute: 'body', xp: 40, specialization: null, selectedAt: null, sproutAvailable: true, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
    will: { attribute: 'will', xp: 20, specialization: null, selectedAt: null, sproutAvailable: true, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
    craft: { attribute: 'craft', xp: 20, specialization: null, selectedAt: null, sproutAvailable: true, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
  },
  trials: {},
  equippedItemId: null,
  inventory: { items: [] },
  quests: [],
};

describe('Satchel Shop & Inventory Logic', () => {
  it('contains exactly three cosmetic catalog items with correct prices', () => {
    expect(CATALOG_ITEMS).toHaveLength(3);
    expect(CATALOG_ITEMS.map((i) => i.id)).toEqual(['copper_halo', 'firefly_orbit', 'engraved_basin']);
    expect(CATALOG_ITEMS.find((i) => i.id === 'copper_halo')?.price).toBe(20);
    expect(CATALOG_ITEMS.find((i) => i.id === 'firefly_orbit')?.price).toBe(40);
    expect(CATALOG_ITEMS.find((i) => i.id === 'engraved_basin')?.price).toBe(60);
  });

  it('rejects purchase when user has insufficient Sparks', async () => {
    const lowBalanceSnapshot: GameSnapshot = {
      ...baseSnapshot,
      sparksBalance: 10,
    };

    await expect(
      purchaseItemAction(lowBalanceSnapshot, 'copper_halo')
    ).rejects.toThrow(/Insufficient Sparks/);
  });

  it('executes purchase atomically, deducting balance and adding to inventory', async () => {
    const updated = await purchaseItemAction(baseSnapshot, 'copper_halo');

    expect(updated.sparksBalance).toBe(5); // 25 - 20
    expect(updated.inventory.items).toHaveLength(1);
    expect(updated.inventory.items[0].item.id).toBe('copper_halo');
    expect(updated.inventory.items[0].equipped).toBe(false);
  });

  it('rejects duplicate purchase of an already-owned item', async () => {
    const ownedSnapshot: GameSnapshot = {
      ...baseSnapshot,
      sparksBalance: 50,
      inventory: {
        items: [
          {
            item: { id: 'copper_halo', name: 'Copper Halo', price: 20, visualKey: 'copper_halo' },
            acquiredAt: new Date().toISOString(),
            equipped: false,
          },
        ],
      },
    };

    await expect(
      purchaseItemAction(ownedSnapshot, 'copper_halo')
    ).rejects.toThrow(/already possess/);
  });

  it('equips owned item and enforces single equipped adornment constraint', async () => {
    const snapshotWithTwoItems: GameSnapshot = {
      ...baseSnapshot,
      inventory: {
        items: [
          {
            item: { id: 'copper_halo', name: 'Copper Halo', price: 20, visualKey: 'copper_halo' },
            acquiredAt: new Date().toISOString(),
            equipped: false,
          },
          {
            item: { id: 'firefly_orbit', name: 'Firefly Orbit', price: 40, visualKey: 'firefly_orbit' },
            acquiredAt: new Date().toISOString(),
            equipped: true,
          },
        ],
      },
      equippedItemId: 'firefly_orbit',
    };

    const equipped = await equipItemAction(snapshotWithTwoItems, 'copper_halo');

    expect(equipped.equippedItemId).toBe('copper_halo');
    expect(equipped.inventory.items.find((i) => i.item.id === 'copper_halo')?.equipped).toBe(true);
    expect(equipped.inventory.items.find((i) => i.item.id === 'firefly_orbit')?.equipped).toBe(false);
  });
});

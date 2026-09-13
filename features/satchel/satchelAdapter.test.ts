import { describe, it, expect, vi } from 'vitest';
import { purchaseItemAction, equipItemAction } from './satchelAdapter';
import type { MutationResult } from './contracts';

describe('Satchel Adapter — Production Hardening & Authoritative Mutations', () => {
  const mockSnapshot: any = {
    revision: 1,
    userId: 'user-123',
    sparksBalance: 25,
    equippedItemId: null,
    inventory: { items: [] },
  };

  const mockPurchaseResult: MutationResult = {
    revision: 2,
    event: {
      id: 'evt-test-1',
      kind: 'item_purchased',
      itemId: 'copper_halo',
      price: 20,
    },
    snapshot: {
      ...mockSnapshot,
      revision: 2,
      sparksBalance: 5,
      inventory: {
        items: [
          {
            item: {
              id: 'copper_halo',
              name: 'Copper Halo',
              price: 20,
              visualKey: 'copper_halo',
              category: 'cosmetic',
            },
            acquiredAt: '2026-09-13T12:00:00.000Z',
            equipped: false,
          },
        ],
      },
    },
  };

  const mockEquipResult: MutationResult = {
    revision: 3,
    event: {
      id: 'evt-test-2',
      kind: 'item_equipped',
      itemId: 'copper_halo',
    },
    snapshot: {
      ...mockSnapshot,
      revision: 3,
      sparksBalance: 5,
      equippedItemId: 'copper_halo',
      inventory: {
        items: [
          {
            item: {
              id: 'copper_halo',
              name: 'Copper Halo',
              price: 20,
              visualKey: 'copper_halo',
              category: 'cosmetic',
            },
            acquiredAt: '2026-09-13T12:00:00.000Z',
            equipped: true,
          },
        ],
      },
    },
  };

  describe('purchaseItemAction', () => {
    it('rejects unauthenticated or missing client without silent fallback', async () => {
      await expect(
        purchaseItemAction(null, {
          requestId: 'req-1',
          itemId: 'copper_halo',
        })
      ).rejects.toThrow('Database client unavailable');
    });

    it('requires a valid requestId UUID', async () => {
      const mockClient = { rpc: vi.fn() };
      await expect(
        purchaseItemAction(mockClient, {
          requestId: '',
          itemId: 'copper_halo',
        })
      ).rejects.toThrow('requestId UUID is required');
      expect(mockClient.rpc).not.toHaveBeenCalled();
    });

    it('requires a valid itemId', async () => {
      const mockClient = { rpc: vi.fn() };
      await expect(
        purchaseItemAction(mockClient, {
          requestId: 'req-1',
          itemId: '',
        })
      ).rejects.toThrow('itemId is required');
      expect(mockClient.rpc).not.toHaveBeenCalled();
    });

    it('dispatches purchase_item RPC with correct parameters and returns result', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: mockPurchaseResult,
          error: null,
        }),
      };

      const res = await purchaseItemAction(mockClient, {
        requestId: 'req-purchase-123',
        itemId: 'copper_halo',
      });

      expect(mockClient.rpc).toHaveBeenCalledWith('purchase_item', {
        p_request_id: 'req-purchase-123',
        p_item_id: 'copper_halo',
      });
      expect(res.snapshot.sparksBalance).toBe(5);
      expect(res.event.kind).toBe('item_purchased');
    });

    it('surfaces RPC errors without faking optimistic success', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insufficient Sparks balance. Price: 40, Available: 5' },
        }),
      };

      await expect(
        purchaseItemAction(mockClient, {
          requestId: 'req-fail-1',
          itemId: 'firefly_orbit',
        })
      ).rejects.toThrow('Insufficient Sparks balance');
    });

    it('surfaces duplicate purchase errors from server', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Item is already owned: copper_halo' },
        }),
      };

      await expect(
        purchaseItemAction(mockClient, {
          requestId: 'req-dup-1',
          itemId: 'copper_halo',
        })
      ).rejects.toThrow('Item is already owned');
    });
  });

  describe('equipItemAction', () => {
    it('rejects missing client', async () => {
      await expect(
        equipItemAction(null, {
          requestId: 'req-2',
          itemId: 'copper_halo',
        })
      ).rejects.toThrow('Database client unavailable');
    });

    it('dispatches equip_item RPC and returns updated snapshot with equippedItemId', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: mockEquipResult,
          error: null,
        }),
      };

      const res = await equipItemAction(mockClient, {
        requestId: 'req-equip-1',
        itemId: 'copper_halo',
      });

      expect(mockClient.rpc).toHaveBeenCalledWith('equip_item', {
        p_request_id: 'req-equip-1',
        p_item_id: 'copper_halo',
      });
      expect(res.snapshot.equippedItemId).toBe('copper_halo');
      expect(res.event.kind).toBe('item_equipped');
    });

    it('surfaces error when equipping unowned item', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Item not owned in inventory: firefly_orbit' },
        }),
      };

      await expect(
        equipItemAction(mockClient, {
          requestId: 'req-equip-unowned',
          itemId: 'firefly_orbit',
        })
      ).rejects.toThrow('Item not owned in inventory');
    });

    it('surfaces error when attempting to equip a non-cosmetic relic at Hearth', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Only Hearth adornments can be equipped' },
        }),
      };

      await expect(
        equipItemAction(mockClient, {
          requestId: 'req-equip-relic',
          itemId: 'ember_ward',
        })
      ).rejects.toThrow('Only Hearth adornments can be equipped');
    });
  });
});

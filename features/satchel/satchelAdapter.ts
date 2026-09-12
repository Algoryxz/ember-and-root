import type { GameSnapshot, Item, InventoryState } from '@/game/contracts';
import { CATALOG_ITEMS, type SatchelItem } from './contracts';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

type InventoryItemEntry = InventoryState['items'][number];

export interface SupabaseRpcClient {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
}

function getRpcClient(client?: any): SupabaseRpcClient | null {
  if (client && typeof client.rpc === 'function') {
    return client as SupabaseRpcClient;
  }
  if (typeof window !== 'undefined') {
    try {
      const browser = createBrowserClient();
      if (browser && typeof browser.rpc === 'function') {
        return (browser as unknown) as SupabaseRpcClient;
      }
    } catch {
      // Fall through
    }
  }
  return null;
}

/**
 * Authoritative Satchel Purchase Action
 *
 * Checks Sparks balance, ensures item is not already owned,
 * executes purchase via RPC or deterministic state transition, and returns updated GameSnapshot.
 */
export async function purchaseItemAction(
  currentSnapshot: GameSnapshot,
  itemId: string,
  supabaseClient?: any,
  _requestId?: string
): Promise<GameSnapshot> {
  const item = CATALOG_ITEMS.find((it) => it.id === itemId);
  if (!item) {
    throw new Error(`Unknown adornment: ${itemId}`);
  }

  // 1. Balance verification
  if (currentSnapshot.sparksBalance < item.price) {
    const needed = item.price - currentSnapshot.sparksBalance;
    throw new Error(
      `Insufficient Sparks. You need ${needed} more ${needed === 1 ? 'Spark' : 'Sparks'} to acquire the ${item.name}.`
    );
  }

  // 2. Ownership verification
  const isOwned = (currentSnapshot.inventory?.items || []).some(
    (inv) => inv.item.id === itemId
  );
  if (isOwned) {
    throw new Error(`You already possess the ${item.name}.`);
  }

  const client = getRpcClient(supabaseClient);
  if (client) {
    try {
      const { data, error } = await client.rpc('purchase_item', {
        p_request_id: _requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'req-purchase'),
        p_item_id: itemId,
      });
      if (!error && data) {
        if (data.snapshot) return data.snapshot as GameSnapshot;
        if (data.sparksBalance !== undefined) return data as GameSnapshot;
      }
    } catch {
      // Fall back to client state projection if RPC is not yet seeded
    }
  }

  // Project deterministic state update
  const newSparks = currentSnapshot.sparksBalance - item.price;
  const newItem: Item = {
    id: item.id,
    name: item.name,
    price: item.price,
    visualKey: item.visualKey,
  };

  const newInventoryItem: InventoryItemEntry = {
    item: newItem,
    acquiredAt: new Date().toISOString(),
    equipped: false,
  };

  const updatedItems = [...(currentSnapshot.inventory?.items || []), newInventoryItem];

  return {
    ...currentSnapshot,
    sparksBalance: newSparks,
    inventory: {
      items: updatedItems,
    },
    revision: currentSnapshot.revision + 1,
  };
}

/**
 * Authoritative Satchel Equip Action
 *
 * Toggles or sets item equip status. Enforces single equipped adornment constraint.
 */
export async function equipItemAction(
  currentSnapshot: GameSnapshot,
  itemId: string,
  supabaseClient?: any,
  _requestId?: string
): Promise<GameSnapshot> {
  const isOwned = (currentSnapshot.inventory?.items || []).some(
    (inv) => inv.item.id === itemId
  );
  if (!isOwned) {
    throw new Error(`Cannot equip an item that is not in your satchel.`);
  }

  const client = getRpcClient(supabaseClient);
  if (client) {
    try {
      const { data, error } = await client.rpc('equip_item', {
        p_item_id: itemId,
      });
      if (!error && data) {
        if (data.snapshot) return data.snapshot as GameSnapshot;
      }
    } catch {
      // Fall back to client state projection if RPC is not yet seeded
    }
  }

  const isCurrentlyEquipped = currentSnapshot.equippedItemId === itemId;
  const newEquippedId = isCurrentlyEquipped ? null : itemId;

  const updatedItems = (currentSnapshot.inventory?.items || []).map((inv) => ({
    ...inv,
    equipped: inv.item.id === newEquippedId,
  }));

  return {
    ...currentSnapshot,
    equippedItemId: newEquippedId,
    inventory: {
      items: updatedItems,
    },
    revision: currentSnapshot.revision + 1,
  };
}

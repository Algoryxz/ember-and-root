import type {
  MutationResult,
  PurchaseItemParams,
  EquipItemParams,
  SupabaseClientLike,
} from './contracts';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

function getRpcClient(client?: any): SupabaseClientLike | null {
  if (client && typeof client.rpc === 'function') {
    return client as SupabaseClientLike;
  }
  if (typeof window !== 'undefined') {
    try {
      const browser = createBrowserClient();
      if (browser && typeof browser.rpc === 'function') {
        return browser as unknown as SupabaseClientLike;
      }
    } catch {
      // Fall through to null
    }
  }
  return null;
}

/**
 * Purchases an item authoritatively from the database.
 * Deducts Sparks, inserts negative ledger entry, inserts inventory row.
 * Returns authoritative MutationResult. Never fakes optimistic success.
 */
export async function purchaseItemAction(
  client: any,
  params: PurchaseItemParams
): Promise<MutationResult> {
  const rpcClient = getRpcClient(client);
  if (!rpcClient) {
    throw new Error('Database client unavailable: cannot process purchase without authoritative connection.');
  }

  if (!params.requestId) {
    throw new Error('A valid requestId UUID is required for purchase idempotency.');
  }

  if (!params.itemId) {
    throw new Error('An itemId is required to purchase.');
  }

  const { data, error } = await rpcClient.rpc('purchase_item', {
    p_request_id: params.requestId,
    p_item_id: params.itemId,
  });

  if (error) {
    const errorMsg = error.message || error.details || 'Failed to complete item purchase.';
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error('Server returned empty result for purchase mutation.');
  }

  return data as MutationResult;
}

/**
 * Equips an owned cosmetic adornment at the Hearth.
 * Atomically un-equips any previously equipped adornment.
 * Returns authoritative MutationResult.
 */
export async function equipItemAction(
  client: any,
  params: EquipItemParams
): Promise<MutationResult> {
  const rpcClient = getRpcClient(client);
  if (!rpcClient) {
    throw new Error('Database client unavailable: cannot equip item without authoritative connection.');
  }

  if (!params.requestId) {
    throw new Error('A valid requestId UUID is required for equip idempotency.');
  }

  if (!params.itemId) {
    throw new Error('An itemId is required to equip.');
  }

  const { data, error } = await rpcClient.rpc('equip_item', {
    p_request_id: params.requestId,
    p_item_id: params.itemId,
  });

  if (error) {
    const errorMsg = error.message || error.details || 'Failed to equip item.';
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error('Server returned empty result for equip mutation.');
  }

  return data as MutationResult;
}

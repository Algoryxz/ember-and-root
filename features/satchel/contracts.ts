import type {
  GameSnapshot,
  InventoryState,
  Item,
  ItemCategory,
  MutationEvent,
  MutationResult,
} from '@/game/contracts';

export type {
  GameSnapshot,
  InventoryState,
  Item,
  ItemCategory,
  MutationEvent,
  MutationResult,
};

export interface PurchaseItemParams {
  requestId: string;
  itemId: string;
}

export interface EquipItemParams {
  requestId: string;
  itemId: string;
}

export interface SatchelItem extends Item {
  category: ItemCategory;
  description: string;
}

export interface SupabaseClientLike {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: any; error: any }>;
  from?: (table: string) => any;
}

import type { GameSnapshot } from '@/game/contracts';

export interface SatchelItem {
  id: string;
  name: string;
  price: number;
  visualKey: string;
  description: string;
  glyph: string;
}

export const CATALOG_ITEMS: SatchelItem[] = [
  {
    id: 'copper_halo',
    name: 'Copper Halo',
    price: 20,
    visualKey: 'copper_halo',
    description: 'A hand-hammered copper halo that catches and reflects the flickering flame.',
    glyph: '◯',
  },
  {
    id: 'firefly_orbit',
    name: 'Firefly Orbit',
    price: 40,
    visualKey: 'firefly_orbit',
    description: 'Luminescent forest motes drifting in gentle orbit around the living core.',
    glyph: '✨',
  },
  {
    id: 'engraved_basin',
    name: 'Engraved Basin',
    price: 60,
    visualKey: 'engraved_basin',
    description: 'A weathered stone basin with ancient etched runes that cradle the embers.',
    glyph: '⚱️',
  },
];

export interface SatchelInventoryItem {
  itemId: string;
  name: string;
  price: number;
  visualKey: string;
  acquiredAt: string;
  equipped: boolean;
}

export interface PurchaseItemResult {
  success: boolean;
  error?: string;
  newSparksBalance?: number;
  snapshot?: GameSnapshot;
}

export interface EquipItemResult {
  success: boolean;
  error?: string;
  equippedItemId?: string | null;
  snapshot?: GameSnapshot;
}

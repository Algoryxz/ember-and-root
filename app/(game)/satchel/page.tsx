import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SatchelViewWrapper } from './SatchelViewWrapper';
import type { GameSnapshot } from '@/game/contracts';
import type { SatchelItem } from '@/features/satchel';

export const metadata = {
  title: 'Satchel — Ember & Root',
};

export default async function SatchelPage() {
  const supabase = await createClient();

  const [snapshotRes, itemsRes] = await Promise.all([
    supabase.rpc('get_game_snapshot'),
    supabase
      .from('items')
      .select('id, name, price, visual_key, category, description')
      .order('price', { ascending: true }),
  ]);

  const initialSnapshot = (snapshotRes.data as GameSnapshot) ?? undefined;

  let catalogItems: SatchelItem[] | undefined;
  if (itemsRes.data && itemsRes.data.length > 0) {
    catalogItems = itemsRes.data.map((row: any) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      visualKey: row.visual_key,
      category: row.category || (row.id === 'ember_ward' ? 'relic' : 'cosmetic'),
      description:
        row.description ||
        (row.id === 'copper_halo'
          ? 'A hand-hammered copper halo that catches the flickering flame.'
          : row.id === 'firefly_orbit'
          ? 'Luminescent forest motes drifting in gentle orbit around the core.'
          : row.id === 'engraved_basin'
          ? 'A weathered stone basin with etched runes that cradle the embers.'
          : row.id === 'ember_ward'
          ? 'A crystallized ember tear. Shields your streak through one day of absence.'
          : 'A carried object along your path.'),
    }));
  }

  return (
    <div className="space-y-6">
      <SatchelViewWrapper
        initialSnapshot={initialSnapshot}
        catalogItems={catalogItems}
      />
    </div>
  );
}

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { SatchelCabinet } from '@/features/satchel/SatchelCabinet';

export const metadata = {
  title: 'Satchel — Ember & Root',
};

export default async function SatchelPage() {
  const supabase = await createClient();

  const [profileRes, itemsRes, inventoryRes] = await Promise.all([
    supabase.from('profiles').select('sparks_balance').single(),
    supabase.from('items').select('id, name, price, visual_key').order('price', { ascending: true }),
    supabase.from('inventory').select('item_id, equipped, acquired_at'),
  ]);

  const sparksBalance = profileRes.data?.sparks_balance ?? 0;
  const items = itemsRes.data ?? [];
  const inventory = inventoryRes.data ?? [];

  return (
    <SatchelCabinet
      initialSparksBalance={sparksBalance}
      items={items}
      inventory={inventory}
    />
  );
}


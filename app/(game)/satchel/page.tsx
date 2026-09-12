import React from 'react';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Satchel — Ember & Root',
};

const ITEM_DESCRIPTIONS: Record<string, string> = {
  copper_halo: 'A hand-hammered copper halo that catches the flickering flame.',
  firefly_orbit: 'Luminescent forest motes drifting in gentle orbit around the core.',
  engraved_basin: 'A weathered stone basin with etched runes that cradle the embers.',
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
    <div className="space-y-6">
      {/* Title & Sparks Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['Fraunces'] text-3xl font-normal text-[#F0E7D3] mb-1">
            Satchel
          </h1>
          <p className="text-sm text-[#B9BEAC]">
            Cosmetic hearth adornments acquired with earned Sparks.
          </p>
        </div>

        <div className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] px-5 py-3 flex items-center gap-3 self-start sm:self-auto">
          <div className="w-8 h-8 rounded-full bg-[#FFD38A]/10 border border-[#FFD38A]/30 flex items-center justify-center text-[#FFD38A]">
            ✦
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#B9BEAC] block">
              Sparks Balance
            </span>
            <span className="font-['Fraunces'] text-xl font-normal text-[#FFD38A]">
              {sparksBalance}
            </span>
          </div>
        </div>
      </div>

      {/* Item Catalog List */}
      <section aria-labelledby="catalog-heading" className="space-y-4">
        <h2 id="catalog-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
          Hearth Adornments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => {
            const userItem = inventory.find((inv) => inv.item_id === item.id);
            const isOwned = Boolean(userItem);
            const isEquipped = Boolean(userItem?.equipped);

            return (
              <article
                key={item.id}
                className="bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-full h-32 bg-[#141713] rounded-[8px] border border-[#2A332A] flex items-center justify-center text-center p-4">
                    <div className="space-y-1">
                      <span className="text-2xl block" aria-hidden="true">
                        {item.id === 'copper_halo' ? '◯' : item.id === 'firefly_orbit' ? '✨' : '⚱️'}
                      </span>
                      <span className="text-xs text-[#B9BEAC] block">
                        {item.name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-['Fraunces'] text-lg font-normal text-[#F0E7D3]">
                        {item.name}
                      </h3>
                      <span className="text-xs font-semibold text-[#FFD38A]">
                        {item.price} Sparks
                      </span>
                    </div>
                    <p className="text-xs text-[#B9BEAC] mt-1">
                      {ITEM_DESCRIPTIONS[item.id] || 'A bespoke cosmetic adornment for your Hearth.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2A332A]">
                  {isEquipped ? (
                    <div className="w-full py-2 px-3 text-center text-xs font-medium text-[#9FBA87] bg-[#9FBA87]/10 border border-[#9FBA87]/30 rounded-[6px]">
                      Equipped
                    </div>
                  ) : isOwned ? (
                    <div className="w-full py-2 px-3 text-center text-xs font-medium text-[#F0E7D3] bg-[#141713] border border-[#2A332A] rounded-[6px]">
                      Owned
                    </div>
                  ) : (
                    <div className="w-full py-2 px-3 text-center text-xs font-medium text-[#B9BEAC] bg-[#141713] border border-[#2A332A] rounded-[6px]">
                      Available for {item.price} Sparks
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

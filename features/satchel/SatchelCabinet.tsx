'use client';

import React, { useState } from 'react';
import { CopperHaloVisual } from './CopperHaloVisual';

export interface SatchelItem {
  id: string;
  name: string;
  price: number;
  visual_key: string;
  description?: string;
  material?: string;
  specimenNumber?: string;
}

export interface UserInventoryItem {
  item_id: string;
  equipped: boolean;
  acquired_at: string;
}

interface SatchelCabinetProps {
  initialSparksBalance: number;
  items: SatchelItem[];
  inventory: UserInventoryItem[];
}

const RELIC_DETAILS: Record<
  string,
  {
    description: string;
    material: string;
    specimenNumber: string;
    fieldNotes: string;
  }
> = {
  copper_halo: {
    description: 'A hand-hammered copper halo that catches the flickering flame.',
    material: 'Hand-hammered cold-forged copper, ember-tempered',
    specimenNumber: 'SPECIMEN NO. 01 · HEARTH ADORNMENT',
    fieldNotes:
      'Forged to cradle the hearth ember and reflect its steady warmth across the chamber. When equipped, the halo concentrates the hearth’s radiant perimeter into a steady amber ring.',
  },
  firefly_orbit: {
    description: 'Luminescent forest motes drifting in gentle orbit around the core.',
    material: 'Luminescent forest motes, glass suspension vial',
    specimenNumber: 'SPECIMEN NO. 02 · HEARTH ADORNMENT',
    fieldNotes:
      'Captive forest motes that orbit the hearth flame, attuned to nightly reflections.',
  },
  engraved_basin: {
    description: 'A weathered stone basin with etched runes that cradle the embers.',
    material: 'Carved river granite, incised botanical sigils',
    specimenNumber: 'SPECIMEN NO. 03 · HEARTH ADORNMENT',
    fieldNotes:
      'A heavy carved basin that grounds the hearth embers in ancient mineral soil.',
  },
};

export const SatchelCabinet: React.FC<SatchelCabinetProps> = ({
  initialSparksBalance,
  items,
  inventory,
}) => {
  // Default inspected specimen is Copper Halo as required by the experiment
  const [selectedItemId, setSelectedItemId] = useState<string>('copper_halo');
  const [activeInventory, setActiveInventory] = useState<UserInventoryItem[]>(inventory);
  const [sparksBalance] = useState<number>(initialSparksBalance);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const selectedItem =
    items.find((it) => it.id === selectedItemId) || items[0] || {
      id: 'copper_halo',
      name: 'Copper Halo',
      price: 20,
      visual_key: 'copper_halo',
    };

  const userRecord = activeInventory.find((inv) => inv.item_id === selectedItem.id);
  const isOwned = Boolean(userRecord);
  const isEquipped = Boolean(userRecord?.equipped);
  const details = RELIC_DETAILS[selectedItem.id] || RELIC_DETAILS.copper_halo;

  // Optimistic/Preview handlers for client interaction in field cabinet
  const handleToggleEquip = () => {
    if (!isOwned) return;

    setActiveInventory((prev) => {
      return prev.map((inv) => {
        if (inv.item_id === selectedItem.id) {
          const nextEquipped = !inv.equipped;
          setFeedbackNotice(
            nextEquipped
              ? `${selectedItem.name} equipped at your Hearth.`
              : `${selectedItem.name} returned to your Satchel drawer.`
          );
          return { ...inv, equipped: nextEquipped };
        }
        // If equipping this item, unequip any other single equipped relic
        return { ...inv, equipped: false };
      });
    });
  };

  return (
    <div className="space-y-8">
      {/* Satchel Title & Sparks Ledger Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A332A] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#E98A4B] font-semibold block mb-1">
            Specimen Cabinet · Relics
          </span>
          <h1 className="font-['Fraunces'] text-3xl sm:text-4xl font-normal text-[#F0E7D3] tracking-tight">
            Satchel
          </h1>
          <p className="text-sm text-[#B9BEAC] mt-1">
            Carefully gathered physical relics and hearth adornments acquired through your practice.
          </p>
        </div>

        {/* Sparks Ledger Balance Badge */}
        <div
          role="status"
          aria-label={`Current balance: ${sparksBalance} Sparks`}
          className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] px-5 py-3 flex items-center gap-3 self-start sm:self-auto shadow-sm"
        >
          <div
            className="w-9 h-9 rounded-full bg-[#FFD38A]/10 border border-[#FFD38A]/30 flex items-center justify-center text-[#FFD38A] text-lg"
            aria-hidden="true"
          >
            ✦
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#B9BEAC] block">
              Sparks Balance
            </span>
            <span className="font-['Fraunces'] text-xl font-normal text-[#FFD38A]">
              {sparksBalance} Sparks
            </span>
          </div>
        </div>
      </header>

      {/* Accessible Live Feedback Banner */}
      {feedbackNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 bg-[#9FBA87]/10 border border-[#9FBA87]/40 rounded-[6px] text-xs text-[#9FBA87] flex items-center justify-between"
        >
          <span>{feedbackNotice}</span>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-[11px] text-[#B9BEAC] hover:text-[#F0E7D3] ml-4 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Field Cabinet Layout: Relic Drawer Index + Inspection Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Drawer Strip: Relic Compartments */}
        <nav
          aria-label="Relic Drawer Compartments"
          className="lg:col-span-4 space-y-3"
        >
          <div className="flex items-center justify-between px-1 mb-1">
            <h2 className="text-xs uppercase tracking-wider text-[#B9BEAC] font-medium">
              Cabinet Drawers ({items.length})
            </h2>
            <span className="text-[11px] text-[#8FA37E]">Field Index</span>
          </div>

          <div className="space-y-2.5" role="tablist" aria-orientation="vertical">
            {items.map((item) => {
              const userItem = activeInventory.find((inv) => inv.item_id === item.id);
              const itemOwned = Boolean(userItem);
              const itemEquipped = Boolean(userItem?.equipped);
              const isSelected = item.id === selectedItemId;

              return (
                <button
                  key={item.id}
                  role="tab"
                  id={`tab-${item.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${item.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  type="button"
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setFeedbackNotice(null);
                  }}
                  className={`w-full min-h-[56px] text-left p-4 rounded-[8px] border transition-all duration-150 flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141713] ${
                    isSelected
                      ? 'bg-[#1D231D] border-[#E98A4B] shadow-[0_0_12px_rgba(233,138,75,0.12)]'
                      : 'bg-[#181D18] border-[#2A332A] hover:border-[#374537] hover:bg-[#1D231D]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drawer compartment specimen icon */}
                    <div
                      className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${
                        isSelected
                          ? 'border-[#E98A4B] bg-[#E98A4B]/10 text-[#E98A4B]'
                          : 'border-[#2A332A] bg-[#141713] text-[#B9BEAC]'
                      }`}
                      aria-hidden="true"
                    >
                      {item.id === 'copper_halo' ? '◯' : item.id === 'firefly_orbit' ? '✨' : '⚱'}
                    </div>

                    <div>
                      <span className="font-['Fraunces'] text-sm font-medium text-[#F0E7D3] block leading-snug">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-[#B9BEAC]">
                        {item.price} Sparks
                      </span>
                    </div>
                  </div>

                  {/* Status chip in drawer list */}
                  <div className="text-right">
                    {itemEquipped ? (
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#9FBA87]/15 border border-[#9FBA87]/40 text-[#9FBA87]">
                        Equipped
                      </span>
                    ) : itemOwned ? (
                      <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-[#141713] border border-[#2A332A] text-[#F0E7D3]">
                        Owned
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8FA37E]">
                        Drawer 0{items.indexOf(item) + 1}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-[8px] bg-[#141713] border border-[#2A332A] text-[11px] text-[#B9BEAC] leading-relaxed">
            <p>
              <strong className="text-[#F0E7D3] font-normal">Field Collector’s Note:</strong> Relics acquired in your Satchel endure across seasons. One active relic may encircle the Hearth flame at a time.
            </p>
          </div>
        </nav>

        {/* Right / Main Inspection Surface: Complete Specimen Inspection Plate */}
        <section
          id={`panel-${selectedItem.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${selectedItem.id}`}
          className="lg:col-span-8 bg-[#1D231D] border border-[#2A332A] rounded-[12px] p-6 sm:p-8 space-y-6 shadow-xl"
        >
          {/* Inspection Plate Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A332A] pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#E98A4B] font-semibold block">
                {details.specimenNumber}
              </span>
              <span className="text-xs text-[#B9BEAC]">
                Field Cabinet Inspection Surface
              </span>
            </div>

            {/* Authoritative State Badge */}
            <div>
              {isEquipped ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium text-[#9FBA87] bg-[#9FBA87]/10 border border-[#9FBA87]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9FBA87] inline-block animate-pulse" aria-hidden="true" />
                  Active · Equipped at Hearth
                </span>
              ) : isOwned ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium text-[#F0E7D3] bg-[#141713] border border-[#2A332A]">
                  Acquired · In Satchel
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-medium text-[#FFD38A] bg-[#FFD38A]/10 border border-[#FFD38A]/30">
                  Field Specimen · Unacquired
                </span>
              )}
            </div>
          </div>

          {/* Visually Dominant Authored Relic Illustration */}
          <div className="w-full bg-[#141713] rounded-[10px] border border-[#2A332A] py-10 px-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Subtle specimen ruler markings */}
            <div className="absolute top-3 left-4 text-[9px] uppercase tracking-wider font-mono text-[#4A554A] select-none" aria-hidden="true">
              GRID: 200MM · BOTANICAL MOUNT
            </div>
            <div className="absolute bottom-3 right-4 text-[9px] uppercase tracking-wider font-mono text-[#4A554A] select-none" aria-hidden="true">
              EMBER &amp; ROOT ARCHIVE
            </div>

            {/* Specimen Visual */}
            {selectedItem.id === 'copper_halo' ? (
              <CopperHaloVisual size={220} isEquipped={isEquipped} />
            ) : (
              <div className="w-48 h-48 rounded-full border border-dashed border-[#2A332A] flex flex-col items-center justify-center text-center p-4">
                <span className="text-3xl text-[#FFD38A] mb-2" aria-hidden="true">
                  {selectedItem.id === 'firefly_orbit' ? '✨' : '⚱'}
                </span>
                <span className="text-xs text-[#B9BEAC]">
                  {selectedItem.name}
                </span>
                <span className="text-[10px] text-[#6E7B6E] mt-1">
                  Drawer Specimen Prototype
                </span>
              </div>
            )}

            {/* Placement caption under artwork */}
            <p className="text-[11px] font-mono text-[#8FA37E] mt-4 select-none">
              {isEquipped ? '● Relic is active and resting at Hearth flame' : '○ Resting on mounting velvet'}
            </p>
          </div>

          {/* Relic Specimen Metadata (Name second, Description & Price supporting) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h3 className="font-['Fraunces'] text-2xl sm:text-3xl font-normal text-[#F0E7D3]">
                  {selectedItem.name}
                </h3>
                <p className="text-xs font-mono text-[#8FA37E] mt-0.5">
                  {details.material}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-[#B9BEAC] block">Catalog Price</span>
                <span className="font-['Fraunces'] text-xl font-medium text-[#FFD38A]">
                  {selectedItem.price} Sparks
                </span>
              </div>
            </div>

            {/* Description and Field Notes */}
            <div className="bg-[#181D18] rounded-[8px] p-4 border border-[#2A332A] space-y-2">
              <p className="text-sm text-[#F0E7D3] leading-relaxed">
                {details.description}
              </p>
              <p className="text-xs text-[#B9BEAC] leading-relaxed italic border-t border-[#2A332A] pt-2">
                “{details.fieldNotes}”
              </p>
            </div>
          </div>

          {/* Specimen Actions: Equip, Unequip, Acquire */}
          <div className="pt-4 border-t border-[#2A332A] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#B9BEAC]">
              {isEquipped ? (
                <span>Currently active at your Hearth flame.</span>
              ) : isOwned ? (
                <span>Acquired in your inventory. Ready to place on Hearth.</span>
              ) : sparksBalance >= selectedItem.price ? (
                <span className="text-[#9FBA87]">
                  You have sufficient Sparks to acquire this relic ({sparksBalance} / {selectedItem.price}).
                </span>
              ) : (
                <span className="text-[#D9986A]">
                  Requires {selectedItem.price - sparksBalance} more Sparks to acquire.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isEquipped ? (
                <button
                  type="button"
                  onClick={handleToggleEquip}
                  className="w-full sm:w-auto min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-[6px] bg-[#141713] border border-[#2A332A] hover:border-[#F0A79D]/50 text-xs font-medium text-[#F0A79D] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D]"
                >
                  Unequip Relic
                </button>
              ) : isOwned ? (
                <button
                  type="button"
                  onClick={handleToggleEquip}
                  className="w-full sm:w-auto min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-[6px] bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D]"
                >
                  Equip to Hearth
                </button>
              ) : (
                <button
                  type="button"
                  disabled={sparksBalance < selectedItem.price}
                  className="w-full sm:w-auto min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-[6px] bg-[#141713] border border-[#2A332A] disabled:opacity-50 text-xs font-medium text-[#B9BEAC] cursor-not-allowed focus-visible:outline-none"
                  title="Shop mutation RPC requires backend integration"
                >
                  Available for {selectedItem.price} Sparks
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

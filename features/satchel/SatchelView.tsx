'use client';

import React, { useState } from 'react';
import type { GameSnapshot } from '@/game/contracts';
import { CATALOG_ITEMS, type SatchelItem } from './contracts';
import { purchaseItemAction, equipItemAction } from './satchelAdapter';
import './SatchelView.css';

export interface SatchelViewProps {
  initialSnapshot: GameSnapshot;
  supabaseClient?: any;
  onSnapshotChange?: (snapshot: GameSnapshot) => void;
}

export const SatchelView: React.FC<SatchelViewProps> = ({
  initialSnapshot,
  supabaseClient,
  onSnapshotChange,
}) => {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [inFlight, setInFlight] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);

  const sparksBalance = snapshot.sparksBalance ?? 0;
  const inventoryItems = snapshot.inventory?.items || [];
  const equippedItemId = snapshot.equippedItemId;

  async function handlePurchase(item: SatchelItem) {
    if (inFlight[item.id]) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    setInFlight((prev) => ({ ...prev, [item.id]: true }));

    try {
      const updatedSnapshot = await purchaseItemAction(
        snapshot,
        item.id,
        supabaseClient
      );
      setSnapshot(updatedSnapshot);
      if (onSnapshotChange) onSnapshotChange(updatedSnapshot);
      setSuccessMessage(`Acquired ${item.name}! It is now safely in your satchel.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Purchase could not be completed.';
      setErrorMessage(message);
    } finally {
      setInFlight((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  async function handleEquip(item: SatchelItem) {
    if (inFlight[item.id]) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    setInFlight((prev) => ({ ...prev, [item.id]: true }));

    try {
      const updatedSnapshot = await equipItemAction(
        snapshot,
        item.id,
        supabaseClient
      );
      setSnapshot(updatedSnapshot);
      if (onSnapshotChange) onSnapshotChange(updatedSnapshot);
      const isNowEquipped = updatedSnapshot.equippedItemId === item.id;
      setSuccessMessage(
        isNowEquipped
          ? `${item.name} is now adorning your Hearth flame.`
          : `${item.name} has been returned to your satchel.`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not change adornment.';
      setErrorMessage(message);
    } finally {
      setInFlight((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  return (
    <div className="satchel-shell">
      {/* Live Accessibility Feedback Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {successMessage || errorMessage}
      </div>

      {/* Header & Sparks Balance */}
      <div className="satchel-header">
        <div className="satchel-title-group">
          <h1>Satchel &amp; Hearth Adornments</h1>
          <p>Cosmetic adornments for your Hearth acquired with earned Sparks.</p>
        </div>

        <div className="sparks-badge-card" role="region" aria-label="Sparks Balance">
          <div className="sparks-badge-icon" aria-hidden="true">✦</div>
          <div>
            <span className="sparks-badge-label">Available Sparks</span>
            <span className="sparks-badge-value">{sparksBalance}</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="p-3 bg-[#9FBA87]/10 border border-[#9FBA87]/30 rounded-[6px] text-xs text-[#9FBA87] flex items-center justify-between"
        >
          <span>✨ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-[11px] underline hover:text-[#F0E7D3]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div role="alert" className="satchel-error-toast">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] underline hover:text-[#F0E7D3]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Catalog Grid */}
      <section aria-labelledby="catalog-heading" className="space-y-4">
        <h2 id="catalog-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
          Catalog &amp; Inventory
        </h2>

        <div className="satchel-grid">
          {CATALOG_ITEMS.map((item) => {
            const userItem = inventoryItems.find((inv) => inv.item.id === item.id);
            const isOwned = Boolean(userItem);
            const isEquipped = equippedItemId === item.id;
            const isLoading = inFlight[item.id] || false;
            const canAfford = sparksBalance >= item.price;
            const isPreviewing = previewItemId === item.id;

            return (
              <article
                key={item.id}
                className={`satchel-card ${isEquipped ? 'is-equipped' : ''}`}
              >
                <div className="space-y-3">
                  {/* Visual Preview Box */}
                  <div className="satchel-preview-box">
                    {item.id === 'copper_halo' && (
                      <div className="satchel-preview-halo" aria-hidden="true">
                        <span className="text-xl">🔥</span>
                      </div>
                    )}
                    {item.id === 'firefly_orbit' && (
                      <div className="satchel-preview-fireflies" aria-hidden="true">
                        <span className="text-xl">🔥</span>
                        <span className="absolute top-1 left-2 text-xs text-[#FFD38A] animate-pulse">✨</span>
                        <span className="absolute bottom-1 right-2 text-xs text-[#9FBA87] animate-pulse">✨</span>
                      </div>
                    )}
                    {item.id === 'engraved_basin' && (
                      <div className="satchel-preview-basin" aria-hidden="true">
                        <span className="text-base text-[#E98A4B]">🔥</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewItemId(isPreviewing ? null : item.id)}
                      className="absolute bottom-2 right-2 text-[10px] text-[#B9BEAC] hover:text-[#F0E7D3] bg-[#1D231D]/80 px-2 py-0.5 rounded border border-[#2A332A] focus-visible:ring-1 focus-visible:ring-[#C4A96A]"
                    >
                      {isPreviewing ? 'Hide Preview' : 'Inspect'}
                    </button>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="satchel-card-title">{item.name}</h3>
                      <span className="satchel-card-price">{item.price} Sparks</span>
                    </div>
                    <p className="satchel-card-desc">{item.description}</p>
                  </div>
                </div>

                {/* Actions & Equip State */}
                <div className="pt-3 border-t border-[#2A332A] space-y-2">
                  {isEquipped ? (
                    <div className="space-y-2">
                      <div className="satchel-badge-equipped">
                        <span aria-hidden="true">✓</span>
                        <span>Equipped on Hearth</span>
                      </div>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleEquip(item)}
                        className="satchel-btn-equip"
                      >
                        {isLoading ? 'Updating…' : 'Unequip Adornment'}
                      </button>
                    </div>
                  ) : isOwned ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleEquip(item)}
                      className="satchel-btn-primary"
                    >
                      {isLoading ? 'Equipping…' : 'Equip to Hearth'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading || !canAfford}
                      onClick={() => handlePurchase(item)}
                      className="satchel-btn-primary"
                    >
                      {isLoading
                        ? 'Acquiring…'
                        : canAfford
                        ? `Acquire for ${item.price} Sparks`
                        : `Need ${item.price - sparksBalance} more Sparks`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

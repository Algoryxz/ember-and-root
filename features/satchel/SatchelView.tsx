'use client';

import React, { useState } from 'react';
import type { GameSnapshot, MutationResult, SatchelItem, SupabaseClientLike } from './contracts';
import { purchaseItemAction, equipItemAction } from './satchelAdapter';
import './SatchelView.css';

export interface SatchelViewProps {
  initialSnapshot?: GameSnapshot;
  catalogItems?: SatchelItem[];
  supabaseClient?: SupabaseClientLike | any;
  onMutationSuccess?: (result: MutationResult) => void;
  className?: string;
}

const DEFAULT_CATALOG: SatchelItem[] = [
  {
    id: 'copper_halo',
    name: 'Copper Halo',
    price: 20,
    visualKey: 'copper_halo',
    category: 'cosmetic',
    description: 'A hand-hammered copper halo that catches the flickering flame.',
  },
  {
    id: 'firefly_orbit',
    name: 'Firefly Orbit',
    price: 40,
    visualKey: 'firefly_orbit',
    category: 'cosmetic',
    description: 'Luminescent forest motes drifting in gentle orbit around the core.',
  },
  {
    id: 'engraved_basin',
    name: 'Engraved Basin',
    price: 60,
    visualKey: 'engraved_basin',
    category: 'cosmetic',
    description: 'A weathered stone basin with etched runes that cradle the embers.',
  },
  {
    id: 'ember_ward',
    name: 'Ember Ward',
    price: 50,
    visualKey: 'ember_ward',
    category: 'relic',
    description: 'A crystallized ember tear. Shields your streak through one day of absence.',
  },
];

export const SatchelView: React.FC<SatchelViewProps> = ({
  initialSnapshot,
  catalogItems,
  supabaseClient,
  onMutationSuccess,
  className = '',
}) => {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => {
    if (initialSnapshot) return initialSnapshot;
    return {
      revision: 0,
      userId: '',
      totalXp: 0,
      level: 1,
      sparksBalance: 0,
      currentStreak: 0,
      longestStreak: 0,
      emberState: 'resting',
      todayXpAwarded: 0,
      branches: {
        mind: { attribute: 'mind', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
        body: { attribute: 'body', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
        will: { attribute: 'will', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
        craft: { attribute: 'craft', xp: 0, specialization: null, selectedAt: null, sproutAvailable: false, specializationAvailable: false, crestAvailable: false, trialStarted: false, trialComplete: false, crestClaimed: false },
      },
      trials: {},
      equippedItemId: null,
      inventory: { items: [] },
    };
  });

  const [inFlightItemId, setInFlightItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentAcquisition, setRecentAcquisition] = useState<string | null>(null);

  // Merge catalog items with any DB-loaded items
  const items = React.useMemo(() => {
    if (!catalogItems || catalogItems.length === 0) return DEFAULT_CATALOG;
    // Ensure all default items exist
    const merged = [...catalogItems];
    for (const def of DEFAULT_CATALOG) {
      if (!merged.some((item) => item.id === def.id)) {
        merged.push(def);
      }
    }
    return merged;
  }, [catalogItems]);

  const sparksBalance = snapshot.sparksBalance ?? 0;

  // Extract owned items from snapshot
  const ownedItemsMap = React.useMemo(() => {
    const map = new Map<string, { equipped: boolean; acquiredAt: string }>();
    const invItems = snapshot.inventory?.items || [];
    for (const inv of invItems) {
      if (inv.item?.id) {
        map.set(inv.item.id, {
          equipped: Boolean(inv.equipped || snapshot.equippedItemId === inv.item.id),
          acquiredAt: inv.acquiredAt,
        });
      }
    }
    return map;
  }, [snapshot.inventory, snapshot.equippedItemId]);

  const handlePurchase = async (item: SatchelItem) => {
    if (inFlightItemId) return;
    setErrorMessage(null);
    setRecentAcquisition(null);

    const requestId = crypto.randomUUID();
    setInFlightItemId(item.id);

    try {
      const result = await purchaseItemAction(supabaseClient, {
        requestId,
        itemId: item.id,
      });

      if (result.snapshot) {
        setSnapshot(result.snapshot);
      } else {
        // Fallback update if snapshot missing
        setSnapshot((prev) => ({
          ...prev,
          sparksBalance: Math.max(0, prev.sparksBalance - item.price),
          inventory: {
            items: [
              ...(prev.inventory?.items || []),
              {
                item,
                acquiredAt: new Date().toISOString(),
                equipped: false,
              },
            ],
          },
        }));
      }

      setRecentAcquisition(item.name);
      onMutationSuccess?.(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete purchase. Your Sparks were not deducted.');
    } finally {
      setInFlightItemId(null);
    }
  };

  const handleEquip = async (item: SatchelItem) => {
    if (inFlightItemId) return;
    setErrorMessage(null);

    const requestId = crypto.randomUUID();
    setInFlightItemId(item.id);

    try {
      const result = await equipItemAction(supabaseClient, {
        requestId,
        itemId: item.id,
      });

      if (result.snapshot) {
        setSnapshot(result.snapshot);
      } else {
        setSnapshot((prev) => ({
          ...prev,
          equippedItemId: item.id,
          inventory: {
            items: (prev.inventory?.items || []).map((inv) => ({
              ...inv,
              equipped: inv.item.id === item.id,
            })),
          },
        }));
      }

      onMutationSuccess?.(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to equip item.');
    } finally {
      setInFlightItemId(null);
    }
  };

  const adornments = items.filter((i) => i.category === 'cosmetic');
  const relics = items.filter((i) => i.category === 'relic');

  return (
    <div className={`world-satchel ${className}`}>
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {recentAcquisition && `Acquired ${recentAcquisition}. Sparks balance is now ${sparksBalance}.`}
        {errorMessage && `Error: ${errorMessage}`}
      </div>

      {/* Header & Sparks Balance Header */}
      <header className="satchel-header">
        <div className="satchel-header-titles">
          <h1 className="satchel-title">Satchel</h1>
          <p className="satchel-subtitle">
            Objects and relics carried along your path. Adorn your Hearth and preserve your momentum with earned Sparks.
          </p>
        </div>

        <div className="satchel-balance-card" aria-label={`Sparks balance: ${sparksBalance}`}>
          <div className="balance-icon-wrap" aria-hidden="true">
            <span className="balance-spark-glyph">✦</span>
          </div>
          <div className="balance-info">
            <span className="balance-label">Sparks Balance</span>
            <span className="balance-amount">{sparksBalance}</span>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div className="satchel-error-banner" role="alert">
          <span className="error-icon" aria-hidden="true">⚠</span>
          <span className="error-text">{errorMessage}</span>
          <button
            type="button"
            className="error-dismiss-btn"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Acquisition Moment Toast */}
      {recentAcquisition && (
        <div className="satchel-acquisition-banner" role="status">
          <span className="acquisition-icon" aria-hidden="true">✦</span>
          <span className="acquisition-text">
            <strong>{recentAcquisition}</strong> acquired and safely secured in your Satchel.
          </span>
          <button
            type="button"
            className="acquisition-dismiss-btn"
            onClick={() => setRecentAcquisition(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section 1: Hearth Adornments (Cosmetic) */}
      <section aria-labelledby="adornments-heading" className="satchel-section">
        <div className="section-header-wrap">
          <div className="section-title-row">
            <h2 id="adornments-heading" className="section-title">
              Hearth Adornments
            </h2>
            <span className="section-badge badge-cosmetic">Adornment · Cosmetic</span>
          </div>
          <p className="section-description">
            Bespoke physical vessels and atmospheric motes that visibly transform your daily Ember at the Hearth.
          </p>
        </div>

        <div className="satchel-grid">
          {adornments.map((item) => {
            const ownership = ownedItemsMap.get(item.id);
            const isOwned = Boolean(ownership);
            const isEquipped = Boolean(ownership?.equipped || snapshot.equippedItemId === item.id);
            const isAffordable = sparksBalance >= item.price;
            const diff = item.price - sparksBalance;
            const isLoading = inFlightItemId === item.id;

            return (
              <article
                key={item.id}
                className={`satchel-item-card ${isEquipped ? 'is-equipped' : isOwned ? 'is-owned' : ''}`}
                aria-labelledby={`item-title-${item.id}`}
              >
                <div className="item-card-top">
                  {/* Visual Specimen Plate */}
                  <div className={`item-specimen-plate relic-plate-${item.id}`}>
                    <div className="item-specimen-render" aria-hidden="true">
                      <span className={`specimen-artwork art-${item.id}`} />
                    </div>
                  </div>

                  <div className="item-meta">
                    <div className="item-title-row">
                      <h3 id={`item-title-${item.id}`} className="item-name">
                        {item.name}
                      </h3>
                      <div className="item-price-tag">
                        <span className="price-sparks-icon" aria-hidden="true">✦</span>
                        <span>{item.price} Sparks</span>
                      </div>
                    </div>
                    <p className="item-description">{item.description}</p>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="item-card-action">
                  {isEquipped ? (
                    <div className="status-badge equipped-badge" role="status">
                      <span className="badge-check" aria-hidden="true">✓</span>
                      <span>Equipped at Hearth</span>
                    </div>
                  ) : isOwned ? (
                    <button
                      type="button"
                      className="satchel-btn equip-btn"
                      onClick={() => handleEquip(item)}
                      disabled={isLoading}
                      aria-busy={isLoading}
                    >
                      {isLoading ? 'Equipping…' : 'Equip at Hearth'}
                    </button>
                  ) : isAffordable ? (
                    <button
                      type="button"
                      className="satchel-btn acquire-btn"
                      onClick={() => handlePurchase(item)}
                      disabled={isLoading}
                      aria-busy={isLoading}
                    >
                      {isLoading ? 'Acquiring…' : `Acquire — ${item.price} Sparks`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="satchel-btn unaffordable-btn"
                      disabled
                      aria-disabled="true"
                    >
                      Need {diff} more Sparks
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 2: Bounded Relics (Utility) */}
      <section aria-labelledby="relics-heading" className="satchel-section">
        <div className="section-header-wrap">
          <div className="section-title-row">
            <h2 id="relics-heading" className="section-title">
              Bounded Relics
            </h2>
            <span className="section-badge badge-relic">Relic · Utility</span>
          </div>
          <p className="section-description">
            Finite talismans that shield your discipline. Relics do not manufacture fake completions or award unearned XP.
          </p>
        </div>

        <div className="satchel-grid">
          {relics.map((item) => {
            const ownership = ownedItemsMap.get(item.id);
            const isOwned = Boolean(ownership);
            const isAffordable = sparksBalance >= item.price;
            const diff = item.price - sparksBalance;
            const isLoading = inFlightItemId === item.id;

            return (
              <article
                key={item.id}
                className={`satchel-item-card relic-card ${isOwned ? 'is-owned' : ''}`}
                aria-labelledby={`item-title-${item.id}`}
              >
                <div className="item-card-top">
                  {/* Visual Specimen Plate */}
                  <div className={`item-specimen-plate relic-plate-${item.id}`}>
                    <div className="item-specimen-render" aria-hidden="true">
                      <span className={`specimen-artwork art-${item.id}`} />
                    </div>
                  </div>

                  <div className="item-meta">
                    <div className="item-title-row">
                      <h3 id={`item-title-${item.id}`} className="item-name">
                        {item.name}
                      </h3>
                      <div className="item-price-tag">
                        <span className="price-sparks-icon" aria-hidden="true">✦</span>
                        <span>{item.price} Sparks</span>
                      </div>
                    </div>
                    <p className="item-description">{item.description}</p>
                    <div className="relic-mechanic-box">
                      <span className="mechanic-label">Bound Rules:</span>
                      <p className="mechanic-text">
                        Consumable shield. Automatically consumed upon your next missed calendar day to preserve your streak. Grants no XP.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="item-card-action">
                  {isOwned ? (
                    <div className="status-badge carried-badge" role="status">
                      <span className="badge-shield-icon" aria-hidden="true">🛡</span>
                      <span>Carried in Satchel (Ready)</span>
                    </div>
                  ) : isAffordable ? (
                    <button
                      type="button"
                      className="satchel-btn acquire-btn relic-acquire-btn"
                      onClick={() => handlePurchase(item)}
                      disabled={isLoading}
                      aria-busy={isLoading}
                    >
                      {isLoading ? 'Acquiring…' : `Acquire — ${item.price} Sparks`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="satchel-btn unaffordable-btn"
                      disabled
                      aria-disabled="true"
                    >
                      Need {diff} more Sparks
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

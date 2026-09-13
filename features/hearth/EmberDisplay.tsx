import React, { useEffect, useState } from 'react';
import type { EmberState } from './contracts';
import './EmberDisplay.css';

export interface EmberDisplayProps {
  state: EmberState;
  isRelit?: boolean;
  adornment?: string | null;
  className?: string;
}

const ADORNMENT_NAMES: Record<string, string> = {
  copper_halo: 'Copper Halo',
  firefly_orbit: 'Firefly Orbit',
  engraved_basin: 'Engraved Basin',
};

const EMBER_CONFIG: Record<
  EmberState,
  {
    title: string;
    stageBadge: string;
    description: string;
    flamePath: string;
  }
> = {
  resting: {
    title: 'Resting Ember',
    stageBadge: '0 Completed · Dormant',
    description: 'The coals rest in quiet slumber. Seal today’s first quest to kindle the flame.',
    // Slender sleeping spark motif
    flamePath: 'M50 78 C42 78 38 72 42 66 C46 60 48 52 50 46 C52 52 54 60 58 66 C62 72 58 78 50 78 Z',
  },
  kindled: {
    title: 'Kindled Ember',
    stageBadge: '1 Completed · Stirring',
    description: 'A warm flame stirs. Today’s first effort has breathed life into the hearth.',
    // Single rising flame tongue
    flamePath: 'M50 82 C38 82 34 72 38 60 C42 48 48 36 50 26 C52 36 58 48 62 60 C66 72 62 82 50 82 Z',
  },
  steady: {
    title: 'Steady Ember',
    stageBadge: '2 Completed · Burning',
    description: 'The fire burns with clear intent, casting light across your field journal.',
    // Dual-tiered steady flame
    flamePath: 'M50 84 C34 84 28 72 32 58 C35 48 42 42 45 32 C47 38 51 40 50 30 C53 38 62 44 65 54 C70 66 66 84 50 84 Z',
  },
  bright: {
    title: 'Bright Ember',
    stageBadge: '3+ Completed · Radiant',
    description: 'The hearth blazes at its peak, rich with vitality and enduring momentum.',
    // Triple-crowned expansive flame
    flamePath: 'M50 86 C30 86 22 72 26 56 C29 46 36 40 38 28 C42 38 46 40 48 20 C52 34 56 36 60 26 C64 38 72 46 75 58 C78 72 70 86 50 86 Z',
  },
};

/**
 * EmberDisplay — Hearth momentum indicator
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * 
 * Invariants:
 * - 4 distinct visual states without relying only on color (tactile shapes, multi-layer SVG contours, badges)
 * - Restrained organic breathing motion
 * - Pauses automatically when tab is hidden
 * - Respects prefers-reduced-motion
 * - NO persistence writes from animation callbacks
 */
export const EmberDisplay: React.FC<EmberDisplayProps> = ({
  state = 'resting',
  isRelit = false,
  adornment = null,
  className = '',
}) => {
  const [isTabHidden, setIsTabHidden] = useState(false);
  const currentConfig = EMBER_CONFIG[state] || EMBER_CONFIG.resting;
  const adornmentName = adornment ? ADORNMENT_NAMES[adornment] : null;

  // Performance rule: Pause idle animation when document.visibilityState === 'hidden'
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const containerClasses = [
    'ember-container',
    `ember-${state}`,
    adornment ? `has-adornment-${adornment}` : '',
    isTabHidden ? 'is-paused' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const brazierClasses = [
    'ember-brazier',
    isRelit ? 'is-relit' : '',
    adornment ? `brazier-adorned-${adornment}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={containerClasses}
      role="region"
      aria-label={`Daily Ember Momentum: ${currentConfig.title}${adornmentName ? `, Adorned with ${adornmentName}` : ''}`}
    >
      {/* Decorative hearth chamber aura */}
      <div className="ember-chamber-aura" aria-hidden="true" />

      {/* Tactile Brazier Vessel */}
      <div className={brazierClasses}>
        {/* Outer radial warmth halo */}
        <div className="ember-halo" aria-hidden="true" />

        {/* Equipped Hearth Adornment Layer */}
        {adornment === 'copper_halo' && (
          <div className="ember-adornment-layer layer-copper_halo" aria-hidden="true" />
        )}

        {adornment === 'firefly_orbit' && (
          <div className="ember-adornment-layer layer-firefly_orbit" aria-hidden="true">
            <span className="hearth-firefly-mote mote-a" />
            <span className="hearth-firefly-mote mote-b" />
            <span className="hearth-firefly-mote mote-c" />
            <span className="hearth-firefly-mote mote-d" />
          </div>
        )}

        {adornment === 'engraved_basin' && (
          <div className="ember-adornment-layer layer-engraved_basin" aria-hidden="true" />
        )}

        {/* Multi-layered Hearth Flame SVG */}
        <svg
          className="ember-flame-svg"
          viewBox="0 0 100 100"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* Ambient Base Glow */}
            <radialGradient id="emberGlowGrad" cx="50%" cy="65%" r="45%">
              <stop offset="0%" stopColor="var(--color-ember-core)" stopOpacity="0.8" />
              <stop offset="45%" stopColor="var(--color-ember)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Living Flame Gradient */}
            <linearGradient id="emberFlameGrad" x1="50%" y1="90%" x2="50%" y2="10%">
              <stop offset="0%" stopColor="var(--color-ember)" />
              <stop offset="60%" stopColor="var(--color-ember-core)" />
              <stop offset="100%" stopColor="var(--color-ember-core)" stopOpacity="0.95" />
            </linearGradient>

            {/* Internal Core Spark Gradient */}
            <radialGradient id="emberSparkGrad" cx="50%" cy="55%" r="35%">
              <stop offset="0%" stopColor="var(--color-ember-core)" />
              <stop offset="40%" stopColor="var(--color-ember-core)" />
              <stop offset="100%" stopColor="var(--color-ember)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Basin Bed / Charcoal Ash Shadow */}
          <ellipse cx="50" cy="80" rx="36" ry="12" className="ember-basin-base" />

          {/* Ambient Glow Disk */}
          <circle cx="50" cy="62" r="32" fill="url(#emberGlowGrad)" className="ember-glow-disk" />

          {/* Primary Flame Body with distinct state geometry */}
          <path
            d={currentConfig.flamePath}
            fill="url(#emberFlameGrad)"
            className="ember-flame-path"
          />

          {/* Inner Golden Spark Core */}
          <circle cx="50" cy="60" r="10" fill="url(#emberSparkGrad)" className="ember-inner-core" />
        </svg>

        {/* State-specific tactile decorative ring */}
        <div className="ember-basin-rim" aria-hidden="true" />
      </div>

      {/* Textual State Identification (Accessible & Clear without relying only on color) */}
      <div className="ember-info">
        <div className="ember-header-row">
          <h3 className="ember-title">{currentConfig.title}</h3>
          <span className="ember-stage-badge">{currentConfig.stageBadge}</span>
        </div>
        <p className="ember-description">{currentConfig.description}</p>
        {adornmentName && (
          <div className="ember-adornment-tag" aria-label={`Adornment: ${adornmentName}`}>
            <span className="adornment-glyph" aria-hidden="true">✦</span>
            <span>Adorned with {adornmentName}</span>
          </div>
        )}
      </div>
    </section>
  );
};

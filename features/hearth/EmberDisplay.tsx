import React, { useEffect, useState } from 'react';
import type { EmberState } from './contracts';
import './EmberDisplay.css';

export interface EmberDisplayProps {
  state: EmberState;
  isRelit?: boolean;
  className?: string;
}

const EMBER_DESCRIPTIONS: Record<EmberState, string> = {
  resting: 'The hearth rests in gentle slumber. Complete a task to rekindle.',
  kindled: 'A warm flame stirs. Today’s first effort has breathed life.',
  steady: 'The fire burns with clear intent, illuminating your path.',
  bright: 'The hearth glows at its peak, rich with vitality and focus.',
};

/**
 * EmberDisplay — Hearth momentum indicator
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 */
export const EmberDisplay: React.FC<EmberDisplayProps> = ({
  state = 'resting',
  isRelit = false,
  className = '',
}) => {
  const [isTabHidden, setIsTabHidden] = useState(false);

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
    isTabHidden ? 'is-paused' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const coreClasses = [
    'ember-core',
    isRelit ? 'ember-relit-animation' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} aria-label={`Ember state: ${state}`}>
      <div className="ember-brazier" role="img" aria-label={`Glow: ${state}`}>
        <div className="ember-halo" aria-hidden="true" />
        <div className={coreClasses} aria-hidden="true">
          <div className="ember-inner-spark" aria-hidden="true" />
        </div>
      </div>

      <div className="ember-status-label">{state} Ember</div>
      <p className="ember-status-description">{EMBER_DESCRIPTIONS[state]}</p>
    </div>
  );
};

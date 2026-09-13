'use client';

import React from 'react';
import type { GameSnapshot } from '@/game/contracts';
import './RootProgressionRail.css';

export interface RootProgressionRailProps {
  snapshot?: GameSnapshot;
  className?: string;
}

export interface ProgressionStage {
  id: string;
  name: string;
  thresholdXp: number;
  description: string;
  badge: string;
}

export const PROGRESSION_STAGES: ProgressionStage[] = [
  {
    id: 'seed',
    name: 'Dormant Seed',
    thresholdXp: 0,
    description: 'Slumbering soil awaiting intention',
    badge: 'Stage 0',
  },
  {
    id: 'sprout',
    name: 'Origin Sprout',
    thresholdXp: 1,
    description: 'First spark ignited into living root',
    badge: 'Stage I',
  },
  {
    id: 'fork',
    name: 'Specialization Fork',
    thresholdXp: 80,
    description: 'Diverging canopy path chosen',
    badge: 'Stage II',
  },
  {
    id: 'crest',
    name: 'Mastery Crest',
    thresholdXp: 160,
    description: 'Sacred trial completed & claimed',
    badge: 'Stage III',
  },
];

export const RootProgressionRail: React.FC<RootProgressionRailProps> = ({
  snapshot,
  className = '',
}) => {
  const totalXp = snapshot?.totalXp ?? 0;

  // Determine current active stage index
  const activeIndex =
    totalXp >= 160 ? 3 : totalXp >= 80 ? 2 : totalXp >= 1 ? 1 : 0;

  return (
    <nav
      className={'root-progression-rail-wrapper ' + className}
      aria-label="Root Biological Progression Stages"
    >
      <div className="root-progression-rail-header">
        <span className="root-progression-rail-eyebrow">Botanical Evolution Stages</span>
        <span className="root-progression-rail-hint">Swipe horizontally to inspect all milestones</span>
      </div>

      <div className="root-progression-rail-scroller" data-testid="root-progression-rail">
        {PROGRESSION_STAGES.map((stage, idx) => {
          const isReached = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={stage.id}>
              <div
                className={'root-rail-card ' + (isReached ? 'is-reached ' : '') + (isCurrent ? 'is-current' : '')}
                data-testid={'rail-stage-' + stage.id}
                tabIndex={0}
                role="article"
                aria-label={stage.name + ' - ' + stage.thresholdXp + ' XP. ' + stage.description + '. ' + (isCurrent ? 'Current Stage' : isReached ? 'Achieved' : 'Locked')}
              >
                <div className="rail-card-top">
                  <span className="rail-card-indicator" aria-hidden="true">
                    {isCurrent ? '●' : isReached ? '✓' : '○'}
                  </span>
                  <span className="rail-card-badge">{stage.badge}</span>
                  <span className="rail-card-xp">{stage.thresholdXp} XP</span>
                </div>

                <div className="rail-card-body">
                  <h4 className="rail-card-title">{stage.name}</h4>
                  <p className="rail-card-desc">{stage.description}</p>
                </div>

                <div className="rail-card-status">
                  {isCurrent ? (
                    <span className="status-pill current">Current Focus</span>
                  ) : isReached ? (
                    <span className="status-pill achieved">Unlocked</span>
                  ) : (
                    <span className="status-pill locked">Locked ({stage.thresholdXp} XP)</span>
                  )}
                </div>
              </div>

              {idx < PROGRESSION_STAGES.length - 1 && (
                <div className="rail-connector" aria-hidden="true">
                  <span className="rail-connector-arrow">→</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

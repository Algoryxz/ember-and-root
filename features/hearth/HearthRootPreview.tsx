import React from 'react';
import type { AttributeId, BranchState } from './contracts';
import './HearthRootPreview.css';

export interface HearthRootPreviewProps {
  branches: Record<AttributeId, BranchState>;
  highlightAttribute?: AttributeId | null;
  onNavigateToRoot?: () => void;
  className?: string;
}

const ATTRIBUTES: AttributeId[] = ['mind', 'body', 'will', 'craft'];

const ATTRIBUTE_LABELS: Record<AttributeId, string> = {
  mind: 'Mind',
  body: 'Body',
  will: 'Will',
  craft: 'Craft',
};

function getMilestoneNotice(branch: BranchState): { text: string; isReady: boolean } {
  if (branch.xp === 0) {
    return { text: 'Sprout dormant (awakens at 1 XP)', isReady: false };
  }
  if (branch.specializationAvailable) {
    return { text: '✦ Specialization fork ready to choose', isReady: true };
  }
  if (branch.specialization) {
    if (branch.crestClaimed) {
      return { text: `Mastery Crest claimed (${branch.specialization})`, isReady: false };
    }
    if (branch.crestAvailable) {
      return { text: '✦ Mastery Crest ready to claim', isReady: true };
    }
    return { text: `Path: ${branch.specialization} (160 XP to Crest)`, isReady: false };
  }
  return { text: `${80 - branch.xp} XP until specialization fork`, isReady: false };
}

/**
 * HearthRootPreview — Compact Root advancement preview
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * 
 * Invariants:
 * - Presentation boundary only: consumes authoritative branches from GameSnapshot
 * - Does NOT compute Root SVG geometry (owned by Akriti)
 * - Highlights active branch advancement after quest completion
 */
export const HearthRootPreview: React.FC<HearthRootPreviewProps> = ({
  branches,
  highlightAttribute = null,
  onNavigateToRoot,
  className = '',
}) => {
  return (
    <section
      className={`root-preview-container ${className}`}
      aria-labelledby="root-preview-heading"
    >
      <div className="root-preview-header">
        <div>
          <h3 id="root-preview-heading" className="root-preview-title">
            Root Growth
          </h3>
          <span className="root-preview-subtitle">Permanent Becoming</span>
        </div>
        {onNavigateToRoot ? (
          <button
            type="button"
            className="root-preview-link-btn"
            onClick={onNavigateToRoot}
          >
            Explore Root →
          </button>
        ) : (
          <a href="#root" className="root-preview-link">
            Explore Root →
          </a>
        )}
      </div>

      <p className="root-motto">“What you do becomes who you are.”</p>

      <div className="root-branches-grid" role="list">
        {ATTRIBUTES.map((attr) => {
          const branch = branches[attr] || {
            attribute: attr,
            xp: 0,
            specialization: null,
            selectedAt: null,
            sproutAvailable: false,
            specializationAvailable: false,
            crestAvailable: false,
            trialStarted: false,
            trialComplete: false,
            crestClaimed: false,
          };

          const milestone = getMilestoneNotice(branch);
          // 80 XP is fork, 160 XP is Crest
          const maxTarget = branch.specialization ? 160 : 80;
          const progressPercent = Math.min(100, Math.round((branch.xp / maxTarget) * 100));
          const isHighlighted = highlightAttribute === attr;

          return (
            <div
              key={attr}
              className={`root-branch-card ${isHighlighted ? 'is-highlighted' : ''}`}
              role="listitem"
            >
              <div className="branch-meta-row">
                <span className={`branch-name-label branch-${attr}`}>
                  {ATTRIBUTE_LABELS[attr]}
                </span>
                <span className="branch-xp-value">{branch.xp} XP</span>
              </div>

              {/* Progress track */}
              <div className="branch-progress-track" aria-hidden="true">
                <div
                  className={`branch-progress-bar bar-${attr}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className={`branch-milestone-text ${milestone.isReady ? 'is-ready' : ''}`}>
                <span>{milestone.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

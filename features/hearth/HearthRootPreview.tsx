import React from 'react';
import type { AttributeId, BranchState } from './contracts';
import './HearthRootPreview.css';

export interface HearthRootPreviewProps {
  branches: Record<AttributeId, BranchState>;
  highlightAttribute?: AttributeId | null;
  className?: string;
}

const ATTRIBUTES: AttributeId[] = ['mind', 'body', 'will', 'craft'];

function getMilestoneText(branch: BranchState): { text: string; isReady: boolean } {
  if (branch.xp === 0) {
    return { text: 'Sprout awakens at 1 XP', isReady: false };
  }
  if (branch.specializationAvailable) {
    return { text: '✦ Specialization ready to choose', isReady: true };
  }
  if (branch.specialization) {
    if (branch.crestClaimed) {
      return { text: 'Crest of Mastery claimed', isReady: false };
    }
    if (branch.crestAvailable) {
      return { text: '✦ Crest available to claim', isReady: true };
    }
    return { text: `Path: ${branch.specialization} (Next: 160 XP)`, isReady: false };
  }
  return { text: `${80 - branch.xp} XP until specialization fork`, isReady: false };
}

/**
 * HearthRootPreview — Compact Root advancement preview
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 */
export const HearthRootPreview: React.FC<HearthRootPreviewProps> = ({
  branches,
  highlightAttribute = null,
  className = '',
}) => {
  return (
    <div className={`root-preview-container ${className}`}>
      <div className="root-preview-header">
        <h3 className="root-preview-title">Root Growth</h3>
        <span className="root-preview-subtitle">Permanent Growth</span>
      </div>

      <p className="root-motto">“What you do becomes who you are.”</p>

      <div className="root-branches-list" role="list">
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

          const milestone = getMilestoneText(branch);
          // 80 XP is fork, 160 XP is Crest
          const maxTarget = branch.specialization ? 160 : 80;
          const progressPercent = Math.min(100, Math.round((branch.xp / maxTarget) * 100));
          const isHighlighted = highlightAttribute === attr;

          return (
            <div key={attr} className="root-branch-row" role="listitem">
              <div className="root-branch-meta">
                <span className="root-branch-name">{attr}</span>
                <span className="root-branch-xp">{branch.xp} XP</span>
              </div>

              <div className="root-progress-track" aria-hidden="true">
                <div
                  className={`root-progress-bar ${isHighlighted ? 'root-advance-flash' : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className={`root-branch-milestone ${milestone.isReady ? 'is-ready' : ''}`}>
                <span>{milestone.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

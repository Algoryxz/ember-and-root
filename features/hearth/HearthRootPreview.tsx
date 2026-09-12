import React, { useState } from 'react';
import type { AttributeId, BranchState } from './contracts';
import { BranchSvgRenderer } from '../root/svg/BranchSvgRenderer';
import { BRANCH_CONFIGS } from '../root/config';
import type { NodeState, RootNodeInfo } from '../root/types';
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
 * Derive canonical SVG node states matching features/root/RootBranch.tsx
 * Consumes Akriti's canonical SVG anatomy and branch configs without inventing geometry.
 */
function deriveCanonicalBranchNodes(attribute: AttributeId, branch: BranchState): RootNodeInfo[] {
  const config = BRANCH_CONFIGS[attribute];
  const activeSpec = branch.specialization;
  const originState: NodeState = branch.xp >= 1 ? 'unlocked' : 'locked';

  const spec1 = config.specializations[0];
  const spec2 = config.specializations[1];

  let spec1State: NodeState = 'locked';
  let spec2State: NodeState = 'locked';

  if (activeSpec === spec1.id) {
    spec1State = 'selected';
    spec2State = 'locked';
  } else if (activeSpec === spec2.id) {
    spec2State = 'selected';
    spec1State = 'locked';
  } else if (branch.specializationAvailable) {
    spec1State = 'available';
    spec2State = 'available';
  }

  const spec1CrestState: NodeState =
    activeSpec === spec1.id
      ? branch.crestClaimed
        ? 'selected'
        : branch.crestAvailable
        ? 'available'
        : branch.trialComplete
        ? 'unlocked'
        : 'locked'
      : 'locked';

  const spec2CrestState: NodeState =
    activeSpec === spec2.id
      ? branch.crestClaimed
        ? 'selected'
        : branch.crestAvailable
        ? 'available'
        : branch.trialComplete
        ? 'unlocked'
        : 'locked'
      : 'locked';

  return [
    {
      id: config.originNode.id,
      label: config.originNode.label,
      subtitle: config.originNode.subtitle,
      type: 'origin',
      state: originState,
      xpRequired: 1,
      description: config.originNode.description,
      coordinates: { x: 180, y: 80, percentX: 50, percentY: 16.6 },
    },
    {
      id: spec1.id,
      label: spec1.label,
      subtitle: spec1.subtitle,
      type: 'specialization',
      specializationKey: spec1.id,
      state: spec1State,
      xpRequired: 80,
      description: spec1.description,
      coordinates: { x: 100, y: 220, percentX: 27.7, percentY: 45.8 },
    },
    {
      id: spec2.id,
      label: spec2.label,
      subtitle: spec2.subtitle,
      type: 'specialization',
      specializationKey: spec2.id,
      state: spec2State,
      xpRequired: 80,
      description: spec2.description,
      coordinates: { x: 260, y: 220, percentX: 72.2, percentY: 45.8 },
    },
    {
      id: spec1.crest.id,
      label: spec1.crest.label,
      subtitle: spec1.crest.subtitle,
      type: 'crest',
      state: spec1CrestState,
      xpRequired: 160,
      description: spec1.crest.description,
      coordinates: { x: 60, y: 380, percentX: 16.6, percentY: 79.1 },
    },
    {
      id: spec2.crest.id,
      label: spec2.crest.label,
      subtitle: spec2.crest.subtitle,
      type: 'crest',
      state: spec2CrestState,
      xpRequired: 160,
      description: spec2.crest.description,
      coordinates: { x: 300, y: 380, percentX: 83.3, percentY: 79.1 },
    },
  ];
}

/**
 * HearthRootPreview — Compact Root Specimen Cutting
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Contemporary Botanical Field Folio
 * 
 * EXPERIENCE V2 REFACTOR:
 * Replaces the 4-card dashboard progress-bar grid with ONE authored compact specimen cutting.
 * Consumes Akriti's canonical BranchSvgRenderer for authoritative visual anatomy.
 * Preserves RewardSequence DOM anchor points:
 *   - .root-preview-container
 *   - .branch-name-label.branch-{attr}
 *   - .root-branch-card.is-highlighted (aliased to specimen active leaf)
 */
export const HearthRootPreview: React.FC<HearthRootPreviewProps> = ({
  branches,
  highlightAttribute = null,
  onNavigateToRoot,
  className = '',
}) => {
  // Determine initially inspected cutting: prefer the active highlight attribute or the highest XP branch
  const getMostActiveAttribute = (): AttributeId => {
    if (highlightAttribute) return highlightAttribute;
    let maxAttr: AttributeId = 'mind';
    let maxXp = -1;
    for (const attr of ATTRIBUTES) {
      const b = branches[attr];
      if (b && b.xp > maxXp) {
        maxXp = b.xp;
        maxAttr = attr;
      }
    }
    return maxAttr;
  };

  const [selectedAttribute, setSelectedAttribute] = useState<AttributeId>(getMostActiveAttribute());

  // If external highlight changes due to a sealed quest, focus that cutting immediately
  React.useEffect(() => {
    if (highlightAttribute) {
      setSelectedAttribute(highlightAttribute);
    }
  }, [highlightAttribute]);

  const activeBranch: BranchState = branches[selectedAttribute] || {
    attribute: selectedAttribute,
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

  const activeConfig = BRANCH_CONFIGS[selectedAttribute];
  const activeMilestone = getMilestoneNotice(activeBranch);
  const canonicalNodes = deriveCanonicalBranchNodes(selectedAttribute, activeBranch);
  const isHighlighted = highlightAttribute === selectedAttribute;

  return (
    <section
      className={`root-preview-container ${className}`}
      aria-labelledby="root-specimen-heading"
    >
      {/* Specimen Folio Header */}
      <div className="root-specimen-header">
        <div className="root-specimen-title-group">
          <span className="root-specimen-label">Botanical Specimen · Folio Cutting</span>
          <h3 id="root-specimen-heading" className="root-specimen-title">
            The Living Root
          </h3>
        </div>
        {onNavigateToRoot ? (
          <button
            type="button"
            className="root-specimen-link-btn"
            onClick={onNavigateToRoot}
            aria-label="Inspect complete Root specimen"
          >
            Full Organism →
          </button>
        ) : (
          <a href="/root" className="root-specimen-link" aria-label="Inspect complete Root specimen">
            Full Organism →
          </a>
        )}
      </div>

      {/* Specimen Cutting Showcase: One Canonical SVG Organism Cutting */}
      <div className={`root-specimen-stage ${isHighlighted ? 'is-highlighted' : ''}`}>
        <div className="root-specimen-visual" aria-hidden="true">
          <BranchSvgRenderer
            attribute={selectedAttribute}
            nodes={canonicalNodes}
            selectedSpecialization={activeBranch.specialization}
          />
        </div>

        {/* Marginal Field Annotation Overlay */}
        <div className="root-specimen-annotation">
          <div className="specimen-annotation-badge">
            <span className={`branch-name-label branch-${selectedAttribute}`}>
              {ATTRIBUTE_LABELS[selectedAttribute]}
            </span>
            <span className="specimen-xp-value">{activeBranch.xp} XP</span>
          </div>

          <p className="specimen-growth-state">
            {activeBranch.xp === 0
              ? 'Dormant seed tissue. First declared effort awakens its filament.'
              : activeBranch.specialization
              ? `Limb committed to the ${activeBranch.specialization} discipline.`
              : 'Primary stem active. Nearing prospective specialization fork.'}
          </p>

          <div className={`specimen-milestone-indicator ${activeMilestone.isReady ? 'is-ready' : ''}`}>
            <span>{activeMilestone.text}</span>
          </div>
        </div>
      </div>

      {/* Restrained Specimen Filaments Index (Replaces the 4 SaaS cards with quiet botanical annotations) */}
      <div className="root-filaments-index" role="tablist" aria-label="Root branch cuttings">
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

          const isSelected = selectedAttribute === attr;
          const isBranchHighlighted = highlightAttribute === attr;

          return (
            <button
              key={attr}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`root-filament-chip root-branch-card ${isSelected ? 'is-selected' : ''} ${
                isBranchHighlighted ? 'is-highlighted' : ''
              }`}
              onClick={() => setSelectedAttribute(attr)}
              aria-label={`Inspect ${ATTRIBUTE_LABELS[attr]} cutting (${branch.xp} XP)`}
            >
              <span className={`filament-dot branch-${attr}`} aria-hidden="true" />
              <span className={`branch-name-label branch-${attr}`}>{ATTRIBUTE_LABELS[attr]}</span>
              <span className="filament-xp-value">{branch.xp} XP</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

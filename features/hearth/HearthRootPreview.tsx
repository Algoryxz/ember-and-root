import React, { useState, useEffect } from 'react';
import type { AttributeId, BranchState } from './contracts';
import { BranchSvgRenderer } from '../root/svg/BranchSvgRenderer';
import { BRANCH_CONFIGS } from '../root/config';
import type { NodeState, RootNodeInfo } from '../root/types';
import './HearthRootPreview.css';

export interface HearthRootPreviewProps {
  branches: Record<AttributeId, BranchState>;
  highlightAttribute?: AttributeId | null;
  hoverAttribute?: AttributeId | null;
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

interface AnatomicalMarker {
  key: string;
  name: string;
  thresholdXp: number;
  description: string;
}

const ANATOMICAL_MARKERS: AnatomicalMarker[] = [
  { key: 'seed', name: 'Dormant Seed', thresholdXp: 0, description: 'Slumbering soil awaiting intention.' },
  { key: 'sprout', name: 'Origin Sprout', thresholdXp: 1, description: 'First declared effort takes root.' },
  { key: 'fork', name: 'Specialization Fork', thresholdXp: 80, description: 'Branches divide into distinct disciplines.' },
  { key: 'crest', name: 'Mastery Crest', thresholdXp: 160, description: 'Proven endurance crowns the living branch.' },
];

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
 * HearthRootPreview — Living Root Specimen Plate
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Contemporary Botanical Field Folio
 * 
 * Invariants:
 * - Consumes Akriti's canonical BranchSvgRenderer for authoritative visual anatomy.
 * - ZERO independent or invented Root geometry.
 * - Subtle Quest -> Root resonance on quest hover/focus (presentation only).
 * - Progression states rendered as quiet specimen anatomical markers (no 4 SaaS cards).
 * - Preserves RewardSequence DOM anchor points:
 *     .root-preview-container
 *     .branch-name-label.branch-{attr}
 *     .root-branch-card.is-highlighted
 */
export const HearthRootPreview: React.FC<HearthRootPreviewProps> = ({
  branches,
  highlightAttribute = null,
  hoverAttribute = null,
  onNavigateToRoot,
  className = '',
}) => {
  // Determine initially inspected cutting: prefer highest XP branch
  const getMostActiveAttribute = (): AttributeId => {
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

  // If external highlight changes from completed quest, focus that cutting
  useEffect(() => {
    if (highlightAttribute) {
      setSelectedAttribute(highlightAttribute);
    }
  }, [highlightAttribute]);

  // Displayed cutting responds to quest hover for instant visual feedback, returning to selected
  const displayedAttribute = hoverAttribute || highlightAttribute || selectedAttribute;
  const isResonating = Boolean(hoverAttribute && hoverAttribute === displayedAttribute);

  const activeBranch: BranchState = branches[displayedAttribute] || {
    attribute: displayedAttribute,
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

  const activeMilestone = getMilestoneNotice(activeBranch);
  const canonicalNodes = deriveCanonicalBranchNodes(displayedAttribute, activeBranch);
  const isHighlighted = highlightAttribute === displayedAttribute;

  // Determine active anatomical marker for quiet marginal annotation
  const currentStageIndex =
    activeBranch.xp >= 160 ? 3 : activeBranch.xp >= 80 ? 2 : activeBranch.xp >= 1 ? 1 : 0;

  return (
    <aside
      className={`root-preview-container ${className} ${isResonating ? 'has-quest-resonance' : ''}`}
      aria-labelledby="root-specimen-heading"
    >
      {/* Specimen Folio Plate Header */}
      <div className="root-specimen-header">
        <div className="root-specimen-folio-meta">
          <span className="specimen-folio-tag" aria-hidden="true">
            PLATE IV · LIVING SPECIMEN CUTTING
          </span>
          <h3 id="root-specimen-heading" className="root-specimen-title">
            The Living Root
          </h3>
        </div>
        {onNavigateToRoot ? (
          <button
            type="button"
            className="root-specimen-link-btn"
            onClick={onNavigateToRoot}
            aria-label="Inspect complete Root organism"
          >
            Full Organism →
          </button>
        ) : (
          <a href="/root" className="root-specimen-link" aria-label="Inspect complete Root organism">
            Full Organism →
          </a>
        )}
      </div>

      {/* Specimen Plate Frame */}
      <div
        className={`root-specimen-plate ${isHighlighted ? 'is-highlighted' : ''} ${
          isResonating ? 'is-resonating' : ''
        }`}
      >
        {/* Authoritative SVG Cutting from Akriti */}
        <div className="root-specimen-visual" aria-hidden="true">
          <BranchSvgRenderer
            attribute={displayedAttribute}
            nodes={canonicalNodes}
            selectedSpecialization={activeBranch.specialization}
          />
        </div>

        {/* Marginal Anatomical Progression Rail */}
        <div className="specimen-anatomy-rail" aria-label="Botanical progression markers">
          <div className="anatomy-rail-line" aria-hidden="true" />
          {ANATOMICAL_MARKERS.map((marker, idx) => {
            const isReached = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={marker.key}
                className={`anatomy-marker-item ${isReached ? 'is-reached' : ''} ${
                  isCurrent ? 'is-current' : ''
                }`}
              >
                <span className="marker-dot" aria-hidden="true">
                  {isCurrent ? '●' : isReached ? '○' : '·'}
                </span>
                <div className="marker-text-cluster">
                  <span className="marker-name">{marker.name}</span>
                  <span className="marker-threshold">{marker.thresholdXp} XP</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Marginal Specimen Status Annotation */}
        <div className="root-specimen-annotation">
          <div className="specimen-annotation-badge">
            <span className={`branch-name-label branch-${displayedAttribute}`}>
              {ATTRIBUTE_LABELS[displayedAttribute]} Branch
            </span>
            <span className="specimen-xp-value">{activeBranch.xp} XP</span>
          </div>

          <div className={`specimen-milestone-indicator ${activeMilestone.isReady ? 'is-ready' : ''}`}>
            <span>{activeMilestone.text}</span>
          </div>
        </div>
      </div>

      {/* Restrained Specimen Filaments Index (Mind, Body, Will, Craft) */}
      <div className="root-filaments-index root-branches-grid" role="tablist" aria-label="Root branch cuttings">
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

          const isSelected = displayedAttribute === attr;
          const isBranchHighlighted = highlightAttribute === attr;
          const isAttrResonating = hoverAttribute === attr;

          return (
            <button
              key={attr}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`root-filament-chip root-branch-card ${isSelected ? 'is-selected' : ''} ${
                isBranchHighlighted ? 'is-highlighted' : ''
              } ${isAttrResonating ? 'is-resonating' : ''}`}
              onClick={() => setSelectedAttribute(attr)}
              aria-label={`Inspect ${ATTRIBUTE_LABELS[attr]} cutting (${branch.xp} XP)`}
            >
              <span className={`filament-dot branch-${attr}`} aria-hidden="true" />
              <span className={`branch-name-label branch-${attr}`}>{ATTRIBUTE_LABELS[attr]}</span>
              <span className="filament-xp-value branch-xp-value">{branch.xp} XP</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

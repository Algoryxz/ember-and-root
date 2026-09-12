'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BranchSvgRenderer } from '../../features/root/svg/BranchSvgRenderer';
import { BRANCH_CONFIGS } from '../../features/root/config';
import type { NodeState, RootNodeInfo } from '../../features/root/types';
import type { AttributeId, BranchState } from '../../features/hearth/contracts';
import { DEMO_SNAPSHOT } from '../../game/fixtures/snapshot';
import { CinematicHero } from './CinematicHero';
import './LandingView.css';

const ATTRIBUTES: AttributeId[] = ['mind', 'body', 'will', 'craft'];

const ATTRIBUTE_LABELS: Record<AttributeId, string> = {
  mind: 'Mind',
  body: 'Body',
  will: 'Will',
  craft: 'Craft',
};

interface RitualStep {
  number: string;
  title: string;
  actionWord: string;
  description: string;
  consequence: string;
  glyph: string;
}

const RITUAL_STEPS: RitualStep[] = [
  {
    number: '01',
    title: 'Inscribe',
    actionWord: 'Declare intention',
    description: 'Choose meaningful daily practices aligned with Mind, Body, Will, or Craft in your field journal.',
    consequence: 'The entry awaits your real effort in the waking world.',
    glyph: '✎',
  },
  {
    number: '02',
    title: 'Act',
    actionWord: 'Carry through',
    description: 'Engage with your practice outside the screen. No synthetic timers, tracking gimmicks, or surveillance.',
    consequence: 'Real work is done where it matters most.',
    glyph: '✦',
  },
  {
    number: '03',
    title: 'Seal',
    actionWord: 'Stamp impression',
    description: 'Confirm completion with a tactile wax seal in your journal. Sealing is a deliberate personal testimony.',
    consequence: 'The practice becomes permanent in today’s folio.',
    glyph: '◎',
  },
  {
    number: '04',
    title: 'Ember Responds',
    actionWord: 'Daily momentum',
    description: 'Today’s brazier stirs from resting coals to vigorous flame, casting warmth across your field journal.',
    consequence: 'Present-day momentum is visibly ignited.',
    glyph: '🔥',
  },
  {
    number: '05',
    title: 'Root Grows',
    actionWord: 'Permanent becoming',
    description: 'Effort travels into the living organism. Branches thicken, forks awaken, and mastery crests bloom.',
    consequence: 'Who you become is permanently shaped.',
    glyph: '🌱',
  },
];

interface SpecimenMarker {
  name: string;
  threshold: string;
  description: string;
}

const SPECIMEN_MARKERS: SpecimenMarker[] = [
  { name: 'Dormant Seed', threshold: '0 XP', description: 'Slumbering soil awaiting your first commitment.' },
  { name: 'Origin Sprout', threshold: '1 XP', description: 'First practice awakens life. A resilient shoot takes root.' },
  { name: 'Specialization Fork', threshold: '80 XP', description: 'Branches divide into distinct disciplines like Scholar or Explorer.' },
  { name: 'Mastery Crest', threshold: '160 XP', description: 'Enduring discipline proven through trials. A permanent crest blooms.' },
];

/**
 * Derive canonical SVG node states for Landing specimen demonstration
 * Integration boundary: Consumes Akriti's canonical SVG anatomy and branch configs.
 * DEPENDS ON AKRITI: Replace with canonical Root Specimen V1 when delivered.
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
 * LandingView — Public Entry Surface
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Contemporary Botanical Field Folio
 * 
 * Replaces generic 4-card SaaS grids with:
 * 1. ONE authored interactive causal loop folio (Inscribe -> Act -> Seal -> Ember -> Root)
 * 2. ONE botanical living specimen plate showing permanent becoming
 */
export function LandingView() {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeId>('mind');

  const activeStep = RITUAL_STEPS[activeStepIndex];
  const demoBranches = DEMO_SNAPSHOT.branches;
  const activeBranch: BranchState = demoBranches[selectedAttribute] || {
    attribute: selectedAttribute,
    xp: 85,
    specialization: 'Scholar',
    selectedAt: null,
    sproutAvailable: false,
    specializationAvailable: false,
    crestAvailable: true,
    trialStarted: false,
    trialComplete: false,
    crestClaimed: false,
  };

  const canonicalNodes = deriveCanonicalBranchNodes(selectedAttribute, activeBranch);

  return (
    <div className="landing-shell">
      {/* 1. Full Viewport Cinematic Botanical Hero */}
      <CinematicHero />

      {/* Main Landing Canvas */}
      <main className="landing-content">
        {/* ==================================================================
            SECTION 2: The Causal Ritual Loop (Editorial Demonstration Folio)
            Replaces the 4-card grid with ONE authored causal experience
            ================================================================== */}
        <section id="ritual-section" className="landing-loop-section" aria-labelledby="loop-title">
          <div className="section-heading-cluster">
            <div className="section-eyebrow">The Daily Rhythm</div>
            <h2 id="loop-title" className="section-title">
              The Causal Ritual
            </h2>
            <p className="section-desc">
              Every practice follows a physical cause-and-effect loop. No abstract scores, no synthetic dopamine traps.
            </p>
          </div>

          {/* Authored Editorial Demonstration Folio */}
          <div className="ritual-folio-spread">
            {/* Step Navigation Rail */}
            <div className="ritual-step-rail" role="tablist" aria-label="Ritual progression steps">
              {RITUAL_STEPS.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                return (
                  <button
                    key={step.number}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`ritual-rail-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveStepIndex(idx)}
                  >
                    <span className="rail-step-num">{step.number}</span>
                    <span className="rail-step-name">{step.title}</span>
                    <span className="rail-step-action">{step.actionWord}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Stage Editorial Leaf */}
            <div className="ritual-stage-leaf" role="tabpanel" aria-label={`Details for ${activeStep.title}`}>
              <div className="leaf-header-row">
                <span className="leaf-glyph" aria-hidden="true">{activeStep.glyph}</span>
                <span className="leaf-step-badge">Stage {activeStep.number} · {activeStep.title}</span>
              </div>

              <h3 className="leaf-title">{activeStep.actionWord}</h3>
              <p className="leaf-description">{activeStep.description}</p>

              <div className="leaf-consequence-box">
                <span className="consequence-tag" aria-hidden="true">Physical Consequence</span>
                <p className="consequence-text">{activeStep.consequence}</p>
              </div>

              <div className="leaf-rule-line" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 3: Permanent Becoming (Botanical Specimen Plate)
            Replaces the 4 evolution cards with ONE living specimen cutting
            ================================================================== */}
        <section className="landing-specimen-section" aria-labelledby="specimen-title">
          <div className="section-heading-cluster">
            <div className="section-eyebrow">Permanent Becoming</div>
            <h2 id="specimen-title" className="section-title">
              An Organism Shaped by Real Days
            </h2>
            <p className="section-desc">
              Your Root never resets at midnight. Every effort accumulates permanently into living branches, branching paths, and claimed crests.
            </p>
          </div>

          {/* Authored Botanical Plate Showcase */}
          <div className="landing-specimen-plate">
            <div className="specimen-plate-header">
              <div className="specimen-tag-cluster">
                <span className="specimen-plate-tag" aria-hidden="true">
                  PLATE I · CANONICAL CUTTING ({ATTRIBUTE_LABELS[selectedAttribute]})
                </span>
                <h3 className="specimen-plate-title">The Living Root Specimen</h3>
              </div>

              {/* Filament Discipline Selector */}
              <div className="specimen-discipline-tabs" role="tablist" aria-label="Specimen branch disciplines">
                {ATTRIBUTES.map((attr) => {
                  const isSelected = attr === selectedAttribute;
                  return (
                    <button
                      key={attr}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`discipline-tab-btn ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedAttribute(attr)}
                    >
                      <span className={`discipline-dot attr-${attr}`} aria-hidden="true" />
                      <span>{ATTRIBUTE_LABELS[attr]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specimen Visual & Marginal Progression */}
            <div className="specimen-stage-grid">
              {/* Canonical SVG Organism Cutting from Akriti */}
              <div className="specimen-svg-viewport" aria-hidden="true">
                <BranchSvgRenderer
                  attribute={selectedAttribute}
                  nodes={canonicalNodes}
                  selectedSpecialization={activeBranch.specialization}
                />
              </div>

              {/* Marginal Anatomical Progression Rail */}
              <div className="specimen-anatomy-legend">
                <span className="anatomy-legend-heading">Botanical Milestones</span>
                <div className="anatomy-legend-list">
                  {SPECIMEN_MARKERS.map((marker, idx) => (
                    <div key={marker.name} className="anatomy-legend-item">
                      <span className="legend-marker-dot" aria-hidden="true">
                        {idx <= 2 ? '●' : '○'}
                      </span>
                      <div className="legend-marker-text">
                        <div className="legend-marker-top">
                          <span className="legend-marker-name">{marker.name}</span>
                          <span className="legend-marker-xp">{marker.threshold}</span>
                        </div>
                        <p className="legend-marker-desc">{marker.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 4: Closing Field Journal Invitation
            ================================================================== */}
        <section className="landing-closing-section" aria-labelledby="closing-title">
          <div className="closing-flame-dot" aria-hidden="true" />
          <h2 id="closing-title" className="closing-title">
            Begin your personal chronicle today.
          </h2>
          <p className="closing-desc">
            No synthetic streaks, no commercial noise. Just your genuine days and what they become.
          </p>
          <div className="landing-cta-group">
            <Link href="/signup" className="btn-primary-cta">
              Begin your path →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>Ember &amp; Root · “What you do becomes who you are.”</p>
      </footer>
    </div>
  );
}

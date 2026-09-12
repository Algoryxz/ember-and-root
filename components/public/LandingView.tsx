'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { BranchSvgRenderer } from '../../features/root/svg/BranchSvgRenderer';
import { BRANCH_CONFIGS } from '../../features/root/config';
import type { NodeState, RootNodeInfo } from '../../features/root/types';
import type { AttributeId, BranchState } from '../../features/hearth/contracts';
import { DEMO_SNAPSHOT } from '../../game/fixtures/snapshot';
import { EmberObject } from './EmberObject';
import { ScrollRootSpine } from './ScrollRootSpine';
import { PathButton } from '../ui/PathButton';
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
  { name: 'Origin Sprout', threshold: '20 XP', description: 'First practice awakens life. A resilient shoot takes root.' },
  { name: 'Specialization Fork', threshold: '80 XP', description: 'Branches divide into distinct disciplines like Scholar or Explorer.' },
  { name: 'Mastery Crest', threshold: '160 XP', description: 'Enduring discipline proven through trials. A permanent crest blooms.' },
];

/**
 * Derive canonical SVG node states for Landing specimen demonstration
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
      state: spec1State,
      xpRequired: 80,
      description: spec1.description,
      coordinates: { x: 90, y: 220, percentX: 25, percentY: 45.8 },
    },
    {
      id: spec2.id,
      label: spec2.label,
      subtitle: spec2.subtitle,
      type: 'specialization',
      state: spec2State,
      xpRequired: 80,
      description: spec2.description,
      coordinates: { x: 270, y: 220, percentX: 75, percentY: 45.8 },
    },
    {
      id: `${spec1.id}-crest`,
      label: `${spec1.label} Crest`,
      subtitle: spec1.crest.label,
      type: 'crest',
      state: spec1CrestState,
      xpRequired: 160,
      description: spec1.crest.description || `Permanent testimony of ${spec1.label} mastery.`,
      coordinates: { x: 60, y: 380, percentX: 16.6, percentY: 79.2 },
    },
    {
      id: `${spec2.id}-crest`,
      label: `${spec2.label} Crest`,
      subtitle: spec2.crest.label,
      type: 'crest',
      state: spec2CrestState,
      xpRequired: 160,
      description: spec2.crest.description || `Permanent testimony of ${spec2.label} mastery.`,
      coordinates: { x: 300, y: 380, percentX: 83.3, percentY: 79.2 },
    },
  ];
}

export function LandingView() {
  const [activeAttribute, setActiveAttribute] = useState<AttributeId>('mind');
  const [evolutionIndex, setEvolutionIndex] = useState<number>(2); // 80 XP default fork
  const [demoSealed, setDemoSealed] = useState<boolean>(false);
  const ritualSectionRef = useRef<HTMLElement>(null);

  // Mock branch state reflecting selected evolution tier
  const xpTiers = [0, 20, 80, 160];
  const currentXp = xpTiers[evolutionIndex];

  const currentBranch: BranchState = {
    attribute: activeAttribute,
    xp: currentXp,
    specialization: currentXp >= 80 ? (activeAttribute === 'mind' ? 'scholar' : activeAttribute === 'body' ? 'endurance' : activeAttribute === 'will' ? 'focus' : 'builder') : null,
    specializationAvailable: currentXp >= 80 && currentXp < 160,
    trialStarted: currentXp >= 160,
    trialComplete: currentXp >= 160,
    crestAvailable: false,
    crestClaimed: currentXp >= 160,
    sproutAvailable: currentXp >= 1,
    selectedAt: null,
  };

  const branchNodes = deriveCanonicalBranchNodes(activeAttribute, currentBranch);

  return (
    <div className="landing-v3-root">
      {/* 1. Accessible Skip Link */}
      <a href="#hero-title" className="skip-link">
        Skip to main content
      </a>

      {/* 2. Top Navigation */}
      <header className="landing-nav-bar">
        <div className="nav-container">
          <Link href="/" className="landing-brand" aria-label="Ember & Root Home">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-wordmark font-['Fraunces']">Ember &amp; Root</span>
          </Link>

          <nav className="nav-actions" aria-label="Account Navigation">
            <Link href="/login" className="btn-nav-login">
              Sign In
            </Link>
            <PathButton href="/signup" variant="ember" size="sm" className="btn-nav-primary nav-path-btn">
              Begin your path
            </PathButton>
          </nav>
        </div>
      </header>

      {/* 3. Asymmetric Hero & Living Flame */}
      <main id="main-content">
        <section className="landing-hero-scene landing-hero-section" aria-labelledby="hero-title">
          <div className="hero-grid-container">
            <div className="hero-editorial-col landing-hero-content">
              <div className="hero-folio-badge font-mono text-xs text-[#C4A96A]">
                <span className="badge-marker" aria-hidden="true" />
                <span>Folio Specimen · Hand-Authored Life RPG</span>
              </div>

              <h1 id="hero-title" className="hero-display-headline hero-headline font-['Fraunces']">
                What you do each day becomes something you can see grow.
              </h1>

              <p className="hero-lead-narrative hero-lead">
                A private life-RPG where one server-confirmed action produces one permanent, living consequence.
                No algorithmic feeds. No social performativity. Just your genuine days and what they cultivate.
              </p>

              <div className="hero-cta-group landing-cta-group">
                <PathButton href="/signup" variant="ember" size="lg" className="btn-primary-cta">
                  Begin your path →
                </PathButton>
                <PathButton href="/login" variant="charcoal" size="lg" className="btn-secondary-cta">
                  I already have a path
                </PathButton>
              </div>

              <div className="hero-editorial-annotation" aria-hidden="true">
                <span className="annotation-line" />
                <span className="annotation-text">
                  One server-authoritative commitment · Permanent causal mark
                </span>
              </div>
            </div>

            <div className="hero-ember-col landing-hero-visual" aria-hidden="true">
              <div className="ember-focal-presentation hero-flame-plate">
                <div className="ember-folium-well">
                  <EmberObject size={240} state="kindled" interactive={true} />
                </div>
                <div className="ember-caption flame-caption font-mono">
                  <span className="ember-status-label">Living Organism</span>
                  <span className="text-xs text-[#C4A96A]">The Ember responds to action</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* 2. Spatial Scroll-Following Root Spine Container */}
      <div id="ritual-section" className="ritual-spine-wrapper" ref={ritualSectionRef as any}>
        <ScrollRootSpine containerRef={ritualSectionRef} />

        {/* 5. The Causal Ritual — Sequential Scroll-Linked Story Scenes */}
        <section className="landing-ritual-scene" aria-labelledby="loop-title">
          <header className="ritual-section-header">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C4A96A] block mb-2">
              The Causal Architecture
            </span>
            <h2 id="loop-title" className="section-title font-['Fraunces']">
              The Living Cycle
            </h2>
            <p className="section-subtitle">
              Every permanent mark begins with one honest act in the waking world.
            </p>
          </header>

          <div className="ritual-scenes-flow">
            {/* Step 1: INSCRIBE */}
            <article className="ritual-flow-stage loop-step-card stage-inscribe">
              <div className="stage-content-col">
                <div className="stage-index font-mono">01 / STAGE</div>
                <h3 className="loop-step-title font-['Fraunces']">Inscribe</h3>
                <p className="stage-action-tag font-mono text-xs uppercase text-[#C4A96A] mb-3">
                  Declare intention
                </p>
                <p className="stage-body">
                  Choose meaningful daily practices aligned with Mind, Body, Will, or Craft in your field journal.
                  No algorithmic noise or artificial quotas.
                </p>
                <div className="stage-consequence">
                  <span className="consequence-glyph">✎</span>
                  <span className="consequence-text">The entry awaits your real effort in the waking world.</span>
                </div>
              </div>

              <div className="stage-visual-col">
                <div className="journal-leaf-specimen">
                  <div className="leaf-header font-mono text-xs text-[#C4A96A]">
                    PRACTICE REGISTRATION · MIND
                  </div>
                  <div className="leaf-title font-serif text-lg text-[#F0E7D3] my-2">
                    Morning Focus Meditation
                  </div>
                  <div className="leaf-meta font-mono text-xs text-[#B9BEAC]">
                    Standard Effort · 20 XP · 4 Sparks
                  </div>
                </div>
              </div>
            </article>

            {/* Step 2: ACT */}
            <article className="ritual-flow-stage loop-step-card stage-act">
              <div className="stage-content-col">
                <div className="stage-index font-mono">02 / STAGE</div>
                <h3 className="loop-step-title font-['Fraunces']">Act</h3>
                <p className="stage-action-tag font-mono text-xs uppercase text-[#C4A96A] mb-3">
                  Carry through
                </p>
                <p className="stage-body">
                  Engage with your practice outside the screen. The software steps back while you run, read, write, or build.
                  Zero timers, surveillance, or vanity metrics.
                </p>
                <div className="stage-consequence">
                  <span className="consequence-glyph">✦</span>
                  <span className="consequence-text">Real work is done where it matters most.</span>
                </div>
              </div>

              <div className="stage-visual-col">
                <div className="quiet-space-indicator">
                  <span className="quiet-pulse" aria-hidden="true" />
                  <span className="font-mono text-xs text-[#B9BEAC]">
                    Physical world in progress · Screen quiet
                  </span>
                </div>
              </div>
            </article>

            {/* Step 3: SEAL */}
            <article className="ritual-flow-stage loop-step-card stage-seal">
              <div className="stage-content-col">
                <div className="stage-index font-mono">03 / STAGE</div>
                <h3 className="loop-step-title font-['Fraunces']">Seal</h3>
                <p className="stage-action-tag font-mono text-xs uppercase text-[#C4A96A] mb-3">
                  Stamp impression
                </p>
                <p className="stage-body">
                  Confirm completion with a tactile wax seal in your journal. Sealing is a deliberate personal testimony confirmed by server consensus.
                </p>
                <div className="stage-consequence">
                  <span className="consequence-glyph">◎</span>
                  <span className="consequence-text">The practice becomes permanent in today’s folio.</span>
                </div>
              </div>

              <div className="stage-visual-col">
                <div className="seal-interactive-pad">
                  <PathButton
                    variant="seal"
                    size="lg"
                    completed={demoSealed}
                    onClick={() => setDemoSealed(!demoSealed)}
                    className="demo-seal-trigger"
                    aria-label="Interactive demo seal: click to experience physical depression"
                  >
                    {demoSealed ? 'Mark Sealed ✓' : 'Test Tactile Seal'}
                  </PathButton>
                  <p className="font-mono text-xs text-[#B9BEAC] mt-3">
                    {demoSealed ? 'Permanent server receipt generated.' : 'Press button to test physical depth.'}
                  </p>
                </div>
              </div>
            </article>

            {/* Step 4: EMBER RESPONDS */}
            <article className="ritual-flow-stage loop-step-card stage-ember">
              <div className="stage-content-col">
                <div className="stage-index font-mono">04 / STAGE</div>
                <h3 className="loop-step-title font-['Fraunces']">Ember Responds</h3>
                <p className="stage-action-tag font-mono text-xs uppercase text-[#C4A96A] mb-3">
                  Daily momentum
                </p>
                <p className="stage-body">
                  Today’s brazier stirs from resting coals to vigorous flame, casting warmth across your field journal.
                  Ember reflects today; Root reflects all time.
                </p>
                <div className="stage-consequence">
                  <span className="consequence-glyph">🔥</span>
                  <span className="consequence-text">Present-day momentum is visibly ignited.</span>
                </div>
              </div>

              <div className="stage-visual-col">
                <div className="ember-response-miniature">
                  <EmberObject size={140} state="blazing" interactive={false} />
                </div>
              </div>
            </article>

            {/* Step 5: ROOT GROWS */}
            <article className="ritual-flow-stage loop-step-card stage-root">
              <div className="stage-content-col">
                <div className="stage-index font-mono">05 / STAGE</div>
                <h3 className="loop-step-title font-['Fraunces']">Root Grows</h3>
                <p className="stage-action-tag font-mono text-xs uppercase text-[#C4A96A] mb-3">
                  Permanent becoming
                </p>
                <p className="stage-body">
                  Effort travels directly into the living organism. Primary filaments thicken, nodal forks awaken, and permanent mastery crests bloom.
                </p>
                <div className="stage-consequence">
                  <span className="consequence-glyph">🌱</span>
                  <span className="consequence-text">Who you become is permanently shaped.</span>
                </div>
              </div>

              <div className="stage-visual-col">
                <div className="root-shoot-visual">
                  <div className="shoot-stem" />
                  <div className="shoot-bud bud-mind" />
                  <div className="shoot-bud bud-body" />
                  <div className="shoot-bud bud-will" />
                  <div className="shoot-bud bud-craft" />
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>

      {/* 6. The Living Root Specimen Section (Organism Organizes the Surface) */}
      <section className="landing-organism-scene" aria-labelledby="root-title">
        <header className="organism-header">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C4A96A] block mb-2">
            The Permanent Becoming
          </span>
          <h2 id="root-title" className="section-title font-['Fraunces']">
            A Living Organism Shaped by You
          </h2>
          <p className="section-subtitle">
            The Root is not an illustration inside a dashboard; it is the physical ledger of your life choices.
          </p>
        </header>

        {/* Botanical Specimen Attribute Selection Tabs */}
        <div className="specimen-botanical-tabs" role="tablist" aria-label="Branch disciplines">
          {ATTRIBUTES.map((attr) => (
            <button
              key={attr}
              role="tab"
              aria-selected={activeAttribute === attr}
              className={`specimen-tab-tag tab-${attr} ${activeAttribute === attr ? 'specimen-tab-active' : ''}`}
              onClick={() => setActiveAttribute(attr)}
            >
              <span className={`tag-dot dot-${attr}`} aria-hidden="true" />
              <span className="tag-label">{ATTRIBUTE_LABELS[attr]}</span>
            </button>
          ))}
        </div>

        {/* Evolving Root Geometry Presentation Area */}
        <div className="organism-focal-stage">
          <div className="specimen-svg-frame">
            <BranchSvgRenderer
              attribute={activeAttribute}
              nodes={branchNodes}
              selectedSpecialization={currentBranch.specialization ?? null}
            />
          </div>

          {/* Interactive Evolution Milestones Navigation */}
          <div className="organism-evolution-controller">
            <span className="controller-title font-mono text-xs uppercase tracking-wider text-[#B9BEAC] block mb-3">
              Specimen Progression Milestones
            </span>
            <div className="evolution-tiers-grid">
              {SPECIMEN_MARKERS.map((marker, idx) => (
                <button
                  key={marker.threshold}
                  type="button"
                  onClick={() => setEvolutionIndex(idx)}
                  className={`evolution-card ${evolutionIndex === idx ? 'tier-active' : ''}`}
                  aria-pressed={evolutionIndex === idx}
                >
                  <div className="tier-badge font-mono text-xs font-semibold">
                    {marker.threshold}
                  </div>
                  <div className="tier-name font-serif text-sm text-[#F0E7D3]">
                    {marker.name}
                  </div>
                  <p className="tier-desc text-xs text-[#B9BEAC]">
                    {marker.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Closing Editorial Call */}
      <section className="landing-closing-scene" aria-labelledby="closing-title">
        <div className="closing-content-well">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C4A96A] block mb-3">
            Open the Field Journal
          </span>
          <h2 id="closing-title" className="closing-headline font-['Fraunces']">
            Begin your personal chronicle today.
          </h2>
          <p className="closing-lead text-sm text-[#B9BEAC]">
            Take your first intentional step. One completed action, one rekindled flame, one permanent root.
          </p>
          <div className="closing-cta-row">
            <PathButton href="/signup" variant="ember" size="lg" className="closing-primary-btn">
              Begin your path →
            </PathButton>
            <PathButton href="/login" variant="charcoal" size="lg" className="closing-secondary-btn">
              Sign in to Folio
            </PathButton>
          </div>
        </div>
      </section>

      </main>

      {/* 8. Quiet Field Journal Colophon */}
      <footer className="landing-colophon-bar">
        <div className="colophon-inner text-xs text-[#B9BEAC] font-mono">
          <span>Ember &amp; Root · Hand-authored Life RPG</span>
          <span>Server-authoritative progression</span>
        </div>
      </footer>
    </div>
  );
}

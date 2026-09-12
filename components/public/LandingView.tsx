import React from 'react';
import Link from 'next/link';
import './LandingView.css';

export function LandingView() {
  return (
    <div className="landing-shell">
      {/* Accessible Skip Link */}
      <a href="#hero-title" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navigation */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-brand" aria-label="Ember & Root Home">
            <div className="landing-brand-glyph" aria-hidden="true" />
            <span className="landing-brand-title">Ember &amp; Root</span>
          </Link>

          <nav className="landing-nav-actions" aria-label="Account Navigation">
            <Link href="/login" className="btn-nav-login">
              Sign In
            </Link>
            <Link href="/signup" className="btn-nav-primary">
              Begin Path
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Landing Canvas */}
      <main className="landing-content">
        {/* ==================================================================
            SECTION 1: Large Living Ember & Hero
            ================================================================== */}
        <section className="landing-hero" aria-labelledby="hero-title">
          {/* Living Brazier Vessel with Animated Flame */}
          <div className="landing-brazier" aria-hidden="true">
            <div className="landing-brazier-halo" />
            <svg
              className="landing-flame-svg"
              viewBox="0 0 100 100"
              focusable="false"
            >
              <defs>
                <radialGradient id="landingGlow" cx="50%" cy="65%" r="45%">
                  <stop offset="0%" stopColor="var(--color-ember-core)" stopOpacity="0.8" />
                  <stop offset="45%" stopColor="var(--color-ember)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="landingFlame" x1="50%" y1="90%" x2="50%" y2="10%">
                  <stop offset="0%" stopColor="var(--color-ember)" />
                  <stop offset="60%" stopColor="var(--color-ember-core)" />
                  <stop offset="100%" stopColor="var(--color-ember-core)" stopOpacity="0.95" />
                </linearGradient>
                <radialGradient id="landingSpark" cx="50%" cy="55%" r="35%">
                  <stop offset="0%" stopColor="var(--color-ember-core)" />
                  <stop offset="40%" stopColor="var(--color-ember-core)" />
                  <stop offset="100%" stopColor="var(--color-ember)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Charcoal bed */}
              <ellipse cx="50" cy="80" rx="36" ry="12" fill="rgba(20, 23, 19, 0.9)" />
              {/* Radial glow */}
              <circle cx="50" cy="62" r="32" fill="url(#landingGlow)" />
              {/* Primary Flame Body */}
              <path
                d="M50 84 C34 84 28 72 32 58 C35 48 42 42 45 32 C47 38 51 40 50 30 C53 38 62 44 65 54 C70 66 66 84 50 84 Z"
                fill="url(#landingFlame)"
                className="landing-flame-path"
              />
              {/* Inner core */}
              <circle cx="50" cy="60" r="10" fill="url(#landingSpark)" className="landing-spark-core" />
            </svg>
          </div>

          <div className="landing-headline-wrap">
            <span className="landing-kicker">A Living Personal Field Journal</span>
            <h1 id="hero-title" className="landing-title">
              What you do each day becomes something you can see grow.
            </h1>
            <p className="landing-subtitle">
              A personal practice where real daily efforts kindle today’s flame and physically cultivate a permanent root.
            </p>
          </div>

          <div className="landing-cta-group">
            <Link href="/signup" className="btn-primary-cta">
              Begin your path →
            </Link>
            <Link href="/login" className="btn-secondary-cta">
              I already have a path
            </Link>
          </div>
        </section>

        {/* ==================================================================
            SECTION 2: The Core Loop (Inscribe → Seal → Ember → Root)
            ================================================================== */}
        <section className="landing-loop-section" aria-labelledby="loop-title">
          <div>
            <div className="section-eyebrow">The Daily Rhythm</div>
            <h2 id="loop-title" className="section-title">
              The Living Cycle
            </h2>
            <p className="section-desc">
              Every practice follows a physical cause-and-effect loop. No abstract scores, no synthetic dopamine traps.
            </p>
          </div>

          <div className="loop-track" role="list">
            {/* Step 1: Inscribe */}
            <div className="loop-step-card" role="listitem">
              <div className="loop-icon-frame" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <span className="loop-step-num">Step 01</span>
              <h3 className="loop-step-title">Inscribe</h3>
              <p className="loop-step-text">
                Choose meaningful daily practices aligned with Mind, Body, Will, or Craft.
              </p>
            </div>

            {/* Step 2: Seal */}
            <div className="loop-step-card" role="listitem">
              <div className="loop-icon-frame" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span className="loop-step-num">Step 02</span>
              <h3 className="loop-step-title">Seal</h3>
              <p className="loop-step-text">
                Follow through in your day. Stamp the journal entry once completed.
              </p>
            </div>

            {/* Step 3: Ember */}
            <div className="loop-step-card" role="listitem">
              <div className="loop-icon-frame" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <span className="loop-step-num">Step 03</span>
              <h3 className="loop-step-title">Ember Responds</h3>
              <p className="loop-step-text">
                Today’s brazier kindles from quiet resting coals to vigorous flame.
              </p>
            </div>

            {/* Step 4: Root */}
            <div className="loop-step-card" role="listitem">
              <div className="loop-icon-frame" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22v-9" />
                  <path d="M12 13a5 5 0 0 0-5-5H3" />
                  <path d="M12 13a5 5 0 0 1 5-5h4" />
                  <path d="M12 8V2" />
                </svg>
              </div>
              <span className="loop-step-num">Step 04</span>
              <h3 className="loop-step-title">Root Grows</h3>
              <p className="loop-step-text">
                Permanent branches thicken, forks awaken, and mastery crests bloom.
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 3: The Evolving Root
            ================================================================== */}
        <section className="landing-root-section" aria-labelledby="root-title">
          <div>
            <div className="section-eyebrow">Permanent Becoming</div>
            <h2 id="root-title" className="section-title">
              A Living Organism Shaped by You
            </h2>
            <p className="section-desc">
              Your Root never resets at midnight. Every effort accumulates permanently into living branches.
            </p>
          </div>

          <div className="evolution-deck" role="list">
            {/* Stage 1: 0 XP Seed */}
            <div className="evolution-card" role="listitem">
              <div className="evolution-svg-stage" aria-hidden="true">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="40" r="6" fill="#B9BEAC" fillOpacity="0.4" stroke="#B9BEAC" strokeWidth="1.5" />
                  <path d="M22 46c4-1 12-1 16 0" stroke="#B9BEAC" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
                </svg>
              </div>
              <span className="evolution-badge">0 XP</span>
              <h3 className="evolution-stage-title">Dormant Seed</h3>
              <p className="evolution-stage-desc">
                Slumbering soil awaiting your very first commitment.
              </p>
            </div>

            {/* Stage 2: 20 XP Sprout */}
            <div className="evolution-card" role="listitem">
              <div className="evolution-svg-stage" aria-hidden="true">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M30 50V30" stroke="#9FBA87" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M30 36c-6-6-10-2-12 2 4 1 9-1 12-2z" fill="#9FBA87" fillOpacity="0.8" />
                  <path d="M30 30c5-5 9-1 11 3-3 1-8-1-11-3z" fill="#9FBA87" fillOpacity="0.6" />
                </svg>
              </div>
              <span className="evolution-badge">20 XP</span>
              <h3 className="evolution-stage-title">Origin Sprout</h3>
              <p className="evolution-stage-desc">
                First practice awakens life. A resilient shoot takes root.
              </p>
            </div>

            {/* Stage 3: 80 XP Fork */}
            <div className="evolution-card" role="listitem">
              <div className="evolution-svg-stage" aria-hidden="true">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M30 52V36" stroke="#9FBA87" strokeWidth="3" strokeLinecap="round" />
                  <path d="M30 36c-4-8-12-12-18-14" stroke="#D9E3B2" strokeWidth="2" strokeLinecap="round" />
                  <path d="M30 36c4-8 12-12 18-14" stroke="#D9E3B2" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
                  <circle cx="12" cy="22" r="4" fill="#D9E3B2" />
                  <circle cx="48" cy="22" r="4" fill="none" stroke="#D9E3B2" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="evolution-badge">80 XP</span>
              <h3 className="evolution-stage-title">Specialization Fork</h3>
              <p className="evolution-stage-desc">
                Branches divide. Choose distinct disciplines like Scholar or Explorer.
              </p>
            </div>

            {/* Stage 4: 160 XP Crest */}
            <div className="evolution-card" role="listitem">
              <div className="evolution-svg-stage" aria-hidden="true">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <path d="M30 52V28" stroke="#D9E3B2" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M30 32c-6-6-14-10-18-12" stroke="#D9E3B2" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M30 28c6-6 14-10 18-12" stroke="#D9E3B2" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Flowering Crest terminal */}
                  <circle cx="30" cy="18" r="8" fill="rgba(255, 211, 138, 0.2)" stroke="#FFD38A" strokeWidth="1.5" />
                  <polygon points="30,12 33,16 38,18 33,20 30,24 27,20 22,18 27,16" fill="#FFD38A" />
                </svg>
              </div>
              <span className="evolution-badge">160 XP</span>
              <h3 className="evolution-stage-title">Mastery Crest</h3>
              <p className="evolution-stage-desc">
                Enduring discipline proven through trials. A permanent crest blooms.
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================================
            SECTION 4: Closing Field Journal Seal
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

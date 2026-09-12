'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import './CinematicHero.css';

// ---------------------------------------------------------------------------
// Particle system types & lightweight 2D engine
// ---------------------------------------------------------------------------

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
}

class HeroParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: SparkParticle[] = [];
  private raf: number | null = null;
  private mouse = { x: -9999, y: -9999 };
  private ignited = false;
  private source = { x: 0, y: 0 };
  private reducedMotion = false;

  constructor(canvas: HTMLCanvasElement, reducedMotion: boolean) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.reducedMotion = reducedMotion;
  }

  setSource(x: number, y: number) {
    this.source = { x, y };
  }

  setMouse(x: number, y: number) {
    this.mouse = { x, y };
  }

  setIgnited(v: boolean) {
    this.ignited = v;
  }

  private emit() {
    if (this.reducedMotion) return;
    const count = this.ignited ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.65;
      const speed = 0.5 + Math.random() * 1.4;
      this.particles.push({
        x: this.source.x + (Math.random() - 0.5) * 8,
        y: this.source.y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed + 0.3, // drift towards center
        vy: Math.sin(angle) * speed - 0.2,
        life: 0,
        maxLife: 50 + Math.random() * 70,
        size: 1 + Math.random() * 2.2,
        opacity: 0.95,
      });
    }
  }

  private tick = () => {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.emit();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      // Subtle mouse influence
      if (this.ignited) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = (1 - dist / 140) * 0.02;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      p.vy += 0.01;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;

      const progress = p.life / p.maxLife;
      p.opacity = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const r = 255;
      const g = Math.round(240 - progress * 140);
      const b = Math.round(Math.max(0, 200 - progress * 200));

      ctx.save();
      ctx.globalAlpha = p.opacity * (this.ignited ? 0.95 : 0.6);
      ctx.shadowBlur = this.ignited ? 10 : 5;
      ctx.shadowColor = `rgba(${r}, ${g}, 80, 0.8)`;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.raf !== null) return;
    this.tick();
  }

  stop() {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  resize(w: number, h: number) {
    this.canvas.width = w;
    this.canvas.height = h;
  }
}

// ---------------------------------------------------------------------------
// CinematicHero Component
// ---------------------------------------------------------------------------

export function CinematicHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemRef = useRef<HeroParticleSystem | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [ignited, setIgnited] = useState(false);
  const [arcVisible, setArcVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  const updateSourceCoords = useCallback(() => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    // Flame tip position roughly at 19% width, 52% height in desktop frame
    const sx = rect.width * 0.19;
    const sy = rect.height * 0.52;
    systemRef.current?.setSource(sx, sy);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sys = new HeroParticleSystem(canvas, reducedMotion);
    systemRef.current = sys;

    const handleResize = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      sys.resize(rect.width, rect.height);
      updateSourceCoords();
    };

    handleResize();
    sys.start();

    const ro = new ResizeObserver(handleResize);
    if (sectionRef.current) ro.observe(sectionRef.current);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sys.stop();
      else sys.start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      sys.stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion, updateSourceCoords]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      systemRef.current?.setMouse(e.clientX - rect.left, e.clientY - rect.top);
    };
    section.addEventListener('mousemove', onMove);
    return () => section.removeEventListener('mousemove', onMove);
  }, []);

  const handleIgnite = useCallback(() => {
    if (ignited) return;
    if (!reducedMotion) {
      setArcVisible(true);
      setTimeout(() => setIgnited(true), 600);
    } else {
      setIgnited(true);
    }
    systemRef.current?.setIgnited(true);
  }, [ignited, reducedMotion]);

  useEffect(() => {
    systemRef.current?.setIgnited(ignited);
  }, [ignited]);

  return (
    <section ref={sectionRef} className="cinematic-hero" aria-labelledby="ch-hero-title">
      {/* Skip Navigation Link */}
      <a href="#ritual-section" className="ch-skip-link">
        Skip to main content
      </a>

      {/* Layer 0: Photographic Atmosphere Background */}
      <div className="ch-bg-layer" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero/bg-atmospheric.jpg"
          alt=""
          className="ch-bg-img"
          fetchPriority="high"
          draggable={false}
        />
        <div className="ch-bg-vignette" />
      </div>

      {/* Layer 1: Photographic Hand + Match Ignition Source */}
      <div className="ch-hand-layer" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero/hand-match.jpg"
          alt=""
          className="ch-hand-img"
          draggable={false}
        />
        <button
          type="button"
          className="ch-match-ignite-btn"
          onClick={handleIgnite}
          aria-label="Strike the match to kindle your Ember"
          aria-pressed={ignited}
        />
      </div>

      {/* Layer 2: Canvas Spark Particle Dynamics */}
      <canvas ref={canvasRef} className="ch-particle-canvas" aria-hidden="true" />

      {/* Layer 3: SVG Filament Energy Arc & Focal Seed Geometry */}
      <div className="ch-scene-svg-layer" aria-hidden="true">
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="ch-scene-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="chArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFD38A" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#E98A4B" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFD38A" stopOpacity="1" />
            </linearGradient>

            <radialGradient id="chEmberCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFDF0" stopOpacity="1" />
              <stop offset="25%" stopColor="#FFD38A" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#E98A4B" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#C46D32" stopOpacity="0" />
            </radialGradient>

            <filter id="chGlowFilt" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Energy arc filament from match flame (approx 274, 468) to Ember seed (720, 500) */}
          <g className={`ch-energy-arc ${arcVisible ? 'arc-visible' : ''}`} filter="url(#chGlowFilt)">
            <path
              d="M 274 468 C 380 380, 560 410, 720 500"
              stroke="url(#chArcGrad)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              className="ch-arc-path"
            />
            <path
              d="M 274 468 C 400 360, 590 395, 720 500"
              stroke="#FFF8E7"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
              className="ch-arc-path-2"
            />
          </g>

          {/* Central Ember reticle focal point */}
          <g className={`ch-ember-focal ${ignited ? 'ch-ember-focal-ignited' : ''}`}>
            {/* Concentric botanical target reticles */}
            <circle cx="720" cy="500" r="54" fill="none" stroke="#E98A4B" strokeWidth="0.75" opacity="0.35" className="ch-ring-1" />
            <circle cx="720" cy="500" r="74" fill="none" stroke="#C4A96A" strokeWidth="0.5" opacity="0.22" className="ch-ring-2" />
            
            {/* Vertical axis line */}
            <line x1="720" y1="410" x2="720" y2="590" stroke="#E98A4B" strokeWidth="0.5" opacity="0.3" />
            <line x1="630" y1="500" x2="810" y2="500" stroke="#E98A4B" strokeWidth="0.5" opacity="0.2" />

            {/* Ember teardrop kernel */}
            <path
              d="M 720 464 C 708 480, 700 495, 700 508 C 700 520, 709 528, 720 528 C 731 528, 740 520, 740 508 C 740 495, 732 480, 720 464 Z"
              fill="url(#chEmberCoreGlow)"
              className="ch-seed-kernel"
            />
            <circle cx="720" cy="508" r="4.5" fill="#FFFFFF" className="ch-seed-core" />
          </g>
        </svg>
      </div>

      {/* Layer 4: Authoritative Editorial Field Journal Overlay */}
      <div className="ch-editorial-overlay">
        {/* Integrated Navigation Bar */}
        <nav className="ch-nav" aria-label="Main Navigation">
          <Link href="/" className="ch-brand" aria-label="Ember & Root Home">
            <span className="ch-brand-dot" aria-hidden="true" />
            <span className="ch-brand-wordmark font-['Fraunces']">Ember &amp; Root</span>
          </Link>

          <div className="ch-nav-links" role="list">
            <Link href="/about" className="ch-nav-link" role="listitem">About</Link>
            <Link href="/ritual" className="ch-nav-link" role="listitem">The Ritual</Link>
            <Link href="/path" className="ch-nav-link" role="listitem">Path</Link>
            <Link href="/journal" className="ch-nav-link" role="listitem">Journal</Link>
            <Link href="/login" className="ch-nav-link" role="listitem">Sign In</Link>
          </div>

          <Link href="/signup" className="ch-nav-cta">
            Begin Your Path →
          </Link>
        </nav>

        {/* Top Annotations */}
        <div className="ch-annotation ch-annotation-top-left" aria-hidden="true">
          <span className="ch-annotation-line" />
          <div className="ch-annotation-stacked">
            <span>A</span>
            <span>LIVING</span>
            <span>PERSONAL</span>
            <span>FIELD JOURNAL</span>
          </div>
        </div>

        <div className="ch-annotation ch-annotation-top-right" aria-hidden="true">
          <div className="ch-annotation-stacked ch-annotation-right-align">
            <span>SMALL</span>
            <span>ACTIONS</span>
            <span>DEEPER</span>
            <span>TOMORROWS</span>
          </div>
          <span className="ch-annotation-line" />
        </div>

        {/* Centered Editorial Label */}
        <div className="ch-subhead-above" aria-hidden="true">
          A LIVING PERSONAL FIELD JOURNAL
        </div>

        {/* Main Display Headline */}
        <div className="ch-headline-block">
          <h1 id="ch-hero-title" className="ch-headline font-['Fraunces']">
            <span className="ch-headline-line">Power the</span>
            <span className="ch-headline-line">
              light within <em className="ch-headline-you">you.</em>
            </span>
          </h1>

          <p className="ch-ritual-steps" aria-label="The Ritual: Inscribe, Act, Seal, Grow">
            <span>INSCRIBE</span>
            <span className="ch-step-dot" aria-hidden="true">·</span>
            <span>ACT</span>
            <span className="ch-step-dot" aria-hidden="true">·</span>
            <span>SEAL</span>
            <span className="ch-step-dot" aria-hidden="true">·</span>
            <span>GROW</span>
          </p>
        </div>

        {/* Right Editorial Quote */}
        <div className="ch-right-quote" aria-label="A brighter you takes root in the real world">
          <em className="font-['Fraunces']">
            A brighter<br />
            you takes root<br />
            in the real world.
          </em>
          <span className="ch-right-quote-rule" aria-hidden="true" />
        </div>

        {/* Left Vertical Sequence Timeline */}
        <div className="ch-left-timeline" aria-label="Journey Progression">
          {(['INSCRIBE', 'ACT', 'SEAL', 'EMBER', 'ROOT'] as const).map((step, i) => (
            <div key={step} className="ch-timeline-item">
              <span
                className={`ch-timeline-dot ${i === 0 ? 'ch-timeline-dot-active' : ''}`}
                aria-hidden="true"
              />
              <span className="ch-timeline-label">{step}</span>
            </div>
          ))}
        </div>

        {/* Bottom Colophon Bar */}
        <div className="ch-bottom-bar" aria-hidden="true">
          <div className="ch-bottom-left">
            <span>MIND</span>
            <span>BODY</span>
            <span>WILL</span>
            <span>CRAFT</span>
          </div>

          <div className="ch-scroll-cue">
            <span className="ch-scroll-label">
              {ignited ? 'SCROLL TO EXPLORE' : 'SCROLL TO IGNITE'}
            </span>
            <span className="ch-scroll-mouse" aria-hidden="true">
              <svg width="18" height="28" viewBox="0 0 18 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="16" height="26" rx="8" stroke="currentColor" strokeWidth="1.2" />
                <rect x="8" y="5" width="2" height="6" rx="1" fill="currentColor" className="ch-scroll-wheel-animated" />
              </svg>
            </span>
          </div>

          <div className="ch-bottom-right">
            <span>MORE THAN HABITS</span>
            <span className="ch-bottom-rule" aria-hidden="true" />
            <span>A DEEPER YOU</span>
          </div>
        </div>
      </div>
    </section>
  );
}

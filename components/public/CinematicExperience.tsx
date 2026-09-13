'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import './CinematicExperience.css';

export interface CinematicExperienceProps {
  onComplete?: () => void;
  className?: string;
}

type SlideId = 1 | 2 | 3;

interface Firefly {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

const DIALOGUE_LINES = [
  'In the quiet darkness, dormant embers wait for your presence.',
  'What you hold in your hands today kindles the flame of tomorrow.',
  'Your daily acts awaken the soil and cultivate a permanent root.',
];

export const CinematicExperience: React.FC<CinematicExperienceProps> = ({
  onComplete,
  className = '',
}) => {
  // ── Slide & Interaction State ─────────────────────────────────────────────
  const [slide, setSlide] = useState<SlideId>(1);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100
  const [activeOrbIndex, setActiveOrbIndex] = useState<number>(0);

  // Dialogue State
  const [lineIndex, setLineIndex] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isDialogueComplete, setIsDialogueComplete] = useState<boolean>(false);

  // Heartbeat State
  const [heartPulse, setHeartPulse] = useState<'bright' | 'peak' | 'soft'>('soft');

  // Motion preference
  const [shouldReduceMotion, setShouldReduceMotion] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const targetOrbPosRef = useRef<{ x: number; y: number }>({ x: 250, y: 180 });

  // ── 1. Detect Reduced Motion Preference ────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      setShouldReduceMotion(query.matches);
      const listener = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
      query.addEventListener('change', listener);
      return () => query.removeEventListener('change', listener);
    }
  }, []);

  // ── 2. Initialize Canvas & Firefly Particles ──────────────────────────────
  useEffect(() => {
    const fireflyCount = shouldReduceMotion ? 12 : 36;
    const initialParticles: Firefly[] = [];

    for (let i = 0; i < fireflyCount; i++) {
      const bx = Math.random() * 600;
      const by = Math.random() * 400;
      initialParticles.push({
        id: i,
        x: bx,
        y: by,
        baseX: bx,
        baseY: by,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: 1.5 + Math.random() * 2.2,
        alpha: 0.3 + Math.random() * 0.6,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    firefliesRef.current = initialParticles;
  }, [shouldReduceMotion]);

  // ── 3. High-60fps requestAnimationFrame Particle Loop ──────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const target = targetOrbPosRef.current;
      const particles = firefliesRef.current;
      const progressRatio = holdProgress / 100;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isHolding && slide === 2) {
          // HOLD MECHANIC: Fireflies accelerate toward target orb
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 8) {
            // Speed increases as hold progress grows
            const speed = 2.5 + progressRatio * 4.5;
            p.x += (dx / dist) * speed;
            p.y += (dy / dist) * speed;
          } else {
            // Particle absorbed into orb core: reset to outskirts to maintain loop
            p.x = (Math.random() < 0.5 ? -20 : canvas.width + 20);
            p.y = Math.random() * canvas.height;
          }
        } else {
          // Ambient gentle floating wave
          p.x += p.vx + Math.sin(time + p.pulsePhase) * 0.3;
          p.y += p.vy + Math.cos(time * 0.8 + p.pulsePhase) * 0.3;

          // Boundary bouncing
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }

        // Render firefly particle
        const alphaPulse = 0.4 + Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.35;
        const currentAlpha = Math.min(1, Math.max(0.1, p.alpha * alphaPulse));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 138, 75, ${currentAlpha})`;
        ctx.shadowColor = 'rgba(255, 211, 138, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isHolding, slide, holdProgress]);

  // ── 4. Long-Press Hold Handler (HOLD → ABSORB → FILL → GLOW → AWAKEN) ─────
  const startHold = useCallback(
    (orbIdx: number, targetX: number, targetY: number) => {
      if (slide !== 1 && slide !== 2) return;

      setActiveOrbIndex(orbIdx);
      targetOrbPosRef.current = { x: targetX, y: targetY };
      setIsHolding(true);

      if (slide === 1) {
        setSlide(2);
      }

      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

      holdIntervalRef.current = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
            setIsHolding(false);
            // Seamless transition to Slide 3 upon 100% completion
            setTimeout(() => {
              setSlide(3);
            }, 120);
            return 100;
          }
          // Smooth increment per 30ms (~1.8 seconds total hold duration)
          return Math.min(100, prev + 2.5);
        });
      }, 30);
    },
    [slide]
  );

  const stopHold = useCallback(() => {
    setIsHolding(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    // Gracefully decay progress back to rest if incomplete (<100)
    if (holdProgress < 100 && slide === 2) {
      const decayInterval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev <= 0) {
            clearInterval(decayInterval);
            return 0;
          }
          return Math.max(0, prev - 4);
        });
      }, 30);
    }
  }, [holdProgress, slide]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // ── 5. Dialogue Typewriter & Interruptibility ─────────────────────────────
  useEffect(() => {
    if (slide !== 3) return;

    const fullLine = DIALOGUE_LINES[lineIndex] || '';
    setDisplayedText('');
    setIsTyping(true);

    if (shouldReduceMotion) {
      setDisplayedText(fullLine);
      setIsTyping(false);
      return;
    }

    let charIdx = 0;
    const typeInterval = setInterval(() => {
      if (charIdx < fullLine.length) {
        setDisplayedText(fullLine.slice(0, charIdx + 1));
        charIdx++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 25); // Fast typing reveal (25ms per char)

    return () => clearInterval(typeInterval);
  }, [slide, lineIndex, shouldReduceMotion]);

  // Click/Space to skip typing or advance dialogue
  const handleAdvanceDialogue = () => {
    if (slide !== 3) return;

    const fullLine = DIALOGUE_LINES[lineIndex] || '';

    if (isTyping) {
      // Complete line immediately if currently typing
      setDisplayedText(fullLine);
      setIsTyping(false);
    } else if (lineIndex < DIALOGUE_LINES.length - 1) {
      // Advance to next line
      setLineIndex((prev) => prev + 1);
    } else {
      // Dialogue complete -> Ready for hearth/signup
      setIsDialogueComplete(true);
      if (onComplete) onComplete();
    }
  };

  // ── 6. Final Living Ember Heartbeat Loop ──────────────────────────────────
  useEffect(() => {
    if (slide !== 3) return;

    // Organic heartbeat sequence: soften -> brighten -> peak -> soften
    const pulseCycle = ['soft', 'bright', 'peak', 'soft'] as const;
    let idx = 0;

    const heartInterval = setInterval(() => {
      idx = (idx + 1) % pulseCycle.length;
      setHeartPulse(pulseCycle[idx]);
    }, 900); // Gentle 3.6s full heartbeat cycle

    return () => clearInterval(heartInterval);
  }, [slide]);

  // Keydown handler for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (slide === 1 || slide === 2) {
        if (!isHolding) startHold(activeOrbIndex, 250, 180);
      } else if (slide === 3) {
        handleAdvanceDialogue();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (slide === 2) stopHold();
    }
  };

  return (
    <div
      className={`cinematic-shell ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      aria-label="Cinematic Awakening Story"
    >
      {/* Background Canvas for Ambient & Absorbed Fireflies */}
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        className="cinematic-firefly-canvas"
        aria-hidden="true"
      />

      {/* Screen Reader Live Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {slide === 1 && 'Slide 1: Dormant orbs resting on the ancient branches.'}
        {slide === 2 && `Slide 2: Filling orb with firefly energy. Progress: ${Math.round(holdProgress)}%.`}
        {slide === 3 && `Slide 3: ${displayedText}`}
      </div>

      {/* ====================================================================
          SLIDE 1 & 2: Forest Tree Environment & Interactive Orbs
          ==================================================================== */}
      {(slide === 1 || slide === 2) && (
        <div className="cinematic-scene">
          {/* Authored Tree SVG Environment */}
          <svg viewBox="0 0 600 400" className="cinematic-tree-svg" aria-hidden="true">
            <defs>
              <linearGradient id="treeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#141713" />
                <stop offset="60%" stopColor="#1D231D" />
                <stop offset="100%" stopColor="#2D382D" />
              </linearGradient>

              <radialGradient id="orbCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFD38A" stopOpacity="1" />
                <stop offset="50%" stopColor="#E98A4B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E98A4B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Tree Trunk & Organic Branches */}
            <g stroke="url(#treeGrad)" strokeLinecap="round" fill="none">
              <path d="M 300 400 C 300 300 280 240 250 180 C 230 140 190 110 150 80" strokeWidth="8" />
              <path d="M 300 320 C 320 260 360 200 420 140 C 450 110 490 90 530 70" strokeWidth="6" />
              <path d="M 250 180 C 270 140 310 110 360 90" strokeWidth="4" />
              <path d="M 360 200 C 340 160 320 130 300 90" strokeWidth="3.5" />
            </g>

            {/* Dormant / Filling Orbs on Branches */}
            {/* Orb 1: Primary Center Left Branch */}
            <g transform="translate(250, 180)">
              {/* Invisible Accessible Touch/Pointer Target (min 48x48px) */}
              <circle
                r="32"
                fill="transparent"
                className="orb-touch-target"
                onPointerDown={() => startHold(0, 250, 180)}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
              />
              {/* Outer Energy Field */}
              <circle
                r={16 + (activeOrbIndex === 0 ? (holdProgress / 100) * 14 : 0)}
                fill="rgba(233, 138, 75, 0.15)"
                className="orb-outer-field"
              />
              {/* Inner Glowing Core */}
              <circle
                r={8 + (activeOrbIndex === 0 ? (holdProgress / 100) * 8 : 0)}
                fill="url(#orbCoreGlow)"
                className={`orb-core-circle ${slide === 1 ? 'orb-breathing' : ''}`}
                style={{
                  opacity: 0.6 + (activeOrbIndex === 0 ? (holdProgress / 100) * 0.4 : 0),
                }}
              />
            </g>

            {/* Orb 2: Right Branch */}
            <g transform="translate(360, 200)">
              <circle
                r="32"
                fill="transparent"
                className="orb-touch-target"
                onPointerDown={() => startHold(1, 360, 200)}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
              />
              <circle
                r={14 + (activeOrbIndex === 1 ? (holdProgress / 100) * 14 : 0)}
                fill="rgba(159, 186, 135, 0.15)"
              />
              <circle
                r={7 + (activeOrbIndex === 1 ? (holdProgress / 100) * 7 : 0)}
                fill="#9FBA87"
                className="orb-core-circle orb-breathing"
                style={{ opacity: 0.5 + (activeOrbIndex === 1 ? (holdProgress / 100) * 0.5 : 0) }}
              />
            </g>

            {/* Orb 3: Upper Left Branch */}
            <g transform="translate(150, 80)">
              <circle
                r="32"
                fill="transparent"
                className="orb-touch-target"
                onPointerDown={() => startHold(2, 150, 80)}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
              />
              <circle
                r={12 + (activeOrbIndex === 2 ? (holdProgress / 100) * 12 : 0)}
                fill="rgba(196, 169, 106, 0.15)"
              />
              <circle
                r={6 + (activeOrbIndex === 2 ? (holdProgress / 100) * 6 : 0)}
                fill="#C4A96A"
                className="orb-core-circle orb-breathing"
                style={{ opacity: 0.5 + (activeOrbIndex === 2 ? (holdProgress / 100) * 0.5 : 0) }}
              />
            </g>
          </svg>

          {/* Contextual Guidance Label (Disappears on hold/progress) */}
          {holdProgress === 0 && (
            <div className="cinematic-guidance-hint" aria-hidden="true">
              <span className="guidance-pulse-icon">✦</span>
              <span>Press &amp; Hold Orb to Awaken</span>
            </div>
          )}

          {/* Real-Time Energy Progress Bar */}
          {slide === 2 && (
            <div className="cinematic-progress-wrap" aria-hidden="true">
              <div
                className="cinematic-progress-bar"
                style={{ width: `${holdProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          SLIDE 3: Light Builds, Story Dialogue & Organic Pulsing Heart
          ==================================================================== */}
      {slide === 3 && (
        <div
          className="cinematic-awakening-scene"
          onClick={handleAdvanceDialogue}
          role="button"
          tabIndex={0}
        >
          {/* Living Ember Heart Vessel */}
          <div className={`cinematic-heart-container pulse-${heartPulse}`}>
            <div className="cinematic-heart-halo" />
            <svg viewBox="0 0 100 100" className="cinematic-heart-svg">
              <defs>
                <radialGradient id="heartGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFD38A" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#E98A4B" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#141713" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="url(#heartGlowGrad)" />
              {/* Organic Ember Core */}
              <path
                d="M 50 25 C 40 10, 20 20, 20 40 C 20 60, 50 80, 50 85 C 50 80, 80 60, 80 40 C 80 20, 60 10, 50 25 Z"
                fill="#E98A4B"
                className="cinematic-heart-path"
              />
              <circle cx="50" cy="45" r="8" fill="#FFD38A" />
            </svg>
          </div>

          {/* Fast & Interruptible Dialogue Container */}
          <div className="cinematic-dialogue-wrap">
            <p className="cinematic-dialogue-text">
              {displayedText}
              {isTyping && <span className="cinematic-cursor">|</span>}
            </p>
            <span className="cinematic-dialogue-sub">
              {isDialogueComplete ? '✦ The Path Awakes ✦' : 'Tap to continue →'}
            </span>
          </div>

          {/* CTA Button when Dialogue Completes */}
          {isDialogueComplete && (
            <div className="cinematic-cta-wrap">
              <Link href="/signup" className="btn-primary-cta">
                Begin your path →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface FireflyParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface ForestAwakeningOrbProps {
  onAwakened: () => void;
  reducedMotion: boolean;
  paused: boolean;
}

export const ForestAwakeningOrb: React.FC<ForestAwakeningOrbProps> = ({
  onAwakened,
  reducedMotion,
  paused,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meterCircleRef = useRef<SVGCircleElement | null>(null);
  const orbButtonRef = useRef<HTMLButtonElement | null>(null);

  // Mutable animation state (no React re-renders per frame)
  const isHoldingRef = useRef<boolean>(false);
  const progressRef = useRef<number>(0);
  const hasAwakenedRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<FireflyParticle[]>([]);
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Expose state for aria-valuenow updates
  const [ariaProgress, setAriaProgress] = useState<number>(0);

  // Initialize firefly particle system on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = reducedMotion ? 12 : 36;
    const particles: FireflyParticle[] = [];
    const width = canvas.width;
    const height = canvas.height;

    for (let i = 0; i < count; i++) {
      const bx = Math.random() * width;
      const by = Math.random() * height;
      particles.push({
        x: bx,
        y: by,
        baseX: bx,
        baseY: by,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: 1.4 + Math.random() * 2.0,
        alpha: 0.3 + Math.random() * 0.65,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    particlesRef.current = particles;
  }, [reducedMotion]);

  // Handle resizing canvas dynamically to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Target position is the orb center relative to container
      if (orbButtonRef.current) {
        const orbRect = orbButtonRef.current.getBoundingClientRect();
        targetPosRef.current = {
          x: orbRect.left - rect.left + orbRect.width / 2,
          y: orbRect.top - rect.top + orbRect.height / 2,
        };
      } else {
        targetPosRef.current = { x: rect.width / 2, y: rect.height / 2 };
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Main 60fps requestAnimationFrame Loop
  useEffect(() => {
    let lastAriaUpdate = 0;

    const renderLoop = () => {
      if (paused) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas ? canvas.width / dpr : 0;
      const height = canvas ? canvas.height / dpr : 0;

      // 1. Update hold progress
      if (isHoldingRef.current && !hasAwakenedRef.current) {
        // Fast yet steady fill: ~1.2s to reach 100%
        progressRef.current = Math.min(1, progressRef.current + (reducedMotion ? 0.035 : 0.016));
      } else if (!hasAwakenedRef.current && progressRef.current > 0) {
        // Gentle decay on early release (graceful fall-off, no instant snap)
        progressRef.current = Math.max(0, progressRef.current - 0.022);
      }

      const curProgress = progressRef.current;

      // 2. Direct DOM & CSS variable updates (bypassing React re-renders)
      if (containerRef.current) {
        containerRef.current.style.setProperty('--orb-progress', curProgress.toString());
        containerRef.current.style.setProperty('--awakening-glow', (curProgress * 1.5).toFixed(3));
      }

      if (meterCircleRef.current) {
        // Circumference for r=32 is 2 * PI * 32 = 201.06
        const circumference = 201.06;
        const offset = circumference * (1 - curProgress);
        meterCircleRef.current.style.strokeDashoffset = offset.toString();
      }

      // Periodic Aria update (every ~100ms)
      const now = performance.now();
      if (now - lastAriaUpdate > 100) {
        setAriaProgress(Math.round(curProgress * 100));
        lastAriaUpdate = now;
      }

      // Check completion threshold
      if (curProgress >= 1 && !hasAwakenedRef.current) {
        hasAwakenedRef.current = true;
        setAriaProgress(100);
        onAwakened();
        return; // Halt loop once awakened
      }

      // 3. Render Canvas Fireflies
      if (ctx && canvas) {
        ctx.clearRect(0, 0, width, height);

        const target = targetPosRef.current;
        const particles = particlesRef.current;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (isHoldingRef.current && curProgress > 0) {
            // Acceleration toward the dormant orb
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const dist = Math.hypot(dx, dy);

            // Pull factor increases as progress climbs
            const pullSpeed = 0.03 + curProgress * 0.12;
            p.x += dx * pullSpeed;
            p.y += dy * pullSpeed;

            // Particles shrink & brighten as they enter the orb
            const scale = Math.max(0.2, Math.min(1, dist / 80));
            p.pulsePhase += p.pulseSpeed * 2.5;
            const pulse = 0.6 + 0.4 * Math.sin(p.pulsePhase);

            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.8, p.radius * scale), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 218, 140, ${p.alpha * pulse * (1 - curProgress * 0.35)})`;
            ctx.shadowColor = '#ffd38a';
            ctx.shadowBlur = 8 + curProgress * 10;
            ctx.fill();

            // Respawn particles that reached orb center
            if (dist < 12) {
              p.x = Math.random() * width;
              p.y = Math.random() * height;
            }
          } else {
            // Ambient gentle floating motion
            p.pulsePhase += p.pulseSpeed;
            const pulse = 0.5 + 0.5 * Math.sin(p.pulsePhase);

            p.x += p.vx;
            p.y += p.vy;

            // Bounce gently off canvas bounds
            if (p.x < 10 || p.x > width - 10) p.vx *= -1;
            if (p.y < 10 || p.y > height - 10) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(247, 215, 155, ${p.alpha * pulse * 0.75})`;
            ctx.shadowColor = '#e98a4b';
            ctx.shadowBlur = 6;
            ctx.fill();
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [onAwakened, paused, reducedMotion]);

  // Pointer & Touch Handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (hasAwakenedRef.current) return;
    isHoldingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (hasAwakenedRef.current) return;
    isHoldingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if pointer capture wasn't held
    }
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (hasAwakenedRef.current) return;
    isHoldingRef.current = false;
  }, []);

  // Keyboard accessibility: Space / Enter hold
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (hasAwakenedRef.current) return;
      isHoldingRef.current = true;
    }
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (hasAwakenedRef.current) return;
      isHoldingRef.current = false;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="prologue-awakening-container"
      aria-label="Hold dormant orb to awaken the forest"
    >
      {/* 60fps Firefly Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="prologue-firefly-canvas"
        aria-hidden="true"
      />

      {/* Dormant Orb Interaction Target */}
      <div className="prologue-orb-wrap">
        <button
          ref={orbButtonRef}
          type="button"
          className="prologue-orb-button"
          role="progressbar"
          aria-label="Dormant Orb: Press and hold to awaken"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ariaProgress}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        >
          {/* Subtle Ambient Halo */}
          <span className="prologue-orb-halo" aria-hidden="true" />

          {/* SVG Progress Meter Arc */}
          <svg
            className="prologue-orb-meter"
            viewBox="0 0 72 72"
            aria-hidden="true"
          >
            <circle
              className="meter-track"
              cx="36"
              cy="36"
              r="32"
            />
            <circle
              ref={meterCircleRef}
              className="meter-fill"
              cx="36"
              cy="36"
              r="32"
            />
          </svg>

          {/* Living Orb Core */}
          <span className="prologue-orb-core" aria-hidden="true">
            <span className="orb-inner-filament" />
            <span className="orb-mote-cluster" />
          </span>

          {/* Prompt Label */}
          <span className="prologue-orb-label" aria-hidden="true">
            {ariaProgress > 0 ? (ariaProgress >= 100 ? 'AWAKENING' : 'HOLDING…') : 'HOLD TO AWAKEN'}
          </span>
        </button>
      </div>

      {/* Full-scene awakening bloom flash upon completion */}
      <div className="prologue-awakening-bloom" aria-hidden="true" />
    </div>
  );
};

'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import './shore.css';

export interface ShoreSequenceProps {
  reduced: boolean;
  paused: boolean;
  skip?: boolean;
  onFadeAudio?: () => void;
  onReplay?: () => void;
}

export function ShoreSequence({
  reduced,
  paused,
  skip = false,
  onFadeAudio,
  onReplay,
}: ShoreSequenceProps) {
  const router = useRouter();
  const [beat, setBeat] = useState(skip ? 4 : 0);
  const [revealStage, setRevealStage] = useState(skip || reduced ? 4 : 0);
  const [destination, setDestination] = useState<'signup' | 'login' | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const begin = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    Promise.all(
      ['storm-shore', 'shore-figures'].map(
        (name) =>
          new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = reject;
            image.src = `/opening/${name}.webp?v=${attempt}`;
          })
      )
    )
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    router.prefetch('/signup');
    router.prefetch('/login');
    return () => {
      live = false;
    };
  }, [attempt, router]);

  useEffect(() => {
    if (skip) {
      setBeat(4);
      setRevealStage(4);
    }
  }, [skip]);

  // Transition from beat 0 (Awakening / Heartbeat) to beat 4 (Storm Shore wide view)
  // 3220ms aligns exactly with musical resolution at 00:33.34
  useEffect(() => {
    if (!ready || paused || beat >= 4) return;
    const duration = reduced ? 150 : 3220;
    const timer = setTimeout(() => {
      setBeat(4);
    }, duration);
    return () => clearTimeout(timer);
  }, [beat, ready, reduced, paused]);

  // Sequential typography arrival once storm shore establishes (beat === 4)
  useEffect(() => {
    if (beat !== 4 || revealStage >= 4 || paused) return;

    if (reduced || skip) {
      setRevealStage(4);
      return;
    }

    // Stage 1: YOU FOUND THE EMBER (at 00:33.5)
    // Stage 2: WHAT YOU DO BECOMES WHO YOU ARE (hold, +1400ms)
    // Stage 3: BEGIN YOUR PATH / SIGN IN (hold, +1400ms)
    // Stage 4: Built by Algoryxz for Tech Zephyr Web Hackathon (+1000ms)
    const delays = [300, 1400, 1400, 1000];
    const timer = setTimeout(() => {
      setRevealStage((prev) => prev + 1);
    }, delays[revealStage] || 1000);

    return () => clearTimeout(timer);
  }, [beat, revealStage, reduced, skip, paused]);

  useEffect(() => {
    if (beat === 4 && revealStage >= 3) {
      begin.current?.focus({ preventScroll: true });
    }
  }, [beat, revealStage]);

  useEffect(() => {
    if (!destination) return;
    onFadeAudio?.();
    const timer = setTimeout(
      () => router.push(`/${destination}?from=ember`),
      reduced ? 150 : 1500
    );
    return () => clearTimeout(timer);
  }, [destination, reduced, router, onFadeAudio]);

  const handleChoice = (dest: 'signup' | 'login') => {
    onFadeAudio?.();
    setDestination(dest);
  };

  const handleReplayClick = () => {
    setBeat(0);
    setRevealStage(0);
    onReplay?.();
  };

  return (
    <section
      className="shore-sequence"
      style={
        {
          '--shore-environment': `url('/opening/storm-shore.webp?v=${attempt}')`,
          '--shore-figures': `url('/opening/shore-figures.webp?v=${attempt}')`,
        } as CSSProperties
      }
      data-beat={beat}
      data-entering={destination || ''}
      data-reduced={reduced}
      data-paused={paused}
      aria-label="The Ember within, then the storm shore"
    >
      {ready && (
        <>
          <div className="shore-world" aria-hidden="true">
            <div className="shore-land" />
            <div className="shore-clouds shore-clouds-far" />
            <div className="shore-clouds shore-clouds-near" />
            <div className="shore-ocean" />
            <div className="shore-mist" />
          </div>

          <div className="shore-player" aria-hidden="true">
            <div className="shore-angle shore-rear" />
            <div className="shore-angle shore-side" />
            <div className="shore-angle shore-front" />
            <span className="shore-core" />
            <span className="shore-filaments" />
          </div>

          <div className="shore-shade" aria-hidden="true" />

          {/* Beat 0: Awakening (Whiteout -> Black -> Heartbeat -> Chest Ember) with NO explanatory copy */}

          {beat === 4 && (
            <div className="shore-copy" data-reveal-stage={revealStage}>
              {/* Stage 1: Eyebrow */}
              <motion.p
                className="shore-eyebrow"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: revealStage >= 1 ? 1 : 0, y: revealStage >= 1 ? 0 : 6 }}
                transition={{ duration: reduced ? 0.1 : 0.8 }}
              >
                YOU FOUND THE EMBER.
              </motion.p>

              {/* Stage 2: Main Credo */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: revealStage >= 2 ? 1 : 0, y: revealStage >= 2 ? 0 : 8 }}
                transition={{ duration: reduced ? 0.1 : 1.0 }}
              >
                <h2>
                  WHAT YOU DO<br />
                  <em>BECOMES WHO YOU ARE.</em>
                </h2>
                <p className="shore-support">Now give it something to become.</p>
              </motion.div>

              {/* Stage 3: Actions */}
              <motion.div
                className="shore-choices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: revealStage >= 3 ? 1 : 0, y: revealStage >= 3 ? 0 : 10 }}
                transition={{ duration: reduced ? 0.1 : 0.8 }}
              >
                <button
                  ref={begin}
                  disabled={!!destination}
                  onClick={() => handleChoice('signup')}
                >
                  BEGIN YOUR PATH <span aria-hidden="true">↗</span>
                </button>
                <button
                  disabled={!!destination}
                  onClick={() => handleChoice('login')}
                >
                  <small>RETURNING PLAYER</small> SIGN IN
                </button>
              </motion.div>

              {/* Stage 4: Provenance & Replay */}
              <motion.div
                className="shore-footer-row"
                initial={{ opacity: 0 }}
                animate={{ opacity: revealStage >= 4 ? 1 : 0 }}
                transition={{ duration: reduced ? 0.1 : 0.8 }}
              >
                <p className="shore-credits">Built by Algoryxz for Tech Zephyr Web Hackathon</p>
                {onReplay && (
                  <button
                    type="button"
                    className="shore-replay-btn"
                    onClick={handleReplayClick}
                    aria-label="Replay cinematic prologue"
                  >
                    ↺ Replay cinematic
                  </button>
                )}
              </motion.div>
            </div>
          )}

          <div className="shore-bloom" aria-hidden="true" />
        </>
      )}

      {!ready && (
        <div className="prologue-loading" role="status">
          {failed ? (
            <>
              <span>The shore could not load.</span>
              <button
                onClick={() => {
                  setFailed(false);
                  setAttempt((value) => value + 1);
                }}
              >
                Try again
              </button>
            </>
          ) : (
            'The Ember is still with you…'
          )}
        </div>
      )}
    </section>
  );
}

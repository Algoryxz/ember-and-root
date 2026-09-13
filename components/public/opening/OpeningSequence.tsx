'use client';

import { useEffect, useRef, useState, useCallback, type CSSProperties, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './opening.css';
import { ShoreSequence } from './ShoreSequence';
import { useEntryAudio } from './EntryAudioProvider';
import { ForestAwakeningOrb } from './ForestAwakeningOrb';

type Scene = 'forest' | 'chamber' | 'black';

const LABELS: Record<Scene, string> = {
  forest: 'Hold the dormant orb to awaken the forest',
  chamber: 'Reach for the Ember',
  black: 'The Ember is within you',
};

type PlateProps = {
  kind: 'forest' | 'root-chamber';
  loaded: boolean;
  attempt: number;
  active: boolean;
  scene: Scene;
  hotspot: RefObject<HTMLButtonElement>;
  onAdvance: () => void;
  onNear: (near: boolean) => void;
  onForestAwakened?: () => void;
  reduced: boolean;
  paused: boolean;
};

function ScenePlate({
  kind,
  loaded,
  attempt,
  active,
  scene,
  hotspot,
  onAdvance,
  onNear,
  onForestAwakened,
  reduced,
  paused,
}: PlateProps) {
  const root = kind === 'root-chamber';
  const style = {
    '--target-x': root ? '57%' : '50%',
    '--target-y': root ? '51%' : '55%',
    backgroundImage: loaded ? `url('/opening/${kind}.webp?v=${attempt}')` : undefined,
  } as CSSProperties;

  return (
    <div
      className={`prologue-layer ${root ? 'prologue-roots' : 'prologue-forest'}`}
      aria-hidden={!active}
    >
      <div className="prologue-camera">
        <div className="prologue-plane" style={style}>
          <div className="prologue-backdrop" />
          <div className="prologue-emissive" />
          <div className="prologue-fog prologue-fog-far" />
          <div className="prologue-destination" aria-hidden="true">
            <span className="prologue-aura" />
            {root ? (
              <span className="prologue-ember">
                <i />
                <b />
              </span>
            ) : null}
            {Array.from({ length: 10 }, (_, index) => (
              <i
                key={index}
                className="prologue-mote"
                style={
                  {
                    '--i': index,
                    '--dx': `${(index % 2 ? 1 : -1) * (26 + index * 6)}px`,
                    '--dy': `${(index % 3 - 1) * 48}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="prologue-fog prologue-fog-near" />

          {/* Forest Stage: Dormant Orb Hold-to-Awaken Interaction */}
          {!root && active && scene === 'forest' && onForestAwakened && (
            <ForestAwakeningOrb
              onAwakened={onForestAwakened}
              reducedMotion={reduced}
              paused={paused}
            />
          )}

          {/* Root Chamber Stage: Reach for the Ember */}
          {root && active && scene === 'chamber' && (
            <button
              ref={hotspot}
              type="button"
              className="prologue-hotspot"
              aria-label={LABELS[scene]}
              onClick={() => onAdvance()}
              onFocus={() => onNear(true)}
              onBlur={() => onNear(false)}
            >
              <span>REACH FOR THE EMBER</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OpeningSequence() {
  const [scene, setScene] = useState<Scene>('forest');
  const [phase, setPhase] = useState<'enter' | 'idle'>('idle');
  const [skipShore, setSkipShore] = useState(false);
  const [near, setNear] = useState(false);
  const [still, setStill] = useState(false);
  const [paused, setPaused] = useState(false);
  const [assets, setAssets] = useState({ forest: false, roots: false });
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const { isMuted, toggleMute, play, restart } = useEntryAudio();
  const osReduced = useReducedMotion();
  const reduced = Boolean(osReduced || still);
  const hotspot = useRef<HTMLButtonElement>(null);

  const root = scene === 'chamber';
  const ready = assets.forest;

  // Audio lifecycle initialization: start playback on prologue mount
  useEffect(() => {
    play();
  }, [play]);

  // Asset preloading
  useEffect(() => {
    let cancelled = false;
    const images = ['forest', 'root-chamber'].map((name) => {
      const image = new Image();
      image.onload = () => {
        if (!cancelled)
          setAssets((value) => ({
            ...value,
            [name === 'forest' ? 'forest' : 'roots']: true,
          }));
      };
      image.onerror = () => {
        if (!cancelled) setFailed(true);
      };
      image.src = `/opening/${name}.webp?v=${attempt}`;
      return image;
    });
    return () => {
      cancelled = true;
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [attempt]);

  useEffect(() => {
    if (scene !== 'chamber') return;
    ['storm-shore', 'shore-figures'].forEach((name) => {
      const image = new Image();
      image.src = `/opening/${name}.webp?v=0`;
    });
  }, [scene]);

  useEffect(() => {
    const change = () => setPaused(document.hidden);
    change();
    document.addEventListener('visibilitychange', change);
    return () => document.removeEventListener('visibilitychange', change);
  }, []);

  // Callback triggered when the forest dormant orb reaches 100% hold energy
  const handleForestAwakened = useCallback(() => {
    setPhase('enter');
    const duration = reduced ? 150 : 850;
    window.setTimeout(() => {
      setScene('chamber');
      setPhase('idle');
      hotspot.current?.focus();
    }, duration);
  }, [reduced]);

  // Advance from chamber to black / shore sequence
  const advance = useCallback(() => {
    if (scene !== 'chamber') return;
    setNear(false);
    setPhase('enter');
    const delay = reduced ? 80 : 550;
    window.setTimeout(() => {
      setScene('black');
      setPhase('idle');
    }, delay);
  }, [reduced, scene]);

  function skip() {
    play();
    setSkipShore(true);
    setScene('black');
    setPhase('idle');
    setNear(false);
  }

  function handleReplay() {
    setSkipShore(false);
    setScene('forest');
    setPhase('idle');
    setNear(false);
    restart();
  }

  return (
    <main
      className="prologue"
      data-scene={scene}
      data-phase={phase}
      data-near={near}
      data-reduced={reduced}
      data-paused={paused}
      aria-label="Ember and Root — playable prologue"
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse' || scene === 'black') return;
        const rect = hotspot.current?.getBoundingClientRect();
        if (rect)
          setNear(
            Math.hypot(
              event.clientX - rect.x - rect.width / 2,
              event.clientY - rect.y - rect.height / 2
            ) < 150
          );
      }}
      onPointerLeave={() => setNear(false)}
    >
      <h1 className="prologue-sr">Ember &amp; Root — playable prologue</h1>
      {scene !== 'black' && (
        <ScenePlate
          kind="forest"
          loaded={assets.forest}
          attempt={attempt}
          active={!root}
          scene={scene}
          hotspot={hotspot}
          onAdvance={advance}
          onNear={setNear}
          onForestAwakened={handleForestAwakened}
          reduced={reduced}
          paused={paused}
        />
      )}
      {scene !== 'black' && (
        <ScenePlate
          kind="root-chamber"
          loaded={assets.roots}
          attempt={attempt}
          active={root}
          scene={scene}
          hotspot={hotspot}
          onAdvance={advance}
          onNear={setNear}
          reduced={reduced}
          paused={paused}
        />
      )}
      <div className="prologue-vignette" aria-hidden="true" />
      <motion.div
        className="prologue-black"
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{ opacity: scene === 'black' || !assets.forest ? 1 : 0 }}
        transition={{ duration: reduced ? 0.12 : scene === 'black' ? 0.1 : 1.4 }}
      />
      {/* Early forest call whisper */}
      <motion.p
        className="prologue-whisper"
        initial={false}
        animate={{ opacity: scene === 'forest' && ready ? 0.8 : 0 }}
        transition={{ duration: reduced ? 0.1 : 1.5 }}
      >
        SOMETHING IS CALLING.
      </motion.p>

      {/* Accessible Cinematic Tools Bar */}
      <div className="prologue-tools">
        <button
          type="button"
          className="prologue-sound-btn"
          onClick={toggleMute}
          aria-label={isMuted ? 'Enable prologue sound' : 'Mute prologue sound'}
          aria-pressed={!isMuted}
        >
          {isMuted ? 'Sound Off' : 'Sound On'}
        </button>
        <button
          type="button"
          aria-pressed={reduced}
          disabled={Boolean(osReduced)}
          onClick={() => setStill((value) => !value)}
        >
          {reduced ? 'Reduced motion' : 'Reduce motion'}
        </button>
        <button type="button" onClick={skip}>
          Skip cinematic
        </button>
      </div>

      {scene === 'black' && (
        <ShoreSequence
          reduced={reduced}
          paused={paused}
          skip={skipShore}
          onReplay={handleReplay}
        />
      )}

      {(!ready || failed) && scene !== 'black' && (
        <div
          className={`prologue-loading ${assets.forest ? 'prologue-loading-inline' : ''}`}
          role="status"
        >
          {failed ? (
            <>
              <span>The scene could not load.</span>
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  setAttempt((value) => value + 1);
                }}
              >
                Try again
              </button>
            </>
          ) : assets.forest ? (
            'The passage is opening…'
          ) : (
            'Entering the forest…'
          )}
        </div>
      )}

      <p className="prologue-sr" role="status" aria-live="polite">
        {scene === 'black'
          ? 'The Ember is within you. The shore is opening.'
          : `${LABELS[scene]}.`}
      </p>

      <noscript>
        <p className="prologue-loading">
          This interactive scene needs JavaScript. <a href="/">Return to Ember &amp; Root</a>.
        </p>
      </noscript>
    </main>
  );
}

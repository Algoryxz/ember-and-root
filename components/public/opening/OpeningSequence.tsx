'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './opening.css';
import { ShoreSequence } from './ShoreSequence';

type Scene = 'forest' | 'guided' | 'chamber' | 'discovery' | 'surge' | 'black';
const LABELS: Record<Scene, string> = {
  forest: 'Follow the glowing tree', guided: 'Enter the root passage', chamber: 'Approach the Ember',
  discovery: 'Reach for the Ember', surge: 'The Ember answers', black: 'The Ember is within you',
};
// Authored stops. Only the final surge completes without further input.
const NEXT: Partial<Record<Scene, Scene>> = { forest: 'guided', guided: 'chamber', chamber: 'discovery', discovery: 'surge' };
const ENTER_MS: Record<Scene, number> = { forest: 1600, guided: 1900, chamber: 3100, discovery: 2200, surge: 1450, black: 150 };
type PlateProps = {
  kind: 'forest' | 'root-chamber'; loaded: boolean; attempt: number; active: boolean; scene: Scene; enabled: boolean;
  hotspot: RefObject<HTMLButtonElement>; onAdvance: (detail: number) => void; onNear: (near: boolean) => void;
};

function ScenePlate({ kind, loaded, attempt, active, scene, enabled, hotspot, onAdvance, onNear }: PlateProps) {
  const root = kind === 'root-chamber';
  const style = {
    '--target-x': root ? '57%' : scene === 'forest' ? '70%' : '50%',
    '--target-y': root ? '51%' : scene === 'forest' ? '55%' : '64%',
    backgroundImage: loaded ? `url('/opening/${kind}.webp?v=${attempt}')` : undefined,
  } as CSSProperties;
  return <div className={`prologue-layer ${root ? 'prologue-roots' : 'prologue-forest'}`} aria-hidden={!active}>
    <div className="prologue-camera"><div className="prologue-plane" style={style}>
      <div className="prologue-backdrop" /><div className="prologue-emissive" />
      <div className="prologue-fog prologue-fog-far" />
      {!root && <div className="prologue-old-guidance" aria-hidden="true">⁙</div>}
      <div className="prologue-destination" aria-hidden="true">
        <span className="prologue-aura" />
        {root ? <span className="prologue-ember"><i /><b /></span> : <span className="prologue-mark">·<br />⁙<br />·</span>}
        {Array.from({ length: 10 }, (_, index) => <i key={index} className="prologue-mote" style={{ '--i': index,
          '--dx': `${(index % 2 ? 1 : -1) * (26 + index * 6)}px`, '--dy': `${(index % 3 - 1) * 48}px` } as CSSProperties} />)}
      </div>
      <div className="prologue-foreground" /><div className="prologue-fog prologue-fog-near" />
      {active && scene !== 'black' && <button ref={hotspot} type="button" className="prologue-hotspot" aria-label={LABELS[scene]}
        aria-disabled={!enabled} onClick={event => { if (enabled) onAdvance(event.detail); }}
        onFocus={() => onNear(true)} onBlur={() => onNear(false)} onPointerDown={() => onNear(true)}>
        <span>{scene === 'forest' ? 'This way.' : scene === 'guided' ? 'Further in.' : scene === 'chamber' ? 'Closer.' : scene === 'discovery' ? 'REACH FOR IT' : ''}</span>
      </button>}
    </div></div>
  </div>;
}

export function OpeningSequence() {
  const [scene, setScene] = useState<Scene>('forest');
  const [phase, setPhase] = useState<'enter' | 'idle'>('enter');
  const [skipShore, setSkipShore] = useState(false);
  const [near, setNear] = useState(false);
  const [still, setStill] = useState(false);
  const [paused, setPaused] = useState(false);
  const [assets, setAssets] = useState({ forest: false, roots: false });
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const osReduced = useReducedMotion();
  const reduced = Boolean(osReduced || still);
  const hotspot = useRef<HTMLButtonElement>(null);
  
  const keyboardAdvance = useRef(false);
  const root = !['forest', 'guided'].includes(scene);
  const needsRoots = scene !== 'forest';
  const ready = assets.forest && (!needsRoots || assets.roots);
  const enabled = phase === 'idle' && ready && !failed && Boolean(NEXT[scene]);

  useEffect(() => {
    let cancelled = false;
    const images = (needsRoots ? ['forest', 'root-chamber'] : ['forest']).map(name => {
      const image = new Image();
      image.onload = () => { if (!cancelled) setAssets(value => ({ ...value, [name === 'forest' ? 'forest' : 'roots']: true })); };
      image.onerror = () => { if (!cancelled) setFailed(true); };
      image.src = `/opening/${name}.webp?v=${attempt}`;
      return image;
    });
    return () => { cancelled = true; images.forEach(image => { image.onload = null; image.onerror = null; }); };
  }, [attempt, needsRoots]);
  useEffect(() => {
    if (scene !== 'chamber') return;
    ['storm-shore', 'shore-figures'].forEach(name => { const image = new Image(); image.src = `/opening/${name}.webp?v=0`; });
  }, [scene]);
  useEffect(() => {
    const change = () => setPaused(document.hidden);
    change(); document.addEventListener('visibilitychange', change);
    return () => document.removeEventListener('visibilitychange', change);
  }, []);
  useEffect(() => {
    if (!ready || paused || phase === 'idle' || failed) return;
    const timer = window.setTimeout(() => {
      if (scene === 'surge') { setScene('black'); setPhase('enter'); }
      else { setPhase('idle'); if (keyboardAdvance.current) hotspot.current?.focus(); }
    }, reduced ? 140 : ENTER_MS[scene]);
    return () => window.clearTimeout(timer);
  }, [scene, phase, ready, paused, reduced, failed]);

  function advance(detail: number) {
    const next = NEXT[scene];
    if (!enabled || !next) return;
    keyboardAdvance.current = detail === 0; setNear(false); setScene(next); setPhase('enter');
  }
  function skip() {
    setSkipShore(true); keyboardAdvance.current = true; setScene('black'); setPhase('idle'); setNear(false);

  }
  return <main className="prologue" data-scene={scene} data-phase={phase} data-near={near} data-reduced={reduced} data-paused={paused}
    aria-label="Ember and Root playable prologue" onPointerMove={event => {
      if (event.pointerType !== 'mouse' || scene === 'black') return;
      const rect = hotspot.current?.getBoundingClientRect();
      if (rect) setNear(Math.hypot(event.clientX - rect.x - rect.width / 2, event.clientY - rect.y - rect.height / 2) < 150);
    }} onPointerLeave={() => setNear(false)}>
    <h1 className="prologue-sr">Ember &amp; Root — playable prologue</h1>
    {scene !== 'black' && <ScenePlate kind="forest" loaded={assets.forest} attempt={attempt} active={!root} scene={scene} enabled={enabled} hotspot={hotspot} onAdvance={advance} onNear={setNear} />}
    {scene !== 'black' && <ScenePlate kind="root-chamber" loaded={assets.roots} attempt={attempt} active={root} scene={scene} enabled={enabled} hotspot={hotspot} onAdvance={advance} onNear={setNear} />}
    <div className="prologue-vignette" aria-hidden="true" />
    <motion.div className="prologue-black" aria-hidden="true" initial={{ opacity: 1 }} animate={{ opacity: scene === 'black' || !assets.forest ? 1 : 0 }} transition={{ duration: reduced ? .12 : scene === 'black' ? .1 : 1.6 }} />
    <motion.p className="prologue-whisper" initial={false} animate={{ opacity: scene === 'forest' && ready ? .8 : 0 }} transition={{ duration: reduced ? .1 : 1.5 }}>SOMETHING IS CALLING.</motion.p>
    <div className="prologue-tools">{scene !== 'black' ? <>
      <button type="button" aria-pressed={reduced} disabled={Boolean(osReduced)} onClick={() => setStill(value => !value)}>{reduced ? 'Reduced motion' : 'Reduce motion'}</button>
      <button type="button" onClick={skip}>Skip cinematic</button>
    </> : <><button type="button" onClick={() => setStill(value => !value)} aria-pressed={reduced}>Reduce motion</button><button type="button" onClick={skip}>Skip cinematic</button></>}</div>
    {scene === 'black' && <ShoreSequence reduced={reduced} paused={paused} skip={skipShore} />}
    {(!ready || failed) && scene !== 'black' && <div className={`prologue-loading ${assets.forest ? 'prologue-loading-inline' : ''}`} role="status">
      {failed ? <><span>The scene could not load.</span><button type="button" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Try again</button></> : assets.forest ? 'The passage is opening…' : 'Entering the forest…'}
    </div>}
    <p className="prologue-sr" role="status" aria-live="polite">{phase === 'idle' ? scene === 'black' ? 'The Ember is within you. The shore is opening.' : `${LABELS[scene]}. Activate the scene hotspot to continue.` : ''}</p>
    <noscript><p className="prologue-loading">This interactive scene needs JavaScript. <a href="/">Return to Ember &amp; Root</a>.</p></noscript>
  </main>;
}

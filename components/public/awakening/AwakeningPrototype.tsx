'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './awakening.css';

type Beat = 'dark' | 'striking' | 'lit' | 'approach' | 'contact' | 'blackout' | 'ember';
const NEXT: Partial<Record<Beat, { beat: Beat; after: number }>> = {
  striking: { beat: 'lit', after: 760 },
  approach: { beat: 'contact', after: 1500 },
  contact: { beat: 'blackout', after: 280 },
  blackout: { beat: 'ember', after: 140 },
};

/** Presentation-only origin study. No game state, persistence, or reward mutations. */
export function AwakeningPrototype() {
  const [beat, setBeat] = useState<Beat>('dark');
  const [still, setStill] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [assetAttempt, setAssetAttempt] = useState(0);
  const [loaded, setLoaded] = useState({ human: false, ember: false });
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const osReduced = useReducedMotion();
  const reduced = Boolean(osReduced || still);
  const swipe = useRef<number | null>(null);
  const gestureConsumed = useRef(false);
  const busy = beat !== 'dark' && beat !== 'lit' && beat !== 'ember';
  const ready = loaded.human && loaded.ember;

  useEffect(() => {
    let cancelled = false;
    const images = (['human', 'ember'] as const).map(kind => {
      const image = new Image();
      image.onload = () => { if (!cancelled) setLoaded(value => ({ ...value, [kind]: true })); };
      image.onerror = () => { if (!cancelled) setAssetError(true); };
      image.src = `/hero/awakening-${kind}.png?v=${assetAttempt}`;
      return image;
    });
    return () => { cancelled = true; images.forEach(image => { image.onload = null; image.onerror = null; }); };
  }, [assetAttempt]);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (hidden) return;
    const next = NEXT[beat];
    if (!next) return;
    const timer = window.setTimeout(() => {
      setBeat(reduced ? (beat === 'striking' ? 'lit' : 'ember') : next.beat);
    }, reduced ? 0 : next.after);
    return () => window.clearTimeout(timer);
  }, [beat, reduced, hidden]);

  function advance() {
    setPointer({ x: 0, y: 0 });
    if (beat === 'dark') setBeat(reduced ? 'lit' : 'striking');
    if (beat === 'lit') setBeat(reduced ? 'ember' : 'approach');
    if (beat === 'ember') setBeat('dark');
  }

  const approaching = beat === 'approach' || beat === 'contact' || beat === 'ember';
  const lightX = approaching ? 300 : 216 + pointer.x;
  const lightY = approaching ? 350 : 448 + pointer.y;
  const lightTransition = { duration: reduced ? 0 : beat === 'approach' ? 1.5 : .18 };
  const style = { '--hand-x': `${pointer.x}px`, '--hand-y': `${pointer.y}px` } as CSSProperties;
  const announcement = beat === 'dark'
    ? 'A figure waits in darkness. Strike the match to begin.'
    : beat === 'lit'
      ? 'The match catches. Its warmth reveals a human figure. Bring the light to the chest.'
      : beat === 'ember'
        ? 'An Ember awakens within the chest. This opening study ends here.' : '';

  return (
    <main className="awakening" data-beat={beat} data-reduced={reduced} data-paused={hidden} style={style}
      onPointerMove={(event) => {
        if (beat !== 'lit' || reduced || event.pointerType !== 'mouse') return;
        const box = event.currentTarget.getBoundingClientRect();
        setPointer({ x: ((event.clientX - box.left) / box.width - .5) * 36,
          y: ((event.clientY - box.top) / box.height - .5) * 22 });
      }} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
      <header className="awakening-header">
        <a href="/" aria-label="Ember and Root home">EMBER <span>&</span> ROOT</a>
        <div className="awakening-options">
          <button type="button" aria-pressed={reduced} onClick={() => setStill(!still)} disabled={Boolean(osReduced)}>
            {reduced ? 'Reduced motion' : 'Reduce motion'}
          </button>
          <button type="button" onClick={() => setBeat('ember')} aria-disabled={beat === 'ember'}>Skip to Ember</button>
        </div>
      </header>

      <div className="awakening-intro">
        <p className="awakening-eyebrow">A LIFE RPG · THE SELF WITHIN</p>
        <h1>Every path begins<br />with a spark.</h1>
      </div>

      <div className="awakening-stage" aria-hidden="true">
        <svg viewBox="0 0 600 800" className="awakening-art" fill="none">
          <defs>
            <motion.radialGradient id="aw-local" gradientUnits="userSpaceOnUse" initial={false}
              animate={{ cx: lightX, cy: lightY }} transition={lightTransition} r="440">
              <stop stopColor="white" /><stop offset=".33" stopColor="white" stopOpacity=".95" />
              <stop offset=".72" stopColor="white" stopOpacity=".45" /><stop offset="1" stopColor="white" stopOpacity="0" />
            </motion.radialGradient>
            <mask id="aw-reveal"><rect width="600" height="800" fill="url(#aw-local)" /></mask>
            <radialGradient id="aw-halo"><stop stopColor="#ef9a4a" stopOpacity=".26" /><stop offset="1" stopColor="#e98a4b" stopOpacity="0" /></radialGradient>
            <linearGradient id="aw-wood"><stop stopColor="#513725" /><stop offset=".45" stopColor="#d4ab70" /><stop offset=".7" stopColor="#896142" /><stop offset="1" stopColor="#261a13" /></linearGradient>
            <linearGradient id="aw-fire" x1="0" y1="1" x2=".2" y2="0"><stop stopColor="#fff2bf" /><stop offset=".32" stopColor="#ffd38a" /><stop offset=".7" stopColor="#ed8a38" /><stop offset="1" stopColor="#ad4321" stopOpacity=".2" /></linearGradient>
            <filter id="aw-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="8" /></filter>
            <filter id="aw-edge"><feGaussianBlur stdDeviation="2" /></filter>
            <linearGradient id="aw-bottom" x2="0" y2="1"><stop offset=".63" stopColor="white" /><stop offset=".98" stopColor="black" /></linearGradient>
            <mask id="aw-body-fade"><rect width="600" height="800" fill="url(#aw-bottom)" /></mask>
            <linearGradient id="aw-hand-mask" x1="0" y1="0" x2="0" y2="1"><stop stopColor="black" /><stop offset=".16" stopColor="white" /><stop offset=".78" stopColor="white" /><stop offset="1" stopColor="black" /></linearGradient>
            <mask id="aw-hand-crop"><path d="M74 494 Q126 466 185 485 Q208 491 222 500 Q231 510 218 522 Q234 532 226 545 Q239 557 226 570 Q236 584 219 601 L181 604 L158 654 L74 654Z" fill="url(#aw-hand-mask)" filter="url(#aw-edge)" /></mask>
            <linearGradient id="aw-wrist-fade"><stop stopColor="black" /><stop offset=".2" stopColor="white" /><stop offset="1" stopColor="white" /></linearGradient>
            <mask id="aw-wrist"><rect x="74" y="475" width="165" height="180" fill="url(#aw-wrist-fade)" /></mask>
          </defs>

          <g mask="url(#aw-body-fade)" className="aw-person" key={assetAttempt}>
            <image href={`/hero/awakening-human.png?v=${assetAttempt}`} x="75" y="74" width="450" height="675" className="aw-outline" onLoad={() => setLoaded(value => ({ ...value, human: true }))} onError={() => setAssetError(true)} />
            <image href={`/hero/awakening-human.png?v=${assetAttempt}`} x="75" y="74" width="450" height="675" className="aw-lit-body" mask="url(#aw-reveal)" />
            <image href={`/hero/awakening-ember.png?v=${assetAttempt}`} x="75" y="74" width="450" height="675" className="aw-inner-light" onLoad={() => setLoaded(value => ({ ...value, ember: true }))} onError={() => setAssetError(true)} />
          </g>

          <g className="aw-striker">
            <path d="M113 455 L210 440 L220 458 L123 475Z" fill="#241b15" stroke="#65503a" strokeWidth=".7" />
            <path d="M123 460 L205 448 M125 464 L208 452 M127 468 L211 456" stroke="#a27c51" strokeWidth="1.4" strokeDasharray="1 3" />
          </g>
          <g className="aw-match-position">
            <g className="aw-match-steer">
              <g className="aw-match-strike">
                <ellipse className="aw-match-halo" cx="216" cy="447" rx="109" ry="123" fill="url(#aw-halo)" />
                <g mask="url(#aw-wrist)"><image href="/hero/hand-match.jpg" x="74" y="295" width="270" height="362" mask="url(#aw-hand-crop)" className="aw-hand" /></g>
                <path d="M214 452 L216 510 L210 511 L208 452Z" fill="url(#aw-wood)" />
                <ellipse cx="211" cy="451" rx="5" ry="8" fill="#613421" className="aw-match-head" />
                <g className="aw-fire" style={{ transformOrigin: '212px 451px' }}>
                  <path d="M211 453 C188 441 205 423 207 412 C211 401 204 392 212 383 C207 411 230 417 225 434 C223 446 218 451 211 453Z" fill="#e98a4b" filter="url(#aw-glow)" />
                  <path d="M211 453 C193 441 205 425 208 417 C212 405 208 399 212 394 C212 413 228 419 224 435 C222 446 217 451 211 453Z" fill="url(#aw-fire)" />
                  <path d="M211 450 C202 440 212 430 214 422 C219 435 220 443 211 450Z" fill="#fff1c8" />
                </g>
                <g className="aw-sparks" stroke="#ffd38a" strokeLinecap="round">
                  <path d="M205 448 L164 426 M207 451 L165 457 M210 445 L190 411 M216 447 L236 426 M213 454 L239 466" />
                </g>
              </g>
            </g>
          </g>
          <ellipse className="aw-core" cx="298" cy="351" rx="36" ry="45" fill="url(#aw-halo)" style={{ transformOrigin: '298px 351px' }} />
        </svg>
      </div>

      <div className="awakening-blackout" aria-hidden="true" />
      <div className="awakening-action">
        {assetError && <p role="alert" className="awakening-asset-error">The scene could not load. <button type="button" onClick={() => { setAssetError(false); setLoaded({ human: false, ember: false }); setAssetAttempt(value => value + 1); setBeat('dark'); }}>Reload scene</button></p>}
        <p className="awakening-cue" aria-hidden="true">
          {beat === 'dark' ? 'One small act.' : beat === 'lit' ? 'Bring it closer.' : beat === 'ember' ? 'Alive. Within you.' : '\u00a0'}
        </p>
        <button type="button" className="awakening-primary" aria-disabled={busy || assetError || !ready} onClick={() => {
          if (gestureConsumed.current) { gestureConsumed.current = false; return; }
          if (!busy && !assetError && ready) advance();
        }} onPointerDown={(event) => {
          gestureConsumed.current = false;
          if (beat === 'dark' && !assetError && ready) { swipe.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }
        }} onPointerUp={(event) => {
          if (beat === 'dark' && swipe.current !== null && Math.abs(event.clientX - swipe.current) > 44) {
            gestureConsumed.current = true; advance();
          }
          swipe.current = null;
        }} onPointerCancel={() => { swipe.current = null; }}>
          <span aria-hidden="true">{beat === 'ember' ? '↺' : '⟶'}</span>
          {!ready && !assetError ? 'Preparing the light…' : beat === 'dark' ? 'Strike the match' : beat === 'lit' ? 'Bring the light within' : beat === 'ember' ? 'Experience again' : 'The light is moving within'}
        </button>
        <p className="awakening-footnote">{beat === 'ember' ? 'THE SELF WITHIN · OPENING STUDY' : 'YOU ARE THE CHARACTER'}</p>
      </div>
      <p className="awakening-sr" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <noscript><p className="awakening-noscript">Enable JavaScript to experience the awakening. <a href="/">Return to Ember &amp; Root</a>.</p></noscript>
    </main>
  );
}

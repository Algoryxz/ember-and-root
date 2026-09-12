'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import './shore.css';

export function ShoreSequence({ reduced, paused, skip = false }: { reduced: boolean; paused: boolean; skip?: boolean }) {
  const router = useRouter();
  const [beat, setBeat] = useState(skip ? 4 : 0);
  const [destination, setDestination] = useState<'signup' | 'login' | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const begin = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let live = true;
    Promise.all(['storm-shore', 'shore-figures'].map(name => new Promise<void>((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(); image.onerror = reject;
      image.src = `/opening/${name}.webp?v=${attempt}`;
    }))).then(() => { if (live) setReady(true); }).catch(() => { if (live) setFailed(true); });
    router.prefetch('/signup'); router.prefetch('/login');
    return () => { live = false; };
  }, [attempt, router]);
  useEffect(() => { if (skip) setBeat(4); }, [skip]);
  useEffect(() => {
    if (!ready || paused || beat >= 4) return;
    const timer = setTimeout(() => setBeat(value => value + 1), reduced ? 1000 : [3200, 3600, 3200, 3200][beat]);
    return () => clearTimeout(timer);
  }, [beat, ready, reduced, paused]);
  useEffect(() => { if (beat === 4) begin.current?.focus({ preventScroll: true }); }, [beat]);
  useEffect(() => {
    if (!destination) return;
    const timer = setTimeout(() => router.push(`/${destination}?from=ember`), reduced ? 150 : 1500);
    return () => clearTimeout(timer);
  }, [destination, reduced, router]);
  return <section className="shore-sequence" style={{ '--shore-environment': `url('/opening/storm-shore.webp?v=${attempt}')`, '--shore-figures': `url('/opening/shore-figures.webp?v=${attempt}')` } as CSSProperties} data-beat={beat} data-entering={destination || ''} data-reduced={reduced} data-paused={paused} aria-label="The Ember within, then the storm shore">
    {ready && <>
      <div className="shore-world" aria-hidden="true"><div className="shore-land" /><div className="shore-clouds shore-clouds-far" /><div className="shore-clouds shore-clouds-near" /><div className="shore-ocean" /><div className="shore-mist" /></div>
      <div className="shore-player" aria-hidden="true"><div className="shore-angle shore-rear" /><div className="shore-angle shore-side" /><div className="shore-angle shore-front" /><span className="shore-core" /><span className="shore-filaments" /></div>
      <div className="shore-shade" aria-hidden="true" />
      {beat === 0 && <p className="shore-heartbeat" role="status">The Ember is within you.</p>}
      {beat < 4 && <button className="shore-forward" onClick={() => setBeat(value => Math.min(4, value + 1))} aria-label="Continue toward the shore">Continue ·</button>}
      {beat === 4 && <motion.div className="shore-copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? .12 : 2 }}>
        <p className="shore-eyebrow">YOU FOUND THE EMBER.</p><h2>WHAT YOU DO<br /><em>BECOMES WHO YOU ARE.</em></h2><p className="shore-support">Now give it something to become.</p>
        <div className="shore-choices"><button ref={begin} disabled={!!destination} onClick={() => setDestination('signup')}>BEGIN YOUR PATH <span aria-hidden="true">↗</span></button><button disabled={!!destination} onClick={() => setDestination('login')}><small>RETURNING PLAYER</small> SIGN IN</button></div>
      </motion.div>}
      <div className="shore-bloom" aria-hidden="true" />
    </>}
    {!ready && <div className="prologue-loading" role="status">{failed ? <><span>The shore could not load.</span><button onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Try again</button></> : 'The Ember is still with you…'}</div>}
  </section>;
}

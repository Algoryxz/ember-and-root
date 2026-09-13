'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { useReducedMotion } from 'motion/react';
import type { AttributeId, HearthQuest, Quest } from '../hearth/contracts';
import './FocusRitual.css';

export interface FocusRitualProps {
  quest: Quest | HearthQuest;
  isOpen: boolean;
  onClose: () => void;
  onSeal: (questId: string) => void;
  reducedMotion?: boolean;
}

const INSCRIPTIONS = [
  'Stay with it.',
  'Small actions become permanent things.',
  'The Root remembers what you repeat.',
  'One more page. One more attempt.',
  'What you do becomes who you are.',
];

const PRESETS: { label: string; seconds: number; description: string }[] = [
  { label: '5m', seconds: 5 * 60, description: 'Short stirring focus' },
  { label: '15m', seconds: 15 * 60, description: 'Balanced deep focus' },
  { label: '25m', seconds: 25 * 60, description: 'Full sustained ritual' },
  { label: '1m', seconds: 60, description: 'Quick demonstration' },
];

function getDefaultPreset(effort: string): number {
  if (effort === 'high') return 25 * 60;
  if (effort === 'medium') return 15 * 60;
  return 5 * 60;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const FocusRitual: React.FC<FocusRitualProps> = ({
  quest,
  isOpen,
  onClose,
  onSeal,
  reducedMotion = false,
}) => {
  const osReduced = useReducedMotion();
  const effectiveReducedMotion = Boolean(reducedMotion || osReduced);
  const defaultSeconds = getDefaultPreset(quest.effort);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [secondsRemaining, setSecondsRemaining] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [inscriptionIndex, setInscriptionIndex] = useState(0);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize timer when opened or quest changes
  useEffect(() => {
    if (isOpen) {
      const initial = getDefaultPreset(quest.effort);
      setTotalSeconds(initial);
      setSecondsRemaining(initial);
      setIsRunning(true);
      setIsCompleted(false);
      setInscriptionIndex(0);
    } else {
      setIsRunning(false);
      setIsCompleted(false);
    }
  }, [isOpen, quest.id, quest.effort]);

  // Handle visibility changes to pause timer when tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Timer interval
  useEffect(() => {
    if (!isOpen || !isRunning || isCompleted || isTabHidden) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, isCompleted, isTabHidden]);

  // Inscription rotation (every 40 seconds while running)
  useEffect(() => {
    if (!isOpen || !isRunning || isCompleted) return;

    const interval = setInterval(() => {
      setInscriptionIndex((prev) => (prev + 1) % INSCRIPTIONS.length);
    }, 40000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, isCompleted]);

  // Keyboard accessibility: Escape exits, Space toggles pause
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' && !isCompleted) {
        // Only toggle space if not currently focused on a button or input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'button' && tag !== 'input') {
          e.preventDefault();
          setIsRunning((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCompleted, onClose]);

  if (!isOpen) return null;

  const progressFraction = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const strokeDashoffset = 565.48 * (1 - progressFraction); // 2 * PI * 90 ~= 565.48

  const handleSelectPreset = (secs: number) => {
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setIsRunning(true);
    setIsCompleted(false);
  };

  const handleTogglePlay = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setSecondsRemaining(totalSeconds);
    setIsRunning(false);
    setIsCompleted(false);
  };

  const handleFinishEarly = () => {
    setIsRunning(false);
    setSecondsRemaining(0);
    setIsCompleted(true);
  };

  const handleSealConfirm = () => {
    onSeal(quest.id);
    onClose();
  };

  const attribute = quest.attribute as AttributeId;

  return (
    <div
      className="focus-ritual-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      ref={modalRef}
      data-reduced-motion={effectiveReducedMotion}
    >
      {/* Ambient background layers */}
      <div className={`focus-ritual-ambient attr-ambient-${attribute}`} aria-hidden="true" />
      <div className="focus-ritual-vignette" aria-hidden="true" />

      {/* Top Header Bar */}
      <header className="focus-ritual-header">
        <div className="focus-ritual-header-info">
          <span className="focus-ritual-eyebrow">FOCUS RITUAL</span>
          <h2 id={titleId} className="focus-ritual-quest-title">
            {quest.title}
          </h2>
          <div className="focus-ritual-meta">
            <span className={`focus-attr-pill attr-${attribute}`}>
              {attribute.toUpperCase()}
            </span>
            <span className="focus-meta-sep" aria-hidden="true">·</span>
            <span className="focus-effort-pill">{quest.effort.toUpperCase()} EFFORT</span>
          </div>
        </div>

        <button
          type="button"
          className="focus-ritual-close-btn"
          onClick={onClose}
          aria-label="Exit Focus Ritual"
          title="Exit Ritual (Escape)"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      {/* Center Cinematic Stage */}
      <main className="focus-ritual-stage">
        {!isCompleted ? (
          <>
            {/* Living Ember & Ring Dial */}
            <div className="focus-ritual-dial-container" aria-hidden="true">
              <svg className="focus-ritual-svg" viewBox="0 0 200 200">
                <defs>
                  <radialGradient id="focusEmberGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFE090" stopOpacity="0.8" />
                    <stop offset="40%" stopColor="#E98A4B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#E98A4B" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="focusTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C4A96A" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#E98A4B" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {/* Outer decorative track */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  className="focus-dial-track"
                />

                {/* Active progress ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  className="focus-dial-progress"
                  style={{ strokeDashoffset }}
                />

                {/* Subtle Root filaments in background */}
                <g className={`focus-root-filaments attr-filaments-${attribute}`}>
                  <path d="M100 100 Q80 130 65 155 Q55 170 40 178" />
                  <path d="M100 100 Q120 130 135 155 Q145 170 160 178" />
                  <path d="M100 100 Q90 140 92 170 Q93 182 85 190" />
                  <path d="M100 100 Q110 140 108 170 Q107 182 115 190" />
                </g>

                {/* Central Living Ember Core */}
                <circle cx="100" cy="100" r="38" fill="url(#focusEmberGlow)" className="focus-ember-aura" />
                <path
                  d="M100 75 C92 84 90 92 92 99 C94 105 97 108 100 112 C103 108 106 105 108 99 C110 92 108 84 100 75 Z"
                  className={`focus-ember-flame ${isRunning ? 'is-pulsing' : 'is-idle'}`}
                />
                <circle cx="100" cy="98" r="4" className="focus-ember-spark" />
              </svg>

              {/* Time digits placed directly within the breathing aura */}
              <div className="focus-ritual-time-overlay">
                <span className="focus-ritual-digits" aria-live="off">
                  {formatTime(secondsRemaining)}
                </span>
                <span className="focus-ritual-status-label">
                  {isRunning ? 'Kindled Focus' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Sparingly Phased Motivational Inscription */}
            <p className="focus-ritual-inscription" key={inscriptionIndex}>
              “{INSCRIPTIONS[inscriptionIndex]}”
            </p>

            {/* Presets and Controls */}
            <div className="focus-ritual-controls-row">
              <div className="focus-presets-group" role="group" aria-label="Duration Presets">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`focus-preset-btn ${totalSeconds === preset.seconds ? 'is-active' : ''}`}
                    onClick={() => handleSelectPreset(preset.seconds)}
                    aria-label={`${preset.label} focus: ${preset.description}`}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="focus-actions-group">
                <button
                  type="button"
                  className="focus-action-btn focus-action-primary"
                  onClick={handleTogglePlay}
                  aria-label={isRunning ? 'Pause Focus Ritual' : 'Resume Focus Ritual'}
                >
                  {isRunning ? 'Pause' : 'Resume'}
                </button>

                <button
                  type="button"
                  className="focus-action-btn focus-action-secondary"
                  onClick={handleReset}
                  aria-label="Reset timer to beginning"
                  title="Reset timer"
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="focus-action-btn focus-action-finish"
                  onClick={handleFinishEarly}
                  aria-label="Finish focus session early and proceed to seal verification"
                  title="Finish early"
                >
                  Finish Session
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Real-World Completion Confirmation State */
          <div className="focus-ritual-seal-stage">
            <div className="focus-seal-flame-crown" aria-hidden="true">
              <span className="focus-seal-spark">✦</span>
            </div>

            <h3 className="focus-seal-prompt-title">The Ritual Is Complete</h3>
            <p id={descriptionId} className="focus-seal-prompt-desc">
              Did you complete your real-world practice for{' '}
              <strong className="text-[#F0E7D3] font-semibold">“{quest.title}”</strong>?
            </p>

            <div className="focus-seal-actions">
              <button
                type="button"
                className="focus-seal-confirm-btn"
                onClick={handleSealConfirm}
                aria-label={`Seal my effort for ${quest.title}`}
                autoFocus
              >
                <span className="focus-seal-btn-mark" aria-hidden="true">✦</span>
                <span className="focus-seal-btn-label">Seal My Effort</span>
              </button>

              <button
                type="button"
                className="focus-seal-decline-btn"
                onClick={onClose}
                aria-label="Not yet, return to journal without sealing"
              >
                Not Yet · Return to Journal
              </button>
            </div>

            <p className="focus-seal-integrity-note">
              No XP or Sparks are awarded from timer elapsed alone. Growth is earned through real action.
            </p>
          </div>
        )}
      </main>

      {/* Footer Restrained Brand Mark */}
      <footer className="focus-ritual-footer">
        <span className="focus-ritual-brand">Built by Algoryxz for Tech Zephyr Web Hackathon</span>
      </footer>
    </div>
  );
};

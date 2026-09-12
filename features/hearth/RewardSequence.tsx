import React, { useEffect, useState } from 'react';
import type { MutationEvent } from './contracts';
import './RewardSequence.css';

export interface RewardSequenceProps {
  activeEvent: MutationEvent | null;
  questTitle?: string;
  onSequenceComplete?: () => void;
  onDismissPathNotice?: () => void;
  showPathReadyNotice?: boolean;
}

/**
 * RewardSequence — Coordinates completion feedback, XP trace, and screen-reader announcements
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * Specification: docs/UI_UX_BRIEF.md § "Motion Choreography"
 * 
 * Invariants:
 * - Strictly non-blocking
 * - Reduced-motion immediate fallback
 * - ZERO database writes or mutations from animation callbacks
 * - Semantic aria-live announcements for screen readers
 * - Daily XP cap (xpAwarded === 0) suppresses growth animation and announces cap limit
 * - Dynamic element-anchored travel using measured bounding rects
 */
export const RewardSequence: React.FC<RewardSequenceProps> = ({
  activeEvent,
  questTitle = 'Quest',
  onSequenceComplete,
  onDismissPathNotice,
  showPathReadyNotice = false,
}) => {
  const [announcement, setAnnouncement] = useState<string>('');
  const [particleStyle, setParticleStyle] = useState<React.CSSProperties | null>(null);
  const [levelUpText, setLevelUpText] = useState<string | null>(null);

  useEffect(() => {
    if (!activeEvent) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const { xpAwarded = 20, sparksAwarded = 4, attribute = 'mind', previousLevel, newLevel } = activeEvent;

    // Check zero-XP daily cap scenario
    if (xpAwarded === 0) {
      setAnnouncement(`${questTitle} sealed. Today's XP limit has been reached.`);
      setParticleStyle(null);

      if (newLevel && previousLevel && newLevel > previousLevel) {
        setLevelUpText(`Level advanced to ${newLevel}! Your Root deepens.`);
      }

      if (onSequenceComplete) onSequenceComplete();
      return;
    }

    // 1. Prepare accessible announcement for non-zero XP completion
    const sparksText = sparksAwarded > 0 ? `, +${sparksAwarded} Sparks gathered` : '';
    const text = `${questTitle} sealed. +${xpAwarded} XP awarded${sparksText}. ${attribute} branch grows.`;
    setAnnouncement(text);

    // 2. Check for level advancement
    if (newLevel && previousLevel && newLevel > previousLevel) {
      setLevelUpText(`Level advanced to ${newLevel}! Your Root deepens.`);
    }

    // 3. XP Light Trace animation anchored to DOM elements (skips if reduced motion)
    if (!prefersReducedMotion && typeof window !== 'undefined') {
      // Find origin element
      const originEl =
        document.querySelector(`.quest-row[data-quest-id="${activeEvent.questId}"]`) ||
        document.querySelector('.quest-row.is-completed') ||
        document.querySelector('.quest-row');

      // Find Ember element (midpoint)
      const emberEl =
        document.querySelector('.ember-container') ||
        document.querySelector('.ember-brazier');

      // Find Root target element
      const rootEl =
        document.querySelector(`.root-branch-card.is-highlighted`) ||
        document.querySelector(`.branch-name-label.branch-${attribute}`) ||
        document.querySelector('.root-preview-container');

      if (originEl) {
        const originRect = originEl.getBoundingClientRect();
        const startX = originRect.left + originRect.width / 2;
        const startY = originRect.top + originRect.height / 2;

        let emberX = startX;
        let emberY = startY - 40;
        if (emberEl) {
          const emberRect = emberEl.getBoundingClientRect();
          if (emberRect.width > 0 && emberRect.height > 0) {
            emberX = emberRect.left + emberRect.width / 2;
            emberY = emberRect.top + emberRect.height / 2;
          }
        }

        let endX = emberX + 60;
        let endY = emberY - 30;
        let isTargetVisible = false;

        if (rootEl) {
          const rootRect = rootEl.getBoundingClientRect();
          // Verify target is actually rendered and visible in current viewport
          if (
            rootRect.width > 0 &&
            rootRect.height > 0 &&
            rootRect.top < window.innerHeight &&
            rootRect.bottom > 0
          ) {
            endX = rootRect.left + rootRect.width / 2;
            endY = rootRect.top + rootRect.height / 2;
            isTargetVisible = true;
          }
        }

        // If target is visible (or Ember is visible), run dynamic particle trace
        if (isTargetVisible || emberEl) {
          setParticleStyle({
            '--start-x': `${startX}px`,
            '--start-y': `${startY}px`,
            '--mid-x': `${emberX}px`,
            '--mid-y': `${emberY}px`,
            '--end-x': `${endX}px`,
            '--end-y': `${endY}px`,
          } as React.CSSProperties);

          const timer = setTimeout(() => {
            setParticleStyle(null);
            if (onSequenceComplete) onSequenceComplete();
          }, 700);

          return () => clearTimeout(timer);
        }
      }
    }

    if (onSequenceComplete) onSequenceComplete();
  }, [activeEvent, questTitle, onSequenceComplete]);

  return (
    <>
      {/* Accessible live region for screen-readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Transient XP Light Traveling toward Root */}
      {particleStyle && (
        <div
          className="xp-light-trace"
          style={particleStyle}
          aria-hidden="true"
        />
      )}

      {/* Level-up Notice Banner (Non-blocking, dismissible) */}
      {levelUpText && (
        <div className="hearth-notice-banner notice-level" role="status">
          <div className="hearth-notice-content">
            <span className="hearth-notice-icon" aria-hidden="true">✦</span>
            <div>
              <strong className="hearth-notice-title">Level Up! </strong>
              <span>{levelUpText}</span>
            </div>
          </div>
          <button
            type="button"
            className="hearth-notice-dismiss"
            onClick={() => setLevelUpText(null)}
            aria-label="Dismiss level announcement"
          >
            ✕
          </button>
        </div>
      )}

      {/* "A path is ready" banner (non-blocking, invites player to Root) */}
      {showPathReadyNotice && (
        <div className="hearth-notice-banner notice-path" role="status">
          <div className="hearth-notice-content">
            <span className="hearth-notice-icon" aria-hidden="true">✦</span>
            <div>
              <strong className="hearth-notice-title">A path is ready: </strong>
              <span>A branch has reached maturity. Choose your specialization on the Root.</span>
            </div>
          </div>
          {onDismissPathNotice && (
            <button
              type="button"
              className="hearth-notice-dismiss"
              onClick={onDismissPathNotice}
              aria-label="Dismiss specialization notice"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </>
  );
};

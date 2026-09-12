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
 */
export const RewardSequence: React.FC<RewardSequenceProps> = ({
  activeEvent,
  questTitle = 'Quest',
  onSequenceComplete,
  onDismissPathNotice,
  showPathReadyNotice = false,
}) => {
  const [announcement, setAnnouncement] = useState<string>('');
  const [isLightActive, setIsLightActive] = useState<boolean>(false);
  const [levelUpText, setLevelUpText] = useState<string | null>(null);

  useEffect(() => {
    if (!activeEvent) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const { xpAwarded = 20, sparksAwarded = 4, attribute = 'mind', previousLevel, newLevel } = activeEvent;

    // 1. Prepare accessible announcement
    const text = `${questTitle} sealed. +${xpAwarded} XP awarded, +${sparksAwarded} Sparks gathered. ${attribute} branch grows.`;
    setAnnouncement(text);

    // 2. Check for level advancement
    if (newLevel && previousLevel && newLevel > previousLevel) {
      setLevelUpText(`Level advanced to ${newLevel}! Your Root deepens.`);
    }

    // 3. XP Light Trace animation (skips if reduced motion)
    if (!prefersReducedMotion) {
      setIsLightActive(true);
      const timer = setTimeout(() => {
        setIsLightActive(false);
        if (onSequenceComplete) onSequenceComplete();
      }, 700);
      return () => clearTimeout(timer);
    } else {
      if (onSequenceComplete) onSequenceComplete();
    }
  }, [activeEvent, questTitle, onSequenceComplete]);

  return (
    <>
      {/* Accessible live region for screen-readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Transient XP Light Traveling toward Root */}
      {isLightActive && (
        <div
          className="xp-light-trace"
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

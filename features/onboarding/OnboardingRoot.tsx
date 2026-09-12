import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { GoalId, Intensity, AvailableMinutes, OnboardingStep } from './types';

export interface OnboardingRootProps {
  selectedGoals: GoalId[];
  intensity: Intensity | null;
  availableMinutes: AvailableMinutes | null;
  currentStep: OnboardingStep;
  isSealed?: boolean;
  className?: string;
}

/**
 * OnboardingRoot — Authored lightweight SVG representing the awakening root.
 *
 * Requirements:
 * - NOT real XP progression yet.
 * - Responds visually to onboarding decisions:
 *   - 1st goal -> 1st filament wakes
 *   - 2nd goal -> 2nd filament wakes
 *   - intensity/time -> subtle nodal illumination
 *   - starter quests confirmed -> visible sprout
 *   - first seal -> full awakening sequence
 * - Path length / dashoffset, opacity, transform only.
 * - Reduced motion fallback.
 */
export const OnboardingRoot: React.FC<OnboardingRootProps> = ({
  selectedGoals,
  intensity,
  availableMinutes,
  currentStep,
  isSealed = false,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  const filament1Active = selectedGoals.length >= 1 || isSealed;
  const filament2Active = selectedGoals.length >= 2 || isSealed;
  const filament3Active = selectedGoals.length >= 3 || isSealed;
  const nodesIlluminated = Boolean(intensity || availableMinutes || isSealed);
  const sproutVisible =
    ['quests', 'timezone', 'first_quest', 'sealed'].includes(currentStep) || isSealed;

  // Filament thickness scales with intensity choice (delicate light -> balanced -> dense push)
  const baseStrokeWidth = intensity === 'push' ? 3.6 : intensity === 'balanced' ? 2.8 : 2.2;

  const transitionConfig = shouldReduceMotion
    ? { duration: 0.1 }
    : { duration: 0.8, ease: 'easeOut' as const };

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-4 ${className}`}
      aria-label="Root awakening preview"
    >
      <svg
        viewBox="0 0 320 380"
        className="w-full max-w-[280px] sm:max-w-[320px] h-auto overflow-visible select-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rootGlowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#E98A4B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#9FBA87" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D9E3B2" stopOpacity="1" />
          </linearGradient>

          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="emberGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Dormant Trace (Faint Guide) */}
        <g stroke="#2D382D" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round">
          {/* Central Stem */}
          <path d="M 160 350 Q 160 270 160 220" />
          {/* Primary Left Branch */}
          <path d="M 160 270 Q 130 230 100 170 Q 80 130 65 90" />
          {/* Primary Right Branch */}
          <path d="M 160 250 Q 190 220 220 160 Q 240 120 255 80" />
          {/* Secondary Sub-Filaments */}
          <path d="M 160 230 Q 145 180 130 130 Q 120 90 115 60" />
          <path d="M 160 230 Q 175 180 190 130 Q 200 90 205 60" />
        </g>

        {/* Filament 1: Wakes with 1st Goal */}
        <motion.path
          d="M 160 350 Q 160 270 160 220 Q 130 230 100 170 Q 80 130 65 90"
          fill="none"
          stroke={isSealed ? 'url(#rootGlowGrad)' : '#9FBA87'}
          strokeWidth={filament1Active ? (isSealed ? baseStrokeWidth + 1 : baseStrokeWidth) : 0}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: filament1Active ? 1 : 0,
            opacity: filament1Active ? 1 : 0,
          }}
          transition={transitionConfig}
          filter={filament1Active ? (isSealed ? 'url(#emberGlow)' : 'url(#subtleGlow)') : undefined}
        />

        {/* Filament 2: Wakes with 2nd Goal */}
        <motion.path
          d="M 160 270 Q 190 220 220 160 Q 240 120 255 80"
          fill="none"
          stroke={isSealed ? 'url(#rootGlowGrad)' : '#9FBA87'}
          strokeWidth={filament2Active ? (isSealed ? baseStrokeWidth + 1 : baseStrokeWidth) : 0}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: filament2Active ? 1 : 0,
            opacity: filament2Active ? 1 : 0,
          }}
          transition={{ ...transitionConfig, delay: shouldReduceMotion ? 0 : 0.2 }}
          filter={filament2Active ? (isSealed ? 'url(#emberGlow)' : 'url(#subtleGlow)') : undefined}
        />

        {/* Filament 3: Wakes with 3rd Goal or Seals */}
        <motion.path
          d="M 160 240 Q 145 180 130 130 Q 120 90 115 60"
          fill="none"
          stroke={isSealed ? '#FFD38A' : '#9FBA87'}
          strokeWidth={filament3Active ? Math.max(baseStrokeWidth - 0.8, 1.8) : 0}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: filament3Active ? 1 : 0,
            opacity: filament3Active ? 0.9 : 0,
          }}
          transition={{ ...transitionConfig, delay: shouldReduceMotion ? 0 : 0.3 }}
        />

        {/* Auxiliary Right Filament */}
        <motion.path
          d="M 160 240 Q 175 180 190 130 Q 200 90 205 60"
          fill="none"
          stroke={isSealed ? '#FFD38A' : '#9FBA87'}
          strokeWidth={isSealed ? 2 : selectedGoals.length >= 4 ? 1.5 : 0}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: isSealed || selectedGoals.length >= 4 ? 1 : 0,
            opacity: isSealed || selectedGoals.length >= 4 ? 0.8 : 0,
          }}
          transition={{ ...transitionConfig, delay: shouldReduceMotion ? 0 : 0.35 }}
        />

        {/* Subtle Node Illumination Buds (Intensity / Time) */}
        {nodesIlluminated && (
          <g>
            <motion.circle
              cx="65"
              cy="90"
              r={isSealed ? 4.5 : 3.5}
              fill={isSealed ? '#FFD38A' : '#D9E3B2'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              filter="url(#subtleGlow)"
            />
            <motion.circle
              cx="255"
              cy="80"
              r={isSealed ? 4.5 : 3.5}
              fill={isSealed ? '#FFD38A' : '#D9E3B2'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              filter="url(#subtleGlow)"
            />
            <motion.circle
              cx="115"
              cy="60"
              r="3"
              fill="#C4A96A"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            />
            <motion.circle
              cx="205"
              cy="60"
              r="3"
              fill="#C4A96A"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            />
          </g>
        )}

        {/* Visible Emerging Sprout (Quests Confirmed / First Seal) */}
        {sproutVisible && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={transitionConfig}
          >
            {/* Left Tender Leaf */}
            <path
              d="M 160 220 C 145 200 135 190 142 178 C 150 178 156 195 160 215"
              fill={isSealed ? '#D9E3B2' : '#9FBA87'}
              opacity={isSealed ? 0.95 : 0.85}
            />
            {/* Right Tender Leaf */}
            <path
              d="M 160 220 C 175 200 185 190 178 178 C 170 178 164 195 160 215"
              fill={isSealed ? '#D9E3B2' : '#9FBA87'}
              opacity={isSealed ? 0.95 : 0.85}
            />
            {/* Center Bud */}
            <circle
              cx="160"
              cy="210"
              r={isSealed ? 3.5 : 2.5}
              fill={isSealed ? '#FFD38A' : '#D9E3B2'}
            />
          </motion.g>
        )}

        {/* Hearth Seed (Root Origin at Base) */}
        <g transform="translate(160, 350)">
          <circle
            r={isSealed ? 12 : 8}
            fill={isSealed ? '#E98A4B' : '#2D382D'}
            stroke={isSealed ? '#FFD38A' : '#374537'}
            strokeWidth="2"
            filter={isSealed ? 'url(#emberGlow)' : undefined}
          />
          <circle
            r={isSealed ? 6 : 3}
            fill={isSealed ? '#FFD38A' : '#9FBA87'}
            opacity={filament1Active ? 1 : 0.4}
          />
        </g>
      </svg>

      {/* Accessible & Editorial Status Line */}
      <div className="mt-2 text-center">
        <p className="text-xs uppercase tracking-widest text-[#B9BEAC] font-medium">
          {isSealed
            ? 'Sprout Awakened'
            : selectedGoals.length === 0
            ? 'The Root Lies Dormant'
            : selectedGoals.length === 1
            ? 'First Filament Kindles'
            : sproutVisible
            ? 'Sprout Gathering Light'
            : 'Filaments Intertwining'}
        </p>
        <p className="text-[11px] text-[#8E9782] mt-0.5 max-w-[200px] leading-snug">
          {isSealed
            ? 'Your first real seal has awakened the life within.'
            : selectedGoals.length >= 2
            ? 'Real actions will shape these branches permanently.'
            : 'Select the intentions that call to you.'}
        </p>
      </div>
    </div>
  );
};

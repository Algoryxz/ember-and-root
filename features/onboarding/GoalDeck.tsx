import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { ONBOARDING_GOALS } from './goals';
import type { Goal, GoalId } from './types';
import { PathButton } from '@/components/ui/PathButton';

export interface GoalDeckProps {
  selectedGoals: GoalId[];
  onToggleGoal: (goalId: GoalId) => void;
  onProceed: () => void;
  minSelections?: number;
  maxSelections?: number;
}

const ATTRIBUTE_LABELS: Record<string, { name: string; color: string; border: string; bg: string }> = {
  mind: { name: 'Mind', color: '#8FA37E', border: 'rgba(143, 163, 126, 0.3)', bg: 'rgba(143, 163, 126, 0.1)' },
  body: { name: 'Body', color: '#D9986A', border: 'rgba(217, 152, 106, 0.3)', bg: 'rgba(217, 152, 106, 0.1)' },
  will: { name: 'Will', color: '#C4A96A', border: 'rgba(196, 169, 106, 0.3)', bg: 'rgba(196, 169, 106, 0.1)' },
  craft: { name: 'Craft', color: '#9FBA87', border: 'rgba(159, 186, 135, 0.3)', bg: 'rgba(159, 186, 135, 0.1)' },
};

/**
 * GoalDeck — Animated Cards Stack for Onboarding Goals
 *
 * Adapted from Animated Cards Stack (YoucefBnm Bnm on 21st.dev)
 * Rebuilt strictly in Ember & Root's field journal visual language:
 * - Cards are tactile journal leaves with natural rotational decay (-2° to +2°)
 * - Stacked depth with physical translation and scale decay
 * - Top card supports drag displacement or accessible action buttons
 * - Next-card anticipation: underneath leaves subtly expand as top leaf displaces
 * - Directional transition: right for Choose, left for Not for me
 * - Full keyboard navigation and reduced-motion fallback
 */
export const GoalDeck: React.FC<GoalDeckProps> = ({
  selectedGoals,
  onToggleGoal,
  onProceed,
  minSelections = 2,
  maxSelections = 4,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const deck = ONBOARDING_GOALS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  // Motion values for interactive drag and anticipation
  const dragX = useMotionValue(0);
  // Anticipation: underneath card scales up slightly as top card is pulled away
  const nextCardScale = useTransform(dragX, [-150, 0, 150], [0.98, 0.94, 0.98]);
  const nextCardY = useTransform(dragX, [-150, 0, 150], [6, 14, 6]);

  const currentGoal = deck[currentIndex] || null;
  const nextGoal = deck[currentIndex + 1] || null;
  const secondNextGoal = deck[currentIndex + 2] || null;

  const isSelected = currentGoal ? selectedGoals.includes(currentGoal.id) : false;
  const canProceed = selectedGoals.length >= minSelections;
  const reachedMax = selectedGoals.length >= maxSelections;

  const handleChoose = useCallback(() => {
    if (!currentGoal) return;
    setExitDirection('right');
    if (!selectedGoals.includes(currentGoal.id)) {
      onToggleGoal(currentGoal.id);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, deck.length));
      setExitDirection(null);
      dragX.set(0);
    }, shouldReduceMotion ? 20 : 200);
  }, [currentGoal, selectedGoals, onToggleGoal, deck.length, shouldReduceMotion, dragX]);

  const handlePass = useCallback(() => {
    if (!currentGoal) return;
    setExitDirection('left');
    if (selectedGoals.includes(currentGoal.id)) {
      onToggleGoal(currentGoal.id);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, deck.length));
      setExitDirection(null);
      dragX.set(0);
    }, shouldReduceMotion ? 20 : 200);
  }, [currentGoal, selectedGoals, onToggleGoal, deck.length, shouldReduceMotion, dragX]);

  const handleResetDeck = () => {
    setCurrentIndex(0);
    setExitDirection(null);
    dragX.set(0);
  };

  // Keyboard navigation: ArrowRight to Choose, ArrowLeft to Pass
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' && !reachedMax && currentGoal) {
        e.preventDefault();
        handleChoose();
      } else if (e.key === 'ArrowLeft' && currentGoal) {
        e.preventDefault();
        handlePass();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleChoose, handlePass, currentGoal, reachedMax]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Editorial Chapter Heading */}
      <div className="text-center mb-6 max-w-md">
        <span className="inline-block text-xs uppercase tracking-widest text-[#E98A4B] font-semibold mb-1">
          Chapter I · Your Intentions
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif text-[#F0E7D3] tracking-tight">
          Choose What Matters
        </h2>
        <p className="text-sm text-[#B9BEAC] mt-1.5 leading-relaxed">
          Select <span className="text-[#FFD38A] font-medium">{minSelections} to {maxSelections}</span> intentions.
          These kindle your initial starter quests and wake your Root filaments.
        </p>

        {/* Ledger Status: "X of Y goals reviewed · Z chosen" */}
        <div className="mt-3 flex items-center justify-center gap-2" aria-live="polite">
          <div className="flex gap-1.5">
            {Array.from({ length: maxSelections }).map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                  i < selectedGoals.length ? 'bg-[#E98A4B]' : 'bg-[#2D382D]'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-xs text-[#B9BEAC] font-mono">
            {Math.min(currentIndex, deck.length)} of {deck.length} reviewed · {selectedGoals.length} of {maxSelections} chosen
            {selectedGoals.length < minSelections && ` (target: ${minSelections}–${maxSelections})`}
          </span>
        </div>
      </div>

      {/* Field Journal Leaf Stack Container */}
      <div className="relative w-full max-w-sm h-[300px] sm:h-[320px] flex items-center justify-center mb-6">
        {/* Underneath Layer 2: Third Leaf in Stack (Deepest Decay) */}
        {secondNextGoal && !shouldReduceMotion && (
          <div
            className="absolute inset-0 p-6 sm:p-7 rounded-xl bg-[#181D18] border border-[#263026] flex flex-col justify-between select-none pointer-events-none"
            style={{
              transform: 'scale(0.88) translateY(26px) rotate(-2deg)',
              opacity: 0.35,
              zIndex: 1,
              boxShadow: '0 8px 24px -6px rgba(0,0,0,0.7)',
            }}
            aria-hidden="true"
          >
            <div className="flex items-center justify-between opacity-50">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6E7B6E]">
                {ATTRIBUTE_LABELS[secondNextGoal.attribute]?.name} Domain
              </span>
              <span className="text-[11px] text-[#556355] font-mono">
                Leaf {currentIndex + 3}
              </span>
            </div>
            <div className="my-auto py-2 opacity-40">
              <h3 className="text-xl font-serif text-[#9A9F92]">
                {secondNextGoal.title}
              </h3>
            </div>
            <div className="pt-2 border-t border-[#263026] text-xs text-[#556355]">
              <span>Field Leaf</span>
            </div>
          </div>
        )}

        {/* Underneath Layer 1: Next Leaf in Stack (Anticipating Displacement) */}
        {nextGoal && !shouldReduceMotion && (
          <motion.div
            className="absolute inset-0 p-6 sm:p-7 rounded-xl bg-[#1B211B] border border-[#2D382D] flex flex-col justify-between select-none pointer-events-none"
            style={{
              scale: nextCardScale,
              y: nextCardY,
              rotate: (currentIndex % 2 === 0 ? 1.5 : -1.5),
              opacity: 0.72,
              zIndex: 2,
              boxShadow: '0 12px 28px -8px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
            aria-hidden="true"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded border"
                style={{
                  color: ATTRIBUTE_LABELS[nextGoal.attribute]?.color || '#8FA37E',
                  borderColor: ATTRIBUTE_LABELS[nextGoal.attribute]?.border || 'rgba(143,163,126,0.3)',
                  backgroundColor: ATTRIBUTE_LABELS[nextGoal.attribute]?.bg || 'rgba(143,163,126,0.1)',
                }}
              >
                {ATTRIBUTE_LABELS[nextGoal.attribute]?.name} Domain
              </span>
              <span className="text-[11px] text-[#6E7B6E] font-mono">
                Leaf {currentIndex + 2} / {deck.length}
              </span>
            </div>
            <div className="my-auto py-2">
              <h3 className="text-xl font-serif text-[#C9D0BF]">
                {nextGoal.title}
              </h3>
              <p className="text-xs text-[#8E9782] mt-1 line-clamp-2">
                {nextGoal.description}
              </p>
            </div>
            <div className="pt-2 border-t border-[#2D382D]/60 flex items-center justify-between text-xs text-[#6E7B6E]">
              <span>Next Leaf</span>
              <span>✦</span>
            </div>
          </motion.div>
        )}

        {/* Active Top Leaf */}
        <AnimatePresence mode="popLayout">
          {currentGoal ? (
            <motion.div
              key={currentGoal.id}
              drag={shouldReduceMotion ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.65}
              onDragEnd={(_, info) => {
                if (info.offset.x > 80 && !reachedMax) {
                  handleChoose();
                } else if (info.offset.x < -80) {
                  handlePass();
                }
              }}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : {
                      scale: 0.94,
                      y: 16,
                      opacity: 0,
                    }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      scale: 1,
                      y: 0,
                      x: exitDirection === 'right' ? 220 : exitDirection === 'left' ? -220 : 0,
                      rotate: exitDirection === 'right' ? 8 : exitDirection === 'left' ? -8 : 0,
                      opacity: exitDirection ? 0 : 1,
                    }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      scale: 0.9,
                      x: exitDirection === 'right' ? 220 : -220,
                      rotate: exitDirection === 'right' ? 10 : -10,
                      transition: { duration: 0.2 },
                    }
              }
              transition={{
                duration: 0.24,
                ease: [0.25, 1, 0.5, 1],
              }}
              style={{
                x: dragX,
                zIndex: 3,
                boxShadow: '0 16px 36px -8px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              className="absolute inset-0 p-6 sm:p-7 rounded-xl bg-[#1D231D] border border-[#344034] shadow-2xl flex flex-col justify-between select-none cursor-grab active:cursor-grabbing"
            >
              {/* Leaf Ribbon / Domain Tag */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded border"
                  style={{
                    color: ATTRIBUTE_LABELS[currentGoal.attribute]?.color || '#8FA37E',
                    borderColor: ATTRIBUTE_LABELS[currentGoal.attribute]?.border || 'rgba(143,163,126,0.3)',
                    backgroundColor: ATTRIBUTE_LABELS[currentGoal.attribute]?.bg || 'rgba(143,163,126,0.1)',
                  }}
                >
                  {ATTRIBUTE_LABELS[currentGoal.attribute]?.name} Domain
                </span>
                <span className="text-[11px] text-[#8E9782] font-mono">
                  Leaf {currentIndex + 1} of {deck.length}
                </span>
              </div>

              {/* Goal Title, Description, and Reflection */}
              <div className="my-auto py-2">
                <h3 className="text-xl sm:text-2xl font-serif text-[#F0E7D3] tracking-tight">
                  {currentGoal.title}
                </h3>
                <p className="text-sm text-[#B9BEAC] mt-2 leading-relaxed">
                  {currentGoal.description}
                </p>
                <p className="text-xs italic text-[#8E9782] mt-3 font-serif">
                  &ldquo;{currentGoal.reflectionPrompt}&rdquo;
                </p>
              </div>

              {/* Card Footer State */}
              <div className="pt-2 border-t border-[#2D382D]/80 flex items-center justify-between text-xs text-[#8E9782]">
                <span className="font-mono text-[11px]">Swipe or use keys</span>
                {isSelected ? (
                  <span className="text-[#FFD38A] font-medium flex items-center gap-1">
                    ✓ Currently chosen
                  </span>
                ) : (
                  <span className="text-[#6E7B6E]">Not yet chosen</span>
                )}
              </div>
            </motion.div>
          ) : (
            /* End of Deck State */
            <div className="w-full h-full p-6 rounded-xl bg-[#1D231D] border border-[#2D382D] flex flex-col items-center justify-center text-center shadow-xl">
              <span className="text-3xl mb-2" aria-hidden="true">🌿</span>
              <h3 className="text-xl font-serif text-[#F0E7D3]">All leaves reviewed</h3>
              <p className="text-xs text-[#B9BEAC] mt-1.5 mb-4 max-w-xs leading-relaxed">
                You have selected {selectedGoals.length} intentions. You may review again or proceed into intensity.
              </p>
              <PathButton
                variant="parchment"
                size="sm"
                onClick={handleResetDeck}
              >
                Review from Beginning
              </PathButton>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Accessible Tactical Actions: Choose vs Not For Me */}
      {currentGoal && (
        <div className="flex items-center gap-3.5 w-full max-w-sm">
          <PathButton
            variant="parchment"
            size="md"
            className="flex-1"
            onClick={handlePass}
            aria-label={`Not for me: ${currentGoal.title}`}
          >
            Not for me
          </PathButton>

          <PathButton
            variant="ember"
            size="md"
            className="flex-1"
            onClick={handleChoose}
            disabled={reachedMax && !isSelected}
            aria-label={`Choose: ${currentGoal.title}`}
          >
            {isSelected ? 'Keep Chosen' : reachedMax ? 'Max Chosen' : 'Choose'}
          </PathButton>
        </div>
      )}

      {/* Selected Goals Drawer / Chips */}
      {selectedGoals.length > 0 && (
        <div className="w-full max-w-md mt-6 pt-4 border-t border-[#2D382D]/80">
          <p className="text-xs uppercase tracking-widest text-[#8E9782] mb-2 font-medium">
            Selected Intentions ({selectedGoals.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedGoals.map((id) => {
              const g = ONBOARDING_GOALS.find((goal) => goal.id === id);
              if (!g) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onToggleGoal(id)}
                  title="Click to remove"
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1D231D] border border-[#374537] text-[#F0E7D3] hover:border-[#E98A4B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                >
                  <span>{g.title}</span>
                  <span className="text-[#8E9782] group-hover:text-[#E98A4B]">×</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Proceed CTA */}
      <div className="w-full max-w-sm mt-6">
        <PathButton
          variant="ember"
          size="lg"
          className="w-full"
          onClick={onProceed}
          disabled={!canProceed}
        >
          {canProceed
            ? `Continue with ${selectedGoals.length} Intentions →`
            : `Choose at least ${minSelections} intentions to continue`}
        </PathButton>
      </div>
    </div>
  );
};

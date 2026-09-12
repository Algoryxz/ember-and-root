import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ONBOARDING_GOALS } from './goals';
import type { Goal, GoalId } from './types';

export interface GoalDeckProps {
  selectedGoals: GoalId[];
  onToggleGoal: (goalId: GoalId) => void;
  onProceed: () => void;
  minSelections?: number;
  maxSelections?: number;
}

const ATTRIBUTE_LABELS: Record<string, { name: string; color: string }> = {
  mind: { name: 'Mind', color: '#8FA37E' },
  body: { name: 'Body', color: '#D9986A' },
  will: { name: 'Will', color: '#C4A96A' },
  craft: { name: 'Craft', color: '#9FBA87' },
};

export const GoalDeck: React.FC<GoalDeckProps> = ({
  selectedGoals,
  onToggleGoal,
  onProceed,
  minSelections = 2,
  maxSelections = 4,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [deck, setDeck] = useState<Goal[]>(ONBOARDING_GOALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const currentGoal = deck[currentIndex] || null;
  const isSelected = currentGoal ? selectedGoals.includes(currentGoal.id) : false;
  const canProceed = selectedGoals.length >= minSelections;
  const reachedMax = selectedGoals.length >= maxSelections;

  const handleChoose = useCallback(() => {
    if (!currentGoal) return;
    setDirection('right');
    if (!selectedGoals.includes(currentGoal.id)) {
      onToggleGoal(currentGoal.id);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, deck.length));
      setDirection(null);
    }, shouldReduceMotion ? 20 : 180);
  }, [currentGoal, selectedGoals, onToggleGoal, deck.length, shouldReduceMotion]);

  const handlePass = useCallback(() => {
    if (!currentGoal) return;
    setDirection('left');
    // If it was previously selected, remove it
    if (selectedGoals.includes(currentGoal.id)) {
      onToggleGoal(currentGoal.id);
    }
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, deck.length));
      setDirection(null);
    }, shouldReduceMotion ? 20 : 180);
  }, [currentGoal, selectedGoals, onToggleGoal, deck.length, shouldReduceMotion]);

  const handleResetDeck = () => {
    setCurrentIndex(0);
  };

  // Keyboard navigation
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
      {/* Editorial Header */}
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

        {/* Counter & Progress */}
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
          <span className="text-xs text-[#B9BEAC]">
            {selectedGoals.length} of {maxSelections} chosen
            {selectedGoals.length < minSelections && ` (need at least ${minSelections})`}
          </span>
        </div>
      </div>

      {/* Field Journal Card Stack Container */}
      <div className="relative w-full max-w-sm h-[280px] sm:h-[300px] flex items-center justify-center mb-6">
        <AnimatePresence mode="popLayout">
          {currentGoal ? (
            <motion.div
              key={currentGoal.id}
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
                      x: direction === 'right' ? 80 : direction === 'left' ? -80 : 0,
                      opacity: direction ? 0 : 1,
                      rotateZ: direction === 'right' ? 4 : direction === 'left' ? -4 : 0,
                    }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      scale: 0.9,
                      x: direction === 'right' ? 120 : -120,
                      transition: { duration: 0.2 },
                    }
              }
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-0 p-6 sm:p-7 rounded-xl bg-[#1D231D] border border-[#2D382D] shadow-2xl flex flex-col justify-between select-none"
              style={{
                boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* Journal Leaf Ribbon / Attribute Badge */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded border"
                  style={{
                    color: ATTRIBUTE_LABELS[currentGoal.attribute]?.color || '#8FA37E',
                    borderColor: `${ATTRIBUTE_LABELS[currentGoal.attribute]?.color || '#8FA37E'}33`,
                    backgroundColor: `${ATTRIBUTE_LABELS[currentGoal.attribute]?.color || '#8FA37E'}11`,
                  }}
                >
                  {ATTRIBUTE_LABELS[currentGoal.attribute]?.name} Domain
                </span>
                <span className="text-[11px] text-[#6E7B6E] font-mono">
                  {currentIndex + 1} / {deck.length}
                </span>
              </div>

              {/* Goal Title and Description */}
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
              <div className="pt-2 border-t border-[#2D382D]/60 flex items-center justify-between text-xs text-[#8E9782]">
                <span>Leaf {currentIndex + 1}</span>
                {isSelected && (
                  <span className="text-[#FFD38A] font-medium flex items-center gap-1">
                    ✓ Currently chosen
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            /* End of Deck State */
            <div className="w-full h-full p-6 rounded-xl bg-[#1D231D] border border-[#2D382D] flex flex-col items-center justify-center text-center">
              <span className="text-2xl mb-2">🌿</span>
              <h3 className="text-lg font-serif text-[#F0E7D3]">All leaves reviewed</h3>
              <p className="text-xs text-[#B9BEAC] mt-1 mb-4">
                You have selected {selectedGoals.length} intentions.
              </p>
              <button
                type="button"
                onClick={handleResetDeck}
                className="px-4 py-2 text-xs font-medium text-[#C4A96A] hover:text-[#FFD38A] border border-[#374537] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
              >
                Review from Beginning
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Tactical Card Actions: Choose vs Not For Me */}
      {currentGoal && (
        <div className="flex items-center gap-4 w-full max-w-sm">
          <button
            type="button"
            onClick={handlePass}
            aria-label={`Not for me: ${currentGoal.title}`}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg border border-[#374537] bg-[#141713] hover:bg-[#1D231D] text-[#B9BEAC] hover:text-[#F0E7D3] text-sm font-medium transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
          >
            Not for me
          </button>

          <button
            type="button"
            onClick={handleChoose}
            disabled={reachedMax && !isSelected}
            aria-label={`Choose: ${currentGoal.title}`}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] disabled:opacity-50 text-[#141713] font-semibold text-sm transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
          >
            {isSelected ? 'Keep Chosen' : reachedMax ? 'Max Chosen' : 'Choose'}
          </button>
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

      {/* Primary Proceed CTA when minimum met */}
      <div className="w-full max-w-sm mt-6">
        <button
          type="button"
          onClick={onProceed}
          disabled={!canProceed}
          className="w-full min-h-[48px] px-4 py-3 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {canProceed
            ? `Continue with ${selectedGoals.length} Intentions →`
            : `Choose at least ${minSelections} intentions to continue`}
        </button>
      </div>
    </div>
  );
};

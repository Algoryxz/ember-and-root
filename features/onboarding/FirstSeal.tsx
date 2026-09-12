import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import type { MutationResult, AttributeId, Effort } from '@/game/contracts';
import type { OnboardingPreferences, StarterQuestTemplate } from './types';

export interface FirstSealProps {
  keptQuests: StarterQuestTemplate[];
  selectedTimezone: string;
  onboardingPreferences: OnboardingPreferences;
  requestIds: {
    onboardingRequestId: string;
    questRequestIds: Record<string, string>;
    firstSealRequestId: string;
  };
  onSealed?: () => void;
}

const ATTRIBUTE_LABELS: Record<AttributeId, { name: string; color: string }> = {
  mind: { name: 'Mind', color: '#8FA37E' },
  body: { name: 'Body', color: '#D9986A' },
  will: { name: 'Will', color: '#C4A96A' },
  craft: { name: 'Craft', color: '#9FBA87' },
};

const EFFORT_LABELS: Record<Effort, { name: string; xp: number }> = {
  quick: { name: 'Quick', xp: 10 },
  standard: { name: 'Standard', xp: 20 },
  deep: { name: 'Deep', xp: 35 },
};

type MotionStage =
  | 'idle'
  | 'in_flight'
  | 'seal_land'
  | 'ember_warm'
  | 'light_travel'
  | 'root_wake'
  | 'climax';

export const FirstSeal: React.FC<FirstSealProps> = ({
  keptQuests,
  selectedTimezone,
  onboardingPreferences,
  requestIds,
  onSealed,
}) => {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [selectedQuestId, setSelectedQuestId] = useState<string>(
    keptQuests[0]?.id || ''
  );
  const [motionStage, setMotionStage] = useState<MotionStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mutationResult, setMutationResult] = useState<MutationResult | null>(null);

  const selectedQuest = keptQuests.find((q) => q.id === selectedQuestId) || keptQuests[0];

  const handlePerformFirstSeal = async () => {
    if (!selectedQuest) return;

    setError(null);
    setMotionStage('in_flight');

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Authoritatively create all kept quests sequentially using persistent UUIDs
      let firstCreatedQuestId = '';
      let firstOccurrenceKey: string | null = null;

      for (const q of keptQuests) {
        const reqId = requestIds.questRequestIds[q.id];
        const { data: createResult, error: createError } = await supabase.rpc('create_quest', {
          p_request_id: reqId,
          p_title: q.title,
          p_attribute: q.attribute,
          p_effort: q.effort,
          p_cadence: q.cadence,
          p_trial_id: null,
        });

        if (createError) {
          throw new Error(`Failed to inscribe starter quest "${q.title}": ${createError.message}`);
        }

        if (q.id === selectedQuest.id && createResult) {
          const res = createResult as MutationResult;
          firstCreatedQuestId = res.event.questId || '';

          // Find occurrence key from returned authoritative snapshot
          const foundQuest = res.snapshot.quests?.find((sq) => sq.id === firstCreatedQuestId);
          if (foundQuest && 'currentOccurrenceKey' in foundQuest) {
            firstOccurrenceKey = foundQuest.currentOccurrenceKey;
          }
        }
      }

      if (!firstCreatedQuestId) {
        throw new Error('Authoritative quest inscription failed to return a quest ID.');
      }

      // 2. Perform first authoritative complete_quest
      const { data: sealData, error: sealError } = await supabase.rpc('complete_quest', {
        p_request_id: requestIds.firstSealRequestId,
        p_quest_id: firstCreatedQuestId,
        p_expected_occurrence: firstOccurrenceKey ?? null,
      });

      if (sealError) {
        throw new Error(`Failed to seal first quest: ${sealError.message}`);
      }

      if (!sealData) {
        throw new Error('Authoritative complete_quest returned no data.');
      }

      const confirmedResult = sealData as MutationResult;
      setMutationResult(confirmedResult);

      // 3. ONLY after successful seal, mark preferences.onboarded = true
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .single();

      const currentPrefs = (profile?.preferences as Record<string, unknown> | null) || {};
      const updatedPrefs = {
        ...currentPrefs,
        onboarding: onboardingPreferences,
        onboarded: true,
      };

      const { error: prefError } = await supabase.rpc('update_profile_preferences', {
        p_timezone: selectedTimezone,
        p_preferences: updatedPrefs,
      });

      if (prefError) {
        console.warn('Profile preference update warning:', prefError.message);
      }

      // Notify parent to awaken OnboardingRoot
      if (onSealed) {
        onSealed();
      }

      // 4. Run First-Seal Motion Choreography
      if (shouldReduceMotion) {
        setMotionStage('climax');
      } else {
        setMotionStage('seal_land');
        setTimeout(() => {
          setMotionStage('ember_warm');
          setTimeout(() => {
            setMotionStage('light_travel');
            setTimeout(() => {
              setMotionStage('root_wake');
              setTimeout(() => {
                setMotionStage('climax');
              }, 400);
            }, 500);
          }, 250);
        }, 120);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected network error occurred.');
      setMotionStage('idle');
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* CLIMAX STATE: "THAT'S THE LOOP" */}
      {motionStage === 'climax' && mutationResult ? (
        <div className="p-6 sm:p-8 rounded-xl bg-[#1D231D] border border-[#E98A4B]/40 shadow-2xl text-center space-y-6">
          <div className="space-y-2">
            <span className="inline-block text-xs uppercase tracking-widest text-[#E98A4B] font-semibold">
              The First Bond is Formed
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#F0E7D3] tracking-tight">
              THAT&rsquo;S THE LOOP.
            </h2>
            <p className="text-base text-[#FFD38A] font-serif italic">
              What you do becomes what grows.
            </p>
            <p className="text-xs sm:text-sm text-[#B9BEAC] max-w-md mx-auto leading-relaxed pt-1">
              You performed a real act. The server confirmed it. The Ember kindled, and your Root awoke.
            </p>
          </div>

          {/* Authoritative Server-Returned Rewards */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#141713] border border-[#2D382D]">
            <div className="text-center p-2">
              <span className="block text-[11px] uppercase tracking-wider text-[#8E9782]">XP Gained</span>
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#E98A4B]">
                +{mutationResult.event.xpAwarded ?? 0}
              </span>
            </div>
            <div className="text-center p-2 border-x border-[#2D382D]">
              <span className="block text-[11px] uppercase tracking-wider text-[#8E9782]">Sparks</span>
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#FFD38A]">
                +{mutationResult.event.sparksAwarded ?? 0}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="block text-[11px] uppercase tracking-wider text-[#8E9782]">Ember State</span>
              <span className="text-sm sm:text-base font-serif font-medium text-[#D9E3B2] capitalize">
                {mutationResult.event.emberState || mutationResult.snapshot.emberState}
              </span>
            </div>
          </div>

          {/* Enter the Hearth CTA */}
          <button
            type="button"
            onClick={() => router.push('/hearth')}
            className="w-full min-h-[50px] px-6 py-3.5 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] shadow-xl"
          >
            Enter the Hearth →
          </button>
        </div>
      ) : (
        /* CHOOSE FIRST QUEST & REAL SEAL */
        <div className="space-y-6">
          <div className="text-center">
            <span className="inline-block text-xs uppercase tracking-widest text-[#E98A4B] font-semibold mb-1">
              Chapter V · The First Spark
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif text-[#F0E7D3] tracking-tight">
              BEGIN WITH ONE SMALL ACT
            </h2>
            <p className="text-sm text-[#B9BEAC] mt-1.5 leading-relaxed">
              Choose one of your kept starting quests. Complete this when you have actually done it. Then seal it.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 rounded-lg bg-[#2B1B19] border border-[#F0A79D]/40 text-[#F0A79D] text-xs leading-relaxed"
            >
              {error}
              <button
                type="button"
                onClick={handlePerformFirstSeal}
                className="block mt-2 underline text-[#FFD38A] hover:text-[#F0E7D3]"
              >
                Retry First Seal
              </button>
            </div>
          )}

          {/* Radio list of kept starter quests */}
          <div className="space-y-3" role="radiogroup" aria-label="Select first quest to complete">
            {keptQuests.map((q) => {
              const isSelected = selectedQuest?.id === q.id;
              const attr = ATTRIBUTE_LABELS[q.attribute];
              const effort = EFFORT_LABELS[q.effort];

              return (
                <button
                  key={q.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={motionStage !== 'idle'}
                  onClick={() => setSelectedQuestId(q.id)}
                  className={`w-full p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                    isSelected
                      ? 'bg-[#1D231D] border-[#E98A4B] shadow-lg shadow-[#E98A4B]/10'
                      : 'bg-[#141713] border-[#2D382D] hover:border-[#374537]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border"
                          style={{
                            color: attr?.color || '#8FA37E',
                            borderColor: `${attr?.color || '#8FA37E'}33`,
                            backgroundColor: `${attr?.color || '#8FA37E'}11`,
                          }}
                        >
                          {attr?.name}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141713] border border-[#2D382D] text-[#B9BEAC]">
                          +{effort?.xp} XP
                        </span>
                        <span className="text-[11px] text-[#6E7B6E]">~{q.estimatedMinutes}m</span>
                      </div>
                      <h3 className="text-base font-serif text-[#F0E7D3] leading-snug">
                        {q.title}
                      </h3>
                      <p className="text-xs text-[#8E9782] mt-0.5">
                        {q.description}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 transition-colors ${
                        isSelected
                          ? 'border-[#E98A4B] bg-[#E98A4B]'
                          : 'border-[#374537] bg-[#141713]'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#141713]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Choreography in Flight Banner */}
          {motionStage !== 'idle' && (
            <div
              className="p-4 rounded-xl bg-[#141713] border border-[#E98A4B]/40 text-center space-y-2 animate-pulse"
              aria-live="polite"
            >
              <div className="inline-block text-xl">🔥</div>
              <p className="text-sm font-serif text-[#FFD38A]">
                {motionStage === 'in_flight' && 'Inscribing Quests & Performing Real Server Seal…'}
                {motionStage === 'seal_land' && 'Wax Seal Lands on the Ledger…'}
                {motionStage === 'ember_warm' && 'The Hearth Ember Awakens…'}
                {motionStage === 'light_travel' && 'Light Traces Along the Living Filament…'}
                {motionStage === 'root_wake' && 'First Root Filament Comes Alive…'}
              </p>
            </div>
          )}

          {/* Primary Action: Complete & Seal */}
          {motionStage === 'idle' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePerformFirstSeal}
                disabled={!selectedQuest}
                className="w-full min-h-[50px] px-6 py-3.5 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] disabled:opacity-50 shadow-xl flex items-center justify-center gap-2"
              >
                <span>Seal First Quest</span>
                <span className="text-sm">✦</span>
              </button>
              <p className="text-[11px] text-[#8E9782] text-center mt-2">
                This triggers a real, authoritative transaction. No mock XP.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

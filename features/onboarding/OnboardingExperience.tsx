'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ONBOARDING_GOALS } from './goals';
import { STARTER_QUEST_CATALOG } from './starterQuestCatalog';
import { recommendStarterQuests } from './recommendStarterQuests';
import { GoalDeck } from './GoalDeck';
import { ChoiceCard } from './ChoiceCard';
import { StarterQuestDeck } from './StarterQuestDeck';
import { OnboardingRoot } from './OnboardingRoot';
import { FirstSeal } from './FirstSeal';
import type {
  GoalId,
  Intensity,
  AvailableMinutes,
  PreferredRhythm,
  StarterQuestTemplate,
  OnboardingStep,
} from './types';
import type { Effort } from '@/game/contracts';
import './OnboardingExperience.css';

const COMMON_TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
];

export const OnboardingExperience: React.FC = () => {
  const router = useRouter();

  // ── Step State ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<OnboardingStep>('goals');
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>([]);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [availableMinutes, setAvailableMinutes] = useState<AvailableMinutes | null>(null);
  const [preferredRhythm, setPreferredRhythm] = useState<PreferredRhythm | null>(null);

  // ── Quests State ──────────────────────────────────────────────────────────
  const [suggestedQuests, setSuggestedQuests] = useState<StarterQuestTemplate[]>([]);
  const [keptQuestIds, setKeptQuestIds] = useState<string[]>([]);

  // ── Timezone State ────────────────────────────────────────────────────────
  const [detectedTimezone, setDetectedTimezone] = useState<string>('UTC');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [isEditingTimezone, setIsEditingTimezone] = useState<boolean>(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState<boolean>(false);

  // ── Stable Request IDs for Idempotency ────────────────────────────────────
  const onboardingRequestIdRef = useRef<string>('');
  const questRequestIdsRef = useRef<Record<string, string>>({});
  const firstSealRequestIdRef = useRef<string>('');

  useEffect(() => {
    // Generate UUIDs once on mount; reuse across any network retries
    const uuid = () =>
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'a0000000-0000-0000-0000-' + Math.random().toString(16).substring(2, 14);

    if (!onboardingRequestIdRef.current) {
      onboardingRequestIdRef.current = uuid();
    }
    if (!firstSealRequestIdRef.current) {
      firstSealRequestIdRef.current = uuid();
    }
  }, []);

  // Detect silent timezone on client mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setDetectedTimezone(tz);
        setSelectedTimezone(tz);
      }
    } catch {
      // fallback to UTC
    }
  }, []);

  // Toggle goal selection
  const handleToggleGoal = (id: GoalId) => {
    setSelectedGoals((prev) => {
      if (prev.includes(id)) {
        return prev.filter((g) => g !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  // When progressing from Time/Rhythm to Quests, generate recommendations
  const generateRecommendations = (
    currentGoals: GoalId[],
    currentIntensity: Intensity,
    currentMinutes: AvailableMinutes
  ) => {
    const recommended = recommendStarterQuests({
      selectedGoals: currentGoals,
      intensity: currentIntensity,
      availableMinutes: currentMinutes,
    });
    setSuggestedQuests(recommended);
    // By default, keep all recommended (typically 3-4)
    setKeptQuestIds(recommended.slice(0, 3).map((q) => q.id));
  };

  // Swap a quest for another template matching the selected goals
  const handleSwapQuest = (templateId: string) => {
    const current = suggestedQuests.find((q) => q.id === templateId);
    if (!current) return;

    // Find templates in catalog for the same goal or other selected goals that aren't already in suggestedQuests
    const existingIds = new Set(suggestedQuests.map((q) => q.id));
    const pool = STARTER_QUEST_CATALOG.filter(
      (t) => selectedGoals.includes(t.goalId) && !existingIds.has(t.id)
    );

    // Prefer same goal first, then other selected goals
    const sameGoalAlt = pool.find((t) => t.goalId === current.goalId);
    const replacement = sameGoalAlt || pool[0];

    if (replacement) {
      setSuggestedQuests((prev) =>
        prev.map((q) => (q.id === templateId ? replacement : q))
      );
      if (keptQuestIds.includes(templateId)) {
        setKeptQuestIds((prev) => [...prev.filter((id) => id !== templateId), replacement.id]);
      }
    }
  };

  // Edit a quest template inline
  const handleEditQuest = (templateId: string, updatedTitle: string, updatedEffort: Effort) => {
    setSuggestedQuests((prev) =>
      prev.map((q) =>
        q.id === templateId
          ? {
              ...q,
              title: updatedTitle,
              effort: updatedEffort,
            }
          : q
      )
    );
  };

  // Toggle keeping a quest
  const handleToggleKeep = (id: string) => {
    setKeptQuestIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  // Ensure quest request IDs exist for each kept quest
  useEffect(() => {
    keptQuestIds.forEach((id) => {
      if (!questRequestIdsRef.current[id]) {
        questRequestIdsRef.current[id] =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'q0000000-0000-0000-0000-' + Math.random().toString(16).substring(2, 14);
      }
    });
  }, [keptQuestIds]);

  // Persist preferences (Step 8) before entering the First Quest selection
  const handleConfirmTimezone = async () => {
    setTimezoneError(null);
    setIsSavingPreferences(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Read current profile preferences to preserve existing sound/reducedMotion
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .single();

      const currentPrefs = (profile?.preferences as Record<string, unknown> | null) || {};

      const updatedPrefs = {
        ...currentPrefs,
        onboarding: {
          version: 2,
          goals: selectedGoals,
          intensity: intensity || 'balanced',
          availableMinutes: availableMinutes || '15-30',
          preferredTime: preferredRhythm || 'flexible',
          starterTemplateIds: keptQuestIds,
        },
      };

      // Note: Do NOT set onboarded = true yet!
      const { error: rpcError } = await supabase.rpc('update_profile_preferences', {
        p_timezone: selectedTimezone,
        p_preferences: updatedPrefs,
      });

      if (rpcError) {
        setTimezoneError(rpcError.message || 'Failed to save timezone preference.');
        setIsSavingPreferences(false);
        return;
      }

      setIsSavingPreferences(false);
      setStep('first_quest');
    } catch (err) {
      setTimezoneError(err instanceof Error ? err.message : 'Connection error.');
      setIsSavingPreferences(false);
    }
  };

  // Kept quests as objects
  const keptQuests = useMemo(() => {
    return suggestedQuests.filter((q) => keptQuestIds.includes(q.id));
  }, [suggestedQuests, keptQuestIds]);

  return (
    <div className="onboarding-container min-h-screen">
      <div className="onboarding-grid">
        {/* Left / Main Editorial Decision Area */}
        <main
          className="flex flex-col justify-center items-center px-4 sm:px-8 py-8 sm:py-12 z-10"
          id="onboarding-main"
        >
          {/* STEP 1: GOALS */}
          {step === 'goals' && (
            <GoalDeck
              selectedGoals={selectedGoals}
              onToggleGoal={handleToggleGoal}
              onProceed={() => setStep('intensity')}
            />
          )}

          {/* STEP 2: INTENSITY */}
          {step === 'intensity' && (
            <div className="w-full flex flex-col items-center">
              <ChoiceCard<Intensity>
                eyebrow="Chapter II · The Weight of the Pack"
                title="Choose Your Intensity"
                subtitle="Calibrate how demanding daily quests should be. This guides recommendations, not server rules."
                selected={intensity}
                onSelect={(val) => setIntensity(val)}
                options={[
                  {
                    id: 'light',
                    label: 'Keep it light',
                    description: 'Small quests. Easier consistency and rapid habit formation.',
                    badge: 'Quick-heavy',
                    hint: 'Focuses on 10–15m acts that prevent overwhelm.',
                  },
                  {
                    id: 'balanced',
                    label: 'Balanced',
                    description: 'Meaningful daily effort with substantial accomplishment.',
                    badge: 'Standard-heavy',
                    hint: 'A healthy mix of 20–25m focused blocks.',
                  },
                  {
                    id: 'push',
                    label: 'Push me',
                    description: 'Fewer, deeper quests that test endurance and focus.',
                    badge: 'Deep-heavy',
                    hint: '45–60m dedicated sessions that leave a mark.',
                  },
                ]}
              />

              <div className="flex gap-3 w-full max-w-md mt-6">
                <button
                  type="button"
                  onClick={() => setStep('goals')}
                  className="px-4 py-3 rounded-lg border border-[#374537] bg-[#141713] text-[#B9BEAC] hover:text-[#F0E7D3] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('time')}
                  disabled={!intensity}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-sm transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  Continue to Available Time →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TIME & RHYTHM */}
          {step === 'time' && (
            <div className="w-full flex flex-col items-center">
              <ChoiceCard<AvailableMinutes>
                eyebrow="Chapter III · The Sun & The Clock"
                title="Available Daily Time"
                subtitle="How much dedicated focus can you realistically protect each day?"
                selected={availableMinutes}
                onSelect={(val) => setAvailableMinutes(val)}
                options={[
                  {
                    id: '5-15',
                    label: '5–15 minutes',
                    description: 'Micro-actions and quiet restarts to keep momentum alive.',
                  },
                  {
                    id: '15-30',
                    label: '15–30 minutes',
                    description: 'One solid study, workout, or screen-free interval.',
                  },
                  {
                    id: '30-60',
                    label: '30–60 minutes',
                    description: 'Comprehensive practice and substantive project steps.',
                  },
                  {
                    id: '60+',
                    label: '60+ minutes',
                    description: 'Deep work sessions, rigorous training, and expansive craft.',
                  },
                ]}
              />

              {/* Rhythm selection */}
              <div className="w-full max-w-md mt-6 pt-4 border-t border-[#2D382D]">
                <label className="block text-xs uppercase tracking-widest text-[#B9BEAC] font-semibold mb-2 text-center">
                  Preferred Daily Rhythm
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Preferred rhythm">
                  {(['morning', 'afternoon', 'evening', 'flexible'] as PreferredRhythm[]).map((r) => {
                    const isChosen = preferredRhythm === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        onClick={() => setPreferredRhythm(r)}
                        className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-medium border capitalize transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                          isChosen
                            ? 'bg-[#232B23] border-[#E98A4B] text-[#FFD38A]'
                            : 'bg-[#1D231D] border-[#2D382D] text-[#B9BEAC] hover:border-[#374537]'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 w-full max-w-md mt-6">
                <button
                  type="button"
                  onClick={() => setStep('intensity')}
                  className="px-4 py-3 rounded-lg border border-[#374537] bg-[#141713] text-[#B9BEAC] hover:text-[#F0E7D3] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    generateRecommendations(
                      selectedGoals,
                      intensity || 'balanced',
                      availableMinutes || '15-30'
                    );
                    setStep('quests');
                  }}
                  disabled={!availableMinutes}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-sm transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                >
                  Assemble Starter Quests →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: STARTER QUESTS */}
          {step === 'quests' && (
            <div className="w-full flex flex-col items-center">
              <StarterQuestDeck
                suggestions={suggestedQuests}
                keptIds={keptQuestIds}
                onToggleKeep={handleToggleKeep}
                onSwapQuest={handleSwapQuest}
                onEditQuest={handleEditQuest}
                onProceed={() => setStep('timezone')}
              />

              <div className="w-full max-w-xl mt-3">
                <button
                  type="button"
                  onClick={() => setStep('time')}
                  className="text-xs text-[#8E9782] hover:text-[#B9BEAC] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                >
                  ← Adjust Time or Intentions
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: TIMEZONE CONFIRMATION */}
          {step === 'timezone' && (
            <div className="w-full max-w-md p-6 sm:p-8 rounded-xl bg-[#1D231D] border border-[#2D382D] shadow-2xl">
              <div className="text-center mb-6">
                <span className="inline-block text-xs uppercase tracking-widest text-[#E98A4B] font-semibold mb-1">
                  Setting the Cycle
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#F0E7D3] tracking-tight">
                  Your Day Resets Here
                </h2>
                <p className="text-sm text-[#B9BEAC] mt-2 leading-relaxed">
                  Daily quests, streaks, and the Ember use your local midnight.
                </p>
              </div>

              {timezoneError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 p-3 rounded-lg bg-[#2B1B19] border border-[#F0A79D]/40 text-[#F0A79D] text-xs leading-relaxed"
                >
                  {timezoneError}
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#141713] border border-[#2D382D] text-center mb-6">
                <p className="text-xs text-[#8E9782]">Your day resets in</p>
                <p className="text-xl font-serif text-[#FFD38A] mt-1 font-medium">
                  {selectedTimezone}
                </p>
              </div>

              {isEditingTimezone ? (
                /* IANA Input / Datalist when Change is clicked */
                <div className="space-y-4 mb-6">
                  <div>
                    <label
                      htmlFor="custom-timezone"
                      className="block text-xs font-medium text-[#F0E7D3] mb-1"
                    >
                      Search IANA Timezone Identifier
                    </label>
                    <input
                      id="custom-timezone"
                      type="text"
                      list="tz-options"
                      value={selectedTimezone}
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-[#141713] border border-[#374537] text-[#F0E7D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A96A]"
                    />
                    <datalist id="tz-options">
                      {Array.from(new Set([detectedTimezone, ...COMMON_TIMEZONES])).map((tz) => (
                        <option key={tz} value={tz} />
                      ))}
                    </datalist>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3">
                {!isEditingTimezone && (
                  <button
                    type="button"
                    onClick={() => setIsEditingTimezone(true)}
                    className="min-h-[44px] px-4 py-2.5 rounded-lg border border-[#374537] bg-[#141713] hover:bg-[#1D231D] text-[#B9BEAC] hover:text-[#F0E7D3] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                  >
                    Change Timezone
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleConfirmTimezone}
                  disabled={isSavingPreferences}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-sm transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] disabled:opacity-50 shadow-md"
                >
                  {isSavingPreferences ? 'Aligning Cycle…' : 'Looks Right →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6 & 7: FIRST QUEST CHOICE & AUTHORITATIVE FIRST SEAL */}
          {(step === 'first_quest' || step === 'sealed') && (
            <FirstSeal
              keptQuests={keptQuests}
              selectedTimezone={selectedTimezone}
              onboardingPreferences={{
                version: 2,
                goals: selectedGoals,
                intensity: intensity || 'balanced',
                availableMinutes: availableMinutes || '15-30',
                preferredTime: preferredRhythm || 'flexible',
                starterTemplateIds: keptQuestIds,
              }}
              requestIds={{
                onboardingRequestId: onboardingRequestIdRef.current,
                questRequestIds: questRequestIdsRef.current,
                firstSealRequestId: firstSealRequestIdRef.current,
              }}
              onSealed={() => setStep('sealed')}
            />
          )}
        </main>

        {/* Right / Secondary Visual: Living Onboarding Root */}
        <aside
          className="hidden lg:flex flex-col items-center justify-center border-l border-[#2D382D]/60 bg-[#171C17]/40 p-8 select-none"
          aria-label="Root awakening illustration"
        >
          <OnboardingRoot
            selectedGoals={selectedGoals}
            intensity={intensity}
            availableMinutes={availableMinutes}
            currentStep={step}
            isSealed={step === 'sealed'}
          />
        </aside>
      </div>
    </div>
  );
};

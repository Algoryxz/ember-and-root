'use client';

import React, { useState } from 'react';
import type { GameSnapshot, Quest, MutationEvent, AttributeId } from '@/game/contracts';
import { completeQuestAction, fetchGameSnapshotAction } from '@/app/actions/hearth';
import { CreateQuestDialog } from './CreateQuestDialog';

interface HearthClientProps {
  initialSnapshot: GameSnapshot;
  todayCompletedQuestIds?: string[];
}

const ATTRIBUTE_COLORS: Record<AttributeId, string> = {
  mind: '#9FBA87',
  body: '#E98A4B',
  will: '#FFD38A',
  craft: '#D9E3B2',
};

const EMBER_CONFIG = {
  resting: {
    label: 'Resting Ember',
    desc: 'Dim and quiet. Complete a daily practice to kindle today’s flame.',
    badgeClass: 'bg-[#1D231D] text-[#B9BEAC] border-[#2A332A]',
    flameClass: 'text-[#E98A4B]/50 shadow-[0_0_12px_rgba(233,138,75,0.15)]',
    coreClass: 'bg-[#E98A4B]/20 border-[#E98A4B]/30',
  },
  kindled: {
    label: 'Kindled Flame',
    desc: 'The flame is awake. 1 practice completed today.',
    badgeClass: 'bg-[#E98A4B]/10 text-[#E98A4B] border-[#E98A4B]/40',
    flameClass: 'text-[#E98A4B] shadow-[0_0_20px_rgba(233,138,75,0.35)]',
    coreClass: 'bg-[#E98A4B]/30 border-[#E98A4B]/60',
  },
  steady: {
    label: 'Steady Fire',
    desc: 'Radiant copper heat. 2 practices completed today.',
    badgeClass: 'bg-[#FFD38A]/10 text-[#FFD38A] border-[#FFD38A]/40',
    flameClass: 'text-[#FFD38A] shadow-[0_0_28px_rgba(255,211,138,0.45)]',
    coreClass: 'bg-[#FFD38A]/30 border-[#FFD38A]/70',
  },
  bright: {
    label: 'Bright Hearth',
    desc: 'Brilliant illumination! 3+ practices completed today.',
    badgeClass: 'bg-[#FFD38A]/20 text-[#FFD38A] border-[#FFD38A]/60 shadow-[0_0_12px_rgba(255,211,138,0.3)]',
    flameClass: 'text-[#FFD38A] shadow-[0_0_36px_rgba(255,211,138,0.6)]',
    coreClass: 'bg-[#FFD38A]/40 border-[#FFD38A]',
  },
};

export function HearthClient({
  initialSnapshot,
  todayCompletedQuestIds = [],
}: HearthClientProps) {
  const [snapshot, setSnapshot] = useState<GameSnapshot>(initialSnapshot);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(
    new Set(todayCompletedQuestIds)
  );
  const [inFlight, setInFlight] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [rewardBanner, setRewardBanner] = useState<MutationEvent | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  const emberState = snapshot.emberState || 'resting';
  const emberStyle = EMBER_CONFIG[emberState] || EMBER_CONFIG.resting;
  const quests = snapshot.quests || [];

  async function handleCompleteQuest(quest: Quest) {
    if (inFlight[quest.id] || completedQuestIds.has(quest.id)) {
      return;
    }

    // Set in-flight protection against duplicate clicks
    setInFlight((prev) => ({ ...prev, [quest.id]: true }));
    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[quest.id];
      return next;
    });

    const requestId = crypto.randomUUID();

    try {
      const response = await completeQuestAction(requestId, quest.id);

      if (response.success && response.result) {
        const { event, snapshot: updatedSnapshot } = response.result;
        setSnapshot(updatedSnapshot);
        setCompletedQuestIds((prev) => {
          const next = new Set(prev);
          next.add(quest.id);
          return next;
        });
        setRewardBanner(event);

        const xpText = event.xpAwarded ? `+${event.xpAwarded} XP` : '0 XP (Daily cap reached)';
        const sparksText = event.sparksAwarded ? ` and +${event.sparksAwarded} Sparks` : '';
        const speech = `Quest completed! Awarded ${xpText}${sparksText}. Ember is now ${event.emberState || emberState}.`;
        setAnnouncement(speech);
      } else {
        setErrorMap((prev) => ({
          ...prev,
          [quest.id]: response.error || 'Failed to complete quest.',
        }));
      }
    } catch {
      setErrorMap((prev) => ({
        ...prev,
        [quest.id]: 'Network communication error. Please try again.',
      }));
    } finally {
      setInFlight((prev) => ({ ...prev, [quest.id]: false }));
    }
  }

  async function refreshSnapshot() {
    const fresh = await fetchGameSnapshotAction();
    if (fresh) {
      setSnapshot(fresh);
    }
  }

  return (
    <div className="space-y-6">
      {/* Live Accessibility Screen-Reader Announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Top Status Strip */}
      <section
        aria-label="Character Status"
        className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-4 flex items-center justify-between flex-wrap gap-4 text-sm"
      >
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[#B9BEAC] block text-xs uppercase tracking-wider">Level</span>
            <span className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
              {snapshot.level}
            </span>
          </div>
          <div className="h-6 w-px bg-[#2A332A]" aria-hidden="true" />
          <div>
            <span className="text-[#B9BEAC] block text-xs uppercase tracking-wider">Total XP</span>
            <span className="font-['Fraunces'] text-xl font-normal text-[#9FBA87]">
              {snapshot.totalXp}
            </span>
          </div>
          <div className="h-6 w-px bg-[#2A332A]" aria-hidden="true" />
          <div>
            <span className="text-[#B9BEAC] block text-xs uppercase tracking-wider">Sparks</span>
            <span className="font-['Fraunces'] text-xl font-normal text-[#FFD38A]">
              {snapshot.sparksBalance}
            </span>
          </div>
          <div className="h-6 w-px bg-[#2A332A]" aria-hidden="true" />
          <div>
            <span className="text-[#B9BEAC] block text-xs uppercase tracking-wider">Streak</span>
            <span className="font-['Fraunces'] text-xl font-normal text-[#E98A4B]">
              {snapshot.currentStreak} {snapshot.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div>
          <span
            className={`px-3 py-1 rounded-[4px] text-xs font-medium border capitalize ${emberStyle.badgeClass}`}
          >
            🔥 {emberStyle.label}
          </span>
        </div>
      </section>

      {/* Completion Reward Toast Banner */}
      {rewardBanner && (
        <div
          role="status"
          className="p-4 bg-[#1D231D] border border-[#E98A4B]/50 rounded-[8px] flex items-center justify-between gap-4 animate-fade-in shadow-[0_0_16px_rgba(233,138,75,0.2)]"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              🔥
            </span>
            <div>
              <p className="text-sm font-semibold text-[#F0E7D3]">
                Practice Completed!
              </p>
              <p className="text-xs text-[#B9BEAC]">
                {rewardBanner.xpAwarded ? `+${rewardBanner.xpAwarded} XP` : '0 XP'}{' '}
                {rewardBanner.sparksAwarded ? `• +${rewardBanner.sparksAwarded} Sparks` : ''}{' '}
                • Ember status: <span className="capitalize text-[#FFD38A]">{rewardBanner.emberState}</span>
                {rewardBanner.newLevel && rewardBanner.previousLevel && rewardBanner.newLevel > rewardBanner.previousLevel && (
                  <span className="text-[#9FBA87] font-bold block mt-0.5">
                    🌟 Level Up! Reached Level {rewardBanner.newLevel}!
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRewardBanner(null)}
            className="text-xs text-[#B9BEAC] hover:text-[#F0E7D3] px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Quest Journal (~40%) + Ember & Root Scene (~60%) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Quest Journal */}
        <section
          aria-labelledby="journal-heading"
          className="md:col-span-6 lg:col-span-5 bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#2A332A] pb-3">
            <div>
              <h1 id="journal-heading" className="font-['Fraunces'] text-2xl font-normal text-[#F0E7D3]">
                Daily Journal
              </h1>
              <p className="text-xs text-[#B9BEAC]">
                Today’s active practices &amp; quests
              </p>
            </div>

            <CreateQuestDialog onQuestCreated={refreshSnapshot} />
          </div>

          {quests.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#B9BEAC] space-y-3 border border-dashed border-[#2A332A] rounded-[8px] p-6">
              <p className="text-[#F0E7D3] font-medium">No practices inscribed yet.</p>
              <p className="text-xs max-w-xs mx-auto">
                Begin your chronicle by inscribing your first practice.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quests.map((quest) => {
                const isCompleted = completedQuestIds.has(quest.id);
                const isLoading = inFlight[quest.id] || false;
                const questError = errorMap[quest.id];
                const xpAmount = quest.effort === 'deep' ? 35 : quest.effort === 'quick' ? 10 : 20;
                const sparksAmount = Math.floor(xpAmount / 5);

                return (
                  <article
                    key={quest.id}
                    className={`bg-[#141713] border rounded-[8px] p-4 transition-all ${
                      isCompleted
                        ? 'border-[#2A332A] opacity-70'
                        : 'border-[#2A332A] hover:border-[#3A473A]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded capitalize"
                            style={{
                              backgroundColor: `${ATTRIBUTE_COLORS[quest.attribute]}15`,
                              color: ATTRIBUTE_COLORS[quest.attribute],
                              border: `1px solid ${ATTRIBUTE_COLORS[quest.attribute]}40`,
                            }}
                          >
                            {quest.attribute}
                          </span>
                          <span className="text-[10px] text-[#B9BEAC] bg-[#1D231D] px-2 py-0.5 rounded capitalize border border-[#2A332A]">
                            {quest.effort}
                          </span>
                          <span className="text-[10px] text-[#B9BEAC]">
                            {quest.cadence === 'daily' ? 'Daily' : 'Once'}
                          </span>
                        </div>

                        <h2 className="text-sm font-medium text-[#F0E7D3] leading-snug">
                          {quest.title}
                        </h2>

                        <div className="flex items-center gap-3 text-xs text-[#B9BEAC]">
                          <span className="text-[#FFD38A]">+{xpAmount} XP</span>
                          <span>•</span>
                          <span className="text-[#FFD38A]/80">+{sparksAmount} Sparks</span>
                        </div>
                      </div>

                      {/* Complete Quest Control */}
                      <div className="self-center">
                        {isCompleted ? (
                          <div className="min-h-[44px] px-3.5 flex items-center gap-1.5 text-xs font-medium text-[#9FBA87] bg-[#9FBA87]/10 border border-[#9FBA87]/30 rounded-[6px]">
                            <span aria-hidden="true">✓</span>
                            <span>Done</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleCompleteQuest(quest)}
                            className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-[#E98A4B] text-[#141713] font-semibold text-xs rounded-[6px] hover:brightness-105 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141713] disabled:opacity-50"
                          >
                            {isLoading ? 'Kindling…' : 'Complete Quest'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Error on Quest Row */}
                    {questError && (
                      <div
                        role="alert"
                        className="mt-3 p-2 bg-[#F0A79D]/10 border border-[#F0A79D]/30 rounded text-xs text-[#F0A79D] flex items-center justify-between gap-2"
                      >
                        <span>{questError}</span>
                        <button
                          type="button"
                          onClick={() => handleCompleteQuest(quest)}
                          className="underline hover:text-[#F0E7D3] font-medium"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Ember & Root Scene */}
        <section
          aria-labelledby="ember-heading"
          className="md:col-span-6 lg:col-span-7 bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-6 space-y-6 flex flex-col justify-between"
        >
          <div>
            <div className="border-b border-[#2A332A] pb-3 mb-6">
              <h2 id="ember-heading" className="font-['Fraunces'] text-2xl font-normal text-[#F0E7D3]">
                The Hearth &amp; Flame
              </h2>
              <p className="text-xs text-[#B9BEAC]">
                Reflecting today’s practice and nourishment.
              </p>
            </div>

            {/* Ember Motif Visual */}
            <div className="flex flex-col items-center justify-center text-center p-8 bg-[#141713] border border-[#2A332A] rounded-[10px] space-y-4">
              <div
                className={`w-24 h-24 rounded-full border flex items-center justify-center transition-all ${emberStyle.coreClass}`}
              >
                <svg
                  className={`w-12 h-12 transition-colors ${emberStyle.flameClass}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.17-.59-1.61L12 11.8l-.91 1.09c-.37.44-.59 1-.59 1.61z" />
                  <path d="M12 2c1 3 4 6.5 4 10a6 6 0 0 1-12 0c0-3.5 3-7 4-10 1.5 2.5 3 4 4 0z" />
                </svg>
              </div>

              <div className="space-y-1 max-w-sm">
                <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${emberStyle.badgeClass}`}>
                  {emberStyle.label}
                </span>
                <p className="text-xs text-[#B9BEAC]">{emberStyle.desc}</p>
              </div>
            </div>
          </div>

          {/* Root Preview & Milestone Summary */}
          <div className="bg-[#141713] border border-[#2A332A] rounded-[8px] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-['Fraunces'] text-sm text-[#F0E7D3]">
                Root Nourishment
              </span>
              <span className="text-[#B9BEAC]">
                Today: +{snapshot.todayXpAwarded || 0} XP
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {(['mind', 'body', 'will', 'craft'] as const).map((attr) => {
                const branch = snapshot.branches?.[attr];
                const xp = branch?.xp || 0;
                return (
                  <div key={attr} className="bg-[#1D231D] p-2 rounded border border-[#2A332A]/50">
                    <span className="block capitalize font-medium text-[#B9BEAC] text-[11px]">
                      {attr}
                    </span>
                    <span className="block font-semibold text-[#F0E7D3] mt-0.5">
                      {xp} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

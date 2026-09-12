import React from 'react';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Chronicle — Ember & Root',
};

export default async function ChroniclePage() {
  const supabase = await createClient();

  const [profileRes, completionsRes, branchesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('total_xp, current_streak, longest_streak, last_activity_date')
      .single(),
    supabase
      .from('quest_completions')
      .select('id, quest_title_snapshot, quest_attribute_snapshot, xp_awarded, sparks_awarded, local_date, completed_at')
      .order('completed_at', { ascending: false })
      .limit(20),
    supabase
      .from('branches')
      .select('attribute, selected_specialization'),
  ]);

  const profile = profileRes.data;
  const completions = completionsRes.data ?? [];
  const branches = branchesRes.data ?? [];

  const totalXp = profile?.total_xp ?? 0;
  const currentStreak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;
  const level = Math.floor(Math.sqrt(totalXp / 20)) + 1;

  // Derived Achievements
  const hasFirstLight = completions.length > 0;
  const hasChosenPath = branches.some((b) => b.selected_specialization !== null);
  const hasReturned = longestStreak >= 2 || currentStreak > 0;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-['Fraunces'] text-3xl font-normal text-[#F0E7D3] mb-1">
          Chronicle
        </h1>
        <p className="text-sm text-[#B9BEAC]">
          A permanent record of your journey, streaks, and achievements.
        </p>
      </div>

      {/* Stats Summary Bar */}
      <section
        aria-label="Journey Summary"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-4 text-center">
          <span className="text-xs uppercase tracking-wider text-[#B9BEAC] block mb-1">
            Current Streak
          </span>
          <span className="font-['Fraunces'] text-2xl font-normal text-[#E98A4B]">
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-4 text-center">
          <span className="text-xs uppercase tracking-wider text-[#B9BEAC] block mb-1">
            Longest Streak
          </span>
          <span className="font-['Fraunces'] text-2xl font-normal text-[#F0E7D3]">
            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </span>
        </div>

        <div className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-4 text-center">
          <span className="text-xs uppercase tracking-wider text-[#B9BEAC] block mb-1">
            Total XP
          </span>
          <span className="font-['Fraunces'] text-2xl font-normal text-[#9FBA87]">
            {totalXp}
          </span>
        </div>

        <div className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-4 text-center">
          <span className="text-xs uppercase tracking-wider text-[#B9BEAC] block mb-1">
            Level
          </span>
          <span className="font-['Fraunces'] text-2xl font-normal text-[#FFD38A]">
            {level}
          </span>
        </div>
      </section>

      {/* Derived Achievements */}
      <section aria-labelledby="achievements-heading" className="space-y-4">
        <h2 id="achievements-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
          Achievements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* First Light */}
          <div
            className={`rounded-[8px] p-4 border transition-colors ${
              hasFirstLight
                ? 'bg-[#1D231D] border-[#9FBA87]/50 text-[#F0E7D3]'
                : 'bg-[#141713] border-[#2A332A] opacity-60 text-[#B9BEAC]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg" aria-hidden="true">
                {hasFirstLight ? '🔥' : '🔒'}
              </span>
              <h3 className="font-['Fraunces'] text-base font-medium">First Light</h3>
            </div>
            <p className="text-xs text-[#B9BEAC]">
              Kindled your very first daily practice into flame.
            </p>
            <span className="inline-block mt-3 text-[11px] font-medium text-[#9FBA87]">
              {hasFirstLight ? 'Unlocked' : 'Locked'}
            </span>
          </div>

          {/* A Chosen Path */}
          <div
            className={`rounded-[8px] p-4 border transition-colors ${
              hasChosenPath
                ? 'bg-[#1D231D] border-[#9FBA87]/50 text-[#F0E7D3]'
                : 'bg-[#141713] border-[#2A332A] opacity-60 text-[#B9BEAC]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg" aria-hidden="true">
                {hasChosenPath ? '🌿' : '🔒'}
              </span>
              <h3 className="font-['Fraunces'] text-base font-medium">A Chosen Path</h3>
            </div>
            <p className="text-xs text-[#B9BEAC]">
              Committed to a specialized fork along the Root.
            </p>
            <span className="inline-block mt-3 text-[11px] font-medium text-[#9FBA87]">
              {hasChosenPath ? 'Unlocked' : 'Locked (80 XP Branch required)'}
            </span>
          </div>

          {/* Returned */}
          <div
            className={`rounded-[8px] p-4 border transition-colors ${
              hasReturned
                ? 'bg-[#1D231D] border-[#9FBA87]/50 text-[#F0E7D3]'
                : 'bg-[#141713] border-[#2A332A] opacity-60 text-[#B9BEAC]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg" aria-hidden="true">
                {hasReturned ? '✨' : '🔒'}
              </span>
              <h3 className="font-['Fraunces'] text-base font-medium">Returned</h3>
            </div>
            <p className="text-xs text-[#B9BEAC]">
              Sustained your rhythm across days and returned to the Hearth.
            </p>
            <span className="inline-block mt-3 text-[11px] font-medium text-[#9FBA87]">
              {hasReturned ? 'Unlocked' : 'Locked'}
            </span>
          </div>
        </div>
      </section>

      {/* Completion History List */}
      <section aria-labelledby="history-heading" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A332A] pb-3">
          <h2 id="history-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
            Completion History
          </h2>
          <span className="text-xs text-[#B9BEAC]">
            {completions.length} {completions.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {completions.length === 0 ? (
          <div className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-8 text-center text-sm text-[#B9BEAC]">
            No completed quests recorded in your chronicle yet. Complete your first quest on the Hearth to begin your chronicle.
          </div>
        ) : (
          <div className="space-y-2">
            {completions.map((comp) => (
              <article
                key={comp.id}
                className="bg-[#1D231D] border border-[#2A332A] rounded-[6px] px-4 py-3 flex items-center justify-between gap-4 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-[#F0E7D3]">{comp.quest_title_snapshot}</p>
                  <div className="flex items-center gap-2 text-xs text-[#B9BEAC]">
                    <span className="capitalize text-[#9FBA87]">{comp.quest_attribute_snapshot}</span>
                    <span>•</span>
                    <span>{comp.local_date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <span className="text-xs text-[#FFD38A] font-medium">
                    +{comp.xp_awarded} XP
                  </span>
                  {comp.sparks_awarded > 0 && (
                    <span className="text-xs text-[#FFD38A]/80">
                      +{comp.sparks_awarded} Sparks
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

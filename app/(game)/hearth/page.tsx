import React from 'react';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Hearth — Ember & Root',
};

export default async function HearthPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp, sparks_balance, current_streak, longest_streak, timezone')
    .single();

  const totalXp = profile?.total_xp ?? 0;
  const sparks = profile?.sparks_balance ?? 0;
  const streak = profile?.current_streak ?? 0;
  const level = Math.floor(Math.sqrt(totalXp / 20)) + 1;

  return (
    <div className="space-y-6">
      {/* Top Status Strip */}
      <section
        aria-label="Character Status"
        className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-4 flex items-center justify-between flex-wrap gap-4 text-sm"
      >
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[#B9BEAC] block text-xs uppercase tracking-wider">Level</span>
            <span className="font-['Fraunces'] text-lg font-normal text-[#F0E7D3]">{level}</span>
          </div>
          <div className="h-6 w-px bg-[#2A332A]" aria-hidden="true" />
          <div>
            <span className="text-[#B9BEAC] block text-xs uppercase tracking-wider">Sparks</span>
            <span className="font-['Fraunces'] text-lg font-normal text-[#FFD38A]">{sparks}</span>
          </div>
          <div className="h-6 w-px bg-[#2A332A]" aria-hidden="true" />
          <div>
            <span className="text-[#B9BEAC] block text-xs uppercase tracking-wider">Streak</span>
            <span className="font-['Fraunces'] text-lg font-normal text-[#E98A4B]">
              {streak} {streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="text-xs text-[#B9BEAC]">
          <span>Timezone: </span>
          <span className="text-[#F0E7D3]">{profile?.timezone || 'UTC'}</span>
        </div>
      </section>

      {/* Main Hearth Title & Structural Shell */}
      <div>
        <h1 className="font-['Fraunces'] text-3xl font-normal text-[#F0E7D3] mb-1">
          The Hearth
        </h1>
        <p className="text-sm text-[#B9BEAC]">
          Today’s presence and active quest journal.
        </p>
      </div>

      {/* Two-column layout on desktop (~40% journal, ~60% Ember scene) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column: Quest Journal Placeholder */}
        <section
          aria-labelledby="quest-journal-heading"
          className="md:col-span-5 bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#2A332A] pb-3">
            <h2 id="quest-journal-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
              Daily Journal
            </h2>
            <span className="text-xs text-[#B9BEAC]">Today</span>
          </div>

          <div className="py-8 text-center text-[#B9BEAC] text-sm space-y-2 border border-dashed border-[#2A332A] rounded-[8px] px-4">
            <p className="text-[#F0E7D3] font-medium">Quest Journal Mount Point</p>
            <p className="text-xs">
              Deeptiman’s Hearth &amp; quest journal system connects here.
            </p>
          </div>
        </section>

        {/* Right column: Ember & Root Preview Placeholder */}
        <section
          aria-labelledby="ember-scene-heading"
          className="md:col-span-7 bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-5 space-y-4 flex flex-col justify-between"
        >
          <div className="border-b border-[#2A332A] pb-3">
            <h2 id="ember-scene-heading" className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
              Ember &amp; Hearth Scene
            </h2>
          </div>

          <div className="py-16 text-center text-[#B9BEAC] text-sm space-y-3 border border-dashed border-[#2A332A] rounded-[8px] px-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#E98A4B]/20 border border-[#E98A4B]/40 flex items-center justify-center text-[#E98A4B] shadow-[0_0_12px_rgba(233,138,75,0.3)]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.17-.59-1.61L12 11.8l-.91 1.09c-.37.44-.59 1-.59 1.61z" />
                <path d="M12 2c1 3 4 6.5 4 10a6 6 0 0 1-12 0c0-3.5 3-7 4-10 1.5 2.5 3 4 4 0z" />
              </svg>
            </div>
            <p className="text-[#F0E7D3] font-medium">Ember Visual &amp; Milestone Scene</p>
            <p className="text-xs max-w-sm">
              The living Ember component and Root milestone preview connect here.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

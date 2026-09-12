import React from 'react';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Root — Ember & Root',
};

const ATTRIBUTE_LABELS: Record<string, { label: string; desc: string }> = {
  mind: { label: 'Mind', desc: 'Intellect, learning, and scholarship' },
  body: { label: 'Body', desc: 'Endurance, physical presence, and vitality' },
  will: { label: 'Will', desc: 'Focus, courage, and discipline' },
  craft: { label: 'Craft', desc: 'Building, creation, and mastery' },
};

export default async function RootPage() {
  const supabase = await createClient();
  const { data: branches } = await supabase
    .from('branches')
    .select('attribute, xp, selected_specialization, selected_at');

  const branchList = ['mind', 'body', 'will', 'craft'].map((attr) => {
    const found = branches?.find((b) => b.attribute === attr);
    return {
      attribute: attr,
      label: ATTRIBUTE_LABELS[attr].label,
      desc: ATTRIBUTE_LABELS[attr].desc,
      xp: found?.xp ?? 0,
      specialization: found?.selected_specialization ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Fraunces'] text-3xl font-normal text-[#F0E7D3] mb-1">
          The Root
        </h1>
        <p className="text-sm text-[#B9BEAC]">
          Four branches growing permanently with each completed practice.
        </p>
      </div>

      {/* Attribute Branches Summary Cards */}
      <section aria-label="Attribute Branches" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {branchList.map((branch) => (
          <div
            key={branch.attribute}
            className="bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-4 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-['Fraunces'] text-lg font-normal text-[#9FBA87]">
                  {branch.label}
                </span>
                <span className="text-xs text-[#B9BEAC] bg-[#141713] px-2 py-0.5 rounded">
                  {branch.xp} XP
                </span>
              </div>
              <p className="text-xs text-[#B9BEAC] mt-1">{branch.desc}</p>
            </div>

            <div className="text-xs pt-2 border-t border-[#2A332A] flex items-center justify-between">
              <span className="text-[#B9BEAC]">Path:</span>
              <span className="text-[#F0E7D3] font-medium capitalize">
                {branch.specialization ? branch.specialization : 'Unchosen'}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Root SVG Renderer Mount Area */}
      <section
        aria-label="Root Tree Visualizer"
        className="bg-[#1D231D] border border-[#2A332A] rounded-[10px] p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[320px]"
      >
        <div className="w-16 h-16 rounded-full bg-[#9FBA87]/20 border border-[#9FBA87]/40 flex items-center justify-center text-[#9FBA87] shadow-[0_0_16px_rgba(159,186,135,0.2)]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="M12 15c-3 0-6 2-7 6" />
            <path d="M12 15c3 0 6 2 7 6" />
            <path d="M12 9c-2.5 0-5 1.5-6 4" />
            <path d="M12 9c2.5 0 5 1.5 6 4" />
          </svg>
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3]">
            Root SVG Canopy Mount Point
          </h2>
          <p className="text-xs text-[#B9BEAC]">
            Akriti’s authored Root SVG canopy and interactive branch nodes mount here.
          </p>
        </div>
      </section>
    </div>
  );
}

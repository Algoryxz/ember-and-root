import React, { useState } from 'react';
import type { Effort, AttributeId } from '@/game/contracts';
import type { StarterQuestTemplate } from './types';

export interface StarterQuestDeckProps {
  suggestions: StarterQuestTemplate[];
  keptIds: string[];
  onToggleKeep: (id: string) => void;
  onSwapQuest: (templateId: string) => void;
  onEditQuest: (templateId: string, updatedTitle: string, updatedEffort: Effort) => void;
  onProceed: () => void;
  minKept?: number;
  maxKept?: number;
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

export const StarterQuestDeck: React.FC<StarterQuestDeckProps> = ({
  suggestions,
  keptIds,
  onToggleKeep,
  onSwapQuest,
  onEditQuest,
  onProceed,
  minKept = 2,
  maxKept = 4,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEffort, setEditEffort] = useState<Effort>('standard');

  const startEdit = (q: StarterQuestTemplate) => {
    setEditingId(q.id);
    setEditTitle(q.title);
    setEditEffort(q.effort);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) {
      onEditQuest(id, editTitle.trim(), editEffort);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const keptCount = keptIds.length;
  const canProceed = keptCount >= minKept && keptCount <= maxKept;

  return (
    <div className="w-full max-w-xl">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-block text-xs uppercase tracking-widest text-[#E98A4B] font-semibold mb-1">
          Chapter IV · Your First Inscriptions
        </span>
        <h2 className="text-2xl sm:text-3xl font-serif text-[#F0E7D3] tracking-tight">
          Author Your Starting Quests
        </h2>
        <p className="text-sm text-[#B9BEAC] mt-1.5 leading-relaxed">
          Based on your choices, we prepared these starter tasks. Keep <span className="text-[#FFD38A] font-medium">{minKept} to {maxKept}</span>.
          You may swap or customize any row.
        </p>

        {/* Counter */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D231D] border border-[#2D382D] text-xs text-[#B9BEAC]">
          <span>Kept: <strong className="text-[#F0E7D3]">{keptCount}</strong> of {suggestions.length}</span>
          <span className="text-[#6E7B6E]">·</span>
          <span>Target: {minKept}–{maxKept} quests</span>
        </div>
      </div>

      {/* Suggested Quests Journal Rows */}
      <div className="space-y-3" role="list" aria-label="Suggested starter quests">
        {suggestions.map((q) => {
          const isKept = keptIds.includes(q.id);
          const isEditing = editingId === q.id;
          const attr = ATTRIBUTE_LABELS[q.attribute];
          const effort = EFFORT_LABELS[q.effort];

          return (
            <div
              key={q.id}
              role="listitem"
              className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 ${
                isKept
                  ? 'bg-[#1D231D] border-[#374537] shadow-md'
                  : 'bg-[#141713] border-[#252C25] opacity-75'
              }`}
            >
              {isEditing ? (
                /* Inline Edit Form */
                <div className="space-y-3">
                  <div>
                    <label htmlFor={`edit-title-${q.id}`} className="block text-xs font-medium text-[#B9BEAC] mb-1">
                      Quest Title
                    </label>
                    <input
                      id={`edit-title-${q.id}`}
                      type="text"
                      maxLength={120}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#141713] border border-[#374537] text-[#F0E7D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A96A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#B9BEAC] mb-1">
                      Effort Tier
                    </label>
                    <div className="flex gap-2">
                      {(['quick', 'standard', 'deep'] as Effort[]).map((eff) => (
                        <button
                          key={eff}
                          type="button"
                          onClick={() => setEditEffort(eff)}
                          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                            editEffort === eff
                              ? 'bg-[#232B23] border-[#E98A4B] text-[#FFD38A]'
                              : 'bg-[#141713] border-[#2D382D] text-[#8E9782]'
                          }`}
                        >
                          {EFFORT_LABELS[eff].name} (+{EFFORT_LABELS[eff].xp} XP)
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs text-[#B9BEAC] hover:text-[#F0E7D3] border border-[#2D382D] rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEdit(q.id)}
                      className="px-3 py-1.5 text-xs font-medium text-[#141713] bg-[#E98A4B] hover:bg-[#d87c3f] rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* Journal Row View */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {/* Attribute Ribbon */}
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

                      {/* Effort Badge */}
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141713] border border-[#2D382D] text-[#B9BEAC]">
                        {effort?.name} · +{effort?.xp} XP
                      </span>

                      {/* Estimated Duration */}
                      <span className="text-[11px] text-[#6E7B6E]">
                        ~{q.estimatedMinutes}m
                      </span>
                    </div>

                    <h3 className="text-base font-medium text-[#F0E7D3] leading-snug">
                      {q.title}
                    </h3>
                    <p className="text-xs text-[#8E9782] mt-0.5">
                      {q.description}
                    </p>
                  </div>

                  {/* Actions: Keep / Swap / Edit */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2D382D]/60">
                    <button
                      type="button"
                      onClick={() => onToggleKeep(q.id)}
                      aria-pressed={isKept}
                      aria-label={isKept ? `Remove ${q.title} from starter quests` : `Keep ${q.title} in starter quests`}
                      className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                        isKept
                          ? 'bg-[#2D3B2D] border border-[#9FBA87] text-[#D9E3B2]'
                          : 'bg-[#141713] border border-[#374537] text-[#B9BEAC] hover:text-[#F0E7D3]'
                      }`}
                    >
                      {isKept ? 'Kept ✓' : 'Keep'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSwapQuest(q.id)}
                      aria-label={`Swap ${q.title} with another quest`}
                      className="min-h-[44px] px-2.5 py-2 rounded-lg border border-[#2D382D] hover:border-[#374537] bg-[#141713] text-[#B9BEAC] hover:text-[#F0E7D3] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                      title="Swap for another option"
                    >
                      Swap ↻
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(q)}
                      aria-label={`Edit ${q.title}`}
                      className="min-h-[44px] px-2.5 py-2 rounded-lg border border-[#2D382D] hover:border-[#374537] bg-[#141713] text-[#B9BEAC] hover:text-[#F0E7D3] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                      title="Edit quest title or effort"
                    >
                      Edit ✎
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation CTA */}
      <div className="mt-6">
        <button
          type="button"
          onClick={onProceed}
          disabled={!canProceed}
          className="w-full min-h-[48px] px-4 py-3 rounded-lg bg-[#E98A4B] hover:bg-[#d87c3f] text-[#141713] font-semibold text-base transition-all duration-100 ease-in-out active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {canProceed
            ? `Confirm ${keptCount} Starter Quests →`
            : `Keep ${minKept} to ${maxKept} quests to continue (currently ${keptCount})`}
        </button>
      </div>
    </div>
  );
};

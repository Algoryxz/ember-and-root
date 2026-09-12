import React, { useState } from 'react';
import type { Effort, AttributeId } from '@/game/contracts';
import type { StarterQuestTemplate } from './types';
import { PathButton } from '@/components/ui/PathButton';

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

const ATTRIBUTE_LABELS: Record<AttributeId, { name: string; color: string; bg: string; border: string }> = {
  mind: { name: 'Mind', color: '#8FA37E', bg: 'rgba(143, 163, 126, 0.1)', border: 'rgba(143, 163, 126, 0.25)' },
  body: { name: 'Body', color: '#D9986A', bg: 'rgba(217, 152, 106, 0.1)', border: 'rgba(217, 152, 106, 0.25)' },
  will: { name: 'Will', color: '#C4A96A', bg: 'rgba(196, 169, 106, 0.1)', border: 'rgba(196, 169, 106, 0.25)' },
  craft: { name: 'Craft', color: '#9FBA87', bg: 'rgba(159, 186, 135, 0.1)', border: 'rgba(159, 186, 135, 0.25)' },
};

const EFFORT_LABELS: Record<Effort, { name: string; xp: number }> = {
  quick: { name: 'Quick', xp: 10 },
  standard: { name: 'Standard', xp: 20 },
  deep: { name: 'Deep', xp: 35 },
};

/**
 * StarterQuestDeck — Authored Starter Quests in Field Journal Format
 *
 * Visual Direction: Illuminated Field Journal leaves / rows.
 * Features Keep, Swap, and Edit capabilities with tactile PathButton interactions.
 */
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
      {/* Editorial Chapter Header */}
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

        {/* Ledger Count Badge */}
        <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1D231D] border border-[#2D382D] text-xs text-[#B9BEAC]">
          <span>Kept: <strong className="text-[#F0E7D3] font-mono">{keptCount}</strong> of {suggestions.length}</span>
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
                  ? 'bg-[#1D231D] border-[#374537] shadow-lg'
                  : 'bg-[#141713] border-[#252C25] opacity-75 hover:opacity-90'
              }`}
              style={{
                boxShadow: isKept
                  ? '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
                  : undefined,
              }}
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
                    <PathButton
                      variant="parchment"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </PathButton>
                    <PathButton
                      variant="ember"
                      size="sm"
                      onClick={() => saveEdit(q.id)}
                    >
                      Save Changes
                    </PathButton>
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
                          borderColor: attr?.border || 'rgba(143,163,126,0.25)',
                          backgroundColor: attr?.bg || 'rgba(143,163,126,0.1)',
                        }}
                      >
                        {attr?.name}
                      </span>

                      {/* Effort Badge */}
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141713] border border-[#2D382D] text-[#B9BEAC]">
                        {effort?.name} · +{effort?.xp} XP
                      </span>

                      {/* Estimated Duration */}
                      <span className="text-[11px] text-[#6E7B6E] font-mono">
                        ~{q.estimatedMinutes}m
                      </span>
                    </div>

                    <h3 className="text-base font-medium text-[#F0E7D3] leading-snug">
                      {q.title}
                    </h3>
                    <p className="text-xs text-[#8E9782] mt-0.5 leading-relaxed">
                      {q.description}
                    </p>
                  </div>

                  {/* Actions: Keep / Swap / Edit */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2D382D]/60">
                    <PathButton
                      variant={isKept ? 'charcoal' : 'parchment'}
                      size="sm"
                      onClick={() => onToggleKeep(q.id)}
                      aria-pressed={isKept}
                      aria-label={isKept ? `Remove ${q.title} from starter quests` : `Keep ${q.title} in starter quests`}
                      className={isKept ? 'border border-[#9FBA87]/40 text-[#D9E3B2]' : ''}
                    >
                      {isKept ? 'Kept ✓' : 'Keep'}
                    </PathButton>

                    <PathButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSwapQuest(q.id)}
                      aria-label={`Swap ${q.title} with another quest`}
                      title="Swap for another option"
                    >
                      Swap ↻
                    </PathButton>

                    <PathButton
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(q)}
                      aria-label={`Edit ${q.title}`}
                      title="Edit quest title or effort"
                    >
                      Edit ✎
                    </PathButton>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation CTA */}
      <div className="mt-6">
        <PathButton
          variant="ember"
          size="lg"
          className="w-full"
          onClick={onProceed}
          disabled={!canProceed}
        >
          {canProceed
            ? `Confirm ${keptCount} Starter Quests →`
            : `Keep ${minKept} to ${maxKept} quests to continue (currently ${keptCount})`}
        </PathButton>
      </div>
    </div>
  );
};

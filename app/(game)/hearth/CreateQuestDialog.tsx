'use client';

import React, { useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { createQuestAction, type CreateQuestResult } from '@/app/actions/hearth';

interface CreateQuestDialogProps {
  onQuestCreated: () => void;
}

export function CreateQuestDialog({ onQuestCreated }: CreateQuestDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreateQuestResult | null>(null);

  const [title, setTitle] = useState('');
  const [attribute, setAttribute] = useState<'mind' | 'body' | 'will' | 'craft'>('mind');
  const [effort, setEffort] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [cadence, setCadence] = useState<'daily' | 'once'>('daily');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('attribute', attribute);
    formData.append('effort', effort);
    formData.append('cadence', cadence);

    startTransition(async () => {
      const res = await createQuestAction(null, formData);
      if (res.success) {
        setTitle('');
        setOpen(false);
        onQuestCreated();
      } else {
        setResult(res);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] px-4 py-2 bg-[#E98A4B] text-[#141713] font-semibold text-sm rounded-[6px] hover:brightness-105 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D231D] flex items-center gap-2"
        >
          <span className="text-base font-bold" aria-hidden="true">+</span>
          <span>New Practice</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1D231D] border border-[#2A332A] rounded-[12px] p-6 shadow-2xl z-50 focus:outline-none text-[#F0E7D3]">
          <div className="flex items-center justify-between border-b border-[#2A332A] pb-3 mb-4">
            <div>
              <Dialog.Title className="font-['Fraunces'] text-2xl font-normal text-[#F0E7D3]">
                Inscribe New Practice
              </Dialog.Title>
              <Dialog.Description className="text-xs text-[#B9BEAC] mt-0.5">
                Declare a real action to kindle today’s Ember.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#B9BEAC] hover:text-[#F0E7D3] hover:bg-[#141713] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
              >
                ✕
              </button>
            </Dialog.Close>
          </div>

          {result?.error && (
            <div
              role="alert"
              className="p-3 mb-4 bg-[#F0A79D]/10 border border-[#F0A79D]/40 rounded-[6px] text-xs text-[#F0A79D]"
            >
              {result.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title Field */}
            <div>
              <label htmlFor="quest-title-input" className="block text-xs uppercase tracking-wider text-[#B9BEAC] mb-1">
                Practice Title <span className="text-[#E98A4B]">*</span>
              </label>
              <input
                id="quest-title-input"
                name="title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Read 20 pages of architecture history"
                className="w-full bg-[#141713] border border-[#2A332A] rounded-[6px] px-3.5 py-2.5 text-sm text-[#F0E7D3] placeholder-[#6E7B6E] focus:outline-none focus:ring-2 focus:ring-[#C4A96A]"
              />
              {result?.fieldErrors?.title && (
                <p className="text-xs text-[#F0A79D] mt-1">{result.fieldErrors.title[0]}</p>
              )}
            </div>

            {/* Attribute Selection */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#B9BEAC] mb-1.5">
                Attribute Branch
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['mind', 'body', 'will', 'craft'] as const).map((attr) => (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => setAttribute(attr)}
                    className={`min-h-[44px] px-3 py-2 text-xs font-medium rounded-[6px] border capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                      attribute === attr
                        ? 'bg-[#141713] border-[#9FBA87] text-[#9FBA87] shadow-[0_0_8px_rgba(159,186,135,0.2)]'
                        : 'bg-[#141713]/50 border-[#2A332A] text-[#B9BEAC] hover:text-[#F0E7D3]'
                    }`}
                  >
                    {attr}
                  </button>
                ))}
              </div>
            </div>

            {/* Effort Tier Selection */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#B9BEAC] mb-1.5">
                Effort &amp; Reward
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'quick', label: 'Quick', xp: '10 XP', sparks: '2 Sparks' },
                  { key: 'standard', label: 'Standard', xp: '20 XP', sparks: '4 Sparks' },
                  { key: 'deep', label: 'Deep', xp: '35 XP', sparks: '7 Sparks' },
                ].map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => setEffort(tier.key as 'quick' | 'standard' | 'deep')}
                    className={`min-h-[44px] p-2 text-left rounded-[6px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                      effort === tier.key
                        ? 'bg-[#141713] border-[#FFD38A] text-[#F0E7D3] shadow-[0_0_8px_rgba(255,211,138,0.2)]'
                        : 'bg-[#141713]/50 border-[#2A332A] text-[#B9BEAC] hover:text-[#F0E7D3]'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-[#F0E7D3]">{tier.label}</span>
                    <span className="block text-[11px] text-[#FFD38A]">{tier.xp}</span>
                    <span className="block text-[10px] text-[#B9BEAC]">{tier.sparks}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cadence Selection */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#B9BEAC] mb-1.5">
                Cadence
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'daily', label: 'Daily Rhythm', desc: 'Resets each local day' },
                  { key: 'once', label: 'Single Quest', desc: 'Completes once permanently' },
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCadence(c.key as 'daily' | 'once')}
                    className={`min-h-[44px] p-2.5 text-left rounded-[6px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                      cadence === c.key
                        ? 'bg-[#141713] border-[#E98A4B] text-[#F0E7D3]'
                        : 'bg-[#141713]/50 border-[#2A332A] text-[#B9BEAC] hover:text-[#F0E7D3]'
                    }`}
                  >
                    <span className="block text-xs font-medium text-[#F0E7D3]">{c.label}</span>
                    <span className="block text-[10px] text-[#B9BEAC]">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A332A]">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-[#B9BEAC] hover:text-[#F0E7D3] rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
                >
                  Cancel
                </button>
              </Dialog.Close>

              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="min-h-[44px] px-5 py-2 bg-[#E98A4B] text-[#141713] font-semibold text-xs rounded-[6px] hover:brightness-105 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] disabled:opacity-50"
              >
                {isPending ? 'Inscribing…' : 'Inscribe Practice'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

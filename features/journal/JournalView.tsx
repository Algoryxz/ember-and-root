'use client';

import React, { useState, useMemo } from 'react';
import type { JournalNote } from './contracts';
import {
  fetchJournalNotes,
  createJournalNote,
  updateJournalNote,
  deleteJournalNote,
} from './journalAdapter';
import { JournalRenderer } from './JournalRenderer';
import {
  extractActionableItems,
  extractUniqueTags,
  summarizeJournal,
} from './JournalActions';
import { REFLECTION_PROMPTS, type ParsedActionableItem } from './contracts';
import { createQuestAction, DEMO_SNAPSHOT } from '@/features/hearth/contracts';
import type { AttributeId, Effort, Cadence, GameSnapshot } from '@/game/contracts';
import './journal.css';

interface JournalViewProps {
  initialNotes?: JournalNote[];
  initialSnapshot?: GameSnapshot;
}

export function JournalView({ initialNotes = [], initialSnapshot }: JournalViewProps) {
  const [notes, setNotes] = useState<JournalNote[]>(initialNotes);
  const [isComposing, setIsComposing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modals & Panels
  const [questModalNote, setQuestModalNote] = useState<JournalNote | null>(null);
  const [questCandidates, setQuestCandidates] = useState<ParsedActionableItem[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReflectMenu, setShowReflectMenu] = useState(false);
  const [questSuccessMessage, setQuestSuccessMessage] = useState<string | null>(null);

  // Available tags
  const uniqueTags = useMemo(() => extractUniqueTags(notes), [notes]);

  // Filtered & sorted notes
  const displayedNotes = useMemo(() => {
    let list = [...notes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          n.body.toLowerCase().includes(q)
      );
    }

    if (activeTag) {
      list = list.filter((n) => n.body.toLowerCase().includes(activeTag.toLowerCase()));
    }

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [notes, searchQuery, activeTag, sortOrder]);

  // Handle Save (Create or Edit)
  async function handleSaveNote() {
    if (!draftBody.trim()) return;

    if (editingNoteId) {
      const updated = await updateJournalNote({
        id: editingNoteId,
        title: draftTitle,
        body: draftBody,
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } else {
      const created = await createJournalNote({
        title: draftTitle,
        body: draftBody,
      });
      setNotes((prev) => [created, ...prev]);
    }

    // Reset composer
    setDraftTitle('');
    setDraftBody('');
    setEditingNoteId(null);
    setIsComposing(false);
    setPreviewMode(false);
  }

  // Handle Edit click
  function handleStartEdit(note: JournalNote) {
    setEditingNoteId(note.id);
    setDraftTitle(note.title || '');
    setDraftBody(note.body);
    setIsComposing(true);
    setPreviewMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle Delete click
  async function handleDeleteNote(id: string) {
    if (confirm('Are you sure you want to remove this journal leaf?')) {
      await deleteJournalNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  }

  // Handle Interactive Checklist toggle in a note
  async function handleToggleChecklist(note: JournalNote, lineIndex: number, isChecked: boolean) {
    const lines = note.body.split('\n');
    const targetLine = lines[lineIndex];
    if (!targetLine) return;

    const updatedLine = targetLine.replace(
      /^([*-]\s+\[)[ xX](\]\s*.*)$/,
      `$1${isChecked ? 'x' : ' '}$2`
    );
    lines[lineIndex] = updatedLine;
    const newBody = lines.join('\n');

    // Optimistic update
    const updatedNote = { ...note, body: newBody, updatedAt: new Date().toISOString() };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updatedNote : n)));

    // Persist
    await updateJournalNote({ id: note.id, title: note.title, body: newBody });
  }

  // Open "Turn into Quests" modal
  function handleOpenQuestModal(note: JournalNote) {
    const extracted = extractActionableItems(note.body);
    setQuestModalNote(note);
    setQuestCandidates(extracted);
    setQuestSuccessMessage(null);
  }

  // Create Quest from actionable item
  async function handleCreateQuestFromItem(
    item: ParsedActionableItem,
    attribute: AttributeId,
    effort: Effort = 'standard',
    cadence: Cadence = 'once'
  ) {
    try {
      const activeSnapshot = initialSnapshot || DEMO_SNAPSHOT;
      const result = await createQuestAction(activeSnapshot, {
        title: item.cleanedTitle,
        attribute,
        effort,
        cadence,
      });

      if (result?.snapshot) {
        setQuestSuccessMessage(`Quest "${item.cleanedTitle}" added to your Hearth!`);
        setQuestCandidates((prev) => prev.filter((c) => c.id !== item.id));
      } else {
        alert('Could not create quest.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating quest.');
    }
  }

  // Start draft with a reflection prompt
  function handlePickReflection(prompt: string) {
    setDraftTitle('Field Reflection');
    setDraftBody(`> ${prompt}\n\n`);
    setIsComposing(true);
    setShowReflectMenu(false);
    setPreviewMode(false);
  }

  return (
    <div className="journal-container py-4 sm:py-6">
      {/* Header */}
      <header className="journal-header">
        <div>
          <h1 className="font-['Fraunces'] text-3xl sm:text-4xl font-normal text-[#F0E7D3] tracking-tight">
            Personal Field Journal
          </h1>
          <p className="text-sm text-[#B9BEAC] mt-1">
            Reflections, inquiries, and daily practices recorded in your personal tome.
          </p>
        </div>

        {!isComposing && (
          <button
            type="button"
            onClick={() => {
              setIsComposing(true);
              setEditingNoteId(null);
              setDraftTitle('');
              setDraftBody('');
            }}
            className="journal-primary-btn"
          >
            <span aria-hidden="true">+</span> Inscribe New Leaf
          </button>
        )}
      </header>

      {/* Action Toolbar: Organize, Summarize, Reflect */}
      <section aria-label="Journal Controls" className="journal-toolbar">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal entries…"
            className="w-full bg-[#1D231D] border border-[#2A332A] rounded-[6px] px-3 py-1.5 text-sm text-[#F0E7D3] placeholder-[#8C9283] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A]"
          />
        </div>

        {/* Sort Toggle */}
        <button
          type="button"
          onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          className="journal-pill-btn"
          title={`Currently sorted by ${sortOrder}`}
        >
          <span>⇅</span> {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
        </button>

        {/* Summarize */}
        <button
          type="button"
          onClick={() => setShowSummaryModal(true)}
          className="journal-pill-btn"
        >
          <span>◈</span> Summarize
        </button>

        {/* Reflect Sparks */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReflectMenu((prev) => !prev)}
            className="journal-pill-btn"
          >
            <span>✧</span> Reflect
          </button>

          {showReflectMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#1D231D] border border-[#2A332A] rounded-[8px] p-2 shadow-xl z-20 space-y-1">
              <span className="block px-2 py-1 text-xs text-[#E98A4B] font-semibold uppercase tracking-wider">
                Reflection Prompts
              </span>
              {REFLECTION_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePickReflection(p)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-[#F0E7D3] hover:bg-[#141713] rounded transition-colors"
                >
                  "{p}"
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tag Filter Row */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6 text-xs">
          <span className="text-[#8C9283] mr-1">Tags:</span>
          {activeTag && (
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="journal-pill-btn active text-xs py-1"
            >
              Clear filter ✕
            </button>
          )}
          {uniqueTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
              className={`journal-pill-btn text-xs py-1 ${activeTag === tag ? 'active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Note Composer (Create / Edit) */}
      {isComposing && (
        <section aria-label="Journal Composer" className="journal-composer">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-['Fraunces'] text-lg text-[#F0E7D3]">
              {editingNoteId ? 'Edit Journal Leaf' : 'Inscribe Field Leaf'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode((prev) => !prev)}
                className="journal-pill-btn text-xs"
              >
                {previewMode ? 'Edit Mode' : 'Preview Format'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsComposing(false);
                  setEditingNoteId(null);
                }}
                className="journal-icon-btn"
                aria-label="Cancel editing"
              >
                ✕
              </button>
            </div>
          </div>

          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Optional Leaf Title (e.g. Dawn Inscription, Chapter Reflection)"
            maxLength={160}
            className="journal-input-title"
          />

          {previewMode ? (
            <div className="min-h-[140px] p-3 bg-[#141713] border border-[#2A332A] rounded-[6px] mb-4">
              <JournalRenderer content={draftBody || '*Empty note preview*'} />
            </div>
          ) : (
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              placeholder="Record your observations, tasks, and reflections…&#10;&#10;Use:&#10;- [ ] Checklist item&#10;> Quotes or reflections&#10;# Heading&#10;#mind, #body, #will, #craft"
              className="journal-textarea"
            />
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-[#8C9283]">
              {draftBody.trim().split(/\s+/).filter(Boolean).length} words
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsComposing(false);
                  setEditingNoteId(null);
                }}
                className="journal-pill-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!draftBody.trim()}
                className="journal-primary-btn disabled:opacity-50"
              >
                {editingNoteId ? 'Save Edits' : 'Bind Leaf'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Note Leaf List */}
      <section aria-label="Journal Entries" className="space-y-4">
        {displayedNotes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#1D231D]/40 border border-[#2A332A] rounded-[8px]">
            <p className="font-['Fraunces'] text-lg text-[#F0E7D3] mb-1">
              Your field journal is quiet.
            </p>
            <p className="text-sm text-[#B9BEAC] max-w-sm mx-auto mb-4">
              {searchQuery || activeTag
                ? 'No leaves match the current query.'
                : 'Inscribe your first observation, thought, or daily practice.'}
            </p>
            {!isComposing && (
              <button
                type="button"
                onClick={() => setIsComposing(true)}
                className="journal-primary-btn"
              >
                Inscribe First Leaf
              </button>
            )}
          </div>
        ) : (
          displayedNotes.map((note) => {
            const dateStr = new Date(note.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const hasChecklists = /[-*]\s+\[[ xX]\]/.test(note.body);

            return (
              <article key={note.id} className="journal-leaf">
                <div className="journal-leaf-header">
                  <div>
                    {note.title && <h3 className="journal-leaf-title">{note.title}</h3>}
                    <time dateTime={note.createdAt} className="journal-leaf-date">
                      {dateStr}
                    </time>
                  </div>

                  <div className="journal-leaf-actions">
                    {hasChecklists && (
                      <button
                        type="button"
                        onClick={() => handleOpenQuestModal(note)}
                        className="journal-pill-btn text-xs py-1"
                        title="Turn actionable items into Hearth quests"
                      >
                        <span aria-hidden="true">⚔</span> Turn into Quest
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(note)}
                      className="journal-icon-btn"
                      aria-label={`Edit ${note.title || 'entry'}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="journal-icon-btn danger"
                      aria-label={`Delete ${note.title || 'entry'}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <JournalRenderer
                  content={note.body}
                  onToggleChecklist={(lineIdx, isChecked) =>
                    handleToggleChecklist(note, lineIdx, isChecked)
                  }
                />
              </article>
            );
          })
        )}
      </section>

      {/* Modal: Turn into Quests */}
      {questModalNote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quest-modal-title"
          className="journal-dialog-overlay"
        >
          <div className="journal-dialog-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A332A]">
              <h3 id="quest-modal-title" className="font-['Fraunces'] text-xl text-[#F0E7D3]">
                Turn into Quests
              </h3>
              <button
                type="button"
                onClick={() => setQuestModalNote(null)}
                className="journal-icon-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {questSuccessMessage && (
              <div className="mb-4 p-3 rounded-[6px] bg-[#1F2E1F] border border-[#9FBA87]/40 text-[#D9E3B2] text-xs">
                {questSuccessMessage}
              </div>
            )}

            <p className="text-xs text-[#B9BEAC] mb-4">
              The following actions were discovered in this leaf. Select an attribute to add them as
              server-confirmed quests in your Hearth:
            </p>

            {questCandidates.length === 0 ? (
              <p className="text-sm text-[#B9BEAC] py-4 text-center">
                All discovered actions have been processed or none remain.
              </p>
            ) : (
              <div className="space-y-3">
                {questCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="p-3 bg-[#141713] border border-[#2A332A] rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#F0E7D3]">{candidate.cleanedTitle}</p>
                      <span className="text-[11px] text-[#8C9283] uppercase tracking-wide">
                        Suggested: {candidate.suggestedAttribute}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['mind', 'body', 'will', 'craft'] as AttributeId[]).map((attr) => (
                        <button
                          key={attr}
                          type="button"
                          onClick={() => handleCreateQuestFromItem(candidate, attr)}
                          className={`text-xs px-2.5 py-1 rounded border capitalize transition-colors ${
                            attr === candidate.suggestedAttribute
                              ? 'bg-[#E98A4B] text-[#141713] border-[#E98A4B] font-semibold'
                              : 'bg-[#1D231D] text-[#B9BEAC] border-[#2A332A] hover:text-[#F0E7D3]'
                          }`}
                        >
                          + {attr}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#2A332A] text-right">
              <button
                type="button"
                onClick={() => setQuestModalNote(null)}
                className="journal-primary-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Summarize */}
      {showSummaryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-modal-title"
          className="journal-dialog-overlay"
        >
          <div className="journal-dialog-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A332A]">
              <h3 id="summary-modal-title" className="font-['Fraunces'] text-xl text-[#F0E7D3]">
                Field Journal Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="journal-icon-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {(() => {
              const summary = summarizeJournal(notes);
              return (
                <div className="space-y-4 text-sm text-[#F0E7D3]">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#141713] rounded-[6px] border border-[#2A332A]">
                      <span className="block text-xs text-[#8C9283] uppercase tracking-wider">
                        Total Leaves
                      </span>
                      <span className="font-['Fraunces'] text-2xl text-[#E98A4B]">
                        {summary.totalNotes}
                      </span>
                    </div>
                    <div className="p-3 bg-[#141713] rounded-[6px] border border-[#2A332A]">
                      <span className="block text-xs text-[#8C9283] uppercase tracking-wider">
                        Word Count
                      </span>
                      <span className="font-['Fraunces'] text-2xl text-[#F0E7D3]">
                        {summary.totalWords}
                      </span>
                    </div>
                    <div className="p-3 bg-[#141713] rounded-[6px] border border-[#2A332A]">
                      <span className="block text-xs text-[#8C9283] uppercase tracking-wider">
                        Checklist Items
                      </span>
                      <span className="font-['Fraunces'] text-2xl text-[#9FBA87]">
                        {summary.checklistCompleted} / {summary.checklistCount}
                      </span>
                    </div>
                    <div className="p-3 bg-[#141713] rounded-[6px] border border-[#2A332A]">
                      <span className="block text-xs text-[#8C9283] uppercase tracking-wider">
                        Active Date Span
                      </span>
                      <span className="text-xs text-[#F0E7D3] font-medium mt-1 block">
                        {summary.dateSpan}
                      </span>
                    </div>
                  </div>

                  {summary.activeTags.length > 0 && (
                    <div className="pt-2">
                      <span className="block text-xs text-[#8C9283] mb-2 uppercase tracking-wider">
                        Tracked Domains &amp; Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.activeTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-[4px] bg-[#141713] border border-[#2A332A] text-xs text-[#B9BEAC]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-[#8C9283] italic pt-2">
                    Deterministic field summary computed locally. No external models called.
                  </p>
                </div>
              );
            })()}

            <div className="mt-6 pt-4 border-t border-[#2A332A] text-right">
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="journal-primary-btn"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

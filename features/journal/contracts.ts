/**
 * Journal V1 Contracts — Personal Field Journal
 * 
 * Defines client and server models for journal notes, filtering,
 * parsed actionable quest candidates, and field-journal summaries.
 */

import type { AttributeId } from '@/game/contracts';

export interface JournalNote {
  id: string;
  userId: string;
  title: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title?: string | null;
  body: string;
}

export interface UpdateNoteInput {
  id: string;
  title?: string | null;
  body: string;
}

export interface JournalFilter {
  query: string;
  tag: string | null;
  sort: 'newest' | 'oldest';
}

export interface ParsedActionableItem {
  id: string;
  rawText: string;
  cleanedTitle: string;
  isCompleted: boolean;
  suggestedAttribute: AttributeId;
}

export interface JournalSummary {
  totalNotes: number;
  totalWords: number;
  checklistCount: number;
  checklistCompleted: number;
  activeTags: string[];
  dateSpan: string;
}

export const JOURNAL_ATTRIBUTES: AttributeId[] = ['mind', 'body', 'will', 'craft'];

export const REFLECTION_PROMPTS = [
  'What kindle was sparked today?',
  'Which root grew deeper beneath the soil?',
  'Where was the struggle, and what did it reveal?',
  'What small effort gave shape to who you are becoming?',
  'What truth did you observe in your practice today?',
  'What will tomorrow require of your mind, body, will, or craft?',
];

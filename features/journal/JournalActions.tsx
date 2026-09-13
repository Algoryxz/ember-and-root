/**
 * Journal Actions — Pure TypeScript Offline / Zero-AI Logic
 * 
 * Provides:
 * 1. Actionable item extraction ("Turn into Quests")
 * 2. Extractive deterministic summarization ("Summarize")
 * 3. Tag extraction and search filtering ("Organize")
 * 4. Authored field-journal prompts ("Reflect")
 */

import type { AttributeId } from '@/game/contracts';
import type { JournalNote, ParsedActionableItem, JournalSummary } from './contracts';

/**
 * Infer attribute from keywords and tags in task text.
 */
export function inferAttributeFromText(text: string): AttributeId {
  const lower = text.toLowerCase();

  // Explicit hashtags take precedence
  if (lower.includes('#mind') || lower.includes('#scholar') || lower.includes('#explorer')) return 'mind';
  if (lower.includes('#body') || lower.includes('#endurance') || lower.includes('#mobility')) return 'body';
  if (lower.includes('#will') || lower.includes('#focus') || lower.includes('#courage')) return 'will';
  if (lower.includes('#craft') || lower.includes('#builder') || lower.includes('#artisan')) return 'craft';

  // Keyword heuristics
  if (/\b(meditat\w*|breath\w*|journal\w*|reflect\w*|courage|fast\w*|endur\w*|resist\w*|focus\w*|pray\w*|silence|still\w*|quiet\w*)\b/.test(lower)) return 'will';
  if (/\b(run\w*|walk\w*|gym|workout|lift\w*|stretch\w*|yoga|swim\w*|bike\w*|sleep|water|diet|health)\b/.test(lower)) return 'body';
  if (/\b(build\w*|mak\w*|writ\w*|design\w*|draw\w*|paint\w*|craft\w*|ship\w*|fix\w*|creat\w*|compos\w*|cook\w*)\b/.test(lower)) return 'craft';
  if (/\b(read\w*|stud\w*|learn\w*|book\w*|research\w*|paper\w*|analyz\w*|code|coding|program\w*|math|language)\b/.test(lower)) return 'mind';

  return 'mind'; // Default
}

/**
 * Parse actionable checklist and bullet lines from a note's body.
 */
export function extractActionableItems(body: string): ParsedActionableItem[] {
  const lines = body.split('\n');
  const items: ParsedActionableItem[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for checklist: - [ ] Task or - [x] Task
    const checkMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s*(.+)$/);
    if (checkMatch) {
      const isCompleted = checkMatch[1].toLowerCase() === 'x';
      const rawText = checkMatch[2].trim();
      const cleaned = rawText.replace(/#[a-zA-Z0-9_-]+/g, '').trim();

      if (cleaned.length > 0) {
        items.push({
          id: `item_${index}`,
          rawText,
          cleanedTitle: cleaned.slice(0, 120),
          isCompleted,
          suggestedAttribute: inferAttributeFromText(rawText),
        });
      }
      return;
    }

    // Check for simple bullet if it looks like an action (starts with a verb or short phrase)
    const bulletMatch = trimmed.match(/^[-*]\s+([A-Z][a-z]+.*)$/);
    if (bulletMatch) {
      const rawText = bulletMatch[1].trim();
      const cleaned = rawText.replace(/#[a-zA-Z0-9_-]+/g, '').trim();
      if (cleaned.length > 3 && cleaned.length <= 120) {
        items.push({
          id: `item_${index}`,
          rawText,
          cleanedTitle: cleaned,
          isCompleted: false,
          suggestedAttribute: inferAttributeFromText(rawText),
        });
      }
    }
  });

  return items;
}

/**
 * Extract all unique hashtags from a collection of notes.
 */
export function extractUniqueTags(notes: JournalNote[]): string[] {
  const tagSet = new Set<string>();
  notes.forEach((note) => {
    const matches = note.body.match(/#[a-zA-Z0-9_-]+/g);
    if (matches) {
      matches.forEach((m) => tagSet.add(m.toLowerCase()));
    }
  });
  return Array.from(tagSet);
}

/**
 * Deterministic extractive summarizer for field journal notes.
 * Calculates task completion rate, word count, reading time, and active domains.
 */
export function summarizeJournal(notes: JournalNote[]): JournalSummary {
  let totalWords = 0;
  let checklistCount = 0;
  let checklistCompleted = 0;
  const tagSet = new Set<string>();

  notes.forEach((note) => {
    const words = note.body.trim().split(/\s+/).filter(Boolean);
    totalWords += words.length;

    const lines = note.body.split('\n');
    lines.forEach((line) => {
      const match = line.trim().match(/^[-*]\s+\[([ xX])\]/);
      if (match) {
        checklistCount++;
        if (match[1].toLowerCase() === 'x') {
          checklistCompleted++;
        }
      }
    });

    const tags = note.body.match(/#[a-zA-Z0-9_-]+/g);
    if (tags) {
      tags.forEach((t) => tagSet.add(t.toLowerCase()));
    }
  });

  let dateSpan = 'No entries yet';
  if (notes.length > 0) {
    const oldest = new Date(notes[notes.length - 1].createdAt);
    const newest = new Date(notes[0].createdAt);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    dateSpan = `${oldest.toLocaleDateString(undefined, opts)} – ${newest.toLocaleDateString(undefined, opts)}`;
  }

  return {
    totalNotes: notes.length,
    totalWords,
    checklistCount,
    checklistCompleted,
    activeTags: Array.from(tagSet),
    dateSpan,
  };
}

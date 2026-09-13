import { describe, it, expect, beforeEach } from 'vitest';
import {
  inferAttributeFromText,
  extractActionableItems,
  extractUniqueTags,
  summarizeJournal,
} from './JournalActions';
import {
  createJournalNote,
  updateJournalNote,
  deleteJournalNote,
  fetchJournalNotes,
} from './journalAdapter';
import type { JournalNote } from './contracts';

describe('Journal V1 — Zero-AI Actions & Parsing Logic', () => {
  it('infers correct attributes from explicit hashtags', () => {
    expect(inferAttributeFromText('Deep study on algorithms #mind')).toBe('mind');
    expect(inferAttributeFromText('Morning 5k run #body')).toBe('body');
    expect(inferAttributeFromText('Hold silence during chaos #will')).toBe('will');
    expect(inferAttributeFromText('Carve wooden spoons #craft')).toBe('craft');
  });

  it('infers attributes from keyword semantics when hashtags are absent', () => {
    expect(inferAttributeFromText('Read two chapters of history')).toBe('mind');
    expect(inferAttributeFromText('Go to the gym and lift')).toBe('body');
    expect(inferAttributeFromText('Sit in quiet meditation for 20 minutes')).toBe('will');
    expect(inferAttributeFromText('Build the new client interface')).toBe('craft');
  });

  it('extracts actionable checklist items for "Turn into Quests"', () => {
    const body = `
# Morning Plan
- [ ] Read 15 pages of philosophy #mind
- [ ] Run 3km around the lake #body
- [x] Drink two glasses of water
- A simple observation line
> An inscription of hope
`;

    const items = extractActionableItems(body);
    expect(items.length).toBe(3); // 2 unchecked + 1 completed
    expect(items[0].cleanedTitle).toBe('Read 15 pages of philosophy');
    expect(items[0].suggestedAttribute).toBe('mind');
    expect(items[0].isCompleted).toBe(false);

    expect(items[1].cleanedTitle).toBe('Run 3km around the lake');
    expect(items[1].suggestedAttribute).toBe('body');
    expect(items[1].isCompleted).toBe(false);

    expect(items[2].cleanedTitle).toBe('Drink two glasses of water');
    expect(items[2].isCompleted).toBe(true);
  });

  it('extracts unique tags across notes', () => {
    const notes: JournalNote[] = [
      {
        id: '1',
        userId: 'u1',
        title: 'Note 1',
        body: 'Working on #mind and #craft projects.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'u1',
        title: 'Note 2',
        body: 'Morning session #craft with #will discipline.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const tags = extractUniqueTags(notes);
    expect(tags).toContain('#mind');
    expect(tags).toContain('#craft');
    expect(tags).toContain('#will');
    expect(tags.length).toBe(3);
  });

  it('summarizes journal notes deterministically without calling external AI', () => {
    const notes: JournalNote[] = [
      {
        id: '1',
        userId: 'u1',
        title: 'Leaf One',
        body: 'Three words here.\n- [ ] Task one\n- [x] Task two',
        createdAt: '2026-09-10T10:00:00Z',
        updatedAt: '2026-09-10T10:00:00Z',
      },
      {
        id: '2',
        userId: 'u1',
        title: 'Leaf Two',
        body: 'Five more words written here.',
        createdAt: '2026-09-13T10:00:00Z',
        updatedAt: '2026-09-13T10:00:00Z',
      },
    ];

    const summary = summarizeJournal(notes);
    expect(summary.totalNotes).toBe(2);
    expect(summary.checklistCount).toBe(2);
    expect(summary.checklistCompleted).toBe(1);
    expect(summary.totalWords).toBeGreaterThan(0);
    expect(summary.dateSpan).toContain('Sep');
  });
});

describe('Journal V1 — Data Adapter Invariants', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('creates and retrieves a journal note', async () => {
    const created = await createJournalNote({
      title: 'First Morning Leaf',
      body: 'Today I lit the Ember at dawn.',
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('First Morning Leaf');
    expect(created.body).toBe('Today I lit the Ember at dawn.');

    const notes = await fetchJournalNotes();
    expect(notes.length).toBeGreaterThanOrEqual(1);
    expect(notes[0].id).toBe(created.id);
  });

  it('rejects notes with empty bodies', async () => {
    await expect(
      createJournalNote({
        title: 'Empty Note',
        body: '   ',
      })
    ).rejects.toThrow('Note body cannot be empty.');
  });

  it('updates an existing journal note', async () => {
    const created = await createJournalNote({
      title: 'Initial Title',
      body: 'Initial body text.',
    });

    const updated = await updateJournalNote({
      id: created.id,
      title: 'Updated Title',
      body: 'Refined body text with #craft.',
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.body).toBe('Refined body text with #craft.');
  });

  it('deletes a journal note', async () => {
    const created = await createJournalNote({
      title: 'Temporary Leaf',
      body: 'To be pruned.',
    });

    const deleteRes = await deleteJournalNote(created.id);
    expect(deleteRes.success).toBe(true);

    const notes = await fetchJournalNotes();
    expect(notes.some((n) => n.id === created.id)).toBe(false);
  });
});

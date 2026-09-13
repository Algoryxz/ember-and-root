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

describe('Journal V1 — Data Adapter & Server Persistence Invariants', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('rejects notes with empty bodies', async () => {
    await expect(
      createJournalNote({
        title: 'Empty Note',
        body: '   ',
      })
    ).rejects.toThrow('Note body cannot be empty.');
  });

  it('prohibits offline/demo fallback in production and throws explicit error', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      await expect(fetchJournalNotes(null)).rejects.toThrow(
        /Authentication required: please sign in/
      );
      await expect(
        createJournalNote({ title: 'Prod Leaf', body: 'Should fail' }, null)
      ).rejects.toThrow(/Authentication required: please sign in/);
      await expect(
        updateJournalNote({ id: 'note-1', title: 'Prod Leaf', body: 'Should fail' }, null)
      ).rejects.toThrow(/Authentication required: please sign in/);
      await expect(deleteJournalNote('note-1', null)).rejects.toThrow(
        /Authentication required: please sign in/
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('marks unauthenticated offline fallback entries as isDemo: true in dev/test', async () => {
    const created = await createJournalNote({
      title: 'Demo Leaf',
      body: 'Offline practice observation.',
    });

    expect(created.id).toBeDefined();
    expect(created.isDemo).toBe(true);
    expect(created.userId).toBe('demo_user');

    const notes = await fetchJournalNotes();
    expect(notes.length).toBeGreaterThanOrEqual(1);
    expect(notes[0].isDemo).toBe(true);
  });

  it('throws explicit error when Supabase select fails and does NOT return stale local notes', async () => {
    const mockFailingClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'auth_user_1' } },
          error: null,
        }),
      },
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: { message: 'Database connection terminated' } }),
        }),
      }),
    };

    await expect(fetchJournalNotes(mockFailingClient)).rejects.toThrow(
      /Failed to load journal leaves: Database connection terminated/
    );
  });

  it('throws explicit error when Supabase create fails and does NOT return a fake successful note', async () => {
    const mockFailingClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'auth_user_1' } },
          error: null,
        }),
      },
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'RLS check violation on insert' } }),
          }),
        }),
      }),
    };

    await expect(
      createJournalNote({ title: 'New Leaf', body: 'Trying to save' }, mockFailingClient)
    ).rejects.toThrow(/Failed to bind journal leaf: RLS check violation on insert/);
  });

  it('throws explicit error when Supabase update fails and does NOT return a fake successful note', async () => {
    const mockFailingClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'auth_user_1' } },
          error: null,
        }),
      },
      from: () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'Write permission denied' } }),
            }),
          }),
        }),
      }),
    };

    await expect(
      updateJournalNote({ id: 'leaf-99', title: 'Edit', body: 'New text' }, mockFailingClient)
    ).rejects.toThrow(/Failed to update journal leaf: Write permission denied/);
  });

  it('returns success=true ONLY after confirmed server deletion, and throws when 0 rows affected', async () => {
    const mockZeroRowsClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'auth_user_1' } },
          error: null,
        }),
      },
      from: () => ({
        delete: () => ({
          eq: () => ({
            select: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    };

    await expect(deleteJournalNote('nonexistent-leaf', mockZeroRowsClient)).rejects.toThrow(
      /Journal leaf could not be deleted or permission denied/
    );

    const mockSuccessClient = {
      auth: {
        getUser: async () => ({
          data: { user: { id: 'auth_user_1' } },
          error: null,
        }),
      },
      from: () => ({
        delete: () => ({
          eq: () => ({
            select: () => Promise.resolve({ data: [{ id: 'leaf-confirmed' }], error: null }),
          }),
        }),
      }),
    };

    const res = await deleteJournalNote('leaf-confirmed', mockSuccessClient);
    expect(res.success).toBe(true);
  });
});

describe('Journal V1 — Multi-User RLS Isolation & Full CRUD Persistence', () => {
  function createMockSupabaseHarness() {
    const databaseRows: any[] = [];

    function makeClientForUser(userId: string) {
      return {
        auth: {
          getUser: async () => ({
            data: { user: { id: userId } },
            error: null,
          }),
        },
        from: (table: string) => {
          if (table !== 'journal_notes') {
            throw new Error(`Unknown table: ${table}`);
          }
          return {
            select: (_cols: string) => ({
              order: (_col: string, _opts: any) => {
                const rows = databaseRows.filter((r) => r.user_id === userId);
                return Promise.resolve({ data: rows, error: null });
              },
            }),
            insert: (payload: any) => ({
              select: () => ({
                single: () => {
                  if (payload.user_id !== userId) {
                    return Promise.resolve({ data: null, error: { message: 'RLS check violation: user_id mismatch' } });
                  }
                  const row = {
                    id: `leaf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    user_id: payload.user_id,
                    title: payload.title,
                    body: payload.body,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  databaseRows.push(row);
                  return Promise.resolve({ data: row, error: null });
                },
              }),
            }),
            update: (payload: any) => ({
              eq: (field: string, val: any) => ({
                select: () => ({
                  single: () => {
                    const target = databaseRows.find((r) => r[field] === val && r.user_id === userId);
                    if (!target) {
                      return Promise.resolve({ data: null, error: { message: 'Row not found or permission denied' } });
                    }
                    Object.assign(target, payload);
                    return Promise.resolve({ data: target, error: null });
                  },
                }),
              }),
            }),
            delete: () => ({
              eq: (field: string, val: any) => ({
                select: (_cols?: string) => {
                  const idx = databaseRows.findIndex((r) => r[field] === val && r.user_id === userId);
                  if (idx === -1) {
                    return Promise.resolve({ data: [], error: null });
                  }
                  const removed = databaseRows.splice(idx, 1);
                  return Promise.resolve({ data: [{ id: removed[0].id }], error: null });
                },
              }),
            }),
          };
        },
      };
    }

    return {
      clientA: makeClientForUser('user_alice_1'),
      clientB: makeClientForUser('user_bob_2'),
      databaseRows,
    };
  }

  it('enforces complete CRUD lifecycle and strict cross-user RLS isolation', async () => {
    const { clientA, clientB, databaseRows } = createMockSupabaseHarness();

    // 1. User A creates a note
    const leafA = await createJournalNote(
      {
        title: "Alice's Field Notes",
        body: 'Observation on white cedar growth #craft',
      },
      clientA
    );
    expect(leafA.id).toBeDefined();
    expect(leafA.userId).toBe('user_alice_1');
    expect(databaseRows.length).toBe(1);

    // 2. User A retrieves notes from Supabase (simulating page refresh)
    const aliceNotesAfterCreate = await fetchJournalNotes(clientA);
    expect(aliceNotesAfterCreate.length).toBe(1);
    expect(aliceNotesAfterCreate[0].id).toBe(leafA.id);
    expect(aliceNotesAfterCreate[0].title).toBe("Alice's Field Notes");

    // 3. User B retrieves notes -> RLS isolation: User B cannot see User A's note
    const bobNotes = await fetchJournalNotes(clientB);
    expect(bobNotes.length).toBe(0);

    // 4. User B attempts to update User A's note -> denied by RLS
    await expect(
      updateJournalNote(
        {
          id: leafA.id,
          title: "Bob's Hack",
          body: 'Overwriting Alice note',
        },
        clientB
      )
    ).rejects.toThrow(/Row not found or permission denied/);

    // 5. User B attempts to delete User A's note -> denied by RLS (0 rows affected)
    await expect(deleteJournalNote(leafA.id, clientB)).rejects.toThrow(
      /Journal leaf could not be deleted or permission denied/
    );

    // Verify Alice's note is unchanged in the database
    expect(databaseRows[0].title).toBe("Alice's Field Notes");

    // 6. User A updates the note
    const updatedLeaf = await updateJournalNote(
      {
        id: leafA.id,
        title: "Alice's Field Notes — Evening Edition",
        body: 'Updated observation on white cedar growth with deeper roots #craft',
      },
      clientA
    );
    expect(updatedLeaf.title).toBe("Alice's Field Notes — Evening Edition");

    // 7. User A refreshes notes -> update persists from Supabase
    const aliceNotesAfterUpdate = await fetchJournalNotes(clientA);
    expect(aliceNotesAfterUpdate.length).toBe(1);
    expect(aliceNotesAfterUpdate[0].title).toBe("Alice's Field Notes — Evening Edition");

    // 8. User A deletes the note -> confirmed server deletion
    const deleteRes = await deleteJournalNote(leafA.id, clientA);
    expect(deleteRes.success).toBe(true);

    // 9. User A refreshes notes -> note remains deleted from Supabase
    const aliceNotesAfterDelete = await fetchJournalNotes(clientA);
    expect(aliceNotesAfterDelete.length).toBe(0);
    expect(databaseRows.length).toBe(0);

    // 10. Attempting to delete again fails because note no longer exists
    await expect(deleteJournalNote(leafA.id, clientA)).rejects.toThrow(
      /Journal leaf could not be deleted or permission denied/
    );
  });
});

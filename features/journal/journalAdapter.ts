/**
 * Journal V1 Data Adapter — Server-Authoritative Persistence
 * 
 * Invariants:
 * 1. Authoritative persistence backed strictly by Supabase Postgres `journal_notes`.
 * 2. On remote failure, throws explicit Error; NEVER silently swallows errors or falls back to stale local storage.
 * 3. Delete returns success=true ONLY upon confirmed server deletion.
 * 4. Offline/demo fallback is strictly gated behind non-production/test environments when unauthenticated,
 *    and every fallback entry is explicitly marked with `isDemo: true`.
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { JournalNote, CreateNoteInput, UpdateNoteInput } from './contracts';

export interface SupabaseClientLike {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: any }>;
  };
}

function isDevOrTest(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function getClient(passedClient?: any): any {
  if (passedClient && typeof passedClient.from === 'function') {
    return passedClient;
  }
  if (passedClient === null) {
    return null;
  }
  if (typeof window !== 'undefined') {
    try {
      return createBrowserClient();
    } catch {
      return null;
    }
  }
  return null;
}

// ── Development / Test Offline Demo Fallback ────────────────────────────────
// Strictly isolated to non-production environments when unauthenticated.
const DEMO_STORAGE_KEY = 'ember_journal_demo_notes_v1';
let memoryDemoNotes: JournalNote[] = [];

function getLocalDemoNotes(): JournalNote[] {
  if (!isDevOrTest()) return [];
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((n: JournalNote) => ({ ...n, isDemo: true })) : [];
      }
      return memoryDemoNotes;
    } catch {
      return memoryDemoNotes;
    }
  }
  return memoryDemoNotes;
}

function setLocalDemoNotes(notes: JournalNote[]): void {
  if (!isDevOrTest()) return;
  memoryDemoNotes = notes;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore quota errors in demo mode
    }
  }
}

function createLocalDemoNote(title: string | null, body: string): JournalNote {
  if (!isDevOrTest()) {
    throw new Error('Local demo storage is disabled in production.');
  }
  const now = new Date().toISOString();
  const demoNote: JournalNote = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `demo_leaf_${Date.now()}`,
    userId: 'demo_user',
    title,
    body,
    createdAt: now,
    updatedAt: now,
    isDemo: true,
  };
  const current = getLocalDemoNotes();
  setLocalDemoNotes([demoNote, ...current]);
  return demoNote;
}

function updateLocalDemoNote(id: string, title: string | null, body: string): JournalNote {
  if (!isDevOrTest()) {
    throw new Error('Local demo storage is disabled in production.');
  }
  const current = getLocalDemoNotes();
  const existing = current.find((n) => n.id === id);
  if (!existing) {
    throw new Error('Demo journal leaf not found.');
  }
  const updated: JournalNote = {
    ...existing,
    title,
    body,
    updatedAt: new Date().toISOString(),
    isDemo: true,
  };
  setLocalDemoNotes(current.map((n) => (n.id === updated.id ? updated : n)));
  return updated;
}

function deleteLocalDemoNote(id: string): { success: boolean } {
  if (!isDevOrTest()) {
    throw new Error('Local demo storage is disabled in production.');
  }
  const current = getLocalDemoNotes();
  const filtered = current.filter((n) => n.id !== id);
  if (filtered.length === current.length) {
    throw new Error('Demo journal leaf not found or already deleted.');
  }
  setLocalDemoNotes(filtered);
  return { success: true };
}

function mapRowToNote(row: any): JournalNote {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || null,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all journal notes for the authenticated user, ordered newest first.
 * Throws on failure; never silently falls back to stale local storage.
 */
export async function fetchJournalNotes(client?: any): Promise<JournalNote[]> {
  const supabase = getClient(client);

  if (!supabase) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to access your field journal.');
    }
    return getLocalDemoNotes();
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to access your field journal.');
    }
    return getLocalDemoNotes();
  }

  const { data, error } = await supabase
    .from('journal_notes')
    .select('id, user_id, title, body, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load journal leaves: ${error.message || JSON.stringify(error)}`);
  }

  return (data || []).map(mapRowToNote);
}

/**
 * Create a new journal note with optional title and plain text body.
 * Surfaces errors directly; never returns fake local results when authenticated.
 */
export async function createJournalNote(
  input: CreateNoteInput,
  client?: any
): Promise<JournalNote> {
  const cleanBody = input.body.trim();
  if (!cleanBody) {
    throw new Error('Note body cannot be empty.');
  }

  const cleanTitle = input.title ? input.title.trim() : null;
  const supabase = getClient(client);

  if (!supabase) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to bind a journal leaf.');
    }
    return createLocalDemoNote(cleanTitle, cleanBody);
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to bind a journal leaf.');
    }
    return createLocalDemoNote(cleanTitle, cleanBody);
  }

  const { data, error } = await supabase
    .from('journal_notes')
    .insert({
      user_id: user.id,
      title: cleanTitle,
      body: cleanBody,
    })
    .select('id, user_id, title, body, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Failed to bind journal leaf: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('Server did not return created journal leaf.');
  }

  return mapRowToNote(data);
}

/**
 * Update an existing journal note.
 * Confirms update on server; never returns fake local results when authenticated.
 */
export async function updateJournalNote(
  input: UpdateNoteInput,
  client?: any
): Promise<JournalNote> {
  const cleanBody = input.body.trim();
  if (!cleanBody) {
    throw new Error('Note body cannot be empty.');
  }

  const cleanTitle = input.title ? input.title.trim() : null;
  const supabase = getClient(client);

  if (!supabase) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to update a journal leaf.');
    }
    return updateLocalDemoNote(input.id, cleanTitle, cleanBody);
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to update a journal leaf.');
    }
    return updateLocalDemoNote(input.id, cleanTitle, cleanBody);
  }

  const { data, error } = await supabase
    .from('journal_notes')
    .update({
      title: cleanTitle,
      body: cleanBody,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('id, user_id, title, body, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Failed to update journal leaf: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('Journal leaf could not be updated or permission denied.');
  }

  return mapRowToNote(data);
}

/**
 * Delete a journal note by ID.
 * Returns { success: true } ONLY after confirmed server deletion.
 */
export async function deleteJournalNote(
  id: string,
  client?: any
): Promise<{ success: boolean }> {
  const supabase = getClient(client);

  if (!supabase) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to delete a journal leaf.');
    }
    return deleteLocalDemoNote(id);
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    if (!isDevOrTest()) {
      throw new Error('Authentication required: please sign in to delete a journal leaf.');
    }
    return deleteLocalDemoNote(id);
  }

  const { data, error } = await supabase
    .from('journal_notes')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete journal leaf: ${error.message || JSON.stringify(error)}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Journal leaf could not be deleted or permission denied.');
  }

  return { success: true };
}

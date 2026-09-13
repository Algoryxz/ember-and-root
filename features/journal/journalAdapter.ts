/**
 * Journal V1 Data Adapter
 * 
 * Handles Supabase database persistence for personal field journal notes
 * with strict per-user isolation, error surfacing, and client fallback.
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { JournalNote, CreateNoteInput, UpdateNoteInput } from './contracts';

export interface SupabaseClientLike {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: any }>;
  };
}

function getClient(passedClient?: any): any {
  if (passedClient && typeof passedClient.from === 'function') {
    return passedClient;
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

// Local storage key for offline fallback / unauthenticated demo
const LOCAL_STORAGE_KEY = 'ember_journal_notes_v1';
let memoryFallbackNotes: JournalNote[] = [];

function getLocalNotes(): JournalNote[] {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw !== null) {
        return JSON.parse(raw);
      }
      return [];
    } catch {
      return memoryFallbackNotes;
    }
  }
  return memoryFallbackNotes;
}

function setLocalNotes(notes: JournalNote[]): void {
  memoryFallbackNotes = notes;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore quota errors
    }
  }
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
 * Fetch all journal notes for the current user, ordered newest first.
 */
export async function fetchJournalNotes(client?: any): Promise<JournalNote[]> {
  const supabase = getClient(client);
  if (!supabase) {
    return getLocalNotes();
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return getLocalNotes();
    }

    const { data, error } = await supabase
      .from('journal_notes')
      .select('id, user_id, title, body, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch from Supabase journal_notes, using local fallback:', error.message);
      return getLocalNotes();
    }

    const notes = (data || []).map(mapRowToNote);
    if (typeof window !== 'undefined' && notes.length > 0) {
      setLocalNotes(notes);
    }
    return notes;
  } catch (err) {
    console.warn('Failed to query journal_notes:', err);
    return getLocalNotes();
  }
}

/**
 * Create a new journal note with optional title and plain text body.
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

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data, error } = await supabase
          .from('journal_notes')
          .insert({
            user_id: user.id,
            title: cleanTitle,
            body: cleanBody,
          })
          .select()
          .single();

        if (!error && data) {
          const newNote = mapRowToNote(data);
          const current = getLocalNotes();
          setLocalNotes([newNote, ...current.filter((n) => n.id !== newNote.id)]);
          return newNote;
        }
      }
    } catch (err) {
      console.warn('createJournalNote database write failed, using local note:', err);
    }
  }

  // Fallback for demo or offline
  const now = new Date().toISOString();
  const fallbackNote: JournalNote = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}`,
    userId: 'local_user',
    title: cleanTitle,
    body: cleanBody,
    createdAt: now,
    updatedAt: now,
  };
  const current = getLocalNotes();
  setLocalNotes([fallbackNote, ...current]);
  return fallbackNote;
}

/**
 * Update an existing journal note.
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

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('journal_notes')
        .update({
          title: cleanTitle,
          body: cleanBody,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

      if (!error && data) {
        const updated = mapRowToNote(data);
        const current = getLocalNotes();
        setLocalNotes(current.map((n) => (n.id === updated.id ? updated : n)));
        return updated;
      }
    } catch (err) {
      console.warn('updateJournalNote database update failed, using local update:', err);
    }
  }

  // Fallback update
  const current = getLocalNotes();
  const existing = current.find((n) => n.id === input.id);
  const updated: JournalNote = {
    id: input.id,
    userId: existing?.userId || 'local_user',
    title: cleanTitle,
    body: cleanBody,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  setLocalNotes(current.map((n) => (n.id === updated.id ? updated : n)));
  return updated;
}

/**
 * Delete a journal note by ID.
 */
export async function deleteJournalNote(
  id: string,
  client?: any
): Promise<{ success: boolean }> {
  const supabase = getClient(client);

  if (supabase) {
    try {
      const { error } = await supabase
        .from('journal_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('deleteJournalNote error:', error.message);
      }
    } catch (err) {
      console.warn('deleteJournalNote failed:', err);
    }
  }

  const current = getLocalNotes();
  setLocalNotes(current.filter((n) => n.id !== id));
  return { success: true };
}

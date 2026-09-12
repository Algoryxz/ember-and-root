'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { GameSnapshot, MutationResult, AttributeId, Effort, Cadence } from '@/game/contracts';

export type CompleteQuestResult = {
  success: boolean;
  result?: MutationResult;
  error?: string;
};

export type CreateQuestResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Server Action: Complete a Quest
 *
 * Executes the authoritative PostgreSQL RPC function `complete_quest`.
 * Idempotency is enforced via client-provided UUID `requestId`.
 * The database computes XP, Sparks, streak, Ember state, and level transitions.
 */
export async function completeQuestAction(
  requestId: string,
  questId: string,
  expectedOccurrence?: string
): Promise<CompleteQuestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: 'Session expired. Please sign in again.',
    };
  }

  const { data, error } = await supabase.rpc('complete_quest', {
    p_request_id: requestId,
    p_quest_id: questId,
    p_expected_occurrence: expectedOccurrence || null,
  });

  if (error) {
    return {
      success: false,
      error: error.message || 'Failed to complete quest.',
    };
  }

  return {
    success: true,
    result: data as MutationResult,
  };
}

/**
 * Server Action: Create a New Quest
 *
 * Validates inputs and inserts into the user's `quests` table.
 */
export async function createQuestAction(
  _prevState: CreateQuestResult | null,
  formData: FormData
): Promise<CreateQuestResult> {
  const title = (formData.get('title') as string || '').trim();
  const attribute = formData.get('attribute') as AttributeId;
  const effort = formData.get('effort') as Effort;
  const cadence = (formData.get('cadence') as Cadence) || 'daily';

  const fieldErrors: Record<string, string[]> = {};

  if (!title || title.length < 1 || title.length > 120) {
    fieldErrors.title = ['Title must be between 1 and 120 characters.'];
  }

  const validAttributes: AttributeId[] = ['mind', 'body', 'will', 'craft'];
  if (!validAttributes.includes(attribute)) {
    fieldErrors.attribute = ['Please select a valid attribute.'];
  }

  const validEfforts: Effort[] = ['quick', 'standard', 'deep'];
  if (!validEfforts.includes(effort)) {
    fieldErrors.effort = ['Please select an effort tier.'];
  }

  const validCadences: Cadence[] = ['once', 'daily'];
  if (!validCadences.includes(cadence)) {
    fieldErrors.cadence = ['Please select a valid cadence.'];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.from('quests').insert({
    user_id: user.id,
    title,
    attribute,
    effort,
    cadence,
  });

  if (error) {
    return {
      success: false,
      error: error.message || 'Failed to create quest.',
    };
  }

  return {
    success: true,
  };
}

/**
 * Server Action: Fetch Authoritative GameSnapshot
 */
export async function fetchGameSnapshotAction(): Promise<GameSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_game_snapshot');

  if (error || !data) {
    return null;
  }

  return data as GameSnapshot;
}

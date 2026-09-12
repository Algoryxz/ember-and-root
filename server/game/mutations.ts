/**
 * Server Progression Mutations
 * 
 * Invokes the atomic progression RPCs on Supabase.
 * Server actions call these functions to perform authoritative progression changes.
 */

import type { MutationResult } from '../../game/contracts';
import type { SupabaseServerClient } from '../supabase/server';

export type CompleteQuestParams = {
  requestId: string;
  questId: string;
  expectedOccurrence?: string | null;
};

export type UpdateProfilePreferencesParams = {
  preferences?: {
    sound?: boolean;
    reducedMotion?: boolean;
  };
  timezone?: string;
};

/**
 * Authoritative completeQuest mutation.
 * Calls the `complete_quest` PostgreSQL RPC function.
 * Identity is derived from auth.uid(). Idempotency fingerprint is derived on the server.
 */
export async function completeQuest(
  supabase: SupabaseServerClient,
  params: CompleteQuestParams
): Promise<MutationResult> {
  const { data, error } = await supabase.rpc<MutationResult>('complete_quest', {
    p_request_id: params.requestId,
    p_quest_id: params.questId,
    p_expected_occurrence: params.expectedOccurrence ?? null,
  });

  if (error) {
    throw new Error(`completeQuest failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('completeQuest returned no data');
  }

  return data;
}

/**
 * Updates mutable profile settings (preferences, timezone).
 * Calls the narrow `update_profile_preferences` PostgreSQL RPC function.
 */
export async function updateProfilePreferences(
  supabase: SupabaseServerClient,
  params: UpdateProfilePreferencesParams
): Promise<{ userId: string; timezone: string; preferences: Record<string, unknown> }> {
  const { data, error } = await supabase.rpc<{
    userId: string;
    timezone: string;
    preferences: Record<string, unknown>;
  }>('update_profile_preferences', {
    p_preferences: params.preferences ?? null,
    p_timezone: params.timezone ?? null,
  });

  if (error) {
    throw new Error(`updateProfilePreferences failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('updateProfilePreferences returned no data');
  }

  return data;
}

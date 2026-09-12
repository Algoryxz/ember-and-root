/**
 * Server Quest Operations
 * 
 * Defines types and server caller contracts for quest operations.
 */

import type { Quest, AttributeId, Effort, Cadence, MutationResult } from '../../game/contracts';
import type { SupabaseServerClient } from '../supabase/server';

export type CreateQuestInput = {
  requestId: string;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  trialId?: string | null;
};

export type UpdateQuestInput = {
  requestId: string;
  questId: string;
  expectedVersion?: number;
  version?: number;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  trialId?: string | null;
};

export type SoftDeleteQuestInput = {
  requestId: string;
  questId: string;
};

export async function fetchActiveQuests(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Quest[]> {
  const { data, error } = await supabase.from('quests').select('*').eq('user_id', userId).is('deleted_at', null);
  if (error) {
    throw new Error(`Failed to fetch quests: ${JSON.stringify(error)}`);
  }
  return (data as Quest[]) || [];
}

/**
 * Authoritative createQuest mutation RPC.
 */
export async function createQuest(
  supabase: SupabaseServerClient,
  input: CreateQuestInput
): Promise<MutationResult> {
  const { data, error } = await supabase.rpc<MutationResult>('create_quest', {
    p_request_id: input.requestId,
    p_title: input.title,
    p_attribute: input.attribute,
    p_effort: input.effort,
    p_cadence: input.cadence,
    p_trial_id: input.trialId ?? null,
  });

  if (error) {
    throw new Error(`createQuest failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('createQuest returned no data');
  }

  return data;
}

/**
 * Authoritative updateQuest mutation RPC with optimistic concurrency.
 */
export async function updateQuest(
  supabase: SupabaseServerClient,
  input: UpdateQuestInput
): Promise<MutationResult> {
  const expectedVersion = input.expectedVersion ?? input.version;
  if (expectedVersion === undefined) {
    throw new Error('updateQuest requires expectedVersion');
  }

  const { data, error } = await supabase.rpc<MutationResult>('update_quest', {
    p_request_id: input.requestId,
    p_quest_id: input.questId,
    p_expected_version: expectedVersion,
    p_title: input.title,
    p_attribute: input.attribute,
    p_effort: input.effort,
    p_cadence: input.cadence,
    p_trial_id: input.trialId ?? null,
  });

  if (error) {
    throw new Error(`updateQuest failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('updateQuest returned no data');
  }

  return data;
}

/**
 * Authoritative softDeleteQuest mutation RPC.
 */
export async function softDeleteQuest(
  supabase: SupabaseServerClient,
  input: SoftDeleteQuestInput
): Promise<MutationResult> {
  const { data, error } = await supabase.rpc<MutationResult>('soft_delete_quest', {
    p_request_id: input.requestId,
    p_quest_id: input.questId,
  });

  if (error) {
    throw new Error(`softDeleteQuest failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('softDeleteQuest returned no data');
  }

  return data;
}


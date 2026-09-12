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
  payloadHash?: string;
  expectedOccurrence?: string;
  trialEvidence?: Record<string, unknown>;
};

/**
 * Authoritative completeQuest mutation.
 * Calls the `complete_quest` PostgreSQL RPC function.
 */
export async function completeQuest(
  supabase: SupabaseServerClient,
  params: CompleteQuestParams
): Promise<MutationResult> {
  const { data, error } = await supabase.rpc<MutationResult>('complete_quest', {
    p_request_id: params.requestId,
    p_quest_id: params.questId,
    p_payload_hash: params.payloadHash ?? '',
    p_expected_occurrence: params.expectedOccurrence ?? null,
    p_trial_evidence: params.trialEvidence ?? {},
  });

  if (error) {
    throw new Error(`completeQuest failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('completeQuest returned no data');
  }

  return data;
}

import type {
  AttributeId,
  Cadence,
  Effort,
  GameSnapshot,
  MutationResult,
} from '../../game/contracts';
import { createClient as createBrowserClient } from '../../lib/supabase/client';

export interface SupabaseRpcClient {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
}

function getRpcClient(client?: any): SupabaseRpcClient {
  if (client && typeof client.rpc === 'function') {
    return client as SupabaseRpcClient;
  }
  if (typeof window !== 'undefined') {
    try {
      const browser = createBrowserClient();
      if (browser && typeof browser.rpc === 'function') {
        return (browser as unknown) as SupabaseRpcClient;
      }
    } catch {
      // Fall through to error
    }
  }
  throw new Error(
    'An authoritative database client (Supabase) is required for production Hearth mutations.'
  );
}

function resolveRequestId(requestId?: string, prefix: string = 'req-hearth'): string {
  if (requestId && requestId.trim().length > 0) {
    return requestId.trim();
  }
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Authoritative completeQuest action
 */
export async function completeQuestAction(
  questId: string,
  supabaseClient?: any,
  expectedOccurrence?: string | null,
  requestId?: string
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const reqId = resolveRequestId(requestId, 'req-complete');

  const { data, error } = await client.rpc('complete_quest', {
    p_request_id: reqId,
    p_quest_id: questId,
    p_expected_occurrence: expectedOccurrence ?? null,
  });

  if (error) {
    throw new Error(`complete_quest failed: ${error.message || JSON.stringify(error)}`);
  }
  if (!data) {
    throw new Error('complete_quest returned no data');
  }

  return data as MutationResult;
}

/**
 * Authoritative createQuest action
 */
export async function createQuestAction(
  input: {
    title: string;
    attribute: AttributeId;
    effort: Effort;
    cadence: Cadence;
    trialId?: string | null;
  },
  supabaseClient?: any,
  requestId?: string
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const reqId = resolveRequestId(requestId, 'req-create');

  const { data, error } = await client.rpc('create_quest', {
    p_request_id: reqId,
    p_title: input.title,
    p_attribute: input.attribute,
    p_effort: input.effort,
    p_cadence: input.cadence,
    p_trial_id: input.trialId ?? null,
  });

  if (error) {
    throw new Error(`create_quest failed: ${error.message || JSON.stringify(error)}`);
  }
  if (!data) {
    throw new Error('create_quest returned no data');
  }

  return data as MutationResult;
}

/**
 * Authoritative updateQuest action
 */
export async function updateQuestAction(
  input: {
    questId: string;
    expectedVersion: number;
    title: string;
    attribute: AttributeId;
    effort: Effort;
    cadence: Cadence;
    trialId?: string | null;
  },
  supabaseClient?: any,
  requestId?: string
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const reqId = resolveRequestId(requestId, 'req-update');

  const { data, error } = await client.rpc('update_quest', {
    p_request_id: reqId,
    p_quest_id: input.questId,
    p_expected_version: input.expectedVersion,
    p_title: input.title,
    p_attribute: input.attribute,
    p_effort: input.effort,
    p_cadence: input.cadence,
    p_trial_id: input.trialId ?? null,
  });

  if (error) {
    throw new Error(`update_quest failed: ${error.message || JSON.stringify(error)}`);
  }
  if (!data) {
    throw new Error('update_quest returned no data');
  }

  return data as MutationResult;
}

/**
 * Authoritative softDeleteQuest action
 */
export async function softDeleteQuestAction(
  questId: string,
  supabaseClient?: any,
  requestId?: string
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const reqId = resolveRequestId(requestId, 'req-del');

  const { data, error } = await client.rpc('soft_delete_quest', {
    p_request_id: reqId,
    p_quest_id: questId,
  });

  if (error) {
    throw new Error(`soft_delete_quest failed: ${error.message || JSON.stringify(error)}`);
  }
  if (!data) {
    throw new Error('soft_delete_quest returned no data');
  }

  return data as MutationResult;
}

/**
 * Authoritative fetchGameSnapshot action
 */
export async function fetchGameSnapshotAction(
  supabaseClient?: any
): Promise<GameSnapshot> {
  const client = getRpcClient(supabaseClient);

  const { data, error } = await client.rpc('get_game_snapshot');

  if (error) {
    throw new Error(`get_game_snapshot failed: ${error.message || JSON.stringify(error)}`);
  }
  if (!data) {
    throw new Error('get_game_snapshot returned no data');
  }

  return data as GameSnapshot;
}

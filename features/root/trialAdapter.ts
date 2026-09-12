import type { AttributeId, GameSnapshot, MutationResult, Specialization } from '../../game/contracts.ts';

/**
 * Authoritative Production Mutation Adapter for Root Trials & Specializations
 *
 * Calls PostgreSQL / Supabase RPC functions:
 * 1. `chooseSpecializationAction` -> RPC `choose_specialization`
 * 2. `startTrialAction` -> RPC `start_trial`
 * 3. `progressSessionTrialAction` -> Dedicated Trial RPC `progress_trial`
 * 4. `recordMilestoneAction` -> Dedicated Trial RPC `record_trial_milestone`
 * 5. `claimCrestAction` -> RPC `claim_trial`
 *
 * NOTE:
 * - Silent local fallbacks are prohibited in production mutation actions.
 * - If an RPC fails, it surfaces the error and does NOT mutate GameSnapshot locally.
 * - complete_quest is strictly for quest completion and NO LONGER accepts p_trial_evidence.
 * - For local visual mock and preview simulations, see `trialFixtureAdapter.ts`.
 */

export interface SupabaseRpcClient {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
}

function getRpcClient(client?: any): SupabaseRpcClient {
  if (!client || typeof client.rpc !== 'function') {
    throw new Error(
      'An authoritative database client (Supabase) is required for production mutations. Use trialFixtureAdapter for dev/mock previews.'
    );
  }
  return client as SupabaseRpcClient;
}

export async function chooseSpecializationAction(
  _snapshot: GameSnapshot,
  attribute: AttributeId,
  specialization: Specialization,
  supabaseClient?: any
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-spec-${Date.now()}`;

  const { data, error } = await client.rpc('choose_specialization', {
    p_request_id: requestId,
    p_attribute: attribute,
    p_specialization: specialization,
  });

  if (error) {
    throw new Error(`choose_specialization failed: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('choose_specialization returned empty data');
  }

  return data as MutationResult;
}

export async function startTrialAction(
  _snapshot: GameSnapshot,
  attribute: AttributeId,
  specialization: Specialization,
  supabaseClient?: any
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-start-${Date.now()}`;

  const { data, error } = await client.rpc('start_trial', {
    p_request_id: requestId,
    p_attribute: attribute,
    p_specialization: specialization,
  });

  if (error) {
    throw new Error(`start_trial failed: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('start_trial returned empty data');
  }

  return data as MutationResult;
}

export async function progressSessionTrialAction(
  _snapshot: GameSnapshot,
  attribute: AttributeId,
  supabaseClient?: any
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-prog-${Date.now()}`;

  // Dedicated Trial mutation — complete_quest NO LONGER accepts p_trial_evidence
  const { data, error } = await client.rpc('progress_trial', {
    p_request_id: requestId,
    p_attribute: attribute,
  });

  if (error) {
    throw new Error(`progress_trial failed: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('progress_trial returned empty data');
  }

  return data as MutationResult;
}

export async function recordMilestoneAction(
  _snapshot: GameSnapshot,
  attribute: AttributeId,
  milestoneText: string,
  supabaseClient?: any
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-ms-${Date.now()}`;

  // Dedicated Trial mutation — complete_quest NO LONGER accepts p_trial_evidence
  const { data, error } = await client.rpc('record_trial_milestone', {
    p_request_id: requestId,
    p_attribute: attribute,
    p_milestone_text: milestoneText,
  });

  if (error) {
    throw new Error(`record_trial_milestone failed: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('record_trial_milestone returned empty data');
  }

  return data as MutationResult;
}

export async function claimCrestAction(
  _snapshot: GameSnapshot,
  attribute: AttributeId,
  supabaseClient?: any
): Promise<MutationResult> {
  const client = getRpcClient(supabaseClient);
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-claim-${Date.now()}`;

  const { data, error } = await client.rpc('claim_trial', {
    p_request_id: requestId,
    p_attribute: attribute,
  });

  if (error) {
    throw new Error(`claim_trial failed: ${error.message || JSON.stringify(error)}`);
  }

  if (!data) {
    throw new Error('claim_trial returned empty data');
  }

  return data as MutationResult;
}

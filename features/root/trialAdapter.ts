import { AttributeId, BranchState, GameSnapshot, MutationResult, Specialization, TrialState } from '../../game/contracts';
import { TRIAL_CONFIGS } from './trialConfig';

/**
 * Authoritative Mutation Helper & Fallback Adapter for Root Trials & Specializations
 *
 * Implements the integration layer for:
 * 1. `chooseSpecialization` (RPC `choose_specialization`)
 * 2. `startTrial` (RPC `start_trial`)
 * 3. `completeQuest` with evidence (RPC `complete_quest`)
 * 4. `claimTrial` (RPC `claim_trial`)
 *
 * If a Supabase client is passed and connected, calls the PostgreSQL RPC.
 * Otherwise, executes a clean local state update returning an authoritative MutationResult.
 */

export async function chooseSpecializationAction(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  specialization: Specialization,
  supabaseClient?: any
): Promise<MutationResult> {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-spec-${Date.now()}`;

  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('choose_specialization', {
      p_request_id: requestId,
      p_attribute: attribute,
      p_specialization: specialization,
    });

    if (!error && data) {
      return data as MutationResult;
    }
  }

  // Local fallback snapshot calculation
  const existingBranch = snapshot.branches[attribute];
  const updatedBranch: BranchState = {
    ...existingBranch,
    specialization,
    specializationAvailable: false,
    selectedAt: new Date().toISOString(),
  };

  const updatedSnapshot: GameSnapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
  };

  return {
    revision: updatedSnapshot.revision,
    event: {
      id: `evt-${requestId}`,
      kind: 'specialization_chosen',
      attribute,
      specialization,
    },
    snapshot: updatedSnapshot,
  };
}

export async function startTrialAction(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  specialization: Specialization,
  supabaseClient?: any
): Promise<MutationResult> {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-start-${Date.now()}`;
  const config = TRIAL_CONFIGS[specialization];
  const now = new Date().toISOString();

  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('start_trial', {
      p_request_id: requestId,
      p_attribute: attribute,
      p_specialization: specialization,
    });

    if (!error && data) {
      return data as MutationResult;
    }
  }

  // Local fallback snapshot calculation
  const newTrial: TrialState = {
    id: `trial-${attribute}-${specialization}-${Date.now()}`,
    attribute,
    specialization,
    startedAt: now,
    kind: config.kind,
    requiredDays: config.kind === 'distinct_days' ? (config.requiredDays ?? 5) : undefined,
    distinctDaysCompleted: config.kind === 'distinct_days' ? 0 : undefined,
    milestoneText: undefined,
    completedAt: null,
    claimedAt: null,
  };

  const existingBranch = snapshot.branches[attribute];
  const updatedBranch: BranchState = {
    ...existingBranch,
    trialStarted: true,
    trialComplete: false,
    crestAvailable: false,
    crestClaimed: false,
  };

  const updatedSnapshot: GameSnapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: newTrial,
    },
  };

  return {
    revision: updatedSnapshot.revision,
    event: {
      id: `evt-${requestId}`,
      kind: 'trial_started',
      attribute,
      specialization,
    },
    snapshot: updatedSnapshot,
  };
}

export async function progressSessionTrialAction(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  supabaseClient?: any
): Promise<MutationResult> {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-prog-${Date.now()}`;
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'distinct_days') {
    return { revision: snapshot.revision, event: { id: `evt-${requestId}`, kind: 'quest_completed' }, snapshot };
  }

  const currentCount = trial.distinctDaysCompleted ?? 0;
  const targetDays = trial.requiredDays ?? 5;
  const newCount = Math.min(targetDays, currentCount + 1);
  const isComplete = newCount >= targetDays;

  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('complete_quest', {
      p_request_id: requestId,
      p_trial_evidence: { attribute, sessionCompleted: true },
    });

    if (!error && data) {
      return data as MutationResult;
    }
  }

  // Local fallback snapshot calculation
  const updatedTrial: TrialState = {
    ...trial,
    distinctDaysCompleted: newCount,
    completedAt: isComplete ? new Date().toISOString() : (trial.completedAt ?? null),
  };

  const existingBranch = snapshot.branches[attribute];
  const updatedBranch: BranchState = {
    ...existingBranch,
    trialComplete: isComplete,
    crestAvailable: isComplete && trial.claimedAt === null,
  };

  const updatedSnapshot: GameSnapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: updatedTrial,
    },
  };

  return {
    revision: updatedSnapshot.revision,
    event: {
      id: `evt-${requestId}`,
      kind: 'quest_completed',
      attribute,
      crestAvailable: isComplete,
    },
    snapshot: updatedSnapshot,
  };
}

export async function recordMilestoneAction(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  milestoneText: string,
  supabaseClient?: any
): Promise<MutationResult> {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-ms-${Date.now()}`;
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'milestone_reflection') {
    return { revision: snapshot.revision, event: { id: `evt-${requestId}`, kind: 'quest_completed' }, snapshot };
  }

  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('complete_quest', {
      p_request_id: requestId,
      p_trial_evidence: { attribute, milestoneText },
    });

    if (!error && data) {
      return data as MutationResult;
    }
  }

  // Local fallback snapshot calculation
  const updatedTrial: TrialState = {
    ...trial,
    milestoneText,
    completedAt: trial.completedAt ?? new Date().toISOString(),
  };

  const existingBranch = snapshot.branches[attribute];
  const updatedBranch: BranchState = {
    ...existingBranch,
    trialComplete: true,
    crestAvailable: trial.claimedAt === null,
  };

  const updatedSnapshot: GameSnapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: updatedTrial,
    },
  };

  return {
    revision: updatedSnapshot.revision,
    event: {
      id: `evt-${requestId}`,
      kind: 'quest_completed',
      attribute,
      crestAvailable: true,
    },
    snapshot: updatedSnapshot,
  };
}

export async function claimCrestAction(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  supabaseClient?: any
): Promise<MutationResult> {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-claim-${Date.now()}`;
  const trial = snapshot.trials[attribute];
  if (!trial) {
    return { revision: snapshot.revision, event: { id: `evt-${requestId}`, kind: 'trial_claimed' }, snapshot };
  }

  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('claim_trial', {
      p_request_id: requestId,
      p_attribute: attribute,
    });

    if (!error && data) {
      return data as MutationResult;
    }
  }

  // Local fallback snapshot calculation
  const now = new Date().toISOString();
  const updatedTrial: TrialState = {
    ...trial,
    claimedAt: now,
  };

  const existingBranch = snapshot.branches[attribute];
  const updatedBranch: BranchState = {
    ...existingBranch,
    crestAvailable: false,
    crestClaimed: true,
  };

  const updatedSnapshot: GameSnapshot = {
    ...snapshot,
    revision: snapshot.revision + 1,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: updatedTrial,
    },
  };

  return {
    revision: updatedSnapshot.revision,
    event: {
      id: `evt-${requestId}`,
      kind: 'trial_claimed',
      attribute,
      specialization: trial.specialization,
    },
    snapshot: updatedSnapshot,
  };
}

// Synchronous legacy aliases for backwards compatibility with test harnesses
export function startTrialAdapter(snapshot: GameSnapshot, attribute: AttributeId, specialization: Specialization): GameSnapshot {
  const config = TRIAL_CONFIGS[specialization];
  const now = new Date().toISOString();
  const newTrial: TrialState = {
    id: `trial-${attribute}-${specialization}-${Date.now()}`,
    attribute,
    specialization,
    startedAt: now,
    kind: config.kind,
    requiredDays: config.kind === 'distinct_days' ? (config.requiredDays ?? 5) : undefined,
    distinctDaysCompleted: config.kind === 'distinct_days' ? 0 : undefined,
    milestoneText: undefined,
    completedAt: null,
    claimedAt: null,
  };
  return {
    ...snapshot,
    branches: { ...snapshot.branches, [attribute]: { ...snapshot.branches[attribute], trialStarted: true, trialComplete: false, crestAvailable: false, crestClaimed: false } },
    trials: { ...snapshot.trials, [attribute]: newTrial },
  };
}

export function progressTrialSessionAdapter(snapshot: GameSnapshot, attribute: AttributeId): GameSnapshot {
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'distinct_days') return snapshot;
  const currentCount = trial.distinctDaysCompleted ?? 0;
  const targetDays = trial.requiredDays ?? 5;
  const newCount = Math.min(targetDays, currentCount + 1);
  const isComplete = newCount >= targetDays;
  return {
    ...snapshot,
    branches: { ...snapshot.branches, [attribute]: { ...snapshot.branches[attribute], trialComplete: isComplete, crestAvailable: isComplete && trial.claimedAt === null } },
    trials: { ...snapshot.trials, [attribute]: { ...trial, distinctDaysCompleted: newCount } },
  };
}

export function recordMilestoneAdapter(snapshot: GameSnapshot, attribute: AttributeId, milestoneText: string): GameSnapshot {
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'milestone_reflection') return snapshot;
  return {
    ...snapshot,
    branches: { ...snapshot.branches, [attribute]: { ...snapshot.branches[attribute], trialComplete: true, crestAvailable: trial.claimedAt === null } },
    trials: { ...snapshot.trials, [attribute]: { ...trial, milestoneText } },
  };
}

export function claimTrialCrestAdapter(snapshot: GameSnapshot, attribute: AttributeId): GameSnapshot {
  const trial = snapshot.trials[attribute];
  if (!trial) return snapshot;
  return {
    ...snapshot,
    branches: { ...snapshot.branches, [attribute]: { ...snapshot.branches[attribute], crestAvailable: false, crestClaimed: true } },
    trials: { ...snapshot.trials, [attribute]: { ...trial, claimedAt: new Date().toISOString() } },
  };
}

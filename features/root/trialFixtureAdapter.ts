import type {
  AttributeId,
  BranchState,
  GameSnapshot,
  MutationResult,
  Specialization,
  TrialState,
} from '../../game/contracts.ts';
import { TRIAL_CONFIGS } from './trialConfig.ts';

/**
 * Fixture & Mock Mutation Adapters for Visual Preview and Tests
 *
 * NOTE: This module is STRICTLY for local/dev visual previews and unit testing.
 * Production application code must use `trialAdapter.ts` which calls authoritative RPCs.
 */

export function chooseSpecializationFixtureAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  specialization: Specialization
): MutationResult {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-spec-${Date.now()}`;
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

export function startTrialFixtureAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  specialization: Specialization
): MutationResult {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-start-${Date.now()}`;
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

export function progressSessionTrialFixtureAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId
): MutationResult {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-prog-${Date.now()}`;
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'distinct_days') {
    return { revision: snapshot.revision, event: { id: `evt-${requestId}`, kind: 'quest_completed' }, snapshot };
  }

  const currentCount = trial.distinctDaysCompleted ?? 0;
  const targetDays = trial.requiredDays ?? 5;
  const newCount = Math.min(targetDays, currentCount + 1);
  const isComplete = newCount >= targetDays;

  const existingBranch = snapshot.branches[attribute];
  // Authoritative Rule: branch.xp >= 160 AND completedAt != null AND claimedAt == null
  const isCrestAvailable = existingBranch.xp >= 160 && isComplete && trial.claimedAt === null;

  const updatedTrial: TrialState = {
    ...trial,
    distinctDaysCompleted: newCount,
    completedAt: isComplete ? (trial.completedAt ?? new Date().toISOString()) : null,
  };

  const updatedBranch: BranchState = {
    ...existingBranch,
    trialComplete: isComplete,
    crestAvailable: isCrestAvailable,
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
      crestAvailable: isCrestAvailable,
    },
    snapshot: updatedSnapshot,
  };
}

export function recordMilestoneFixtureAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  milestoneText: string
): MutationResult {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-ms-${Date.now()}`;
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'milestone_reflection') {
    return { revision: snapshot.revision, event: { id: `evt-${requestId}`, kind: 'quest_completed' }, snapshot };
  }

  const existingBranch = snapshot.branches[attribute];
  const now = trial.completedAt ?? new Date().toISOString();

  // Authoritative Rule: branch.xp >= 160 AND completedAt != null AND claimedAt == null
  const isCrestAvailable = existingBranch.xp >= 160 && trial.claimedAt === null;

  const updatedTrial: TrialState = {
    ...trial,
    milestoneText,
    completedAt: now,
  };

  const updatedBranch: BranchState = {
    ...existingBranch,
    trialComplete: true,
    crestAvailable: isCrestAvailable,
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
      crestAvailable: isCrestAvailable,
    },
    snapshot: updatedSnapshot,
  };
}

export function claimCrestFixtureAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId
): MutationResult {
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-claim-${Date.now()}`;
  const trial = snapshot.trials[attribute];
  if (!trial) {
    return { revision: snapshot.revision, event: { id: `evt-${requestId}`, kind: 'trial_claimed' }, snapshot };
  }

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
  return startTrialFixtureAdapter(snapshot, attribute, specialization).snapshot;
}

export function progressTrialSessionAdapter(snapshot: GameSnapshot, attribute: AttributeId): GameSnapshot {
  return progressSessionTrialFixtureAdapter(snapshot, attribute).snapshot;
}

export function recordMilestoneAdapter(snapshot: GameSnapshot, attribute: AttributeId, milestoneText: string): GameSnapshot {
  return recordMilestoneFixtureAdapter(snapshot, attribute, milestoneText).snapshot;
}

export function claimTrialCrestAdapter(snapshot: GameSnapshot, attribute: AttributeId): GameSnapshot {
  return claimCrestFixtureAdapter(snapshot, attribute).snapshot;
}

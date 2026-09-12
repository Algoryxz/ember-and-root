import { AttributeId, BranchState, GameSnapshot, Specialization, TrialState } from '../../game/contracts';
import { TRIAL_CONFIGS } from './trialConfig';

/**
 * Isolated Trial UI Adapter Layer
 * Simulates authoritative server mutations (`start_trial` and `claim_trial`)
 * returning an updated GameSnapshot/BranchState adhering 100% to game/contracts.ts.
 */

export function startTrialAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  specialization: Specialization
): GameSnapshot {
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

  return {
    ...snapshot,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: newTrial,
    },
  };
}

export function progressTrialSessionAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId
): GameSnapshot {
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'distinct_days') return snapshot;

  const currentCount = trial.distinctDaysCompleted ?? 0;
  const targetDays = trial.requiredDays ?? 5;
  const newCount = Math.min(targetDays, currentCount + 1);
  const isComplete = newCount >= targetDays;

  const updatedTrial: TrialState = {
    ...trial,
    distinctDaysCompleted: newCount,
  };

  const existingBranch = snapshot.branches[attribute];
  const updatedBranch: BranchState = {
    ...existingBranch,
    trialComplete: isComplete,
    crestAvailable: isComplete && trial.claimedAt === null,
  };

  return {
    ...snapshot,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: updatedTrial,
    },
  };
}

export function recordMilestoneAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId,
  milestoneText: string
): GameSnapshot {
  const trial = snapshot.trials[attribute];
  if (!trial || trial.kind !== 'milestone_reflection') return snapshot;

  const updatedTrial: TrialState = {
    ...trial,
    milestoneText,
  };

  const existingBranch = snapshot.branches[attribute];
  const updatedBranch: BranchState = {
    ...existingBranch,
    trialComplete: true,
    crestAvailable: trial.claimedAt === null,
  };

  return {
    ...snapshot,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: updatedTrial,
    },
  };
}

export function claimTrialCrestAdapter(
  snapshot: GameSnapshot,
  attribute: AttributeId
): GameSnapshot {
  const trial = snapshot.trials[attribute];
  if (!trial) return snapshot;

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

  return {
    ...snapshot,
    branches: {
      ...snapshot.branches,
      [attribute]: updatedBranch,
    },
    trials: {
      ...snapshot.trials,
      [attribute]: updatedTrial,
    },
  };
}

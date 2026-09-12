import type { BranchState, RootTreeState } from './types.ts';

/**
 * Legacy Mind fixtures adapting to canonical BranchState
 */
export const INITIAL_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 70,
  mindXP: 70,
  specialization: null,
  selectedSpecialization: null,
  selectedAt: null,
  specializationAvailable: false,
  sproutAvailable: true,
  crestAvailable: false,
  trialStarted: false,
  trialComplete: false,
  crestClaimed: false,
};

export const AVAILABLE_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 90,
  mindXP: 90,
  specialization: null,
  selectedSpecialization: null,
  selectedAt: null,
  specializationAvailable: true,
  sproutAvailable: true,
  crestAvailable: false,
  trialStarted: false,
  trialComplete: false,
  crestClaimed: false,
};

export const SCHOLAR_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 160,
  mindXP: 160,
  specialization: 'scholar',
  selectedSpecialization: 'scholar',
  selectedAt: new Date().toISOString(),
  specializationAvailable: false,
  sproutAvailable: true,
  crestAvailable: true,
  trialStarted: true,
  trialComplete: true,
  crestClaimed: false,
};

export const EXPLORER_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 160,
  mindXP: 160,
  specialization: 'explorer',
  selectedSpecialization: 'explorer',
  selectedAt: new Date().toISOString(),
  specializationAvailable: false,
  sproutAvailable: true,
  crestAvailable: true,
  trialStarted: true,
  trialComplete: true,
  crestClaimed: false,
};

/**
 * Initial Root Tree State for all 4 attributes (70 XP each, specialization unavailable)
 */
export const INITIAL_TREE_STATE: RootTreeState = {
  branches: {
    mind: {
      attribute: 'mind',
      xp: 70,
      specialization: null,
      selectedAt: null,
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 70,
      specialization: null,
      selectedAt: null,
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 70,
      specialization: null,
      selectedAt: null,
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 70,
      specialization: null,
      selectedAt: null,
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
  },
};

/**
 * Root Tree State where all 4 attributes reach specialization threshold (90 XP each)
 */
export const SPEC_READY_TREE_STATE: RootTreeState = {
  branches: {
    mind: {
      attribute: 'mind',
      xp: 90,
      specialization: null,
      selectedAt: null,
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 90,
      specialization: null,
      selectedAt: null,
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 90,
      specialization: null,
      selectedAt: null,
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 90,
      specialization: null,
      selectedAt: null,
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
  },
};

/**
 * Root Tree State with active specializations & crest availability for each branch
 */
export const SPECIALIZED_TREE_STATE: RootTreeState = {
  branches: {
    mind: {
      attribute: 'mind',
      xp: 160,
      specialization: 'scholar',
      selectedAt: new Date().toISOString(),
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      trialStarted: true,
      trialComplete: true,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 160,
      specialization: 'endurance',
      selectedAt: new Date().toISOString(),
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      trialStarted: true,
      trialComplete: true,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 160,
      specialization: 'focus',
      selectedAt: new Date().toISOString(),
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      trialStarted: true,
      trialComplete: true,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 160,
      specialization: 'builder',
      selectedAt: new Date().toISOString(),
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      trialStarted: true,
      trialComplete: true,
      crestClaimed: false,
    },
  },
};

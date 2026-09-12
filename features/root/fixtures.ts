import { BranchState, RootTreeState } from './types';

/**
 * Legacy Mind fixtures adapting to canonical BranchState
 */
export const INITIAL_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 70,
  mindXP: 70,
  specialization: null,
  selectedSpecialization: null,
  specializationAvailable: false,
  sproutAvailable: true,
  crestAvailable: false,
  crestClaimed: false,
};

export const AVAILABLE_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 90,
  mindXP: 90,
  specialization: null,
  selectedSpecialization: null,
  specializationAvailable: true,
  sproutAvailable: true,
  crestAvailable: false,
  crestClaimed: false,
};

export const SCHOLAR_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 90,
  mindXP: 90,
  specialization: 'scholar',
  selectedSpecialization: 'scholar',
  specializationAvailable: false,
  sproutAvailable: true,
  crestAvailable: true,
  crestClaimed: false,
};

export const EXPLORER_MIND_STATE: BranchState = {
  attribute: 'mind',
  xp: 90,
  mindXP: 90,
  specialization: 'explorer',
  selectedSpecialization: 'explorer',
  specializationAvailable: false,
  sproutAvailable: true,
  crestAvailable: true,
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
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 70,
      specialization: null,
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 70,
      specialization: null,
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 70,
      specialization: null,
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: false,
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
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 90,
      specialization: null,
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 90,
      specialization: null,
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 90,
      specialization: null,
      specializationAvailable: true,
      sproutAvailable: true,
      crestAvailable: false,
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
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 160,
      specialization: 'endurance',
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 160,
      specialization: 'focus',
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 160,
      specialization: 'builder',
      specializationAvailable: false,
      sproutAvailable: true,
      crestAvailable: true,
      crestClaimed: false,
    },
  },
};

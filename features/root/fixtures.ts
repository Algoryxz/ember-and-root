import { BranchState, MindBranchState, RootTreeState } from './types';

/**
 * Initial fixture state for Mind (70 XP)
 */
export const INITIAL_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  xp: 70,
  mindXP: 70,
  selectedSpecialization: null,
  specializationAvailable: false,
};

/**
 * Fixture state for Mind when specialization threshold is reached (90 XP)
 */
export const AVAILABLE_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  xp: 90,
  mindXP: 90,
  selectedSpecialization: null,
  specializationAvailable: true,
};

/**
 * Fixture state when Scholar specialization is chosen
 */
export const SCHOLAR_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  xp: 90,
  mindXP: 90,
  selectedSpecialization: 'scholar',
  specializationAvailable: false,
};

/**
 * Fixture state when Explorer specialization is chosen
 */
export const EXPLORER_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  xp: 90,
  mindXP: 90,
  selectedSpecialization: 'explorer',
  specializationAvailable: false,
};

/**
 * Initial Root Tree State for all 4 attributes (70 XP each)
 */
export const INITIAL_TREE_STATE: RootTreeState = {
  branches: {
    mind: {
      attribute: 'mind',
      xp: 70,
      selectedSpecialization: null,
      specializationAvailable: false,
    },
    body: {
      attribute: 'body',
      xp: 70,
      selectedSpecialization: null,
      specializationAvailable: false,
    },
    will: {
      attribute: 'will',
      xp: 70,
      selectedSpecialization: null,
      specializationAvailable: false,
    },
    craft: {
      attribute: 'craft',
      xp: 70,
      selectedSpecialization: null,
      specializationAvailable: false,
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
      selectedSpecialization: null,
      specializationAvailable: true,
    },
    body: {
      attribute: 'body',
      xp: 90,
      selectedSpecialization: null,
      specializationAvailable: true,
    },
    will: {
      attribute: 'will',
      xp: 90,
      selectedSpecialization: null,
      specializationAvailable: true,
    },
    craft: {
      attribute: 'craft',
      xp: 90,
      selectedSpecialization: null,
      specializationAvailable: true,
    },
  },
};

/**
 * Root Tree State with active specializations chosen for each branch
 */
export const SPECIALIZED_TREE_STATE: RootTreeState = {
  branches: {
    mind: {
      attribute: 'mind',
      xp: 90,
      selectedSpecialization: 'scholar',
      specializationAvailable: false,
    },
    body: {
      attribute: 'body',
      xp: 90,
      selectedSpecialization: 'endurance',
      specializationAvailable: false,
    },
    will: {
      attribute: 'will',
      xp: 90,
      selectedSpecialization: 'focus',
      specializationAvailable: false,
    },
    craft: {
      attribute: 'craft',
      xp: 90,
      selectedSpecialization: 'builder',
      specializationAvailable: false,
    },
  },
};

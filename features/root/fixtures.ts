import { MindBranchState } from './types';

/**
 * Initial fixture state (70 Mind XP)
 * Sprout active at First Thought, Specialization choice locked.
 */
export const INITIAL_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  mindXP: 70,
  selectedSpecialization: null,
  specializationAvailable: false,
};

/**
 * Test fixture state 1 (90 Mind XP - Specialization Threshold Reached)
 * Specialization choice (Scholar / Explorer) becomes available.
 */
export const AVAILABLE_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  mindXP: 90,
  selectedSpecialization: null,
  specializationAvailable: true,
};

/**
 * Test fixture state 2 (Scholar Specialization Chosen)
 * Scholar path illuminated; Explorer path unchosen/faint.
 */
export const SCHOLAR_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  mindXP: 90,
  selectedSpecialization: 'scholar',
  specializationAvailable: false,
};

/**
 * Test fixture state 3 (Explorer Specialization Chosen)
 * Explorer path illuminated; Scholar path unchosen/faint.
 */
export const EXPLORER_MIND_STATE: MindBranchState = {
  attribute: 'mind',
  mindXP: 90,
  selectedSpecialization: 'explorer',
  specializationAvailable: false,
};

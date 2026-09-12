/**
 * Canonical Game Contracts
 * 
 * Re-exported from @/game/contracts and @/game/fixtures/snapshot.
 * Eliminates duplicate contract definitions across workstreams.
 */

export type {
  AttributeId,
  Cadence,
  Effort,
  EmberState,
  Specialization,
  Quest,
  HearthQuest,
  BranchState,
  TrialState,
  TrialKind,
  Item,
  InventoryState,
  GameSnapshot,
  MutationEventKind,
  MutationEvent,
  MutationResult,
} from '../../game/contracts';

export { DEMO_SNAPSHOT, DEMO_SNAPSHOT as INITIAL_FIXTURE_SNAPSHOT } from '../../game/fixtures/snapshot';

export {
  completeQuestAction,
  createQuestAction,
  updateQuestAction,
  softDeleteQuestAction,
  fetchGameSnapshotAction,
  type CreateQuestParams,
  type UpdateQuestParams,
  type SupabaseClientLike,
} from './hearthAdapter';

export { simulateServerCompletion } from './hearthFixtureAdapter';

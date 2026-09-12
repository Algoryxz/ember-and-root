/**
 * Ember & Root — Local Hearth Fixture Contracts & Adapter
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * 
 * TEMPORARY ADAPTER:
 * This file mirrors docs/CONTRACTS.md exactly until Smarak publishes
 * @/game/contracts and @/game/fixtures/snapshot.
 * When the real contracts are available, this file will simply re-export from there.
 */

export type AttributeId = 'mind' | 'body' | 'will' | 'craft';
export type Effort = 'quick' | 'standard' | 'deep';
export type Cadence = 'once' | 'daily';
export type EmberState = 'resting' | 'kindled' | 'steady' | 'bright';
export type Specialization =
  | 'scholar'
  | 'explorer'
  | 'endurance'
  | 'mobility'
  | 'focus'
  | 'courage'
  | 'builder'
  | 'artisan';

export type Quest = {
  id: string;
  userId: string;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  trialId: string | null;
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BranchState = {
  attribute: AttributeId;
  xp: number;
  specialization: Specialization | null;
  selectedAt: string | null;
  sproutAvailable: boolean;
  specializationAvailable: boolean;
  crestAvailable: boolean;
  trialStarted: boolean;
  trialComplete: boolean;
  crestClaimed: boolean;
};

export type GameSnapshot = {
  revision: number;
  userId: string;
  totalXp: number;
  level: number;
  sparksBalance: number;
  currentStreak: number;
  longestStreak: number;
  emberState: EmberState;
  todayXpAwarded: number;
  branches: Record<AttributeId, BranchState>;
  trials: Partial<Record<AttributeId, unknown>>;
  equippedItemId: string | null;
  inventory: { items: unknown[] };
  quests?: Quest[];
};

export type MutationEventKind =
  | 'quest_completed'
  | 'specialization_chosen'
  | 'trial_started'
  | 'trial_claimed'
  | 'item_purchased'
  | 'item_equipped'
  | 'quest_created'
  | 'quest_updated'
  | 'quest_deleted'
  | 'preferences_updated';

export type MutationEvent = {
  id: string;
  kind: MutationEventKind;
  xpAwarded?: number;
  sparksAwarded?: number;
  previousLevel?: number;
  newLevel?: number;
  attribute?: AttributeId;
  specializationAvailable?: boolean;
  crestAvailable?: boolean;
  cappedToday?: boolean;
  emberRelit?: boolean;
  emberState?: EmberState;
  specialization?: Specialization;
};

export type MutationResult = {
  revision: number;
  event: MutationEvent;
  snapshot: GameSnapshot;
};

/**
 * Initial fixture snapshot matching docs/CONTRACTS.md § "Fixture Data"
 */
export const INITIAL_FIXTURE_SNAPSHOT: GameSnapshot = {
  revision: 12,
  userId: 'fixture-user-id',
  totalXp: 90,
  level: 1,
  sparksBalance: 18,
  currentStreak: 3,
  longestStreak: 7,
  emberState: 'resting',
  todayXpAwarded: 0,
  branches: {
    mind: {
      attribute: 'mind',
      xp: 70,
      specialization: null,
      selectedAt: null,
      sproutAvailable: true,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    body: {
      attribute: 'body',
      xp: 20,
      specialization: null,
      selectedAt: null,
      sproutAvailable: true,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    will: {
      attribute: 'will',
      xp: 0,
      specialization: null,
      selectedAt: null,
      sproutAvailable: false,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
    craft: {
      attribute: 'craft',
      xp: 0,
      specialization: null,
      selectedAt: null,
      sproutAvailable: false,
      specializationAvailable: false,
      crestAvailable: false,
      trialStarted: false,
      trialComplete: false,
      crestClaimed: false,
    },
  },
  trials: {},
  equippedItemId: null,
  inventory: { items: [] },
  quests: [
    {
      id: 'q-fixture-1',
      userId: 'fixture-user-id',
      title: 'Finish Java recursion practice',
      attribute: 'mind',
      effort: 'standard',
      cadence: 'daily',
      trialId: null,
      version: 1,
      deletedAt: null,
      createdAt: '2026-09-12T08:00:00.000Z',
      updatedAt: '2026-09-12T08:00:00.000Z',
    },
    {
      id: 'q-fixture-2',
      userId: 'fixture-user-id',
      title: '30-minute run',
      attribute: 'body',
      effort: 'quick',
      cadence: 'daily',
      trialId: null,
      version: 1,
      deletedAt: null,
      createdAt: '2026-09-12T08:30:00.000Z',
      updatedAt: '2026-09-12T08:30:00.000Z',
    },
    {
      id: 'q-fixture-3',
      userId: 'fixture-user-id',
      title: 'Draft illuminated field journal layout',
      attribute: 'craft',
      effort: 'deep',
      cadence: 'once',
      trialId: null,
      version: 1,
      deletedAt: null,
      createdAt: '2026-09-12T09:00:00.000Z',
      updatedAt: '2026-09-12T09:00:00.000Z',
    },
  ],
};

/**
 * Fixture completion simulation generator.
 * Simulates server-authoritative response strictly following docs/BACKEND_SCHEMA.md.
 */
export function simulateServerCompletion(
  currentSnapshot: GameSnapshot,
  questId: string,
  shouldFail = false
): Promise<MutationResult> {
  return new Promise((resolve, reject) => {
    // Simulate ~250ms network round-trip
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Network connection interrupted while kindling the Ember.'));
        return;
      }

      const quest = currentSnapshot.quests?.find((q) => q.id === questId);
      if (!quest) {
        reject(new Error('Quest not found in authoritative records.'));
        return;
      }

      // Effort XP per docs/PRD.md
      const xpValues: Record<Effort, number> = {
        quick: 10,
        standard: 20,
        deep: 35,
      };
      const awardedXp = xpValues[quest.effort] || 20;
      const awardedSparks = Math.floor(awardedXp / 5);

      const prevLevel = currentSnapshot.level;
      const newTotalXp = currentSnapshot.totalXp + awardedXp;
      // Derived level check: 100 + 50*(L-1) threshold
      const newLevel = newTotalXp >= 100 ? 2 : 1;

      const currentBranch = currentSnapshot.branches[quest.attribute];
      const newBranchXp = currentBranch.xp + awardedXp;
      const specializationAvailable = newBranchXp >= 80 && currentBranch.specialization === null;

      // Ember state progression
      const emberTransitions: Record<EmberState, EmberState> = {
        resting: 'kindled',
        kindled: 'steady',
        steady: 'bright',
        bright: 'bright',
      };
      const nextEmberState = emberTransitions[currentSnapshot.emberState] || 'kindled';

      const nextSnapshot: GameSnapshot = {
        ...currentSnapshot,
        revision: currentSnapshot.revision + 1,
        totalXp: newTotalXp,
        level: newLevel,
        sparksBalance: currentSnapshot.sparksBalance + awardedSparks,
        emberState: nextEmberState,
        todayXpAwarded: currentSnapshot.todayXpAwarded + awardedXp,
        branches: {
          ...currentSnapshot.branches,
          [quest.attribute]: {
            ...currentBranch,
            xp: newBranchXp,
            sproutAvailable: true,
            specializationAvailable,
          },
        },
      };

      const event: MutationEvent = {
        id: `evt-${Date.now()}`,
        kind: 'quest_completed',
        xpAwarded: awardedXp,
        sparksAwarded: awardedSparks,
        previousLevel: prevLevel,
        newLevel: newLevel,
        attribute: quest.attribute,
        specializationAvailable,
        emberState: nextEmberState,
        emberRelit: currentSnapshot.emberState === 'resting' && currentSnapshot.currentStreak > 0,
      };

      resolve({
        revision: nextSnapshot.revision,
        event,
        snapshot: nextSnapshot,
      });
    }, 250);
  });
}

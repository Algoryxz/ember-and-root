/**
 * Ember & Root — Local Hearth Fixture Contracts & Adapter
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * 
 * INTEGRATION BOUNDARY:
 * This local adapter is strictly aligned with docs/CONTRACTS.md and canonical game/contracts.ts.
 * When Smarak's game/contracts.ts is wired into this branch, this file will re-export directly from @/game/contracts.
 */

// ── Enumerations ─────────────────────────────────────────────────────────────

export type AttributeId = 'mind' | 'body' | 'will' | 'craft';

export type Effort = 'quick' | 'standard' | 'deep';

export type Cadence = 'once' | 'daily';

export type EmberState = 'resting' | 'kindled' | 'steady' | 'bright';

export type Specialization =
  | 'scholar'   // mind
  | 'explorer'  // mind
  | 'endurance' // body
  | 'mobility'  // body
  | 'focus'     // will
  | 'courage'   // will
  | 'builder'   // craft
  | 'artisan';  // craft

export const SPECIALIZATIONS_BY_ATTRIBUTE: Record<AttributeId, [Specialization, Specialization]> = {
  mind:  ['scholar', 'explorer'],
  body:  ['endurance', 'mobility'],
  will:  ['focus', 'courage'],
  craft: ['builder', 'artisan'],
};

// ── Profile ──────────────────────────────────────────────────────────────────

export type Profile = {
  userId: string;
  timezone: string;
  totalXp: number;
  sparksBalance: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  revision: number;
  preferences: {
    sound: boolean;
    reducedMotion: boolean;
  };
};

// ── Quest & HearthQuest ───────────────────────────────────────────────────────

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

export interface HearthQuest extends Quest {
  currentOccurrenceKey: string;
  completedForCurrentOccurrence: boolean;
}

// ── BranchState ──────────────────────────────────────────────────────────────

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

// ── TrialState ───────────────────────────────────────────────────────────────

export type TrialKind = 'distinct_days' | 'milestone_reflection';

export type TrialState = {
  id: string;
  attribute: AttributeId;
  specialization: Specialization;
  startedAt: string;
  kind: TrialKind;
  requiredDays?: number;
  distinctDaysCompleted?: number;
  milestoneText?: string;
  completedAt: string | null;
  claimedAt: string | null;
};

// ── Item and Inventory ───────────────────────────────────────────────────────

export type Item = {
  id: string;
  name: string;
  price: number;
  visualKey: string;
};

export type InventoryState = {
  items: Array<{
    item: Item;
    acquiredAt: string;
    equipped: boolean;
  }>;
};

// ── GameSnapshot ─────────────────────────────────────────────────────────────

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
  trials: Partial<Record<AttributeId, TrialState>>;
  equippedItemId: string | null;
  inventory: InventoryState;
  quests?: HearthQuest[];
};

// ── MutationResult ───────────────────────────────────────────────────────────

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

// ── Canonical Demo Fixture ───────────────────────────────────────────────────

/**
 * Deterministic demo snapshot fixture matching game/fixtures/snapshot.ts.
 */
export const DEMO_SNAPSHOT: GameSnapshot = {
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
  inventory: {
    items: [],
  },
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
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
      currentOccurrenceKey: '2026-09-12',
      completedForCurrentOccurrence: false,
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
      createdAt: '2026-09-12T00:00:00.000Z',
      updatedAt: '2026-09-12T00:00:00.000Z',
      currentOccurrenceKey: '2026-09-12',
      completedForCurrentOccurrence: false,
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
      currentOccurrenceKey: '2026-09-12',
      completedForCurrentOccurrence: false,
    },
  ],
};

export const INITIAL_FIXTURE_SNAPSHOT = DEMO_SNAPSHOT;

// ── Authoritative Simulation Adapter ─────────────────────────────────────────

/**
 * Fixture completion simulation generator.
 * Simulates server-authoritative response strictly following docs/BACKEND_SCHEMA.md & docs/CONTRACTS.md.
 * In a live deployment, this will be replaced by calling server/game/mutations.ts:completeQuest().
 */
export function simulateServerCompletion(
  currentSnapshot: GameSnapshot,
  questId: string,
  shouldFail = false
): Promise<MutationResult> {
  return new Promise((resolve, reject) => {
    // Simulate network round-trip (~250ms)
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

      if (quest.completedForCurrentOccurrence) {
        reject(new Error('Quest has already been sealed for today.'));
        return;
      }

      // Canonical Effort XP per docs/PRD.md & docs/BACKEND_SCHEMA.md
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

      // Ember state progression: 0 -> kindled (1), 1 -> steady (2), 2+ -> bright (3+)
      const completedCount = (currentSnapshot.quests?.filter((q) => q.completedForCurrentOccurrence).length || 0) + 1;
      let nextEmberState: EmberState = 'bright';
      if (completedCount === 1) nextEmberState = 'kindled';
      else if (completedCount === 2) nextEmberState = 'steady';

      // Update quests list with completed flag
      const updatedQuests = currentSnapshot.quests?.map((q) => {
        if (q.id === questId) {
          return {
            ...q,
            completedForCurrentOccurrence: true,
          };
        }
        return q;
      });

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
        quests: updatedQuests,
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

// ── Hearth Adapter Exports ───────────────────────────────────────────────────

export {
  completeQuestAction,
  createQuestAction,
  updateQuestAction,
  type CreateQuestParams,
  type UpdateQuestParams,
  type SupabaseClientLike,
} from './hearthAdapter';



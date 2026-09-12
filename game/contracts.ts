/**
 * Ember & Root — Shared Contracts
 * 
 * Source of truth: docs/CONTRACTS.md
 * Protected by: .agents/skills/integration-guardian/SKILL.md
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
  timezone: string;                 // IANA timezone string
  totalXp: number;
  sparksBalance: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;  // ISO date string 'YYYY-MM-DD'
  revision: number;
  preferences: {
    sound: boolean;
    reducedMotion: boolean;
  };
};

// ── Quest ────────────────────────────────────────────────────────────────────

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

// ── HearthQuest ─────────────────────────────────────────────────────────────

export interface HearthQuest extends Quest {
  currentOccurrenceKey: string;
  completedForCurrentOccurrence: boolean;
}

// ── QuestCompletion ──────────────────────────────────────────────────────────

export type QuestCompletion = {
  id: string;
  userId: string;
  questId: string;
  occurrenceKey: string;
  completedAt: string;   // ISO datetime string
  localDate: string;     // 'YYYY-MM-DD'
  questTitleSnapshot: string;
  questAttributeSnapshot: AttributeId;
  questEffortSnapshot: Effort;
  xpAwarded: number;
  sparksAwarded: number;
  trialEvidence: Record<string, unknown>;
};

// ── BranchState ──────────────────────────────────────────────────────────────

export type BranchState = {
  attribute: AttributeId;
  xp: number;
  specialization: Specialization | null;
  selectedAt: string | null;    // ISO datetime string when specialization was chosen

  // Derived fields (computed server-side and included in snapshot)
  sproutAvailable: boolean;          // xp > 0
  specializationAvailable: boolean;  // xp >= 80 && specialization === null
  crestAvailable: boolean;           // xp >= 160 && trialComplete && !crestClaimed
  trialStarted: boolean;             // trial row exists
  trialComplete: boolean;            // trial.completedAt !== null
  crestClaimed: boolean;             // trial.claimedAt !== null
};

// ── TrialState ───────────────────────────────────────────────────────────────

export type TrialKind = 'distinct_days' | 'milestone_reflection';

export type TrialState = {
  id: string;
  attribute: AttributeId;
  specialization: Specialization;
  startedAt: string;        // ISO datetime string
  kind: TrialKind;

  // For distinct_days trials
  requiredDays?: number;    // e.g., 5 for Scholar
  distinctDaysCompleted?: number;

  // For milestone_reflection trials
  milestoneText?: string;   // Player-declared milestone

  completedAt: string | null; // non-null when trial objective completed
  claimedAt: string | null;   // non-null when claimed and crest awarded
};

// ── Item and Inventory ───────────────────────────────────────────────────────

export type Item = {
  id: string;       // 'copper_halo' | 'firefly_orbit' | 'engraved_basin'
  name: string;
  price: number;    // Sparks cost
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

  // Character progression (derived from profiles)
  totalXp: number;
  level: number;                // derived server-side
  sparksBalance: number;
  currentStreak: number;
  longestStreak: number;

  // Today's state (derived server-side using stored timezone)
  emberState: EmberState;
  todayXpAwarded: number;       // informational only; cap enforcement is server-side

  // Root branches
  branches: Record<AttributeId, BranchState>;

  // Active trial per attribute (null if not started)
  trials: Partial<Record<AttributeId, TrialState>>;

  // Inventory
  equippedItemId: string | null;
  inventory: InventoryState;

  // Quest list (today's active quests for Hearth; omit from other contexts)
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
  id: string;                          // UUID of the event
  kind: MutationEventKind;

  // Quest completion fields
  xpAwarded?: number;
  sparksAwarded?: number;
  previousLevel?: number;
  newLevel?: number;
  attribute?: AttributeId;
  specializationAvailable?: boolean;
  crestAvailable?: boolean;
  cappedToday?: boolean;               // true if daily cap was hit; xpAwarded will be 0

  // Ember fields
  emberRelit?: boolean;                // true if first completion after a missed day
  emberState?: EmberState;             // new Ember state after this event

  // Specialization/trial fields
  specialization?: Specialization;

  // Quest CRUD fields
  questId?: string;
  version?: number;
};

export type MutationResult = {
  revision: number;
  event: MutationEvent;
  snapshot: GameSnapshot;
};

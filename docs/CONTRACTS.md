# Ember & Root — Shared Contracts

This document defines the conceptual TypeScript shapes that all four workstreams agree on. These types are the **integration contract** between the backend (Smarak) and all frontend features (Deeptiman, Akriti, Susmita).

> **Rule:** All frontend work is buildable from fixture `GameSnapshot` data. The real backend later replaces fixture data without changing component props or contracts.

> **Location:** When the Next.js project is initialized, implement these types in `game/contracts.ts`. Do not implement them before the Next.js skeleton exists.

---

## Enumerations

```typescript
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
```

---

## Profile

```typescript
export type Profile = {
  userId: string;
  timezone: string;            // IANA timezone string
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
```

---

## Quest

```typescript
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
```

---

## HearthQuest

The view-model representation of a Quest returned in `GameSnapshot.quests` for Hearth. Extends the persisted `Quest` with authoritative occurrence-level completion state computed server-side.

```typescript
export interface HearthQuest extends Quest {
  currentOccurrenceKey: string;
  completedForCurrentOccurrence: boolean;
}
```

> **Hearth Integration Rule:** Hearth displays quest completion status strictly from `quest.completedForCurrentOccurrence`. Frontend components must NOT maintain completion truth in a local Set, localStorage, or through optimistic client date calculations. Pending visual animations may be local; completion truth is authoritative server state.

---

## QuestCompletion

```typescript
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
```

---

## BranchState

Represents the state of one attribute branch in the Root.

```typescript
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
```

---

## TrialState

```typescript
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

  completedAt: string | null; // ISO datetime string when trial objective completed
  claimedAt: string | null;   // ISO datetime string when claimed and crest awarded
};
```

---

## Item and Inventory

```typescript
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
```

---

## GameSnapshot

The complete, authoritative, server-confirmed state of one user's game. This is the single source of truth for all UI rendering.

```typescript
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
```

---

## MutationResult

Every server action that changes progression or balance returns this shape.

```typescript
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
};

export type MutationResult = {
  revision: number;
  event: MutationEvent;
  snapshot: GameSnapshot;
};
```

---

## Fixture Data

When the Next.js project is initialized, a `game/fixtures/` directory must contain:

### `game/fixtures/snapshot.ts` — used during frontend development before backend is wired

```typescript
import { GameSnapshot } from '../contracts';

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};
```

---

## Integration Contract Agreement

All four developers agree to the following:

1. **Smarak** owns `game/contracts.ts` and `game/fixtures/`. He may update these types but must communicate changes to all team members before merging to `main`.

2. **Deeptiman, Akriti, Susmita** build their components to accept `GameSnapshot`, `MutationResult`, `Quest`, `BranchState`, and `TrialState` as typed props. They do not calculate progression themselves.

3. When the real backend is wired, only the data-fetching layer changes. Component props remain identical.

4. If a component needs a derived value not in `GameSnapshot`, Smarak derives it server-side and adds it to the snapshot. The frontend never re-derives it.

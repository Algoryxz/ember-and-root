/**
 * Ember & Root — Progression Reference Functions
 * 
 * NOTE: These are reference and testing functions implementing the canonical formulas.
 * The PostgreSQL database RPCs (complete_quest, etc.) remain authoritative in production.
 * 
 * Rules:
 * - NO streak multipliers.
 * - NO diminishing XP multipliers.
 * - Daily reward cap: 140 XP per local day.
 */

import type { Effort, EmberState, Specialization } from './contracts';

export const DAILY_XP_CAP = 140;

/**
 * Base XP awarded for a given quest effort tier.
 */
export function xpForEffort(effort: Effort): number {
  switch (effort) {
    case 'quick':
      return 10;
    case 'standard':
      return 20;
    case 'deep':
      return 35;
    default: {
      const _exhaustive: never = effort;
      throw new Error(`Unknown effort tier: ${_exhaustive}`);
    }
  }
}

/**
 * Sparks awarded for a given amount of XP.
 * Rule: sparks = xp / 5 (integer division only).
 */
export function sparksForXp(xp: number): number {
  if (xp < 0) return 0;
  return Math.floor(xp / 5);
}

/**
 * Total XP required to advance from the given character level to level + 1.
 * Formula: 100 + 50 * (level - 1)
 */
export function xpRequiredForNextLevel(level: number): number {
  if (level < 1) throw new Error('Level must be >= 1');
  return 100 + 50 * (level - 1);
}

/**
 * Cumulative total XP required to reach the given character level from level 1.
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 250 XP
 * Level 4: 450 XP
 * Formula: 25 * (level - 1) * (level + 2)
 */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * (level - 1) * (level + 2);
}

/**
 * Computes authoritative character level from total accumulated XP.
 * 0 - 99 XP   -> Level 1
 * 100 - 249 XP -> Level 2
 * 250 - 449 XP -> Level 3
 * 450 - 699 XP -> Level 4
 */
export function levelFromTotalXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  let level = 1;
  while (totalXp >= cumulativeXpForLevel(level + 1)) {
    level++;
  }
  return level;
}

/**
 * Attribute XP required to advance from the given attribute rank to rank + 1.
 * Formula: 80 + 40 * (rank - 1)
 */
export function attributeXpRequiredForNextRank(rank: number): number {
  if (rank < 1) throw new Error('Rank must be >= 1');
  return 80 + 40 * (rank - 1);
}

/**
 * Cumulative attribute XP required to reach the given rank from rank 1.
 * Rank 1: 0 XP
 * Rank 2: 80 XP
 * Rank 3: 200 XP
 * Rank 4: 360 XP
 * Formula: 20 * (rank - 1) * (rank + 2)
 */
export function cumulativeAttributeXpForRank(rank: number): number {
  if (rank <= 1) return 0;
  return 20 * (rank - 1) * (rank + 2);
}

/**
 * Computes attribute rank from accumulated attribute XP.
 * 0 - 79 XP   -> Rank 1
 * 80 - 199 XP  -> Rank 2
 * 200 - 359 XP -> Rank 3
 */
export function attributeRankFromXp(xp: number): number {
  if (xp <= 0) return 1;
  let rank = 1;
  while (xp >= cumulativeAttributeXpForRank(rank + 1)) {
    rank++;
  }
  return rank;
}

/**
 * Derives Ember state from today's quest completion count in the user's local timezone.
 * 0   -> resting
 * 1   -> kindled
 * 2   -> steady
 * 3+  -> bright
 */
export function emberStateFromTodayCompletionCount(count: number): EmberState {
  if (count <= 0) return 'resting';
  if (count === 1) return 'kindled';
  if (count === 2) return 'steady';
  return 'bright';
}

/**
 * Specialization fork choice becomes available once attribute XP reaches 80
 * and no specialization has been chosen yet.
 */
export function specializationAvailable(branch: {
  xp: number;
  specialization: Specialization | null;
}): boolean {
  return branch.xp >= 80 && branch.specialization === null;
}

export type TrialStatusInput = {
  isComplete: boolean;
  claimedAt?: string | null;
} | {
  claimedAt?: string | null;
  distinctDaysCompleted?: number;
  requiredDays?: number;
} | null | undefined;

/**
 * Crest claim becomes available when:
 * - Branch XP >= 160
 * - Trial objective is complete
 * - Crest/Trial has not already been claimed
 */
export function crestAvailable(
  branch: { xp: number },
  trial: TrialStatusInput
): boolean {
  if (branch.xp < 160) return false;
  if (!trial) return false;
  if (trial.claimedAt != null) return false;

  if ('isComplete' in trial && typeof trial.isComplete === 'boolean') {
    return trial.isComplete;
  }

  if (
    'distinctDaysCompleted' in trial &&
    trial.distinctDaysCompleted != null &&
    trial.requiredDays != null
  ) {
    return trial.distinctDaysCompleted >= trial.requiredDays;
  }

  return false;
}

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  emberRelit: boolean;
};

/**
 * Pure reference streak calculation based on local calendar dates.
 * - Same local date: streak unchanged.
 * - Next consecutive calendar day: currentStreak increments by 1.
 * - Missed day (gap >= 1 full day): currentStreak resets to 1, emberRelit is true.
 * - Longest streak is preserved as max(previousLongest, currentStreak).
 */
export function updateStreak(
  currentStreak: number,
  longestStreak: number,
  lastActivityDate: string | null,
  currentLocalDate: string
): StreakResult {
  if (!lastActivityDate) {
    const nextCurrent = 1;
    return {
      currentStreak: nextCurrent,
      longestStreak: Math.max(longestStreak, nextCurrent),
      emberRelit: false,
    };
  }

  const lastDate = new Date(`${lastActivityDate}T00:00:00Z`);
  const currDate = new Date(`${currentLocalDate}T00:00:00Z`);
  const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      currentStreak,
      longestStreak,
      emberRelit: false,
    };
  } else if (diffDays === 1) {
    const nextCurrent = currentStreak + 1;
    return {
      currentStreak: nextCurrent,
      longestStreak: Math.max(longestStreak, nextCurrent),
      emberRelit: false,
    };
  } else {
    // Missed at least one local calendar day
    const nextCurrent = 1;
    return {
      currentStreak: nextCurrent,
      longestStreak: Math.max(longestStreak, nextCurrent),
      emberRelit: true,
    };
  }
}


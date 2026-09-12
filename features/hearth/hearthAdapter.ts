/**
 * Ember & Root — Hearth Authoritative Data & Mutation Adapter
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * 
 * Thin adapter boundary connecting Hearth UI components to the authoritative game layer.
 * 
 * Architecture:
 * Authoritative Repository / Supabase RPCs
 *        ↓
 * Hearth Adapter (this file)
 *        ↓
 * HearthView
 *        ↓
 * Hearth Presentation Components
 * 
 * Invariants:
 * - Presentation components never contain database/RPC logic, progression formulas, or persistence calls.
 * - If a Supabase client is provided, invokes atomic server RPCs (`complete_quest`, `create_quest`).
 * - If running in offline or fixture mode, invokes deterministic simulation matching docs/BACKEND_SCHEMA.md.
 * - Idempotency: supports client requestId pass-through.
 * - The client NEVER calculates XP, level, Sparks, streaks, or branch progression.
 */

import type {
  AttributeId,
  Cadence,
  Effort,
  GameSnapshot,
  HearthQuest,
  MutationEvent,
  MutationResult,
} from './contracts';

export interface CreateQuestParams {
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
}

export interface UpdateQuestParams {
  title?: string;
  attribute?: AttributeId;
  effort?: Effort;
  cadence?: Cadence;
}

export interface SupabaseClientLike {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
}

function resolveRequestId(requestId?: string, prefix = 'req'): string {
  if (requestId && requestId.trim().length > 0) {
    return requestId.trim();
  }
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Authoritative completeQuest action.
 * Invokes the PostgreSQL `complete_quest` RPC when supabaseClient is present,
 * or runs the deterministic simulation when in fixture preview mode.
 */
export async function completeQuestAction(
  currentSnapshot: GameSnapshot,
  questId: string,
  supabaseClient?: SupabaseClientLike | null,
  requestId?: string,
  shouldSimulateFailure = false
): Promise<MutationResult> {
  const reqId = resolveRequestId(requestId, 'req-complete');

  // 1. Production Mode: Call authoritative Supabase PostgreSQL RPC
  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('complete_quest', {
      p_request_id: reqId,
      p_quest_id: questId,
      p_expected_occurrence: null,
    });

    if (error) {
      throw new Error(`complete_quest RPC failed: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('complete_quest RPC returned no data');
    }

    return data as MutationResult;
  }

  // 2. Fixture / Preview Simulation Mode
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldSimulateFailure) {
        reject(new Error('Network connection interrupted while kindling the Ember.'));
        return;
      }

      const quest = currentSnapshot.quests?.find((q) => q.id === questId);
      if (!quest) {
        reject(new Error(`Quest ${questId} not found in authoritative records.`));
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
      // Formula: 100 + 50*(L-1) threshold
      const newLevel = newTotalXp >= 100 ? 2 : 1;

      const currentBranch = currentSnapshot.branches[quest.attribute];
      const newBranchXp = currentBranch.xp + awardedXp;
      const specializationAvailable = newBranchXp >= 80 && currentBranch.specialization === null;

      // Ember state progression: 0 -> kindled (1), 1 -> steady (2), 2+ -> bright (3+)
      const currentCompletedCount = (currentSnapshot.quests?.filter((q) => q.completedForCurrentOccurrence).length || 0);
      const nextCompletedCount = currentCompletedCount + 1;
      let nextEmberState: GameSnapshot['emberState'] = 'bright';
      if (nextCompletedCount === 1) nextEmberState = 'kindled';
      else if (nextCompletedCount === 2) nextEmberState = 'steady';

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

/**
 * Authoritative createQuest action.
 * Invokes the PostgreSQL `create_quest` RPC when supabaseClient is present,
 * or runs the deterministic simulation when in fixture preview mode.
 */
export async function createQuestAction(
  currentSnapshot: GameSnapshot,
  input: CreateQuestParams,
  supabaseClient?: SupabaseClientLike | null,
  requestId?: string,
  shouldSimulateFailure = false
): Promise<MutationResult> {
  const reqId = resolveRequestId(requestId, 'req-create');

  // 1. Production Mode: Call authoritative Supabase PostgreSQL RPC
  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('create_quest', {
      p_request_id: reqId,
      p_title: input.title,
      p_attribute: input.attribute,
      p_effort: input.effort,
      p_cadence: input.cadence,
      p_trial_id: null,
    });

    if (error) {
      throw new Error(`create_quest RPC failed: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('create_quest RPC returned no data');
    }

    return data as MutationResult;
  }

  // 2. Fixture / Preview Simulation Mode
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldSimulateFailure) {
        reject(new Error('Network connection interrupted while inscribing the quest.'));
        return;
      }

      const todayKey = new Date().toISOString().split('T')[0];
      const newQuest: HearthQuest = {
        id: `q-inscribed-${Date.now()}`,
        userId: currentSnapshot.userId,
        title: input.title,
        attribute: input.attribute,
        effort: input.effort,
        cadence: input.cadence,
        trialId: null,
        version: 1,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentOccurrenceKey: todayKey,
        completedForCurrentOccurrence: false,
      };

      const updatedQuests = [newQuest, ...(currentSnapshot.quests || [])];
      const nextSnapshot: GameSnapshot = {
        ...currentSnapshot,
        revision: currentSnapshot.revision + 1,
        quests: updatedQuests,
      };

      const event: MutationEvent = {
        id: `evt-create-${Date.now()}`,
        kind: 'quest_created',
        attribute: input.attribute,
      };

      resolve({
        revision: nextSnapshot.revision,
        event,
        snapshot: nextSnapshot,
      });
    }, 200);
  });
}

/**
 * Authoritative updateQuest action.
 * Invokes the PostgreSQL `update_quest` RPC when supabaseClient is present,
 * or runs the deterministic simulation when in fixture preview mode.
 * 
 * Invariants:
 * - NO progression calculation (does NOT calculate XP, sparks, ember, streaks, or level).
 * - Updates only quest metadata (title, attribute, effort, cadence).
 * - Returns canonical MutationResult structure.
 */
export async function updateQuestAction(
  currentSnapshot: GameSnapshot,
  questId: string,
  updates: UpdateQuestParams,
  supabaseClient?: SupabaseClientLike | null,
  requestId?: string,
  shouldSimulateFailure = false
): Promise<MutationResult> {
  const reqId = resolveRequestId(requestId, 'req-update');

  // 1. Production Mode: Call authoritative Supabase PostgreSQL RPC
  if (supabaseClient && typeof supabaseClient.rpc === 'function') {
    const { data, error } = await supabaseClient.rpc('update_quest', {
      p_request_id: reqId,
      p_quest_id: questId,
      p_title: updates.title ?? null,
      p_attribute: updates.attribute ?? null,
      p_effort: updates.effort ?? null,
      p_cadence: updates.cadence ?? null,
    });

    if (error) {
      throw new Error(`update_quest RPC failed: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('update_quest RPC returned no data');
    }

    return data as MutationResult;
  }

  // 2. Fixture / Preview Simulation Mode
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldSimulateFailure) {
        reject(new Error('Network connection interrupted while revising the quest inscription.'));
        return;
      }

      const questIndex = currentSnapshot.quests?.findIndex((q) => q.id === questId);
      if (questIndex === undefined || questIndex === -1) {
        reject(new Error(`Quest ${questId} not found in authoritative records.`));
        return;
      }

      const existingQuest = currentSnapshot.quests![questIndex];
      const updatedQuest: HearthQuest = {
        ...existingQuest,
        title: updates.title !== undefined ? updates.title : existingQuest.title,
        attribute: updates.attribute !== undefined ? updates.attribute : existingQuest.attribute,
        effort: updates.effort !== undefined ? updates.effort : existingQuest.effort,
        cadence: updates.cadence !== undefined ? updates.cadence : existingQuest.cadence,
        version: existingQuest.version + 1,
        updatedAt: new Date().toISOString(),
      };

      const updatedQuests = [...currentSnapshot.quests!];
      updatedQuests[questIndex] = updatedQuest;

      const nextSnapshot: GameSnapshot = {
        ...currentSnapshot,
        revision: currentSnapshot.revision + 1,
        quests: updatedQuests,
      };

      const event: MutationEvent = {
        id: `evt-update-${Date.now()}`,
        kind: 'quest_updated',
        attribute: updatedQuest.attribute,
      };

      resolve({
        revision: nextSnapshot.revision,
        event,
        snapshot: nextSnapshot,
      });
    }, 200);
  });
}


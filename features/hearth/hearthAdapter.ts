import type {
  AttributeId,
  Cadence,
  Effort,
  GameSnapshot,
  HearthQuest,
  MutationEvent,
  MutationResult,
} from '../../game/contracts';
import { createClient as createBrowserClient } from '../../lib/supabase/client';

export interface CreateQuestParams {
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  trialId?: string | null;
}

export interface UpdateQuestParams {
  title?: string;
  attribute?: AttributeId;
  effort?: Effort;
  cadence?: Cadence;
  expectedVersion?: number;
  version?: number;
}

export interface SupabaseClientLike {
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
}

function getRpcClient(client?: any): SupabaseClientLike | null {
  if (client && typeof client.rpc === 'function') {
    return client as SupabaseClientLike;
  }
  if (typeof window !== 'undefined') {
    try {
      const browser = createBrowserClient();
      if (browser && typeof browser.rpc === 'function') {
        return (browser as unknown) as SupabaseClientLike;
      }
    } catch {
      // Fall through to null
    }
  }
  return null;
}

function resolveRequestId(requestId?: string): string {
  if (requestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId.trim())) {
    return requestId.trim();
  }
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'a0000000-0000-0000-0000-000000000001';
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
  const reqId = resolveRequestId(requestId);
  const client = getRpcClient(supabaseClient);

  // 1. Production Mode: Call authoritative Supabase PostgreSQL RPC
  if (client) {
    const quest = currentSnapshot.quests?.find((q) => q.id === questId);
    const expectedOccurrence = quest && 'currentOccurrenceKey' in quest ? quest.currentOccurrenceKey : null;

    const { data, error } = await client.rpc('complete_quest', {
      p_request_id: reqId,
      p_quest_id: questId,
      p_expected_occurrence: expectedOccurrence ?? null,
    });

    if (error) {
      throw new Error(`complete_quest failed: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('complete_quest returned no data');
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
        reject(new Error('Quest not found in authoritative records.'));
        return;
      }

      if (quest.completedForCurrentOccurrence) {
        reject(new Error('Quest has already been sealed for today.'));
        return;
      }

      const xpValues: Record<Effort, number> = {
        quick: 10,
        standard: 20,
        deep: 35,
      };
      const awardedXp = xpValues[quest.effort] || 20;
      const awardedSparks = Math.floor(awardedXp / 5);

      const prevLevel = currentSnapshot.level;
      const newTotalXp = currentSnapshot.totalXp + awardedXp;
      const newLevel = newTotalXp >= 100 ? 2 : 1;

      const currentBranch = currentSnapshot.branches[quest.attribute];
      const newBranchXp = currentBranch.xp + awardedXp;
      const specializationAvailable = newBranchXp >= 80 && currentBranch.specialization === null;

      const currentCompletedCount = currentSnapshot.quests?.filter((q) => q.completedForCurrentOccurrence).length || 0;
      const nextCompletedCount = currentCompletedCount + 1;
      let nextEmberState: GameSnapshot['emberState'] = 'bright';
      if (nextCompletedCount === 1) nextEmberState = 'kindled';
      else if (nextCompletedCount === 2) nextEmberState = 'steady';

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
  const reqId = resolveRequestId(requestId);
  const client = getRpcClient(supabaseClient);

  // 1. Production Mode: Call authoritative Supabase PostgreSQL RPC
  if (client) {
    const { data, error } = await client.rpc('create_quest', {
      p_request_id: reqId,
      p_title: input.title,
      p_attribute: input.attribute,
      p_effort: input.effort,
      p_cadence: input.cadence,
      p_trial_id: input.trialId ?? null,
    });

    if (error) {
      throw new Error(`create_quest failed: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('create_quest returned no data');
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
 */
export async function updateQuestAction(
  currentSnapshot: GameSnapshot,
  questId: string,
  updates: UpdateQuestParams,
  supabaseClient?: SupabaseClientLike | null,
  requestId?: string,
  shouldSimulateFailure = false
): Promise<MutationResult> {
  const reqId = resolveRequestId(requestId);
  const client = getRpcClient(supabaseClient);

  // 1. Production Mode: Call authoritative Supabase PostgreSQL RPC
  if (client) {
    const existingQuest = currentSnapshot.quests?.find((q) => q.id === questId);
    const expectedVersion = updates.expectedVersion ?? updates.version ?? existingQuest?.version ?? 1;

    const { data, error } = await client.rpc('update_quest', {
      p_request_id: reqId,
      p_quest_id: questId,
      p_expected_version: expectedVersion,
      p_title: updates.title ?? existingQuest?.title ?? '',
      p_attribute: updates.attribute ?? existingQuest?.attribute ?? 'mind',
      p_effort: updates.effort ?? existingQuest?.effort ?? 'standard',
      p_cadence: updates.cadence ?? existingQuest?.cadence ?? 'daily',
      p_trial_id: null,
    });

    if (error) {
      throw new Error(`update_quest failed: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('update_quest returned no data');
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

/**
 * Authoritative softDeleteQuest action.
 */
export async function softDeleteQuestAction(
  currentSnapshot: GameSnapshot,
  questId: string,
  supabaseClient?: SupabaseClientLike | null,
  requestId?: string
): Promise<MutationResult> {
  const reqId = resolveRequestId(requestId);
  const client = getRpcClient(supabaseClient);

  if (client) {
    const { data, error } = await client.rpc('soft_delete_quest', {
      p_request_id: reqId,
      p_quest_id: questId,
    });

    if (error) {
      throw new Error(`soft_delete_quest failed: ${error.message || JSON.stringify(error)}`);
    }
    if (!data) {
      throw new Error('soft_delete_quest returned no data');
    }

    return data as MutationResult;
  }

  const updatedQuests = (currentSnapshot.quests || []).filter((q) => q.id !== questId);
  const nextSnapshot: GameSnapshot = {
    ...currentSnapshot,
    revision: currentSnapshot.revision + 1,
    quests: updatedQuests,
  };

  return {
    revision: nextSnapshot.revision,
    event: { id: `evt-del-${Date.now()}`, kind: 'quest_deleted', questId },
    snapshot: nextSnapshot,
  };
}

/**
 * Authoritative fetchGameSnapshot action.
 */
export async function fetchGameSnapshotAction(
  supabaseClient?: SupabaseClientLike | null
): Promise<GameSnapshot> {
  const client = getRpcClient(supabaseClient);
  if (!client) {
    throw new Error('An authoritative database client (Supabase) is required to fetch GameSnapshot.');
  }

  const { data, error } = await client.rpc('get_game_snapshot');

  if (error) {
    throw new Error(`get_game_snapshot failed: ${error.message || JSON.stringify(error)}`);
  }
  if (!data) {
    throw new Error('get_game_snapshot returned no data');
  }

  return data as GameSnapshot;
}

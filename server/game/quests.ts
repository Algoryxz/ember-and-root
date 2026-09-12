/**
 * Server Quest Operations
 * 
 * Defines types and server caller contracts for quest operations.
 */

import type { Quest, AttributeId, Effort, Cadence } from '../../game/contracts';
import type { SupabaseServerClient } from '../supabase/server';

export type CreateQuestInput = {
  requestId: string;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  trialId?: string | null;
};

export type UpdateQuestInput = {
  requestId: string;
  questId: string;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  trialId?: string | null;
  version: number;
};

export async function fetchActiveQuests(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Quest[]> {
  const { data, error } = await supabase.from('quests').select('*').eq('user_id', userId);
  if (error) {
    throw new Error(`Failed to fetch quests: ${JSON.stringify(error)}`);
  }
  return (data as Quest[]) || [];
}

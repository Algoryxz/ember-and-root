/**
 * Server Snapshot Fetcher
 * 
 * Fetches the authoritative GameSnapshot for an authenticated user via the database RPC.
 */

import type { GameSnapshot } from '../../game/contracts';
import type { SupabaseServerClient } from '../supabase/server';

export async function fetchGameSnapshot(
  supabase: SupabaseServerClient,
  userId: string
): Promise<GameSnapshot> {
  const { data, error } = await supabase.rpc<GameSnapshot>('get_game_snapshot', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch GameSnapshot: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No GameSnapshot returned for user: ${userId}`);
  }

  return data;
}

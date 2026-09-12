/**
 * Server Snapshot Fetcher
 * 
 * Fetches the authoritative GameSnapshot for the authenticated caller via the database RPC.
 * Identity is derived server-side via auth.uid().
 */

import type { GameSnapshot, HearthQuest } from '../../game/contracts';
import type { SupabaseServerClient } from '../supabase/server';

export type { HearthQuest };

export async function fetchGameSnapshot(
  supabase: SupabaseServerClient
): Promise<GameSnapshot> {
  const { data, error } = await supabase.rpc<GameSnapshot>('get_game_snapshot');

  if (error) {
    throw new Error(`Failed to fetch GameSnapshot: ${error.message}`);
  }

  if (!data) {
    throw new Error('No GameSnapshot returned for authenticated session');
  }

  return data;
}

/**
 * Supabase Browser Client
 *
 * Used in client components for authentication state changes and subscriptions.
 */

import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
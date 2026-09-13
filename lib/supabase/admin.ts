/**
 * Supabase Admin Client (Server-Only)
 *
 * Never import this file into Client Components.
 * Used exclusively in Server Actions to bypass email rate-limiting for hackathon demos.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return null;
  }
  const { url } = getSupabaseEnv();
  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

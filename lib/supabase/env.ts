/**
 * Safe Supabase Environment Variable Access
 *
 * Ensures NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are present.
 * Never references SUPABASE_SERVICE_ROLE_KEY in client-accessible code.
 */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Provide a fallback dummy during build/prerender if needed, or throw in active runtime
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      console.warn('Missing Supabase public environment variables');
    }
    return {
      url: url || 'https://placeholder-project.supabase.co',
      anonKey: anonKey || 'placeholder-anon-key',
      isConfigured: Boolean(url && anonKey),
    };
  }

  // Normalize URL to ensure clean origin without trailing slashes or /rest/v1 paths
  let cleanUrl = url;
  try {
    cleanUrl = new URL(url).origin;
  } catch {
    cleanUrl = url;
  }

  return {
    url: cleanUrl,
    anonKey,
    isConfigured: true,
  };
}
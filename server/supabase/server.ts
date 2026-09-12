/**
 * Server Supabase Client Interface
 * 
 * NOTE: This is a dependency-free interface definition.
 * The concrete implementation using `@supabase/ssr` (`createServerClient`)
 * will be wired once Susmita locks dependencies in `package.json`.
 */

export type SupabaseServerClient = {
  rpc<T = any>(
    fn: string,
    params?: Record<string, unknown>
  ): Promise<{ data: T | null; error: Error | { message: string } | null }>;

  from(table: string): any;

  auth: {
    getUser(): Promise<{
      data: { user: { id: string; email?: string } | null };
      error: Error | null;
    }>;
  };
  [key: string]: any;
};

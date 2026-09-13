-- =============================================================================
-- Migration: 20260913140000_fix_level_from_xp.sql
-- Description: Create public.level_from_xp(integer) alias function to resolve
--              RPC dependency in get_game_snapshot() and complete_quest(),
--              delegating directly to canonical public.level_from_total_xp(integer).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.level_from_xp(p_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
AS $$
  SELECT public.level_from_total_xp(p_xp);
$$;

COMMENT ON FUNCTION public.level_from_xp(integer) IS
  'Canonical alias for level_from_total_xp(integer) ensuring RPC compatibility across all snapshot and progression callers.';

REVOKE ALL ON FUNCTION public.level_from_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.level_from_xp(integer) TO authenticated, anon, service_role;

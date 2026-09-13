-- =====================================================================
-- Migration: 20260913134500_level_from_xp_helper.sql
-- Description: Canonical helper function public.level_from_xp(integer)
--              delegating to public.level_from_total_xp(integer).
--              Ensures full compatibility for get_game_snapshot,
--              create_quest, update_quest, and complete_quest.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.level_from_xp(p_total_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.level_from_total_xp(p_total_xp);
$$;

REVOKE ALL ON FUNCTION public.level_from_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.level_from_xp(integer) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

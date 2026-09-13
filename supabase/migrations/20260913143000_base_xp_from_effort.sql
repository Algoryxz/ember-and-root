-- =====================================================================
-- Migration: 20260913143000_base_xp_from_effort.sql
-- Description: Canonical function public.base_xp_from_effort(text)
--              calculating base XP from quest effort tier ('quick' -> 10,
--              'standard' -> 20, 'deep' -> 35).
--              Required by complete_quest() RPC in satchel_v2_economy.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.base_xp_from_effort(p_effort text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
AS $$
  SELECT CASE p_effort
    WHEN 'quick' THEN 10
    WHEN 'standard' THEN 20
    WHEN 'deep' THEN 35
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.base_xp_from_effort(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.base_xp_from_effort(text) TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';

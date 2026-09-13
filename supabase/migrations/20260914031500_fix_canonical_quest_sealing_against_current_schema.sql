-- =============================================================================
-- Migration: 20260914031500_fix_canonical_quest_sealing_against_current_schema.sql
-- Description: Minimal corrective repair for production quest sealing against
--              verified live production schema.
--              1. Adds missing public.base_xp_from_effort(text) helper function
--                 with case-insensitive and whitespace normalization.
--              2. Reasserts public.level_from_total_xp(integer) canonical thresholds.
--              3. Reasserts public.level_from_xp(integer) alias function.
--              4. Preserves canonical ember states in public.ember_state_from_count(integer):
--                 0 = resting, 1 = kindled, 2 = steady, 3+ = bright.
-- =============================================================================

-- 1. Helper: base_xp_from_effort
CREATE OR REPLACE FUNCTION public.base_xp_from_effort(p_effort text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
AS $$
  SELECT CASE LOWER(TRIM(COALESCE(p_effort, '')))
    WHEN 'quick' THEN 10
    WHEN 'standard' THEN 20
    WHEN 'deep' THEN 35
    ELSE 0
  END;
$$;

COMMENT ON FUNCTION public.base_xp_from_effort(text) IS
  'Authoritative base XP award by effort tier (quick -> 10, standard -> 20, deep -> 35).';

REVOKE ALL ON FUNCTION public.base_xp_from_effort(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.base_xp_from_effort(text) TO authenticated, anon, service_role;

-- 2. Helper: level_from_total_xp
CREATE OR REPLACE FUNCTION public.level_from_total_xp(p_total_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN p_total_xp >= 1600 THEN 10
    WHEN p_total_xp >= 1300 THEN 9
    WHEN p_total_xp >= 1050 THEN 8
    WHEN p_total_xp >= 820 THEN 7
    WHEN p_total_xp >= 620 THEN 6
    WHEN p_total_xp >= 450 THEN 5
    WHEN p_total_xp >= 300 THEN 4
    WHEN p_total_xp >= 180 THEN 3
    WHEN p_total_xp >= 80 THEN 2
    ELSE 1
  END;
$$;

COMMENT ON FUNCTION public.level_from_total_xp(integer) IS
  'Authoritative character level from cumulative total XP according to game progression design.';

REVOKE ALL ON FUNCTION public.level_from_total_xp(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.level_from_total_xp(integer) TO authenticated, anon, service_role;

-- 3. Helper: level_from_xp (alias delegating to level_from_total_xp)
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

-- 4. Helper: ember_state_from_count (preserving canonical 0=resting, 1=kindled, 2=steady, 3+=bright)
CREATE OR REPLACE FUNCTION public.ember_state_from_count(p_count integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY INVOKER
AS $$
  SELECT CASE
    WHEN p_count >= 3 THEN 'bright'
    WHEN p_count = 2 THEN 'steady'
    WHEN p_count = 1 THEN 'kindled'
    ELSE 'resting'
  END;
$$;

COMMENT ON FUNCTION public.ember_state_from_count(integer) IS
  'Authoritative ember state from daily completions (0 -> resting, 1 -> kindled, 2 -> steady, 3+ -> bright).';

REVOKE ALL ON FUNCTION public.ember_state_from_count(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ember_state_from_count(integer) TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';

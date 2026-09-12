-- ==============================================================================
-- Operator-Only Seed Script: Prepared Demo Account
-- Ember & Root — Core Workstream
--
-- Provisions the canonical demonstration user in the exact pre-completion state:
--   - Total XP: 90 (Level 1)
--   - Sparks: 18
--   - Branches: Mind (70 XP), Body (20 XP), Will (0 XP), Craft (0 XP)
--   - Specializations: None chosen (Mind specialization eligible at 80 XP)
--   - Completions today: 0 (Ember resting)
--   - Active quest: "Finish Java recursion practice" (Mind, Standard, Daily)
--
-- Upon executing completeQuest on this quest:
--   - XP awarded: 20 (Total XP becomes 110 -> Level 2 reached!)
--   - Mind XP awarded: 20 (Mind XP becomes 90 -> Specialization choice unlocked!)
--   - Sparks awarded: 4 (Sparks balance becomes 22)
--   - Ember kindled (1 completion today)
-- ==============================================================================

DO $$
DECLARE
  v_demo_user_id uuid;
  v_quest_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
BEGIN
  -- Look for demo user in auth.users by email 'demo@emberandroot.internal' or first user
  SELECT id INTO v_demo_user_id
  FROM auth.users
  WHERE email = 'demo@emberandroot.local'
  LIMIT 1;

  IF v_demo_user_id IS NULL THEN
    RAISE NOTICE 'No user with email demo@emberandroot.local found. Demo seed should be executed with a known user_id or after signing up.';
    RETURN;
  END IF;

  -- Temporarily allow direct progression seed
  PERFORM set_config('ember.in_rpc', 'true', true);

  -- 1. Reset / Seed Profile
  INSERT INTO public.profiles (
    user_id, timezone, total_xp, sparks_balance, current_streak, longest_streak,
    last_activity_date, revision, preferences
  ) VALUES (
    v_demo_user_id, 'UTC', 90, 18, 3, 7,
    CURRENT_DATE - 1, -- Active yesterday so streak increments or stays active
    12, '{"sound": true, "reducedMotion": false}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = 90,
    sparks_balance = 18,
    current_streak = 3,
    longest_streak = 7,
    last_activity_date = CURRENT_DATE - 1,
    revision = 12;

  -- 2. Seed Branches (Mind: 70, Body: 20, Will: 0, Craft: 0)
  INSERT INTO public.branches (user_id, attribute, xp, selected_specialization, selected_at)
  VALUES
    (v_demo_user_id, 'mind', 70, NULL, NULL),
    (v_demo_user_id, 'body', 20, NULL, NULL),
    (v_demo_user_id, 'will', 0, NULL, NULL),
    (v_demo_user_id, 'craft', 0, NULL, NULL)
  ON CONFLICT (user_id, attribute) DO UPDATE SET
    xp = EXCLUDED.xp,
    selected_specialization = NULL,
    selected_at = NULL;

  -- 3. Clear today's completions for the demo user to ensure Ember starts in 'resting'
  DELETE FROM public.quest_completions
  WHERE user_id = v_demo_user_id AND local_date = CURRENT_DATE;

  -- 4. Seed Active Demo Quest
  INSERT INTO public.quests (
    id, user_id, title, attribute, effort, cadence, version, deleted_at
  ) VALUES (
    v_quest_id,
    v_demo_user_id,
    'Finish Java recursion practice',
    'mind',
    'standard',
    'daily',
    1,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = v_demo_user_id,
    title = 'Finish Java recursion practice',
    attribute = 'mind',
    effort = 'standard',
    cadence = 'daily',
    deleted_at = NULL;

  -- 5. Seed Secondary Active Quest
  INSERT INTO public.quests (
    id, user_id, title, attribute, effort, cadence, version, deleted_at
  ) VALUES (
    'a0000000-0000-0000-0000-000000000002'::uuid,
    v_demo_user_id,
    '30-minute run',
    'body',
    'quick',
    'daily',
    1,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = v_demo_user_id,
    title = '30-minute run',
    attribute = 'body',
    effort = 'quick',
    cadence = 'daily',
    deleted_at = NULL;

  RAISE NOTICE 'Demo account % seeded successfully: 90 XP (Mind 70, Body 20), Sparks 18, demo quest active.', v_demo_user_id;
END $$;

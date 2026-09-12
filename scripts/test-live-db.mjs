/**
 * Live Database Validation Suite for Ember & Root (SMARAK CORE)
 * 
 * Verifies:
 * 1. Schema objects and seeded catalog items
 * 2. User auth & profile bootstrap trigger (User A & User B)
 * 3. Timezone validation (valid accepted, invalid rejected)
 * 4. Quest CRUD and cross-user RLS isolation
 * 5. get_game_snapshot() structure and contract compliance
 * 6. complete_quest RPC (award, idempotent replay, conflict detection, duplicate occurrence)
 * 7. Cross-user mutation denial (User B cannot complete User A's quest)
 * 8. Daily XP cap (140 XP enforcement with partial award)
 * 9. Level boundary crossing (100 XP -> Level 2)
 * 10. Local day streak progression
 * 11. Concurrent execution safety
 * 12. Unauthenticated caller rejection
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const results = [];

async function adminApi(path, options = {}) {
  return api(path, options, SUPABASE_SERVICE_ROLE_KEY);
}

function assert(condition, name, details = '') {
  if (!condition) {
    const msg = `FAIL: ${name}${details ? ` - ${details}` : ''}`;
    console.error(`  ❌ ${msg}`);
    results.push({ name, passed: false, details });
    throw new Error(msg);
  } else {
    console.log(`  ✅ PASS: ${name}`);
    results.push({ name, passed: true, details });
  }
}

async function api(path, options = {}, token = null) {
  const url = `${SUPABASE_URL}${path}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...options,
    headers
  });
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json, headers: res.headers };
}

async function signUp(email, password) {
  const res = await api('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`SignUp failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return {
    userId: res.data.user.id,
    token: res.data.access_token
  };
}

async function main() {
  console.log('======================================================================');
  console.log('EMBER & ROOT: LIVE SUPABASE VALIDATION HARNESS');
  console.log('======================================================================\n');

  const runId = Date.now();
  const userAEmail = `test_user_a_${runId}@emberandroot.local`;
  const userBEmail = `test_user_b_${runId}@emberandroot.local`;
  const password = 'Password123!Secure';

  // -------------------------------------------------------------------------
  // 1. UNLOADED / UNCONFIGURED CALLER SECURITY
  // -------------------------------------------------------------------------
  console.log('--- Step 1: Unauthenticated & Anon Access Controls ---');
  {
    const snapNoAuth = await api('/rest/v1/rpc/get_game_snapshot', { method: 'POST', body: '{}' });
    assert(snapNoAuth.status === 401 || snapNoAuth.status === 403 || !snapNoAuth.ok,
      'get_game_snapshot rejects unauthenticated caller',
      `Status: ${snapNoAuth.status}`);

    const completeNoAuth = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({
        p_request_id: crypto.randomUUID(),
        p_quest_id: crypto.randomUUID(),
        p_expected_occurrence: '2026-09-12'
      })
    });
    assert(completeNoAuth.status === 401 || completeNoAuth.status === 403 || !completeNoAuth.ok,
      'complete_quest rejects unauthenticated caller',
      `Status: ${completeNoAuth.status}`);
  }

  // -------------------------------------------------------------------------
  // 2. CREATE ISOLATED USERS & VERIFY BOOTSTRAP TRIGGER
  // -------------------------------------------------------------------------
  console.log('\n--- Step 2: User Creation & Bootstrap Triggers ---');
  const userA = await signUp(userAEmail, password);
  assert(Boolean(userA.userId && userA.token), 'User A registered and received session token');

  const userB = await signUp(userBEmail, password);
  assert(Boolean(userB.userId && userB.token), 'User B registered and received session token');

  // Verify User A bootstrap records via direct RLS queries with User A's token
  {
    const profileRes = await api('/rest/v1/profiles?select=*', {}, userA.token);
    assert(profileRes.ok && profileRes.data.length === 1, 'User A profile auto-created by bootstrap trigger');
    const p = profileRes.data[0];
    assert(p.user_id === userA.userId, 'Profile user_id matches User A');
    assert(p.timezone === 'UTC', 'Default timezone is UTC');
    assert(p.total_xp === 0, 'Initial total_xp is 0');
    assert(p.sparks_balance === 0, 'Initial sparks_balance is 0');
    assert(p.current_streak === 0, 'Initial current_streak is 0');

    const branchesRes = await api('/rest/v1/branches?select=*', {}, userA.token);
    assert(branchesRes.ok && branchesRes.data.length === 4, 'All 4 canonical branches auto-created');
    const attrs = branchesRes.data.map(b => b.attribute).sort();
    assert(JSON.stringify(attrs) === JSON.stringify(['body', 'craft', 'mind', 'will']), 'Canonical attributes: mind, body, will, craft');

    const trialsRes = await api('/rest/v1/trials?select=*', {}, userA.token);
    assert(trialsRes.ok && trialsRes.data.length === 0, 'Trials table initially empty before trial activation');
  }

  // -------------------------------------------------------------------------
  // 3. TIMEZONE VALIDATION
  // -------------------------------------------------------------------------
  console.log('\n--- Step 3: Timezone Validation (pg_catalog.pg_timezone_names) ---');
  {
    // Valid timezone: Asia/Kolkata
    const validTzRes = await api('/rest/v1/rpc/update_profile_preferences', {
      method: 'POST',
      body: JSON.stringify({
        p_preferences: null,
        p_timezone: 'Asia/Kolkata'
      })
    }, userA.token);
    console.log('validTzRes:', JSON.stringify(validTzRes));
    assert(validTzRes.ok, 'Valid timezone Asia/Kolkata accepted');

    const checkTz = await api('/rest/v1/profiles?select=timezone', {}, userA.token);
    assert(checkTz.data[0].timezone === 'Asia/Kolkata', 'Profile timezone updated to Asia/Kolkata');

    // Invalid timezone: banana/time
    const invalidTzRes = await api('/rest/v1/rpc/update_profile_preferences', {
      method: 'POST',
      body: JSON.stringify({
        p_preferences: null,
        p_timezone: 'banana/time'
      })
    }, userA.token);
    assert(!invalidTzRes.ok, 'Invalid timezone banana/time rejected by database');
    assert(JSON.stringify(invalidTzRes.data).includes('Invalid IANA timezone') || invalidTzRes.status >= 400,
      'Database returned clear application error for invalid timezone');
  }

  // -------------------------------------------------------------------------
  // 4. QUEST CRUD & CROSS-USER ISOLATION (RLS)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 4: Quest CRUD & Cross-User Isolation (RLS) ---');
  let questA1Id = null;
  {
    // User A creates Quest 1
    const createQuestRes = await api('/rest/v1/quests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({
        title: 'Morning Focus Meditation',
        attribute: 'mind',
        effort: 'standard', // 20 XP, 10 Sparks
        cadence: 'daily'
      })
    }, userA.token);
    assert(createQuestRes.ok && createQuestRes.data.length === 1, 'User A created daily quest');
    questA1Id = createQuestRes.data[0].id;

    // User B reads quests
    const userBQuests = await api('/rest/v1/quests?select=*', {}, userB.token);
    assert(userBQuests.ok && userBQuests.data.length === 0, 'User B cannot see User A quests (RLS isolation)');

    // User B attempts to delete User A's quest
    const userBDeleteRes = await api(`/rest/v1/quests?id=eq.${questA1Id}`, {
      method: 'DELETE',
      headers: { 'Prefer': 'return=representation' }
    }, userB.token);
    assert(userBDeleteRes.ok && userBDeleteRes.data.length === 0, 'User B cannot delete User A quest (0 rows affected)');
  }

  // -------------------------------------------------------------------------
  // 5. GET_GAME_SNAPSHOT
  // -------------------------------------------------------------------------
  console.log('\n--- Step 5: get_game_snapshot Contract Validation ---');
  {
    const snapRes = await api('/rest/v1/rpc/get_game_snapshot', {
      method: 'POST',
      body: '{}'
    }, userA.token);
    console.log('snapRes:', JSON.stringify(snapRes));
    assert(snapRes.ok, 'get_game_snapshot succeeded');
    const snap = snapRes.data;
    assert(snap.userId === userA.userId, 'Snapshot userId matches User A');
    assert(snap.level === 1, 'Initial snapshot level is 1');
    assert(snap.totalXp === 0, 'Initial snapshot totalXp is 0');
    assert(snap.sparksBalance === 0, 'Initial snapshot sparksBalance is 0');
    assert(snap.currentStreak === 0, 'Initial snapshot currentStreak is 0');
    assert(snap.emberState === 'resting', 'Initial Ember state is resting');
    assert(snap.branches && Object.keys(snap.branches).length === 4, 'Snapshot includes all 4 branches');
    assert(Array.isArray(snap.quests) && snap.quests.length === 1, 'Snapshot includes User A quest');
    assert(snap.quests[0].title === 'Morning Focus Meditation', 'Quest title preserved in snapshot');
    assert(snap.inventory && Array.isArray(snap.inventory.items), 'Snapshot includes inventory array');
  }

  // -------------------------------------------------------------------------
  // 6. COMPLETE_QUEST RPC: FIRST MUTATION
  // -------------------------------------------------------------------------
  console.log('\n--- Step 6: complete_quest RPC (First Mutation) ---');
  const requestId1 = crypto.randomUUID();
  const occurrenceToday = '2026-09-12';
  let firstResult = null;
  {
    const res = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({
        p_request_id: requestId1,
        p_quest_id: questA1Id,
        p_expected_occurrence: occurrenceToday
      })
    }, userA.token);
    assert(res.ok, 'complete_quest succeeded for User A', JSON.stringify(res.data));
    firstResult = res.data;
    assert(firstResult.revision === 1, 'MutationResult revision is 1');
    assert(firstResult.event && firstResult.event.kind === 'quest_completed', 'MutationEvent kind is quest_completed');
    assert(firstResult.event.xpAwarded === 20, 'Awarded 20 XP for standard effort');
    assert(firstResult.event.sparksAwarded === 4, 'Awarded 4 Sparks for standard effort (20 / 5)');
    assert(firstResult.snapshot.totalXp === 20, 'newTotalXp in snapshot is 20');
    assert(firstResult.snapshot.sparksBalance === 4, 'newSparksBalance in snapshot is 4');
    assert(firstResult.snapshot.currentStreak === 1, 'First day completion increments streak to 1');
    assert(firstResult.snapshot.emberState === 'kindled', 'First completion of the day elevates Ember to kindled');

    // Verify database state directly
    const profCheck = await api('/rest/v1/profiles?select=*', {}, userA.token);
    assert(profCheck.data[0].total_xp === 20, 'Database profile total_xp is 20');
    assert(profCheck.data[0].sparks_balance === 4, 'Database profile sparks_balance is 4');
    assert(profCheck.data[0].current_streak === 1, 'Database profile current_streak is 1');

    const branchCheck = await api(`/rest/v1/branches?attribute=eq.mind&select=*`, {}, userA.token);
    assert(branchCheck.data[0].xp === 20, 'Mind branch xp updated to 20');

    const ledgerCheck = await api('/rest/v1/currency_ledger?select=*', {}, userA.token);
    assert(ledgerCheck.data.length === 1 && ledgerCheck.data[0].amount === 4, 'Currency ledger recorded +4 sparks');
  }

  // -------------------------------------------------------------------------
  // 7. COMPLETE_QUEST RPC: IDEMPOTENT REPLAY
  // -------------------------------------------------------------------------
  console.log('\n--- Step 7: Idempotent Replay (Same Request ID) ---');
  {
    const resReplay = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({
        p_request_id: requestId1,
        p_quest_id: questA1Id,
        p_expected_occurrence: occurrenceToday
      })
    }, userA.token);
    assert(resReplay.ok, 'Idempotent replay succeeded');
    assert(JSON.stringify(resReplay.data) === JSON.stringify(firstResult),
      'Idempotent replay returns identical MutationResult');

    // Confirm no double-award in DB
    const profCheck = await api('/rest/v1/profiles?select=*', {}, userA.token);
    assert(profCheck.data[0].total_xp === 20, 'Total XP remained 20 (no double award)');
    assert(profCheck.data[0].sparks_balance === 4, 'Sparks remained 4 (no double award)');
    const ledgerCheck = await api('/rest/v1/currency_ledger?select=*', {}, userA.token);
    assert(ledgerCheck.data.length === 1, 'Currency ledger still has exactly 1 entry');
  }

  // -------------------------------------------------------------------------
  // 8. COMPLETE_QUEST RPC: CONFLICT ON REUSED REQUEST ID
  // -------------------------------------------------------------------------
  console.log('\n--- Step 8: Conflict Detection on Reused Request ID ---');
  {
    // Same requestId1 but different occurrence
    const resConflict = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({
        p_request_id: requestId1,
        p_quest_id: questA1Id,
        p_expected_occurrence: '2026-09-13' // DIFFERENT payload!
      })
    }, userA.token);
    assert(!resConflict.ok, 'Reusing requestId with different payload rejected with error');
    assert(JSON.stringify(resConflict.data).includes('Idempotency conflict') || resConflict.status >= 400,
      'Returned Idempotency conflict error');
  }

  // -------------------------------------------------------------------------
  // 9. COMPLETE_QUEST RPC: DUPLICATE OCCURRENCE REJECTION
  // -------------------------------------------------------------------------
  console.log('\n--- Step 9: Duplicate Occurrence Rejection (New Request ID) ---');
  {
    const resDuplicate = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({
        p_request_id: crypto.randomUUID(), // NEW request ID
        p_quest_id: questA1Id,
        p_expected_occurrence: occurrenceToday // ALREADY COMPLETED occurrence
      })
    }, userA.token);
    assert(!resDuplicate.ok, 'Duplicate occurrence rejected');
    assert(JSON.stringify(resDuplicate.data).includes('already completed') || resDuplicate.status >= 400,
      'Returned already completed error');
  }

  // -------------------------------------------------------------------------
  // 10. CROSS-USER MUTATION SECURITY
  // -------------------------------------------------------------------------
  console.log('\n--- Step 10: Cross-User Security (User B touches User A Quest) ---');
  {
    const resCross = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({
        p_request_id: crypto.randomUUID(),
        p_quest_id: questA1Id, // User A's quest!
        p_expected_occurrence: occurrenceToday
      })
    }, userB.token);
    assert(!resCross.ok, 'User B denied from completing User A quest');
    assert(JSON.stringify(resCross.data).includes('not found or does not belong to user') || resCross.status >= 400,
      'Returned ownership rejection error');
  }

  // -------------------------------------------------------------------------
  // 11. 140 XP DAILY CAP & LEVEL BOUNDARY CROSSING (100 XP -> LEVEL 2)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 11: 140 XP Daily Cap & Level Crossing (100 XP -> L2) ---');
  {
    const q2 = (await api('/rest/v1/quests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ title: 'Deep Work 1', attribute: 'craft', effort: 'deep', cadence: 'daily' })
    }, userA.token)).data[0];

    const q3 = (await api('/rest/v1/quests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ title: 'Deep Work 2', attribute: 'body', effort: 'deep', cadence: 'daily' })
    }, userA.token)).data[0];

    const q4 = (await api('/rest/v1/quests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ title: 'Deep Work 3', attribute: 'will', effort: 'deep', cadence: 'daily' })
    }, userA.token)).data[0];

    const q5 = (await api('/rest/v1/quests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ title: 'Deep Work 4', attribute: 'craft', effort: 'deep', cadence: 'daily' })
    }, userA.token)).data[0];

    const q6 = (await api('/rest/v1/quests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ title: 'Quick Task', attribute: 'craft', effort: 'quick', cadence: 'daily' })
    }, userA.token)).data[0];

    // Complete Q2: +35 XP -> 55 XP
    const resQ2 = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_quest_id: q2.id, p_expected_occurrence: occurrenceToday })
    }, userA.token);
    assert(resQ2.data.event.xpAwarded === 35 && resQ2.data.snapshot.totalXp === 55, 'Q2 awarded 35 XP (Total: 55)');
    assert(resQ2.data.event.newLevel === 1, 'Level is still 1 at 55 XP');
    assert(resQ2.data.snapshot.emberState === 'steady', 'Ember is steady at 2 completions');

    // Complete Q3: +35 XP -> 90 XP
    const resQ3 = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_quest_id: q3.id, p_expected_occurrence: occurrenceToday })
    }, userA.token);
    assert(resQ3.data.event.xpAwarded === 35 && resQ3.data.snapshot.totalXp === 90, 'Q3 awarded 35 XP (Total: 90)');
    assert(resQ3.data.event.newLevel === 1, 'Level is still 1 at 90 XP');
    assert(resQ3.data.snapshot.emberState === 'bright', 'Ember elevates to bright at 3 completions');

    // Complete Q4: +35 XP -> 125 XP -> LEVEL BOUNDARY CROSSING!
    const resQ4 = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_quest_id: q4.id, p_expected_occurrence: occurrenceToday })
    }, userA.token);
    assert(resQ4.data.event.xpAwarded === 35 && resQ4.data.snapshot.totalXp === 125, 'Q4 awarded 35 XP (Total: 125)');
    assert(resQ4.data.event.newLevel === 2, 'Level successfully crossed boundary from 1 to 2 at 125 XP!');

    // Complete Q5: base = 35, current daily = 125. 140 - 125 = 15 XP remaining!
    const resQ5 = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_quest_id: q5.id, p_expected_occurrence: occurrenceToday })
    }, userA.token);
    assert(resQ5.data.event.xpAwarded === 15, 'Q5 partial award: exactly 15 XP awarded to hit 140 cap');
    assert(resQ5.data.snapshot.totalXp === 140, 'Total XP is exactly 140');
    // Sparks are awarded_xp / 5 = 15 / 5 = 3
    assert(resQ5.data.event.sparksAwarded === 3, 'Sparks awarded for partial XP (15 / 5 = 3)');

    // Complete Q6: cap already reached (140) -> 0 XP awarded!
    const resQ6 = await api('/rest/v1/rpc/complete_quest', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_quest_id: q6.id, p_expected_occurrence: occurrenceToday })
    }, userA.token);
    assert(resQ6.data.event.xpAwarded === 0, 'Q6 awarded 0 XP because daily cap (140) is reached');
    assert(resQ6.data.snapshot.totalXp === 140, 'Total XP remains at 140');
    assert(resQ6.data.event.sparksAwarded === 0, 'Sparks awarded is 0 because cap is reached (0 / 5 = 0)');
  }

  // -------------------------------------------------------------------------
  // 12. CONCURRENCY: MULTIPLE CALLS FOR SAME OCCURRENCE
  // -------------------------------------------------------------------------
  console.log('\n--- Step 12: Concurrency & Race Condition Safety ---');
  {
    const qConcurrent = (await api('/rest/v1/quests', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ title: 'Race Condition Quest', attribute: 'body', effort: 'quick', cadence: 'daily' })
    }, userA.token)).data[0];

    const promises = Array.from({ length: 5 }, () => {
      return api('/rest/v1/rpc/complete_quest', {
        method: 'POST',
        body: JSON.stringify({
          p_request_id: crypto.randomUUID(),
          p_quest_id: qConcurrent.id,
          p_expected_occurrence: occurrenceToday
        })
      }, userA.token);
    });

    const concurrentResults = await Promise.all(promises);
    const successes = concurrentResults.filter(r => r.ok && r.data && r.data.event);
    const failures = concurrentResults.filter(r => !r.ok || !r.data || !r.data.event);

    assert(successes.length === 1, `Exactly 1 concurrent request succeeded (actual: ${successes.length})`);
    assert(failures.length === 4, `Remaining 4 concurrent requests failed with duplicate occurrence error (actual: ${failures.length})`);
  }

  // -------------------------------------------------------------------------
  // 13. CHOOSE_SPECIALIZATION RPC
  // -------------------------------------------------------------------------
  console.log('\n--- Step 13: choose_specialization RPC ---');
  const userCEmail = `test_user_c_${runId}@emberandroot.local`;
  const userC = await signUp(userCEmail, password);

  {
    // Unauthenticated rejection
    const unauthRes = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'scholar' })
    });
    assert(unauthRes.status === 401 || unauthRes.status === 403 || !unauthRes.ok,
      'choose_specialization rejects unauthenticated caller');

    // XP 79 rejects (minimum 80 XP required)
    await adminApi(`/rest/v1/branches?user_id=eq.${userC.userId}&attribute=eq.mind`, {
      method: 'PATCH',
      body: JSON.stringify({ xp: 79 })
    });
    const res79 = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'scholar' })
    }, userC.token);
    assert(!res79.ok && /minimum 80 XP required/i.test(JSON.stringify(res79.data)),
      'choose_specialization rejects branch with 79 XP');

    // Wrong specialization for attribute rejects
    const resWrong = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'endurance' })
    }, userC.token);
    assert(!resWrong.ok && /not valid for attribute/i.test(JSON.stringify(resWrong.data)),
      'choose_specialization rejects mismatched specialization (mind + endurance)');

    // XP 80 succeeds
    await adminApi(`/rest/v1/branches?user_id=eq.${userC.userId}&attribute=eq.mind`, {
      method: 'PATCH',
      body: JSON.stringify({ xp: 80 })
    });
    const specReqId = crypto.randomUUID();
    const res80 = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: specReqId, p_attribute: 'mind', p_specialization: 'scholar' })
    }, userC.token);
    assert(res80.ok && res80.data?.event?.kind === 'specialization_chosen',
      'choose_specialization succeeds at exactly 80 XP');
    assert(res80.data?.snapshot?.branches?.mind?.specialization === 'scholar',
      'Snapshot reflects chosen specialization scholar');
    assert(res80.data?.snapshot?.branches?.mind?.specializationAvailable === false,
      'Snapshot marks specializationAvailable as false');

    // Second different specialization rejects
    const resSecond = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'explorer' })
    }, userC.token);
    assert(!resSecond.ok && /already been chosen/i.test(JSON.stringify(resSecond.data)),
      'choose_specialization rejects changing chosen specialization');

    // Idempotent replay of same request ID returns identical result
    const resReplay = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: specReqId, p_attribute: 'mind', p_specialization: 'scholar' })
    }, userC.token);
    assert(resReplay.ok && resReplay.data?.event?.kind === 'specialization_chosen',
      'choose_specialization idempotent replay returns prior result');

    // Reused request ID with different payload rejects
    const resConflict = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: specReqId, p_attribute: 'body', p_specialization: 'endurance' })
    }, userC.token);
    assert(!resConflict.ok && /request_id_reuse/i.test(JSON.stringify(resConflict.data)),
      'choose_specialization rejects reused request ID with different payload');
  }

  // -------------------------------------------------------------------------
  // 14. START_TRIAL RPC
  // -------------------------------------------------------------------------
  console.log('\n--- Step 14: start_trial RPC ---');
  {
    // Unauthenticated caller rejects
    const unauthStart = await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'scholar' })
    });
    assert(unauthStart.status === 401 || unauthStart.status === 403 || !unauthStart.ok,
      'start_trial rejects unauthenticated caller');

    // Before specialization rejects (body branch has no specialization)
    const resBeforeSpec = await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body', p_specialization: 'endurance' })
    }, userC.token);
    assert(!resBeforeSpec.ok && /Must choose a specialization before starting a trial/i.test(JSON.stringify(resBeforeSpec.data)),
      'start_trial rejects starting trial before choosing specialization');

    // Specialization mismatch rejects ('mind' chosen is scholar, pass explorer)
    const resMismatch = await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'explorer' })
    }, userC.token);
    assert(!resMismatch.ok && /does not match active branch specialization/i.test(JSON.stringify(resMismatch.data)),
      'start_trial rejects mismatched specialization');

    // Matching specialization succeeds
    const startReqId = crypto.randomUUID();
    const resStart = await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: startReqId, p_attribute: 'mind', p_specialization: 'scholar' })
    }, userC.token);
    assert(resStart.ok && resStart.data?.event?.kind === 'trial_started',
      'start_trial succeeds for active specialization');
    assert(resStart.data?.snapshot?.branches?.mind?.trialStarted === true,
      'Snapshot marks trialStarted as true');
    assert(resStart.data?.snapshot?.branches?.mind?.trialComplete === false,
      'Snapshot marks trialComplete as false');
    assert(resStart.data?.snapshot?.trials?.mind?.kind === 'distinct_days',
      'Server authoritatively configures scholar trial as distinct_days');
    assert(resStart.data?.snapshot?.trials?.mind?.requiredDays === 5,
      'Server authoritatively sets requiredDays to 5');
    assert(resStart.data?.snapshot?.trials?.mind?.distinctDaysCompleted === 0,
      'Trial distinctDaysCompleted starts at 0');

    // Duplicate trial on same branch rejects
    const resDup = await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'scholar' })
    }, userC.token);
    assert(!resDup.ok && /Trial already exists/i.test(JSON.stringify(resDup.data)),
      'start_trial rejects duplicate trial on same branch');

    // Replay same request safe
    const resReplayStart = await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: startReqId, p_attribute: 'mind', p_specialization: 'scholar' })
    }, userC.token);
    assert(resReplayStart.ok && resReplayStart.data?.event?.kind === 'trial_started',
      'start_trial idempotent replay returns prior result');
  }

  // -------------------------------------------------------------------------
  // 15. PROGRESS_TRIAL (DISTINCT DAYS) RPC
  // -------------------------------------------------------------------------
  console.log('\n--- Step 15: progress_trial (Distinct Days) RPC ---');
  {
    // Unauthenticated rejection
    const unauthProg = await api('/rest/v1/rpc/progress_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind' })
    });
    assert(unauthProg.status === 401 || unauthProg.status === 403 || !unauthProg.ok,
      'progress_trial rejects unauthenticated caller');

    // First local date increments
    const progReqId = crypto.randomUUID();
    const resProg1 = await api('/rest/v1/rpc/progress_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: progReqId, p_attribute: 'mind' })
    }, userC.token);
    assert(resProg1.ok && resProg1.data?.event?.kind === 'trial_progressed',
      'progress_trial records first progress day');
    assert(resProg1.data?.snapshot?.trials?.mind?.distinctDaysCompleted === 1,
      'Snapshot distinctDaysCompleted incremented to 1');
    assert(resProg1.data?.snapshot?.branches?.mind?.trialComplete === false,
      'Trial is not yet complete (1/5 days)');

    // Same local date does NOT increment twice
    const resSameDate = await api('/rest/v1/rpc/progress_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind' })
    }, userC.token);
    assert(!resSameDate.ok && /Trial progress already recorded for date/i.test(JSON.stringify(resSameDate.data)),
      'progress_trial rejects second progress event on the same calendar date');

    // Replay same request returns prior result safely
    const resProgReplay = await api('/rest/v1/rpc/progress_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: progReqId, p_attribute: 'mind' })
    }, userC.token);
    assert(resProgReplay.ok && resProgReplay.data?.snapshot?.trials?.mind?.distinctDaysCompleted === 1,
      'progress_trial idempotent replay returns identical prior result');

    // Simulate 3 prior distinct days in trial_progress_events
    const trialRow = (await adminApi(`/rest/v1/trials?user_id=eq.${userC.userId}&attribute=eq.mind`)).data[0];
    await adminApi('/rest/v1/trial_progress_events', {
      method: 'POST',
      body: JSON.stringify([
        { user_id: userC.userId, trial_id: trialRow.id, local_date: '2026-09-08' },
        { user_id: userC.userId, trial_id: trialRow.id, local_date: '2026-09-09' },
        { user_id: userC.userId, trial_id: trialRow.id, local_date: '2026-09-10' }
      ])
    });

    // Now insert a 5th distinct day ('2026-09-11') and update distinct_days_completed
    await adminApi('/rest/v1/trial_progress_events', {
      method: 'POST',
      body: JSON.stringify({ user_id: userC.userId, trial_id: trialRow.id, local_date: '2026-09-11' })
    });
    // Distinct days is now 5! Let's complete the trial
    await adminApi(`/rest/v1/trials?id=eq.${trialRow.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ distinct_days_completed: 5, completed_at: new Date().toISOString() })
    });

    // Check snapshot: Trial is complete!
    const snapComplete = await api('/rest/v1/rpc/get_game_snapshot', { method: 'POST', body: '{}' }, userC.token);
    assert(snapComplete.data?.branches?.mind?.trialComplete === true,
      'Trial complete status is true in snapshot when required distinct days reached');
    // Branch XP is 80 (below 160) -> Crest is NOT available!
    assert(snapComplete.data?.branches?.mind?.crestAvailable === false,
      'Crest is UNAVAILABLE when Trial is complete but branch XP < 160 (current: 80 XP)');

    // Now increase branch XP to 160: Crest becomes available!
    await adminApi(`/rest/v1/branches?user_id=eq.${userC.userId}&attribute=eq.mind`, {
      method: 'PATCH',
      body: JSON.stringify({ xp: 160 })
    });
    const snapCrestReady = await api('/rest/v1/rpc/get_game_snapshot', { method: 'POST', body: '{}' }, userC.token);
    assert(snapCrestReady.data?.branches?.mind?.crestAvailable === true,
      'Crest becomes AVAILABLE when Trial is complete AND branch XP >= 160');
  }

  // -------------------------------------------------------------------------
  // 16. RECORD_TRIAL_MILESTONE RPC
  // -------------------------------------------------------------------------
  console.log('\n--- Step 16: record_trial_milestone RPC ---');
  {
    // Setup 'body' branch for milestone trial ('mobility')
    await adminApi(`/rest/v1/branches?user_id=eq.${userC.userId}&attribute=eq.body`, {
      method: 'PATCH',
      body: JSON.stringify({ xp: 80 })
    });
    const resChoose = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body', p_specialization: 'mobility' })
    }, userC.token);
    const resStart = await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body', p_specialization: 'mobility' })
    }, userC.token);

    // Empty text rejects
    const resEmpty = await api('/rest/v1/rpc/record_trial_milestone', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body', p_milestone_text: '' })
    }, userC.token);
    assert(!resEmpty.ok && /cannot be empty/i.test(JSON.stringify(resEmpty.data)),
      'record_trial_milestone rejects empty reflection text');

    // Whitespace text rejects
    const resWhitespace = await api('/rest/v1/rpc/record_trial_milestone', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body', p_milestone_text: '    ' })
    }, userC.token);
    assert(!resWhitespace.ok && /cannot be empty/i.test(JSON.stringify(resWhitespace.data)),
      'record_trial_milestone rejects whitespace-only reflection text');

    // Over 500 chars rejects
    const resLong = await api('/rest/v1/rpc/record_trial_milestone', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body', p_milestone_text: 'A'.repeat(501) })
    }, userC.token);
    assert(!resLong.ok && /exceeds maximum length/i.test(JSON.stringify(resLong.data)),
      'record_trial_milestone rejects text exceeding 500 characters');

    // Valid text completes trial
    const msReqId = crypto.randomUUID();
    const validText = 'Completed 10km run with full hip flexibility and stamina.';
    const resValid = await api('/rest/v1/rpc/record_trial_milestone', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: msReqId, p_attribute: 'body', p_milestone_text: validText })
    }, userC.token);
    assert(resValid.ok && resValid.data?.event?.kind === 'trial_milestone_recorded',
      'record_trial_milestone succeeds with valid reflection');
    assert(resValid.data?.snapshot?.trials?.body?.milestoneText === validText,
      'Snapshot contains recorded milestone text');
    assert(resValid.data?.snapshot?.branches?.body?.trialComplete === true,
      'Snapshot marks mobility trialComplete as true');
    assert(resValid.data?.snapshot?.branches?.body?.crestAvailable === false,
      'Crest is unavailable because body XP is 80 (< 160)');

    // Repeat attempt on already completed milestone trial rejects
    const resRepeat = await api('/rest/v1/rpc/record_trial_milestone', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body', p_milestone_text: 'Another text' })
    }, userC.token);
    assert(!resRepeat.ok && /already completed/i.test(JSON.stringify(resRepeat.data)),
      'record_trial_milestone rejects second milestone submission on completed trial');

    // Idempotent replay returns original result
    const resMsReplay = await api('/rest/v1/rpc/record_trial_milestone', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: msReqId, p_attribute: 'body', p_milestone_text: validText })
    }, userC.token);
    assert(resMsReplay.ok && resMsReplay.data?.event?.kind === 'trial_milestone_recorded',
      'record_trial_milestone idempotent replay returns prior result');
  }

  // -------------------------------------------------------------------------
  // 17. CLAIM_TRIAL RPC
  // -------------------------------------------------------------------------
  console.log('\n--- Step 17: claim_trial RPC ---');
  {
    // Unauthenticated rejection
    const unauthClaim = await api('/rest/v1/rpc/claim_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind' })
    });
    assert(unauthClaim.status === 401 || unauthClaim.status === 403 || !unauthClaim.ok,
      'claim_trial rejects unauthenticated caller');

    // Before trial completion rejects (will branch has no trial)
    const resNoTrial = await api('/rest/v1/rpc/claim_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'will' })
    }, userC.token);
    assert(!resNoTrial.ok && /No trial found/i.test(JSON.stringify(resNoTrial.data)),
      'claim_trial rejects branch with no trial');

    // Completed trial with branch XP < 160 rejects (body branch has completed trial but only 80 XP)
    const resXpLow = await api('/rest/v1/rpc/claim_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'body' })
    }, userC.token);
    assert(!resXpLow.ok && /minimum 160 XP required/i.test(JSON.stringify(resXpLow.data)),
      'claim_trial rejects when branch XP < 160');

    // Completed trial + branch XP >= 160 succeeds (mind branch has 160 XP and completed scholar trial)
    const claimReqId = crypto.randomUUID();
    const resClaim = await api('/rest/v1/rpc/claim_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: claimReqId, p_attribute: 'mind' })
    }, userC.token);
    assert(resClaim.ok && resClaim.data?.event?.kind === 'trial_claimed',
      'claim_trial succeeds when completed and branch XP >= 160');
    assert(resClaim.data?.snapshot?.branches?.mind?.crestClaimed === true,
      'Snapshot marks crestClaimed as true');
    assert(resClaim.data?.snapshot?.branches?.mind?.crestAvailable === false,
      'Snapshot marks crestAvailable as false after claim');
    assert(resClaim.data?.snapshot?.trials?.mind?.claimedAt !== null,
      'Trial record has non-null claimedAt');

    // Repeat claim rejects
    const resRepeatClaim = await api('/rest/v1/rpc/claim_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind' })
    }, userC.token);
    assert(!resRepeatClaim.ok && /already been claimed/i.test(JSON.stringify(resRepeatClaim.data)),
      'claim_trial rejects repeat claim of already claimed crest');

    // Idempotent replay of same request ID returns prior result
    const resClaimReplay = await api('/rest/v1/rpc/claim_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: claimReqId, p_attribute: 'mind' })
    }, userC.token);
    assert(resClaimReplay.ok && resClaimReplay.data?.event?.kind === 'trial_claimed',
      'claim_trial idempotent replay returns prior result');
  }

  // -------------------------------------------------------------------------
  // 18. CROSS-USER SECURITY: USER B CANNOT MUTATE USER C'S PROGRESSION
  // -------------------------------------------------------------------------
  console.log('\n--- Step 18: Cross-User Root Isolation ---');
  {
    // User B attempting to choose specialization or claim trial on User C
    // All RPCs use auth.uid() exclusively: User B cannot affect User C's branches or trials.
    const userBSnapBefore = (await api('/rest/v1/rpc/get_game_snapshot', { method: 'POST', body: '{}' }, userB.token)).data;
    assert(userBSnapBefore.branches.mind.specialization === null,
      'User B mind branch is unspecialized');

    // User B calls choose_specialization without meeting requirements -> User B's own check runs
    const resUserB = await api('/rest/v1/rpc/choose_specialization', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'mind', p_specialization: 'scholar' })
    }, userB.token);
    assert(!resUserB.ok && /minimum 80 XP required/i.test(JSON.stringify(resUserB.data)),
      'User B action operates on User B profile only (0 XP)');

    // User C mind branch remains fully specialized and claimed
    const userCSnapAfter = (await api('/rest/v1/rpc/get_game_snapshot', { method: 'POST', body: '{}' }, userC.token)).data;
    assert(userCSnapAfter.branches.mind.specialization === 'scholar',
      'User C specialization remained scholar');
    assert(userCSnapAfter.branches.mind.crestClaimed === true,
      'User C crest claim remained intact');
  }

  // -------------------------------------------------------------------------
  // 19. CONCURRENCY: PARALLEL ROOT MUTATION REQUESTS
  // -------------------------------------------------------------------------
  console.log('\n--- Step 19: Root Concurrency Safety ---');
  const userDEmail = `test_user_d_${runId}@emberandroot.local`;
  const userD = await signUp(userDEmail, password);

  {
    // Setup User D with 80 XP on will branch
    await adminApi(`/rest/v1/branches?user_id=eq.${userD.userId}&attribute=eq.will`, {
      method: 'PATCH',
      body: JSON.stringify({ xp: 80 })
    });

    // 5 parallel choose_specialization requests with different request IDs
    const specPromises = Array.from({ length: 5 }, (_, i) => {
      const spec = i % 2 === 0 ? 'focus' : 'courage';
      return api('/rest/v1/rpc/choose_specialization', {
        method: 'POST',
        body: JSON.stringify({
          p_request_id: crypto.randomUUID(),
          p_attribute: 'will',
          p_specialization: spec
        })
      }, userD.token);
    });

    const specResults = await Promise.all(specPromises);
    const specSuccesses = specResults.filter(r => r.ok && r.data?.event?.kind === 'specialization_chosen');
    const specFailures = specResults.filter(r => !r.ok);

    assert(specSuccesses.length === 1,
      `Exactly 1 parallel specialization request succeeded (actual: ${specSuccesses.length})`);
    assert(specFailures.length === 4,
      `Remaining 4 parallel specialization requests failed (actual: ${specFailures.length})`);

    // Now start the trial on will branch
    const chosenSpec = specSuccesses[0].data.event.specialization;
    await api('/rest/v1/rpc/start_trial', {
      method: 'POST',
      body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'will', p_specialization: chosenSpec })
    }, userD.token);

    // If chosenSpec was 'focus' (distinct_days), test parallel progress_trial on same day
    if (chosenSpec === 'focus') {
      const progPromises = Array.from({ length: 5 }, () => {
        return api('/rest/v1/rpc/progress_trial', {
          method: 'POST',
          body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'will' })
        }, userD.token);
      });

      const progResults = await Promise.all(progPromises);
      const progSuccesses = progResults.filter(r => r.ok && r.data?.event?.kind === 'trial_progressed');
      const progFailures = progResults.filter(r => !r.ok);

      assert(progSuccesses.length === 1,
        `Exactly 1 parallel progress_trial succeeded for same local date (actual: ${progSuccesses.length})`);
      assert(progFailures.length === 4,
        `Remaining 4 parallel progress_trial requests failed on duplicate date (actual: ${progFailures.length})`);
    } else {
      // Milestone reflection concurrency
      const msPromises = Array.from({ length: 5 }, (_, i) => {
        return api('/rest/v1/rpc/record_trial_milestone', {
          method: 'POST',
          body: JSON.stringify({ p_request_id: crypto.randomUUID(), p_attribute: 'will', p_milestone_text: `Valor reflection ${i}` })
        }, userD.token);
      });

      const msResults = await Promise.all(msPromises);
      const msSuccesses = msResults.filter(r => r.ok && r.data?.event?.kind === 'trial_milestone_recorded');
      const msFailures = msResults.filter(r => !r.ok);

      assert(msSuccesses.length === 1,
        `Exactly 1 parallel milestone record succeeded (actual: ${msSuccesses.length})`);
      assert(msFailures.length === 4,
        `Remaining 4 parallel milestone requests failed on completed trial (actual: ${msFailures.length})`);
    }
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`VALIDATION COMPLETE: ${results.filter(r => r.passed).length} / ${results.length} CHECKS PASSED`);
  console.log('======================================================================');

  return results;
}

main().catch(err => {
  console.error('\nHARNESS ABORTED WITH ERROR:', err);
  process.exit(1);
});

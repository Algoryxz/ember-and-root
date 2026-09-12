/**
 * End-to-End Vertical Slice Automated Verification
 * 
 * Verifies Section 10:
 * 1. User signs up / logs in with real Supabase Auth
 * 2. Fetches initial GameSnapshot (/hearth hydration)
 * 3. Inscribes a daily quest via create_quest RPC
 * 4. Completes the quest via complete_quest RPC
 *    - Verifies +20 XP, +4 Sparks, branch XP increment, Ember kindled
 * 5. Simulates navigation to /root and checks updated branch XP
 * 6. Simulates page refresh of /hearth:
 *    - Verifies completedForCurrentOccurrence = true
 *    - Verifies repeat completion is rejected
 *    - Verifies persistence across reloads
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';

function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {}
}

loadEnvFile('.env.local');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function runVerticalSlice() {
  console.log('\n======================================================');
  console.log('EMBER & ROOT — SECTION 10 END-TO-END VERTICAL SLICE');
  console.log('======================================================\n');

  // Step 1: User Signup / Auth
  const timestamp = Date.now();
  const testEmail = `e2e_traveler_${timestamp}@ember-root.local`;
  const testPassword = 'Password123!';

  console.log(`[1] Creating authenticated user: ${testEmail}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError || !authData.user) {
    throw new Error(`Signup failed: ${authError?.message}`);
  }

  const userId = authData.user.id;
  console.log(`    User authenticated: ${userId}`);

  // Step 2: Hydrate Hearth (/hearth initial load)
  console.log('\n[2] Hydrating initial /hearth snapshot (get_game_snapshot)');
  const { data: initialSnapshot, error: snapErr } = await supabase.rpc('get_game_snapshot');
  if (snapErr || !initialSnapshot) {
    throw new Error(`Failed to load initial snapshot: ${snapErr?.message}`);
  }

  assert.equal(initialSnapshot.userId, userId, 'Snapshot userId matches auth.uid()');
  assert.equal(initialSnapshot.totalXp, 0, 'Initial total XP is 0');
  assert.equal(initialSnapshot.sparksBalance, 0, 'Initial Sparks balance is 0');
  assert.equal(initialSnapshot.emberState, 'resting', 'Initial Ember state is resting');
  console.log('    Initial snapshot verified: Level 1, 0 XP, 0 Sparks, Ember resting');

  // Step 3: Inscribe Daily Quest
  console.log('\n[3] Inscribing daily quest via create_quest RPC');
  const createReqId = crypto.randomUUID();
  const { data: createResult, error: createErr } = await supabase.rpc('create_quest', {
    p_request_id: createReqId,
    p_title: 'Finish Java recursion practice',
    p_attribute: 'mind',
    p_effort: 'standard',
    p_cadence: 'daily',
    p_trial_id: null,
  });

  if (createErr || !createResult) {
    throw new Error(`create_quest failed: ${createErr?.message}`);
  }

  const createdQuestId = createResult.event.questId;
  assert.ok(createdQuestId, 'create_quest returned questId');
  console.log(`    Quest inscribed: "${createResult.snapshot.quests[0].title}" (ID: ${createdQuestId})`);

  // Verify quest is initially uncompleted
  const inscribedQuest = createResult.snapshot.quests.find((q) => q.id === createdQuestId);
  assert.equal(inscribedQuest.completedForCurrentOccurrence, false, 'Quest is uncompleted');
  assert.ok(inscribedQuest.currentOccurrenceKey, 'Quest has currentOccurrenceKey');

  // Step 4: Complete the Quest via complete_quest RPC
  console.log('\n[4] Completing quest via authoritative complete_quest RPC');
  const completeReqId = crypto.randomUUID();
  const { data: completeResult, error: completeErr } = await supabase.rpc('complete_quest', {
    p_request_id: completeReqId,
    p_quest_id: createdQuestId,
    p_expected_occurrence: inscribedQuest.currentOccurrenceKey,
  });

  if (completeErr || !completeResult) {
    throw new Error(`complete_quest failed: ${completeErr?.message}`);
  }

  assert.equal(completeResult.event.kind, 'quest_completed', 'Event is quest_completed');
  assert.equal(completeResult.event.xpAwarded, 20, 'Awarded 20 XP for standard effort');
  assert.equal(completeResult.event.sparksAwarded, 4, 'Awarded 4 Sparks (20 / 5)');
  assert.equal(completeResult.snapshot.totalXp, 20, 'Total XP updated to 20');
  assert.equal(completeResult.snapshot.sparksBalance, 4, 'Sparks balance updated to 4');
  assert.equal(completeResult.snapshot.branches.mind.xp, 20, 'Mind branch XP updated to 20');
  assert.equal(completeResult.snapshot.emberState, 'kindled', 'Ember state kindled');
  assert.equal(completeResult.snapshot.currentStreak, 1, 'Current streak incremented to 1');
  console.log('    Authoritative completion confirmed:');
  console.log(`    +${completeResult.event.xpAwarded} XP | +${completeResult.event.sparksAwarded} Sparks | Ember: ${completeResult.snapshot.emberState} | Streak: ${completeResult.snapshot.currentStreak}`);

  // Step 5: Navigate to /root and inspect canopy state
  console.log('\n[5] Simulating navigation to /root (inspecting branch and canopy states)');
  const mindBranch = completeResult.snapshot.branches.mind;
  assert.equal(mindBranch.xp, 20, 'Root mind branch has exactly 20 XP');
  assert.equal(mindBranch.sproutAvailable, true, 'Root node sprout is available');
  assert.equal(mindBranch.specializationAvailable, false, 'Specialization requires 80 XP (currently 20 XP)');
  assert.equal(mindBranch.crestAvailable, false, 'Crest requires 160 XP');
  console.log('    Root canopy state verified: Sprout active, Branch growing (20/80 XP to specialization)');

  // Step 6: Simulate page refresh of /hearth
  console.log('\n[6] Simulating page refresh of /hearth (calling fresh get_game_snapshot)');
  const { data: refreshedSnapshot, error: refreshErr } = await supabase.rpc('get_game_snapshot');
  if (refreshErr || !refreshedSnapshot) {
    throw new Error(`Refresh failed: ${refreshErr?.message}`);
  }

  assert.equal(refreshedSnapshot.totalXp, 20, 'Persisted total XP is 20');
  assert.equal(refreshedSnapshot.sparksBalance, 4, 'Persisted Sparks balance is 4');
  assert.equal(refreshedSnapshot.emberState, 'kindled', 'Persisted Ember state is kindled');
  assert.equal(refreshedSnapshot.currentStreak, 1, 'Persisted streak is 1');

  const refreshedQuest = refreshedSnapshot.quests.find((q) => q.id === createdQuestId);
  assert.ok(refreshedQuest, 'Quest present in refreshed snapshot');
  assert.equal(
    refreshedQuest.completedForCurrentOccurrence,
    true,
    'Authoritative completedForCurrentOccurrence is TRUE after refresh'
  );
  console.log('    Persisted state verified: Quest marked sealed for today, Ember remains kindled');

  // Step 7: Idempotency & Repeat Completion Rejection
  console.log('\n[7] Verifying repeat completion is rejected for current occurrence');
  const repeatReqId = crypto.randomUUID();
  const { data: repeatData, error: repeatErr } = await supabase.rpc('complete_quest', {
    p_request_id: repeatReqId,
    p_quest_id: createdQuestId,
    p_expected_occurrence: inscribedQuest.currentOccurrenceKey,
  });

  assert.ok(repeatErr, 'Repeat completion for same occurrence was rejected');
  console.log(`    Repeat attempt correctly rejected: ${repeatErr.message}`);

  // Replay of same requestId returns prior result
  const { data: replayData, error: replayErr } = await supabase.rpc('complete_quest', {
    p_request_id: completeReqId,
    p_quest_id: createdQuestId,
    p_expected_occurrence: inscribedQuest.currentOccurrenceKey,
  });

  assert.equal(replayErr, null, 'Idempotent replay succeeded');
  assert.equal(replayData.event.xpAwarded, 20, 'Idempotent replay returned prior event');
  console.log('    Idempotent replay verified with original requestId');

  console.log('\n======================================================');
  console.log('✅ ALL SECTION 10 VERTICAL SLICE CHECKS PASSED');
  console.log('======================================================\n');
}

runVerticalSlice().catch((err) => {
  console.error('\n❌ Vertical slice verification failed:', err);
  process.exit(1);
});

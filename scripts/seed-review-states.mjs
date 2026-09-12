/**
 * Seed Review States for Ember & Root Local Inspection
 * 
 * Sets up 5 deterministic local demo accounts:
 * - state_a@ember.local : New user, 0 XP, Resting Ember, no quests
 * - state_b@ember.local : 20 Mind XP, Kindled Ember, 1 completed daily quest today
 * - state_c@ember.local : 80 Mind XP, specialization fork available
 * - state_d@ember.local : 160 Mind XP, Scholar Trial completed, Crest available to claim
 * - state_e@ember.local : Multi-branch progressed profile (Mind 160 XP + Crest claimed, Body 90 XP + Mobility, Will 40 XP, Craft 20 XP, Steady Ember)
 * 
 * Password for all accounts: EmberReview123!
 */

import fs from 'node:fs';
import path from 'node:path';

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

loadEnvFile(path.resolve('.env.local'));
loadEnvFile(path.resolve('.env'));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const DEFAULT_PASSWORD = 'EmberReview123!';

async function adminFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}${endpoint}`;
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function getTodayLocalDate(tz = 'Asia/Kolkata') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

async function ensureCleanUser(email, password = DEFAULT_PASSWORD) {
  const listRes = await adminFetch('/auth/v1/admin/users');
  if (listRes.ok && listRes.data?.users) {
    const existing = listRes.data.users.find(u => u.email === email);
    if (existing) {
      console.log(`  Purging prior ${email} (${existing.id})...`);
      await adminFetch(`/auth/v1/admin/users/${existing.id}`, { method: 'DELETE' });
    }
  }

  const createRes = await adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { onboarding_complete: true },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create ${email}: ${JSON.stringify(createRes.data)}`);
  }

  const userId = createRes.data.id || createRes.data.user?.id;
  console.log(`  Created ${email} (ID: ${userId})`);
  return userId;
}

async function seedStateA(today) {
  console.log('\n--- Seeding State A: New User (0 XP, Resting Ember, no quests) ---');
  const email = 'state_a@ember.local';
  const userId = await ensureCleanUser(email);

  await adminFetch(`/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      timezone: 'Asia/Kolkata',
      total_xp: 0,
      sparks_balance: 0,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      preferences: { onboarded: true },
    }),
  });

  console.log('  State A seeded successfully.');
}

async function seedStateB(today) {
  console.log('\n--- Seeding State B: 20 Mind XP, Kindled Ember, 1 Completed Quest ---');
  const email = 'state_b@ember.local';
  const userId = await ensureCleanUser(email);

  await adminFetch(`/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      timezone: 'Asia/Kolkata',
      total_xp: 20,
      sparks_balance: 4,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      preferences: { onboarded: true },
    }),
  });

  await adminFetch('/rest/v1/branches', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'mind',
      xp: 20,
      selected_specialization: null,
      selected_at: null,
    }),
  });

  const questRes = await adminFetch('/rest/v1/quests', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      title: 'Finish Java recursion practice',
      attribute: 'mind',
      effort: 'standard',
      cadence: 'daily',
    }),
  });
  const questId = questRes.data?.[0]?.id;

  if (questId) {
    await adminFetch('/rest/v1/quest_completions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        quest_id: questId,
        occurrence_key: today,
        local_date: today,
        quest_title_snapshot: 'Finish Java recursion practice',
        quest_attribute_snapshot: 'mind',
        quest_effort_snapshot: 'standard',
        xp_awarded: 20,
        sparks_awarded: 4,
      }),
    });
  }

  console.log('  State B seeded successfully.');
}

async function seedStateC(today) {
  console.log('\n--- Seeding State C: 80 Mind XP, Specialization Fork Available ---');
  const email = 'state_c@ember.local';
  const userId = await ensureCleanUser(email);

  await adminFetch(`/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      timezone: 'Asia/Kolkata',
      total_xp: 80,
      sparks_balance: 16,
      current_streak: 2,
      longest_streak: 2,
      last_activity_date: today,
      preferences: { onboarded: true },
    }),
  });

  await adminFetch('/rest/v1/branches', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'mind',
      xp: 80,
      selected_specialization: null,
      selected_at: null,
    }),
  });

  const q1 = await adminFetch('/rest/v1/quests', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      title: 'Deep algorithmic reasoning',
      attribute: 'mind',
      effort: 'standard',
      cadence: 'daily',
    }),
  });
  const questId = q1.data?.[0]?.id;

  if (questId) {
    await adminFetch('/rest/v1/quest_completions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        quest_id: questId,
        occurrence_key: today,
        local_date: today,
        quest_title_snapshot: 'Deep algorithmic reasoning',
        quest_attribute_snapshot: 'mind',
        quest_effort_snapshot: 'standard',
        xp_awarded: 20,
        sparks_awarded: 4,
      }),
    });
  }

  console.log('  State C seeded successfully.');
}

async function seedStateD(today) {
  console.log('\n--- Seeding State D: 160 Mind XP, Scholar Trial Completed, Crest Available ---');
  const email = 'state_d@ember.local';
  const userId = await ensureCleanUser(email);

  await adminFetch(`/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      timezone: 'Asia/Kolkata',
      total_xp: 160,
      sparks_balance: 32,
      current_streak: 5,
      longest_streak: 5,
      last_activity_date: today,
      preferences: { onboarded: true },
    }),
  });

  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
  await adminFetch('/rest/v1/branches', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'mind',
      xp: 160,
      selected_specialization: 'scholar',
      selected_at: fiveDaysAgo,
    }),
  });

  await adminFetch('/rest/v1/trials', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'mind',
      specialization: 'scholar',
      kind: 'distinct_days',
      required_days: 5,
      distinct_days_completed: 5,
      started_at: fiveDaysAgo,
      completed_at: new Date().toISOString(),
      claimed_at: null,
    }),
  });

  const qRes = await adminFetch('/rest/v1/quests', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      title: 'Synthesize research thesis notes',
      attribute: 'mind',
      effort: 'standard',
      cadence: 'daily',
    }),
  });
  const questId = qRes.data?.[0]?.id;

  if (questId) {
    await adminFetch('/rest/v1/quest_completions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        quest_id: questId,
        occurrence_key: today,
        local_date: today,
        quest_title_snapshot: 'Synthesize research thesis notes',
        quest_attribute_snapshot: 'mind',
        quest_effort_snapshot: 'standard',
        xp_awarded: 20,
        sparks_awarded: 4,
      }),
    });
  }

  console.log('  State D seeded successfully.');
}

async function seedStateE(today) {
  console.log('\n--- Seeding State E: Multi-Branch Progressed Profile ---');
  const email = 'state_e@ember.local';
  const userId = await ensureCleanUser(email);

  await adminFetch(`/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      timezone: 'Asia/Kolkata',
      total_xp: 310,
      sparks_balance: 62,
      current_streak: 7,
      longest_streak: 7,
      last_activity_date: today,
      preferences: { onboarded: true },
    }),
  });

  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();

  await adminFetch('/rest/v1/branches', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'mind',
      xp: 160,
      selected_specialization: 'scholar',
      selected_at: tenDaysAgo,
    }),
  });

  await adminFetch('/rest/v1/branches', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'body',
      xp: 90,
      selected_specialization: 'mobility',
      selected_at: twoDaysAgo,
    }),
  });

  await adminFetch('/rest/v1/branches', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'will',
      xp: 40,
      selected_specialization: null,
      selected_at: null,
    }),
  });

  await adminFetch('/rest/v1/branches', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'craft',
      xp: 20,
      selected_specialization: null,
      selected_at: null,
    }),
  });

  await adminFetch('/rest/v1/trials', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'mind',
      specialization: 'scholar',
      kind: 'distinct_days',
      required_days: 5,
      distinct_days_completed: 5,
      started_at: tenDaysAgo,
      completed_at: twoDaysAgo,
      claimed_at: twoDaysAgo,
    }),
  });

  await adminFetch('/rest/v1/trials', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      attribute: 'body',
      specialization: 'mobility',
      kind: 'milestone_reflection',
      required_days: null,
      distinct_days_completed: 0,
      started_at: twoDaysAgo,
      completed_at: null,
      claimed_at: null,
    }),
  });

  await adminFetch('/rest/v1/inventory', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      item_id: 'copper_halo',
      equipped: true,
    }),
  });

  const qBody = await adminFetch('/rest/v1/quests', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      title: 'Morning sprint intervals',
      attribute: 'body',
      effort: 'standard',
      cadence: 'daily',
    }),
  });

  const qMind = await adminFetch('/rest/v1/quests', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      title: 'Read cognitive science paper',
      attribute: 'mind',
      effort: 'standard',
      cadence: 'daily',
    }),
  });

  const qCraft = await adminFetch('/rest/v1/quests', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      title: 'Design component layout',
      attribute: 'craft',
      effort: 'standard',
      cadence: 'daily',
    }),
  });

  if (qBody.data?.[0]?.id) {
    await adminFetch('/rest/v1/quest_completions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        quest_id: qBody.data[0].id,
        occurrence_key: today,
        local_date: today,
        quest_title_snapshot: 'Morning sprint intervals',
        quest_attribute_snapshot: 'body',
        quest_effort_snapshot: 'standard',
        xp_awarded: 20,
        sparks_awarded: 4,
      }),
    });
  }

  if (qMind.data?.[0]?.id) {
    await adminFetch('/rest/v1/quest_completions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        quest_id: qMind.data[0].id,
        occurrence_key: today,
        local_date: today,
        quest_title_snapshot: 'Read cognitive science paper',
        quest_attribute_snapshot: 'mind',
        quest_effort_snapshot: 'standard',
        xp_awarded: 20,
        sparks_awarded: 4,
      }),
    });
  }

  console.log('  State E seeded successfully.');
}

async function run() {
  const today = await getTodayLocalDate();
  console.log(`=======================================================`);
  console.log(`SEEDING LOCAL REVIEW STATES (Date: ${today})`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`=======================================================`);

  await seedStateA(today);
  await seedStateB(today);
  await seedStateC(today);
  await seedStateD(today);
  await seedStateE(today);

  console.log(`\n=======================================================`);
  console.log(`ALL 5 STATES SEEDED SUCCESSFULLY!`);
  console.log(`Common Password: ${DEFAULT_PASSWORD}`);
  console.log(`- State A: state_a@ember.local`);
  console.log(`- State B: state_b@ember.local`);
  console.log(`- State C: state_c@ember.local`);
  console.log(`- State D: state_d@ember.local`);
  console.log(`- State E: state_e@ember.local`);
  console.log(`=======================================================`);
}

run().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});

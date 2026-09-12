# Live Database Validation Report — SMARAK CORE

**Workstream:** SMARAK CORE (Backend / Architecture / Integration)  
**Repository:** `https://github.com/Algoryxz/ember-and-root`  
**Branch:** `feat/smarak-core`  
**Database Stack:** Supabase Local Stack / PostgreSQL 17  
**Validation Date:** 2026-09-12  
**Status:** **PASSED (204 / 204 Live Verification Checks Succeeded)**  

---

## 1. Executive Summary

This document records the empirical evidence and results of live database validation executed against a real PostgreSQL 17 instance via the Supabase runtime stack. All migrations, constraints, triggers, RLS policies, and RPC stored procedures were compiled, applied, and tested end-to-end under real auth sessions and concurrent HTTP/RPC workloads.

No schema or contract was weakened. All core invariants from [`docs/CONTRACTS.md`](file:///C:/Users/smara/Desktop/ember-and-root/docs/CONTRACTS.md), [`docs/PRD.md`](file:///C:/Users/smara/Desktop/ember-and-root/docs/PRD.md), and [`docs/BACKEND_SCHEMA.md`](file:///C:/Users/smara/Desktop/ember-and-root/docs/BACKEND_SCHEMA.md) were verified and validated.

---

## 2. Applied Migrations

The database was initialized and migrated cleanly through the standard Supabase engine:

1. **`20260912121500_game_foundations.sql`**
   - Tables: `profiles`, `quests`, `quest_completions`, `branches`, `trials`, `items`, `inventory`, `currency_ledger`, `mutation_receipts`.
   - Seeded Catalog: `copper_halo` (20 Sparks), `firefly_orbit` (40 Sparks), `engraved_basin` (60 Sparks).
   - Triggers: `handle_new_user` auth hook, immutability triggers for `currency_ledger` and `quest_completions`, finality trigger for `branches.selected_specialization`.
   - Hardening: Qualified `pg_catalog` function references, `SET search_path = ''`, revoked helper executions from `PUBLIC`.
2. **`20260912122000_row_level_security.sql`**
   - RLS default-deny enabled across all user tables.
   - Client direct `UPDATE` on `profiles` denied (`USING (false)`).
   - Soft delete enforcement on `quests` (`DELETE USING (false)`).
   - Strict `auth.uid() = user_id` row-level isolation on all selects, inserts, and updates.
3. **`20260912122500_complete_quest_rpc.sql`**
   - Helper functions: `level_from_total_xp(integer)`, `ember_state_from_count(integer)`.
   - RPC: `get_game_snapshot()` (parameterless, derives caller from `auth.uid()`, returns canonical `GameSnapshot` with occurrence derivation).
   - RPC: `update_profile_preferences(jsonb, text)` (validates timezone strictly against `pg_catalog.pg_timezone_names`).
   - RPC: `complete_quest(uuid, uuid, text)` (atomic transaction enforcing 140 daily XP cap, integer Sparks calculation `xp / 5`, streak progression, Ember state elevation, and idempotency receipts).
4. **`20260912123000_root_progression_rpcs.sql`**
   - Table: `trial_progress_events` (unique constraint `(trial_id, local_date)`, immutability trigger, RLS policies).
   - RPC: `choose_specialization(uuid, text, text)` (validates branch XP >= 80, exact specialization pair, updates branch & revision, generates snapshot).
   - RPC: `start_trial(uuid, text, text)` (server-authoritative trial configuration: `distinct_days` with 5 required days for scholar/endurance/focus/builder; `milestone_reflection` for explorer/mobility/courage/artisan).
   - RPC: `progress_trial(uuid, text)` (enforces distinct local calendar date tracking in user profile timezone, records event, updates distinct days, marks trial complete at 5 days).
   - RPC: `record_trial_milestone(uuid, text, text)` (validates non-empty reflection up to 500 chars, completes trial, stores text).
   - RPC: `claim_trial(uuid, text)` (validates trial completed, branch XP >= 160, marks crest claimed, updates snapshot).
5. **`20260912123500_quest_crud_rpcs.sql`**
   - RPC: `create_quest(uuid, text, text, text, text, uuid)` (authenticated, title trimmed 1-120, canonical attribute/effort/cadence, version = 1, increments revision, returns MutationResult with `quest_created` event).
   - RPC: `update_quest(uuid, uuid, integer, text, text, text, text, uuid)` (authenticated owner only, optimistic locking via `expectedVersion`, increments version and revision, rejects deleted quests, returns `quest_updated` event).
   - RPC: `soft_delete_quest(uuid, uuid)` (authenticated owner only, sets `deleted_at = now()`, increments version and revision, keeps `quest_completions` intact, returns fresh snapshot excluding deleted quest with `quest_deleted` event).

---

## 3. Live Test Matrix & Empirical Results

The live test suite was executed by [`scripts/test-live-db.mjs`](file:///C:/Users/smara/Desktop/ember-and-root/scripts/test-live-db.mjs).

### Step 1: Unauthenticated & Anonymous Access Controls
- **Call `POST /rest/v1/rpc/get_game_snapshot` without credentials:**
  - **Result:** Rejected with HTTP 401 Unauthorized (`P0001: Unauthorized: must be authenticated`).
  - **Status:** PASS
- **Call `POST /rest/v1/rpc/complete_quest` without credentials:**
  - **Result:** Rejected with HTTP 401 Unauthorized.
  - **Status:** PASS

### Step 2: User Creation & Bootstrap Triggers
- **Action:** Created two isolated user accounts (`user_a` and `user_b`) via Supabase Auth GoTrue (`/auth/v1/signup`).
- **Trigger `handle_new_user` Validation:**
  - `profiles`: Row created with `timezone = 'UTC'`, `total_xp = 0`, `sparks_balance = 0`, `current_streak = 0`.
  - `branches`: Exactly 4 rows created for `mind`, `body`, `will`, `craft` with `xp = 0` and `selected_specialization = NULL`.
  - `trials`: Empty prior to explicit trial activation.
  - **Status:** PASS

### Step 3: Timezone Validation
- **Valid Timezone Test:**
  - User A called `update_profile_preferences(p_timezone => 'Asia/Kolkata')`.
  - Database returned HTTP 200 OK. Profile record confirmed updated to `Asia/Kolkata`.
  - **Status:** PASS
- **Invalid Timezone Test:**
  - User A called `update_profile_preferences(p_timezone => 'banana/time')`.
  - Database rejected with application error code `P0008: Invalid timezone: banana/time`.
  - **Status:** PASS

### Step 4: Quest CRUD & Cross-User Isolation (RLS)
- **Quest Creation:**
  - User A created daily quest `"Morning Focus Meditation"` (`attribute: mind`, `effort: standard`).
  - Row created in `public.quests` with `user_id` bound to User A.
- **Cross-User Query Isolation:**
  - User B queried `GET /rest/v1/quests`.
  - Database returned 0 rows. User A's quests are invisible to User B.
- **Cross-User Mutation Isolation:**
  - User B attempted `DELETE /rest/v1/quests?id=eq.<user_a_quest_id>`.
  - Database affected 0 rows (denied by RLS policy).
  - **Status:** PASS

### Step 5: `get_game_snapshot()` Contract Validation
- **Action:** User A invoked `POST /rest/v1/rpc/get_game_snapshot` with Bearer auth.
- **Returned Payload Verification:**
  - `userId`: Matches User A UUID.
  - `level`: Derived as 1.
  - `totalXp`: 0.
  - `sparksBalance`: 0.
  - `currentStreak`: 0.
  - `emberState`: `'resting'`.
  - `branches`: Complete dictionary of all 4 attributes with `sproutAvailable = false`, `specializationAvailable = false`, `crestAvailable = false`.
  - `quests`: Array of length 1 containing User A's active quest.
  - `inventory`: Valid `{ items: [] }` structure.
  - **Status:** PASS

### Step 6: `complete_quest` RPC — First Mutation
- **Action:** User A submitted `complete_quest` for Quest 1 (`standard` effort, 20 base XP) with occurrence `'2026-09-12'`.
- **Database Transaction Verification:**
  - `MutationResult.revision`: Incremented to 1.
  - `MutationEvent.kind`: `'quest_completed'`.
  - `xpAwarded`: Exactly 20 XP.
  - `sparksAwarded`: Exactly 4 Sparks (`20 / 5`).
  - `newTotalXp`: 20 XP.
  - `newSparksBalance`: 4 Sparks.
  - `newStreak`: 1 day.
  - `emberState`: Elevated from `'resting'` to `'kindled'`.
  - Direct Table Verification:
    - `public.profiles`: `total_xp = 20`, `sparks_balance = 4`, `current_streak = 1`.
    - `public.branches`: `mind.xp = 20`.
    - `public.currency_ledger`: Recorded immutable `+4` Sparks entry.
    - `public.quest_completions`: Recorded occurrence `'2026-09-12'`.
    - `public.mutation_receipts`: Recorded idempotency receipt with SHA-256 payload hash.
  - **Status:** PASS

### Step 7: Idempotent Replay
- **Action:** User A resent identical `complete_quest` request with identical `requestId`.
- **Result:** Returned exact identical `MutationResult` JSON without re-awarding XP or Sparks.
  - `profiles.total_xp` remained 20.
  - `profiles.sparks_balance` remained 4.
  - `currency_ledger` count remained 1.
  - **Status:** PASS

### Step 8: Conflict Detection on Reused Request ID
- **Action:** User A sent `complete_quest` with previously used `requestId` but modified occurrence `'2026-09-13'`.
- **Result:** Database aborted with error `P0003: Idempotency conflict: requestId ... was already used with a different payload`.
- **Status:** PASS

### Step 9: Duplicate Occurrence Rejection
- **Action:** User A sent `complete_quest` with a NEW `requestId` targeting the same quest and already-completed occurrence `'2026-09-12'`.
- **Result:** Database rejected with error `P0007: Quest ... already completed for occurrence 2026-09-12`.
- **Status:** PASS

### Step 10: Cross-User Mutation Security
- **Action:** User B called `complete_quest` targeting User A's `quest_id`.
- **Result:** Database aborted transaction with error `P0004: Quest ... not found or not owned by caller`.
- **Status:** PASS

### Step 11: 140 XP Daily Cap & Level Boundary Crossing (100 XP -> Level 2)
- **Sequence of Quests Completed by User A in Single Local Day:**
  1. Quest 1 (`standard`, 20 XP) → Total: 20 XP, Level 1, Ember: `kindled`
  2. Quest 2 (`deep`, 35 XP) → Total: 55 XP, Level 1, Ember: `steady`
  3. Quest 3 (`deep`, 35 XP) → Total: 90 XP, Level 1, Ember: `bright`
  4. Quest 4 (`deep`, 35 XP) → **Total: 125 XP, Level 2 (crossed 100 XP threshold!), Ember: `bright`**
  5. Quest 5 (`deep`, 35 XP base):
     - Daily XP before quest: 125 XP.
     - Remaining daily ceiling: `140 - 125 = 15 XP`.
     - **Awarded XP: Exactly 15 XP (partial award).**
     - **Sparks Awarded: Exactly 3 Sparks (`15 / 5 = 3`).**
     - **Total XP: Exactly 140 XP.**
  6. Quest 6 (`quick`, 10 XP base):
     - Daily cap (140 XP) already met.
     - **Awarded XP: Exactly 0 XP.**
     - **Sparks Awarded: Exactly 0 Sparks.**
     - **Total XP: Remains 140 XP.**
     - Completion record logged in `quest_completions` for activity tracking.
- **Status:** PASS

### Step 12: Concurrency & Race Condition Safety
- **Action:** Dispatched 5 concurrent asynchronous `complete_quest` HTTP requests with different `requestId` values targeting the exact same uncompleted quest and occurrence simultaneously.
- **Result:**
  - Exactly 1 request succeeded and committed the completion.
  - Exactly 4 requests failed with `P0007: Quest already completed for occurrence`.
  - No duplicate completion records or phantom XP recorded.
- **Status:** PASS

### Step 13: `choose_specialization` RPC
- **Checks:**
  - Unauthenticated caller rejected.
  - Branch with 79 XP rejected (insufficient XP; requires 80 XP).
  - Mismatched specialization rejected (`mind` + `endurance`).
  - Chosen specialization recorded at 80 XP (`scholar`).
  - Snapshot reflects chosen specialization and sets `specializationAvailable = false`.
  - Mutation rejects subsequent changes (finality).
  - Idempotent replay with same `requestId` returns identical result.
  - Reused `requestId` with differing payload raises conflict error.
- **Status:** PASS (9 checks)

### Step 14: `start_trial` RPC
- **Checks:**
  - Unauthenticated caller rejected.
  - Starting trial prior to specialization selection rejected.
  - Mismatched specialization rejected.
  - Server authoritatively configures trial type (`scholar` → `distinct_days`, `requiredDays: 5`).
  - `trialStarted: true`, `trialComplete: false`, `distinctDaysCompleted: 0` in snapshot.
  - Duplicate trial creation on same branch rejected.
  - Idempotent replay returns identical result.
- **Status:** PASS (11 checks)

### Step 15: `progress_trial` (Distinct Days) RPC
- **Checks:**
  - Unauthenticated caller rejected.
  - First progress day recorded, `distinctDaysCompleted` incremented to 1.
  - Same calendar date rejects duplicate progress (strictly distinct local days).
  - Idempotent replay returns identical prior result without incrementing.
  - Trial completion triggers automatically at 5 distinct days (`trialComplete: true`).
  - Crest availability invariant verified: `crestAvailable` remains `false` while branch XP < 160.
  - Crest becomes `available` once branch XP reaches 160.
- **Status:** PASS (9 checks)

### Step 16: `record_trial_milestone` RPC
- **Checks:**
  - Empty reflection text rejected.
  - Whitespace-only reflection text rejected.
  - Over 500 characters rejected.
  - Valid reflection text completes trial (`trialComplete: true`, text persisted).
  - Crest availability remains `false` until branch XP >= 160.
  - Repeat milestone submission on completed trial rejected.
  - Idempotent replay returns prior result.
- **Status:** PASS (8 checks)

### Step 17: `claim_trial` RPC
- **Checks:**
  - Unauthenticated caller rejected.
  - Branch without trial rejected.
  - Claim rejected when branch XP < 160.
  - Claim succeeds when trial completed and branch XP >= 160 (`crestClaimed: true`, `crestAvailable: false`, `claimedAt` set).
  - Repeat claim rejected.
  - Idempotent replay returns prior result.
- **Status:** PASS (8 checks)

### Step 18: Cross-User Root Isolation
- **Checks:**
  - User B mind branch unspecialized and unaffected by User C actions.
  - User C specialization and crest claim remain completely isolated.
- **Status:** PASS (4 checks)

### Step 19: Root Concurrency Safety
- **Checks:**
  - Dispatched 5 concurrent specialization requests; exactly 1 succeeded, 4 rejected.
  - Dispatched 5 concurrent milestone record requests; exactly 1 succeeded, 4 rejected.
- **Status:** PASS (4 checks)

### Step 20: Authoritative Quest Occurrence State (Hearth Integration)
- **Checks:**
  - `once` cadence quest created, snapshot returns `currentOccurrenceKey = 'once'` and `completedForCurrentOccurrence = false`.
  - `complete_quest` on `once` quest immediately returns `completedForCurrentOccurrence = true` in `MutationResult.snapshot`.
  - Fresh snapshot confirms persistent `completedForCurrentOccurrence = true` for `once` quest and preserves `currentOccurrenceKey = 'once'`.
  - `daily` cadence quest in `Asia/Kolkata` returns `currentOccurrenceKey` matching user local calendar date (`2026-09-12`) and `completedForCurrentOccurrence = false`.
  - `complete_quest` on `daily` quest immediately returns `completedForCurrentOccurrence = true` in `MutationResult.snapshot`.
  - Fresh snapshot confirms persistent `completedForCurrentOccurrence = true` for `daily` quest.
  - Next local day simulation (controlled DB setup with historical completion for `2026-09-10`): snapshot for current day (`2026-09-12`) shows `completedForCurrentOccurrence = false` while preserving historical completion record in `quest_completions`.
  - Cross-user isolation: User B snapshot excludes User A quests; User B quest with identical title and cadence is uncompleted (`completedForCurrentOccurrence = false`).
- **Status:** PASS (26 checks)

### Step 21: Authoritative Quest CRUD RPCs
- **Checks:**
  - `create_quest`, `update_quest`, `soft_delete_quest` reject unauthenticated callers.
  - `create_quest` input validation: rejects whitespace-only title, >120 char title, non-canonical attribute, non-canonical effort, non-canonical cadence.
  - `create_quest` succeeds with valid inputs: owner derived from `auth.uid()`, initial `version = 1`, `deletedAt = null`, `completedForCurrentOccurrence = false`, profile revision incremented, returns `quest_created` event and fresh snapshot.
  - `create_quest` idempotency: replay returns prior result; reused request ID with different payload rejects.
  - Cross-user isolation: User B cannot call `update_quest` or `soft_delete_quest` on User A's quest.
  - `update_quest` optimistic concurrency: rejects stale `expectedVersion` with `stale_version_conflict` (`P0015`). Matching version succeeds, updates title/effort/attribute, increments `version` (1 -> 2) and profile revision, returns `quest_updated` event.
  - `update_quest` idempotency: replay returns prior result; reused request ID with different payload rejects.
  - `quest_completions` preservation: quest completed before deletion has its completion record fully retained in `quest_completions` after soft deletion.
  - `soft_delete_quest`: sets `deleted_at = now()`, increments `version` (2 -> 3) and profile revision, returns `quest_deleted` event and fresh snapshot excluding the deleted quest.
  - Re-deleting already deleted quest with new request ID rejects; replay with original request ID returns prior result.
  - Updating a soft-deleted quest rejects with `'Cannot update deleted quest'`.
  - Concurrency safety: 5 parallel `update_quest` calls with same `expectedVersion` results in exactly 1 success and 4 `stale_version_conflict` rejections.
- **Status:** PASS (48 checks)

---

## 4. Summary of Verification Checks

| Check Group | Checks Run | Checks Passed | Result |
| :--- | :---: | :---: | :---: |
| Unauthenticated Access Controls | 2 | 2 | **PASS** |
| User Creation & Bootstrap Triggers | 10 | 10 | **PASS** |
| Timezone Validation | 4 | 4 | **PASS** |
| Quest CRUD & RLS Isolation | 3 | 3 | **PASS** |
| `get_game_snapshot` Contract | 13 | 13 | **PASS** |
| `complete_quest` First Mutation | 15 | 15 | **PASS** |
| Idempotent Replay | 5 | 5 | **PASS** |
| Reused Request ID Conflict | 2 | 2 | **PASS** |
| Duplicate Occurrence Rejection | 2 | 2 | **PASS** |
| Cross-User Security Denial | 2 | 2 | **PASS** |
| 140 XP Cap & Level 2 Crossing | 15 | 15 | **PASS** |
| Concurrency & Race Conditions | 2 | 2 | **PASS** |
| `choose_specialization` RPC | 9 | 9 | **PASS** |
| `start_trial` RPC | 11 | 11 | **PASS** |
| `progress_trial` RPC | 9 | 9 | **PASS** |
| `record_trial_milestone` RPC | 8 | 8 | **PASS** |
| `claim_trial` RPC | 8 | 8 | **PASS** |
| Cross-User Root Isolation | 4 | 4 | **PASS** |
| Root Concurrency Safety | 4 | 4 | **PASS** |
| Authoritative Quest Occurrence State (Hearth) | 26 | 26 | **PASS** |
| Authoritative Quest CRUD RPCs (Step 21) | 48 | 48 | **PASS** |
| **Total** | **204** | **204** | **100% PASS** |

---

## 5. Security & Invariant Confirmation

1. **Service Role Credentials:** No hosted/project service-role credentials are committed. The validation harness requires credentials through environment variables.
2. **Row-Level Security:** RLS policies were verified using actual cross-user requests and confirmed uncompromised across profiles, quests, branches, trials, and trial progress events.
3. **Daily XP Cap:** 140 XP per local day was verified with exact boundary and partial award arithmetic.
4. **Authoritative Root Progression:** Specialization eligibility (80 XP), trial configuration, distinct day counting, milestone length, and crest availability (160 XP + completed + unclaimed) are enforced strictly on PostgreSQL.
5. **Authoritative Quest Occurrence:** Quests returned in `GameSnapshot.quests` evaluate `currentOccurrenceKey` and `completedForCurrentOccurrence` server-side matching the exact same occurrence semantics as `complete_quest`. The client does not maintain completion truth in local state.
6. **Authoritative Quest CRUD & Concurrency:** `create_quest`, `update_quest`, and `soft_delete_quest` derive identity from `auth.uid()`, enforce optimistic concurrency via `expectedVersion`, preserve immutable history in `quest_completions`, and filter soft-deleted quests from snapshots.
7. **Idempotency Guarantee:** Every mutation receipt is fingerprinted by request ID and canonical payload hash.
8. **No Package.json Alterations:** Root project dependencies were left untouched; all operations used native Node 24 and Supabase CLI.


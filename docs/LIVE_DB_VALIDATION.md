# Live Database Validation Report — SMARAK CORE

**Workstream:** SMARAK CORE (Backend / Architecture / Integration)  
**Repository:** `https://github.com/Algoryxz/ember-and-root`  
**Branch:** `feat/smarak-core`  
**Database Stack:** Supabase Local Stack / PostgreSQL 17  
**Validation Date:** 2026-09-12  
**Status:** **PASSED (72 / 72 Live Verification Checks Succeeded)**  

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
   - RPC: `get_game_snapshot()` (parameterless, derives caller from `auth.uid()`, returns canonical `GameSnapshot`).
   - RPC: `update_profile_preferences(jsonb, text)` (validates timezone strictly against `pg_catalog.pg_timezone_names`).
   - RPC: `complete_quest(uuid, uuid, text)` (atomic transaction enforcing 140 daily XP cap, integer Sparks calculation `xp / 5`, streak progression, Ember state elevation, and idempotency receipts).

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

---

## 4. Summary of Verification Checks

| Check Group | Checks Run | Checks Passed | Result |
| :--- | :---: | :---: | :---: |
| Unauthenticated Access Controls | 2 | 2 | **PASS** |
| User Creation & Bootstrap Triggers | 10 | 10 | **PASS** |
| Timezone Validation | 4 | 4 | **PASS** |
| Quest CRUD & RLS Isolation | 3 | 3 | **PASS** |
| `get_game_snapshot` Contract | 11 | 11 | **PASS** |
| `complete_quest` First Mutation | 14 | 14 | **PASS** |
| Idempotent Replay | 5 | 5 | **PASS** |
| Reused Request ID Conflict | 2 | 2 | **PASS** |
| Duplicate Occurrence Rejection | 2 | 2 | **PASS** |
| Cross-User Security Denial | 2 | 2 | **PASS** |
| 140 XP Cap & Level 2 Crossing | 15 | 15 | **PASS** |
| Concurrency & Race Conditions | 2 | 2 | **PASS** |
| **Total** | **72** | **72** | **100% PASS** |

---

## 5. Security & Invariant Confirmation

1. **Service Role Keys & Passwords:** Zero leaked or committed credentials. The test harness relies strictly on client session tokens.
2. **Row-Level Security:** RLS policies were verified using actual cross-user requests and confirmed uncompromised.
3. **Daily XP Cap:** 140 XP per local day was verified with exact boundary and partial award arithmetic.
4. **Idempotency Guarantee:** Every mutation receipt is fingerprinted by request ID and canonical payload hash.
5. **No Package.json Alterations:** Root project dependencies were left untouched; all operations used native Node 24 and Supabase CLI.

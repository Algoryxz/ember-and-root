# Ember & Root — Backend Schema

## Principles

- **Managed identity:** `auth.users` is owned by Supabase. Do not replicate auth data into application tables beyond the user's UUID.
- **Nine application tables maximum** for the 24-hour release.
- **Immutable history:** `quest_completions` and `currency_ledger` rows are never updated or deleted.
- **Server-authoritative rewards:** All progression mutations happen inside PostgreSQL functions (RPCs) that derive identity from `auth.uid()`.
- **RLS on user-owned data:** Default deny. Users read only their own rows.
- **Idempotent mutations:** Every progression-changing operation uses `mutation_receipts` to safely replay.
- **Derived values:** Do not create tables for character level, attribute rank, Ember intensity, achievement state, or Root node state. Derive them at read time.

---

## Auth Table (Supabase-managed)

### `auth.users`
Managed entirely by Supabase Auth. Do not write to this table from application code. The only application reference is `auth.uid()` inside RPC functions, and foreign key references using `uuid`.

---

## Application Tables

### `profiles`

One row per user. Created by a database trigger on `auth.users` insertion.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | `uuid` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | |
| `timezone` | `text` | `NOT NULL DEFAULT 'UTC'` | IANA timezone string (e.g., `Asia/Kolkata`) |
| `total_xp` | `integer` | `NOT NULL DEFAULT 0 CHECK (total_xp >= 0)` | Character XP |
| `sparks_balance` | `integer` | `NOT NULL DEFAULT 0 CHECK (sparks_balance >= 0)` | Cosmetic currency balance |
| `current_streak` | `integer` | `NOT NULL DEFAULT 0` | Current consecutive-day streak |
| `longest_streak` | `integer` | `NOT NULL DEFAULT 0` | All-time highest streak — never decremented |
| `last_activity_date` | `date` | `NULL` | Server-derived local date of last quest completion |
| `revision` | `bigint` | `NOT NULL DEFAULT 0` | Monotonically incremented on every progression mutation |
| `preferences` | `jsonb` | `NOT NULL DEFAULT '{}'` | User preferences: `{ sound: boolean, reducedMotion: boolean }` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Updated by trigger |

**RLS:** Owner reads and writes allowed for `preferences`; direct writes to XP/balance/streak/revision are denied. Mutations go through RPC only.

**Indexes:** `user_id` (primary key).

---

### `quests`

One row per quest created by a user. Soft-deleted by setting `deleted_at`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | |
| `title` | `text` | `NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 120)` | Trimmed and length-constrained |
| `attribute` | `text` | `NOT NULL CHECK (attribute IN ('mind','body','will','craft'))` | |
| `effort` | `text` | `NOT NULL CHECK (effort IN ('quick','standard','deep'))` | |
| `cadence` | `text` | `NOT NULL CHECK (cadence IN ('once','daily'))` | |
| `trial_id` | `uuid` | `NULL REFERENCES trials(id)` | Optional Trial association |
| `version` | `integer` | `NOT NULL DEFAULT 1` | Optimistic concurrency control for edits |
| `deleted_at` | `timestamptz` | `NULL` | Non-null means soft-deleted |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

**RLS:** Owner may read non-deleted rows. Create/update/delete via RPC only.

**Indexes:**
- `(user_id, deleted_at)` — for listing active quests.
- `(user_id, attribute, deleted_at)` — for filtering by attribute.

---

### `quest_completions`

Immutable completion history. Rows are **never updated or deleted**.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users(id)` | |
| `quest_id` | `uuid` | `NOT NULL REFERENCES quests(id)` | Points to original quest even if soft-deleted |
| `occurrence_key` | `text` | `NOT NULL` | For `once` quests: `'once'`. For `daily` quests: server-derived local date string (e.g., `'2026-09-12'`). |
| `completed_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Absolute UTC time |
| `local_date` | `date` | `NOT NULL` | Server-derived local date using stored timezone at completion time |
| `quest_title_snapshot` | `text` | `NOT NULL` | Denormalised title at completion time |
| `quest_attribute_snapshot` | `text` | `NOT NULL` | Denormalised attribute at completion time |
| `quest_effort_snapshot` | `text` | `NOT NULL` | Denormalised effort at completion time |
| `xp_awarded` | `integer` | `NOT NULL CHECK (xp_awarded >= 0)` | May be 0 if daily cap was already hit |
| `sparks_awarded` | `integer` | `NOT NULL CHECK (sparks_awarded >= 0)` | |
| `trial_evidence` | `jsonb` | `NOT NULL DEFAULT '{}'` | Stores Trial evidence metadata if applicable |

**Unique constraint:** `UNIQUE (quest_id, occurrence_key)` — prevents duplicate completion of the same occurrence.

**Immutability rule:** No `UPDATE` or `DELETE` is permitted by RLS or application code. This is enforced at the database level.

**Indexes:**
- `(user_id, local_date)` — for daily XP cap computation and Ember state derivation.
- `(quest_id, occurrence_key)` — for uniqueness check (covered by constraint).
- `(user_id, completed_at DESC)` — for Chronicle history pagination.

---

### `branches`

One row per (user, attribute) pair. Created on first XP award to an attribute.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users(id)` | |
| `attribute` | `text` | `NOT NULL CHECK (attribute IN ('mind','body','will','craft'))` | |
| `xp` | `integer` | `NOT NULL DEFAULT 0 CHECK (xp >= 0)` | Attribute XP |
| `selected_specialization` | `text` | `NULL` | Must match valid specialization for this attribute |
| `selected_at` | `timestamptz` | `NULL` | When specialization was chosen |

**Primary key:** `(user_id, attribute)`

**Specialization constraint:** A CHECK or trigger verifies:
- `mind` → `scholar` or `explorer`
- `body` → `endurance` or `mobility`
- `will` → `focus` or `courage`
- `craft` → `builder` or `artisan`

**Immutability rule:** Once `selected_specialization` is set, it cannot be changed. Enforced by RPC and trigger.

**RLS:** Owner reads allowed. Direct writes denied; mutations via RPC only.

---

### `trials`

One active Trial per (user, attribute) pair in this release.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users(id)` | |
| `attribute` | `text` | `NOT NULL CHECK (attribute IN ('mind','body','will','craft'))` | |
| `specialization` | `text` | `NOT NULL` | Must match valid specialization |
| `kind` | `text` | `NOT NULL CHECK (kind IN ('distinct_days', 'milestone_reflection'))` | Evaluator type |
| `started_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Evidence must be after this timestamp |
| `required_days` | `integer` | `NULL` | Required days for distinct_days trial |
| `distinct_days_completed` | `integer` | `NOT NULL DEFAULT 0` | Days completed for distinct_days trial |
| `milestone_text` | `text` | `NULL` | Declared milestone text for milestone_reflection trial |
| `completed_at` | `timestamptz` | `NULL` | Non-null when trial objective is completed |
| `claimed_at` | `timestamptz` | `NULL` | Non-null means Trial claimed and Crest awarded |

**Unique constraint:** `UNIQUE (user_id, attribute)` — one Trial per attribute per user in this release.

**Kind constraint:**
- `distinct_days`: `required_days > 0 AND milestone_text IS NULL`
- `milestone_reflection`: `required_days IS NULL AND distinct_days_completed = 0`

**Semantics:**
- `trialStarted`: trial row exists
- `trialComplete`: `completed_at IS NOT NULL`
- `crestAvailable`: `branches.xp >= 160 AND completed_at IS NOT NULL AND claimed_at IS NULL`
- `crestClaimed`: `claimed_at IS NOT NULL`

**RLS:** Owner reads allowed. Mutations via RPC only.

---

### `items`

Server-owned catalog. Seeded by migration. Not writable by users.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `text` | `PRIMARY KEY` | Slug: `copper_halo`, `firefly_orbit`, `engraved_basin` |
| `name` | `text` | `NOT NULL` | Display name |
| `price` | `integer` | `NOT NULL CHECK (price >= 0)` | Cost in Sparks |
| `visual_key` | `text` | `NOT NULL` | Key used by frontend to render the item visual |

**Seed data:**
```sql
INSERT INTO items (id, name, price, visual_key) VALUES
  ('copper_halo',    'Copper Halo',    20, 'copper_halo'),
  ('firefly_orbit',  'Firefly Orbit',  40, 'firefly_orbit'),
  ('engraved_basin', 'Engraved Basin', 60, 'engraved_basin');
```

**RLS:** All authenticated users may read. No user writes permitted.

---

### `inventory`

One row per (user, item) pair. Created on purchase.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users(id)` | |
| `item_id` | `text` | `NOT NULL REFERENCES items(id)` | |
| `acquired_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |
| `equipped` | `boolean` | `NOT NULL DEFAULT false` | |

**Primary key:** `(user_id, item_id)`

**Partial unique index:** `CREATE UNIQUE INDEX inventory_one_equipped_per_user ON inventory (user_id) WHERE equipped = true;`

This enforces at most one equipped item per user at the database level.

**RLS:** Owner reads allowed. Mutations via RPC only.

---

### `currency_ledger`

Immutable record of every Sparks credit and debit.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users(id)` | |
| `amount` | `integer` | `NOT NULL` | Positive = credit; negative = debit |
| `source_kind` | `text` | `NOT NULL` | `'quest_reward'` or `'item_purchase'` |
| `source_id` | `text` | `NOT NULL` | Quest completion ID or item ID |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

**Unique constraint:** `UNIQUE (user_id, source_kind, source_id)` — prevents duplicate ledger entries for the same source.

**Immutability rule:** No `UPDATE` or `DELETE` permitted.

**RLS:** Owner reads allowed. Mutations via RPC only.

---

### `mutation_receipts`

Idempotency log for every progression-mutating RPC call.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | `uuid` | `NOT NULL REFERENCES auth.users(id)` | |
| `request_id` | `uuid` | `NOT NULL` | UUID generated by the client before the call |
| `operation` | `text` | `NOT NULL` | RPC name (e.g., `'completeQuest'`) |
| `payload_hash` | `text` | `NOT NULL` | SHA-256 of the request payload (excluding `requestId`) |
| `result_event` | `jsonb` | `NOT NULL` | The `MutationResult.event` that was returned |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | |

**Primary key:** `(user_id, request_id)`

**RLS:** No user reads. Mutations via RPC only (SECURITY DEFINER context).

---

## Derived Values — Do NOT Create Tables

The following are computed at read time from the tables above. Never store them independently:

| Derived value | Source |
|---------------|--------|
| Character level | `profiles.total_xp` using the level formula |
| Attribute rank | `branches.xp` |
| Ember intensity / state | `quest_completions` count for current local day |
| Sprout availability | `branches.xp > 0` |
| Specialization availability | `branches.xp >= 80 AND selected_specialization IS NULL` |
| Trial complete | `trials.completed_at IS NOT NULL` |
| Crest availability | `branches.xp >= 160 AND trials.completed_at IS NOT NULL AND trials.claimed_at IS NULL` |
| Crest claimed | `trials.claimed_at IS NOT NULL` |
| Trial session count (distinct-day) | Count of distinct `local_date` values in `quest_completions` WHERE `completed_at > trials.started_at` |
| Achievement state | Derived from `quest_completions`, `branches`, `profiles` |

---

## Reward Rules

### Quest XP

| Effort | Base XP |
|--------|---------|
| `quick` | 10 |
| `standard` | 20 |
| `deep` | 35 |

### Daily cap

```sql
daily_xp_awarded := (
  SELECT COALESCE(SUM(xp_awarded), 0)
  FROM quest_completions
  WHERE user_id = auth.uid()
    AND local_date = current_local_date
);

awarded_xp := LEAST(base_xp, GREATEST(0, 140 - daily_xp_awarded));
sparks_awarded := awarded_xp / 5;
```

### Streak rules (inside `completeQuest` RPC)

```sql
IF profiles.last_activity_date IS NULL THEN
  current_streak := 1;
ELSIF current_local_date = profiles.last_activity_date THEN
  -- same day, no change
ELSIF current_local_date = profiles.last_activity_date + 1 THEN
  current_streak := profiles.current_streak + 1;
ELSE
  current_streak := 1;  -- gap; reset
END IF;

longest_streak := GREATEST(profiles.longest_streak, current_streak);
```

---

## Critical RPC Operations

All return a `MutationResult` JSON object unless noted.

| RPC | Purpose |
|-----|---------|
| `createQuest` | Create a new quest; returns new quest ID |
| `updateQuest` | Edit title/attribute/effort/cadence/trialId with version check |
| `deleteQuest` | Soft-delete (set `deleted_at`) |
| `completeQuest` | Core reward transaction (see transaction spec above) |
| `chooseSpecialization` | Set `branches.selected_specialization`; validate eligibility |
| `startTrial` | Create `trials` row |
| `claimTrial` | Set `trials.claimed_at` after validating evidence conditions |
| `purchaseItem` | Debit Sparks, insert inventory row, insert ledger row |
| `equipItem` | Set `equipped = true` on item, unset any other equipped item |
| `updatePreferences` | Update `profiles.preferences` JSONB |
| `getGameSnapshot` | Return full `GameSnapshot` for the current user |

---

## `completeQuest` Transaction (Canonical)

Must execute in a single PostgreSQL transaction under a per-user profile row lock:

```
BEGIN;
SELECT ... FROM profiles WHERE user_id = auth.uid() FOR UPDATE;

1. Check mutation_receipts(user_id, request_id) → replay or continue
2. Derive current_local_date using AT TIME ZONE profiles.timezone
3. Verify quest ownership: quests.user_id = auth.uid()
4. Verify quest not deleted: quests.deleted_at IS NULL
5. Check quest_completions(quest_id, occurrence_key) → reject if exists
6. Compute daily_xp_awarded (SUM of today's xp_awarded)
7. Compute awarded_xp = LEAST(base_xp, GREATEST(0, 140 - daily_xp_awarded))
8. Compute sparks_awarded = awarded_xp / 5
9. INSERT INTO quest_completions (immutable row)
10. UPDATE profiles SET total_xp += awarded_xp, sparks_balance += sparks_awarded
11. INSERT INTO branches (user_id, attribute, xp = awarded_xp)
    ON CONFLICT (user_id, attribute) DO UPDATE SET xp = branches.xp + awarded_xp
12. INSERT INTO currency_ledger
13. Update streak and last_activity_date on profiles
14. UPDATE profiles SET revision = revision + 1
15. INSERT INTO mutation_receipts
16. COMMIT;

RETURN MutationResult JSON;
```

Any failure at any step → `ROLLBACK`. No partial reward is ever persisted.

---

## Authorization Rules

1. Users may read their own rows (enforced by RLS `auth.uid() = user_id`).
2. Direct `INSERT`/`UPDATE`/`DELETE` on `quest_completions`, `currency_ledger`, `profiles` (XP/balance columns), `branches`, `trials`, `inventory`, `mutation_receipts` is denied to the `authenticated` role.
3. RPCs use `SECURITY DEFINER` to execute with elevated privileges after validating inputs.
4. The `service_role` key is never present in browser/client bundle. Used only in seed scripts run locally or in CI.
5. Caller-supplied `user_id` parameters are ignored; identity is always derived from `auth.uid()`.

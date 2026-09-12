# Ember & Root — App Flow

This document describes every meaningful user interaction with its trigger, server action, success state, failure state, and next UI state. Any agent implementing a flow must follow this document exactly.

---

## Navigation Model

Authenticated users have four primary destinations:

```
Hearth → Root → Satchel → Chronicle
```

Settings is a secondary destination reachable from navigation or the profile area.

**Mobile:** Labeled bottom navigation bar with four tabs (Hearth, Root, Satchel, Chronicle) plus settings access.  
**Desktop:** Horizontal navigation strip at the top. No enterprise sidebar.

---

## 1. Sign-Up Flow

**Trigger:** User opens the app for the first time (unauthenticated).

**Steps:**
1. App renders the sign-up / log-in page (`/`).
2. User fills email and password fields.
3. User submits the sign-up form.

**Server action:** `supabase.auth.signUp({ email, password })`

**Success:**
- Session cookie set.
- `profiles` row created via database trigger with default values.
- Redirect to onboarding (`/onboard`).

**Failure:**
- Inline error below the form (e.g., email already registered, weak password).
- No redirect. Form remains editable.

**Next UI state:** Onboarding flow (§3) or Hearth if returning user.

---

## 2. Log-In Flow

**Trigger:** Returning user opens the app or is redirected from a protected route.

**Steps:**
1. App renders the log-in page.
2. User fills email and password.
3. User submits the log-in form.

**Server action:** `supabase.auth.signInWithPassword({ email, password })`

**Success:**
- Session cookie refreshed.
- Redirect to Hearth (`/hearth`).

**Failure:**
- Inline error: "Invalid email or password."
- Form remains editable.

---

## 3. Onboarding Flow

**Trigger:** New account with no `profiles.timezone` set, or first login after sign-up.

**Steps:**
1. App detects missing timezone in profile.
2. Render onboarding screen: welcome message + timezone confirmation.
3. Browser's detected timezone is pre-filled (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
4. User confirms or adjusts timezone.
5. User submits.

**Server action:** `updatePreferences({ timezone })`

**Success:**
- `profiles.timezone` saved.
- User presented with a prompt to create their first quest.
- Redirect to Hearth.

**Failure:**
- Invalid IANA timezone string: inline error.
- Network failure: retry button.

**Important:** Timezone is fixed after onboarding for this release. It cannot be changed in settings.

---

## 4. Hearth — Main View

**Trigger:** Authenticated user navigates to `/hearth`.

**Initial load (server component):**
- Load `GameSnapshot` for the current user.
- Derive Ember state from today's completions using stored timezone.
- Load today's active quests (non-deleted, not once-only completed today).
- Render server component with snapshot.

**Displayed:**
- Ember (with current state: Resting / Kindled / Steady / Bright).
- Today's quest journal rows.
- Compact Root preview (next milestone).
- Status strip: level, Sparks, streak.

**No animation on initial load.** Animations are reserved for mutations that happen during the session.

---

## 5. Create Quest Flow

**Trigger:** User presses "New quest" or equivalent primary action on Hearth.

**Steps:**
1. Open quest creation dialog (Radix Dialog).
2. Fields: Title (required, 1–120 chars), Attribute (required), Effort (required), Cadence (required), Trial association (optional, shown only if an active Trial exists for that attribute).
3. User fills fields and submits.

**Server action:** `createQuest({ requestId, title, attribute, effort, cadence, trialId? })`

**Success:**
- Dialog closes.
- New quest row appears in the journal.
- No XP awarded (quest creation is not completion).

**Failure:**
- Server validation error (empty title, invalid attribute): inline error inside dialog.
- Network failure: error message inside dialog, retry available.
- Dialog does not close on failure.

**Next UI state:** Hearth with new quest visible.

---

## 6. Edit Quest Flow

**Trigger:** User opens quest detail or presses "Edit" on a quest row.

**Steps:**
1. Edit dialog opens pre-filled with current values.
2. User modifies fields and submits.

**Server action:** `updateQuest({ requestId, questId, title, attribute, effort, cadence, trialId? })`

**Ownership check:** Server verifies `quest.user_id = auth.uid()`.

**Version check:** `quests.version` is included in the request and must match current DB value to prevent lost updates.

**Success:**
- Quest row updates in place.
- Dialog closes.

**Failure:**
- Version conflict: "This quest was modified elsewhere. Please refresh."
- Validation error: inline in dialog.
- Network failure: inline in dialog with retry.

---

## 7. Delete Quest Flow

**Trigger:** User presses "Delete" on a quest row (typically inside the edit dialog or a confirmation prompt).

**Confirmation:** Required. "This quest will be removed from your journal. History is preserved." Two buttons: Cancel and Delete.

**Server action:** `deleteQuest({ requestId, questId })`

**Implementation:** Soft delete — sets `quests.deleted_at` timestamp. History (`quest_completions`) is never removed.

**Success:**
- Quest row disappears from journal.
- Dialog closes.

**Failure:**
- Network failure: inline error, dialog stays open.

---

## 8. Complete Quest Flow

**Trigger:** User explicitly presses the "Complete quest" control on a quest row.

**This is the core interaction. Every detail matters.**

**Steps:**
1. Quest row enters **pending** state (button disabled, visual indicator).
2. Client generates a UUID `requestId`.
3. Client calls: `completeQuest({ requestId, questId, occurrenceKey })`

**Server action (`completeQuest` RPC):**

Under a per-user profile row lock:
1. Check `mutation_receipts(user_id, request_id)`.
   - If found with same payload → return stored result (idempotent replay).
   - If found with different payload → error.
2. Derive current local date from `profiles.timezone`.
3. Verify quest ownership (`quest.user_id = auth.uid()`).
4. Verify quest is not deleted.
5. Check `quest_completions(quest_id, occurrence_key)` — prevent duplicate occurrence.
6. Compute remaining daily XP allowance: `140 - sum(xp_awarded where local_date = today and user_id = ?)`.
7. Compute `xp_awarded = min(base_xp, max(0, remaining))`.
8. Compute `sparks_awarded = xp_awarded / 5`.
9. Insert immutable `quest_completions` row.
10. Increment `profiles.total_xp` and `profiles.sparks_balance`.
11. Upsert `branches(user_id, attribute)` — increment `branches.xp`.
12. Update streak: same date → no change; next date → increment; gap → reset to 1.
13. Update `profiles.longest_streak` if needed.
14. Increment `profiles.revision`.
15. Insert `mutation_receipts` row.
16. Commit. Return `MutationResult`.

**On success:**
- Authoritative snapshot replaces local persisted state.
- **Reward sequence plays** (see §9).
- If specialization threshold crossed (branch XP ≥ 80 and no specialization chosen), show "A path is ready" notification without forced navigation.

**On failure:**
- Quest row returns to active state.
- Inline error message on the row: "Could not complete quest. Try again."
- No reward sequence plays.
- No XP is awarded (transaction rolled back).

---

## 9. Reward Sequence

**Trigger:** Successful `completeQuest` response.

**Animation steps** (all skip to final state if `prefers-reduced-motion: reduce`):

1. **Press/seal response** (80–120 ms): Quest row visually confirms the press.
2. **Pending row state** plays while server call is in flight.
3. **Confirmed Ember warmth/scale response** (200–400 ms): Ember pulses to reflect new state.
4. **XP light travel** (400–700 ms): A visual trace moves from the quest row toward the Root preview area.
5. **Root preview illumination advance** (300–500 ms): The relevant attribute branch grows slightly.
6. **Screen-reader announcement**: One `aria-live="polite"` announcement summarizing rewards (e.g., "Quest complete. +20 XP. Body branch grows.").
7. If `event.emberRelit === true`: Ember Relights animation plays before the standard response.
8. If `event.specializationAvailable === true`: After the main sequence, a non-blocking "A path is ready" notice appears on Hearth.

**Rule:** Routine completion must be **fast**. No long cinematic plays after every quest. Spectacle is reserved for specialization and crest moments.

---

## 10. Specialization Available — "A path is ready"

**Trigger:** `event.specializationAvailable === true` in a `MutationResult`.

**Behavior:**
- A non-blocking notice appears on Hearth: "A path is ready" with a link to Root.
- The player is **not** forced to navigate. They can continue completing quests.
- The notice persists until the player navigates to Root or dismisses it.

---

## 11. Root — View

**Trigger:** User navigates to `/root`.

**Initial load:** Server component loads the `GameSnapshot`. Renders all four branches in their current state.

**Desktop:** Fixed SVG viewBox with all four branches visible. Node buttons overlay known SVG coordinates.

**Mobile:** Four labeled attribute tabs. One branch visible at a time. No drag/pinch/zoom required. Root List (equivalent linear view) is accessible as an alternative.

---

## 12. Choose Specialization Flow

**Trigger:** User is on Root with a branch at ≥ 80 XP and no specialization chosen.

**Steps:**
1. Branch node shows "Choose your path" with two options.
2. Specialization choice dialog opens, showing both options with consequence text.
3. User selects one.
4. Confirmation prompt: "This choice is permanent for this release. Continue?" — Cancel and Confirm buttons.
5. User confirms.

**Server action:** `chooseSpecialization({ requestId, attribute, specialization })`

**Success:**
- Branch fork reveals the chosen path; alternate path remains faint.
- Trial panel appears inline on Root.
- `MutationResult` returned; snapshot updated.

**Failure:**
- Inline error in dialog.
- Choice not persisted.

---

## 13. Start Trial Flow

**Trigger:** Player has chosen a specialization. Trial panel shows "Start Trial" button.

**Server action:** `startTrial({ requestId, attribute, specialization })`

**Success:**
- `trials` row created with `started_at` timestamp.
- Trial panel updates to show progress (e.g., "0 / 5 distinct days").
- Only completions after this timestamp count as evidence.

**Failure:**
- Inline error on Trial panel.

---

## 14. Progress Trial

**Trigger:** Quest completions in the correct attribute after Trial start, if an active Trial exists.

**No separate user action.** The `completeQuest` RPC detects a valid active Trial for this attribute and records evidence automatically.

**UI update:** Trial progress count updates as part of the `MutationResult` snapshot.

---

## 15. Claim Crest Flow

**Trigger:** Branch reaches ≥ 160 attribute XP AND Trial is complete (all evidence conditions met). Player sees "Claim crest" button on Root.

**Server action:** `claimTrial({ requestId, trialId })`

**Success:**
- `trials.claimed_at` set.
- Crest terminal ornament reveals on the Root branch.
- Crest reveal animation plays (ornament + at most eight short-lived motes).

**Failure:**
- Conditions not met (server-enforced): inline error.
- Network failure: retry available.

---

## 16. Satchel — View

**Trigger:** User navigates to `/satchel`.

**Displays:** Three items (Copper Halo, Firefly Orbit, Engraved Basin) with name, cost, and visual preview. Current Sparks balance shown prominently.

**Item states:**
- Not owned: "Buy for N Sparks" button.
- Owned, not equipped: "Equip" button.
- Owned, equipped: "Equipped" indicator.

---

## 17. Purchase Item Flow

**Trigger:** User presses "Buy for N Sparks" on an item they do not own.

**Steps:**
1. Confirmation: "Buy [item name] for [N] Sparks?" — Cancel and Buy buttons.
2. User confirms.

**Server action:** `purchaseItem({ requestId, itemId })`

**Success:**
- `inventory` row created.
- `currency_ledger` row inserted (negative amount).
- `profiles.sparks_balance` decremented.
- Item state transitions to "owned, not equipped."

**Failure:**
- Insufficient Sparks: "Not enough Sparks." (inline, not toast).
- Already owned: prevented by UI; server also rejects.
- Network failure: retry available.

---

## 18. Equip Item Flow

**Trigger:** User presses "Equip" on an owned, unequipped item.

**Server action:** `equipItem({ requestId, itemId })`

**Success:**
- `inventory.equipped` toggled (old item unequipped, new item equipped).
- Hearth adornment updates in scene.

**Failure:**
- Item not owned: server rejects.
- Network failure: inline error.

---

## 19. Chronicle — View

**Trigger:** User navigates to `/chronicle`.

**Displays:**
- Current streak count and longest streak count.
- Derived achievement badges: First Light, A Chosen Path, Returned.
- Completion history rows (paginated if > 20 entries): date, quest title, attribute, XP awarded.

**No separate server action.** Chronicle is read-only.

**Failure state:** If history fails to load, show inline error with retry.

---

## 20. Settings — View and Update

**Trigger:** User navigates to settings.

**Displays:**
- Current saved timezone (read-only in this release).
- Sound preference toggle (on/off).
- Reduced-motion preference toggle (on/off, supplements OS preference).
- Sign-out button.

**Server action for preferences:** `updatePreferences({ sound?, reducedMotion? })`

**Success:** Preferences saved, immediate effect on current session.

**Sign-out:**

**Server action:** `supabase.auth.signOut()`

**Success:** Session cleared, redirect to `/`.

---

## 21. Log-Out Flow

**Trigger:** User presses "Sign out" in settings or navigation.

**Server action:** `supabase.auth.signOut()`

**Success:**
- Session cookie cleared.
- Redirect to `/`.
- All in-memory state discarded.

**Failure:** Inline error with retry. Session not cleared until confirmed.

---

## Demo Flow Reference

### Fresh account demo
```
signup → onboarding (timezone) → create first quest → complete → 
Ember: resting → kindled → XP: 0 → 10 (or 20 or 35) → 
hard refresh → state persisted
```

### Prepared demo account
```
Starting state: 90 char XP / Mind 70 XP / Body 20 XP / Sparks 18 / no specialization / 0 completions today

Complete Standard Mind quest ("Finish Java recursion practice"):
  → char XP: 90 → 110 (level 1 → 2)
  → Mind XP: 70 → 90 (specialization available)
  → Sparks: 18 → 22
  → Ember: resting → kindled
  → "A path is ready" notice on Hearth

Navigate to Root → Choose Scholar → confirm final choice
  → Trial panel appears: "Distinct Study Sessions: 0 / 5"

Navigate to Satchel → Buy Copper Halo (20 Sparks; balance: 22 → 2) → Equip
  → Hearth adornment updates

Hard refresh → state fully persisted
Open on second device / incognito → same state visible
Demonstrate keyboard navigation → Tab through core flow
```

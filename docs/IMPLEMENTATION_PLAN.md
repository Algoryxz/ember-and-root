# Ember & Root — 24-Hour Implementation Plan

## Team Ownership

| Person | Role | Owned Areas |
|--------|------|-------------|
| **Smarak** | Backend / Architecture / Integration Lead | DB schema, migrations, RLS, progression RPCs, GameSnapshot, MutationResult, XP, levels, Sparks, streaks, Trial validation, specialization persistence, purchases, mutation receipts, backend tests, seed/demo scripts, final integration |
| **Deeptiman** | Experience / Frontend Lead | Visual system, design tokens, shared UI components, Hearth, quest journal, Ember, reward choreography, responsive layout, loading/empty/error states |
| **Akriti** | Root / Specialization / Trial UI Lead | Root SVG geometry, fixed paths and nodes, Root renderer, specialization UI, Trial presentation, Root accessibility, Root mobile view |
| **Susmita** | Delivery / Auth / Product Systems Lead | Auth integration, protected routes, Vercel deployment, package.json, lockfile, CI, Satchel, Chronicle, Settings, Playwright, axe-core checks, README, video/submission validation |

## Single-Owner Files

| File/Area | Owner |
|-----------|-------|
| `supabase/migrations/` | Smarak |
| `game/snapshot.ts`, `game/contracts.ts` | Smarak |
| `game/fixtures/` | Smarak |
| `server/` | Smarak |
| `components/tokens.css` (design tokens) | Deeptiman |
| `components/` (shared primitives) | Deeptiman |
| `features/hearth/` | Deeptiman |
| `features/root/RootSvg.tsx` and SVG assets | Akriti |
| `features/root/` (all other Root files) | Akriti |
| `package.json`, `package-lock.json` | Susmita |
| `next.config.ts`, `vercel.json`, `.github/` | Susmita |
| `features/satchel/`, `features/chronicle/` | Susmita |
| `playwright/`, `tests/e2e/` | Susmita |

---

## T+0 to T+1 — Four Parallel Probes (First Hour)

**Goal:** Each person produces one working vertical slice against the fixture contract. Combine before minute 60.

- [ ] **Smarak:** Publish `GameSnapshot`, `MutationResult` TypeScript types and enums in `game/contracts.ts`. Implement minimal `completeQuest` RPC (atomic, duplicate-protected). Provide fixture JSON for Deeptiman and Akriti.
- [ ] **Deeptiman:** Implement one tactile `QuestRow` component that accepts a fixture quest and fires a mock completion callback. Verify at desktop and ~375px mobile. Verify Ember responds to state prop changes.
- [ ] **Akriti:** Render one authored Mind branch SVG at desktop and mobile. Place at least one HTML button node over the SVG at a known coordinate. Verify it is keyboard-accessible and visible without drag/zoom on mobile.
- [ ] **Susmita:** Create a public Vercel deployment of the skeleton Next.js app. Configure Supabase Auth (signup + login). Verify session cookie round-trip on the deployed URL.
- [ ] **All:** By minute 60, combine the above components against the frozen `GameSnapshot` fixture. If the combination looks and feels coherent, proceed.

### Exit criteria (T+1)
- Quest completion feels tactile and understandable.
- Root communicates branch shape and choice on a phone.
- Backend can reward exactly once (duplicate test passes locally).
- Production auth works (sign up, log in, session persists on refresh).

---

## T+1 to T+3 — Foundations

- [ ] Smarak: Deploy Supabase schema (all nine tables + RLS + seed items).
- [ ] Smarak: Quest create/read working against real DB on production.
- [ ] Deeptiman: Design tokens CSS file committed and loaded by global layout.
- [ ] Deeptiman: Shared `QuestRow` and `EmberDisplay` components using real tokens.
- [ ] Akriti: All four authored Root branch SVG assets committed to `features/root/svg/`.
- [ ] Akriti: Root fixture renders against `GameSnapshot.branches` prop.
- [ ] Susmita: Auth middleware protecting `/hearth`, `/root`, `/satchel`, `/chronicle`.
- [ ] Susmita: `package.json` locked; no unnecessary devDependencies added.
- [ ] All: Four feature branches created from latest `main`; contributors working independently.

---

## T+3 to T+6 — Real Vertical Slice

- [ ] Smarak: `completeQuest` deployed and working on production URL.
- [ ] Smarak: XP + Sparks + branch XP awarded atomically.
- [ ] Smarak: Duplicate-completion retry test passes on production.
- [ ] Deeptiman: Real reward event from server drives Ember state change on Hearth.
- [ ] Deeptiman: Real reward event drives Root preview illumination advance.
- [ ] Akriti: Root renderer reads real `GameSnapshot.branches` data.
- [ ] Susmita: Auth refresh (cookie rotation) confirmed working on production.
- [ ] All: Hard refresh on Hearth retains quest list and Ember state.

---

## T+6 to T+9 — Product Breadth

- [ ] Smarak: All quest CRUD RPCs deployed and tested (create, update, delete).
- [ ] Smarak: `chooseSpecialization` and `startTrial` RPCs working.
- [ ] Smarak: Streak logic deployed; same/next/missed date cases verified.
- [ ] Smarak: `purchaseItem` and `equipItem` RPCs working.
- [ ] Deeptiman: Full quest journal (create dialog, edit dialog, delete confirmation).
- [ ] Deeptiman: Hearth adornment updates when item is equipped.
- [ ] Deeptiman: Loading and error states on QuestRow and dialogs.
- [ ] Akriti: All four Root branches rendering with real data.
- [ ] Akriti: Specialization choice UI working (dialog + confirmation + branch reveal).
- [ ] Akriti: Trial panel showing progress.
- [ ] Susmita: Satchel: browse three items, purchase, equip working end-to-end.
- [ ] Susmita: Chronicle: history list, streak counts, three derived achievements.

---

## T+9 to T+12 — Submission-Complete

- [ ] Smarak: `claimTrial` RPC working with evidence validation.
- [ ] Smarak: Level-up detection (previous level vs new level) in `MutationResult`.
- [ ] Deeptiman: Level-up notice on Hearth (in-place, not toast).
- [ ] Deeptiman: "A path is ready" notice on Hearth after specialization threshold.
- [ ] Akriti: Crest reveal animation on Root.
- [ ] Akriti: Root mobile view: four labeled attribute tabs, one branch at a time.
- [ ] Akriti: Root List accessible linear equivalent view.
- [ ] Susmita: Settings page: timezone display, sound toggle, reduced-motion toggle, sign out.
- [ ] Susmita: Fresh-user demo path works end-to-end on production.
- [ ] Susmita: Prepared-demo path works end-to-end on production.

---

## T+12 — Feature Freeze

**No new feature ideas after this point.** Only integration, polish, bugs, accessibility, deployment, docs, and demo preparation from here.

---

## T+12 to T+15 — Integration and Polish

- [ ] Keyboard-only flow: all core actions (create/complete/navigate/choose specialization/purchase) operable by keyboard alone.
- [ ] Mobile smoke: 320px, 375px, 390px widths; all content accessible without horizontal scroll.
- [ ] 200% browser zoom: no content clipped or overflowed.
- [ ] Reduced-motion check: verify all animations have immediate-state equivalent.
- [ ] No console errors or unhandled promise rejections on any route.
- [ ] Network failure states: slow connection, dropped request, server error — all produce usable UI.
- [ ] Expired session: graceful redirect, no blank screen.
- [ ] Insufficient Sparks: explicit inline error on purchase attempt.
- [ ] Completion sequence timing polished (press → pending → confirmed in < 1.5s visually).

---

## T+15 to T+18 — Release Candidate

### Automated tests must pass

- [ ] Smarak: User A cannot read/mutate user B's data (Vitest/Playwright with two accounts).
- [ ] Smarak: Duplicate completion of the same occurrence returns same result (idempotency test).
- [ ] Smarak: Level boundary test: XP at/below/above threshold produces correct level.
- [ ] Smarak: Streak tests: same date, next date, missed date.
- [ ] Smarak: Atomic failure rollback: simulated mid-transaction failure leaves no partial reward.
- [ ] Smarak: Insufficient Sparks purchase returns error; balance unchanged.
- [ ] Susmita: axe-core check on Hearth, Root, Satchel, Chronicle routes.
- [ ] Susmita: Playwright E2E: signup → create quest → complete → refresh → state persisted.

### Submission deliverables

- [ ] README complete with setup steps that actually work.
- [ ] `.env.example` committed with variable names, no values.
- [ ] Public production URL works signed-out (login page visible).
- [ ] Production smoke: create account, complete quest, XP persists.

---

## T+18 to T+21 — Demo Preparation

- [ ] Reset prepared demo account using operator-only seed script.
- [ ] Rehearse the 150-second demo script (see Demo Fixture section).
- [ ] Record the demo on the deployed production URL (not localhost).
- [ ] Encode video under 100 MB.
- [ ] Upload to a public URL (YouTube unlisted or similar).
- [ ] Verify video is accessible from a signed-out browser.

---

## T+21 to T+24 — Submission Buffer

- [ ] No new features. Blocker fixes only.
- [ ] Public repo check: accessible signed-out on GitHub.
- [ ] Production URL signed-out check: login page renders.
- [ ] Video link signed-out check: playable without login.
- [ ] Final mobile smoke on a real device (not just devtools).
- [ ] Final keyboard-only smoke: sign in → create quest → complete → navigate Root.
- [ ] Release commit with descriptive message.
- [ ] Submit.

---

## Cut Rules

These define what to sacrifice if behind schedule:

| Checkpoint | Cut if behind |
|------------|--------------|
| T+6 | Sound, generated art assets, fancy route transitions |
| T+9 | Simplify Root terminal ornaments; keep fork choice functional |
| T+12 | Chronicle becomes plain semantic history list; Satchel keeps exactly three items |
| T+15 | No new dependencies added |
| T+18 | Submission blockers only; no cosmetic polish |

---

## Demo Fixture

Prepared demo account must be clearly labeled **"Demo account · sample history"**.

### Starting state

| Field | Value |
|-------|-------|
| Character XP | 90 |
| Level | 1 |
| Mind XP | 70 |
| Body XP | 20 |
| Will XP | 0 |
| Craft XP | 0 |
| Sparks balance | 18 |
| Specialization | None chosen |
| Completions today | 0 (Ember: Resting) |

### Demo quest

**Standard Mind quest:** "Finish Java recursion practice" (20 XP)

### Expected results after completion

| Field | Before | After |
|-------|--------|-------|
| Character XP | 90 | 110 |
| Level | 1 | 2 |
| Mind XP | 70 | 90 |
| Mind specialization | None | Available |
| Sparks | 18 | 22 |
| Ember | Resting | Kindled |

### Demo continuation

1. Navigate to Root → "A path is ready" badge on Mind branch.
2. Choose **Scholar** → confirm permanence dialog → fork reveals.
3. Trial panel shows: "Distinct Study Sessions: 0 / 5" → press "Start Trial".
4. Navigate to Satchel → Sparks: 22. Buy **Copper Halo** (20 Sparks) → balance: 2.
5. Equip Copper Halo → Hearth adornment updates.
6. Hard refresh → all state persisted.
7. Open in second browser tab (or incognito) → same state visible.
8. Demonstrate keyboard Tab navigation through the core Hearth flow.

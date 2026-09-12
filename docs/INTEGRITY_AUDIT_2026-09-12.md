# Ember & Root — Integrity Audit — 2026-09-12

## Purpose

This document separates **verified remote repository facts**, **reported local-workspace evidence**, and **open blockers** before Experience V2 branches are cut.

Repository evidence always overrides this snapshot if the code changes after this date.

---

## Verified remote facts at audit time

Repository:

`https://github.com/Algoryxz/ember-and-root`

Verified before the Experience V2 documentation push:

- `main` was at `6d66b643b72f1beb3041be3b741f9e2654064f36`.
- `feat/onboarding-v2` existed remotely.
- Before the Experience V2 documentation commits, the remote onboarding branch contained documentation-only onboarding changes relative to `main`.
- The local implementation described in the team walkthrough was not yet visible on the remote branch at that point.

This document does not claim that the above remains true after subsequent pushes.

---

## Reported local workspace evidence

The local Antigravity workspace reported:

- branch: `feat/onboarding-v2`
- local HEAD before the final integrity fixes: `ae32115167433827bdd918418ba1273ba4230ce5`
- seven implementation commits relative to `origin/main`:
  - `5daae81 feat(landing): implement illuminated public entry experience`
  - `c4d303e feat(onboarding): add deterministic starter quest engine`
  - `cf5bf12 feat(onboarding): add choice-first onboarding experience`
  - `07d8832 feat(onboarding): add authoritative first-seal flow`
  - `6f6d2ee test(onboarding): add responsive and retry verification`
  - `d7514ff docs: update onboarding implementation and attribution status`
  - `ae32115 docs(screenshots): update responsive viewport captures after e2e suite`

The workspace also reported uncommitted changes in:

- `app/(game)/layout.tsx`
- `docs/ONBOARDING_V2.md`
- `features/onboarding/FirstSeal.tsx`
- `tests/e2e/onboarding-v2.spec.ts`

These are **reported local facts**, not remote verification.

---

## Reported verification from the local implementation

The implementation walkthrough reported the following current-workspace results:

- `npm run typecheck` — PASS
- `npm test` — 36/36 PASS
- `npm run lint` — PASS
- `npm run build` — PASS
- `npx playwright test` — 22 PASS
- `node scripts/test-live-db.mjs` — 204/204 PASS

Treat these as historical evidence until rerun after reconciliation with the remote documentation branch and recovery fixes.

---

## Onboarding V2 implementation facts reported locally

The local implementation reported:

- 13 authored onboarding goals
- 26 authored deterministic starter quest templates
- persisted intensity identifiers only: `light | balanced | push`
- request IDs generated once per mounted onboarding attempt
- first authoritative Seal uses `create_quest` + `complete_quest`
- `preferences.onboarded = true` is written only after successful completion
- current preferences are read and spread before onboarding preference writes
- unfinished authenticated users are redirected to `/onboard` from protected game routes
- first-Seal choreography reduced to approximately 850ms using overlapping causal phases

These claims must be reverified after the final merged branch exists remotely.

---

## Pre-push blocking issue — resumable onboarding recovery

### Problem

The first Seal spans several authoritative mutations:

1. create kept starter quests
2. complete selected first quest
3. persist final onboarding preferences / `onboarded: true`

The existing RPCs protect quest creation and completion through idempotent mutation receipts, but a failure after the authoritative completion and before the final preference write can leave the user with:

- real quest completion persisted
- real XP/Sparks persisted
- `onboarded !== true`
- protected routes redirecting back to `/onboard`

The reported implementation also kept request IDs in React `useRef`, which survives rerenders but not a hard reload. Generating new IDs after partial server success can create a new mutation sequence instead of safely replaying the original one.

### Required recovery contract

Before the onboarding baseline is considered integration-ready:

1. Persist **retry/request metadata only** across reloads until onboarding finalization succeeds.
2. Never persist authoritative progression locally.
3. Reuse the same per-quest request IDs and first-Seal request ID on recovery.
4. If quest creation succeeded and a response was lost, replay safely.
5. If completion succeeded and a response was lost, replay safely without additional XP/Sparks.
6. If final preference persistence fails after completion, retry only finalization as appropriate and keep the authoritative reward visible.
7. On `/onboard` reload with recovery metadata, resume the in-progress authoritative workflow rather than blindly starting a new mutation sequence.
8. Clear temporary recovery metadata only after the server confirms onboarding completion.
9. Add E2E coverage for partial success + reload + eventual Hearth access.

This is a user-experience blocker, not evidence that the underlying reward data is corrupt.

---

## Experience correctness findings

Before broad visual polish, verify/fix these against current source:

### Chronicle level

Chronicle must not derive character level using an independent client formula. Use the authoritative level supplied by server state.

### Zero-XP completion language

When a real completion is recorded but the daily XP cap causes `xpAwarded = 0`, the UI must not say the branch grew or animate permanent Root growth.

The Seal/history consequence remains valid.

### Reward positioning

Reward travel must connect actual rendered objects/targets. Fixed viewport coordinates or fixed offsets are not reliable across responsive layouts.

### Satchel scaffold

Emoji/static placeholder visuals are temporary. Do not mistake placeholder art for final relic presentation.

### Chronicle history reachability

Permanent history needs a supported path to older entries. Audit existing query limits and implement continuation/pagination using existing data contracts where possible.

### First-Seal copy

Remove implementation explanations from the emotional user moment, including phrases such as:

- “authoritative transaction”
- “No mock XP”
- internal choreography-stage descriptions

Keep action and consequence language plain.

---

## Documentation/repository reconciliation rule

Experience V2 documentation has now been pushed to the remote `feat/onboarding-v2` branch.

If the local onboarding implementation was created without fetching that remote branch, **do not force-push over the remote documentation commits**.

Required sequence:

```bash
git fetch origin --prune
git status
git log --oneline --graph --decorate --all -30
```

Then reconcile the histories using a normal merge strategy consistent with `AGENTS.md`.

Do not rebase/amend already-pushed shared history merely to make the graph pretty.

After reconciliation, rerun the complete verification matrix and only then publish the implementation baseline.

---

## Gate before four Experience V2 branches

Do not cut the four Experience V2 branches until:

- onboarding recovery is resolved
- local implementation + remote documentation are reconciled
- the reconciled baseline is pushed
- full test evidence is current
- Smarak publishes the approved baseline SHA

Then create:

```text
feat/experience-entry-hearth
feat/experience-living-root
feat/experience-world-history
feat/experience-system-integration
```

See `docs/TEAM_WORKSTREAMS_V2.md` and `docs/EXECUTION_PROMPTS_V2.md`.

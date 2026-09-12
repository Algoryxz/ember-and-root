# Ember & Root — Onboarding V2 Recovery Contract

## Status

This document supplements `docs/ONBOARDING_V2.md` with the required recovery behavior for the multi-step first-Seal flow.

It does not change canonical reward/progression semantics.

---

## Why this exists

The first onboarding Seal is intentionally real. It can involve multiple authoritative mutations:

1. create the kept starter quests
2. complete the selected first quest
3. persist onboarding preferences and `onboarded: true`

The server already provides idempotency for progression mutations through `mutation_receipts`, but the client must preserve the request identity needed to replay safely after network loss or reload.

The product must never show a successful permanent consequence and then trap the user in onboarding because the final preference write failed.

---

## Recovery invariants

- XP, Sparks, level, streak, Ember, branch XP, Trial state, Crest state, and quest-completion truth remain server-authoritative.
- Local persistence may store only **workflow/retry metadata**, never authoritative progression.
- Request IDs must survive the recovery period.
- The same request ID + same payload must be reused for replay.
- A hard reload must not silently create a fresh mutation sequence if an earlier authoritative step may already have succeeded.
- `preferences.onboarded = true` remains false until the first real Seal succeeds.
- Temporary recovery metadata is cleared only after onboarding finalization is confirmed.

---

## Recovery envelope

A minimal client recovery envelope may include:

```ts
type OnboardingRecoveryEnvelope = {
  version: 1;
  onboardingRequestId: string;
  questRequestIds: Record<string, string>;
  firstSealRequestId: string;
  keptTemplateIds: string[];
  firstTemplateId: string;
  timezone: string;
  phase:
    | 'draft'
    | 'creating_quests'
    | 'sealing_first_quest'
    | 'finalizing_preferences'
    | 'complete';
};
```

This object is transport/recovery state only.

Do **not** store:

- calculated XP
- Sparks
- Ember state
- level
- branch XP
- Trial/Crest eligibility
- fake completion state

On resume, authoritative state must come from server results/snapshot.

---

## Failure scenarios

### A — Quest created, response lost

Retry `create_quest` with the **same** per-template request ID and identical payload.

Expected result:

- server returns the prior receipt/result
- no duplicate quest row

### B — First completion succeeded, response lost

Retry `complete_quest` with the **same** `firstSealRequestId`, quest ID, and expected occurrence.

Expected result:

- server returns prior result
- no duplicate completion
- no additional XP/Sparks

### C — First completion succeeded, final preference write fails

This is a finalization failure, not a failed Seal.

Required UI:

- preserve/show the confirmed server reward result
- explain that the first Seal is safe
- do not imply the user must perform the real-world action again
- retry onboarding finalization
- do not recreate quests or intentionally reseal with a new request ID

The user must not be sent into a `/hearth` → `/onboard` redirect loop as the normal path.

### D — Reload during recovery

When `/onboard` loads and a recovery envelope exists:

1. read the recovery envelope
2. fetch/derive current authoritative server state as needed
3. resume/replay the current mutation phase using the same request IDs
4. render the correct confirmed/pending/recovery state
5. finalize preferences if the real Seal already succeeded
6. clear the envelope after server-confirmed completion

---

## Preference preservation

`update_profile_preferences` currently receives a complete preferences JSON object.

Before writing onboarding preferences:

1. read current preferences
2. preserve all existing keys
3. replace/add only the intended onboarding keys

The implementation must preserve:

- `sound`
- `reducedMotion`
- any unknown/future preference keys

A future server-side JSONB merge RPC may reduce read-modify-write race risk, but changing that contract is a separate architecture decision.

---

## Protected-route invariant

Authenticated users with `preferences.onboarded !== true` must not enter:

- `/hearth`
- `/root`
- `/satchel`
- `/chronicle`
- `/settings`

They must remain in `/onboard` until onboarding finalization is server-confirmed.

This gate must not create a redirect loop after a successful first Seal; recovery/finalization must resolve the incomplete preference state.

---

## First-Seal presentation

After server confirmation, the first Seal may use a short causal response:

- seal impression
- Ember warmth
- light/root trace
- Root wake
- authoritative reward receipt

Target total post-confirmation response: approximately **700–1200ms**.

Do not expose implementation language such as:

- “authoritative transaction”
- “No mock XP”
- internal stage/timer descriptions

Suggested product copy:

> **That’s the loop.**
> What you do becomes what grows.

---

## Required E2E coverage

Add/retain browser tests for:

1. normal first Seal → Hearth
2. quest-create response lost → retry → no duplicate quest
3. completion response lost → retry → no duplicate reward
4. final preference update failure → recovery → eventual Hearth entry
5. hard reload during recovery → same request IDs reused
6. unfinished authenticated user blocked from all game routes
7. refresh after completed onboarding bypasses onboarding
8. server state persists after refresh

Assertions should include, where practical:

- quest count does not duplicate
- XP/Sparks do not duplicate
- completion occurrence remains unique
- `preferences.onboarded === true` eventually
- temporary recovery metadata is cleared after completion

---

## Verification gate

Before claiming the onboarding branch ready:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npx playwright test
node scripts/test-live-db.mjs
```

Also inspect the real onboarding/Hearth transition at:

- 1440×900
- 768×1024
- 390×844
- 320×700

Do not infer recovery correctness from happy-path tests alone.

# Ember & Root — App Flow V2 Supplement

## Purpose

This document records the approved Onboarding V2 and Experience V2 flow changes that supersede the older timezone-only onboarding description in `docs/APP_FLOW.md` §3 and the old fresh-account demo sequence.

All other flows in `docs/APP_FLOW.md` remain authoritative unless separately amended.

Repository evidence wins if the implementation later differs.

---

## Revised login routing

After successful authentication:

- if `preferences.onboarded === true` → route to `/hearth`
- otherwise → route to `/onboard`

Authenticated users with `preferences.onboarded !== true` must not enter game routes directly.

---

## Revised Onboarding Flow

**Trigger:** New or authenticated account with `preferences.onboarded !== true`.

### Steps

1. Open `/onboard`.
2. Detect browser timezone silently; do not lead with the timezone form.
3. User chooses **2–4 intentions** from the authored 13-goal catalog.
4. User chooses intensity:
   - `light`
   - `balanced`
   - `push`
5. User chooses available time:
   - `5-15`
   - `15-30`
   - `30-60`
   - `60+`
6. User chooses preferred rhythm:
   - `morning`
   - `afternoon`
   - `evening`
   - `flexible`
7. Deterministic starter engine returns **3–5 authored suggestions**.
8. User uses **Keep / Swap / Edit** and keeps **2–4** starter quests.
9. User confirms timezone:
   - “Looks right”
   - “Change” reveals the IANA timezone input/datalist
10. Persist onboarding preferences without setting `onboarded = true`.
11. User chooses one kept quest as the first quest.
12. User completes that action in real life.
13. User explicitly performs the first Seal.
14. Create kept starter quests using canonical `create_quest` RPCs with stable request IDs.
15. Resolve the selected quest’s authoritative ID/current occurrence.
16. Complete it through canonical `complete_quest` using a stable first-Seal request ID.
17. Client renders the authoritative reward result.
18. Persist final onboarding preferences with `onboarded: true` only after the real Seal succeeds.
19. Show the short Seal → Ember → Root response.
20. User enters `/hearth`.

### Success

- starter quests exist authoritatively
- selected first quest is completed for the authoritative occurrence
- returned XP/Sparks/Ember state come from the server
- onboarding preferences persist
- `preferences.onboarded === true`
- Hearth shows the same first quest as sealed and the same authoritative progression state

### Failure

#### Before any mutation

Keep the current draft and provide an inline retry.

#### Quest creation response lost

Replay using the same per-quest request ID; do not generate a new quest mutation identity.

#### Completion response lost

Replay using the same first-Seal request ID; do not award again.

#### Final preference write fails after successful Seal

The Seal remains real and safe.

- keep/show authoritative reward
- do not ask the user to repeat the real-world action
- retry/finalize preferences
- do not send the user into a normal Hearth entry that loops back to onboarding

#### Reload during recovery

Resume the existing mutation sequence using persisted retry metadata. Do not treat reload as permission to generate fresh request IDs for already-started authoritative work.

See `docs/ONBOARDING_V2_RECOVERY.md`.

---

## Onboarding preference state

Target shape:

```ts
preferences: {
  ...existingPreferences,
  onboarding: {
    version: 2,
    goals: string[],
    intensity: 'light' | 'balanced' | 'push',
    availableMinutes: '5-15' | '15-30' | '30-60' | '60+',
    preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible',
    starterTemplateIds: string[]
  },
  onboarded: boolean
}
```

Do not overwrite unrelated preference keys.

---

## First-Seal presentation contract

The emotional sequence must follow authoritative success:

1. Seal impression
2. Ember responds
3. light/root trace communicates causal transfer
4. first permanent filament wakes
5. concise server-derived reward receipt

Target total post-confirmation response: approximately 700–1200ms.

Do not show internal implementation explanations in the user-facing moment.

---

## Revised fresh-account demo path

```text
public landing
→ Begin your path
→ signup
→ intentions (2–4)
→ intensity
→ available time + rhythm
→ deterministic starter quest deck
→ Keep / Swap / Edit
→ timezone confirmation
→ choose first quest
→ complete it in real life
→ first authoritative Seal
→ Ember kindles
→ first Root filament wakes
→ Enter Hearth
→ same quest is visibly sealed
→ hard refresh
→ state persists
```

The demo should prove:

- auth
- real DB persistence
- deterministic onboarding recommendation
- authoritative quest creation
- authoritative completion/reward
- visual permanent consequence
- persistence after refresh
- no duplicate reward on retry

---

## Experience V2 continuity

Onboarding should not feel like a disposable wizard.

The same visual language should continue into Hearth:

- same Root specimen identity
- same sealed quest entry
- same Ember state
- same permanent consequence

Visual evolution is governed by `docs/EXPERIENCE_V2.md`.

# Ember & Root — Experience V2 Team Workstreams

## Purpose

This document divides the next product-experience phase across four owners while preserving server authority, shared design coherence, and reviewable integration.

The split is by **experience ownership**, not arbitrary file count.

No workstream may invent new progression rules, rewards, tables, APIs, or dependencies without explicit approval.

---

## Shared operating rules

1. **Repository evidence wins.** Fetch before editing; never trust stale handoff text over source/tests/browser evidence.
2. **Do not merge directly to `main`.** Work on feature branches and integrate through Smarak.
3. **One visual organism.** Landing, onboarding, Hearth, Root, Trials, and Crests consume one shared Root visual identity.
4. **One variable per experiment.** Do not simultaneously change typography, layout, palette, motion, and copy.
5. **Server authority is non-negotiable.** UI renders authoritative snapshots/mutation results; no client reward/progression math.
6. **No heavy dependency creep.** Continue with `motion/react`; do not add GSAP, Three.js, Lottie, Rive, or a second motion stack without approval.
7. **Accessibility is part of the feature.** Keyboard, visible focus, reduced motion, 44×44 touch targets, no gesture-only flows.
8. **Provenance in the same change.** Any materially adapted external component/reference must update `docs/ATTRIBUTIONS.md` in the same commit.
9. **Screenshots are evidence.** Every material visual change requires browser captures at the relevant required viewports.
10. **Do not claim PASS from prose.** Run commands and show current output before claiming verification.

---

## Workstream 1 — Deeptiman: Entry + Daily Ritual

### Mission

Make the beginning of Ember & Root and the daily-use loop feel like one continuous world.

Primary question:

> **Why would someone remember Ember & Root after seeing and using it for thirty seconds?**

### Owns

- public landing visual experience
- signup/login visual continuity
- Onboarding V2 visual pass
- Hearth composition
- quest journal presentation
- Ember presentation
- routine Seal presentation
- onboarding → Hearth continuity
- landing → auth → onboarding continuity
- button hierarchy on owned surfaces
- responsive daily-flow composition

### Immediate experiment

**Object-first Hearth**

- preserve all existing actions and authoritative state
- replace the four small progression cards with one compact shared Root specimen/cutting
- reduce unnecessary enclosing panels
- establish the intended reading order: Ember → Today → quests → Seal → consequence
- keep level/Sparks/streak readable but visually quiet
- keep the first actionable quest near the opening mobile viewport

### May experiment with

- landing before/after specimen
- permanent Seal impression on completed rows
- Botanical Folio composition
- typography after composition stabilizes

### Must not

- alter XP/Sparks/streak/level math
- add new persistence
- create a competing Root art style
- change global tokens without Smarak coordination
- install dependencies

---

## Workstream 2 — Akriti: Living Root + Progression Moments

### Mission

Turn permanent progression into visible biology rather than a skill-tree diagram.

Primary question:

> **Can the user point to what physically changed because of their real action?**

### Owns

- canonical Root specimen visual language
- authored SVG geometry and anatomy layers
- branch progression presentation
- specialization fork presentation
- Trial visual presentation
- Crest terminal/reveal
- Root mobile adaptation
- compact Root variants used by other surfaces

### First deliverable — Root Specimen V1

Define a shared visual contract before rebuilding every route:

```text
ROOT SPECIMEN V1

origin
├─ dormant seed
├─ first filament
├─ developing tissue
├─ specialization-eligible prospective fork
├─ chosen specialization limb
├─ mature closed terminal
├─ crest-ready terminal
└─ claimed Crest
```

Document:

- shared stroke/tissue language
- anatomy layers
- state mapping from authoritative fields
- desktop overview crop
- mobile branch crop
- Hearth compact cutting
- onboarding preview
- landing specimen
- specialization detail
- Crest terminal

### Immediate experiment

Replace **one branch only** with layered authored anatomy + external specimen labels.

Do not redesign all four branches until that one branch is accepted.

### Must not

- procedurally generate paths
- recalculate eligibility in the renderer
- change specialization/Trial/Crest semantics
- use brightness alone as permanent progression
- create different Root identities per route

---

## Workstream 3 — Susmita: Objects + History + Product Shell

### Mission

Make secondary surfaces feel like parts of the same world instead of utility screens.

Primary question:

> **Do Satchel, Chronicle, navigation, and Settings still feel like Ember & Root when Ember is not the dominant object?**

### Owns

- Satchel experience
- relic inspection states
- Chronicle presentation and history reachability
- navigation
- unified navigation/icon direction
- Settings/profile visual cleanup
- empty states
- return/absence states
- E2E/accessibility coverage for owned surfaces
- deployment/config ownership from the original plan

### Immediate experiment

**Copper Halo inspection only**

- keep existing authoritative purchase/equip semantics
- replace one ecommerce-style card with a specimen/field-cabinet inspection view
- clearly distinguish preview / unowned / owned / equipped
- use the same visual asset when equipped on Hearth
- do not redesign the other two relics until Copper Halo is accepted

### Parallel correctness tasks

- audit Chronicle for authoritative level usage
- ensure older history is reachable (pagination/continuation or documented limitation)
- keep immutable quest-title snapshots visible as historical artifacts

### Must not

- derive level/progression client-side
- turn Chronicle into a stats dashboard
- turn Satchel into an ecommerce carousel
- add new icon dependencies without approval
- alter item prices/economy semantics

---

## Workstream 4 — Smarak: Integration + Truth + Experience System

### Mission

Protect architecture and product truth while enabling ambitious experience work.

Primary questions:

> **Does this preserve authoritative game behavior?**
>
> **Does this genuinely improve Ember & Root, or merely decorate it?**

### Owns

- final integration
- backend/schema/RPC boundaries
- Onboarding V2 recovery blocker
- shared authoritative read contracts
- Chronicle authoritative-level correction where backend/contract work is required
- capped-reward semantics
- reward anchoring contract/coordination
- shared design-system evolution approvals
- typography experiment harness
- global motion rules
- performance
- accessibility gate
- provenance gate
- branch coordination
- final test matrix

### Immediate engineering slice

Before broad visual work is merged:

1. make first-Seal recovery resumable across partial success/reload
2. persist only retry/request metadata client-side; never authoritative progression
3. keep successful reward data server-derived
4. retry final preference/onboarded persistence without recreating rewards
5. ensure authenticated unfinished users remain gated to `/onboard`
6. add failure-path E2E proof
7. clear temporary recovery metadata after server-confirmed completion

### Immediate experience-system slice

Create the comparison/review discipline:

- baseline screenshot
- one experiment
- identical viewport screenshot
- keep/revise/reject decision

Coordinate any modifications to global tokens, typography, shared motion utilities, or cross-surface Root contracts.

---

## Branch plan

Create these **after the Onboarding V2 implementation baseline is reconciled and pushed**:

```text
feat/experience-entry-hearth
feat/experience-living-root
feat/experience-world-history
feat/experience-system-integration
```

Do not cut the four branches from a stale `main` while unpublished onboarding changes are still the working baseline.

### Integration order

Preferred order for the first experiment wave:

1. `feat/experience-system-integration` — correctness blockers / shared contracts
2. `feat/experience-living-root` — accepted Root Specimen V1
3. `feat/experience-entry-hearth` — consume shared Root cutting on Hearth/entry surfaces
4. `feat/experience-world-history` — consume shared relic/icon/Root language where relevant
5. integration branch / coordinated merge
6. complete verification matrix
7. `main`

---

## Shared-file coordination

The following areas require explicit coordination before concurrent editing:

| Shared area | Primary gatekeeper |
|---|---|
| `components/tokens.css` | Smarak integration approval + Deeptiman implementation |
| global typography/font loading | Smarak + Deeptiman |
| shared Root SVG contract/assets | Akriti |
| shared navigation primitives | Susmita, reviewed by Deeptiman/Smarak |
| `package.json` / lockfile | Susmita |
| game contracts / server progression | Smarak |
| global motion utilities | Smarak integration approval |
| attribution ledger | contributor making the adaptation; Smarak verifies |

If two workstreams need the same shared file, coordinate before editing rather than resolving divergent visual systems after the fact.

---

## First parallel experiment wave

### Deeptiman

Object-first Hearth with one compact shared Root cutting; no four-card progression grid.

### Akriti

One living Root branch using layered anatomy + external labels.

### Susmita

Copper Halo as a complete specimen inspection experience.

### Smarak

Onboarding recovery + authoritative Chronicle/reward corrections + comparison harness.

The goal is four bounded proofs, not four simultaneous total redesigns.

---

## Acceptance evidence for every workstream

Before requesting integration:

- current branch + HEAD reported
- diff/changed files listed
- no unauthorized dependency changes
- `npm run typecheck`
- relevant unit tests
- `npm run lint`
- `npm run build`
- relevant Playwright tests
- required live DB suite if server contracts changed
- browser screenshots at relevant viewports
- keyboard check
- reduced-motion check
- no horizontal overflow
- attribution updated for external adaptations

Full release verification remains:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npx playwright test
node scripts/test-live-db.mjs
```

Never report a branch ready without current command evidence.

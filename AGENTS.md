# AGENTS.md — Ember & Root

## Mission

Build the smallest exceptional version of Ember & Root where one real server-confirmed action produces one beautiful, understandable, permanent consequence.

The current experience phase is governed by an additional principle:

> **The organism should stop being an illustration inside the interface and become the structure that organizes the interface.**

Repository evidence always overrides stale reports, handoffs, screenshots, or implementation claims.

---

## Read First

Before writing code, read the relevant documents in this order:

1. `docs/PRD.md` — product scope, features, non-goals
2. `docs/TRD.md` — architecture, stack, forbidden dependencies
3. `docs/APP_FLOW.md` — baseline flows
4. `docs/APP_FLOW_V2_SUPPLEMENT.md` — approved flow changes that explicitly supersede older onboarding sections
5. `docs/UI_UX_BRIEF.md` — current frozen visual baseline
6. `docs/EXPERIENCE_V2.md` — current whole-product art-direction and experiment contract
7. `docs/BACKEND_SCHEMA.md` — tables, constraints, RPC contracts, reward rules
8. `docs/CONTRACTS.md` — shared TypeScript contracts
9. relevant feature spec, especially `docs/ONBOARDING_V2.md` and `docs/ONBOARDING_V2_RECOVERY.md`
10. `docs/TEAM_WORKSTREAMS_V2.md` — current four-person experience ownership
11. `docs/IMPLEMENTATION_PLAN.md` — historical 24-hour implementation plan and original single-owner boundaries
12. `docs/ATTRIBUTIONS.md` — provenance ledger

### Precedence

- PRD defines product scope.
- TRD defines allowed architecture/dependencies.
- Backend schema/contracts define authoritative game behavior.
- A V2 supplement may supersede an older section **only where the supplement explicitly says so**.
- Experience V2 may evolve composition/presentation through controlled experiments; it does not authorize changing progression math or backend semantics.
- Repository code/tests/browser evidence beat documentation claims about what is already implemented.

If the docs still conflict after applying that precedence, stop and ask. Do not guess.

---

## Core Rules

### Product integrity

- **Never invent a new feature** because it is easy for an agent to generate.
- **No new game mechanic, progression rule, currency, social system, or backend state** without explicit written team agreement.
- Experience work may propose new visual/presentation layers, but anything requiring new tables/APIs/state must be separately approved.
- **Do not guess at product behavior.** If an authoritative state is missing, extend the read contract deliberately rather than reproducing game logic on the client.

### Repository reality

Before substantial edits:

1. `git fetch origin --prune`
2. inspect current branch
3. inspect HEAD
4. inspect remote base/feature branches
5. inspect `git status`
6. inspect recent commits and changed files
7. verify tests/browser evidence relevant to the task

Do not claim:

- a branch is merged without checking Git
- a test passes without current evidence
- a visual state works because a document says it should
- a local implementation is remote/published unless the remote contains it

### Dependencies and architecture

- **Do not add a dependency** without the delivery owner (Susmita) and integration lead (Smarak) approving it.
- **Do not introduce an alternative architecture** that contradicts `docs/TRD.md`.
- Check the TRD forbidden-additions list before installing packages.
- Continue using `motion/react` for current motion work unless architecture approval explicitly changes that.
- Do not add GSAP, Three.js, Lottie, Rive, a second motion stack, a graph layout engine, or an SVG morph engine merely for visual ambition.

### Ownership

Original single-owner boundaries remain important for core/shared files:

- **Smarak owns:** DB migrations, shared game contracts (`game/`), `components/tokens.css`, global typography/motion primitives, seed scripts, server-side progression logic, final integration.
- **Deeptiman owns:** shared UI primitives (`components/ui/`), `features/hearth/`, Ember/daily experience.
- **Akriti owns:** Root SVG geometry/assets, Root renderer, specialization/Trial/Crest presentation.
- **Susmita owns:** `package.json`, lockfile, Vercel/CI, Satchel, Chronicle, Settings, E2E/accessibility systems.

For the current Experience V2 split, follow `docs/TEAM_WORKSTREAMS_V2.md`.

Do not modify another owner's shared/core files without coordination. Cross-surface experiments must consume shared contracts rather than fork them.

### Database and schema

- **Do not rewrite or remove migrations** that have already been applied.
- **Do not add application tables** beyond the canonical schema without Smarak approval.
- **Do not store derived values** such as level, rank, Ember intensity, achievement state, or eligibility as independent client-controlled truth.

### Commits and history

- Preserve real authorship and chronological commits.
- Do not squash, rebase, or amend commits that have already been pushed to a shared branch merely to make history prettier.
- No force pushes to `main` or shared branches.
- Use descriptive commit messages: `type(scope): description`.
- Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.

---

## Architecture Rules

### Server authority

The server is **always authoritative** for:

- XP and level computation
- Sparks balance and all currency arithmetic
- streak logic
- current quest occurrence completion
- branch XP
- specialization eligibility and persistence
- Trial validity/evidence/completion
- Crest eligibility and claimed state
- item prices and purchase validation
- daily XP cap enforcement

**The client never recalculates any of the above.** It consumes authoritative snapshots/mutation results and renders them.

### Idempotency

- Every progression mutation uses a UUID request ID generated on the client.
- RPCs check `mutation_receipts` before executing where defined.
- Retry with the same request ID + payload returns the prior result.
- Reused request ID with a different payload is an error.
- Multi-step onboarding must preserve request identity across its recovery period; see `docs/ONBOARDING_V2_RECOVERY.md`.

### State boundaries

- `GameShell`/route data owns the latest authoritative snapshot where applicable.
- Form/dialog components own local draft state only.
- Reward animation components own transient presentation state only.
- **No animation callback, timer, or effect may perform a database write.**
- No global state library without architecture approval.
- Local/session storage may contain draft/retry metadata where approved, but never authoritative progression truth.

### Root geometry

- Root SVG paths/anatomy are authored by Akriti and remain fixed geometry.
- Presentation reveals authoritative state over authored geometry.
- Do not procedurally generate or randomize Root paths.
- Permanent progress should change visible anatomy; transient reward feedback may change illumination.
- All surfaces must consume one coherent Root specimen identity rather than inventing unrelated trees.

---

## Experience V2 Rules

### Governing visual direction

Read `docs/EXPERIENCE_V2.md`.

The recommended direction is a contemporary **Botanical Folio**:

- asymmetric editorial composition
- authored organism/object presentation
- restrained annotation
- hierarchy from type, spacing, light, material, illustration, and paths
- fewer generic dashboard containers

This is not permission to make the product antique, fantasy-medieval, or decorative for its own sake.

### Containers must justify themselves

Do not remove all cards/containers reflexively.

A container is valid when it represents a real conceptual object or interaction, such as:

- a journal leaf being sorted
- a quest entry
- a modal decision
- a specimen drawer/inspection surface

Do not use rounded rectangles as the default solution whenever hierarchy is unclear.

### One-variable experiment rule

For material visual experiments:

1. capture baseline
2. change one major variable
3. hold unrelated typography/palette/copy/motion constant
4. inspect still state first
5. capture identical viewports
6. verify accessibility/responsiveness
7. decide KEEP / REVISE / REJECT
8. only then propagate

Do not redesign every route simultaneously.

### Typography experiments

Current shipped/baseline typography remains **Fraunces + DM Sans** until an isolated experiment is accepted and the canonical design brief is intentionally updated.

Allowed experimental candidates include:

- Newsreader
- Instrument Serif
- Alegreya
- Young Serif
- Literata where justified

Rules:

- verify Fraunces/DM Sans actually load before comparing
- keep DM Sans fixed during initial display-family tests
- do not change layout/colors/copy at the same time
- use at most two primary type families in the final system
- do not introduce novelty medieval/fantasy fonts merely because the product is an RPG

### Palette

The palette in `docs/UI_UX_BRIEF.md` remains frozen until an intentional design-system evolution is approved and documented.

Do not introduce arbitrary component-library colors one at a time.

---

## UI Rules

### Visual language

- Ember = today/current action.
- Root = permanent becoming.
- Seal = real confirmed causal event.
- Journal = human record.
- Relics = persistent physical objects.
- Quest lists are journal rows, not floating dashboard tiles.
- No enterprise sidebars or generic SaaS layouts.
- No glassmorphism as a product-wide visual language.
- No blue/purple AI gradients.
- No arbitrary color per feature/component.
- Do not let badges, pills, borders, or navigation chrome visually dominate the organism/current action.

### Accessibility from the start

- Use real semantic controls (`button`, `input`, `a`, accessible dialogs).
- No `div onClick` for interactions.
- Keyboard operability is required from first implementation.
- Visible pale-gold focus rings with 2px offset.
- Focus returns correctly after dialogs.
- Decorative SVG uses `aria-hidden="true"`.
- Interactive Root actions remain semantic HTML controls.
- Reward information is announced via `aria-live="polite"`.
- Every motion experience has a reduced-motion equivalent.

### Mobile is not optional

- Test at 320px, 375px, and 390px before claiming mobile completion.
- Include tablet/desktop evidence where relevant.
- Test 200% zoom for major surfaces.
- No horizontal scroll.
- No hidden final content.
- No drag/pinch-only Root navigation.
- Labeled mobile navigation.
- Touch targets minimum 44×44px.
- Mobile artwork uses deliberate crops/layout, not uniformly shrunken desktop scenes.

### Motion

- Routine completion remains fast.
- First onboarding Seal may be special but should remain approximately 700–1200ms after authoritative confirmation.
- Specialization/Crest can earn more spectacle than routine actions.
- Motion must communicate cause/state/growth/reward/hierarchy.
- Do not animate everything.
- Do not perpetually regrow the Root when navigating back to a persisted state.
- Reduced motion: immediate state or short opacity fade.

---

## Known Experience Correctness Gates

Before broad visual polish, verify/fix the current source evidence for:

- Chronicle using authoritative level rather than an independent client formula
- zero-XP capped completions not claiming Root growth
- reward travel anchored to actual rendered objects rather than fixed viewport offsets
- First-Seal copy free of internal engineering jargon
- Chronicle older-history reachability
- Satchel placeholder art not treated as final relic presentation
- Onboarding resumable recovery after partial mutation success/reload

See `docs/INTEGRITY_AUDIT_2026-09-12.md`.

---

## Completion Standard

**A feature is not done when code exists.** It is done when:

1. behavior is correct against the intended deployed/integration environment
2. failure/recovery states exist
3. keyboard path works
4. mobile layout works at required widths
5. reduced motion works
6. relevant test evidence exists
7. material visual changes include real browser screenshots
8. server-authoritative invariants remain intact
9. provenance is updated when external work was materially adapted

Do not claim completion without evidence.

---

## Testing Expectations

When changing a **progression mutation**:

- add/adjust executable failure-case tests
- verify idempotency/retry semantics

When changing a **core UI flow**:

- verify keyboard + mobile + reduced motion
- inspect screenshots, not only DOM assertions

When changing **auth/deployment**:

- smoke-test the relevant public/deployed environment when credentials/access exist

When changing **schema/RLS**:

- verify cross-user isolation

Before integration-ready claims:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npx playwright test
node scripts/test-live-db.mjs
```

Do not report PASS without current command evidence.

---

## Attribution & provenance

For every materially used external source:

- creator/project
- canonical URL
- copied / adapted / inspiration-only status
- required license/copyright notice
- what was actually borrowed

Update `docs/ATTRIBUTIONS.md` in the same commit that introduces the material adaptation.

Do not hide credits or misrepresent adapted work as wholly original.

---

## What Never to Do

| Action | Why |
|---|---|
| Claim a feature complete without evidence | Creates integration debt and misleads the team |
| Calculate XP/levels/Sparks/eligibility on the frontend | Server authority may drift |
| Write DB state from animation callbacks/timers | Race-condition and state-boundary violation |
| Introduce forbidden architecture/dependencies casually | Contradicts TRD and performance goals |
| Generate Root geometry procedurally | Root is hand-authored and product-defining |
| Use non-semantic click targets | Accessibility violation |
| Add arbitrary colors outside the frozen design system | Visual incoherence |
| Force-push shared branches/main | Destroys shared history |
| Skip failure/recovery states | Incomplete product behavior |
| Skip mobile/reduced-motion verification | Not release quality |
| Apply every reference/component because it looks polished | Produces derivative design and AI slop |
| Let four workstreams invent separate visual systems | Breaks product identity |

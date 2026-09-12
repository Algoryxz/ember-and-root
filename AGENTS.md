# AGENTS.md — Ember & Root

## Mission

Build the smallest exceptional version of Ember & Root in 24 hours.

One real server-confirmed action must produce one beautiful, understandable, permanent consequence on the deployed URL.

---

## Read First

Before writing any code for this repository, read these documents in order:

1. `docs/PRD.md` — Product scope, features, non-goals
2. `docs/TRD.md` — Architecture, stack, forbidden dependencies
3. `docs/APP_FLOW.md` — Every user flow with trigger, server action, success, and failure
4. `docs/UI_UX_BRIEF.md` — Frozen visual language, palette, typography, motion rules
5. `docs/BACKEND_SCHEMA.md` — All tables, constraints, RPC contracts, reward rules
6. `docs/IMPLEMENTATION_PLAN.md` — 24-hour checkpoints and ownership

The PRD defines product scope. The TRD defines allowed technical choices. **Do not silently expand either.**

If you have read these documents and something is still ambiguous, ask a team member. Do not guess.

---

## Core Rules

### Product integrity

- **Never invent a new feature** because it is easy for an agent to generate. Every feature must be in `docs/PRD.md`.
- **No feature outside the PRD** without explicit written team agreement.
- **Do not guess at product behavior.** If the docs disagree or a case is undocumented, stop and ask.

### Dependencies and architecture

- **Do not add a dependency** without the delivery owner (Susmita) approving it in `package.json`.
- **Do not introduce an alternative architecture** (e.g., separate API server, WebSocket layer, global state library, ORM) that contradicts `docs/TRD.md`.
- Check `docs/TRD.md` "Explicitly Forbidden Additions" before installing any package.

### Ownership

- **Do not modify another owner's files** unless resolving a merge conflict or making an explicitly approved cross-cutting change.
- **Smarak owns:** DB migrations, shared game contracts (`game/`), seed scripts, server-side progression logic.
- **Deeptiman owns:** `components/tokens.css`, shared UI primitives, `features/hearth/`, Ember component.
- **Akriti owns:** Root SVG geometry, `features/root/RootSvg.tsx`, all authored Root SVG assets.
- **Susmita owns:** `package.json`, lockfile, Vercel config, CI config, `features/satchel/`, `features/chronicle/`, E2E tests.
- When in doubt about who owns a file, read `docs/IMPLEMENTATION_PLAN.md` § "Single-Owner Files."

### Database and schema

- **Do not rewrite or remove migrations** that have already been applied to production.
- **Do not add application tables** beyond the nine defined in `docs/BACKEND_SCHEMA.md` without Smarak's approval.
- **Do not store derived values** (character level, attribute rank, Ember intensity, achievement state) as independent columns.

### Commits and history

- **Preserve real authorship and chronological commits.** Do not squash, rebase, or amend commits that have already been pushed.
- **No force pushes** to `main` or any shared branch.
- Write descriptive commit messages. Use the format: `type(scope): description`. Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.

---

## Architecture Rules

### Server authority

The server is **always authoritative** for:
- XP and level computation
- Sparks balance and all currency arithmetic
- Streak logic
- Trial validity and evidence counting
- Specialization eligibility and persistence
- Crest eligibility
- Item prices and purchase validation
- Daily XP cap enforcement

**The client never recalculates any of the above.** The client consumes `MutationResult` and renders it.

### Idempotency

- Every progression mutation uses a UUID `requestId` generated on the client.
- The RPC checks `mutation_receipts` before executing.
- Retries with the same `requestId` and payload return the prior result.
- A reused `requestId` with a different payload is an error.

### State boundaries

- `GameShell` owns the latest `GameSnapshot` and `pendingMutationId`.
- Form/dialog components own local draft state only.
- Reward animation components own transient event state only.
- **No animation callback, timer, or effect may perform a database write.**
- No global state library (Zustand, Redux, Jotai, etc.).

### Root geometry

- Root SVG paths are authored by Akriti. They are **fixed**.
- The animation system **reveals state** over fixed geometry. It does not generate, compute, or morph paths.
- Do not introduce a graph layout engine, SVG morph engine, or procedural path generator.

---

## UI Rules

### Visual language

- Follow `docs/UI_UX_BRIEF.md` exactly.
- Use only the frozen palette defined in that document. No other color values as design tokens.
- Use only Fraunces (headings) and DM Sans (UI/body). No other typefaces.
- Quest lists are **journal rows**, not floating dashboard cards.
- No enterprise sidebars, no generic SaaS layouts.
- No glassmorphism, no blue/purple AI gradients, no card grids.
- No arbitrary color per feature or per component.

### Accessibility from the start

- Use real semantic HTML controls (`<button>`, `<input>`, `<a>`, `<dialog>`). No `<div onClick>`.
- All interactive elements must be keyboard operable from the first implementation.
- Visible focus rings (`:focus-visible`, pale-gold, 2px offset) from the first implementation.
- Dialogs use Radix Dialog with focus trapping; focus returns to trigger on close.
- Decorative SVG carries `aria-hidden="true"`. Interactive SVG nodes are `<button>` elements.
- Every reward animation has a `prefers-reduced-motion` equivalent.
- `aria-live="polite"` region announces quest completion rewards.

### Mobile is not optional

- Mobile behavior is a **first-class acceptance criterion** for every feature.
- Test at 320px, 375px, and 390px widths before claiming a feature complete.
- No horizontal scroll. No hidden final rows. No drag/pinch-only interactions on Root.
- Labeled bottom navigation tabs on mobile.
- Touch targets minimum 44×44px.

### Motion

- **Routine completion must be fast.** Do not play a long cinematic after every quest.
- Spectacle is reserved for specialization choices and crest claims.
- Never queue multiple simultaneous animations.
- Pause idle Ember animation when `document.visibilityState === 'hidden'`.
- Reduced motion: all effects must have an immediate-state or short-fade equivalent.

---

## Completion Standard

**A feature is not done when code exists.** It is done when:

1. Production behavior is correct on the deployed Vercel URL.
2. Error state exists (empty input, network failure, insufficient balance, expired session).
3. Keyboard path works (no mouse required).
4. Mobile layout works at 320–390px.
5. Relevant test or visual evidence exists.

Do not claim a feature is complete without evidence meeting all five criteria.

---

## Testing Expectations

- When changing a **progression mutation**: add or adjust an executable failure-case test (Vitest).
- When changing a **core UI flow**: verify keyboard + mobile behavior (Playwright or manual evidence).
- When changing **auth or deployment**: smoke-test the public production URL.
- When changing **schema or RLS**: verify user isolation with two test accounts.

---

## What Never to Do

| Action | Why |
|--------|-----|
| Claim a feature is complete without production evidence | Deceives the team; creates integration debt |
| Calculate XP, levels, or Sparks on the frontend | Server is authoritative; frontend may drift |
| Write to the DB from an animation callback | Violates state boundary; causes race conditions |
| Introduce Prisma, Drizzle, Clerk, Auth.js, Redux, Zustand, React Query, WebSockets, Three.js, GSAP, Rive, Lottie | Explicitly forbidden in TRD |
| Generate Root SVG geometry procedurally | Root geometry is hand-authored by Akriti |
| Use `div` with `onClick` for interactive elements | Accessibility violation |
| Add a color outside the frozen palette | Visual incoherence |
| Force-push to `main` | Destroys shared history |
| Skip the failure/error state | Incomplete feature |
| Skip mobile check | Mobile is not optional |

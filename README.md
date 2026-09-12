# Ember & Root

> **What you do becomes who you are.**

A Life RPG where real tasks kindle today's Ember and grow a permanent Root shaped by the player's choices.

---

> 🌿 **Status: Active Development / Experience V2 planning + Onboarding V2 integration**
>
> The authoritative game foundation, Hearth, Root/Trial/Crest systems, and core product surfaces exist in the repository history. Choice-first Onboarding V2 has a detailed implementation contract and recovery contract; local implementation evidence must be reconciled with the remote branch and reverified before it is treated as the published baseline. Experience V2 now defines the next whole-product art-direction and workstream phase.

---

## Concept

**Ember & Root** is not a to-do app with XP bolted on. It is a game where:

- **Ember** represents what you are doing *today* — it dims when you are inactive and relights when you return.
- **Root** represents who you are *becoming* — a permanent tree shaped by your real choices and effort.

Complete a real-world quest → the server confirms it → Ember responds → XP travels toward the correct Root branch → the branch grows → cross a threshold → choose a specialization → complete a Trial → claim a permanent Crest.

One real server-confirmed action produces one beautiful, understandable, permanent consequence.

---

## Experience V2 direction

The next product-experience phase is governed by one idea:

> **The organism should stop being an illustration inside the interface and become the structure that organizes the interface.**

The recommended art direction is a **contemporary Botanical Folio**: asymmetric editorial composition, authored specimen/root linework, restrained materials, meaningful Seal impressions, and fewer generic dashboard containers.

The Root should become one continuous visual object across:

- public landing
- signup/auth
- onboarding
- Hearth
- Root
- specialization
- Trials
- Crests
- Chronicle

Permanent progress changes **anatomy**. Transient feedback may change **light**.

Read [`docs/EXPERIENCE_V2.md`](docs/EXPERIENCE_V2.md) before doing broad visual redesign work.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ App Router + TypeScript |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL |
| Mutations | PostgreSQL functions via Supabase RPC |
| SSR | `@supabase/ssr` |
| Validation | Zod |
| Styling | Tailwind CSS + CSS custom properties |
| Overlays | Radix Dialog |
| Motion | Motion for React |
| Tests | Vitest + Playwright + axe-core |
| Deployment | Vercel |

---

## Architecture

```text
Browser
  └─ Next.js App Router
       ├─ Server Components — data fetching via Supabase server client
       ├─ Server Actions   — mutations via Supabase RPC
       └─ Client Components — interactivity, motion, local form state

Supabase
  ├─ Auth (JWT, cookie session via @supabase/ssr)
  └─ PostgreSQL (schema, RLS, RPC progression functions)

Vercel
  └─ Next.js deployment (preview + production)
```

The server is **always authoritative** for XP, levels, Sparks, streaks, Trials, and purchases. The client consumes `MutationResult` and renders it.

---

## Team

| Person | Core Role |
|--------|-----------|
| **Smarak** | Backend / Architecture / Integration Lead |
| **Deeptiman** | Experience / Frontend Lead |
| **Akriti** | Root / Specialization / Trial UI Lead |
| **Susmita** | Delivery / Auth / Product Systems Lead |

### Experience V2 workstreams

| Person | Experience V2 ownership |
|---|---|
| **Smarak** | Integration + truth + shared experience-system guardrails |
| **Deeptiman** | Entry + daily ritual: landing, auth continuity, onboarding visual pass, Hearth |
| **Akriti** | Living Root + progression moments: organism, specialization, Trials, Crests |
| **Susmita** | Objects + history + product shell: Satchel, Chronicle, navigation, Settings |

See [`docs/TEAM_WORKSTREAMS_V2.md`](docs/TEAM_WORKSTREAMS_V2.md) for exact scope, dependencies, merge order, and acceptance evidence.

---

## Original workstream ownership

The original single-owner boundaries remain important for shared/core files unless the Experience V2 workstream document explicitly coordinates a cross-cutting change.

| Area | Owner |
|------|-------|
| DB schema, migrations, RLS, RPC functions | Smarak |
| Game contracts (`game/contracts.ts`), fixtures, seed scripts | Smarak |
| Design tokens (`components/tokens.css`), shared UI primitives | Deeptiman |
| Hearth surface, Ember component, reward choreography | Deeptiman |
| Root SVG geometry, Root renderer, specialization UI, Trial UI | Akriti |
| `package.json`, lockfile, Vercel config, CI | Susmita |
| Auth integration, protected routes | Susmita |
| Satchel, Chronicle, Settings | Susmita |
| Playwright E2E tests, axe-core accessibility checks | Susmita |

See `docs/IMPLEMENTATION_PLAN.md` for the historical full single-owner file list.

---

## Branch model

Current historical feature branches include:

```text
main
  ├─ feat/smarak-core
  ├─ feat/deeptiman-experience
  ├─ feat/akriti-root
  ├─ feat/susmita-delivery
  └─ feat/onboarding-v2
```

After the **verified Onboarding V2 baseline is reconciled and pushed**, Experience V2 should use:

```text
feat/experience-entry-hearth
feat/experience-living-root
feat/experience-world-history
feat/experience-system-integration
```

Do **not** cut those branches from a stale `main` while unpublished onboarding implementation changes remain the intended baseline.

Rules:

- No one force-pushes to `main`.
- Do not overwrite already-pushed shared history merely to make the graph prettier.
- PRs/integration changes must preserve server-authoritative game contracts.
- Smarak publishes the approved baseline SHA before the four Experience V2 branches begin.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, features, non-goals |
| [`docs/TRD.md`](docs/TRD.md) | Technical architecture, stack, forbidden dependencies |
| [`docs/APP_FLOW.md`](docs/APP_FLOW.md) | Baseline user flows |
| [`docs/APP_FLOW_V2_SUPPLEMENT.md`](docs/APP_FLOW_V2_SUPPLEMENT.md) | Approved Onboarding V2 flow changes that supersede the old timezone-only onboarding section |
| [`docs/UI_UX_BRIEF.md`](docs/UI_UX_BRIEF.md) | Current frozen visual baseline, palette, typography, motion rules |
| [`docs/EXPERIENCE_V2.md`](docs/EXPERIENCE_V2.md) | Botanical Folio direction, whole-product surface guidance, experiment protocol |
| [`docs/BACKEND_SCHEMA.md`](docs/BACKEND_SCHEMA.md) | Tables, constraints, RPC contracts, reward rules |
| [`docs/CONTRACTS.md`](docs/CONTRACTS.md) | TypeScript contracts shared between workstreams |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Historical 24-hour implementation plan and original ownership |
| [`docs/ONBOARDING_V2.md`](docs/ONBOARDING_V2.md) | Choice-first onboarding, deterministic starter deck, first-Seal product contract |
| [`docs/ONBOARDING_V2_RECOVERY.md`](docs/ONBOARDING_V2_RECOVERY.md) | Resumable first-Seal recovery/idempotency contract |
| [`docs/TEAM_WORKSTREAMS_V2.md`](docs/TEAM_WORKSTREAMS_V2.md) | Four-person Experience V2 ownership and integration order |
| [`docs/EXECUTION_PROMPTS_V2.md`](docs/EXECUTION_PROMPTS_V2.md) | Copy-paste continuation prompts for Smarak, Deeptiman, Akriti, Susmita |
| [`docs/INTEGRITY_AUDIT_2026-09-12.md`](docs/INTEGRITY_AUDIT_2026-09-12.md) | Verified-vs-reported state and blockers before Experience V2 branching |
| [`docs/ATTRIBUTIONS.md`](docs/ATTRIBUTIONS.md) | Third-party dependencies, skills, component references, inspiration, creator credit |
| [`AGENTS.md`](AGENTS.md) | Rules for AI coding agents working in this repository |
| [`project/context-graph.yaml`](project/context-graph.yaml) | Lightweight historical project knowledge graph; verify stale statuses against the repository |

**Recommended read order now:**

PRD → TRD → APP_FLOW → APP_FLOW_V2_SUPPLEMENT → UI_UX_BRIEF → EXPERIENCE_V2 → BACKEND_SCHEMA → CONTRACTS → relevant feature spec → TEAM_WORKSTREAMS_V2 → IMPLEMENTATION_PLAN

---

## Onboarding V2

Onboarding V2 replaces the old timezone-first setup with:

```text
Choose what matters
→ intensity
→ available time / rhythm
→ deterministic starter quest deck
→ Keep / Swap / Edit
→ timezone confirmation
→ choose first quest
→ complete it in real life
→ first authoritative Seal
→ Ember responds
→ first Root filament wakes
→ Hearth
```

Non-negotiable rules:

- no fake reward math
- no `onboarded = true` before the first real Seal succeeds
- stable request IDs across retry/recovery
- no duplicate quests/rewards after network loss
- preferences preserve existing keys
- unfinished authenticated users remain gated to onboarding

See `docs/ONBOARDING_V2.md` and `docs/ONBOARDING_V2_RECOVERY.md`.

---

## Experience experiment protocol

Do not redesign the entire product in one pass.

For each material experiment:

1. capture baseline screenshots
2. change one major variable
3. hold unrelated typography/palette/copy/motion constant
4. inspect the still state before animation
5. capture the same viewports again
6. verify keyboard/reduced motion/mobile/zoom
7. decide **KEEP / REVISE / REJECT**
8. only then propagate the pattern

The first parallel experiment wave is intentionally bounded:

- **Deeptiman:** object-first Hearth
- **Akriti:** one living Root branch + Root Specimen V1
- **Susmita:** Copper Halo inspection
- **Smarak:** onboarding recovery + authoritative correctness fixes + integration harness

---

## Credits, Open Source & Design References

We want provenance to be explicit. **External code, adapted interaction patterns, agent skills, and visual references are credited rather than presented as original work.**

The full ledger is maintained in [`docs/ATTRIBUTIONS.md`](docs/ATTRIBUTIONS.md).

Current credited references include:

- **Anthropic Skills** — `frontend-design` guidance adapted for Ember & Root.
- **delphi-ai / animate-skill** — motion-quality guidance adapted to the product choreography.
- **Composio awesome-codex-skills** — token-system methodology used as a reference for `theme-factory`.
- **Microsoft Playwright MCP** — browser-based visual review tooling.
- **21st.dev** — component discovery and interaction research.
  - **Rahil Vahora — PrismaHero**: editorial hero composition / word-reveal inspiration.
  - **Hossain Jahed — Dynamic Hero / Cinematic landing Hero**: public-entry storytelling references.
  - **YoucefBnm Bnm — Animated Cards Stack**: onboarding sequence interaction reference.
  - **reuno-ui — Svg follow scroll** (source credited by 21st.dev to Skiper UI): scroll-linked Root storytelling reference.
  - **scott clayton — Horizon Hero Section**: spatial-storytelling inspiration only; its WebGL/Three.js/GSAP stack is not adopted.
- **Aceternity UI — Timeline**: Chronicle scroll-history interaction reference.
- **Petr Knoll — Glass Button**: tactile pressed-depth interaction reference; the glass visual treatment is not adopted.
- **Spector (Framer reference site)**: typography, spacing, scroll choreography and motion inspiration only.

See the ledger for exact source URLs, usage status (`copied`, `adapted`, `planned adaptation`, or `inspiration only`), and attribution rules for future additions.

---

## Local Development

```bash
# Prerequisites:
# - Node.js 20+
# - npm 10+

# 1. Clone the repository
git clone https://github.com/Algoryxz/ember-and-root.git
cd ember-and-root

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase project URL and anon key

# 4. Start the development server
npm run dev
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list of required variables.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key — safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed scripts only | **Never expose to browser** |

---

## Contribution Workflow

1. **Read the docs** before writing code.
2. **Fetch before branching.** Confirm the approved baseline SHA for Experience V2 work.
3. **Work on your feature branch.** Do not commit directly to `main`.
4. **Write descriptive commit messages:** `feat(hearth): add quest completion pending state`.
5. **Test mobile + keyboard** before marking a UI feature complete.
6. **Do not add dependencies** without delivery/integration approval.
7. **Do not modify another owner's single-owner files** without coordination.
8. **Credit external work** in `docs/ATTRIBUTIONS.md` in the same change that introduces/materially adapts it.
9. Use the handoff format in `docs/EXECUTION_PROMPTS_V2.md` for Experience V2 work.
10. Verify the [Completion Standard](AGENTS.md#completion-standard) before claiming a feature complete.

---

## Verification Standard

Before claiming an integration branch ready:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npx playwright test
node scripts/test-live-db.mjs
```

Also inspect real screenshots at the relevant required viewports, including 320/390 mobile and desktop/tablet targets.

Never report PASS without current command evidence.

---

## AI Agent Rules

This repository uses [`AGENTS.md`](AGENTS.md) to govern AI coding agent behavior (Antigravity, Claude, Codex, etc.). Read it before asking an agent to write code.

Project/reusable skills in `.agents/skills/` include:

- `ember-ui`
- `reward-integrity`
- `integration-guardian`
- `ship-check`
- `frontend-design`
- `animate`
- `theme-factory`

Project documents and project-specific skills take precedence over generic reusable guidance.

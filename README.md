# Ember & Root

> **What you do becomes who you are.**

A Life RPG where real tasks kindle today's Ember and grow a permanent Root shaped by the player's choices.

---

> 🌿 **Status: Active Development / Root & Trial Features Integrated**
>
> The Root system (all 4 branches, 8 specializations, Session & Milestone Trials, and Crest claims) and Hearth interface are implemented and integrated into `main`. A choice-first Onboarding V2 is being developed on `feat/onboarding-v2`.

---

## Concept

**Ember & Root** is not a to-do app with XP bolted on. It is a game where:

- **Ember** represents what you are doing *today* — it dims when you are inactive and relights when you return.
- **Root** represents who you are *becoming* — a permanent tree shaped by your real choices and effort.

Complete a real-world quest → the server confirms it → Ember responds → XP travels toward the correct Root branch → the branch grows → cross a threshold → choose a specialization → complete a Trial → claim a permanent Crest.

One real server-confirmed action produces one beautiful, understandable, permanent consequence.

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

```
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

| Person | Role | Branch |
|--------|------|--------|
| **Smarak** | Backend / Architecture / Integration Lead | `feat/smarak-core` |
| **Deeptiman** | Experience / Frontend Lead | `feat/deeptiman-experience` |
| **Akriti** | Root / Specialization / Trial UI Lead | `feat/akriti-root` |
| **Susmita** | Delivery / Auth / Product Systems Lead | `feat/susmita-delivery` |

---

## Workstream Ownership

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

See `docs/IMPLEMENTATION_PLAN.md` for the full single-owner file list.

---

## Branch Model

```
main                    ← stable, always deployable
  ├─ feat/smarak-core
  ├─ feat/deeptiman-experience
  ├─ feat/akriti-root
  ├─ feat/susmita-delivery
  └─ feat/onboarding-v2
```

- Feature branches are cut from `main`.
- No one force-pushes to `main`.
- PRs to `main` require at minimum a sanity check from the integration lead (Smarak).
- Integration changes must preserve the server-authoritative game contracts.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, features, non-goals |
| [`docs/TRD.md`](docs/TRD.md) | Technical architecture, stack, forbidden dependencies |
| [`docs/APP_FLOW.md`](docs/APP_FLOW.md) | Every user flow with trigger, server action, success, failure |
| [`docs/UI_UX_BRIEF.md`](docs/UI_UX_BRIEF.md) | Frozen visual language, palette, typography, motion |
| [`docs/BACKEND_SCHEMA.md`](docs/BACKEND_SCHEMA.md) | All tables, constraints, RPC contracts, reward rules |
| [`docs/CONTRACTS.md`](docs/CONTRACTS.md) | TypeScript type contracts shared between all workstreams |
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | Checkpoints, ownership, cut rules, demo fixture |
| [`docs/ONBOARDING_V2.md`](docs/ONBOARDING_V2.md) | Choice-first onboarding, deterministic starter quest deck, first-seal experience |
| [`docs/ATTRIBUTIONS.md`](docs/ATTRIBUTIONS.md) | Third-party dependencies, agent skills, component references, inspiration, and creator credit |
| [`AGENTS.md`](AGENTS.md) | Rules for AI coding agents working in this repository |
| [`project/context-graph.yaml`](project/context-graph.yaml) | Lightweight project knowledge graph |

**Read order for new contributors:** PRD → TRD → APP_FLOW → UI_UX_BRIEF → BACKEND_SCHEMA → CONTRACTS → relevant feature spec → IMPLEMENTATION_PLAN

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

1. **Read the docs** before writing any code: PRD → TRD → relevant APP_FLOW/feature spec.
2. **Work on your feature branch.** Do not commit directly to `main`.
3. **Write descriptive commit messages:** `feat(hearth): add quest completion pending state`
4. **Test on mobile** (320px, 375px, 390px) and by keyboard before marking complete.
5. **Do not add dependencies** without the delivery owner's approval.
6. **Do not modify another owner's single-owner files** without coordination.
7. **Credit external work** in `docs/ATTRIBUTIONS.md` in the same change that introduces or materially adapts it.
8. When you believe a feature is complete, verify the [Completion Standard](AGENTS.md#completion-standard) in `AGENTS.md`.

---

## AI Agent Rules

This repository uses [`AGENTS.md`](AGENTS.md) to govern all AI coding agent behavior (Antigravity, Claude, Codex, etc.). Read it before asking an agent to write code in this repository.

Seven skills are currently available in `.agents/skills/`:

- `ember-ui` — project-specific UI and browser review rules
- `reward-integrity` — server-authoritative progression integrity
- `integration-guardian` — shared contract/schema protection
- `ship-check` — release/demo verification
- `frontend-design` — adapted reusable design-quality guidance
- `animate` — adapted reusable motion guidance
- `theme-factory` — adapted token-system enforcement guidance

# Ember & Root

> **What you do becomes who you are.**

A Life RPG where real tasks kindle today's Ember and grow a permanent Root shaped by the player's choices.

---

> ⚠️ **Status: Foundation / Bootstrap**
>
> This repository is in the bootstrapping phase. Documentation, agent rules, and project structure are established. Application implementation has **not started yet**. No feature described in the docs should be assumed to be working.

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
  └─ feat/susmita-delivery
```

- Feature branches are cut from `main`.
- No one force-pushes to `main`.
- PRs to `main` require at minimum a sanity check from the integration lead (Smarak).
- After the 24-hour build, the integration lead merges branches in dependency order.

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
| [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) | 24-hour checkpoints, ownership, cut rules, demo fixture |
| [`AGENTS.md`](AGENTS.md) | Rules for AI coding agents working in this repository |
| [`project/context-graph.yaml`](project/context-graph.yaml) | Lightweight project knowledge graph |

**Read order for new contributors:** PRD → TRD → APP_FLOW → UI_UX_BRIEF → BACKEND_SCHEMA → CONTRACTS → IMPLEMENTATION_PLAN

---

## Local Development

> **This section will be completed by Susmita once the Next.js project is initialized.**

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

1. **Read the docs** before writing any code: PRD → TRD → relevant APP_FLOW section.
2. **Work on your feature branch.** Do not commit directly to `main`.
3. **Write descriptive commit messages:** `feat(hearth): add quest completion pending state`
4. **Test on mobile** (320px, 375px, 390px) and by keyboard before marking complete.
5. **Do not add dependencies** without the delivery owner's approval.
6. **Do not modify another owner's single-owner files** without coordination.
7. When you believe a feature is complete, verify the [Completion Standard](AGENTS.md#completion-standard) in `AGENTS.md`.

---

## AI Agent Rules

This repository uses [`AGENTS.md`](AGENTS.md) to govern all AI coding agent behavior (Antigravity, Claude, Codex, etc.). Read it before asking an agent to write code in this repository.

Three project-scoped skills are available in `.agents/skills/`:
- `ember-ui` — for implementing frontend surfaces
- `reward-integrity` — for implementing server-authoritative progression mutations
- `ship-check` — for final deployment and submission readiness checks
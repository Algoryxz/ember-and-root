# Ember & Root — Technical Requirements Document

## Architecture Goal

Ship a secure, reliable, single-repository full-stack application in 24 hours with minimal integration risk. Every architectural decision must reduce cross-person coordination cost and increase the surface area that can be tested on the deployed URL.

---

## Frozen Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js App Router + TypeScript | Single repo, SSR, server actions |
| Auth | Supabase Auth (email/password) | No social login in this release |
| Database | Supabase PostgreSQL | Managed, co-located with auth |
| Mutations | PostgreSQL functions via Supabase RPC | Progression-critical writes only |
| SSR integration | `@supabase/ssr` | Cookie-based session, no service-role in browser |
| Validation | Zod at action/form boundaries + SQL constraints | Belt and suspenders |
| Styling | Tailwind CSS + project CSS custom properties | Design tokens as CSS vars |
| Accessible overlays | Radix Dialog | Accessible primitives, unstyled |
| Motion | Motion for React | CSS + SVG preferred; library for complex sequences |
| Tests | Vitest + Playwright + axe-core | Unit, E2E, accessibility |
| Deployment | Vercel | Automated preview + production |

---

## Explicitly Forbidden Additions

The following may **not** be added during the 24-hour build without delivery-owner approval:

- ORM: **Prisma**, **Drizzle** — use Supabase client + raw SQL/RPC
- Auth: **Clerk**, **Auth.js**, **NextAuth** — use Supabase Auth only
- State: **Redux**, **Zustand**, **Jotai**, **React Query** — no global state library
- Cache: **Redis**, **Upstash** — not needed at this scale
- API layer: **FastAPI**, separate Express/Hono server, **tRPC**
- Realtime: **WebSockets**, Supabase Realtime subscriptions
- Animation: **Three.js**, **GSAP**, **Rive**, **Lottie**, Canvas particle engines, **Framer Motion** (use Motion for React instead)
- AI: any LLM API, Vercel AI SDK, Anthropic, OpenAI

---

## Architecture Overview

```
Browser
  └─ Next.js App Router (app/)
       ├─ Server Components (data fetching via Supabase server client)
       ├─ Server Actions (mutations via Supabase RPC)
       └─ Client Components (interactivity, motion, local UI state)

Supabase
  ├─ Auth (JWT, cookie session via @supabase/ssr)
  ├─ PostgreSQL (schema, RLS, RPC functions)
  └─ (Storage not used in this release)

Vercel
  └─ Edge network (Next.js deployment)
```

No separate API server. No microservices. One repo.

---

## Server / Client Ownership

### Server owns

- Identity: derived from `auth.uid()` inside every RPC function.
- XP and level computation: server returns the result, client displays it.
- Sparks balance and all currency arithmetic.
- Streak logic: server derives the current local date from the stored IANA timezone.
- Trial validity and evidence counting.
- Specialization eligibility and persistence.
- Crest eligibility.
- Item prices and purchase validation.
- Daily XP cap enforcement.

### Client owns

- Local draft state for forms/dialogs (before submission).
- Transient animation state (pending, playing, completed — never written to DB).
- The `GameSnapshot` received from the last authoritative server response.
- Navigation and routing.

**Rule:** The client **never recalculates** XP, levels, Sparks, streak, or eligibility. It consumes `MutationResult` and displays it.

---

## Authentication Strategy

- Email/password via Supabase Auth.
- `@supabase/ssr` manages the session cookie in middleware.
- Middleware refreshes the session on every request; stale sessions are detected and redirect to login.
- Server components use the server Supabase client (reads cookie, no service-role key).
- Server actions use the server Supabase client to call RPCs.
- The service-role key is **never** sent to the browser. It is only used in seed/migration scripts.
- Unauthenticated requests to protected routes redirect to `/login`.
- RPC functions enforce `auth.uid()` server-side regardless of what the client sends.

---

## Supabase Usage

### Client creation

```typescript
// Server component / server action
import { createServerClient } from '@supabase/ssr'

// Browser client (minimal: auth state only)
import { createBrowserClient } from '@supabase/ssr'
```

### RPC pattern

Server actions call `supabase.rpc('rpc_name', { param1, param2 })`. The RPC function:
1. Derives `user_id` from `auth.uid()` (never from arguments).
2. Validates arguments.
3. Performs the atomic operation under a row lock.
4. Returns a structured result.

### RLS strategy

- RLS enabled on every user-owned table.
- Default deny.
- `profiles`, `quests`, `quest_completions`, `branches`, `trials`, `inventory`, `currency_ledger`, `mutation_receipts`: only the owning user may read their own rows.
- Direct `INSERT`/`UPDATE`/`DELETE` on progression tables is denied to all roles except the function caller context.
- RPC functions bypass RLS using `SECURITY DEFINER` where necessary to perform cross-table atomic writes.
- `items` table: readable by all authenticated users (catalog); writable only via seed migration.

---

## RPC Philosophy

RPCs are used for progression-critical writes that must be atomic and server-authoritative. They are PostgreSQL functions called via Supabase client's `.rpc()` method.

Simple reads (quest list, snapshot) use the Supabase client's query builder from server components.

All progression-critical RPCs:
- Accept a `request_id UUID` parameter.
- Check `mutation_receipts` before executing work.
- Return the prior result if the receipt exists (idempotency).
- Reject a reused `request_id` with a different payload hash.
- Execute all mutations in a single transaction.
- Return a `MutationResult` JSON object.

---

## Mutation Idempotency

Every mutation that changes progression or balance carries a UUID `requestId` generated by the client before the call. The server:

1. Looks up `(user_id, request_id)` in `mutation_receipts`.
2. If found with the same payload hash → return the stored `result_event` (replay).
3. If found with a different payload hash → error (misuse).
4. If not found → execute, then store receipt with result.

This makes double-click, network retry, and React strict-mode double-invocation safe.

---

## GameSnapshot Contract

The snapshot represents the complete, authoritative, server-confirmed state of one user's game at a point in time. It is the **only** source of truth the frontend uses to render progression.

```typescript
export type AttributeId = 'mind' | 'body' | 'will' | 'craft';
export type Effort = 'quick' | 'standard' | 'deep';
export type Cadence = 'once' | 'daily';
export type EmberState = 'resting' | 'kindled' | 'steady' | 'bright';
export type Specialization =
  | 'scholar' | 'explorer'
  | 'endurance' | 'mobility'
  | 'focus' | 'courage'
  | 'builder' | 'artisan';

export type BranchSnapshot = {
  attribute: AttributeId;
  xp: number;
  specialization: Specialization | null;
  trialStarted: boolean;
  trialComplete: boolean;
  crestClaimed: boolean;
};

export type GameSnapshot = {
  revision: number;
  userId: string;
  totalXp: number;
  level: number;           // derived server-side
  sparksBalance: number;
  currentStreak: number;
  longestStreak: number;
  emberState: EmberState;  // derived server-side
  equippedItemId: string | null;
  branches: Record<AttributeId, BranchSnapshot>;
  todayXpAwarded: number;  // for display only; cap enforcement is server-side
};
```

---

## MutationResult Contract

Every progression-mutating server action returns:

```typescript
export type MutationResult = {
  revision: number;
  event: {
    id: string;
    kind:
      | 'quest_completed'
      | 'specialization_chosen'
      | 'trial_started'
      | 'trial_claimed'
      | 'item_purchased'
      | 'item_equipped'
      | 'quest_created'
      | 'quest_updated'
      | 'quest_deleted';
    xpAwarded?: number;
    sparksAwarded?: number;
    previousLevel?: number;
    newLevel?: number;
    attribute?: AttributeId;
    specializationAvailable?: boolean;
    crestAvailable?: boolean;
    emberRelit?: boolean;
    emberState?: EmberState;
    cappedToday?: boolean;  // true if daily cap was hit
  };
  snapshot: GameSnapshot;
};
```

The UI always replaces its persisted snapshot with `result.snapshot` after a successful mutation. The UI reads `result.event` to decide which animation to play.

---

## Frontend State Boundaries

```
GameShell (client component, top of authenticated layout)
  ├── snapshot: GameSnapshot          ← authoritative, from last server response
  ├── pendingMutationId: string | null ← tracks in-flight request
  └── eventQueue: MutationEvent[]     ← transient animation cues (never written to DB)

QuestList (server component for initial load, client for mutations)
  └── localDraft: QuestDraft          ← form state only, discarded on close

RewardSequence (client component)
  └── plays animation, then calls onDone() to clear eventQueue entry
```

**Invariant:** No animation callback, timer, or effect may call a database write. Animation plays after the confirmed result arrives; it is purely visual.

---

## Animation Architecture

Stack: **CSS transitions + Motion for React + authored SVG**.

### Root geometry

Root paths are hand-authored in SVG. The animation system reveals an illuminated overlay over fixed geometry. Nothing is procedurally generated. No morph engine. No layout engine.

### Reduced motion

Every animation has an equivalent. `prefers-reduced-motion: reduce` swaps travel/drawing effects for immediate state changes or short opacity fades. All information remains textually available.

### Performance rules

- No continuous SVG turbulence or filter animations at rest.
- No large `blur()` chains.
- No canvas particle engine.
- Pause idle Ember animation when `document.visibilityState === 'hidden'`.
- Only one completion animation sequence plays at a time.
- Animations never block navigation or committed UI state.
- Usable at 320–390px widths and 200% zoom.

---

## Testing Stack

| Tool | Purpose |
|------|---------|
| Vitest | Unit tests for server utility functions, progression formula, idempotency |
| Playwright | E2E tests for auth flow, quest completion, persistence, user isolation |
| axe-core | Accessibility checks on core routes |

CI must pass: clean install, typecheck, lint, production build, focused automated tests.

---

## Deployment Architecture

- Vercel hosts the Next.js application.
- Environment variables are set in the Vercel project dashboard.
- Preview deployments exist for every PR (Supabase preview project or shared dev project).
- Production deployment is smoke-tested after every integration checkpoint.
- Local success alone is not sufficient evidence that a feature is complete.

---

## Environment Variables

```bash
# Required — public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Required — server only (never sent to browser)
SUPABASE_SERVICE_ROLE_KEY=   # seed scripts only, not in app runtime
```

A `.env.example` file with these names (and no values) must be committed. Actual secrets are never committed.

---

## CI Minimum

```bash
npm ci
npx tsc --noEmit
npx next lint
npx next build
npx vitest run
npx playwright test --reporter=dot
```

All six steps must pass before a merge to `main`.

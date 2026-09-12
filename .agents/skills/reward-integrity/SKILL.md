---
name: reward-integrity
description: Implements or audits Ember & Root database mutations, RLS, progression, idempotency, currency, streaks, Trials, and concurrency so rewards are server-authoritative and safe to retry.
---

# Reward Integrity Skill

## Purpose
This skill audits and guides any mutation or transaction affecting:
- XP
- level
- branch XP
- Sparks (currency)
- streak
- Trial progress
- specialization
- inventory
- purchase
- equipment

## Skill Precedence
Agents must resolve guidance in this strict order:
1. `AGENTS.md`
2. Ember & Root docs:
   - `docs/PRD.md`
   - `docs/TRD.md`
   - `docs/UI_UX_BRIEF.md`
   - `docs/BACKEND_SCHEMA.md`
   - `docs/CONTRACTS.md`
3. Project-specific skills:
   - `ember-ui`
   - `reward-integrity`
   - `ship-check`
4. Generic reusable design/frontend skills

---

## Authoritative Authority Rule
**Frontend must NEVER decide:**
- level-up
- XP awarded
- Sparks awarded
- Trial completion
- specialization eligibility
- Crest unlock

The frontend **only visualizes authoritative server state**. The UI consumes `MutationResult` events returned by the server; it does not recalculate or anticipate progression independently.

---

## Mutation Verification Checklist
Every progression or reward mutation must verify:

- [ ] **authenticated user**: Identity derived strictly from authenticated server context / `auth.uid()`.
- [ ] **resource ownership**: User owns the quest, trial, inventory slot, or balance being modified.
- [ ] **validated input**: All inputs constrained and validated against server schemas; invalid payloads rejected.
- [ ] **server-calculated rewards**: Backend computes all XP, Sparks, levels, and streak logic.
- [ ] **client reward values ignored**: Any client-sent reward values, level suggestions, or price claims are discarded.
- [ ] **request idempotency**: Every mutation accepts a unique `requestId`; duplicate calls return previous outcome without re-executing.
- [ ] **duplicate submission prevention**: Concurrency checks prevent double-click or simultaneous submissions from executing multiple reward grants.
- [ ] **transaction boundaries**: All balance, XP, level, streak, inventory, and receipt updates occur inside an atomic transaction block.
- [ ] **appropriate row locking**: Rows locked (`SELECT ... FOR UPDATE`) where concurrency matters to prevent race conditions.
- [ ] **currency cannot become negative**: Balance checks ensure Sparks >= cost before debiting; balance never drops below zero.
- [ ] **XP cannot become negative**: Progressions strictly monotonic or clamped; XP cannot underflow.
- [ ] **daily XP ceiling respected**: Hard daily XP caps calculated from authoritative completion records, not client time.
- [ ] **Trial ownership validated**: Only active, user-owned Trials can receive evidence; pre-start evidence ignored.
- [ ] **duplicate Trial claims rejected**: Trial completion can only be claimed once; re-claims return existing claim state without extra rewards.
- [ ] **failures roll back completely**: Any error inside the transaction triggers a full rollback leaving no partial state or orphan rewards.

---

## Architecture Invariants
- Backend is authoritative for XP, levels, Sparks, streak, Trials, ownership, and prices.
- Every progression mutation uses a request ID and is safe to retry.
- The UI consumes `MutationResult`; it does not recalculate progression.
- No animation callback writes to the database.
- Never fake persistence, progression, Trial completion, or user isolation.

---

## Executable Test Scenarios
When changing any progression mutation, executable failure and concurrency tests must be present:
1. **Unauthenticated mutation**: Mutation rejected with 401/Unauthorized.
2. **Cross-user isolation**: User B cannot read or mutate User A's data (403/Forbidden or empty).
3. **Double submission / Retry**: Identical `requestId` awards rewards exactly once.
4. **Different payload reuse**: Same `requestId` with altered payload is rejected.
5. **Daily XP ceiling**: Simultaneous completions hitting the daily cap clamp rewards properly.
6. **Insufficient Sparks**: Attempting a purchase with insufficient balance fails gracefully without debit.
7. **Race condition purchase**: Two concurrent purchases with balance for only one allow only one to succeed.
8. **Trial double claim**: Rapid concurrent claim requests reward Sparks/crest only once.
9. **Transaction rollback**: Simulated database error midway through mutation leaves zero partial records.

## Acceptance Output
Report the transaction boundary, SQL/RPC constraints used, tests executed with results, and any residual integrity risks.

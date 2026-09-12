---
name: integration-guardian
description: Protects shared data contracts, Supabase schema, TypeScript interfaces, and integration boundaries from silent breaking changes. Enforces consumer inspection, context-graph review, and migration planning across workstreams.
---

# Integration Guardian Skill

## Purpose
This skill protects all shared contracts, data types, and integration surfaces across Ember & Root. It guarantees that frontend, backend, database migrations, and geometry layers remain completely synchronized without silent breakages or uncoordinated schema drift.

## Protected Contracts & Assets
This skill strictly protects:

### 1. Core Contract Interfaces
- `GameSnapshot` (authoritative full client state hydration)
- `MutationResult` (authoritative server mutation event response)
- `Quest` (task entity, status, attribute branch, difficulty)
- `BranchState` (Root branch progression, XP, unlocked nodes)
- `TrialState` (active trial progress, daily evidence, completion)
- `Item` (Satchel catalog item, cost, slot, ownership)
- `Profile` (user identity, level, total XP, Sparks, streak)

### 2. Canonical Identifier Systems
- **Attribute IDs**: `vitality`, `discipline`, `resilience`, `insight`
- **Specialization IDs**: defined fork choices per branch
- **Root Node IDs**: fixed authored SVG node coordinates and keys
- **Item IDs**: catalog store item IDs and equipment slots

### 3. Design System & Schema Contracts
- **Design Tokens**: Canonical CSS variables and tokens
- **Supabase Schema**: Table schemas, RLS policies, RPC signatures, and check constraints

---

## Non-Negotiable Rule: No Silent Shared-Contract Changes

Before changing ANY shared contract, interface, or migration:

1. **Inspect Consumers**:
   - Grep for all usages of the type or function across `/docs`, `/src`, `/tests`, and database RPCs.
   - Verify every frontend component and backend route consuming the data.

2. **Inspect `project/context-graph.yaml`**:
   - Check the dependency links and workstream ownership.

3. **Identify Owner**:
   - Backend / Contracts / Database: Smarak
   - Design tokens / Shared primitives: Deeptiman
   - Root geometry & nodes: Akriti
   - Deployment / Packages: Susmita

4. **Determine Migration Impact**:
   - Can existing client versions parse the change?
   - Does it require a database migration or seed update?
   - Will in-flight requests or cached snapshots break?

5. **Update Fixtures**:
   - Synchronize test mock data, snapshot seeds, and JSON sample payloads.

6. **Update Tests**:
   - Adjust both unit tests and integration tests to cover the altered contract.

7. **Notify & Document Affected Workstreams**:
   - Document changes in `docs/CONTRACTS.md` or migration notes before merging.

---

## Verification Checklist
Whenever a PR or change touches a protected contract:
- [ ] Has every consumer file been updated and compiled without type errors?
- [ ] Has `docs/CONTRACTS.md` or `docs/BACKEND_SCHEMA.md` been updated to match?
- [ ] Are test fixtures and mock snapshots updated?
- [ ] Does `MutationResult` maintain idempotency and backward compatibility?
- [ ] Was the designated owner consulted before modifying the contract?

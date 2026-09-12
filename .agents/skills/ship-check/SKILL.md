---
name: ship-check
description: Performs Ember & Root release-readiness checks across production deployment, authentication, persistence, accessibility, mobile behavior, repository deliverables, README/environment setup, and demo-video requirements.
---

# Ship Check Skill

## Purpose
Run this verification checklist before each important release, candidate merge, or demo recording to ensure zero release blockers and full compliance with project acceptance criteria.

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

## Release Verification Checklist

### REPOSITORY
- [ ] **public repo**: Repository is public and accessible.
- [ ] **real commit history**: Real authorship and chronological commit progression preserved; no giant squash-everything commits.
- [ ] **backend present**: Authoritative server/backend code and migrations are committed and present.
- [ ] **README accurate**: Setup steps, environment prerequisites, and local run instructions work cleanly from a fresh checkout.
- [ ] **.env.example exists**: Lists all required environment variable keys with safe placeholder values.
- [ ] **no secrets committed**: No service-role keys, private API credentials, or passwords exist in git history.

### PRODUCTION
- [ ] **public URL loads signed out**: Deployed public URL renders the landing/sign-in view without crashing.
- [ ] **signup works**: New user registration succeeds in production environment.
- [ ] **login works**: Existing user sign-in authenticates properly.
- [ ] **logout works**: User session ends and redirects to logged-out state.
- [ ] **session persists**: Page reload or new tab retains authenticated state.
- [ ] **DB connects**: Production database communicates seamlessly with backend server.
- [ ] **no blank screen**: No white screens or unhandled error boundaries on any route.
- [ ] **no console runtime crash**: Browser developer tools console remains free of uncaught exceptions and fatal errors.

### CORE FLOW
- [ ] **create quest**: User can author a new task/quest.
- [ ] **read quest**: Quests display accurately with correct branch and state in the field journal.
- [ ] **update quest**: Editing a quest updates state and persists.
- [ ] **delete quest**: Deleting / archiving a quest updates views properly.
- [ ] **complete quest**: Marking a quest complete triggers the authoritative completion mutation.
- [ ] **XP awarded**: Authoritative XP increment returned and shown.
- [ ] **nonlinear level change**: Threshold progression calculates nonlinearly according to formulas.
- [ ] **attribute increases**: Branch attribute values increase appropriately.
- [ ] **Ember updates**: Today's Ember reflects completed daily action.
- [ ] **Root updates**: Authored SVG path reveal updates to illuminate the newly unlocked node.
- [ ] **specialization persists**: Specialization choices stick across sessions.
- [ ] **Trial starts**: Initiating a Trial updates trial state and requirements.
- [ ] **Sparks awarded**: Authoritative currency added to balance.
- [ ] **purchase works**: Satchel / shop items purchased successfully; balance deducted.
- [ ] **equip persists**: Equipping an item / crest updates profile and persists.
- [ ] **refresh retains state**: Full browser refresh leaves Ember, Root, quests, inventory, and stats 100% intact.

### SECURITY
- [ ] **User A cannot read User B**: Strict row-level security / tenant isolation verified with two separate accounts.
- [ ] **duplicate completion rewards once**: Re-submitting or rapid clicking awards XP/Sparks only once.
- [ ] **direct client XP manipulation rejected**: Any direct client attempt to write to XP or progression tables is blocked.

### A11Y
- [ ] **keyboard flow**: Entire core loop (navigate, create, complete, equip) operable via keyboard only.
- [ ] **visible focus**: Clear high-contrast focus rings on all interactive controls.
- [ ] **dialogs return focus**: Modals trap focus while open and return focus to trigger on close.
- [ ] **reduced motion**: Complete UI respects `prefers-reduced-motion` with instant/fade transitions.
- [ ] **axe core routes**: Automated accessibility audit passes without critical/serious violations.
- [ ] **phone test**: Layout operates cleanly on real or simulated mobile screen (~375px and ~320px).

### SUBMISSION
- [ ] **public GitHub link**: Link is accessible signed out.
- [ ] **public deployed link**: Production URL is active and functional.
- [ ] **90–180 sec video**: Walkthrough video length is between 90 and 180 seconds.
- [ ] **<100MB**: Video file size is strictly under 100 MB.
- [ ] **video accessible signed out**: Video URL / download requires no login or special permissions.
- [ ] **refresh persistence visible in video**: Video clearly demonstrates a browser refresh proving server persistence.

---

## Output Format
Always report results in a structured table:
| Domain | Status (PASS / BLOCKER / WARNING) | Evidence / Notes |
|--------|-----------------------------------|------------------|

Do not declare a release ready while any BLOCKER remains unresolved.

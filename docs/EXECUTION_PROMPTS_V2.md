# Ember & Root — Experience V2 Execution Prompts

These prompts are intended for Antigravity / Claude Code / Codex-style coding agents working in the local repository.

**Do not paste a prompt and assume its historical claims are current. Every prompt begins with repository verification.**

The shared product contract is in:

- `AGENTS.md`
- `docs/PRD.md`
- `docs/TRD.md`
- `docs/APP_FLOW.md`
- `docs/UI_UX_BRIEF.md`
- `docs/BACKEND_SCHEMA.md`
- `docs/CONTRACTS.md`
- `docs/ONBOARDING_V2.md`
- `docs/EXPERIENCE_V2.md`
- `docs/TEAM_WORKSTREAMS_V2.md`
- `docs/ATTRIBUTIONS.md`

Repository evidence wins over this prompt.

---

# Prompt 1 — Smarak: Integration + Truth + Experience System

```text
EMBER & ROOT — SMARAK WORKSTREAM
INTEGRATION + TRUTH + EXPERIENCE SYSTEM

Repository:
https://github.com/Algoryxz/ember-and-root

Role:
Backend / Architecture / Integration Lead.
You are also the Experience V2 integration guardian.

DO NOT START BY EDITING.

FIRST:
1. git fetch origin --prune
2. git status
3. git branch --show-current
4. git rev-parse HEAD
5. git log --oneline --decorate -20
6. git log --oneline origin/main..HEAD
7. inspect origin/feat/onboarding-v2
8. compare the local onboarding implementation with the remote branch
9. inspect all uncommitted/staged files
10. read AGENTS.md and the canonical docs listed below

IMPORTANT CURRENT REPOSITORY SITUATION:
The remote feat/onboarding-v2 branch contains documentation commits and may not contain the unpublished local onboarding implementation. Do not force-push and do not overwrite pushed history. Reconcile remote documentation with local implementation using a normal merge/cherry-pick strategy consistent with AGENTS.md, then verify the result before pushing.

READ:
AGENTS.md
docs/PRD.md
docs/TRD.md
docs/APP_FLOW.md
docs/UI_UX_BRIEF.md
docs/BACKEND_SCHEMA.md
docs/CONTRACTS.md
docs/ONBOARDING_V2.md
docs/EXPERIENCE_V2.md
docs/TEAM_WORKSTREAMS_V2.md
docs/ATTRIBUTIONS.md

MISSION:
Publish one verified Experience V2 baseline without weakening the authoritative game engine.

PHASE A — FINISH ONBOARDING V2 INTEGRITY

Verify and fix, with current code evidence:

1. First-Seal recovery across partial success and reload.
   - create_quest succeeds but response is lost
   - complete_quest succeeds but response is lost
   - complete_quest succeeds and final preference update fails
   - reload during recovery

2. Persist only retry/request metadata client-side.
   - Never store authoritative XP, Sparks, level, Ember, Trial, Crest, or completion truth locally.
   - Reuse the same request IDs across retries/reload until onboarding is server-confirmed complete.
   - Clear temporary recovery data only after final server confirmation.

3. If final update_profile_preferences fails after a real Seal:
   - keep the authoritative reward result visible
   - do not present a normal Hearth entry that simply redirects back
   - retry/finalize onboarding without creating quests or awarding rewards again

4. Confirm authenticated users with preferences.onboarded !== true cannot access:
   /hearth
   /root
   /satchel
   /chronicle
   /settings

5. Preserve all existing profile preference keys.

6. Keep intensity IDs exactly:
   light | balanced | push

PHASE B — CORRECTNESS AUDIT FROM EXPERIENCE V2

Verify before changing:

- Chronicle must not derive character level independently on the client. Consume authoritative level.
- A completion awarding 0 XP because of the daily cap must not claim that the Root grew.
- Reward travel must anchor to actual rendered objects/targets rather than fixed viewport offsets.
- First-Seal user copy must not expose implementation phrases such as “authoritative transaction,” “No mock XP,” or choreography-stage explanations.
- Chronicle permanent history needs a supported path to older entries; document or implement continuation without inventing unapproved schema.

Do not change backend progression math unless repository evidence proves a canonical defect.

PHASE C — PUBLISH VERIFIED BASELINE

Before push run:

npm run typecheck
npm test
npm run lint
npm run build
npx playwright test
node scripts/test-live-db.mjs

Also inspect onboarding screenshots at:
1440x900
768x1024
390x844
320x700

Report:
- current HEAD
- commits relative to origin/main and origin/feat/onboarding-v2
- changed files
- exact test output
- known limitations

Do NOT merge to main yet.

After the verified onboarding/experience baseline is pushed, create or authorize the four Experience V2 branches described in docs/TEAM_WORKSTREAMS_V2.md.

EXPERIMENT GOVERNANCE:
You own the final keep/revise/reject gate for shared visual-system changes.
One variable per experiment.
No arbitrary new global tokens.
No new animation stack.
No client progression math.
```

---

# Prompt 2 — Deeptiman: Entry + Daily Ritual

```text
EMBER & ROOT — DEEPTIMAN WORKSTREAM
ENTRY + DAILY RITUAL

Repository:
https://github.com/Algoryxz/ember-and-root

Target branch AFTER Smarak publishes the verified Experience V2 baseline:
feat/experience-entry-hearth

DO NOT CUT THIS BRANCH FROM A STALE MAIN.
Confirm the approved baseline SHA with Smarak first.

FIRST:
1. git fetch origin --prune
2. verify the approved baseline SHA
3. create/switch to feat/experience-entry-hearth from that exact baseline
4. git status
5. inspect the current landing, signup/login, onboarding, and Hearth in a real browser
6. capture baseline screenshots before editing

READ:
AGENTS.md
docs/PRD.md
docs/TRD.md
docs/APP_FLOW.md
docs/UI_UX_BRIEF.md
docs/ONBOARDING_V2.md
docs/EXPERIENCE_V2.md
docs/TEAM_WORKSTREAMS_V2.md
docs/ATTRIBUTIONS.md

MISSION:
Make landing → auth → onboarding → Hearth feel like one continuous world and make Hearth a daily ritual rather than a dashboard.

DO NOT redesign every page at once.

FIRST EXPERIMENT ONLY — OBJECT-FIRST HEARTH

Goal:
Test whether Hearth becomes more distinctly Ember & Root when the organism and daily ritual organize the page instead of four progression cards.

Preserve:
- all server state
- all quest behavior
- quest CRUD
- completion semantics
- Ember semantics
- navigation destinations
- keyboard behavior
- reduced motion
- mobile safe-area behavior

Experiment:
1. Keep Ember visually important at the opening.
2. Keep “Today” / the date as orientation.
3. Make quests the working area.
4. Replace the four small Root progression cards with ONE compact Root specimen/cutting supplied by Akriti’s shared Root contract.
5. Make level / Sparks / streak readable but quiet.
6. Remove containers that exist only because the previous layout needed a card, but do NOT remove containers that represent real objects/interactions.
7. Completed quests remain in place and use a restrained Seal impression rather than generic success decoration.

IMPORTANT DEPENDENCY:
Do not invent your own Root illustration.
Consume Akriti’s accepted Root Specimen V1 or use the existing baseline until it is available.

LANDING/AUTH/ONBOARDING:
Do not redesign these in the same commit as the Hearth experiment.
After Hearth is reviewed, proceed one experiment at a time:
- landing annotated before/after specimen
- auth seed continuity
- onboarding → Hearth continuity
- first-Seal copy/visual cleanup

TYPOGRAPHY:
Do NOT change Fraunces during the first layout experiment.
Fraunces + DM Sans is the baseline.
Only after composition is accepted, run isolated display-font experiments:
Fraunces baseline → Newsreader → Instrument Serif → Alegreya → Young Serif.
Keep DM Sans fixed and change nothing else in those comparisons.

MOTION:
No decorative bouncing.
Routine completion remains fast.
Use motion only for cause/state/growth/hierarchy.
Respect OS + in-app reduced motion.

ATTRIBUTION:
If you materially adapt an external reference, update docs/ATTRIBUTIONS.md in the same commit.

EVIDENCE:
For every experiment provide unchanged baseline vs experiment screenshots at:
1440x900
768x1024
390x844
320x700 where relevant

Verify keyboard, reduced motion, long text, empty/error states, and no horizontal overflow.

Do not merge to main.
Stop after the first experiment and request review before propagating the pattern.
```

---

# Prompt 3 — Akriti: Living Root + Progression Moments

```text
EMBER & ROOT — AKRITI WORKSTREAM
LIVING ROOT + PROGRESSION MOMENTS

Repository:
https://github.com/Algoryxz/ember-and-root

Target branch AFTER Smarak publishes the verified Experience V2 baseline:
feat/experience-living-root

DO NOT CUT THIS BRANCH FROM A STALE MAIN.
Confirm the approved baseline SHA with Smarak first.

FIRST:
1. git fetch origin --prune
2. verify approved baseline SHA
3. create/switch to feat/experience-living-root from that exact baseline
4. git status
5. inspect current Root desktop/mobile screenshots and source
6. inspect GameSnapshot/branch/Trial/Crest contracts before drawing states

READ:
AGENTS.md
docs/PRD.md
docs/TRD.md
docs/UI_UX_BRIEF.md
docs/BACKEND_SCHEMA.md
docs/CONTRACTS.md
docs/EXPERIENCE_V2.md
docs/TEAM_WORKSTREAMS_V2.md

MISSION:
Make permanent progression physically visible as one authored living organism.

CORE RULE:
Permanent progress changes anatomy.
Transient reward feedback may change light.

DO NOT:
- procedurally generate Root geometry
- introduce a graph layout engine
- use an SVG morph engine
- recalculate eligibility in the renderer
- invent XP thresholds
- change Trial/Crest rules
- make every route draw a different Root

FIRST DELIVERABLE — ROOT SPECIMEN V1

Before rebuilding the Root page, define one shared visual contract for:

origin
├─ dormant seed
├─ first filament
├─ developing tissue
├─ specialization-eligible prospective fork
├─ chosen specialization limb
├─ mature closed terminal
├─ crest-ready terminal
└─ claimed Crest

Create/document:
- fixed authored geometry
- anatomy layers
- stroke/tissue language
- mapping from authoritative branch/trial/crest fields to presentation states
- full desktop specimen
- mobile branch crop
- Hearth compact cutting
- onboarding preview variant
- landing specimen variant
- specialization fork detail
- Crest terminal detail

FIRST EXPERIMENT ONLY:
Replace ONE current branch’s dominant pill/node presentation with layered anatomy and restrained external labels.

Do NOT redesign all four branches yet.

The experiment succeeds only if, in the resting still frame:
- the organism is visually dominant over its controls
- the user can identify the branch and current state
- the next available action remains clear
- accessible HTML actions remain available
- mobile remains readable without pinch/drag/zoom

AT 80 XP:
Show two prospective tips/possibilities.
Do not depict a committed limb until specialization is authoritatively chosen.

TRIALS:
After Root Specimen V1 is accepted, prototype one distinct-day Trial as a dated evidence folio instead of a generic progress bar.

CRESTS:
After Trial presentation is accepted, prototype ONE Crest terminal before drawing all eight.

MOTION:
Use motion/react only.
No perpetual organism swaying/pulsing.
No regrow animation on navigation/refresh.
Reduced motion = immediate final anatomy.

EVIDENCE:
Capture baseline and experiment screenshots at desktop/tablet/mobile.
Verify Root List/equivalent text state still exists.
Verify keyboard, focus, reduced motion, 200% zoom, and mobile 320/375/390.

Stop after ONE branch experiment and request review.
Do not merge to main.
```

---

# Prompt 4 — Susmita: Objects + History + Product Shell

```text
EMBER & ROOT — SUSMITA WORKSTREAM
OBJECTS + HISTORY + PRODUCT SHELL

Repository:
https://github.com/Algoryxz/ember-and-root

Target branch AFTER Smarak publishes the verified Experience V2 baseline:
feat/experience-world-history

DO NOT CUT THIS BRANCH FROM A STALE MAIN.
Confirm the approved baseline SHA with Smarak first.

FIRST:
1. git fetch origin --prune
2. verify approved baseline SHA
3. create/switch to feat/experience-world-history from that exact baseline
4. git status
5. inspect Satchel, Chronicle, navigation, Settings, empty/error states in a real browser
6. capture baseline screenshots

READ:
AGENTS.md
docs/PRD.md
docs/TRD.md
docs/APP_FLOW.md
docs/UI_UX_BRIEF.md
docs/BACKEND_SCHEMA.md
docs/CONTRACTS.md
docs/EXPERIENCE_V2.md
docs/TEAM_WORKSTREAMS_V2.md
docs/ATTRIBUTIONS.md

MISSION:
Make Satchel, Chronicle, navigation, Settings, and secondary states feel like the same Ember & Root world rather than utility screens.

FIRST: CORRECTNESS AUDIT

Before visual redesign verify:
- Chronicle does not calculate level with its own client formula; consume authoritative level.
- Chronicle preserves immutable quest title/date/reward history.
- older history is reachable or the current limitation is explicitly documented and fixed without inventing unauthorized schema.
- Satchel purchase/equip states are authoritative and preserved.

FIRST VISUAL EXPERIMENT ONLY — COPPER HALO

Do not redesign all three items.

Take Copper Halo and create one complete inspection experience:
- specimen drawer / field cabinet logic
- item is visually dominant
- name second
- description + price supporting
- clear preview / unowned / owned / equipped states
- clear purchase/equip actions
- same visual asset can be represented on Hearth when equipped
- no ecommerce carousel
- no autoplay rotation
- no emoji as production relic art

Preserve all existing economy rules and server actions.

AFTER COPPER HALO REVIEW:
Proceed one experiment at a time:
1. Chronicle entries grouped by date/month without individual dashboard cards
2. quiet journal-index navigation treatment
3. Settings/colophon cleanup
4. meaningful empty states
5. return-after-absence state using existing server context only

ICON SYSTEM:
You coordinate the unified navigation/utility icon direction.
Do not install a new icon package without approval.
If using an external icon family materially, record it in docs/ATTRIBUTIONS.md in the same commit and ensure the choice works with the field-journal system.

CHRONICLE:
History first, totals second.
XP is supporting metadata.
Do not create a stats dashboard.

SETTINGS:
Practical language and simple controls.
Do not turn toggles into ceremonial interactions.

MOTION:
Local, short, state-driven.
No bouncing navigation.
No autoplay display objects.

ACCESSIBILITY / E2E:
You retain strong ownership of Playwright and accessibility verification for these surfaces.
Verify keyboard, focus, reduced motion, 320/375/390, tablet, desktop, 200% zoom, and no horizontal overflow.

Stop after Copper Halo and correctness audit; request review before applying the pattern to the remaining Satchel items.
Do not merge to main.
```

---

## Shared handoff format

Every owner should end a work session with:

```text
EMBER & ROOT — WORKSTREAM HANDOFF

Branch:
HEAD:
Base SHA:

Changed files:
- ...

What changed:
- ...

What is intentionally unchanged:
- progression math
- server authority
- ...

External references materially used:
- creator / source / copied|adapted|inspiration

Verification actually run:
- npm run typecheck — PASS/FAIL
- npm test — PASS/FAIL
- npm run lint — PASS/FAIL
- npm run build — PASS/FAIL
- relevant Playwright — PASS/FAIL
- live DB suite if applicable — PASS/FAIL

Screenshots:
- baseline ...
- experiment ...

Known limitations:
- ...

Decision requested:
KEEP / REVISE / REJECT
```

Do not report a result as verified if the command was not run in the current branch state.

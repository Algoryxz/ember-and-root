# Life RPG — Research → Strategy → Winning Concept

---

## PHASE 0 — Requirements Matrix (from the PDF only)

**A = PDF explicit | B = my inference | C = external research**

| Requirement | Type | Importance | How judges test it | Failure mode | How to exceed |
|---|---|---|---|---|---|
| Full-stack app (not frontend-only) | A, Mandatory | Critical | Check repo for backend + inspect network calls | Static/localStorage-only app | Show authoritative server-side XP calc live |
| Secure auth, users see only own data | A, Mandatory | Critical | Try accessing another user's data / API without token | Data leaks between accounts | Row-level scoping + tested 401/403s |
| DB-backed persistence (relational or NoSQL) | A, Mandatory | Critical | Refresh page mid-demo, check DB directly | localStorage-only = instant zero | Show DB record in a table/console during demo |
| CRUD for tasks | A, Mandatory | High | Create/edit/delete during judging | Laggy or broken CRUD | Optimistic UI + undo |
| Non-linear leveling (XP curve increases) | A, Mandatory | High | Ask for the formula / observe level thresholds | Linear or trivial curve | Show the actual curve, explain math on demand |
| Streaks (consecutive-day tracking) | A, Mandatory | High | Test streak break/continue, ask about timezones | Streak breaks on timezone edge case | Explicit timezone handling + grace period |
| Attributes tied to task categories | A, Mandatory | High | Complete tasks of different categories, check stat changes | Attributes cosmetic-only | Attributes visibly gate content (skill tree, unlocks) |
| Currency/economy + shop | A, Mandatory | Medium-High | Buy an item, check balance updates server-side | Client-side currency (cheatable) | Server-validated transactions, transaction log |
| Responsive UI (mobile→desktop) | A, Mandatory | Critical | Resize / open on phone | Broken layout on mobile | Test on real device, not just DevTools |
| Full keyboard navigation | A, Mandatory | High | Tab/Enter/Space through entire flow, no mouse | Focus traps, unreachable buttons | Visible focus states, logical tab order |
| Screen-reader structurally sound | A, Mandatory | High | Run axe/Lighthouse a11y audit | Div-soup, no semantic HTML/ARIA | aria-live regions for XP/level-up toasts |
| Public GitHub repo, clean commits, README + .env.example | A, Mandatory | Critical | Open repo | Private repo, <3 commits, missing backend, squashed history | README with architecture diagram |
| Live deployed URL | A, Mandatory | Critical | Click the link at judging time | Broken/expired link | Use durable host (Vercel/Render), test day-of |
| 90–180s video, signup→task→level-up→refresh | A, Mandatory | Critical | Watch video, check length/access | Missing/private/oversized video | Script it to hit a "wow moment" |
| Non-generic SaaS/Bootstrap look | A, Mandatory (judged) | Critical | First visual impression | Default component library, no theme | Full thematic language + custom motion |
| Cohesive theme (naming, palette, type) | A, Mandatory (judged) | High | Check consistency across screens | "Tasks" leaking into a "Quests" theme | Terminology audit pass before submission |
| Feel alive/tactile (micro-interactions) | A, Mandatory (judged) | High | Complete a task, watch reaction | No feedback on completion | Spring/particle feedback on every state change |
| Perceived-latency hiding (skeletons, optimistic UI) | A, Mandatory (judged) | Medium-High | Throttle network in DevTools | Visible spinners/jank | Optimistic updates + rollback on error |
| Performance & SEO | A, Judged | Medium | Lighthouse score | Slow load, no meta tags | Code-split heavy animation libs |
| Graceful error handling (empty task, offline) | A, Judged | Medium-High | Submit empty task, kill network mid-action | Crash or silent failure | Friendly in-theme error states |
| **DQ:** private repo / dead link | A, Zero-tolerance | — | — | Instant zero | Double-check both before deadline |
| **DQ:** localStorage-only persistence | A, Zero-tolerance | — | — | Instant zero | Postgres/Mongo/Supabase, never fake it |
| **DQ:** build/deploy failure, backend can't reach DB in prod | A, Zero-tolerance | — | — | Instant zero | Test the *deployed* build, not just localhost |
| **DQ:** console/runtime crashes | A, Zero-tolerance | — | — | Instant zero | Try-catch + error boundaries everywhere |
| **DQ:** <3 commits / no backend / faked history | A, Zero-tolerance | — | — | Instant zero | Commit incrementally from hour 1 |
| **DQ:** video missing/login-gated/>100MB | A, Zero-tolerance | — | — | Instant zero | Public unlisted link, compress video |

**Note (B):** the PDF does not mandate real-time multiplayer, AI, or any specific tech — those are all optional differentiators, not requirements. Anything answering "should we build social features / AI chat" is my inference, not a PDF requirement — treat as P2/P3.

---

## PHASE 1 — Competitor Research (condensed)

Searched Habitica, Finch, Forest, LifeUp, SuperBetter, and adjacent tools (Spirit City, GamifyRoutine, CATtention).

Consistent patterns across reviews:
- **Habitica**: <cite index="4-1">Users appreciate the gamification for making task management fun and motivating, but complaints include lack of offline support, excessive notifications, and complexity of some features, with some users feeling the reward system, while praised, is not intuitive.</cite> One long-time user summed it up as good but tiring over the long term. Structurally it's a to-do list wearing a pixel-art skin — the RPG layer rarely *changes what you do*, only what it's called.
- **Finch / Spirit City / CATtention**: lean into "cozy companion" framing — a pet/spirit that reacts to your real-world behavior. Strong emotional attachment mechanic, but shallow progression depth (mostly cosmetic collection, little systemic depth like stats/skill trees).
- **LifeUp**: positions itself as fully user-authored ("YOU create the rules"), which is powerful for power users but a blank-page problem for new users — no default fantasy, no onboarding hook.
- **Forest**: single-mechanic focus (grow a tree per focus session) — proves a *narrow, legible loop* can be extremely sticky, but has nothing resembling a skill tree/attribute system.

**Gap nobody solves well:** every competitor picks either (a) deep systems with weak visual/emotional payoff (Habitica), or (b) strong emotional/visual payoff with shallow systems (Finch/Spirit City). None combine a systemic RPG (real stats, real skill tree, real itemization) with a moment-to-moment feel that's actually *tactile* — most of Habitica's "juice" is a static sprite and a number tick. That gap is where a hackathon team with front-end animation skill and backend rigor can win outright, since 50–200 competing teams will mostly clone the "dashboard + XP bar + shop" shape (per Phase 5).

---

## PHASE 2 — Behavioral/Game-Design Research (applied)

- **Goal-gradient effect**: <cite index="20-1">a streak or progress bar converts an abstract, open-ended goal into a concrete, shrinking distance you can watch close in real time, and every check-in shortens the perceived gap to the next milestone</cite> — meaning progress bars must always show "distance to next thing," never just "total XP."
- **Loss aversion + streaks**: <cite index="20-1">a long streak becomes something you don't want to forfeit, and loss aversion pushes against breaking what you've built, stacking with the goal-gradient pull toward the next milestone</cite>. But this cuts both ways — <cite index="13-1">variable reinforcement designed purely to protect a streak can tip into anxiety and unhealthy attachment rather than sustainable habit formation</cite>, so a **streak-freeze / grace mechanic is not just UX kindness, it's what separates "healthy game" from "dark pattern."**
- **Zeigarnik effect**: <cite index="19-1">MMOs structurally never let task lists exhaust — completing one objective generates two more, and this "just one more turn" effect keeps players returning</cite>. Applied to Life RPG: daily/weekly quests should always leave *one visible unclaimed thread* (a partially-filled bar, a pending chest) rather than a fully "zeroed out" state.
- **Self-Determination Theory**: <cite index="18-1">autonomy, competence, and relatedness are the three needs that support intrinsic motivation — gamification that supports them enhances motivation, while gamification that undermines them through controlling rewards or manufactured obligation corrodes it</cite>. Practical translation: let users *name their own quests and attributes* (autonomy), make level-ups visibly harder-won at higher levels (competence), and treat social features as optional flavor, not core loop (relatedness is nice-to-have, not required by the PDF).
- **Where naive gamification fails**: research is explicit that discrete progress isn't uniformly good — <cite index="17-1">progress markers that segment a long task into subgoals can raise effort, but arriving at a marker can also function as a completion that licenses resting rather than continuing</cite>. This is exactly the "+10 XP becomes meaningless" failure mode the brief warns about. **Fix:** XP alone is not the reward — the reward has to be *visible capability change* (a new skill-tree node, a new zone unlocked, a stat crossing a threshold that changes what quests are available), not just a bigger number.

**Ethical guardrail baked into the design (not a dark pattern):** no punishing loss of *permanent* progress for a missed day — only short-term streak flame resets, softened by 1 freeze/week. No FOMO timers, no artificial scarcity shop items, no notification-guilt.

---

## PHASE 3 — Feasible Web Tech for "Game Feel"

| Technique | Impact | Effort | Perf/A11y risk | Verdict |
|---|---|---|---|---|
| Framer Motion / Motion for spring-based transitions | High | Low | Low | **Use** |
| CSS-only micro-interactions (button press, checkbox morph) | High | Very low | Very low | **Use everywhere** |
| Canvas/WebGL particle burst on level-up (lightweight, e.g. tsParticles) | High (demo wow) | Low-Med | Low if capped particle count + `prefers-reduced-motion` respected | **Use, sparingly** |
| Three.js 3D avatar/world | Medium-High visual, but high effort/risk for a timed hackathon | High | High (bundle size, mobile perf, a11y for canvas content) | **Avoid** unless team has strong 3D experience already |
| Lottie/Rive for character animations | Med-High | Low (if assets exist) | Low | Use if pre-made assets fit theme, else skip |
| Web Audio (short SFX on XP gain/level-up) | High emotional payoff | Very low | None if muted-by-default + toggle | **Use** — cheap, disproportionately loved by judges |
| Skeleton loaders + optimistic UI (React Query/SWR style) | Required by brief ("seamlessly integrated") | Low-Med | None | **Use, mandatory** |

**Verdict:** favor 2D, CSS/SVG/Canvas-particle-driven "juice" over 3D. Three.js/PixiJS look impressive in a portfolio but are the highest-risk-per-hour investment in a short hackathon — several judging pillars (performance, a11y, mobile) actively punish them if not executed perfectly. This is a "sounds impressive, bad use of dev time" trap (Phase 5 territory).

---

## PHASE 4 — Technical Architecture

**Recommended stack:** **Next.js (App Router) + PostgreSQL + Prisma + NextAuth (or Clerk) + Vercel**, with Supabase as the DB/auth host to save setup time.

Why this beats the alternatives for a short timeline:
- Single deployable app (frontend + API routes) → fewer moving parts to keep alive for judging.
- Prisma gives you migrations + type safety fast, critical when the DB schema (below) has real integrity requirements.
- Supabase/Clerk cuts auth-from-scratch time, which the PDF explicitly allows ("Firebase, Supabase, Appwrite, Clerk, NextAuth, or custom JWT").
- Vercel deployment is closest to zero-config, reducing "Build/Deployment Failure" DQ risk.

Alternative considered: React/Vite + FastAPI + Postgres — better if the team is stronger in Python, but two deployables (static frontend + separate API) doubles the "is it actually up" risk during judging. Only choose this if the team already has FastAPI fluency.

**Non-negotiable backend rules (anti-cheat / integrity):**
1. **XP, currency, and level are never trusted from the client.** Every completion event goes to an API route that recalculates server-side.
2. **Idempotent task completion** — a `task_completions` table with a unique constraint on `(task_id, date)` for daily tasks prevents double-submission/duplicate-XP exploits (double-click, replayed request).
3. **All monetary/XP-affecting writes are DB transactions** (wrap XP add + currency add + streak update in one transaction) so a crash mid-write can't create a duplicated or lost reward — this is what "database integrity" concretely means here.
4. **Streak calculation is done server-side against `completed_at` timestamps stored in UTC**, compared against the *user's stored timezone offset*, not `new Date()` on whichever device opens the app.
5. **Rate/limit obviously-gameable actions** (e.g. cap XP-eligible completions per task per day) — this is your answer to "anti-farming."

**Schema sketch:**
```
users(id, email, password_hash/oauth_id, timezone, created_at)
characters(id, user_id, level, xp, xp_to_next, currency, created_at)
attributes(id, character_id, name, xp, level)          -- e.g. Intellect, Strength
tasks(id, user_id, title, attribute_id, difficulty, cadence, active)
task_completions(id, task_id, user_id, completed_at, xp_awarded, currency_awarded)
   UNIQUE(task_id, date_trunc('day', completed_at at time zone user_tz))
streaks(id, user_id, current_count, longest_count, last_completed_date, freezes_available)
items(id, name, category, price, effect_json)
inventory(id, user_id, item_id, acquired_at, equipped)
achievements(id, key, name, criteria_json)
user_achievements(id, user_id, achievement_id, unlocked_at)
xp_transactions(id, user_id, source, amount, balance_after, created_at)  -- audit log
```

---

## PHASE 5 — Judge's-Eye View

1. **First 10 seconds:** a themed loading/landing moment with sound + motion beats a static hero image every time — most teams will show a dashboard screenshot immediately; showing *world*, not *UI*, first, differentiates instantly.
2. **Memorable demo:** a level-up moment that has audio + particles + a camera-shake-style micro-effect, tied to a task that's clearly real (e.g., "Finished Chapter 3" not "Task 1").
3. **Technical depth signal:** narrate the server-authoritative XP check live — e.g., open dev tools, show a manipulated client request getting rejected. Judges rarely see teams *prove* their anti-cheat; doing so for 10 seconds is disproportionately memorable.
4. **Genuine creativity:** a skill tree with real branching choices (not just a list of unlocked badges) signals design effort competitors skip.
5. **Hard to fake with a generic AI dashboard:** hand-authored pixel/vector art or a distinctive custom illustration style, thematic copywriting throughout (no leftover "Task" or "Points" anywhere), and a coherent sound identity — these are the things that scream "someone designed this," because generic AI scaffolding defaults to Tailwind-blue dashboards.
6. **Wow moment for the 90–180s video:** the exact second XP crosses a level threshold, freeze-frame-style, then cut to a hard refresh proving persistence, all within one continuous demo flow.
7. **Impressive-sounding but bad time investment:** full 3D worlds, blockchain "true ownership" of items, building your own custom animation engine instead of using Framer Motion/GSAP, real-time multiplayer, or an AI chatbot companion that doesn't touch the actual progression math. All of these are effort sinks that dont map to judging pillars.

**Disqualification risks to actively guard against:** private repo at judging time, forgetting to test the *deployed* build (not just localhost), video hosted somewhere that requires login, and squashing all commits into one at the last minute (looks like "evidence of last-minute single-session work," explicitly called out).

---

## PHASE 6 — Concept Generation (15+, condensed cards)

| # | Name | Hook | Theme |
|---|---|---|---|
| 1 | **Emberlog** | Your tasks stoke a literal ember that grows into a fire/forge as your streak grows | Cozy/fantasy hybrid |
| 2 | **Dungeon Ledger** | Each task is a room in a procedurally-revealed dungeon; finishing it clears the room | Dungeon crawler |
| 3 | **Skygarden** | Tasks grow a floating island garden; attributes = biomes (Mind=frost peak, Body=jungle) | Cozy world-builder |
| 4 | **Nulldrift** | Cyberpunk mercenary rebuilding their "rig" (stats) via real tasks logged as "contracts" | Cyberpunk |
| 5 | **Companion Protocol** | An evolving creature (Pokémon-esque) that changes form based on which attribute you invest in most | Creature progression |
| 6 | **The Long Watch** | Roguelike where a "run" = one week; missing tasks weakens your watch, but a bad week doesn't erase permanent unlocks | Roguelike-lite |
| 7 | **Holdfast** | You're rebuilding a besieged keep; each completed task repairs/upgrades one keep module | City/base builder |
| 8 | **Case File Zero** | Detective noir — tasks are "leads"; completing them fills an evidence board toward solving a personal "case" (a real goal you set) | Detective/narrative |
| 9 | **Voyager Log** | Space-exploration; tasks = fuel/supplies for the next system jump, attributes = ship systems | Space exploration |
| 10 | **Ronin's Path** | Anime/wuxia — a martial-arts dojo; attributes are "forms," and a skill tree is literally a katana move-list | Anime-inspired |
| 11 | **Grove Keeper** | Minimalist skill-tree-first design; almost no "world," just a gorgeous living tree that branches per attribute | Personal skill tree, minimalist |
| 12 | **Second Wind** | A survival-game framing where daily tasks = resources gathered to keep a camp running through "seasons" | Survival |
| 13 | **Chronicle** | Purely narrative — your task history *writes* a fantasy storybook page by page, illustrated procedurally | Narrative/story-book |
| 14 | **Aftergrowth** | Post-apocalyptic reclamation — tasks regreen a dead map tile by tile | Post-apoc/world builder |
| 15 | **Loreborn** | You are literally leveling up a bard whose "spellbook" is your real skills; casting = using a skill you've built | Fantasy RPG classic, executed with depth |
| 16 | **Signal** | Idle-game inspired: passive "resource ticking" from consistency, active bursts from task completion, appeals to idle-game fans | Idle/incremental hybrid |

(Full write-ups on request for any concept — condensed here deliberately, since scoring below eliminates most before they're worth fleshing out in full, per the brief's own Phase 7 instruction to "be ruthless.")

---

## PHASE 7 — Scoring & Top 5

Scored `/100` (Design&UX/20, Creativity/20, Gamification depth/15, Technical impressiveness/10, Feasibility/10, Demo potential/10, Retention/5, Perf&A11y/5, Originality/5):

| Concept | Score | Why |
|---|---|---|
| **Grove Keeper** | **86** | Skill-tree-first design is *the* differentiator vs. Habitica clones, and it's genuinely feasible in the timeline (SVG tree + CSS/Framer Motion, no 3D) |
| **Emberlog** | **83** | Warm, demo-friendly visual metaphor (fire/forge growth) with obvious "wow" moment (level-up = the fire visibly roars), moderate build cost |
| **Companion Protocol** | **78** | Strong emotional hook (creature evolution), but risks becoming "just a mascot" if systems aren't deep — needs careful scoping |
| **Nulldrift** | **74** | Cyberpunk aesthetic is very demo-striking and distinct from the cozy-fantasy crowd most teams will pick, but "contract/rig" metaphor needs disciplined copywriting to stay cohesive |
| **The Long Watch** | **69** | Roguelike weekly-run framing is a genuinely novel structure for a productivity app (nobody else does this), but riskier to build correctly (run-reset logic, balancing) in a short timeline |

Eliminated (representative reasons): Dungeon Ledger and Holdfast are mechanically closest to a re-skinned dashboard once built (rooms/modules ≈ just another task list — low originality-vs-competitors score); Voyager Log and Aftergrowth are strong themes but map-tile mechanics are a lot of extra state to build correctly for the payoff; Chronicle's procedural-storybook idea is creative but AI-illustration-dependent and risks becoming the "AI chatbot" trap the brief explicitly warns against; Case File Zero and Ronin's Path are compelling but don't clearly beat Grove Keeper/Emberlog on feasibility within a hackathon timeline.

**Direct comparison of the top 2 (Grove Keeper vs. Emberlog):** Grove Keeper wins on "hard to reproduce with a generic AI dashboard" (a real branching skill tree visibly demonstrates system depth); Emberlog wins on raw demo emotional punch (fire growing is instantly legible on video, even muted). → **Combine them.**

---

## PHASE 8 — The Winning Concept

### PRODUCT NAME
**Ember & Root**

### TAGLINE
*Grow something real, one task at a time.*

### 30-SECOND PITCH
Ember & Root is a Life RPG where your real tasks feed a living skill-tree — the **Root** — while your consistency stokes a central **Ember** that visibly grows, cools, or roars based on your streak. Attributes aren't just numbers on a sheet: each one is a branch of the Root that physically grows new nodes, unlocking real capabilities (new quest types, new shop tiers, new Root cosmetics) as you invest in it. It's the mechanical depth of a real RPG skill tree, combined with the instant emotional legibility of watching a fire grow — built on an authoritative backend that makes cheating your own stats impossible.

### CORE FANTASY
You're not a to-do-list user. You're the keeper of a small, living hearth-garden that only grows if you tend your real life.

### WHY THIS IS NOT "TODO LIST + XP"
The Root is not decorative — it's the *only* UI for seeing your attributes, and its branching state gates what's available to you (new quest categories, new shop items, cosmetic Ember colors). Progress isn't "a bar filling," it's "a structure visibly changing shape," which is the concrete fix for the "+10 XP becomes meaningless" failure mode identified in Phase 2.

### CORE GAME LOOP
Real task completed → attribute XP added (server-authoritative) → Root branch grows one visible increment → Ember intensity updates from streak state → new Root node/quest/shop tier occasionally unlocks → reason to open tomorrow: an almost-full branch or an Ember about to hit its next tier.

### META PROGRESSION
Long-run players unlock **Root Forms** — cosmetic overall tree "ages" (Sprout → Grove → Ancient Root) at major level thresholds, which reskin the entire Root visual, giving a reason to keep playing past level 20+ beyond raw stats.

### PLAYER CHARACTER
No humanoid avatar (avoids a costly asset pipeline) — the Root + Ember *is* the character. Optional small cosmetic "keeper" icon/badge for profile identity, kept simple (SVG, a few unlockable variants).

### WORLD / ENVIRONMENT
A single hearth-and-garden scene (not multiple explorable zones) — deliberately scoped down. Depth comes from the Root's branching complexity, not spatial breadth. This directly avoids the "impressive-sounding, bad use of dev time" trap of building an explorable multi-zone world.

### QUEST SYSTEM
- **Daily Quests**: user-authored recurring tasks tied to an attribute.
- **Weekly Quests**: heavier tasks worth more XP, capped per week (anti-farming).
- **Milestone Quests**: auto-generated when a Root branch nears its next node ("3 more Intellect tasks to unlock the Ember of Focus") — this is the Zeigarnik-driven "one visible unclaimed thread" mechanic from Phase 2.

### STATS (Attributes)
Default four, user can rename/add: **Intellect, Vitality, Discipline, Craft** — each maps to a Root branch.

### SKILL TREE
The Root itself: each attribute is a branch with ~8–10 nodes. Nodes unlock alternately: (a) a passive perk (e.g., +5% currency from Discipline tasks), (b) a cosmetic (Ember color/particle style), (c) a new quest-type slot. This mixed-reward pacing is the direct countermeasure to "flat XP becomes meaningless."

### XP & LEVEL CURVE
Character level curve (non-linear, per PDF requirement):
```
XP_to_reach_level(n) = 50 * n^1.6   (rounded to nearest 10)
```
| Level | XP required (cumulative) |
|---|---|
| 2 | 90 |
| 5 | 380 |
| 10 | 1260 |
| 20 | 4260 |
| 30 | 8770 |

Per-task XP:
```
task_xp = base_difficulty_xp * streak_multiplier * (1 + 0.02 * min(current_streak, 25))
```
- `base_difficulty_xp`: Easy=10, Medium=20, Hard=35 (user-tagged at creation)
- `streak_multiplier` caps at +50% (streak 25+) so it rewards consistency without becoming an unbounded farm vector.
- **Daily XP cap**: no single day can grant more than ~150% of a "perfect day" (4 hard tasks) worth of XP — prevents dumping 40 trivial tasks for a level-skip.

Attribute XP mirrors task XP 1:1 into whichever attribute the task is tagged with; attribute level curve uses a gentler exponent (`25 * n^1.4`) since branches should visibly grow faster than the overall character level.

Currency formula:
```
currency = round(task_xp * 0.6)
```
Item pricing bands: cosmetic Ember/Root skins 150–600, small perk boosts 50–150, "streak freeze" consumable 100 (capped 1/week purchase to prevent farming around the streak-loss mechanic).

Achievement rewards: flat one-time currency (200–1000) + a guaranteed cosmetic, never XP (keeps XP curve mathematically clean and un-gameable via achievement stacking).

**Simulation:**
- **Day 1**: 2 easy tasks completed → ~20 XP, ~12 currency, streak=1. Root shows first node glow on the branch used.
- **Day 3**: streak=3, one medium task → 20*1.06 ≈ 21 XP that task; cumulative character XP ~70. First Root node on primary branch fully unlocked — visible shape change.
- **Day 7**: streak=7 (multiplier 1.14), mixed days average ~45 XP/day → cumulative ~300 XP, character level 3–4. Weekly quest claimed, second branch shows growth. Ember visibly "steady burn" tier.
- **Day 30**: streak likely broken/rebuilt once (freeze used once) — average streak ~15–20 by day 30, multiplier ~1.3–1.4. Cumulative XP roughly 1200–1600 → character level ~9–10. At least one attribute branch fully bloomed, unlocking a Root Form cosmetic. Feels rewarding (visible structural changes every few days) without ever letting one day trivialize a week (daily cap) or one grind session skip the curve (exponential level cost).

### STREAK DESIGN
- Consecutive calendar days (user's own timezone, stored at signup) with ≥1 completed task.
- **1 free "Ember Ash" freeze per 7-day rolling window** — protects against the anxiety/dark-pattern failure mode identified in Phase 2 while keeping loss-aversion motivation intact.
- Missing a day beyond the freeze resets `current_count` to 0 but **never** touches `longest_count`, level, or unlocked Root nodes — only the *chain*, never permanent progress. This is the explicit ethical guardrail from Phase 2.

### ECONOMY
Currency = "Sparks." Earned per-task (formula above), spent in the Shop. No purchasable-with-real-money currency at all (avoids scope creep and any monetization DQ-adjacent complexity the PDF never asked for).

### SHOP
Cosmetic-first: Ember particle colors/shapes, Root visual skins (bark textures, blossom styles), profile badge frames. One small functional item (Streak Freeze, capped). No pay-to-win stat boosts — keeps "Robustness" and fairness judged favorably.

### ITEMS
Inventory table stores owned cosmetics + the capped Streak Freeze consumable; equipping a cosmetic is a simple `equipped=true` flag swap, instantly reflected via optimistic UI.

### ACHIEVEMENTS
Examples: "First Bloom" (first Root node unlocked), "Steady Hands" (7-day streak), "Ancient Root" (reach Root Form 3), "Renaissance" (all four attributes above level 5 simultaneously) — each criteria stored as simple JSON checked server-side on relevant events, not polled constantly.

### DAILY QUESTS
1–3 user-defined recurring tasks; reset at local midnight (server checks against stored user timezone).

### WEEKLY QUESTS
1–2 heavier, higher-XP tasks; reset Monday local time; capped completion count to prevent farming.

### LONG-TERM GOALS
Root Forms (cosmetic tree "ages") at levels 10/20/30+ act as the multi-week retention hook beyond raw numbers.

### FAILURE / MISSED TASK HANDLING
Missed daily tasks simply expire (no XP, no penalty beyond streak effect) — no punishment stacking, per the anti-dark-pattern principle.

### COMEBACK MECHANICS
After a streak break, the very next completed task shows a small "Ember relights" animation — an intentional small dopamine hit designed to counter the demotivation of a lost streak (turns the reset into a fresh, still-satisfying beat rather than pure loss).

### ANTI-CHEAT
All of Phase 4's rules apply: server-authoritative XP/currency/level, idempotent completions (unique constraint per task/day), DB transactions wrapping every reward event, server-side streak calc against stored timezone, and a daily XP cap.

### PERSONALIZATION
Users rename attributes, pick starting Ember color, author their own quests freely (autonomy, per SDT) — no forced fantasy vocabulary beyond the default theme, which they can also relabel.

### OPTIONAL AI FEATURES
The *only* AI feature worth building, if time allows: a lightweight "quest phrasing" assist that turns a plain task ("go for a run") into theme-flavored text ("Trial of Vitality: complete a 20-minute run") — strictly cosmetic text generation, never touching progression math, and easily cut if time runs short (P2 at best).

### SOCIAL FEATURES
Not worth building for this timeline — the PDF never requires them, and per Phase 2, relatedness is a "nice to have," not core loop. Skip entirely; redirect that time to polish.

### ACCESSIBILITY
Semantic HTML throughout, `aria-live="polite"` region for XP/level-up toasts (so screen readers announce progress), full keyboard path from login → task creation → completion → shop, `prefers-reduced-motion` fallback that swaps particle bursts for a simple fade/scale.

### MOBILE EXPERIENCE
Root tree becomes a vertically-scrollable, pinch-zoomable SVG; bottom tab nav (Home/Quests/Root/Shop); Ember is a persistent small widget in the header across all screens.

### DESKTOP EXPERIENCE
Root tree occupies a central canvas with a side panel for active quests; Ember visible in a persistent top-bar HUD.

### ANIMATION / SOUND / HAPTIC-LIKE FEEDBACK
Checkbox-style task completion → 150ms spring squash + a soft chime; level-up → brief screen-wide particle bloom + a rising chime + Root branch visibly extends; streak break → a quiet, non-punishing dimming of the Ember (not a jarring "failure" sound) — the sound design deliberately never uses negative-feeling stings, only muted/neutral cues for setbacks.

---

## PHASE 9 — Screen Architecture (abbreviated to the essentials)

| Screen | Purpose | Primary action | Key animation |
|---|---|---|---|
| Landing | Convert visitor, set tone | "Begin your Root" CTA | Ember idle-glow loop |
| Signup/Login | Auth | Submit | Skeleton → optimistic redirect |
| Onboarding | Pick attributes/theme name, first quest | Create first quest | Root's very first sprout appears |
| Home/Hearth | Daily overview, Ember status | Complete a quest | Spring completion + chime |
| Quest creation/detail | CRUD tasks | Save | Optimistic insert, rollback on error |
| Root (skill tree) | View/browse attribute growth | Tap node for detail | Branch-grow animation on unlock |
| Level-up modal | Celebrate threshold crossing | Dismiss/share | Full particle bloom + sound |
| Shop | Spend currency | Buy/equip | Item "materializes" on purchase |
| Achievements | Track milestones | View | Subtle shimmer on newly-unlocked |
| History | Audit trail (transaction log) | Filter | None needed — simple table |
| Settings | Timezone, reduced-motion, sound toggle, theme relabeling | Save | None |

Mobile: single-column, bottom tab bar, Root becomes scroll+pinch canvas. Desktop: two/three-pane layout with persistent HUD.

---

## PHASE 10 — Demo Strategy (90–180s script)

0:00–0:10 — Cold open on the Hearth screen, Ember gently glowing, ambient sound. No login screen shown yet (hook first).
0:10–0:25 — Quick signup (sped up/cut), land on onboarding, pick an attribute name.
0:25–0:45 — Create a real task ("Read 20 pages"), complete it live → spring animation + chime + Root's first node visibly grows.
0:45–0:65 — Cut to Root screen, tap a near-complete branch, complete one more quest on camera → **node unlock animation (the wow moment)**, particle bloom, sound swell.
0:65–0:90 — Quick cut to Shop, buy a cosmetic with earned currency, equip it, Ember changes color instantly.
0:90–0:110 — Show a manipulated network request being rejected (anti-cheat proof) — 5–8 seconds, clearly labeled on-screen text "server rejects invalid XP."
0:110–0:130 — Hard refresh the browser → everything persists (level, Root shape, equipped cosmetic) — directly satisfies the PDF's explicit persistence-proof requirement.
0:130–0:150 — Quick resize to mobile viewport or cut to phone recording, same state, fully responsive.
0:150–0:165 — Tab through the whole flow with visible focus rings, no mouse — proves keyboard/a11y in a few seconds.
0:165–0:180 — End on the Ember, now visibly larger/brighter than the opening frame — a visual "look how far we came in this same video" callback.

---

## PHASE 11 — Build Plan

**P0 (must-ship):** auth, task CRUD, server-authoritative XP/level/currency engine, one attribute branch minimum visualized, streak tracking w/ timezone handling, shop with ≥3 items, responsive layout, keyboard nav, DB persistence proven, deployed + README.

**P1 (major judging advantage):** full 4-branch Root visualization with grow animation, particle/sound level-up, optimistic UI + skeletons, achievements, transaction history/audit log, `aria-live` announcements, streak freeze mechanic.

**P2 (polish):** Root Forms cosmetic ages, quest-phrasing AI assist, richer sound design, empty-state/error-state illustrations, dark mode.

**P3 (avoid / cut if time-pressured):** 3D/Three.js world, multiplayer/social feed, blockchain/NFT items, custom animation engine instead of a library, real-money purchases, elaborate multi-zone explorable map.

**What NOT to build:** anything spatial/explorable beyond the single Hearth+Root scene, any chat-style AI companion, any leaderboard/social comparison system — none are required and all are high-effort/low-judging-return per Phase 5's own analysis.

---

## PHASE 12 — Final Verdict

1. **Strongest concept: Ember & Root** — a living skill-tree (Root) fused with a legible streak-fire (Ember), on a server-authoritative backend.
2. **Why it beats a standard Habitica-like build:** Habitica-style apps put the RPG skin *on top of* a task list; here the attribute system *is* the primary UI (the Root), so system depth is unavoidably visible, not decorative — directly answering the brief's "not a Habitica clone with better UI" instruction.
3. **Why judges remember it:** a single, continuous visual metaphor (a fire and a tree that visibly grow across the whole demo) reads instantly even muted, plus a deliberate on-camera anti-cheat proof most teams won't think to show.
4. **Riskiest assumptions:** (a) that the Root's branch-grow animation can be built cleanly with SVG/Framer Motion within the timeline without becoming a rendering-performance problem on mobile — mitigate by capping node count and testing on a real low-end phone early; (b) that the streak/timezone logic is genuinely correct — mitigate with unit tests on the streak function specifically, since this is the single most common silent-bug source in this problem domain.
5. **Prototype first:** the Root's node-unlock animation (highest technical/visual risk) and the server-side transactional XP-award function (highest integrity risk) — both before any polish work.
6. **Recommended stack:** Next.js + PostgreSQL + Prisma + Supabase/Clerk auth, deployed on Vercel.
7. **Recommended feature scope:** P0 + P1 only; treat P2 as time-permitting, P3 as explicitly out of scope.
8. **3-day build strategy:** Day 1 — schema, auth, task CRUD, XP engine (P0 backend). Day 2 — Root visualization + level-up animation + shop + streak logic (P0 frontend + P1 core). Day 3 — polish pass (skeletons, a11y sweep, error states), record demo video, deploy + README, buffer for bugs.
9. **7-day build strategy:** Days 1–2 backend + schema + anti-cheat transactions; Days 3–4 Root visualization, animations, sound; Day 5 shop/achievements/history + a11y pass; Day 6 P2 polish (Root Forms, quest-phrasing assist if time allows) + cross-device testing; Day 7 demo scripting/recording, README, deployment hardening, final DQ-risk checklist pass.
10. **Explicitly avoid:** 3D worlds, multiplayer/social, blockchain, custom-built animation engines, monetization, and any AI feature that touches progression math rather than cosmetic flavor text.

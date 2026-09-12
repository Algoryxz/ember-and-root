# Ember & Root — Product Requirements Document

## Product

**Name:** Ember & Root  
**Tagline:** What you do becomes who you are.  
**One-line product:** A Life RPG where real tasks kindle today's Ember and grow a permanent Root shaped by the player's choices.

---

## Problem

Traditional productivity tools delay gratification until an arbitrary milestone is hit. Streaks punish absence without rewarding return. Generic gamification adds decorative XP bars that bear no relationship to what you actually did or who you are becoming.

Ember & Root makes real progress feel immediately visible — a completed task has a permanent, beautiful consequence — without becoming a generic task dashboard with RPG decoration bolted on.

---

## Product Vision

A single real-world action must produce one beautiful, understandable, permanent consequence on a deployed URL.

The player's Root is shaped by their actual choices. It is never procedurally generated. It grows through honest effort and deliberate decision-making, not grinding.

---

## Target User

A person who wants their daily habits and tasks to feel meaningful and to visibly accumulate into a permanent identity. They are comfortable with a fantasy aesthetic but are not primarily a gamer; they want their real life to feel like it has depth and shape.

---

## Core Fantasy

> I completed something real today. Something changed permanently. I can see it.

The player should feel: *my effort has a shape, and that shape is uniquely mine.*

---

## Core Game Loop

```
Complete a real-world quest
→ server confirms completion
→ Ember responds (reflects today's effort)
→ XP travels toward the correct Root branch
→ branch grows
→ progression threshold may unlock a specialization choice
→ player explicitly chooses a specialization
→ specialization opens a Trial
→ completing the Trial eventually unlocks a permanent Crest
```

The loop must never feel like busywork. Every step must be earned.

---

## Core Metaphor

**Ember** = what the player is doing *today*. It represents present effort. It responds to completed quests. It dims when inactive and relights upon return.

**Root** = who the player is *becoming*. It represents permanent growth. It never retreats. Attribute XP accumulates and shapes which specialization paths exist. Specialization choices are final in this release.

---

## User Goals

1. Record real tasks and complete them in a satisfying way.
2. See immediate visual feedback that feels proportionate and permanent.
3. Build a Root that reflects their actual interests and identity.
4. Understand their progress at a glance without reading a dashboard.
5. Return after an absence without punishment.

---

## Four Attributes

Each attribute represents a domain of the player's life. Each quest is assigned exactly one attribute. XP awarded by a quest is credited to both the player's total XP and the quest's assigned attribute.

| Attribute | Domain |
|-----------|--------|
| **Mind** | Intellectual effort, study, curiosity |
| **Body** | Physical activity, movement, endurance |
| **Will** | Emotional discipline, courage, focus |
| **Craft** | Making, building, creating, artistry |

---

## Specializations

Each attribute has exactly two specialization paths. A specialization choice is made by the player after reaching 80 attribute XP. The choice is final in this release.

| Attribute | Specialization A | Specialization B |
|-----------|-----------------|-----------------|
| Mind | Scholar | Explorer |
| Body | Endurance | Mobility |
| Will | Focus | Courage |
| Craft | Builder | Artisan |

---

## Trials

Eight authored Trials — one per specialization. Trials gate the Crest; they cannot be bypassed by XP alone.

Two evaluator types only:

1. **Distinct-day session count** — used by Scholar (5 days), Explorer (4 days), Endurance (7 days), Mobility (5 days), Focus (5 days), Artisan (5 days).
2. **Predeclared milestone + reflection** — used by Courage and Builder (player declares intent, completes one qualifying quest with a reflection note, and claims).

Rules:
- Only quest completions *after* the Trial was started count as evidence.
- Each quest completion can provide evidence to at most one Trial.
- Claiming a completed Trial is a separate explicit action.
- The completed Trial is a prerequisite for claiming the Crest; 160 attribute XP is also required.

---

## Ember

Ember reflects the player's effort on the current local day.

| Completions today | Ember state |
|-------------------|-------------|
| 0 | Resting |
| 1 | Kindled |
| 2 | Steady |
| 3 or more | Bright |

**Ember Relights:** If the player's first completion occurs after a missed local day (a gap in the streak), the Ember Relights visual plays. This does not award bonus XP. It is purely a welcoming visual event.

Ember state is derived server-side from the `quest_completions` table using the player's stored IANA timezone. It is never stored independently.

---

## Root

The Root is a tree with four branches — one per attribute. Each branch:

1. Sprouts when the attribute receives its first XP.
2. Grows as attribute XP accumulates.
3. Forks when the player chooses a specialization (at ≥ 80 XP).
4. Terminates in a Crest when the player claims it (at ≥ 160 XP + Trial complete).

Root geometry is **hand-authored fixed SVG**. The Root reveals state; it does not generate layout. Paths are designed, not computed.

---

## XP and Levels

### Quest XP

| Effort | XP awarded |
|--------|-----------|
| Quick | 10 |
| Standard | 20 |
| Deep | 35 |

### Daily reward ceiling

The server caps rewarded quest XP at **140 XP per local day**. Completions after the cap are still recorded in history but award zero XP and zero Sparks.

### Character level formula

XP required to advance from level L to level L+1:

```
threshold(L) = 100 + 50 × (L − 1)
```

Cumulative XP to reach level L (from level 1):

```
cumulative(L) = 25 × (L − 1) × (L + 2)
```

Character level is **derived** from `profiles.total_xp` at read time. It is never stored as an independent value.

### Sparks

```
Sparks awarded = awarded_xp / 5
```

Sparks are a cosmetic currency. They cannot purchase power, XP, or progression. They are awarded alongside XP by the same atomic transaction.

---

## Streaks

Streak logic runs server-side using the player's stored IANA timezone.

Rules:
- Completing a quest on the **same local date** as the last activity does **not** increment the streak.
- Completing a quest on the **following local date** increments `current_streak` by 1.
- Completing a quest after a **gap of 2+ local days** resets `current_streak` to 1.
- `longest_streak` is updated if `current_streak` exceeds it. It is **never decreased**.
- Missing a day **never removes** XP, Root progression, items, Crests, or permanent progression of any kind.

---

## Main Surfaces

### Hearth

The daily activity surface. Shows:
- The Ember with its current state
- Today's quests (journal rows, not floating cards)
- A compact Root preview showing the next milestone
- A status strip: current level, Spark balance, current streak

Primary actions: create quest, complete quest, open Root, open next milestone.

### Root

The permanent progression surface. Shows:
- All four attribute branches and their current state
- Specialization fork options (when eligible)
- Trial progress
- Crests (when claimed)

Mobile: one branch shown at a time via labeled attribute tabs. No drag/zoom required. An accessible linear Root List is available as an equivalent.

### Satchel

The cosmetic shop and inventory. Shows:
- Exactly three items at launch:
  - Copper Halo — 20 Sparks
  - Firefly Orbit — 40 Sparks
  - Engraved Basin — 60 Sparks
- Preview (no persistence until purchased)
- Purchase action
- Equip action
- One equipment slot: Hearth adornment

Insufficient Sparks, already-owned, and network failure all have explicit error states.

### Chronicle

The history surface. Shows:
- Completion history (paginated if necessary)
- Current streak
- Longest streak
- Three derived achievements:
  - **First Light** — complete your first quest
  - **A Chosen Path** — choose your first specialization
  - **Returned** — complete a quest after a missed day

Achievement state is derived from history, not stored independently.

---

## Required Quality Bar

Before submission, the following must all be true on the deployed production URL:

- Real authentication with user isolation (no user can read or mutate another user's data)
- Real database-backed persistence (refresh must retain state)
- Quest CRUD (create, read, edit, soft-delete)
- Quest completion with atomic reward
- Non-linear character levels
- Attribute progression
- Streak logic
- Reward/economy (Sparks, purchase, equip)
- Responsive mobile-first UI (usable at 320–390px)
- Full keyboard navigation (no mouse required for core flows)
- Screen-reader structure (semantic HTML, ARIA, live region for reward announcement)
- Reduced-motion support (no essential information locked behind animation)
- Graceful network and error states (no blank screens, no silent failures)
- Public deployment on Vercel

---

## Acceptance Criteria

### Quest completion

- Server returns a confirmed event before any permanent visual change.
- XP is awarded exactly once per valid occurrence (idempotent).
- Daily cap is enforced server-side.
- Duplicate completion of the same occurrence is silently idempotent (same result, no extra reward).
- Completion after the cap still records history but awards 0 XP.

### Progression

- Level is correctly derived from cumulative XP.
- Attribute XP correctly accumulates to the correct attribute.
- Specialization becomes available at exactly ≥ 80 attribute XP.
- Specialization choice is stored permanently and cannot be changed in this release.
- Crest is claimable only at ≥ 160 attribute XP AND a completed Trial.

### Persistence

- Hard refresh on Hearth retains quest list, Ember state, level, Sparks.
- Hard refresh on Root retains branch state, specialization, Trial progress.
- Second device or browser tab sees the same state.

### Economy

- Sparks balance is server-authoritative.
- Purchasing an item deducts the correct Sparks balance atomically.
- Insufficient balance produces an error, not a deduction.
- Already-owned items cannot be purchased again.
- Equip updates the Hearth adornment.

### Accessibility

- All interactive elements reachable and operable by keyboard.
- Focus order is logical.
- Focus is restored after dialog closes.
- All images and decorative SVG have appropriate `aria-hidden` or `alt`.
- Quest completion reward is announced to screen readers via a live region.
- Reduced-motion equivalent is present for every animation.

---

## Explicit Non-Goals

The following will NOT be built in this release. Any agent that proposes implementing them is out of scope.

- AI chatbot or LLM integration of any kind
- 3D world, WebGL, or Three.js scene
- Multiplayer or co-op
- Leaderboard or competitive ranking
- Social feed, following, or sharing
- Procedural narrative or dynamic story generation
- Arbitrary push notifications or calendar integration
- Custom avatars or appearance customization beyond three cosmetics
- Multiple currencies
- Loot boxes or random drops
- Infinite or dynamic skill tree generation
- Advanced analytics, charts, or stat dashboards
- Real-time sync (WebSocket or subscription-based)
- Focus timer or Pomodoro integration
- In-app file or image uploads
- Multiple themes beyond the single frozen palette
- Undo for completed quests (completion is permanent in history)
- Social login (Google, GitHub, etc.) — email/password only

---

## Success Statement

> One real server-confirmed action must produce one beautiful, understandable, permanent consequence on the deployed URL.

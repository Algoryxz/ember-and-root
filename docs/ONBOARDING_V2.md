# Ember & Root — Onboarding V2

## Product intent

Onboarding must teach the product by letting the user experience it, not by presenting a settings form.

The user should understand this loop before entering Hearth:

**Choose what matters → receive useful starter quests → seal one real quest → Ember responds → Root wakes → enter Hearth.**

Onboarding is choice-first, low-typing, deterministic by default, and accessible without gestures.

## Non-negotiable invariants

- Server remains authoritative for XP, Sparks, levels, streaks, quest occurrence completion, Root progression, Trials, and Crests.
- Canonical attributes remain `mind | body | will | craft`.
- No AI is required for onboarding to work.
- Swipe/drag interactions always have visible tap/button alternatives.
- 44×44 minimum interactive targets.
- Keyboard navigation, visible focus, reduced motion, and screen-reader labels are mandatory.
- Existing quest CRUD and `complete_quest` RPCs are reused; no client-simulated rewards.
- Onboarding responses live in profile `preferences` unless a later schema decision explicitly promotes them.

## Experience sequence

### Step 0 — Arrival

After signup, `/onboard` opens with a short transition from the public landing experience.

Copy direction:

> **What do you want to become more consistent with?**
> Pick what matters now. Your first quests will grow from these choices.

Do not ask for timezone first. Detect it silently and confirm near the end.

### Step 1 — Choose 2–4 focus goals

Use an animated stacked-card/choice-deck interaction inspired by the **Animated Cards Stack** pattern from YoucefBnm Bnm on 21st.dev, re-authored for Ember & Root.

Initial goal catalog:

| Goal | Primary attribute | Example starter intent |
|---|---|---|
| Study consistently | mind | focused study, notes, practice |
| Improve focus | mind | distraction-free work, reflection |
| Read more | mind | reading blocks, notes |
| Get stronger | body | strength/movement sessions |
| Move more | body | walking/mobility |
| Sleep better | body | wind-down routine |
| Build discipline | will | consistency and follow-through |
| Reduce screen time | will | intentional device boundaries |
| Build confidence | will | small deliberate challenges |
| Learn a skill | craft | deliberate practice |
| Be more creative | craft | making/drawing/writing sessions |
| Build a personal project | craft | concrete build sessions |
| Organize my life | will | planning/reset routines |

A goal may later recommend quests from a secondary attribute, but the first deterministic version uses the primary mapping above.

### Step 2 — Choose intensity

Three large choices:

- **Keep it light** — small quests, easier consistency
- **Balanced** — meaningful daily effort
- **Push me** — fewer but deeper quests

Mapping guidance:

- Keep it light → mostly `quick`
- Balanced → mostly `standard`
- Push me → mix of `standard` and `deep`

This recommendation layer does not change server XP values.

### Step 3 — Choose available time and preferred rhythm

Time:

- 5–15 min
- 15–30 min
- 30–60 min
- 60+ min

Preferred rhythm:

- Morning
- Afternoon
- Evening
- Flexible

These values personalize starter suggestions only. They do not alter progression rules.

### Step 4 — Starter quest deck

Generate 3–5 deterministic quest suggestions from an authored catalog.

Each suggested quest supports:

- **Keep**
- **Swap**
- **Edit**

Do not require free-form typing. Editing is optional.

Recommended user target: keep 2–4 starter quests.

Starter quest template shape:

```ts
export type StarterQuestTemplate = {
  id: string;
  goalId: string;
  title: string;
  attribute: AttributeId;
  effort: Effort;
  cadence: Cadence;
  estimatedMinutes: number;
  intensity: 'light' | 'balanced' | 'push';
  description: string;
};
```

Example authored templates:

- `study_focus_25` — “Do one focused study block” — mind — standard — daily — 25 min
- `study_review_notes` — “Review yesterday’s notes” — mind — quick — daily — 10 min
- `study_practice_3` — “Solve 3 practice problems” — mind — standard — daily — 20 min
- `body_walk_15` — “Take a 15-minute walk” — body — quick — daily
- `body_strength_20` — “Do a 20-minute strength session” — body — standard — daily
- `will_screen_boundary` — “Keep one planned screen-free block” — will — standard — daily
- `will_plan_tomorrow` — “Write tomorrow’s three priorities” — will — quick — daily
- `craft_make_20` — “Make something for 20 focused minutes” — craft — standard — daily
- `craft_project_step` — “Finish one concrete project step” — craft — standard — daily

### Step 5 — Timezone confirmation

Detect browser timezone with `Intl.DateTimeFormat().resolvedOptions().timeZone`.

Show a compact confirmation rather than a technical form:

> **Your day resets in Asia/Kolkata**
> Daily quests, streaks, and Ember use your local midnight.
>
> [Looks right]  [Change]

“Change” reveals the existing IANA timezone input/datalist.

### Step 6 — First quest reveal

Present one selected starter quest as the first journal entry.

Copy direction:

> **Begin with one small act.**
> Complete this when you have actually done it. Then seal it.

The user can choose which kept starter quest becomes the first seal target.

### Step 7 — First seal

The first seal is the onboarding climax.

On action:

1. UI enters pending state immediately.
2. Server creates the selected starter quests through canonical `create_quest` RPCs.
3. Server completes the selected first quest through canonical `complete_quest` using its authoritative occurrence key.
4. Server persists onboarding preferences and marks `preferences.onboarded = true` only after successful authoritative setup.
5. Client receives authoritative `MutationResult`.
6. UI performs a short causal animation:
   - seal mark lands
   - Ember kindles
   - one warm trace travels
   - first Root filament/sprout wakes
7. Copy appears:

> **That’s the loop.**
> What you do becomes what grows.

8. Continue to `/hearth`.

Do not fabricate XP or Sparks in the client animation; display values returned by the server.

## Persistence shape

Store onboarding choices inside profile `preferences` initially:

```ts
{
  onboarded: true,
  sound: boolean,
  reducedMotion: boolean,
  onboarding: {
    version: 2,
    goals: string[],
    intensity: 'light' | 'balanced' | 'push',
    availableMinutes: '5-15' | '15-30' | '30-60' | '60+',
    preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible',
    starterTemplateIds: string[]
  }
}
```

Do not overwrite existing preference keys when updating this object.

## Idempotency and retry behavior

Onboarding may involve several authoritative mutations. The implementation must preserve request IDs across inline retries.

Recommended client session state:

```ts
{
  onboardingRequestId: string;
  questRequestIds: Record<starterTemplateId, string>;
  firstSealRequestId: string;
}
```

Generate once per onboarding attempt with `crypto.randomUUID()` and preserve across retries.

If a network failure occurs after a server mutation succeeds, a retry with the same request ID must replay rather than duplicate rewards.

Do not mark onboarding complete before the first authoritative seal succeeds.

## Visual interaction system

### Card deck

Use the motion concept of **Animated Cards Stack** by YoucefBnm Bnm as inspiration/adaptation, but restyle completely for the illuminated field-journal system.

- No testimonial styling.
- No glassmorphism.
- Cards resemble tactile journal leaves / field notes.
- Directional motion communicates keep/swap.
- Tap buttons remain primary accessible controls.

### Growing onboarding Root

Keep a small authored SVG seed/root in the background or side rail.

As the user makes choices:

- first goal → first root filament appears
- second goal → another fine branch appears
- intensity/time choices → subtle texture/illumination changes
- starter deck confirmed → seed becomes a visible sprout
- first seal → sprout wakes with authoritative Ember response

This is visual foreshadowing only; it must not imply game XP before the first real completion.

### Motion budget

- ordinary choice transition: 160–260ms
- card swap/keep: 220–360ms
- step transition: 220–400ms
- first seal response: approximately 700–1200ms total after server confirmation
- reduced motion: immediate state change + short opacity transition only

## Starter quest recommendation rules

Version 1 is deterministic:

1. Filter templates by selected goals.
2. Prefer templates matching intensity.
3. Prefer estimated duration within the user’s selected time range.
4. Ensure at least two distinct selected goals are represented when possible.
5. Avoid recommending more than two quests for the same attribute unless the user selected only goals mapped to that attribute.
6. Return 3–5 candidates; user keeps 2–4.

No LLM call is required.

## Optional future AI layer

A future “Shape my quests” input may transform starter suggestions using user context such as:

- “I have exams next month.”
- “I only have 20 minutes today.”
- “I want to learn Java.”

AI output remains suggestions. Canonical quest creation and all progression remain server-authoritative.

## Accessibility

- Every swipe action has visible Keep / Swap controls.
- Deck cards are reachable by keyboard.
- Selection state uses `aria-pressed` or equivalent semantic state.
- Progress is announced as “Step X of Y”.
- First seal reward message uses `aria-live`.
- Focus order follows visual order.
- No hidden gesture-only controls.
- Reduced-motion path is fully usable.

## Responsive composition

### Desktop

Use an asymmetric split:

- left/center: current question / deck
- right/edge: growing onboarding Root + step progress

### Mobile 320–390px

One decision per screen.

- card/deck first
- controls immediately reachable
- compact progress indication
- decorative Root moves behind or below the choice so it never blocks content

## Verification

Required before merge:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npx playwright test
node scripts/test-live-db.mjs
```

Add onboarding E2E coverage for:

- signup → onboarding
- select goals
- choose intensity/time/rhythm
- keep/swap starter quests
- timezone confirmation/change
- keyboard-only completion
- reduced motion
- 320×700 / 390×844 / 768×1024 / 1440×900
- first authoritative seal
- reward announcement from returned mutation
- redirect to Hearth
- refresh persistence
- login after completion bypasses onboarding
- inline retry does not duplicate quests or rewards

---
name: ember-ui
description: Implements or reviews Ember & Root frontend surfaces, responsive layouts, SVG Root presentation, accessibility, purposeful motion, and browser visual inspection using Playwright MCP while enforcing the illuminated field-journal visual language.
---

# Ember UI Skill

## Purpose
Use this skill when implementing or reviewing any Ember & Root frontend surface: Hearth, Root, Satchel, Chronicle, dialogs, navigation, the Ember component, quest journal rows, or visual states. Also use it when adding responsive behavior, motion, accessibility, or conducting browser-based visual reviews via Playwright MCP.

---

## Authority & Skill Precedence
In this repository, guidance resolves in this strict order:
1. `AGENTS.md`
2. **Official product documents**:
   - `docs/PRD.md`
   - `docs/TRD.md`
   - `docs/UI_UX_BRIEF.md`
   - `docs/APP_FLOW.md`
   - `docs/BACKEND_SCHEMA.md`
   - `docs/CONTRACTS.md`
3. **Project-specific skills**:
   - `ember-ui`
   - `reward-integrity`
   - `integration-guardian`
   - `ship-check`
4. **Reusable external skills**:
   - `frontend-design`
   - `animate`
   - `theme-factory`

**If a reusable external skill conflicts with Ember & Root's design specification, EMBER & ROOT RULES WIN.**

### `ember-ui` + `frontend-design` Relationship
- `frontend-design` answers: *"How do I avoid mediocre frontend design?"*
- `ember-ui` answers: *"What must EMBER & ROOT specifically look and behave like?"*
`frontend-design` should never invent a different product identity. The product identity is frozen: **"Illuminated field journal"**.

### Motion Relationship (`ember-ui` + `animate`)
- `animate` provides general motion quality, curves, and GPU performance techniques.
- `ember-ui` defines authoritative product choreography and motion budgets.

---

## Frozen Visual Invariants
These cannot be changed without Deeptiman's explicit sign-off:

| Invariant | Value | Usage |
|-----------|-------|-------|
| Background | `#141713` | Deep charcoal canvas ground |
| Raised surface | `#1D231D` | Journal sheet, card, drawer surface |
| Primary text | `#F0E7D3` | Aged warm parchment |
| Secondary text | `#B9BEAC` | Dried sage / muted labels |
| Ember | `#E98A4B` | Living flame copper orange |
| Ember bright core | `#FFD38A` | Incandescent hearth center |
| Root sage | `#9FBA87` | Living sprout sage green |
| Mature Root | `#D9E3B2` | Hardened root / amber stem |
| Error | `#F0A79D` | Ash red error state |
| Focus ring | pale-gold, 2px, 2px offset | Visible keyboard focus |
| Headings | `Fraunces` | Display & headers |
| UI / Body | `DM Sans` | Body, buttons, data |

No other color values as design tokens. No other typefaces.

---

## Canonical Quest Motion Choreography
Routine completion must remain fast. Do not turn every routine action into a cinematic.

1. **User activates "Complete quest"**
2. **Control enters pending state** (instant button disable, subtle in-flight state)
3. **Server confirms authoritative mutation** (`MutationResult` received)
4. **Ember reacts** (hearth scale pulse 200–400ms)
5. **Light travels toward relevant Root branch** (400–700ms single ray; skipped in reduced-motion)
6. **Branch progress advances** (authored path reveal stroke-dashoffset)
7. **If threshold crossed**: *"A path is ready"* notice appears
8. **User intentionally opens specialization choice** (user-driven modal, not automated ambush)
9. **Selected Root fork reveals** (600–900ms path illumination)
10. **Trial becomes available**

---

## Root Visual Rules
These rules apply specifically to the Root surface (owned by Akriti):
- All SVG paths are authored and fixed. **Do not compute, randomize, or morph path geometry.**
- Decorative SVG: `aria-hidden="true"`.
- Interactive nodes (fork choice, crest claim): `<button>` elements absolutely positioned over known SVG coordinates.
- Desktop: fixed SVG viewBox, all four branches visible, no zoom/pan.
- Mobile: four labeled attribute tab buttons, one branch readable at a time, no drag/pinch/zoom required.
- Root List: accessible linear view equivalent must be present for each branch.
- State reveals use `stroke-dashoffset` drawing or opacity on authored overlays. **No SVG morph engine, Three.js, Rive, Lottie, or GSAP.**

---

## Quest Journal Rules
- Quests are rows in a journal, not floating cards.
- Each row shows: title, attribute indicator, effort badge, completion control.
- The completion control is an explicit "Complete quest" button (not a small checkbox).
- Minimum 44×44px touch target.
- Pending state: button disabled, row visually indicates in-flight.
- Completed state: row transitions in-place (no removal during the session; refresh reflects DB state).
- Error state: inline message on the row with a retry affordance.

---

## Ember Component Rules
- Has four distinct visual states: resting, kindled, steady, bright.
- Each state has a reduced-motion equivalent (immediate visual change, no oscillation).
- Ember animation must pause when `document.visibilityState === 'hidden'`.
- Ember Relights animation plays before the standard completion response when `event.emberRelit === true`.

---

## Motion Budget

| Moment | Duration | Reduced-motion |
|--------|----------|----------------|
| Press/seal response | 80–120ms | Immediate |
| Pending row state | Duration of server call | Loading indicator only |
| Ember warmth/scale response | 200–400ms | Immediate state change |
| XP light travel | 400–700ms | Skip entirely |
| Root preview illumination | 300–500ms | Immediate highlight |
| Specialization fork reveal | 600–900ms | Immediate state change, short fade |
| Crest terminal ornament | 400ms + 8 motes (300–500ms each) | Immediate, no motes |

Never queue multiple completion sequences simultaneously. No animation callback writes to the database.

---

## Playwright MCP Design Review Workflow
Whenever Playwright MCP is active, follow this visual verification loop:

```
IMPLEMENT
   ↓
OPEN REAL PAGE
   ↓
SCREENSHOT
   ↓
REVIEW
   ↓
FIX
   ↓
SCREENSHOT AGAIN
```

### Required Visual Review Viewports
Test across all 4 mandatory viewport dimensions:
1. **Desktop**: `1440 × 900`
2. **Tablet**: `768 × 1024`
3. **Phone**: `390 × 844`
4. **Small phone**: `320 × 700`

Also verify:
- **200% zoom**: layout must not break, clip essential text, or hide controls.
- **Keyboard-only navigation**: all actions reachable via Tab/Enter/Space; visible pale-gold focus rings.
- **`prefers-reduced-motion`**: transitions fall back to immediate state changes.

### Playwright Visual Review Prompt
Use this exact review mindset when analyzing browser screenshots:

> "Open the current implementation in a real browser.
> 
> Inspect at:
> 1440px
> 768px
> 390px
> 320px
> 
> For every viewport evaluate:
> - hierarchy
> - spacing
> - typography
> - alignment
> - clipping
> - overflow
> - navigation
> - touch targets
> - focus states
> - readability
> - Root legibility
> - Ember prominence
> - journal aesthetic
> - generic SaaS patterns
> - responsive transitions
> 
> Do not praise the page.
> List visible defects first.
> Then fix the highest-impact visual defects.
> Re-render and inspect again.
> Do not alter product behavior simply to make the screenshot prettier."

---

## Anti-Patterns — Hard Stops
- A `<div>` or `<span>` with an `onClick` handler (use semantic `<button>`)
- A color value not in the frozen palette
- A font family other than Fraunces or DM Sans
- Glassmorphism, drop-shadow card grids, blue/purple gradients
- An enterprise sidebar navigation
- An animation without a reduced-motion equivalent
- A hover-only interaction (inaccessible on touch)
- A drag or pinch-only Root interaction
- Toast spam for routine success
- Decorative text baked into a raster image

---
name: ember-ui
description: Implements or reviews Ember & Root frontend surfaces, responsive layouts, SVG Root presentation, accessibility, and purposeful motion while enforcing the illuminated field-journal visual language.
---

# Ember UI Skill

## Purpose

Use this skill when implementing or reviewing any Ember & Root frontend surface: Hearth, Root, Satchel, Chronicle, dialogs, navigation, the Ember component, quest journal rows, or visual states. Also use it when adding responsive behavior, motion, or accessibility.

---

## Required Reading

Before editing any frontend file, read:

1. `docs/UI_UX_BRIEF.md` — frozen palette, typography, spacing, motion rules, anti-patterns
2. `docs/APP_FLOW.md` — the exact trigger, server action, success, and failure for the flow you are implementing
3. The relevant section of `docs/PRD.md` for the feature you are building

Do not guess at visual direction. If the brief is silent on a case, ask Deeptiman before implementing.

---

## Frozen Visual Invariants

These cannot be changed without Deeptiman's explicit sign-off:

| Invariant | Value |
|-----------|-------|
| Background | `#141713` |
| Raised surface | `#1D231D` |
| Primary text | `#F0E7D3` |
| Secondary text | `#B9BEAC` |
| Ember | `#E98A4B` |
| Ember bright core | `#FFD38A` |
| Root sage | `#9FBA87` |
| Mature Root | `#D9E3B2` |
| Error | `#F0A79D` |
| Focus ring | pale-gold, 2px, 2px offset |
| Headings | Fraunces |
| UI/body | DM Sans |

No other color values as design tokens. No other typefaces.

---

## Implementation Workflow

Follow these steps in order. Do not skip ahead to animation before state is correct.

1. **Identify the confirmed server state** that this UI surface consumes. Find the `GameSnapshot` fields or `MutationResult` event fields that drive this component's rendering.

2. **Reuse existing tokens and primitives.** Do not create a parallel visual system. Import CSS custom properties from `components/tokens.css`.

3. **Implement semantic HTML first.**
   - Use `<button>` for actions, not `<div>` with `onClick`.
   - Use `<input>` with persistent visible labels.
   - Use landmark regions: `<main>`, `<nav>`, `<section>`, `<aside>`.
   - Use list markup for quest lists.

4. **Make the static mobile layout work at ~375px** before adding any animation. Verify no horizontal overflow, no hidden rows, no overlap.

5. **Add desktop composition.** Test at 1280px and 1440px. Verify the ~40%/~60% Hearth split, no enterprise sidebar.

6. **Add motion effects** only after the state transition logic is correct:
   - Use CSS transitions for micro-animations (press states, row transitions).
   - Use Motion for React for multi-step sequences (reward choreography).
   - Use SVG stroke-dashoffset or opacity for Root path reveal.
   - Consult `docs/UI_UX_BRIEF.md` § "Motion Choreography" for exact timings.

7. **Implement `prefers-reduced-motion` equivalent** for every animation added.
   ```css
   @media (prefers-reduced-motion: reduce) {
     /* swap travel/draw effects for immediate state change */
   }
   ```

8. **Verify accessibility:**
   - Tab through every interactive element in the component.
   - Verify focus ring visible at each stop.
   - Verify focus restores to trigger after dialog closes.
   - Verify decorative SVG has `aria-hidden="true"`.
   - Verify interactive SVG nodes are `<button>` elements.
   - Verify `aria-live="polite"` region announces reward after quest completion.
   - Verify 200% zoom: no content clipped.
   - Verify 44×44px minimum touch target for all interactive elements.

9. **Do not add dependencies.** New packages require Susmita's approval.

---

## Root Visual Rules

These rules apply specifically to the Root surface (owned by Akriti):

- All SVG paths are authored and fixed. **Do not compute, randomize, or morph path geometry.**
- Decorative SVG: `aria-hidden="true"`.
- Interactive nodes (fork choice, crest claim): `<button>` elements absolutely positioned over known SVG coordinates.
- Desktop: fixed SVG viewBox, all four branches visible, no zoom/pan.
- Mobile: four labeled attribute tab buttons, one branch readable at a time, no drag/pinch/zoom required.
- Root List: accessible linear view equivalent must be present for each branch.
- State reveals use `stroke-dashoffset` drawing or opacity on authored overlays. **No SVG morph engine.**

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

Never queue multiple completion sequences simultaneously.

---

## Anti-Patterns — Hard Stops

If you find yourself writing any of the following, stop and reconsider:

- A `<div>` or `<span>` with an `onClick` handler (use `<button>`)
- A color value not in the frozen palette
- A font family other than Fraunces or DM Sans
- Glassmorphism, drop-shadow card grids, blue/purple gradients
- An enterprise sidebar navigation
- An animation without a reduced-motion equivalent
- A hover-only interaction (inaccessible on touch)
- A drag or pinch-only Root interaction
- Toast spam for routine success
- A loading spinner in the center of the page for an inline action
- Decorative text baked into a raster image

---

## Acceptance Output

When you complete a frontend task using this skill, report:

1. **Files changed** (with brief description of each change)
2. **Desktop check** (describe composition at ~1280px; screenshot if possible)
3. **Mobile check** (describe layout at ~375px; screenshot if possible)
4. **Keyboard/focus check** (tab order, focus visibility, dialog focus return)
5. **Reduced-motion behavior** (what changes when `prefers-reduced-motion: reduce`)
6. **Any deviation from the frozen design rules** (and who approved it)

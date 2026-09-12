# Ember & Root — UI/UX Design Brief

## Creative Direction

**Illuminated field journal.**

The product should feel like an interactive fantasy artifact — a personal tome whose pages you are writing — not a SaaS dashboard wearing fantasy colors. The aesthetic must come from materials, texture, naming, and purposeful restraint, not from glowing gradients and card grids.

---

## Design Principles

1. **One visual metaphor.** Ember for now; Root for permanence. Do not introduce competing metaphors.
2. **Journal, not cards.** Quest entries are rows in a bound journal, not floating dashboard tiles.
3. **Milestones earn spectacle.** Routine completion is quick. Specialization and crest moments may be celebratory.
4. **Hand-authored geometry.** Root paths are designed by Akriti, not computed by an algorithm.
5. **Readable fantasy.** The theme lives in materials, naming, motion, and illustration. Instructions are plain prose.
6. **Accessible by construction.** Real HTML controls, visible focus, semantic dialogs, and reduced motion from the first implementation — not added at the end.

---

## Frozen Palette

These values must not be changed without Deeptiman's sign-off. No other color values may be introduced as design tokens.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#141713` | Page and layout backgrounds |
| `--color-surface` | `#1D231D` | Raised surfaces (journal area, panels) |
| `--color-text-primary` | `#F0E7D3` | Primary text, parchment tone |
| `--color-text-secondary` | `#B9BEAC` | Secondary text, metadata |
| `--color-ember` | `#E98A4B` | Ember copper; active quest indicators |
| `--color-ember-core` | `#FFD38A` | Ember bright inner glow |
| `--color-root` | `#9FBA87` | Root sage; branch illumination |
| `--color-root-mature` | `#D9E3B2` | Mature Root; crest highlight |
| `--color-error` | `#F0A79D` | Error states |
| `--color-focus` | `(pale gold)` | 2px offset focus ring, `#C4A96A` or similar |

Focus rings must be visible against all background colors used in the app. The 2px pale-gold outline with a 2px offset is the required implementation.

---

## Typography

| Role | Font | Size | Notes |
|------|------|------|-------|
| Display / headings | Fraunces | 24–40px | Variable weight italic for impact |
| UI / body | DM Sans | 16px base | Regular for body, medium for labels |
| Metadata / secondary | DM Sans | 14px | Secondary text color |
| Quest titles | DM Sans | 16px | Normal weight |

Load both fonts from Google Fonts. Do not use system fallbacks as primary fonts.

**Anti-patterns:** Never use bold Fraunces for body copy. Never use DM Sans italic for headings. Never use any other font family.

---

## Spacing System

Use these values only. Do not introduce intermediate values.

```
4px   — hairline gaps, icon padding
8px   — tight internal spacing
12px  — compact element spacing
16px  — standard component padding
24px  — section gaps, panel padding
32px  — large section separation
48px  — major layout gaps
```

---

## Border Radius

- **Standard components** (journal rows, panels, inputs): `6–10px`
- **Buttons**: `6–8px`
- **Circles**: Reserved for Root nodes and Ember motif elements only
- **Dialogs**: `10–12px` radius on the container

Never apply circular radius to rectangular content containers.

---

## Focus States

All interactive elements must show a visible focus ring that meets WCAG 2.1 AA contrast against the background. Implementation:

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: inherit;
}
```

`:focus` (mouse/touch) may use `:focus-visible` — do not suppress focus rings with `outline: none` without an alternative.

Dialogs must trap focus. Focus must return to the trigger element when a dialog closes.

---

## Desktop Hearth Composition

```
┌─────────────────────────────────────────────────────┐
│ Navigation: [Hearth] [Root] [Satchel] [Chronicle]   │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   Quest journal      │   Ember + Root scene         │
│   (~40% width)       │   (~60% width)               │
│                      │                              │
│   [Status strip:]    │   [Ember visual]             │
│   Level · Sparks · 🔥│   [Root preview]             │
│                      │   [Next milestone]           │
│   [Quest row]        │                              │
│   [Quest row]        │                              │
│   [+ New quest]      │                              │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

No enterprise sidebar. No nested left-rail navigation.

---

## Mobile Hearth Composition

```
┌──────────────────────┐
│ Status strip         │  (level, sparks, streak)
├──────────────────────┤
│ Ember scene          │  (compact, meaningful)
├──────────────────────┤
│ Quest journal rows   │  (full width, scrollable)
│                      │
│ [Quest row]          │
│ [Quest row]          │
│ [+ New quest]        │
├──────────────────────┤
│ ● Hearth Root Satchel Chronicle │
└──────────────────────┘
```

- Safe-area padding at the bottom for notched/home-button devices.
- No hidden or off-screen final quest row.
- Labeled bottom navigation tabs (text + icon).

---

## Controls

### Primary action button
- Warm solid fill using `--color-ember`.
- Pressed state: subtle scale-down (0.97) + brightness reduction, 80ms ease.
- Do not use the browser default `:active` appearance.

### Secondary / ghost button
- Border only, text `--color-text-primary`.
- Same pressed micro-animation.

### Quest completion control
- Explicit "Complete quest" button (not an ambiguous small checkbox).
- Must be large enough to tap with a thumb: minimum 44×44px touch target.
- Pressed state: enters pending state immediately (disabled, visual change).

### Inputs
- Persistent visible label above the field (not placeholder-only).
- Clear visible border against the surface background.
- Error state: border color `--color-error`, error message below the field (never color-only).

### Dialogs
- One accessible Radix Dialog primitive per use case.
- On mobile, dialogs may visually present as bottom sheets (translate from bottom).
- Focus trapped inside open dialog.
- Close button always visible and keyboard accessible.
- Overlay click closes only non-destructive dialogs.

### Specialization choices
- Two large, readable options, each showing the choice name and a brief consequence description.
- Not radio buttons styled as boxes; design them explicitly.
- Confirm step after selection: "This choice is permanent for this release."

### Errors
- Inline, immediately below the relevant element.
- Actionable: tell the user what to do, not just what went wrong.
- Never color-only (always paired with text or icon).
- No toast spam for routine success; routine success stays in-place.

---

## Ember Visual

Ember is the most expressive element on the Hearth. It has four states:

| State | Behavior |
|-------|---------|
| Resting | Dim; barely alive; very slow, gentle pulse if any |
| Kindled | Warm glow; first presence of copper |
| Steady | Brighter; copper core visible; moderate animation |
| Bright | Full brightness; golden core prominent; lively but not overwhelming |

**Ember Relights:** A welcoming "return" animation when the first completion occurs after a missed day. Plays before the standard completion response. Should feel like warmth returning, not punishment ending.

**Performance rule:** Ember animation must pause when `document.visibilityState === 'hidden'`.

---

## Root Visual Rules

Each attribute branch has these authored states:
1. **Unstarted** — no branch visible (trunk connection only)
2. **Sprouted** — first segment visible (≥ 1 XP)
3. **Growing** — proportional to attribute XP
4. **Fork available** — specialization choice prompt appears at the fork node
5. **Forked** — chosen path illuminated; alternate path remains faint
6. **Trial in progress** — path extends to Trial node
7. **Crest claimed** — terminal ornament visible

**SVG rules:**
- All paths are authored and fixed. Do not compute or randomize path geometry.
- Decorative SVG elements carry `aria-hidden="true"`.
- Interactive nodes (fork choice, crest claim) are HTML `<button>` elements positioned absolutely over known SVG coordinates.
- Do not use `transform: scale` for reveal — use stroke-dashoffset drawing or opacity on authored overlays.

**Desktop overview:** Fixed SVG viewBox showing all four branches. The scene is fixed; no zoom, no pan.

**Mobile:** Show one branch at a time using labeled attribute tab buttons. Each branch should be legible on a 375px-wide screen without pinch, drag, or zoom.

**Root List:** An accessible linear list view must be available as an alternative to the visual SVG, showing: attribute name, XP, specialization (if chosen), Trial progress, and crest status as readable text rows.

---

## Motion Choreography

### Routine quest completion

| Step | Timing | Reduced-motion equivalent |
|------|--------|--------------------------|
| 1. Press / seal response | 80–120ms | Immediate visual change |
| 2. Pending row state | While in-flight | Loading indicator, no animation |
| 3. Ember warmth/scale | 200–400ms | Immediate state update |
| 4. XP light travel | 400–700ms | Skip entirely |
| 5. Root preview illumination | 300–500ms | Immediate highlight change |

Total visible duration: < 1.5 seconds for routine completion.

### Specialization reveal

When the player chooses a specialization:
1. Chosen fork path thickens / unfurls (CSS path drawing or opacity, 600–900ms).
2. Alternate path fades to inactive state.
3. Trial panel slides/fades in inline below the branch.

Reduced motion: immediate state change, short opacity fade.

### Crest claim

1. Terminal ornament appears on the branch end (opacity + small scale, 400ms).
2. At most 8 short-lived motes emanate from the crest position (Motion for React, each 300–500ms).
3. Motes fade out; crest remains.

Reduced motion: crest appears immediately, no motes.

### "A path is ready" notice

A non-blocking notice on Hearth using an in-page banner (not a dialog, not a toast). Persistent until dismissed or the player navigates to Root.

---

## Completion Choreography in Detail

This is the exact authored sequence. Do not deviate.

```
1. User presses "Complete quest" control.
2. Row enters press/seal state (80–120ms).
3. Row enters pending state (button disabled, spinner or pulse on row).
4. Server call in-flight.
5. Server responds (success):
   a. MutationResult received.
   b. Row transitions to completed appearance.
   c. Ember responds to new state (warmth/scale animation).
   d. One XP light traces toward Root preview.
   e. Root preview illumination advances by proportional amount.
   f. aria-live region announces: "[Quest title] complete. +[N] XP. [Attribute] branch grows."
6. If event.emberRelit: play Ember Relights before step 5c.
7. If event.specializationAvailable: after sequence, show "A path is ready" on Hearth.
8. If event.newLevel > event.previousLevel: brief "Level [N]" notice (in-place, not toast).
```

---

## Reduced Motion

When `prefers-reduced-motion: reduce` is set (or when the user has toggled reduced motion in Settings):

- No travel effects (XP travel, path drawing).
- No scale bursts or oscillation.
- No path-drawing animation.
- Ember state changes are immediate or use a short (≤ 150ms) opacity fade only.
- Root state changes are immediate.
- All information remains available in text.
- Achievement and crest moments: show a brief static state change with an accessible text announcement instead of animation.

Implementation: use the `@media (prefers-reduced-motion: reduce)` media query in CSS and query it from JavaScript/React where needed to conditionally mount animation components.

---

## Sound Policy

- Sound is **off by default**.
- At most two distinct sounds in this release:
  1. Quest confirmation (short, 0.3–0.5s, warm tone).
  2. Major milestone (specialization or crest moment, 0.5–1s).
- Sound never carries exclusive information. The app is fully functional with sound off.
- Sound is controlled by the preference in Settings.

---

## Loading States

| Context | Treatment |
|---------|-----------|
| Initial page load | Server component renders skeleton; hydration is fast |
| Quest creation/edit in-flight | Button enters loading state, dialog stays open |
| Quest completion in-flight | Row enters pending state (see Choreography) |
| Root initial load | SVG fades in from neutral state |
| Satchel load | Item skeletons, then content |
| Chronicle load | Row skeletons, then content |

Loading skeletons use `--color-surface` with subtle opacity animation. No spinners except on button-level actions.

---

## Empty States

| Context | Treatment |
|---------|-----------|
| No quests today | Journal shows one prominent "Create your first quest" call to action |
| Root with 0 XP in all attributes | Each branch shows "sprout begins here" placeholder text |
| Chronicle with no history | "Your story begins with the first quest." |
| Satchel with 0 Sparks | Balance shown as 0; Buy buttons show cost; an explanatory note about earning Sparks |

Empty states use `--color-text-secondary`. No mascots or decorative illustrations in this release.

---

## Error States

All error states must:
- Be visible inline, near the failing element.
- Use `--color-error` for text/border.
- Include a human-readable explanation and a recovery action (e.g., "Try again" button).
- Never be color-only.
- Never result in a blank screen or silent failure.

Global errors (network down, session expired): render an in-page banner explaining the issue and, where possible, preserve the last known state rather than unmounting the view.

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| All interactive elements keyboard operable | Native `<button>`, `<input>`, `<a>` elements; no `div` with click handler |
| Focus order logical | DOM order matches visual order; skip-to-main link on Hearth |
| Focus visible | `:focus-visible` pale-gold outline, 2px offset |
| Focus restored after dialog | Radix Dialog handles this; verify with keyboard testing |
| Images and decorative SVG | `aria-hidden="true"` on decorative SVG; meaningful images have descriptive `alt` |
| Reward announcement | `aria-live="polite"` region updated after every completion |
| Reduced motion | CSS `@media (prefers-reduced-motion)` + Settings toggle |
| Color contrast | Primary text on background: ≥ 7:1 (AAA). Interactive elements: ≥ 4.5:1 (AA). |
| Touch targets | Minimum 44×44px for all interactive elements |
| Screen reader structure | Semantic headings, landmark regions (`<main>`, `<nav>`, `<aside>`), list markup for quest lists |
| Error messages | Programmatically associated with inputs via `aria-describedby` |

---

## Anti-Patterns

Never introduce:
- Default shadcn component appearance (customize everything).
- Generic blue/purple AI gradients.
- Card grids everywhere (use journal rows).
- Random glassmorphism effects.
- Giant stats dashboard layouts.
- Arbitrary per-feature colors outside the frozen palette.
- Unbounded particle effects.
- Hover-only interactions (inaccessible on touch).
- Drag/pinch-only Root navigation.
- Decorative text baked into generated raster images (use SVG text or HTML).
- Toast spam for routine success.
- Spinning loaders in the center of the page.
- Confirmation dialogs for non-destructive actions.

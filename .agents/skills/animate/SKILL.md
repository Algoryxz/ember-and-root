---
name: animate
description: Animation patterns, motion quality principles, and performance standards for React and Next.js applications. Emphasizes GPU-accelerated transforms, exit/entrance timing, accessible reduced-motion, and purposeful UI motion.
---

# Animate Skill

> **EMBER & ROOT MOTION RELATIONSHIP:**
> - `animate` provides **general motion quality principles, physics, and implementation techniques**.
> - `ember-ui` defines **authoritative product choreography and motion budgets**.
>
> **Canonical Rule:**
> Routine quest completion must remain fast (press → pending → confirmed server response → one XP travel → Root illumination). Do not turn routine actions into cinematics or block user interaction with decoration.

---

## Motion Quality Principles

1. **Exits faster than entrances**:
   - Exit animations should be ~70–75% of entrance duration (e.g. enter 200–250ms, exit 150ms).
   - Departing elements should get out of the way swiftly.

2. **Only animate transform and opacity**:
   - Stick to `transform` (translate, scale, rotate) and `opacity`.
   - These properties are composite-only and GPU-accelerated; avoid animating `height`, `width`, `top`, or `margin` which trigger layout recalculation and jank.

3. **Appropriate durations**:
   - Most UI micro-interactions belong in the **150–300ms** range.
   - Avoid slow, drawn-out transitions on interactive elements.

4. **Easing & Curves**:
   - Use natural easing curves rather than default linear or generic ease:
   ```css
   :root {
     --ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
     --ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);
     --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
   }
   ```
   - Entering elements: `ease-out` (decelerate into view).
   - Exiting elements: `ease-in` (accelerate out of view).
   - Moving elements: `ease-in-out`.
   - Use springs for interruptible animations (e.g. tabs, drawers).

5. **Animation must support comprehension**:
   - Motion must communicate state transitions, spatial relationship, or causality.
   - Interaction must never wait for decoration.
   - No animation callback writes to the database.

6. **Honor `prefers-reduced-motion` unconditionally**:
   - Every animation must have an immediate or subtle fade fallback:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```

---

## Reconciled Ember & Root Choreography

In Ember & Root, the canonical progression sequence is authoritative:

1. **User activates "Complete quest"**
2. **Control enters pending state** (immediate button state change, spinner/indicator on row)
3. **Server confirms authoritative mutation** (returns `MutationResult`)
4. **Ember reacts** (hearth warmth/scale pulse 200–400ms)
5. **Light travels toward relevant Root branch** (400–700ms single particle/ray; skipped in reduced-motion)
6. **Branch progress advances** (stroke-dashoffset or opacity reveal on SVG overlay)
7. **If threshold crossed**: *"A path is ready"* notice appears
8. **User intentionally opens specialization choice** (user-driven modal/drawer, not automated ambush)
9. **Selected Root fork reveals** (600–900ms path illumination)
10. **Trial becomes available**

Normal quest completion stays fast. Only major milestones (threshold crossed, crest claim, trial start) receive ceremonial spectacle.

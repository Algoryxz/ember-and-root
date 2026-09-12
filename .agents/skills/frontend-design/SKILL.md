---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
license: Complete terms in LICENSE.txt
---

# Frontend Design

> **EMBER & ROOT PRECEDENCE NOTICE:**
> In this repository, design decisions must resolve in this order:
> 1. `AGENTS.md`
> 2. Ember & Root docs (`docs/PRD.md`, `docs/TRD.md`, `docs/UI_UX_BRIEF.md`, `docs/BACKEND_SCHEMA.md`, `docs/CONTRACTS.md`)
> 3. Project-specific skills (`ember-ui`, `reward-integrity`, `ship-check`)
> 4. Generic reusable design/frontend skills (`frontend-design`, `design-system`, `ui-styling`, etc.)
> 
> **If any generic rule or default aesthetic below conflicts with Ember & Root's design specification, EMBER & ROOT RULES WIN.**
> - **Product Identity**: "Illuminated field journal" (charcoal, parchment, copper, sage).
> - **Prohibited**: Generic SaaS dashboards, default shadcn styling, floating card grids, ubiquitous glassmorphism, blue/purple AI gradients, enterprise sidebars, generic admin tables, arbitrary colors.
> - **Authoritative Palette**: Background `#141713`, Raised `#1D231D`, Text `#F0E7D3`, Secondary `#B9BEAC`, Ember `#E98A4B`, Ember core `#FFD38A`, Root `#9FBA87`, Mature root `#D9E3B2`, Error `#F0A79D`.
> - **Typography**: Fraunces headings, DM Sans UI/body.

---

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

## Ground it in the subject

If the brief does not pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the page's single job, and state your choice. For Ember & Root, the world is an illuminated field journal tracking real-world habits that kindle today's Ember and shape a permanent Root. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. In Ember & Root, today's Ember and the permanent Root tree are the focal points.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. In Ember & Root, use Fraunces for display/headings and DM Sans for UI and body text.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Journal entries, parchment margins, and field notes carry information; avoid generic SaaS card containers.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. In Ember & Root, motion communicates state: routine actions resolve fast, milestone moments receive spectacle, and reduced-motion equivalents are always implemented.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well.

Consider written content carefully. Bring intentionality to copy that matches the reflective, grounded field-journal tone.

## Process: brainstorm, explore, plan, critique, build, critique again

Where the brief pins down a visual direction, follow it exactly — the brief's own words always win.

Work in two passes. First, derive every decision from the project's design tokens and brief. Check against the illuminated field-journal identity: if any part looks like a generic SaaS dashboard or AI-generated card grid, revise immediately.

Only after confirming alignment with the project brief should you write code.

## Restraint and self-critique

Spend your boldness in one place. Let the Ember and Root visualization be the memorable center; keep surrounding surfaces quiet and disciplined. Build to a quality floor without announcing it: responsive down to mobile (~375px and ~320px minimum), visible keyboard focus, reduced motion respected.

## More on writing in design

Words appear in a design to make it easier to understand, and therefore easier to use.
- Write from the end user's side of the screen.
- Use active voice as default: "Kindle Ember", "Complete Quest", "Record Entry".
- Treat failure and emptiness as moments for direction, not mood. Errors don't apologize; they state what happened and provide clear recovery. An empty quest list is an invitation to begin.
- Keep the register grounded, literary, and tuned to the field-journal theme.

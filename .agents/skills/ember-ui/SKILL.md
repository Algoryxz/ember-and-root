---
name: ember-ui
description: Implements or reviews Ember & Root frontend surfaces, responsive layouts, SVG Root presentation, accessibility, and purposeful motion while enforcing the illuminated field-journal visual language.
---

# Ember UI Skill

## Purpose
Implement and review Ember & Root frontend surfaces, responsive layouts, SVG Root presentation, accessibility, and purposeful motion while strictly enforcing the illuminated field-journal visual language.

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

**If a generic skill conflicts with Ember & Root's design specification, EMBER & ROOT RULES WIN.**

---

## Product Visual Identity
**"Illuminated field journal"**

### Forbidden Outputs (Do NOT output):
- generic SaaS dashboards
- shadcn-default visual appearance
- random floating cards
- glassmorphism everywhere
- blue/purple AI gradients
- enterprise sidebars
- generic admin tables as main UI
- arbitrary colors

### Authoritative Palette:
- **Background**: `#141713` (rich charcoal ground)
- **Raised**: `#1D231D` (deep slate/parchment surface)
- **Text**: `#F0E7D3` (aged warm parchment)
- **Secondary**: `#B9BEAC` (dried sage / muted detail)
- **Ember**: `#E98A4B` (glowing copper/orange flame)
- **Ember core**: `#FFD38A` (incandescent hearth yellow)
- **Root**: `#9FBA87` (living sprout green)
- **Mature root**: `#D9E3B2` (hardened root / amber-tinted green)
- **Error**: `#F0A79D` (subtle ash red)

### Authoritative Typography:
- **Headings / Display**: Fraunces
- **UI / Body**: DM Sans

---

## Ember UI Checklist
Every UI implementation and code review must check:

### VISUAL
- [ ] follows palette (`#141713`, `#1D231D`, `#F0E7D3`, `#B9BEAC`, `#E98A4B`, `#FFD38A`, `#9FBA87`, `#D9E3B2`, `#F0A79D`)
- [ ] follows typography (Fraunces headings, DM Sans UI/body)
- [ ] no random colors
- [ ] no generic dashboard appearance
- [ ] journal-like surfaces where appropriate
- [ ] Ember + Root remain visual focal points

### RESPONSIVE
- [ ] ~1440px desktop
- [ ] ~768px tablet
- [ ] ~375px phone
- [ ] ~320px minimum phone
- [ ] 200% zoom does not break flow

### ACCESSIBILITY
- [ ] semantic HTML
- [ ] visible focus
- [ ] keyboard usable
- [ ] reduced motion supported
- [ ] touch targets adequate (>=44x44px)
- [ ] labels are not color-only
- [ ] screen reader equivalents for visual progression

### MOTION
- [ ] motion communicates state
- [ ] no decorative animation blocks interaction
- [ ] ordinary completion remains fast
- [ ] milestone animations feel special
- [ ] reduced-motion equivalent exists

---

## Root Rules
The Root tree visualization must use:
**fixed authored SVG geometry + state-controlled path reveal**

### Never use:
- procedural graph layout
- force graphs
- free pan/zoom
- giant graph packages
- SVG morph engines
- Three.js
- Rive
- Lottie
- GSAP unless explicitly approved by technical ownership

### Interaction & Accessibility:
- SVG may be decorative (`aria-hidden="true"`).
- Interactive Root nodes must be accessible HTML controls positioned over or around the SVG.
- Provide a semantic list fallback for the Root progression.
- Mobile must not require drag, hover, pinch, or zoom.

---

## Motion Budget
- Routine completion: press → pending state → confirmed server response → one XP travel → Root illumination.
- Major thresholds: specialization choice and crest reveal may receive celebratory spectacle.
- Never queue toast spam or multiple simultaneous motion effects.
- No animation callback writes to the database.

## Acceptance Output
When submitting UI changes, report:
1. Files changed
2. Desktop check (~1440px)
3. Mobile check (~375px and ~320px)
4. Keyboard/focus check
5. Reduced-motion behavior
6. Any deviation from frozen design rules

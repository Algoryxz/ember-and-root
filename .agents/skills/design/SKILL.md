---
name: design
description: "Comprehensive design skill: brand identity, design tokens, UI styling, and asset generation. Adaptable for SVG icon design, logo references, and visual assets within Ember & Root."
argument-hint: "[design-type] [context]"
license: MIT
metadata:
  author: claudekit
  version: "2.1.0"
---

# Design

> **EMBER & ROOT PRECEDENCE NOTICE:**
> In this repository, all visual and asset design decisions must resolve in this order:
> 1. `AGENTS.md`
> 2. Ember & Root docs (`docs/PRD.md`, `docs/TRD.md`, `docs/UI_UX_BRIEF.md`, `docs/BACKEND_SCHEMA.md`, `docs/CONTRACTS.md`)
> 3. Project-specific skills (`ember-ui`, `reward-integrity`, `ship-check`)
> 4. Generic reusable design/frontend skills (`design`, `frontend-design`, `ui-styling`, etc.)
>
> **CRITICAL REPOSITORY CONSTRAINTS:**
> - **Product Identity**: "Illuminated field journal" (charcoal `#141713`, raised `#1D231D`, parchment text `#F0E7D3`, ember `#E98A4B`, root `#9FBA87`).
> - **Prohibited**: Generic SaaS branding, neon/cyberpunk gradients, standard corporate templates, slides, and banner generation (slides/banners are out of scope for Ember & Root).
> - **Dependencies**: Do NOT run `pip install` or introduce new dependencies without delivery owner approval.
> - **Root Geometry**: Root is fixed authored SVG geometry with state-controlled path reveal. Do not attempt procedural generation or complex 3D/canvas models.

---

Unified design skill: brand, tokens, UI, icons, and visual assets.

## When to Use

- Brand identity, voice, and thematic assets
- Design system tokens and specs
- UI styling coordination with `ui-styling` and `ember-ui`
- SVG icon design and vector asset references

## Sub-skill Routing

| Task | Sub-skill | Details |
|------|-----------|---------|
| Brand identity, voice, field journal assets | `brand` | Project-adapted brand skill |
| Tokens, specs, CSS variables | `design-system` | Project-adapted design-system skill |
| UI implementation & components | `ember-ui` / `ui-styling` | Ember & Root field-journal styling |
| SVG icons, icon sets | Icon (built-in) | `references/icon-design.md` |
| Logo / Emblem references | Logo (built-in) | `references/logo-design.md` |

*(Note: Slides and Banners are excluded from active scope in Ember & Root.)*

## Icon Design (Vector & SVG)

15 styles, 12 categories. Text-only SVG output.

### Icon: Workflow & Guidelines
- Icons must fit the field-journal aesthetic (e.g. hand-inked, botanical, rustic talisman, organic line weight).
- Never use emojis as structural UI icons.
- Meaningful icons require >=3:1 contrast against adjacent colors (`#141713` / `#1D231D`).
- Decorative icons must have `aria-hidden="true"`.
- Keep tap target >=44x44px on mobile.

```bash
# Query icon patterns:
python .agents/skills/design/scripts/logo/search.py "journal talisman" --domain style
```

## Setup & Dependencies Notice

The embedded scripts use Python 3 standard library where possible. Do NOT install extra third-party libraries (`pip install google-genai pillow`) without explicit delivery owner approval.

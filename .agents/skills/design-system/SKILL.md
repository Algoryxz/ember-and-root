---
name: design-system
description: Token architecture, component specifications, and systematic design. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typography scales, component specs, and brand-compliant token management.
argument-hint: "[component or token]"
license: MIT
metadata:
  author: claudekit
  version: "1.0.0"
---

# Design System

> **EMBER & ROOT PRECEDENCE NOTICE:**
> In this repository, design tokens and UI architecture must resolve in this order:
> 1. `AGENTS.md`
> 2. Ember & Root docs (`docs/PRD.md`, `docs/TRD.md`, `docs/UI_UX_BRIEF.md`, `docs/BACKEND_SCHEMA.md`, `docs/CONTRACTS.md`)
> 3. Project-specific skills (`ember-ui`, `reward-integrity`, `ship-check`)
> 4. Generic reusable design/frontend skills (`design-system`, `ui-styling`, etc.)
>
> **Token Ownership & Rules:**
> - Do not change design tokens or shared primitives outside Deeptiman’s ownership without coordination.
> - **Product Identity**: "Illuminated field journal".
> - **Authoritative Palette Tokens**:
>   - `--bg-canvas` / Background: `#141713`
>   - `--bg-raised` / Raised Surface: `#1D231D`
>   - `--text-primary` / Parchment Text: `#F0E7D3`
>   - `--text-secondary` / Muted Text: `#B9BEAC`
>   - `--ember-flame` / Ember: `#E98A4B`
>   - `--ember-core` / Ember Core: `#FFD38A`
>   - `--root-stem` / Root: `#9FBA87`
>   - `--root-mature` / Mature Root: `#D9E3B2`
>   - `--status-error` / Error: `#F0A79D`
> - **Authoritative Typography Tokens**:
>   - `--font-display`: Fraunces, serif
>   - `--font-body`: DM Sans, sans-serif
> - Slides/presentation modules have been stripped from this skill per project scope.

---

Token architecture, component specifications, systematic design, and token validation.

## When to Use

- Design token creation and maintenance
- Component state definitions and variants
- CSS variable systems and theming
- Spacing, typography, and elevation scales
- Design-to-code handoff
- Tailwind theme token configuration

## Token Architecture

Load: `references/token-architecture.md`

### Three-Layer Structure

```
Primitive (raw hex / scale values)
       ↓
Semantic (purpose aliases: background, surface, text, ember, root)
       ↓
Component (component-specific variables: --journal-border, --node-active)
```

**Example:**
```css
/* Primitive */
--color-ember-400: #FFD38A;
--color-ember-500: #E98A4B;

/* Semantic */
--color-primary-flame: var(--color-ember-500);
--color-primary-core: var(--color-ember-400);

/* Component */
--ember-indicator-glow: var(--color-primary-core);
```

## Quick Start

**Generate tokens:**
```bash
node scripts/generate-tokens.cjs --config tokens.json -o tokens.css
```

**Validate usage:**
```bash
node scripts/validate-tokens.cjs --dir src/
```

## References

| Topic | File |
|-------|------|
| Token Architecture | `references/token-architecture.md` |
| Primitive Tokens | `references/primitive-tokens.md` |
| Semantic Tokens | `references/semantic-tokens.md` |
| Component Tokens | `references/component-tokens.md` |
| Component Specs | `references/component-specs.md` |
| States & Variants | `references/states-and-variants.md` |
| Tailwind Integration | `references/tailwind-integration.md` |

## Component Spec Pattern

| Property | Default | Hover | Active | Disabled |
|----------|---------|-------|--------|----------|
| Background | surface-raised (`#1D231D`) | surface-hover | surface-active | surface-muted |
| Text | text-primary (`#F0E7D3`) | text-primary | text-primary | text-muted (`#B9BEAC`) |
| Border | subtle parchment border | highlight border | active ember/root glow | muted-border |
| Shadow | none / ambient glow | ambient glow-md | none | none |

## Scripts

| Script | Purpose |
|--------|---------|
| `generate-tokens.cjs` | Generate CSS from JSON token config |
| `validate-tokens.cjs` | Check for hardcoded values in code |
| `embed-tokens.cjs` | Embed token definitions directly into target stylesheets |

## Templates

| Template | Purpose |
|----------|---------|
| `design-tokens-starter.json` | Starter JSON with three-layer structure |

## Integration

**With brand:** Extract primitives from brand colors/typography (`docs/UI_UX_BRIEF.md`)
**With ui-styling:** Map component tokens into Tailwind config and React components

## Best Practices

1. Never use raw hex in components — always reference CSS variables / tokens
2. Semantic layer maps to Ember & Root field-journal roles
3. Component tokens enable component-level adjustments without leaking raw values
4. Document every token's purpose in `references/semantic-tokens.md`
5. Validate code using `validate-tokens.cjs` to catch accidental hardcoded styles

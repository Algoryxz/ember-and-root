---
name: theme-factory
description: Authoritative design token enforcement and tokenized theme application for Ember & Root. Guarantees consistent application of canonical CSS variables, spacing scales, corner radiuses, and typography.
---

# Theme Factory Skill

> **EMBER & ROOT TOKEN POLICY:**
> - We do **NOT** generate arbitrary new themes or random color palettes.
> - We **ALREADY HAVE** the frozen Ember & Root design tokens.
> - This skill adopts the reusable token architecture and application methodology from `awesome-codex-skills`, strictly enforcing the canonical project design tokens across all UI components and artifacts.
> - **Strict Prohibition**: Arbitrary component-level colors, inline hex codes, and ad-hoc palettes are forbidden unless added to the shared design tokens intentionally with design ownership coordination.

---

## Canonical Tokens

All styles, Tailwind utility classes, and CSS variables must map directly to these canonical tokens:

### Surfaces & Backgrounds
```css
--color-bg: #141713;       /* Canvas ground: deep charcoal */
--color-raised: #1D231D;   /* Raised surface: dark slate/journal leaf */
```

### Typography & Ink
```css
--color-text: #F0E7D3;       /* Primary text: aged warm parchment */
--color-text-muted: #B9BEAC; /* Secondary text: dried sage */
```

### Living Ember (Warm Accent)
```css
--color-ember: #E98A4B;      /* Ember flame: copper orange */
--color-ember-core: #FFD38A; /* Ember core: incandescent hearth yellow */
```

### Living Root (Organic Accent)
```css
--color-root: #9FBA87;        /* Living root: sprout sage green */
--color-root-mature: #D9E3B2; /* Mature root: hardwood amber/green */
```

### System & State
```css
--color-error: #F0A79D;       /* Error / alert: ash red */
```

---

## Authoritative Typography

| Role | Family | Fallback | Usage |
|------|--------|----------|-------|
| **Headings / Display** | `Fraunces` | serif | Page titles, branch headings, quest titles, milestone reveal |
| **Body / Interface** | `DM Sans` | sans-serif | Quest descriptions, badges, button labels, navigation, data tables |

---

## Spacing System

Enforce a rhythmic, scale-based spacing system. Do not use arbitrary pixel values:

```css
--space-1: 4px;   /* Micro gaps, tight padding */
--space-2: 8px;   /* Icon-to-text spacing, compact padding */
--space-3: 12px;  /* Component internal element separation */
--space-4: 16px;  /* Standard component padding and row gap */
--space-6: 24px;  /* Section sub-grouping, card padding */
--space-8: 32px;  /* Major section separation */
--space-12: 48px; /* Layout grid gutters, page header margins */
```

---

## Corner System

- **Surfaces and Containers**: `6px – 10px` border-radius (`rounded-md` or `rounded-lg`).
  - Quest rows, dialog panels, inputs, cards, and popovers must use this subtle, bookbound radius.
- **Circles (`rounded-full` / 50%) are strictly reserved for**:
  1. The central **Ember** hearth visualization
  2. Interactive **Root nodes** / talismans
  3. Intentionally circular controls (e.g. icon-only stamp buttons, avatar badges)

---

## Enforcement Checklist

Before finishing any styling task:
- [ ] No raw hex codes (e.g. `#fff`, `#000`, `#2563EB`, `#1E1E1E`) in component markup or CSS.
- [ ] All colors derive from `--color-bg`, `--color-raised`, `--color-text`, `--color-ember`, or `--color-root`.
- [ ] Headings use `Fraunces`; UI body text uses `DM Sans`.
- [ ] Spacing conforms strictly to the 4/8/12/16/24/32/48 rhythm.
- [ ] Surfaces stay within the 6–10px corner radius.

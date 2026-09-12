---
name: ui-styling
description: Create accessible, field-journal styled user interfaces with Radix UI / semantic primitives, Tailwind CSS utility-first styling, and bespoke journal aesthetics. Use when building UI components, implementing responsive layouts, adding accessible controls (dialogs, dropdowns, forms), customizing themes, and enforcing Ember & Root design tokens.
argument-hint: "[component or layout]"
license: MIT
metadata:
  author: claudekit
  version: "1.0.0"
---

# UI Styling Skill

> **EMBER & ROOT PRECEDENCE NOTICE:**
> In this repository, styling decisions must resolve in this order:
> 1. `AGENTS.md`
> 2. Ember & Root docs (`docs/PRD.md`, `docs/TRD.md`, `docs/UI_UX_BRIEF.md`, `docs/BACKEND_SCHEMA.md`, `docs/CONTRACTS.md`)
> 3. Project-specific skills (`ember-ui`, `reward-integrity`, `ship-check`)
> 4. Generic reusable design/frontend skills (`ui-styling`, `frontend-design`, etc.)
>
> **Strict Styling Invariants:**
> - **Product Identity**: "Illuminated field journal" (charcoal, parchment, copper, sage).
> - **Prohibited**:
>   - Generic SaaS dashboards
>   - Default shadcn visual appearance
>   - Random floating card grids
>   - Glassmorphism everywhere
>   - Blue/purple AI gradients
>   - Enterprise sidebars
>   - Generic admin tables as main UI
>   - Arbitrary component colors
> - **Dependency Rule**: Do NOT introduce new dependencies or component packages without delivery owner approval.
> - **Token Ownership**: Do not change design tokens / shared primitives outside Deeptiman’s ownership.
> - **Authoritative Palette**:
>   - Background: `#141713`
>   - Raised: `#1D231D`
>   - Text: `#F0E7D3`
>   - Secondary: `#B9BEAC`
>   - Ember: `#E98A4B`
>   - Ember core: `#FFD38A`
>   - Root: `#9FBA87`
>   - Mature root: `#D9E3B2`
>   - Error: `#F0A79D`
> - **Typography**: Fraunces headings, DM Sans UI/body.
> - **Controls**: Semantic HTML controls, visible focus ring, keyboard usable, reduced motion supported.

---

Comprehensive skill for creating accessible user interfaces combining headless primitives (Radix UI), Tailwind CSS utility styling, and Ember & Root's illuminated field-journal visual language.

## When to Use This Skill

- Building responsive UI for Hearth, Root, Satchel, Chronicle, and dialogs
- Implementing accessible controls (dialogs, forms, dropdowns, lists)
- Applying Tailwind CSS utility classes aligned with design tokens
- Creating responsive mobile-first layouts (~320px, ~375px, ~768px, ~1440px)
- Implementing dark field-journal theme and contrast standards
- Ensuring keyboard navigation, visible focus indicators, and ARIA semantics

## Core Stack

### Component Layer: Headless Primitives
- Accessible primitives (Radix UI / native HTML5 controls)
- Composable primitives with full keyboard and screen reader support
- Styled to look like illuminated field-journal artifacts, NOT default white-and-gray shadcn cards

### Styling Layer: Tailwind CSS
- Utility-first CSS framework configured with Ember & Root design tokens
- Build-time processing with zero runtime overhead
- Mobile-first responsive breakpoints
- Consistent tokens for spacing, typography, and colors

### Visual Design: Field Journal Aesthetics
- Charcoal canvas (`#141713`) and raised parchment/slate surfaces (`#1D231D`)
- Warm parchment text (`#F0E7D3`) with high contrast
- Living ember glow (`#E98A4B`, `#FFD38A`) and organic root greens (`#9FBA87`, `#D9E3B2`)
- Journal rows and entries instead of generic dashboard cards

## Component Implementation Pattern (Field Journal Style)

```tsx
import * as React from "react"

export function JournalEntryCard({ title, children, status }: { title: string; children: React.ReactNode; status?: string }) {
  return (
    <article className="bg-[#1D231D] border border-[#B9BEAC]/20 rounded-md p-4 text-[#F0E7D3] focus-within:ring-2 focus-within:ring-[#E98A4B] transition-colors">
      <header className="flex items-center justify-between pb-2 border-b border-[#B9BEAC]/10">
        <h3 className="font-serif text-lg text-[#F0E7D3] tracking-wide">{title}</h3>
        {status && <span className="text-xs font-sans text-[#B9BEAC]">{status}</span>}
      </header>
      <div className="pt-3 font-sans text-sm text-[#F0E7D3]/90 leading-relaxed">
        {children}
      </div>
    </article>
  )
}
```

## Accessibility Patterns

See: `references/shadcn-accessibility.md`

1. **Focus Management**: All interactive controls must have visible, high-contrast focus rings (e.g. amber/ember focus ring on dark surfaces).
2. **Keyboard Traversal**: Full tab navigation for all interactive elements. Modals and dialogs trap focus and restore focus on close.
3. **Screen Readers**: Visual progression (XP, Ember kindle, Root growth) must have textual/live-region screen reader equivalents.
4. **Reduced Motion**: All animations must respect `prefers-reduced-motion: reduce`.

## Tailwind Token Integration

See: `references/tailwind-utilities.md` and `references/tailwind-customization.md`

Map utilities directly to project tokens:
- `bg-canvas` -> `#141713`
- `bg-surface` -> `#1D231D`
- `text-parchment` -> `#F0E7D3`
- `text-muted` -> `#B9BEAC`
- `text-ember` -> `#E98A4B`
- `text-root` -> `#9FBA87`
- `font-heading` -> Fraunces
- `font-body` -> DM Sans

## Utility Scripts

- `scripts/shadcn_add.py`: Component installation helper (check dependencies with delivery owner first).
- `scripts/tailwind_config_gen.py`: Generates Tailwind configuration from token definitions.

## Best Practices

1. **Semantic HTML First**: Use `<main>`, `<article>`, `<nav>`, `<button>`, `<input>` before generic `<div>`s.
2. **No Generic Dashboards**: Never generate SaaS cards with arbitrary floating gradients.
3. **Responsive by Default**: Validate at ~320px, ~375px mobile, ~768px tablet, ~1440px desktop.
4. **Contrast Compliance**: Ensure text contrast meets WCAG AA (>=4.5:1) against `#141713` and `#1D231D`.
5. **Reduced Motion**: Provide instant or fade fallbacks for any motion.

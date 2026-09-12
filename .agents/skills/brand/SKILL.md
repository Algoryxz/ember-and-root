---
name: brand
description: Brand voice, visual identity, messaging frameworks, and consistency for Ember & Root's illuminated field-journal narrative.
argument-hint: "[update|review|create] [args]"
metadata:
  author: claudekit
  version: "1.0.0"
---

# Brand

> **EMBER & ROOT PRECEDENCE NOTICE:**
> In this repository, brand identity, voice, and visual rules must resolve in this order:
> 1. `AGENTS.md`
> 2. Ember & Root docs (`docs/PRD.md`, `docs/TRD.md`, `docs/UI_UX_BRIEF.md`, `docs/BACKEND_SCHEMA.md`, `docs/CONTRACTS.md`)
> 3. Project-specific skills (`ember-ui`, `reward-integrity`, `ship-check`)
> 4. Generic reusable design/brand skills (`brand`, `frontend-design`, etc.)
>
> **Core Brand Invariants:**
> - **Product Core Fantasy**: "What you do becomes who you are. A single real-world action produces one beautiful, understandable, permanent consequence."
> - **Tone of Voice**: Grounded, reflective, purposeful, literary. Field notes of an observant wanderer, never corporate SaaS hype or generic fantasy clichés.
> - **Authoritative Palette**:
>   - Background: `#141713` (rich charcoal)
>   - Raised: `#1D231D` (deep slate)
>   - Text: `#F0E7D3` (aged parchment)
>   - Secondary: `#B9BEAC` (dried sage)
>   - Ember: `#E98A4B` (warm wood-ember)
>   - Ember core: `#FFD38A` (incandescent hearth)
>   - Root: `#9FBA87` (living sprout green)
>   - Mature root: `#D9E3B2` (hardwood bark / aged stem)
>   - Error: `#F0A79D` (subtle ash red)
> - **Authoritative Typography**:
>   - Display / Headings: Fraunces (serif with warmth and history)
>   - UI / Body: DM Sans (clean, legible humanist sans)
> - **Token Ownership**: Do not change tokens or primitives outside Deeptiman's ownership.

---

Brand identity, voice, messaging, and consistency frameworks adapted for Ember & Root.

## When to Use

- Ensuring copy matches the field-journal voice
- Checking UI surfaces for brand compliance and consistency
- Reviewing terminology: Ember, Root, Hearth, Satchel, Chronicle, Sparks, Trials
- Verifying color palette and typography alignment

## Brand Sync Workflow

```bash
# 1. Edit brand guidelines or tokens
# 2. Sync to design tokens
node .agents/skills/brand/scripts/sync-brand-to-tokens.cjs
# 3. Verify
node .agents/skills/brand/scripts/inject-brand-context.cjs --json
```

## References

| Topic | File |
|-------|------|
| Voice Framework | `references/voice-framework.md` |
| Visual Identity | `references/visual-identity.md` |
| Messaging | `references/messaging-framework.md` |
| Consistency | `references/consistency-checklist.md` |
| Guidelines Template | `references/brand-guideline-template.md` |
| Asset Organization | `references/asset-organization.md` |
| Color Management | `references/color-palette-management.md` |
| Typography | `references/typography-specifications.md` |
| Approval Checklist | `references/approval-checklist.md` |

## Best Practices

1. **Voice Tone**: Grounded, purposeful, and reflective.
2. **Color Invariants**: Never introduce unapproved bright neons or generic corporate blues.
3. **Typography**: Always pair Fraunces (headings) with DM Sans (UI/body).

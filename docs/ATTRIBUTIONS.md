# Ember & Root — Attributions & Inspiration Ledger

Ember & Root is an original product by the Algoryxz team. This document records third-party software, reusable agent skills, component references, and visual/motion inspiration used or evaluated during development.

The goal is explicit provenance: **copied/adapted code, design inspiration, and runtime dependencies are recorded separately.** A reference listed here does not imply that its code was copied verbatim.

## 1. Runtime & development dependencies actually used

| Project | Role in Ember & Root | Source |
|---|---|---|
| Next.js | App Router framework and server/client rendering | https://nextjs.org/ |
| React | UI runtime | https://react.dev/ |
| TypeScript | Static typing | https://www.typescriptlang.org/ |
| Tailwind CSS | Utility styling | https://tailwindcss.com/ |
| Supabase | Auth, PostgreSQL access, SSR helpers, RPC transport | https://supabase.com/ |
| PostgreSQL | Authoritative game data and progression RPCs | https://www.postgresql.org/ |
| Motion for React (`motion`) | UI motion and animation primitives | https://motion.dev/ |
| Radix Dialog | Accessible modal/dialog primitive | https://www.radix-ui.com/primitives/docs/components/dialog |
| Zod | Input validation | https://zod.dev/ |
| Vitest | Unit/integration testing | https://vitest.dev/ |
| Playwright | Browser E2E and responsive verification | https://playwright.dev/ |
| axe-core | Accessibility assertions | https://github.com/dequelabs/axe-core |
| Vercel | Target Next.js deployment platform | https://vercel.com/ |

See `package.json` for exact versions.

## 2. Reusable agent skills and tooling

The repository contains adapted project-local copies of external agent guidance. Ember & Root project docs and project-specific skills always take precedence over reusable external guidance.

| Skill/tool | Upstream | How it is used |
|---|---|---|
| `frontend-design` | Anthropic Skills — https://github.com/anthropics/skills | Base anti-generic frontend design guidance, adapted to defer to Ember & Root's field-journal identity. |
| `animate` | delphi-ai/animate-skill — https://github.com/delphi-ai/animate-skill | Motion quality, easing, reduced-motion and performance guidance, adapted to Ember & Root choreography. |
| `theme-factory` methodology | Composio awesome-codex-skills — https://github.com/ComposioHQ/awesome-codex-skills | Token-system methodology adapted to enforce Ember & Root's frozen palette rather than generate themes. |
| Playwright MCP | Microsoft — https://github.com/microsoft/playwright-mcp | Browser screenshots, viewport QA and visual feedback loop for agents. |

Project-original skills (`ember-ui`, `reward-integrity`, `integration-guardian`, `ship-check`) are maintained inside this repository.

## 3. UI/component references and design inspiration

### 21st.dev discovery platform

21st.dev is used as a discovery source for interaction and component patterns: https://21st.dev/

| Reference | Creator/source | Status in Ember & Root | What we borrow |
|---|---|---|---|
| PrismaHero | Rahil Vahora, surfaced on 21st.dev | **Inspiration only** | Editorial composition, word-reveal pacing, compact CTA architecture. No background video or template styling is copied. |
| Dynamic Hero | Hossain Jahed — https://21st.dev/@jahed/components/dynamic-hero | **Reference / evaluation** | Dynamic hero-state ideas for the public entry experience. |
| Cinematic landing Hero | Hossain Jahed — https://21st.dev/@jahed/components/cinematic-landing-hero | **Reference / evaluation** | Full-viewport storytelling, strong hierarchy and scene-based landing composition. |
| Horizon Hero Section | scott clayton, surfaced on 21st.dev | **Inspiration only** | Spatial storytelling and environmental typography. The Three.js/GSAP/WebGL implementation is intentionally not adopted. |
| Animated Cards Stack | YoucefBnm Bnm — https://21st.dev/@youcefbnm/components/animated-cards-stack | **Planned adaptation for onboarding** | Stacked-card sequencing and directional motion for goal/intensity/starter-quest choices. Tap/button equivalents remain mandatory for accessibility. |
| Svg follow scroll | reuno-ui — https://21st.dev/@reuno-ui/components/svg-follow-scroll ; source credited by 21st.dev to https://skiper-ui.com/ | **Planned adaptation** | Scroll-linked SVG path progress for the public Root story; re-authored with Ember & Root SVG geometry and palette. |

### Other references

| Reference | Creator/source | Status in Ember & Root | What we borrow |
|---|---|---|---|
| Spector | https://spector.framer.website/ | **Visual/motion inspiration only** | Scroll choreography, editorial typography, section rhythm, and integrated interaction polish. No site assets or copy are reused. |
| Timeline | Aceternity UI — https://ui.aceternity.com/components/timeline | **Planned adaptation for Chronicle** | Sticky chronology + scroll-follow beam concept, reinterpreted as a living root/history line. |
| Glass Button | Original interaction by Petr Knoll — https://codepen.io/Petr-Knoll/pen/QwWLZdx | **Interaction reference only** | Pressed-depth/tactile button construction. Ember & Root will not ship the glassmorphism visual treatment. |

## 4. Attribution rules for future additions

Whenever an external component, snippet, animation, icon set, font, skill, or design reference materially influences the shipped product:

1. Record the **creator/project name**.
2. Record the **canonical source URL**.
3. Record whether it is **copied**, **adapted**, or **inspiration only**.
4. Preserve any required upstream license/copyright notices.
5. Do not describe inspiration as original implementation if substantial source code or visual structure was reused.
6. Add new entries here in the same commit that introduces the dependency or adaptation.

If provenance or license is uncertain, do not ship copied source until it is resolved.

## 5. Team credit

Ember & Root product concept, game systems, backend architecture, visual direction, integration, and implementation are developed by the Algoryxz team:

- **Smarak** — Backend / Architecture / Integration Lead
- **Deeptiman** — Experience / Frontend Lead
- **Akriti** — Root / Specialization / Trial UI Lead
- **Susmita** — Delivery / Auth / Product Systems Lead

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
| Cinematic Hero V3 Concept | Algoryxz Creative Brief / Reference Artwork | **Adapted** | Full-viewport cinematic dark soil scene, hand and match ignition, living root network composition, Fraunces editorial overlay, and sequential loop storytelling. |
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

## 5. Opening forest prototype — user references (2026-09-13)

Five supplied images are preserved unchanged in `docs/design-references/opening/`. Creator, canonical URL and license were not supplied; no original-authorship claim is made. The forest and root-chamber images are **adapted** as scene plates using the built-in OpenAI image editing tool (https://openai.com/index/image-generation-api/). The other three images are archived references only. Production variants are `public/opening/forest.png` and `public/opening/root-chamber.png`. What was borrowed: the forest trees, guidance markings, atmosphere, and chamber root composition. What changed: figures and existing fire removed; clean path/cradle created. HTML hotspots, masks, mist, small Ember and interaction code were authored for this prototype. Exact prompts and limitations: `docs/OPENING_FOREST_PROTOTYPE.md`. No new dependency or third-party component code.

## 6. Team credit

Playable Prologue V1 retains those forest/chamber sources. Runtime textures are additionally encoded as `forest.webp` and `root-chamber.webp` (quality 85, unchanged dimensions). New camera stops, mask layering, interaction choreography and bounded motes are project-authored. Motion for React was already installed; no new rendering dependency or external code was introduced. See `docs/PLAYABLE_PROLOGUE_V1.md` for the review package and measured limits.

### The Self Within opening study (2026-09-13)

- Creative direction: user-supplied **Ember & Root — Cinematic Opening / Final Art Direction**, Concept 01 with the later descent from Concept 02. This prototype implements only darkness through the first inner Ember.
- `public/hero/awakening-human.png` and `public/hero/awakening-ember.png`: generated with OpenAI's built-in image generation tool (https://openai.com/index/image-generation-api/), then integrated as paired lighting plates. Status: generated for this project, not stock photography or a representation of a real identified person. No third-party image was used as an input. No upstream artist copyright notice was supplied. Prompt record: `docs/AWAKENING_PROTOTYPE.md`.
- `public/hero/hand-match.jpg`: reuses the repository's Cinematic Hero V3 asset listed above; a masked hand region is used with a new authored match and flame. Its pre-existing attribution is retained; this change does not establish additional provenance for the original asset.
- New match, striking surface, flame paths, masks, and choreography: authored in this change from the user's narrative; no external component code copied. Existing Motion for React dependency reused. No new dependencies.
- The generated human uses an ordinary dark garment to retain anonymity. This is a prototype compromise requiring visual review against the requested sculptural-body direction, not an approved final character asset.

Ember & Root product concept, game systems, backend architecture, visual direction, integration, and implementation are developed by the Algoryxz team:

- **Smarak** — Backend / Architecture / Integration Lead
- **Deeptiman** — Experience / Frontend Lead
- **Akriti** — Root / Specialization / Trial UI Lead
- **Susmita** — Delivery / Auth / Product Systems Lead


## Playable prologue V2: storm shore and world entry (2026-09-13)

- Primary source: user-supplied `docs/design-references/opening/storm-shore.jpeg`. Original creator, canonical URL, and license were not provided; no claim of original ownership or public redistribution rights is made.
- Status: materially adapted. The storm's dark blue-black palette, lone silhouette, turbulent sea, and calm chest Ember were borrowed directly.
- OpenAI built-in image generation edited the supplied source into `public/opening/storm-shore.webp` (empty wide environment) and `public/opening/shore-figures.webp` (transparent three-angle character sheet). Generated 2026-09-13, then mechanically compressed using Pillow. No additional image sources were used.
- Environment prompt: faithfully adapt the reference into a wide empty shore, remove person and flame, retain colossal storm clouds, restless cold sea, black wet rocks, horizon at 62%, no text or UI.
- Figure prompt: same anonymous person in equally spaced rear-three-quarter, front-three-quarter, and frontal full-body views on transparent background; dark trousers, shadowed torso, cold rim light, small internally illuminating sternum Ember on front views, no armor or anatomy diagram.
- Implemented as layered matte imagery with CSS compositing, authored angle crossfades, independent weather and semantic HTML controls. These are not continuous volumetric 3D camera renders.
- Relic cabinet ornaments are locally authored CSS representations of the existing Copper Halo, Firefly Orbit, and Engraved Basin catalog items. No external art copied.
- The canonical Root SVG geometry and server progression rules remain unchanged.

## 7. Canonical Starting Prologue & Entry Chapter Soundtrack (2026-09-13)

- Source: User-provided recording (`Recording 2026-09-13 105457.mp3`), placed in `public/audio/prologue.mp3`.
- Status: User-supplied media for the entire Entry Chapter (~102s duration), spanning the cinematic prologue, Root descent, Ember contact, storm shore title, and `/signup` / `/login` auth folios.
- What was borrowed: Atmospheric orchestral soundtrack utilized continuously across the public entry chapter (`components/public/opening/`, `/signup`, `/login`). On confirmed successful entry, performs a slow non-linear cinematic fade (100% -> ~40% -> 0% over 2–3 seconds) and halts completely with zero presence in interior game surfaces (Hearth, Root, Satchel, Chronicle, Settings, Onboarding).
- Integration: Authored audio controller (`prologueAudio.ts`) and React provider (`EntryAudioProvider.tsx`) handling HTML5 audio playback, browser gesture unlocking for autoplay restrictions, accessible sound toggle controls across all entry surfaces, non-linear exit fade, and seamless continuous playback between route transitions. No external audio dependencies introduced.

## 8. Canonical Brand Mark — Ember to Root (2026-09-13)

- Source: Project-authored brand mark evolution based on user-supplied fallback mark (`media_1789273873966.png`).
- Status: Project-authored original design (Direction A — Variant A2).
- Concept: Evolves the diagonal 3-point branch silhouette into an illuminated Ember seed apex sprouting natural tapered organic roots, paired with Fraunces variable serif typography.
- Assets: `public/brand/`, `public/icon.svg`, `app/icon.svg`, and `components/brand/EmberRootLogo.tsx`.


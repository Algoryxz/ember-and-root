# Ember & Root — Experience V2

## Status

This document defines the next product-experience phase after the initial functional implementation and Onboarding V2 work.

It does **not** replace the product rules in `docs/PRD.md`, architecture rules in `docs/TRD.md`, backend authority in `docs/BACKEND_SCHEMA.md`, or the current frozen visual tokens in `docs/UI_UX_BRIEF.md`.

Repository evidence remains authoritative. Visual ideas in this document are experiments until accepted through browser evidence.

---

## Governing idea

> **The organism should stop being an illustration inside the interface and become the structure that organizes the interface.**

Ember & Root is strongest when the same living object connects the entire product:

- Landing introduces the dormant specimen.
- Signup preserves the seed/origin.
- Onboarding previews possible filaments without implying earned progression.
- The first real Seal wakes the first authoritative filament.
- Hearth shows a compact cutting of the same organism.
- Root expands it into the full permanent specimen.
- Specialization changes the same anatomy.
- Trials provide evidence for further development.
- Crests remain attached as permanent terminal structures.
- Chronicle records the real actions that produced the organism.

The product should make the user think:

> **“I can literally see who I am becoming.”**

not:

> “I checked off another task.”

---

## Product metaphors

Use these five concepts as the primary experience vocabulary:

| Concept | Meaning |
|---|---|
| **Ember** | present-day activity and warmth |
| **Root** | permanent accumulated becoming |
| **Seal** | a real confirmed action and its causal consequence |
| **Journal** | the human-readable record of actions and evidence |
| **Relics** | earned or purchased physical objects with persistent ownership |

Before adding a new visual primitive, ask which of these concepts it belongs to. Avoid introducing competing metaphors without explicit product approval.

---

## Recommended art direction — Botanical Folio

The governing art direction is a **contemporary botanical field folio**, not an antique fantasy tome.

### Composition

- asymmetric editorial layouts
- one dominant object or organism where appropriate
- narrow annotation margins instead of repeated dashboard panels
- hierarchy from spacing, typography, illustration, rules, and material
- containers only when they represent a real conceptual object

### Material language

- quiet journal leaves
- restrained rules and annotations
- seal impressions
- subtle ink density
- authored botanical linework
- selective solid tissue and limited illumination

Avoid:

- decorative glassmorphism
- generic neon glows
- blue/purple AI gradients
- floating SaaS cards
- every state expressed as a badge
- every noun placed in a rounded rectangle

### Motion

Motion communicates cause, state, growth, reward, or hierarchy.

- routine actions remain fast
- permanent progression changes anatomy, not only brightness
- transient rewards may use light/illumination
- mature organisms should not constantly pulse, sway, or regrow on navigation
- reduced motion always has an immediate-state equivalent

The existing `motion/react` stack is sufficient. Do not add GSAP, Three.js, Lottie, Rive, or another animation stack without an approved requirement.

---

## Root as a shared organism

Root is the most important unique visual asset in Ember & Root.

### Biological presentation states

| Authoritative state | Physical expression |
|---|---|
| 0 XP | dormant seed / origin and quiet ground mark |
| first awarded XP | first fine filament becomes permanently visible |
| further progress | authored tissue layers, lateral rootlets, texture, and thickness accumulate |
| specialization eligible | two prospective tips become legible without implying a committed choice |
| specialization chosen | selected limb develops; unchosen possibility recedes to a quiet trace |
| mature branch without complete Trial | developed terminal structure remains closed |
| Trial complete + Crest eligible | terminal becomes visibly ready with explicit claim action |
| Crest claimed | terminal opens into the permanent Crest |

### Rendering rule

Permanent progress should change **anatomy**. Transient feedback may change **light**.

The renderer consumes authoritative state. It must not recalculate XP eligibility, Trial completion, Crest availability, or reward math.

### Recommended first implementation approach

Start with **layered authored anatomy**:

- fixed SVG geometry
- authored inner filament
- authored outer tissue layers
- authored rootlets/details
- masks/opacity/path reveal for presentation

Selective continuous reveal may supplement this, but length alone must not become a disguised progress bar.

### Shared variants

The same visual identity should provide:

- full Root overview
- selected-branch detail
- Hearth compact cutting
- onboarding preview variant
- landing specimen variant
- specialization fork detail
- Crest terminal detail

Do not independently invent a different Root for each route.

---

## Surface direction

### Public landing

Keep the core line:

> **What you do becomes who you are.**

Replace generic feature-card storytelling with one authored specimen showing action → visible permanent consequence.

Experiment with one restrained scroll-linked filament reveal only after the still composition works.

### Signup / login

Keep familiar forms, autofill, password-manager support, errors, and keyboard behavior.

Treat auth as an inscription/ownership moment connected visually to the same seed introduced on landing. Do not turn form controls into decorative artifacts.

### Onboarding

Keep:

- deterministic starter engine
- 13 authored goals
- Keep / Swap / Edit
- real timezone semantics
- real first quest
- first authoritative Seal
- keyboard and reduced-motion paths

Chosen intentions may illuminate a preview organism but must never imply earned XP before the first real Seal.

The same first quest and organism fragment should appear when the user enters Hearth.

### Hearth

Hearth is a daily ritual surface, not a dashboard.

Desired attention sequence:

**Ember → today → quest → Seal → consequence**

Reduce equal-weight statistic panels. Keep level, Sparks, and streak readable but quiet. Use one compact Root cutting instead of four small progression cards where possible.

Completed quests should remain in place and gain a permanent Seal impression.

### Root

The organism is the interface structure.

Use a botanical plate with labels/annotations in the margins rather than pills and dashed skill-tree connectors dominating the artwork.

Detailed requirements belong in selected-branch content rather than inside every node.

Desktop may show the complete organism; mobile should show one readable branch at a time with labeled tabs and equivalent semantic HTML actions.

### Specialization

Present the two choices as prospective limbs of the same organism, not pricing-style option cards.

Eligibility reveals possibility. Commitment happens only after authoritative confirmation.

### Trials

Present Trials as evidence folios.

- distinct-day Trials: dated impressions/evidence
- milestone/reflection Trials: declared intention, qualifying evidence, and reflection

Always distinguish:

- Trial started
- Trial complete
- Crest eligible
- Crest claimed

### Crest reveal

A Crest is a permanent terminal structure attached to the Root.

No crown emoji, confetti shower, or replay on every refresh. One restrained claim/reveal is enough.

### Satchel

Do not use an ecommerce grid as the final presentation.

Preferred direction:

- specimen drawer / field cabinet
- directly selectable items
- one large inspection surface
- clear preview / owned / equipped / purchase states

Prototype **Copper Halo first** before redesigning every item.

### Chronicle

Chronicle should answer:

> “What have I been doing, and what became permanent because of it?”

Prefer a continuous dated record with month dividers and milestone annotations over summary-card walls.

XP is supporting metadata, not the primary narrative.

Older history must remain reachable.

### Navigation

Use quiet journal-index marks, restrained active lines/notches, and labeled destinations.

Navigation must not visually compete with Ember, Root, or the current action.

### Settings

Treat Settings as the journal colophon: practical and calm.

Suggested sections:

- Your day
- Sound and motion
- Account

Do not ritualize simple preferences.

### Empty states

Show the legitimate starting condition rather than an empty bordered card:

- dormant seed
- unwritten date line
- unadorned vessel

Distinguish “nothing yet,” “nothing today,” and “everything sealed.”

### Reward moments

Routine sequence:

**Seal impression → Ember response → relevant Root tissue/light response → concise receipt**

If awarded XP is zero because of the cap, record the Seal but do not imply Root growth.

Reward motion should anchor to actual UI objects rather than fixed viewport coordinates.

### Mobile

Treat mobile as a deliberate pocket journal, not stacked desktop panels.

- one main object and one main action per working area
- body text starts at a readable 16px baseline
- metadata wraps instead of shrinking aggressively
- no required parallax, drag, pinch, or camera motion
- test 320, 375, 390px, tablet, desktop, keyboard, reduced motion, and 200% zoom

---

## Correctness findings that must precede visual polish

These findings were identified during the current source/screenshot audit and must be verified against repository state before implementation claims:

1. **Chronicle level:** do not derive level client-side. Consume the authoritative level already supplied by server state.
2. **Zero-XP reward copy:** capped completions must not say a branch grew when awarded XP is zero.
3. **Reward positioning:** reward travel must anchor to actual rendered objects/targets, not fixed viewport offsets.
4. **Satchel scaffold:** emoji/object placeholders are temporary and must not be mistaken for final relic presentation.
5. **Chronicle history reachability:** the permanent record needs access to older entries; the current route must be audited for pagination/continuation.
6. **First-Seal copy:** remove implementation language such as “authoritative transaction,” “No mock XP,” or choreography-stage explanations from emotional user-facing moments.
7. **Onboarding recovery:** the first-Seal multi-RPC flow must recover from partial success and reload without duplicate quests/rewards or an onboarding redirect loop.

Do not mark any of these fixed without current code/test evidence.

---

## Typography experiment policy

Current baseline remains **Fraunces + DM Sans** until a controlled experiment proves a better system.

Before comparing display families, verify that the current fonts actually load rather than silently falling back.

Test one display family at a time while keeping layout, copy, colors, and body type constant:

1. Fraunces — baseline
2. Newsreader
3. Instrument Serif
4. Alegreya
5. Young Serif
6. Literata if Chronicle long-form reading becomes central

Use at most two primary type families in the shipped product.

A font experiment happens **after** the winning composition is clear. Typography must not be used to disguise a generic layout.

---

## Experiment protocol

For every visual experiment:

1. Change one major variable.
2. Keep unrelated typography, palette, copy, and motion constant.
3. Inspect the still/resting state before animation.
4. Capture desktop + tablet + mobile screenshots.
5. Test keyboard, reduced motion, long text, empty/error states, and 200% zoom where relevant.
6. Decide keep / revise / reject.
7. Only then propagate the pattern to other surfaces.

Do not redesign every screen simultaneously.

---

## Ranked experience experiments

1. Replace one Root branch’s dominant node pills with layered anatomy and external labels.
2. Replace Hearth’s four progression cards with one compact authored Root specimen.
3. Remove unnecessary enclosing panels from Hearth while preserving content/order.
4. Anchor one reward trace to the actual Ember and affected Root fragment.
5. Carry the same first sealed quest and organism fragment from onboarding into Hearth.
6. Replace completed-row check treatment with an authored Seal impression.
7. Replace landing evolution/feature cards with one annotated before/after specimen.
8. Remove implementation jargon from First Seal and use plain action/consequence language.
9. Present specialization options as two prospective limbs.
10. Replace one distinct-day Trial progress bar with dated evidence impressions.
11. Build one large Satchel inspection view for Copper Halo.
12. Group Chronicle entries by date/month without individual cards.
13. Reveal one Crest as an authored Root terminal.
14. Replace navigation pills with quiet journal index marks.
15. Test Newsreader against Fraunces in the otherwise unchanged winning layout.

---

## Explicit non-goals for this phase

Do not automatically add:

- AI-generated quest dependency
- procedural Root geometry
- alternative progression math
- new game currencies
- social feeds
- generic achievement systems
- heavy rendering dependencies
- arbitrary new color systems
- multiple independent icon styles
- animations without a state/cause purpose

Any new backend state, tables, APIs, or heavy dependencies require a separate architecture/product decision.

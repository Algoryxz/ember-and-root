# Opening cinematic — forest and Ember discovery

**Superseded review:** the current route implements Playable Prologue V1 through the final Ember surge and black cut. See `docs/PLAYABLE_PROLOGUE_V1.md`. This document preserves the original image-edit prompts and prior iteration history.

Current preview: `/awakening`. This replaces the earlier match/portrait experiment on that route. The main landing and authenticated experience are unchanged. User's latest scene brief is authoritative for this prototype.

## Scope

Forest glowing-tree hotspot → deeper path hotspot → root chamber → approach the Ember hotspot → discovery. Contact, internal Ember, potential vision, shore, final statement, signup transition and progression are deliberately not implemented, pending user approval.

All controls are live semantic HTML. The actual targets are transparent 76×100 controls anchored to the same image coordinate system as the light. Pointer proximity reveals additional light and tiny prompts. Keyboard focus reveals a pale-gold outline and contextual prompt. Touch shows the prompts without needing hover. On mobile the composition shifts to the current target rather than shrinking the desktop frame.

The backdrop and emissive layer use the same edited plate, with a local mask over the interactive region. Mist, bounded motes, guidance mark and Ember are separate layers. Background camera movement and mist stop under reduced motion; transitions become short opacity changes. Hidden tabs pause stage timers and idle animation. This is layered image compositing, not a physically simulated 3D forest. Sound is silent in this prototype.

Images preload before interaction and expose an inline retry on failure. The final discovery is a held scene with a small replay control, not a fake contact action. No database requests or earned state exist in this component.

## Provenance

The five user-supplied JPEGs are copied unchanged into `docs/design-references/opening/`: `internal-glow.jpeg`, `forest.jpeg`, `root-chamber.jpeg`, `match.jpeg`, `storm-shore.jpeg`. Original creator, source URL and licensing were not provided. They are recorded as user-supplied references, not claimed as original team art. Only forest and root-chamber are adapted in this implementation. The anatomical heart reference is archived only; it is not implemented.

Production edits: `public/opening/forest.png`, `public/opening/root-chamber.png`, generated with the built-in OpenAI image editing tool. No extra runtime dependency or external component source was added.

### Forest edit prompt

> Edit this supplied forest scene into a clean production background plate. Preserve the exact dark forest visual identity, tree positions, orange glowing flecks on bark, blue grey mist, central path and cinematic composition closely. Remove only the person and chest light in the centre, replacing with a continuous misty path leading deeper into the trees. No people, no text. Wide landscape, high quality. Keep fine tree markings warm and subtle, with a clearly visible glowing marking on the tree at about 70% across and 55% down. This is a first-person RPG scene, not a poster.

### Root chamber edit prompt

> Edit this exact root chamber into a clean interactive game background. Preserve closely the enormous tangled tree roots, the cave scale, dark blue-black recesses, intricate orange brown bark and composition. Remove the person and torch entirely. In their place continue the ground roots naturally. At the central vanishing point about x55% y53%, form a small dark cradle of roots with empty space above it. NO fire or Ember in the image; the interactive flame will be composited separately. Warm amber light softly grazes roots around this cradle, nowhere else bright. No people, no text, no symbols, no bonfire. Cinematic wide landscape. Keep the dramatic existing root architecture rather than inventing a different environment.

## Verification

Run `node scripts/verify-opening.mjs` with the local preview on port 4123. Evidence lives in `docs/screenshots/opening/`. The script checks all scene hotspots at 1440, 768, 390, 375 and 320 pixels; keyboard/touch progression, replay, reduced motion, image failure/retry, overflow, axe accessibility, runtime exceptions and absence of mutation requests.

Visual acceptance remains pending. No claim is made that the later cinematic or full deployed integration gate is complete.

Current results: typecheck PASS; lint PASS; unit tests PASS (9 files, 38 Vitest tests); production build PASS; five-width scene verification PASS, including axe, replay, reduced motion and asset recovery. A 720×450 production viewport is also checked for constrained desktop layout; it is not a browser-menu zoom certification. The separate CSS-zoom experiment showed vertical scene enlargement, so no blanket 200% zoom claim is made. No public deployment was performed.

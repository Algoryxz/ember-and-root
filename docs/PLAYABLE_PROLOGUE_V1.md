> Superseded by [Playable Prologue V2](PLAYABLE_PROLOGUE_V2.md), including the storm shore and real game entry. V1 evidence is retained as a baseline.

# Playable Prologue V1 — phase one

Preview: `http://localhost:4123/awakening`. Review gallery: `docs/review/prologue-v1/index.html`.

The current brief supersedes the earlier forest discovery hold. This version ends after the player activates the Ember: camera push → one root-light surge → Ember expands → black. No inner awakening, storm shore, authentication changes, or progression is implemented.

## Implementation

The sequence uses React, existing Motion for React for DOM fades, CSS compositor transforms and 2.5D matte layers. No Three.js/R3F/Drei dependency was added: this phase does not require a full 3D environment. Near layers are masked copies of the supplied-image-derived mattes; their faster movement provides parallax. This is not a claim of reconstructed 3D root geometry or physical lighting simulation.

Authored camera stops:

1. Forest: low, dark composed view; gentle background breathing; glowing tree hotspot.
2. Guided forest: 1.1× tracking push with faster foreground motion and mobile crop shift; previous guidance fades and the path activates.
3. Chamber: 3.1-second root-arch reveal. Both scene layers overlap during the transition; no intervening black cut. The distant Ember is small relative to the roots.
4. Ember close: 2.2-second push to 1.55× with the destination brought toward frame centre.
5. Reach: 1.45-second final push, one local emissive surge, flame expansion, then black. The end screen is explicitly a review stop with discreet replay.

Pointer proximity brightens the destination's emissive mask, draws bounded particles inward and pauses/reduces ambient motion. Touch uses the same scene targets; keyboard uses semantic buttons, visible focus and focus transfer between stops. Skip is always available, including loading/failure, and moves to the review endpoint. Reduced motion provides composed states and short fades without rush, sway or particle animation. Sound is intentionally absent.

## Assets and resource budget

| Texture | Dimensions | Encoded bytes | Approx. decoded RGBA |
|---|---:|---:|---:|
| forest.webp | 1730×909 | 160,406 | 6.00 MiB |
| root-chamber.webp | 2009×783 | 203,888 | 6.00 MiB |
| Total | | 364,294 | 12.00 MiB |

The source PNGs total 4,623,086 bytes. WebP saves approximately 92.1% without resizing. PNG source variants and the original supplied JPEG references are retained; runtime requests only the WebPs. Root textures load after the first interaction rather than delaying the forest. A failed load exposes a retry.

There are 10 motes per layer, with hidden-layer animation paused; no unbounded particle emitter. There is no WebGL canvas or render loop, so instancing, canvas DPR caps and mesh LOD do not apply. Raster texture resolution is bounded as above; additional compositor surfaces may consume memory beyond decoded texture bytes. The mobile measurement uses DPR 2, not a claim that browser DPR is capped in production.

## Performance and bundle evidence

Measured against the local production build in Chrome, with recording disabled during measurement. Values below are requestAnimationFrame cadence, not instrumented GPU-presented frame counts. Phone results are desktop-browser mobile emulation with 4× CPU throttling, not physical mid-range-device certification.

| Stage | Desktop 1440×900, DPR 1 | Mobile emulation 390×844, DPR 2, CPU 4× |
|---|---:|---:|
| Forest | 60.0 FPS | 60.0 FPS |
| Guided forest | 59.8 FPS | 55.0 FPS |
| Chamber reveal | 57.8 FPS | 57.7 FPS |
| Ember close | 60.0 FPS | 58.5 FPS |
| Final surge | 52.6 FPS | 54.2 FPS |

95th-percentile sampled intervals were 16.8–17.0 ms; isolated longer frames reduced the stage averages. The strict 60 FPS desktop target is not met throughout the final surge. Real-phone profiling remains necessary before a release-performance claim. Full samples and counts of intervals above 33.4 ms: `docs/review/prologue-v1/performance.json`.

Next production build reports `/awakening` route code 2.54 kB and first-load JS 130 kB, versus 2.07 kB / 89.4 kB for the preceding prototype. First-load increase: approximately 40.6 kB, primarily the requested Motion DOM overlay support. No package/lockfile changes. Bundle figures are Next's build-reported estimates, not texture transfer sizes.

## Review evidence

- Desktop requested stills: `1440-forest.png`, `1440-guided.png`, `1440-chamber.png`, `1440-discovery.png`.
- Mobile requested stills: `390-forest.png`, `390-discovery.png`.
- Recording: `forest-to-ember.webm`, 1440×900, 20.08 seconds, 2,202,328 bytes. Playwright's recording encoder is 25 FPS; this is separate from measured scene cadence.
- All captures reside in `docs/review/prologue-v1/`.
- Five-width flow checks: 1440×900, 768×1024, 390×844, 375×812, 320×700. Each hotspot is at least 44 pixels and remains in the viewport. No horizontal overflow or browser exceptions were recorded. No progression/mutation requests were made.
- Normal and reduced-motion keyboard traversal, focused replay, skip cancellation during entry and lazy chamber-texture failure/retry passed. The gallery's six required images and playable video metadata were checked. Axe reported no violations at the tested endpoint; this is not a full manual assistive-technology audit.
- Typecheck, lint, unit tests (9 files / 38 Vitest tests) and production build passed. Full deployed auth/database release checks are outside this presentation-only scope.

Scripts: `scripts/review-prologue.mjs`, `scripts/measure-prologue.mjs`. The production capture rerun uses `--capture-only` and preserves the full five-width verification report.

## Provenance

The forest and root chamber derive directly from user-supplied references, edited with the built-in image tool in the preceding iteration. Creator/license/source URL were not supplied. Original references and generated PNGs are preserved. WebP conversion in this iteration changes encoding only. Exact image-edit prompts: `docs/OPENING_FOREST_PROTOTYPE.md`. Attribution ledger: `docs/ATTRIBUTIONS.md`.

Art-direction approval remains pending. This package intentionally ends at black; no later scene is authorized by this implementation.

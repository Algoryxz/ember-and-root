# Playable prologue V2 — world entry

This implementation supersedes the V1 phase-one stopping gate, following the user's approved extension on 2026-09-13.

## Implemented flow

`/` and `/awakening` now run forest → guidance → root chamber → discovery → contact surge → internal Ember → rear shore → side shore → frontal shore → game choices.

The existing forest hotspots remain the controls. Contact unmounts the forest/root layers. The internal Ember uses the same character and sternum light as the shore, with restrained illumination and no earned attributes, XP, levels, or reward mutation. Shore angles are authored matte compositions blended over an approximately 13-second timeline, with a semantic Continue equivalent and discreet Skip control. Clouds, ocean, and mist move independently of the character.

Begin Your Path pushes into the chest, blooms copper, then enters the actual `/signup` route. Returning Player uses a different push into `/login`. Both routes retain their existing server actions and validation, with semantic forms styled as the same world's entry ritual. Onboarding inherits the chamber environment. The authenticated shell has compact labeled navigation, the Hearth's Ember/quest/Root arrangement, unboxed Root presentation over canonical geometry, a physical relic cabinet treatment, and Chronicle trail entries.

## Review

- [Gallery and recording](review/prologue-v2/index.html)
- [All public viewports](review/prologue-v2/verification.json)
- [Production captures](review/prologue-v2/production-capture.json)
- [Authenticated routes](review/prologue-v2/game-verification.json)
- [Additional game widths and zoom-equivalent layout](review/prologue-v2/game-additional.json)
- [Asset recovery and zoom-equivalent entry](review/prologue-v2/recovery.json)
- [Performance samples](review/prologue-v2/performance.json)
- [Texture manifest](review/prologue-v2/assets.json)

The public path was exercised with keyboard/touch at 1440, 768, 390, 375, and 320 pixels, including reduced motion and Skip → Sign In. The 720×450 CSS viewport checks the layout equivalent of 200% zoom on a 1440×900 display; it is not claimed as a browser-chrome zoom shortcut test. Real protected routes were captured through a temporary authenticated review account, then the empty review account was removed. No cinematic progression requests or runtime errors were observed.

TypeScript, lint, production build, 38 Vitest tests across 9 files, and 15 targeted Playwright tests pass. The live database harness passes 204/204 checks. Its old conflict test happened to use today's date as the supposedly different occurrence; that assertion now guarantees a different payload. Harness accounts are retired using Auth soft deletion because immutable progression history intentionally cannot be deleted. No migration, reward rule, or server mutation implementation changed.

## Performance and limitations

Local production Chrome frame-callback cadence: desktop shore approximately 59–60 FPS, surge 55.9 FPS; CPU-throttled mobile emulation shore approximately 59–60 FPS, surge 56.7 FPS. The short inner-Ember entry samples 57.6 FPS on mobile emulation. After the final weather-edge compositing fix, a separate six-second steady shore sample measured 60 FPS in both profiles; see [final shore sample](review/prologue-v2/final-shore-performance.json). A locked 60 FPS across the entire flow or physical-phone result is not claimed.

The new shore textures add 333,252 bytes. All four cinematic WebP textures total 697,546 bytes. First-load JavaScript is 131 kB, approximately 1 kB above V1's rounded 130 kB. No new dependencies, Three.js scene, or extra motion library were added. The browser manages CSS texture/compositor allocation; forest and shore layers are not active simultaneously. Shore assets preload in the chamber, share their exact URLs with the renderer, and have an explicit retry state.

This is 2.5D matte compositing with three authored character angles, not continuous volumetric orbit or physically simulated water. The environment motion is intentionally approximate. Sound is absent; the experience works silently. Authenticated screenshots use a fresh character, so they do not demonstrate later mastery states or populated Chronicle history. Existing game behavior is preserved rather than replaced with decorative fake state.

Source images remain in `docs/design-references/opening/`. Adaptation details and source-rights uncertainty are recorded in [ATTRIBUTIONS](ATTRIBUTIONS.md). This is a local review build, not a deployed or pushed change.

# The Self Within — five-beat prototype

**Archived experiment:** `/awakening` now serves the forest/chamber prototype described in `docs/OPENING_FOREST_PROTOTYPE.md`. The implementation notes and screenshots below document the earlier portrait study, not the current route.

Local route: `/awakening`. Deliberately separate from the existing landing page while the first five beats await review. No search indexing. No progression, authentication, database, package, or canonical Root changes.

User's 2026-09-13 final art direction supersedes earlier visual concept exploration for this study. The full narrative remains match → human → internal Ember → four latent attributes → human-to-Root descent → statement → Begin Your Path. Only the first five beats are implemented here.

## Implemented interaction

- Darkness with unlit match and barely visible person.
- Strike button supports click, tap, Enter/Space, or a horizontal swipe across the control. A 760 ms authored friction/spark/catch motion reveals the flame.
- Human reveal uses a photographic plate masked by light whose position responds to the mouse. The photographic hand and match become brighter when fire catches.
- Bring the light within starts a guided 1,500 ms approach for all input methods. The light mask follows toward the sternum.
- Flame collapse: 280 ms. Blackout: 140 ms. First inner pulse: 1,150 ms, settling into a still internal Ember. A second lighting plate changes the actual chest/neck surface illumination.
- No sound, so the complete experience works silently. Optional sound remains unimplemented.
- Reduced motion uses direct dark → lit → Ember states, without travel, blackout, flicker, or scaling. OS preference takes precedence; a local control can reduce motion further.
- Skip goes to the final study state. Replay returns to darkness. Effect cleanup cancels pending progression when skipping/replaying. Hidden tabs pause CSS animation and stage timers.
- Image load failure has an inline reload action; loading gates the strike until the two body plates are available.

## Review decision

**REVISE / awaiting art-direction review**, not approved for landing integration.

The first SVG-only figure was rejected during browser inspection because it read as a mannequin illustration. Paired generated photographic plates improve surface volume. Remaining limitations: ordinary dark clothing rather than the requested seamless sculptural body; masked photographic hand rather than fully volumetric lighting; discrete paired lighting states rather than physically simulated light transport. These should be judged in motion before approving the next beats. No attribute awakening, Root descent, final title, or game CTA has been implemented.

## Evidence

Baseline: `docs/screenshots/awakening-baseline.png` (existing landing before this prototype).

Executable checks: `node scripts/verify-awakening.mjs` against a local server on port 4123. Captures dark, human reveal, and inner Ember at 1440×900, 768×1024, 390×844, 375×812, 320×700. Checks keyboard progression, replay/skip cancellation, pointer influence, touch with reduced motion, horizontal overflow, control size/reachability, axe accessibility, runtime errors, and absence of mutation requests. Also verifies image failure/retry and 200% CSS zoom (not a claim of physical-device or browser-menu zoom testing).

Results are saved to `docs/screenshots/awakening/verification.json`. This is prototype verification, not the repository's full deployed integration gate. Live DB tests are outside the changed presentation-only scope.

Current local results (2026-09-13): typecheck PASS; lint PASS; unit suite PASS (9 files, 38 Vitest tests plus node:test output); production build PASS; complete prototype browser script PASS against `next start`, including image-failure recovery. All five viewport runs had no axe violations, browser exceptions, horizontal overflow, or mutation requests. The initial unit-runner sandbox error was resolved by the approved unrestricted rerun. The production preview remains on port 4123.

Typography note: the repository declares Fraunces and DM Sans but currently contains no font files, font-face declarations, or font-loading imports. These captures use browser fallbacks. This prototype does not constitute a font-family comparison or final typography approval.

## Image generation record

Tool: built-in image generation. The first two sculpture attempts were rejected by the image service and produced no assets. The following two successful outputs are saved in `public/hero/`.

### Human plate — generation prompt

> Cinematic portrait photography asset, 1024x1536. One anonymous adult person standing facing camera, head to hips, both hands visible at sides. Wearing a plain seamless matte charcoal high-neck long-sleeved top. Androgynous face completely obscured by shadow, no hair detail, no jewelry. Pure black background. Natural human proportions, relaxed neutral stance. Extremely low-key warm amber grazing light coming from low left near abdomen catches realistic fingers, cheek edge, neck and chest volume. The charcoal garment nearly disappears in darkness and reads as a continuous sculptural human silhouette. Intimate grounded character-origin shot. Head centred at x50% y20%; sternum x50% y43%; hands y80%. Photographic organic texture, convincing shadow, muted bronze light. No graphics, no text, no light source visible, no lines, no glowing symbols, no environment, no special effects. Body occupies central 60% width. No blue light. This will serve as a dynamically relit plate in a cinematic web experience.

### Inner Ember plate — edit prompt

Input: the generated human plate.

> Edit this exact frame only for a second lighting state in an animation. Preserve perfectly the same person, silhouette, pose, framing, hands, garment, black background and dimensions. Remove most of the external illumination on the left edge. Add a tiny seedlike glowing amber Ember deep behind the centre sternum at exactly x50% y40% of the image. Its warm light is emanating from INSIDE the torso, illuminating the surrounding garment volume and nearby neck subtly from within, bright small amber core with local copper subsurface scattering. Small physically grounded glow, maximum illumination area only central chest. NOT a logo or heart symbol, no lines, no veins, no rays, no superhero effect. Keep most of the figure and face in deep shadow. Strongly preserve every outline and facial position for crossfading.

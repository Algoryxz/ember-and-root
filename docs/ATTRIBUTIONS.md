# Provenance & Attributions Ledger

This document serves as the mandatory provenance ledger for all external components, snippets, and interaction designs adapted or inspired within **Ember & Root**.

---

## 1. Animated Cards Stack

- **Creator:** YoucefBnm Bnm
- **Canonical URL:** `https://21st.dev/@youcefbnm/components/animated-cards-stack`
- **Status:** Interaction concept adapted.
- **Usage:**
  - Used in `features/onboarding/GoalDeck.tsx` for the stacking, depth, directional transitions, and card removal/insertion lifecycle.
  - **Visual departure:** Visuals were completely re-authored in Ember & Root's frozen illuminated field-journal visual language (warm parchment ground `#1D231D`, subtle sage/copper borders, Fraunces headings, DM Sans body). Testimonial designs from the original were discarded.

---

## 2. Tactile Button Interaction

- **Creator:** Petr Knoll
- **Canonical URL:** `https://21st.dev/@petrknoll/components/glass-button`
- **Status:** Interaction inspiration only (tactile press depth).
- **Usage:**
  - Used across `components/ui/Button.tsx` and onboarding choice controls (`features/onboarding/ChoiceCard.tsx`, `features/onboarding/GoalDeck.tsx`) for realistic physical press depth (`transform: translateY(1px-2px)` with compressed shadow) on `:active` states.
  - **Zero Glassmorphism Rule:** Glassmorphism, translucent blurs, and blue/purple gradient visuals are strictly forbidden per `docs/UI_UX_BRIEF.md` and were not implemented. Styling adheres strictly to the frozen palette (`--color-ember`, `--color-surface`, `--color-focus`).

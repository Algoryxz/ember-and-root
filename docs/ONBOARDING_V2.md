# Ember & Root — Onboarding V2 Specification & Architecture

## 1. Purpose & Vision

Replace the single-step timezone prompt with a choice-first onboarding journey that introduces players to the core Life RPG loop through real action:

> **Choose what matters → choose intensity → choose available time/rhythm → receive deterministic starter quests → Keep / Swap / Edit → confirm timezone → choose first quest → perform first REAL authoritative Seal → Ember kindles → first Root filament wakes → enter Hearth.**

The player learns Ember & Root by experiencing it:
- A real task is confirmed by the server.
- The Ember stirs and transitions to Kindled.
- The Root awakens with its first living filament.
- What the player does becomes who they are.

---

## 2. Architectural Invariants

1. **Server Authority:**
   - Client **never** calculates XP, Sparks, levels, streaks, or Ember state.
   - Rewards are consumed strictly from the server's `MutationResult`.
2. **True Gateway Climax:**
   - `preferences.onboarded` is **never set to true** until after the first real authoritative Seal (`complete_quest`) succeeds.
   - If the player leaves early or reloads, they remain in the onboarding flow until their first quest is inscribed and sealed.
3. **Idempotency & Retry Safety:**
   - UUID request IDs are generated once on client mount:
     - `onboardingRequestId`
     - `questRequestIds` (per starter template)
     - `firstSealRequestId`
   - If a network error occurs, the client retries with the **exact same request IDs**, ensuring `mutation_receipts` replays without duplicate quests or extra XP.
4. **Frozen Visuals & Materials:**
   - Illuminated Field Journal theme (`#141713` ground, `#1D231D` surface, `#F0E7D3` parchment text, `#E98A4B` Ember, `#9FBA87` Root sage).
   - Fraunces (headings) + DM Sans (UI/body).
   - Motion for React (`motion/react`) with full reduced-motion immediate fallbacks.
   - No Three.js, GSAP, or Lottie.

---

## 3. Step-by-Step Flow

```
Step 1: Goal Selection (GoalDeck.tsx)
  │  - Field-journal leaves stack (21st.dev YoucefBnm Bnm interaction concept)
  │  - 13 authored goals across Mind, Body, Will, Craft
  │  - Player chooses 2 to 4 intentions via [Choose] and [Not for me]
  ▼
Step 2: Intensity Calibration (ChoiceCard.tsx)
  │  - Keep it light (Quick-heavy)
  │  - Balanced (Standard-heavy)
  │  - Push me (Deep-heavy)
  ▼
Step 3: Available Time & Rhythm (ChoiceCard.tsx)
  │  - Available time: 5-15m, 15-30m, 30-60m, 60+m
  │  - Preferred rhythm: Morning, Afternoon, Evening, Flexible
  ▼
Step 4 & 5: Deterministic Starter Quests (StarterQuestDeck.tsx)
  │  - recommendStarterQuests(): pure deterministic engine
  │  - 3–5 tailored suggestions
  │  - Player actions: Keep, Swap, Edit
  │  - 2 to 4 quests kept
  ▼
Step 6: Timezone Confirmation
  │  - Silently detected from Intl.DateTimeFormat
  │  - Displayed: "Your day resets in [Timezone]"
  │  - [Looks Right] proceeds; [Change] reveals IANA datalist
  ▼
Step 7 & 8: First Quest Selection & Real Seal (FirstSeal.tsx)
  │  - "BEGIN WITH ONE SMALL ACT"
  │  - Authoritatively creates kept quests via create_quest RPC
  │  - Seals chosen first quest via complete_quest RPC
  │  - Updates preferences.onboarded = true
  │  - First-Seal motion choreography:
  │      Seal lands (100ms) → Ember warms (250ms) → Light trace travels (500ms) → Root sprout wakes (400ms)
  │  - Climax display: "THAT'S THE LOOP. What you do becomes what grows."
  │  - Displays actual returned XP, Sparks, and Ember state
  ▼
Hearth Entry (/hearth)
     - Player enters Hearth with Ember already kindled and 1 quest sealed in history
```

---

## 4. Verification & Testing

- Unit tests: `features/onboarding/recommendStarterQuests.test.ts`
- E2E Playwright tests: `tests/e2e/onboarding-v2.spec.ts`
  - End-to-end full flow verification.
  - Viewports: 1440x900, 768x1024, 390x844, 320x700 with zero horizontal overflow.
  - Full keyboard accessibility with `:focus-visible` pale gold rings.
  - `prefers-reduced-motion` compliance.

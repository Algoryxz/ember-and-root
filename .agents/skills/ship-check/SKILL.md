---
name: ship-check
description: Performs Ember & Root release-readiness checks across production deployment, authentication, persistence, accessibility, mobile behavior, repository deliverables, README/environment setup, and demo-video requirements.
---

# Ship Check Skill

## Purpose

Use this skill when preparing a release candidate, verifying the production URL before recording the demo, or completing final submission checks.

**All checks must be performed on the deployed Vercel URL, not on localhost.** Local success is not sufficient evidence.

---

## Required Reading

Before running this check, read:

1. `docs/IMPLEMENTATION_PLAN.md` — submission deliverables and T+15 to T+24 checkpoints
2. `docs/APP_FLOW.md` — exact expected behavior for each user flow
3. `docs/PRD.md` § "Required Quality Bar" — the non-negotiable requirements

---

## Production Spine Checks

Verify each of the following on the deployed production URL using a signed-in account:

| # | Check | Method |
|---|-------|--------|
| 1 | Sign up with a new email creates an account and lands on onboarding | Manual |
| 2 | Timezone confirmed and saved; redirect to Hearth | Manual |
| 3 | Log in with existing account resumes session | Manual |
| 4 | Create a quest (all fields); quest appears in journal | Manual |
| 5 | Edit a quest; changes persist after refresh | Manual |
| 6 | Delete a quest (soft-delete); quest disappears from journal | Manual |
| 7 | Complete a quest; XP and Sparks update exactly once | Manual |
| 8 | Complete same quest again (or retry with same requestId); no duplicate XP | Manual |
| 9 | Hard refresh on Hearth; quest list, Ember state, level, Sparks retained | Manual |
| 10 | Navigate to Root; branch XP reflects completions | Manual |
| 11 | (If applicable) Choose specialization; branch fork visible after refresh | Manual |
| 12 | (If applicable) Start Trial; progress shows; subsequent completions count | Manual |
| 13 | (If applicable) Claim crest; crest visible on Root after refresh | Manual |
| 14 | Purchase item in Satchel; Sparks balance decremented; item in inventory | Manual |
| 15 | Equip item; Hearth adornment updated; persists after refresh | Manual |
| 16 | Chronicle shows completion history, streak counts, derived achievements | Manual |
| 17 | Sign out; session cleared; redirect to login page | Manual |
| 18 | Open same account on second device or incognito tab; identical state visible | Manual |

---

## Security and Integrity Checks

| # | Check | Method |
|---|-------|--------|
| 1 | Unauthenticated POST to a progression endpoint returns 401/403 | Playwright or curl |
| 2 | Two accounts: user B cannot see user A's quests or completion history | Playwright two-account test |
| 3 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` is present in client bundle; `SUPABASE_SERVICE_ROLE_KEY` is not | Check browser network tab / bundle |
| 4 | Double-click on "Complete quest" results in one XP award | Playwright test or manual with DevTools throttling |

---

## Accessibility Checks

| # | Check | Method |
|---|-------|--------|
| 1 | Tab through Hearth: all quest rows, "New quest" button, navigation reachable | Keyboard manual |
| 2 | Create quest dialog: opens on Enter/Space on trigger, Tab cycles fields, Escape closes | Keyboard manual |
| 3 | Dialog close: focus returns to the trigger element that opened it | Keyboard manual |
| 4 | Quest completion: operable by keyboard alone | Keyboard manual |
| 5 | Root attribute tabs: navigable by keyboard; branch state readable | Keyboard manual |
| 6 | Specialization choice dialog: keyboard operable; confirm step works | Keyboard manual |
| 7 | Focus ring visible at every keyboard stop (pale-gold outline) | Visual inspection |
| 8 | Quest completion `aria-live` announcement heard in screen reader (or check DOM region) | NVDA/VoiceOver or DOM check |
| 9 | axe-core passes on Hearth, Root, Satchel, Chronicle routes | `npx playwright test --grep axe` or axe DevTools |
| 10 | Reduced motion: toggle `prefers-reduced-motion` in OS settings; animations swap to immediate state | OS setting + manual |
| 11 | Sound off (default): all information available visually | Visual inspection |
| 12 | WCAG AA color contrast on primary text and interactive elements | Browser DevTools or Colour Contrast Analyser |

---

## Mobile Checks

| # | Check | Method |
|---|-------|--------|
| 1 | Hearth at 320px: no horizontal overflow, no hidden last row | Chrome DevTools mobile sim |
| 2 | Hearth at 375px: all quest rows tappable, "Complete quest" has adequate target | Chrome DevTools |
| 3 | Hearth at 390px: layout correct | Chrome DevTools |
| 4 | Bottom navigation visible; all four tabs labeled | Visual inspection |
| 5 | Safe-area padding at bottom (notched devices) | iPhone SE / real device or sim |
| 6 | Root at 375px: one branch readable per tab; no drag/zoom required | Chrome DevTools |
| 7 | Satchel at 375px: all three items readable, purchase flow works | Chrome DevTools |
| 8 | 200% browser zoom: no content clipped, no overflow | Desktop browser, 200% zoom |
| 9 | Landscape smoke: no layout breakage at 667px tall / 375px wide | Chrome DevTools |

---

## Failure Behavior Checks

| # | Check | Method |
|---|-------|--------|
| 1 | Submit quest create with empty title: inline validation error, no server call | Manual |
| 2 | Purchase with insufficient Sparks: inline "Not enough Sparks" error, balance unchanged | Manual (seed low-balance account) |
| 3 | Slow network (6x throttle in DevTools): pending state shows; UI usable | Chrome DevTools Network throttle |
| 4 | Kill network mid-quest-completion: row returns to active state; error message shown | Chrome DevTools offline mode |
| 5 | Session expired (delete cookie manually): refresh redirects to login without blank screen | Manual cookie delete |

---

## Repository and Submission Checks

| # | Check | Method |
|---|-------|--------|
| 1 | Repository is **public** on GitHub | Open in signed-out browser |
| 2 | Meaningful chronological commits exist (not just one squashed blob) | `git log --oneline` |
| 3 | Backend code (migrations, RPC functions, server actions) is present in repo | Browse repo on GitHub |
| 4 | README has: name, stack, setup steps that actually work, env variable list | Follow README from scratch |
| 5 | `.env.example` committed with variable names and no secret values | `cat .env.example` |
| 6 | Production Vercel URL loads without errors | Browser signed-out |
| 7 | Demo video is 90–180 seconds long | Check video duration |
| 8 | Demo video file or link is accessible from a signed-out browser | Open link in incognito |
| 9 | Demo video is ≤ 100 MB | Check file size |
| 10 | Demo video shows: signup/login, quest create, quest complete, Root growth, specialization, purchase, equip, refresh persistence | Review video content |

---

## Output Format

Return a table with three columns: **Check**, **Status** (`PASS` / `BLOCKER` / `WARNING`), **Notes**.

```
| Check | Status | Notes |
|-------|--------|-------|
| Sign up creates account | PASS | Tested on prod URL |
| User isolation | BLOCKER | User B can still see User A's quests |
| axe-core Hearth route | WARNING | 2 contrast issues on secondary text |
```

**Do not call the project ready to submit while any BLOCKER item remains unresolved.**

WARNINGs should be documented but do not block submission if they are minor and acknowledged.

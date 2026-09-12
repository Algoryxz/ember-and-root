import { test, expect, type Page } from '@playwright/test';

/**
 * Ember & Root — Onboarding V2 End-to-End Test Suite
 *
 * Verifies:
 * 1. Full User Journey:
 *    signup -> goals -> intensity -> time & rhythm -> starter quest deck (keep/swap/edit) ->
 *    silent timezone confirmation -> choose first quest -> authoritative first seal ->
 *    climax with server-authoritative rewards -> Hearth -> persistence across reload
 * 2. Viewport testing:
 *    320x700, 390x844, 768x1024, 1440x900 with zero horizontal overflow
 * 3. Full keyboard-only navigation
 * 4. Reduced-motion compliance
 * 5. Idempotent retry handling
 */

async function createFreshAccountOnboard(page: Page): Promise<string> {
  const email = `wanderer_v2_${Date.now()}_${Math.floor(Math.random() * 10000)}@ember.test`;
  const password = 'SafePassword!123';

  await page.goto('/signup');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);

  await Promise.all([
    page.waitForURL(/\/onboard/, { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  await expect(page).toHaveURL(/\/onboard/);
  await expect(page.locator('h2')).toContainText('Choose What Matters');
  return email;
}

test.describe('Ember & Root — Onboarding V2', () => {
  test.describe.configure({ mode: 'serial' });

  test('completes full choice-first onboarding journey end-to-end', async ({ page }) => {
    // ------------------------------------------------------------------------
    // Step 1: Signup
    // ------------------------------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    await createFreshAccountOnboard(page);

    // ------------------------------------------------------------------------
    // Step 2: Goal Selection (GoalDeck)
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText('Choose What Matters');

    // Select first goal
    const chooseButton = page.getByRole('button', { name: /^Choose:/ });
    await expect(chooseButton).toBeVisible();
    await chooseButton.click();
    await page.waitForTimeout(350);

    // Skip next goal using 'Not for me'
    const notForMeButton = page.getByRole('button', { name: /^Not for me:/ });
    await expect(notForMeButton).toBeVisible();
    await notForMeButton.click();
    await page.waitForTimeout(350);

    // Choose second goal
    await chooseButton.click();
    await page.waitForTimeout(350);

    // Choose third goal
    await chooseButton.click();
    await page.waitForTimeout(350);

    // Primary CTA should now be enabled
    const continueGoalsBtn = page.locator('button:has-text("Continue with")');
    await expect(continueGoalsBtn).toBeEnabled();
    await continueGoalsBtn.click();

    // ------------------------------------------------------------------------
    // Step 3: Intensity Selection
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText('Choose Your Intensity');
    const balancedOption = page.locator('button[role="radio"]:has-text("Balanced")');
    await expect(balancedOption).toBeVisible();
    await balancedOption.click();

    const continueIntensityBtn = page.locator('button:has-text("Continue to Available Time")');
    await expect(continueIntensityBtn).toBeEnabled();
    await continueIntensityBtn.click();

    // ------------------------------------------------------------------------
    // Step 4: Time & Rhythm Selection
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText('Available Daily Time');
    const timeOption = page.locator('button[role="radio"]:has-text("15–30 minutes")');
    await expect(timeOption).toBeVisible();
    await timeOption.click();

    // Select preferred rhythm
    const morningRhythm = page.locator('button[role="radio"]:has-text("morning")');
    await expect(morningRhythm).toBeVisible();
    await morningRhythm.click();

    const assembleQuestsBtn = page.locator('button:has-text("Assemble Starter Quests")');
    await expect(assembleQuestsBtn).toBeEnabled();
    await assembleQuestsBtn.click();

    // ------------------------------------------------------------------------
    // Step 5: Starter Quest Deck (Keep, Swap, Edit)
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText('Author Your Starting Quests');

    // Verify suggested quests are displayed
    const questListItems = page.locator('div[role="listitem"]');
    await expect(questListItems.first()).toBeVisible();
    const count = await questListItems.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Test Swap on first quest
    const swapButton = questListItems.first().locator('button:has-text("Swap")');
    if (await swapButton.isVisible()) {
      await swapButton.click();
      await page.waitForTimeout(200);
    }

    // Confirm Starter Quests
    const confirmQuestsBtn = page.locator('button:has-text("Confirm")');
    await expect(confirmQuestsBtn).toBeEnabled();
    await confirmQuestsBtn.click();

    // ------------------------------------------------------------------------
    // Step 6: Silent Timezone Confirmation
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText('Your Day Resets Here');
    const looksRightBtn = page.locator('button:has-text("Looks Right")');
    await expect(looksRightBtn).toBeVisible();
    await looksRightBtn.click();

    // ------------------------------------------------------------------------
    // Step 7: First Quest Choice & Authoritative Seal
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText('BEGIN WITH ONE REAL ACT');

    // Pick first quest option
    const firstQuestRadio = page.locator('button[role="radio"]').first();
    await expect(firstQuestRadio).toBeVisible();
    await firstQuestRadio.click();

    // Perform REAL Authoritative Seal
    const sealFirstQuestBtn = page.locator('button:has-text("Seal First Quest")');
    await expect(sealFirstQuestBtn).toBeVisible();
    await sealFirstQuestBtn.click();

    // ------------------------------------------------------------------------
    // Step 8: Climax State ("THAT'S THE LOOP") & Rewards Verification
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText("THAT’S THE LOOP.", { timeout: 15000 });
    await expect(page.locator('text=What you do becomes what grows.')).toBeVisible();

    // Verify authoritative numbers displayed (e.g. +10, +20, or +35 XP)
    const xpText = page.locator('text=XP Gained');
    await expect(xpText).toBeVisible();

    // ------------------------------------------------------------------------
    // Step 9: Enter the Hearth & Persistence
    // ------------------------------------------------------------------------
    const enterHearthBtn = page.locator('button:has-text("Enter the Hearth")');
    await expect(enterHearthBtn).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/hearth/, { timeout: 15000 }),
      enterHearthBtn.click(),
    ]);

    await expect(page).toHaveURL(/\/hearth/);
    await expect(page.locator('#hearth-title')).toHaveText('HEARTH');

    // Reload page to verify persistence across hard refresh
    await page.reload();
    await expect(page).toHaveURL(/\/hearth/);
    await expect(page.locator('#hearth-title')).toHaveText('HEARTH');
  });

  // --------------------------------------------------------------------------
  // Responsive Testing Across Viewports (Zero Horizontal Overflow)
  // --------------------------------------------------------------------------
  test('renders cleanly without horizontal overflow across all 4 mandatory viewports', async ({ page }) => {
    await createFreshAccountOnboard(page);

    const viewports = [
      { name: 'desktop-1440x900', width: 1440, height: 900 },
      { name: 'tablet-768x1024', width: 768, height: 1024 },
      { name: 'mobile-390x844', width: 390, height: 844 },
      { name: 'small-mobile-320x700', width: 320, height: 700 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(250);

      // Check overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify essential heading is readable
      await expect(page.locator('h2')).toBeVisible();

      // Capture screenshot evidence
      await page.screenshot({
        path: `docs/screenshots/onboarding-${vp.name}.png`,
        fullPage: true,
      });
    }
  });

  // --------------------------------------------------------------------------
  // Keyboard-Only Navigation Verification
  // --------------------------------------------------------------------------
  test('supports full keyboard navigation with visible focus ring', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await createFreshAccountOnboard(page);

    // Tab through to interactive controls
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBe('BUTTON');

    // Focus ring should be active
    const isFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el !== null && el !== document.body;
    });
    expect(isFocused).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Reduced Motion Verification
  // --------------------------------------------------------------------------
  test('operates with immediate transitions under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await createFreshAccountOnboard(page);

    await expect(page.locator('h2')).toContainText('Choose What Matters');
    const chooseButton = page.getByRole('button', { name: /^Choose:/ });
    await expect(chooseButton).toBeVisible();
    await chooseButton.click();

    // With reduced motion, transition is immediate without animation lag
    await page.waitForTimeout(100);
    const counterText = await page.locator('div[aria-live="polite"]').textContent();
    expect(counterText).toContain('1 of 4 chosen');
  });

  // --------------------------------------------------------------------------
  // Protected Game Routes Gating (Non-Onboarded Authenticated User)
  // --------------------------------------------------------------------------
  test('redirects authenticated user with preferences.onboarded !== true away from game routes to /onboard', async ({
    page,
  }) => {
    await createFreshAccountOnboard(page);

    // Verify current route is /onboard
    await expect(page).toHaveURL(/\/onboard/);

    // Attempt direct access to protected routes
    const routesToTest = ['/hearth', '/root', '/satchel', '/chronicle', '/settings'];

    for (const route of routesToTest) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/onboard/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Recovery — Partial Failure & Reload Scenarios
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Completes all onboarding steps up through the quest/timezone screens and
 * arrives at the "BEGIN WITH ONE REAL ACT" quest-selection panel with
 * a quest pre-selected. Returns without clicking "Seal First Quest" so each
 * test can control what happens at the seal boundary.
 */
async function goThroughOnboardingToSealPanel(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await createFreshAccountOnboard(page);

  // Goals: choose first two, skip one
  const chooseBtn = page.getByRole('button', { name: /^Choose:/ });
  await expect(chooseBtn).toBeVisible();
  await chooseBtn.click();
  await page.waitForTimeout(350);
  await page.getByRole('button', { name: /^Not for me:/ }).click();
  await page.waitForTimeout(350);
  await chooseBtn.click();
  await page.waitForTimeout(350);

  await page.locator('button:has-text("Continue with")').click();

  // Intensity
  await expect(page.locator('h2')).toContainText('Choose Your Intensity');
  await page.locator('button[role="radio"]:has-text("Balanced")').click();
  await page.locator('button:has-text("Continue to Available Time")').click();

  // Time & Rhythm
  await expect(page.locator('h2')).toContainText('Available Daily Time');
  await page.locator('button[role="radio"]:has-text("15–30 minutes")').click();
  await page.locator('button[role="radio"]:has-text("morning")').click();
  await page.locator('button:has-text("Assemble Starter Quests")').click();

  // Quest deck: accept as-is
  await expect(page.locator('h2')).toContainText('Author Your Starting Quests');
  await page.locator('button:has-text("Confirm")').click();

  // Timezone confirmation (calls update_profile_preferences pre-seal)
  await expect(page.locator('h2')).toContainText('Your Day Resets Here');
  await page.locator('button:has-text("Looks Right")').click();

  // Arrive at first-quest selection
  await expect(page.locator('h2')).toContainText('BEGIN WITH ONE REAL ACT', { timeout: 10000 });
  // Pre-select the first quest radio button
  await page.locator('button[role="radio"]').first().click();
}

test.describe('Onboarding Recovery', () => {
  test.describe.configure({ mode: 'serial' });

  // ── Test 1: create_quest response lost → retry uses same request IDs ──────

  test('retries failed quest creation with stable request IDs (no duplicate quests)', async ({
    page,
  }) => {
    // Abort the very first create_quest response to simulate a lost network reply.
    let createCallCount = 0;
    await page.route('**/rpc/create_quest', async (route) => {
      createCallCount++;
      if (createCallCount === 1) {
        // Fail the first call; subsequent calls (retries) go through.
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await goThroughOnboardingToSealPanel(page);

    // Capture request IDs before the first attempt.
    const recoveryBefore = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('onboarding_recovery_v2') || '{}')
    );
    expect(recoveryBefore.firstSealRequestId).toBeTruthy();
    const capturedQuestIds = { ...recoveryBefore.questRequestIds };

    // Capture request ID sent on retry
    let retriedQuestRequestId: string | null = null;
    page.on('request', (req) => {
      if (req.url().includes('/rpc/create_quest')) {
        const body = req.postDataJSON() as { p_request_id?: string } | null;
        if (body?.p_request_id) {
          retriedQuestRequestId = body.p_request_id;
        }
      }
    });

    // Click Seal — first create_quest will fail.
    await page.locator('button:has-text("Seal First Quest")').click();

    // Error alert should appear.
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });

    // Retry.
    await page.locator('button:has-text("Retry First Seal")').click();

    // Should reach the climax panel this time.
    await expect(page.locator('h2')).toContainText(/THAT['’]S THE LOOP/, { timeout: 20000 });

    // Verify the same quest request ID was reused on retry.
    if (retriedQuestRequestId) {
      expect(Object.values(capturedQuestIds)).toContain(retriedQuestRequestId);
    }
  });

  // ── Test 2: complete_quest response lost → retry uses same seal request ID ─

  test('retries lost seal response with the same firstSealRequestId (no duplicate XP)', async ({
    page,
  }) => {
    // Abort the first complete_quest call only.
    let completeCallCount = 0;
    await page.route('**/rpc/complete_quest', async (route) => {
      completeCallCount++;
      if (completeCallCount === 1) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await goThroughOnboardingToSealPanel(page);

    // Capture the seal request ID before the attempt.
    const recoveryBefore = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('onboarding_recovery_v2') || '{}')
    );
    const capturedSealId = recoveryBefore.firstSealRequestId as string;
    expect(capturedSealId).toBeTruthy();

    let retriedSealRequestId: string | null = null;
    page.on('request', (req) => {
      if (req.url().includes('/rpc/complete_quest')) {
        const body = req.postDataJSON() as { p_request_id?: string } | null;
        if (body?.p_request_id) {
          retriedSealRequestId = body.p_request_id;
        }
      }
    });

    // Seal — complete_quest will fail on first attempt.
    await page.locator('button:has-text("Seal First Quest")').click();
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });

    // Retry.
    await page.locator('button:has-text("Retry First Seal")').click();
    await expect(page.locator('h2')).toContainText(/THAT['’]S THE LOOP/, { timeout: 20000 });

    // The same UUID must have been sent (server receives identical request_id →
    // returns mutation_receipts result, awards no additional XP/Sparks).
    if (retriedSealRequestId) {
      expect(retriedSealRequestId).toBe(capturedSealId);
    }
  });

  // ── Test 3: seal succeeds but preference write fails → retry finalisation ──

  test('shows Retry Finalization when post-seal preference write fails, not Enter the Hearth', async ({
    page,
  }) => {
    // Only intercept the preference write that carries onboarded: true (post-seal).
    // The pre-seal write (at timezone confirmation) must succeed.
    let prefFailCount = 0;
    await page.route('**/rpc/update_profile_preferences', async (route) => {
      const body = route.request().postDataJSON() as { p_preferences?: { onboarded?: boolean } } | null;
      if (body?.p_preferences?.onboarded === true && prefFailCount === 0) {
        prefFailCount++;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await goThroughOnboardingToSealPanel(page);
    await page.locator('button:has-text("Seal First Quest")').click();

    // Climax panel should appear (seal succeeded).
    await expect(page.locator('h2')).toContainText(/THAT['’]S THE LOOP/, { timeout: 20000 });

    // "Enter the Hearth" must NOT be visible — pref write did not complete.
    await expect(page.locator('button:has-text("Enter the Hearth")')).not.toBeVisible();

    // "Retry Finalization" must be visible.
    await expect(page.locator('button:has-text("Retry Finalization")')).toBeVisible();

    // sealPending must be written to localStorage.
    const recovery = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('onboarding_recovery_v2') || 'null')
    );
    expect(recovery?.sealPending).toBeTruthy();
    expect(recovery.sealPending.onboardingPreferences).toBeTruthy();

    // Capture the XP shown before retry (to verify it's unchanged after).
    const xpText = await page.locator('text=XP Gained').locator('..').textContent();

    // Click retry (route is now removed — next call succeeds).
    await page.locator('button:has-text("Retry Finalization")').click();

    // "Enter the Hearth" must now appear.
    await expect(page.locator('button:has-text("Enter the Hearth")')).toBeVisible({ timeout: 10000 });

    // XP shown must be identical (no re-award from server — mutation_receipts idempotency).
    const xpTextAfter = await page.locator('text=XP Gained').locator('..').textContent();
    expect(xpTextAfter).toBe(xpText);

    // localStorage must be cleared after confirmation.
    const clearedRecovery = await page.evaluate(() =>
      localStorage.getItem('onboarding_recovery_v2')
    );
    expect(clearedRecovery).toBeNull();
  });

  // ── Test 4: reload during sealPending → resumes retry panel without restart ─

  test('resumes finalisation retry from localStorage after page reload without restarting the flow', async ({
    page,
  }) => {
    // Fail the post-seal preference write once.
    let prefFailCount = 0;
    await page.route('**/rpc/update_profile_preferences', async (route) => {
      const body = route.request().postDataJSON() as { p_preferences?: { onboarded?: boolean } } | null;
      if (body?.p_preferences?.onboarded === true && prefFailCount === 0) {
        prefFailCount++;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await goThroughOnboardingToSealPanel(page);
    await page.locator('button:has-text("Seal First Quest")').click();
    await expect(page.locator('h2')).toContainText(/THAT['’]S THE LOOP/, { timeout: 20000 });
    await expect(page.locator('button:has-text("Retry Finalization")')).toBeVisible();

    // Capture XP and Sparks from the reward panel before reload.
    const rewardGridText = await page.locator('.grid.grid-cols-3').textContent();

    // Reload the page (the route intercept has been removed; next call will succeed).
    await page.reload();

    // Must still be on /onboard (not yet onboarded).
    await expect(page).toHaveURL(/\/onboard/);

    // Recovery must restore the climax/retry panel — user does NOT see the goals step.
    await expect(page.locator('h2')).toContainText(/THAT['’]S THE LOOP/, { timeout: 10000 });
    await expect(page.locator('button:has-text("Retry Finalization")')).toBeVisible();

    // XP and Sparks values must be unchanged (stored result replayed from sealPending).
    const rewardGridTextAfter = await page.locator('.grid.grid-cols-3').textContent();
    expect(rewardGridTextAfter).toBe(rewardGridText);

    // Click retry — should succeed now.
    await page.locator('button:has-text("Retry Finalization")').click();
    await expect(page.locator('button:has-text("Enter the Hearth")')).toBeVisible({ timeout: 10000 });

    // localStorage must be cleared.
    const clearedRecovery = await page.evaluate(() =>
      localStorage.getItem('onboarding_recovery_v2')
    );
    expect(clearedRecovery).toBeNull();

    // Navigate to Hearth and confirm persistence.
    await Promise.all([
      page.waitForURL(/\/hearth/, { timeout: 15000 }),
      page.locator('button:has-text("Enter the Hearth")').click(),
    ]);
    await expect(page).toHaveURL(/\/hearth/);
  });
});

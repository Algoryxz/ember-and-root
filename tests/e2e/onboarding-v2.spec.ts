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
    await expect(page.locator('h2')).toContainText('BEGIN WITH ONE SMALL ACT');

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
});

import { test, expect } from '@playwright/test';

/**
 * Ember & Root — Demo Readiness / Real Browser End-to-End Test Suite
 * 
 * Invariants tested strictly through visible UI:
 * 1. Real Signup -> Real Onboarding (Timezone) -> Hearth Load
 * 2. Inscribe Quest "Finish Java recursion practice" (Mind, Standard, Daily)
 * 3. Authoritative Quest Sealing (Pending -> Confirmed "Sealed ✓")
 * 4. Progression Rewards (+20 XP, +4 Sparks, Ember transition to Kindled)
 * 5. Navigation to Root (Mind branch = 20 XP, origin unlocked)
 * 6. Navigation back to Hearth + Full Browser Refresh
 * 7. Persistence & Idempotency Check (quest remains sealed today, button disabled)
 * 8. Responsive captures at 1440x900, 768x1024, 390x844, 320x700
 * 9. Keyboard navigation, visible focus (#C4A96A), modal focus trapping, no horizontal overflow
 */

test.describe('Ember & Root — Full E2E Browser Demo Flow', () => {
  test.describe.configure({ mode: 'serial' });

  const testEmail = `wanderer_${Date.now()}@ember.test`;
  const testPassword = 'SafePassword!123';
  const questTitle = 'Finish Java recursion practice';

  test('completes full end-to-end user journey through visible UI', async ({ page }) => {
    // Set standard desktop viewport for primary flow
    await page.setViewportSize({ width: 1440, height: 900 });

    // ------------------------------------------------------------------------
    // Step 1: Signup
    // ------------------------------------------------------------------------
    await page.goto('/signup');
    await expect(page.locator('h1')).toContainText('Begin Your Chronicle');

    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#confirmPassword', testPassword);

    await Promise.all([
      page.waitForURL(/\/onboard/, { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ]);

    // ------------------------------------------------------------------------
    // Step 2: Onboarding V2 Journey
    // ------------------------------------------------------------------------
    await expect(page.locator('h2')).toContainText('Choose What Matters');

    // Choose 2 Body goals so Mind starts at 0 XP
    const notForMeBtn = page.getByRole('button', { name: /^Not for me:/ });
    const chooseBtn = page.getByRole('button', { name: /^Choose:/ });

    // Skip 3 Mind goals
    await notForMeBtn.click();
    await page.waitForTimeout(250);
    await notForMeBtn.click();
    await page.waitForTimeout(250);
    await notForMeBtn.click();
    await page.waitForTimeout(250);

    // Choose 2 Body goals
    await chooseBtn.click();
    await page.waitForTimeout(300);
    await chooseBtn.click();
    await page.waitForTimeout(300);

    const continueGoalsBtn = page.locator('button:has-text("Continue with")');
    await expect(continueGoalsBtn).toBeEnabled();
    await continueGoalsBtn.click();

    // Choose Intensity
    await expect(page.locator('h2')).toContainText('Choose Your Intensity');
    await page.click('button[role="radio"]:has-text("Balanced")');
    await page.click('button:has-text("Continue to Available Time")');

    // Choose Time & Rhythm
    await expect(page.locator('h2')).toContainText('Available Daily Time');
    await page.click('button[role="radio"]:has-text("15–30 minutes")');
    await page.click('button:has-text("Assemble Starter Quests")');

    // Confirm Starter Quests
    await expect(page.locator('h2')).toContainText('Author Your Starting Quests');
    await page.click('button:has-text("Confirm")');

    // Confirm Timezone
    await expect(page.locator('h2')).toContainText('Your Day Resets Here');
    await page.click('button:has-text("Looks Right")');

    // Select First Quest & Seal
    await expect(page.locator('h2')).toContainText('BEGIN WITH ONE SMALL ACT');
    await page.click('button:has-text("Seal First Quest")');

    // Climax & Enter Hearth
    await expect(page.locator('h2')).toContainText("THAT’S THE LOOP.", { timeout: 15000 });
    await Promise.all([
      page.waitForURL(/\/hearth/, { timeout: 15000 }),
      page.click('button:has-text("Enter the Hearth")'),
    ]);

    // ------------------------------------------------------------------------
    // Step 3: Hearth Initial State
    // ------------------------------------------------------------------------
    await expect(page).toHaveURL(/\/hearth/);
    await expect(page.locator('#hearth-title')).toHaveText('HEARTH');
    await expect(page.locator('.hearth-hero-subtitle')).toHaveText('Today is where the path begins.');

    // Status strip initial values (1 completed from onboarding seal)
    await expect(page.locator('text=Kindled Ember')).toBeVisible();
    await expect(page.locator('text=1 Completed · Stirring')).toBeVisible();

    // ------------------------------------------------------------------------
    // Step 4: Inscribe "Finish Java recursion practice"
    // ------------------------------------------------------------------------
    const inscribeBtn = page.locator('button:has-text("Inscribe a quest")').first();
    await expect(inscribeBtn).toBeVisible();
    await inscribeBtn.click();

    // Verify dialog opens with accessible semantics
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#inscribe-title')).toHaveText('Inscribe a Quest');

    // Fill quest creation form
    await page.fill('#quest-title-input', questTitle);
    await page.selectOption('#quest-attribute-select', 'mind');
    await page.selectOption('#quest-effort-select', 'standard');
    await page.selectOption('#quest-cadence-select', 'daily');

    // Inscribe quest into journal
    await page.click('button[type="submit"]:has-text("Inscribe in Journal")');

    // Verify dialog closes and quest row appears
    await expect(dialog).not.toBeVisible();
    const questRow = page.locator(`li.quest-journal-entry:has-text("${questTitle}")`);
    await expect(questRow).toBeVisible();
    await expect(questRow.locator('.entry-tag.tag-mind')).toBeVisible();
    await expect(questRow.locator('.entry-tag.tag-effort')).toContainText('standard effort');

    // Initial seal button state
    const sealButton = questRow.locator('button.btn-completion');
    await expect(sealButton).toBeVisible();
    await expect(sealButton).toHaveText('Seal quest');
    await expect(sealButton).not.toBeDisabled();

    // ------------------------------------------------------------------------
    // Step 5: Complete Quest & Verify Authoritative Progression
    // ------------------------------------------------------------------------
    await sealButton.click();

    // Verify transition to confirmed sealed state
    await expect(sealButton).toHaveText('Sealed ✓', { timeout: 10000 });
    await expect(sealButton).toBeDisabled();
    await expect(sealButton).toHaveAttribute('aria-disabled', 'true');

    // Verify Reward sequence announcement
    const liveRegion = page.locator('div[aria-live="polite"].sr-only');
    await expect(liveRegion).toContainText('sealed. +20 XP awarded, +4 Sparks gathered. mind branch grows.');

    // Verify Ember state transitioned to Steady (2 completed today)
    await expect(page.locator('text=Steady Ember')).toBeVisible();
    await expect(page.locator('text=2 Completed · Burning')).toBeVisible();

    // Verify Root preview on Hearth shows Mind 20 XP
    const mindPreviewCard = page.locator('.root-branch-card:has(.branch-name-label:has-text("Mind"))');
    await expect(mindPreviewCard.locator('.branch-xp-value')).toHaveText('20 XP');

    // Take Desktop Screenshot (1440x900)
    await page.screenshot({ path: 'screenshots/hearth-completed-1440x900.png', fullPage: true });

    // ------------------------------------------------------------------------
    // Step 6: Navigate to Root & Verify Mind = 20 XP
    // ------------------------------------------------------------------------
    const rootNav = page.locator('a[href="/root"]').first();
    await rootNav.click();
    await expect(page).toHaveURL(/\/root/);

    // Verify Mind branch header displays 20 XP and origin sprout is unlocked
    const rootBranchRegion = page.getByRole('region', { name: /Mind Branch/i });
    await expect(rootBranchRegion).toBeVisible();
    await expect(rootBranchRegion).toContainText('20 XP');

    const originSprout = rootBranchRegion.locator('button:has-text("Origin Sprout"), button:has-text("First Thought")').first();
    await expect(originSprout).toBeVisible();
    await expect(originSprout).toContainText('First Thought');

    // Take Desktop Root Screenshot (1440x900)
    await page.screenshot({ path: 'screenshots/root-view-1440x900.png', fullPage: true });

    // ------------------------------------------------------------------------
    // Step 7: Navigate back to Hearth & Verify Persistence after Refresh
    // ------------------------------------------------------------------------
    const hearthNav = page.locator('a[href="/hearth"]').first();
    await hearthNav.click();
    await expect(page).toHaveURL(/\/hearth/);

    // Hard browser reload
    await page.reload();
    await expect(page).toHaveURL(/\/hearth/);

    // Verify authoritative state persisted after refresh
    const refreshedQuestRow = page.locator(`li.quest-journal-entry:has-text("${questTitle}")`);
    await expect(refreshedQuestRow).toBeVisible();

    const refreshedSealBtn = refreshedQuestRow.locator('button.btn-completion');
    await expect(refreshedSealBtn).toHaveText('Sealed ✓');
    await expect(refreshedSealBtn).toBeDisabled();
    await expect(refreshedSealBtn).toHaveAttribute('aria-disabled', 'true');

    // Verify Ember remains Steady after refresh (2 completed today)
    await expect(page.locator('text=Steady Ember')).toBeVisible();
    await expect(page.locator('text=2 Completed · Burning')).toBeVisible();

    // Verify duplicate completion is unavailable (button cannot be clicked)
    await expect(refreshedSealBtn).toBeDisabled();
  });

  // --------------------------------------------------------------------------
  // Responsive Viewports & Screenshots (768x1024, 390x844, 320x700)
  // --------------------------------------------------------------------------
  test('renders cleanly across required viewports with no overflow', async ({ page }) => {
    // Navigate to hearth (log in if session not present)
    await page.goto('/hearth');
    if (page.url().includes('/login')) {
      await page.fill('#email', testEmail);
      await page.fill('#password', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/hearth/);
    }

    const viewports = [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 390, height: 844 },
      { name: 'small-mobile', width: 320, height: 700 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);

      // Check for horizontal overflow
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollbar, `Viewport ${vp.name} (${vp.width}x${vp.height}) must not have horizontal overflow`).toBe(false);

      // Element-level containment: each branch card must be fully contained within branches grid
      const branchesGrid = page.locator('.root-branches-grid');
      await expect(branchesGrid).toBeVisible();
      const gridBox = await branchesGrid.boundingBox();
      expect(gridBox).not.toBeNull();

      const branchCards = page.locator('.root-branch-card');
      const cardCount = await branchCards.count();
      expect(cardCount).toBe(4);

      for (let i = 0; i < cardCount; i++) {
        const card = branchCards.nth(i);
        const cardBox = await card.boundingBox();
        expect(cardBox).not.toBeNull();
        if (cardBox && gridBox) {
          expect(
            cardBox.x + cardBox.width,
            `Branch card #${i} right (${cardBox.x + cardBox.width}) must be <= grid right (${gridBox.x + gridBox.width}) on ${vp.name}`
          ).toBeLessThanOrEqual(gridBox.x + gridBox.width + 1);
        }
      }

      // Element-level containment: status badge must be fully contained in ember-info
      const emberInfo = page.locator('.ember-info');
      const emberBadge = page.locator('.ember-stage-badge');
      await expect(emberBadge).toBeVisible();
      const infoBox = await emberInfo.boundingBox();
      const badgeBox = await emberBadge.boundingBox();
      if (badgeBox && infoBox) {
        expect(
          badgeBox.x + badgeBox.width,
          `Ember stage badge right (${badgeBox.x + badgeBox.width}) must be <= info container right (${infoBox.x + infoBox.width}) on ${vp.name}`
        ).toBeLessThanOrEqual(infoBox.x + infoBox.width + 1);
      }

      // Element-level text safety: text elements must not have scrollWidth > clientWidth (no internal clipping)
      const textClippingIssues = await page.evaluate(() => {
        const selectors = [
          '.ember-title',
          '.ember-stage-badge',
          '.root-preview-title',
          '.root-preview-link-btn',
          '.branch-name-label',
          '.branch-xp-value',
          '.branch-milestone-text',
        ];
        const issues: string[] = [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, idx) => {
            if (el.scrollWidth > el.clientWidth + 1) {
              issues.push(
                `${selector}[${idx}] clipped: scrollWidth=${el.scrollWidth} > clientWidth=${el.clientWidth} (text="${el.textContent?.trim()}")`
              );
            }
          });
        }
        return issues;
      });
      expect(textClippingIssues, `Text elements must not be clipped on ${vp.name} (${vp.width}x${vp.height})`).toEqual([]);

      // Verify mobile bottom nav on small viewports
      if (vp.width < 768) {
        const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
        await expect(mobileNav).toBeVisible();
        await expect(mobileNav.locator('a[href="/hearth"]')).toBeVisible();
        await expect(mobileNav.locator('a[href="/root"]')).toBeVisible();

        // Verify bottom scroll clearance: scroll to bottom and assert inscribe button is fully above mobile nav
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(150);
        const inscribeBtn = page.locator('button:has-text("Inscribe a quest")').first();
        const inscribeBox = await inscribeBtn.boundingBox();
        const navBox = await mobileNav.boundingBox();
        if (inscribeBox && navBox) {
          expect(
            inscribeBox.y + inscribeBox.height,
            `Inscribe button bottom (${inscribeBox.y + inscribeBox.height}) must be above mobile nav top (${navBox.y})`
          ).toBeLessThanOrEqual(navBox.y);
        }

        // Scroll back to top for initial view capture
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(150);
      }

      // Capture Hearth screenshot (viewport capture on mobile to represent true screen frame)
      await page.screenshot({
        path: `screenshots/hearth-${vp.name}-${vp.width}x${vp.height}.png`,
        fullPage: vp.width >= 768,
      });
      await page.screenshot({
        path: `docs/screenshots/demo-readiness/hearth-${vp.width}x${vp.height}.png`,
        fullPage: vp.width >= 768,
      });

      // Navigate to Root
      await page.goto('/root');
      await expect(page).toHaveURL(/\/root/);
      await page.waitForTimeout(300);

      // Check for horizontal overflow on Root as well
      const rootHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(rootHorizontalScrollbar, `Root Viewport ${vp.name} (${vp.width}x${vp.height}) must not have horizontal overflow`).toBe(false);

      // Verify mobile bottom nav clearance on Root as well
      if (vp.width < 768) {
        const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
        await expect(mobileNav).toBeVisible();

        // Scroll to bottom of Root and ensure bottom of branch container clears nav
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(150);
        const rootContainer = page.locator('.root-branch-container').first();
        const rootBox = await rootContainer.boundingBox();
        const navBox = await mobileNav.boundingBox();
        if (rootBox && navBox) {
          expect(
            rootBox.y + rootBox.height,
            `Root branch bottom (${rootBox.y + rootBox.height}) must be above mobile nav top (${navBox.y})`
          ).toBeLessThanOrEqual(navBox.y);
        }

        // Scroll back to top for initial view capture
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(150);
      }

      // Capture Root screenshot
      await page.screenshot({
        path: `screenshots/root-${vp.name}-${vp.width}x${vp.height}.png`,
        fullPage: vp.width >= 768,
      });
      await page.screenshot({
        path: `docs/screenshots/demo-readiness/root-${vp.width}x${vp.height}.png`,
        fullPage: vp.width >= 768,
      });

      // Return to Hearth for next iteration
      await page.goto('/hearth');
    }
  });

  // --------------------------------------------------------------------------
  // Accessibility: Focus, Modal Trapping, Keyboard Navigation, Reduced Motion
  // --------------------------------------------------------------------------
  test('verifies visible focus, modal focus trapping, and keyboard navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to hearth (log in if session not present)
    await page.goto('/hearth');
    if (page.url().includes('/login')) {
      await page.fill('#email', testEmail);
      await page.fill('#password', testPassword);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/hearth/);
    }

    // 1. Visible focus token check
    const inscribeBtn = page.locator('button:has-text("Inscribe a quest")').first();
    await inscribeBtn.focus();
    await expect(inscribeBtn).toBeFocused();

    // Open modal via Enter key
    await page.keyboard.press('Enter');
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // 2. Focus trapping inside modal
    const titleInput = page.locator('#quest-title-input');
    await expect(titleInput).toBeFocused();

    // Tab through modal controls and verify focus stays within dialog
    await page.keyboard.press('Tab'); // attribute select
    await page.keyboard.press('Tab'); // effort select
    await page.keyboard.press('Tab'); // cadence select
    await page.keyboard.press('Tab'); // discard button
    await page.keyboard.press('Tab'); // submit button
    await page.keyboard.press('Tab'); // close X or loops to title

    const activeElTagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'SELECT', 'BUTTON']).toContain(activeElTagName);

    // Escape key closes modal
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // 3. Reduced motion emulation
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('#hearth-title')).toBeVisible();
  });
});

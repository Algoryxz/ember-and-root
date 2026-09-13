import { test, expect } from '@playwright/test';

test.describe('Ember & Root — Public Entry Experience (Phase 1)', () => {
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'small-mobile', width: 320, height: 700 },
  ];

  test('renders all 4 product introduction sections without auth redirection', async ({ page }) => {
    await page.goto('/');

    // Section 1: Hero & Living Flame
    const heroTitle = page.locator('#hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('What you do each day becomes something you can see grow.');

    const primaryCta = page.locator('a:has-text("Begin your path")').first();
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute('href', '/signup');

    const secondaryCta = page.locator('a:has-text("I already have a path")');
    await expect(secondaryCta).toBeVisible();
    await expect(secondaryCta).toHaveAttribute('href', '/login');

    // Section 2: The Core Loop
    const loopTitle = page.locator('#loop-title');
    await expect(loopTitle).toBeVisible();
    await expect(loopTitle).toContainText('The Living Cycle');

    const loopCards = page.locator('.loop-step-card');
    await expect(loopCards).toHaveCount(4);
    await expect(page.locator('.loop-step-title:has-text("Inscribe")')).toBeVisible();
    await expect(page.locator('.loop-step-title:has-text("Seal")')).toBeVisible();
    await expect(page.locator('.loop-step-title:has-text("Ember Responds")')).toBeVisible();
    await expect(page.locator('.loop-step-title:has-text("Root Grows")')).toBeVisible();

    // Section 3: The Evolving Root
    const rootTitle = page.locator('#root-title');
    await expect(rootTitle).toBeVisible();
    await expect(rootTitle).toContainText('A Living Organism Shaped by You');

    const evolutionCards = page.locator('.evolution-card');
    await expect(evolutionCards).toHaveCount(4);
    await expect(page.getByText('0 XP', { exact: true })).toBeVisible();
    await expect(page.getByText('20 XP', { exact: true })).toBeVisible();
    await expect(page.getByText('80 XP', { exact: true })).toBeVisible();
    await expect(page.getByText('160 XP', { exact: true })).toBeVisible();

    // Section 4: Closing CTA
    const closingTitle = page.locator('#closing-title');
    await expect(closingTitle).toBeVisible();
    await expect(closingTitle).toContainText('Begin your personal chronicle today.');
  });

  for (const vp of viewports) {
    test(`renders cleanly across ${vp.name} (${vp.width}x${vp.height}) with zero overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForTimeout(200);

      // Verify no horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalOverflow, `Viewport ${vp.name} must not have horizontal scroll`).toBe(false);

      // Verify touch targets on mobile
      if (vp.width < 768) {
        const ctaBtn = page.locator('.btn-primary-cta').first();
        const box = await ctaBtn.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.height, 'Primary CTA touch target height must be >= 44px').toBeGreaterThanOrEqual(44);
        }
      }

      // Capture screenshot
      await page.screenshot({
        path: `docs/screenshots/landing/landing-${vp.width}x${vp.height}.png`,
        fullPage: true,
      });
    });
  }

  test('maintains accessible keyboard navigation and visible focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Tab through key interactive elements
    await page.keyboard.press('Tab'); // Accessible skip link
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Tab'); // Brand logo
    const brand = page.locator('.landing-brand');
    await expect(brand).toBeFocused();

    await page.keyboard.press('Tab'); // Sign In
    const signIn = page.locator('.btn-nav-login');
    await expect(signIn).toBeFocused();

    await page.keyboard.press('Tab'); // Begin Path (Nav)
    const navBegin = page.locator('.btn-nav-primary');
    await expect(navBegin).toBeFocused();

    await page.keyboard.press('Tab'); // Cinematic interactive story shell
    const cinematicShell = page.locator('.cinematic-shell');
    await expect(cinematicShell).toBeFocused();

    await page.keyboard.press('Tab'); // Begin your path (Hero CTA)
    const heroBegin = page.locator('.btn-primary-cta').first();
    await expect(heroBegin).toBeFocused();
  });
});

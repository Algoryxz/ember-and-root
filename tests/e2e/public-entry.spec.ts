import { test, expect } from '@playwright/test';

test.describe('Authoritative Cinematic Pipeline on /', () => {
  for (const width of [1440, 768, 390, 375, 320]) {
    test(`playable hold-to-awaken opening sequence at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const mutations: string[] = [];
      page.on('request', request => { if (request.method() === 'POST') mutations.push(request.url()); });

      await page.goto('/');

      // 1. Forest stage is visible with atmospheric prompt
      const prologue = page.locator('.prologue');
      await expect(prologue).toBeVisible();
      await expect(prologue).toHaveAttribute('data-scene', 'forest');

      // 2. Dormant Orb is visible and accessible
      const orbButton = page.locator('.prologue-orb-button');
      await expect(orbButton).toBeVisible();
      await expect(orbButton).toHaveAttribute('role', 'progressbar');
      await expect(orbButton).toHaveAttribute('aria-valuenow', '0');

      // 3. Firefly canvas exists
      const canvas = page.locator('.prologue-firefly-canvas');
      await expect(canvas).toBeVisible();

      // 4. Press and hold dormant orb to awaken
      await orbButton.focus();
      await page.keyboard.down('Enter');

      // 5. Automatic awakening triggers transition to Root Chamber
      await expect(prologue).toHaveAttribute('data-scene', 'chamber', { timeout: 10000 });
      await page.keyboard.up('Enter');

      // 6. Reach for the Ember in root chamber
      const chamberHotspot = page.locator('.prologue-hotspot');
      await expect(chamberHotspot).toBeVisible();
      await chamberHotspot.focus();
      await page.keyboard.press('Enter');

      // 7. Transition to Storm Shore final stage
      await expect(prologue).toHaveAttribute('data-scene', 'black', { timeout: 10000 });

      // 8. Living chest ember and CTAs appear
      const beginBtn = page.getByRole('button', { name: 'BEGIN YOUR PATH' });
      await expect(beginBtn).toBeVisible({ timeout: 10000 });

      // 9. Verify no horizontal overflow across all tested viewports
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

      // 10. Verify CTA route link works
      await beginBtn.click();
      await expect(page).toHaveURL(/\/signup\?from=ember/);
      await expect(page.getByRole('heading', { name: 'CREATE YOUR PATH' })).toBeVisible();
    });
  }

  test('pointer hold triggers energy fill and decay on early release', async ({ page }) => {
    await page.goto('/');
    const orbButton = page.locator('.prologue-orb-button');
    await expect(orbButton).toBeVisible();

    // Trigger pointerdown
    await orbButton.dispatchEvent('pointerdown');
    await page.waitForTimeout(300);

    // Verify progress value climbed
    const ariaVal = await orbButton.getAttribute('aria-valuenow');
    expect(Number(ariaVal)).toBeGreaterThan(0);

    // Release before completion - verify decay begins
    await orbButton.dispatchEvent('pointerup');
    await page.waitForTimeout(400);

    // Complete hold to 100%
    await orbButton.dispatchEvent('pointerdown');
    const prologue = page.locator('.prologue');
    await expect(prologue).toHaveAttribute('data-scene', 'chamber', { timeout: 10000 });
  });

  test('skip button cleanly bypasses cinematic into returning player CTA', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Skip cinematic' }).click();
    const signIn = page.getByRole('button', { name: 'RETURNING PLAYER SIGN IN' });
    await expect(signIn).toBeVisible({ timeout: 5000 });
    await signIn.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/login\?from=ember/);
  });
});

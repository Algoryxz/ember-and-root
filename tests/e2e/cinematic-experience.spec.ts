import { test, expect } from '@playwright/test';

test.describe('Cinematic Hold-to-Awaken Experience', () => {
  test('renders cinematic awakening shell, canvas, and dormant orbs', async ({ page }) => {
    await page.goto('/awakening');
    const shell = page.locator('.cinematic-shell');
    await expect(shell).toBeVisible();

    const canvas = page.locator('.cinematic-firefly-canvas');
    await expect(canvas).toBeVisible();

    const treeSvg = page.locator('.cinematic-tree-svg');
    await expect(treeSvg).toBeVisible();

    const touchTargets = page.locator('.orb-touch-target');
    await expect(touchTargets).toHaveCount(3);
  });

  test('pointer hold triggers energy absorption and progress increment', async ({ page }) => {
    await page.goto('/awakening');
    const primaryOrb = page.locator('.orb-touch-target').first();
    await expect(primaryOrb).toBeVisible();

    // Dispatch pointerdown to begin hold
    const box = await primaryOrb.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      await primaryOrb.dispatchEvent('pointerdown');
      
      // Progress bar appears in slide 2
      const progressBar = page.locator('.cinematic-progress-bar');
      await expect(progressBar).toBeVisible({ timeout: 3000 });

      // Hold until complete transition to slide 3
      const heartScene = page.locator('.cinematic-awakening-scene');
      await expect(heartScene).toBeVisible({ timeout: 8000 });

      // Dialogue text is rendered
      const dialogue = page.locator('.cinematic-dialogue-text');
      await expect(dialogue).toBeVisible();

      // Tap through dialogue lines and typewriter finishes
      for (let i = 0; i < 6; i++) {
        await heartScene.click();
        await page.waitForTimeout(150);
      }

      // CTA button appears upon dialogue completion
      const cta = page.locator('a.btn-primary-cta:has-text("Begin your path")');
      await expect(cta).toBeVisible({ timeout: 3000 });
      await expect(cta).toHaveAttribute('href', '/signup');
    }
  });

  test('keyboard accessibility: Space/Enter starts hold', async ({ page }) => {
    await page.goto('/awakening');
    const shell = page.locator('.cinematic-shell');
    await shell.focus();

    // Trigger Enter keydown
    await page.keyboard.down('Enter');
    const progressBar = page.locator('.cinematic-progress-bar');
    await expect(progressBar).toBeVisible({ timeout: 2000 });

    // Hold through to awakening
    const heartScene = page.locator('.cinematic-awakening-scene');
    await expect(heartScene).toBeVisible({ timeout: 5000 });
    await page.keyboard.up('Enter');
  });

  test('mobile viewport 375x812 has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/awakening');
    await expect(page.locator('.cinematic-shell')).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });
});

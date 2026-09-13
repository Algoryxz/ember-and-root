import { test, expect } from '@playwright/test';

test.describe('Cinematic Awakening Route /awakening', () => {
  test('renders unified opening sequence on /awakening', async ({ page }) => {
    await page.goto('/awakening');
    const prologue = page.locator('.prologue');
    await expect(prologue).toBeVisible();

    const orbButton = page.locator('.prologue-orb-button');
    await expect(orbButton).toBeVisible();
  });
});

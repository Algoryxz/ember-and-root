import { test, expect } from '@playwright/test';

test.describe('Focus Ritual — Hearth Interaction & Integrity', () => {
  // Use demo state or test page to verify Focus Ritual presentation
  test('unauthenticated entry redirects to login safely', async ({ page }) => {
    await page.goto('/hearth');
    await expect(page).toHaveURL(/\/login/);
  });

  test('landing page displays Tech Zephyr Hackathon branding', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Skip cinematic' }).click();
    await expect(page.locator('.shore-credits')).toHaveText('Built by Algoryxz for Tech Zephyr Web Hackathon');
  });
});

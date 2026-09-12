import { test, expect } from '@playwright/test';

test.describe('Satchel and Chronicle Route Protection & Smoke Tests', () => {
  test('Satchel route requires authentication and redirects to login with next parameter', async ({ page }) => {
    await page.goto('/satchel');
    await expect(page).toHaveURL(/\/login\?next=%2Fsatchel/);
  });

  test('Chronicle route requires authentication and redirects to login with next parameter', async ({ page }) => {
    await page.goto('/chronicle');
    await expect(page).toHaveURL(/\/login\?next=%2Fchronicle/);
  });

  test('Settings route requires authentication and redirects to login with next parameter', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login\?next=%2Fsettings/);
  });
});

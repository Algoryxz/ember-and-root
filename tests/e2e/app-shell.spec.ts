import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Unauthenticated Route Protection', () => {
  test('redirects unauthenticated user from /hearth to /login', async ({ page }) => {
    await page.goto('/hearth');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user from /root to /login?next=%2Froot', async ({ page }) => {
    await page.goto('/root');
    await expect(page).toHaveURL(/\/login\?next=%2Froot/);
  });

  test('redirects unauthenticated user from /satchel to /login?next=%2Fsatchel', async ({ page }) => {
    await page.goto('/satchel');
    await expect(page).toHaveURL(/\/login\?next=%2Fsatchel/);
  });

  test('redirects unauthenticated user from /chronicle to /login?next=%2Fchronicle', async ({ page }) => {
    await page.goto('/chronicle');
    await expect(page).toHaveURL(/\/login\?next=%2Fchronicle/);
  });

  test('redirects unauthenticated user from /settings to /login?next=%2Fsettings', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login\?next=%2Fsettings/);
  });
});

test.describe('Public Auth Pages Accessibility', () => {
  test('login page has no critical axe accessibility violations', async ({ page }) => {
    await page.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('signup page has no critical axe accessibility violations', async ({ page }) => {
    await page.goto('/signup');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('landing page has valid heading and skip links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await page.getByRole('button', { name: 'Skip cinematic' }).click();
    await expect(page.getByRole('button', { name: 'BEGIN YOUR PATH' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'RETURNING PLAYER SIGN IN' })).toBeVisible();
  });

  test('login page allows full keyboard navigation through all interactive controls', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input#email');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();

    await page.keyboard.press('Tab');
    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink).toBeFocused();
  });
});


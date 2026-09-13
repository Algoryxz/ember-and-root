import { test, expect } from '@playwright/test';

const EXPECTED_REPO_URL = 'https://github.com/Algoryxz/ember-and-root';

test.describe('Public GitHub Repository Visibility & Provenance', () => {
  for (const width of [1440, 390]) {
    test(`exposes valid GitHub link on / at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');

      // 1. Prologue stage provenance link
      const prologueLink = page.locator('.prologue-provenance a');
      await expect(prologueLink).toBeVisible();
      await expect(prologueLink).toHaveAttribute('href', EXPECTED_REPO_URL);
      await expect(prologueLink).toHaveAttribute('target', '_blank');
      await expect(prologueLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(await prologueLink.innerText()).toContain(EXPECTED_REPO_URL);

      // Verify no horizontal overflow
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      // 2. Skip to Shore stage and verify Shore sequence provenance link
      await page.getByRole('button', { name: 'Skip cinematic' }).click();
      const shoreLink = page.locator('.shore-repo-link');
      await expect(shoreLink).toBeVisible({ timeout: 5000 });
      await expect(shoreLink).toHaveAttribute('href', EXPECTED_REPO_URL);
      await expect(shoreLink).toHaveAttribute('target', '_blank');
      await expect(shoreLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(await shoreLink.innerText()).toContain(EXPECTED_REPO_URL);

      // Verify no horizontal overflow
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test(`exposes valid GitHub link on /signup at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/signup');

      const footerLink = page.locator('footer a[href*="github.com"]');
      await expect(footerLink).toBeVisible();
      await expect(footerLink).toHaveAttribute('href', EXPECTED_REPO_URL);
      await expect(footerLink).toHaveAttribute('target', '_blank');
      await expect(footerLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(await footerLink.innerText()).toBe(EXPECTED_REPO_URL);

      // Verify hackathon provenance text
      await expect(page.locator('footer')).toContainText('Built by Algoryxz for Tech Zephyr Web Hackathon');

      // Verify keyboard focusable
      await footerLink.focus();
      await expect(footerLink).toBeFocused();

      // Verify no horizontal overflow
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });

    test(`exposes valid GitHub link on /login at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/login');

      const footerLink = page.locator('footer a[href*="github.com"]');
      await expect(footerLink).toBeVisible();
      await expect(footerLink).toHaveAttribute('href', EXPECTED_REPO_URL);
      await expect(footerLink).toHaveAttribute('target', '_blank');
      await expect(footerLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(await footerLink.innerText()).toBe(EXPECTED_REPO_URL);

      // Verify hackathon provenance text
      await expect(page.locator('footer')).toContainText('Built by Algoryxz for Tech Zephyr Web Hackathon');

      // Verify keyboard focusable
      await footerLink.focus();
      await expect(footerLink).toBeFocused();

      // Verify no horizontal overflow
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});

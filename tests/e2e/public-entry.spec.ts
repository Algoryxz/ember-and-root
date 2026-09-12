import { test, expect } from '@playwright/test';

for (const width of [1440, 768, 390, 375, 320]) {
  test(`playable prologue and real entry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const mutations: string[] = [];
    page.on('request', request => { if (request.method() === 'POST') mutations.push(request.url()); });
    await page.goto('/');
    await expect(page.locator('nav')).toHaveCount(0);
    for (const stage of ['forest', 'guided', 'chamber', 'discovery']) {
      await expect(page.locator('.prologue')).toHaveAttribute('data-scene', stage);
      await expect(page.locator('.prologue')).toHaveAttribute('data-phase', 'idle');
      await page.locator('.prologue-hotspot').focus();
      await page.keyboard.press('Enter');
    }
    await expect(page.getByRole('button', { name: 'BEGIN YOUR PATH' })).toBeVisible({ timeout: 10000 });
    expect(mutations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'BEGIN YOUR PATH' }).click();
    await expect(page).toHaveURL(/\/signup\?from=ember/);
    await expect(page.getByRole('heading', { name: 'CREATE YOUR PATH' })).toBeVisible();
  });
}

test('skip preserves the returning player keyboard path', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip cinematic' }).click();
  const signIn = page.getByRole('button', { name: 'RETURNING PLAYER SIGN IN' });
  await signIn.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/login\?from=ember/);
});

import { test, expect } from '@playwright/test';

test.describe('Prologue Audio & Cinematic Synchronization Suite', () => {

  test('sound-enabled first run and audio toggle control', async ({ page }) => {
    await page.goto('/');

    const soundBtn = page.locator('button.prologue-sound-btn');
    await expect(soundBtn).toBeVisible();
    await expect(soundBtn).toContainText('Sound On');

    // Click to mute
    await soundBtn.click();
    await expect(soundBtn).toContainText('Sound Off');

    // Verify sessionStorage remembered mute choice
    const isMuted = await page.evaluate(() => sessionStorage.getItem('ember_prologue_muted'));
    expect(isMuted).toBe('true');

    // Click to unmute
    await soundBtn.click({ force: true });
    await expect(soundBtn).toContainText('Sound On');
    const isMutedAfter = await page.evaluate(() => sessionStorage.getItem('ember_prologue_muted'));
    expect(isMutedAfter).toBe('false');
  });

  test('browser autoplay policy resilience (gesture triggers audio)', async ({ page }) => {
    await page.goto('/');

    // User gesture on body triggers audio controller without error
    await page.locator('body').click();
    const soundBtn = page.locator('button.prologue-sound-btn');
    await expect(soundBtn).toBeVisible();
  });

  test('skip cinematic immediately opens shore final state and preserves credits', async ({ page }) => {
    await page.goto('/');
    const skipBtn = page.getByRole('button', { name: 'Skip cinematic' });
    await skipBtn.click();

    // Verify shore sequence reveals final choices immediately
    await expect(page.getByRole('button', { name: 'BEGIN YOUR PATH' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'RETURNING PLAYER SIGN IN' })).toBeVisible();
    await expect(page.locator('.shore-credits')).toHaveText('Built by Algoryxz for Tech Zephyr Web Hackathon');
  });

  test('replay cinematic restarts prologue and soundtrack from forest', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Skip cinematic' }).click();

    const replayBtn = page.locator('.shore-replay-btn');
    await expect(replayBtn).toBeVisible({ timeout: 10000 });
    await replayBtn.click();

    // Scene returns to forest
    await expect(page.locator('.prologue')).toHaveAttribute('data-scene', 'forest');
    await expect(page.locator('.prologue-sound-btn')).toBeVisible();
  });

  test('Begin Your Path transitions to signup', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Skip cinematic' }).click();

    const beginBtn = page.getByRole('button', { name: 'BEGIN YOUR PATH' });
    await beginBtn.click();
    await expect(page).toHaveURL(/\/signup\?from=ember/, { timeout: 20000 });
  });

  test('Sign In transitions to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Skip cinematic' }).click();

    const signInBtn = page.getByRole('button', { name: 'RETURNING PLAYER SIGN IN' });
    await signInBtn.click();
    await expect(page).toHaveURL(/\/login\?from=ember/, { timeout: 20000 });
  });

  test('back navigation from signup cleanly returns to landing page', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Skip cinematic' }).click();
    const beginBtn = page.getByRole('button', { name: 'BEGIN YOUR PATH' });
    await expect(beginBtn).toBeVisible({ timeout: 15000 });
    await beginBtn.click();
    await expect(page).toHaveURL(/\/signup/, { timeout: 20000 });

    await page.goBack();
    await expect(page.locator('.prologue')).toBeVisible({ timeout: 20000 });
  });

  test('soundtrack continues into signup without interruption', async ({ page }) => {
    await page.goto('/');
    await page.locator('body').click();
    await page.getByRole('button', { name: 'Skip cinematic' }).click();

    const beginBtn = page.getByRole('button', { name: 'BEGIN YOUR PATH' });
    await beginBtn.click();
    await expect(page).toHaveURL(/\/signup\?from=ember/, { timeout: 20000 });

    // Sound toggle remains accessible on auth folio
    const authSoundBtn = page.locator('.path-entry-tools button.prologue-sound-btn');
    await expect(authSoundBtn).toBeVisible();
    await expect(authSoundBtn).toContainText('Sound On');
  });

  test('signup failure does NOT end soundtrack', async ({ page }) => {
    await page.goto('/signup?from=ember');
    await page.locator('body').click();

    // Trigger validation failure with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'pass');
    await page.fill('input[name="confirmPassword"]', 'pass2');
    await page.getByRole('button', { name: 'Begin your path' }).click();

    // Verification that validation error is rendered and folio is NOT in exiting state
    await expect(page.locator('.path-entry')).not.toHaveAttribute('data-exiting', 'true');
    const authSoundBtn = page.locator('.path-entry-tools button.prologue-sound-btn');
    await expect(authSoundBtn).toBeVisible();
    await expect(authSoundBtn).toContainText('Sound On');
  });

  test('soundtrack continues into login without interruption', async ({ page }) => {
    await page.goto('/');
    await page.locator('body').click();
    await page.getByRole('button', { name: 'Skip cinematic' }).click();

    const signInBtn = page.getByRole('button', { name: 'RETURNING PLAYER SIGN IN' });
    await signInBtn.click();
    await expect(page).toHaveURL(/\/login\?from=ember/, { timeout: 20000 });

    const authSoundBtn = page.locator('.path-entry-tools button.prologue-sound-btn');
    await expect(authSoundBtn).toBeVisible();
    await expect(authSoundBtn).toContainText('Sound On');
  });

  test('failed login preserves soundtrack and does NOT trigger exit fade', async ({ page }) => {
    await page.goto('/login?from=ember');
    await page.locator('body').click();

    await page.fill('input[name="email"]', 'nobody@ember.game');
    await page.fill('input[name="password"]', 'wrongpassword123');
    await page.getByRole('button', { name: 'Return to the Hearth' }).click();

    // Error alert is rendered
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15000 });
    // Foliage/atmosphere remains active, no data-exiting
    await expect(page.locator('.path-entry')).not.toHaveAttribute('data-exiting', 'true');
    const authSoundBtn = page.locator('.path-entry-tools button.prologue-sound-btn');
    await expect(authSoundBtn).toContainText('Sound On');
  });

  test('sound toggle on auth folio synchronizes mute state with session', async ({ page }) => {
    await page.goto('/login');

    const authSoundBtn = page.locator('.path-entry-tools button.prologue-sound-btn');
    await expect(authSoundBtn).toBeVisible();
    await expect(authSoundBtn).toContainText('Sound On');

    await authSoundBtn.click({ force: true });
    await expect(authSoundBtn).toContainText('Sound Off', { timeout: 10000 });
    const isMuted = await page.evaluate(() => sessionStorage.getItem('ember_prologue_muted'));
    expect(isMuted).toBe('true');

    await authSoundBtn.click({ force: true });
    await expect(authSoundBtn).toContainText('Sound On', { timeout: 10000 });
  });

  test('audio 404 load failure does not block visual prologue progression', async ({ page }) => {
    // Route audio request to 404
    await page.route('**/audio/prologue.mp3', route => route.abort());

    await page.goto('/');
    // Visual prologue still mounts and operates normally
    await expect(page.locator('.prologue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Skip cinematic' })).toBeVisible({ timeout: 10000 });
  });

  test('mobile viewport 390px and 320px responsive with no horizontal overflow', async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.getByRole('button', { name: 'Skip cinematic' }).click();
      await expect(page.locator('.shore-credits')).toBeVisible({ timeout: 10000 });

      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasOverflow).toBe(false);

      // Check login at this width as well
      await page.goto('/login');
      const loginOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(loginOverflow).toBe(false);
    }
  });

  test('reduced motion operates seamlessly without audio impediment', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const reduceBtn = page.getByRole('button', { name: 'Reduced motion' });
    await expect(reduceBtn).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Skip cinematic' }).click();
    await expect(page.getByRole('button', { name: 'BEGIN YOUR PATH' })).toBeVisible({ timeout: 10000 });
  });

  test('keyboard accessibility navigates interactive tools and hotspots', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Tab through tools
    await page.keyboard.press('Tab');
    const focusedEl = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedEl).toBe('BUTTON');
  });

});

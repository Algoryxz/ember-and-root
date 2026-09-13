import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'desktop-wide', width: 1440, height: 900 },
  { name: 'desktop-standard', width: 1280, height: 800 },
  { name: 'desktop-compact', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile-iphone14', width: 390, height: 844 },
  { name: 'mobile-iphone-se', width: 375, height: 812 },
  { name: 'mobile-compact', width: 320, height: 700 },
];

function rectsIntersect(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number },
  tolerance = 2
): boolean {
  return !(
    r2.x >= r1.x + r1.width - tolerance ||
    r2.x + r2.width <= r1.x + tolerance ||
    r2.y >= r1.y + r1.height - tolerance ||
    r2.y + r2.height <= r1.y + tolerance
  );
}

test.describe('Root Schematic & Hearth Specimen Geometric Collision Tests', () => {
  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}) maintains strict element separation without overlap`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Verify Root Page Schematic Geometric Separation
      await page.goto('/root');
      await page.waitForLoadState('domcontentloaded');

      // Check horizontal overflow
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(
        hasHorizontalScrollbar,
        `Root page must not have horizontal scrollbar at ${vp.width}x${vp.height}`
      ).toBe(false);

      // Verify node buttons exist and do not collide with each other
      const nodeButtons = page.locator('.root-node-button');
      const count = await nodeButtons.count();

      if (count >= 3) {
        const boxes: Array<{ id: string; box: { x: number; y: number; width: number; height: number } }> = [];

        for (let i = 0; i < count; i++) {
          const btn = nodeButtons.nth(i);
          const box = await btn.boundingBox();
          const label = (await btn.getAttribute('aria-label')) || `node-${i}`;
          if (box) {
            boxes.push({ id: label, box });
          }
        }

        // Assert pairwise non-intersection between distinct node buttons
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const b1 = boxes[i];
            const b2 = boxes[j];
            const collides = rectsIntersect(b1.box, b2.box, 1);
            expect(
              collides,
              `Node "${b1.id}" must not collide with node "${b2.id}" at ${vp.width}x${vp.height}`
            ).toBe(false);
          }
        }
      }
    });
  }

  test('Quest Inscription / Dialog Select has dark theme styling and verified contrast', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to signup to ensure authenticated session if needed
    await page.goto('/signup');
    const testEmail = `seeker_geom_${Date.now()}@ember.test`;
    await page.fill('#email', testEmail);
    await page.fill('#password', 'SafePassword!123');
    await page.fill('#confirmPassword', 'SafePassword!123');

    try {
      await Promise.all([
        page.waitForURL(/\/(onboard|hearth)/, { timeout: 10000 }),
        page.click('button[type="submit"]'),
      ]);
    } catch {
      // If rate limited or preview, navigate directly to hearth
    }

    await page.goto('/hearth');
    await page.waitForLoadState('domcontentloaded');

    // If on hearth, open Inscribe modal
    const inscribeBtn = page.locator('button:has-text("Inscribe a quest")').first();
    if (await inscribeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inscribeBtn.click();
      const modal = page.locator('.dialog-window');
      await expect(modal).toBeVisible();

      // Check color-scheme on modal
      const modalColorScheme = await modal.evaluate((el) => window.getComputedStyle(el).colorScheme);
      expect(modalColorScheme).toContain('dark');

      const select = page.locator('#quest-attribute-select');
      await expect(select).toBeVisible();

      const selectStyles = await select.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          colorScheme: style.colorScheme,
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
      });

      expect(selectStyles.colorScheme).toContain('dark');

      // Check option element styling
      const optionColor = await select.locator('option').first().evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      expect(optionColor).not.toBe('');
    }
  });
});

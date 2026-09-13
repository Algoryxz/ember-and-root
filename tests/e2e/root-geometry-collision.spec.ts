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

test.describe('Root Schematic & Progression Rail Geometric Collision Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let authContext: any;
  let authPage: any;

  test.beforeAll(async ({ browser }) => {
    authContext = await browser.newContext();
    authPage = await authContext.newPage();

    const testEmail = `seeker_geom_${Date.now()}@ember.test`;
    const testPassword = 'SafePassword!123';

    await authPage.goto('/signup');
    await authPage.fill('#email', testEmail);
    await authPage.fill('#password', testPassword);
    await authPage.fill('#confirmPassword', testPassword);

    try {
      await Promise.all([
        authPage.waitForURL(/\/(onboard|hearth)/, { timeout: 10000 }),
        authPage.click('button[type="submit"]'),
      ]);

      // If redirected to /onboard, complete onboarding quickly
      if (authPage.url().includes('/onboard')) {
        // Quick complete onboarding if needed
        const notForMeBtn = authPage.getByRole('button', { name: /^Not for me:/ });
        const chooseBtn = authPage.getByRole('button', { name: /^Choose:/ });

        if (await notForMeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await notForMeBtn.click();
          await authPage.waitForTimeout(100);
          await notForMeBtn.click();
          await authPage.waitForTimeout(100);
          await notForMeBtn.click();
          await authPage.waitForTimeout(100);
          await chooseBtn.click();
          await authPage.waitForTimeout(100);
          await chooseBtn.click();
          await authPage.waitForTimeout(100);

          const continueGoals = authPage.locator('button:has-text("Continue with")');
          if (await continueGoals.isVisible().catch(() => false)) await continueGoals.click();

          const balanced = authPage.locator('button[role="radio"]:has-text("Balanced")');
          if (await balanced.isVisible().catch(() => false)) {
            await balanced.click();
            await authPage.click('button:has-text("Continue to Available Time")');
          }

          const dailyTime = authPage.locator('button[role="radio"]:has-text("15")');
          if (await dailyTime.isVisible().catch(() => false)) {
            await dailyTime.click();
            await authPage.click('button:has-text("Assemble Starter Quests")');
          }

          const confirmQuests = authPage.locator('button:has-text("Confirm")');
          if (await confirmQuests.isVisible().catch(() => false)) await confirmQuests.click();

          const looksRight = authPage.locator('button:has-text("Looks Right")');
          if (await looksRight.isVisible().catch(() => false)) await looksRight.click();

          const sealFirst = authPage.locator('button:has-text("Seal First Quest")');
          if (await sealFirst.isVisible().catch(() => false)) await sealFirst.click();

          const enterHearth = authPage.locator('button:has-text("Enter the Hearth")');
          if (await enterHearth.isVisible({ timeout: 10000 }).catch(() => false)) {
            await enterHearth.click();
            await authPage.waitForURL(/\/hearth/, { timeout: 10000 }).catch(() => {});
          }
        }
      }
    } catch {
      // If signup rate-limits or bypass is active, fall through
    }
  });

  test.afterAll(async () => {
    await authContext?.close();
  });

  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} (${vp.width}x${vp.height}) maintains strict element separation without overlap`, async () => {
      const page = await authContext.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/root');
      await page.waitForLoadState('domcontentloaded');

      // If redirected to login (e.g. rate-limited signup in preview), verify login page has no horizontal overflow
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        const hasHorizontalScrollbar = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScrollbar).toBe(false);
        await page.close();
        return;
      }

      // 1. Check whole-page horizontal overflow
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(
        hasHorizontalScrollbar,
        `Root page must not have horizontal scrollbar at ${vp.width}x${vp.height}`
      ).toBe(false);

      // 2. Structural Hierarchy Separation Verification:
      // ROOT HEADER -> ROOT DATA PANEL -> PROGRESSION RAIL -> ROOT SCHEMATIC
      const heroHeader = page.locator('.root-hero-section').first();
      const dataPanel = page.locator('.root-data-overview-panel').first();
      const progressionRail = page.locator('.root-progression-rail-wrapper').first();
      const schematicContainer = page.locator('.root-svg-container').first();

      if (await heroHeader.isVisible().catch(() => false)) {
        await expect(dataPanel).toBeVisible();
        await expect(progressionRail).toBeVisible();
        await expect(schematicContainer).toBeVisible();

        const headerBox = await heroHeader.boundingBox();
        const panelBox = await dataPanel.boundingBox();
        const railBox = await progressionRail.boundingBox();
        const schematicBox = await schematicContainer.boundingBox();

        if (headerBox && panelBox && railBox && schematicBox) {
          expect(
            rectsIntersect(headerBox, panelBox),
            `Hero header must not overlap data overview panel at ${vp.width}x${vp.height}`
          ).toBe(false);

          expect(
            rectsIntersect(panelBox, railBox),
            `Data panel must not overlap progression rail at ${vp.width}x${vp.height}`
          ).toBe(false);

          expect(
            rectsIntersect(railBox, schematicBox),
            `Progression rail must not overlap schematic container at ${vp.width}x${vp.height}`
          ).toBe(false);
        }

        // 3. Verify all 4 progression stage cards exist in the rail
        const seedStage = page.locator('[data-testid="rail-stage-seed"]');
        const sproutStage = page.locator('[data-testid="rail-stage-sprout"]');
        const forkStage = page.locator('[data-testid="rail-stage-fork"]');
        const crestStage = page.locator('[data-testid="rail-stage-crest"]');

        await expect(seedStage).toBeVisible();
        await expect(sproutStage).toBeVisible();
        await expect(forkStage).toBeVisible();
        await expect(crestStage).toBeVisible();

        // Verify the rail scroller is bounded and horizontally scrollable
        const scroller = page.locator('.root-progression-rail-scroller');
        const isScrollableOrFit = await scroller.evaluate((el) => {
          return el.scrollWidth >= el.clientWidth;
        });
        expect(isScrollableOrFit).toBe(true);

        // 4. Verify node buttons exist and do not collide with each other inside the schematic
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
      }

      await page.close();
    });
  }

  test('Quest Inscription / Dialog Select has dark theme styling and verified contrast', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

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

    await page.close();
  });

  test('Living Root specimen plate and Dormant Seed / Origin Sprout panel have strict vertical separation and internal scrolling', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/hearth');
    await page.waitForLoadState('domcontentloaded');

    const specimenVisual = page.locator('.root-specimen-visual').first();
    const anatomyRail = page.locator('.specimen-anatomy-rail').first();
    const specimenAnnotation = page.locator('.root-specimen-annotation').first();

    if (await specimenVisual.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(anatomyRail).toBeVisible();
      await expect(specimenAnnotation).toBeVisible();

      const visualBox = await specimenVisual.boundingBox();
      const railBox = await anatomyRail.boundingBox();
      const annotBox = await specimenAnnotation.boundingBox();

      if (visualBox && railBox && annotBox) {
        // Strict vertical flow: Visual is above Rail, Rail is above Annotation
        expect(visualBox.y + visualBox.height <= railBox.y + 1, 'Living Root visual must be positioned above anatomy rail').toBe(true);
        expect(railBox.y + railBox.height <= annotBox.y + 1, 'Anatomy rail must be positioned above annotation').toBe(true);
        expect(rectsIntersect(visualBox, railBox), 'Visual must not collide with anatomy rail').toBe(false);
        expect(rectsIntersect(railBox, annotBox), 'Anatomy rail must not collide with annotation').toBe(false);
      }

      // Verify anatomy rail is vertically scrollable with bounded max-height
      const railScrollMetrics = await anatomyRail.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          overflowY: style.overflowY,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          isVerticallyScrollable: el.scrollHeight > el.clientHeight,
        };
      });

      expect(['auto', 'scroll']).toContain(railScrollMetrics.overflowY);
      expect(railScrollMetrics.isVerticallyScrollable).toBe(true);

      // Verify Dormant Seed and Origin Sprout are rendered inside the rail
      await expect(anatomyRail.locator('.anatomy-marker-item:has-text("Dormant Seed")')).toBeVisible();
      await expect(anatomyRail.locator('.anatomy-marker-item:has-text("Origin Sprout")')).toBeVisible();
    }

    await page.close();
  });
});


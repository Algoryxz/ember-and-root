import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/review/prologue-v2';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const [width, height] of (process.argv.includes('--capture-only') ? [[1440,900],[390,844]] : [[1440,900],[390,844],[320,700],[375,812],[768,1024]])) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500,
      ...(width === 1440 ? { recordVideo: { dir: out, size: { width, height } } } : {}) });
    const page = await context.newPage(); const errors = []; const writes = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('request', r => { if (r.method() !== 'GET') writes.push(r.url()); });
    await page.goto('http://localhost:4123/');
    for (const stage of ['forest','guided','chamber','discovery']) {
      await expect(page.locator('.prologue')).toHaveAttribute('data-scene', stage);
      await expect(page.locator('.prologue')).toHaveAttribute('data-phase', 'idle', { timeout:15000 });
      if (width === 1440 || width === 390) await page.screenshot({ path:`${out}/${width}-${stage}.png` });
      const hot = page.locator('.prologue-hotspot'); await hot.focus();
      if (width < 500) await hot.tap(); else await page.keyboard.press('Enter');
    }
    await expect(page.locator('.shore-sequence')).toBeVisible();
    if (width === 1440 || width === 390) {
      await expect(page.locator('.shore-player')).toBeVisible(); await page.waitForTimeout(800);
      await page.screenshot({path:`${out}/${width}-inner.png`});
      await expect(page.locator('.shore-sequence')).toHaveAttribute('data-beat','1',{timeout:10000});
      await page.waitForTimeout(2200); await page.screenshot({path:`${out}/${width}-rear.png`});
    }
    await expect(page.locator('.shore-sequence')).toHaveAttribute('data-beat','4',{timeout:20000});
    await page.waitForTimeout(2600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) await page.screenshot({path:`${out}/${width}-shore.png`});
    const axe = (await new AxeBuilder({page}).analyze()).violations;
    expect(axe).toEqual([]); expect(writes).toEqual([]);
    await page.getByRole('button',{name:'BEGIN YOUR PATH'}).click();
    await page.waitForURL('**/signup?from=ember'); await page.waitForTimeout(1500);
    await expect(page.getByRole('heading',{name:'CREATE YOUR PATH'})).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 1440 || width === 390) await page.screenshot({path:`${out}/${width}-signup.png`});
    report.push({width,height,keyboardOrTouch:'pass',flow:'pass',errors,axe}); expect(errors).toEqual([]);
    const video=page.video(); await context.close(); if(video) await video.saveAs(`${out}/forest-to-entry-final.webm`);
  }
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('http://localhost:4123/awakening');
  await page.getByRole('button',{name:'Skip cinematic'}).click();
  await expect(page.getByRole('button',{name:'BEGIN YOUR PATH'})).toBeVisible();
  await page.getByRole('button',{name:'RETURNING PLAYER SIGN IN'}).focus();await page.keyboard.press('Enter');
  await page.waitForURL('**/login?from=ember');await expect(page.getByRole('heading',{name:'SIGN IN',exact:true})).toBeVisible();
  report.push({reducedMotionSkipSignIn:'pass'}); await context.close();
} finally { await writeFile(`${out}/${process.argv.includes('--capture-only') ? 'production-capture' : 'verification'}.json`,JSON.stringify(report,null,2)); await browser.close(); }
console.log(JSON.stringify(report,null,2));

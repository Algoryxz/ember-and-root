import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/screenshots/opening';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const [width,height] of [[1440,900],[768,1024],[390,844],[375,812],[320,700]]) {
    const context = await browser.newContext({ viewport:{width,height},hasTouch:width<500 });
    const page = await context.newPage();
    const errors = [], writes = [];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
    await page.goto('http://localhost:4123/awakening');
    for (const scene of ['forest','path','chamber','discovery']) {
      await expect(page.locator('main')).toHaveAttribute('data-scene',scene);
      await expect(page.locator('main')).toHaveAttribute('data-phase','idle');
      const hot=page.locator('.opening-hotspot');
      const box=await hot.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width).toBeLessThanOrEqual(width);
      expect(box.y+box.height).toBeLessThanOrEqual(height);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`${out}/${width}-${scene}.png`});
      if(scene!=='discovery') {
        if(width<500)await hot.tap();else{await hot.focus();await page.keyboard.press('Enter');}
      }
    }
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);expect(writes).toEqual([]);
    await page.getByRole('button',{name:'Walk again'}).click();
    await expect(page.locator('main')).toHaveAttribute('data-scene','forest');
    results.push({width,height,hotspots:'pass',overflow:'none',axe:'pass',errors,writes});
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:320,height:700},reducedMotion:'reduce'});
  const p=await context.newPage();await p.goto('http://localhost:4123/awakening');
  for(const name of ['Follow the glowing tree','Follow the forest path','Approach the Ember']){
    await expect(p.locator('main')).toHaveAttribute('data-phase','idle');
    await p.getByRole('button',{name,exact:true}).click();
  }
  await expect(p.locator('main')).toHaveAttribute('data-scene','discovery');
  expect(await p.locator('.opening-flame').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  await p.screenshot({path:`${out}/320-reduced.png`});
  results.push({reducedMotion:'pass'});await context.close();
  const fail=await browser.newPage();await fail.route('**/opening/forest.png*',r=>r.abort());
  await fail.goto('http://localhost:4123/awakening');await expect(fail.getByText('The forest could not load.')).toBeVisible();
  await fail.unroute('**/opening/forest.png*');await fail.getByRole('button',{name:'Try again'}).click();
  await expect(fail.locator('main')).toHaveAttribute('data-phase','idle');results.push({assetRecovery:'pass'});await fail.close();
  await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}

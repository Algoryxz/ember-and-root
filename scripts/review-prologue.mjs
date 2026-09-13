import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const out='docs/review/prologue-v1';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const report=[];
try {
  const viewports=process.argv.includes('--capture-only')?[[1440,900],[390,844]]:[[1440,900],[390,844],[320,700],[375,812],[768,1024]];
  for(const [width,height] of viewports) {
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,
      ...(width===1440?{recordVideo:{dir:out,size:{width:1440,height:900}}}:{})});
    const page=await context.newPage();
    const errors=[],writes=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.method()!=='GET')writes.push(r.url());});
    await page.goto('http://localhost:4123/awakening');
    for(const scene of ['forest','guided','chamber','discovery']) {
      await expect(page.locator('main')).toHaveAttribute('data-scene',scene);
      await expect(page.locator('main')).toHaveAttribute('data-phase','idle',{timeout:15000});
      const hot=page.locator('.prologue-hotspot');
      const box=await hot.boundingBox();
      expect(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height).toBe(true);
      expect(box.width>=44&&box.height>=44).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width===1440 || width===390) {
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
        await page.waitForTimeout(800);
        await page.screenshot({path:`${out}/${width}-${scene}.png`});
      }
      if(width<500) await hot.tap();else await hot.click();
    }
    await expect(page.locator('main')).toHaveAttribute('data-scene','black');
    await expect(page.locator('main')).toHaveAttribute('data-phase','idle');
    await page.waitForTimeout(600);
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);expect(writes).toEqual([]);
    const video=page.video();
    await context.close();
    if(video)await video.saveAs(`${out}/forest-to-ember.webm`);
    report.push({width,height,flow:'pass',touch:width<500,axe:'pass',errors,writes});
  }
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const p=await context.newPage();await p.goto('http://localhost:4123/awakening');
  for(let i=0;i<4;i++){
    await expect(p.locator('main')).toHaveAttribute('data-phase','idle');
    await p.locator('.prologue-hotspot').focus();await p.keyboard.press('Enter');
  }
  await expect(p.locator('main')).toHaveAttribute('data-scene','black');
  await expect(p.getByRole('button',{name:'Replay prologue'})).toBeFocused();
  await p.keyboard.press('Enter');await expect(p.locator('main')).toHaveAttribute('data-scene','forest');
  await p.getByRole('button',{name:'Skip cinematic'}).click();
  await p.waitForTimeout(2000);await expect(p.locator('main')).toHaveAttribute('data-scene','black');
  report.push({keyboardReducedMotionReplaySkip:'pass'});await context.close();
  await writeFile(`${out}/${process.argv.includes('--capture-only')?'production-capture':'verification'}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}

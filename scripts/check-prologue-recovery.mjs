import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome'});
try{
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto('http://localhost:4123/awakening');
  for(const s of ['forest','guided','chamber','discovery']){
    await expect(p.locator('main')).toHaveAttribute('data-phase','idle');
    await expect(p.locator('main')).toHaveAttribute('data-scene',s);
    await p.locator('.prologue-hotspot').focus();await p.keyboard.press('Enter');
  }
  await expect(p.getByRole('button',{name:'Replay prologue'})).toBeFocused();
  await p.keyboard.press('Enter');
  await p.getByRole('button',{name:'Skip cinematic'}).click();
  await p.waitForTimeout(3500);await expect(p.locator('main')).toHaveAttribute('data-scene','black');
  await p.close();
  const f=await b.newPage({reducedMotion:'reduce'});
  await f.route('**/opening/root-chamber.webp*',r=>r.abort());
  await f.goto('http://localhost:4123/awakening');
  await expect(f.locator('main')).toHaveAttribute('data-phase','idle');
  await f.locator('.prologue-hotspot').click();
  await expect(f.getByText('The scene could not load.')).toBeVisible();
  await f.unroute('**/opening/root-chamber.webp*');await f.getByRole('button',{name:'Try again'}).click();
  await expect(f.locator('.prologue-hotspot')).toHaveAttribute('aria-disabled','false');
  await f.locator('.prologue-hotspot').click();await expect(f.locator('main')).toHaveAttribute('data-scene','chamber');
  await f.close();
  const g=await b.newPage();
  await g.goto('file:///C:/Users/smara/Desktop/ember-and-root/docs/review/prologue-v1/index.html');
  await g.waitForFunction(()=>document.querySelector('video').readyState>=1);
  expect(await g.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  console.log(JSON.stringify({normalKeyboard:'pass',skipCancellation:'pass',lazyTextureRetry:'pass',galleryImages:'pass',videoDuration:await g.locator('video').evaluate(v=>v.duration)}));
  await writeFile('docs/review/prologue-v1/recovery.json',JSON.stringify({normalKeyboard:'pass',skipCancellation:'pass',lazyTextureRetry:'pass',galleryImages:'pass'}));
}finally{await b.close();}

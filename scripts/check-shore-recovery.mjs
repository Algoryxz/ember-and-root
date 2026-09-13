import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});const report=[];
try{
 const context=await browser.newContext({viewport:{width:720,height:450},reducedMotion:'reduce'});const page=await context.newPage();
 let blocked=true;await page.route('**/opening/storm-shore.webp*',route=>blocked?route.abort():route.continue());
 await page.goto('http://localhost:4123/');await page.getByRole('button',{name:'Skip cinematic'}).click();
 await expect(page.getByText('The shore could not load.')).toBeVisible();blocked=false;await page.getByRole('button',{name:'Try again'}).click();
 const begin=page.getByRole('button',{name:'BEGIN YOUR PATH'});await expect(begin).toBeVisible();
 const box=await begin.boundingBox();expect(box.y>=0&&box.y+box.height<=450).toBe(true);
 await begin.focus();await page.keyboard.press('Enter');await page.waitForURL('**/signup?from=ember');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'docs/review/prologue-v2/720-signup-zoom-equivalent.png',fullPage:true});
 report.push({missingShoreRetry:'pass',keyboardAfterRetry:'pass',zoomEquivalent:'720x450 CSS pixels at a 1440x900 equivalent 200% layout',overflow:false});
 await page.goto('file:///'+process.cwd().replaceAll('\\','/')+'/docs/review/prologue-v2/index.html');
 await page.locator('footer').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);
 expect(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
 report.push({galleryImages:'pass'});await context.close();
}finally{await browser.close();await writeFile('docs/review/prologue-v2/recovery.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));

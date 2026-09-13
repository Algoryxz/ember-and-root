import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});const report=[];
try{for(const profile of [{name:'desktop',width:1440,height:900,dpr:1,cpu:1},{name:'mobile-emulation',width:390,height:844,dpr:2,cpu:4}]){
 const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr});const page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
 await page.goto('http://localhost:4123/');await page.getByRole('button',{name:'Skip cinematic'}).click();await expect(page.locator('.shore-copy')).toBeVisible();await page.waitForTimeout(2500);
 const frames=await page.evaluate(()=>new Promise(resolve=>{const frames=[];let last=0,start=0;const tick=t=>{if(!start)start=t;if(last)frames.push(t-last);last=t;if(t-start<6000)requestAnimationFrame(tick);else resolve(frames);};requestAnimationFrame(tick);}));
 report.push({...profile,rafFps:+(1000/(frames.reduce((a,b)=>a+b,0)/frames.length)).toFixed(1),sampledFrames:frames.length,measurement:'Local production final shore frame-callback cadence after edge compositing fix; not GPU-presented FPS'});await context.close();
}}finally{await browser.close();await writeFile('docs/review/prologue-v2/final-shore-performance.json',JSON.stringify(report,null,2));}console.log(report);

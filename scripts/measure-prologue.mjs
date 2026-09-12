import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const results=[];
try {
  for(const profile of [{name:'desktop',width:1440,height:900,dpr:1,cpu:1},{name:'mobile-emulation',width:390,height:844,dpr:2,cpu:4}]){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr,hasTouch:profile.cpu>1});
    const page=await context.newPage();const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:4123/awakening');
    await expect(page.locator('main')).toHaveAttribute('data-phase','idle',{timeout:20000});
    await page.evaluate(()=>{
      window.__frameSample={frames:[],last:0,handle:0};
      const tick=time=>{const s=window.__frameSample;if(s.last)s.frames.push({dt:time-s.last,scene:document.querySelector('main').dataset.scene});s.last=time;s.handle=requestAnimationFrame(tick);};
      window.__frameSample.handle=requestAnimationFrame(tick);
    });
    for(const scene of ['forest','guided','chamber','discovery']){
      await expect(page.locator('main')).toHaveAttribute('data-scene',scene);
      await expect(page.locator('main')).toHaveAttribute('data-phase','idle',{timeout:15000});
      await page.waitForTimeout(1800);
      await page.locator('.prologue-hotspot').click();
    }
    await expect(page.locator('main')).toHaveAttribute('data-scene','black');
    const frames=await page.evaluate(()=>{cancelAnimationFrame(window.__frameSample.handle);return window.__frameSample.frames;});
    const stages={};
    for(const scene of ['forest','guided','chamber','discovery','surge']){
      const times=frames.filter(f=>f.scene===scene).map(f=>f.dt).sort((a,b)=>a-b);
      stages[scene]={sampledFrames:times.length,rafFps:Number((1000/(times.reduce((a,b)=>a+b,0)/times.length)).toFixed(1)),p95FrameMs:Number(times[Math.floor(times.length*.95)]?.toFixed(1)),framesOver33ms:times.filter(t=>t>33.4).length};
    }
    const textures=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/opening/')).map(r=>({url:new URL(r.name).pathname,transferBytes:r.transferSize,encodedBytes:r.encodedBodySize})));
    results.push({...profile,measurement:'requestAnimationFrame cadence, no recording, local production Chrome; not GPU-presented FPS or physical phone certification',stages,errors,textures});
    await context.close();
  }
  await writeFile('docs/review/prologue-v1/performance.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}

// Temporary isolated review user; never reads or changes another player's data.
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { chromium, expect } from '@playwright/test';
const env = Object.fromEntries((await readFile('.env.local','utf8')).split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1).replace(/^['"]|['"]$/g,'')];}));
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const email=`visual-review-${randomUUID()}@example.com`;const password=randomUUID()+'Aa!';
let userId;let browser;const report=[];
try {
  const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw error;
  userId=data.user.id;
  const profile=await admin.from('profiles').select('preferences').eq('user_id',userId).single();
  if(profile.error)throw profile.error;
  const update=await admin.from('profiles').update({preferences:{...profile.data.preferences,onboarded:true}}).eq('user_id',userId);if(update.error)throw update.error;
  browser=await chromium.launch({channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:4123/login');await page.getByLabel('Email address').fill(email);await page.getByLabel('Password',{exact:false}).fill(password);
  await page.getByRole('button',{name:'Return to the Hearth'}).click();await page.waitForURL('**/hearth',{timeout:20000});
  for(const width of (process.argv.includes('--additional') ? [320,375,768,720] : [1440,390])){
    await page.setViewportSize({width,height:width===1440?900:width===720?450:844});
    for(const route of ['hearth','root','satchel','chronicle','settings']){
      await page.goto(`http://localhost:4123/${route}`);await page.waitForTimeout(1500);
      await expect(page.locator('.game-world')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`docs/review/prologue-v2/${width}-${route}.png`,fullPage:true});
      report.push({width,route,authenticated:true,overflow:false});
    }
  }
  expect(errors).toEqual([]);report.push({runtimeErrors:errors});
} finally {
  if(browser)await browser.close();
  if(userId){const result=await admin.auth.admin.deleteUser(userId);report.push({temporaryUserRemoved:!result.error});if(result.error)console.error('Temporary review user cleanup failed.');}
  await writeFile(`docs/review/prologue-v2/${process.argv.includes('--additional') ? 'game-additional' : 'game-verification'}.json`,JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report,null,2));


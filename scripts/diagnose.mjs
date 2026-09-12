import { chromium } from "@playwright/test";

const CHROME = "C:\\Users\\smara\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on("console", msg => console.log("PAGE LOG:", msg.type(), msg.text()));
  page.on("pageerror", err => console.log("PAGE ERROR:", err.message));
  page.on("requestfailed", req => console.log("REQ FAILED:", req.url(), req.failure()?.errorText));

  const resp = await page.goto("http://localhost:4123", { waitUntil: "domcontentloaded" });
  console.log("Response status:", resp.status());
  await page.waitForTimeout(1000);

  const heroHTML = await page.$eval(".cinematic-hero", el => el.outerHTML.slice(0, 400)).catch(e => e.message);
  console.log("Hero snippet:", heroHTML);

  const heroStyle = await page.$eval(".cinematic-hero", el => {
    const s = window.getComputedStyle(el);
    return { bg: s.backgroundColor, w: s.width, h: s.height, pos: s.position };
  }).catch(e => e.message);
  console.log("Hero computed style:", heroStyle);

  const bgImg = await page.$eval(".ch-bg-img", el => ({ src: el.src, naturalWidth: el.naturalWidth, complete: el.complete })).catch(e => e.message);
  console.log("BG img info:", bgImg);

  await browser.close();
})().catch(e => { console.error("SCRIPT ERROR:", e); process.exit(1); });

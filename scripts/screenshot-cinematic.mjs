import { chromium } from "@playwright/test";
import path from "path";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots", "landing");
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "cinematic-1440x900", width: 1440, height: 900 },
  { name: "cinematic-390x844", width: 390, height: 844 },
];

const CHROME = "C:\\Users\\smara\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto("http://localhost:4123", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);
    const outPath = path.join(OUT_DIR, vp.name + ".png");
    await page.screenshot({ path: outPath, fullPage: false });
    console.log("Saved: " + vp.name + ".png");
    await page.close();
  }
  await browser.close();
  console.log("Done.");
})().catch(e => { console.error(e.message); process.exit(1); });

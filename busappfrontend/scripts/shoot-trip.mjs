import { chromium } from "playwright";

const outPath = process.argv[2];
if (!outPath) {
  console.error("Usage: node scripts/shoot-trip.mjs <output-path>");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 940 } });
await page.goto("http://localhost:3000/trip", { waitUntil: "networkidle" });
await page.screenshot({ path: outPath });
await browser.close();
console.log(`saved ${outPath}`);

import { chromium } from "playwright";
import sharp from "sharp";

const outPath = process.argv[2];
if (!outPath) {
  console.error("Usage: node scripts/shoot.mjs <output-path>");
  process.exit(1);
}

// Render at true 390x858 (the corrected scale), then downscale to the
// reference's 288x634 render for a like-for-like comparison.
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 858 } });
await page.goto("http://localhost:3000/plan", { waitUntil: "networkidle" });
const buf = await page.screenshot();
await browser.close();

await sharp(buf).resize(288, 634).toFile(outPath);
console.log(`saved ${outPath}`);

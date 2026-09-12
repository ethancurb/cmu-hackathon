import { chromium } from "playwright";

const REF_SIZE = 200;
const SCALE = 1.354;

const CASES = [
  { role: "label (from 'Plan')", text: "Plan", fontVar: "--font-mono", weight: 400, tracking: 0, measured288: 42, isNewToken: "--text-label" },
  { role: "button-label (from 'USE SELECTED TIME')", text: "USE SELECTED TIME", fontVar: "--font-mono", weight: 400, tracking: 0.08, measured288: 152, isNewToken: "--text-button-label" },
  { role: "button-label (from 'NEXT 7 DAYS')", text: "NEXT 7 DAYS", fontVar: "--font-mono", weight: 400, tracking: 0.08, measured288: 76, isNewToken: "--text-button-label" },
  { role: "body cross-check (from 'Today')", text: "Today", fontVar: "--font-mono", weight: 400, tracking: 0, measured288: 36, isNewToken: null },
  { role: "body cross-check (from 'Low crowding')", text: "Low crowding", fontVar: "--font-mono", weight: 400, tracking: 0, measured288: 90, isNewToken: null },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/plan", { waitUntil: "networkidle" });

const results = [];
for (const c of CASES) {
  const measure = async (size) =>
    page.evaluate(
      ({ text, fontVar, weight, size, tracking }) => {
        const span = document.createElement("span");
        span.textContent = text;
        span.style.position = "absolute";
        span.style.visibility = "hidden";
        span.style.whiteSpace = "pre";
        span.style.fontFamily = `var(${fontVar})`;
        span.style.fontWeight = String(weight);
        span.style.fontSize = `${size}px`;
        span.style.letterSpacing = `${tracking}em`;
        document.body.appendChild(span);
        const w = span.getBoundingClientRect().width;
        document.body.removeChild(span);
        return w;
      },
      { text: c.text, fontVar: c.fontVar, weight: c.weight, size, tracking: c.tracking }
    );

  const widthAtRef = await measure(REF_SIZE);
  const perPx = widthAtRef / REF_SIZE;
  const target = c.measured288 * SCALE;
  const solvedSize = target / perPx;
  const rounded = Math.round(solvedSize);
  const verifiedWidth = await measure(rounded);

  results.push({
    role: c.role,
    text: c.text,
    tracking: c.tracking,
    measured288: c.measured288,
    target390: Number(target.toFixed(2)),
    solvedSizeExact: Number(solvedSize.toFixed(3)),
    solvedSizeRounded: rounded,
    verifiedWidthAtRounded: Number(verifiedWidth.toFixed(2)),
    diff: Number((verifiedWidth - target).toFixed(2)),
  });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();

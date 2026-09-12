import { chromium } from "playwright";

const REF_SIZE = 200; // px, reference size for linear width measurement

const CASES = [
  { role: "location-subhead", text: "Morewood Avenue", font: "display-none", fontVar: "--font-mono", weight: 400, measured288: 124 },
  { role: "emphasis-number", text: "10:00 am", fontVar: "--font-mono", weight: 700, measured288: 73 },
  { role: "section-label", text: "Top recommendations", fontVar: "--font-mono", weight: 400, measured288: 132 },
  { role: "row-title", text: "8:30 - 10:00 am", fontVar: "--font-mono", weight: 700, measured288: 97 },
  { role: "row-subtitle", text: "Lowest crowding", fontVar: "--font-mono", weight: 400, measured288: 85 },
  { role: "chart-caption", text: "Drag across the chart to compare.", fontVar: "--font-mono", weight: 400, measured288: 185 },
  { role: "footnote", text: "Based on forecast weather and local activity.", fontVar: "--font-mono", weight: 400, measured288: 209 },
  { role: "headline", text: "A quieter trip.", fontVar: "--font-display", weight: 400, measured288: 192 },
  { role: "wordmark", text: "LoadLine", fontVar: "--font-display", weight: 400, measured288: 66 },
];

const SCALE = 1.354;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/plan", { waitUntil: "networkidle" });

const results = [];
for (const c of CASES) {
  const widthAtRef = await page.evaluate(
    ({ text, fontVar, weight, refSize }) => {
      const span = document.createElement("span");
      span.textContent = text;
      span.style.position = "absolute";
      span.style.visibility = "hidden";
      span.style.whiteSpace = "pre";
      span.style.fontFamily = `var(${fontVar})`;
      span.style.fontWeight = String(weight);
      span.style.fontSize = `${refSize}px`;
      document.body.appendChild(span);
      const w = span.getBoundingClientRect().width;
      document.body.removeChild(span);
      return w;
    },
    { text: c.text, fontVar: c.fontVar, weight: c.weight, refSize: REF_SIZE }
  );

  const perPx = widthAtRef / REF_SIZE;
  const target = c.measured288 * SCALE;
  const solvedSize = target / perPx;

  // Verify: render at the rounded solved size and measure actual width
  const rounded = Math.round(solvedSize);
  const verifiedWidth = await page.evaluate(
    ({ text, fontVar, weight, size }) => {
      const span = document.createElement("span");
      span.textContent = text;
      span.style.position = "absolute";
      span.style.visibility = "hidden";
      span.style.whiteSpace = "pre";
      span.style.fontFamily = `var(${fontVar})`;
      span.style.fontWeight = String(weight);
      span.style.fontSize = `${size}px`;
      document.body.appendChild(span);
      const w = span.getBoundingClientRect().width;
      document.body.removeChild(span);
      return w;
    },
    { text: c.text, fontVar: c.fontVar, weight: c.weight, size: rounded }
  );

  results.push({
    role: c.role,
    text: c.text,
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

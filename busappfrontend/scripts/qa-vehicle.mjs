// Interactive XD60 QA against a production server on :3100.
// Verifies local model load, controls, responsive fit and clean view switching.
import { chromium } from "playwright";

const base = process.env.QA_BASE ?? "http://localhost:3100";
const browser = await chromium.launch({ headless: true });
const problems = [];

try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, geolocation: { latitude: 40.4443, longitude: -79.9428 }, permissions: ["geolocation"] });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Vehicle model" }).click();
    await page.getByText("Drag to orbit · illustrative model · not live occupancy").waitFor({ timeout: 20_000 });

    const model = page.getByLabel(/Interactive 3D New Flyer XD60/);
    await model.focus();
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "Pause" }).click();
    await page.getByRole("button", { name: "Play" }).waitFor();
    await page.getByRole("button", { name: "See inside" }).click();
    await page.getByRole("button", { name: "Exterior" }).waitFor();
    await page.getByLabel("Bend the articulated bus").fill("24");
    await page.waitForTimeout(1000);

    const layout = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[aria-label^="Interactive 3D"]');
      const panel = canvas?.parentElement;
      if (!canvas || !panel) return null;
      const rect = panel.getBoundingClientRect();
      return {
        panelWidth: rect.width,
        viewportWidth: document.documentElement.clientWidth,
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        canvasPixels: { width: canvas.width, height: canvas.height },
      };
    });
    if (!layout || layout.docOverflow > 0 || layout.panelWidth > layout.viewportWidth || !layout.canvasPixels.width || !layout.canvasPixels.height) {
      problems.push(`${viewport.width}px: bad model layout ${JSON.stringify(layout)}`);
    }

    await page.screenshot({ path: `../qa/${viewport.width}-vehicle-cutaway.png`, fullPage: true });
    const crowdingPanel = await page.getByText("passenger load").count();
    if (!crowdingPanel) problems.push(`${viewport.width}px: expected the near-CMU crowding panel below vehicle mode, found none`);
    await page.getByRole("button", { name: "Route list" }).click();
    const routeRows = await page.getByRole("radio").count();
    if (!routeRows) problems.push(`${viewport.width}px: List view did not show the route-selection list`);
    await page.getByRole("button", { name: "Map view" }).click();
    await page.getByRole("button", { name: "Vehicle model" }).click();
    await page.getByText("Drag to orbit · illustrative model · not live occupancy").waitFor({ timeout: 20_000 });

    if (errors.length) problems.push(`${viewport.width}px console: ${errors.join(" | ")}`);
    console.log(`${viewport.width}px: model loaded, controls exercised, Map/List/Vehicle switched, crowding panel visible, overflow ${layout?.docOverflow}`);
    await context.close();
  }
} finally {
  await browser.close();
}

if (problems.length) throw new Error(problems.join("\n"));
console.log("vehicle flow ok, no page errors");

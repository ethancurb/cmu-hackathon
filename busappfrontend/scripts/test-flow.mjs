import { chromium } from "playwright";

function log(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 940 } });
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

// 1. Land on home
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
log("Lands on / (home)", page.url() === "http://localhost:3000/");

// Default route is 61 — confirm via aria-checked on the arrival card radio group
const initiallySelected = await page.getAttribute('[role="radio"][aria-label*="Route 61"]', "aria-checked");
log("Default selected route is 61", initiallySelected === "true", `(was ${initiallySelected})`);

// 2. Select a different card (71)
await page.click('[role="radio"][aria-label*="Route 71"]');
const route71Checked = await page.getAttribute('[role="radio"][aria-label*="Route 71"]', "aria-checked");
const route61Checked = await page.getAttribute('[role="radio"][aria-label*="Route 61"]', "aria-checked");
log("Selecting card 71 checks it and unchecks 61", route71Checked === "true" && route61Checked === "false");

const summaryValue = await page.textContent("text=4 min");
log("Summary row updates to route 71's arrival time (4 min)", !!summaryValue);
const summaryStatus = await page.locator("text=On time").count();
log("Summary row status updates to route 71's status (On time)", summaryStatus > 0);

// 3. Tap the time row -> navigate to /plan
await page.click('button:has-text("Leave now")');
await page.waitForURL("**/plan");
log("Tapping time row navigates to /plan", page.url().endsWith("/plan"));

// 4. Pick a different time: click the "6p" bar (index 6, the tallest area) via its aria-label
const bars = await page.locator('[role="radiogroup"][aria-label="Select an hour"] [role="radio"]').all();
await bars[6].click(); // idx6 = "6:00 pm"
const chartValue = await page.locator("p.text-emphasis-number").first().textContent();
log("Clicking a chart bar updates the value display", chartValue?.trim() === "6:00 pm", `(shows "${chartValue}")`);

const bar6Checked = await bars[6].getAttribute("aria-checked");
const bar2Checked = await bars[2].getAttribute("aria-checked");
log("Selected bar is checked, previous default (idx2) is not", bar6Checked === "true" && bar2Checked === "false");

// Recommendation checkboxes should now show none checked (6pm doesn't match any recommendation)
const recGroupChecked = await page.locator('[role="radiogroup"][aria-label="Top recommendations"] [role="radio"][aria-checked="true"]').count();
log("No recommendation is checked after picking an unrelated hour", recGroupChecked === 0);

// 5. Press primary button to apply and navigate home
await page.click('button:has-text("Use selected time")');
await page.waitForURL("http://localhost:3000/");
log("Primary button navigates back to /", page.url() === "http://localhost:3000/");

// 6. Confirm the applied time now shows in the home time row
const appliedTime = await page.locator('button:has-text("Leave now")').textContent();
log('Home time row shows the applied time ("6:00 pm")', appliedTime?.includes("6:00 pm"), `(row text: "${appliedTime}")`);

// Confirm route selection persisted across the /plan round trip (context, not reset)
const route71StillChecked = await page.getAttribute('[role="radio"][aria-label*="Route 71"]', "aria-checked");
log("Route selection (71) persisted across the /plan round trip", route71StillChecked === "true");

// 7. Nav-back-chevron test: go to /plan, change hour, hit back chevron, confirm nothing applied
await page.click('button:has-text("6:00 pm")'); // time row now shows applied time; tap again to return to /plan
await page.waitForURL("**/plan");
const barsAgain = await page.locator('[role="radiogroup"][aria-label="Select an hour"] [role="radio"]').all();
await barsAgain[8].click(); // pick a third, different hour (10:00 pm)
await page.getByRole("button", { name: "Plan" }).click(); // nav back chevron (its accessible name comes from the visible "Plan" text)
await page.waitForURL("http://localhost:3000/");
const timeAfterBack = await page.locator('button:has-text("Leave now")').textContent();
log(
  'Nav-back chevron returns home WITHOUT applying the browsed (10:00 pm) selection',
  timeAfterBack?.includes("6:00 pm") && !timeAfterBack?.includes("10:00 pm"),
  `(row text: "${timeAfterBack}")`
);

// 8. /trip redirect
const page2 = await browser.newPage();
await page2.goto("http://localhost:3000/trip", { waitUntil: "networkidle" });
log("/trip redirects to /", page2.url() === "http://localhost:3000/");
await page2.close();

// 9. Weather chip dismiss persists for the session (same page, no reload)
const chipVisible = await page.locator("text=Ends in 18m").count();
log("Weather chip visible before dismiss", chipVisible > 0);
await page.click('button[aria-label="Dismiss"]');
const chipAfterDismiss = await page.locator("text=Ends in 18m").count();
log("Weather chip dismissed after clicking X", chipAfterDismiss === 0);

// 10. Only visual views remain; route information stays in tiles below either one.
const listControl = await page.locator('button[aria-label="List view"]').count();
log("List view control is removed", listControl === 0);
const routeTiles = await page.locator('[role="radiogroup"][aria-label="Select a route"] [role="radio"]').count();
log("Three route tiles remain visible below the map", routeTiles === 3);
await page.click('button[aria-label="Vehicle model"]');
const vehicleTiles = await page.locator('[role="radiogroup"][aria-label="Select a route"] [role="radio"]').count();
log("Route tiles remain visible below the vehicle model", vehicleTiles === 3);
await page.click('button[aria-label="Map view"]');

// 11. Location field inline edit
await page.click('button[aria-label="Edit location"]');
const inputVisible = await page.locator('input[aria-label="Location"]').count();
log("Pencil opens an inline input", inputVisible > 0);
await page.fill('input[aria-label="Location"]', "Forbes Avenue");
await page.keyboard.press("Enter");
const newLocation = await page.locator("text=Forbes Avenue").count();
log("Enter commits the new location value", newLocation > 0);

// Escape-cancels check
await page.click('button[aria-label="Edit location"]');
await page.fill('input[aria-label="Location"]', "Should not stick");
await page.keyboard.press("Escape");
const reverted = await page.locator("text=Forbes Avenue").count();
const stuck = await page.locator("text=Should not stick").count();
log("Escape cancels the edit, reverting to the prior value", reverted > 0 && stuck === 0);

// 12. Disabled utility buttons are genuinely disabled
const chatDisabled = await page.isDisabled('button[aria-label*="Feedback"]');
log("Chat utility button is disabled (no destination yet)", chatDisabled);

// 13. Locate button recenters (transform resets to translate(0px, 0px))
// Route 71 is still selected (offset {14,-8}, non-zero) from earlier in this flow.
const mapContent = page.locator('div[style*="transition: transform"]').first();
const beforeTransform = await mapContent.evaluate((el) => el.getAttribute("style"));
await page.click('button[aria-label="Locate me"]');
await page.waitForTimeout(250); // let the 200ms transition finish
const afterTransform = await mapContent.evaluate((el) => el.getAttribute("style"));
log("Locate button changes the map's transform (recenters)", beforeTransform !== afterTransform, `(${beforeTransform} -> ${afterTransform})`);

await browser.close();

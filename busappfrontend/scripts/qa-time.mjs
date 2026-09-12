// Home time row -> direct time picker: leave-at/arrive-by mode, day/time
// selection, and the resulting route search actually carries that deadline.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.QA_BASE ?? 'http://localhost:3100';
const destination = { lat: 40.4586, lng: -79.9558, label: 'QA destination' };
const journey = {
  id: 'qa-time-journey', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1_800_000).toISOString(),
  durationSeconds: 1800, transfers: 0, walkSeconds: 600, rideSeconds: 1200, waitSeconds: 0, realTime: false,
  legs: [{ mode: 'BUS', from: { ...destination, name: 'Origin', stopId: 'qa-o', at: new Date().toISOString(), scheduledAt: new Date().toISOString() },
    to: { ...destination, name: 'Destination', stopId: 'qa-d', at: new Date().toISOString(), scheduledAt: new Date().toISOString() },
    startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1_800_000).toISOString(), durationSeconds: 1800, distanceMeters: null,
    routeShortName: '61C', headsign: 'Oakland', agency: 'QA fixture', tripId: 'qa-trip', realTime: false, intermediateStops: 2, geometry: [destination, destination] }],
};

function localHourMinute(iso) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(iso));
  return { hour: Number(parts.find((p) => p.type === 'hour')?.value), minute: Number(parts.find((p) => p.type === 'minute')?.value) };
}

// requests[] is populated by a Node-side page.route handler, so it must be
// polled from Node, not via page.waitForFunction (which runs in the browser).
async function waitForCount(requests, min, timeout = 5000) {
  const start = Date.now();
  while (requests.length < min && Date.now() - start < timeout) await new Promise((r) => setTimeout(r, 50));
}

const browser = await chromium.launch({ headless: true });
try {
  for (const width of [320, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript((dest) => localStorage.setItem('loadline:destination', JSON.stringify(dest)), destination);
    const requests = [];
    await page.route('**/api/journey?**', (route) => {
      requests.push(new URL(route.request().url()));
      return route.fulfill({ json: { status: 'ok', provider: 'QA fixture', fetchedAt: new Date().toISOString(), journeys: [journey] } });
    });
    await page.route('**/api/pressure**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'not needed for this check' }) }));
    await page.goto(base, { waitUntil: 'domcontentloaded' });

    const timeRow = page.getByRole('button', { name: /^Trip time:/ });
    await timeRow.waitFor();
    await waitForCount(requests, 1); // the initial "leave now" search on mount
    const afterLoad = requests.length;

    await timeRow.click();
    const dialog = page.getByRole('dialog', { name: 'Choose a time' });
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('radio', { name: 'Leave at' }).getAttribute('aria-checked'), 'true');
    assert.equal(await dialog.getByLabel('Day', { exact: true }).inputValue(), 'Today');

    // Escape closes without applying anything.
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(requests.length, afterLoad, 'opening/closing the picker triggered a route search');

    // Arrive by a specific time re-searches with that deadline.
    await timeRow.click();
    await dialog.getByRole('radio', { name: 'Arrive by' }).click();
    await dialog.getByLabel('Time', { exact: true }).fill('19:15');
    const before = requests.length;
    await dialog.getByRole('button', { name: 'Set arrival time' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText(/^Arrive by$/).waitFor();
    await waitForCount(requests, before + 1);
    const call = requests.at(-1);
    assert.ok(call && requests.length > before, 'no route search followed setting an arrival time');
    assert.equal(call.searchParams.get('arriveBy'), '1');
    const { hour, minute } = localHourMinute(call.searchParams.get('at'));
    assert.equal(hour, 19);
    assert.equal(minute, 15);
    const homeText = await page.locator('body').innerText();
    assert.match(homeText, /Arrive by[\s\S]{0,20}7:15 PM/);
    console.log(`${width}px: arrive-by 7:15 PM sent arriveBy=1 with the right local time; home shows "Arrive by ... 7:15 PM"`);

    // Reopening offers "Leave now instead", which resets both the mode and the row.
    await timeRow.click();
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('radio', { name: 'Arrive by' }).getAttribute('aria-checked'), 'true');
    await dialog.getByRole('button', { name: 'Leave now instead' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText(/^Leave now$/).first().waitFor();
    console.log(`${width}px: "Leave now instead" clears arrive-by back to Leave now`);

    // Backdrop click closes without changes. The backdrop button covers the
    // full screen but the centered card sits over its default click point, so
    // click a corner that's outside the card instead.
    await timeRow.click();
    await dialog.waitFor();
    await page.getByRole('button', { name: 'Close time picker' }).click({ position: { x: 5, y: 5 } });
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    assert.deepEqual(errors, []);
    console.log(`${width}px: backdrop closes, no overflow, no page errors`);
    await context.close();
  }
} finally {
  await browser.close();
}

// Deterministic UI-only fixtures: card interactions and shared journey selection.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildPressure } from '../lib/pressure/engine.ts';
import { demoBundle } from '../lib/pressure/demo.ts';

const base = process.env.QA_BASE ?? 'http://localhost:3100';
const bundle = demoBundle('pirates', 3);
const pressure = buildPressure(bundle, bundle.generatedAt);
const from = { name: 'QA origin', lat: 40.4443, lng: -79.9428, stopId: 'qa-start', scheduledAt: null };
const to = { name: 'QA destination', lat: 40.4462, lng: -80.0083, stopId: 'qa-end', scheduledAt: null };
const startTime = new Date(Date.now() + 600_000).toISOString();
function journey(id, routeShortName, durationSeconds) {
  const endTime = new Date(Date.parse(startTime) + durationSeconds * 1000).toISOString();
  return { id, startTime, endTime, durationSeconds, transfers: 0, walkSeconds: 0, rideSeconds: durationSeconds, waitSeconds: 0, realTime: false,
    legs: [{ mode: 'BUS', from: { ...from, at: startTime }, to: { ...to, at: endTime }, startTime, endTime, durationSeconds, distanceMeters: null, routeShortName, headsign: 'QA destination', agency: 'QA fixture', tripId: id, realTime: false, intermediateStops: 0, geometry: [from, to] }] };
}
const journeys = [journey('qa-slow', 'SLOW', 2400), journey('qa-best', 'BEST', 1200)];
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [320, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.addInitScript(() => localStorage.setItem('loadline:destination', JSON.stringify({ label: 'QA destination', lat: 40.4462, lng: -80.0083 })));
    await page.route('**/api/pressure?**', route => route.fulfill({ json: pressure }));
    await page.route('**/api/journey?**', route => route.fulfill({ json: { status: 'ok', provider: 'QA fixture', fetchedAt: startTime, journeys } }));
    await page.goto(base);
    const advice = page.getByRole('button', { name: /^Advice/ });
    await advice.waitFor();
    assert.equal(await advice.getAttribute('aria-expanded'), 'false');
    await advice.click();
    const row = page.getByRole('region', { name: 'Advice insights', exact: true });
    const first = row.getByRole('button').first();
    assert.match(await first.innerText(), /BEST/);
    assert.doesNotMatch(await row.innerText(), /[+-]\d/);
    const square = await first.boundingBox();
    assert.equal(square.width, square.height);
    assert.ok(await row.evaluate(el => el.scrollWidth > el.clientWidth));
    await page.getByRole('button', { name: 'Next Advice insights' }).click();
    assert.ok(await row.evaluate(el => el.scrollLeft > 0));
    const event = row.getByRole('button', { name: /Event: Pirates/ });
    await event.click();
    assert.equal(await event.getAttribute('aria-expanded'), 'true');
    await page.getByText(/end is an estimate/).waitFor();
    await event.click();
    assert.equal(await event.getAttribute('aria-expanded'), 'false');
    await event.focus();
    await page.keyboard.press('Enter');
    assert.equal(await event.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Previous Advice insights' }).click();
    await row.screenshot({ path: `../qa/insights-${width}-advice.png` });
    await page.getByRole('button', { name: 'List view', exact: true }).click();
    await first.click();
    const selected = page.getByRole('radiogroup', { name: 'Journey options' }).getByRole('radio', { checked: true });
    assert.match(await selected.innerText(), /BEST/);
    await page.locator('[aria-label="Interactive map of your trip"]').getByText('BEST', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Trip map');
    await advice.click();
    assert.equal(await row.count(), 0);

    await page.goto(base + '/plan');
    const bars = page.getByRole('radio', { name: /pressure \d+ of 100/ });
    await bars.first().click();
    const timeline = page.getByRole('region', { name: 'Timeline insights', exact: true });
    assert.doesNotMatch(await timeline.innerText(), /[+-]\d/);
    const timelineEvent = timeline.getByRole('button', { name: /Event: Pirates/ });
    await timelineEvent.click();
    await page.getByText(/end is an estimate/).waitFor();
    await bars.last().click();
    assert.equal(await timeline.getByRole('button', { expanded: true }).count(), 0);
    await bars.first().click();
    await timeline.screenshot({ path: `../qa/insights-${width}-timeline.png` });
    await page.getByRole('button', { name: /What's happening/ }).click();
    assert.equal(await timeline.count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);

    await page.route('**/api/journey?**', route => route.fulfill({ status: 503, json: { status: 'error', error: 'QA routing outage', retryable: true } }));
    await page.goto(base);
    await page.getByText('Routing unavailable.', { exact: true }).waitFor();
    await page.getByRole('button', { name: /^Advice/ }).click();
    await page.getByRole('button', { name: 'Your route: Routes unavailable' }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Recommended:/ }).count(), 0);
    assert.deepEqual(errors, []);
    console.log(`${width}px: square cards, scroll, expand/collapse, best bus -> map, sample changes, routing failure, no overflow/page errors passed`);
    await context.close();
  }
} finally { await browser.close(); }

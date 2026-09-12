// Explicit UI fixtures + simulated foreground GPS; no live routing/location claims.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildPressure } from '../lib/pressure/engine.ts';
import { demoBundle } from '../lib/pressure/demo.ts';

const base = process.env.QA_BASE ?? 'http://localhost:3100';
const points = [{ lat: 40.4443, lng: -79.943 }, { lat: 40.4443, lng: -79.941 }, { lat: 40.4443, lng: -79.929 }, { lat: 40.4463, lng: -79.929 }];
const names = ['QA origin', 'Forbes boarding stop', 'Shady transfer stop', 'QA destination'];
const t0 = Date.now();
const at = minutes => new Date(t0 + minutes * 60_000).toISOString();
const place = (i, minutes) => ({ ...points[i], name: names[i], stopId: `qa-${i}`, at: at(minutes), scheduledAt: at(minutes) });
const legs = points.slice(0, -1).map((from, i) => ({ mode: i === 1 ? 'BUS' : 'WALK', from: place(i, i * 10), to: place(i + 1, (i + 1) * 10), startTime: at(i * 10), endTime: at((i + 1) * 10), durationSeconds: 600, distanceMeters: null, routeShortName: i === 1 ? '61C' : null, headsign: 'Shadyside', agency: 'QA fixture', tripId: 'qa-trip', realTime: false, intermediateStops: 2, geometry: [from, points[i + 1]] }));
const trip = { id: 'qa-progress', startTime: at(0), endTime: at(30), durationSeconds: 1800, transfers: 0, walkSeconds: 1200, rideSeconds: 600, waitSeconds: 0, realTime: false, legs };
const otherTrip = { ...trip, id: 'qa-other', legs: legs.map(leg => ({ ...leg, from: { ...leg.from, lat: leg.from.lat + .04 }, to: { ...leg.to, lat: leg.to.lat + .04 }, geometry: leg.geometry.map(point => ({ ...point, lat: point.lat + .04 })) })) };
const bundle = demoBundle('pirates', 0);
const pressure = buildPressure(bundle, bundle.generatedAt);
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [320, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    let requests = 0;
    page.on('pageerror', error => errors.push(String(error)));
    await page.addInitScript(({ origin, destination }) => {
      localStorage.setItem('loadline:destination', JSON.stringify({ ...destination, label: 'QA destination' }));
      const watches = new Map();
      let id = 0;
      window.__gps = { point: origin, accuracy: 10, age: 0, watches, cleared: 0 };
      window.__sendFix = (point, accuracy = 10, age = 0) => {
        Object.assign(window.__gps, { point, accuracy, age });
        const value = { coords: { latitude: point.lat, longitude: point.lng, accuracy }, timestamp: Date.now() - age };
        watches.forEach(watch => watch.ok(value));
      };
      window.__deny = () => watches.forEach(watch => watch.fail({ code: 1 }));
      Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
        getCurrentPosition: ok => queueMicrotask(() => ok({ coords: { latitude: origin.lat, longitude: origin.lng, accuracy: 10 }, timestamp: Date.now() })),
        watchPosition: (ok, fail) => { const key = ++id; watches.set(key, { ok, fail }); queueMicrotask(() => window.__sendFix(window.__gps.point, window.__gps.accuracy, window.__gps.age)); return key; },
        clearWatch: key => { watches.delete(key); window.__gps.cleared++; },
      } });
    }, { origin: points[0], destination: points[3] });
    await page.route('**/api/journey?**', route => { requests++; return route.fulfill({ json: { status: 'ok', provider: 'QA fixture', fetchedAt: at(0), journeys: [trip, otherTrip] } }); });
    await page.route('**/api/pressure?**', route => route.fulfill({ json: pressure }));
    await page.goto(base);
    const disclosure = page.getByRole('button', { name: /^Itinerary/ });
    await disclosure.waitFor();
    assert.equal(await disclosure.getAttribute('aria-expanded'), 'false');
    await disclosure.click();
    const row = page.getByRole('region', { name: 'Itinerary steps', exact: true });
    const current = row.locator('[aria-current="step"]');
    await current.waitFor();
    assert.match(await current.getAttribute('aria-label'), /1 · Walk/);
    assert.equal(await current.evaluate(el => getComputedStyle(el).borderTopWidth), '3px');
    const square = await current.boundingBox();
    assert.equal(square.width, square.height);
    const before = requests;
    await page.evaluate(point => window.__sendFix(point), { lat: 40.4443, lng: -79.935 });
    await page.waitForFunction(() => document.querySelector('[aria-current="step"]')?.getAttribute('aria-label')?.startsWith('2'));
    assert.ok(await row.evaluate(el => el.scrollLeft > 0));
    await current.click();
    await page.getByText(/Board at Forbes boarding stop/).waitFor();
    await page.getByText(/Get off at Shady transfer stop/).waitFor();
    const future = row.getByRole('button', { name: /3 · Walk/ });
    await future.focus();
    await page.keyboard.press('Enter');
    assert.equal(await future.getAttribute('aria-expanded'), 'true');
    assert.match(await current.getAttribute('aria-label'), /2 · Transit/);
    await page.getByRole('button', { name: 'Back to current step' }).click();
    await row.screenshot({ path: `../qa/itinerary-${width}-current.png` });
    await page.evaluate(point => window.__sendFix(point), { lat: 40.4453, lng: -79.929 });
    await page.waitForFunction(() => document.querySelector('[aria-current="step"]')?.getAttribute('aria-label')?.startsWith('3'));
    await page.evaluate(point => window.__sendFix(point), points[3]);
    await page.waitForFunction(() => document.querySelector('[aria-current="step"]')?.getAttribute('aria-label')?.startsWith('4'));
    await page.getByText('Near your destination', { exact: true }).waitFor();
    assert.equal(requests, before, 'GPS fixes triggered a routing request');
    for (const [point, accuracy, age, message] of [
      [points[0], 10, 120000, 'Location is old'], [points[0], 200, 0, 'GPS is imprecise'],
      [{ lat: 40.5, lng: -80.1 }, 10, 0, 'Away from this route'],
    ]) {
      await page.evaluate(([point, accuracy, age]) => window.__sendFix(point, accuracy, age), [point, accuracy, age]);
      await page.getByText(message, { exact: false }).waitFor();
      assert.equal(await current.count(), 0);
    }
    await page.evaluate(() => window.__deny());
    await page.getByText('Location unavailable', { exact: false }).waitFor();
    assert.equal(await current.count(), 0);
    await page.evaluate(point => window.__sendFix(point), points[0]);
    await current.waitFor();
    await page.getByRole('radiogroup', { name: 'Journey options' }).getByRole('radio').nth(1).click();
    assert.equal(await row.count(), 0, 'New itinerary retained expanded old steps');
    await disclosure.click();
    await page.getByText('Away from this route', { exact: false }).waitFor();
    assert.equal(await current.count(), 0);
    assert.ok(await page.evaluate(() => window.__gps.cleared >= 1));
    await disclosure.click();
    assert.equal(await row.count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0);
    assert.deepEqual(errors, []);
    console.log(`${width}px: walking/transit/arrival outline, local GPS updates, no rerouting, scroll/details/keyboard, stale/denied/inaccurate/off-route, switch/reset and no overflow passed`);
    await context.close();
  }
} finally { await browser.close(); }

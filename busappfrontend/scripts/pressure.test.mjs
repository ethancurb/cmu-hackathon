// Model sanity tests: intuitive relationships the Transit Pressure engine must satisfy.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  predictPressure,
  buildPressure,
  eventInfluence,
  distanceKm,
  corridorDistanceKm,
  localParts,
  transitEvidenceWeight,
} from "../lib/pressure/engine.ts";
import { demoBundle, SCENARIOS, stageCount, SCENARIO_DEFINITIONS } from "../lib/pressure/demo.ts";
import { LEVELS } from "../lib/pressure/config.ts";

const CMU = { lat: 40.4443, lng: -79.9428 };
const PNC = { lat: 40.446904, lng: -80.005753 };
const quiet = () => demoBundle("pirates", 0);
const score = (bundle, at = bundle.generatedAt) => predictPressure(bundle, at).score;
const shift = (iso, minutes) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();

test("time of day: weekday morning rush > quiet midday > overnight; weekend differs from weekday", () => {
  const b = quiet();
  const rush = score(b, "2026-09-14T12:00:00Z"); // Mon 8:00 AM EDT
  const midday = score(b, "2026-09-14T17:00:00Z"); // Mon 1:00 PM
  const overnight = score(b, "2026-09-14T07:00:00Z"); // Mon 3:00 AM
  const weekend = score(b, "2026-09-12T17:00:00Z"); // Sat 1:00 PM
  assert.ok(rush > midday, "rush hour beats midday");
  assert.ok(midday > overnight, "midday beats overnight");
  assert.notEqual(weekend, midday, "weekend baseline differs from weekday");
  assert.ok(score(b, "2026-09-14T21:30:00Z") > midday, "evening commute beats midday");
});

test("event magnitude, proximity and distance", () => {
  const b = demoBundle("pirates", 1);
  const e = b.events[0];
  const at = b.generatedAt;
  const value = (event, point = b.location, time = at, dest = null) => eventInfluence(event, time, point, dest).value;
  assert.ok(value(e) > value({ ...e, magnitude: "LARGE" }), "MAJOR > LARGE");
  assert.ok(value({ ...e, magnitude: "LARGE" }) > value({ ...e, magnitude: "SMALL" }), "LARGE > SMALL");
  assert.ok(value(e) > value(e, { lat: e.lat + 0.012, lng: e.lng }), "closer event → more pressure");
  assert.equal(value(e, CMU), 0, "an event 5+ km away has no effect");
  assert.ok(distanceKm(PNC, CMU) > 5);
  // A trip whose corridor passes the venue is affected even if neither end is next to it.
  const far = { lat: 40.4462, lng: -80.065 };
  const east = { lat: 40.4462, lng: -79.98 };
  assert.ok(corridorDistanceKm(PNC, far, east) < 0.3);
  assert.ok(value(e, far, at, east) > 0, "corridor proximity counts");
  assert.equal(value(e, far), 0, "the same origin without the corridor is out of range");
});

test("event timing: tonight > tomorrow; ending near travel time > mid-game; near start > long before; after end decays", () => {
  const b = demoBundle("pirates", 1);
  const e = b.events[0];
  const v = (time, event = e) => eventInfluence(event, time, b.location).value;
  const tomorrow = { ...e, startTime: shift(e.startTime, 24 * 60), endTime: shift(e.endTime, 24 * 60) };
  assert.ok(v(b.generatedAt) > v(b.generatedAt, tomorrow), "same event tomorrow matters less tonight");
  assert.ok(v(shift(e.endTime, 5)) > v(shift(e.startTime, 60)), "exit wave > mid-event");
  assert.ok(v(shift(e.startTime, -10)) > v(shift(e.startTime, -140)), "near start > long before");
  assert.ok(v(shift(e.endTime, 5)) > v(shift(e.endTime, 60)), "pressure decays after the end");
  assert.equal(v(shift(e.endTime, 180)), 0, "gone three hours after the end");
  const exact = { ...e, endEstimated: false };
  assert.ok(v(shift(e.endTime, -40)) > v(shift(e.endTime, -40), exact), "an estimated end widens the exit wave");
});

test("staged demo: game → rain → delay each raise pressure through the same model; last stage is SURGE", () => {
  for (const scenario of SCENARIOS) {
    const scores = Array.from({ length: stageCount(scenario) }, (_, s) => score(demoBundle(scenario, s)));
    assert.ok(scores.every((n, i) => i === 0 || n > scores[i - 1]), `${scenario}: ${scores.join(" → ")}`);
    console.log(`${scenario} progression:`, scores.join(" → "));
  }
  assert.ok(score(demoBundle("pirates")) >= LEVELS.SURGE);
});

test("weather: rain alone adds; event + rain > event alone; snow and storms add; missing weather still works", () => {
  const base = quiet();
  const rainy = demoBundle("pirates", 0);
  rainy.weather = demoBundle("pirates", 2).weather;
  assert.ok(score(rainy) > score(base));
  assert.ok(score(demoBundle("pirates", 2)) > score(demoBundle("pirates", 1)));
  const snowy = quiet();
  snowy.weather = snowy.weather.map((w) => ({ ...w, snowCm: 1 }));
  assert.ok(score(snowy) > score(base));
  const stormy = quiet();
  stormy.weather = stormy.weather.map((w) => ({ ...w, weatherCode: 95 }));
  assert.ok(score(stormy) > score(base));
  const none = quiet();
  none.weather = [];
  assert.ok(Number.isFinite(score(none)));
  assert.equal(predictPressure(none, none.generatedAt).reasons.some((r) => r.type === "WEATHER"), false);
});

test("service disruption adds risk; alerts weighted by effect; realtime evidence decays with age", () => {
  const base = quiet();
  const delayed = quiet();
  delayed.transit.delayMinutes = 10;
  assert.ok(score(delayed) > score(base));
  const noService = quiet();
  noService.transit.alerts = [{ label: "No service", effect: 1 }];
  const stopMoved = quiet();
  stopMoved.transit.alerts = [{ label: "Stop moved", effect: 8 }];
  assert.ok(score(noService) > score(stopMoved), "NO_SERVICE outweighs STOP_MOVED");
  assert.ok(score(stopMoved) > score(base));
  assert.equal(transitEvidenceWeight(base.generatedAt, base.generatedAt), 1);
  assert.equal(transitEvidenceWeight(base.generatedAt, shift(base.generatedAt, 90)), 0);
  assert.ok(transitEvidenceWeight(base.generatedAt, shift(base.generatedAt, 30)) < 1);
  assert.ok(score(delayed, shift(base.generatedAt, 30)) < score(delayed), "delay evidence fades");
});

test("stale realtime lowers confidence and excludes its contribution; missing realtime still functions", () => {
  const b = demoBundle("pirates");
  const live = predictPressure(b, b.generatedAt);
  assert.equal(live.confidence, "HIGH");
  b.freshness = b.freshness.map((f) => (f.source === "PRT realtime" ? { ...f, status: "STALE" } : f));
  const stale = predictPressure(b, b.generatedAt);
  assert.notEqual(stale.confidence, "HIGH");
  assert.ok(stale.score < live.score);
  b.freshness = b.freshness.map((f) => (f.source === "PRT realtime" ? { ...f, status: "UNAVAILABLE" } : f));
  b.transit = { delayMinutes: null, alerts: [], vehicleCount: null, observedAt: null };
  assert.ok(Number.isFinite(predictPressure(b, b.generatedAt).score));
  b.events = [];
  b.weather = [];
  assert.equal(predictPressure(b, b.generatedAt).confidence, "LOW");
});

test("confidence drops with horizon", () => {
  const b = demoBundle("cmu");
  assert.equal(predictPressure(b, b.generatedAt).confidence, "HIGH");
  assert.equal(predictPressure(b, shift(b.generatedAt, 6 * 60)).confidence, "MEDIUM");
  assert.equal(predictPressure(b, shift(b.generatedAt, 30 * 60)).confidence, "LOW");
});

test("score stays within 0–100 under extreme inputs", () => {
  const b = demoBundle("pirates");
  b.events = Array.from({ length: 30 }, (_, i) => ({ ...b.events[0], id: String(i) }));
  b.transit.delayMinutes = 9999;
  b.weather = b.weather.map((w) => ({ ...w, temperatureC: 40, windKph: 90, weatherCode: 99, snowCm: 5 }));
  for (const p of buildPressure(b, b.generatedAt, 480).timeline) assert.ok(p.score >= 0 && p.score <= 100);
  const empty = quiet();
  empty.events = [];
  empty.weather = [];
  empty.transit = { delayMinutes: null, alerts: [], vehicleCount: null, observedAt: null };
  for (const p of buildPressure(empty, empty.generatedAt).timeline) assert.ok(p.score >= 0 && p.score <= 100);
});

test("surge window, best window, event impact and recommendation react to conditions", () => {
  const normal = buildPressure(quiet(), quiet().generatedAt);
  const surge = buildPressure(demoBundle("pirates"), demoBundle("pirates").generatedAt);
  assert.equal(normal.surge, null);
  assert.ok(surge.surge, "the full pirates scenario produces a surge window");
  assert.ok(surge.surge.peak >= LEVELS.SURGE);
  assert.notEqual(normal.recommendation.kind, surge.recommendation.kind);
  assert.equal(normal.recommendation.kind, "LEAVE_NOW");
  assert.ok(surge.eventImpacts.length === 1 && surge.eventImpacts[0].role === "MAJOR");
  assert.ok(surge.bestWindow.score < surge.current.score);
  // Ahead of a surge → advice names a departure before it.
  const early = demoBundle("pirates");
  const ahead = buildPressure(early, shift(early.generatedAt, -60));
  assert.ok(ahead.surge && ahead.recommendation.kind === "LEAVE_BEFORE", `${ahead.recommendation.kind}`);
  assert.ok(Date.parse(ahead.recommendation.at) < Date.parse(ahead.surge.start));
  // Timeline length follows the horizon.
  assert.equal(buildPressure(early, early.generatedAt).timeline.length, 17);
  assert.equal(buildPressure(early, early.generatedAt, 480).timeline.length, 33);
});

test("three deterministic scenarios are stable and distinct", () => {
  for (const name of SCENARIOS) {
    const b = demoBundle(name);
    assert.deepEqual(buildPressure(b, b.generatedAt), buildPressure(b, b.generatedAt));
    assert.ok(SCENARIO_DEFINITIONS[name].stages.length >= 3);
  }
  const results = SCENARIOS.map((name) => buildPressure(demoBundle(name), demoBundle(name).generatedAt).current.score);
  assert.equal(new Set(results).size, results.length);
});

test("New York timezone and DST, independent of the machine zone", () => {
  assert.equal(localParts("2026-09-14T12:00:00Z").hour, 8);
  assert.equal(localParts("2026-01-12T13:00:00Z").hour, 8);
  assert.equal(localParts("2026-11-01T05:30:00Z").hour, 1.5);
  assert.equal(localParts("2026-11-01T06:30:00Z").hour, 1.5);
  assert.equal(localParts("2026-09-12T03:00:00Z").weekdayName, "Fri");
});

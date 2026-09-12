// Selected-bar explanations: each timeline sample explains itself from its own
// reasons and events; missing coverage is stated, never turned into "nothing happening".
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPressure, riderSignalToEvent, coverageGaps } from "../lib/pressure/engine.ts";
import { demoBundle } from "../lib/pressure/demo.ts";
import { explainSample, nearestSampleIndex, dayTitle, explanationText } from "../lib/pressure/explain.ts";
import { validateRiderSignals } from "../lib/pressure/rider-signals.ts";

const shift = (iso, minutes) => new Date(Date.parse(iso) + minutes * 60_000).toISOString();

test("the exit-wave bar names the verified event, venue, timing, source and the estimated ending", () => {
  const b = demoBundle("pirates");
  const r = buildPressure(b, b.generatedAt);
  const peak = nearestSampleIndex(r.timeline, r.surge.peakAt);
  const x = explainSample(r, peak);
  const ev = x.items.find((i) => i.kind === "EVENT");
  assert.ok(ev && ev.event, "event evidence carries the event object");
  assert.equal(ev.event.name, "Pirates vs Cubs");
  assert.match(ev.detail, /PNC Park/);
  assert.match(ev.detail, /end is an estimate/);
  assert.match(ev.detail, /Authored demo scenario/);
  assert.equal(ev.basis, "VERIFIED");
  assert.match(x.headline, /Pirates vs Cubs/);
  assert.match(x.advice, /inside the expected surge/);
  assert.match(x.advice, /ending time is an assumption/);
  assert.equal(x.noEvent, false);
  assert.match(explanationText(x), /model index, not occupancy/);
});

test("bars explain themselves individually: a quiet bar has no event and says so, with coverage gaps", () => {
  const b = demoBundle("cmu");
  const r = buildPressure(b, b.generatedAt);
  const x = explainSample(r, 0);
  assert.equal(x.noEvent, true);
  assert.match(x.headline, /No specific event is known/);
  assert.ok(x.items.some((i) => i.kind === "TIME" && i.basis === "MODEL"));
  const weather = x.items.find((i) => i.kind === "WEATHER");
  assert.ok(weather && /precipitation chance/.test(weather.detail), "weather detail comes from the hourly forecast values");
  const transit = x.items.find((i) => i.kind === "TRANSIT");
  assert.ok(transit && /largest reported delay 12 min/.test(transit.detail));
  assert.ok(x.gaps.length > 0);
  // Two different bars of the same timeline are not the same explanation.
  const pirates = buildPressure(demoBundle("pirates"), demoBundle("pirates").generatedAt);
  const a = explainSample(pirates, 0), z = explainSample(pirates, pirates.timeline.length - 1);
  assert.notEqual(a.headline + a.advice, z.headline + z.advice);
  assert.notEqual(a.at, z.at);
});

test("rider-reported signals are labeled unverified and never outrank a verified major event", () => {
  const b = demoBundle("pirates");
  const signal = validateRiderSignals([{ name: "Street festival", venue: "Federal Street", lat: 40.4475, lng: -80.005, startTime: shift(b.generatedAt, 10), category: "FESTIVAL" }], Date.parse(b.generatedAt))[0];
  assert.ok(signal);
  const event = riderSignalToEvent(signal);
  assert.equal(event.evidence, "RIDER");
  assert.equal(event.magnitude, "MEDIUM");
  assert.equal(event.endEstimated, true);
  b.events.push(event);
  const r = buildPressure(b, b.generatedAt);
  const x = explainSample(r, nearestSampleIndex(r.timeline, shift(b.generatedAt, 30)));
  const rider = x.items.find((i) => i.event?.evidence === "RIDER");
  assert.ok(rider, "the rider report appears as evidence");
  assert.match(rider.title, /rider-reported/);
  assert.equal(rider.basis, "RIDER");
  const verified = x.items.find((i) => i.event?.evidence === "VERIFIED");
  assert.ok(verified.contribution >= rider.contribution);
  assert.ok(r.events.some((e) => e.id === signal.id));
  // Invalid reports are rejected as a whole.
  assert.equal(validateRiderSignals([{ name: "x", lat: 0, lng: 0, startTime: b.generatedAt }]), null);
  assert.equal(validateRiderSignals(new Array(6).fill({})), null);
  assert.deepEqual(validateRiderSignals(null), []);
});

test("coverage gaps reflect the sources actually available; the day title follows Pittsburgh's calendar", () => {
  const live = demoBundle("pirates");
  live.mode = "LIVE";
  live.freshness = [
    { source: "MLB schedule", fetchedAt: null, status: "LIVE", detail: "" },
    { source: "NHL schedule", fetchedAt: null, status: "UNAVAILABLE", detail: "" },
    { source: "ESPN schedule", fetchedAt: null, status: "LIVE", detail: "" },
    { source: "Ticketmaster", fetchedAt: null, status: "UNAVAILABLE", detail: "" },
    { source: "PRT realtime", fetchedAt: null, status: "UNAVAILABLE", detail: "" },
  ];
  const gaps = coverageGaps(live);
  assert.ok(gaps.some((g) => /1 of 3 pro sports/.test(g)));
  assert.ok(gaps.some((g) => /Concerts, theater, festivals/.test(g)));
  assert.ok(gaps.some((g) => /Live service disruptions/.test(g)));
  live.freshness = live.freshness.map((f) => ({ ...f, status: "LIVE" }));
  assert.ok(!coverageGaps(live).some((g) => /Concerts/.test(g)), "a live Ticketmaster feed closes the concert gap");
  const now = new Date("2026-09-12T19:00:00Z"); // Sat 3 PM Pittsburgh
  assert.equal(dayTitle("2026-09-12T23:00:00Z", now), "What's happening today");
  assert.equal(dayTitle("2026-09-13T04:30:00Z", now), "What's happening tomorrow", "12:30 AM local is tomorrow in Pittsburgh even though it is the same UTC day");
  assert.match(dayTitle("2026-09-15T15:00:00Z", now), /What's happening Tue, Sep 15/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { normalizePassengerLoad, parseBusTimeJson, parsePassengerCount, parseTrueTimeHtml } from "../lib/crowding/provider.ts";
import { occupancyFromCrowding } from "../lib/pressure/providers/occupancy.ts";
import { occupancyHeadline } from "../lib/crowding/display.ts";
import { parseHistory, updateHistory } from "../lib/crowding/history.ts";

const now = "2026-09-12T19:00:00.000Z";

test("normalizes page labels and official BusTime codes without inventing a ratio", () => {
  assert.equal(normalizePassengerLoad("Not crowded"), "not_crowded");
  assert.equal(normalizePassengerLoad("HALF_EMPTY"), "somewhat_crowded");
  assert.equal(normalizePassengerLoad("FULL"), "crowded");
  assert.equal(normalizePassengerLoad("N/A"), null);
  assert.equal(normalizePassengerLoad(""), null);
});

test("parses the requested 71B vehicle and ignores other routes", () => {
  const html = `<h2><strong>#71D</strong> To OAKLAND <strong>DUE</strong><span>(Vehicle 6000)<br>(Passengers: Crowded)</span></h2>
    <h2><strong>#71B</strong> To DOWNTOWN <strong>6 MIN</strong><span>(Vehicle 6822)<br>(Passengers: Somewhat crowded)</span></h2>`;
  assert.deepEqual(parseTrueTimeHtml(html, now), [
    {
      route: "71B",
      direction: "INBOUND",
      stopId: "3141",
      stopName: "Fifth Ave + College",
      vehicleId: "6822",
      destination: "DOWNTOWN",
      etaLabel: "6 min",
      etaMinutes: 6,
      passengerLoad: "somewhat_crowded",
      rawPassengerLoad: "Somewhat crowded",
      passengerCount: null,
      observedAt: null,
      fetchedAt: now,
    },
  ]);
});

test("keeps a listed bus with a blank passenger field as unknown", () => {
  const [item] = parseTrueTimeHtml(`<h2>#71B To DOWNTOWN 5 MIN (Vehicle 6822) (Passengers: )</h2>`, now);
  assert.equal(item.passengerLoad, null);
  assert.equal(item.rawPassengerLoad, null);
});

test("parses official getpredictions passenger-load codes", () => {
  const payload = { "bustime-response": { prd: [{ rt: "71B", stpid: "3141", vid: "3419", des: "DOWNTOWN", prdctdn: "2", psgld: "EMPTY" }] } };
  const [item] = parseBusTimeJson(payload, now);
  assert.equal(item.vehicleId, "3419");
  assert.equal(item.etaMinutes, 2);
  assert.equal(item.passengerLoad, "not_crowded");
  assert.equal(item.rawPassengerLoad, "EMPTY");
  const [due] = parseBusTimeJson({ "bustime-response": { prd: { rt: "71B", stpid: "3141", vid: "2", prdctdn: "DUE", psgld: "FULL" } } }, now);
  assert.equal(due.etaLabel, "Due");
});

test("rolling history records changes immediately, rate-limits repeats, and prunes after 14 days", () => {
  const base = Date.parse(now);
  const old = { vehicleId: "old", passengerLoad: "crowded", fetchedAt: new Date(base - 15 * 86_400_000).toISOString() };
  const recent = { vehicleId: "6822", passengerLoad: "not_crowded", fetchedAt: new Date(base - 60_000).toISOString() };
  const unchanged = { vehicleId: "6822", passengerLoad: "not_crowded", fetchedAt: now };
  assert.deepEqual(updateHistory([old, recent], [unchanged], base), [recent]);
  const changed = { ...unchanged, passengerLoad: "crowded" };
  assert.deepEqual(updateHistory([recent], [changed], base), [recent, { vehicleId: "6822", passengerLoad: "crowded", fetchedAt: now }]);
});

test("explicit integer counts parse; categories never become a headcount", () => {
  assert.equal(parsePassengerCount(24), 24);
  assert.equal(parsePassengerCount("18"), 18);
  assert.equal(parsePassengerCount("EMPTY"), null);
  assert.equal(parsePassengerCount("Not crowded"), null);
  assert.equal(parsePassengerCount("HALF_EMPTY"), null);
  const [counted] = parseBusTimeJson({ "bustime-response": { prd: [{ rt: "71B", stpid: "3141", vid: "9", prdctdn: "3", psgld: "HALF_EMPTY", psgcnt: 22 }] } }, now);
  assert.equal(counted.passengerLoad, "somewhat_crowded");
  assert.equal(counted.passengerCount, 22);
});

test("occupancy adapter keeps unknown categories unknown and feeds the model signal", () => {
  const live = occupancyFromCrowding({
    status: "live",
    fetchedAt: now,
    source: "PRT TrueTime page",
    message: "Current categorical passenger-load observation from PRT.",
    observations: [{
      route: "71B",
      direction: "INBOUND",
      stopId: "3141",
      stopName: "Fifth Ave + College",
      vehicleId: "3411",
      destination: "DOWNTOWN",
      etaLabel: "6 min",
      etaMinutes: 6,
      passengerLoad: "not_crowded",
      rawPassengerLoad: "Not crowded",
      passengerCount: null,
      observedAt: null,
      fetchedAt: now,
    }],
  });
  assert.equal(live.occupancy.status, "LIVE");
  assert.equal(live.occupancy.category, "not_crowded");
  assert.equal(live.occupancy.passengerCount, null);
  assert.equal(occupancyHeadline(live.occupancy), "Not crowded");
  const missing = occupancyFromCrowding({
    status: "unknown",
    fetchedAt: now,
    source: "PRT TrueTime page",
    message: "PRT lists the bus but is not reporting its passenger-load category.",
    observations: [{
      route: "71B",
      direction: "INBOUND",
      stopId: "3141",
      stopName: "Fifth Ave + College",
      vehicleId: "6822",
      destination: "DOWNTOWN",
      etaLabel: "5 min",
      etaMinutes: 5,
      passengerLoad: null,
      rawPassengerLoad: null,
      passengerCount: null,
      observedAt: null,
      fetchedAt: now,
    }],
  });
  assert.equal(missing.freshness.status, "UNAVAILABLE");
  assert.equal(missing.occupancy.category, null);
  assert.equal(occupancyHeadline(missing.occupancy), "Not reported");
});

test("malformed local history is ignored", () => {
  assert.deepEqual(parseHistory("not json"), []);
  assert.deepEqual(parseHistory(JSON.stringify([{ vehicleId: "1", passengerLoad: "50%", fetchedAt: now }])), []);
});

// Journey adapter + selection rules: parsing, ETA/duration consistency, stale-request handling.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlan, parseItinerary, planUrl } from "../lib/journey/motis.ts";
import { decodePolyline } from "../lib/journey/polyline.ts";
import { acceptResponse, pickJourney, journeyUrl } from "../lib/journey/use-journeys.ts";
import { recommendedBus } from "../lib/journey/recommendation.ts";
import { journeyProgress } from "../lib/journey/progress.ts";
import { leaveByTime } from "../lib/journey/format.ts";

const progressNow = Date.parse("2026-09-12T18:00:00Z");
const progressPoints = [
  { lat: 40.4443, lng: -79.943 }, { lat: 40.4443, lng: -79.941 },
  { lat: 40.4443, lng: -79.929 }, { lat: 40.4463, lng: -79.929 },
];
const progressTrip = {
  startTime: new Date(progressNow).toISOString(), endTime: new Date(progressNow + 3_600_000).toISOString(),
  legs: progressPoints.slice(0, -1).map((from, i) => ({ from, to: progressPoints[i + 1], geometry: [from, progressPoints[i + 1]] })),
};
const gps = (point, extra = {}) => ({ ...point, accuracy: 10, timestamp: progressNow, ...extra });

test("location follows walking, boarding boundary, transit geometry, transfer and destination without schedule-only advancement", () => {
  assert.equal(journeyProgress(progressTrip, gps({ lat: 40.4443, lng: -79.942 }), progressNow).index, 0);
  assert.equal(journeyProgress(progressTrip, gps(progressPoints[1]), progressNow).index, 1);
  assert.equal(journeyProgress(progressTrip, gps({ lat: 40.4443, lng: -79.935 }), progressNow).index, 1);
  assert.equal(journeyProgress(progressTrip, gps(progressPoints[2]), progressNow).index, 2);
  assert.equal(journeyProgress(progressTrip, gps({ lat: 40.4453, lng: -79.929 }), progressNow).index, 2);
  assert.deepEqual(journeyProgress(progressTrip, gps(progressPoints[3]), progressNow), { status: "arrival", index: 3 });
  assert.equal(journeyProgress(progressTrip, gps(progressPoints[0], { timestamp: progressNow + 1_800_000 }), progressNow + 1_800_000).index, 0);
});

test("missing, denied, stale, inaccurate and off-route GPS never mark a current step", () => {
  const cases = [
    [null, false, "locating"], [null, true, "unavailable"],
    [gps(progressPoints[0], { timestamp: progressNow - 90_001 }), false, "stale"],
    [gps(progressPoints[0], { accuracy: 200 }), false, "inaccurate"],
    [gps({ lat: 40.5, lng: -80.1 }), false, "off-route"],
    [gps(progressPoints[0], { accuracy: NaN }), false, "unavailable"],
  ];
  for (const [fix, denied, status] of cases) assert.deepEqual(journeyProgress(progressTrip, fix, progressNow, denied), { status, index: null });
});

test("overlapping segments and future trips stay previews; a different itinerary is matched afresh", () => {
  const overlap = { ...progressTrip, legs: [progressTrip.legs[0], progressTrip.legs[0]] };
  const fix = gps({ lat: 40.4443, lng: -79.942 });
  assert.equal(journeyProgress(overlap, fix, progressNow).status, "ambiguous");
  assert.deepEqual(journeyProgress({ ...progressTrip, startTime: new Date(progressNow + 3_600_000).toISOString() }, fix, progressNow), { status: "preview", index: null });
  assert.deepEqual(journeyProgress({ ...progressTrip, legs: [progressTrip.legs[2]] }, fix, progressNow), { status: "off-route", index: null });
  assert.deepEqual(journeyProgress({ ...progressTrip, endTime: new Date(progressNow - 8_000_000).toISOString() }, fix, progressNow), { status: "expired", index: null });
});

test("recommended bus excludes walking-only options and ranks duration, transfers, walking without mutating provider order", () => {
  const bus = (id, durationSeconds, transfers, walkSeconds) => ({ id, durationSeconds, transfers, walkSeconds, legs: [{ mode: "BUS" }] });
  const choices = [bus("slow", 1800, 0, 0), bus("transfer", 1200, 1, 60), bus("walk-more", 1200, 0, 240), bus("best", 1200, 0, 120)];
  const original = [...choices];
  assert.equal(recommendedBus([{ id: "walk", durationSeconds: 300, legs: [{ mode: "WALK" }] }, ...choices]).id, "best");
  assert.deepEqual(choices, original);
  assert.equal(recommendedBus([]), null);
  assert.equal(recommendedBus([{ legs: [{ mode: "RAIL" }] }]), null);
});

const T0 = "2026-09-12T20:34:00Z";
const shift = (m) => new Date(Date.parse(T0) + m * 60_000).toISOString();
const place = (name, lat, lon, depart, arrive, stopId) => ({ name, lat, lon, stopId, departure: depart, scheduledDeparture: depart, arrival: arrive, scheduledArrival: arrive });

function itinerary({ realTime = false, transfers = 1 } = {}) {
  const legs = [
    { mode: "WALK", from: place("START", 40.4443, -79.9428, T0, T0), to: place("FORBES AVE + MOREWOOD", 40.4447, -79.9437, shift(4), shift(4), "us-pa-PRT_4407"), duration: 240, startTime: T0, endTime: shift(4), distance: 135, legGeometry: { points: "", precision: 7 } },
    { mode: "BUS", routeShortName: "61C", headsign: "Downtown", agencyName: "PRT", tripId: "t1", realTime, from: place("FORBES AVE + MOREWOOD", 40.4447, -79.9437, shift(9), shift(9), "us-pa-PRT_4407"), to: place("WOOD ST STATION", 40.4396, -80.0022, shift(29), shift(29), "us-pa-PRT_23101"), duration: 1200, startTime: shift(9), endTime: shift(29), intermediateStops: new Array(8).fill({}), legGeometry: { points: "_p~iF~ps|U_ulLnnqC", precision: 5 } },
    ...(transfers
      ? [{ mode: "TRAM", routeShortName: "RED", headsign: "Allegheny", agencyName: "PRT", realTime, from: place("WOOD ST STATION", 40.4396, -80.0022, shift(33), shift(33), "us-pa-PRT_23101"), to: place("NORTH SIDE STATION", 40.4478, -80.0095, shift(38), shift(38), "us-pa-PRT_110"), duration: 300, startTime: shift(33), endTime: shift(38), legGeometry: { points: "", precision: 7 } }]
      : []),
    { mode: "WALK", from: place("NORTH SIDE STATION", 40.4478, -80.0095, shift(38), shift(38), "us-pa-PRT_110"), to: place("END", 40.4462, -80.0083, shift(42), shift(42)), duration: 240, startTime: shift(38), endTime: shift(42), distance: 300, legGeometry: { points: "", precision: 7 } },
  ];
  return { duration: 42 * 60, startTime: T0, endTime: shift(42), transfers, legs };
}

test("polyline decodes Google's reference example and rejects garbage", () => {
  const pts = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@", 5);
  assert.equal(pts.length, 3);
  assert.ok(Math.abs(pts[0].lat - 38.5) < 1e-6 && Math.abs(pts[0].lng + 120.2) < 1e-6);
  assert.ok(Math.abs(pts[2].lat - 43.252) < 1e-6);
  assert.throws(() => decodePolyline("", 5));
});

test("itinerary: ETA is the last leg's arrival; duration = walking + waiting + riding; realtime flag propagates", () => {
  const j = parseItinerary(itinerary());
  assert.ok(j);
  assert.equal(j.endTime, shift(42));
  assert.equal(j.durationSeconds, 42 * 60);
  assert.equal(j.walkSeconds, 480);
  assert.equal(j.rideSeconds, 1500);
  assert.equal(j.waitSeconds, 42 * 60 - 480 - 1500);
  assert.equal(j.walkSeconds + j.waitSeconds + j.rideSeconds, j.durationSeconds);
  assert.equal(j.transfers, 1);
  assert.equal(j.realTime, false, "scheduled unless the provider says realtime");
  assert.equal(parseItinerary(itinerary({ realTime: true })).realTime, true);
  const bus = j.legs[1];
  assert.equal(bus.routeShortName, "61C");
  assert.equal(bus.headsign, "Downtown");
  assert.equal(bus.from.stopId, "us-pa-PRT_4407");
  assert.equal(bus.intermediateStops, 8);
  assert.ok(bus.geometry.length >= 2);
  assert.equal(j.legs[0].geometry.length, 2, "an empty walk polyline falls back to its endpoints");
  assert.ok(j.legs.every((l) => Date.parse(l.endTime) >= Date.parse(l.startTime)));
});

test("leaveByTime reaches the stop 2 minutes before the bus departs, from the provider's own walk leg; walk-only trips have no bus to catch", () => {
  const j = parseItinerary(itinerary());
  assert.equal(leaveByTime(j), shift(3), "board at shift(9), minus the 4 min walk leg, minus a 2 min buffer");
  assert.equal(leaveByTime({ ...j, legs: [j.legs[0]] }), null);
});

test("malformed legs invalidate the itinerary; the plan parser drops them and orders by arrival", () => {
  const broken = itinerary();
  broken.legs[1].mode = "CAR";
  assert.equal(parseItinerary(broken), null);
  const bad = itinerary();
  bad.legs[2].endTime = "not a time";
  assert.equal(parseItinerary(bad), null);
  const later = itinerary({ transfers: 0 });
  later.endTime = shift(50);
  later.legs[later.legs.length - 1].endTime = shift(50);
  later.legs[later.legs.length - 1].to.arrival = shift(50);
  const plan = parsePlan({ itineraries: [later, broken, itinerary()], direct: [] });
  assert.equal(plan.length, 2);
  assert.equal(plan[0].endTime, shift(42));
  assert.notEqual(plan[0].id, plan[1].id);
  assert.throws(() => parsePlan({}));
  assert.throws(() => parsePlan("<html>"));
});

test("direct walk from the provider is offered once, never fabricated", () => {
  const walk = { duration: 600, startTime: T0, endTime: shift(10), transfers: 0, legs: [{ mode: "WALK", from: place("START", 40.4443, -79.9428, T0, T0), to: place("END", 40.446, -79.94, shift(10), shift(10)), duration: 600, startTime: T0, endTime: shift(10), distance: 700, legGeometry: { points: "", precision: 7 } }] };
  const plan = parsePlan({ itineraries: [itinerary()], direct: [walk, walk] });
  assert.equal(plan.filter((j) => j.legs.every((l) => l.mode === "WALK")).length, 1);
  assert.equal(parsePlan({ itineraries: [], direct: [] }).length, 0);
});

test("request URLs carry the departure time, arrive-by and walking limits", () => {
  const url = new URL(planUrl({ from: { lat: 40.4443, lng: -79.9428 }, to: { lat: 40.4462, lng: -80.0083 }, at: T0, arriveBy: true, maxWalkMinutes: 8, maxTransfers: 0 }));
  assert.equal(url.searchParams.get("arriveBy"), "true");
  assert.equal(url.searchParams.get("maxPreTransitTime"), "480");
  assert.equal(url.searchParams.get("maxTransfers"), "0");
  assert.equal(url.searchParams.get("time"), T0);
  const client = journeyUrl({ from: { lat: 40.4443, lng: -79.9428 }, to: { lat: 40.4462, lng: -80.0083 }, at: null, arriveBy: false, maxWalkMinutes: 15, maxTransfers: null });
  assert.ok(client && !client.includes("&at=") && !client.includes("maxWalk="), "leave-now with defaults sends no time/limits");
  assert.equal(journeyUrl({ from: null, to: { lat: 40.4, lng: -80 }, at: null, arriveBy: false, maxWalkMinutes: 15, maxTransfers: null }), null);
});

test("latest request wins: an older response never overwrites a newer one; selection survives refreshes", () => {
  const prev = { url: "/a", seq: 1, data: { status: "ok" }, error: null };
  const stale = { url: "/a", seq: 1, data: { status: "ok", stale: true }, error: null };
  const fresh = { url: "/b", seq: 2, data: { status: "ok", fresh: true }, error: null };
  assert.equal(acceptResponse(prev, stale, 2), prev, "seq 1 arriving after seq 2 was issued is ignored");
  assert.equal(acceptResponse(prev, fresh, 2), fresh);
  const failed = acceptResponse(prev, { url: "/a", seq: 3, data: null, error: "boom" }, 3);
  assert.equal(failed.error, "boom");
  assert.deepEqual(failed.data, prev.data, "a failed refresh of the same query keeps the last result visible");
  const changed = acceptResponse(prev, { url: "/c", seq: 4, data: null, error: "boom" }, 4);
  assert.equal(changed.data, null, "a failed search for a different query shows no stale journey");
  const a = parseItinerary(itinerary());
  const b = parseItinerary(itinerary({ transfers: 0 }));
  assert.equal(pickJourney([a, b], b.id).id, b.id);
  assert.equal(pickJourney([a, b], "gone").id, a.id, "a vanished selection falls back to the first option");
  assert.equal(pickJourney([], "x"), null);
});

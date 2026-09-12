// Chat planner: phrase parsing, clarification, follow-ups, validated actions. The
// routing/pressure executors are stubbed so the tests are deterministic and offline.
import { test } from "node:test";
import assert from "node:assert/strict";
import { guidedTurn, extractTripPhrases, extractRiderReport } from "../lib/chat/guided.ts";
import { parseTimeIntent } from "../lib/chat/time.ts";
import { resolveLexicon, pickOption } from "../lib/chat/places.ts";
import { validateActions } from "../lib/chat/actions.ts";
import { demoBundle } from "../lib/pressure/demo.ts";
import { buildPressure } from "../lib/pressure/engine.ts";

const NOW = new Date("2026-09-12T19:00:00Z"); // Sat 3:00 PM Pittsburgh
const NORTH_SHORE = { label: "North Shore", lat: 40.4462, lng: -80.0083 };

function journey(id, startMin, endMin) {
  const at = (m) => new Date(NOW.getTime() + m * 60_000).toISOString();
  return { id, startTime: at(startMin), endTime: at(endMin), durationSeconds: (endMin - startMin) * 60, transfers: 0, walkSeconds: 300, rideSeconds: 900, waitSeconds: (endMin - startMin) * 60 - 1200, realTime: false, legs: [{ mode: "BUS", routeShortName: "61C", from: { name: "A" }, to: { name: "B" }, startTime: at(startMin), endTime: at(endMin), durationSeconds: 900, geometry: [] }] };
}

function deps(overrides = {}) {
  const calls = [];
  return {
    calls,
    geocode: async (q) => (/^123 main/i.test(q) ? [{ label: "123 Main St, Pittsburgh", lat: 40.45, lng: -79.95 }] : []),
    plan: async (input) => {
      calls.push(input);
      const p = demoBundle("pirates");
      return { journeys: { status: "ok", provider: "stub", fetchedAt: NOW.toISOString(), request: input, journeys: [journey("j1", 5, 40), journey("j2", 15, 52)] }, pressure: buildPressure(p, p.generatedAt), pressureError: null };
    },
    now: () => NOW,
    ...overrides,
  };
}

const trip = (extra = {}) => ({ originLabel: "Your location", origin: { label: "Your location", lat: 40.4443, lng: -79.9428 }, destinationLabel: null, destination: null, departureAt: null, arriveBy: false, journeys: [], journey: null, pressure: null, demo: false, ...extra });
const ask = (text, t = trip(), pending = null) => ({ messages: [{ role: "user", text }], trip: t, pending });

test("time phrases: 'by 7' is an arrival deadline read as the next 7 o'clock; explicit am/pm; relative; shifts", () => {
  const by7 = parseTimeIntent("I need to get from CMU to the North Shore by 7", NOW);
  assert.equal(by7.kind, "at");
  assert.equal(by7.arriveBy, true);
  assert.equal(by7.at, "2026-09-12T23:00:00.000Z", "7 PM Pittsburgh today (EDT)");
  assert.match(by7.assumed, /7 read as 7:00 PM/);
  const explicit = parseTimeIntent("leave at 6:30 am tomorrow", NOW);
  assert.equal(explicit.at, "2026-09-13T10:30:00.000Z");
  assert.equal(explicit.arriveBy, false);
  assert.equal(parseTimeIntent("in 20 minutes", NOW).at, "2026-09-12T19:20:00.000Z");
  assert.deepEqual(parseTimeIntent("leave later", NOW), { kind: "shift", minutes: 30 });
  assert.deepEqual(parseTimeIntent("leave 45 min earlier", NOW), { kind: "shift", minutes: -45 });
  assert.equal(parseTimeIntent("what about after the concert?", NOW).kind, "after_event");
  assert.equal(parseTimeIntent("to the airport", NOW), null);
});

test("place lexicon: aliases, ambiguity, option picking", () => {
  assert.equal(resolveLexicon("the north shore").place.label, "North Shore");
  assert.equal(resolveLexicon("cmu").place.label, "Carnegie Mellon University");
  const amb = resolveLexicon("the museum");
  assert.equal(amb.kind, "ambiguous");
  assert.ok(amb.options.length >= 2);
  assert.equal(pickOption("2", amb.options).label, amb.options[1].label);
  assert.equal(pickOption("the warhol", amb.options).label, "The Andy Warhol Museum (North Shore)");
  assert.equal(pickOption("blue", amb.options), null);
  assert.equal(resolveLexicon("some unknown place").kind, "unknown");
  assert.deepEqual(extractTripPhrases("I need to get from CMU to the North Shore by 7"), { origin: "CMU", destination: "the North Shore" });
  assert.deepEqual(extractTripPhrases("how do I get to the airport tomorrow at 9 am"), { destination: "the airport" });
  assert.equal(extractRiderReport("there's a festival at Schenley Plaza at 5").name, "Festival");
  assert.equal(extractRiderReport("there's a festival at Schenley Plaza at 5").category, "FESTIVAL");
  assert.equal(extractRiderReport("take me to the strip"), null);
});

test("full trip request plans, sets shared state and offers journey cards", async () => {
  const d = deps();
  const r = await guidedTurn(ask("I need to get from CMU to the North Shore by 7"), d);
  assert.equal(r.mode, "guided");
  assert.equal(d.calls.length, 1);
  assert.equal(d.calls[0].arriveBy, true);
  assert.equal(d.calls[0].destination.label, "North Shore");
  const types = r.actions.map((a) => a.type);
  assert.deepEqual(types, ["set_origin", "set_destination", "set_time", "select_journey"]);
  assert.deepEqual(r.journeyIds, ["j1", "j2"]);
  assert.equal(r.actions[3].journeyId, "j1");
  assert.match(r.reply, /61C/);
  assert.match(r.reply, /model index/);
  assert.match(r.reply, /Surge expected/);
  assert.equal(r.pending, null);
});

test("ambiguous destination asks with options, then the answer completes the plan", async () => {
  const d = deps();
  const first = await guidedTurn(ask("get me to the museum by 7"), d);
  assert.equal(first.pending?.slot, "destination");
  assert.ok(first.options.length >= 2);
  assert.equal(d.calls.length, 0, "nothing planned until the place is resolved");
  assert.equal(first.pending.draft.arriveBy, true);
  const second = await guidedTurn(ask("the warhol", trip(), first.pending), d);
  assert.equal(d.calls.length, 1);
  assert.equal(d.calls[0].destination.label, "The Andy Warhol Museum (North Shore)");
  assert.equal(d.calls[0].arriveBy, true, "the deadline from the first message is kept");
  assert.ok(second.actions.some((a) => a.type === "set_destination" && a.place.label.includes("Warhol")));
});

test("unknown places geocode or ask honestly; demo mode refuses to plan", async () => {
  const d = deps();
  const found = await guidedTurn(ask("to 123 Main St"), d);
  assert.equal(d.calls[0].destination.label, "123 Main St, Pittsburgh");
  assert.ok(found.actions.some((a) => a.type === "set_destination"));
  const missing = await guidedTurn(ask("to Narnia Boulevard"), d);
  assert.equal(missing.pending?.slot, "destination");
  assert.match(missing.reply, /could not find/i);
  assert.equal(d.calls.length, 1);
  const demo = await guidedTurn(ask("to cmu", trip({ demo: true })), d);
  assert.equal(demo.actions.length, 0);
  assert.match(demo.reply, /scenario/i);
});

test("follow-ups: leave later, less walking, fewer transfers, after the event, pick an option", async () => {
  const d = deps();
  const p = demoBundle("pirates");
  const pressure = buildPressure(p, p.generatedAt);
  const t = trip({ destinationLabel: "North Shore", destination: NORTH_SHORE, journeys: [journey("j1", 5, 40), journey("j2", 15, 52)], journey: journey("j1", 5, 40), pressure });
  const later = await guidedTurn(ask("leave later", t), d);
  const setTime = later.actions.find((a) => a.type === "set_time");
  assert.equal(setTime.at, new Date(NOW.getTime() + 35 * 60_000).toISOString(), "30 min after the selected journey's departure");
  assert.equal(setTime.arriveBy, false);
  const walking = await guidedTurn(ask("less walking please", t), d);
  assert.deepEqual(walking.actions.find((a) => a.type === "set_prefs"), { type: "set_prefs", maxWalkMinutes: 8, maxTransfers: undefined });
  const direct = await guidedTurn(ask("no transfers", t), d);
  assert.equal(direct.actions.find((a) => a.type === "set_prefs").maxTransfers, 0);
  const after = await guidedTurn(ask("can I leave after the game and avoid the busiest period?", t), d);
  assert.match(after.reply, /estimated to end/);
  assert.match(after.reply, /exit wave/);
  const afterAt = after.actions.find((a) => a.type === "set_time").at;
  assert.ok(Date.parse(afterAt) >= Date.parse(pressure.surge.end) || Date.parse(afterAt) >= Date.parse(pressure.eventImpacts[0].window.end));
  const pick = await guidedTurn(ask("take option 2", t), d);
  assert.deepEqual(pick.actions, [{ type: "select_journey", journeyId: "j2" }]);
  const noEvent = buildPressure(demoBundle("cmu"), demoBundle("cmu").generatedAt);
  const nothing = await guidedTurn(ask("after the concert", { ...t, pressure: noEvent }), d);
  assert.equal(nothing.actions.length, 0);
  assert.match(nothing.reply, /No verified event is known/);
});

test("why questions explain the selected time from that sample's evidence", async () => {
  const d = deps();
  const p = demoBundle("pirates");
  const pressure = buildPressure(p, p.generatedAt);
  const t = trip({ destinationLabel: "North Shore", destination: NORTH_SHORE, pressure, departureAt: null });
  const why = await guidedTurn(ask("why is the trip busier around 10?", t), { ...d, now: () => new Date(p.generatedAt) });
  assert.match(why.reply, /^9:55 PM:/, "the sample nearest 10 PM on a 15-minute grid that starts 9:10 PM");
  assert.match(why.reply, /Pirates vs Cubs/);
  assert.match(why.reply, /end is an estimate/);
  assert.match(why.reply, /model index, not occupancy/);
  assert.equal(d.calls.length, 0, "an in-window question reuses the client's pressure result");
  const noTrip = await guidedTurn(ask("why is it busy?"), d);
  assert.equal(noTrip.pending?.slot, "destination");
});

test("rider-reported causes become validated, unverified signals", async () => {
  const d = deps();
  const r = await guidedTurn(ask("there's a festival at Schenley Plaza at 5 pm"), d);
  const add = r.actions.find((a) => a.type === "add_rider_signal");
  assert.ok(add);
  assert.equal(add.signal.category, "FESTIVAL");
  assert.equal(add.signal.venue, "Schenley Park (Flagstaff Hill)");
  assert.equal(add.signal.startTime, "2026-09-12T21:00:00.000Z");
  assert.match(r.reply, /unverified/);
  const vague = await guidedTurn(ask("there's a concert at the arena tonight"), d);
  assert.equal(vague.pending?.slot, "venue");
  assert.ok(vague.options.length >= 2);
});

test("action validation rejects out-of-area places, bad times and unknown journeys", () => {
  const journeys = [journey("j1", 5, 40)];
  const valid = validateActions(
    [
      { type: "set_destination", place: NORTH_SHORE },
      { type: "set_destination", place: { label: "Cleveland", lat: 41.5, lng: -81.7 } },
      { type: "set_time", at: new Date(NOW.getTime() + 3_600_000).toISOString(), arriveBy: true },
      { type: "set_time", at: "2020-01-01T00:00:00Z", arriveBy: false },
      { type: "select_journey", journeyId: "j1" },
      { type: "select_journey", journeyId: "nope" },
      { type: "set_prefs", maxWalkMinutes: 999 },
      { type: "set_prefs", maxWalkMinutes: 10 },
      { type: "add_rider_signal", signal: { name: "<script>", venue: "x", lat: 40.44, lng: -79.95, startTime: new Date(NOW.getTime() + 3_600_000).toISOString() } },
      { type: "explode" },
    ],
    journeys,
    NOW.getTime(),
  );
  assert.deepEqual(valid.map((a) => a.type), ["set_destination", "set_time", "select_journey", "set_prefs", "add_rider_signal"]);
  assert.equal(valid[0].place.label, "North Shore");
  assert.equal(valid[4].signal.name, "script", "control/markup characters are stripped");
  assert.equal(validateActions("nope", journeys).length, 0);
});

// Deterministic ("guided") planner: understands common Pittsburgh trip phrasings
// without a language model. It is the fallback when no ANTHROPIC_API_KEY is
// configured and the safety net when the model call fails. Every reply is
// composed from real routing/pressure output; nothing is canned as "AI".
import { JOURNEY_DEFAULTS } from "../journey/types.ts";
import { clock } from "../pressure/format.ts";
import { validateRiderSignal } from "../pressure/rider-signals.ts";
import type { EventCategory, RiderSignal } from "../pressure/types.ts";
import { afterEventTime, describePlan, explainAtText, planTrip, type PlanInput, type PlanResult } from "./execute.ts";
import { geocodePlaces } from "./geocode-server.ts";
import { pickOption, resolveLexicon, type PlaceResolution } from "./places.ts";
import { parseTimeIntent, type TimeIntent } from "./time.ts";
import type { ChatAction, ChatOption, ChatPlace, ChatRequest, ChatResponse, Pending, TripDraft } from "./types.ts";

export type GuidedDeps = {
  geocode: (query: string) => Promise<ChatPlace[]>;
  plan: (input: PlanInput) => Promise<PlanResult>;
  now: () => Date;
};

export const defaultDeps: GuidedDeps = { geocode: geocodePlaces, plan: planTrip, now: () => new Date() };

const TIME_TAIL = /\s+(?:by|at|around|before|after|tomorrow|tonight|in\s+\d|@).*$/i;
const CATEGORY_WORDS: [RegExp, EventCategory][] = [
  [/festival|fest\b|fair|parade|market|carnival/i, "FESTIVAL"],
  [/concert|show|gig|tour/i, "CONCERT"],
  [/convention|expo|conference|summit/i, "CONVENTION"],
  [/campus|carnival|commencement|orientation|lecture|homecoming/i, "CAMPUS"],
  [/play|musical|opera|ballet|theater|theatre/i, "THEATER"],
  [/game|match/i, "OTHER"],
];

function respond(partial: Partial<ChatResponse> & { reply: string }): ChatResponse {
  return { actions: [], journeyIds: [], options: [], pending: null, mode: "guided", ...partial };
}

function ask(slot: Pending["slot"], question: string, options: ChatPlace[], draft: TripDraft): ChatResponse {
  return respond({
    reply: options.length ? `${question}\n${options.map((o, i) => `${i + 1}. ${o.label}`).join("\n")}` : question,
    options: options.map((o) => ({ label: o.label, place: o })),
    pending: { slot, options, draft },
  });
}

async function resolvePlace(text: string, deps: GuidedDeps): Promise<PlaceResolution> {
  const lex = resolveLexicon(text);
  if (lex.kind !== "unknown") return lex;
  try {
    const found = await deps.geocode(lex.query);
    if (found.length === 1) return { kind: "place", place: found[0] };
    if (found.length > 1) return { kind: "ambiguous", question: `Which "${lex.query}"?`, options: found };
  } catch {
    // geocoder down: fall through to unknown
  }
  return { kind: "unknown", query: lex.query };
}

/** Extracts origin/destination phrases: "from A to B", "to B from A", "get to B", "B by 7". */
export function extractTripPhrases(text: string): { origin?: string; destination?: string } {
  const t = text.replace(/[?!.]+$/g, "").trim();
  const fromTo = t.match(/\bfrom\s+(.+?)\s+to\s+(.+)$/i);
  if (fromTo) return { origin: fromTo[1].replace(TIME_TAIL, "").trim(), destination: fromTo[2].replace(TIME_TAIL, "").trim() };
  const toFrom = t.match(/\bto\s+(.+?)\s+from\s+(.+)$/i);
  if (toFrom) return { origin: toFrom[2].replace(TIME_TAIL, "").trim(), destination: toFrom[1].replace(TIME_TAIL, "").trim() };
  const to = t.match(/\b(?:to|toward|towards)\s+(.+)$/i);
  if (to) return { destination: to[1].replace(TIME_TAIL, "").replace(/^(the )?(way to|route to)\s+/i, "").trim() };
  return {};
}

export function extractRiderReport(text: string): { name: string; venueQuery: string; category: EventCategory } | null {
  const t = text.replace(/[?!.]+$/g, "").trim();
  const m = t.match(/(?:there(?:'s| is)|there will be|add|report|heads up|fyi)[:,]?\s+(?:a|an|the)?\s*(.+?)\s+(?:at|in|on)\s+(.+)$/i);
  if (!m) return null;
  const name = m[1].trim();
  const venueQuery = m[2].replace(TIME_TAIL, "").trim();
  if (!name || !venueQuery || !CATEGORY_WORDS.some(([re]) => re.test(name))) return null;
  const category = CATEGORY_WORDS.find(([re]) => re.test(name))?.[1] ?? "OTHER";
  return { name: name.replace(/^\w/, (c) => c.toUpperCase()), venueQuery, category };
}

function timeFromIntent(intent: TimeIntent, ctx: ChatRequest["trip"], now: Date): { at: string | null; arriveBy: boolean; note: string | null } {
  if (!intent) return { at: ctx.departureAt, arriveBy: ctx.arriveBy, note: null };
  if (intent.kind === "now") return { at: null, arriveBy: false, note: null };
  if (intent.kind === "at") return { at: intent.at, arriveBy: intent.arriveBy, note: intent.assumed ? `(I read the time as ${intent.assumed}.)` : null };
  if (intent.kind === "shift") {
    const nowMs = now.getTime();
    const base = ctx.journey ? Date.parse(ctx.journey.startTime) : ctx.departureAt ? Date.parse(ctx.departureAt) : nowMs;
    const at = new Date(Math.max(base + intent.minutes * 60_000, nowMs + 60_000)).toISOString();
    return { at, arriveBy: false, note: `Shifted ${intent.minutes > 0 ? "later" : "earlier"} to ${clock(at)}.` };
  }
  return { at: ctx.departureAt, arriveBy: ctx.arriveBy, note: null };
}

async function completeTrip(draft: TripDraft, req: ChatRequest, deps: GuidedDeps, preface: string[] = []): Promise<ChatResponse> {
  const ctx = req.trip;
  const origin = draft.origin ?? ctx.origin;
  const destination = draft.destination ?? (ctx.destination && ctx.destinationLabel ? { label: ctx.destinationLabel, ...ctx.destination } : null);
  if (!destination) return ask("destination", "Where are you going? A neighborhood, venue or address in Pittsburgh works.", [], draft);
  const input: PlanInput = {
    origin,
    destination,
    at: draft.at === undefined ? ctx.departureAt : draft.at,
    arriveBy: draft.arriveBy ?? (draft.at === undefined ? ctx.arriveBy : false),
    maxWalkMinutes: draft.maxWalkMinutes,
    maxTransfers: draft.maxTransfers,
    riderSignals: draft.signal && isSignal(draft.signal) ? [draft.signal] : undefined,
  };
  const result = await deps.plan(input);
  const actions: ChatAction[] = [];
  if (draft.origin) actions.push({ type: "set_origin", place: draft.origin });
  if (draft.destination) actions.push({ type: "set_destination", place: draft.destination });
  if (draft.at !== undefined) actions.push({ type: "set_time", at: input.at, arriveBy: input.arriveBy });
  if (draft.maxWalkMinutes !== undefined || draft.maxTransfers !== undefined) actions.push({ type: "set_prefs", maxWalkMinutes: draft.maxWalkMinutes, maxTransfers: draft.maxTransfers });
  const journeyIds = result.journeys.status === "ok" ? result.journeys.journeys.slice(0, 3).map((j) => j.id) : [];
  if (journeyIds[0]) actions.push({ type: "select_journey", journeyId: journeyIds[0] });
  const tail = journeyIds.length ? "Tap a journey to put it on the map, or say “leave later”, “less walking” or “why is it busier around 10?”." : "";
  return respond({ reply: [...preface, describePlan(input, result), tail].filter(Boolean).join("\n"), actions, journeyIds });
}

function isSignal(s: TripDraft["signal"]): s is RiderSignal {
  return !!s && typeof s.lat === "number" && typeof s.lng === "number" && typeof s.startTime === "string";
}

async function completeReport(draft: TripDraft, req: ChatRequest, deps: GuidedDeps): Promise<ChatResponse> {
  const s = draft.signal!;
  const start = s.startTime ?? new Date(Date.now() + 60 * 60_000).toISOString();
  const raw = { id: undefined, name: s.name, venue: s.venue, lat: s.lat, lng: s.lng, startTime: start, endTime: s.endTime, category: s.category };
  const signal = validateRiderSignal(raw, deps.now().getTime());
  if (!signal) return respond({ reply: "I could not validate that report (it needs a Pittsburgh venue and a start within the next 7 days), so nothing was added." });
  const preface = [`Added “${signal.name}” at ${signal.venue} (${clock(signal.startTime)}, end assumed ${clock(signal.endTime)}) as a rider report. It is unverified, so the model weights it below published schedules and labels it as such.${s.startTime ? "" : " No start time was given; I assumed one hour from now — tell me the real time to fix it."}`];
  const actions: ChatAction[] = [{ type: "add_rider_signal", signal }];
  if (req.trip.destination && req.trip.destinationLabel) {
    const planned = await completeTrip({ ...draft, signal }, req, deps, preface);
    return { ...planned, actions: [...actions, ...planned.actions] };
  }
  return respond({ reply: preface.join("\n"), actions });
}

async function fillSlot(pending: Pending, place: ChatPlace, req: ChatRequest, deps: GuidedDeps): Promise<ChatResponse> {
  const draft = { ...pending.draft };
  if (pending.slot === "origin") draft.origin = place;
  if (pending.slot === "destination") draft.destination = place;
  if (pending.slot === "venue") draft.signal = { ...draft.signal, venue: place.label, lat: place.lat, lng: place.lng };
  if (pending.slot === "venue") return completeReport(draft, req, deps);
  return completeTrip(draft, req, deps);
}

const HELP =
  "I plan Pittsburgh transit trips and explain what could make them busier. Try: “CMU to the North Shore by 7”, “to the airport tomorrow at 9 am”, “leave later”, “less walking”, “why is the trip busier around 10?”, “can I leave after the game?”, or “there's a festival at Schenley Plaza at 5”.";

export async function guidedTurn(req: ChatRequest, deps: GuidedDeps = defaultDeps): Promise<ChatResponse> {
  const last = [...req.messages].reverse().find((m) => m.role === "user")?.text.trim() ?? "";
  if (!last) return respond({ reply: HELP });
  if (req.trip.demo) return respond({ reply: "A demo scenario is active, so the itinerary search is off. Exit the scenario to plan a live trip." });
  const ctx = req.trip;
  const text = last.toLowerCase();

  // 1. Answering a clarification.
  if (req.pending) {
    const picked = req.pending.options.length ? pickOption(last, req.pending.options) : null;
    if (picked) return fillSlot(req.pending, picked, req, deps);
    const resolved = await resolvePlace(last, deps);
    if (resolved.kind === "place") return fillSlot(req.pending, resolved.place, req, deps);
    if (resolved.kind === "ambiguous") return ask(req.pending.slot, resolved.question, resolved.options, req.pending.draft);
    return ask(req.pending.slot, `I could not find “${last}” in Pittsburgh. Try a neighborhood, landmark or street address.`, req.pending.options, req.pending.draft);
  }

  // 2. Rider-reported cause.
  const report = extractRiderReport(last);
  if (report) {
    const intent = parseTimeIntent(last, deps.now());
    const startTime = intent?.kind === "at" ? intent.at : undefined;
    const draft: TripDraft = { signal: { name: report.name, category: report.category, startTime, venueQuery: report.venueQuery } };
    const venue = await resolvePlace(report.venueQuery, deps);
    if (venue.kind === "ambiguous") return ask("venue", venue.question, venue.options, draft);
    if (venue.kind === "unknown") return ask("venue", `Where is “${report.name}”? I could not place “${report.venueQuery}”.`, [], draft);
    draft.signal = { ...draft.signal, venue: venue.place.label, lat: venue.place.lat, lng: venue.place.lng };
    return completeReport(draft, req, deps);
  }

  const hasTrip = !!ctx.destination;
  const intent = parseTimeIntent(last, deps.now());

  // 3. Explanations for a time ("why is it busier around 10?").
  if (intent?.kind !== "after_event" && /\bwhy\b|busier|busiest|how busy|crowded|what('s| is) (the )?pressure|what('s| is) happening/.test(text)) {
    if (!hasTrip) return ask("destination", "Tell me where you are going first, then I can explain the pressure along that trip.", [], {});
    const at = intent?.kind === "at" ? intent.at : ctx.journey?.startTime ?? ctx.departureAt ?? new Date().toISOString();
    let pressure = ctx.pressure;
    if (!pressure || Math.abs(Date.parse(at) - Date.parse(pressure.current.at)) > 4 * 3_600_000) {
      const planned = await deps.plan({ origin: ctx.origin, destination: { label: ctx.destinationLabel ?? "destination", ...ctx.destination! }, at, arriveBy: false });
      pressure = planned.pressure;
      if (!pressure) return respond({ reply: planned.pressureError ?? "Transit Pressure is unavailable right now, so I cannot explain that time." });
    }
    return respond({ reply: explainAtText(pressure, at), actions: [{ type: "open_timeline" }] });
  }

  // 4. Follow-ups that adjust the current trip.
  if (hasTrip) {
    if (intent?.kind === "after_event") {
      const after = afterEventTime(ctx.pressure);
      if (!after.at) return respond({ reply: after.note });
      return completeTrip({ at: after.at, arriveBy: false }, req, deps, [after.note]);
    }
    if (/less walking|walk less|shorter walk|not (so )?much walking|minimal walking/.test(text)) return completeTrip({ maxWalkMinutes: 8 }, req, deps, ["Walking limited to 8 minutes per street leg."]);
    if (/more walking|walk more|ok(ay)? to walk|longer walk|willing to walk/.test(text)) return completeTrip({ maxWalkMinutes: 25 }, req, deps, ["Walking allowed up to 25 minutes per street leg."]);
    if (/fewer transfers|no transfers?|direct (bus|route|trip)|without transfer/.test(text)) return completeTrip({ maxTransfers: 0 }, req, deps, ["Direct services only (no transfers)."]);
    if (/any transfers|allow transfers|transfers (are )?ok/.test(text)) return completeTrip({ maxTransfers: JOURNEY_DEFAULTS.maxTransfers }, req, deps, ["Transfers allowed again."]);
    if (intent && (intent.kind === "shift" || intent.kind === "now") && !/\bto\b|\bfrom\b/.test(text)) {
      const t = timeFromIntent(intent, ctx, deps.now());
      return completeTrip({ at: t.at, arriveBy: t.arriveBy }, req, deps, t.note ? [t.note] : []);
    }
    const journeyPick = text.match(/\b(?:option|journey|take|choose|pick|select)\s*(?:the\s*)?(\d)\b|\b(first|second|third)\b/);
    if (journeyPick && ctx.journeys.length) {
      const index = journeyPick[1] ? Number(journeyPick[1]) - 1 : ["first", "second", "third"].indexOf(journeyPick[2]);
      const j = ctx.journeys[index];
      if (j) return respond({ reply: `Selected option ${index + 1}: ${describeOne(j)}.`, actions: [{ type: "select_journey", journeyId: j.id }], journeyIds: [j.id] });
    }
  }

  // 5. A trip request.
  const phrases = extractTripPhrases(last);
  if (!phrases.destination && !phrases.origin) {
    const whole = resolveLexicon(last.replace(TIME_TAIL, ""));
    if (whole.kind === "place") phrases.destination = whole.place.label;
    else if (whole.kind === "ambiguous") return ask("destination", whole.question, whole.options, { ...(intent?.kind === "at" ? { at: intent.at, arriveBy: intent.arriveBy } : {}) });
  }
  if (phrases.destination || phrases.origin) {
    const draft: TripDraft = {};
    if (intent?.kind === "at") {
      draft.at = intent.at;
      draft.arriveBy = intent.arriveBy;
    } else if (intent?.kind === "now") {
      draft.at = null;
      draft.arriveBy = false;
    }
    const preface: string[] = intent?.kind === "at" && intent.assumed ? [`(I read the time as ${intent.assumed}.)`] : [];
    if (phrases.origin) {
      const o = await resolvePlace(phrases.origin, deps);
      if (o.kind === "ambiguous") return ask("origin", o.question, o.options, draft);
      if (o.kind === "unknown") return ask("origin", `I could not place “${phrases.origin}”. Where are you starting from?`, [], draft);
      draft.origin = o.place;
    }
    if (phrases.destination) {
      const d = await resolvePlace(phrases.destination, deps);
      if (d.kind === "ambiguous") return ask("destination", d.question, d.options, draft);
      if (d.kind === "unknown") return ask("destination", `I could not find “${phrases.destination}” in Pittsburgh. Try a neighborhood, landmark or street address.`, [], draft);
      draft.destination = d.place;
    }
    return completeTrip(draft, req, deps, preface);
  }

  // 6. Just a time, with a trip already set.
  if (intent?.kind === "at" && hasTrip) return completeTrip({ at: intent.at, arriveBy: intent.arriveBy }, req, deps, intent.assumed ? [`(I read the time as ${intent.assumed}.)`] : []);
  if (intent?.kind === "at" && !hasTrip) return ask("destination", `Got it, ${intent.arriveBy ? "arrive by" : "leave at"} ${clock(intent.at)}. Where to?`, [], { at: intent.at, arriveBy: intent.arriveBy });

  return respond({ reply: HELP });
}

function describeOne(j: { startTime: string; endTime: string; transfers: number; durationSeconds: number }): string {
  return `leave ${clock(j.startTime)}, arrive ~${clock(j.endTime)}, ${Math.round(j.durationSeconds / 60)} min, ${j.transfers ? `${j.transfers} transfer(s)` : "no transfers"}`;
}

export type { ChatOption };

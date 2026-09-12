// The Transit Pressure engine: an interpretable weighted model.
// Every term is a named, capped contribution so the UI can explain WHY.
// Pure functions only; providers and demo scenarios feed it the same SignalBundle.

import type {
  Confidence,
  DemandPrediction,
  DemandReason,
  EventImpact,
  EventSignal,
  LowWindow,
  Point,
  PressureLevel,
  PressureResult,
  Recommendation,
  RiderSignal,
  SignalBundle,
  SurgeWindow,
  UpcomingEvent,
} from "./types.ts";
import {
  CONFIDENCE,
  COVERAGE_NOTE,
  EVENT,
  LEVELS,
  MODEL_VERSION,
  RECOMMENDATION,
  SERVICE,
  TEMPORAL,
  TIMELINE,
  TIMEZONE,
  TRANSIT,
  WEATHER,
} from "./config.ts";
import { clamp, corridorDistanceKm } from "./geo.ts";

export { MODEL_VERSION } from "./config.ts";
export { clamp, distanceKm, corridorDistanceKm } from "./geo.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// ---------------------------------------------------------------------------
// Time helpers (always Pittsburgh local time, independent of the machine zone)

export function localParts(at: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(at));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayName = get("weekday");
  return {
    hour: Number(get("hour")) + Number(get("minute")) / 60,
    weekday: !["Sat", "Sun"].includes(weekdayName),
    weekdayName,
  };
}

export function clockTime(at: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit" }).format(new Date(at));
}

/** Smoothstep on [0, 1]. */
const smooth = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

export function levelFor(score: number): PressureLevel {
  if (score >= LEVELS.SURGE) return "SURGE";
  if (score >= LEVELS.HIGH) return "HIGH";
  if (score >= LEVELS.MODERATE) return "MODERATE";
  return "LOW";
}

// ---------------------------------------------------------------------------
// Term 1: temporal baseline

export function temporalBaseline(at: string): DemandReason {
  const { hour, weekday, weekdayName } = localParts(at);
  const profile = weekday ? TEMPORAL.weekday : TEMPORAL.weekend;
  const lo = Math.floor(hour) % 24;
  const hi = (lo + 1) % 24;
  // Across midnight, interpolate toward the next day's profile (Fri→Sat, Sun→Mon).
  const nextProfile =
    hi === 0 ? (weekdayName === "Fri" || weekdayName === "Sat" ? TEMPORAL.weekend : weekdayName === "Sun" ? TEMPORAL.weekday : profile) : profile;
  const t = hour - Math.floor(hour);
  let contribution = profile[lo] * (1 - t) + nextProfile[hi] * t;

  const inRange = (r: { from: number; to: number }) => hour >= r.from && hour < r.to;
  const L = TEMPORAL.labels;
  let label = weekday ? "Weekday daytime baseline" : "Weekend baseline";
  if (inRange(L.overnight)) label = "Quiet overnight baseline";
  else if (weekday && inRange(L.weekdayMorningRush)) label = "Weekday morning commute";
  else if (weekday && inRange(L.weekdayEveningRush)) label = "Weekday evening commute";
  else if (inRange(L.evening)) label = "Evening travel period";
  if (["Fri", "Sat"].includes(weekdayName) && inRange(TEMPORAL.weekendNight)) {
    contribution += TEMPORAL.weekendNight.value;
    label = "Weekend night travel";
  }
  return { type: "TIME", label, contribution: Math.round(contribution) };
}

// ---------------------------------------------------------------------------
// Term 2: events — magnitude × distance × time curve

export type EventInfluence = { value: number; phase: string; distanceKm: number };

/** Time-shaped influence of one event at one moment, before distance is applied: 0..1. */
export function eventTimeCurve(event: EventSignal, at: string): { shape: number; phase: string } {
  const sinceStart = (Date.parse(at) - Date.parse(event.startTime)) / MINUTE;
  const sinceEnd = (Date.parse(at) - Date.parse(event.endTime)) / MINUTE;
  const inb = EVENT.inbound;
  const out = EVENT.outbound;
  const widen = event.endEstimated ? EVENT.estimatedEndWidenMinutes : 0;

  // Arrivals build toward the start, then fade after it.
  const inbound =
    sinceStart < inb.peakFrom
      ? smooth((sinceStart - inb.rampStart) / (inb.peakFrom - inb.rampStart))
      : 1 - smooth((sinceStart - inb.peakFrom) / (inb.decayEnd - inb.peakFrom));

  // Exit wave around the (possibly estimated) end.
  const rampStart = out.rampStart - widen;
  const decayEnd = (event.category === "FOOTBALL" ? out.footballDecayEnd : out.decayEnd) + widen;
  const outbound =
    sinceEnd < out.peakFrom
      ? smooth((sinceEnd - rampStart) / (out.peakFrom - rampStart))
      : sinceEnd <= out.peakTo
        ? 1
        : 1 - smooth((sinceEnd - out.peakTo) / (decayEnd - out.peakTo));

  const during = sinceStart > 0 && sinceEnd < 0 ? EVENT.duringShare : 0;
  const shape = Math.max(inbound * EVENT.inboundShare, outbound, during);

  let phase: string;
  if (outbound >= inbound * EVENT.inboundShare && outbound > during) {
    phase = sinceEnd > out.peakTo ? "crowd dispersing" : event.endEstimated ? "estimated exit wave" : "ending nearby";
  } else if (inbound * EVENT.inboundShare > during) {
    phase = sinceStart >= inb.peakFrom ? "starting soon" : "arrivals building";
  } else {
    phase = "under way";
  }
  return { shape, phase };
}

export function eventInfluence(event: EventSignal, at: string, location: Point, destination?: Point | null): EventInfluence {
  const distance = corridorDistanceKm(event, location, destination);
  if (distance >= EVENT.reachKm) return { value: 0, phase: "out of range", distanceKm: distance };
  const { shape, phase } = eventTimeCurve(event, at);
  const proximity = Math.exp(-((distance / EVENT.scaleKm) ** 2));
  return { value: EVENT.magnitude[event.magnitude] * proximity * shape, phase, distanceKm: distance };
}

function eventReasons(bundle: SignalBundle, at: string): DemandReason[] {
  const ranked = bundle.events
    .map((event) => ({ event, effect: eventInfluence(event, at, bundle.location, bundle.destination) }))
    .sort((a, b) => b.effect.value - a.effect.value);
  const reasons: DemandReason[] = [];
  let budget = EVENT.budget;
  for (const { event, effect } of ranked) {
    const value = Math.min(budget, Math.round(effect.value));
    if (value <= 0) continue;
    const rider = event.evidence === "RIDER";
    reasons.push({
      type: "EVENT",
      label: `${event.name} · ${effect.phase}${rider ? " (rider-reported)" : ""}`,
      contribution: value,
      eventId: event.id,
      detail: `${event.venue} · ${effect.distanceKm.toFixed(1)} km from this trip · ${rider ? "unverified rider report" : event.source}`,
    });
    budget -= value;
  }
  return reasons;
}

// ---------------------------------------------------------------------------
// Term 3: weather

export function weatherReason(bundle: SignalBundle, at: string): DemandReason | null {
  const t = Date.parse(at);
  const hour = bundle.weather.find((w) => Date.parse(w.at) <= t && t - Date.parse(w.at) < HOUR);
  if (!hour) return null;

  const severe = hour.weatherCode >= WEATHER.severeCodeFrom || hour.windKph >= WEATHER.severeWindKph;
  const rain = Math.max(
    (clamp(hour.precipitationProbability, 0, 100) / 100) * WEATHER.precipitationProbabilityMax,
    hour.rainMm > 0 ? WEATHER.rainFloor : 0,
  );
  const snow = hour.snowCm > 0 ? WEATHER.snow : 0;
  const temperature = hour.temperatureC < WEATHER.coldBelowC || hour.temperatureC > WEATHER.hotAboveC ? WEATHER.extremeTemperature : 0;
  const contribution = Math.round(clamp(rain + snow + temperature + (severe ? WEATHER.severe : 0), 0, WEATHER.max));
  if (!contribution) return null;

  const label = severe
    ? "Storm conditions · service risk"
    : snow
      ? "Snow may slow service"
      : rain >= 8
        ? "Rain expected · walking trips shift to transit"
        : rain >= 4
          ? "Rain likely"
          : temperature
            ? "Extreme temperature"
            : "Chance of rain";
  const detail = `${Math.round(hour.precipitationProbability)}% precipitation chance · ${hour.rainMm > 0 ? `${hour.rainMm} mm rain · ` : ""}${hour.snowCm > 0 ? `${hour.snowCm} cm snow · ` : ""}${Math.round(hour.temperatureC)}°C · wind ${Math.round(hour.windKph)} km/h (hourly forecast)`;
  return { type: "WEATHER", label, contribution, detail };
}

// ---------------------------------------------------------------------------
// Term 4: realtime transit evidence (delays, alerts), decaying with age

export function transitEvidenceWeight(observedAt: string | null, at: string): number {
  if (!observedAt) return 0;
  const ageMinutes = (Date.parse(at) - Date.parse(observedAt)) / MINUTE;
  if (ageMinutes < -5) return 0; // evidence from "now" says nothing about a much earlier time
  if (ageMinutes <= TRANSIT.fullMinutes) return 1;
  return clamp(1 - (ageMinutes - TRANSIT.fullMinutes) / (TRANSIT.fadeMinutes - TRANSIT.fullMinutes), 0, 1);
}

export function transitReason(bundle: SignalBundle, at: string): DemandReason | null {
  const status = bundle.freshness.find((f) => f.source === "PRT realtime")?.status;
  if (status !== "LIVE" && status !== "DEMO") return null;
  const weight = transitEvidenceWeight(bundle.transit.observedAt, at);
  if (weight <= 0) return null;

  const delay = Math.min(TRANSIT.delayMax, Math.max(0, bundle.transit.delayMinutes ?? 0) * TRANSIT.delayPointsPerMinute);
  const alerts = bundle.transit.alerts
    .map((a) => ({ ...a, points: TRANSIT.alertPoints[a.effect ?? -1] ?? 0 }))
    .sort((a, b) => b.points - a.points);
  const alertPoints = alerts.reduce((sum, a) => sum + a.points, 0);
  const contribution = Math.round(clamp((delay + alertPoints) * weight, 0, TRANSIT.max));
  if (!contribution) return null;

  const label =
    delay >= alertPoints
      ? `Reported delay near this stop area (${Math.round(bundle.transit.delayMinutes ?? 0)} min)`
      : alerts[0].label;
  const parts = [
    bundle.transit.delayMinutes !== null ? `largest reported delay ${Math.round(bundle.transit.delayMinutes)} min` : "no explicit delay field",
    alerts.filter((a) => a.points > 0).length ? `${alerts.filter((a) => a.points > 0).length} active alert(s): ${alerts.filter((a) => a.points > 0).map((a) => a.label).join("; ")}` : "no active alerts",
    `evidence weight ${Math.round(weight * 100)}% (fades with age)`,
  ];
  return { type: "TRANSIT", label, contribution, detail: `PRT GTFS-Realtime · ${parts.join(" · ")}` };
}

// ---------------------------------------------------------------------------
// Term 5: scheduled service frequency (sparse service raises pressure)

export function serviceReason(bundle: SignalBundle, at: string): DemandReason | null {
  const t = Date.parse(at);
  const groups = new Map<string, number[]>();
  for (const d of bundle.departures) {
    const minutes = (Date.parse(d.at) - t) / MINUTE;
    if (minutes < 0 || minutes > SERVICE.lookaheadMinutes) continue;
    // Compare departures on ONE stop + route + direction; never pool directions.
    const key = `${d.stopId}:${d.routeId}:${d.directionId}`;
    groups.set(key, [...(groups.get(key) ?? []), minutes]);
  }
  const gaps = [...groups.values()]
    .filter((v) => v.length >= 2)
    .map((v) => {
      v.sort((a, b) => a - b);
      return v[1] - v[0];
    });
  if (!gaps.length) return null;
  const gap = Math.min(...gaps);
  const contribution = Math.round(clamp((gap - SERVICE.gapFromMinutes) * SERVICE.pointsPerMinute, 0, SERVICE.max));
  if (!contribution) return null;
  return { type: "SERVICE", label: `Sparse scheduled service nearby (~${Math.round(gap)} min gap)`, contribution, detail: "PRT GTFS schedule snapshot; gap between the next two departures on one stop, route and direction. Not live service." };
}

// ---------------------------------------------------------------------------
// Confidence reflects data quality and forecast horizon, never decoration.

export function confidenceFor(bundle: SignalBundle, at: string): Confidence {
  const usable = (name: string) => {
    const f = bundle.freshness.find((x) => x.source === name);
    return f?.status === "LIVE" || f?.status === "DEMO" || (name === "Scheduled service" && f?.status === "FALLBACK");
  };
  const sportsFeeds = ["MLB schedule", "NHL schedule", "ESPN schedule"].filter(usable).length;
  const eventsUsable = bundle.mode === "DEMO" ? usable("Events") : sportsFeeds >= 2;
  const points = [eventsUsable, usable("Hourly weather"), usable("PRT realtime"), usable("Scheduled service")].filter(Boolean).length;
  const stale = bundle.freshness.some((f) => f.status === "STALE");
  const horizonHours = (Date.parse(at) - Date.parse(bundle.generatedAt)) / HOUR;
  const weatherCovered = !!bundle.weather.length;

  if (points >= CONFIDENCE.highMinimumSources && !stale && weatherCovered && horizonHours <= CONFIDENCE.highHorizonHours) return "HIGH";
  if (points >= CONFIDENCE.mediumMinimumSources && weatherCovered && horizonHours <= CONFIDENCE.mediumHorizonHours) return "MEDIUM";
  return "LOW";
}

// ---------------------------------------------------------------------------
// One sample

export function predictPressure(bundle: SignalBundle, at: string): DemandPrediction {
  const reasons: DemandReason[] = [temporalBaseline(at), ...eventReasons(bundle, at)];
  for (const reason of [weatherReason(bundle, at), transitReason(bundle, at), serviceReason(bundle, at)]) {
    if (reason) reasons.push(reason);
  }
  const score = Math.round(clamp(reasons.reduce((sum, r) => sum + r.contribution, 0)));
  return {
    at,
    score,
    level: levelFor(score),
    confidence: confidenceFor(bundle, at),
    reasons: reasons.sort((a, b) => b.contribution - a.contribution),
  };
}

// ---------------------------------------------------------------------------
// Timeline, windows, recommendation

function findSurge(timeline: DemandPrediction[]): SurgeWindow | null {
  const first = timeline.findIndex((p) => p.score >= LEVELS.SURGE);
  if (first < 0) return null;
  let last = first;
  while (last + 1 < timeline.length && timeline[last + 1].score >= LEVELS.SURGE) last++;
  const run = timeline.slice(first, last + 1);
  const peakSample = run.reduce((best, p) => (p.score > best.score ? p : best), run[0]);
  return {
    start: timeline[first].at,
    end: timeline[Math.min(last + 1, timeline.length - 1)].at,
    peak: peakSample.score,
    peakAt: peakSample.at,
    continues: last === timeline.length - 1,
  };
}

/** Lowest average over two adjacent samples, so a one-point dip is never recommended. */
function findBestWindow(timeline: DemandPrediction[]): { index: number; window: LowWindow } {
  let best = 0;
  for (let i = 1; i < timeline.length - 1; i++) {
    if (timeline[i].score + timeline[i + 1].score < timeline[best].score + timeline[best + 1].score) best = i;
  }
  const end = timeline[Math.min(best + 1, timeline.length - 1)];
  return {
    index: best,
    window: { start: timeline[best].at, end: end.at, score: Math.round((timeline[best].score + end.score) / 2) },
  };
}

function minutesBetween(a: string, b: string) {
  return (Date.parse(b) - Date.parse(a)) / MINUTE;
}

export function recommend(
  timeline: DemandPrediction[],
  surge: SurgeWindow | null,
  best: { index: number; window: LowWindow },
  anchoredAtNow = true,
): Recommendation {
  const current = timeline[0];
  // A timeline that starts later (a chosen departure, or tomorrow) advises "leave at", never "now".
  const nowLabel = anchoredAtNow ? "Leave now" : `Leave at ${clockTime(current.at)}`;
  const nowWord = anchoredAtNow ? "now" : `at ${clockTime(current.at)}`;
  const horizonHours = Math.round(minutesBetween(timeline[0].at, timeline[timeline.length - 1].at) / 60);
  const surgeIndex = surge ? timeline.findIndex((p) => p.at === surge.start) : -1;
  const R = RECOMMENDATION;

  // 1. Inside a surge now: the only useful advice is whether it passes.
  if (surge && surgeIndex === 0) {
    if (!surge.continues && best.window.score <= current.score - R.worthWaitingDelta) {
      return {
        kind: "AFTER_SURGE",
        label: `Lower pressure after ${clockTime(surge.end)}`,
        detail: `Pressure is at its peak now (${surge.peak}/100). It should ease by ${clockTime(surge.end)}; the ${clockTime(best.window.start)}–${clockTime(best.window.end)} window looks lowest.`,
        at: surge.end,
      };
    }
    return {
      kind: "ALLOW_EXTRA_TIME",
      label: "Allow extra time",
      detail: "Pressure stays high across the next few hours. Expect fuller vehicles and possible waits; check live alerts before leaving.",
      at: current.at,
    };
  }

  // 2. A surge is coming: get ahead of it.
  if (surge && surgeIndex > 0) {
    const minutesAway = minutesBetween(current.at, surge.start);
    const leaveBy = timeline[surgeIndex - 1].at;
    if (minutesAway <= R.imminentMinutes) {
      return {
        kind: "LEAVE_NOW",
        label: nowLabel,
        detail: `Surge expected from ${clockTime(surge.start)} (peak ${surge.peak}/100). Leaving ${nowWord} stays ahead of it.`,
        at: current.at,
      };
    }
    return {
      kind: "LEAVE_BEFORE",
      label: `Leave before ${clockTime(surge.start)}`,
      detail: `Surge expected ${clockTime(surge.start)}–${clockTime(surge.end)} (peak ${surge.peak}/100). Departing by ${clockTime(leaveBy)} stays ahead of it.`,
      at: leaveBy,
    };
  }

  // 3. Pressure climbs noticeably within the hour: now is the quieter side of the peak.
  const soon = timeline.filter((p) => minutesBetween(current.at, p.at) <= R.peakWithinMinutes);
  const peakSoon = soon.reduce((top, p) => (p.score > top.score ? p : top), current);
  if (peakSoon.score >= current.score + R.climbDelta && peakSoon.score >= LEVELS.HIGH) {
    return {
      kind: "LEAVE_NOW",
      label: nowLabel,
      detail: `Pressure climbs to ${peakSoon.score}/100 (${peakSoon.level.toLowerCase()}) by ${clockTime(peakSoon.at)}. Leaving ${nowWord} is the quieter side of it.`,
      at: current.at,
    };
  }

  // 4. High now, but a clearly quieter window arrives soon enough to matter.
  const waitMinutes = minutesBetween(current.at, best.window.start);
  if (best.index > 0 && current.score >= LEVELS.HIGH && best.window.score <= current.score - R.worthWaitingDelta && waitMinutes <= R.worthWaitingWithinMinutes) {
    return {
      kind: "WAIT_FOR_LOWER",
      label: `Lower pressure after ${clockTime(best.window.start)}`,
      detail: `Pressure is ${current.level.toLowerCase()} now (${current.score}/100) and drops to about ${best.window.score} by ${clockTime(best.window.start)}. Waiting ${Math.round(waitMinutes)} min helps if you can.`,
      at: best.window.start,
    };
  }

  if (current.score >= LEVELS.HIGH) {
    return {
      kind: "ALLOW_EXTRA_TIME",
      label: "Allow extra time",
      detail: `Pressure is ${current.level.toLowerCase()} (${current.score}/100) with no clearly quieter window in the next ${horizonHours} hours.`,
      at: current.at,
    };
  }
  return {
    kind: "LEAVE_NOW",
    label: nowLabel,
    detail: `No surge expected in the ${horizonHours} hours after ${clockTime(current.at)}. This is a relative index, not a guarantee of room.`,
    at: current.at,
  };
}

function eventImpacts(bundle: SignalBundle, timeline: DemandPrediction[]): EventImpact[] {
  const impacts: EventImpact[] = [];
  for (const event of bundle.events) {
    const samples = timeline.map((p) => ({ at: p.at, ...eventInfluence(event, p.at, bundle.location, bundle.destination) }));
    const peak = samples.reduce((best, s) => (s.value > best.value ? s : best), samples[0]);
    const contribution = Math.round(peak.value);
    if (contribution < EVENT.impactMinimum) continue;
    const inWindow = samples.filter((s) => s.value >= peak.value / 2);
    impacts.push({
      event,
      distanceKm: Math.round(peak.distanceKm * 10) / 10,
      contribution,
      peakAt: peak.at,
      window: { start: inWindow[0].at, end: inWindow[inWindow.length - 1].at },
      role: contribution >= EVENT.majorImpact ? "MAJOR" : "MINOR",
    });
  }
  return impacts.sort((a, b) => b.contribution - a.contribution);
}

/** In-reach events whose influence falls after the timeline: shown as "upcoming" so a
 * quiet reading now does not hide tomorrow's game on the same corridor. */
function upcomingEvents(bundle: SignalBundle, timelineEnd: string, impacted: Set<string>): UpcomingEvent[] {
  const horizonEnd = Date.parse(timelineEnd);
  const limit = Date.parse(bundle.generatedAt) + 48 * HOUR;
  return bundle.events
    .filter((e) => !impacted.has(e.id) && Date.parse(e.startTime) > horizonEnd - HOUR && Date.parse(e.startTime) <= limit)
    .map((event) => ({ event, distanceKm: corridorDistanceKm(event, bundle.location, bundle.destination) }))
    .filter(({ distanceKm }) => distanceKm < EVENT.reachKm)
    .sort((a, b) => Date.parse(a.event.startTime) - Date.parse(b.event.startTime))
    .slice(0, 3)
    .map(({ event, distanceKm }) => ({
      event,
      distanceKm: Math.round(distanceKm * 10) / 10,
      arrivalsPeakAt: new Date(Date.parse(event.startTime) + EVENT.inbound.peakFrom * MINUTE).toISOString(),
      exitPeakAt: new Date(Date.parse(event.endTime) + EVENT.outbound.peakFrom * MINUTE).toISOString(),
    }));
}

/** Converts a rider-reported cause into a bounded event signal. It never gets a
 * MAJOR magnitude, its end is always an estimate, and it is labeled unverified. */
export function riderSignalToEvent(signal: RiderSignal): EventSignal {
  return {
    id: signal.id,
    name: signal.name,
    category: signal.category,
    venue: signal.venue,
    lat: signal.lat,
    lng: signal.lng,
    startTime: signal.startTime,
    endTime: signal.endTime,
    endEstimated: true,
    magnitude: "MEDIUM",
    source: "Rider report (unverified)",
    confidence: "LOW",
    evidence: "RIDER",
  };
}

/** Causes the model cannot see with the sources it actually had. Listing them
 * keeps "no event found" from reading as "nothing is happening". */
export function coverageGaps(bundle: SignalBundle): string[] {
  const status = (name: string) => bundle.freshness.find((f) => f.source === name)?.status;
  const gaps: string[] = [];
  if (bundle.mode !== "DEMO") {
    const sports = ["MLB schedule", "NHL schedule", "ESPN schedule"].filter((n) => status(n) === "LIVE" || status(n) === "STALE").length;
    if (sports < 3) gaps.push(`${3 - sports} of 3 pro sports schedules unavailable this run`);
    if (status("Ticketmaster") !== "LIVE" && status("Ticketmaster") !== "STALE") gaps.push("Concerts, theater, festivals and ticketed events (needs TICKETMASTER_API_KEY)");
    gaps.push("Campus events, conventions, parades and road closures (no feed connected)");
    if (status("PRT realtime") !== "LIVE") gaps.push("Live service disruptions (PRT realtime feed not usable this run)");
    if (!bundle.weather.length) gaps.push("Weather forecast");
  } else {
    gaps.push("Deterministic scenario: only the authored signals exist");
  }
  return gaps;
}

export function buildPressure(bundle: SignalBundle, start: string, horizonMinutes: number = TIMELINE.defaultHorizonMinutes): PressureResult {
  const horizon = clamp(horizonMinutes, TIMELINE.stepMinutes, TIMELINE.maxHorizonMinutes);
  const samples = Math.floor(horizon / TIMELINE.stepMinutes) + 1;
  const timeline = Array.from({ length: samples }, (_, i) =>
    predictPressure(bundle, new Date(Date.parse(start) + i * TIMELINE.stepMinutes * MINUTE).toISOString()),
  );
  const surge = findSurge(timeline);
  const best = findBestWindow(timeline);
  const anchoredAtNow = Math.abs(Date.parse(start) - Date.parse(bundle.generatedAt)) <= 5 * MINUTE;
  const impacts = eventImpacts(bundle, timeline);
  return {
    mode: bundle.mode,
    modelVersion: MODEL_VERSION,
    generatedAt: bundle.generatedAt,
    location: bundle.location,
    destination: bundle.destination ?? null,
    stepMinutes: TIMELINE.stepMinutes,
    current: timeline[0],
    timeline,
    surge,
    bestWindow: best.window,
    recommendation: recommend(timeline, surge, best, anchoredAtNow),
    eventImpacts: impacts,
    upcoming: upcomingEvents(bundle, timeline[timeline.length - 1].at, new Set(impacts.map((i) => i.event.id))),
    freshness: bundle.freshness,
    events: bundle.events.filter((e) => corridorDistanceKm(e, bundle.location, bundle.destination) < EVENT.reachKm),
    coverage: COVERAGE_NOTE,
    coverageGaps: coverageGaps(bundle),
  };
}

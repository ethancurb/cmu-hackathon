// Server-side executors shared by the guided parser and the Claude tool loop.
// They run the real routing adapter and the real pressure engine; replies are
// composed only from what those return.
import { fetchJourneys } from "../journey/motis.ts";
import { JOURNEY_DEFAULTS, type Journey, type JourneyResponse } from "../journey/types.ts";
import { durationLabel, journeySummary, routesLabel, timingLabel } from "../journey/format.ts";
import { livePressure } from "../pressure/service.ts";
import { explainSample, explanationText, nearestSampleIndex } from "../pressure/explain.ts";
import { clock, timeRange, LEVEL_WORD } from "../pressure/format.ts";
import type { PressureResult, RiderSignal } from "../pressure/types.ts";
import type { ChatPlace } from "./types.ts";

export type PlanInput = {
  origin: ChatPlace;
  destination: ChatPlace;
  at: string | null;
  arriveBy: boolean;
  maxWalkMinutes?: number;
  maxTransfers?: number | null;
  riderSignals?: RiderSignal[];
};

export type PlanResult = {
  journeys: JourneyResponse;
  pressure: PressureResult | null;
  pressureError: string | null;
};

export async function planTrip(input: PlanInput): Promise<PlanResult> {
  const at = input.at ?? new Date().toISOString();
  const journeys = await fetchJourneys({
    from: input.origin,
    to: input.destination,
    at,
    arriveBy: input.arriveBy,
    maxWalkMinutes: input.maxWalkMinutes ?? JOURNEY_DEFAULTS.maxWalkMinutes,
    maxTransfers: input.maxTransfers ?? JOURNEY_DEFAULTS.maxTransfers,
  });
  const first = journeys.status === "ok" ? journeys.journeys[0] : null;
  const pressureAt = first && Date.parse(first.startTime) > Date.now() - 4 * 60_000 ? first.startTime : input.arriveBy ? new Date().toISOString() : at;
  let pressure: PressureResult | null = null;
  let pressureError: string | null = null;
  try {
    if (Date.parse(pressureAt) <= Date.now() + 48 * 3_600_000) pressure = await livePressure({ location: input.origin, destination: input.destination, at: pressureAt, riderSignals: input.riderSignals });
    else pressureError = "Transit Pressure is modeled up to 48 hours ahead.";
  } catch {
    pressureError = "Transit Pressure model unavailable right now.";
  }
  return { journeys, pressure, pressureError };
}

export function journeyLine(j: Journey, index: number): string {
  return `${index + 1}. ${routesLabel(j)} — ${journeySummary(j)} (${timingLabel(j)})`;
}

/** Human summary of a plan: options, the pressure at departure and the advice. */
export function describePlan(input: PlanInput, result: PlanResult): string {
  const lines: string[] = [];
  const when = input.at ? (input.arriveBy ? `arriving by ${clock(input.at)}` : `leaving ${clock(input.at)}`) : "leaving now";
  lines.push(`${input.origin.label} → ${input.destination.label}, ${when}.`);
  if (result.journeys.status === "ok") {
    const list = result.journeys.journeys.slice(0, 3);
    lines.push(list.map(journeyLine).join("\n"));
    const best = list[0];
    if (input.arriveBy && input.at && Date.parse(best.endTime) > Date.parse(input.at)) lines.push(`Note: the earliest arrival found is ${clock(best.endTime)}, after your ${clock(input.at)} deadline.`);
    lines.push(`Arrival times are provider estimates (${timingLabel(best)}); durations include walking, waiting and riding.`);
  } else if (result.journeys.status === "empty") {
    lines.push(`No walking + transit itinerary was found: ${result.journeys.reason}`);
  } else {
    lines.push(`Routing is unavailable right now (${result.journeys.error}). I will not guess a route or travel time.`);
  }
  const p = result.pressure;
  if (p) {
    lines.push(`Transit Pressure at departure: ${LEVEL_WORD[p.current.level]}, ${p.current.score}/100 (model index, not occupancy; confidence ${p.current.confidence.toLowerCase()}).${p.surge ? ` Surge expected ${timeRange(p.surge.start, p.surge.end)}${p.surge.continues ? "+" : ""}.` : " No surge expected in the next 4 hours."}`);
    const top = p.current.reasons.slice(0, 2).map((r) => `${r.label} (+${r.contribution})`).join("; ");
    if (top) lines.push(`Why: ${top}.`);
    lines.push(`Advice: ${p.recommendation.label} — ${p.recommendation.detail}`);
  } else if (result.pressureError) {
    lines.push(result.pressureError);
  }
  return lines.join("\n");
}

export function explainAtText(pressure: PressureResult, at: string): string {
  const index = nearestSampleIndex(pressure.timeline, at);
  return explanationText(explainSample(pressure, index));
}

/** "After the event" without inventing an end: uses the modeled surge end when the
 * major contributor is an event; otherwise says what is missing. */
export function afterEventTime(pressure: PressureResult | null): { at: string; note: string } | { at: null; note: string } {
  if (!pressure) return { at: null, note: "I have no pressure model for this trip yet, so I cannot place the end of an event." };
  const major = pressure.eventImpacts.find((i) => i.role === "MAJOR") ?? pressure.eventImpacts[0] ?? null;
  if (!major) {
    const upcoming = pressure.upcoming[0];
    if (upcoming) return { at: null, note: `The nearest known event is ${upcoming.event.name} at ${upcoming.event.venue} (${clock(upcoming.event.startTime)}, exit wave ~${clock(upcoming.exitPeakAt)}, end estimated), outside the current window. Tell me a departure time and I will plan around it.` };
    return { at: null, note: "No verified event is known for this trip and time. If you know of one, tell me the name, venue and start time and I will add it as an unverified rider report." };
  }
  const end = pressure.surge && Date.parse(pressure.surge.end) > Date.parse(major.window.end) ? pressure.surge.end : major.window.end;
  const at = new Date(Math.max(Date.parse(end), Date.now() + 60_000)).toISOString();
  return {
    at,
    note: `${major.event.name} at ${major.event.venue} ${major.event.endEstimated ? "is estimated to end" : "ends"} ${clock(major.event.endTime)}${major.event.endEstimated ? " (an assumption from typical durations)" : ""}; the modeled exit wave runs ${timeRange(major.window.start, major.window.end)}. Leaving after ${clock(at)} avoids the busiest part.`,
  };
}

export function walkingNote(minutes: number): string {
  return `Walking limit set to ${minutes} min per street leg.`;
}

export function durationNote(j: Journey): string {
  return durationLabel(j.durationSeconds);
}

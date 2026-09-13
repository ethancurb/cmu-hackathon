// Client-safe formatting for journeys. Every number here is a provider value or
// a sum of provider values; nothing is estimated locally.
import { clock } from "../pressure/format.ts";
import type { Journey, JourneyLeg } from "./types.ts";

export function minutes(seconds: number): number {
  return Math.round(seconds / 60);
}

export function durationLabel(seconds: number): string {
  const m = minutes(seconds);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}

export function walkDistanceLabel(meters: number | null): string {
  if (meters === null) return "";
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

/** "61C toward Downtown" or "Walk 4 min". */
export function legTitle(leg: JourneyLeg): string {
  if (leg.mode === "WALK") return `Walk ${durationLabel(leg.durationSeconds)}${leg.distanceMeters !== null ? ` · ${walkDistanceLabel(leg.distanceMeters)}` : ""}`;
  const vehicle = leg.mode === "BUS" ? "Bus" : leg.mode === "RAIL" ? "Rail" : leg.mode === "TRAM" ? "Light rail" : "Transit";
  return `${vehicle} ${leg.routeShortName ?? ""}${leg.headsign ? ` toward ${leg.headsign}` : ""}`.trim();
}

/** "Board Forbes Ave + Morewood 8:38 PM → Wood St Station 8:56 PM · 9 stops". */
export function legDetail(leg: JourneyLeg): string {
  const from = leg.from.name || "your origin";
  const to = leg.to.name || "your destination";
  if (leg.mode === "WALK") return `${from} → ${to}`;
  const stops = leg.intermediateStops ? ` · ${leg.intermediateStops + 1} stops` : "";
  return `Board ${from} ${clock(leg.startTime)} → alight ${to} ${clock(leg.endTime)}${stops}`;
}

/** Whether the itinerary's transit timing is realtime or scheduled. */
export function timingLabel(journey: Journey): string {
  const transit = journey.legs.filter((l) => l.mode !== "WALK");
  if (!transit.length) return "walking estimate";
  return journey.realTime ? "realtime PRT" : "scheduled";
}

/** One-line summary of what the journey uses: "61C · 28X" or "walk only". */
export function routesLabel(journey: Journey): string {
  const routes = journey.legs.filter((l) => l.mode !== "WALK").map((l) => l.routeShortName ?? l.mode);
  return routes.length ? routes.join(" → ") : "walk only";
}

/** Minutes early a rider should reach the boarding stop, so a slow walk or a
 * late bus door never costs them the ride. */
export const LEAVE_BUFFER_MINUTES = 2;

/** ISO time to leave the origin so the rider reaches the boarding stop
 * `LEAVE_BUFFER_MINUTES` before the bus departs. Walking time is summed from
 * the provider's own leg durations up to the first transit leg, never
 * estimated. Null for a walk-only journey (no bus to catch). */
export function leaveByTime(journey: Journey): string | null {
  const boardIndex = journey.legs.findIndex((leg) => leg.mode !== "WALK");
  if (boardIndex === -1) return null;
  const walkToStopSeconds = journey.legs.slice(0, boardIndex).reduce((sum, leg) => sum + leg.durationSeconds, 0);
  const boardAt = Date.parse(journey.legs[boardIndex].startTime);
  return new Date(boardAt - walkToStopSeconds * 1000 - LEAVE_BUFFER_MINUTES * 60_000).toISOString();
}

/** "in 6 min" / "leave now"; null while `now` hasn't mounted yet (caller falls back to a clock time). */
export function minutesUntilLabel(at: string, now: number | null): string | null {
  if (now === null) return null;
  const diffMin = Math.floor((Date.parse(at) - now) / 60_000);
  if (diffMin <= 0) return "leave now";
  return `in ${diffMin} min`;
}

/** Whether the rider must leave within `LEAVE_BUFFER_MINUTES` to make this departure. */
export function isLeaveUrgent(at: string, now: number | null): boolean {
  if (now === null) return false;
  const diffMin = Math.floor((Date.parse(at) - now) / 60_000);
  return diffMin <= LEAVE_BUFFER_MINUTES;
}

export function journeySummary(journey: Journey): string {
  const parts = [
    `Leave ${clock(journey.startTime)}`,
    `arrive ~${clock(journey.endTime)}`,
    durationLabel(journey.durationSeconds),
    journey.transfers ? `${journey.transfers} transfer${journey.transfers > 1 ? "s" : ""}` : "no transfers",
    `${minutes(journey.walkSeconds)} min walking`,
  ];
  return parts.join(" · ");
}

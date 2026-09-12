import { corridorDistanceKm, distanceKm } from "../pressure/geo.ts";
import type { Journey, JourneyLeg, LatLng } from "./types.ts";

export type JourneyFix = LatLng & { accuracy: number; timestamp: number };
export type JourneyProgress = {
  status: "nearby" | "arrival" | "locating" | "unavailable" | "stale" | "inaccurate" | "off-route" | "ambiguous" | "preview" | "expired";
  /** The leg index, or legs.length for the destination card. Never a boarding claim. */
  index: number | null;
};

const FRESH_MS = 90_000;
const MAX_ACCURACY_METERS = 80;

function legDistance(point: LatLng, leg: JourneyLeg): number {
  if (leg.geometry.length < 2) return Math.min(distanceKm(point, leg.from), distanceKm(point, leg.to)) * 1000;
  let distance = Infinity;
  for (let i = 1; i < leg.geometry.length; i++) {
    distance = Math.min(distance, corridorDistanceKm(point, leg.geometry[i - 1], leg.geometry[i]) * 1000);
  }
  return distance;
}

/** Conservative foreground proximity, not proof that the rider boarded a bus.
 * Missing/noisy GPS and overlapping route segments must not assert a current step. */
export function journeyProgress(journey: Journey, fix: JourneyFix | null, now: number, unavailable = false): JourneyProgress {
  const unknown = (status: JourneyProgress["status"]): JourneyProgress => ({ status, index: null });
  if (Date.parse(journey.startTime) > now + 30 * 60_000) return unknown("preview");
  if (Date.parse(journey.endTime) < now - 2 * 60 * 60_000) return unknown("expired");
  if (unavailable) return unknown("unavailable");
  if (!fix) return unknown("locating");
  if (![fix.lat, fix.lng, fix.accuracy, fix.timestamp].every(Number.isFinite) || fix.accuracy < 0 || Math.abs(fix.lat) > 90 || Math.abs(fix.lng) > 180) return unknown("unavailable");
  if (now - fix.timestamp > FRESH_MS || fix.timestamp > now + 10_000) return unknown("stale");
  if (fix.accuracy > MAX_ACCURACY_METERS) return unknown("inaccurate");
  const radius = Math.max(35, Math.min(70, fix.accuracy * 1.5));
  const candidates = journey.legs.map((leg, index) => ({ index, distance: legDistance(fix, leg) }))
    .filter((candidate) => candidate.distance <= radius).sort((a, b) => a.distance - b.distance);
  if (!candidates.length) return unknown("off-route");
  const near = candidates.filter((candidate) => candidate.distance <= candidates[0].distance + Math.max(10, fix.accuracy));
  let index = candidates[0].index;
  if (near.length > 1) {
    const indices = near.map((candidate) => candidate.index).sort((a, b) => a - b);
    // Only resolve a tie at the shared endpoint of two consecutive steps.
    // Parallel or crossing segments elsewhere remain ambiguous.
    if (indices.length !== 2 || indices[1] !== indices[0] + 1 ||
      distanceKm(fix, journey.legs[indices[0]].to) * 1000 > radius ||
      distanceKm(fix, journey.legs[indices[1]].from) * 1000 > radius) return unknown("ambiguous");
    index = indices[1];
  }
  const last = journey.legs.length - 1;
  if (index === last && distanceKm(fix, journey.legs[last].to) * 1000 <= radius) return { status: "arrival", index: journey.legs.length };
  return { status: "nearby", index };
}

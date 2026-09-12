import { NextResponse } from "next/server";
import { GTFS_ROUTE_ID, NEARBY_STOPS } from "@/lib/prt-routes";
import { parseTripUpdates, type TripPrediction } from "@/lib/prt-trip-updates";
import type { RouteId } from "@/lib/mock-data";

/** Real-time arrival predictions for the three tracked routes' nearby
 * stops, from PRT's live GTFS-realtime TripUpdate feed.
 *
 * NOT the `/api/arrivals` (CapacityCard) contract in docs/ARCHITECTURE.md /
 * issue #7 (T3) — that's a separate, larger CapacitySource-backed contract
 * that also carries occupancy; this endpoint only ever reports predicted
 * times, never a seat count. Named differently on purpose to avoid
 * colliding with that ticket's planned route.
 *
 * "unavailable" is a real, expected state, not a bug: PRT's live feed only
 * carries predictions for trips currently in progress, which can be a
 * genuinely short list off-peak — showing an honest "unavailable" for a
 * route with no live prediction right now beats inventing or reusing a
 * stale number. */

const FEED_URL = "https://truetime.portauthority.org/gtfsrt-bus/trips?debug=";
// Coalesces polling across every connected client into one upstream read
// per window, per ARCHITECTURE.md's quota guidance — this feed has no
// documented per-key limit, but hammering a public agency endpoint on every
// browser's poll regardless is the wrong default.
const CACHE_MS = 15_000;
const STALE_PREDICTION_GRACE_SECONDS = 30;

export type ArrivalInfo =
  | { status: "live"; stopName: string; epochSeconds: number; minutesFromNow: number }
  | { status: "unavailable" };

export type ArrivalTimes = Record<RouteId, ArrivalInfo>;

let cache: { at: number; predictions: TripPrediction[] } | null = null;

async function getPredictions(): Promise<TripPrediction[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.predictions;

  const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`PRT TripUpdate feed returned ${res.status}`);
  const text = await res.text();
  const predictions = parseTripUpdates(text);
  cache = { at: Date.now(), predictions };
  return predictions;
}

const ROUTE_IDS = Object.keys(GTFS_ROUTE_ID) as RouteId[];

export async function GET() {
  let predictions: TripPrediction[];
  try {
    predictions = await getPredictions();
  } catch {
    // Upstream feed unreachable or malformed — every route reports
    // unavailable rather than serving a stale cache or a fabricated time.
    const allUnavailable = Object.fromEntries(ROUTE_IDS.map((id) => [id, { status: "unavailable" as const }]));
    return NextResponse.json(allUnavailable as ArrivalTimes);
  }

  const nowSeconds = Date.now() / 1000;
  const result = {} as ArrivalTimes;

  for (const routeId of ROUTE_IDS) {
    const gtfsRouteId = GTFS_ROUTE_ID[routeId];
    const stops = NEARBY_STOPS[routeId];
    const stopNameById = new Map(stops.map((s) => [s.stopId, s.name]));
    const stopIds = new Set(stops.map((s) => s.stopId));

    const candidates = predictions
      .filter(
        (p) => p.routeId === gtfsRouteId && stopIds.has(p.stopId) && p.epochSeconds >= nowSeconds - STALE_PREDICTION_GRACE_SECONDS
      )
      .sort((a, b) => a.epochSeconds - b.epochSeconds);
    const soonest = candidates[0];

    result[routeId] = soonest
      ? {
          status: "live",
          stopName: stopNameById.get(soonest.stopId) ?? "Nearby stop",
          epochSeconds: soonest.epochSeconds,
          minutesFromNow: Math.max(0, Math.round((soonest.epochSeconds - nowSeconds) / 60)),
        }
      : { status: "unavailable" };
  }

  return NextResponse.json(result);
}

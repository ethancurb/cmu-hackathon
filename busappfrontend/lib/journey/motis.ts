// Transitous (MOTIS) routing adapter. Public, key-free instance that ingests
// PRT's GTFS feed; verified for Pittsburgh on 2026-09-12 (stop ids like
// "us-pa-PRT_4407", routes "61C", light rail "RED"). Their usage policy asks
// for an identifying User-Agent; no attribution string is required.
// Server-side only: results are validated here so the UI never renders a
// malformed leg, and cached briefly so repeated polls coalesce.
import { cached, record as r, list, str, num } from "../pressure/providers/http.ts";
import { decodePolyline } from "./polyline.ts";
import { JOURNEY_DEFAULTS, type Journey, type JourneyLeg, type JourneyPlace, type JourneyRequest, type JourneyResponse, type LatLng, type LegMode } from "./types.ts";

export const PROVIDER = "Transitous (MOTIS) over PRT GTFS";
const BASE = "https://api.transitous.org/api/v1/plan";
const USER_AGENT = "LoadLine/0.1 (HackCMU 2026; github.com/ethancurb/cmu-hackathon)";
const CACHE_TTL_MS = 45_000;

const TRANSIT_MODES = new Set(["BUS", "COACH", "TRAM", "SUBWAY", "RAIL", "REGIONAL_RAIL", "REGIONAL_FAST_RAIL", "SUBURBAN", "HIGHSPEED_RAIL", "LONG_DISTANCE", "NIGHT_RAIL", "FERRY", "FUNICULAR", "AERIAL_LIFT", "METRO", "OTHER"]);

function legMode(raw: string): LegMode | null {
  if (raw === "WALK") return "WALK";
  if (raw === "BUS" || raw === "COACH") return "BUS";
  if (raw === "TRAM" || raw === "SUBWAY" || raw === "METRO") return "TRAM";
  if (["RAIL", "REGIONAL_RAIL", "REGIONAL_FAST_RAIL", "SUBURBAN", "HIGHSPEED_RAIL", "LONG_DISTANCE", "NIGHT_RAIL"].includes(raw)) return "RAIL";
  if (TRANSIT_MODES.has(raw)) return "OTHER";
  return null; // BIKE, CAR, RENTAL and similar are not part of a walking + transit itinerary
}

function iso(v: unknown): string | null {
  const s = str(v);
  const t = Date.parse(s);
  return s && Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function place(v: unknown, timeKey: "departure" | "arrival"): JourneyPlace | null {
  const p = r(v);
  const lat = num(p.lat), lng = num(p.lon);
  const at = iso(p[timeKey]);
  if (lat === null || lng === null || !at) return null;
  const name = str(p.name) === "START" || str(p.name) === "END" ? "" : str(p.name);
  return { name, stopId: str(p.stopId) || null, lat, lng, at, scheduledAt: iso(p[timeKey === "departure" ? "scheduledDeparture" : "scheduledArrival"]) };
}

function parseLeg(v: unknown): JourneyLeg | null {
  const l = r(v);
  const mode = legMode(str(l.mode));
  const from = place(l.from, "departure");
  const to = place(l.to, "arrival");
  const startTime = iso(l.startTime), endTime = iso(l.endTime);
  const duration = num(l.duration);
  if (!mode || !from || !to || !startTime || !endTime || duration === null || duration < 0) return null;
  if (Date.parse(endTime) < Date.parse(startTime)) return null;
  const geo = r(l.legGeometry);
  let geometry: LatLng[] = [];
  try {
    geometry = str(geo.points) ? decodePolyline(str(geo.points), num(geo.precision) ?? 5) : [];
  } catch {
    geometry = [];
  }
  if (geometry.length < 2) geometry = [{ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }];
  return {
    mode,
    from,
    to,
    startTime,
    endTime,
    durationSeconds: duration,
    distanceMeters: num(l.distance),
    routeShortName: mode === "WALK" ? null : str(l.routeShortName) || str(l.displayName) || null,
    headsign: mode === "WALK" ? null : str(l.headsign) || null,
    agency: mode === "WALK" ? null : str(l.agencyName) || null,
    tripId: mode === "WALK" ? null : str(l.tripId) || null,
    realTime: l.realTime === true,
    intermediateStops: list(l.intermediateStops).length,
    geometry,
  };
}

function journeyId(legs: JourneyLeg[]): string {
  return legs.map((l) => `${l.mode === "WALK" ? "W" : l.routeShortName ?? l.mode}@${l.startTime.slice(11, 16)}`).join("|") + `>${legs[legs.length - 1].endTime.slice(11, 16)}`;
}

export function parseItinerary(v: unknown): Journey | null {
  const it = r(v);
  const rawLegs = list(it.legs);
  if (!rawLegs.length) return null;
  const legs: JourneyLeg[] = [];
  for (const raw of rawLegs) {
    const leg = parseLeg(raw);
    if (!leg) return null; // one unusable leg invalidates the whole itinerary
    legs.push(leg);
  }
  const startTime = iso(it.startTime) ?? legs[0].startTime;
  const endTime = iso(it.endTime) ?? legs[legs.length - 1].endTime;
  const duration = num(it.duration) ?? Math.round((Date.parse(endTime) - Date.parse(startTime)) / 1000);
  if (duration <= 0 || Date.parse(endTime) <= Date.parse(startTime)) return null;
  const walkSeconds = legs.filter((l) => l.mode === "WALK").reduce((s, l) => s + l.durationSeconds, 0);
  const rideSeconds = legs.filter((l) => l.mode !== "WALK").reduce((s, l) => s + l.durationSeconds, 0);
  const transitLegs = legs.filter((l) => l.mode !== "WALK").length;
  return {
    id: journeyId(legs),
    startTime,
    endTime,
    durationSeconds: duration,
    transfers: num(it.transfers) ?? Math.max(0, transitLegs - 1),
    walkSeconds,
    rideSeconds,
    waitSeconds: Math.max(0, duration - walkSeconds - rideSeconds),
    realTime: legs.some((l) => l.mode !== "WALK" && l.realTime),
    legs,
  };
}

/** Parses a MOTIS /plan response into validated journeys, transit first, then a
 * direct walk when the provider offered one. Throws on a malformed body. */
export function parsePlan(data: unknown): Journey[] {
  const body = r(data);
  if (!Array.isArray(body.itineraries)) throw new Error("Invalid routing response");
  const transit = list(body.itineraries).map(parseItinerary).filter((j): j is Journey => !!j && j.legs.some((l) => l.mode !== "WALK"));
  const direct = list(body.direct).map(parseItinerary).filter((j): j is Journey => !!j && j.legs.every((l) => l.mode === "WALK"));
  const unique = [...new Map([...transit, ...direct.slice(0, 1)].map((j) => [j.id, j])).values()];
  return unique.sort((a, b) => Date.parse(a.endTime) - Date.parse(b.endTime));
}

export function planUrl(req: JourneyRequest): string {
  const q = new URLSearchParams({
    fromPlace: `${req.from.lat.toFixed(5)},${req.from.lng.toFixed(5)}`,
    toPlace: `${req.to.lat.toFixed(5)},${req.to.lng.toFixed(5)}`,
    time: req.at,
    arriveBy: String(req.arriveBy),
    numItineraries: String(JOURNEY_DEFAULTS.count),
    transitModes: "TRANSIT",
    directModes: "WALK",
    preTransitModes: "WALK",
    postTransitModes: "WALK",
    maxPreTransitTime: String(req.maxWalkMinutes * 60),
    maxPostTransitTime: String(req.maxWalkMinutes * 60),
    detailedTransfers: "false",
  });
  if (req.maxTransfers !== null) q.set("maxTransfers", String(req.maxTransfers));
  return `${BASE}?${q.toString()}`;
}

export async function fetchJourneys(req: JourneyRequest): Promise<JourneyResponse> {
  // Key on the minute so "leave now" polls within the same minute coalesce.
  const key = `journey:${planUrl({ ...req, at: req.at.slice(0, 16) })}`;
  try {
    const result = await cached(key, CACHE_TTL_MS, async () => {
      const response = await fetch(planUrl(req), { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, signal: AbortSignal.timeout(12_000), cache: "no-store" });
      if (!response.ok) throw new Error(`Routing provider HTTP ${response.status}`);
      return parsePlan(await response.json());
    });
    const base = { provider: PROVIDER, fetchedAt: result.fetchedAt, request: req };
    if (!result.value.length) return { status: "empty", ...base, reason: "No walking + transit itinerary was found for this time and walking limit." };
    return { status: "ok", ...base, journeys: result.value };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Routing unavailable";
    const rejected = /HTTP 4/.test(message);
    return { status: "error", error: rejected ? "The routing provider rejected this request." : "Routing provider unavailable. Try again shortly.", retryable: !rejected };
  }
}

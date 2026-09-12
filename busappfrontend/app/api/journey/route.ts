import { fetchJourneys } from "@/lib/journey/motis";
import { JOURNEY_DEFAULTS, type JourneyRequest } from "@/lib/journey/types";
import { inPittsburgh } from "@/lib/pressure/geo";

export const runtime = "nodejs";

const ISO_WITH_ZONE = /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/;

function readPoint(q: URLSearchParams, latKey: string, lngKey: string) {
  const lat = Number(q.get(latKey)), lng = Number(q.get(lngKey));
  if (!q.has(latKey) || !q.has(lngKey) || !Number.isFinite(lat) || !Number.isFinite(lng) || !inPittsburgh({ lat, lng })) return null;
  return { lat, lng };
}

/**
 * GET /api/journey?flat&flng&tlat&tlng[&at=ISO][&arriveBy=1][&maxWalk=minutes][&maxTransfers=n]
 * Returns a JourneyResponse (lib/journey/types.ts): provider-backed walking +
 * transit itineraries with departure, arrival estimate, duration and legs.
 * `at` omitted = now. Errors: 400 for bad input, 503 when the provider fails.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const from = readPoint(q, "flat", "flng");
  const to = readPoint(q, "tlat", "tlng");
  const at = q.get("at") ?? new Date().toISOString();
  const atMs = Date.parse(at);
  const withinWindow = atMs >= Date.now() - 10 * 60_000 && atMs <= Date.now() + 7 * 86_400_000;
  const maxWalk = q.has("maxWalk") ? Number(q.get("maxWalk")) : JOURNEY_DEFAULTS.maxWalkMinutes;
  const maxTransfers = q.has("maxTransfers") ? Number(q.get("maxTransfers")) : null;
  const badTransfers = maxTransfers !== null && (!Number.isInteger(maxTransfers) || maxTransfers < 0 || maxTransfers > 4);
  if (!from || !to || !ISO_WITH_ZONE.test(at) || !withinWindow || !Number.isInteger(maxWalk) || maxWalk < 3 || maxWalk > 45 || badTransfers) {
    return Response.json({ status: "error", error: "Choose Pittsburgh-area origin and destination and a time within the next 7 days.", retryable: false }, { status: 400 });
  }
  const req: JourneyRequest = { from, to, at: new Date(atMs).toISOString(), arriveBy: q.get("arriveBy") === "1", maxWalkMinutes: maxWalk, maxTransfers };
  const result = await fetchJourneys(req);
  return Response.json(result, { status: result.status === "error" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}

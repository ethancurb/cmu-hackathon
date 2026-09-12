import { livePressure } from "@/lib/pressure/service";
import { buildPressure } from "@/lib/pressure/engine";
import { demoBundle, SCENARIOS, SCENARIO_DEFINITIONS, stageCount, type Scenario } from "@/lib/pressure/demo";
import { TIMELINE } from "@/lib/pressure/config";
import { inPittsburgh } from "@/lib/pressure/geo";
import { validateRiderSignals } from "@/lib/pressure/rider-signals";
import type { RiderSignal } from "@/lib/pressure/types";

export const runtime = "nodejs";

const ISO_WITH_ZONE = /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/;

function readPoint(q: URLSearchParams, latKey: string, lngKey: string) {
  if (!q.has(latKey) || !q.has(lngKey)) return null;
  const lat = Number(q.get(latKey)), lng = Number(q.get(lngKey));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (!inPittsburgh({ lat, lng })) return undefined;
  return { lat, lng };
}

/**
 * GET /api/pressure
 *   LIVE: ?lat&lng[&dlat&dlng][&at=ISO][&horizon=minutes]
 *   DEMO: ?mode=DEMO&scenario=pirates|concert|cmu&stage=0..n[&horizon=minutes]
 * POST /api/pressure — same query string plus a JSON body
 *   { riderSignals: RiderSignal[] } of rider-reported, unverified causes (max 5).
 * Returns a PressureResult (lib/pressure/types.ts). Scores are model indices.
 */
export async function GET(request: Request) {
  return handle(request, []);
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const signals = validateRiderSignals(body && typeof body === "object" && "riderSignals" in body ? (body as { riderSignals: unknown }).riderSignals : null);
  if (!signals) return Response.json({ error: "riderSignals must be up to 5 valid Pittsburgh-area events with ISO times." }, { status: 400 });
  return handle(request, signals);
}

async function handle(request: Request, riderSignals: RiderSignal[]) {
  const q = new URL(request.url).searchParams;
  const mode = (q.get("mode") ?? process.env.DATA_MODE ?? "LIVE").toUpperCase();
  const horizon = q.has("horizon") ? Number(q.get("horizon")) : TIMELINE.defaultHorizonMinutes;
  if (!Number.isFinite(horizon) || horizon < TIMELINE.stepMinutes || horizon > TIMELINE.maxHorizonMinutes) {
    return Response.json({ error: `horizon must be ${TIMELINE.stepMinutes}–${TIMELINE.maxHorizonMinutes} minutes` }, { status: 400 });
  }
  const headers = { "Cache-Control": "no-store" };

  if (mode === "DEMO") {
    const scenario = (q.get("scenario") ?? "pirates") as Scenario;
    if (!SCENARIOS.includes(scenario)) return Response.json({ error: "Unknown demo scenario" }, { status: 400 });
    const stage = q.has("stage") ? Number(q.get("stage")) : stageCount(scenario) - 1;
    if (!Number.isInteger(stage) || stage < 0 || stage >= stageCount(scenario)) {
      return Response.json({ error: "Invalid demo stage" }, { status: 400 });
    }
    const bundle = demoBundle(scenario, stage);
    // A chosen departure inside the scenario's window runs the same fixed conditions from that time.
    const at = q.get("at") ?? bundle.generatedAt;
    const offset = Date.parse(at) - Date.parse(bundle.generatedAt);
    if (!ISO_WITH_ZONE.test(at) || !Number.isFinite(offset) || offset < 0 || offset > TIMELINE.maxHorizonMinutes * 60_000) {
      return Response.json({ error: "Demo time must fall inside the scenario window" }, { status: 400 });
    }
    const result = buildPressure(bundle, at, horizon);
    return Response.json({ ...result, scenario, stage, stageLabel: SCENARIO_DEFINITIONS[scenario].stages[stage].label }, { headers });
  }

  if (mode !== "LIVE") return Response.json({ error: "mode must be LIVE or DEMO" }, { status: 400 });
  const locationParam = readPoint(q, "lat", "lng");
  const location = locationParam === null ? { lat: 40.4443, lng: -79.9428 } : locationParam; // missing → CMU; invalid → 400
  const destination = readPoint(q, "dlat", "dlng");
  const at = q.get("at") ?? new Date().toISOString();
  const atMs = Date.parse(at);
  const withinWindow = atMs >= Date.now() - 5 * 60_000 && atMs <= Date.now() + 48 * 3_600_000;
  if (location === undefined || destination === undefined || !ISO_WITH_ZONE.test(at) || !Number.isFinite(atMs) || !withinWindow) {
    return Response.json({ error: "Choose a Pittsburgh-area location and a time within the next 48 hours (include timezone)." }, { status: 400 });
  }
  try {
    return Response.json(await livePressure({ location, destination, at, horizonMinutes: horizon, riderSignals }), { headers });
  } catch (error) {
    console.error("pressure: live model failed", error);
    return Response.json({ error: "Pressure model unavailable" }, { status: 503 });
  }
}

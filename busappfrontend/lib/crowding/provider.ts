import {
  CROWDING_DIRECTION,
  CROWDING_ROUTE,
  CROWDING_STOP_ID,
  CROWDING_STOP_NAME,
  type CrowdingObservation,
  type CrowdingResponse,
  type PassengerLoad,
} from "./types.ts";

const TRUE_TIME_URL =
  "https://truetime.portauthority.org/bustime/wireless/html/eta.jsp?route=Port+Authority+Bus%3A71B&direction=Port+Authority+Bus%3AINBOUND&id=Port+Authority+Bus%3A3141&showAllBusses=on";
const API_URL = "https://truetime.portauthority.org/bustime/api/v3/getpredictions";

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePassengerLoad(raw: unknown): PassengerLoad | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/[\s_-]+/g, " ").toUpperCase();
  if (value === "NOT CROWDED" || value === "EMPTY") return "not_crowded";
  if (value === "SOMEWHAT CROWDED" || value === "HALF EMPTY") return "somewhat_crowded";
  if (value === "CROWDED" || value === "FULL") return "crowded";
  return null;
}

/** Accepts only an explicit integer headcount. Category strings never become a count. */
export function parsePassengerCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 200) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    const value = Number(raw.trim());
    return value >= 0 && value <= 200 ? value : null;
  }
  return null;
}

function eta(raw: string): { etaLabel: string; etaMinutes: number | null } {
  const value = raw.trim().toUpperCase();
  if (value === "DUE") return { etaLabel: "Due", etaMinutes: 0 };
  const minutes = Number.parseInt(value, 10);
  return Number.isFinite(minutes) ? { etaLabel: `${minutes} min`, etaMinutes: minutes } : { etaLabel: "ETA unavailable", etaMinutes: null };
}

function observation(input: {
  vehicleId: string;
  destination?: string | null;
  etaRaw?: string | null;
  passengerRaw?: unknown;
  passengerCountRaw?: unknown;
  fetchedAt: string;
}): CrowdingObservation {
  const rawPassengerLoad = typeof input.passengerRaw === "string" && input.passengerRaw.trim() ? input.passengerRaw.trim() : null;
  const parsedEta = eta(input.etaRaw ?? "");
  return {
    route: CROWDING_ROUTE,
    direction: CROWDING_DIRECTION,
    stopId: CROWDING_STOP_ID,
    stopName: CROWDING_STOP_NAME,
    vehicleId: input.vehicleId,
    destination: input.destination?.trim() || null,
    ...parsedEta,
    passengerLoad: normalizePassengerLoad(rawPassengerLoad),
    rawPassengerLoad,
    passengerCount: parsePassengerCount(input.passengerCountRaw ?? input.passengerRaw),
    observedAt: null,
    fetchedAt: input.fetchedAt,
  };
}

/** Parses the small repeated vehicle blocks on PRT's wireless ETA page. */
export function parseTrueTimeHtml(html: string, fetchedAt: string): CrowdingObservation[] {
  const result: CrowdingObservation[] = [];
  for (const match of html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)) {
    const text = decodeHtml(match[1]);
    const route = text.match(/#\s*([A-Z0-9]+)/i)?.[1]?.toUpperCase();
    if (route !== CROWDING_ROUTE) continue;

    const vehicleId = text.match(/\(\s*Vehicle\s+([^)\s]+)\s*\)/i)?.[1];
    if (!vehicleId) continue;
    const etaRaw = text.match(/\b(DUE|\d+\s*MIN)\b/i)?.[1] ?? null;
    const passengerRaw = text.match(/\(\s*Passengers\s*:\s*([^)]*)\)/i)?.[1] ?? null;
    const destination = text.match(/\bTo\s+(.+?)\s+(?:DUE|\d+\s*MIN)\b/i)?.[1] ?? null;
    result.push(observation({ vehicleId, destination, etaRaw, passengerRaw, fetchedAt }));
  }
  return result.sort((a, b) => (a.etaMinutes ?? Number.POSITIVE_INFINITY) - (b.etaMinutes ?? Number.POSITIVE_INFINITY));
}

type RecordLike = Record<string, unknown>;

function record(value: unknown): RecordLike {
  return value && typeof value === "object" ? (value as RecordLike) : {};
}

/** Parses BusTime v3 getpredictions JSON when a PRT_API_KEY is configured. */
export function parseBusTimeJson(payload: unknown, fetchedAt: string): CrowdingObservation[] {
  const body = record(record(payload)["bustime-response"]);
  const rawPredictions = body.prd;
  const predictions = Array.isArray(rawPredictions) ? rawPredictions : rawPredictions ? [rawPredictions] : [];

  return predictions
    .map(record)
    .filter((prediction) => String(prediction.rt ?? "").toUpperCase() === CROWDING_ROUTE && String(prediction.stpid ?? "") === CROWDING_STOP_ID)
    .map((prediction) =>
      observation({
        vehicleId: String(prediction.vid ?? "").trim(),
        destination: typeof prediction.des === "string" ? prediction.des : null,
        etaRaw:
          typeof prediction.prdctdn === "number"
            ? `${prediction.prdctdn} MIN`
            : typeof prediction.prdctdn === "string"
              ? prediction.prdctdn.toUpperCase() === "DUE"
                ? "DUE"
                : `${prediction.prdctdn} MIN`
              : null,
        passengerRaw: prediction.psgld,
        passengerCountRaw: prediction.psgcnt ?? prediction.psngr ?? prediction.passengers,
        fetchedAt,
      })
    )
    .filter((item) => item.vehicleId)
    .sort((a, b) => (a.etaMinutes ?? Number.POSITIVE_INFINITY) - (b.etaMinutes ?? Number.POSITIVE_INFINITY));
}

function responseFor(observations: CrowdingObservation[], fetchedAt: string, source: CrowdingResponse["source"]): CrowdingResponse {
  if (!observations.length) {
    return { status: "unknown", fetchedAt, observations, source, message: "No 71B prediction is currently listed at this stop." };
  }
  if (!observations.some((item) => item.passengerLoad)) {
    return { status: "unknown", fetchedAt, observations, source, message: "PRT lists the bus but is not reporting its passenger-load category." };
  }
  return { status: "live", fetchedAt, observations, source, message: "Current categorical passenger-load observation from PRT." };
}

const CACHE_MS = 20_000;
let cache: { at: number; value: CrowdingResponse } | null = null;
let pending: Promise<CrowdingResponse> | null = null;

function unavailableResponse(): CrowdingResponse {
  return {
    status: "unavailable",
    fetchedAt: null,
    observations: [],
    source: process.env.PRT_API_KEY ? "PRT BusTime API" : "PRT TrueTime page",
    message: "PRT passenger-load data is unavailable right now.",
  };
}

/** One coalesced upstream read for /api/crowding and the pressure bundle. */
export async function fetchCrowdingCached(): Promise<CrowdingResponse> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  if (!pending) {
    pending = fetchCrowding()
      .then((value) => {
        cache = { at: Date.now(), value };
        return value;
      })
      .catch(() => unavailableResponse())
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export async function fetchCrowding(): Promise<CrowdingResponse> {
  const fetchedAt = new Date().toISOString();
  const key = process.env.PRT_API_KEY?.trim();
  if (key) {
    const url = new URL(API_URL);
    url.searchParams.set("key", key);
    url.searchParams.set("rt", CROWDING_ROUTE);
    url.searchParams.set("stpid", CROWDING_STOP_ID);
    url.searchParams.set("format", "json");
    const apiResponse = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!apiResponse.ok) throw new Error(`PRT BusTime API returned ${apiResponse.status}`);
    return responseFor(parseBusTimeJson(await apiResponse.json(), fetchedAt), fetchedAt, "PRT BusTime API");
  }

  const pageResponse = await fetch(TRUE_TIME_URL, {
    cache: "no-store",
    headers: { Accept: "text/html", "User-Agent": "LoadLine/1.0 (+https://github.com/ethancurb/cmu-hackathon)" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!pageResponse.ok) throw new Error(`PRT TrueTime page returned ${pageResponse.status}`);
  return responseFor(parseTrueTimeHtml(await pageResponse.text(), fetchedAt), fetchedAt, "PRT TrueTime page");
}

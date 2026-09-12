import { NextResponse } from "next/server";
import { cached } from "@/lib/pressure/providers/http";
import { decodeFeed } from "@/lib/pressure/providers/protobuf";

/** Live vehicle GPS positions from PRT's GTFS-Realtime VehiclePositions feed —
 * the same feed and decoder `lib/pressure/providers/transit.ts` already uses
 * to count nearby vehicles for Transit Pressure (shared cache key/TTL, so
 * this endpoint never doubles that upstream read). This is a real reported
 * position, not a derived estimate, and never carries occupancy — pair with
 * `/api/arrival-times` for predicted times, not this. */

const FEED_URL = "https://truetime.rideprt.org/gtfsrt-bus/vehicles";
const CACHE_KEY = "prt:vehicles";
const CACHE_MS = 30_000;
const MAX_AGE_SECONDS = 300; // matches the "fresh" window transit.ts already uses for this feed

export type VehiclePosition = { id: string; routeId: string; lat: number; lng: number; bearing: number | null; ageSeconds: number };
export type VehiclePositionsResponse = { status: "ok"; generatedAt: string; vehicles: VehiclePosition[] } | { status: "unavailable" };

export async function GET(request: Request) {
  const routesParam = new URL(request.url).searchParams.get("routes");
  const routeIds = routesParam ? new Set(routesParam.split(",").map((r) => r.trim()).filter(Boolean)) : null;

  try {
    const result = await cached(CACHE_KEY, CACHE_MS, async () => {
      const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(5000), cache: "no-store" });
      if (!res.ok) throw new Error(`PRT vehicles feed returned ${res.status}`);
      return decodeFeed(new Uint8Array(await res.arrayBuffer()));
    });

    const nowSeconds = Date.now() / 1000;
    const vehicles = result.value.vehicles
      .filter((v) => v.timestamp !== null && nowSeconds - v.timestamp <= MAX_AGE_SECONDS && v.routeId && (!routeIds || routeIds.has(v.routeId)))
      .map((v) => ({ id: v.id || `${v.routeId}:${v.lat},${v.lng}`, routeId: v.routeId, lat: v.lat, lng: v.lng, bearing: v.bearing, ageSeconds: Math.max(0, Math.round(nowSeconds - v.timestamp!)) }));

    const response: VehiclePositionsResponse = { status: "ok", generatedAt: new Date().toISOString(), vehicles };
    return NextResponse.json(response);
  } catch {
    // Feed unreachable or malformed — an honest "unavailable" beats a stale
    // or fabricated vehicle list.
    const response: VehiclePositionsResponse = { status: "unavailable" };
    return NextResponse.json(response);
  }
}

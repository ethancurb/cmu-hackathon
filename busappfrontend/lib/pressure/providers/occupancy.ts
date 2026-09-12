import { fetchCrowdingCached } from "../../crowding/provider.ts";
import { CROWDING_DIRECTION, CROWDING_ROUTE, CROWDING_STOP_ID, CROWDING_STOP_NAME, type CrowdingResponse } from "../../crowding/types.ts";
import type { DataFreshness, OccupancyObservation } from "../types.ts";

export function occupancyFromCrowding(response: CrowdingResponse): { occupancy: OccupancyObservation; freshness: DataFreshness } {
  const nearest = response.observations[0] ?? null;
  const hasCategory = !!nearest?.passengerLoad;
  const hasCount = nearest?.passengerCount !== null && nearest?.passengerCount !== undefined;
  const fetchedOk = response.status !== "unavailable";
  const status = fetchedOk && (hasCategory || hasCount) ? "LIVE" : "UNAVAILABLE";
  const occupancy: OccupancyObservation = {
    route: nearest?.route ?? CROWDING_ROUTE,
    direction: nearest?.direction ?? CROWDING_DIRECTION,
    stopId: nearest?.stopId ?? CROWDING_STOP_ID,
    stopName: nearest?.stopName ?? CROWDING_STOP_NAME,
    vehicleId: nearest?.vehicleId ?? null,
    destination: nearest?.destination ?? null,
    etaLabel: nearest?.etaLabel ?? null,
    category: nearest?.passengerLoad ?? null,
    raw: nearest?.rawPassengerLoad ?? null,
    passengerCount: nearest?.passengerCount ?? null,
    fetchedAt: response.fetchedAt,
    observedAt: nearest?.observedAt ?? null,
    source: response.source,
    status,
    message: response.message,
  };
  const freshness: DataFreshness = {
    source: "PRT occupancy",
    fetchedAt: response.fetchedAt,
    status,
    detail: hasCount
      ? `PRT published ${nearest.passengerCount} people on vehicle ${nearest?.vehicleId ?? "unknown"} at ${CROWDING_STOP_NAME}.`
      : hasCategory
        ? `PRT ${response.source ?? "feed"} reports ${nearest?.rawPassengerLoad ?? nearest?.passengerLoad} on 71B vehicle ${nearest?.vehicleId ?? "unknown"}. Category is not a headcount.`
        : fetchedOk
          ? "PRT listed 71B but published no passenger-load category or count."
          : "PRT passenger-load source unavailable; no onboard contribution assumed.",
  };
  return { occupancy, freshness };
}

export function emptyOccupancy(message = "No current passenger-load observation."): OccupancyObservation {
  return {
    route: CROWDING_ROUTE,
    direction: CROWDING_DIRECTION,
    stopId: CROWDING_STOP_ID,
    stopName: CROWDING_STOP_NAME,
    vehicleId: null,
    destination: null,
    etaLabel: null,
    category: null,
    raw: null,
    passengerCount: null,
    fetchedAt: null,
    observedAt: null,
    source: null,
    status: "UNAVAILABLE",
    message,
  };
}

export async function fetchOccupancy(): Promise<{ occupancy: OccupancyObservation; freshness: DataFreshness }> {
  return occupancyFromCrowding(await fetchCrowdingCached());
}

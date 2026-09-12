"use client";

import { useEffect, useState } from "react";
import type { VehiclePosition, VehiclePositionsResponse } from "@/app/api/vehicle-positions/route";

export type { VehiclePosition };

const POLL_MS = 20_000;

/** Polls the server-side vehicle-positions endpoint (coalesced upstream, see
 * app/api/vehicle-positions/route.ts) for live GPS positions on the given
 * PRT GTFS route ids. `routeIds` is passed as a plain string so callers can
 * derive it inline without a memo — an empty string polls nothing. Returns
 * an empty list rather than null while waiting so the map never draws a
 * stale marker set from a previous route selection. */
export function useVehiclePositions(routeIds: string): VehiclePosition[] {
  const [rawVehicles, setRawVehicles] = useState<VehiclePosition[]>([]);

  useEffect(() => {
    if (!routeIds) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/vehicle-positions?routes=${encodeURIComponent(routeIds)}`);
        if (!res.ok) throw new Error(`vehicle-positions returned ${res.status}`);
        const data: VehiclePositionsResponse = await res.json();
        if (!cancelled) setRawVehicles(data.status === "ok" ? data.vehicles : []);
      } catch {
        // Leave whatever was already showing — a dropped poll isn't the
        // same fact as no vehicles being out there.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [routeIds]);

  // Derived rather than reset via a setState-in-effect: an empty routeIds
  // string (no relevant tracked route or journey leg) means "nothing to
  // show" instantly, without waiting on an effect to clear stale state.
  return routeIds ? rawVehicles : [];
}

import type { RouteId } from "@/lib/mock-data";

// See docs/ARCHITECTURE.md "Route geometry: real PRT shapes" for how these
// were chosen — neither "71" nor "61" exists as a bare PRT route_id in the
// June 2026 GTFS feed; only lettered branches do.
export const GTFS_ROUTE_ID: Record<RouteId, string> = { "71": "71D", "61": "61A", "54": "54" };

export type NearbyStop = { stopId: string; name: string };

/** Real PRT stops within ~700m of CMU (40.4443, -79.9428) served by each
 * route's GTFS route_id, nearest first. Extracted once from PRT's GTFS
 * static feed (stops.txt + stop_times.txt + trips.txt) — not regenerated at
 * runtime, since the output is a small, stable list of physical bus stops.
 * Several stops per route, not just the single nearest: GTFS often assigns
 * separate stop_ids to each direction of the same intersection, and the
 * live TripUpdate feed (see lib/prt-trip-updates.ts) only has predictions
 * for whichever trips happen to be active right now — checking a handful
 * of real nearby stops meaningfully improves the odds of finding one. */
export const NEARBY_STOPS: Record<RouteId, NearbyStop[]> = {
  "71": [
    { stopId: "1177", name: "Fifth Ave + Morewood Ave" },
    { stopId: "1167", name: "Fifth Ave + Morewood Ave" },
    { stopId: "1176", name: "Fifth Ave + Clyde St" },
    { stopId: "1178", name: "Fifth Ave + Amberson" },
    { stopId: "1166", name: "Fifth Ave + Amberson" },
  ],
  "61": [
    { stopId: "7117", name: "Forbes Ave + Morewood (Carnegie Mellon)" },
    { stopId: "4407", name: "Forbes Ave + Morewood Ave FS (Carnegie Mellon)" },
    { stopId: "7119", name: "Forbes Ave + Beeler" },
    { stopId: "7103", name: "Forbes Ave + Beeler" },
    { stopId: "4409", name: "Forbes Ave + Craig St" },
  ],
  "54": [
    { stopId: "2635", name: "Craig St + Fifth Ave" },
    { stopId: "2571", name: "Craig St + Park Plaza" },
  ],
};

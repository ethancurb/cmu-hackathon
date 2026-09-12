/** Parser for PRT's GTFS-realtime TripUpdate feed, in its pretty-printed
 * debug text format (`https://truetime.portauthority.org/gtfsrt-bus/trips?debug=`)
 * — the same feed shape probe-prt.mjs already verified key-free access to
 * for VehiclePositions (see docs/PRT-DATA.md). A diagnostic-grade text
 * parser for this specific debug format, not a general GTFS-realtime
 * protobuf decoder. Server-only: this feed has no CORS headers, so it must
 * be fetched from the Next.js server, never directly from the browser. */

export type TripPrediction = {
  routeId: string;
  tripId: string;
  stopId: string;
  epochSeconds: number;
  kind: "arrival" | "departure";
};

function quoted(block: string, name: string): string | null {
  return block.match(new RegExp(`${name}: "([^"]*)"`))?.[1] ?? null;
}

function numeric(block: string, name: string): number | null {
  const m = block.match(new RegExp(`${name}: (\\d+)`));
  return m ? Number(m[1]) : null;
}

const ENTITY_PATTERN = /^entity \{\n[\s\S]*?^\}/gm;
const TRIP_BLOCK_PATTERN = /^ {4}trip \{\n[\s\S]*?\n {4}\}/m;
const STOP_TIME_UPDATE_PATTERN = /^ {4}stop_time_update \{\n[\s\S]*?\n {4}\}/gm;
const ARRIVAL_BLOCK_PATTERN = /arrival \{\n[\s\S]*?\n {6}\}/;
const DEPARTURE_BLOCK_PATTERN = /departure \{\n[\s\S]*?\n {6}\}/;

/** One prediction per (trip, stop) pair the feed currently reports —
 * usually many per trip, one for each upcoming stop on its route. Malformed
 * or incomplete entries (missing route_id, stop_id, or any time) are
 * skipped rather than guessed at. */
export function parseTripUpdates(debugText: string): TripPrediction[] {
  const entities = [...debugText.matchAll(ENTITY_PATTERN)].map((m) => m[0]);
  const predictions: TripPrediction[] = [];

  for (const entity of entities) {
    const tripBlock = entity.match(TRIP_BLOCK_PATTERN)?.[0] ?? "";
    const routeId = quoted(tripBlock, "route_id");
    const tripId = quoted(tripBlock, "trip_id");
    if (!routeId || !tripId) continue;

    const stopUpdates = [...entity.matchAll(STOP_TIME_UPDATE_PATTERN)].map((m) => m[0]);
    for (const stopUpdate of stopUpdates) {
      const stopId = quoted(stopUpdate, "stop_id");
      if (!stopId) continue;

      const arrivalBlock = stopUpdate.match(ARRIVAL_BLOCK_PATTERN)?.[0] ?? "";
      const departureBlock = stopUpdate.match(DEPARTURE_BLOCK_PATTERN)?.[0] ?? "";
      const arrivalTime = numeric(arrivalBlock, "time");
      const departureTime = numeric(departureBlock, "time");
      const epochSeconds = arrivalTime ?? departureTime;
      if (!epochSeconds) continue;

      predictions.push({ routeId, tripId, stopId, epochSeconds, kind: arrivalTime ? "arrival" : "departure" });
    }
  }

  return predictions;
}

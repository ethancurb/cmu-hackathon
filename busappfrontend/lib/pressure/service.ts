import { fetchEvents } from "./providers/events.ts";
import { fetchWeather } from "./providers/weather.ts";
import { fetchSchedule } from "./providers/schedule.ts";
import { fetchTransit } from "./providers/transit.ts";
import { fetchOccupancy } from "./providers/occupancy.ts";
import { buildPressure, riderSignalToEvent } from "./engine.ts";
import type { DataFreshness, Point, PressureResult, RiderSignal } from "./types.ts";

export type LiveRequest = { location: Point; destination?: Point | null; at: string; horizonMinutes?: number; riderSignals?: RiderSignal[] };

/** Assembles live provider signals into one bundle and runs the pure engine.
 * Rider-reported signals are appended as unverified events with their own
 * freshness entry; they never masquerade as a feed. */
export async function livePressure({ location, destination, at, horizonMinutes, riderSignals = [] }: LiveRequest): Promise<PressureResult> {
  const schedule = fetchSchedule(location, at);
  const [events, weather, transit, occupancy] = await Promise.all([
    fetchEvents(at),
    fetchWeather(location),
    fetchTransit(location, schedule.nearbyStopIds, schedule.routeIds),
    fetchOccupancy(),
  ]);
  const riderFreshness: DataFreshness[] = riderSignals.length
    ? [{ source: "Rider reports", fetchedAt: new Date().toISOString(), status: "LIVE", detail: `${riderSignals.length} rider-reported cause(s); unverified, weighted below published schedules and labeled as such.` }]
    : [];
  return buildPressure(
    {
      mode: "LIVE",
      generatedAt: new Date().toISOString(),
      location,
      destination: destination ?? null,
      events: [...events.events, ...riderSignals.map(riderSignalToEvent)],
      weather: weather.weather,
      transit: transit.transit,
      occupancy: occupancy.occupancy,
      departures: schedule.departures,
      freshness: [...events.freshness, weather.freshness, schedule.freshness, ...transit.freshness, occupancy.freshness, ...riderFreshness],
    },
    at,
    horizonMinutes,
  );
}

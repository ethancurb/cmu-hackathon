import { fetchEvents } from "./providers/events.ts";
import { fetchWeather } from "./providers/weather.ts";
import { fetchSchedule } from "./providers/schedule.ts";
import { fetchTransit } from "./providers/transit.ts";
import { buildPressure } from "./engine.ts";
import type { Point, PressureResult } from "./types.ts";

export type LiveRequest = { location: Point; destination?: Point | null; at: string; horizonMinutes?: number };

/** Assembles live provider signals into one bundle and runs the pure engine. */
export async function livePressure({ location, destination, at, horizonMinutes }: LiveRequest): Promise<PressureResult> {
  const schedule = fetchSchedule(location, at);
  const [events, weather, transit] = await Promise.all([
    fetchEvents(at),
    fetchWeather(location),
    fetchTransit(location, schedule.nearbyStopIds, schedule.routeIds),
  ]);
  return buildPressure(
    {
      mode: "LIVE",
      generatedAt: new Date().toISOString(),
      location,
      destination: destination ?? null,
      events: events.events,
      weather: weather.weather,
      transit: transit.transit,
      departures: schedule.departures,
      freshness: [...events.freshness, weather.freshness, schedule.freshness, ...transit.freshness],
    },
    at,
    horizonMinutes,
  );
}

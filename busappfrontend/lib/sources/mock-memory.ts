/**
 * In-process CapacitySource over the authored fixture. The demo's default path.
 *
 * No database, no file read, no network. `data/fixture.ts` is already the source of truth —
 * the Mongo seed copies *from* it — so reading it directly removes the only piece of
 * infrastructure that can fail during a demo. Serialising to JSON and reading it back would
 * add a file read and Next.js path-resolution problems for no gain.
 *
 * Behaviour is identical to MockMongoSource: both delegate every mapping decision to
 * lib/sources/readings.ts, so the two paths cannot answer the same question differently.
 */

import type { CapacitySource } from "../capacity-source.js";
import type { ArrivalReading, Stop, StopEvent } from "../contracts.js";
import { stopEvents, stops } from "../../data/fixture.js";
import { toArrivalReadings } from "./readings.js";

/** Mirrors the `metadata.source: "mock"` filter the Mongo source applies. */
const MOCK_EVENTS = stopEvents.filter((event) => event.metadata.source === "mock");

const byArrivalAsc = (a: StopEvent, b: StopEvent) => a.arrivalAt.getTime() - b.arrivalAt.getTime();

export class MockMemorySource implements CapacitySource {
  readonly name = "MockMemorySource";

  async stop(stopId: string): Promise<Stop | null> {
    return stops.find((s) => s.stopId === stopId) ?? null;
  }

  async arrivalsForStop(stopId: string, simNow: Date): Promise<ArrivalReading[]> {
    const upcoming = MOCK_EVENTS.filter(
      (event) => event.metadata.stopId === stopId && event.arrivalAt > simNow,
    ).sort(byArrivalAsc);

    if (upcoming.length === 0) return [];

    const runIds = new Set(upcoming.map((event) => event.metadata.runId));
    const latestByRun = new Map<string, StopEvent>();
    for (const event of MOCK_EVENTS.filter(
      (e) => runIds.has(e.metadata.runId) && e.arrivalAt <= simNow,
    ).sort(byArrivalAsc)) {
      latestByRun.set(event.metadata.runId, event); // ascending: last write wins
    }

    return toArrivalReadings(upcoming, latestByRun);
  }

  async runFuture(runId: string, from: Date): Promise<StopEvent[]> {
    return MOCK_EVENTS.filter(
      (event) => event.metadata.runId === runId && event.arrivalAt > from,
    ).sort(byArrivalAsc);
  }
}

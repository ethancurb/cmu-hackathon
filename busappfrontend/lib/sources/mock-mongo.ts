/**
 * Mongo-backed CapacitySource over the same authored fixture MockMemorySource reads.
 *
 * Not the demo path — MockMemorySource is. This exists for the MongoDB time-series story
 * (ADR-0001) and stays behind `DATA_MODE=mongo` so a database outage can never take the
 * demo down. Every mapping decision is delegated to readings.ts, shared with the in-memory
 * source, so the two cannot answer the same question differently.
 *
 * The only module outside lib/mongo.ts that touches the collections.
 */

import type { CapacitySource } from "../capacity-source.js";
import type { ArrivalReading, Stop, StopEvent } from "../contracts.js";
import { COLLECTIONS, getDb } from "../mongo.js";
import { toArrivalReadings } from "./readings.js";

/** Shared by every read: never return anything that is not authored mock data. */
const MOCK_ONLY = { "metadata.source": "mock" } as const;

export class MockMongoSource implements CapacitySource {
  readonly name = "MockMongoSource";

  async stop(stopId: string): Promise<Stop | null> {
    const db = await getDb();
    return db.collection<Stop>(COLLECTIONS.stops).findOne({ stopId }, { projection: { _id: 0 } });
  }

  /**
   * Upcoming arrivals at one stop.
   *
   * Two facts per arrival, deliberately kept apart:
   *   current  — the newest event on that run at or before simNow, i.e. where the bus
   *              actually is and what it is actually carrying now.
   *   atStop   — the future event at the rider's stop, which is a forecast.
   */
  async arrivalsForStop(stopId: string, simNow: Date): Promise<ArrivalReading[]> {
    const db = await getDb();
    const events = db.collection<StopEvent>(COLLECTIONS.stopEvents);

    const upcoming = await events
      .find({ ...MOCK_ONLY, "metadata.stopId": stopId, arrivalAt: { $gt: simNow } })
      .sort({ arrivalAt: 1 })
      .toArray();

    if (upcoming.length === 0) return [];

    // One query for every run's history, then reduce to the latest event per run.
    const runIds = [...new Set(upcoming.map((event) => event.metadata.runId))];
    const past = await events
      .find({ ...MOCK_ONLY, "metadata.runId": { $in: runIds }, arrivalAt: { $lte: simNow } })
      .sort({ arrivalAt: 1 })
      .toArray();

    const latestByRun = new Map<string, StopEvent>();
    for (const event of past) {
      latestByRun.set(event.metadata.runId, event); // ascending sort: last write wins
    }

    return toArrivalReadings(upcoming, latestByRun);
  }

  async runFuture(runId: string, from: Date): Promise<StopEvent[]> {
    const db = await getDb();
    return db
      .collection<StopEvent>(COLLECTIONS.stopEvents)
      .find({ ...MOCK_ONLY, "metadata.runId": runId, arrivalAt: { $gt: from } })
      .sort({ arrivalAt: 1 })
      .toArray();
  }
}

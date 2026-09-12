/**
 * The abstraction every consumer reads through — arrivals API (T3), commute agent (T6), UI.
 * Hides whether the data underneath is authored mock or live PRT. Swapping sources is a
 * configuration change, not a code change: no consumer branches on DATA_MODE.
 *
 * See CONTEXT.md § CapacitySource and ADR-0001.
 */

import type { ArrivalReading, Stop, StopEvent } from "./contracts.js";
import { MockMemorySource } from "./sources/mock-memory.js";
import { MockMongoSource } from "./sources/mock-mongo.js";
import { PRTLiveSource } from "./sources/prt-live.js";

export interface CapacitySource {
  /** Human-readable name for logs and the demo's provenance line. */
  readonly name: string;

  /**
   * One stop, or null when the id is unknown. Consumers need `routesServing` to render a
   * card per route — including shell routes with no events — without reaching past this
   * interface into storage.
   */
  stop(stopId: string): Promise<Stop | null>;

  /**
   * Upcoming arrivals at one stop, ordered earliest first.
   *
   * `simNow` is the demo timeline's current instant, not a wall clock — there is no
   * wall-clock "now" in the mock data layer. Events at or before `simNow` have already
   * happened and are excluded from the arrivals, though they are what `current` is read from.
   */
  arrivalsForStop(stopId: string, simNow: Date): Promise<ArrivalReading[]>;

  /**
   * The remaining events on one run after `from`, ordered earliest first. Used by the
   * commute agent to see what a bus does further along its route.
   */
  runFuture(runId: string, from: Date): Promise<StopEvent[]>;
}

/**
 * `mock` is the demo path: the fixture read in process, no infrastructure. `mongo` reads the
 * same fixture out of Atlas for the time-series story in ADR-0001 — kept separate so a
 * database problem can never take the demo down.
 */
export type DataMode = "mock" | "mongo" | "live" | "hybrid";

const KNOWN_MODES: readonly DataMode[] = ["mock", "mongo", "live", "hybrid"];

/**
 * Validate DATA_MODE. Call this at startup so a typo fails the boot rather than surfacing
 * as an empty arrivals panel during the demo.
 */
export function resolveDataMode(raw: string | undefined = process.env.DATA_MODE): DataMode {
  const mode = (raw ?? "mock").trim();
  if (!KNOWN_MODES.includes(mode as DataMode)) {
    throw new Error(
      `Invalid DATA_MODE "${mode}". Expected one of: ${KNOWN_MODES.join(", ")}.`,
    );
  }
  return mode as DataMode;
}

/**
 * Select the concrete source. Throws on an unknown or not-yet-implemented mode at the
 * moment it is called — which is startup — rather than returning something that reads empty.
 */
export function getCapacitySource(
  raw: string | undefined = process.env.DATA_MODE,
): CapacitySource {
  const mode = resolveDataMode(raw);
  switch (mode) {
    case "mock":
      return new MockMemorySource();
    case "mongo":
      return new MockMongoSource();
    case "live":
      return new PRTLiveSource();
    case "hybrid":
      throw new Error(
        'DATA_MODE="hybrid" is not implemented this milestone. Use "mock", "mongo", or "live".',
      );
  }
}

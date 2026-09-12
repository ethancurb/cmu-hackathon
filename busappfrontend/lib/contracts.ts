/**
 * Canonical shared contract. See docs/ARCHITECTURE.md § "Minimal shared contract".
 *
 * Do not rename these types or their variants independently — other tickets read them.
 * IDs are strings; timestamps crossing a boundary (API, JSON) are ISO UTC strings.
 * Inside the data layer, instants are `Date` so MongoDB stores them as BSON dates.
 */

/** The capacity value carried on a card. A category is never converted to a count. */
export type CapacityReading =
  | { kind: "count"; passengers: number; totalCapacity: number | null }
  | { kind: "percentage"; percent: number }
  | { kind: "category"; value: "low" | "some_space" | "full"; providerValue: string }
  | { kind: "unknown" };

/** Where an occupancy figure came from. `none` means nothing reported it. */
export type ReadingSource = "agency" | "sensor" | "rider" | "none";

/**
 * Age/trust state of a reading. Only a verified recent occupancy observation is `fresh`;
 * a fresh feed timestamp does not make the occupancy fresh.
 */
export type ReadingState = "fresh" | "stale" | "age_unknown" | "conflicting" | "unknown";

/** The rider-facing object. Not emitted by T1/T2 — defined here so consumers agree on it. */
export type CapacityCard = {
  mode: "live" | "demo";
  runKey: string;
  vehicleId: string;
  routeLabel: string;
  boardingStopId: string;
  expectedAtStop: string | null;
  current: {
    reading: CapacityReading;
    source: ReadingSource;
    observedAt: string | null;
    feedUpdatedAt: string | null;
    state: ReadingState;
  };
  atStop:
    | { kind: "unavailable" }
    | {
        kind: "forecast";
        reading: CapacityReading;
        predictedFor: string;
        generatedAt: string;
        modelVersion: string;
        uncertainty: string;
      };
};

// ---------------------------------------------------------------------------
// Data layer (ADR-0001). These are what CapacitySource reads and writes.
// ---------------------------------------------------------------------------

/** Origin of a StopEvent. A field on every event so mixed reads can be filtered. */
export type EventSource = "mock" | "prt";

/** One PRT stop. Regular collection. */
export type Stop = {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
  /** Every route label that serves this stop, including shell routes with no authored events. */
  routesServing: string[];
};

/** One bus's traversal of one route in one direction on one service date. Regular collection. */
export type Run = {
  runKey: string;
  routeLabel: string;
  vehicleId: string;
  tripId: string;
  serviceDate: string;
  /**
   * Rated capacity of the vehicle, as published for the run. StopEvent carries its own
   * `totalCapacity` on purpose: a live feed reports capacity per observation, and events
   * can arrive for runs this collection has no document for. Neither is derived from
   * the other — if they disagree, the event's value is what was actually reported.
   */
  totalCapacity: number | null;
  /** Ordered stopIds this run traverses. */
  stopSequence: string[];
};

/**
 * The time-series `metaField`. Kept flat and low-cardinality-first so the auto index
 * `{ metadata: 1, arrivalAt: 1 }` answers the arrivals query in one scan.
 */
export type StopEventMetadata = {
  runId: string;
  stopId: string;
  routeLabel: string;
  vehicleId: string;
  source: EventSource;
};

/**
 * One bus's visit to one stop on one run. Time-series collection, `timeField: arrivalAt`.
 *
 * Mock events carry numeric counts. Live PRT events carry only what the feed emits —
 * typically a category plus timestamps — and leave the numeric fields null. Null means
 * "not reported", never zero.
 */
export type StopEvent = {
  arrivalAt: Date;
  metadata: StopEventMetadata;
  boardings: number | null;
  alightings: number | null;
  occupancyAfter: number | null;
  totalCapacity: number | null;
  /** Populated when a source emits a category. The raw provider string is preserved verbatim. */
  psgldCategory: "low" | "some_space" | "full" | null;
  psgldProviderValue: string | null;
  /** When the occupancy was actually measured. Null when unknown. */
  observedAt: Date | null;
  /** When the source feed last emitted this record. Not a substitute for observedAt. */
  feedUpdatedAt: Date | null;
};

/** What the bus is carrying *now* — measured at a stop it has already passed. */
export type CurrentObservation = {
  reading: CapacityReading;
  source: ReadingSource;
  observedAt: string | null;
  feedUpdatedAt: string | null;
  state: ReadingState;
  /**
   * The stop the observation was taken at. Null when the run has not reached any stop
   * yet, in which case `reading` is `{ kind: "unknown" }` — not zero, not empty.
   */
  observedAtStopId: string | null;
};

/**
 * What the bus is expected to be carrying when it reaches the rider's stop. A distinct
 * fact from the current observation and never merged with it.
 */
export type StopForecast =
  | { kind: "unavailable" }
  | {
      kind: "forecast";
      reading: CapacityReading;
      predictedFor: string;
      generatedAt: string;
      modelVersion: string;
      uncertainty: string;
    };

/**
 * One upcoming arrival at a stop, as returned by CapacitySource. The internal read shape;
 * the API layer (T3) maps it to CapacityCard, whose `current`/`atStop` split this mirrors.
 *
 * The split is the product thesis, not a formality: a bus that has not yet reached the
 * rider's stop has no *observed* occupancy there. Presenting the future value as a current
 * reading is the failure mode this project exists to avoid (AGENTS.md § Product boundary).
 */
export type ArrivalReading = {
  runKey: string;
  routeLabel: string;
  vehicleId: string;
  /** The rider's stop — the one arrivals were requested for. */
  stopId: string;
  /** ISO UTC. When this run reaches the rider's stop in the demo timeline. */
  expectedAtStop: string;
  current: CurrentObservation;
  atStop: StopForecast;
};

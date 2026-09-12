/**
 * Pure mappers from stored `StopEvent`s to the shapes consumers see.
 *
 * Shared by every CapacitySource so the in-memory and Mongo paths cannot drift: the honesty
 * rules below (unknown is never zero, a category is never a count, an observation is never a
 * forecast) have to hold identically no matter where the events came from.
 */

import type {
  ArrivalReading,
  CapacityReading,
  CurrentObservation,
  StopEvent,
  StopForecast,
} from "../contracts.js";

/**
 * Identifies the authored fixture as the origin of a forecast value. Not a trained model —
 * naming it as one in the `modelVersion` slot would overstate what produced the number.
 */
export const FIXTURE_MODEL_VERSION = "mock-fixture-v1";

/**
 * A count is only reported when both the count and a positive capacity are present —
 * ARCHITECTURE.md: ratio display requires verified count plus positive compatible capacity.
 * Otherwise fall back to the category, preserving the provider's raw string. Missing data
 * becomes `unknown`; it never becomes zero and a category never becomes a number.
 */
export function toCapacityReading(event: StopEvent): CapacityReading {
  const { occupancyAfter, totalCapacity, psgldCategory, psgldProviderValue } = event;

  if (typeof occupancyAfter === "number") {
    const capacity = typeof totalCapacity === "number" && totalCapacity > 0 ? totalCapacity : null;
    return { kind: "count", passengers: occupancyAfter, totalCapacity: capacity };
  }
  if (psgldCategory) {
    return {
      kind: "category",
      value: psgldCategory,
      providerValue: psgldProviderValue ?? psgldCategory,
    };
  }
  return { kind: "unknown" };
}

const iso = (value: Date | null | undefined): string | null =>
  value instanceof Date ? value.toISOString() : null;

/** A run that has not reached any stop yet has no observation. Say so; do not imply space. */
export const NO_OBSERVATION: CurrentObservation = {
  reading: { kind: "unknown" },
  source: "none",
  observedAt: null,
  feedUpdatedAt: null,
  state: "unknown",
  observedAtStopId: null,
};

export function toCurrentObservation(event: StopEvent | undefined): CurrentObservation {
  if (!event) return NO_OBSERVATION;
  return {
    reading: toCapacityReading(event),
    // Authored counts stand in for an agency-reported figure; the demo never claims a sensor.
    source: "agency",
    observedAt: iso(event.observedAt),
    feedUpdatedAt: iso(event.feedUpdatedAt),
    // In the mock world the count is measured at the instant it describes, so within the
    // demo timeline a past observation is fresh by construction. A live source must compare
    // observedAt against the staleness threshold instead of asserting this.
    state: event.observedAt ? "fresh" : "age_unknown",
    observedAtStopId: event.metadata.stopId,
  };
}

export function toStopForecast(event: StopEvent): StopForecast {
  const reading = toCapacityReading(event);
  if (reading.kind === "unknown") return { kind: "unavailable" };
  return {
    kind: "forecast",
    reading,
    predictedFor: event.arrivalAt.toISOString(),
    generatedAt: event.arrivalAt.toISOString(),
    modelVersion: FIXTURE_MODEL_VERSION,
    uncertainty:
      "Authored fixture value, not a prediction. The demo world's future is scripted; " +
      "a real forecast would carry a model and an error bound.",
  };
}

/**
 * Assemble the arrival rows for one stop from already-fetched events.
 *
 * `upcoming` are the events at the rider's stop after simNow, ascending. `latestByRun` maps
 * each run to the newest event it has already reached, or nothing if it has not started.
 * Both sources do their own querying and then call this, so the assembly rules live once.
 */
export function toArrivalReadings(
  upcoming: StopEvent[],
  latestByRun: Map<string, StopEvent>,
): ArrivalReading[] {
  return upcoming.map((event) => ({
    runKey: event.metadata.runId,
    routeLabel: event.metadata.routeLabel,
    vehicleId: event.metadata.vehicleId,
    stopId: event.metadata.stopId,
    expectedAtStop: event.arrivalAt.toISOString(),
    current: toCurrentObservation(latestByRun.get(event.metadata.runId)),
    atStop: toStopForecast(event),
  }));
}

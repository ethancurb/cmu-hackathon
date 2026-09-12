/**
 * Hand-authored source of truth for the demo world. 100% invented data (see ADR-0001).
 *
 * Shape: 10 stops, 6 runs, 30 stopEvents.
 *   71D  Fifth & Aiken -> Fifth & Morewood   5 stops, 3 buses   (active route)
 *   71A  Centre & Melwood -> Craig & Plaza   5 stops, 3 buses   (active route)
 *   71B, 71C                                 shell routes: listed in stops.routesServing,
 *                                            zero authored events. They must render as
 *                                            { kind: "unknown" }, never as empty space.
 *
 * STOP IDS ARE NOT VERIFIED PRT VALUES. ADR-0001 asks for real `stpid`s "wherever they are
 * known"; they are not known yet — issue #2 tracks verifying the PRT feed. These are
 * stpid-shaped placeholders. Swap them when #2 lands; nothing else depends on their value.
 */

import type { Run, Stop, StopEvent } from "../lib/contracts.js";

export const SERVICE_DATE = "2026-09-12";

/** Rated capacity of a standard 40ft PRT bus. Authored, not measured. */
const BUS_CAPACITY = 60;

/** Demo timeline origin. simNow moves within this window; there is no wall clock. */
export const TIMELINE_START = new Date("2026-09-12T12:00:00.000Z");

const at = (minutes: number): Date =>
  new Date(TIMELINE_START.getTime() + minutes * 60_000);

// ---------------------------------------------------------------------------
// Stops
// ---------------------------------------------------------------------------

export const stops: Stop[] = [
  // 71D corridor — Fifth Avenue, inbound toward Oakland. Shared with shell route 71B.
  { stopId: "7101", name: "Fifth Ave & Aiken Ave", lat: 40.4553, lng: -79.9298, routesServing: ["71D", "71B"] },
  { stopId: "7102", name: "Fifth Ave & Negley Ave", lat: 40.4548, lng: -79.9343, routesServing: ["71D", "71B"] },
  { stopId: "7103", name: "Fifth Ave & Amberson Ave", lat: 40.4541, lng: -79.9389, routesServing: ["71D"] },
  { stopId: "7104", name: "Fifth Ave & Neville St", lat: 40.4525, lng: -79.9468, routesServing: ["71D", "71B"] },
  { stopId: "7105", name: "Fifth Ave & Morewood Ave", lat: 40.4517, lng: -79.9506, routesServing: ["71D", "71B"] },

  // 71A corridor — Centre Avenue to Craig Street. Shared with shell route 71C.
  { stopId: "7106", name: "Centre Ave & Melwood Ave", lat: 40.4522, lng: -79.9585, routesServing: ["71A", "71C"] },
  { stopId: "7107", name: "Centre Ave & Cypress St", lat: 40.4547, lng: -79.9503, routesServing: ["71A"] },
  { stopId: "7108", name: "Centre Ave & Millvale Ave", lat: 40.4561, lng: -79.9462, routesServing: ["71A", "71C"] },
  { stopId: "7109", name: "Centre Ave & Craig St", lat: 40.4529, lng: -79.9525, routesServing: ["71A"] },
  { stopId: "7110", name: "Craig St & Plaza Dr", lat: 40.4487, lng: -79.9509, routesServing: ["71A", "71C"] },
];

const D_SEQUENCE = ["7101", "7102", "7103", "7104", "7105"];
const A_SEQUENCE = ["7106", "7107", "7108", "7109", "7110"];

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

/** runKey uses the opaque ARCHITECTURE scheme even for mock runs. */
const runKeyFor = (routeLabel: string, vehicleId: string, tripId: string): string =>
  `mock:${routeLabel}:v${vehicleId}:${tripId}:${SERVICE_DATE}`;

type RunSpec = {
  routeLabel: string;
  vehicleId: string;
  tripId: string;
  stopSequence: string[];
  /** Minutes after TIMELINE_START that this run reaches its first stop. */
  firstStopOffset: number;
  /** Minutes between consecutive stops. */
  headwayBetweenStops: number;
  /** Per stop, in sequence order. occupancyAfter is derived, never authored directly. */
  movements: Array<{ boardings: number; alightings: number }>;
};

const runSpecs: RunSpec[] = [
  // 71D bus 1 — the crowding narrative. Fills between Neville and Morewood, which is what
  // makes the commute agent (T6) revise its plan mid-approach.
  {
    routeLabel: "71D", vehicleId: "9001", tripId: "trip-a", stopSequence: D_SEQUENCE,
    firstStopOffset: 0, headwayBetweenStops: 3,
    movements: [
      { boardings: 14, alightings: 0 },
      { boardings: 19, alightings: 2 },
      { boardings: 16, alightings: 1 },
      { boardings: 11, alightings: 2 },
      { boardings: 4, alightings: 3 },
    ],
  },
  // 71D bus 2 — the viable alternative once bus 1 fills.
  {
    routeLabel: "71D", vehicleId: "9002", tripId: "trip-b", stopSequence: D_SEQUENCE,
    firstStopOffset: 8, headwayBetweenStops: 3,
    movements: [
      { boardings: 8, alightings: 0 },
      { boardings: 9, alightings: 1 },
      { boardings: 7, alightings: 2 },
      { boardings: 6, alightings: 3 },
      { boardings: 5, alightings: 4 },
    ],
  },
  // 71D bus 3 — stays light the whole way.
  {
    routeLabel: "71D", vehicleId: "9003", tripId: "trip-c", stopSequence: D_SEQUENCE,
    firstStopOffset: 16, headwayBetweenStops: 3,
    movements: [
      { boardings: 4, alightings: 0 },
      { boardings: 3, alightings: 1 },
      { boardings: 5, alightings: 1 },
      { boardings: 2, alightings: 2 },
      { boardings: 3, alightings: 1 },
    ],
  },
  // 71A bus 1 — busiest on this corridor but never reaches full.
  {
    routeLabel: "71A", vehicleId: "9101", tripId: "trip-a", stopSequence: A_SEQUENCE,
    firstStopOffset: 2, headwayBetweenStops: 3,
    movements: [
      { boardings: 12, alightings: 0 },
      { boardings: 14, alightings: 1 },
      { boardings: 13, alightings: 2 },
      { boardings: 10, alightings: 3 },
      { boardings: 6, alightings: 5 },
    ],
  },
  // 71A bus 2 — light.
  {
    routeLabel: "71A", vehicleId: "9102", tripId: "trip-b", stopSequence: A_SEQUENCE,
    firstStopOffset: 10, headwayBetweenStops: 3,
    movements: [
      { boardings: 6, alightings: 0 },
      { boardings: 5, alightings: 1 },
      { boardings: 7, alightings: 1 },
      { boardings: 4, alightings: 2 },
      { boardings: 3, alightings: 3 },
    ],
  },
  // 71A bus 3 — moderate.
  {
    routeLabel: "71A", vehicleId: "9103", tripId: "trip-c", stopSequence: A_SEQUENCE,
    firstStopOffset: 18, headwayBetweenStops: 3,
    movements: [
      { boardings: 9, alightings: 0 },
      { boardings: 11, alightings: 1 },
      { boardings: 12, alightings: 2 },
      { boardings: 8, alightings: 3 },
      { boardings: 5, alightings: 4 },
    ],
  },
];

export const runs: Run[] = runSpecs.map((spec) => ({
  runKey: runKeyFor(spec.routeLabel, spec.vehicleId, spec.tripId),
  routeLabel: spec.routeLabel,
  vehicleId: spec.vehicleId,
  tripId: spec.tripId,
  serviceDate: SERVICE_DATE,
  totalCapacity: BUS_CAPACITY,
  stopSequence: spec.stopSequence,
}));

// ---------------------------------------------------------------------------
// Stop events
// ---------------------------------------------------------------------------

/**
 * Derive the PRT-shaped category from a numeric occupancy, so live-shaped reads work against
 * mock data. Thresholds are authored prototype constants, not agency-published boundaries.
 *
 * Mirrors the adapter mapping in ARCHITECTURE.md: EMPTY -> low, HALF_EMPTY -> some_space,
 * FULL -> full. The raw provider string is retained alongside the normalised value.
 */
export function deriveCategory(
  occupancyAfter: number,
  totalCapacity: number,
): { value: "low" | "some_space" | "full"; providerValue: string } {
  const ratio = occupancyAfter / totalCapacity;
  if (ratio < 0.35) return { value: "low", providerValue: "EMPTY" };
  if (ratio < 0.85) return { value: "some_space", providerValue: "HALF_EMPTY" };
  return { value: "full", providerValue: "FULL" };
}

function eventsForRun(spec: RunSpec): StopEvent[] {
  const runKey = runKeyFor(spec.routeLabel, spec.vehicleId, spec.tripId);
  let occupancy = 0;

  return spec.stopSequence.map((stopId, index) => {
    const { boardings, alightings } = spec.movements[index];
    occupancy = occupancy + boardings - alightings;
    if (occupancy < 0) {
      throw new Error(`Fixture error: negative occupancy on ${runKey} at ${stopId}`);
    }

    const arrivalAt = at(spec.firstStopOffset + index * spec.headwayBetweenStops);
    const category = deriveCategory(occupancy, BUS_CAPACITY);

    return {
      arrivalAt,
      metadata: {
        runId: runKey,
        stopId,
        routeLabel: spec.routeLabel,
        vehicleId: spec.vehicleId,
        source: "mock",
      },
      boardings,
      alightings,
      occupancyAfter: occupancy,
      totalCapacity: BUS_CAPACITY,
      psgldCategory: category.value,
      psgldProviderValue: category.providerValue,
      // In the mock world the count is measured at the moment the bus leaves the stop,
      // and the "feed" publishes it immediately. A live source would separate these.
      observedAt: arrivalAt,
      feedUpdatedAt: arrivalAt,
    };
  });
}

export const stopEvents: StopEvent[] = runSpecs.flatMap(eventsForRun);

/** Counts the seed asserts against, so a fixture edit that changes shape fails loudly. */
export const EXPECTED_COUNTS = { stops: 10, runs: 6, stopEvents: 30 } as const;

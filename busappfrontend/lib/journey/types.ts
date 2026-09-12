// Canonical journey (itinerary) contracts. Every time here comes from the routing
// provider (Transitous / MOTIS over PRT GTFS); nothing is estimated locally.

export type LatLng = { lat: number; lng: number };

export type LegMode = "WALK" | "BUS" | "RAIL" | "TRAM" | "OTHER";

export type JourneyPlace = {
  name: string;
  /** Provider stop id (e.g. "us-pa-PRT_4407") or null for a street coordinate. */
  stopId: string | null;
  lat: number;
  lng: number;
  /** Provider time at this place (departure for `from`, arrival for `to`). */
  at: string;
  scheduledAt: string | null;
};

export type JourneyLeg = {
  mode: LegMode;
  from: JourneyPlace;
  to: JourneyPlace;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceMeters: number | null;
  /** Transit only: route label ("61C"), headsign/direction and agency. */
  routeShortName: string | null;
  headsign: string | null;
  agency: string | null;
  tripId: string | null;
  /** True when the provider had realtime data for this leg; false = scheduled. */
  realTime: boolean;
  intermediateStops: number;
  geometry: LatLng[];
};

export type Journey = {
  id: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  transfers: number;
  walkSeconds: number;
  rideSeconds: number;
  /** Time not walking or riding: waiting at stops and transferring. */
  waitSeconds: number;
  /** True when at least one transit leg carries realtime data. */
  realTime: boolean;
  legs: JourneyLeg[];
};

export type JourneyRequest = {
  from: LatLng;
  to: LatLng;
  /** ISO departure time (or arrival deadline when `arriveBy`). */
  at: string;
  arriveBy: boolean;
  maxWalkMinutes: number;
  maxTransfers: number | null;
};

export type JourneyResponse =
  | { status: "ok"; provider: string; fetchedAt: string; request: JourneyRequest; journeys: Journey[] }
  | { status: "empty"; provider: string; fetchedAt: string; request: JourneyRequest; reason: string }
  | { status: "error"; error: string; retryable: boolean };

export const JOURNEY_DEFAULTS = { maxWalkMinutes: 15, maxTransfers: null as number | null, count: 4 } as const;

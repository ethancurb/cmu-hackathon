export const CROWDING_ROUTE = "71B" as const;
export const CROWDING_DIRECTION = "INBOUND" as const;
export const CROWDING_STOP_ID = "3141" as const;
export const CROWDING_STOP_NAME = "Fifth Ave + College" as const;

export type PassengerLoad = "not_crowded" | "somewhat_crowded" | "crowded";

export type CrowdingObservation = {
  route: typeof CROWDING_ROUTE;
  direction: typeof CROWDING_DIRECTION;
  stopId: typeof CROWDING_STOP_ID;
  stopName: typeof CROWDING_STOP_NAME;
  vehicleId: string;
  destination: string | null;
  etaMinutes: number | null;
  etaLabel: string;
  passengerLoad: PassengerLoad | null;
  rawPassengerLoad: string | null;
  /** TrueTime exposes no passenger-load measurement timestamp. */
  observedAt: null;
  /** Time our server fetched the source, not the load measurement time. */
  fetchedAt: string;
};

export type CrowdingResponse = {
  status: "live" | "unknown" | "unavailable";
  fetchedAt: string | null;
  observations: CrowdingObservation[];
  source: "PRT BusTime API" | "PRT TrueTime page" | null;
  message: string;
};

export type CrowdingHistorySample = Pick<CrowdingObservation, "vehicleId" | "passengerLoad" | "fetchedAt"> & {
  passengerLoad: PassengerLoad;
};

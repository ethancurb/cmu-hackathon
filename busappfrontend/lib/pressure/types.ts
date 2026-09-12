// Canonical Transit Pressure contracts. Everything here is a MODEL INDEX or a
// normalized signal — never a passenger count or an occupancy percentage.

export type Point = { lat: number; lng: number };

export type SignalStatus = "LIVE" | "STALE" | "FALLBACK" | "UNAVAILABLE" | "DEMO";

/** Provenance of one input source. `status` describes the data, not the model. */
export type DataFreshness = {
  source: string;
  fetchedAt: string | null;
  updatedAt?: string | null;
  status: SignalStatus;
  detail: string;
};

export type EventCategory = "BASEBALL" | "FOOTBALL" | "HOCKEY" | "CONCERT";
export type EventMagnitude = "SMALL" | "MEDIUM" | "LARGE" | "MAJOR";

export type EventSignal = Point & {
  id: string;
  name: string;
  category: EventCategory;
  venue: string;
  startTime: string;
  /** Usually a duration assumption, see `endEstimated`. Never invented precision. */
  endTime: string;
  endEstimated: boolean;
  /** Documented magnitude class by venue/category — not an attendance figure. */
  magnitude: EventMagnitude;
  source: string;
  confidence: "MEDIUM" | "HIGH";
};

export type WeatherSignal = {
  at: string;
  precipitationProbability: number;
  rainMm: number;
  snowCm: number;
  temperatureC: number;
  weatherCode: number;
  windKph: number;
};

export type TransitAlert = { label: string; effect: number | null };

export type TransitSignal = {
  /** Largest explicit GTFS-RT delay at nearby stops, minutes. null = unknown. */
  delayMinutes: number | null;
  alerts: TransitAlert[];
  /** Vehicles currently near the location. A vehicle count is never a passenger count. */
  vehicleCount: number | null;
  /** When the realtime evidence was observed; its influence decays after this. */
  observedAt: string | null;
};

export type ScheduledDeparture = { at: string; routeId: string; stopId: string; directionId: string };

export type SignalBundle = {
  mode: "LIVE" | "DEMO";
  generatedAt: string;
  /** Where the rider boards / the area service evidence is scoped to. */
  location: Point;
  /** Optional trip end; events are measured against the origin→destination corridor. */
  destination?: Point | null;
  events: EventSignal[];
  weather: WeatherSignal[];
  transit: TransitSignal;
  departures: ScheduledDeparture[];
  freshness: DataFreshness[];
};

export type ReasonType = "TIME" | "EVENT" | "WEATHER" | "TRANSIT" | "SERVICE";
export type DemandReason = { type: ReasonType; label: string; contribution: number };

export type PressureLevel = "LOW" | "MODERATE" | "HIGH" | "SURGE";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";

export type DemandPrediction = {
  at: string;
  /** 0–100 relative model index. */
  score: number;
  level: PressureLevel;
  confidence: Confidence;
  reasons: DemandReason[];
};

export type SurgeWindow = { start: string; end: string; peak: number; peakAt: string; continues: boolean };
export type LowWindow = { start: string; end: string; score: number };

export type RecommendationKind = "LEAVE_NOW" | "LEAVE_BEFORE" | "WAIT_FOR_LOWER" | "AFTER_SURGE" | "ALLOW_EXTRA_TIME";
export type Recommendation = {
  kind: RecommendationKind;
  /** Short imperative, e.g. "Leave before 9:20 PM". */
  label: string;
  detail: string;
  /** Suggested departure sample, when the advice names one. */
  at: string | null;
};

/** How one event shapes the timeline, for progressive disclosure in the UI. */
export type EventImpact = {
  event: EventSignal;
  distanceKm: number;
  /** Largest contribution to any timeline sample. */
  contribution: number;
  peakAt: string;
  /** Samples where this event contributes at least half of its peak. */
  window: { start: string; end: string };
  role: "MAJOR" | "MINOR";
};

/** An in-reach event beyond the current timeline, so the rider can plan around it. */
export type UpcomingEvent = {
  event: EventSignal;
  distanceKm: number;
  /** When arrivals are expected to peak (shortly before the start). */
  arrivalsPeakAt: string;
  /** When the exit wave is expected to peak (at the estimated end). */
  exitPeakAt: string;
};

export type PressureResult = {
  mode: "LIVE" | "DEMO";
  modelVersion: string;
  generatedAt: string;
  location: Point;
  destination: Point | null;
  stepMinutes: number;
  current: DemandPrediction;
  timeline: DemandPrediction[];
  surge: SurgeWindow | null;
  bestWindow: LowWindow;
  recommendation: Recommendation;
  eventImpacts: EventImpact[];
  upcoming: UpcomingEvent[];
  freshness: DataFreshness[];
  coverage: string;
  scenario?: string;
  stage?: number;
  stageLabel?: string;
};

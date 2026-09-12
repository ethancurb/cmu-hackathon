// Every weight and threshold of the Transit Pressure model lives here.
// These are documented heuristics, not measured PRT ridership statistics.
// See docs/overnight-report.md "How Transit Pressure is calculated".

export const MODEL_VERSION = "pressure-v2-heuristic+occupancy";

export const TIMEZONE = "America/New_York";

export const TIMELINE = {
  stepMinutes: 15,
  defaultHorizonMinutes: 240,
  maxHorizonMinutes: 480,
} as const;

/** Score thresholds (inclusive lower bounds). */
export const LEVELS = { MODERATE: 25, HIGH: 50, SURGE: 75 } as const;

/**
 * Temporal baseline: what a typical hour feels like with no other signal.
 * Hourly anchor values (index = local hour, 0–23) interpolated linearly, so the
 * curve has no cliffs at band edges. Shape follows common US urban transit
 * demand patterns (AM/PM commute peaks on weekdays, a flatter afternoon/evening
 * plateau on weekends); the magnitudes are documented assumptions, not PRT counts.
 */
export const TEMPORAL = {
  weekday: [12, 10, 8, 8, 9, 12, 18, 30, 34, 30, 22, 20, 21, 20, 21, 24, 30, 33, 30, 26, 24, 24, 20, 16],
  weekend: [16, 14, 10, 8, 8, 9, 11, 14, 18, 22, 24, 25, 26, 26, 26, 26, 26, 27, 28, 30, 30, 31, 30, 24],
  /** Friday/Saturday late nightlife travel, added on top of the profile. */
  weekendNight: { from: 22, to: 25.5, value: 6 },
  labels: {
    overnight: { from: 0, to: 5.5 },
    weekdayMorningRush: { from: 7, to: 9.5 },
    weekdayEveningRush: { from: 16, to: 19 },
    evening: { from: 19, to: 23 },
  },
} as const;

export const EVENT = {
  /** Peak points per magnitude class at zero distance, outbound (post-event) wave. */
  magnitude: { SMALL: 10, MEDIUM: 18, LARGE: 30, MAJOR: 40 },
  /** Beyond this many km from the corridor an event contributes nothing. */
  reachKm: 4,
  /** Gaussian distance scale: exp(-(d / scaleKm)^2). ~0.68 at 1 km, ~0.09 at 2.5 km. */
  scaleKm: 1.6,
  /** Inbound (pre-event) wave relative to the outbound peak. */
  inboundShare: 0.75,
  /** Minutes before start when arrivals begin building / reach peak. */
  inbound: { rampStart: -150, peakFrom: -20, decayEnd: 45 },
  /** Minutes relative to end: ramp-up, peak plateau, decay to zero. */
  outbound: { rampStart: -45, peakFrom: 0, peakTo: 10, decayEnd: 80, footballDecayEnd: 110 },
  /** Uncertain end times widen the outbound wave on both sides. */
  estimatedEndWidenMinutes: 20,
  /** Small residual movement while an event is under way. */
  duringShare: 0.1,
  /** Cap on the sum of all event contributions at one sample. */
  budget: 50,
  /** An impact needs at least this contribution to be listed. */
  impactMinimum: 5,
  majorImpact: 20,
} as const;

export const WEATHER = {
  /** Points at 100% precipitation probability. */
  precipitationProbabilityMax: 12,
  /** Points when measurable rain is forecast, if higher than the probability term. */
  rainFloor: 10,
  snow: 6,
  extremeTemperature: 5,
  coldBelowC: -5,
  hotAboveC: 32,
  severe: 6,
  severeWindKph: 60,
  /** WMO weather codes ≥ 95 are thunderstorms. */
  severeCodeFrom: 95,
  max: 20,
} as const;

export const TRANSIT = {
  delayPointsPerMinute: 1.5,
  delayMax: 18,
  /** GTFS-RT alert `effect` → points. Unlisted effects contribute nothing. */
  alertPoints: { 1: 14, 2: 10, 3: 12, 4: 6, 6: 4, 8: 3, 9: 3 } as Record<number, number>,
  max: 24,
  /** Realtime evidence is fully trusted for this long after observation… */
  fullMinutes: 15,
  /** …then fades linearly to zero at this age. */
  fadeMinutes: 60,
} as const;

export const OCCUPANCY = {
  /** Heuristic points from PRT's category. Never derived from an invented headcount. */
  points: { not_crowded: 0, somewhat_crowded: 8, crowded: 16 } as const,
  max: 16,
  fullMinutes: 15,
  fadeMinutes: 60,
} as const;

export const SERVICE = {
  /** Gaps above this many minutes between scheduled departures start adding pressure. */
  gapFromMinutes: 15,
  pointsPerMinute: 1 / 3,
  max: 10,
  lookaheadMinutes: 120,
} as const;

export const CONFIDENCE = {
  /** Sources that count toward confidence, by freshness source name. */
  highHorizonHours: 3,
  mediumHorizonHours: 24,
  highMinimumSources: 4,
  mediumMinimumSources: 2,
} as const;

export const RECOMMENDATION = {
  /** A better window must beat the current sample by this much to be worth waiting. */
  worthWaitingDelta: 12,
  /** …and start within this many minutes. */
  worthWaitingWithinMinutes: 120,
  /** "Leave now" when pressure climbs by this much within this window. */
  climbDelta: 8,
  peakWithinMinutes: 60,
  /** "Leave now" beats "leave before" when the surge is this close. */
  imminentMinutes: 15,
} as const;

export const COVERAGE_NOTE =
  "Location-area model index (0–100), not a passenger count or an occupancy forecast. Current 71B load is a separate live observation (PRT category, or a count only when PRT publishes one). Event coverage is partial; weights and event durations are documented assumptions, not measured PRT ridership.";

// Deterministic Pittsburgh scenarios. They inject structured signals through the
// SAME engine as live data — nothing here hardcodes a score.
import type { DataFreshness, EventSignal, SignalBundle, WeatherSignal } from "./types.ts";

export const SCENARIOS = ["pirates", "concert", "cmu"] as const;
export type Scenario = (typeof SCENARIOS)[number];

export type StageDefinition = { label: string; short: string };
export type ScenarioDefinition = {
  id: Scenario;
  title: string;
  /** Short tab label for the presenter page. */
  tab: string;
  description: string;
  /** Fixed "now" for determinism (UTC). */
  now: string;
  location: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  event: EventSignal | null;
  stages: StageDefinition[];
};

const PNC_PARK = { lat: 40.446904, lng: -80.005753 };
const PPG_PAINTS = { lat: 40.4395, lng: -79.9893 };
const CMU = { lat: 40.4443, lng: -79.9428 };
const DOWNTOWN = { lat: 40.4406, lng: -79.9959 };
const NORTH_SHORE = { lat: 40.4462, lng: -80.0083 };
const SHADYSIDE = { lat: 40.4513, lng: -79.9336 };

export const SCENARIO_DEFINITIONS: Record<Scenario, ScenarioDefinition> = {
  pirates: {
    id: "pirates",
    title: "PNC Park game night",
    tab: "Pirates",
    description: "Saturday 9:10 PM on the North Shore, heading to CMU. A Pirates game is about to let out; rain and a service delay follow.",
    now: "2026-09-13T01:10:00Z",
    location: { ...NORTH_SHORE, label: "North Shore" },
    destination: { ...CMU, label: "Carnegie Mellon" },
    event: {
      ...PNC_PARK,
      id: "demo-pirates",
      name: "Pirates vs Cubs",
      category: "BASEBALL",
      venue: "PNC Park",
      startTime: "2026-09-12T22:30:00Z",
      endTime: "2026-09-13T01:30:00Z",
      endEstimated: true,
      magnitude: "MAJOR",
      source: "Authored demo scenario",
      confidence: "MEDIUM",
      evidence: "VERIFIED",
    },
    stages: [
      { label: "Normal Saturday evening", short: "Normal" },
      { label: "+ Pirates game ending", short: "+ Game" },
      { label: "+ Rain beginning", short: "+ Rain" },
      { label: "+ Reported service delay", short: "+ Delay" },
    ],
  },
  concert: {
    id: "concert",
    title: "PPG Paints Arena concert",
    tab: "Concert",
    description: "Friday 10:20 PM downtown near the arena, heading to Shadyside. A sold-out show ends around 10:30 PM.",
    now: "2026-09-12T02:20:00Z",
    location: { ...DOWNTOWN, label: "Downtown" },
    destination: { ...SHADYSIDE, label: "Shadyside" },
    event: {
      ...PPG_PAINTS,
      id: "demo-concert",
      name: "Arena concert",
      category: "CONCERT",
      venue: "PPG Paints Arena",
      startTime: "2026-09-11T23:30:00Z",
      endTime: "2026-09-12T02:30:00Z",
      endEstimated: true,
      magnitude: "LARGE",
      source: "Authored demo scenario",
      confidence: "MEDIUM",
      evidence: "VERIFIED",
    },
    stages: [
      { label: "Normal Friday night", short: "Normal" },
      { label: "+ Concert letting out", short: "+ Show" },
      { label: "+ Rain beginning", short: "+ Rain" },
      { label: "+ Reported service delay", short: "+ Delay" },
    ],
  },
  cmu: {
    id: "cmu",
    title: "CMU weekday morning",
    tab: "CMU AM",
    description: "Monday 7:30 AM at CMU, heading downtown. No events; commute pattern, then rain, then a delay.",
    now: "2026-09-14T11:30:00Z",
    location: { ...CMU, label: "Carnegie Mellon" },
    destination: { ...DOWNTOWN, label: "Downtown" },
    event: null,
    stages: [
      { label: "Normal weekday commute", short: "Normal" },
      { label: "+ Rain beginning", short: "+ Rain" },
      { label: "+ Reported service delay", short: "+ Delay" },
    ],
  },
};

function hourlyWeather(now: string, rainy: boolean): WeatherSignal[] {
  const first = Date.parse(now) - 10 * 60_000;
  return Array.from({ length: 10 }, (_, i) => {
    const rain = rainy && i < 3;
    return {
      at: new Date(first + i * 3_600_000).toISOString(),
      precipitationProbability: rain ? 95 : 0,
      rainMm: rain ? 2 : 0,
      snowCm: 0,
      temperatureC: 19,
      weatherCode: rain ? 61 : 1,
      windKph: 8,
    };
  });
}

export function stageCount(scenario: Scenario) {
  return SCENARIO_DEFINITIONS[scenario].stages.length;
}

export function demoBundle(scenario: Scenario = "pirates", stage?: number): SignalBundle {
  const def = SCENARIO_DEFINITIONS[scenario];
  const s = Math.max(0, Math.min(def.stages.length - 1, stage ?? def.stages.length - 1));
  // Stage layers: events first (when the scenario has one), then rain, then delay.
  const hasEvent = !!def.event && s >= 1;
  const rainStage = def.event ? 2 : 1;
  const delayStage = def.event ? 3 : 2;
  const rainy = s >= rainStage;
  const delayed = s >= delayStage;

  const freshness: DataFreshness[] = ["Events", "Hourly weather", "PRT realtime", "Scheduled service"].map((source) => ({
    source,
    fetchedAt: def.now,
    status: "DEMO",
    detail:
      source === "Scheduled service"
        ? "No scheduled departures assumed in this scenario"
        : "Deterministic scenario input; not a live observation",
  }));

  return {
    mode: "DEMO",
    generatedAt: def.now,
    location: { lat: def.location.lat, lng: def.location.lng },
    destination: { lat: def.destination.lat, lng: def.destination.lng },
    events: hasEvent && def.event ? [def.event] : [],
    weather: hourlyWeather(def.now, rainy),
    transit: {
      delayMinutes: delayed ? 12 : 0,
      alerts: [],
      vehicleCount: 4,
      observedAt: def.now,
    },
    departures: [],
    freshness,
  };
}

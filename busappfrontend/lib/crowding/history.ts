import type { CrowdingHistorySample, CrowdingObservation } from "./types.ts";

export const HISTORY_DAYS = 14;
export const HISTORY_KEY = "loadline:crowding:71B:3141:v1";
export const SAMPLE_INTERVAL_MS = 5 * 60_000;
const HISTORY_WINDOW_MS = HISTORY_DAYS * 24 * 60 * 60_000;

export function parseHistory(value: string | null): CrowdingHistorySample[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CrowdingHistorySample => {
      if (!item || typeof item !== "object") return false;
      const sample = item as Partial<CrowdingHistorySample>;
      return (
        typeof sample.vehicleId === "string" &&
        typeof sample.fetchedAt === "string" &&
        (sample.passengerLoad === "not_crowded" || sample.passengerLoad === "somewhat_crowded" || sample.passengerLoad === "crowded") &&
        Number.isFinite(Date.parse(sample.fetchedAt))
      );
    });
  } catch {
    return [];
  }
}

export function updateHistory(
  previous: CrowdingHistorySample[],
  observations: CrowdingObservation[],
  nowMs = Date.now(),
  sampleIntervalMs = SAMPLE_INTERVAL_MS
): CrowdingHistorySample[] {
  const cutoff = nowMs - HISTORY_WINDOW_MS;
  const next = previous.filter((sample) => Date.parse(sample.fetchedAt) >= cutoff && Date.parse(sample.fetchedAt) <= nowMs + 60_000);

  for (const item of observations) {
    if (!item.passengerLoad) continue;
    const latest = [...next].reverse().find((sample) => sample.vehicleId === item.vehicleId);
    const changed = latest?.passengerLoad !== item.passengerLoad;
    const intervalElapsed = !latest || Date.parse(item.fetchedAt) - Date.parse(latest.fetchedAt) >= sampleIntervalMs;
    if (changed || intervalElapsed) next.push({ vehicleId: item.vehicleId, passengerLoad: item.passengerLoad, fetchedAt: item.fetchedAt });
  }

  return next.sort((a, b) => Date.parse(a.fetchedAt) - Date.parse(b.fetchedAt));
}


// Client-safe formatting helpers for pressure results (no provider imports).
import type { Confidence, DataFreshness, PressureLevel } from "./types";

const TIMEZONE = "America/New_York";

export function clock(at: string | null | undefined): string {
  if (!at) return "—";
  return new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit" }).format(new Date(at));
}

/** "9p", "10a" style axis ticks. */
export function shortHour(at: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hour12: true }).formatToParts(new Date(at));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const period = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  return `${hour}${period.toLowerCase().charAt(0)}`;
}

export function dayLabel(at: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "short", month: "short", day: "numeric" }).format(new Date(at));
}

export function weekdayShort(at: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "short" }).format(new Date(at));
}

/** Short imperative for the primary button; the module carries the full detail. */
export function buttonLabel(rec: { kind: string; label: string; at: string | null }): string {
  switch (rec.kind) {
    case "WAIT_FOR_LOWER":
    case "AFTER_SURGE":
      return `Wait until ${clock(rec.at)}`;
    default:
      return rec.label;
  }
}

export function timeRange(start: string, end: string): string {
  return `${clock(start)}–${clock(end)}`;
}

/** Tomorrow at a local Pittsburgh hour, as ISO, independent of the viewer's zone. */
export function tomorrowAtLocalHour(hour: number, from = new Date()): string {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(from.getTime() + 24 * 3_600_000)
  );
  const hh = String(hour).padStart(2, "0");
  for (const offset of ["-04:00", "-05:00"]) {
    const candidate = new Date(`${date}T${hh}:00:00${offset}`);
    const local = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hourCycle: "h23" }).format(candidate);
    if (Number(local) === hour) return candidate.toISOString();
  }
  return new Date(`${date}T${hh}:00:00-04:00`).toISOString();
}

export const LEVEL_COLOR: Record<PressureLevel, string> = {
  LOW: "var(--pressure-low)",
  MODERATE: "var(--pressure-moderate)",
  HIGH: "var(--pressure-high)",
  SURGE: "var(--pressure-surge)",
};

export const LEVEL_WORD: Record<PressureLevel, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  SURGE: "Surge",
};

export const CONFIDENCE_WORD: Record<Confidence, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

/** One-line provenance summary for the footnote: "events live · weather live · PRT realtime stale". */
export function sourcesSummary(freshness: DataFreshness[]): string {
  const pick = (name: string) => freshness.find((f) => f.source === name)?.status;
  const sports = ["MLB schedule", "NHL schedule", "ESPN schedule"].map(pick);
  const events =
    pick("Events") ??
    (sports.every((s) => s === "LIVE")
      ? "LIVE"
      : sports.some((s) => s === "LIVE")
        ? "PARTIAL"
        : sports.some((s) => s === "STALE")
          ? "STALE"
          : "UNAVAILABLE");
  const parts = [
    ["events", events],
    ["weather", pick("Hourly weather")],
    ["PRT realtime", pick("PRT realtime")],
    ["occupancy", pick("PRT occupancy")],
    ["schedule", pick("Scheduled service")],
  ] as const;
  return parts
    .filter(([, status]) => status)
    .map(([name, status]) => `${name} ${String(status).toLowerCase()}`)
    .join(" · ");
}

/** The explanation shown when confidence is reduced by a missing or old source. */
export function confidenceNote(freshness: DataFreshness[]): string | null {
  const realtime = freshness.find((f) => f.source === "PRT realtime");
  const weather = freshness.find((f) => f.source === "Hourly weather");
  const sports = freshness.filter((f) => ["MLB schedule", "NHL schedule", "ESPN schedule"].includes(f.source));
  if (realtime?.status === "UNAVAILABLE") return "Realtime vehicle data unavailable. Prediction based on schedule, events and weather.";
  if (realtime?.status === "STALE") return "Realtime data is stale and excluded from the score.";
  const occupancy = freshness.find((f) => f.source === "PRT occupancy");
  if (occupancy?.status === "UNAVAILABLE") return "Live 71B occupancy unavailable. No onboard load was assumed.";
  if (occupancy?.status === "STALE") return "Live occupancy is stale and excluded from the score.";
  if (weather?.status === "UNAVAILABLE") return "Weather forecast unavailable; no weather effect applied.";
  if (sports.length && sports.every((f) => f.status === "UNAVAILABLE")) return "Event schedules unavailable; this is not evidence of no events.";
  return null;
}

// Per-sample evidence: what one timeline bar rests on. Pure and client-safe;
// used by the timeline's "What's happening" section and by the chat planner.
// It only reorganizes what the engine produced for THAT sample — never a
// generic explanation reused across bars.
import { clock, dayLabel, timeRange, LEVEL_WORD } from "./format.ts";
import { LEVELS } from "./config.ts";
import type { DemandPrediction, EventSignal, PressureResult, ReasonType } from "./types.ts";

export type EvidenceItem = {
  kind: ReasonType;
  title: string;
  detail: string | null;
  contribution: number;
  event: EventSignal | null;
  /** VERIFIED feed, RIDER report, MODEL pattern/forecast, or null when not applicable. */
  basis: "VERIFIED" | "RIDER" | "MODEL";
};

export type SampleExplanation = {
  at: string;
  score: number;
  level: string;
  headline: string;
  items: EvidenceItem[];
  /** Why the signals matter for this trip and what the model suggests. */
  advice: string;
  /** True when no event contributes to this sample (which is not "nothing is happening"). */
  noEvent: boolean;
  gaps: string[];
};

const TIMEZONE = "America/New_York";

export function dayTitle(at: string, now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });
  const day = fmt.format(new Date(at)), today = fmt.format(now), tomorrow = fmt.format(new Date(now.getTime() + 86_400_000));
  if (day === today) return "What's happening today";
  if (day === tomorrow) return "What's happening tomorrow";
  return `What's happening ${dayLabel(at)}`;
}

export function nearestSampleIndex(timeline: DemandPrediction[], at: string): number {
  const t = Date.parse(at);
  let best = 0;
  for (let i = 1; i < timeline.length; i++) if (Math.abs(Date.parse(timeline[i].at) - t) < Math.abs(Date.parse(timeline[best].at) - t)) best = i;
  return best;
}

function basisFor(type: ReasonType, event: EventSignal | null): EvidenceItem["basis"] {
  if (event) return event.evidence === "RIDER" ? "RIDER" : "VERIFIED";
  if (type === "TRANSIT" || type === "OCCUPANCY") return "VERIFIED";
  return "MODEL";
}

export function explainSample(result: PressureResult, index: number): SampleExplanation {
  const sample = result.timeline[Math.max(0, Math.min(result.timeline.length - 1, index))];
  const events = new Map(result.events.map((e) => [e.id, e]));
  const items: EvidenceItem[] = sample.reasons.map((reason) => {
    const event = reason.eventId ? events.get(reason.eventId) ?? null : null;
    const detail = event
      ? `${event.venue} · ${dayLabel(event.startTime)} ${clock(event.startTime)}–${clock(event.endTime)}${event.endEstimated ? " (end is an estimate)" : ""} · ${event.source}${event.evidence === "RIDER" ? " · unverified rider report" : ""}`
      : reason.detail ?? null;
    return { kind: reason.type, title: reason.label, detail, contribution: reason.contribution, event, basis: basisFor(reason.type, event) };
  });
  const eventItems = items.filter((i) => i.kind === "EVENT");
  const top = items[0];
  const headline = eventItems.length
    ? `${eventItems[0].event?.name ?? eventItems[0].title} is the largest factor (+${eventItems[0].contribution}).`
    : top
      ? `No specific event is known for this time; the score reflects ${top.title.toLowerCase()} and the other signals below.`
      : "No contributing signals.";

  const inSurge = result.surge && Date.parse(sample.at) >= Date.parse(result.surge.start) && Date.parse(sample.at) <= Date.parse(result.surge.end);
  const inBest = Date.parse(sample.at) >= Date.parse(result.bestWindow.start) && Date.parse(sample.at) <= Date.parse(result.bestWindow.end);
  const exitWave = eventItems.find((i) => /exit wave|ending nearby|dispersing/.test(i.title));
  let advice: string;
  if (inSurge && result.surge) {
    advice = `${clock(sample.at)} falls inside the expected surge (${timeRange(result.surge.start, result.surge.end)}, peak ${result.surge.peak}/100 at ${clock(result.surge.peakAt)}). ${exitWave?.event ? `Crowds leaving ${exitWave.event.venue} share this corridor${exitWave.event.endEstimated ? "; that ending time is an assumption, so the wave could shift" : ""}. ` : ""}Model advice: ${result.recommendation.label} — ${result.recommendation.detail}`;
  } else if (inBest) {
    advice = `${clock(sample.at)} is in the lowest-pressure window in view (${timeRange(result.bestWindow.start, result.bestWindow.end)}, about ${result.bestWindow.score}/100). ${result.recommendation.label} — ${result.recommendation.detail}`;
  } else if (sample.score >= LEVELS.HIGH) {
    advice = `${LEVEL_WORD[sample.level]} pressure at ${clock(sample.at)} means fuller vehicles and possible waits on this corridor. ${result.recommendation.label} — ${result.recommendation.detail}`;
  } else {
    advice = `${LEVEL_WORD[sample.level]} pressure at ${clock(sample.at)}. ${result.recommendation.label} — ${result.recommendation.detail}`;
  }
  return { at: sample.at, score: sample.score, level: LEVEL_WORD[sample.level], headline, items, advice, noEvent: eventItems.length === 0, gaps: result.coverageGaps };
}

/** Plain-text rendering for chat replies. */
export function explanationText(x: SampleExplanation): string {
  const lines = [`${clock(x.at)}: ${x.level}, ${x.score}/100 (model index, not occupancy). ${x.headline}`];
  for (const item of x.items) lines.push(`• +${item.contribution} ${item.title}${item.detail ? ` — ${item.detail}` : ""}`);
  lines.push(x.advice);
  if (x.noEvent && x.gaps.length) lines.push(`Not covered: ${x.gaps.join("; ")}.`);
  return lines.join("\n");
}

"use client";

import { Divider } from "@/components/Divider";
import { Disclosure } from "@/components/Disclosure";
import { PressureDots } from "./PressureDots";
import type { PressureState } from "@/lib/pressure/use-pressure";
import { clock, timeRange, dayLabel, CONFIDENCE_WORD, LEVEL_COLOR, LEVEL_WORD, sourcesSummary, confidenceNote } from "@/lib/pressure/format";
import type { EventImpact, PressureResult, UpcomingEvent } from "@/lib/pressure/types";

const MAX_REASONS = 4;

type PressureModuleProps = {
  state: PressureState;
  /** Rendered next to the section label, e.g. "at 9:45 PM" or "leaving now". */
  whenLabel: string;
};

/**
 * Concise Transit Pressure summary: the 0–100 model index, level, confidence
 * and surge window stay visible; WHY, advice, event impact and provenance sit
 * in collapsed sections. Every value is produced by lib/pressure/engine.ts —
 * the advice time and text are never typed in here.
 */
export function PressureModule({ state, whenLabel }: PressureModuleProps) {
  const { data, error, loading } = state;

  if (!data) {
    return (
      <section className="px-gutter" aria-live="polite">
        <div className="flex items-baseline justify-between">
          <span className="text-label text-blue">Transit pressure</span>
          <span className="text-label text-blue opacity-footnote">{whenLabel}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <PressureDots score={0} level="LOW" />
          <span className="text-emphasis-number font-bold text-blue">{loading ? "…" : "—"}</span>
        </div>
        <p className="mt-2 text-body text-blue opacity-footnote">
          {loading ? "Combining events, weather, schedule and PRT realtime…" : error ?? "Pressure unavailable."}
        </p>
        {!loading && error ? <p className="mt-1 text-footnote text-blue opacity-footnote">Live sources may be unreachable. The model degrades rather than guessing.</p> : null}
      </section>
    );
  }

  const { current, surge, recommendation } = data;
  const reasons = current.reasons.slice(0, MAX_REASONS);
  const majorEvent = data.eventImpacts.find((i) => i.role === "MAJOR") ?? null;
  const note = confidenceNote(data.freshness);

  return (
    <section className="px-gutter" aria-live="polite">
      <div className="flex items-baseline justify-between gap-2">
        <span className="whitespace-nowrap text-label text-blue">Transit pressure</span>
        <span className="min-w-0 truncate text-label text-blue opacity-footnote">{whenLabel}</span>
      </div>

      {/* Score row */}
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-[6px]">
          <PressureDots score={current.score} level={current.level} />
          <span className="text-descriptor text-blue" style={{ color: LEVEL_COLOR[current.level] }}>
            {LEVEL_WORD[current.level].toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-emphasis-number font-bold leading-none text-blue">
            {current.score}
            <span className="text-body font-regular opacity-footnote"> / 100</span>
          </span>
          <span className="mt-1 text-footnote text-blue opacity-footnote">Model index, not occupancy · confidence {CONFIDENCE_WORD[current.confidence].toLowerCase()}</span>
        </div>
      </div>

      {error ? <p className="mt-2 text-footnote text-blue opacity-footnote">Refresh failed; showing the last result. {error}</p> : null}

      <div className="mt-3">
        <Divider />
      </div>

      {/* Surge window stays visible: it is the one number that changes a departure. */}
      <div className="flex items-baseline justify-between gap-3 py-[9px]">
        <span className="text-label text-blue">{surge ? "Expected surge" : "No surge expected"}</span>
        <span className="text-row-title font-bold text-blue" style={surge ? { color: LEVEL_COLOR.SURGE } : undefined}>
          {surge ? `${timeRange(surge.start, surge.end)}${surge.continues ? "+" : ""}` : `next ${Math.round(((data.timeline.length - 1) * data.stepMinutes) / 60)} h`}
        </span>
      </div>
      <Divider />

      {/* Advice + WHY, collapsed by default. The summary is the model's own label. */}
      <Disclosure label="Advice" summary={recommendation.label}>
        <p className="text-body text-blue">{recommendation.detail}</p>
        <p className="mt-2 text-label text-blue">Why</p>
        <ul className="mt-1 flex flex-col gap-[3px]">
          {reasons.map((reason) => (
            <li key={`${reason.type}-${reason.label}`} className="flex flex-col">
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-body text-blue">{reason.label}</span>
                <span className="shrink-0 text-body font-bold text-blue">+{reason.contribution}</span>
              </span>
              {reason.detail ? <span className="text-footnote text-blue opacity-footnote">{reason.detail}</span> : null}
            </li>
          ))}
        </ul>
        {majorEvent ? <EventImpactRow impact={majorEvent} /> : null}
        {!majorEvent && data.upcoming[0] ? <UpcomingRow upcoming={data.upcoming[0]} /> : null}
      </Disclosure>
      <Divider />

      <Disclosure label="Sources" summary={`${data.mode === "DEMO" ? "demo · " : ""}${sourcesSummary(data.freshness)}`}>
        <SourcesList data={data} note={note} />
      </Disclosure>
    </section>
  );
}

function EventImpactRow({ impact }: { impact: EventImpact }) {
  const { event } = impact;
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label text-blue">Event impact</span>
        <span className="text-footnote text-blue opacity-footnote">Major contributor · +{impact.contribution}</span>
      </div>
      <p className="mt-1 text-row-title font-bold text-blue">{event.name}</p>
      <p className="text-body text-blue">
        {event.venue} · {impact.distanceKm} km from your trip{event.evidence === "RIDER" ? " · rider-reported, unverified" : ""}
      </p>
      <p className="text-body text-blue opacity-footnote">
        {dayLabel(event.startTime)} {clock(event.startTime)} · {event.endEstimated ? "est. end" : "ends"} {clock(event.endTime)} · surge{" "}
        {timeRange(impact.window.start, impact.window.end)} · {event.source}
      </p>
    </div>
  );
}

function UpcomingRow({ upcoming }: { upcoming: UpcomingEvent }) {
  const { event } = upcoming;
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label text-blue">Upcoming on this trip</span>
        <span className="text-footnote text-blue opacity-footnote">{upcoming.distanceKm} km away</span>
      </div>
      <p className="mt-1 text-row-title font-bold text-blue">{event.name}</p>
      <p className="text-body text-blue opacity-footnote">
        {event.venue} · {dayLabel(event.startTime)} {clock(event.startTime)} · arrivals peak ~{clock(upcoming.arrivalsPeakAt)} · exit wave ~
        {clock(upcoming.exitPeakAt)}{event.endEstimated ? " (est.)" : ""}
      </p>
    </div>
  );
}

function SourcesList({ data, note }: { data: PressureResult; note: string | null }) {
  return (
    <div>
      {note ? <p className="text-footnote text-blue">{note}</p> : null}
      <ul className="mt-1 flex flex-col gap-1">
        {data.freshness.map((f) => (
          <li key={f.source} className="text-footnote text-blue">
            <span className="font-bold">{f.source}</span> · {f.status.toLowerCase()}
            {f.updatedAt ? ` · feed ${clock(f.updatedAt)}` : f.fetchedAt ? ` · ${clock(f.fetchedAt)}` : ""} · <span className="opacity-footnote">{f.detail}</span>
          </li>
        ))}
      </ul>
      {data.coverageGaps.length ? (
        <>
          <p className="mt-2 text-footnote text-blue">Not covered this run (absence is not evidence of quiet):</p>
          <ul className="flex flex-col">
            {data.coverageGaps.map((gap) => (
              <li key={gap} className="text-footnote text-blue opacity-footnote">
                · {gap}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-2 text-footnote text-blue opacity-footnote">{data.coverage}</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Divider } from "@/components/Divider";
import { PressureDots } from "./PressureDots";
import type { PressureState } from "@/lib/pressure/use-pressure";
import { clock, timeRange, dayLabel, CONFIDENCE_WORD, LEVEL_COLOR, LEVEL_WORD, sourcesSummary, confidenceNote } from "@/lib/pressure/format";
import type { EventImpact, PressureResult } from "@/lib/pressure/types";

const MAX_REASONS = 3;

type PressureModuleProps = {
  state: PressureState;
  /** Rendered next to the section label, e.g. "at 9:45 PM" or "now". */
  whenLabel: string;
};

/**
 * The primary LoadLine surface: a 0–100 Transit Pressure model index with its
 * level, confidence, the upcoming surge window, the top WHY reasons, and (on
 * demand) the event that drives it plus data provenance. Every value here is
 * produced by lib/pressure/engine.ts, never typed in.
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
      {/* Header: label + when + confidence */}
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
          <span className="text-emphasis-number font-bold text-blue leading-none">
            {current.score}
            <span className="text-body font-regular opacity-footnote"> / 100</span>
          </span>
          <span className="mt-1 text-footnote text-blue opacity-footnote">Confidence {CONFIDENCE_WORD[current.confidence]}</span>
        </div>
      </div>

      {error ? <p className="mt-2 text-footnote text-blue opacity-footnote">Refresh failed; showing the last result. {error}</p> : null}

      <div className="mt-3">
        <Divider />
      </div>

      {/* Surge window */}
      <div className="flex items-baseline justify-between gap-3 py-[9px]">
        <span className="text-label text-blue">{surge ? "Expected surge" : "No surge expected"}</span>
        <span className="text-row-title font-bold text-blue" style={surge ? { color: LEVEL_COLOR.SURGE } : undefined}>
          {surge ? `${timeRange(surge.start, surge.end)}${surge.continues ? "+" : ""}` : `next ${Math.round(((data.timeline.length - 1) * data.stepMinutes) / 60)} h`}
        </span>
      </div>
      <Divider />

      {/* WHY */}
      <div className="py-[9px]">
        <span className="text-label text-blue">Why</span>
        <ul className="mt-1 flex flex-col gap-[3px]">
          {reasons.map((reason) => (
            <li key={`${reason.type}-${reason.label}`} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-body text-blue">{reason.label}</span>
              <span className="shrink-0 text-body font-bold text-blue">+{reason.contribution}</span>
            </li>
          ))}
        </ul>
      </div>
      <Divider />

      {/* Recommendation */}
      <div className="py-[9px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="whitespace-nowrap text-label text-blue">Advice</span>
          <span className="text-right text-row-title font-bold text-blue">{recommendation.label}</span>
        </div>
        <p className="mt-1 text-body text-blue opacity-footnote">{recommendation.detail}</p>
      </div>

      {majorEvent ? (
        <>
          <Divider />
          <EventImpactRow impact={majorEvent} />
        </>
      ) : null}

      <Divider />
      <SourcesRow data={data} note={note} />
    </section>
  );
}

function EventImpactRow({ impact }: { impact: EventImpact }) {
  const { event } = impact;
  return (
    <div className="py-[9px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-label text-blue">Event impact</span>
        <span className="text-footnote text-blue opacity-footnote">Major contributor · +{impact.contribution}</span>
      </div>
      <p className="mt-1 text-row-title font-bold text-blue">{event.name}</p>
      <p className="text-body text-blue">
        {event.venue} · {impact.distanceKm} km from your trip
      </p>
      <p className="text-body text-blue opacity-footnote">
        {dayLabel(event.startTime)} {clock(event.startTime)} · {event.endEstimated ? "est. end" : "ends"} {clock(event.endTime)} · surge{" "}
        {timeRange(impact.window.start, impact.window.end)}
      </p>
    </div>
  );
}

function SourcesRow({ data, note }: { data: PressureResult; note: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-[9px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-3 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
      >
        <span className="text-footnote text-blue opacity-footnote">
          {data.mode === "DEMO" ? "Demo scenario · " : ""}Model index, not occupancy · {sourcesSummary(data.freshness)}
        </span>
        <span className="shrink-0 text-footnote text-blue opacity-footnote">{open ? "less" : "sources"}</span>
      </button>
      {note ? <p className="mt-1 text-footnote text-blue">{note}</p> : null}
      {open ? (
        <ul className="mt-2 flex flex-col gap-1">
          {data.freshness.map((f) => (
            <li key={f.source} className="text-footnote text-blue">
              <span className="font-bold">{f.source}</span> · {f.status.toLowerCase()}
              {f.updatedAt ? ` · feed ${clock(f.updatedAt)}` : f.fetchedAt ? ` · ${clock(f.fetchedAt)}` : ""} · <span className="opacity-footnote">{f.detail}</span>
            </li>
          ))}
          <li className="text-footnote text-blue opacity-footnote">{data.coverage}</li>
        </ul>
      ) : null}
    </div>
  );
}

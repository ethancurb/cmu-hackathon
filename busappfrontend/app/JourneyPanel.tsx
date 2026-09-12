"use client";

import { useState } from "react";
import { Divider } from "@/components/Divider";
import { BusIcon, WalkIcon } from "@/components/icons/filled";
import { ChevronDownIcon } from "@/components/icons/stroked";
import { JourneyItinerary } from "./JourneyItinerary";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/pressure/format";
import { durationLabel, leaveByTime, minutes, minutesUntilLabel, routesLabel, timingLabel } from "@/lib/journey/format";
import type { Journey } from "@/lib/journey/types";
import type { JourneyState } from "@/lib/journey/use-journeys";

type JourneyPanelProps = {
  state: JourneyState;
  /** The journey currently drawn on the map (selected id, or the first option). */
  journey: Journey | null;
  onSelect: (id: string) => void;
  hasDestination: boolean;
  /** "leaving now" / "arriving by 7:00 PM" — what the search was asked for. */
  whenLabel: string;
  /** Wall clock (epoch ms), for the "in N min" countdown; null until mounted. */
  now: number | null;
};

/**
 * Compact selected-trip summary plus selectable journey cards. Every time is a
 * provider value: arrival is labeled an estimate and marked realtime or
 * scheduled. Swipeable itinerary steps remain collapsed by default, with a
 * location-based current-step outline and optional stop details.
 */
export function JourneyPanel({ state, journey, onSelect, hasDestination, whenLabel, now }: JourneyPanelProps) {
  const { data, loading, error } = state;
  const journeys = data?.status === "ok" ? data.journeys : [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function pick(option: Journey) {
    onSelect(option.id);
    setExpandedId((current) => (current === option.id ? null : option.id));
  }

  /** When to actually leave: the provider's walk-start time, pulled earlier by
   * walk-to-stop time + the 2-minute board buffer so the rider reaches the
   * stop before the bus does, not exactly as it arrives. */
  function leaveBy(option: Journey): string {
    return leaveByTime(option) ?? option.startTime;
  }

  return (
    <section className="px-gutter" aria-live="polite" aria-label="Selected trip">
      <div className="flex items-baseline justify-between gap-2">
        <span className="whitespace-nowrap text-label text-blue">Your trip</span>
        <span className="min-w-0 truncate text-label text-blue opacity-footnote">{whenLabel}</span>
      </div>

      {!hasDestination ? (
        <p className="mt-2 text-body text-blue opacity-footnote">Pick a destination above, or ask LoadLine where you are going.</p>
      ) : loading && !journey ? (
        <p className="mt-2 text-body text-blue opacity-footnote">Finding walking + transit itineraries…</p>
      ) : error && !journey ? (
        <>
          <p className="mt-2 text-body text-blue">Routing unavailable.</p>
          <p className="text-footnote text-blue opacity-footnote">{error} No itinerary is shown rather than a guessed one.</p>
        </>
      ) : data?.status === "empty" ? (
        <>
          <p className="mt-2 text-body text-blue">No itinerary found.</p>
          <p className="text-footnote text-blue opacity-footnote">{data.reason} Try a later time, a longer walking limit, or a nearer stop.</p>
        </>
      ) : journey ? (
        <>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-row-title font-bold text-blue">{routesLabel(journey)}</span>
              <span className="text-body text-blue">
                Leave by {clock(leaveBy(journey))} · arrive ~{clock(journey.endTime)}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-emphasis-number font-bold leading-none text-blue">{durationLabel(journey.durationSeconds)}</span>
              <span className="mt-1 text-footnote text-blue opacity-footnote">
                {journey.transfers ? `${journey.transfers} transfer${journey.transfers > 1 ? "s" : ""}` : "no transfers"} · {minutes(journey.walkSeconds)} min walk
              </span>
            </div>
          </div>
          {error ? <p className="mt-1 text-footnote text-blue opacity-footnote">Refresh failed, showing last result.</p> : null}

          {journeys.length > 1 ? (
            <div role="radiogroup" aria-label="Journey options" className="journey-cards mt-3 flex gap-2 overflow-x-auto pb-1">
              {journeys.map((option) => {
                const selected = option.id === journey.id;
                const expanded = option.id === expandedId;
                const walkOnly = option.legs.every((leg) => leg.mode === "WALK");
                const leaveAt = leaveBy(option);
                const countdown = minutesUntilLabel(leaveAt, now) ?? clock(leaveAt);
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${routesLabel(option)}, leave by ${clock(leaveAt)} (${countdown}), arrive about ${clock(option.endTime)}, ${durationLabel(option.durationSeconds)}${expanded ? ", details shown below" : ""}`}
                    onClick={() => pick(option)}
                    className={cn(
                      "relative flex w-[104px] shrink-0 flex-col items-center gap-1 rounded border px-2 py-2 text-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
                      selected ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface",
                    )}
                  >
                    {selected ? <span className="absolute right-[6px] top-[6px] h-[9px] w-[9px] bg-lime" aria-hidden /> : null}
                    <span className="flex max-w-full items-center gap-1">
                      {walkOnly ? <WalkIcon className="h-4 w-4 shrink-0" /> : <BusIcon className="h-4 w-4 shrink-0" />}
                      <span className="truncate text-row-title font-bold text-blue">{routesLabel(option)}</span>
                    </span>
                    <span className="flex items-center gap-1 text-body font-bold text-blue">
                      {countdown}
                      <ChevronDownIcon className={cn("h-[7px] w-[10px] shrink-0 transition-transform motion-reduce:transition-none", expanded && "rotate-180")} />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {(() => {
            const expanded = journeys.find((j) => j.id === expandedId);
            if (!expanded) return null;
            return (
              <div className="mt-2 rounded border border-border-soft bg-surface px-3 py-2 text-footnote text-blue">
                <p className="text-body font-bold text-blue">
                  Leave by {clock(leaveBy(expanded))} · arrive ~{clock(expanded.endTime)}
                </p>
                <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  <dt className="opacity-footnote">Total commute</dt>
                  <dd>{durationLabel(expanded.durationSeconds)}</dd>
                  <dt className="opacity-footnote">Transfers</dt>
                  <dd>{expanded.transfers ? `${expanded.transfers} transfer${expanded.transfers > 1 ? "s" : ""}` : "None"}</dd>
                  <dt className="opacity-footnote">Walking</dt>
                  <dd>{minutes(expanded.walkSeconds)} min</dd>
                  <dt className="opacity-footnote">Timing</dt>
                  <dd>{timingLabel(expanded)}</dd>
                </dl>
              </div>
            );
          })()}

          <div className="mt-2">
            <Divider />
          </div>
          <JourneyItinerary key={journey.id} journey={journey} provider={data?.status === "ok" ? data.provider : null} routeUnavailable={!!error || loading} />
        </>
      ) : null}
    </section>
  );
}

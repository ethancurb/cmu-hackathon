"use client";

import { Divider } from "@/components/Divider";
import { Disclosure } from "@/components/Disclosure";
import { BusIcon, WalkIcon } from "@/components/icons/filled";
import { cn } from "@/lib/cn";
import { clock } from "@/lib/pressure/format";
import { durationLabel, legDetail, legTitle, minutes, routesLabel, timingLabel } from "@/lib/journey/format";
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
};

/**
 * Compact selected-trip summary plus selectable journey cards. Every time is a
 * provider value: arrival is labeled an estimate and marked realtime or
 * scheduled. The full leg list (walk, board, ride, transfer, walk) is collapsed
 * by default and expands in document flow.
 */
export function JourneyPanel({ state, journey, onSelect, hasDestination, whenLabel }: JourneyPanelProps) {
  const { data, loading, error } = state;
  const journeys = data?.status === "ok" ? data.journeys : [];

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
                Leave {clock(journey.startTime)} · arrive ~{clock(journey.endTime)}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-emphasis-number font-bold leading-none text-blue">{durationLabel(journey.durationSeconds)}</span>
              <span className="mt-1 text-footnote text-blue opacity-footnote">
                {journey.transfers ? `${journey.transfers} transfer${journey.transfers > 1 ? "s" : ""}` : "no transfers"} · {minutes(journey.walkSeconds)} min walk
              </span>
            </div>
          </div>
          <p className="mt-1 text-footnote text-blue opacity-footnote">
            Arrival is an estimate · {timingLabel(journey)} · walking {minutes(journey.walkSeconds)} min, waiting {minutes(journey.waitSeconds)} min, riding {minutes(journey.rideSeconds)} min
            {error ? ` · refresh failed, showing last result` : ""}
          </p>

          {journeys.length > 1 ? (
            <div role="radiogroup" aria-label="Journey options" className="journey-cards mt-3 flex gap-2 overflow-x-auto pb-1">
              {journeys.map((option) => {
                const selected = option.id === journey.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${routesLabel(option)}, leave ${clock(option.startTime)}, arrive about ${clock(option.endTime)}, ${durationLabel(option.durationSeconds)}`}
                    onClick={() => onSelect(option.id)}
                    className={cn(
                      "relative flex w-[128px] shrink-0 flex-col items-start gap-[2px] rounded border px-3 py-2 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
                      selected ? "border-ink-deep bg-canvas" : "border-border-soft bg-surface",
                    )}
                  >
                    {selected ? <span className="absolute right-[8px] top-[8px] h-[9px] w-[9px] bg-lime" aria-hidden /> : null}
                    <span className="max-w-full truncate pr-3 text-row-title font-bold text-blue">{routesLabel(option)}</span>
                    <span className="text-body text-blue">
                      {clock(option.startTime)}–{clock(option.endTime)}
                    </span>
                    <span className="text-footnote text-blue opacity-footnote">
                      {durationLabel(option.durationSeconds)} · {option.transfers ? `${option.transfers} xfer` : "direct"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="mt-2">
            <Divider />
          </div>
          <Disclosure label="Itinerary" summary={`${journey.legs.length} legs`}>
            <ol className="flex flex-col gap-[6px]">
              {journey.legs.map((leg, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center">
                    {leg.mode === "WALK" ? <WalkIcon className="h-4 w-4" /> : <BusIcon className="h-4 w-4" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body font-bold text-blue">{legTitle(leg)}</span>
                    <span className="text-footnote text-blue opacity-footnote">{legDetail(leg)}</span>
                    {leg.mode !== "WALK" ? (
                      <span className="text-footnote text-blue opacity-footnote">
                        {leg.agency ?? "PRT"} · {leg.realTime ? "realtime" : "scheduled"} · {durationLabel(leg.durationSeconds)}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-footnote text-blue">{clock(leg.startTime)}</span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3 text-body text-blue">
                <span className="font-bold">Arrive (estimate)</span>
                <span>~{clock(journey.endTime)}</span>
              </li>
            </ol>
            {data?.status === "ok" ? <p className="mt-2 text-footnote text-blue opacity-footnote">Itinerary via {data.provider} · fetched {clock(data.fetchedAt)}</p> : null}
          </Disclosure>
        </>
      ) : null}
    </section>
  );
}

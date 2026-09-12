"use client";

import { Divider } from "@/components/Divider";
import { Disclosure } from "@/components/Disclosure";
import { PressureDots } from "./PressureDots";
import { PressureInsights } from "@/components/PressureInsights";
import { BusIcon } from "@/components/icons/filled";
import { explainSample } from "@/lib/pressure/explain";
import { durationLabel, routesLabel, timingLabel } from "@/lib/journey/format";
import type { Journey } from "@/lib/journey/types";
import type { InsightCard } from "@/components/InsightCards";
import type { PressureState } from "@/lib/pressure/use-pressure";
import { clock, timeRange, CONFIDENCE_WORD, LEVEL_COLOR, LEVEL_WORD } from "@/lib/pressure/format";

type PressureModuleProps = {
  state: PressureState;
  /** Rendered next to the section label, e.g. "at 9:45 PM" or "leaving now". */
  whenLabel: string;
  recommendedJourney: Journey | null;
  routeStatus: string;
  onShowJourney: (id: string) => void;
};

/**
 * Concise Transit Pressure summary: the 0–100 model index, level, confidence
 * and surge window stay visible; WHY, advice and event impact sit
 * in collapsed sections. Provenance lives on the Information page. Every value is produced by lib/pressure/engine.ts —
 * the advice time and text are never typed in here.
 */
export function PressureModule({ state, whenLabel, recommendedJourney, routeStatus, onShowJourney }: PressureModuleProps) {
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
  const explanation = explainSample(data, 0);
  const routeCard: InsightCard = recommendedJourney ? {
    id: `journey-${recommendedJourney.id}`,
    label: "Recommended",
    title: routesLabel(recommendedJourney),
    summary: `${durationLabel(recommendedJourney.durationSeconds)} · arrive ~${clock(recommendedJourney.endTime)}`,
    meta: `Quickest · ${timingLabel(recommendedJourney)}`,
    icon: <BusIcon className="h-4 w-4" />,
    recommended: true,
    actionLabel: "Show on map ↗",
    action: () => onShowJourney(recommendedJourney.id),
  } : {
    id: "journey-unavailable", label: "Your route", title: routeStatus,
    icon: <BusIcon className="h-4 w-4" />,
    detail: "Choose a destination and departure time above to find bus options. Recommendations use available itineraries for that search.",
  };

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
        <p className="mb-2 text-body text-blue">{recommendation.label}. {recommendedJourney ? "Quickest bus for your selected time:" : "Your trip insights:"}</p>
        <PressureInsights items={explanation.items} label="Advice insights" firstCard={routeCard} upcoming={data.upcoming} gaps={explanation.gaps} />
      </Disclosure>
      <Divider />

    </section>
  );
}

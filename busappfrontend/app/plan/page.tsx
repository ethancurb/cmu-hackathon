"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { Headline } from "@/components/Headline";
import { Select } from "@/components/Select";
import { Divider } from "@/components/Divider";
import { ListRow } from "@/components/ListRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Disclosure } from "@/components/Disclosure";
import { PressureInsights } from "@/components/PressureInsights";
import { PressureTimeline } from "./PressureTimeline";
import { useAppState } from "@/lib/app-context";
import { useDeviceLocation } from "@/lib/geolocation";
import { usePressure } from "@/lib/pressure/use-pressure";
import { SCENARIO_DEFINITIONS } from "@/lib/pressure/demo";
import { clock, timeRange, tomorrowAtLocalHour, LEVEL_WORD } from "@/lib/pressure/format";
import { dayTitle, explainSample } from "@/lib/pressure/explain";
import type { PressureResult } from "@/lib/pressure/types";

const DAY_OPTIONS = ["Today", "Tomorrow"];
const HORIZON_OPTIONS = ["4 hours", "8 hours"];
const HORIZON_MINUTES: Record<string, number> = { "4 hours": 240, "8 hours": 480 };
const TOMORROW_START_HOUR = 7;

type Option = { id: string; title: string; subtitle: string; index: number };

/** Turns the engine's structured windows into selectable rows. Nothing here is
 * a text template detached from the model: every row points at a timeline sample. */
function optionsFor(result: PressureResult): Option[] {
  const index = (at: string | null) => (at ? result.timeline.findIndex((p) => p.at === at) : -1);
  const options: Option[] = [];
  const rec = result.recommendation;
  const recIndex = Math.max(0, index(rec.at));
  const recSample = result.timeline[recIndex];
  const recSubtitle =
    rec.kind === "LEAVE_BEFORE" && result.surge
      ? `Ahead of the ${clock(result.surge.start)} surge`
      : rec.kind === "WAIT_FOR_LOWER" || rec.kind === "AFTER_SURGE"
        ? `Drops to about ${recSample.score} / 100`
        : `${LEVEL_WORD[recSample.level]} · ${recSample.score} / 100 · ${recSample.reasons[0]?.label ?? ""}`;
  options.push({ id: "recommendation", title: rec.label, subtitle: recSubtitle, index: recIndex });
  const bestIndex = index(result.bestWindow.start);
  if (bestIndex >= 0 && bestIndex !== recIndex) {
    options.push({
      id: "best",
      title: timeRange(result.bestWindow.start, result.bestWindow.end),
      subtitle: `Lowest pressure in view · about ${result.bestWindow.score} / 100`,
      index: bestIndex,
    });
  }
  if (result.surge) {
    const s = result.surge;
    options.push({
      id: "surge",
      title: `Avoid ${timeRange(s.start, s.end)}${s.continues ? "+" : ""}`,
      subtitle: `Surge · peak ${s.peak} / 100 at ${clock(s.peakAt)}`,
      index: Math.max(0, index(s.peakAt)),
    });
  }
  return options;
}

export default function PlanPage() {
  const router = useRouter();
  const { applyDepartureAt, demo, destination, manualOrigin, riderSignals } = useAppState();
  const device = useDeviceLocation();
  const [day, setDay] = useState(DAY_OPTIONS[0]);
  const [horizon, setHorizon] = useState(HORIZON_OPTIONS[0]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>("recommendation");
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const scenario = demo ? SCENARIO_DEFINITIONS[demo.scenario] : null;
  const origin = scenario ? { lat: scenario.location.lat, lng: scenario.location.lng } : manualOrigin ? { lat: manualOrigin.lat, lng: manualOrigin.lng } : { lat: device.lat, lng: device.lng };
  const tripEnd = scenario ? { lat: scenario.destination.lat, lng: scenario.destination.lng } : destination ? { lat: destination.lat, lng: destination.lng } : null;
  // "Tomorrow" starts the timeline at 7 AM Pittsburgh time; the demo scenarios carry their own fixed clock.
  const at = useMemo(() => (!scenario && day === "Tomorrow" ? tomorrowAtLocalHour(TOMORROW_START_HOUR) : null), [day, scenario]);
  const pressure = usePressure({ origin, destination: tripEnd, at, horizonMinutes: HORIZON_MINUTES[horizon], demo, riderSignals });
  const result = pressure.data;

  const options = useMemo(() => (result ? optionsFor(result) : []), [result]);
  const recommendedIndex = options[0]?.index ?? 0;
  const activeIndex = selectedIndex ?? recommendedIndex;
  const selectedSample = result?.timeline[activeIndex] ?? null;
  const explanation = useMemo(() => (result ? explainSample(result, activeIndex) : null), [result, activeIndex]);

  function selectSample(index: number) {
    setSelectedIndex(index);
    setSelectedOptionId(options.find((o) => o.index === index)?.id ?? null);
    setEvidenceOpen(true);
  }

  function selectOption(option: Option) {
    setSelectedIndex(option.index);
    setSelectedOptionId(option.id);
  }

  function handleApply() {
    if (!selectedSample) return;
    // The first sample of a "now" timeline is "leave now", not a pinned clock time.
    const leaveNow = activeIndex === 0 && at === null && !scenario;
    applyDepartureAt(leaveNow ? null : selectedSample.at);
    router.push("/");
  }

  const subhead = scenario
    ? `${scenario.location.label} → ${scenario.destination.label}`
    : `${manualOrigin?.label ?? (device.source === "device" ? "Your location" : "Carnegie Mellon")} → ${destination?.label ?? "no destination yet"}`;
  const headline = result?.surge ? "Beat the surge." : result && result.current.level === "LOW" ? "A quiet trip." : "A quieter trip.";

  return (
    <div className="mobile-screen plan-screen flex min-h-dvh flex-col bg-canvas">
      <NavBar backLabel="Plan" onBack={() => router.push("/")} />

      <Headline subhead={subhead}>{headline}</Headline>

      <div className="mt-[14px] flex gap-[16px] px-gutter">
        <div className="min-w-0 flex-1">
          {scenario ? (
            <div className="flex h-control items-center rounded border border-border bg-surface px-4 text-descriptor text-blue">
              <span className="truncate">{scenario.title}</span>
            </div>
          ) : (
            <Select value={day} options={DAY_OPTIONS} onChange={(v) => { setDay(v); setSelectedIndex(null); }} variant="primary" label="Day" />
          )}
        </div>
        <div className="min-w-0 max-w-[50%] shrink">
          <Select value={horizon} options={HORIZON_OPTIONS} onChange={(v) => { setHorizon(v); setSelectedIndex(null); }} variant="secondary" label="Range" />
        </div>
      </div>

      <div className="mt-[22px]">
        {result ? (
          <PressureTimeline
            timeline={result.timeline}
            surge={result.surge}
            bestWindow={result.bestWindow}
            selectedIndex={activeIndex}
            onSelect={selectSample}
            caption="Tap a bar (or use ← →) to see what drives that time."
          />
        ) : (
          <div className="flex flex-col items-center px-gutter">
            <p className="text-emphasis-number font-bold text-blue">{pressure.loading ? "…" : "—"}</p>
            <p className="text-descriptor text-blue">{pressure.loading ? "Modeling the next few hours" : pressure.error ?? "Timeline unavailable"}</p>
          </div>
        )}
      </div>

      {/* What's happening at the selected bar: only that sample's evidence. */}
      {result && explanation ? (
        <div className="mt-[11px] px-gutter">
          <Divider />
          <Disclosure
            label={dayTitle(explanation.at)}
            summary={clock(explanation.at)}
            open={evidenceOpen}
            onOpenChange={setEvidenceOpen}
          >
            <section aria-label="Evidence for the selected time" className="flex flex-col gap-2">
              <p className="text-body text-blue">{explanation.level} pressure at {clock(explanation.at)}.</p>
              <PressureInsights key={explanation.at} items={explanation.items} label="Timeline insights" upcoming={result.upcoming} gaps={explanation.gaps} />
            </section>
          </Disclosure>
          <Divider />
        </div>
      ) : null}

      <div className="mt-[11px] flex flex-col">
        <p className="px-gutter py-[11px] text-section-label text-blue">Departure windows</p>
        <div role="radiogroup" aria-label="Departure windows">
          {options.map((option, i) => (
            <div key={option.id}>
              <ListRow
                title={option.title}
                subtitle={option.subtitle}
                checked={option.id === selectedOptionId}
                onToggle={() => selectOption(option)}
                onClick={() => selectOption(option)}
                role="radio"
              />
              {i < options.length - 1 ? (
                <div className="px-gutter">
                  <Divider />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="px-gutter">
          <Divider />
        </div>
        <p className="px-gutter py-[11px] text-footnote text-blue opacity-footnote">
          {result ? `${result.recommendation.detail} ` : ""}Model index from events, weather, time patterns and PRT service; not occupancy.
        </p>
      </div>

      <div className="mt-auto px-gutter pb-4">
        <PrimaryButton label="Use selected time" onClick={handleApply} disabled={!selectedSample} />
      </div>
    </div>
  );
}

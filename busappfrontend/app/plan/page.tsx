"use client";

import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { Headline } from "@/components/Headline";
import { Select } from "@/components/Select";
import { Divider } from "@/components/Divider";
import { ListRow } from "@/components/ListRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CrowdingChart } from "./CrowdingChart";
import { useAppState } from "@/lib/app-context";
import { BARS, RECOMMENDATIONS, PRIMARY_SELECT_OPTIONS, SECONDARY_SELECT_OPTIONS } from "@/lib/mock-data";

export default function PlanPage() {
  const router = useRouter();
  const {
    selectedHourIndex,
    selectHour,
    selectedRecommendationId,
    selectRecommendation,
    primarySelectValue,
    setPrimarySelectValue,
    secondarySelectValue,
    setSecondarySelectValue,
    applyDepartureTime,
  } = useAppState();

  const selectedBar = BARS[selectedHourIndex];
  const canApply = selectedHourIndex !== null && selectedHourIndex !== undefined;

  function handleApply() {
    if (!canApply) return;
    // Prefer the human-friendly recommendation range when one matches the
    // current hour; otherwise fall back to the bar's own time.
    const recommendation = RECOMMENDATIONS.find((r) => r.id === selectedRecommendationId);
    applyDepartureTime(recommendation ? recommendation.title : selectedBar.time);
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <NavBar backLabel="Plan" onBack={() => router.push("/")} />

      <Headline subhead="Morewood Avenue">A quieter trip.</Headline>

      <div className="mt-[14px] flex gap-[16px] px-gutter">
        <div className="min-w-0 flex-1">
          <Select
            value={primarySelectValue}
            options={PRIMARY_SELECT_OPTIONS}
            onChange={setPrimarySelectValue}
            variant="primary"
            label="Day"
          />
        </div>
        {/* Secondary never grows past half the row, so its content-sized label
            (which naturally wants more room than that at very narrow
            viewports) truncates via Select's own `truncate` span instead of
            pushing the row past the gutter. At the 390px design width this
            cap sits above the label's natural width, so nothing visibly
            changes there — it only engages once space gets tight. */}
        <div className="min-w-0 max-w-[50%] shrink">
          <Select
            value={secondarySelectValue}
            options={SECONDARY_SELECT_OPTIONS}
            onChange={setSecondarySelectValue}
            variant="secondary"
            label="Range"
          />
        </div>
      </div>

      <div className="mt-[22px]">
        <CrowdingChart
          value={selectedBar.time}
          descriptor={selectedBar.descriptor}
          caption="Drag across the chart to compare."
          bars={BARS}
          selectedIndex={selectedHourIndex}
          onSelectHour={selectHour}
        />
      </div>

      <div className="mt-[11px] flex flex-col">
        <div className="px-gutter">
          <Divider />
        </div>
        <p className="px-gutter py-[11px] text-section-label text-blue">Top recommendations</p>
        <div role="radiogroup" aria-label="Top recommendations">
          {RECOMMENDATIONS.map((rec, i) => (
            <div key={rec.id}>
              <ListRow
                title={rec.title}
                subtitle={rec.subtitle}
                checked={rec.id === selectedRecommendationId}
                onToggle={() => selectRecommendation(rec.id)}
                onClick={() => selectRecommendation(rec.id)}
                role="radio"
              />
              {i < RECOMMENDATIONS.length - 1 ? (
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
          Based on forecast weather and local activity.
        </p>
      </div>

      <div className="mt-auto px-gutter pb-4">
        <PrimaryButton label="Use selected time" onClick={handleApply} disabled={!canApply} />
      </div>
    </div>
  );
}

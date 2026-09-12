import { NavBar } from "@/components/NavBar";
import { Headline } from "@/components/Headline";
import { Select } from "@/components/Select";
import { Divider } from "@/components/Divider";
import { ListRow } from "@/components/ListRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CrowdingChart } from "./CrowdingChart";

const BARS = [
  { height: 0.34, label: "6a" },
  { height: 0.56 },
  { height: 0.57, label: "10a" },
  { height: 0.42 },
  { height: 0.36, label: "2p" },
  { height: 0.4 },
  { height: 0.86, label: "6p" },
  { height: 0.94 },
  { height: 0.62, label: "10p" },
  { height: 0.5 },
  { height: 0.42 },
];

export default function PlanPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <NavBar backLabel="Plan" />

      <Headline subhead="Morewood Avenue">A quieter trip.</Headline>

      <div className="mt-[14px] flex gap-[16px] px-gutter">
        <div className="min-w-0 flex-1">
          <Select value="Today" variant="primary" />
        </div>
        {/* Secondary never grows past half the row, so its content-sized label
            (which naturally wants more room than that at very narrow
            viewports) truncates via Select's own `truncate` span instead of
            pushing the row past the gutter. At the 390px design width this
            cap sits above the label's natural width, so nothing visibly
            changes there — it only engages once space gets tight. */}
        <div className="min-w-0 max-w-[50%] shrink">
          <Select value="Next 7 days" variant="secondary" />
        </div>
      </div>

      <div className="mt-[22px]">
        <CrowdingChart
          value="10:00 am"
          descriptor="Low crowding"
          caption="Drag across the chart to compare."
          bars={BARS}
          selectedIndex={2}
        />
      </div>

      <div className="mt-[11px] flex flex-col">
        <div className="px-gutter">
          <Divider />
        </div>
        <p className="px-gutter py-[11px] text-section-label text-blue">Top recommendations</p>
        <ListRow title="8:30 – 10:00 am" subtitle="Lowest crowding" checked />
        <div className="px-gutter">
          <Divider />
        </div>
        <ListRow title="12:00 – 1:30 pm" subtitle="Moderate traffic" />
        <div className="px-gutter">
          <Divider />
        </div>
        <ListRow title="4:00 – 6:00 pm" subtitle="Increasing crowding" />
        <div className="px-gutter">
          <Divider />
        </div>
        <p className="px-gutter py-[11px] text-footnote text-blue opacity-footnote">
          Based on forecast weather and local activity.
        </p>
      </div>

      <div className="mt-auto px-gutter pb-4">
        <PrimaryButton label="Use selected time" />
      </div>
    </div>
  );
}

import { cn } from "@/lib/cn";

type Bar = { height: number; label?: string };

type CrowdingChartProps = {
  value: string;
  descriptor: string;
  caption: string;
  bars: Bar[];
  selectedIndex: number;
};

// Geometry scaled ×1.354 from the 288px reference (16→22, 4→5, per Step 1).
const BAR_WIDTH = 22;
const BAR_GAP = 5;
// CHART_HEIGHT and PLAYHEAD_EXTRA aren't spec tokens (CHART_HEIGHT was tuned
// by hand; PLAYHEAD_EXTRA is the spec's "~30px above the tallest bar" prose
// value) — both scaled ×1.354 for consistency with everything else.
const CHART_HEIGHT = 97;
const PLAYHEAD_EXTRA = 41;
const PITCH = BAR_WIDTH + BAR_GAP;

/**
 * Centered value/descriptor, 11-column bar chart (22px bars, 5px gap, zero
 * radius, selected bar lime), a 1px playhead ~41px above the tallest bar, a
 * baseline rule wider than the bar group, alternating axis labels, caption.
 *
 * The descriptor line ("Low crowding") uses the "descriptor" token, and the
 * caption ("Drag across...") uses "body" — these look alike in the old spec
 * (both were 14px) but solve to genuinely different sizes empirically: the
 * descriptor clusters with the primary select's value (~17px), the caption
 * clusters with the list row subtitle (~13px). See the type-scale solve
 * report. The caption keeps its 70%-opacity dimming regardless, since that's
 * a color/opacity treatment independent of size.
 */
export function CrowdingChart({ value, descriptor, caption, bars, selectedIndex }: CrowdingChartProps) {
  const tallestHeight = Math.max(...bars.map((b) => b.height)) * CHART_HEIGHT;
  const playheadHeight = tallestHeight + PLAYHEAD_EXTRA;
  const groupWidth = bars.length * BAR_WIDTH + (bars.length - 1) * BAR_GAP;
  const playheadLeft = selectedIndex * PITCH + BAR_WIDTH / 2;

  return (
    <div className="flex flex-col items-center px-gutter">
      <p className="text-emphasis-number font-bold text-blue">{value}</p>
      <p className="text-descriptor text-blue">{descriptor}</p>

      <div className="relative mt-4" style={{ height: CHART_HEIGHT, width: groupWidth }}>
        <div className="absolute bottom-0 w-px bg-bar" style={{ left: playheadLeft, height: playheadHeight }} />
        <div className="absolute bottom-0 flex" style={{ gap: BAR_GAP }}>
          {bars.map((bar, i) => (
            <div
              key={i}
              className={cn(i === selectedIndex ? "bg-lime" : "bg-bar")}
              style={{ width: BAR_WIDTH, height: bar.height * CHART_HEIGHT }}
            />
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-rule" />

      <div className="mt-[5px] flex" style={{ width: groupWidth, gap: BAR_GAP }}>
        {bars.map((bar, i) => (
          <span key={i} className="text-center text-axis-label text-blue" style={{ width: BAR_WIDTH }}>
            {bar.label ?? ""}
          </span>
        ))}
      </div>

      <p className="mt-2 w-full text-body text-blue opacity-footnote">{caption}</p>
    </div>
  );
}

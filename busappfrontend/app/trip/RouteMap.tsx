import { Chip } from "@/components/Chip";
import { IconToggle } from "@/components/IconToggle";
import { Badge } from "@/components/Badge";
import { CloudIcon, MapIcon, BusIcon, ChatIcon, CrosshairIcon, StatsIcon, PinIcon } from "@/components/icons/filled";

const MAP_WIDTH = 336;
const MAP_HEIGHT = 340;
const INSET = 11; // 8px spec value × 1.354

/** Light street-grid texture — a static placeholder, not a map SDK. */
function StreetTexture() {
  const lines = [];
  for (let x = 24; x < MAP_WIDTH; x += 32) lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={MAP_HEIGHT} />);
  for (let y = 24; y < MAP_HEIGHT; y += 32) lines.push(<line key={`h${y}`} x1={0} y1={y} x2={MAP_WIDTH} y2={y} />);
  return (
    <g stroke="var(--border-soft)" strokeWidth={1} opacity={0.6}>
      {lines}
    </g>
  );
}

export function RouteMap() {
  return (
    <div
      className="relative w-full overflow-hidden rounded border border-border-soft bg-surface"
      style={{ height: MAP_HEIGHT }}
    >
      {/* Fluid width, fixed height: the SVG scales via viewBox down to any
          viewport (holds at 320px); the absolutely-positioned HTML overlays
          below stay at their fixed design-width (336px) coordinates and get
          clipped by overflow-hidden rather than escaping the container, so
          narrow viewports crop the map's decoration rather than the page. */}
      <svg width="100%" height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid slice">
        <StreetTexture />

        {/* Route 54 — inactive: dotted light gray. Lowest/looping path. */}
        <path d="M40,190 C90,250 200,260 296,150" fill="none" stroke="var(--bar)" strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" />
        {/* Route 71 — alternate: dashed mid-gray. Middle, dipping path. */}
        <path d="M40,190 L120,210 L200,175 L296,150" fill="none" stroke="var(--border)" strokeWidth={2} strokeDasharray="7 5" />
        {/* Route 61 — active: solid ink, uppermost arc. Matches the selected arrival
            card below — the active route on the map corresponds to the selected
            card, not a fixed route. */}
        <path d="M40,190 C90,120 210,130 296,150" fill="none" stroke="var(--ink-deep)" strokeWidth={3} />

        {/* Origin: blue ring dot */}
        <circle cx={40} cy={190} r={7} fill="var(--surface)" stroke="var(--blue)" strokeWidth={3} />

        {/* Lime marker — the active route's current bus position, selection only */}
        <rect x={116} y={155} width={8} height={8} fill="var(--lime)" />
      </svg>

      {/* Destination: the shared PinIcon glyph, not a plain SVG circle */}
      <PinIcon className="absolute h-4 w-4 -translate-x-1/2 -translate-y-full" style={{ left: 296, top: 150 }} />

      {/* Route badges + bus glyphs, positioned along each path. Badge tone follows
          route state: active route reuses the ink-deep Badge primitive; alternate
          and inactive reuse the --border and --bar tokens rather than inventing
          new hex values. */}
      <div className="absolute flex items-center gap-1" style={{ left: 150, top: 130 }}>
        <BusIcon className="h-4 w-4" />
        <Badge label="61" />
      </div>
      <div className="absolute flex items-center gap-1" style={{ left: 128, top: 195 }}>
        <BusIcon className="h-4 w-4" />
        <span className="inline-flex items-center justify-center rounded bg-border px-2 py-[3px] text-row-title font-bold text-on-ink">71</span>
      </div>
      <div className="absolute flex items-center gap-1" style={{ left: 110, top: 250 }}>
        <BusIcon className="h-4 w-4" />
        <span className="inline-flex items-center justify-center rounded bg-bar px-2 py-[3px] text-row-title font-bold text-blue">54</span>
      </div>

      {/* Map annotations: destination name and neighborhood labels, as shown
          directly on the reference map. Sized with the generic (unsolved,
          provisional) label token — no target string was measured for these. */}
      <span className="absolute text-label text-blue" style={{ left: 260, top: 168 }}>
        Morewood Avenue
      </span>
      <span className="absolute text-label text-blue" style={{ left: INSET, bottom: 60 }}>
        Oakland
      </span>
      <span className="absolute text-label text-blue" style={{ right: INSET, bottom: 60 }}>
        Campus
      </span>

      {/* Dismissible chip, top-left */}
      <div className="absolute" style={{ left: INSET, top: INSET }}>
        <Chip icon={<CloudIcon className="h-4 w-4" />} label="Ends in 18m" />
      </div>

      {/* Icon toggle pair, top-right — map active (lime bar under it) */}
      <div className="absolute flex" style={{ right: INSET, top: INSET, gap: 3 }}>
        <IconToggle icon={<MapIcon className="h-[22px] w-[22px]" />} active label="Map view" />
        <IconToggle icon={<BusIcon className="h-[22px] w-[22px]" />} label="Bus view" />
      </div>

      {/* Utility buttons: chat + stats grouped bottom-left, locate alone
          bottom-right — same square treatment, no lime, per the reference. */}
      <div className="absolute flex" style={{ left: INSET, bottom: INSET, gap: 3 }}>
        <IconToggle icon={<ChatIcon className="h-[22px] w-[22px]" />} label="Feedback" showIndicator={false} />
        <IconToggle icon={<StatsIcon className="h-[22px] w-[22px]" />} label="Crowding stats" showIndicator={false} />
      </div>
      <div className="absolute" style={{ right: INSET, bottom: INSET }}>
        <IconToggle icon={<CrosshairIcon className="h-[22px] w-[22px]" />} label="Locate me" showIndicator={false} />
      </div>
    </div>
  );
}

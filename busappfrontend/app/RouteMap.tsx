"use client";

import { useState } from "react";
import { Chip } from "@/components/Chip";
import { IconToggle } from "@/components/IconToggle";
import { Badge } from "@/components/Badge";
import { CloudIcon, BusIcon, ChatIcon, CrosshairIcon, StatsIcon, PinIcon } from "@/components/icons/filled";
import type { RouteId } from "@/lib/mock-data";
import type { ViewMode } from "@/lib/app-context";
import { ViewToggle } from "./ViewToggle";

const MAP_WIDTH = 336;
const MAP_HEIGHT = 340;
const INSET = 11; // 8px spec value × 1.354

/** Small illustrative "the map recentered on this route's bus" pan per route —
 * not derived from real geometry, just enough to make selecting a different
 * route visibly shift the view. */
const ROUTE_FOCUS_OFFSET: Record<RouteId, { x: number; y: number }> = {
  "71": { x: 14, y: -8 },
  "61": { x: 0, y: 0 },
  "54": { x: -6, y: 14 },
};

type RouteMapProps = {
  activeRouteId: RouteId;
  weatherDismissed: boolean;
  onDismissWeather: () => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
};

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

export function RouteMap({ activeRouteId, weatherDismissed, onDismissWeather, viewMode, onSetViewMode }: RouteMapProps) {
  // Selecting a different arrival card "recenters" the map on that route (a
  // real, if illustrative, effect). Locate resets the view back to the
  // rider's own location (the origin ring), independent of route selection.
  const [locatedAtOrigin, setLocatedAtOrigin] = useState(false);
  // Picking a different route resumes route-following — "locate" only wins
  // until the next route change. Adjusted during render (React's recommended
  // pattern for resetting state on a prop change) rather than in an effect,
  // since this needs to take effect before the pan is computed for this render.
  const [lastActiveRouteId, setLastActiveRouteId] = useState(activeRouteId);
  if (activeRouteId !== lastActiveRouteId) {
    setLastActiveRouteId(activeRouteId);
    setLocatedAtOrigin(false);
  }
  const offset = locatedAtOrigin ? { x: 0, y: 0 } : ROUTE_FOCUS_OFFSET[activeRouteId];

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
      <div
        className="motion-reduce:transition-none motion-reduce:duration-0"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, transition: "transform 200ms ease-out" }}
      >
        <svg width="100%" height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid slice">
          <StreetTexture />

          {/* Route 54 — inactive: dotted light gray. Lowest/looping path. */}
          <path
            d="M40,190 C90,250 200,260 296,150"
            fill="none"
            stroke={activeRouteId === "54" ? "var(--ink-deep)" : "var(--bar)"}
            strokeWidth={activeRouteId === "54" ? 3 : 2}
            strokeDasharray={activeRouteId === "54" ? undefined : "1 5"}
            strokeLinecap="round"
          />
          {/* Route 71 — alternate: dashed mid-gray. Middle, dipping path. */}
          <path
            d="M40,190 L120,210 L200,175 L296,150"
            fill="none"
            stroke={activeRouteId === "71" ? "var(--ink-deep)" : "var(--border)"}
            strokeWidth={activeRouteId === "71" ? 3 : 2}
            strokeDasharray={activeRouteId === "71" ? undefined : "7 5"}
          />
          {/* Route 61 — uppermost arc. Whichever route is active (matching the
              selected arrival card) renders solid ink; the other two fall back
              to their alternate/inactive treatments. */}
          <path
            d="M40,190 C90,120 210,130 296,150"
            fill="none"
            stroke={activeRouteId === "61" ? "var(--ink-deep)" : "var(--border)"}
            strokeWidth={activeRouteId === "61" ? 3 : 2}
            strokeDasharray={activeRouteId === "61" ? undefined : "7 5"}
          />

          {/* Origin: blue ring dot */}
          <circle cx={40} cy={190} r={7} fill="var(--surface)" stroke="var(--blue)" strokeWidth={3} />

          {/* Lime marker — the active route's current bus position, selection only */}
          <rect
            x={activeRouteId === "71" ? 128 : activeRouteId === "54" ? 110 : 116}
            y={activeRouteId === "71" ? 205 : activeRouteId === "54" ? 260 : 155}
            width={8}
            height={8}
            fill="var(--lime)"
          />
        </svg>

        {/* Destination: the shared PinIcon glyph, not a plain SVG circle */}
        <PinIcon className="absolute h-4 w-4 -translate-x-1/2 -translate-y-full" style={{ left: 296, top: 150 }} />

        {/* Route badges + bus glyphs, positioned along each path. Badge tone
            follows route state: active route reuses the ink-deep Badge
            primitive; others reuse the --border and --bar tokens. */}
        <div className="absolute flex items-center gap-1" style={{ left: 150, top: 130 }}>
          <BusIcon className="h-4 w-4" />
          {activeRouteId === "61" ? (
            <Badge label="61" />
          ) : (
            <span className="inline-flex items-center justify-center rounded bg-border px-2 py-[3px] text-row-title font-bold text-on-ink">
              61
            </span>
          )}
        </div>
        <div className="absolute flex items-center gap-1" style={{ left: 128, top: 195 }}>
          <BusIcon className="h-4 w-4" />
          {activeRouteId === "71" ? (
            <Badge label="71" />
          ) : (
            <span className="inline-flex items-center justify-center rounded bg-border px-2 py-[3px] text-row-title font-bold text-on-ink">
              71
            </span>
          )}
        </div>
        <div className="absolute flex items-center gap-1" style={{ left: 110, top: 250 }}>
          <BusIcon className="h-4 w-4" />
          {activeRouteId === "54" ? (
            <Badge label="54" />
          ) : (
            <span className="inline-flex items-center justify-center rounded bg-bar px-2 py-[3px] text-row-title font-bold text-blue">
              54
            </span>
          )}
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
      </div>

      {/* Floating UI stays fixed to the panel's corners — it doesn't pan with the map content. */}
      {!weatherDismissed ? (
        <div className="absolute" style={{ left: INSET, top: INSET }}>
          <Chip icon={<CloudIcon className="h-4 w-4" />} label="Ends in 18m" onDismiss={onDismissWeather} />
        </div>
      ) : null}

      <ViewToggle viewMode={viewMode} onChange={onSetViewMode} />

      {/* Utility buttons: chat + stats grouped bottom-left, locate alone
          bottom-right. Chat/stats have no destination in this build yet, so
          they're visibly disabled rather than dead; locate genuinely recenters. */}
      <div className="absolute flex" style={{ left: INSET, bottom: INSET, gap: 3 }}>
        <IconToggle icon={<ChatIcon className="h-[22px] w-[22px]" />} label="Feedback (not available yet)" showIndicator={false} disabled />
        <IconToggle icon={<StatsIcon className="h-[22px] w-[22px]" />} label="Crowding stats (not available yet)" showIndicator={false} disabled />
      </div>
      <div className="absolute" style={{ right: INSET, bottom: INSET }}>
        <IconToggle
          icon={<CrosshairIcon className="h-[22px] w-[22px]" />}
          label="Locate me"
          showIndicator={false}
          onClick={() => setLocatedAtOrigin(true)}
        />
      </div>
    </div>
  );
}

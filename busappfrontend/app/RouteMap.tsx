"use client";

import { useRef, useState } from "react";
import { Chip } from "@/components/Chip";
import { IconToggle } from "@/components/IconToggle";
import { CloudIcon, SunIcon, ChatIcon, CrosshairIcon, StatsIcon, PinIcon } from "@/components/icons/filled";
import type { RouteId } from "@/lib/mock-data";
import type { ViewMode } from "@/lib/app-context";
import { useDeviceLocation } from "@/lib/geolocation";
import { useWeather } from "@/lib/weather";
import { ViewToggle } from "./ViewToggle";
import { MapCanvas, type Destination, type MapCanvasHandle } from "./MapCanvas";

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
  onSelectRoute: (id: RouteId) => void;
  destination: Destination;
  weatherDismissed: boolean;
  onDismissWeather: () => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
};

export function RouteMap({
  activeRouteId,
  onSelectRoute,
  destination,
  weatherDismissed,
  onDismissWeather,
  viewMode,
  onSetViewMode,
}: RouteMapProps) {
  const location = useDeviceLocation();
  const weather = useWeather(location.lat, location.lng);
  const mapRef = useRef<MapCanvasHandle>(null);
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
      {/* Fluid width, fixed height. MapCanvas fills this box and draws its
          own real-coordinate overlay (routes, origin marker) sized to its
          actual measured pixels; the destination pin/labels below stay
          fixed-position decoration and get clipped by overflow-hidden on
          narrow viewports rather than escaping the container. */}
      <div
        className="absolute inset-0 motion-reduce:transition-none motion-reduce:duration-0"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, transition: "transform 200ms ease-out" }}
      >
        <MapCanvas
          ref={mapRef}
          lat={location.lat}
          lng={location.lng}
          activeRouteId={activeRouteId}
          destination={destination}
          onNearestRoute={onSelectRoute}
        />

        {/* Destination: the shared PinIcon glyph, not a plain SVG circle.
            Fixed/decorative default until a real address is searched — once
            `destination` is set, MapCanvas draws the real geocoded pin
            instead, so this placeholder steps aside rather than doubling up. */}
        {!destination ? (
          <>
            <PinIcon className="absolute h-4 w-4 -translate-x-1/2 -translate-y-full" style={{ left: 296, top: 150 }} />
            <span className="absolute text-label text-blue" style={{ left: 260, top: 168 }}>
              Morewood Avenue
            </span>
          </>
        ) : null}

        {/* Map annotations: neighborhood labels, as shown directly on the
            reference map. Sized with the generic (unsolved, provisional)
            label token — no target string was measured for these. */}
        <span className="absolute text-label text-blue" style={{ left: INSET, bottom: 60 }}>
          Oakland
        </span>
        <span className="absolute text-label text-blue" style={{ right: INSET, bottom: 60 }}>
          Campus
        </span>
      </div>

      {/* Floating UI stays fixed to the panel's corners — it doesn't pan with the map content. */}
      {!weatherDismissed && !weather.loading ? (
        <div className="absolute" style={{ left: INSET, top: INSET }}>
          <Chip
            icon={weather.icon === "sun" ? <SunIcon className="h-4 w-4" /> : <CloudIcon className="h-4 w-4" />}
            label={weather.label}
            onDismiss={onDismissWeather}
          />
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
          onClick={() => {
            setLocatedAtOrigin(true);
            mapRef.current?.flyTo(location.lat, location.lng);
          }}
        />
      </div>
    </div>
  );
}

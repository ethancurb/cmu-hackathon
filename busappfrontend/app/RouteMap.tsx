"use client";

import { useRef, useState } from "react";
import { Chip } from "@/components/Chip";
import { IconToggle } from "@/components/IconToggle";
import { CloudIcon, SunIcon, ChatIcon, CrosshairIcon, StatsIcon } from "@/components/icons/filled";
import type { RouteId } from "@/lib/mock-data";
import type { ViewMode } from "@/lib/app-context";
import { useDeviceLocation } from "@/lib/geolocation";
import { useWeather } from "@/lib/weather";
import { ViewToggle } from "./ViewToggle";
import { MapCanvas, type Destination, type EventMarker, type MapCanvasHandle } from "./MapCanvas";

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
  /** Scenario origin; when null the rider's device location (or CMU fallback) is used. */
  origin?: Destination;
  /** Scenario weather chip; when null the live Open-Meteo reading is shown. */
  weatherOverride?: { label: string; icon: "sun" | "cloud" } | null;
  /** Venue of the event currently driving pressure, if any. */
  eventMarker?: EventMarker;
  weatherDismissed: boolean;
  onDismissWeather: () => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
};

export function RouteMap({
  activeRouteId,
  onSelectRoute,
  destination,
  origin = null,
  weatherOverride = null,
  eventMarker = null,
  weatherDismissed,
  onDismissWeather,
  viewMode,
  onSetViewMode,
}: RouteMapProps) {
  const device = useDeviceLocation();
  const location = origin ?? device;
  const liveWeather = useWeather(location.lat, location.lng);
  const weather = weatherOverride ? { ...weatherOverride, loading: false, error: false } : liveWeather;
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
          eventMarker={eventMarker}
          onNearestRoute={onSelectRoute}
        />

        {/* Map annotations: neighborhood labels, as shown directly on the
            reference map. Sized with the generic (unsolved, provisional)
            label token — no target string was measured for these. */}
        {!destination && !origin ? (
          <>
            <span className="absolute text-label text-blue" style={{ left: INSET, bottom: 60 }}>
              Oakland
            </span>
            <span className="absolute text-label text-blue" style={{ right: INSET, bottom: 60 }}>
              Campus
            </span>
          </>
        ) : null}
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

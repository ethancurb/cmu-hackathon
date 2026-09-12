"use client";

import { useRef } from "react";
import { Chip } from "@/components/Chip";
import { IconToggle } from "@/components/IconToggle";
import { CloudIcon, SunIcon, ChatIcon, CrosshairIcon, StatsIcon } from "@/components/icons/filled";
import type { RouteId } from "@/lib/mock-data";
import type { ViewMode } from "@/lib/app-context";
import type { Journey } from "@/lib/journey/types";
import { useDeviceLocation } from "@/lib/geolocation";
import { useWeather } from "@/lib/weather";
import { ViewToggle } from "./ViewToggle";
import { MapCanvas, type Destination, type EventMarker, type MapCanvasHandle } from "./MapCanvas";

const MAP_HEIGHT = 340;
const INSET = 11; // 8px spec value × 1.354

const FOCUS_RING = "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

type RouteMapProps = {
  activeRouteId: RouteId;
  onSelectRoute: (id: RouteId) => void;
  destination: Destination;
  /** Manual or scenario origin; when null the rider's device location (or CMU fallback) is used. */
  origin?: Destination;
  /** Scenario weather chip; when null the live Open-Meteo reading is shown. */
  weatherOverride?: { label: string; icon: "sun" | "cloud" } | null;
  /** Venue of the event currently driving pressure, if any. */
  eventMarker?: EventMarker;
  /** Selected provider-backed itinerary, drawn on the map. */
  journey?: Journey | null;
  /** Opens the pressure timeline (the map's stats button). */
  onOpenTimeline?: () => void;
  /** Opens the chat planner (the map's chat button). */
  onOpenChat?: () => void;
  weatherDismissed: boolean;
  onDismissWeather: () => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
};

/** Compact square map control (zoom, fit): same border/fill treatment as
 * IconToggle at a smaller 36px size so three of them stack beside the map edge. */
function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded border border-border-soft bg-surface text-row-title font-bold text-ink-deep ${FOCUS_RING}`}
    >
      {children}
    </button>
  );
}

export function RouteMap({
  activeRouteId,
  onSelectRoute,
  destination,
  origin = null,
  weatherOverride = null,
  eventMarker = null,
  journey = null,
  onOpenTimeline,
  onOpenChat,
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

  return (
    <div
      className="relative w-full overflow-hidden rounded border border-border-soft bg-surface"
      style={{ height: MAP_HEIGHT }}
    >
      <div className="absolute inset-0">
        <MapCanvas
          ref={mapRef}
          lat={location.lat}
          lng={location.lng}
          activeRouteId={activeRouteId}
          destination={destination}
          eventMarker={eventMarker}
          journey={journey}
          onNearestRoute={onSelectRoute}
        />
      </div>

      {/* Floating UI stays fixed to the panel's corners; it does not pan with the map. */}
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

      {/* Camera controls: zoom in/out and fit the whole trip, stacked on the right edge. */}
      <div className="absolute flex flex-col" style={{ right: INSET, top: 84, gap: 3 }}>
        <MapButton label="Zoom in" onClick={() => mapRef.current?.zoomBy(1)}>
          +
        </MapButton>
        <MapButton label="Zoom out" onClick={() => mapRef.current?.zoomBy(-1)}>
          −
        </MapButton>
        <MapButton label="Fit route" onClick={() => mapRef.current?.fitTrip()}>
          <span className="block h-3 w-3 border border-ink-deep" aria-hidden />
        </MapButton>
      </div>

      {/* Utility buttons: chat + stats grouped bottom-left, locate alone bottom-right. */}
      <div className="absolute flex" style={{ left: INSET, bottom: INSET, gap: 3 }}>
        <IconToggle icon={<ChatIcon className="h-[22px] w-[22px]" />} label="Ask LoadLine" showIndicator={false} onClick={onOpenChat} />
        <IconToggle icon={<StatsIcon className="h-[22px] w-[22px]" />} label="Pressure timeline" showIndicator={false} onClick={onOpenTimeline} />
      </div>
      <div className="absolute" style={{ right: INSET, bottom: INSET }}>
        <IconToggle
          icon={<CrosshairIcon className="h-[22px] w-[22px]" />}
          label="Locate me"
          showIndicator={false}
          onClick={() => mapRef.current?.flyTo(location.lat, location.lng)}
        />
      </div>
    </div>
  );
}

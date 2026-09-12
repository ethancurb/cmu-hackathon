"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge } from "@/components/Badge";
import { BusIcon, PinIcon } from "@/components/icons/filled";
import type { RouteId } from "@/lib/mock-data";
import { GTFS_ROUTE_ID } from "@/lib/prt-routes";
import type { Journey, LatLng } from "@/lib/journey/types";
import type { VehiclePosition } from "@/lib/use-vehicle-positions";

export type MapCanvasHandle = {
  flyTo: (lat: number, lng: number) => void;
  /** Fits the whole selected journey (walking legs included) or, without one, origin + destination. */
  fitTrip: () => void;
  zoomBy: (delta: number) => void;
};

export type Destination = { lat: number; lng: number } | null;
export type EventMarker = { lat: number; lng: number; label: string } | null;

type MapCanvasProps = {
  lat: number;
  lng: number;
  activeRouteId: RouteId;
  destination?: Destination;
  /** The venue of the event driving Transit Pressure, when one is a major contributor. */
  eventMarker?: EventMarker;
  /** The selected provider-backed itinerary; drawn leg by leg when present. */
  journey?: Journey | null;
  /** Live PRT GPS positions for the routes currently relevant on screen —
   * real reported positions, never occupancy. */
  vehicles?: VehiclePosition[];
  onNearestRoute?: (routeId: RouteId) => void;
  zoom?: number;
};

// Free, key-free raster basemap: Esri's "World Light Gray Base" (built from
// OpenStreetMap and other public data), already a muted light-gray style
// close to this app's palette. See docs/ARCHITECTURE.md for the history of
// this choice and the z16 placeholder-tile gotcha.
const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      // No real imagery past z16 here: declaring the true max makes MapLibre
      // overzoom the last real tile instead of requesting a placeholder.
      maxzoom: 16,
      attribution: "Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community",
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#fcfbf7" } }, // --canvas
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: { "raster-contrast": -0.05 },
    },
  ],
};

const MAX_ZOOM = 17;
const FIT_PADDING = { top: 56, bottom: 64, left: 40, right: 40 };

/** Real PRT route geometry (`public/route-shapes.geojson`), see docs/ARCHITECTURE.md. */
type RouteFeature = {
  properties: { routeId: string; shortName: string; color: string };
  geometry: { coordinates: [number, number][] };
};

/** Real PRT stop locations (`public/stops.geojson`) — the same hand-curated,
 * GTFS-sourced set as `lib/prt-routes.ts`'s `NEARBY_STOPS`, with real lat/lng
 * added. Shown only as map context for the three tracked routes, never as a
 * claim about which stop a rider's own itinerary boards at (the selected
 * journey's own board/alight squares already cover that). */
type StopFeature = {
  properties: { stopId: string; name: string; routeId: RouteId };
  geometry: { coordinates: [number, number] };
};

const APP_ROUTE_IDS = Object.keys(GTFS_ROUTE_ID) as RouteId[];

const INACTIVE_BADGE_CLASS: Record<RouteId, string> = {
  "71": "bg-border text-on-ink",
  "61": "bg-border text-on-ink",
  "54": "bg-bar text-blue",
};

/** Nearest of the three tracked routes to a point (used only for the nearby
 * live-arrival cards; it is never a claim that the route reaches the destination). */
function nearestRouteId(lat: number, lng: number, shapes: RouteFeature[]): RouteId | null {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  let best: RouteId | null = null;
  let bestDist2 = Infinity;
  for (const feature of shapes) {
    const appRouteId = APP_ROUTE_IDS.find((id) => GTFS_ROUTE_ID[id] === feature.properties.routeId);
    if (!appRouteId) continue;
    for (const [pLng, pLat] of feature.geometry.coordinates) {
      const dLat = lat - pLat;
      const dLng = (lng - pLng) * cosLat;
      const dist2 = dLat * dLat + dLng * dLng;
      if (dist2 < bestDist2) {
        bestDist2 = dist2;
        best = appRouteId;
      }
    }
  }
  return best;
}

type Point = { x: number; y: number };
type ProjectedLeg = { path: string; mode: "WALK" | "TRANSIT"; board: Point | null; alight: Point | null; label: string | null };
type ProjectedVehicle = Point & { id: string; routeId: string; bearing: number | null; ageSeconds: number };
type ProjectedStop = Point & { stopId: string; name: string; routeId: RouteId };
type Projected = {
  paths: Partial<Record<RouteId, string>>;
  anchors: Partial<Record<RouteId, Point>>;
  origin: Point | null;
  destination: Point | null;
  event: Point | null;
  legs: ProjectedLeg[];
  vehicles: ProjectedVehicle[];
  stops: ProjectedStop[];
};

const EMPTY: Projected = { paths: {}, anchors: {}, origin: null, destination: null, event: null, legs: [], vehicles: [], stops: [] };

function journeyPoints(journey: Journey): LatLng[] {
  return journey.legs.flatMap((leg) => leg.geometry);
}

/**
 * Interactive MapLibre map (pan, pinch/scroll zoom with cooperative gestures so
 * the page still scrolls, no rotation) with real route lines, the rider's
 * origin, the destination pin, the event venue and the selected journey's legs
 * projected onto it as an SVG overlay. The overlay is re-projected on every
 * `move` frame so it tracks the basemap while dragging. The camera is only
 * moved by explicit calls (locate, fit) and when the journey or destination
 * changes — never on a data refresh — so exploring is not interrupted.
 */
export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(
  { lat, lng, activeRouteId, destination = null, eventMarker = null, journey = null, vehicles = [], onNearestRoute, zoom = 14 },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const shapesRef = useRef<RouteFeature[] | null>(null);
  const stopsRef = useRef<StopFeature[] | null>(null);
  const frameRef = useRef<number | null>(null);
  // True only while the rider is actively dragging/inertia-panning — vehicle
  // markers skip their glide transition then so they track the basemap
  // exactly instead of trailing behind it, and resume easing once the pan settles.
  const panningRef = useRef(false);
  const [projected, setProjected] = useState<Projected>(EMPTY);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // MapLibre handlers are registered once; they read the latest props from a ref.
  const latestRef = useRef({ lat, lng, destination, eventMarker, journey, vehicles, onNearestRoute });
  latestRef.current = { lat, lng, destination, eventMarker, journey, vehicles, onNearestRoute };

  const fitTo = (points: LatLng[]) => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    const bounds = new maplibregl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat]);
    for (const p of points) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: 16, duration: 700 });
  };

  const fitTrip = () => {
    const { journey: cur, lat: curLat, lng: curLng, destination: curDest } = latestRef.current;
    if (cur) return fitTo(journeyPoints(cur));
    if (curDest) return fitTo([{ lat: curLat, lng: curLng }, curDest]);
    mapRef.current?.flyTo({ center: [curLng, curLat], zoom, duration: 600 });
  };

  useImperativeHandle(ref, () => ({
    flyTo: (nextLat, nextLng) => {
      mapRef.current?.flyTo({ center: [nextLng, nextLat], duration: 600 });
    },
    fitTrip,
    zoomBy: (delta) => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ zoom: Math.max(9, Math.min(MAX_ZOOM, map.getZoom() + delta)), duration: 250 });
    },
  }));

  const recompute = () => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container || !map.isStyleLoaded()) return;
    const { lat: curLat, lng: curLng, destination: curDestination, eventMarker: curEvent, journey: curJourney, vehicles: curVehicles } = latestRef.current;
    const shapes = shapesRef.current ?? [];

    const w = container.clientWidth;
    const h = container.clientHeight;
    const paths: Projected["paths"] = {};
    const anchors: Projected["anchors"] = {};

    // The three tracked route lines are context for the "next bus near CMU"
    // cards; once a real itinerary is selected they step aside so the journey reads clearly.
    if (!curJourney) {
      for (const feature of shapes) {
        const appRouteId = APP_ROUTE_IDS.find((id) => GTFS_ROUTE_ID[id] === feature.properties.routeId);
        if (!appRouteId) continue;
        const screenPoints = feature.geometry.coordinates.map(([pLng, pLat]) => map.project([pLng, pLat]));
        paths[appRouteId] = screenPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
        const inView = screenPoints.filter((p) => p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h);
        if (inView.length === 0) continue;
        let best = inView[0];
        let bestDist = Infinity;
        for (const p of inView) {
          const dist = (p.x - w / 2) ** 2 + (p.y - h / 2) ** 2;
          if (dist < bestDist) {
            bestDist = dist;
            best = p;
          }
        }
        anchors[appRouteId] = { x: best.x, y: best.y };
      }
    }

    const legs: ProjectedLeg[] = (curJourney?.legs ?? []).map((leg) => {
      const pts = leg.geometry.map((p) => map.project([p.lng, p.lat]));
      const board = leg.mode !== "WALK" ? map.project([leg.from.lng, leg.from.lat]) : null;
      const alight = leg.mode !== "WALK" ? map.project([leg.to.lng, leg.to.lat]) : null;
      return {
        path: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
        mode: leg.mode === "WALK" ? "WALK" : "TRANSIT",
        board: board ? { x: board.x, y: board.y } : null,
        alight: alight ? { x: alight.x, y: alight.y } : null,
        label: leg.mode === "WALK" ? null : leg.routeShortName ?? leg.mode,
      };
    });

    const originPoint = map.project([curLng, curLat]);
    const destinationPoint = curDestination ? map.project([curDestination.lng, curDestination.lat]) : null;
    const eventPoint = curEvent ? map.project([curEvent.lng, curEvent.lat]) : null;
    const vehiclePoints = curVehicles.map((v) => {
      const p = map.project([v.lng, v.lat]);
      return { x: p.x, y: p.y, id: v.id, routeId: v.routeId, bearing: v.bearing, ageSeconds: v.ageSeconds };
    });
    // Same "step aside once a real itinerary is selected" rule as the tracked
    // route lines above: stop context is for browsing the three tracked
    // routes, not a claim about the rider's own selected trip.
    const stopPoints = curJourney
      ? []
      : (stopsRef.current ?? []).map((s) => {
          const p = map.project(s.geometry.coordinates);
          return { x: p.x, y: p.y, stopId: s.properties.stopId, name: s.properties.name, routeId: s.properties.routeId };
        });
    setProjected({
      paths,
      anchors,
      origin: { x: originPoint.x, y: originPoint.y },
      destination: destinationPoint ? { x: destinationPoint.x, y: destinationPoint.y } : null,
      event: eventPoint ? { x: eventPoint.x, y: eventPoint.y } : null,
      legs,
      vehicles: vehiclePoints,
      stops: stopPoints,
    });
  };

  // Coalesces `move` events (fired per animation frame while dragging) into one projection per frame.
  const scheduleRecompute = () => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      recompute();
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [lng, lat],
      zoom,
      maxZoom: MAX_ZOOM,
      attributionControl: false,
      // Interactive, but the page keeps scrolling: plain wheel scrolls the page
      // (Ctrl/⌘ + wheel zooms) and one finger scrolls on touch (two fingers pan/zoom).
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    map.on("load", recompute);
    map.on("movestart", () => {
      panningRef.current = true;
    });
    map.on("move", scheduleRecompute);
    map.on("moveend", () => {
      panningRef.current = false;
      recompute();
    });

    fetch("/route-shapes.geojson")
      .then((res) => res.json())
      .then((geojson: { features: RouteFeature[] }) => {
        shapesRef.current = geojson.features;
        recompute();
        const pendingDestination = latestRef.current.destination;
        if (pendingDestination) {
          const nearest = nearestRouteId(pendingDestination.lat, pendingDestination.lng, geojson.features);
          if (nearest) latestRef.current.onNearestRoute?.(nearest);
        }
      })
      .catch(() => {
        // Route overlay stays empty (basemap alone still renders) rather
        // than showing stale or invented route lines.
      });

    fetch("/stops.geojson")
      .then((res) => res.json())
      .then((geojson: { features: StopFeature[] }) => {
        stopsRef.current = geojson.features;
        recompute();
      })
      .catch(() => {
        // Stop markers stay empty — same honest degrade as the route overlay.
      });

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
      map.resize();
      recompute();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // Initialize once; later updates go through the effects below. `recompute`
    // reads fresh props via `latestRef`, so it is safe for it to be stale here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A resolved device location arriving after mount recenters the map only
  // while nothing else (destination/journey) has claimed the viewport.
  useEffect(() => {
    if (!latestRef.current.destination && !latestRef.current.journey) mapRef.current?.setCenter([lng, lat]);
    else recompute();
  }, [lat, lng]);

  // A marker arriving or leaving after a pressure refresh needs a re-projection
  // even though the camera has not moved.
  useEffect(() => {
    recompute();
  }, [eventMarker?.lat, eventMarker?.lng]);

  // Vehicles move between polls without the camera moving; a plain array
  // identity check would miss in-place position updates, so key off a
  // cheap fingerprint of what actually changes.
  const vehiclesKey = vehicles.map((v) => `${v.id}:${v.lat.toFixed(5)},${v.lng.toFixed(5)}`).join("|");
  useEffect(() => {
    recompute();
  }, [vehiclesKey]);

  // A newly picked destination (without a journey yet): fit both points and
  // report which tracked route passes nearest to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination) return;
    if (!latestRef.current.journey) fitTo([{ lat, lng }, destination]);
    const shapes = shapesRef.current;
    if (shapes) {
      const nearest = nearestRouteId(destination.lat, destination.lng, shapes);
      if (nearest) onNearestRoute?.(nearest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination?.lat, destination?.lng]);

  // A different journey: fit it once (walking legs included), then leave the camera alone.
  const journeyKey = journey?.id ?? null;
  useEffect(() => {
    if (journey) fitTo(journeyPoints(journey));
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyKey]);

  return (
    <div className="absolute inset-0" aria-label="Interactive map of your trip">
      <div ref={containerRef} className="h-full w-full" />

      {size.w > 0 ? (
        <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
          {APP_ROUTE_IDS.map((routeId) => {
            const d = projected.paths[routeId];
            if (!d) return null;
            const active = routeId === activeRouteId;
            return (
              <path
                key={routeId}
                d={d}
                fill="none"
                stroke={active ? "var(--ink-deep)" : routeId === "54" ? "var(--bar)" : "var(--border)"}
                strokeWidth={active ? 3 : 2}
                strokeDasharray={active ? undefined : routeId === "54" ? "1 5" : "7 5"}
                strokeLinecap="round"
              />
            );
          })}
          {projected.legs.map((leg, i) => (
            <path
              key={i}
              d={leg.path}
              fill="none"
              stroke={leg.mode === "WALK" ? "var(--blue)" : "var(--ink-deep)"}
              strokeWidth={leg.mode === "WALK" ? 3 : 5}
              strokeDasharray={leg.mode === "WALK" ? "2 6" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {projected.stops.map((s) => (
            <circle
              key={s.stopId}
              cx={s.x}
              cy={s.y}
              r={3.5}
              fill="var(--surface)"
              stroke="var(--border-soft)"
              strokeWidth={1.5}
            >
              <title>{`${s.name} · Route ${s.routeId} stop`}</title>
            </circle>
          ))}
          {projected.legs.map((leg, i) =>
            leg.board && leg.alight ? (
              <g key={`stops-${i}`}>
                <rect x={leg.board.x - 5} y={leg.board.y - 5} width={10} height={10} fill="var(--surface)" stroke="var(--ink-deep)" strokeWidth={2} />
                <rect x={leg.alight.x - 5} y={leg.alight.y - 5} width={10} height={10} fill="var(--ink-deep)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            ) : null,
          )}
          {projected.vehicles.map((v) => (
            <g
              key={v.id}
              className={
                panningRef.current
                  ? undefined
                  : "transition-transform duration-700 ease-out motion-reduce:transition-none motion-reduce:duration-0"
              }
              style={{ transform: `translate(${v.x}px, ${v.y}px)` }}
            >
              <title>{`Route ${v.routeId} · live GPS position · updated ${v.ageSeconds}s ago`}</title>
              {/* Soft static halo reads as "live" without an attention-grabbing pulse. */}
              <circle r={9} fill="var(--ink-deep)" opacity={0.08} />
              {/* Small top-down bus, cartoon-simple like a rideshare-app car marker:
                  a rounded body with a bright windshield "face" toward the direction
                  of travel and a dimmer rear window. Faces north (unrotated) when the
                  feed has no bearing for this vehicle. */}
              <g transform={v.bearing !== null ? `rotate(${v.bearing})` : undefined}>
                <rect x={-4} y={-6.5} width={8} height={13} rx={2.2} fill="var(--ink-deep)" stroke="var(--surface)" strokeWidth={1.2} />
                <rect x={-2.6} y={-5.1} width={5.2} height={2.6} rx={1} fill="var(--surface)" />
                <rect x={-2.6} y={3.6} width={5.2} height={1.6} rx={0.8} fill="var(--surface)" opacity={0.55} />
              </g>
            </g>
          ))}
          {projected.origin ? (
            <circle cx={projected.origin.x} cy={projected.origin.y} r={7} fill="var(--surface)" stroke="var(--blue)" strokeWidth={3} />
          ) : null}
        </svg>
      ) : null}

      {projected.legs.map((leg, i) =>
        leg.board && leg.label ? (
          <div key={`badge-${i}`} className="pointer-events-none absolute -translate-y-full" style={{ left: leg.board.x + 8, top: leg.board.y - 4 }}>
            <Badge label={leg.label} />
          </div>
        ) : null,
      )}

      {projected.event && eventMarker ? (
        <div
          className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: projected.event.x, top: projected.event.y }}
          aria-label={`Event venue: ${eventMarker.label}`}
        >
          <span className="block h-[11px] w-[11px] rotate-45 border border-surface" style={{ background: "var(--pressure-surge)" }} />
          <span className="mt-[2px] whitespace-nowrap bg-surface px-1 text-footnote text-blue" style={{ lineHeight: 1.2 }}>
            {eventMarker.label}
          </span>
        </div>
      ) : null}

      {projected.destination ? (
        <PinIcon
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-full"
          style={{ left: projected.destination.x, top: projected.destination.y }}
        />
      ) : null}

      {APP_ROUTE_IDS.map((routeId) => {
        const anchor = projected.anchors[routeId];
        if (!anchor) return null;
        const active = routeId === activeRouteId;
        return (
          <div key={routeId} className="pointer-events-none absolute flex items-center gap-1" style={{ left: anchor.x, top: anchor.y }}>
            <BusIcon className="h-4 w-4" />
            {active ? (
              <Badge label={routeId} />
            ) : (
              <span
                className={`inline-flex items-center justify-center rounded px-2 py-[3px] text-row-title font-bold ${INACTIVE_BADGE_CLASS[routeId]}`}
              >
                {routeId}
              </span>
            )}
          </div>
        );
      })}

      {/* Required tile + route-data attribution. PRT's Developer License
       * Agreement requires the exact sentence in `title` for derivative works. */}
      <span
        className="pointer-events-none absolute text-footnote text-blue opacity-footnote"
        style={{ left: 0, right: 0, bottom: 34, textAlign: "center" }}
        title="Reproduced with permission granted by Port Authority of Allegheny County (PAAC). The information has been provided by means of a nonexclusive, limited, and revocable license granted by PAAC."
      >
        Map data © Esri, OpenStreetMap contributors · Routes via PRT · Itinerary via Transitous
      </span>
    </div>
  );
});

"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge } from "@/components/Badge";
import { BusIcon, PinIcon } from "@/components/icons/filled";
import type { RouteId } from "@/lib/mock-data";
import { GTFS_ROUTE_ID } from "@/lib/prt-routes";

export type MapCanvasHandle = {
  flyTo: (lat: number, lng: number) => void;
};

export type Destination = { lat: number; lng: number } | null;

type MapCanvasProps = {
  lat: number;
  lng: number;
  activeRouteId: RouteId;
  destination?: Destination;
  onNearestRoute?: (routeId: RouteId) => void;
  zoom?: number;
};

// Free, key-free raster basemap: Esri's "World Light Gray Base" (built from
// OpenStreetMap and other public data), already a muted light-gray style
// close to this app's palette. CARTO's equivalent free tiles were tried
// first but now return a "API key required" watermark — that free tier has
// since been gated. Vector tiles (OpenFreeMap) were tried before that for
// full per-layer recoloring, but their worker-based tile pipeline didn't
// come up reliably in this dev sandbox; raster has no such dependency and
// is the more robust choice for a live demo either way.
const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      // This service has no real imagery past z16 here — it returns a
      // placeholder tile with "Map data not yet available" baked into the
      // pixels instead of an error. Declaring the true max makes MapLibre
      // overzoom (scale up) the last real tile for closer views rather
      // than requesting one that doesn't exist.
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

/** Real PRT route geometry (`public/route-shapes.geojson`), extracted from
 * PRT's published GTFS static feed (rideprt.org/developerresources/GTFS.zip
 * — key-free, license permits redistribution with attribution). One
 * LineString per route: the fullest shape actually used by a scheduled trip
 * on that route, per PRT's June 2026 feed. Loaded as plain GeoJSON and
 * projected to screen pixels by hand (see `project()` below) rather than
 * added as a MapLibre GeoJSON *source* — that path goes through the same
 * worker pipeline that silently failed to render vector tiles in this
 * sandbox, so hand-projecting avoids depending on Workers at all. */
type RouteFeature = {
  properties: { routeId: string; shortName: string; color: string };
  geometry: { coordinates: [number, number][] };
};

const APP_ROUTE_IDS = Object.keys(GTFS_ROUTE_ID) as RouteId[];

const INACTIVE_BADGE_CLASS: Record<RouteId, string> = {
  "71": "bg-border text-on-ink",
  "61": "bg-border text-on-ink",
  "54": "bg-bar text-blue",
};

/** Nearest of our three tracked routes to a point, by minimum distance to
 * any vertex of its real geometry. A flat equirectangular approximation is
 * fine here — points are all within a few km, and this only needs to rank
 * three routes against each other, not report a real distance. */
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
type Projected = {
  paths: Partial<Record<RouteId, string>>;
  anchors: Partial<Record<RouteId, Point>>;
  origin: Point | null;
  destination: Point | null;
};

/** Static, non-interactive MapLibre backdrop centered on a real coordinate,
 * with real route lines, a "you are here" marker, and (once a destination
 * is searched) a real destination pin — all projected onto it by hand.
 * Non-interactive on purpose: nothing here needs panning/zooming for a
 * small map card, and it keeps the projected overlay in sync with the
 * basemap without having to re-project on every drag frame. Recentering
 * happens only via `flyTo` (wired to the "Locate me" button), a
 * resolved-location update, or a newly picked destination (fits both
 * points in view). */
export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(
  { lat, lng, activeRouteId, destination = null, onNearestRoute, zoom = 14 },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const shapesRef = useRef<RouteFeature[] | null>(null);
  const [projected, setProjected] = useState<Projected>({ paths: {}, anchors: {}, origin: null, destination: null });
  const [size, setSize] = useState({ w: 0, h: 0 });

  // `recompute`/`onNearestRoute` are registered as MapLibre event handlers
  // exactly once (see the mount effect below) and must not go stale across
  // re-renders, so the latest props live in a ref rather than a closure —
  // otherwise a `moveend` firing long after mount would re-project using
  // whatever lat/lng/destination happened to be current at mount time.
  const latestRef = useRef({ lat, lng, destination, onNearestRoute });
  latestRef.current = { lat, lng, destination, onNearestRoute };

  useImperativeHandle(ref, () => ({
    flyTo: (nextLat, nextLng) => {
      mapRef.current?.flyTo({ center: [nextLng, nextLat], duration: 600 });
    },
  }));

  const recompute = () => {
    const map = mapRef.current;
    const shapes = shapesRef.current;
    const container = containerRef.current;
    if (!map || !shapes || !container || !map.isStyleLoaded()) return;
    const { lat: curLat, lng: curLng, destination: curDestination } = latestRef.current;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const paths: Projected["paths"] = {};
    const anchors: Projected["anchors"] = {};

    for (const feature of shapes) {
      const appRouteId = APP_ROUTE_IDS.find((id) => GTFS_ROUTE_ID[id] === feature.properties.routeId);
      if (!appRouteId) continue;

      const screenPoints = feature.geometry.coordinates.map(([pLng, pLat]) => map.project([pLng, pLat]));
      paths[appRouteId] = screenPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

      const inView = screenPoints.filter((p) => p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h);
      if (inView.length === 0) continue;
      const cx = w / 2;
      const cy = h / 2;
      let best = inView[0];
      let bestDist = Infinity;
      for (const p of inView) {
        const dist = (p.x - cx) ** 2 + (p.y - cy) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      anchors[appRouteId] = { x: best.x, y: best.y };
    }

    const originPoint = map.project([curLng, curLat]);
    const destinationPoint = curDestination ? map.project([curDestination.lng, curDestination.lat]) : null;
    setProjected({
      paths,
      anchors,
      origin: { x: originPoint.x, y: originPoint.y },
      destination: destinationPoint ? { x: destinationPoint.x, y: destinationPoint.y } : null,
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: [lng, lat],
      zoom,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on("load", recompute);
    map.on("moveend", recompute);

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

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
      map.resize();
      recompute();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // Initialize once; later position/destination updates go through
    // setCenter/fitBounds below rather than tearing down and recreating the
    // map instance. `recompute` reads fresh props via `latestRef`, not this
    // closure, so it's safe for it to be stale here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A resolved device location arriving after mount (geolocation is async)
  // recenters the already-created map; `moveend` above re-projects onto it
  // using latestRef, so it picks up the new lat/lng correctly.
  useEffect(() => {
    mapRef.current?.setCenter([lng, lat]);
  }, [lat, lng]);

  // A newly picked destination: fit both points in view (visibly "updates
  // the route") and report which tracked route passes nearest to it. Keyed
  // on the coordinate values, not object identity, so this doesn't refire
  // on unrelated re-renders that happen to create a new destination object.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !destination) return;

    const bounds = new maplibregl.LngLatBounds([lng, lat], [lng, lat]);
    bounds.extend([destination.lng, destination.lat]);
    map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 800 });

    const shapes = shapesRef.current;
    if (shapes) {
      const nearest = nearestRouteId(destination.lat, destination.lng, shapes);
      if (nearest) onNearestRoute?.(nearest);
    }
    // Shapes not loaded yet: the fetch handler above checks latestRef for a
    // pending destination once they arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination?.lat, destination?.lng]);

  return (
    <div className="absolute inset-0" role="img" aria-label="Map centered on your current area">
      <div ref={containerRef} className="h-full w-full" />

      {size.w > 0 ? (
        <svg className="absolute inset-0" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
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
          {projected.origin ? (
            <circle cx={projected.origin.x} cy={projected.origin.y} r={7} fill="var(--surface)" stroke="var(--blue)" strokeWidth={3} />
          ) : null}
        </svg>
      ) : null}

      {projected.destination ? (
        <PinIcon
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-full"
          style={{ left: projected.destination.x, top: projected.destination.y }}
        />
      ) : null}

      {APP_ROUTE_IDS.map((routeId) => {
        const anchor = projected.anchors[routeId];
        if (!anchor) return null;
        const active = routeId === activeRouteId;
        return (
          <div key={routeId} className="absolute flex items-center gap-1" style={{ left: anchor.x, top: anchor.y }}>
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

      {/* Required tile + route-data attribution, styled with the app's own
       * footnote token rather than MapLibre's default control (which
       * doesn't collapse to a compact form at this container width and
       * crowds the utility icons). PRT's Developer License Agreement
       * requires the exact sentence below for derivative works; it's kept
       * in `title` since the visible label truncates at this width. */}
      <span
        className="absolute text-footnote text-blue opacity-footnote"
        style={{ left: 0, right: 0, bottom: 34, textAlign: "center" }}
        title="Reproduced with permission granted by Port Authority of Allegheny County (PAAC). The information has been provided by means of a nonexclusive, limited, and revocable license granted by PAAC."
      >
        Map data © Esri, OpenStreetMap contributors · Routes via PRT
      </span>
    </div>
  );
});

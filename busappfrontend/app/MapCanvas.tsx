"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge } from "@/components/Badge";
import { BusIcon } from "@/components/icons/filled";
import type { RouteId } from "@/lib/mock-data";

export type MapCanvasHandle = {
  flyTo: (lat: number, lng: number) => void;
};

type MapCanvasProps = {
  lat: number;
  lng: number;
  activeRouteId: RouteId;
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

// The app's mock route IDs (71/61/54) map onto PRT's real GTFS route_ids.
// Neither "71" nor "61" exists as a bare route in PRT's current system —
// only lettered branches do (71A-D, 61A-D). Checked each branch's distance
// from CMU (40.4443, -79.9428) against the June 2026 GTFS feed: bare "71"
// passes ~4.1km away (Edgewood/Wilkinsburg, nowhere near Oakland) so it was
// swapped for 71D, which comes within ~340m; all four 61-branches pass
// within ~35m of campus (shared Forbes Ave trunk) so 61A was kept. "54"
// (North Side–Oakland–South Side) is a real bare route and comes within
// ~600m, so it's used as-is. Flag if the team meant a different branch.
const GTFS_ROUTE_ID: Record<RouteId, string> = { "71": "71D", "61": "61A", "54": "54" };

const INACTIVE_BADGE_CLASS: Record<RouteId, string> = {
  "71": "bg-border text-on-ink",
  "61": "bg-border text-on-ink",
  "54": "bg-bar text-blue",
};

type Point = { x: number; y: number };
type Projected = { paths: Partial<Record<RouteId, string>>; anchors: Partial<Record<RouteId, Point>>; origin: Point | null };

/** Static, non-interactive MapLibre backdrop centered on a real coordinate,
 * with real route lines and a real "you are here" marker projected onto it
 * by hand. Non-interactive on purpose: nothing here needs panning/zooming
 * for a small map card, and it keeps the projected overlay in sync with the
 * basemap without having to re-project on every drag frame. Recentering
 * happens only via `flyTo` (wired to the "Locate me" button) or a
 * resolved-location update. */
export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(
  { lat, lng, activeRouteId, zoom = 14 },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const shapesRef = useRef<RouteFeature[] | null>(null);
  const [projected, setProjected] = useState<Projected>({ paths: {}, anchors: {}, origin: null });
  const [size, setSize] = useState({ w: 0, h: 0 });

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

    const w = container.clientWidth;
    const h = container.clientHeight;
    const paths: Projected["paths"] = {};
    const anchors: Projected["anchors"] = {};

    for (const feature of shapes) {
      const appRouteId = (Object.keys(GTFS_ROUTE_ID) as RouteId[]).find(
        (id) => GTFS_ROUTE_ID[id] === feature.properties.routeId
      );
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

    const originPoint = map.project([lng, lat]);
    setProjected({ paths, anchors, origin: { x: originPoint.x, y: originPoint.y } });
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
    // Initialize once; later position updates go through setCenter/flyTo
    // below rather than tearing down and recreating the map instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A resolved device location arriving after mount (geolocation is async)
  // recenters the already-created map; `moveend` above re-projects onto it.
  useEffect(() => {
    mapRef.current?.setCenter([lng, lat]);
  }, [lat, lng]);

  return (
    <div className="absolute inset-0" role="img" aria-label="Map centered on your current area">
      <div ref={containerRef} className="h-full w-full" />

      {size.w > 0 ? (
        <svg className="absolute inset-0" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
          {(Object.keys(GTFS_ROUTE_ID) as RouteId[]).map((routeId) => {
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

      {(Object.keys(GTFS_ROUTE_ID) as RouteId[]).map((routeId) => {
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

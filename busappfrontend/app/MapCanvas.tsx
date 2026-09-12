"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapCanvasHandle = {
  flyTo: (lat: number, lng: number) => void;
};

type MapCanvasProps = {
  lat: number;
  lng: number;
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

/** Static, non-interactive MapLibre backdrop centered on a real coordinate.
 * Non-interactive on purpose: the route/badge overlay drawn on top of this
 * in RouteMap.tsx is pixel-anchored illustration, not geo-anchored, so
 * letting a rider pan/zoom the live basemap underneath it would desync the
 * two. Recentering happens only via `flyTo` (wired to the "Locate me"
 * button) or a resolved-location update. */
export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas({ lat, lng, zoom = 15 }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (nextLat, nextLng) => {
      mapRef.current?.flyTo({ center: [nextLng, nextLat], duration: 600 });
    },
  }));

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

    const resizeObserver = new ResizeObserver(() => map.resize());
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
  // recenters the already-created map rather than waiting for a remount.
  useEffect(() => {
    mapRef.current?.setCenter([lng, lat]);
  }, [lat, lng]);

  // MapLibre's own stylesheet sets `.maplibregl-map { position: relative }`
  // on whatever element it's attached to, which collides with Tailwind's
  // `absolute inset-0` on that same element (same specificity — whichever
  // stylesheet loads last wins — and collapses it to 0 height). An outer
  // wrapper handles the absolute positioning instead; the inner plain div is
  // the one MapLibre takes over.
  return (
    <div className="absolute inset-0" role="img" aria-label="Map centered on your current area">
      <div ref={containerRef} className="h-full w-full" />
      {/* Required tile attribution, styled with the app's own footnote token
       * rather than MapLibre's default control (which doesn't collapse to a
       * compact form at this container width and crowds the utility icons). */}
      <span
        className="absolute text-footnote text-blue opacity-footnote"
        style={{ left: 0, right: 0, bottom: 34, textAlign: "center" }}
      >
        Map data © Esri, OpenStreetMap contributors
      </span>
    </div>
  );
});

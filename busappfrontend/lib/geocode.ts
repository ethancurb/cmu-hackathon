"use client";

import { useEffect, useState } from "react";

export type AddressResult = { label: string; lat: number; lng: number; distanceMi: number | null };
export type NearPoint = { lat: number; lng: number };

// Photon (komoot) — free, key-free geocoding built from OpenStreetMap data,
// explicitly designed for autocomplete-style search boxes (unlike Nominatim,
// which discourages typeahead use), and — since it indexes OSM points of
// interest, not just addresses — the same endpoint already returns named
// businesses (a "Starbucks" query returns real cafes, not just streets).
// Public demo instance: "extensive usage will be throttled," no hard
// documented limit — the debounce in useAddressSearch below keeps this well
// under anything that would trigger that. Biased toward CMU/Oakland by
// default so a query like "Forbes" ranks the local street first rather than
// a same-named one elsewhere in the country.
const CMU_BIAS = { lat: 40.4443, lng: -79.9428 };
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;
const EARTH_RADIUS_MI = 3958.8;

/** Great-circle distance in miles — used only to sort/label results by
 * proximity, not to draw a route (routing stays with the existing
 * journey/mapping providers). */
function distanceMiles(a: NearPoint, b: NearPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  locality?: string;
  state?: string;
};

function formatLabel(p: PhotonProperties): string {
  const primary = [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
  // Neighborhood (locality) first: a long street can return several
  // same-named OSM way segments that only differ by which neighborhood
  // they're in — "Forbes Avenue, Pittsburgh" five times over is useless in
  // a dropdown, "Forbes Avenue, Oakland" vs "..., Squirrel Hill" isn't.
  const secondary = [p.locality ?? p.city, p.state].filter(Boolean).join(", ");
  if (primary && secondary && primary !== p.city) return `${primary}, ${secondary}`;
  return primary || secondary || "Unknown location";
}

export async function searchAddresses(query: string, signal?: AbortSignal, near?: NearPoint): Promise<AddressResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  // `near` both biases Photon's own ranking toward the rider's real location
  // (falling back to the CMU bias point when none is known yet) and is used
  // below to sort the returned page by actual distance — Photon's internal
  // relevance score still weighs name/type match, so a farther but stronger
  // text match can otherwise outrank a true nearest result.
  const bias = near ?? CMU_BIAS;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=8&lat=${bias.lat}&lon=${bias.lng}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);
  const data: { features: { properties: PhotonProperties; geometry: { coordinates: [number, number] } }[] } = await res.json();

  const results = data.features.map((f) => {
    const lat = f.geometry.coordinates[1];
    const lng = f.geometry.coordinates[0];
    return { label: formatLabel(f.properties), lat, lng, distanceMi: distanceMiles(bias, { lat, lng }) };
  });

  // Different OSM way segments of the same street can still produce the
  // same label (same street, same neighborhood) — dedupe rather than show
  // a rider indistinguishable repeats.
  const seen = new Set<string>();
  const deduped = results.filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true)));
  // Closest first: Photon's relevance ranking alone can put a stronger text
  // match ahead of a much nearer, equally valid one.
  return deduped.sort((a, b) => a.distanceMi - b.distanceMi).slice(0, 5);
}

/** Debounced address autocomplete. Returns an empty result set (not an
 * error state) for a too-short query — that's "nothing typed yet," not a
 * failed search. A real fetch failure is swallowed to an empty list too;
 * the search box has no room for a distinct error string, and a dropdown
 * that just doesn't appear is a reasonable degrade for a hackathon demo. */
export function useAddressSearch(query: string, near?: NearPoint) {
  const [rawResults, setRawResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const trimmed = query.trim();
  const tooShort = trimmed.length < MIN_QUERY_LENGTH;
  const nearLat = near?.lat;
  const nearLng = near?.lng;

  useEffect(() => {
    // Nothing to fetch — the hook derives an empty result below from
    // `tooShort` directly rather than clearing state here, so this early
    // return needs no setState call of its own.
    if (tooShort) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      searchAddresses(trimmed, controller.signal, nearLat !== undefined && nearLng !== undefined ? { lat: nearLat, lng: nearLng } : undefined)
        .then(setRawResults)
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          setRawResults([]);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, tooShort, nearLat, nearLng]);

  return { results: tooShort ? [] : rawResults, loading: tooShort ? false : loading };
}

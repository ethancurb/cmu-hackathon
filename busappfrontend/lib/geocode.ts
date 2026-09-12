"use client";

import { useEffect, useState } from "react";

export type AddressResult = { label: string; lat: number; lng: number };

// Photon (komoot) — free, key-free geocoding built from OpenStreetMap data,
// explicitly designed for autocomplete-style search boxes (unlike Nominatim,
// which discourages typeahead use). Public demo instance: "extensive usage
// will be throttled," no hard documented limit — the debounce in
// useAddressSearch below keeps this well under anything that would trigger
// that. Biased toward CMU/Oakland so a query like "Forbes" ranks the local
// street first rather than a same-named one elsewhere in the country.
const CMU_BIAS = { lat: 40.4443, lng: -79.9428 };
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

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

export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5&lat=${CMU_BIAS.lat}&lon=${CMU_BIAS.lng}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);
  const data: { features: { properties: PhotonProperties; geometry: { coordinates: [number, number] } }[] } = await res.json();

  const results = data.features.map((f) => ({
    label: formatLabel(f.properties),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));

  // Different OSM way segments of the same street can still produce the
  // same label (same street, same neighborhood) — dedupe rather than show
  // a rider indistinguishable repeats.
  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true)));
}

/** Debounced address autocomplete. Returns an empty result set (not an
 * error state) for a too-short query — that's "nothing typed yet," not a
 * failed search. A real fetch failure is swallowed to an empty list too;
 * the search box has no room for a distinct error string, and a dropdown
 * that just doesn't appear is a reasonable degrade for a hackathon demo. */
export function useAddressSearch(query: string) {
  const [rawResults, setRawResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const trimmed = query.trim();
  const tooShort = trimmed.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    // Nothing to fetch — the hook derives an empty result below from
    // `tooShort` directly rather than clearing state here, so this early
    // return needs no setState call of its own.
    if (tooShort) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      searchAddresses(trimmed, controller.signal)
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
  }, [trimmed, tooShort]);

  return { results: tooShort ? [] : rawResults, loading: tooShort ? false : loading };
}

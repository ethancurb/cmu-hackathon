"use client";

import { useEffect, useState } from "react";
import { PITTSBURGH_BOUNDS } from "@/lib/pressure/geo";

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
// Photon's lat/lon bias alone is too weak to beat a same-numbered address
// elsewhere in the country (e.g. "500 Craig St" returning Virginia/Indiana
// hits with zero Pittsburgh results in the top 8) — a hard bbox is what
// actually keeps results local. Reuses the same box the journey API already
// gates trip endpoints on (lib/pressure/geo.ts), so a picked address is
// always one the routing/pressure backend can actually serve.
const PHOTON_BBOX = `${PITTSBURGH_BOUNDS.lngMin},${PITTSBURGH_BOUNDS.latMin},${PITTSBURGH_BOUNDS.lngMax},${PITTSBURGH_BOUNDS.latMax}`;

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

/** A result carrying its own house number is a real address (or a POI with
 * one, which OSM tags the same way) — a bare street/locality/city hit with
 * no number is a much vaguer match. Only used to break ties between results
 * that already matched the query text — see `isRelevant` below — never to
 * override text relevance on its own, or an unrelated street a few blocks
 * over that happens to carry a matching house number would jump ahead of
 * the street the rider actually typed. */
function isAddressMatch(p: PhotonProperties): boolean {
  return !!p.housenumber;
}

// Generic enough to appear in nearly every street name — matching on these
// alone tells you nothing about which street the rider meant.
const STREET_SUFFIXES = new Set([
  "street", "st", "avenue", "ave", "road", "rd", "drive", "dr", "lane", "ln",
  "boulevard", "blvd", "way", "place", "pl", "court", "ct", "circle", "cir",
  "terrace", "ter", "highway", "hwy", "parkway", "pkwy", "square", "sq",
]);

/** The words in the query that actually identify *this* street or place —
 * everything else (a house number, "ave"/"st"/...) matches almost any
 * candidate and would defeat the point of checking relevance at all. */
function coreQueryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STREET_SUFFIXES.has(t) && !/^\d+$/.test(t));
}

/** Does this candidate's street/name actually contain a word the rider
 * typed? A query with no distinguishing word (just a number, or "5th ave")
 * can't be checked this way, so everything counts as relevant — the bbox
 * and distance sort still keep those results sane. This is what stops a
 * same-house-number match on a completely different street (real bug: "259
 * melwood ave" surfacing a "2545 Penn Ave" building 1.9 mi away ahead of
 * Melwood Avenue itself, 0.5 mi away) from outranking the street the rider
 * is actually typing. */
function isRelevant(p: PhotonProperties, coreTokens: string[]): boolean {
  if (coreTokens.length === 0) return true;
  const haystack = `${p.street ?? ""} ${p.name ?? ""}`.toLowerCase();
  return coreTokens.some((t) => haystack.includes(t));
}

function formatLabel(p: PhotonProperties): string {
  const address = [p.housenumber, p.street].filter(Boolean).join(" ");
  // A named POI (business, building, venue) with its own street address used
  // to lose the name entirely — formatLabel picked the address over `name`
  // whenever both existed, so searching "Carnegie Library of Pittsburgh"
  // surfaced only "4400 Forbes Avenue" with no way to confirm it was the
  // right building. Keep both when the name says more than the address
  // already does (skip it for a plain street segment where OSM sets `name`
  // to the street name itself, which would otherwise duplicate it).
  const name = p.name && !address.toLowerCase().includes(p.name.toLowerCase()) ? p.name : null;
  const primary = name && address ? `${name}, ${address}` : name || address;
  // Neighborhood (locality) first: a long street can return several
  // same-named OSM way segments that only differ by which neighborhood
  // they're in — "Forbes Avenue, Pittsburgh" five times over is useless in
  // a dropdown, "Forbes Avenue, Oakland" vs "..., Squirrel Hill" isn't.
  const secondary = [p.locality ?? p.city, p.state].filter(Boolean).join(", ");
  if (primary && secondary && primary !== p.city) return `${primary}, ${secondary}`;
  return primary || secondary || "Unknown location";
}

type PhotonFeature = { properties: PhotonProperties; geometry: { coordinates: [number, number] } };

async function fetchPhoton(q: string, bias: NearPoint, signal?: AbortSignal): Promise<PhotonFeature[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10` +
    `&lat=${bias.lat}&lon=${bias.lng}&location_bias_scale=0.8&zoom=14&bbox=${PHOTON_BBOX}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);
  const data: { features: PhotonFeature[] } = await res.json();
  return data.features;
}

// Photon's own parser tries to read a leading number as a house number and
// the rest as a complete street name — with a street name still half-typed
// ("259 melw") it finds no match at all and returns zero results, even
// though the street ("Melwood...") alone matches plenty. Without this retry
// the dropdown stays empty for every keystroke until the rider finishes the
// whole street name, instead of narrowing in as they type.
const LEADING_HOUSE_NUMBER = /^\d+\S*\s+(.+)/;

export async function searchAddresses(query: string, signal?: AbortSignal, near?: NearPoint): Promise<AddressResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  // `near` both biases Photon's own ranking toward the rider's real location
  // (falling back to the CMU bias point when none is known yet) and is used
  // below to sort the returned page by actual distance — Photon's internal
  // relevance score still weighs name/type match, so a farther but stronger
  // text match can otherwise outrank a true nearest result. `bbox` on top of
  // that hard-restricts Photon's own top-N pick to the service area: lat/lon
  // bias alone still lets an identical address elsewhere in the country (or
  // a same-named street in another state) crowd out every real Pittsburgh
  // result before distance sorting ever gets a say.
  const bias = near ?? CMU_BIAS;
  let features = await fetchPhoton(trimmed, bias, signal);
  if (features.length === 0) {
    const streetOnly = trimmed.match(LEADING_HOUSE_NUMBER)?.[1];
    if (streetOnly) features = await fetchPhoton(streetOnly, bias, signal);
  }

  const coreTokens = coreQueryTokens(trimmed);
  const results = features.map((f) => {
    const lat = f.geometry.coordinates[1];
    const lng = f.geometry.coordinates[0];
    return {
      label: formatLabel(f.properties),
      lat,
      lng,
      distanceMi: distanceMiles(bias, { lat, lng }),
      isAddress: isAddressMatch(f.properties),
      isRelevant: isRelevant(f.properties, coreTokens),
    };
  });

  // Different OSM way segments of the same street can still produce the
  // same label (same street, same neighborhood) — dedupe rather than show
  // a rider indistinguishable repeats.
  const seen = new Set<string>();
  const deduped = results.filter((r) => (seen.has(r.label) ? false : (seen.add(r.label), true)));
  // Text relevance comes first — a house number that happens to match on an
  // unrelated street must never outrank the street the rider actually typed
  // just for being an "address." Only within that relevant set do we then
  // prefer a real address over a bare street, and closest over farthest.
  // If nothing matched the query text at all (a bare number, or a query too
  // generic to check), fall back to ranking everything the same way rather
  // than showing an empty dropdown.
  const relevant = deduped.filter((r) => r.isRelevant);
  const pool = relevant.length > 0 ? relevant : deduped;
  return pool
    .sort((a, b) => Number(b.isAddress) - Number(a.isAddress) || a.distanceMi - b.distanceMi)
    .slice(0, 6)
    .map(({ label, lat, lng, distanceMi }) => ({ label, lat, lng, distanceMi }));
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

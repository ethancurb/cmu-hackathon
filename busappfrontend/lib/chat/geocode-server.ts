// Server-side place lookup for the chat planner (same Photon instance the
// address field uses; see lib/geocode.ts). Results outside the service area are dropped.
import { inPittsburgh } from "../pressure/geo.ts";
import type { ChatPlace } from "./types.ts";

const BIAS = { lat: 40.4406, lng: -79.9959 }; // downtown Pittsburgh

type PhotonFeature = { properties: { name?: string; street?: string; housenumber?: string; city?: string; locality?: string; state?: string }; geometry: { coordinates: [number, number] } };

export async function geocodePlaces(query: string, limit = 3): Promise<ChatPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(`${q} Pittsburgh`)}&limit=${limit + 2}&lat=${BIAS.lat}&lon=${BIAS.lng}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  const out: ChatPlace[] = [];
  for (const f of data.features ?? []) {
    const p = f.properties;
    const primary = [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
    const secondary = [p.locality ?? p.city, p.state].filter(Boolean).join(", ");
    const label = primary && secondary && primary !== p.city ? `${primary}, ${secondary}` : primary || secondary;
    const place = { label, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    if (!label || seen.has(label) || !inPittsburgh(place)) continue;
    seen.add(label);
    out.push(place);
    if (out.length >= limit) break;
  }
  return out;
}

import type { Point } from "./types.ts";

const EARTH_RADIUS_KM = 6371;
const RAD = Math.PI / 180;

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));

/** Great-circle distance in km. */
export function distanceKm(a: Point, b: Point): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLng = (b.lng - a.lng) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(clamp(h, 0, 1)));
}

/**
 * Distance in km from `point` to the straight corridor between `from` and `to`
 * (flat-plane approximation, fine at city scale). Without a destination this is
 * simply the distance to `from`. An event anywhere along the trip counts, not
 * only one at the boarding point.
 */
export function corridorDistanceKm(point: Point, from: Point, to?: Point | null): number {
  if (!to) return distanceKm(point, from);
  const kx = 111.32 * Math.cos(from.lat * RAD); // km per degree longitude here
  const ky = 110.57; // km per degree latitude
  const ax = (from.lng - point.lng) * kx, ay = (from.lat - point.lat) * ky;
  const bx = (to.lng - point.lng) * kx, by = (to.lat - point.lat) * ky;
  const dx = bx - ax, dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp(-(ax * dx + ay * dy) / lengthSq, 0, 1);
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(cx, cy);
}

/** Service area accepted by the API routes (roughly Allegheny County). */
export const PITTSBURGH_BOUNDS = { latMin: 40.25, latMax: 40.65, lngMin: -80.25, lngMax: -79.65 } as const;

export function inPittsburgh(p: Point): boolean {
  return p.lat >= PITTSBURGH_BOUNDS.latMin && p.lat <= PITTSBURGH_BOUNDS.latMax && p.lng >= PITTSBURGH_BOUNDS.lngMin && p.lng <= PITTSBURGH_BOUNDS.lngMax;
}

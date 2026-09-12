import type { LatLng } from "./types.ts";

/** Decodes a Google-style encoded polyline. MOTIS reports its `precision`
 * (7 for street geometry, 6 for some feeds); Google's classic format is 5. */
export function decodePolyline(encoded: string, precision = 5): LatLng[] {
  const factor = Math.pow(10, precision);
  const points: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      if (!Number.isFinite(byte) || byte < 0) throw new Error("Invalid polyline");
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      if (!Number.isFinite(byte) || byte < 0) throw new Error("Invalid polyline");
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    const point = { lat: lat / factor, lng: lng / factor };
    if (Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) throw new Error("Polyline out of range");
    points.push(point);
  }
  return points;
}

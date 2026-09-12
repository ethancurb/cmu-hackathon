import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const PUBLIC_FEED = 'https://truetime.portauthority.org/gtfsrt-bus/vehicles?debug=';
const knownLoads = new Set(['EMPTY', 'MANY_SEATS_AVAILABLE', 'FEW_SEATS_AVAILABLE',
  'STANDING_ROOM_ONLY', 'CRUSHED_STANDING_ROOM_ONLY', 'FULL',
  'NOT_ACCEPTING_PASSENGERS', 'NOT_BOARDABLE']);

function field(block, name, indent) {
  return block.match(new RegExp(`^${' '.repeat(indent)}${name}: ([^\\n]+)$`, 'm'))?.[1].trim() ?? null;
}
function quoted(block, name, indent) {
  try {
    const value = JSON.parse(field(block, name, indent));
    return typeof value === 'string' && value.trim() ? value : null;
  } catch { return null; }
}
function numeric(block, name, indent) {
  const value = field(block, name, indent);
  return value !== null && /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)
    && Number.isFinite(Number(value)) ? Number(value) : null;
}
function timestamp(seconds) {
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Diagnostic for PRT's observed pretty-printed debug format, not a protobuf decoder.
export function inspectFeed(input) {
  if (typeof input !== 'string' || input.length > 2_000_000) throw new Error('Invalid feed size or format.');
  const text = input.replaceAll('\r\n', '\n').trimEnd() + '\n';
  const header = text.match(/^header \{\n[\s\S]*?^\}\n/m);
  if (!header || header.index !== 0 || quoted(header[0], 'gtfs_realtime_version', 2) === null) {
    throw new Error('Expected the PRT GTFS-realtime debug feed, not HTML or binary data.');
  }
  let depth = 0;
  for (const char of text.replace(/"(?:\\.|[^"\\])*"/g, '')) {
    if (char === '{') depth++;
    if (char === '}' && --depth < 0) throw new Error('Malformed feed braces.');
  }
  if (depth !== 0) throw new Error('Truncated feed.');
  const body = text.slice(header[0].length);
  const pattern = /^entity \{\n[\s\S]*?^\}/gm;
  const entities = [...body.matchAll(pattern)].map(match => match[0]);
  if (body.replace(pattern, '').trim()) throw new Error('Unrecognized debug-feed formatting.');
  const vehicles = [];
  let invalidRecordCount = 0;
  for (const entity of entities) {
    const descriptor = entity.match(/^    vehicle \{\n[\s\S]*?^    \}/m)?.[0] ?? '';
    const vehicleId = quoted(descriptor, 'id', 6);
    const latitude = numeric(entity, 'latitude', 6);
    const longitude = numeric(entity, 'longitude', 6);
    if (!vehicleId || latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      invalidRecordCount++;
      continue;
    }
    const percentage = numeric(entity, 'occupancy_percentage', 4);
    vehicles.push({
      vehicleId, tripId: quoted(entity, 'trip_id', 6), routeId: quoted(entity, 'route_id', 6),
      latitude, longitude, positionUpdatedAt: timestamp(numeric(entity, 'timestamp', 4)),
      occupancyStatus: field(entity, 'occupancy_status', 4),
      occupancyPercentage: Number.isInteger(percentage) && percentage >= 0 ? percentage : null,
      occupancyObservedAt: null,
    });
  }
  return {
    source: PUBLIC_FEED,
    feedUpdatedAt: timestamp(numeric(header[0], 'timestamp', 2)),
    entityCount: entities.length, vehicleCount: vehicles.length, invalidRecordCount,
    occupancyStatusFieldCount: vehicles.filter(v => v.occupancyStatus !== null).length,
    occupancyPercentageFieldCount: vehicles.filter(v => v.occupancyPercentage !== null).length,
    vehiclesWithOccupancy: vehicles.filter(v => knownLoads.has(v.occupancyStatus) || v.occupancyPercentage !== null).length,
    vehicles,
  };
}

export async function probePublicFeed(fetcher = globalThis.fetch) {
  let response;
  let text;
  try {
    response = await fetcher(PUBLIC_FEED, {
      redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { Accept: 'text/plain', 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) throw new Error('HTTP failure');
    text = await response.text();
  } catch {
    throw new Error('PRT feed request failed or timed out. No capacity conclusion can be drawn.');
  }
  return { mode: 'live', fetchedAt: new Date().toISOString(), ...inspectFeed(text) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args[0] === '--help') {
      console.log('Usage: node scripts/probe-prt.mjs [--file saved-debug-feed.txt]\nUses the public PRT feed; no API key or npm install required.');
    } else {
      if (args.length && !(args.length === 2 && args[0] === '--file')) throw new Error('Use --help for usage.');
      const report = args.length
        ? { mode: 'file', ...inspectFeed(await readFile(args[1], 'utf8')) }
        : await probePublicFeed();
      console.log(JSON.stringify(report, null, 2));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

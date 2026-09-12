import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { inspectFeed, probePublicFeed } from './probe-prt.mjs';

// Synthetic records in PRT's published debug format, not live occupancy data.
const header = 'header {\n  gtfs_realtime_version: "2.0"\n  timestamp: 1789187233\n}\n';
const vehicle = (id, load = '') => `entity {
  id: "entity-${id}"
  vehicle {
    trip {
      trip_id: "trip-${id}"
      route_id: "71D"
    }
    position {
      latitude: 40.44
      longitude: -79.94
    }
    timestamp: 1789187220
    vehicle {
      id: "${id}"
    }
${load}  }
}
`;

test('separates physical buses on the same route and preserves missing occupancy', () => {
  const report = inspectFeed(header + vehicle('bus-one') + vehicle('bus-two'));
  assert.ok(report);
  assert.equal(report.vehicleCount, 2);
  assert.equal(report.feedUpdatedAt, '2026-09-12T04:27:13.000Z');
  assert.deepEqual(report.vehicles.map(v => [v.vehicleId, v.tripId, v.routeId]), [
    ['bus-one', 'trip-bus-one', '71D'], ['bus-two', 'trip-bus-two', '71D'],
  ]);
  assert.equal(report.vehiclesWithOccupancy, 0);
  assert.equal(report.vehicles[0].occupancyStatus, null);
  assert.equal(report.vehicles[0].occupancyPercentage, null);
  assert.equal(report.vehicles[0].occupancyObservedAt, null);
  assert.equal(report.vehicles[0].positionUpdatedAt, '2026-09-12T04:27:00.000Z');
});

test('only explicit fields supply occupancy; zero differs from absent', () => {
  const report = inspectFeed(header + vehicle('1', '    occupancy_status: FULL\n')
    + vehicle('2', '    occupancy_percentage: 0\n')
    + vehicle('3', '    occupancy_status: NO_DATA_AVAILABLE\n')
    + vehicle('4', '    occupancy_status: UNKNOWN_FUTURE_CODE\n'));
  assert.ok(report);
  assert.equal(report.vehiclesWithOccupancy, 2);
  assert.equal(report.vehicles[0].occupancyStatus, 'FULL');
  assert.equal(report.vehicles[0].occupancyPercentage, null);
  assert.equal(report.vehicles[1].occupancyPercentage, 0);
  assert.equal(report.vehicles[2].occupancyStatus, 'NO_DATA_AVAILABLE');
  assert.equal(report.vehicles[3].occupancyStatus, 'UNKNOWN_FUTURE_CODE');
});

test('carriage occupancy does not become whole-vehicle occupancy', () => {
  const report = inspectFeed(header + vehicle('1', '    multi_carriage_details {\n      occupancy_status: FULL\n    }\n'));
  assert.ok(report);
  assert.equal(report.vehicles[0].occupancyStatus, null);
  assert.equal(report.vehiclesWithOccupancy, 0);
});

test('invalid identity or coordinates cannot be attached to a bus', () => {
  const report = inspectFeed(header + vehicle('') + vehicle('2').replace('40.44', '140.44'));
  assert.ok(report);
  assert.equal(report.entityCount, 2);
  assert.equal(report.invalidRecordCount, 2);
  assert.equal(report.vehicleCount, 0);
});

test('empty valid feeds differ from HTML errors and truncated payloads', () => {
  const empty = inspectFeed(header);
  assert.ok(empty);
  assert.equal(empty.vehicleCount, 0);
  assert.throws(() => inspectFeed('<html>maintenance</html>'));
  assert.throws(() => inspectFeed((header + vehicle('1')).slice(0, -3)));
  assert.throws(() => inspectFeed(header + 'unrecognized format'));
});

test('public probe makes one bounded request with no credentials', async () => {
  let calls = 0;
  const report = await probePublicFeed(async (url, options) => {
    calls++;
    assert.equal(url, 'https://truetime.portauthority.org/gtfsrt-bus/vehicles?debug=');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.Authorization, undefined);
    return new Response(header + vehicle('1'));
  });
  assert.ok(report);
  assert.equal(report.mode, 'live');
  assert.equal(calls, 1);
  assert.equal(report.vehicleCount, 1);
});

test('HTTP, network, and invalid-format failures cannot look like empty buses', async () => {
  for (const fetcher of [
    async () => new Response('unavailable', { status: 503 }),
    async () => new Response('<html>maintenance</html>'),
    async () => { throw new Error('network failure'); },
  ]) await assert.rejects(probePublicFeed(fetcher));
});

test('CLI exposes offline inspection without requiring credentials', () => {
  const run = spawnSync(process.execPath, ['scripts/probe-prt.mjs', '--help'], { encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /--file/);
  assert.match(run.stdout, /no API key/i);
});

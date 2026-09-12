import type { DataFreshness, EventCategory, EventMagnitude, EventSignal } from "../types.ts";
import { inPittsburgh } from "../geo.ts";
import { cached, getJson, record as r, list, str, num } from "./http.ts";

// Venue coordinates for the sports feeds, which report venue names only.
// Ticketmaster supplies venue coordinates itself, so any Pittsburgh venue it
// lists is supported without a lookup here.
const VENUE_POINTS: { pattern: RegExp; lat: number; lng: number }[] = [
  { pattern: /PNC Park/i, lat: 40.446904, lng: -80.005753 },
  { pattern: /PPG Paints/i, lat: 40.4395, lng: -79.9893 },
  { pattern: /Acrisure|Heinz Field/i, lat: 40.4468, lng: -80.0158 },
];

/** Typical duration assumptions by category, minutes. Documented heuristics, not schedules. */
const DURATION_MINUTES: Record<EventCategory, number> = {
  FOOTBALL: 210,
  BASEBALL: 180,
  HOCKEY: 150,
  CONCERT: 150,
  THEATER: 150,
  FESTIVAL: 240,
  CONVENTION: 480,
  CAMPUS: 120,
  OTHER: 150,
};

type EventInput = {
  id: string;
  name: string;
  venue: string;
  point: { lat: number; lng: number } | null;
  start: string;
  end?: string | null;
  category: EventCategory;
  magnitude: EventMagnitude;
  source: string;
};

function event(input: EventInput): EventSignal | null {
  const { id, name, venue, point, start, category } = input;
  if (!id || !name || !point || !Number.isFinite(Date.parse(start)) || !inPittsburgh(point)) return null;
  const startMs = Date.parse(start);
  const endMs = input.end && Number.isFinite(Date.parse(input.end)) && Date.parse(input.end) > startMs ? Date.parse(input.end) : null;
  return {
    ...point,
    id,
    name,
    venue,
    category,
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs ?? startMs + DURATION_MINUTES[category] * 60_000).toISOString(),
    endEstimated: endMs === null,
    magnitude: input.magnitude,
    source: input.source,
    confidence: "MEDIUM",
    evidence: "VERIFIED",
  };
}

function venuePoint(venue: string) {
  return VENUE_POINTS.find((v) => v.pattern.test(venue)) ?? null;
}

export function parseMlb(data: unknown) {
  if (!Array.isArray(r(data).dates)) throw new Error("Invalid MLB schedule");
  return list(r(data).dates)
    .flatMap((d) => list(r(d).games))
    .flatMap((g) => {
      const game = r(g), status = r(game.status);
      if (num(r(r(r(game.teams).home).team).id) !== 134 || /cancel|postpon|suspend|final|completed/i.test(str(status.detailedState))) return [];
      const venue = str(r(game.venue).name);
      const e = event({ id: `mlb-${game.gamePk}`, name: `Pirates vs ${str(r(r(r(game.teams).away).team).name)}`, venue, point: venuePoint(venue), start: str(game.gameDate), category: "BASEBALL", magnitude: "MAJOR", source: "MLB schedule" });
      return e ? [e] : [];
    });
}

export function parseNhl(data: unknown) {
  if (!Array.isArray(r(data).games)) throw new Error("Invalid NHL schedule");
  return list(r(data).games).flatMap((g) => {
    const game = r(g);
    if (str(r(game.homeTeam).abbrev) !== "PIT" || game.neutralSite === true || ["OFF", "FINAL"].includes(str(game.gameState)) || ["CNCL", "PPD", "TBD"].includes(str(game.gameScheduleState))) return [];
    const venue = str(r(game.venue).default);
    const e = event({ id: `nhl-${game.id}`, name: `Penguins vs ${str(r(game.awayTeam).abbrev)}`, venue, point: venuePoint(venue), start: str(game.startTimeUTC), category: "HOCKEY", magnitude: "LARGE", source: "NHL schedule" });
    return e ? [e] : [];
  });
}

export function parseNfl(data: unknown) {
  if (!Array.isArray(r(data).events)) throw new Error("Invalid football schedule");
  return list(r(data).events).flatMap((g) => {
    const game = r(g), competition = r(list(game.competitions)[0]);
    const home = list(competition.competitors).find((c) => r(c).homeAway === "home");
    if (str(r(r(home).team).abbreviation) !== "PIT" || competition.timeValid === false || r(r(competition.status).type).completed === true || /postpon|cancel/i.test(str(r(r(competition.status).type).description))) return [];
    const venue = str(r(competition.venue).fullName);
    const e = event({ id: `nfl-${game.id}`, name: str(game.name), venue, point: venuePoint(venue), start: str(game.date), category: "FOOTBALL", magnitude: "MAJOR", source: "ESPN schedule" });
    return e ? [e] : [];
  });
}

/** Ticketmaster segment → LoadLine category. Home pro games come from the sports
 * adapters above, so those are excluded here to avoid double counting. */
export function ticketmasterCategory(segment: string, name: string): EventCategory | null {
  if (segment === "Music") return /fest/i.test(name) ? "FESTIVAL" : "CONCERT";
  if (segment === "Arts & Theatre") return "THEATER";
  if (segment === "Sports") return /Pirates|Penguins|Steelers/i.test(name) ? null : "OTHER";
  if (segment === "Miscellaneous" || segment === "Family") return /expo|convention|\bcon\b|summit|conference/i.test(name) ? "CONVENTION" : /fest|fair|parade|market/i.test(name) ? "FESTIVAL" : "OTHER";
  return null;
}

const LARGE_VENUE = /PPG Paints|Acrisure|PNC Park|Petersen Events|Stage AE|Convention Center|Benedum|Heinz Hall/i;

export function parseTicketmaster(data: unknown) {
  if (!r(data).page && !r(data)._embedded) throw new Error("Invalid Ticketmaster response");
  return list(r(r(data)._embedded).events).flatMap((g) => {
    const item = r(g), dates = r(item.dates), venue = r(list(r(item._embedded).venues)[0]);
    const status = str(r(dates.status).code);
    if (status !== "onsale" && status !== "offsale") return [];
    const segment = str(r(r(list(item.classifications)[0]).segment).name);
    const category = ticketmasterCategory(segment, str(item.name));
    if (!category) return [];
    const location = r(venue.location);
    const lat = Number(str(location.latitude)), lng = Number(str(location.longitude));
    const point = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : venuePoint(str(venue.name));
    const venueName = str(venue.name);
    const magnitude: EventMagnitude = LARGE_VENUE.test(venueName) ? "LARGE" : category === "THEATER" ? "SMALL" : "MEDIUM";
    const e = event({ id: `tm-${item.id}`, name: str(item.name), venue: venueName, point, start: str(r(dates.start).dateTime), end: str(r(dates.end).dateTime) || null, category, magnitude, source: "Ticketmaster" });
    return e ? [e] : [];
  });
}

export async function fetchEvents(at: string): Promise<{ events: EventSignal[]; freshness: DataFreshness[] }> {
  const date = at.slice(0, 10), year = Number(date.slice(0, 4)), month = Number(date.slice(5, 7));
  const season = month >= 7 ? year : year - 1;
  const end = new Date(Date.parse(at) + 7 * 86400_000).toISOString().slice(0, 10);
  const providers = [
    { name: "MLB schedule", url: `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=134&startDate=${date}&endDate=${end}`, parse: parseMlb },
    { name: "NHL schedule", url: `https://api-web.nhle.com/v1/club-schedule-season/PIT/${season}${season + 1}`, parse: parseNhl },
    { name: "ESPN schedule", url: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/pit/schedule?season=${month >= 3 ? year : year - 1}`, parse: parseNfl },
  ];
  const key = process.env.TICKETMASTER_API_KEY;
  if (key) {
    providers.push({
      name: "Ticketmaster",
      url: `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${encodeURIComponent(key)}&latlong=40.4406,-79.9959&radius=15&unit=miles&size=200&startDateTime=${date}T00:00:00Z&endDateTime=${end}T23:59:59Z`,
      parse: parseTicketmaster,
    });
  }
  const results = await Promise.all(
    providers.map(async (p) => {
      try {
        const result = await cached(`${p.name}:${date}`, 30 * 60_000, async () => p.parse(await getJson(p.url)));
        return { events: result.value, freshness: { source: p.name, fetchedAt: result.fetchedAt, status: result.stale ? "STALE" : "LIVE", detail: p.name === "Ticketmaster" ? "Published starts (and ends when listed) for concerts, theater, festivals and other ticketed events within 15 miles; unlisted ends are duration assumptions." : "Published starts; event ends are duration assumptions. Home games / supported venues only." } as DataFreshness };
      } catch {
        return { events: [], freshness: { source: p.name, fetchedAt: null, status: "UNAVAILABLE", detail: "Could not retrieve schedule; this is not evidence of no events." } as DataFreshness };
      }
    }),
  );
  if (!key) results.push({ events: [], freshness: { source: "Ticketmaster", fetchedAt: null, status: "UNAVAILABLE", detail: "Concert, theater and festival coverage requires optional TICKETMASTER_API_KEY. Sports feeds remain available." } });
  const unique = [...new Map(results.flatMap((x) => x.events).map((e) => [e.id, e])).values()];
  return {
    events: unique.filter((e) => Date.parse(e.endTime) >= Date.parse(at) - 2 * 3600_000 && Date.parse(e.startTime) <= Date.parse(at) + 7 * 86400_000),
    freshness: results.map((x) => x.freshness),
  };
}

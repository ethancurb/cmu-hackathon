// Pittsburgh place lexicon for the chat planner: well-known landmarks,
// neighborhoods and venues with aliases. Coordinates are approximate centers
// (good enough to seed a routing request; the routing provider snaps to real
// stops). Anything not listed falls through to geocoding.
import type { ChatPlace } from "./types.ts";

export type LexiconEntry = ChatPlace & { aliases: string[] };

export const PLACES: LexiconEntry[] = [
  { label: "Carnegie Mellon University", lat: 40.4433, lng: -79.9436, aliases: ["cmu", "carnegie mellon", "carnegie mellon university", "tepper", "cmu campus"] },
  { label: "University of Pittsburgh (Cathedral of Learning)", lat: 40.4444, lng: -79.9532, aliases: ["pitt", "university of pittsburgh", "cathedral of learning", "pitt campus"] },
  { label: "North Shore", lat: 40.4462, lng: -80.0083, aliases: ["north shore", "the north shore", "northshore"] },
  { label: "PNC Park", lat: 40.4469, lng: -80.0057, aliases: ["pnc park", "pnc", "pirates game", "the pirates"] },
  { label: "Acrisure Stadium", lat: 40.4468, lng: -80.0158, aliases: ["acrisure stadium", "acrisure", "heinz field", "steelers game", "the steelers"] },
  { label: "PPG Paints Arena", lat: 40.4395, lng: -79.9893, aliases: ["ppg paints arena", "ppg paints", "ppg arena", "penguins game", "the penguins", "the pens"] },
  { label: "Petersen Events Center", lat: 40.4438, lng: -79.9622, aliases: ["petersen events center", "the pete", "petersen"] },
  { label: "Downtown (Market Square)", lat: 40.4409, lng: -80.0031, aliases: ["downtown", "market square", "town", "downtown pittsburgh", "golden triangle"] },
  { label: "Strip District", lat: 40.4517, lng: -79.9793, aliases: ["strip district", "the strip"] },
  { label: "Shadyside (Walnut Street)", lat: 40.4513, lng: -79.9336, aliases: ["shadyside", "walnut street", "walnut st"] },
  { label: "Squirrel Hill (Forbes & Murray)", lat: 40.4381, lng: -79.9227, aliases: ["squirrel hill", "forbes and murray", "murray avenue"] },
  { label: "Oakland (Forbes & Bigelow)", lat: 40.4415, lng: -79.956, aliases: ["oakland", "central oakland"] },
  { label: "Lawrenceville (Butler & 40th)", lat: 40.4657, lng: -79.9608, aliases: ["lawrenceville", "butler street", "butler st"] },
  { label: "South Side (East Carson & 18th)", lat: 40.4287, lng: -79.9776, aliases: ["south side", "southside", "east carson", "carson street"] },
  { label: "SouthSide Works", lat: 40.4275, lng: -79.965, aliases: ["southside works", "south side works"] },
  { label: "Station Square", lat: 40.4337, lng: -80.0057, aliases: ["station square"] },
  { label: "East Liberty", lat: 40.4614, lng: -79.925, aliases: ["east liberty", "eastside", "east liberty station"] },
  { label: "Bloomfield", lat: 40.462, lng: -79.949, aliases: ["bloomfield", "liberty avenue"] },
  { label: "Mount Washington (Grandview Overlook)", lat: 40.431, lng: -80.01, aliases: ["mount washington", "mt washington", "mt. washington", "grandview", "the incline", "duquesne incline"] },
  { label: "David L. Lawrence Convention Center", lat: 40.4451, lng: -79.9961, aliases: ["convention center", "david l. lawrence convention center", "david lawrence convention center", "dlcc"] },
  { label: "Carnegie Museums of Art and Natural History (Oakland)", lat: 40.4434, lng: -79.9498, aliases: ["carnegie museum", "carnegie museums", "carnegie museum of art", "natural history museum", "museum of natural history"] },
  { label: "The Andy Warhol Museum (North Shore)", lat: 40.4485, lng: -80.0025, aliases: ["warhol", "andy warhol museum", "the warhol", "warhol museum"] },
  { label: "Children's Museum of Pittsburgh (North Side)", lat: 40.453, lng: -80.006, aliases: ["children's museum", "childrens museum", "kids museum"] },
  { label: "Phipps Conservatory", lat: 40.439, lng: -79.9477, aliases: ["phipps", "phipps conservatory"] },
  { label: "Schenley Park (Flagstaff Hill)", lat: 40.4383, lng: -79.945, aliases: ["schenley park", "schenley", "flagstaff hill", "schenley plaza"] },
  { label: "Point State Park", lat: 40.4415, lng: -80.01, aliases: ["point state park", "the point", "point park"] },
  { label: "Stage AE", lat: 40.446, lng: -80.011, aliases: ["stage ae"] },
  { label: "Benedum Center", lat: 40.4428, lng: -80.0, aliases: ["benedum", "benedum center", "cultural district"] },
  { label: "Heinz Hall", lat: 40.4425, lng: -80.0031, aliases: ["heinz hall"] },
  { label: "The Waterfront (Homestead)", lat: 40.4088, lng: -79.9152, aliases: ["the waterfront", "waterfront", "homestead"] },
  { label: "Ross Park Mall", lat: 40.545, lng: -80.006, aliases: ["ross park mall", "ross park"] },
  { label: "Pittsburgh International Airport", lat: 40.4915, lng: -80.2329, aliases: ["airport", "the airport", "pit airport", "pittsburgh airport", "pittsburgh international airport"] },
  { label: "Highland Park", lat: 40.479, lng: -79.918, aliases: ["highland park", "the zoo", "pittsburgh zoo"] },
  { label: "Greenfield", lat: 40.427, lng: -79.933, aliases: ["greenfield"] },
  { label: "Polish Hill", lat: 40.457, lng: -79.97, aliases: ["polish hill"] },
  { label: "Wilkinsburg", lat: 40.4418, lng: -79.8817, aliases: ["wilkinsburg"] },
  { label: "Duquesne University", lat: 40.4368, lng: -79.991, aliases: ["duquesne", "duquesne university"] },
  { label: "Chatham University", lat: 40.4489, lng: -79.9245, aliases: ["chatham", "chatham university"] },
  { label: "Allegheny General Hospital", lat: 40.457, lng: -80.0035, aliases: ["allegheny general", "agh"] },
  { label: "UPMC Presbyterian", lat: 40.4425, lng: -79.9613, aliases: ["upmc presby", "presby", "upmc presbyterian"] },
  { label: "Pittsburgh Union Station (Amtrak)", lat: 40.4443, lng: -79.9917, aliases: ["amtrak", "union station", "train station", "amtrak station"] },
  { label: "Frick Park", lat: 40.437, lng: -79.902, aliases: ["frick park", "frick"] },
  { label: "Mattress Factory", lat: 40.4573, lng: -80.008, aliases: ["mattress factory"] },
  { label: "Kennywood", lat: 40.3873, lng: -79.8631, aliases: ["kennywood"] },
];

/** Words that could mean several places; the planner asks instead of guessing.
 * Checked after the alias lexicon, so "carnegie museum" resolves while "the museum" asks. */
export const AMBIGUOUS: { pattern: RegExp; question: string; options: string[] }[] = [
  { pattern: /\b(museum|museums)\b/, question: "Which museum?", options: ["Carnegie Museums of Art and Natural History (Oakland)", "The Andy Warhol Museum (North Shore)", "Children's Museum of Pittsburgh (North Side)"] },
  { pattern: /\bstadium\b/, question: "Which stadium?", options: ["PNC Park", "Acrisure Stadium"] },
  { pattern: /\barena\b/, question: "Which arena?", options: ["PPG Paints Arena", "Petersen Events Center"] },
  { pattern: /\bgame\b/, question: "Which game?", options: ["PNC Park", "Acrisure Stadium", "PPG Paints Arena"] },
  { pattern: /\b(campus|university|school)\b/, question: "Which campus?", options: ["Carnegie Mellon University", "University of Pittsburgh (Cathedral of Learning)", "Duquesne University"] },
  { pattern: /\bpark\b/, question: "Which park?", options: ["Schenley Park (Flagstaff Hill)", "Point State Park", "Frick Park", "PNC Park"] },
  { pattern: /\bmall\b/, question: "Which mall?", options: ["Ross Park Mall", "The Waterfront (Homestead)", "SouthSide Works"] },
  { pattern: /\b(concert|show|venue)\b/, question: "Where is the show?", options: ["PPG Paints Arena", "Stage AE", "Benedum Center", "Heinz Hall", "Petersen Events Center"] },
];

const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s'&.]/g, " ").replace(/\s+/g, " ").trim();

export function findPlace(label: string): ChatPlace | null {
  const hit = PLACES.find((p) => p.label === label);
  return hit ? { label: hit.label, lat: hit.lat, lng: hit.lng } : null;
}

export type PlaceResolution = { kind: "place"; place: ChatPlace } | { kind: "ambiguous"; question: string; options: ChatPlace[] } | { kind: "unknown"; query: string };

/** Resolves free text to a lexicon place, an explicit ambiguity, or "unknown"
 * (for geocoding). Longest alias wins so "north shore" beats "north". */
export function resolveLexicon(text: string): PlaceResolution {
  const q = normalize(text).replace(/^(to|at|from|near|in)\s+/, "");
  if (!q) return { kind: "unknown", query: text };
  let best: { entry: LexiconEntry; length: number } | null = null;
  for (const entry of PLACES) {
    for (const alias of entry.aliases) {
      if (q === alias || q === `the ${alias}` || new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(q)) {
        if (!best || alias.length > best.length) best = { entry, length: alias.length };
      }
    }
  }
  if (best) return { kind: "place", place: { label: best.entry.label, lat: best.entry.lat, lng: best.entry.lng } };
  for (const amb of AMBIGUOUS) {
    if (amb.pattern.test(q)) return { kind: "ambiguous", question: amb.question, options: amb.options.map(findPlace).filter((p): p is ChatPlace => !!p) };
  }
  return { kind: "unknown", query: text.trim() };
}

/** Picks a clarification option from a short reply: an index ("2"), a label
 * fragment ("warhol"), or a lexicon alias. */
export function pickOption(reply: string, options: ChatPlace[]): ChatPlace | null {
  const q = normalize(reply);
  const index = Number(q.match(/^(\d+)/)?.[1]);
  if (Number.isInteger(index) && index >= 1 && index <= options.length) return options[index - 1];
  const direct = resolveLexicon(reply);
  if (direct.kind === "place" && options.some((o) => o.label === direct.place.label)) return direct.place;
  const words = q.split(" ").filter((w) => w.length >= 3 && !["the", "one", "first", "second", "third", "please"].includes(w));
  const scored = options.map((o) => ({ o, score: words.filter((w) => normalize(o.label).includes(w)).length }));
  const top = scored.sort((a, b) => b.score - a.score)[0];
  return top && top.score > 0 && scored.filter((s) => s.score === top.score).length === 1 ? top.o : null;
}

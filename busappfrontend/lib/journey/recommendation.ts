import type { Journey } from "./types.ts";

/** Quickest returned bus itinerary, with transfers and walking as tie breakers.
 * This ranks the provider's current search, not unsearched departure windows. */
export function recommendedBus(journeys: Journey[]): Journey | null {
  return journeys.filter((journey) => journey.legs.some((leg) => leg.mode === "BUS"))
    .sort((a, b) => a.durationSeconds - b.durationSeconds || a.transfers - b.transfers || a.walkSeconds - b.walkSeconds)[0] ?? null;
}

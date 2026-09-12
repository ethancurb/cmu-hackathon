import type { PassengerLoad } from "./types.ts";

export const LOAD_LABEL: Record<PassengerLoad, string> = {
  not_crowded: "Not crowded",
  somewhat_crowded: "Somewhat crowded",
  crowded: "Crowded",
};

export function occupancyHeadline(input: { passengerCount: number | null; passengerLoad?: PassengerLoad | null; category?: PassengerLoad | null }): string {
  if (input.passengerCount !== null) return String(input.passengerCount);
  const category = input.category ?? input.passengerLoad ?? null;
  return category ? LOAD_LABEL[category] : "Not reported";
}

export function occupancyPeopleCaption(input: { passengerCount: number | null; passengerLoad?: PassengerLoad | null; category?: PassengerLoad | null }): string {
  if (input.passengerCount !== null) return "Live people on the bus · PRT published this count";
  const category = input.category ?? input.passengerLoad ?? null;
  if (category) return "Live occupancy · people on the bus · PRT category, not a headcount";
  return "People on the bus · PRT has not published a load";
}

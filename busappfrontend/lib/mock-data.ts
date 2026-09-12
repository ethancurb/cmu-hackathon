/**
 * All static content for the app lives here — no API calls, no other data
 * files. Every screen imports from this module rather than hardcoding its
 * own copies, so a single source stays consistent across / and /plan.
 */

export type RouteId = "71" | "61" | "54";

export type Route = {
  id: RouteId;
  /** Scheduled clock time shown on the arrival card, e.g. "8:46". */
  scheduledTime: string;
  seats: string;
  /** Minutes-until-arrival, shown in the home summary row when this route is selected. */
  arrivesIn: string;
  status: string;
  /** Walk time to this route's stop — the primary button's value reflects the selected route. */
  walkTime: string;
};

export const ROUTES: Route[] = [
  { id: "71", scheduledTime: "8:46", seats: "17 free", arrivesIn: "4 min", status: "On time", walkTime: "2 min" },
  { id: "61", scheduledTime: "8:49", seats: "6 free", arrivesIn: "2 min", status: "3 min late", walkTime: "1 min" },
  { id: "54", scheduledTime: "8:55", seats: "24 free", arrivesIn: "6 min", status: "On time", walkTime: "3 min" },
];

export const DEFAULT_ROUTE_ID: RouteId = "61";

export type Bar = {
  height: number;
  /** Full display time for this hour slot, e.g. "10:00 am" — shown as the
   * chart's emphasis-number value and used as the applied departure time. */
  time: string;
  /** Axis tick text; only every other bar carries one, per the spec. */
  label?: string;
  descriptor: string;
};

export const BARS: Bar[] = [
  { height: 0.34, time: "6:00 am", label: "6a", descriptor: "Low crowding" },
  { height: 0.56, time: "8:00 am", descriptor: "Moderate crowding" },
  { height: 0.57, time: "10:00 am", label: "10a", descriptor: "Low crowding" },
  { height: 0.42, time: "12:00 pm", descriptor: "Moderate crowding" },
  { height: 0.36, time: "2:00 pm", label: "2p", descriptor: "Low crowding" },
  { height: 0.4, time: "4:00 pm", descriptor: "Moderate crowding" },
  { height: 0.86, time: "6:00 pm", label: "6p", descriptor: "High crowding" },
  { height: 0.94, time: "8:00 pm", descriptor: "High crowding" },
  { height: 0.62, time: "10:00 pm", label: "10p", descriptor: "Moderate crowding" },
  { height: 0.5, time: "11:00 pm", descriptor: "Moderate crowding" },
  { height: 0.42, time: "11:30 pm", descriptor: "Low crowding" },
];

export const DEFAULT_HOUR_INDEX = 2; // "10:00 am" / "Low crowding" — matches the reference's default render

export type Recommendation = {
  id: string;
  title: string;
  subtitle: string;
  barIndex: number;
};

export const RECOMMENDATIONS: Recommendation[] = [
  { id: "rec-1", title: "8:30 – 10:00 am", subtitle: "Lowest crowding", barIndex: 2 },
  { id: "rec-2", title: "12:00 – 1:30 pm", subtitle: "Moderate traffic", barIndex: 3 },
  { id: "rec-3", title: "4:00 – 6:00 pm", subtitle: "Increasing crowding", barIndex: 5 },
];

export const DEFAULT_RECOMMENDATION_ID = "rec-1";

export const PRIMARY_SELECT_OPTIONS = ["Today", "Tomorrow"];
export const SECONDARY_SELECT_OPTIONS = ["Next 7 days", "Next 30 days"];

export const DEFAULT_PRIMARY_SELECT_VALUE = "Today";
export const DEFAULT_SECONDARY_SELECT_VALUE = "Next 7 days";

export const DEFAULT_DEPARTURE_TIME = "By 9:00";

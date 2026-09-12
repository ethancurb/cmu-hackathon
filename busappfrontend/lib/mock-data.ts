/**
 * Static route configuration for the three tracked routes. Occupancy is
 * never shown: LoadLine models Transit Pressure (lib/pressure), not
 * passenger counts.
 */

export type RouteId = "71" | "61" | "54";

export type Route = { id: RouteId };

export const ROUTES: Route[] = [{ id: "71" }, { id: "61" }, { id: "54" }];

export const DEFAULT_ROUTE_ID: RouteId = "61";

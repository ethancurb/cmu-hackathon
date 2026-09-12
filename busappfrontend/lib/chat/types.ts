// Chat planner contracts. The model (or the guided parser) only ever proposes
// these structured actions; the server validates them against real data before
// the client applies any to the shared trip state.
import type { Journey } from "../journey/types.ts";
import type { PressureResult, RiderSignal } from "../pressure/types.ts";

export type ChatPlace = { label: string; lat: number; lng: number };

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  text: string;
  /** Assistant only: journey ids offered as selectable cards with this reply. */
  journeyIds?: string[];
  /** Assistant only: quick replies for a clarification question. */
  options?: ChatOption[];
};

export type ChatOption = { label: string; place?: ChatPlace; value?: string };

export type ChatAction =
  | { type: "set_origin"; place: ChatPlace }
  | { type: "set_destination"; place: ChatPlace }
  | { type: "set_time"; at: string | null; arriveBy: boolean }
  | { type: "set_prefs"; maxWalkMinutes?: number; maxTransfers?: number | null }
  | { type: "select_journey"; journeyId: string }
  | { type: "add_rider_signal"; signal: RiderSignal }
  | { type: "open_timeline" };

/** What the client knows about the current trip, sent with every request. */
export type TripContext = {
  originLabel: string;
  origin: ChatPlace;
  destinationLabel: string | null;
  destination: { lat: number; lng: number } | null;
  departureAt: string | null;
  arriveBy: boolean;
  journeys: Journey[];
  journey: Journey | null;
  pressure: PressureResult | null;
  demo: boolean;
};

/** A clarification in progress, echoed back by the client on the next turn so
 * a one-word answer ("the Warhol") can be resolved without re-parsing history. */
export type Pending = {
  slot: "origin" | "destination" | "venue";
  options: ChatPlace[];
  /** The rest of the request, kept until the slot is filled. */
  draft: TripDraft;
};

export type TripDraft = {
  origin?: ChatPlace;
  destination?: ChatPlace;
  at?: string | null;
  arriveBy?: boolean;
  maxWalkMinutes?: number;
  maxTransfers?: number | null;
  signal?: Partial<RiderSignal> & { venueQuery?: string };
};

export type ChatRequest = {
  messages: ChatMessage[];
  trip: TripContext;
  pending: Pending | null;
};

export type ChatResponse = {
  reply: string;
  actions: ChatAction[];
  journeyIds: string[];
  options: ChatOption[];
  pending: Pending | null;
  /** "model" = Claude interpreted the request; "guided" = deterministic parser (no API key). */
  mode: "model" | "guided";
  /** Set when the model call failed and the guided parser answered instead. */
  fallback?: string;
};

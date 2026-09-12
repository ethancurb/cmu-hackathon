# ADR 0002 — Commute agent as the product differentiator

Status: accepted, 2026-09-12.

## Context

[PROJECT](../PROJECT.md) frames the product as a capacity indicator alongside an existing journey: "how full is the specific bus I am considering right now?" As the design session progressed, the product-as-designed collapsed to "a Google Maps view with fake capacity chips on arrival cards." That is:

- Indistinguishable from Transit-style crowding displays that already exist.
- Passive: the rider is handed data and asked to interpret it.
- The AI role was unspecified. Any AI added to a passive display looks decorative — the "ChatGPT wrapper" pattern the HackCMU deck explicitly contrasts against ([STRATEGY](../STRATEGY.md), rubric row "Technical difficulty").

We need the AI to have a job that is (a) real, (b) visible in a 3-minute demo, (c) hard to dismiss as decoration, and (d) fits the Traveling and/or Optimization tracks.

## Decision

The product is a **commute agent** that decides for the rider and adapts to changing conditions. The map, stops, bus animations, and capacity chips are the canvas the plan is drawn on; they are not the product.

**The agent's job.** Given a rider destination and the current `simNow` (see [CONTEXT](../../CONTEXT.md)), the agent:

1. Reads the near-future `StopEvent` window across candidate runs from `CapacitySource`.
2. Evaluates each candidate: arrival time at the boarding stop, predicted occupancy on arrival, walking cost to that stop.
3. Picks a plan (which bus to catch, from which stop, by when) and emits a `Recommendation` (see [CONTEXT](../../CONTEXT.md)).
4. Re-runs on every `simNow` tick. If the winning plan's bus fills up mid-approach, the agent revises the plan and updates the recommendation card on screen.

**The AI's role, concretely.**
- **Planner:** a small rule-based scorer over candidate runs. Deterministic, fast, defensible line-by-line.
- **Explainer:** an LLM call that turns the planner's structured decision into a short natural-language recommendation with reasoning trace. Latency-bounded; falls back to a template if the call is slow.

This split (rule-based brain, LLM mouth) removes in-room latency risk from the planner while keeping the AI's voice in the primary UI surface.

**The demo beat.** During the play sequence, the agent's initial recommendation names one bus. Mid-demo, the boardings authored into the fixture cause that bus to fill up before it reaches the rider's stop. The recommendation card updates on screen, in view of the judges, to a different bus. That transition is the visible product; capacity chips exist to make it legible.

## Consequences

**Positive.**
- The AI has a legitimate job: agentic decision loop over structured state, with adaptive replanning. This is what "agent" actually means and passes the wrapper test.
- Fits the Traveling track directly. If the planner's decision quality is provable against the fixture, Optimization becomes a defensible alternative track statement.
- Reuses everything already agreed: same MongoDB schema, same fixture, same map, same animations. The agent reads the same `CapacitySource` the UI reads. No architecture is thrown away.
- The mock becomes a feature, not a compromise: we can guarantee the mid-demo replan happens on cue.
- Judge-friendly demo. One dramatic on-screen moment (the plan changing) does more rubric work than any number of static screenshots.

**Negative.**
- Replaces the passive-display framing in PROJECT.md. The primary UI surface is now the recommendation card; the arrivals panel and capacity chips are supporting evidence for what the agent recommends.
- Adds ~3–4 hours of build for the planner + LLM explainer + recommendation card.
- Adds one dependency on an LLM API and one env var for its key. Latency variability handled by the rule/LLM split above.
- Requires the fixture to be authored with a specific narrative arc (a bus that clearly fills up before reaching the rider) rather than pure realism.

**What this replaces.**
- The framing in PROJECT.md § "Confirmed objective" that treats capacity as a display enrichment. Capacity is now an input to a decision the agent makes; the rider consumes the decision, not the raw data.
- The implicit assumption that the demo hero surface is the capacity card. The hero surface is now the recommendation card.

**Defensibility to a judge.**
- The planner is code they can read: `score = f(arrivalTime, predictedOccupancy, walkCost)`. There is no black box in the decision itself.
- The LLM's role is bounded and visible: it phrases the decision, it does not make the decision. This is the honest separation of concerns.
- The adaptive replan is the technical difficulty artifact: reacting to state change is engineering work, not prompt engineering.

## Non-goals

- Not building a full multi-agent passenger simulator. The fixture is still hand-authored; the agent operates over it, not on top of an inferred model of the world.
- Not building a voice interface, chat interface, or general Q&A. The recommendation is one-way output driven by state.
- Not claiming the recommendation is optimal in a formal sense. It is a defensible choice among a small candidate set, with the reasoning surfaced.
- Not deferring to real-time PRT data for this milestone. The commute agent will run against live data automatically once the `CapacitySource` swap in ADR-0001 is exercised.

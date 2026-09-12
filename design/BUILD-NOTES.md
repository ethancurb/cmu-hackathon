# LoadLine build notes

What future-you (or anyone else picking this up) needs to know that isn't obvious from reading the code cold. Started after the static `/plan` and `/trip` screens were built and diffed against the reference renders; extended after `/trip` became the interactive home screen (`/`). See `busappfrontend/app/globals.css` for the tokens themselves — this file is the *why*.

**Routing note:** the screen originally built at `/trip` is now the home screen at `/`. `/trip` redirects to `/` (permanent, via `next.config.ts`'s `redirects()`) rather than existing as a page — old links still work, but there's no `app/trip/` directory anymore. References below to "the `/trip` screen" mean this screen's content, now living at `app/page.tsx`, `app/RouteMap.tsx`, `app/ArrivalCards.tsx`, and `app/ViewToggle.tsx`.

## The type scale and geometry were solved empirically, not read off the spec

`loadline-design-spec.md`'s numbers came from cap-height measurement on a low-resolution render and were confirmed wrong — about 25% off, and not uniformly (some roles were closer than others). Every type size in `globals.css` below was instead solved by:

1. Taking a real string as it appears in the reference (e.g. "10:00 am"), a measured pixel width for that string at the reference's 288px render scale, and the reference's own viewport correction factor (390 ÷ 288 = 1.354).
2. Multiplying the measured width by 1.354 to get a target width at true (390px) scale.
3. Rendering that exact string in the real loaded font at a reference size (200px) in a headless browser, measuring its actual rendered width, and solving linearly for the font-size that would produce the target width (text width scales linearly with font-size for a fixed string — no iteration needed).
4. Rounding to the nearest whole pixel and re-measuring to confirm.

The script is `busappfrontend/scripts/solve-type-scale.mjs` (first eight roles) and `solve-type-scale-2.mjs` (the two originally-provisional tokens plus cross-checks). Re-run either against a live `next dev` server if a token ever needs re-deriving — they're not one-off scratch files, they're the record of how these numbers were produced.

**Geometry** (`--gutter`, `--content-width`, `--radius`, `--control-height`) was corrected the simpler way: every value from the spec's Geometry section × 1.354, rounded to whole px. Hairlines (`--border-width`, `--radius-bar`) were deliberately left at 1px/0px — the instruction was "leave 1px hairlines at 1px," not scale everything indiscriminately.

### Final solved type scale

| Token | Value | Solved from | Note |
|---|---|---|---|
| `--text-headline` | 46px | "A quieter trip." | Editorial New. Spec said 40px (pre-scale) / naive-scaled would be ~54px — solving from actual width gave a real, different answer either way. |
| `--text-wordmark` | 23px | "LoadLine" | Editorial New. |
| `--text-emphasis-number` | 21px | "10:00 am" | Bold. |
| `--text-location-subhead` | 19px | "Morewood Avenue" | Regular. |
| `--text-row-title` | 15px | "8:30 - 10:00 am" | Bold. |
| `--text-body` | 13px | "Lowest crowding", cross-checked against the chart's helper caption | Regular. Also used for the chart's helper caption ("Drag across the chart to compare.") — see corrections below. |
| `--text-descriptor` | 17px | "Today" (primary select) + "Low crowding" (chart descriptor) | Regular. New token — see corrections below. |
| `--text-section-label` | 16px | "Top recommendations" | New token — see corrections below. |
| `--text-footnote` | 10px | "Based on forecast weather and local activity." | Regular, 70% opacity. Genuinely solved (exact value 10.481), not carried over — it just happens to round to the same integer as the old spec's guess. |
| `--text-nav-label` | 24px | "Plan" | Nav destination label only. |
| `--text-button-label` | 18px | "USE SELECTED TIME" | Primary button only, uppercase + 0.08em tracking. |
| `--text-select-secondary` | 14px | "NEXT 7 DAYS" | Secondary select only, uppercase + 0.08em tracking. |
| `--text-axis-label` | 16px | *unsolved* | Chart axis ticks ("6a", "10a"...). No target string was ever measured for this specifically — provisionally geometry-scaled (×1.354 from the old 12px). |
| `--text-label` | 16px | *unsolved* | Generic fallback for chip text, time-row text, kitchen-sink headers. Same provisional treatment as axis-label. |

### Final geometry

| Token | Value |
|---|---|
| `--gutter` | 27px |
| `--content-width` | 336px |
| `--radius` | 3px |
| `--radius-bar` | 0px |
| `--border-width` | 1px |
| `--control-height` | 43px |

Non-tokenized module measurements (nav height 54px, checkbox 27px/2px stroke, list row height 61px, chart bar 22px/5px gap, icon-toggle/utility-button 54px square) are hardcoded per-component at their scaled values rather than promoted to CSS variables, matching the original scoping decision that only the spec's Color/Type-scale/Geometry sections became tokens.

## Corrections this solve produced to `loadline-design-spec.md`

The spec's own Type Scale table conflated several visually distinct roles under one number because its cap-height derivation couldn't tell them apart. Solving from real measured widths split them back apart. These are corrections to record, not just implementation details:

- **Row title (15px) and row subtitle (13px) are not the same size.** The spec has both at 14px, differentiated only by weight ("hierarchy is carried by weight, not color... both the same blue"). Once corrected, they also differ by 2px. Hierarchy in the real reference is carried by size *and* weight together.
- **The chart's helper caption ("Drag across the chart to compare.") is body-sized (13px), not footnote-sized (10px).** The spec explicitly describes it as "10px mono blue at 70%," grouping it with the footnote. It measures far closer to the row-subtitle cluster (12.65 vs 12.79, a 0.14px gap) than to the footnote (10.48, a 2px+ gap). It kept its 70%-opacity dimming regardless — that's a color decision, independent of the size finding.
- **`--text-section-label` (16px) didn't exist as a token before.** The spec describes "Top recommendations" only as "a 14px mono blue section label" in prose, with no named row in the Type Scale table, so the original build reused the body token for it. It solves to its own distinct size.
- **Headline (46px, was 40px) and wordmark (23px, was 20px)** both moved further than the flat 1.354 viewport factor alone would predict, because the *original* 40/20px numbers already carried the cap-height error — naively scaling a wrong number just carries the error forward at a new scale. Solving from the actual rendered string width bypasses the old number entirely.
- **The primary select's value and the chart descriptor are not body-sized.** Both were originally mapped to the body token (14px in the old scale) since nothing else fit; they solve to ~17px, a full ~3.5px above the body/caption cluster. New token: `--text-descriptor`.
- **The primary button and the secondary select are not the same size**, despite sharing uppercase + 0.08em tracking treatment and both originally using one `--text-button-label` token. They solve 4px apart (17.8 vs 13.76). Split into `--text-button-label` (button only) and new `--text-select-secondary`.
- **"Label / axis / nav" is not one role.** Solving the nav label ("Plan") gave 24px; applying that to the chart's axis ticks visibly overlapped them in the diff loop (caught and shown wrong at `/design/diff/v2-pass-3.png`, fixed by `v2-pass-4.png`). Split into `--text-nav-label` (solved) and `--text-axis-label` (still unsolved — no axis-tick string has been measured). A generic `--text-label` remains for the other unmeasured contexts (chip, time-row, kitchen-sink headers) this same grouping swept in. **If another role ever measures close to one of these, verify the match with real width data before merging tokens — don't assume shared numbers in the old spec meant shared sizes.**

## Other things the diff loops caught that are worth knowing

- **`ArrivalCards`' capacity text and the summary row's status text use `--text-descriptor` (17px) by *assumption*, not solve.** No target string was ever measured for "17 free," "Bus arrives," or "3 min late." The assumption follows the same bold-value/regular-subtext pairing pattern that *was* confirmed for the crowding chart, so it's reasoned, not arbitrary — but if it's ever worth getting right, measure those strings the same way.
- **The `/trip` screen's map, route, and badge content is modeled on the wide reference's panel 2 ("02 / Select")** specifically, because that's the panel showing a selected arrival card, both non-active route treatments, and the full icon-toggle/utility-button set. The active route on the map (solid ink) always matches whichever arrival card is selected — it isn't a fixed route number. Panels 1 and 3 of the wide reference were not built as separate screens.
- **Filled icons are hardcoded to `--ink-deep`** except when explicitly overridden via the `style` prop (added to `components/icons/filled.tsx` specifically because the primary button's walk icon must render `--on-ink` against the dark button fill — confirmed against the reference, which shows it white, not dark). If a new dark-surface icon usage comes up, use `style={{ color: "var(--on-ink)" }}`, not a Tailwind class (Tailwind utility class precedence between the baked-in `text-ink-deep` and an added override class isn't guaranteed by JSX ordering).
- **`RouteMap`'s outer container is fluid-width** (`w-full`, SVG scaled via `viewBox`) so the page holds at 320px; the absolutely-positioned HTML overlays (chip, badges, toggle pair, labels) stay at their fixed 336px-design-width pixel coordinates and get clipped by `overflow-hidden` rather than escaping the container at narrower widths. They're correct at the 390px design width; they crowd/clip gracefully below it.
- **`/plan`'s select row divides available width** rather than letting the secondary select size to its own content — primary is `flex-1 min-w-0`, secondary is capped at `max-w-[50%]` and truncates via its own `truncate` span if it must. This was a genuine layout bug (found via a 320px viewport test, not eyeballing) — 50% comfortably covers the secondary's natural content width at the 390px design scale, so nothing changed visually there; it only engages under real space pressure.
- **The map's "locate me" recenter pan is, as of this writing, the only transition in the codebase.** It's guarded with Tailwind's `motion-reduce:transition-none motion-reduce:duration-0` utilities rather than a hand-written `@media` block — see the comment at the top of `globals.css` for why, and for the standing rule: any future transition/animation must bring its reduced-motion handling in the same change.

## State: the single app context

`lib/app-context.tsx` exports one `AppProvider` (wrapped around `{children}` in `app/layout.tsx`, so it's available everywhere) and one `useAppState()` hook. No external state library — just `useState` + `useContext`. Nothing persists: a refresh resets everything to the defaults in `lib/mock-data.ts`, by design (no `localStorage`, no URL state).

| Field | Type | Default | Changed by |
|---|---|---|---|
| `selectedRouteId` | `"71" \| "61" \| "54"` | `"61"` | Clicking one of the three arrival tiles or choosing a destination whose nearest tracked route is computed from the map geometry |
| `departureTime` | `string` | `"By 9:00"` | Only the `/plan` primary button ("apply"). Never changes just from browsing `/plan` or hitting nav-back. |
| `viewMode` | `"map" \| "vehicle"` | `"map"` | The two-button `ViewToggle`, present in both `RouteMap` and `VehicleModelView`; route tiles remain below either view |
| `weatherDismissed` | `boolean` | `false` | The weather chip's X. One-way for the session — nothing un-dismisses it. |
| `selectedRecommendationId` | `string \| null` | `"rec-1"` | Checking a recommendation row on `/plan`. Cleared to `null` whenever a chart bar is clicked directly (see below) — the two must never show a stale relationship. |
| `selectedHourIndex` | `number` (index into `BARS`) | `2` (10:00 am) | Clicking a chart bar directly, or indirectly via `selectRecommendation` (which looks up that recommendation's `barIndex` and moves the chart to match) |
| `primarySelectValue` | `string` | `"Today"` | `/plan`'s primary `<select>` |
| `secondarySelectValue` | `string` | `"Next 7 days"` | `/plan`'s secondary `<select>` |

Two things that are deliberately *not* in this context, because they're screen-local, not app-wide:
- **The home location field's value.** `LocationField`'s inline-edit state (`editing`, `draft`) and the committed value live in `app/page.tsx`'s own `useState`. Not in the STATE section's list of six fields, so it stayed local.
- **The map's pan offset and "locate" flag.** Local to `RouteMap` (`locatedAtOrigin`, `lastActiveRouteId`). Purely presentational — see the recenter mechanism below.

## Flow: how `/` and `/plan` talk to each other

1. **Land on `/`.** Shows the defaults above — same visual state as the old static build (verified via screenshot diff, see below).
2. **Tap the time row** ("Leave now | By 9:00", now a real `<button>` via `TimeRow`'s new `onClick` prop) → `router.push("/plan")`.
3. **On `/plan`, browse freely.** Clicking a chart bar or checking a recommendation updates `selectedHourIndex`/`selectedRecommendationId` *live in context* — but critically, **not** `departureTime`. This is why nav-back doesn't need any snapshot/revert logic: browsing state and applied state are different fields, and only the primary button writes to the one that's actually displayed on `/`.
4. **Press "Use selected time"** → `handleApply()` in `app/plan/page.tsx` picks the human-readable label (`RECOMMENDATIONS` title if the current hour matches one, else the bar's own `time` string), calls `applyDepartureTime(...)`, then `router.push("/")`. The button is disabled via `canApply` (true whenever `selectedHourIndex` is set, which — given the default preselection — is effectively always, but the check exists for robustness).
5. **Nav-back chevron** (`NavBar`'s `onBack`, wired to `router.push("/")`) skips step 4 entirely — `departureTime` is untouched, so `/` shows whatever was last actually applied (or the default, if nothing ever was).

Because `AppProvider` wraps the whole app once in the root layout, this all works with zero prop-drilling between the two routes and zero extra plumbing for "did the user apply or cancel" — that distinction falls entirely out of which context setter got called.

## Interaction notes worth knowing

- **`Select` is now a real native `<select>`** (`components/Select.tsx`), not a styled div — full keyboard operability and ARIA come for free from the browser. The OS chrome is hidden with `appearance-none`; our own `ChevronDownIcon` is overlaid with `pointer-events-none` so clicks pass through to the select underneath. This is a breaking prop change (`value`/`options`/`onChange`/`label` now required) — `app/kitchen-sink/page.tsx`'s two usages were updated to the new signature with inert `onChange={() => {}}` handlers just to keep it compiling; nothing about kitchen-sink's own design changed. That prop change is also why `kitchen-sink/page.tsx` and `Select.tsx` both needed `"use client"` added — a Server Component can't pass an event-handler closure as a prop to a Client Component.
- **Radio-group semantics**: the `/plan` recommendations and the arrival-card route selection both use `role="radio"` inside a `role="radiogroup"` container — visually consistent with the design system and correct for "exactly one selected."
- **The map's "recenter" is a real, if illustrative, effect**, not a no-op button: selecting a different arrival card shifts a hardcoded per-route pixel offset (`ROUTE_FOCUS_OFFSET` in `app/RouteMap.tsx`) applied via CSS `transform: translate(...)` to a wrapper around the SVG + route overlays (the floating chip/toggle/utility buttons sit *outside* that wrapper, so they don't pan). "Locate me" resets the offset to `{0,0}` (centers on the origin ring, i.e. "my location"); picking a different route afterward resumes route-following. The offsets aren't derived from real geometry — they're just big enough to visibly demonstrate the effect. The 200ms transition is the app's only animation and is the reason `motion-reduce:` guarding shows up here specifically.
- **Chat and stats utility buttons are genuinely `disabled`** (native `disabled` attribute, `opacity-40`, `aria-label` suffixed "(not available yet)") — there's no feedback form or stats screen behind them yet, so per the brief they're visibly inert rather than dead-looking-live. Same treatment applied to `NavBar`'s hamburger (`menuDisabled` prop) — no menu drawer exists.
- **Map/Vehicle plus persistent arrival tiles:** issue #24 removed the non-reference List mode and restored `ArrivalCards` immediately below the main visual, matching the earlier home hierarchy. Route choices therefore remain scannable while either the real map or illustrative XD60 is open; `ViewToggle` contains only those two visual modes.
- **Focus rings**: every interactive element added or touched in this pass got an explicit `outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue` (or `-outline-on-ink` for the primary button's dark background, for contrast) rather than relying on the browser default, which is inconsistent across elements like custom-styled `<select>`s and non-`<button>` clickable rows.

## Verification performed for this pass

- Screenshot diff of both screens' **default** state (nothing clicked) against `ref-mobile.png`/`ref-wide.png` panel 2 — pixel-identical to the pre-interactivity static build, confirming the rewrite didn't drift the visuals. Screenshots: `/design/diff/home-interactive-1.png`, `/design/diff/plan-interactive-1.png`.
- A full flow walkthrough script (`scripts/test-flow.mjs`, Playwright, not a scratch file — rerun it after any state/flow change): lands on `/`, selects a card, confirms the summary row and map both update, navigates to `/plan` via the time row, picks a different hour, confirms the recommendation group clears appropriately, applies and confirms the return trip shows the new time, confirms route selection survived the round trip, confirms nav-back does *not* apply a browsed-but-uncommitted hour, confirms the `/trip` redirect, weather dismiss, view-mode switch, location inline-edit (commit + Escape-cancel), disabled utility buttons, and the locate recenter effect. All 23 checks passed at last run.
- 320px viewport: both `/` and `/plan` hold exactly (`scrollWidth === clientWidth === 320`) — `/plan` is in fact tighter than before this pass (previously 321, now 320), likely because the native `<select>` renders marginally narrower than the old styled-div version.
- `tsc --noEmit`, `eslint`, and `next build` all clean.

## What is still NOT built

- **No live data.** All content is hardcoded in `lib/mock-data.ts` (`ROUTES`, `BARS`, `RECOMMENDATIONS`, the select option lists). Nothing calls an API, reads a `contracts.ts` type, or talks to PRT/Google.
- **No persistence.** Everything above lives in a `useState` inside `AppProvider`; a page refresh resets to the mock-data defaults. This is deliberate, per the brief, not a gap.
- **Static map placeholder, not a real map.** `RouteMap`'s street texture is a hand-drawn SVG grid; the "map" is a fixed illustration with hardcoded route paths and coordinates, not tied to any real geography, geocoding, or map SDK. The recenter pan (above) moves a CSS transform, not an actual viewport over real map data.
- **Chat feedback and crowding-stats screens don't exist** — their utility buttons are disabled, not stubbed with placeholder content.
- **No menu drawer** — the hamburger is disabled on every screen.
- **Font files are real, not placeholder** (converted from the licensed OTFs via `wawoff2`, sources kept out of the repo) — noting this again since it wasn't always true earlier in this build.

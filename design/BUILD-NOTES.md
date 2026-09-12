# LoadLine build notes

What future-you (or anyone else picking this up) needs to know that isn't obvious from reading the code cold. Written after the static `/plan` and `/trip` screens were built and diffed against the reference renders. See `busappfrontend/app/globals.css` for the tokens themselves — this file is the *why*.

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
- **No `@media (prefers-reduced-motion)` block exists**, deliberately — see the comment at the top of `globals.css`. There are currently zero transitions or animations anywhere in the codebase to reduce. The first commit that adds any interaction-state motion must add the reduced-motion handling for it in the same change.

## What is NOT built

- **No live data.** All content on `/plan` and `/trip` is hardcoded sample data (`BARS`, `CARDS` arrays, literal strings). Nothing calls an API, reads a `contracts.ts` type, or talks to PRT/Google.
- **No routing/navigation.** `NavBar`'s back/menu buttons and every `onClick`/`onToggle` prop across the primitives are wired as optional callbacks with no default behavior — nothing actually navigates between `/plan` and `/trip`, and the two screens don't share state.
- **No state management.** `Checkbox`/`ListRow`/`IconToggle` are controlled components; nothing in the app currently holds their state (`ArrivalCards`, `CrowdingChart`, etc. render static props). Clicking a checkbox or toggle on either screen does nothing.
- **Static map placeholder, not a real map.** `RouteMap`'s street texture is a hand-drawn SVG grid; the "map" is a fixed illustration with hardcoded route paths and coordinates, not tied to any real geography, geocoding, or map SDK. It was built this way deliberately — no map SDK was to be used — but it means route shapes, distances, and positions are illustrative only.
- **Font files are real, not placeholder** (converted from the licensed OTFs via `wawoff2`, sources kept out of the repo) — this part *is* live, just noting it since earlier in this build it wasn't.

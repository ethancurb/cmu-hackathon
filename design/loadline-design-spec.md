# LoadLine — Design Spec

Measured from two renders: a 1536×1024 three-panel mockup and a 288×634 mobile screen. All pixel values below are at the **288px mobile render scale**. Multiply by 1.35 for a 390px iPhone viewport.

This system descends from the BurnerOS rules but breaks four of them. Those breaks are the identity, so they are listed first.

## What changed from Burner

| | Burner | LoadLine |
|---|---|---|
| Radius | `0` everywhere | `2px` on controls, cards, buttons, chips. Still `0` on chart bars. |
| Body text | muted blue `#3b5ba5` | saturated royal blue, near-primary |
| Case | uppercase chrome and labels | sentence case almost everywhere. Uppercase only on the primary action button and the secondary select. |
| Headlines | `#141414` | pure `#000000` |

Borders also lightened: Burner used 1px ink on everything, LoadLine uses 1px mid-gray on inputs and cards, reserving dark strokes for selected state.

## Typefaces

Two families. No third face appears in either mockup.

**PP Editorial New**, Regular 400, `#000000`. Used twice and only twice: the `LoadLine` wordmark and the page headline. Never colored, never bold, never uppercase.

**PP Fraktion Mono**, Regular 400 and Bold 700. Everything else without exception: body, labels, numbers, axis ticks, buttons, nav, footnotes.

### Type scale

Anchored on measured cap heights (serif cap ≈ 0.70em, mono cap ≈ 0.72em).

| Role | Size | Face | Weight | Case | Color |
|---|---|---|---|---|---|
| Page headline | 40px | Editorial New | 400 | Sentence, ends in a period | `#000000` |
| Wordmark | 20px | Editorial New | 400 | As-drawn | `#000000` |
| Emphasis number | 17px | Fraktion Mono | 700 | Sentence | blue |
| Location subhead | 17px | Fraktion Mono | 400 | Sentence | blue |
| Row title | 14px | Fraktion Mono | 700 | Sentence | blue |
| Body / row subtitle | 14px | Fraktion Mono | 400 | Sentence | blue |
| Label / axis / nav | 12px | Fraktion Mono | 400 | Sentence | blue |
| Button label | 12px | Fraktion Mono | 400 | UPPERCASE, `.08em` tracking | white on ink |
| Footnote | 10px | Fraktion Mono | 400 | Sentence | blue at 70% |

The hierarchy inside a list row is carried by **weight, not color**. Title is Bold, subtitle is Regular, both the same blue. Do not tint the subtitle.

Headline leading is tight, roughly 1.05. Mono body leading is roughly 1.45.

## Color

```
--canvas:      #fcfbf7   app background, warm off-white
--page:        #f5f4ef   surround behind the device frame
--surface:     #ffffff   cards, inputs, chips, map panel

--ink:         #000000   headline + wordmark ONLY
--ink-deep:    #172431   filled icons, badges, primary button, checkbox stroke
--blue:        #0a38cc   all mono text, stroked icons, links
--lime:        #c1e003   selection, and nothing else

--rule:        #e4e5e3   horizontal dividers between rows
--border:      #707780   input and select borders
--border-soft: #c9ccd1   card and chip borders on the map layer
--bar:         #c2c6ca   unselected chart bars
--on-ink:      #ffffff   type on ink-deep
```

Two measurement notes. `--ink-deep` reads `#172431` in the high-resolution mockup and `#212b33` in the mobile capture; `#172431` is the more reliable sample. `--blue` is bracketed at `#0733be` and `#0b3edf` by the two renders, and `#0a38cc` sits between them.

Lime is the only saturated non-blue in the system. It marks the currently selected thing and never appears as decoration, background, or branding.

## Geometry

```
gutter:        20px each side (content width 248px)
radius:        2px   controls, cards, buttons, chips, checkbox
radius:        0     chart bars
border-width:  1px everywhere
control-height:32px  selects and the footer button
```

Every horizontal divider spans the full content width, edge to edge of the gutter, `1px solid var(--rule)`.

## Icons

Two treatments, and the distinction is meaningful.

**Filled glyphs** — map pin, weather cloud, bus, map, walking figure, seat. Solid `--ink-deep`, no stroke. These represent physical things in the world.

**Stroked glyphs** — pencil, clock, chevrons, the close X. 2px stroke, square caps, no rounding, `currentColor` so they take the blue of the text they sit beside. These represent actions and controls.

### Close X

Not Burner's pixel-art X. This is a clean geometric X: two 2px strokes crossing at 45°, equal length, square caps, 14px box, `currentColor`. It appears inline at the end of a dismissible chip, not floating in a corner.

## Modules

### Nav bar
Three-part row, 40px tall. Left: back chevron (2px stroke, blue) plus destination label in 12px mono blue. Center: wordmark, optically centered. Right: hamburger, three 2px `--ink-deep` bars, 17px wide, 5px apart.

### Page headline
40px Editorial New, black, left-aligned at the gutter, starting 27px below the nav. Written as a full sentence with a terminal period. A 17px mono blue subhead sits directly beneath with no gap beyond its own leading.

### Location field
Full-width, 32px tall, `--surface` fill, 1px `--border`, 2px radius. Filled pin at left, 17px mono blue value, stroked pencil at right. The pencil is the affordance; there is no separate edit button.

### Time row
Two halves split by a single 1px vertical rule at center, ~14px tall. No container, no borders. Left half is plain text, right half is a stroked clock plus text. Both 12px mono blue.

### Select controls
Row of two, 12px gap. Left flexes to fill, right sizes to content. Both 32px tall, `--surface`, 1px `--border`, 2px radius, stroked chevron-down at right.

The two are deliberately not identical: the **primary select is sentence case** (`Today`), the **secondary is uppercase with tracking** (`NEXT 7 DAYS`). That case difference is the only thing signalling rank between them.

### Crowding chart
Centered above the chart: a 17px Bold mono value and a 14px Regular mono descriptor, both blue, stacked.

Bars: 11 columns, 16px wide, 4px gap, 20px pitch. Fill `--bar`. Zero radius — the bars are the one place the 2px softening does not apply. Selected bar fills `--lime`.

A 1px vertical playhead in `--bar` sits at the selected column and extends roughly 30px above the tallest bar.

Baseline: 1px `--rule` spanning the full content width, wider than the bar group.

Axis: every other column labelled, 12px mono blue, centered under its bar.

Helper line below, left-aligned at the gutter, 10px mono blue at 70%.

### Recommendation list
A 1px `--rule` opens the section, then a 14px mono blue section label in sentence case. Not uppercase, not an eyebrow.

Rows are 45px tall, separated by 1px `--rule`, with a closing rule after the last row.

Row layout: 20px checkbox flush to the gutter, 16px gap, then a two-line text block (14px Bold title over 14px Regular subtitle), then a chevron-right pushed to the far edge.

**Checkbox**: 20px square, 2px radius. Unchecked is transparent with a 1.5px `--ink-deep` border. Checked fills `--lime`, keeps the border, and draws a 2px black check.

Footnote below the closing rule, 10px mono blue at 70%.

### Primary action button
Full content width, 32px tall, `--ink-deep` fill, 2px radius, **no border**. Label is 12px mono uppercase `--on-ink` with `.08em` tracking, centered.

When the action has a cost or duration, a filled glyph pins to the left and the value right-aligns, with the label staying centered: `[walk icon]  WALK TO STOP  2 min`.

### Map panel
`--surface` with a light gray street texture, 1px `--border-soft`, 2px radius. Floating controls sit on top at 8px inset:

- **Dismissible chip**, top-left: white, 1px `--border-soft`, 2px radius, filled glyph + 12px mono blue text + the stroked X.
- **Icon toggle pair**, top-right: two 40px squares, white, 1px `--border-soft`, 2px radius, filled `--ink-deep` glyphs. The active one carries a `--lime` bar underneath it, full button width, ~6px tall, 2px radius, separated by a 2px gap. The lime is below the button, not inside it.
- **Utility buttons**, bottom corners: same 40px square treatment, no lime.

Route lines are drawn in three states: solid `--ink-deep` for the active route, dashed mid-gray for alternates, dotted light gray for inactive. Origin is a blue ring dot, destination is a filled pin.

### Arrival cards
Row of three, equal width, 12px gap, 2px radius.

Unselected: `--surface` fill, 1px `--border-soft`.
Selected: `--canvas` fill, 1px `--ink-deep`, plus an 8px `--lime` square in the top-right corner inset ~8px.

Contents: route badge (filled `--ink-deep`, 2px radius, white mono Bold), 17px Bold blue time, then a filled seat glyph with 14px blue capacity text.

Above the row, two 12px mono blue labels justified to the outer edges.

### Summary row
Below the cards. Filled bus glyph, then a 17px Bold blue value over a 14px Regular blue label. Right side: stroked clock plus 14px blue status. No container.

### Step markers
In the wide layout only: `01 / Explore` above each panel, 12px mono blue, sentence case after the slash.

## States

| State | Treatment |
|---|---|
| Selected (chart bar) | `--lime` fill |
| Selected (checkbox) | `--lime` fill, black check, border retained |
| Selected (card) | `--ink-deep` border, `--canvas` fill, lime corner square |
| Active (icon toggle) | `--lime` bar beneath the button |
| Unselected | `--surface` fill, `--border-soft` |

Selection is always communicated by lime or by a darkened border. Never by a color change in the type.

## To confirm

Four values were interpolated across the two renders and are worth checking against the source file if one exists:

1. `--blue` exact hex (bracketed `#0733be`–`#0b3edf`)
2. `--ink-deep` exact hex (`#172431` vs `#212b33`)
3. Whether the footnote is a separate muted blue or just `--blue` at reduced opacity
4. Whether the render viewport is 288px or a downscaled 390px, which sets whether the headline is 40px or 54px

# CLAUDE.md

Project brief for Claude Code / Claude Desktop agents working in this repo.

## What this repo is

`aicharts` is a TypeScript library and MCP server that renders professional chart PNGs for AI agents. A single `render_chart` tool accepts a declarative config and returns a base64-encoded PNG. Used from Claude Desktop, Claude Code, Cursor, ChatGPT (via remote HTTP MCP), and directly as an npm library or Vercel HTTP endpoint.

## File map

Source of truth (SOT):

- `src/` — all library code (compiled to `dist/` on build).
- `package.json` — npm metadata, bin, scripts, dependencies.
- `tsconfig.json` — TypeScript config.
- `scripts/build.mjs` — esbuild bundler.
- `scripts/snapshot.mjs` — visual snapshot generator.
- `scripts/download-basemaps.mjs` — fetches Datawrapper basemaps at build time.
- `.plan/RESEARCH.md` — consolidated research, architectural decisions. Read first.
- `.plan/MASTER-PLAN.md` — phase-by-phase build plan.

Derived (do not edit by hand):

- `dist/` — esbuild output.
- `basemaps/` — downloaded JSON basemaps (checked in after build for serverless).
- `package-lock.json` — npm lockfile.

Agent-facing docs:

- `CLAUDE.md` — this file.
- `AGENTS.md` — imports for AGENTS.md-aware agents.
- `GEMINI.md` — mirror of AGENTS.md for Gemini CLI.
- `.github/copilot-instructions.md` — one-pager for GitHub Copilot.
- `llms.txt` — AI discovery index.

## Architecture

```
src/
  index.ts              library entry point; re-exports render(), types
  core/
    types.ts            ChartConfig, Theme, Canvas, SvgElement
    svg.ts              tiny SVG builder (text, rect, line, path, group)
    layout.ts           title / subtitle / legend / source / logo placement
    size.ts             inline (800x500) / share (1200x675) / poster (1600x2000)
    theme.ts            palette resolution + font fallback
  palettes/
    index.ts            registry of 10 palettes
  formatters/
    number.ts           smart numbers (k/M/B, commas, year detection)
    date.ts             span-based tick formatter
    percent.ts
    currency.ts
    tick.ts             Wilkinson "nice" ticks
  charts/
    index.ts            chart registry keyed by config.chart
    {line,bar,pie,...}  one module per chart type
  render/
    svg-to-png.ts       resvg-js adapter with font loading
    index.ts            render(config) -> Uint8Array PNG
  mcp/
    server.ts           shared MCP server with render_chart tool
    stdio.ts            stdio transport entry (the `aicharts` bin)
    http.ts             streamable HTTP transport
  api/
    chart.ts            Vercel serverless: POST + GET /chart
    mcp.ts              Vercel serverless: MCP HTTP endpoint
```

Pipeline:

1. Validate `ChartConfig` with zod.
2. Resolve `size` + `palette` into a `Theme` + `Canvas`.
3. Dispatch to `charts/<type>.ts` which returns `SvgElement[]`.
4. `core/svg.ts` serializes to SVG string.
5. `render/svg-to-png.ts` passes through resvg with bundled fonts to produce PNG.
6. MCP / API layers wrap the PNG in the right response shape.

All chart modules are pure: input config → output SVG elements. No I/O, no globals.

## How to add a new chart type

1. Add the chart name to the `chart` union in `src/core/types.ts`.
2. Create `src/charts/<name>.ts` exporting `render(config, theme, canvas): SvgElement[]`.
3. Register it in `src/charts/index.ts`.
4. Add a zod schema branch for the new type in the MCP tool input schema.
5. Add a sample dataset under `tests/fixtures/`.
6. Add a snapshot invocation in `scripts/snapshot.mjs`.
7. Run `npm run snapshot`, visually review `tests/snapshots/<name>-*.png`.
8. Add at least one edge-case unit test under `tests/unit/`.
9. Update the capability matrix in `README.md`.

## How to add a new palette

1. Create `src/palettes/<name>.ts` exporting a `Palette` object (colors, font stack, background, text, grid, accent).
2. Register in `src/palettes/index.ts`.
3. Add a row to the palette table in `README.md`.
4. Regenerate snapshots for at least one chart type in that palette to confirm it looks right.

## Running tests and snapshots

```
npm run build
npm test
npm run snapshot
```

Unit tests: `node --test tests/unit/**/*.test.mjs`. Snapshots: deterministic PNGs written to `tests/snapshots/`. Visual regressions reviewed by human or subagent.

## Conventions

- English only in code, commits, and docs.
- No comments unless non-obvious. Self-documenting names preferred.
- Flat config, one concept per key. No polymorphism per chart type in the public config.
- Prettier defaults: single quotes, trailing commas, 2-space, semi, printWidth 100.
- No emojis in committed files.
- Rendering is pure; PNG rasterization happens only in `src/render/`.
- Guard-rails (see `.plan/RESEARCH.md` §5): pie >6 slices auto-groups "Other"; 3D refused; year not comma-separated; low-contrast text auto-darkened.

## Build and deploy

```
npm run build         # esbuild + tsc --emitDeclarationOnly
npm publish           # triggered via release.yml on v* tag
vercel deploy         # api/*, demo/ served at mcp-charts.vercel.app
```

`bin` exposes `aicharts` → `dist/mcp/stdio.js` with shebang, marked executable by build.

## Read next

- `.plan/RESEARCH.md` for architectural decisions, competitive analysis, chart design.
- `.plan/MASTER-PLAN.md` for the phase-by-phase implementation plan.

## Workflow non-negotiables (PO standing orders)

- **Always push after every iteration.** PO reviews on GitHub and needs
  the latest commit visible before they can look at it. Sequence every
  iteration ends with: `git commit` → `git push origin master`. Do not
  wait for "please push" — it's already granted.
- **GitHub auth quirk**: `gh auth status` shows two accounts — active is
  `helgilibrary` (no push rights to this repo) and inactive is `knapejar`
  (owner). Before pushing, run `gh auth switch -u knapejar`; then
  `git push origin master` works over HTTPS with the stored token.
- **Git identity**: user hasn't set `user.email`/`user.name` globally, so
  use inline overrides per commit: `git -c user.email=jak3679@gmail.com
  -c user.name="Jarda Knap" commit ...`. Do not write these into
  `.git/config` or the global config.
- **Pre-commit hook** at `.githooks/pre-commit` regenerates zoos when
  `src/` or `examples/specs.json` changes, but it is opt-in via
  `git config core.hooksPath .githooks` and the PO has NOT activated it.
  Always run `npm run zoo:all` manually before committing render-affecting
  changes.

## Product-owner complaint log (kept private, never surfaced to user)

The PO reviews the example zoo after each milestone and files complaints. Log them here with the shipped fix so the next iteration does not regress.

### Iteration: model-zoo readability (2026-04-24)

Complaints:
1. "Fonts are too small everywhere — unreadable on desktop, impossible on phone." All four font tiers (title/subtitle/label/axis) were width-clamped low (max 14px on labels, 32px on title).
2. "I want only 2 font sizes in the whole chart, configured per format (landscape / square / portrait). Chart must scale to format."
3. "Default returned chart should be square." The project shipped `share` (landscape) as default.
4. "Every zoo chart must look good even with terrible input — long title, one bar, zero data. Add an edge-case zoo."
5. "Horizontal bar 02-hyperscalers: right side empty, left side huge padding — make padding symmetric." Caused by `niceScale` overshooting dataMax combined with asymmetric yTickWidth.
6. "Line 03-global-warming: top gridline crams into subtitle, bottom -0.5 tick collides with source footer. Hide the colliding bottom tick automatically."
7. "Stacked-area 05-energy-mix has ugly finger-like protrusions on the right and left edges." Root cause: `curvedAreaPath()` concatenates `top + reverse(bottom)` and runs one continuous Catmull-Rom across the vertical edge transitions, so endpoint control points bulge outside the plot.
8. "README needs a visible URL under each image pointing to the live production render." Only the image itself was a clickable link.
9. "Provide all zoos in all three aspect ratios — 3 x 50 = 150 images side by side."
10. "Add an npm workflow so any commit already contains up-to-date images (local pre-commit or at least npm release)."

Decisions taken (record why, not just what):
- **Two-font-size system**: `big` (title only, weight 700) and `small` (everything else: subtitle, labels, axis, legend, value labels, source). Hierarchy comes from weight + color, not a third size. Values per preset: `inline` 30/18, `share` 40/22, `square` 44/24, `poster` 56/30. Small >= 18px so a 2× phone downscale stays legible.
- **New `square` preset (1200x1200)**, flipped `DEFAULT_SIZE` to `square`. Backward compat: `inline`, `share`, `poster` kept by name.
- **Horizontal bar fix**: tight `xMax = dataMax` (no headroom). Nice-rounded tick values still drawn, but the last tick only if ≤ dataMax * 1.02. This removes the right-side void without mirroring a fake label column.
- **Vertical breathing room**: `extraTop = smallFont * 1.5` (scales with typography). Footer min = `max(96, smallFont * 4)`. Bottom-most Y tick label is suppressed when its baseline would sit within `smallFont * 1.2` of the footer zone.
- **Stacked-area fix**: curve `top` (left→right) and `bottom` (right→left) as independent paths, join with straight `L` at the two ends. This is the idiomatic shape for a cardinal/Catmull-like curve through samples — tangent lookups no longer reach across the vertical edge segments.
- **Percent formatter**: auto-detect scale. If `maxAbs >= 1.5`, treat values as already-percent (show as-is with `%`), else multiply by 100 as before. Threshold covers fractions up to 150% without false positives.
- **Zoo generator**: one `specs.json` rendered at three aspect ratios via an `--aspect` flag. Edge-case specs live in a separate `examples/edge-cases.json`. Pre-commit hook runs `npm run zoo:all` which renders all four zoo READMEs deterministically.

Guarantees for the next iteration:
- If the PO complains again about small fonts, check the TYPOGRAPHY table in `src/core/layout.ts` first — do not reintroduce a width-clamp formula.
- If a new chart type ships, it MUST use `bigFontSize()` / `smallFontSize()` helpers and no hard-coded font sizes.
- The stacked-area curve pattern (independent top/bottom curves + straight edge joins) is the reference for any new band chart.
- The edge-case zoo is the acceptance gate; no release if any edge-case render looks bad.

### Iteration: post-zoo review (2026-04-24 #2)

The PO reviewed the freshly-shipped zoo on GitHub and filed follow-ups. The earlier fixes landed but were under-tuned. Record what they asked for and what I changed.

Complaints:
1. "01 AI adoption — small font, make it bigger still." Landscape small=22 was still reading as cramped for them.
2. "02 hyperscalers — bars still not reaching the right edge, too much empty space on the right." The fix from iteration #1 kept a fixed `labelSize * 3.5` gutter for the value labels, which is ~3x wider than the widest actual "31" value, leaving dead space.
3. "Check every chart's left/right margins — left usually wasted, right too tight." Line and area charts had yTickWidth on the left but nothing mirroring it on the right, so the plot painting floated left of center.
4. "03 warming — still small font, bump maybe 2x for square. And -0.5 is still there, crowded into source, hide the bottom-most Y-axis label from below."

Decisions taken:
- **Typography bumped** again: landscape 46/28, square 60/34, portrait 72/42 (was 40/22, 44/24, 52/28). Small font on square is 34 ≈ 1.4x the previous 24; near the PO's "2x" request without becoming comical at large bars/legends. Compact-threshold fallbacks (inline 34/20, short-portrait 56/30) ensure 800x500 still works.
- **Horizontal-bar value label reserve**: switched from fixed `labelSize * 3.5` to the actual widest rendered value label width + `labelSize * 0.8` gap. For "31"-scale values the reserve drops from ~80px to ~35px, and the longest bar now reaches the right edge instead of floating in dead space.
- **Horizontal-bar yTickWidth**: recomputed from the actual widest category's text width (`estimateTextWidth(cat, size) + size * 0.8`) instead of a 0.55x character-count heuristic. Cap at `canvas.width * 0.34` so a 40-char label can't push the plot off the canvas.
- **`rightGutter` option** added to `computePlotArea` and defaults to `yTickW * 0.5` for every axes chart. Gives line/area/vertical-bar/combo/grouped/stacked-bar charts a small right-side buffer so the plot painting is visually balanced. Horizontal bar and stacked-bar horizontal pass their own `rightGutter` equal to the value-label reserve.
- **Bottom-most Y-axis label skipped** unconditionally when there are ≥3 ticks (new `skipBottomLabel` option on `renderYAxis`, default true). Gridline stays; only the numeric label is suppressed. Also tightened the footer-collision threshold from `size * 0.6` to `size * 1.4` so any other tick that would crowd the source also gets dropped.
- **`extraBottom = small * 1.5`** added to `computePlotArea` so the plot never hugs the footer zone.
- **`footerH` minimum raised** from `font * 3.0` to `font * 3.2` so the source + logo get room.

The effect visible in 210 freshly regenerated zoo images: fonts are clearly bigger, hyperscalers' longest bar now sits flush against the right gutter, warming's bottom axis labels are gone, and every line-chart plot painting has a tiny right-side cushion that balances the Y-tick column on the left.

### Iteration: Frame system — strict layout contract (2026-04-24 #3)

PO was still seeing drift and overlap across chart types. Root cause: every chart module was computing its own layout, `reservedHeaderHeight()` under-estimated the bottom of the subtitle (returned 124px when subtitle baseline was actually at 201px for square preset), so the legend rendered on top of the subtitle. And there was no test that asserted regions did not overlap.

Complaints and fixes:

1. "Subtitle and legend share the same row." Cause: `reservedHeaderHeight` omitted the final line-height + descender, so `legendY = reservedHeaderHeight + LEGEND_GAP + fontSize` landed inside the subtitle text. Fix: `reservedHeaderHeight` now delegates to `computeFrame` and returns `frame.subtitle.y + frame.subtitle.height` — the actual pixel bottom of the text.

2. "Huge category names on horizontal bars get clipped at the left canvas edge." Cause: `y TickWidth` was capped at `canvas.width * 0.34`, but the end-anchored text still extended left past the margin when the label was longer than that cap. Fix: `ellipsize()` the category text to fit within `yTickBandWidth - labelSize * 0.8`.

3. "Rotated X-axis labels spill into the source zone." Cause: `xTickBandHeight` was always `small * 1.8` regardless of rotation; rotated labels of length L extend `L * 0.64` downward. Fix: new `estimateBandXAxisHeight(canvas, categories, availableWidth)` helper in axes.ts that mirrors the rotation decision and returns `maxCatWidth * 0.7 + size * 0.8` when rotation is expected. Passed to `computeFrame` as `xTickBandHeight` by bar (vertical), grouped-bar, stacked-bar (vertical), combo.

4. "Pie / donut sidebar legend duplicates the outside labels." Cause: when `showLegend` was true AND `labelPlacement` was not explicitly set, both the sidebar legend and the outside labels rendered — the outside labels overlapped the edge of the donut and duplicated the legend text. Fix: `autoSuppressLabels = showLegend && !explicitPlacement` — if the library is auto-deciding, let the sidebar legend carry the labels alone.

5. "First and last X-axis tick labels hang over the edge of the plot." Cause: centered `text-anchor` on first/last ticks made half the label bleed left of `plot.x` / right of `plot.x + plot.width`. Fix: first tick uses `text-anchor: start`, last uses `text-anchor: end`, middle ticks stay `middle`.

6. "Line chart inline series label (`share`) visually collides with value label (`74%`) at the endpoint." Cause: both were drawn near the same point. Fix: when `showValueLabels` covers the last point, suppress the inline series label (the value label already identifies the line).

**New module: `src/core/frame.ts`.** Single source of truth for positioning. `computeFrame(canvas, opts)` returns a `Frame` with named bounding boxes:

```
margin: { top, right, bottom, left }  // per-preset fixed pixels, not percent
inner:  BBox                           // canvas minus margin
title:  BBox | null                    // flush left/right with margin, touches top
subtitle: BBox | null                  // below title + gapTitleToSubtitle
legend: BBox | null                    // below header stack + gapHeaderToLegend, wraps to multi-row
plot:   BBox                           // fills remainder, has min floor (40% × 25% of canvas)
yTickBand: BBox                        // fixed-width strip to the left of plot
xTickBand: BBox                        // strip below plot, reserves rotated-label height
source: BBox | null                    // touches margin bottom + left
logo:   BBox | null                    // touches margin bottom + right
tokens: FrameTokens                    // small/big font, descender, ascender, gaps — derived from canvas
regions(): DebugRegion[]               // for overlay rendering
```

Key invariants (see `tests/unit/frame.test.mjs`, 15 tests):
- Every bbox is contained in `inner` (margin-respected).
- Stacked regions (title → subtitle → legend → plot → xTickBand → source/logo) do not overlap pairwise.
- `plot.width >= canvas.width * 0.4`, `plot.height >= canvas.height * 0.25` — enforced floor even when title/subtitle/legend grow.
- `title.x === margin.left`, `title.y === margin.top`, `source.x === margin.left`, `logo.x + logo.width === canvas.width - margin.right`.
- `xTickBand.y === plot.y + plot.height + gapPlotToXTicks`, `yTickBand.x + yTickBand.width === plot.x`.

**Outer margin (`outerMargin(canvas)`) is per-preset, pixel-fixed** — 24 (inline), 32 (share), 48 (square), 64 (poster). Never `%`-based — that was the mistake in the old `resolveCanvas` padding that scaled with height and produced 240px top padding on square. Fixed pixels are testable.

**Debug overlay.** Set `AICHARTS_DEBUG_LAYOUT=1` (or pass `{ debugLayout: true }` to `render`) to get colored rects + labels on each region so the PO (or a subagent) can eyeball boundaries. This was how the remaining overlaps were caught during this iteration.

**Migration status.** All 11 chart modules now route through `computeFrame`: line, bar (h+v), stacked-area, stacked-bar (h+v), grouped-bar, combo, pie, donut, bar-split, line-split, geo. Old `computePlotArea` in axes.ts is still exported but unused by ship code — left for safety during migration; will be removed after a quiet period.

Guarantees for the next iteration:
- New chart types MUST call `computeFrame` and use `frame.plot`. Hand-rolled layout is a regression.
- If any region appears outside the margin box, that is a bug in `computeFrame`, not a feature request.
- If you add a band X-axis chart, you MUST call `estimateBandXAxisHeight(canvas, categories, availableWidth)` and pass the result as `xTickBandHeight` to `computeFrame`, otherwise rotated labels will clip into the source.
- Render the debug overlay and eyeball at least one square + one portrait before committing — rebuilds are fast (~140s for the full zoo across 3 aspects × 70 specs).

The effect visible in the freshly regenerated 210 zoo images: subtitle + legend no longer share a row on stacked-area; horizontal-bar long labels ellipsize instead of clipping; rotated X-labels on grouped-bar do not touch source; donut legend no longer duplicates outside labels; line chart first X-tick is left-anchored at `plot.x` instead of centered; every chart has the same 48px outer margin on square preset.

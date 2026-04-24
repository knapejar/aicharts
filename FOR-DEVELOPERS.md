# aicharts — developer guide

Contributor reference for building, extending, and shipping `aicharts`. For
end-user docs (install, try-it URLs, ChatGPT/Claude setup) see
[README.md](./README.md).

## What this repo is

A TypeScript library and MCP server that turns a declarative JSON config into a
PNG chart. A single `render_chart` tool accepts a flat config with `chart`,
`data`, and optional `title`, `subtitle`, `source`, `palette`, `size`, and
returns a base64 PNG rendered via SVG then resvg. Works via stdio (local
install) and HTTP (Vercel deployment at
[https://mcp-charts.vercel.app](https://mcp-charts.vercel.app)).

## Architecture

```
src/
  index.ts              library entry point; re-exports render(), types
  core/
    types.ts            ChartConfig, Theme, Canvas, SvgElement
    svg.ts              tiny SVG builder (text, rect, line, path, group)
    layout.ts           title / subtitle / legend / source / logo placement
    size.ts             inline / share / poster
    theme.ts            palette resolution + font fallback
  palettes/             registry of 10 palettes
  formatters/           number, date, percent, currency, tick
  charts/               one module per chart type + registry
  render/               svg-to-png via resvg
  mcp/                  server.ts, stdio.ts, http.ts
  api/                  Vercel serverless handlers
```

Pipeline:

1. Validate `ChartConfig` with zod.
2. Resolve `size` + `palette` into a `Theme` + `Canvas`.
3. Dispatch to `charts/<type>.ts` which returns `SvgElement[]`.
4. `core/svg.ts` serializes to SVG string.
5. `render/svg-to-png.ts` passes through resvg with bundled fonts to produce PNG.
6. MCP / API layers wrap the PNG in the right response shape.

All chart modules are pure: input config → output SVG elements. No I/O, no
globals.

## Capability matrix

| Chart        | Legend | Multi-series | Stacking | Custom palette | Sizes                   |
| ------------ | ------ | ------------ | -------- | -------------- | ----------------------- |
| line         | yes    | yes          | no       | yes            | inline / share / poster |
| line-split   | yes    | yes          | no       | yes            | inline / share / poster |
| bar          | auto   | no           | no       | yes            | inline / share / poster |
| grouped-bar  | yes    | yes          | no       | yes            | inline / share / poster |
| stacked-bar  | yes    | yes          | yes      | yes            | inline / share / poster |
| bar-split    | yes    | yes          | no       | yes            | inline / share / poster |
| stacked-area | yes    | yes          | yes      | yes            | inline / share / poster |
| combo        | yes    | yes          | no       | yes            | inline / share / poster |
| pie          | auto   | no           | no       | yes            | inline / share / poster |
| donut        | auto   | no           | no       | yes            | inline / share / poster |
| geo          | auto   | no           | no       | yes            | inline / share / poster |

## Palettes

Ten curated palettes, each with matching typography. Default is `clarity`.

| Palette          | Use                           | Typeface                   |
| ---------------- | ----------------------------- | -------------------------- |
| clarity          | default, balanced categorical | Inter                      |
| boardroom        | corporate                     | Source Serif / Source Sans |
| editorial        | FT / Economist look           | Playfair + Source Sans     |
| vibrant          | marketing                     | Poppins                    |
| carbon           | IBM-style, accessible         | IBM Plex Sans              |
| viridis          | sequential scientific         | IBM Plex Sans              |
| earth            | warm editorial                | Libre Franklin             |
| twilight         | dark mode                     | Inter                      |
| mono-blue        | single-series emphasis        | Source Serif / Source Sans |
| diverging-sunset | signed data                   | Merriweather + Lato        |

Override with a custom palette:

```json
{
  "palette": {
    "colors": ["#0f172a", "#2563eb", "#f97316"],
    "font": "Inter",
    "background": "#ffffff",
    "text": "#0f172a"
  }
}
```

## How to add a new chart type

1. Add the chart name to the `chart` union in `src/core/types.ts`.
2. Create `src/charts/<name>.ts` exporting
   `render(config, theme, canvas): SvgElement[]`.
3. Register it in `src/charts/index.ts`.
4. Add a zod schema branch for the new type in the MCP tool input schema.
5. Add a sample dataset under `tests/fixtures/`.
6. Add a snapshot invocation in `scripts/snapshot.mjs`.
7. Run `npm run snapshot`, visually review `tests/snapshots/<name>-*.png`.
8. Add at least one edge-case unit test under `tests/unit/`.
9. Update the capability matrix above.

## How to add a new palette

1. Create `src/palettes/<name>.ts` exporting a `Palette` object (colors, font
   stack, background, text, grid, accent).
2. Register in `src/palettes/index.ts`.
3. Add a row to the palette table above.
4. Regenerate snapshots for at least one chart type in that palette to confirm
   it looks right.

## Running tests and snapshots

```
npm run build
npm test
npm run snapshot
```

Unit tests: `node --test tests/unit/**/*.test.mjs`. Snapshots: deterministic
PNGs written to `tests/snapshots/`. Visual regressions reviewed by human or
subagent.

## Build and deploy

```
npm run build         # esbuild + tsc --emitDeclarationOnly
npm publish           # triggered via release.yml on v* tag
vercel deploy         # api/*, demo/ served at mcp-charts.vercel.app
```

`bin` exposes `aicharts` → `dist/mcp/stdio.js` with shebang, marked executable
by build.

## HTTP API reference

### POST /chart

Body:

```json
{
  "chart": "bar",
  "data": [{ "label": "A", "value": 12 }],
  "title": "Hello",
  "subtitle": "optional",
  "source": "optional",
  "palette": "clarity",
  "size": "share"
}
```

Returns: `image/png` body.

### GET /chart?config=\<base64url\>

Same schema, `config` is base64url-encoded JSON. Useful for embedding in
Markdown:

```md
![chart](https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhciIsImRhdGEiOlt7ImxhYmVsIjoiQSIsInZhbHVlIjoxMn1dfQ)
```

### MCP tool: `render_chart`

Input (summary):

```
chart: 'line' | 'bar' | 'grouped-bar' | 'stacked-bar' | 'bar-split'
       | 'stacked-area' | 'combo' | 'line-split' | 'pie' | 'donut' | 'geo'
data: object[]
title?, subtitle?, source?: string
x?, y?: string               // column names for tabular inputs
palette?: string | PaletteObject
size?: 'inline' | 'share' | 'poster'
```

Output: `ImageContent` block with base64 PNG. Enforces a 900 KB safety margin
below the 1 MB MCP cap.

Example call from an agent:

```json
{
  "name": "render_chart",
  "arguments": {
    "chart": "bar",
    "data": [
      { "label": "A", "value": 12 },
      { "label": "B", "value": 18 }
    ],
    "title": "Hello"
  }
}
```

## Conventions

- English only in code, commits, and docs.
- No comments unless non-obvious. Self-documenting names preferred.
- Flat config, one concept per key. No polymorphism per chart type in the
  public config.
- Prettier defaults: single quotes, trailing commas, 2-space, semi,
  printWidth 100.
- No emojis in committed files.
- Rendering is pure; PNG rasterization happens only in `src/render/`.
- Guard-rails (see `.plan/RESEARCH.md` §5): pie >6 slices auto-groups "Other";
  3D refused; year not comma-separated; low-contrast text auto-darkened.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). New charts ship with a snapshot PNG
and at least one edge-case test.

## License

MIT — see [LICENSE](./LICENSE).

## Sponsor

Funding links in [.github/FUNDING.yml](./.github/FUNDING.yml).

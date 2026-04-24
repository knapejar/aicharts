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

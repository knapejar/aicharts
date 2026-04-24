# Copilot instructions for aicharts

aicharts is a TypeScript library and MCP server that renders declarative chart configs to PNG via SVG + resvg-js. Language is English only.

## Non-negotiables

- Flat chart config: one concept per key, no polymorphism per chart type. Example: `{ chart: 'line', data: [...], x: 'year', y: 'revenue', title, subtitle, source, palette, size }`.
- No runtime dependency on Chart.js, ECharts, D3, or headless browsers.
- All chart modules live under `src/charts/<name>.ts` and export `render(config, theme, canvas): SvgElement[]`.
- All rendering is pure (no I/O). Rasterization only in `src/render/svg-to-png.ts`.
- No comments unless non-obvious. Self-documenting names preferred.
- Prettier defaults: single quotes, trailing commas, 2-space, semi true, printWidth 100.

## When adding a chart

See `CLAUDE.md` -> "How to add a new chart type". Minimum: type union, module, registry entry, fixture, snapshot, edge-case test, README row.

## Guard-rails

- Pie > 6 slices -> auto-group `Other`.
- 3D refused.
- Year values (1900-2100 ints) -> no thousands separator.
- Low-contrast text auto-darkened.

## Tests

`npm test` for node --test unit tests. `npm run snapshot` for deterministic PNG generation visually reviewed by humans or subagents.

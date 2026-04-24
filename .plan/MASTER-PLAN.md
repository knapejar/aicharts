# AI Charts — Master Implementation Plan

Autonomous overnight build. Each phase runs via one subagent, followed by a verifier subagent when visual output is produced. Every subagent MUST `git commit` its own work at the end.

Target deliverable by morning: working `npm install aicharts`, working `npx aicharts` MCP server, working Vercel POST/GET API, 11 chart types with visual snapshots, complete polish files, live demo page.

## Phase checklist

### Phase 1 — Scaffolding & polish files
- [x] package.json (name=aicharts, bin, exports, type=module, scripts: build/dev/test)
- [x] tsconfig.json
- [x] esbuild config (scripts/build.mjs)
- [x] .gitignore, .gitattributes
- [x] README.md (hero, badges, install matrix, capability matrix, quickstart)
- [x] LICENSE (MIT)
- [x] CLAUDE.md (agent-facing: file map, architecture, conventions)
- [x] AGENTS.md (skill/doc imports)
- [x] GEMINI.md
- [x] CONTRIBUTING.md
- [x] SECURITY.md
- [x] CODE_OF_CONDUCT.md
- [x] CHANGELOG.md (keep-a-changelog format)
- [x] llms.txt (AI discovery index)
- [x] .github/workflows/ci.yml (lint + test + build + visual snapshot)
- [x] .github/workflows/release.yml (npm publish on tag)
- [x] .github/ISSUE_TEMPLATE/{bug_report,feature_request}.md
- [x] .github/PULL_REQUEST_TEMPLATE.md
- [x] .github/FUNDING.yml
- [x] .github/copilot-instructions.md
- [x] .claude-plugin/plugin.json, marketplace.json
- [x] vercel.json
- [x] mcp.json (manifest)
- [x] Empty src/ scaffolding
- [x] Initial commit

### Phase 2 — Core engine
- [x] src/core/types.ts — TypeScript types for chart configs
- [x] src/core/svg.ts — SVG builder (text with measuring, line, rect, path, group)
- [x] src/core/layout.ts — title/subtitle/source/logo/legend placement math
- [x] src/core/size.ts — 3 preset sizes with defaults
- [x] src/core/theme.ts — palette application
- [x] src/palettes/index.ts — all 10 palettes registered
- [x] src/palettes/{name}.ts — each palette a module
- [x] src/formatters/number.ts — smart number formatter (k/M/B, commas, year detection)
- [x] src/formatters/date.ts — date span heuristics
- [x] src/formatters/percent.ts
- [x] src/formatters/currency.ts
- [x] src/formatters/tick.ts — Wilkinson "nice" ticks
- [x] src/render/svg-to-png.ts — resvg-js adapter
- [x] src/render/index.ts — render(config) entry point
- [x] src/fonts/ — Google Fonts bundled
- [x] tests/fixtures/ — sample datasets
- [x] scripts/snapshot.mjs — generate PNG snapshots script
- [x] Initial tests passing
- [x] Commit

### Phase 3 — Line chart + visual review loop
- [x] src/charts/line.ts
- [x] Sample datasets (multiple line series, single line, edge cases: NaN/empty/negative)
- [x] Generate snapshots to tests/snapshots/line-*.png
- [x] Manual visual review (human/subagent reviewer)
- [x] Fix issues, re-render
- [x] Commit

### Phase 4 — Bar charts
- [x] src/charts/bar.ts (horizontal + vertical, single series)
- [x] src/charts/grouped-bar.ts
- [x] src/charts/stacked-bar.ts
- [x] src/charts/bar-split.ts (small multiples)
- [x] Snapshots for each
- [x] Visual review + fixes
- [x] Commit

### Phase 5 — Area, combo, line-split
- [x] src/charts/stacked-area.ts
- [x] src/charts/combo.ts (bar + line)
- [x] src/charts/line-split.ts (small multiples)
- [x] Snapshots + review
- [x] Commit

### Phase 6 — Pie + donut
- [x] src/charts/pie.ts (with auto-group "Other" at 5% threshold)
- [x] src/charts/donut.ts (center value, inner radius config)
- [x] Snapshots + review
- [x] Commit

### Phase 7 — Geo chart
- [x] scripts/download-basemaps.mjs
- [x] basemaps/ folder with all Datawrapper basemaps
- [x] src/charts/geo.ts with projection + feature coloring
- [x] Support for world, europe, us-states, etc.
- [x] Snapshots + review
- [x] Commit

### Phase 8 — MCP server + Vercel API
- [x] src/mcp/server.ts (single render_chart tool)
- [x] src/mcp/stdio.ts (stdio entry)
- [x] src/mcp/http.ts (HTTP entry for Vercel)
- [x] api/chart.ts (Vercel POST/GET returning PNG)
- [x] api/mcp.ts (Vercel MCP endpoint)
- [x] Test MCP server locally with stdio
- [x] Test Vercel API locally
- [x] Commit

### Phase 9 — Live demo page
- [x] demo/index.html (no framework, vanilla)
- [x] demo/style.css
- [x] demo/app.js (chart picker, config editor, renders via API)
- [x] Deploy target in vercel.json
- [x] Commit

### Phase 10 — Agent scenario tests
- [x] tests/scenarios/birth-rate-report.ts (simulate agent building report)
- [x] tests/scenarios/company-metrics.ts
- [x] tests/scenarios/geo-usage.ts
- [x] Verify charts are generated and align with story
- [x] Commit

### Phase 11 — Final QA
- [x] Full visual review of all snapshots
- [x] Run all unit tests
- [x] Run agent scenarios end-to-end
- [x] Verify README install instructions work verbatim
- [x] Verify package publishes cleanly (npm pack)
- [x] Final commit + tag v0.1.0

## Subagent briefing template

Every subagent receives:
1. Brief description of their task
2. Reference to `.plan/RESEARCH.md` for context
3. Exact file list to create/modify
4. Success criteria
5. Reminder to `git add && git commit` with descriptive message at end
6. Reminder that language is English only

## Conventions
- Language: English only in code, docs, commits
- TypeScript for library code (compiled via esbuild + tsc for types)
- No comments unless non-obvious; self-documenting code preferred
- Prettier defaults, single quotes, trailing commas, 2-space indent
- No emojis in committed code unless deliberate design choice
- Each chart module exports `render(config, theme, canvas): SvgElement[]`
- All rendering is pure (input config → output SVG string), no side effects
- PNG rasterization happens only at the render/ layer via resvg-js

## Test data sources
- Given: internet usage by country (geo data)
- Given: CO2 emissions by year + fuel type (stacked area / line / combo)
- Fetch or synthesize additional 8 datasets:
  - Stock prices (multi-series line)
  - Revenue by region (bar + pie)
  - Marketing channel breakdown (stacked bar + donut)
  - Global temperature anomaly (line)
  - Population pyramid (bar-split horizontal)
  - Election results (bar + geo)
  - Edge case: single data point
  - Edge case: 100+ categories
  - Edge case: negative values
  - Edge case: all zeros / all identical

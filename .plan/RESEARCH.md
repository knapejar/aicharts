# AI Charts — Research Findings (Apr 2026)

Consolidated findings from 4 parallel research agents. This document is the source of truth for architectural decisions.

## 1. Competitive landscape

**Primary competitor**: `antvis/mcp-server-chart` (~4k stars)
- Weakness: proxies to Alipay's hosted service, returns URLs (privacy/uptime/geo concerns)
- Has 26 separate tools (one per chart type) — token bloat
- Geo charts only work with AMap (China-only)

**Secondary**: `KamranBiglari/mcp-server-chart` — 7 stars, doesn't render images yet.

**Adjacent**: QuickChart.io — AGPLv3 (contaminates), requires Cairo/Pango natives (not Vercel-compatible).

**Gap we fill**:
1. First MCP chart server that returns **local PNG as base64** (no third-party dependency)
2. Runs on **Vercel serverless** out of the box
3. **One tool, one spec** instead of 26 bloated tools
4. **Professional typography + opinionated themes** (LLMs output looks like Chart.js defaults today)
5. Simultaneous PNG for embedding + optional SVG fallback

## 2. Rendering stack (decided)

- **SVG-first generation** (pure TypeScript, no chart library dependency)
- **`@resvg/resvg-js`** for SVG→PNG rasterization (MPL-2.0, zero native deps, Vercel-compatible)
- **`@resvg/resvg-wasm`** fallback for Edge runtime
- **Bundled Google Fonts** as TTF/WOFF2 files loaded via resvg font fallback system
- **No Chart.js / ECharts / D3** — we own the visual language

Why SVG-first (not canvas): crisper text, better font rendering on Vercel serverless, smaller bundle, can serve raw SVG for high-DPI clients.

## 3. MCP architecture (decided)

**SDK**: `@modelcontextprotocol/sdk` (official TypeScript SDK)

**Transports**:
- `stdio` for local Claude Desktop / Claude Code / Cursor install
- `Streamable HTTP` at `/mcp` endpoint for remote (Vercel, ChatGPT custom connectors)

**Tool surface (v1)**: single fat tool `render_chart` with discriminator field `type`. Resist splitting per chart type.

**Image return**: base64 PNG in `ImageContent` block. Enforce <900 KB safety margin (1 MB Claude cap).

**Install commands**:
- Claude Desktop: `npx -y aicharts` via `claude_desktop_config.json`
- Claude Code: `claude mcp add aicharts -- npx -y aicharts`
- Remote: `claude mcp add --transport http aicharts https://api.aicharts.dev/mcp`
- ChatGPT: Settings → Connectors → Developer Mode → add HTTP URL

## 4. Repo polish files (inspired by caveman)

P0 (must-have):
- README.md (hero + badges + install matrix + capability matrix + quickstart)
- LICENSE (MIT)
- package.json (bin, exports, files, engines)
- .gitignore, .gitattributes
- AGENTS.md, CLAUDE.md (treat agents as readers)
- .github/workflows/ci.yml, release.yml
- .github/ISSUE_TEMPLATE/*
- mcp.json manifest
- vercel.json

P1:
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
- GEMINI.md, .github/copilot-instructions.md
- CHANGELOG.md (release-please)
- llms.txt (AI discovery index)
- examples/
- benchmarks/, evals/ (quality numbers in README)

## 5. Chart design decisions

### Sizes (3 presets)
- `inline` — 800×500 (8:5) — chat inline, blog figures
- `share` (default) — 1200×675 (16:9) — blog hero, Twitter/LinkedIn, slides
- `poster` — 1600×2000 (4:5) — vertical explainers, PDF reports

Render at 2× device_pixel_ratio for crispness.

### Palettes (10, with default)
1. **clarity** (DEFAULT) — balanced categorical, Inter
2. **boardroom** — corporate, Source Serif/Sans
3. **editorial** — FT/Economist, Playfair + Source Sans, pink bg
4. **vibrant** — marketing, Poppins
5. **carbon** — IBM-style accessible, IBM Plex Sans
6. **viridis** — sequential scientific, IBM Plex Sans
7. **earth** — warm editorial, Libre Franklin
8. **twilight** — dark mode, Inter
9. **mono-blue** — single-series emphasis, Source Serif/Sans
10. **diverging-sunset** — signed data, Merriweather + Lato

All hex codes defined. Custom palette override via `palette: { colors: [...], font: "...", background: "...", text: "..." }`.

### Fonts
All from Google Fonts (free, redistributable). Bundled as WOFF2/TTF.

### Layout
Vertical stack top-to-bottom:
- Title (left-aligned, editorial standard)
- Subtitle
- Legend (optional, auto-placement)
- Plot area
- Source line (bottom-left, small grey)
- Logo (bottom-right, placeholder lightbulb icon → replaceable)

Margins top-heavy: 80 / 40 / 60 / 60 (T/R/B/L) for 800h image.

### Smart formatters
- Numbers: abbreviate ≥10k (`12.3k`, `1.2M`, `4.5B`), comma below
- Years: detect ints 1900–2100 → suppress thousands sep (`2015` not `2,015`)
- Percentages: `42%` int, `12.3%` decimal
- Currencies: `$1.2M`
- Dates: auto tick based on span (HH:mm → MMM D → MMM 'YY → YYYY)
- Scientific when `|x| < 0.001`
- Wilkinson "nice" tick algorithm, 4–8 ticks per axis

### Anti-patterns (guard-rails, reject/auto-fix)
- Pie >6 slices → auto-group "Other" at 5%
- 3D anything → refuse
- Bar axis not zero → forbidden
- Clipped labels → rotate 45° → drop alternating
- >8 line series → warn, offer small multiples
- Low contrast text (<4.5:1) → auto-darken
- Year as `2,015` → blocked
- Rainbow palette on quantitative → replace with viridis

### Per-chart configurable options (non-color)
- **Line**: style (solid/dashed/dotted), width, interpolation (straight/curved/stepped), symbols (type/position/size), value labels (first/last/all/none), area fill
- **Bar**: orientation (H/V), spacing, value labels, sort, group by column, bar thickness, separating lines
- **Stacked**: normalize to 100%, reverse order, show totals
- **Pie/Donut**: label placement (inside/outside/none), auto-group threshold, donut inner radius, center value
- **Geo**: color scale (stepped/continuous/diverging), steps, missing-data color, region highlighting

### AI-agent config design
**Flat, explicit, one-concept-one-key**. No polymorphism per chart type. Grouped prefixes (`axis_x_*`, `legend_*`).

```json
{
  "chart": "line",
  "data": [...],
  "x": "year",
  "y": "revenue",
  "title": "Revenue Growth",
  "subtitle": "Fiscal years 2018–2024",
  "source": "Company filings",
  "palette": "clarity",
  "size": "share"
}
```

Every field optional except `chart` and `data`. `auto` as first-class default.

## 6. Geo basemaps

Strategy: download at build time from Datawrapper's API (open-source basemaps, licence OK).
- World: `https://datawrapper.dwcdn.net/lib/basemaps/world-2019.58b8a300.json`
- Enumerate from: `https://app.datawrapper.de/api/v3/basemaps/`
- Cache in `basemaps/` folder, ship in npm package and Vercel deployment

## 7. Name

**aicharts** (npm package name, repo name, CLI name). Tagline: "professional charts for AI agents — one tool, any chart, beautiful defaults."

## 8. Logo

Placeholder: lightbulb emoji/SVG 💡 → design one later.

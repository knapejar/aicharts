<div align="center">
<img src="./assets/logo.svg" width="120" />
<h1>aicharts</h1>
<b>Professional charts for AI agents — one tool, any chart, beautiful defaults.</b>
<p>
<img alt="npm" src="https://img.shields.io/npm/v/aicharts?color=blue">
<img alt="license" src="https://img.shields.io/npm/l/aicharts">
<img alt="downloads" src="https://img.shields.io/npm/dm/aicharts">
<img alt="build" src="https://img.shields.io/github/actions/workflow/status/aicharts/aicharts/ci.yml">
</p>
<p>
<a href="#install">Install</a> · <a href="#quickstart">Quickstart</a> · <a href="#charts">Charts</a> · <a href="#palettes">Palettes</a> · <a href="#api">API</a> · <a href="#mcp">MCP</a>
</p>
</div>

## Why aicharts?

- **One tool, not 26.** A single `render_chart` tool with a discriminated `chart` field. Your agent's context stays lean.
- **Real PNGs, not URLs.** Rendered locally via SVG → resvg. No third-party proxy, no network dependency at call time, no privacy leak.
- **Beautiful defaults.** Editorial typography, curated palettes, opinionated layout. Not Chart.js defaults.

## Install

### As an MCP server (Claude Desktop)

Edit `claude_desktop_config.json` (or run `claude mcp add`):

```json
{
  "mcpServers": {
    "aicharts": { "command": "npx", "args": ["-y", "aicharts"] }
  }
}
```

### As an MCP server (Claude Code / Cursor / any MCP client)

```
claude mcp add aicharts -- npx -y aicharts
```

### As a remote MCP server (ChatGPT, hosted Claude)

Settings → Connectors → Developer Mode → Add `https://api.aicharts.dev/mcp`.

### As a Vercel API (no install)

```
curl -X POST https://api.aicharts.dev/chart \
  -H "Content-Type: application/json" \
  -d '{"chart":"bar","data":[{"label":"A","value":12},{"label":"B","value":18}],"title":"Hello"}' \
  --output chart.png
```

### As a Node.js library

```
npm install aicharts
```

```ts
import { render } from 'aicharts';

const png = await render({
  chart: 'bar',
  data: [
    { label: 'A', value: 12 },
    { label: 'B', value: 18 },
  ],
  title: 'Hello',
});
```

## Quickstart

```ts
// Bar
render({
  chart: 'bar',
  data: [{ label: 'Q1', value: 120 }, { label: 'Q2', value: 180 }],
  title: 'Revenue',
});

// Line
render({
  chart: 'line',
  data: [{ year: 2020, revenue: 12 }, { year: 2021, revenue: 18 }],
  x: 'year',
  y: 'revenue',
  title: 'Revenue growth',
});

// Pie
render({
  chart: 'pie',
  data: [{ label: 'Mobile', value: 62 }, { label: 'Desktop', value: 38 }],
  title: 'Traffic share',
});
```

## Charts

| Chart        | Legend | Multi-series | Stacking | Custom palette | Sizes          |
| ------------ | ------ | ------------ | -------- | -------------- | -------------- |
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

| Palette            | Use                              | Typeface                   |
| ------------------ | -------------------------------- | -------------------------- |
| clarity            | default, balanced categorical    | Inter                      |
| boardroom          | corporate                        | Source Serif / Source Sans |
| editorial          | FT / Economist look              | Playfair + Source Sans     |
| vibrant            | marketing                        | Poppins                    |
| carbon             | IBM-style, accessible            | IBM Plex Sans              |
| viridis            | sequential scientific            | IBM Plex Sans              |
| earth              | warm editorial                   | Libre Franklin             |
| twilight           | dark mode                        | Inter                      |
| mono-blue          | single-series emphasis           | Source Serif / Source Sans |
| diverging-sunset   | signed data                      | Merriweather + Lato        |

Override with a custom palette:

```json
{ "palette": { "colors": ["#0f172a", "#2563eb", "#f97316"], "font": "Inter", "background": "#ffffff", "text": "#0f172a" } }
```

## API

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

### GET /chart?config=\<base64\>

Same schema, `config` is base64url-encoded JSON. Useful for embedding in Markdown:

```md
![chart](https://api.aicharts.dev/chart?config=eyJjaGFydCI6ImJhciIsImRhdGEiOlt7ImxhYmVsIjoiQSIsInZhbHVlIjoxMn1dfQ)
```

## MCP

Tool: `render_chart`

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

Output: `ImageContent` block with base64 PNG. Enforces a 900 KB safety margin below the 1 MB MCP cap.

Example call from an agent:

```json
{
  "name": "render_chart",
  "arguments": {
    "chart": "bar",
    "data": [{ "label": "A", "value": 12 }, { "label": "B", "value": 18 }],
    "title": "Hello"
  }
}
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). New charts ship with a snapshot PNG and at least one edge-case test.

## License

MIT — see [LICENSE](./LICENSE).

## Sponsor

Funding links in [.github/FUNDING.yml](./.github/FUNDING.yml).

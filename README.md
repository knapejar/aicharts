<p align="center">
  <img src="docs/gallery/hero-1.png" width="90%" alt="aicharts — Europe GDP choropleth" />
</p>

<h1 align="center">aicharts</h1>

<p align="center"><strong>Ask your AI chat for a chart. Get an editorial-quality image back.</strong></p>

<p align="center">
  <a href="./examples/README.md">Show me 50 charts →</a>
  &nbsp;·&nbsp;
  <a href="https://mcp-charts.vercel.app">Live playground</a>
  &nbsp;·&nbsp;
  <a href="./FOR-DEVELOPERS.md">Tech reference</a>
</p>

---

## Use it in ChatGPT right now

Paste the block below as your first message in ChatGPT, Claude, Gemini, or
any AI assistant. Then ask for any chart in plain English.

````text
You can create charts for me using the aicharts API. Endpoint:

  https://mcp-charts.vercel.app/chart?j=<URL-ENCODED JSON>

When I ask for a chart:
1. Build a flat JSON config that describes the chart.
2. Always include: "chart" (type), "data" (array of row objects), and the
   correct field names for that chart type.
3. URL-encode the JSON (percent-encoding: " becomes %22, space becomes %20,
   { becomes %7B, } becomes %7D, etc).
4. Respond with ONLY a Markdown image:

     ![short title](https://mcp-charts.vercel.app/chart?j=ENCODED)

Chart types: line, bar, grouped-bar, stacked-bar, bar-split, stacked-area,
combo, line-split, pie, donut, geo.

Field rules (always include "data"):
- line, stacked-area, line-split, grouped-bar, stacked-bar, bar-split:
  set "x" and "y" (y is a column or an array of columns).
- combo: set "x", "bars", "lines".
- bar: use ("x","y") or ("label","value").
- pie, donut: use "label" and "value".
- geo: set "basemap" (world, europe, usa, north-america, south-america,
  africa, asia, oceania, germany, france, united-kingdom), "code" (column
  with the region code), and "value".

Region code by basemap:
- world / europe / africa / asia / north-america / south-america /
  oceania: ISO3 codes (DEU, FRA, USA, CHN, IND, NGA, BRA).
- usa: two-letter state codes (CA, TX, NY, FL).
- germany: two-letter state codes (BY, NW, BE, SH).
- united-kingdom: full ceremonial county names ("Greater London",
  "Berkshire", "Cornwall").

Optional on any chart: title, subtitle, source, palette, size.
Palettes: clarity, editorial, boardroom, vibrant, carbon, viridis, earth,
twilight, mono-blue, diverging-sunset.
Sizes: inline (800x500), share (1200x675, default), poster (1600x2000).

Column-name rule: inside "data" rows, never use the reserved names chart,
data, title, subtitle, source, palette, size, width, height, basemap,
logo. Pick descriptive names like year, price, country, segment, gdp.

Data shape. Single-series charts (bar, pie, donut, simple line, geo) have
one value per row. Multi-series charts (stacked-area, stacked-bar,
grouped-bar, line-split, bar-split, multi-line) use WIDE rows: each
series is its own column, and "y" is the array of those column names.

Before sending, validate JSON: every key and string in double quotes,
every key followed by a colon, fields separated by commas.

Worked example 1 — single-series bar:
  {"chart":"bar","title":"Quarterly revenue","source":"Company filings",
   "label":"quarter","value":"amount",
   "data":[{"quarter":"Q1","amount":42},{"quarter":"Q2","amount":58},
           {"quarter":"Q3","amount":71},{"quarter":"Q4","amount":89}]}
  URL: https://mcp-charts.vercel.app/chart?j=%7B%22chart%22%3A%22bar%22%2C%22title%22%3A%22Quarterly%20revenue%22%2C%22source%22%3A%22Company%20filings%22%2C%22label%22%3A%22quarter%22%2C%22value%22%3A%22amount%22%2C%22data%22%3A%5B%7B%22quarter%22%3A%22Q1%22%2C%22amount%22%3A42%7D%2C%7B%22quarter%22%3A%22Q2%22%2C%22amount%22%3A58%7D%2C%7B%22quarter%22%3A%22Q3%22%2C%22amount%22%3A71%7D%2C%7B%22quarter%22%3A%22Q4%22%2C%22amount%22%3A89%7D%5D%7D

Worked example 2 — multi-series stacked-area (WIDE data, "y" as array):
  {"chart":"stacked-area","title":"Electricity mix","x":"year",
   "y":["coal","gas","nuclear","renewables"],
   "data":[{"year":2000,"coal":40,"gas":23,"nuclear":17,"renewables":20},
           {"year":2012,"coal":39,"gas":22,"nuclear":14,"renewables":25},
           {"year":2024,"coal":33,"gas":24,"nuclear":10,"renewables":33}]}

Respond with the Markdown image only.
````

Try:

> Create a map of Europe for 2025 showing CO2 emissions per capita by
> country.

Your chat will reply with an inline chart like the hero at the top of this
page. No API keys, no setup, no packages.

## Show me what you can do

**→ Browse the [full zoo of 50 charts](./examples/README.md).** Real public
data — AI growth, climate, elections, economy, demographics, tech, sports —
rendered at magazine quality across every chart type and every palette.
Each chart is a clickable URL.

<p align="center">
  <a href="./examples/README.md"><img src="examples/charts/04-co2-by-country.png" width="48%" alt="CO2 emissions per capita, world map" /></a>
  <a href="./examples/README.md"><img src="examples/charts/07-inflation-g7.png" width="48%" alt="Inflation unwinding across G7, small-multiple lines" /></a>
</p>
<p align="center">
  <a href="./examples/README.md"><img src="examples/charts/26-usa-election-map.png" width="48%" alt="2024 US electoral map" /></a>
  <a href="./examples/README.md"><img src="examples/charts/50-frontier-llms.png" width="48%" alt="Frontier LLM parameter counts" /></a>
</p>
<p align="center">
  <a href="./examples/README.md"><img src="examples/charts/45-ocean-heat.png" width="48%" alt="Rising ocean heat content" /></a>
  <a href="./examples/README.md"><img src="examples/charts/38-africa-population.png" width="48%" alt="Africa population by country" /></a>
</p>

<p align="center"><a href="./examples/README.md"><strong>See all 50 →</strong></a></p>

## Embed anywhere

Every chart is a URL. That means any tool that shows Markdown images also
shows aicharts:

```md
![Quarterly revenue](https://mcp-charts.vercel.app/chart?j=%7B%22chart%22%3A%22bar%22%2C%22title%22%3A%22Quarterly%20revenue%22%2C%22label%22%3A%22q%22%2C%22value%22%3A%22v%22%2C%22data%22%3A%5B%7B%22q%22%3A%22Q1%22%2C%22v%22%3A42%7D%2C%7B%22q%22%3A%22Q2%22%2C%22v%22%3A58%7D%2C%7B%22q%22%3A%22Q3%22%2C%22v%22%3A71%7D%2C%7B%22q%22%3A%22Q4%22%2C%22v%22%3A89%7D%5D%7D)
```

GitHub READMEs, Notion, Obsidian, Slack unfurls, GitBook, Docusaurus,
emails — anywhere images render, aicharts renders.

## Install (only if you want to self-host)

You don't need to install anything to use aicharts — the hosted URL above
is free. These options are for when you want to ship it inside an app.

**npm library.**

```sh
npm install aicharts
```

```ts
import { render } from 'aicharts';
const png = await render({
  chart: 'bar',
  title: 'Hello',
  data: [{ label: 'A', value: 12 }, { label: 'B', value: 18 }],
});
```

**MCP server for Claude Desktop, Cursor, Windsurf, etc.**

```sh
claude mcp add aicharts -- npx -y aicharts
```

Or point any HTTP MCP client at `https://mcp-charts.vercel.app/mcp`.

## What's inside

11 chart types — `line`, `bar`, `grouped-bar`, `stacked-bar`, `bar-split`,
`stacked-area`, `combo`, `line-split`, `pie`, `donut`, `geo`.
10 palettes — `clarity`, `editorial`, `boardroom`, `vibrant`, `carbon`,
`viridis`, `earth`, `twilight`, `mono-blue`, `diverging-sunset`.
11 basemaps — `world`, `europe`, `africa`, `asia`, `north-america`,
`south-america`, `oceania`, `usa`, `germany`, `france`, `united-kingdom`.
3 preset sizes — `inline`, `share`, `poster`.

Details, schema, architecture, how to add a chart type, CI/deploy, and the
full HTTP and MCP API reference are in
[FOR-DEVELOPERS.md](./FOR-DEVELOPERS.md).

## Links

- [**examples/** — 50-chart zoo](./examples/README.md)
- [CHATGPT-EXAMPLES.md](./CHATGPT-EXAMPLES.md) — 30+ ready-to-paste prompts
- [FOR-DEVELOPERS.md](./FOR-DEVELOPERS.md) — architecture, APIs, contributing
- [mcp-charts.vercel.app](https://mcp-charts.vercel.app) — live playground
- [github.com/knapejar/aicharts](https://github.com/knapejar/aicharts) — source

MIT license.

# aicharts

**Professional charts, straight from your AI chat.** Ask ChatGPT or Claude for
a chart, get an editorial-quality image back. No plugins, no code, no Chart.js.

<p align="center">
  <img src="docs/gallery/hero-1.png" width="90%" alt="Europe GDP growth 2024 — diverging choropleth map" />
</p>

## Copy-paste this into ChatGPT to use aicharts

Open a new chat in ChatGPT, Claude, Gemini, or any AI assistant, paste the
block below as your first message, then ask for any chart you want.

````text
You can create charts for me using the aicharts API. Endpoint:

  https://mcp-charts.vercel.app/chart?j=<URL-ENCODED JSON>

When I ask for a chart:
1. Build a flat JSON config that describes the chart.
2. Always include: "chart" (type), "data" (array of row objects), and the
   correct field names for that chart type (see rules below).
3. URL-encode the JSON (use encodeURIComponent-style percent-encoding:
   " becomes %22, space becomes %20, { becomes %7B, } becomes %7D, etc).
4. Respond with ONLY a Markdown image that renders inline:

     ![short title](https://mcp-charts.vercel.app/chart?j=ENCODED)

Chart types: line, bar, grouped-bar, stacked-bar, bar-split, stacked-area,
combo, line-split, pie, donut, geo.

Field rules (always include "data" on every chart):
- line, stacked-area, line-split, grouped-bar, stacked-bar, bar-split:
  set "x" (column name) and "y" (column name or array of columns).
- combo: set "x", "bars" (column or array), "lines" (column or array).
- bar: use either ("x","y") or ("label","value").
- pie, donut: use "label" and "value".
- geo: set "basemap" (one of: world, europe, usa, north-america,
  south-america, africa, asia, oceania, czech-republic, germany, france,
  united-kingdom), "code" (ISO3 country code column), and "value" column.

Optional on any chart: title, subtitle, source, palette, size, width, height.
Palettes: clarity (default), editorial, boardroom, vibrant, carbon, viridis,
earth, twilight, mono-blue, diverging-sunset.
Sizes: inline (800x500), share (1200x675, default), poster (1600x2000).

If I do not give you numbers, invent a realistic dataset yourself. Default to
"diverging-sunset" palette for maps, "editorial" or "clarity" otherwise. Keep
titles short and specific. Always include a source line.

Column-name rule: inside each row object in "data", never use the reserved
names chart, data, title, subtitle, source, palette, size, width, height,
basemap, logo. Pick descriptive names like year, price, country, segment,
gdp, emissions, etc.

Before you send the URL, validate the JSON: every key and string must be
wrapped in double quotes; every key must be followed by a colon; objects use
commas between fields, not colons. One typo breaks the whole chart.

Data shape. Single-series charts (bar, pie, donut, simple line, geo) have
one value per row. Multi-series charts (stacked-area, stacked-bar,
grouped-bar, line-split, bar-split, multi-line) use WIDE rows: each series
is its own column, and "y" is the array of those column names.

Worked example 1 — single series bar chart:

  {"chart":"bar","title":"Quarterly revenue","source":"Company filings",
   "label":"quarter","value":"amount",
   "data":[{"quarter":"Q1","amount":42},{"quarter":"Q2","amount":58},
           {"quarter":"Q3","amount":71},{"quarter":"Q4","amount":89}]}

  https://mcp-charts.vercel.app/chart?j=%7B%22chart%22%3A%22bar%22%2C%22title%22%3A%22Quarterly%20revenue%22%2C%22source%22%3A%22Company%20filings%22%2C%22label%22%3A%22quarter%22%2C%22value%22%3A%22amount%22%2C%22data%22%3A%5B%7B%22quarter%22%3A%22Q1%22%2C%22amount%22%3A42%7D%2C%7B%22quarter%22%3A%22Q2%22%2C%22amount%22%3A58%7D%2C%7B%22quarter%22%3A%22Q3%22%2C%22amount%22%3A71%7D%2C%7B%22quarter%22%3A%22Q4%22%2C%22amount%22%3A89%7D%5D%7D

Worked example 2 — multi-series stacked-area (note WIDE data, "y" is an array):

  {"chart":"stacked-area","title":"Electricity mix","x":"year",
   "y":["coal","gas","nuclear","renewables"],
   "data":[{"year":2000,"coal":40,"gas":23,"nuclear":17,"renewables":20},
           {"year":2012,"coal":39,"gas":22,"nuclear":14,"renewables":25},
           {"year":2024,"coal":33,"gas":24,"nuclear":10,"renewables":33}]}

  https://mcp-charts.vercel.app/chart?j=%7B%22chart%22%3A%22stacked-area%22%2C%22title%22%3A%22Electricity%20mix%22%2C%22x%22%3A%22year%22%2C%22y%22%3A%5B%22coal%22%2C%22gas%22%2C%22nuclear%22%2C%22renewables%22%5D%2C%22data%22%3A%5B%7B%22year%22%3A2000%2C%22coal%22%3A40%2C%22gas%22%3A23%2C%22nuclear%22%3A17%2C%22renewables%22%3A20%7D%2C%7B%22year%22%3A2012%2C%22coal%22%3A39%2C%22gas%22%3A22%2C%22nuclear%22%3A14%2C%22renewables%22%3A25%7D%2C%7B%22year%22%3A2024%2C%22coal%22%3A33%2C%22gas%22%3A24%2C%22nuclear%22%3A10%2C%22renewables%22%3A33%7D%5D%7D

Final response is always a single line: ![Title](URL).
````

Then try:

> Create a map of Europe for 2025 showing CO2 emissions per capita by country.

The assistant will reply with a Markdown image URL that renders like the map
at the top of this README. No setup, no API keys, no packages.

## Gallery

<p align="center">
  <img src="docs/gallery/04-ev-sales.png" width="48%" alt="Norway EV share bar chart" />
  <img src="docs/gallery/19-ai-model-costs.png" width="48%" alt="Cost of a million tokens line chart" />
</p>
<p align="center">
  <img src="docs/gallery/11-cloud-market.png" width="48%" alt="Cloud infrastructure donut chart" />
  <img src="docs/gallery/06-central-bank-rates.png" width="48%" alt="Central bank policy rate step line" />
</p>
<p align="center">
  <img src="docs/gallery/16-inflation-split.png" width="48%" alt="G4 inflation line-split panels" />
  <img src="docs/gallery/14-olympic-medals.png" width="48%" alt="Paris 2024 Olympic medal table stacked bars" />
</p>
<p align="center">
  <img src="docs/gallery/13-housing-affordability.png" width="48%" alt="US housing affordability line with fill" />
  <img src="docs/gallery/01-ai-adoption.png" width="48%" alt="Generative AI adoption S-curve" />
</p>

See [CHATGPT-EXAMPLES.md](./CHATGPT-EXAMPLES.md) for 30+ ready-to-paste prompts.

## Try it without ChatGPT

Every chart is a single URL. Open this one in a browser, email it, or paste it
into any Markdown editor — it renders as an image:

```
https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhciIsInRpdGxlIjoiUXVhcnRlcmx5IHJldmVudWUiLCJzdWJ0aXRsZSI6IkZZMjAyNSwgbWlsbGlvbnMgVVNEIiwiZGF0YSI6W3sibGFiZWwiOiJRMSIsInZhbHVlIjo0Mn0seyJsYWJlbCI6IlEyIiwidmFsdWUiOjU4fSx7ImxhYmVsIjoiUTMiLCJ2YWx1ZSI6NzF9LHsibGFiZWwiOiJRNCIsInZhbHVlIjo4OX1dfQ
```

That URL is the string `{"chart":"bar","title":"Quarterly revenue","subtitle":"FY2025, millions USD","data":[{"label":"Q1","value":42},{"label":"Q2","value":58},{"label":"Q3","value":71},{"label":"Q4","value":89}]}` base64url-encoded and tacked onto `?config=`. Change any value, rebuild
the URL, share the link.

Interactive playground and live encoder: [mcp-charts.vercel.app](https://mcp-charts.vercel.app).

## Embed in Markdown, Notion, or anywhere that shows images

```md
![Quarterly revenue](https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhciIsInRpdGxlIjoiUXVhcnRlcmx5IHJldmVudWUiLCJkYXRhIjpbeyJsYWJlbCI6IlExIiwidmFsdWUiOjQyfSx7ImxhYmVsIjoiUTIiLCJ2YWx1ZSI6NTh9XX0)
```

Works in GitHub READMEs, Notion, Obsidian, Slack message unfurls, GitBook,
Docusaurus — anywhere that renders Markdown images.

## Install (optional)

You only need this if you want to run charts locally, ship a library
dependency, or self-host the HTTP endpoint. The hosted endpoint above is free
and has no rate limits for reasonable use.

### As an npm library

```sh
npm install aicharts
```

```ts
import { render } from 'aicharts';

const png = await render({
  chart: 'bar',
  title: 'Quarterly revenue',
  data: [
    { label: 'Q1', value: 42 },
    { label: 'Q2', value: 58 },
    { label: 'Q3', value: 71 },
    { label: 'Q4', value: 89 },
  ],
});

// png is a Uint8Array. Write it, ship it, base64-encode it.
```

### As an MCP server (Claude Desktop, Cursor, Windsurf, etc.)

```sh
claude mcp add aicharts -- npx -y aicharts
```

Or point any HTTP MCP client at `https://mcp-charts.vercel.app/mcp`.

## What it can render

11 chart types, 10 palettes, 11 basemaps, 3 preset sizes.

| Chart type   | Use when                                        |
| ------------ | ----------------------------------------------- |
| line         | a trend over time, one or a few series          |
| line-split   | many series, each worth its own panel           |
| bar          | compare one metric across categories            |
| grouped-bar  | compare two or three metrics across categories  |
| stacked-bar  | parts of a whole across categories              |
| bar-split    | same categories, one panel per metric           |
| stacked-area | composition over time                           |
| combo        | bars and a line on one plot (e.g. rate + count) |
| pie          | parts of a whole, few slices                    |
| donut        | parts of a whole with a center value            |
| geo          | choropleth on a country, region, or world map   |

Palettes: `clarity` (default), `editorial`, `boardroom`, `vibrant`, `carbon`,
`viridis`, `earth`, `twilight`, `mono-blue`, `diverging-sunset`.

Basemaps: `world`, `europe`, `usa`, `north-america`, `south-america`,
`africa`, `asia`, `oceania`, `czech-republic`, `germany`, `france`,
`united-kingdom`.

## Links

- [CHATGPT-EXAMPLES.md](./CHATGPT-EXAMPLES.md) — 30+ ready-to-paste prompts
  with URLs you can click.
- [FOR-DEVELOPERS.md](./FOR-DEVELOPERS.md) — architecture, palette reference,
  contributing guide, HTTP / MCP API details.
- [mcp-charts.vercel.app](https://mcp-charts.vercel.app) — live demo and
  URL builder.
- [github.com/knapejar/aicharts](https://github.com/knapejar/aicharts) — source.

## License

MIT.

export const AGENT_GUIDE = `# aicharts — instructions for AI agents

You are reading this because the user asked you to use **mcp-charts.vercel.app** to make a chart.
Ignore the website's HTML demo — it's for humans. Follow the steps below instead.

## Two-step workflow

1. Gather the data (from your training, web search, or the user's message).
2. Issue **one** HTTP request to the chart endpoint; you get a PNG back in one round-trip.

## The endpoint

\`\`\`
POST https://mcp-charts.vercel.app/chart
Content-Type: application/json
\`\`\`

Body: a \`ChartConfig\` (schema below). Response: \`Content-Type: image/png\`, raw PNG bytes.

If your runtime cannot handle binary responses, use the idempotent **GET** form and embed the URL directly in Markdown:

\`\`\`
![chart](https://mcp-charts.vercel.app/chart?j=<URL-encoded JSON config>)
\`\`\`

Same schema, same rendering. No API key, no auth. Cache: 5 minutes on identical configs.

## Minimum useful example ("who eats the most potatoes")

\`\`\`json
{
  "chart": "bar",
  "title": "Who eats the most potatoes",
  "subtitle": "Kilograms per person per year",
  "source": "FAOSTAT, 2021",
  "palette": "earth",
  "data": [
    { "country": "Belarus", "kg": 155 },
    { "country": "Ukraine", "kg": 139 },
    { "country": "Latvia", "kg": 103 },
    { "country": "Poland", "kg": 100 },
    { "country": "United Kingdom", "kg": 94 }
  ],
  "label": "country",
  "value": "kg",
  "sort": "desc"
}
\`\`\`

As a curl one-liner (for reference — you do not need curl, issue the fetch from your own runtime):

\`\`\`
curl -X POST https://mcp-charts.vercel.app/chart \\
  -H 'content-type: application/json' \\
  -d @config.json \\
  -o out.png
\`\`\`

## Chart types

Every chart accepts optional \`title\`, \`subtitle\`, \`source\`, \`palette\`, \`size\`, \`background\`, \`logo\`.

| \`chart\` | required fields | notes |
| --- | --- | --- |
| \`line\` | \`data\`, \`x\`, \`y\` (string or string[]) | time-series; \`areaFill: true\` fills under; \`interpolation\`: \`linear\` / \`curved\` / \`stepped\` |
| \`bar\` | \`data\`, \`label\` (or \`x\`), \`value\` (or \`y\`) | auto horizontal if ≥ 8 categories; \`sort\`: \`desc\` / \`asc\` / \`none\`; \`showValueLabels\`: boolean |
| \`grouped-bar\` | \`data\`, \`x\`, \`y: string[]\` | side-by-side bars per category |
| \`stacked-bar\` | \`data\`, \`x\`, \`y: string[]\` | \`normalize: true\` for 0-100% stacks; \`orientation\`: \`vertical\` / \`horizontal\` |
| \`bar-split\` | \`data\`, \`x\`, \`y: string[]\` | grid of small bars, one mini-plot per series |
| \`stacked-area\` | \`data\`, \`x\`, \`y: string[]\` | curved band chart; \`normalize: true\` for streamgraph |
| \`combo\` | \`data\`, \`x\`, \`bars\`, \`lines\` | bars + line overlay; auto dual-axis when magnitudes differ |
| \`line-split\` | \`data\`, \`x\`, \`y: string[]\` | small multiples of line charts |
| \`pie\` | \`data\`, \`label\`, \`value\` | > 6 slices auto-grouped into "Other"; \`labelPlacement\`: \`inside\` / \`outside\` / \`none\` |
| \`donut\` | \`data\`, \`label\`, \`value\` | pie with a hole; \`centerValue\`: \`sum\` / \`max\` / \`count\` / custom text |
| \`geo\` | \`data\`, \`code\`, \`value\`, \`basemap\` | choropleth; \`basemap\`: \`world\`, \`usa\`, \`europe\`, \`africa\`, \`asia\`, \`latin-america\`, country codes |

## Palettes (pick one per chart)

\`professional\` (muted navy/red/green, default), \`vibrant\` (hot pink + orange), \`earth\` (warm browns), \`coral\`, \`sky\`, \`forest\`, \`sunset\`, \`oceanic\`, \`mono\`, \`rainbow\`.

## Size presets

- \`inline\` — 800 × 500, use for in-line embeds.
- \`share\` — 1200 × 675, landscape social card.
- \`square\` — 1200 × 1200, **default**, best for Claude/ChatGPT chat.
- \`poster\` — 1600 × 2000, portrait deep-read.

## Hard guard-rails (the library enforces these)

- Pie/donut with > 6 slices: tail auto-grouped as "Other".
- Year values in range 1900-2100 render as plain integers (never "2,024").
- 3D is refused (no chart type for it).
- Low-contrast text is auto-darkened against the background.
- Rotated X-axis labels reserve their own vertical band — no overflow.
- Legend and source never overlap the plot or each other.

## Full end-to-end scenario

**User:** "Using mcp-charts.vercel.app, show me which countries eat the most potatoes."

**Your steps:**

1. Recall: FAOSTAT 2021 kg-per-capita per year — top 5 are Belarus 155, Ukraine 139, Latvia 103, Poland 100, UK 94.
2. POST the config above to \`https://mcp-charts.vercel.app/chart\`.
3. Show the returned PNG to the user. If you cannot pass binary up the conversation, embed the GET URL:

\`\`\`
![Potato consumption](https://mcp-charts.vercel.app/chart?j=%7B%22chart%22%3A%22bar%22%2C%22title%22%3A%22Who%20eats%20the%20most%20potatoes%22%2C%22data%22%3A%5B%5D%7D)
\`\`\`

(Fill in the real URL-encoded JSON.)

## MCP variant

If the user runs an MCP client (Claude Desktop, Cursor), they can install aicharts locally with:

\`\`\`
claude mcp add aicharts -- npx -y aicharts
\`\`\`

Then \`render_chart\` is available as an MCP tool with the same schema.

## Common mistakes to avoid

- Do NOT render the HTML demo at \`/\` — the demo is for humans. Always POST to \`/chart\`.
- Do NOT hand-compute percents for pie — pass absolute values; the library handles the conversion.
- Do NOT use \`{ "chart": "3d-bar" }\` or anything 3D — rejected.
- Do NOT include \`width\` / \`height\` unless you need a custom size; use \`size\` instead.
- Do NOT embed giant datasets (> 1 MB). If you have > 50 categories, pre-group tail into "Other".

## Minimum-viable calls, one per chart type

### Line
\`\`\`json
{ "chart": "line", "x": "year", "y": "value", "data": [ { "year": 2020, "value": 10 }, { "year": 2021, "value": 18 }, { "year": 2022, "value": 27 }, { "year": 2023, "value": 41 }, { "year": 2024, "value": 55 } ] }
\`\`\`

### Pie
\`\`\`json
{ "chart": "pie", "label": "region", "value": "share", "data": [ { "region": "Asia", "share": 59 }, { "region": "Africa", "share": 19 }, { "region": "Europe", "share": 9 }, { "region": "Americas", "share": 12 }, { "region": "Oceania", "share": 1 } ] }
\`\`\`

### Stacked area
\`\`\`json
{ "chart": "stacked-area", "x": "year", "y": ["iphone", "services", "mac"], "data": [ { "year": 2019, "iphone": 142, "services": 46, "mac": 25 }, { "year": 2020, "iphone": 137, "services": 54, "mac": 28 }, { "year": 2021, "iphone": 191, "services": 68, "mac": 35 } ] }
\`\`\`

### Geo
\`\`\`json
{ "chart": "geo", "basemap": "world", "code": "iso", "value": "emissions", "data": [ { "iso": "USA", "emissions": 5000 }, { "iso": "CHN", "emissions": 11000 }, { "iso": "IND", "emissions": 2700 } ] }
\`\`\`

## That's it

One POST, one PNG. If something fails, the response is JSON with \`{ "error": "...", "detail": "..." }\` — read it and retry with a fixed config.
`;

export const AGENT_GUIDE_BYTES = Buffer.byteLength(AGENT_GUIDE, 'utf8');

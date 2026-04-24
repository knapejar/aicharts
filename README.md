<p align="center">
  <img src="docs/gallery/hero-1.png" width="90%" alt="aicharts — Europe GDP choropleth" />
</p>

<h1 align="center">aicharts</h1>

<p align="center"><strong>Make real charts inside any AI chat. Copy, paste, ask.</strong></p>

<p align="center">
  <a href="./examples/README.md">Show me 50 charts →</a>
  &nbsp;·&nbsp;
  <a href="https://mcp-charts.vercel.app">Live playground</a>
  &nbsp;·&nbsp;
  <a href="./FOR-DEVELOPERS.md">Tech reference</a>
</p>

---

## Use it now (60 seconds)

Works in **Claude.ai**, **ChatGPT**, and **Gemini** on the free tier. No
account, no install, no API key.

**Step 1.** Paste this block as your first message:

````text
You can render a real bar chart in our chat by emitting a Markdown image
whose URL points at:

  https://mcp-charts.vercel.app/chart?title=TITLE&data=Label1:Value1,Label2:Value2,...

Allowed query parameters (anything else is ignored):
- title     short chart title       (optional)
- subtitle  one-line caption        (optional)
- source    data citation           (optional, e.g. FAOSTAT)
- data      comma-separated Label:Value pairs   (REQUIRED, values are numbers)

Rules:
1. Find real data first (your knowledge or a web search). Don't invent numbers.
2. Keep every value simple: only letters, digits, spaces, and hyphens.
3. Use + for spaces. Encode non-ASCII letters (Czech, Chinese, accents) as
   UTF-8 percent-escapes (e.g. ě -> %C4%9B). Do NOT use backslash escapes.
4. Reply with ONE Markdown image line and nothing else — no code block,
   no preamble, no caption underneath.

Example you should literally pattern-match:

  ![Top potato eaters per capita](https://mcp-charts.vercel.app/chart?title=Top+potato+eaters+per+capita&subtitle=kg+per+year&source=FAOSTAT&data=Belarus:155,Ukraine:139,Latvia:103,Poland:100,United+Kingdom:94)
````

**Step 2.** Send any chart request, in plain English:

> *"Chart of which countries eat the most potatoes per capita."*

The chart appears inline in the chat. That's the whole product.

## Show me what you can do

Real public data — AI growth, climate, elections, economy, demographics,
tech, sports — rendered at magazine quality across every chart type and
every palette. Each chart is just a URL.

<p align="center">
  <a href="./examples/README.md"><img src="examples/charts/04-co2-by-country.png" width="48%" alt="CO2 emissions per capita, world map" /></a>
  <a href="./examples/README.md"><img src="examples/charts/07-inflation-g7.png" width="48%" alt="Inflation unwinding across G7" /></a>
</p>
<p align="center">
  <a href="./examples/README.md"><img src="examples/charts/26-usa-election-map.png" width="48%" alt="2024 US electoral map" /></a>
  <a href="./examples/README.md"><img src="examples/charts/50-frontier-llms.png" width="48%" alt="Frontier LLM parameter counts" /></a>
</p>
<p align="center">
  <a href="./examples/README.md"><img src="examples/charts/45-ocean-heat.png" width="48%" alt="Rising ocean heat content" /></a>
  <a href="./examples/README.md"><img src="examples/charts/38-africa-population.png" width="48%" alt="Africa population by country" /></a>
</p>

<p align="center">
  <a href="./examples/README.md"><strong>→ Show me all 50 charts</strong></a>
</p>

## Embed anywhere

Every chart is a URL that returns a PNG. That means any tool that renders
Markdown images also renders aicharts:

```md
![Quarterly revenue](https://mcp-charts.vercel.app/chart?title=Quarterly+revenue&source=Company+filings&data=Q1:42,Q2:58,Q3:71,Q4:89)
```

GitHub READMEs, Notion, Obsidian, Slack unfurls, GitBook, Docusaurus,
Slidev, Marp, email — anywhere images render.

## Advanced

Only useful if you outgrow copy-paste.

**Full JSON mode** for everything beyond a single bar chart — line, pie,
donut, stacked-area, geo maps, multi-series, palette/size overrides:

```
GET /chart?j=<URL-encoded JSON ChartConfig>
POST /chart   (Content-Type: application/json, body = ChartConfig)
```

Schema and per-chart field rules: [FOR-DEVELOPERS.md](./FOR-DEVELOPERS.md).
Capable agents (Cursor, Claude Code, ChatGPT with Browse) can fetch
[/agent-guide](https://mcp-charts.vercel.app/agent-guide) for the full
spec at runtime.

**MCP server** for Claude Desktop, Cursor, Windsurf, etc.

```sh
claude mcp add aicharts -- npx -y aicharts
```

Or point any HTTP MCP client at `https://mcp-charts.vercel.app/mcp`.

**npm library** for your own app.

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

**Auto agent guide** — clients that fetch URLs (Cursor, Claude Code,
ChatGPT with Browse) can hit `https://mcp-charts.vercel.app/agent-guide`
or any bare `https://mcp-charts.vercel.app/chart` URL with an AI
user-agent — the server returns the same primer above as Markdown.

**Self-host on Vercel.** See [FOR-DEVELOPERS.md](./FOR-DEVELOPERS.md).

## What's inside

11 chart types — `line`, `bar`, `grouped-bar`, `stacked-bar`, `bar-split`,
`stacked-area`, `combo`, `line-split`, `pie`, `donut`, `geo`.

10 palettes — `clarity`, `editorial`, `boardroom`, `vibrant`, `carbon`,
`viridis`, `earth`, `twilight`, `mono-blue`, `diverging-sunset`.

11 basemaps — `world`, `europe`, `africa`, `asia`, `north-america`,
`south-america`, `oceania`, `usa`, `germany`, `france`, `united-kingdom`.

4 size presets — `inline` (800x500), `share` (1200x675),
`square` (1200x1200, default), `poster` (1600x2000).

## Links

- [examples/](./examples/README.md) — 50-chart zoo
- [CHATGPT-EXAMPLES.md](./CHATGPT-EXAMPLES.md) — 30+ ready-to-paste prompts
- [FOR-DEVELOPERS.md](./FOR-DEVELOPERS.md) — architecture, APIs, contributing
- [mcp-charts.vercel.app](https://mcp-charts.vercel.app) — live playground
- [github.com/knapejar/aicharts](https://github.com/knapejar/aicharts) — source

MIT license.

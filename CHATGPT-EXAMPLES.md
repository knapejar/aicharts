# Try aicharts from ChatGPT

Every example below produces a real chart from the live API at **https://mcp-charts.vercel.app/chart**.
Paste the prompt into any chat assistant with URL-fetching ability (ChatGPT 4o/5 with browsing, Claude, Gemini, Copilot) — it will follow the link, download the PNG, and show it inline. You can also open the URL directly in a browser or `curl`.

**API surface**
```
GET  https://mcp-charts.vercel.app/chart?config=<base64url JSON>
POST https://mcp-charts.vercel.app/chart           (body: JSON config)

Optional query parameters:
  format=svg        return SVG instead of PNG
```

**Table of contents**
- [Line chart](#line)
- [Bar chart (vertical + horizontal)](#bar)
- [Grouped bar chart](#grouped-bar)
- [Stacked bar chart](#stacked-bar)
- [Bar split (small multiples)](#bar-split)
- [Stacked area chart](#stacked-area)
- [Combo chart (bars + line)](#combo)
- [Line split (small multiples)](#line-split)
- [Pie chart](#pie)
- [Donut chart](#donut)
- [Geo chart (choropleth)](#geo)

---

## Line chart {#line}

### 1. Simple trend

US smartphone ownership share by year. Linear line, single series, year formatter detects non-comma 2015-2024 labels.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImxpbmUiLCJ0aXRsZSI6IlVTIHNtYXJ0cGhvbmUgb3duZXJzaGlwIiwic3VidGl0bGUiOiJTaGFyZSBvZiBhZHVsdHMgb3duaW5nIGEgc21hcnRwaG9uZSIsInNvdXJjZSI6IlBldyBSZXNlYXJjaCwgMjAyNCIsInBhbGV0dGUiOiJjbGFyaXR5IiwieCI6InllYXIiLCJ5Ijoic2hhcmUiLCJ5Rm9ybWF0IjoicGVyY2VudCIsImRhdGEiOlt7InllYXIiOjIwMTUsInNoYXJlIjowLjY4fSx7InllYXIiOjIwMTYsInNoYXJlIjowLjcyfSx7InllYXIiOjIwMTcsInNoYXJlIjowLjc3fSx7InllYXIiOjIwMTgsInNoYXJlIjowLjgxfSx7InllYXIiOjIwMTksInNoYXJlIjowLjgzfSx7InllYXIiOjIwMjAsInNoYXJlIjowLjg1fSx7InllYXIiOjIwMjEsInNoYXJlIjowLjg3fSx7InllYXIiOjIwMjIsInNoYXJlIjowLjg5fSx7InllYXIiOjIwMjMsInNoYXJlIjowLjl9LHsieWVhciI6MjAyNCwic2hhcmUiOjAuOTF9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "line",
  "title": "US smartphone ownership",
  "subtitle": "Share of adults owning a smartphone",
  "source": "Pew Research, 2024",
  "palette": "clarity",
  "x": "year",
  "y": "share",
  "yFormat": "percent",
  "data": [
    {
      "year": 2015,
      "share": 0.68
    },
    {
      "year": 2016,
      "share": 0.72
    },
    {
      "year": 2017,
      "share": 0.77
    },
    {
      "year": 2018,
      "share": 0.81
    },
    {
      "year": 2019,
      "share": 0.83
    },
    {
      "year": 2020,
      "share": 0.85
    },
    {
      "year": 2021,
      "share": 0.87
    },
    {
      "year": 2022,
      "share": 0.89
    },
    {
      "year": 2023,
      "share": 0.9
    },
    {
      "year": 2024,
      "share": 0.91
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"line","title":"US smartphone ownership","subtitle":"Share of adults owning a smartphone","source":"Pew Research, 2024","palette":"clarity","x":"year","y":"share","yFormat":"percent","data":[{"year":2015,"share":0.68},{"year":2016,"share":0.72},{"year":2017,"share":0.77},{"year":2018,"share":0.81},{"year":2019,"share":0.83},{"year":2020,"share":0.85},{"year":2021,"share":0.87},{"year":2022,"share":0.89},{"year":2023,"share":0.9},{"year":2024,"share":0.91}]}' \
  --output line-1.png
```

</details>

### 2. Multi-series comparison with area fill

EV vs ICE vehicle sales 2018-2024. Two lines with distinct styles, curved interpolation, area fill under the crossover trend.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImxpbmUiLCJ0aXRsZSI6IkVWIHNhbGVzIG92ZXJ0YWtpbmcgSUNFIHNhbGVzIGlzIGNvbWluZyIsInN1YnRpdGxlIjoiR2xvYmFsIG5ldyBjYXIgc2FsZXMgYnkgcG93ZXJ0cmFpbiwgbWlsbGlvbnMgb2YgdW5pdHMiLCJzb3VyY2UiOiJJRUEgR2xvYmFsIEVWIE91dGxvb2siLCJwYWxldHRlIjoiZWRpdG9yaWFsIiwieCI6InllYXIiLCJ5IjpbImV2IiwiaWNlIl0sImludGVycG9sYXRpb24iOiJjdXJ2ZWQiLCJhcmVhRmlsbCI6dHJ1ZSwibGluZVdpZHRoIjoyLjUsImRhdGEiOlt7InllYXIiOjIwMTgsImV2IjoyLCJpY2UiOjg0fSx7InllYXIiOjIwMTksImV2IjoyLjIsImljZSI6ODEuNX0seyJ5ZWFyIjoyMDIwLCJldiI6My4yLCJpY2UiOjcyfSx7InllYXIiOjIwMjEsImV2Ijo2LjYsImljZSI6NzV9LHsieWVhciI6MjAyMiwiZXYiOjEwLjUsImljZSI6NzF9LHsieWVhciI6MjAyMywiZXYiOjE0LCJpY2UiOjY3fSx7InllYXIiOjIwMjQsImV2IjoxNywiaWNlIjo2M31dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "line",
  "title": "EV sales overtaking ICE sales is coming",
  "subtitle": "Global new car sales by powertrain, millions of units",
  "source": "IEA Global EV Outlook",
  "palette": "editorial",
  "x": "year",
  "y": [
    "ev",
    "ice"
  ],
  "interpolation": "curved",
  "areaFill": true,
  "lineWidth": 2.5,
  "data": [
    {
      "year": 2018,
      "ev": 2,
      "ice": 84
    },
    {
      "year": 2019,
      "ev": 2.2,
      "ice": 81.5
    },
    {
      "year": 2020,
      "ev": 3.2,
      "ice": 72
    },
    {
      "year": 2021,
      "ev": 6.6,
      "ice": 75
    },
    {
      "year": 2022,
      "ev": 10.5,
      "ice": 71
    },
    {
      "year": 2023,
      "ev": 14,
      "ice": 67
    },
    {
      "year": 2024,
      "ev": 17,
      "ice": 63
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"line","title":"EV sales overtaking ICE sales is coming","subtitle":"Global new car sales by powertrain, millions of units","source":"IEA Global EV Outlook","palette":"editorial","x":"year","y":["ev","ice"],"interpolation":"curved","areaFill":true,"lineWidth":2.5,"data":[{"year":2018,"ev":2,"ice":84},{"year":2019,"ev":2.2,"ice":81.5},{"year":2020,"ev":3.2,"ice":72},{"year":2021,"ev":6.6,"ice":75},{"year":2022,"ev":10.5,"ice":71},{"year":2023,"ev":14,"ice":67},{"year":2024,"ev":17,"ice":63}]}' \
  --output line-2.png
```

</details>

### 3. Dashed forecast line

GDP growth with a projection. Demonstrates per-series lineStyle override (solid historical + dashed forecast).

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImxpbmUiLCJ0aXRsZSI6IkVVIEdEUCBncm93dGgsIGhpc3RvcmljYWwgKyBJTUYgZm9yZWNhc3QiLCJzdWJ0aXRsZSI6IkFubnVhbCByZWFsIEdEUCBncm93dGgsIHBlcmNlbnQiLCJzb3VyY2UiOiJJTUYgV29ybGQgRWNvbm9taWMgT3V0bG9vaywgQXByaWwgMjAyNSIsInBhbGV0dGUiOiJ0d2lsaWdodCIsIngiOiJ5ZWFyIiwieSI6WyJoaXN0b3JpY2FsIiwiZm9yZWNhc3QiXSwibGluZVN0eWxlIjp7Imhpc3RvcmljYWwiOiJzb2xpZCIsImZvcmVjYXN0IjoiZGFzaGVkIn0sInNob3dTeW1ib2xzIjoiYWxsIiwieUZvcm1hdCI6InBlcmNlbnQiLCJkYXRhIjpbeyJ5ZWFyIjoyMDE5LCJoaXN0b3JpY2FsIjowLjAxNywiZm9yZWNhc3QiOm51bGx9LHsieWVhciI6MjAyMCwiaGlzdG9yaWNhbCI6LTAuMDU4LCJmb3JlY2FzdCI6bnVsbH0seyJ5ZWFyIjoyMDIxLCJoaXN0b3JpY2FsIjowLjA1MywiZm9yZWNhc3QiOm51bGx9LHsieWVhciI6MjAyMiwiaGlzdG9yaWNhbCI6MC4wMzUsImZvcmVjYXN0IjpudWxsfSx7InllYXIiOjIwMjMsImhpc3RvcmljYWwiOjAuMDA0LCJmb3JlY2FzdCI6bnVsbH0seyJ5ZWFyIjoyMDI0LCJoaXN0b3JpY2FsIjowLjAwOCwiZm9yZWNhc3QiOm51bGx9LHsieWVhciI6MjAyNCwiaGlzdG9yaWNhbCI6bnVsbCwiZm9yZWNhc3QiOjAuMDA4fSx7InllYXIiOjIwMjUsImhpc3RvcmljYWwiOm51bGwsImZvcmVjYXN0IjowLjAxMn0seyJ5ZWFyIjoyMDI2LCJoaXN0b3JpY2FsIjpudWxsLCJmb3JlY2FzdCI6MC4wMTd9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "line",
  "title": "EU GDP growth, historical + IMF forecast",
  "subtitle": "Annual real GDP growth, percent",
  "source": "IMF World Economic Outlook, April 2025",
  "palette": "twilight",
  "x": "year",
  "y": [
    "historical",
    "forecast"
  ],
  "lineStyle": {
    "historical": "solid",
    "forecast": "dashed"
  },
  "showSymbols": "all",
  "yFormat": "percent",
  "data": [
    {
      "year": 2019,
      "historical": 0.017,
      "forecast": null
    },
    {
      "year": 2020,
      "historical": -0.058,
      "forecast": null
    },
    {
      "year": 2021,
      "historical": 0.053,
      "forecast": null
    },
    {
      "year": 2022,
      "historical": 0.035,
      "forecast": null
    },
    {
      "year": 2023,
      "historical": 0.004,
      "forecast": null
    },
    {
      "year": 2024,
      "historical": 0.008,
      "forecast": null
    },
    {
      "year": 2024,
      "historical": null,
      "forecast": 0.008
    },
    {
      "year": 2025,
      "historical": null,
      "forecast": 0.012
    },
    {
      "year": 2026,
      "historical": null,
      "forecast": 0.017
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"line","title":"EU GDP growth, historical + IMF forecast","subtitle":"Annual real GDP growth, percent","source":"IMF World Economic Outlook, April 2025","palette":"twilight","x":"year","y":["historical","forecast"],"lineStyle":{"historical":"solid","forecast":"dashed"},"showSymbols":"all","yFormat":"percent","data":[{"year":2019,"historical":0.017,"forecast":null},{"year":2020,"historical":-0.058,"forecast":null},{"year":2021,"historical":0.053,"forecast":null},{"year":2022,"historical":0.035,"forecast":null},{"year":2023,"historical":0.004,"forecast":null},{"year":2024,"historical":0.008,"forecast":null},{"year":2024,"historical":null,"forecast":0.008},{"year":2025,"historical":null,"forecast":0.012},{"year":2026,"historical":null,"forecast":0.017}]}' \
  --output line-3.png
```

</details>

---

## Bar chart (vertical + horizontal) {#bar}

### 1. Horizontal ranking

Top 8 programming languages by job postings. Auto-horizontal for long labels, descending sort.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhciIsInRpdGxlIjoiTW9zdCBpbi1kZW1hbmQgcHJvZ3JhbW1pbmcgbGFuZ3VhZ2VzIiwic3VidGl0bGUiOiJTaGFyZSBvZiBqb2IgcG9zdGluZ3MgbWVudGlvbmluZyB0aGUgbGFuZ3VhZ2UsIDIwMjQiLCJzb3VyY2UiOiJTdGFjayBPdmVyZmxvdyBEZXZlbG9wZXIgU3VydmV5IiwicGFsZXR0ZSI6ImNhcmJvbiIsImxhYmVsIjoibGFuZ3VhZ2UiLCJ2YWx1ZSI6InNoYXJlIiwib3JpZW50YXRpb24iOiJob3Jpem9udGFsIiwic29ydCI6ImRlc2MiLCJzaG93VmFsdWVMYWJlbHMiOnRydWUsInlGb3JtYXQiOiJwZXJjZW50IiwiZGF0YSI6W3sibGFuZ3VhZ2UiOiJQeXRob24iLCJzaGFyZSI6MC40ODV9LHsibGFuZ3VhZ2UiOiJKYXZhU2NyaXB0Iiwic2hhcmUiOjAuNDYyfSx7Imxhbmd1YWdlIjoiVHlwZVNjcmlwdCIsInNoYXJlIjowLjM5MX0seyJsYW5ndWFnZSI6IlNRTCIsInNoYXJlIjowLjM2Mn0seyJsYW5ndWFnZSI6IkphdmEiLCJzaGFyZSI6MC4yODd9LHsibGFuZ3VhZ2UiOiJHbyIsInNoYXJlIjowLjE3OH0seyJsYW5ndWFnZSI6IlJ1c3QiLCJzaGFyZSI6MC4xMjF9LHsibGFuZ3VhZ2UiOiJDIyIsInNoYXJlIjowLjIwOX1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "bar",
  "title": "Most in-demand programming languages",
  "subtitle": "Share of job postings mentioning the language, 2024",
  "source": "Stack Overflow Developer Survey",
  "palette": "carbon",
  "label": "language",
  "value": "share",
  "orientation": "horizontal",
  "sort": "desc",
  "showValueLabels": true,
  "yFormat": "percent",
  "data": [
    {
      "language": "Python",
      "share": 0.485
    },
    {
      "language": "JavaScript",
      "share": 0.462
    },
    {
      "language": "TypeScript",
      "share": 0.391
    },
    {
      "language": "SQL",
      "share": 0.362
    },
    {
      "language": "Java",
      "share": 0.287
    },
    {
      "language": "Go",
      "share": 0.178
    },
    {
      "language": "Rust",
      "share": 0.121
    },
    {
      "language": "C#",
      "share": 0.209
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"bar","title":"Most in-demand programming languages","subtitle":"Share of job postings mentioning the language, 2024","source":"Stack Overflow Developer Survey","palette":"carbon","label":"language","value":"share","orientation":"horizontal","sort":"desc","showValueLabels":true,"yFormat":"percent","data":[{"language":"Python","share":0.485},{"language":"JavaScript","share":0.462},{"language":"TypeScript","share":0.391},{"language":"SQL","share":0.362},{"language":"Java","share":0.287},{"language":"Go","share":0.178},{"language":"Rust","share":0.121},{"language":"C#","share":0.209}]}' \
  --output bar-1.png
```

</details>

### 2. Vertical with negatives

Monthly portfolio returns. Vertical bars, negatives rendered below zero line, value labels visible.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhciIsInRpdGxlIjoiUG9ydGZvbGlvIG1vbnRobHkgcmV0dXJucyBpbiAyMDI0Iiwic3VidGl0bGUiOiJUb3RhbCByZXR1cm4sIHBlcmNlbnQiLCJzb3VyY2UiOiJJbnRlcm5hbCBwZXJmb3JtYW5jZSByZXBvcnQiLCJwYWxldHRlIjoiZGl2ZXJnaW5nLXN1bnNldCIsImxhYmVsIjoibW9udGgiLCJ2YWx1ZSI6InJldHVybiIsIm9yaWVudGF0aW9uIjoidmVydGljYWwiLCJzb3J0Ijoibm9uZSIsInNob3dWYWx1ZUxhYmVscyI6dHJ1ZSwieUZvcm1hdCI6InBlcmNlbnQiLCJkYXRhIjpbeyJtb250aCI6IkphbiIsInJldHVybiI6MC4wMjR9LHsibW9udGgiOiJGZWIiLCJyZXR1cm4iOjAuMDE4fSx7Im1vbnRoIjoiTWFyIiwicmV0dXJuIjotMC4wMTJ9LHsibW9udGgiOiJBcHIiLCJyZXR1cm4iOjAuMDMxfSx7Im1vbnRoIjoiTWF5IiwicmV0dXJuIjotMC4wMDh9LHsibW9udGgiOiJKdW4iLCJyZXR1cm4iOjAuMDIyfSx7Im1vbnRoIjoiSnVsIiwicmV0dXJuIjowLjAxN30seyJtb250aCI6IkF1ZyIsInJldHVybiI6LTAuMDIxfSx7Im1vbnRoIjoiU2VwIiwicmV0dXJuIjowLjAxNX0seyJtb250aCI6Ik9jdCIsInJldHVybiI6MC4wMjl9LHsibW9udGgiOiJOb3YiLCJyZXR1cm4iOjAuMDExfSx7Im1vbnRoIjoiRGVjIiwicmV0dXJuIjowLjAyNn1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "bar",
  "title": "Portfolio monthly returns in 2024",
  "subtitle": "Total return, percent",
  "source": "Internal performance report",
  "palette": "diverging-sunset",
  "label": "month",
  "value": "return",
  "orientation": "vertical",
  "sort": "none",
  "showValueLabels": true,
  "yFormat": "percent",
  "data": [
    {
      "month": "Jan",
      "return": 0.024
    },
    {
      "month": "Feb",
      "return": 0.018
    },
    {
      "month": "Mar",
      "return": -0.012
    },
    {
      "month": "Apr",
      "return": 0.031
    },
    {
      "month": "May",
      "return": -0.008
    },
    {
      "month": "Jun",
      "return": 0.022
    },
    {
      "month": "Jul",
      "return": 0.017
    },
    {
      "month": "Aug",
      "return": -0.021
    },
    {
      "month": "Sep",
      "return": 0.015
    },
    {
      "month": "Oct",
      "return": 0.029
    },
    {
      "month": "Nov",
      "return": 0.011
    },
    {
      "month": "Dec",
      "return": 0.026
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"bar","title":"Portfolio monthly returns in 2024","subtitle":"Total return, percent","source":"Internal performance report","palette":"diverging-sunset","label":"month","value":"return","orientation":"vertical","sort":"none","showValueLabels":true,"yFormat":"percent","data":[{"month":"Jan","return":0.024},{"month":"Feb","return":0.018},{"month":"Mar","return":-0.012},{"month":"Apr","return":0.031},{"month":"May","return":-0.008},{"month":"Jun","return":0.022},{"month":"Jul","return":0.017},{"month":"Aug","return":-0.021},{"month":"Sep","return":0.015},{"month":"Oct","return":0.029},{"month":"Nov","return":0.011},{"month":"Dec","return":0.026}]}' \
  --output bar-2.png
```

</details>

### 3. Simple category comparison

Thick bars, single category, good for quick dashboards. Clarity default palette.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhciIsInRpdGxlIjoiV2Vic2l0ZSB0cmFmZmljIGJ5IGNoYW5uZWwiLCJzdWJ0aXRsZSI6IlNlc3Npb25zIGluIHRoZSBsYXN0IDMwIGRheXMsIHRob3VzYW5kcyIsInNvdXJjZSI6Ikdvb2dsZSBBbmFseXRpY3MiLCJwYWxldHRlIjoibW9uby1ibHVlIiwibGFiZWwiOiJjaGFubmVsIiwidmFsdWUiOiJzZXNzaW9ucyIsInNvcnQiOiJkZXNjIiwiYmFyVGhpY2tuZXNzIjoidGhpY2siLCJzaG93VmFsdWVMYWJlbHMiOnRydWUsImRhdGEiOlt7ImNoYW5uZWwiOiJPcmdhbmljIFNlYXJjaCIsInNlc3Npb25zIjo0MTJ9LHsiY2hhbm5lbCI6IkRpcmVjdCIsInNlc3Npb25zIjoyODZ9LHsiY2hhbm5lbCI6IlBhaWQgU2VhcmNoIiwic2Vzc2lvbnMiOjE5OH0seyJjaGFubmVsIjoiU29jaWFsIiwic2Vzc2lvbnMiOjE0Mn0seyJjaGFubmVsIjoiRW1haWwiLCJzZXNzaW9ucyI6NzN9LHsiY2hhbm5lbCI6IlJlZmVycmFsIiwic2Vzc2lvbnMiOjUxfV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "bar",
  "title": "Website traffic by channel",
  "subtitle": "Sessions in the last 30 days, thousands",
  "source": "Google Analytics",
  "palette": "mono-blue",
  "label": "channel",
  "value": "sessions",
  "sort": "desc",
  "barThickness": "thick",
  "showValueLabels": true,
  "data": [
    {
      "channel": "Organic Search",
      "sessions": 412
    },
    {
      "channel": "Direct",
      "sessions": 286
    },
    {
      "channel": "Paid Search",
      "sessions": 198
    },
    {
      "channel": "Social",
      "sessions": 142
    },
    {
      "channel": "Email",
      "sessions": 73
    },
    {
      "channel": "Referral",
      "sessions": 51
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"bar","title":"Website traffic by channel","subtitle":"Sessions in the last 30 days, thousands","source":"Google Analytics","palette":"mono-blue","label":"channel","value":"sessions","sort":"desc","barThickness":"thick","showValueLabels":true,"data":[{"channel":"Organic Search","sessions":412},{"channel":"Direct","sessions":286},{"channel":"Paid Search","sessions":198},{"channel":"Social","sessions":142},{"channel":"Email","sessions":73},{"channel":"Referral","sessions":51}]}' \
  --output bar-3.png
```

</details>

---

## Grouped bar chart {#grouped-bar}

### 1. Quarterly revenue by region

Three regions side-by-side across four quarters. Legend appears automatically for multi-series.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6Imdyb3VwZWQtYmFyIiwidGl0bGUiOiJSZXZlbnVlIGJ5IHJlZ2lvbiIsInN1YnRpdGxlIjoiUXVhcnRlcmx5IHJldmVudWUsIFVTRCBtaWxsaW9ucywgRlkyMDI0Iiwic291cmNlIjoiSW50ZXJuYWwgZmluYW5jZSIsInBhbGV0dGUiOiJ2aWJyYW50IiwieCI6InF1YXJ0ZXIiLCJ5IjpbImFtZXJpY2FzIiwiZW1lYSIsImFwYWMiXSwic2hvd1ZhbHVlTGFiZWxzIjp0cnVlLCJ5Rm9ybWF0IjoiY3VycmVuY3kiLCJkYXRhIjpbeyJxdWFydGVyIjoiUTEiLCJhbWVyaWNhcyI6MTQyLCJlbWVhIjo5OCwiYXBhYyI6Njd9LHsicXVhcnRlciI6IlEyIiwiYW1lcmljYXMiOjE1NiwiZW1lYSI6MTEyLCJhcGFjIjo3NH0seyJxdWFydGVyIjoiUTMiLCJhbWVyaWNhcyI6MTY4LCJlbWVhIjoxMjEsImFwYWMiOjgxfSx7InF1YXJ0ZXIiOiJRNCIsImFtZXJpY2FzIjoxODEsImVtZWEiOjEzNCwiYXBhYyI6OTJ9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "grouped-bar",
  "title": "Revenue by region",
  "subtitle": "Quarterly revenue, USD millions, FY2024",
  "source": "Internal finance",
  "palette": "vibrant",
  "x": "quarter",
  "y": [
    "americas",
    "emea",
    "apac"
  ],
  "showValueLabels": true,
  "yFormat": "currency",
  "data": [
    {
      "quarter": "Q1",
      "americas": 142,
      "emea": 98,
      "apac": 67
    },
    {
      "quarter": "Q2",
      "americas": 156,
      "emea": 112,
      "apac": 74
    },
    {
      "quarter": "Q3",
      "americas": 168,
      "emea": 121,
      "apac": 81
    },
    {
      "quarter": "Q4",
      "americas": 181,
      "emea": 134,
      "apac": 92
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"grouped-bar","title":"Revenue by region","subtitle":"Quarterly revenue, USD millions, FY2024","source":"Internal finance","palette":"vibrant","x":"quarter","y":["americas","emea","apac"],"showValueLabels":true,"yFormat":"currency","data":[{"quarter":"Q1","americas":142,"emea":98,"apac":67},{"quarter":"Q2","americas":156,"emea":112,"apac":74},{"quarter":"Q3","americas":168,"emea":121,"apac":81},{"quarter":"Q4","americas":181,"emea":134,"apac":92}]}' \
  --output grouped-bar-1.png
```

</details>

### 2. Before/after A-B comparison

Performance metrics before and after optimization, grouped by page.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6Imdyb3VwZWQtYmFyIiwidGl0bGUiOiJQZXJmb3JtYW5jZSB3aW5zIGZyb20gdGhlIHJld3JpdGUiLCJzdWJ0aXRsZSI6IlBhZ2UgbG9hZCB0aW1lIGluIG1pbGxpc2Vjb25kcyIsInNvdXJjZSI6IldlYlBhZ2VUZXN0IGxhYiIsInBhbGV0dGUiOiJlYXJ0aCIsIngiOiJwYWdlIiwieSI6WyJiZWZvcmUiLCJhZnRlciJdLCJzaG93VmFsdWVMYWJlbHMiOnRydWUsImRhdGEiOlt7InBhZ2UiOiJIb21lcGFnZSIsImJlZm9yZSI6Mjg0MCwiYWZ0ZXIiOjExMjB9LHsicGFnZSI6IlByb2R1Y3QiLCJiZWZvcmUiOjMyMTAsImFmdGVyIjoxMzUwfSx7InBhZ2UiOiJDaGVja291dCIsImJlZm9yZSI6MjY4MCwiYWZ0ZXIiOjk4MH0seyJwYWdlIjoiU2VhcmNoIiwiYmVmb3JlIjoxOTIwLCJhZnRlciI6NzYwfSx7InBhZ2UiOiJBY2NvdW50IiwiYmVmb3JlIjoyNDUwLCJhZnRlciI6MTA2MH1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "grouped-bar",
  "title": "Performance wins from the rewrite",
  "subtitle": "Page load time in milliseconds",
  "source": "WebPageTest lab",
  "palette": "earth",
  "x": "page",
  "y": [
    "before",
    "after"
  ],
  "showValueLabels": true,
  "data": [
    {
      "page": "Homepage",
      "before": 2840,
      "after": 1120
    },
    {
      "page": "Product",
      "before": 3210,
      "after": 1350
    },
    {
      "page": "Checkout",
      "before": 2680,
      "after": 980
    },
    {
      "page": "Search",
      "before": 1920,
      "after": 760
    },
    {
      "page": "Account",
      "before": 2450,
      "after": 1060
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"grouped-bar","title":"Performance wins from the rewrite","subtitle":"Page load time in milliseconds","source":"WebPageTest lab","palette":"earth","x":"page","y":["before","after"],"showValueLabels":true,"data":[{"page":"Homepage","before":2840,"after":1120},{"page":"Product","before":3210,"after":1350},{"page":"Checkout","before":2680,"after":980},{"page":"Search","before":1920,"after":760},{"page":"Account","before":2450,"after":1060}]}' \
  --output grouped-bar-2.png
```

</details>

### 3. Horizontal group with three series

Exam scores across subjects for three students. Horizontal orientation for long category labels.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6Imdyb3VwZWQtYmFyIiwidGl0bGUiOiJDbGFzc3Jvb20gZXhhbSByZXN1bHRzIiwic3VidGl0bGUiOiJGaW5hbCBzY29yZSwgcGVyY2VudCwgc3ByaW5nIHRlcm0iLCJwYWxldHRlIjoiYm9hcmRyb29tIiwieCI6InN1YmplY3QiLCJ5IjpbImFubmEiLCJiZW4iLCJjaGxvZSJdLCJvcmllbnRhdGlvbiI6Imhvcml6b250YWwiLCJ5Rm9ybWF0IjoicGVyY2VudCIsImRhdGEiOlt7InN1YmplY3QiOiJNYXRoZW1hdGljcyIsImFubmEiOjAuOTIsImJlbiI6MC43OCwiY2hsb2UiOjAuODV9LHsic3ViamVjdCI6IlBoeXNpY3MiLCJhbm5hIjowLjg4LCJiZW4iOjAuODIsImNobG9lIjowLjc2fSx7InN1YmplY3QiOiJMaXRlcmF0dXJlIiwiYW5uYSI6MC44MSwiYmVuIjowLjk0LCJjaGxvZSI6MC44OX0seyJzdWJqZWN0IjoiSGlzdG9yeSIsImFubmEiOjAuODUsImJlbiI6MC45LCJjaGxvZSI6MC45M31dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "grouped-bar",
  "title": "Classroom exam results",
  "subtitle": "Final score, percent, spring term",
  "palette": "boardroom",
  "x": "subject",
  "y": [
    "anna",
    "ben",
    "chloe"
  ],
  "orientation": "horizontal",
  "yFormat": "percent",
  "data": [
    {
      "subject": "Mathematics",
      "anna": 0.92,
      "ben": 0.78,
      "chloe": 0.85
    },
    {
      "subject": "Physics",
      "anna": 0.88,
      "ben": 0.82,
      "chloe": 0.76
    },
    {
      "subject": "Literature",
      "anna": 0.81,
      "ben": 0.94,
      "chloe": 0.89
    },
    {
      "subject": "History",
      "anna": 0.85,
      "ben": 0.9,
      "chloe": 0.93
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"grouped-bar","title":"Classroom exam results","subtitle":"Final score, percent, spring term","palette":"boardroom","x":"subject","y":["anna","ben","chloe"],"orientation":"horizontal","yFormat":"percent","data":[{"subject":"Mathematics","anna":0.92,"ben":0.78,"chloe":0.85},{"subject":"Physics","anna":0.88,"ben":0.82,"chloe":0.76},{"subject":"Literature","anna":0.81,"ben":0.94,"chloe":0.89},{"subject":"History","anna":0.85,"ben":0.9,"chloe":0.93}]}' \
  --output grouped-bar-3.png
```

</details>

---

## Stacked bar chart {#stacked-bar}

### 1. Energy mix per country

Electricity generation share stacked by source. Normalized to 100 percent.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InN0YWNrZWQtYmFyIiwidGl0bGUiOiJFbGVjdHJpY2l0eSBtaXggYnkgY291bnRyeSIsInN1YnRpdGxlIjoiU2hhcmUgb2YgZ2VuZXJhdGlvbiBieSBzb3VyY2UsIDIwMjMiLCJzb3VyY2UiOiJJRUEiLCJwYWxldHRlIjoiZWFydGgiLCJ4IjoiY291bnRyeSIsInkiOlsiY29hbCIsImdhcyIsIm51Y2xlYXIiLCJyZW5ld2FibGUiXSwibm9ybWFsaXplIjp0cnVlLCJzaG93VmFsdWVMYWJlbHMiOmZhbHNlLCJkYXRhIjpbeyJjb3VudHJ5IjoiR2VybWFueSIsImNvYWwiOjI0LCJnYXMiOjE0LCJudWNsZWFyIjowLCJyZW5ld2FibGUiOjYyfSx7ImNvdW50cnkiOiJGcmFuY2UiLCJjb2FsIjoxLCJnYXMiOjgsIm51Y2xlYXIiOjY1LCJyZW5ld2FibGUiOjI2fSx7ImNvdW50cnkiOiJQb2xhbmQiLCJjb2FsIjo2MywiZ2FzIjoxMCwibnVjbGVhciI6MCwicmVuZXdhYmxlIjoyN30seyJjb3VudHJ5IjoiRGVubWFyayIsImNvYWwiOjksImdhcyI6NCwibnVjbGVhciI6MCwicmVuZXdhYmxlIjo4N30seyJjb3VudHJ5IjoiU3BhaW4iLCJjb2FsIjozLCJnYXMiOjE4LCJudWNsZWFyIjoyMCwicmVuZXdhYmxlIjo1OX1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "stacked-bar",
  "title": "Electricity mix by country",
  "subtitle": "Share of generation by source, 2023",
  "source": "IEA",
  "palette": "earth",
  "x": "country",
  "y": [
    "coal",
    "gas",
    "nuclear",
    "renewable"
  ],
  "normalize": true,
  "showValueLabels": false,
  "data": [
    {
      "country": "Germany",
      "coal": 24,
      "gas": 14,
      "nuclear": 0,
      "renewable": 62
    },
    {
      "country": "France",
      "coal": 1,
      "gas": 8,
      "nuclear": 65,
      "renewable": 26
    },
    {
      "country": "Poland",
      "coal": 63,
      "gas": 10,
      "nuclear": 0,
      "renewable": 27
    },
    {
      "country": "Denmark",
      "coal": 9,
      "gas": 4,
      "nuclear": 0,
      "renewable": 87
    },
    {
      "country": "Spain",
      "coal": 3,
      "gas": 18,
      "nuclear": 20,
      "renewable": 59
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"stacked-bar","title":"Electricity mix by country","subtitle":"Share of generation by source, 2023","source":"IEA","palette":"earth","x":"country","y":["coal","gas","nuclear","renewable"],"normalize":true,"showValueLabels":false,"data":[{"country":"Germany","coal":24,"gas":14,"nuclear":0,"renewable":62},{"country":"France","coal":1,"gas":8,"nuclear":65,"renewable":26},{"country":"Poland","coal":63,"gas":10,"nuclear":0,"renewable":27},{"country":"Denmark","coal":9,"gas":4,"nuclear":0,"renewable":87},{"country":"Spain","coal":3,"gas":18,"nuclear":20,"renewable":59}]}' \
  --output stacked-bar-1.png
```

</details>

### 2. Budget breakdown absolute

Monthly budget stacked by category, absolute values. Total shown at top of each bar.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InN0YWNrZWQtYmFyIiwidGl0bGUiOiJXaGVyZSB0aGUgbW9uZXkgZ29lcyIsInN1YnRpdGxlIjoiUGVyc29uYWwgbW9udGhseSBzcGVuZGluZywgVVNELCBsYXN0IHNpeCBtb250aHMiLCJwYWxldHRlIjoibW9uby1ibHVlIiwieCI6Im1vbnRoIiwieSI6WyJyZW50IiwiZm9vZCIsInRyYW5zcG9ydCIsImxlaXN1cmUiLCJzYXZpbmdzIl0sInNob3dUb3RhbHMiOnRydWUsInlGb3JtYXQiOiJjdXJyZW5jeSIsImRhdGEiOlt7Im1vbnRoIjoiSnVsIiwicmVudCI6MTQwMCwiZm9vZCI6NTIwLCJ0cmFuc3BvcnQiOjE4MCwibGVpc3VyZSI6MjQwLCJzYXZpbmdzIjo2NjB9LHsibW9udGgiOiJBdWciLCJyZW50IjoxNDAwLCJmb29kIjo0ODAsInRyYW5zcG9ydCI6MjEwLCJsZWlzdXJlIjozMTAsInNhdmluZ3MiOjYwMH0seyJtb250aCI6IlNlcCIsInJlbnQiOjE0MDAsImZvb2QiOjUxMCwidHJhbnNwb3J0IjoxOTUsImxlaXN1cmUiOjI3NSwic2F2aW5ncyI6NjIwfSx7Im1vbnRoIjoiT2N0IiwicmVudCI6MTQwMCwiZm9vZCI6NTU1LCJ0cmFuc3BvcnQiOjE3NSwibGVpc3VyZSI6MjIwLCJzYXZpbmdzIjo2NTB9LHsibW9udGgiOiJOb3YiLCJyZW50IjoxNDAwLCJmb29kIjo1NDAsInRyYW5zcG9ydCI6MTYwLCJsZWlzdXJlIjoyNjUsInNhdmluZ3MiOjYzNX0seyJtb250aCI6IkRlYyIsInJlbnQiOjE0MDAsImZvb2QiOjYxMCwidHJhbnNwb3J0IjoxNzAsImxlaXN1cmUiOjQwNSwic2F2aW5ncyI6NDE1fV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "stacked-bar",
  "title": "Where the money goes",
  "subtitle": "Personal monthly spending, USD, last six months",
  "palette": "mono-blue",
  "x": "month",
  "y": [
    "rent",
    "food",
    "transport",
    "leisure",
    "savings"
  ],
  "showTotals": true,
  "yFormat": "currency",
  "data": [
    {
      "month": "Jul",
      "rent": 1400,
      "food": 520,
      "transport": 180,
      "leisure": 240,
      "savings": 660
    },
    {
      "month": "Aug",
      "rent": 1400,
      "food": 480,
      "transport": 210,
      "leisure": 310,
      "savings": 600
    },
    {
      "month": "Sep",
      "rent": 1400,
      "food": 510,
      "transport": 195,
      "leisure": 275,
      "savings": 620
    },
    {
      "month": "Oct",
      "rent": 1400,
      "food": 555,
      "transport": 175,
      "leisure": 220,
      "savings": 650
    },
    {
      "month": "Nov",
      "rent": 1400,
      "food": 540,
      "transport": 160,
      "leisure": 265,
      "savings": 635
    },
    {
      "month": "Dec",
      "rent": 1400,
      "food": 610,
      "transport": 170,
      "leisure": 405,
      "savings": 415
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"stacked-bar","title":"Where the money goes","subtitle":"Personal monthly spending, USD, last six months","palette":"mono-blue","x":"month","y":["rent","food","transport","leisure","savings"],"showTotals":true,"yFormat":"currency","data":[{"month":"Jul","rent":1400,"food":520,"transport":180,"leisure":240,"savings":660},{"month":"Aug","rent":1400,"food":480,"transport":210,"leisure":310,"savings":600},{"month":"Sep","rent":1400,"food":510,"transport":195,"leisure":275,"savings":620},{"month":"Oct","rent":1400,"food":555,"transport":175,"leisure":220,"savings":650},{"month":"Nov","rent":1400,"food":540,"transport":160,"leisure":265,"savings":635},{"month":"Dec","rent":1400,"food":610,"transport":170,"leisure":405,"savings":415}]}' \
  --output stacked-bar-2.png
```

</details>

### 3. Horizontal stacked satisfaction

Survey results stacked by response, horizontal layout, perfect for Likert-scale data.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InN0YWNrZWQtYmFyIiwidGl0bGUiOiJDdXN0b21lciBzYXRpc2ZhY3Rpb24gYnkgcHJvZHVjdCBsaW5lIiwic3VidGl0bGUiOiJTaGFyZSBvZiByZXNwb25zZXMgb24gYSA1LXBvaW50IHNjYWxlIiwic291cmNlIjoiQW5udWFsIGN1c3RvbWVyIHN1cnZleSwgbj00LDIxNSIsInBhbGV0dGUiOiJkaXZlcmdpbmctc3Vuc2V0IiwieCI6InByb2R1Y3QiLCJ5IjpbInZlcnktZGlzc2F0aXNmaWVkIiwiZGlzc2F0aXNmaWVkIiwibmV1dHJhbCIsInNhdGlzZmllZCIsInZlcnktc2F0aXNmaWVkIl0sIm9yaWVudGF0aW9uIjoiaG9yaXpvbnRhbCIsIm5vcm1hbGl6ZSI6dHJ1ZSwiZGF0YSI6W3sicHJvZHVjdCI6IlN0YXJ0ZXIgUGxhbiIsInZlcnktZGlzc2F0aXNmaWVkIjozLCJkaXNzYXRpc2ZpZWQiOjYsIm5ldXRyYWwiOjE4LCJzYXRpc2ZpZWQiOjQ4LCJ2ZXJ5LXNhdGlzZmllZCI6MjV9LHsicHJvZHVjdCI6IlBybyBQbGFuIiwidmVyeS1kaXNzYXRpc2ZpZWQiOjIsImRpc3NhdGlzZmllZCI6NCwibmV1dHJhbCI6MTIsInNhdGlzZmllZCI6NDQsInZlcnktc2F0aXNmaWVkIjozOH0seyJwcm9kdWN0IjoiRW50ZXJwcmlzZSIsInZlcnktZGlzc2F0aXNmaWVkIjoxLCJkaXNzYXRpc2ZpZWQiOjMsIm5ldXRyYWwiOjgsInNhdGlzZmllZCI6NDAsInZlcnktc2F0aXNmaWVkIjo0OH0seyJwcm9kdWN0IjoiTW9iaWxlIEFwcCIsInZlcnktZGlzc2F0aXNmaWVkIjo1LCJkaXNzYXRpc2ZpZWQiOjksIm5ldXRyYWwiOjIyLCJzYXRpc2ZpZWQiOjQxLCJ2ZXJ5LXNhdGlzZmllZCI6MjN9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "stacked-bar",
  "title": "Customer satisfaction by product line",
  "subtitle": "Share of responses on a 5-point scale",
  "source": "Annual customer survey, n=4,215",
  "palette": "diverging-sunset",
  "x": "product",
  "y": [
    "very-dissatisfied",
    "dissatisfied",
    "neutral",
    "satisfied",
    "very-satisfied"
  ],
  "orientation": "horizontal",
  "normalize": true,
  "data": [
    {
      "product": "Starter Plan",
      "very-dissatisfied": 3,
      "dissatisfied": 6,
      "neutral": 18,
      "satisfied": 48,
      "very-satisfied": 25
    },
    {
      "product": "Pro Plan",
      "very-dissatisfied": 2,
      "dissatisfied": 4,
      "neutral": 12,
      "satisfied": 44,
      "very-satisfied": 38
    },
    {
      "product": "Enterprise",
      "very-dissatisfied": 1,
      "dissatisfied": 3,
      "neutral": 8,
      "satisfied": 40,
      "very-satisfied": 48
    },
    {
      "product": "Mobile App",
      "very-dissatisfied": 5,
      "dissatisfied": 9,
      "neutral": 22,
      "satisfied": 41,
      "very-satisfied": 23
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"stacked-bar","title":"Customer satisfaction by product line","subtitle":"Share of responses on a 5-point scale","source":"Annual customer survey, n=4,215","palette":"diverging-sunset","x":"product","y":["very-dissatisfied","dissatisfied","neutral","satisfied","very-satisfied"],"orientation":"horizontal","normalize":true,"data":[{"product":"Starter Plan","very-dissatisfied":3,"dissatisfied":6,"neutral":18,"satisfied":48,"very-satisfied":25},{"product":"Pro Plan","very-dissatisfied":2,"dissatisfied":4,"neutral":12,"satisfied":44,"very-satisfied":38},{"product":"Enterprise","very-dissatisfied":1,"dissatisfied":3,"neutral":8,"satisfied":40,"very-satisfied":48},{"product":"Mobile App","very-dissatisfied":5,"dissatisfied":9,"neutral":22,"satisfied":41,"very-satisfied":23}]}' \
  --output stacked-bar-3.png
```

</details>

---

## Bar split (small multiples) {#bar-split}

### 1. Small multiples by channel

Marketing channel performance displayed as independent small-multiple bar charts.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhci1zcGxpdCIsInRpdGxlIjoiQ2hhbm5lbCBwZXJmb3JtYW5jZSBzbWFsbC1tdWx0aXBsZXMiLCJzdWJ0aXRsZSI6IlF1YXJ0ZXJseSBzcGVuZCBhbmQgY29udmVyc2lvbnMgYnkgY2hhbm5lbCwgMjAyNCIsInBhbGV0dGUiOiJ2aWJyYW50IiwieCI6InF1YXJ0ZXIiLCJ5IjpbInNwZW5kIiwiY29udmVyc2lvbnMiLCJyZXZlbnVlIl0sInNoYXJlZFNjYWxlIjpmYWxzZSwiZGF0YSI6W3sicXVhcnRlciI6IlExIiwic3BlbmQiOjQ4MDAwLCJjb252ZXJzaW9ucyI6MTI0MCwicmV2ZW51ZSI6MTg1MDAwfSx7InF1YXJ0ZXIiOiJRMiIsInNwZW5kIjo1MjAwMCwiY29udmVyc2lvbnMiOjE0MjAsInJldmVudWUiOjIxMjAwMH0seyJxdWFydGVyIjoiUTMiLCJzcGVuZCI6NjEwMDAsImNvbnZlcnNpb25zIjoxNTkwLCJyZXZlbnVlIjoyNDgwMDB9LHsicXVhcnRlciI6IlE0Iiwic3BlbmQiOjcyMDAwLCJjb252ZXJzaW9ucyI6MTgxMCwicmV2ZW51ZSI6MjkxMDAwfV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "bar-split",
  "title": "Channel performance small-multiples",
  "subtitle": "Quarterly spend and conversions by channel, 2024",
  "palette": "vibrant",
  "x": "quarter",
  "y": [
    "spend",
    "conversions",
    "revenue"
  ],
  "sharedScale": false,
  "data": [
    {
      "quarter": "Q1",
      "spend": 48000,
      "conversions": 1240,
      "revenue": 185000
    },
    {
      "quarter": "Q2",
      "spend": 52000,
      "conversions": 1420,
      "revenue": 212000
    },
    {
      "quarter": "Q3",
      "spend": 61000,
      "conversions": 1590,
      "revenue": 248000
    },
    {
      "quarter": "Q4",
      "spend": 72000,
      "conversions": 1810,
      "revenue": 291000
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"bar-split","title":"Channel performance small-multiples","subtitle":"Quarterly spend and conversions by channel, 2024","palette":"vibrant","x":"quarter","y":["spend","conversions","revenue"],"sharedScale":false,"data":[{"quarter":"Q1","spend":48000,"conversions":1240,"revenue":185000},{"quarter":"Q2","spend":52000,"conversions":1420,"revenue":212000},{"quarter":"Q3","spend":61000,"conversions":1590,"revenue":248000},{"quarter":"Q4","spend":72000,"conversions":1810,"revenue":291000}]}' \
  --output bar-split-1.png
```

</details>

### 2. KPI grid by team

Three KPIs per team, shown in grid so you can eyeball all dimensions at once.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhci1zcGxpdCIsInRpdGxlIjoiVGVhbSBLUElzIGF0IGEgZ2xhbmNlIiwic3VidGl0bGUiOiJNb250aGx5IGF2ZXJhZ2VzLCBRNCAyMDI0IiwicGFsZXR0ZSI6ImNhcmJvbiIsIngiOiJ0ZWFtIiwieSI6WyJ2ZWxvY2l0eSIsImJ1Z3MiLCJ1cHRpbWUiXSwiY29sdW1ucyI6Mywic2hhcmVkU2NhbGUiOmZhbHNlLCJkYXRhIjpbeyJ0ZWFtIjoiUGxhdGZvcm0iLCJ2ZWxvY2l0eSI6MzQsImJ1Z3MiOjYsInVwdGltZSI6OTkuOTJ9LHsidGVhbSI6IldlYiIsInZlbG9jaXR5Ijo0MiwiYnVncyI6MTEsInVwdGltZSI6OTkuODF9LHsidGVhbSI6Ik1vYmlsZSIsInZlbG9jaXR5IjoyOCwiYnVncyI6OSwidXB0aW1lIjo5OS44OH0seyJ0ZWFtIjoiRGF0YSIsInZlbG9jaXR5IjoyMiwiYnVncyI6NCwidXB0aW1lIjo5OS45NX1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "bar-split",
  "title": "Team KPIs at a glance",
  "subtitle": "Monthly averages, Q4 2024",
  "palette": "carbon",
  "x": "team",
  "y": [
    "velocity",
    "bugs",
    "uptime"
  ],
  "columns": 3,
  "sharedScale": false,
  "data": [
    {
      "team": "Platform",
      "velocity": 34,
      "bugs": 6,
      "uptime": 99.92
    },
    {
      "team": "Web",
      "velocity": 42,
      "bugs": 11,
      "uptime": 99.81
    },
    {
      "team": "Mobile",
      "velocity": 28,
      "bugs": 9,
      "uptime": 99.88
    },
    {
      "team": "Data",
      "velocity": 22,
      "bugs": 4,
      "uptime": 99.95
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"bar-split","title":"Team KPIs at a glance","subtitle":"Monthly averages, Q4 2024","palette":"carbon","x":"team","y":["velocity","bugs","uptime"],"columns":3,"sharedScale":false,"data":[{"team":"Platform","velocity":34,"bugs":6,"uptime":99.92},{"team":"Web","velocity":42,"bugs":11,"uptime":99.81},{"team":"Mobile","velocity":28,"bugs":9,"uptime":99.88},{"team":"Data","velocity":22,"bugs":4,"uptime":99.95}]}' \
  --output bar-split-2.png
```

</details>

### 3. Shared-scale comparison

Same scale across panels to make magnitude comparable; useful when values share units.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImJhci1zcGxpdCIsInRpdGxlIjoiRGFpbHkgYWN0aXZlIHVzZXJzIGJ5IGFwcCIsInN1YnRpdGxlIjoiREFVIGluIG1pbGxpb25zLCBsYXRlc3Qgd2VlayIsInBhbGV0dGUiOiJtb25vLWJsdWUiLCJ4IjoiZGF5IiwieSI6WyJhcHBBbHBoYSIsImFwcEJldGEiLCJhcHBHYW1tYSIsImFwcERlbHRhIl0sInNoYXJlZFNjYWxlIjp0cnVlLCJjb2x1bW5zIjoyLCJkYXRhIjpbeyJkYXkiOiJNb24iLCJhcHBBbHBoYSI6MTIuNCwiYXBwQmV0YSI6OC45LCJhcHBHYW1tYSI6MTUuMSwiYXBwRGVsdGEiOjQuMn0seyJkYXkiOiJUdWUiLCJhcHBBbHBoYSI6MTMuMSwiYXBwQmV0YSI6OS4zLCJhcHBHYW1tYSI6MTUuOCwiYXBwRGVsdGEiOjQuNX0seyJkYXkiOiJXZWQiLCJhcHBBbHBoYSI6MTIuOCwiYXBwQmV0YSI6OSwiYXBwR2FtbWEiOjE2LCJhcHBEZWx0YSI6NC40fSx7ImRheSI6IlRodSIsImFwcEFscGhhIjoxMy42LCJhcHBCZXRhIjo5LjYsImFwcEdhbW1hIjoxNi4zLCJhcHBEZWx0YSI6NC43fSx7ImRheSI6IkZyaSIsImFwcEFscGhhIjoxNC4yLCJhcHBCZXRhIjo5LjgsImFwcEdhbW1hIjoxNi45LCJhcHBEZWx0YSI6NX0seyJkYXkiOiJTYXQiLCJhcHBBbHBoYSI6MTEuOSwiYXBwQmV0YSI6OC40LCJhcHBHYW1tYSI6MTQuOCwiYXBwRGVsdGEiOjMuOX0seyJkYXkiOiJTdW4iLCJhcHBBbHBoYSI6MTEuNSwiYXBwQmV0YSI6OC4xLCJhcHBHYW1tYSI6MTQuMiwiYXBwRGVsdGEiOjMuN31dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "bar-split",
  "title": "Daily active users by app",
  "subtitle": "DAU in millions, latest week",
  "palette": "mono-blue",
  "x": "day",
  "y": [
    "appAlpha",
    "appBeta",
    "appGamma",
    "appDelta"
  ],
  "sharedScale": true,
  "columns": 2,
  "data": [
    {
      "day": "Mon",
      "appAlpha": 12.4,
      "appBeta": 8.9,
      "appGamma": 15.1,
      "appDelta": 4.2
    },
    {
      "day": "Tue",
      "appAlpha": 13.1,
      "appBeta": 9.3,
      "appGamma": 15.8,
      "appDelta": 4.5
    },
    {
      "day": "Wed",
      "appAlpha": 12.8,
      "appBeta": 9,
      "appGamma": 16,
      "appDelta": 4.4
    },
    {
      "day": "Thu",
      "appAlpha": 13.6,
      "appBeta": 9.6,
      "appGamma": 16.3,
      "appDelta": 4.7
    },
    {
      "day": "Fri",
      "appAlpha": 14.2,
      "appBeta": 9.8,
      "appGamma": 16.9,
      "appDelta": 5
    },
    {
      "day": "Sat",
      "appAlpha": 11.9,
      "appBeta": 8.4,
      "appGamma": 14.8,
      "appDelta": 3.9
    },
    {
      "day": "Sun",
      "appAlpha": 11.5,
      "appBeta": 8.1,
      "appGamma": 14.2,
      "appDelta": 3.7
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"bar-split","title":"Daily active users by app","subtitle":"DAU in millions, latest week","palette":"mono-blue","x":"day","y":["appAlpha","appBeta","appGamma","appDelta"],"sharedScale":true,"columns":2,"data":[{"day":"Mon","appAlpha":12.4,"appBeta":8.9,"appGamma":15.1,"appDelta":4.2},{"day":"Tue","appAlpha":13.1,"appBeta":9.3,"appGamma":15.8,"appDelta":4.5},{"day":"Wed","appAlpha":12.8,"appBeta":9,"appGamma":16,"appDelta":4.4},{"day":"Thu","appAlpha":13.6,"appBeta":9.6,"appGamma":16.3,"appDelta":4.7},{"day":"Fri","appAlpha":14.2,"appBeta":9.8,"appGamma":16.9,"appDelta":5},{"day":"Sat","appAlpha":11.9,"appBeta":8.4,"appGamma":14.8,"appDelta":3.9},{"day":"Sun","appAlpha":11.5,"appBeta":8.1,"appGamma":14.2,"appDelta":3.7}]}' \
  --output bar-split-3.png
```

</details>

---

## Stacked area chart {#stacked-area}

### 1. Market share over time

Browser market share stacked by year. Curved interpolation for smooth trend reading.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InN0YWNrZWQtYXJlYSIsInRpdGxlIjoiRGVza3RvcCBicm93c2VyIG1hcmtldCBzaGFyZSIsInN1YnRpdGxlIjoiU2hhcmUgb2YgYWN0aXZlIHVzZXJzLCBwZXJjZW50Iiwic291cmNlIjoiU3RhdENvdW50ZXIiLCJwYWxldHRlIjoiZWRpdG9yaWFsIiwieCI6InllYXIiLCJ5IjpbImNocm9tZSIsInNhZmFyaSIsImVkZ2UiLCJmaXJlZm94Iiwib3RoZXIiXSwibm9ybWFsaXplIjp0cnVlLCJpbnRlcnBvbGF0aW9uIjoiY3VydmVkIiwiZGF0YSI6W3sieWVhciI6MjAxOSwiY2hyb21lIjo2Niwic2FmYXJpIjoxMCwiZWRnZSI6NCwiZmlyZWZveCI6MTAsIm90aGVyIjoxMH0seyJ5ZWFyIjoyMDIwLCJjaHJvbWUiOjY4LCJzYWZhcmkiOjksImVkZ2UiOjcsImZpcmVmb3giOjgsIm90aGVyIjo4fSx7InllYXIiOjIwMjEsImNocm9tZSI6NjYsInNhZmFyaSI6MTAsImVkZ2UiOjksImZpcmVmb3giOjgsIm90aGVyIjo3fSx7InllYXIiOjIwMjIsImNocm9tZSI6NjQsInNhZmFyaSI6MTEsImVkZ2UiOjExLCJmaXJlZm94Ijo3LCJvdGhlciI6N30seyJ5ZWFyIjoyMDIzLCJjaHJvbWUiOjYyLCJzYWZhcmkiOjEzLCJlZGdlIjoxMywiZmlyZWZveCI6Niwib3RoZXIiOjZ9LHsieWVhciI6MjAyNCwiY2hyb21lIjo2MSwic2FmYXJpIjoxNCwiZWRnZSI6MTQsImZpcmVmb3giOjUsIm90aGVyIjo2fV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "stacked-area",
  "title": "Desktop browser market share",
  "subtitle": "Share of active users, percent",
  "source": "StatCounter",
  "palette": "editorial",
  "x": "year",
  "y": [
    "chrome",
    "safari",
    "edge",
    "firefox",
    "other"
  ],
  "normalize": true,
  "interpolation": "curved",
  "data": [
    {
      "year": 2019,
      "chrome": 66,
      "safari": 10,
      "edge": 4,
      "firefox": 10,
      "other": 10
    },
    {
      "year": 2020,
      "chrome": 68,
      "safari": 9,
      "edge": 7,
      "firefox": 8,
      "other": 8
    },
    {
      "year": 2021,
      "chrome": 66,
      "safari": 10,
      "edge": 9,
      "firefox": 8,
      "other": 7
    },
    {
      "year": 2022,
      "chrome": 64,
      "safari": 11,
      "edge": 11,
      "firefox": 7,
      "other": 7
    },
    {
      "year": 2023,
      "chrome": 62,
      "safari": 13,
      "edge": 13,
      "firefox": 6,
      "other": 6
    },
    {
      "year": 2024,
      "chrome": 61,
      "safari": 14,
      "edge": 14,
      "firefox": 5,
      "other": 6
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"stacked-area","title":"Desktop browser market share","subtitle":"Share of active users, percent","source":"StatCounter","palette":"editorial","x":"year","y":["chrome","safari","edge","firefox","other"],"normalize":true,"interpolation":"curved","data":[{"year":2019,"chrome":66,"safari":10,"edge":4,"firefox":10,"other":10},{"year":2020,"chrome":68,"safari":9,"edge":7,"firefox":8,"other":8},{"year":2021,"chrome":66,"safari":10,"edge":9,"firefox":8,"other":7},{"year":2022,"chrome":64,"safari":11,"edge":11,"firefox":7,"other":7},{"year":2023,"chrome":62,"safari":13,"edge":13,"firefox":6,"other":6},{"year":2024,"chrome":61,"safari":14,"edge":14,"firefox":5,"other":6}]}' \
  --output stacked-area-1.png
```

</details>

### 2. Server load stacked by service

Minute-by-minute CPU usage across services; absolute scale shows total load.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InN0YWNrZWQtYXJlYSIsInRpdGxlIjoiU2VydmljZSBDUFUgdXNhZ2Ugb3ZlciB0aGUgbGFzdCBob3VyIiwic3VidGl0bGUiOiJQZXJjZW50IG9mIHRvdGFsIGNsdXN0ZXIgY2FwYWNpdHkiLCJwYWxldHRlIjoidHdpbGlnaHQiLCJ4IjoibWludXRlIiwieSI6WyJhcGkiLCJ3b3JrZXIiLCJjcm9uIiwiaW5kZXhlciJdLCJvcGFjaXR5IjowLjksImRhdGEiOlt7Im1pbnV0ZSI6MCwiYXBpIjoyMiwid29ya2VyIjoxNSwiY3JvbiI6NCwiaW5kZXhlciI6OH0seyJtaW51dGUiOjEwLCJhcGkiOjI4LCJ3b3JrZXIiOjE4LCJjcm9uIjozLCJpbmRleGVyIjoxMn0seyJtaW51dGUiOjIwLCJhcGkiOjM1LCJ3b3JrZXIiOjIyLCJjcm9uIjo2LCJpbmRleGVyIjoxNH0seyJtaW51dGUiOjMwLCJhcGkiOjQyLCJ3b3JrZXIiOjI4LCJjcm9uIjoxMiwiaW5kZXhlciI6MTh9LHsibWludXRlIjo0MCwiYXBpIjozOCwid29ya2VyIjoyNCwiY3JvbiI6NSwiaW5kZXhlciI6MjJ9LHsibWludXRlIjo1MCwiYXBpIjozMCwid29ya2VyIjoyMCwiY3JvbiI6NCwiaW5kZXhlciI6MTZ9LHsibWludXRlIjo2MCwiYXBpIjoyNiwid29ya2VyIjoxNywiY3JvbiI6MywiaW5kZXhlciI6MTB9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "stacked-area",
  "title": "Service CPU usage over the last hour",
  "subtitle": "Percent of total cluster capacity",
  "palette": "twilight",
  "x": "minute",
  "y": [
    "api",
    "worker",
    "cron",
    "indexer"
  ],
  "opacity": 0.9,
  "data": [
    {
      "minute": 0,
      "api": 22,
      "worker": 15,
      "cron": 4,
      "indexer": 8
    },
    {
      "minute": 10,
      "api": 28,
      "worker": 18,
      "cron": 3,
      "indexer": 12
    },
    {
      "minute": 20,
      "api": 35,
      "worker": 22,
      "cron": 6,
      "indexer": 14
    },
    {
      "minute": 30,
      "api": 42,
      "worker": 28,
      "cron": 12,
      "indexer": 18
    },
    {
      "minute": 40,
      "api": 38,
      "worker": 24,
      "cron": 5,
      "indexer": 22
    },
    {
      "minute": 50,
      "api": 30,
      "worker": 20,
      "cron": 4,
      "indexer": 16
    },
    {
      "minute": 60,
      "api": 26,
      "worker": 17,
      "cron": 3,
      "indexer": 10
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"stacked-area","title":"Service CPU usage over the last hour","subtitle":"Percent of total cluster capacity","palette":"twilight","x":"minute","y":["api","worker","cron","indexer"],"opacity":0.9,"data":[{"minute":0,"api":22,"worker":15,"cron":4,"indexer":8},{"minute":10,"api":28,"worker":18,"cron":3,"indexer":12},{"minute":20,"api":35,"worker":22,"cron":6,"indexer":14},{"minute":30,"api":42,"worker":28,"cron":12,"indexer":18},{"minute":40,"api":38,"worker":24,"cron":5,"indexer":22},{"minute":50,"api":30,"worker":20,"cron":4,"indexer":16},{"minute":60,"api":26,"worker":17,"cron":3,"indexer":10}]}' \
  --output stacked-area-2.png
```

</details>

### 3. CO2 emissions breakdown

Emissions by sector stacked over decades. Single palette with sequential ramp.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InN0YWNrZWQtYXJlYSIsInRpdGxlIjoiR2xvYmFsIENPMiBlbWlzc2lvbnMgYnkgc2VjdG9yIiwic3VidGl0bGUiOiJHaWdhdG9ubmVzIENPMiBlcXVpdmFsZW50Iiwic291cmNlIjoiT3VyIFdvcmxkIGluIERhdGEiLCJwYWxldHRlIjoiY2FyYm9uIiwieCI6InllYXIiLCJ5IjpbImVuZXJneSIsImluZHVzdHJ5IiwidHJhbnNwb3J0IiwiYnVpbGRpbmdzIiwiYWdyaWN1bHR1cmUiXSwiaW50ZXJwb2xhdGlvbiI6ImN1cnZlZCIsImRhdGEiOlt7InllYXIiOjE5OTAsImVuZXJneSI6MTIuMSwiaW5kdXN0cnkiOjMuMiwidHJhbnNwb3J0Ijo0LjYsImJ1aWxkaW5ncyI6Mi44LCJhZ3JpY3VsdHVyZSI6NS4xfSx7InllYXIiOjIwMDAsImVuZXJneSI6MTQuNSwiaW5kdXN0cnkiOjMuOSwidHJhbnNwb3J0Ijo1LjgsImJ1aWxkaW5ncyI6Mi45LCJhZ3JpY3VsdHVyZSI6NS40fSx7InllYXIiOjIwMTAsImVuZXJneSI6MTcuOCwiaW5kdXN0cnkiOjUuMSwidHJhbnNwb3J0Ijo3LCJidWlsZGluZ3MiOjMuMiwiYWdyaWN1bHR1cmUiOjUuOH0seyJ5ZWFyIjoyMDIwLCJlbmVyZ3kiOjE3LjMsImluZHVzdHJ5Ijo1LjYsInRyYW5zcG9ydCI6Ny4yLCJidWlsZGluZ3MiOjMsImFncmljdWx0dXJlIjo2LjF9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "stacked-area",
  "title": "Global CO2 emissions by sector",
  "subtitle": "Gigatonnes CO2 equivalent",
  "source": "Our World in Data",
  "palette": "carbon",
  "x": "year",
  "y": [
    "energy",
    "industry",
    "transport",
    "buildings",
    "agriculture"
  ],
  "interpolation": "curved",
  "data": [
    {
      "year": 1990,
      "energy": 12.1,
      "industry": 3.2,
      "transport": 4.6,
      "buildings": 2.8,
      "agriculture": 5.1
    },
    {
      "year": 2000,
      "energy": 14.5,
      "industry": 3.9,
      "transport": 5.8,
      "buildings": 2.9,
      "agriculture": 5.4
    },
    {
      "year": 2010,
      "energy": 17.8,
      "industry": 5.1,
      "transport": 7,
      "buildings": 3.2,
      "agriculture": 5.8
    },
    {
      "year": 2020,
      "energy": 17.3,
      "industry": 5.6,
      "transport": 7.2,
      "buildings": 3,
      "agriculture": 6.1
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"stacked-area","title":"Global CO2 emissions by sector","subtitle":"Gigatonnes CO2 equivalent","source":"Our World in Data","palette":"carbon","x":"year","y":["energy","industry","transport","buildings","agriculture"],"interpolation":"curved","data":[{"year":1990,"energy":12.1,"industry":3.2,"transport":4.6,"buildings":2.8,"agriculture":5.1},{"year":2000,"energy":14.5,"industry":3.9,"transport":5.8,"buildings":2.9,"agriculture":5.4},{"year":2010,"energy":17.8,"industry":5.1,"transport":7,"buildings":3.2,"agriculture":5.8},{"year":2020,"energy":17.3,"industry":5.6,"transport":7.2,"buildings":3,"agriculture":6.1}]}' \
  --output stacked-area-3.png
```

</details>

---

## Combo chart (bars + line) {#combo}

### 1. Revenue bars + margin line

Classic finance combo: bars for revenue, a line for margin overlaid on a secondary axis.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImNvbWJvIiwidGl0bGUiOiJSZXZlbnVlIGFuZCBtYXJnaW4iLCJzdWJ0aXRsZSI6IlF1YXJ0ZXJseSByZXZlbnVlIChVU0QgbSkgYW5kIGdyb3NzIG1hcmdpbiAocGVyY2VudCkiLCJzb3VyY2UiOiJJbnRlcm5hbCBmaW5hbmNpYWxzIiwicGFsZXR0ZSI6ImJvYXJkcm9vbSIsIngiOiJxdWFydGVyIiwiYmFycyI6InJldmVudWUiLCJsaW5lcyI6Im1hcmdpbiIsImludGVycG9sYXRpb24iOiJjdXJ2ZWQiLCJkYXRhIjpbeyJxdWFydGVyIjoiUTEgMjMiLCJyZXZlbnVlIjoxMTIsIm1hcmdpbiI6MC40MX0seyJxdWFydGVyIjoiUTIgMjMiLCJyZXZlbnVlIjoxMjgsIm1hcmdpbiI6MC40M30seyJxdWFydGVyIjoiUTMgMjMiLCJyZXZlbnVlIjoxNDEsIm1hcmdpbiI6MC40NH0seyJxdWFydGVyIjoiUTQgMjMiLCJyZXZlbnVlIjoxNTgsIm1hcmdpbiI6MC40Nn0seyJxdWFydGVyIjoiUTEgMjQiLCJyZXZlbnVlIjoxNjUsIm1hcmdpbiI6MC40N30seyJxdWFydGVyIjoiUTIgMjQiLCJyZXZlbnVlIjoxODAsIm1hcmdpbiI6MC40OH0seyJxdWFydGVyIjoiUTMgMjQiLCJyZXZlbnVlIjoyMDEsIm1hcmdpbiI6MC40OX0seyJxdWFydGVyIjoiUTQgMjQiLCJyZXZlbnVlIjoyMjMsIm1hcmdpbiI6MC41MX1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "combo",
  "title": "Revenue and margin",
  "subtitle": "Quarterly revenue (USD m) and gross margin (percent)",
  "source": "Internal financials",
  "palette": "boardroom",
  "x": "quarter",
  "bars": "revenue",
  "lines": "margin",
  "interpolation": "curved",
  "data": [
    {
      "quarter": "Q1 23",
      "revenue": 112,
      "margin": 0.41
    },
    {
      "quarter": "Q2 23",
      "revenue": 128,
      "margin": 0.43
    },
    {
      "quarter": "Q3 23",
      "revenue": 141,
      "margin": 0.44
    },
    {
      "quarter": "Q4 23",
      "revenue": 158,
      "margin": 0.46
    },
    {
      "quarter": "Q1 24",
      "revenue": 165,
      "margin": 0.47
    },
    {
      "quarter": "Q2 24",
      "revenue": 180,
      "margin": 0.48
    },
    {
      "quarter": "Q3 24",
      "revenue": 201,
      "margin": 0.49
    },
    {
      "quarter": "Q4 24",
      "revenue": 223,
      "margin": 0.51
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"combo","title":"Revenue and margin","subtitle":"Quarterly revenue (USD m) and gross margin (percent)","source":"Internal financials","palette":"boardroom","x":"quarter","bars":"revenue","lines":"margin","interpolation":"curved","data":[{"quarter":"Q1 23","revenue":112,"margin":0.41},{"quarter":"Q2 23","revenue":128,"margin":0.43},{"quarter":"Q3 23","revenue":141,"margin":0.44},{"quarter":"Q4 23","revenue":158,"margin":0.46},{"quarter":"Q1 24","revenue":165,"margin":0.47},{"quarter":"Q2 24","revenue":180,"margin":0.48},{"quarter":"Q3 24","revenue":201,"margin":0.49},{"quarter":"Q4 24","revenue":223,"margin":0.51}]}' \
  --output combo-1.png
```

</details>

### 2. Budget vs actual with variance line

Two bar series compared side-by-side, a line on top showing the running variance.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImNvbWJvIiwidGl0bGUiOiJCdWRnZXQgdnMgYWN0dWFsIHNwZW5kIiwic3VidGl0bGUiOiJNb250aGx5IG1hcmtldGluZyBzcGVuZCwgVVNEIHRob3VzYW5kLCB3aXRoIHZhcmlhbmNlIGxpbmUiLCJwYWxldHRlIjoiZGl2ZXJnaW5nLXN1bnNldCIsIngiOiJtb250aCIsImJhcnMiOlsiYnVkZ2V0IiwiYWN0dWFsIl0sImxpbmVzIjoidmFyaWFuY2UiLCJpbnRlcnBvbGF0aW9uIjoibGluZWFyIiwiZGF0YSI6W3sibW9udGgiOiJKdWwiLCJidWRnZXQiOjUwLCJhY3R1YWwiOjQ4LCJ2YXJpYW5jZSI6LTJ9LHsibW9udGgiOiJBdWciLCJidWRnZXQiOjUwLCJhY3R1YWwiOjU0LCJ2YXJpYW5jZSI6NH0seyJtb250aCI6IlNlcCIsImJ1ZGdldCI6NTUsImFjdHVhbCI6NTEsInZhcmlhbmNlIjotNH0seyJtb250aCI6Ik9jdCIsImJ1ZGdldCI6NjAsImFjdHVhbCI6NjMsInZhcmlhbmNlIjozfSx7Im1vbnRoIjoiTm92IiwiYnVkZ2V0Ijo2NSwiYWN0dWFsIjo3MSwidmFyaWFuY2UiOjZ9LHsibW9udGgiOiJEZWMiLCJidWRnZXQiOjc1LCJhY3R1YWwiOjgwLCJ2YXJpYW5jZSI6NX1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "combo",
  "title": "Budget vs actual spend",
  "subtitle": "Monthly marketing spend, USD thousand, with variance line",
  "palette": "diverging-sunset",
  "x": "month",
  "bars": [
    "budget",
    "actual"
  ],
  "lines": "variance",
  "interpolation": "linear",
  "data": [
    {
      "month": "Jul",
      "budget": 50,
      "actual": 48,
      "variance": -2
    },
    {
      "month": "Aug",
      "budget": 50,
      "actual": 54,
      "variance": 4
    },
    {
      "month": "Sep",
      "budget": 55,
      "actual": 51,
      "variance": -4
    },
    {
      "month": "Oct",
      "budget": 60,
      "actual": 63,
      "variance": 3
    },
    {
      "month": "Nov",
      "budget": 65,
      "actual": 71,
      "variance": 6
    },
    {
      "month": "Dec",
      "budget": 75,
      "actual": 80,
      "variance": 5
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"combo","title":"Budget vs actual spend","subtitle":"Monthly marketing spend, USD thousand, with variance line","palette":"diverging-sunset","x":"month","bars":["budget","actual"],"lines":"variance","interpolation":"linear","data":[{"month":"Jul","budget":50,"actual":48,"variance":-2},{"month":"Aug","budget":50,"actual":54,"variance":4},{"month":"Sep","budget":55,"actual":51,"variance":-4},{"month":"Oct","budget":60,"actual":63,"variance":3},{"month":"Nov","budget":65,"actual":71,"variance":6},{"month":"Dec","budget":75,"actual":80,"variance":5}]}' \
  --output combo-2.png
```

</details>

### 3. Weather dashboard

Precipitation bars with temperature line — a textbook use of the dual-metric combo.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImNvbWJvIiwidGl0bGUiOiJSYWluIGFuZCB0ZW1wZXJhdHVyZSIsInN1YnRpdGxlIjoiUHJhZ3VlIHdlZWtseSBhdmVyYWdlcywgc3ByaW5nIDIwMjQiLCJwYWxldHRlIjoiY2xhcml0eSIsIngiOiJ3ZWVrIiwiYmFycyI6InByZWNpcCIsImxpbmVzIjoidGVtcCIsImxpbmVTdHlsZSI6InNvbGlkIiwiZGF0YSI6W3sid2VlayI6IlcxMiIsInByZWNpcCI6MTgsInRlbXAiOjcuNH0seyJ3ZWVrIjoiVzEzIiwicHJlY2lwIjoyNCwidGVtcCI6OS4xfSx7IndlZWsiOiJXMTQiLCJwcmVjaXAiOjEyLCJ0ZW1wIjoxMS4yfSx7IndlZWsiOiJXMTUiLCJwcmVjaXAiOjMxLCJ0ZW1wIjoxMi44fSx7IndlZWsiOiJXMTYiLCJwcmVjaXAiOjgsInRlbXAiOjE0LjZ9LHsid2VlayI6IlcxNyIsInByZWNpcCI6MTksInRlbXAiOjE2LjF9LHsid2VlayI6IlcxOCIsInByZWNpcCI6NSwidGVtcCI6MTguM31dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "combo",
  "title": "Rain and temperature",
  "subtitle": "Prague weekly averages, spring 2024",
  "palette": "clarity",
  "x": "week",
  "bars": "precip",
  "lines": "temp",
  "lineStyle": "solid",
  "data": [
    {
      "week": "W12",
      "precip": 18,
      "temp": 7.4
    },
    {
      "week": "W13",
      "precip": 24,
      "temp": 9.1
    },
    {
      "week": "W14",
      "precip": 12,
      "temp": 11.2
    },
    {
      "week": "W15",
      "precip": 31,
      "temp": 12.8
    },
    {
      "week": "W16",
      "precip": 8,
      "temp": 14.6
    },
    {
      "week": "W17",
      "precip": 19,
      "temp": 16.1
    },
    {
      "week": "W18",
      "precip": 5,
      "temp": 18.3
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"combo","title":"Rain and temperature","subtitle":"Prague weekly averages, spring 2024","palette":"clarity","x":"week","bars":"precip","lines":"temp","lineStyle":"solid","data":[{"week":"W12","precip":18,"temp":7.4},{"week":"W13","precip":24,"temp":9.1},{"week":"W14","precip":12,"temp":11.2},{"week":"W15","precip":31,"temp":12.8},{"week":"W16","precip":8,"temp":14.6},{"week":"W17","precip":19,"temp":16.1},{"week":"W18","precip":5,"temp":18.3}]}' \
  --output combo-3.png
```

</details>

---

## Line split (small multiples) {#line-split}

### 1. Small multiples by product

Sales trend per product shown as independent line panels, perfect for long lists.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImxpbmUtc3BsaXQiLCJ0aXRsZSI6IldlZWtseSBzYWxlcyBieSBTS1UiLCJzdWJ0aXRsZSI6IlVuaXRzIHNvbGQsIGxhc3QgOCB3ZWVrcyIsInBhbGV0dGUiOiJ2aWJyYW50IiwieCI6IndlZWsiLCJ5IjpbInNrdUEiLCJza3VCIiwic2t1QyIsInNrdUQiXSwiaW50ZXJwb2xhdGlvbiI6ImN1cnZlZCIsInNoYXJlZFNjYWxlIjpmYWxzZSwiZGF0YSI6W3sid2VlayI6IlcxIiwic2t1QSI6NDIwLCJza3VCIjoxMjAsInNrdUMiOjc4LCJza3VEIjoyNDB9LHsid2VlayI6IlcyIiwic2t1QSI6NDQ1LCJza3VCIjoxMjgsInNrdUMiOjgyLCJza3VEIjoyMzF9LHsid2VlayI6IlczIiwic2t1QSI6NDY4LCJza3VCIjoxMzQsInNrdUMiOjkxLCJza3VEIjoyNDR9LHsid2VlayI6Ilc0Iiwic2t1QSI6NDgyLCJza3VCIjoxNDEsInNrdUMiOjk3LCJza3VEIjoyNTJ9LHsid2VlayI6Ilc1Iiwic2t1QSI6NTAxLCJza3VCIjoxNDksInNrdUMiOjEwMywic2t1RCI6MjYxfSx7IndlZWsiOiJXNiIsInNrdUEiOjUyNCwic2t1QiI6MTU2LCJza3VDIjoxMTIsInNrdUQiOjI3MH0seyJ3ZWVrIjoiVzciLCJza3VBIjo1NDEsInNrdUIiOjE2Mywic2t1QyI6MTIwLCJza3VEIjoyODJ9LHsid2VlayI6Ilc4Iiwic2t1QSI6NTYyLCJza3VCIjoxNzEsInNrdUMiOjEyOSwic2t1RCI6Mjk0fV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "line-split",
  "title": "Weekly sales by SKU",
  "subtitle": "Units sold, last 8 weeks",
  "palette": "vibrant",
  "x": "week",
  "y": [
    "skuA",
    "skuB",
    "skuC",
    "skuD"
  ],
  "interpolation": "curved",
  "sharedScale": false,
  "data": [
    {
      "week": "W1",
      "skuA": 420,
      "skuB": 120,
      "skuC": 78,
      "skuD": 240
    },
    {
      "week": "W2",
      "skuA": 445,
      "skuB": 128,
      "skuC": 82,
      "skuD": 231
    },
    {
      "week": "W3",
      "skuA": 468,
      "skuB": 134,
      "skuC": 91,
      "skuD": 244
    },
    {
      "week": "W4",
      "skuA": 482,
      "skuB": 141,
      "skuC": 97,
      "skuD": 252
    },
    {
      "week": "W5",
      "skuA": 501,
      "skuB": 149,
      "skuC": 103,
      "skuD": 261
    },
    {
      "week": "W6",
      "skuA": 524,
      "skuB": 156,
      "skuC": 112,
      "skuD": 270
    },
    {
      "week": "W7",
      "skuA": 541,
      "skuB": 163,
      "skuC": 120,
      "skuD": 282
    },
    {
      "week": "W8",
      "skuA": 562,
      "skuB": 171,
      "skuC": 129,
      "skuD": 294
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"line-split","title":"Weekly sales by SKU","subtitle":"Units sold, last 8 weeks","palette":"vibrant","x":"week","y":["skuA","skuB","skuC","skuD"],"interpolation":"curved","sharedScale":false,"data":[{"week":"W1","skuA":420,"skuB":120,"skuC":78,"skuD":240},{"week":"W2","skuA":445,"skuB":128,"skuC":82,"skuD":231},{"week":"W3","skuA":468,"skuB":134,"skuC":91,"skuD":244},{"week":"W4","skuA":482,"skuB":141,"skuC":97,"skuD":252},{"week":"W5","skuA":501,"skuB":149,"skuC":103,"skuD":261},{"week":"W6","skuA":524,"skuB":156,"skuC":112,"skuD":270},{"week":"W7","skuA":541,"skuB":163,"skuC":120,"skuD":282},{"week":"W8","skuA":562,"skuB":171,"skuC":129,"skuD":294}]}' \
  --output line-split-1.png
```

</details>

### 2. Shared-scale comparison across countries

Birth rate trend per country on the same y-axis so magnitudes are directly comparable.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImxpbmUtc3BsaXQiLCJ0aXRsZSI6IkJpcnRoIHJhdGVzLCBsYXN0IGRlY2FkZSIsInN1YnRpdGxlIjoiQmlydGhzIHBlciAxLDAwMCBwZW9wbGUsIDIwMTQtMjAyNCIsInNvdXJjZSI6IldvcmxkIEJhbmsiLCJwYWxldHRlIjoiZWRpdG9yaWFsIiwieCI6InllYXIiLCJ5IjpbImN6ZWNoaWEiLCJnZXJtYW55IiwiamFwYW4iLCJuaWdlcmlhIl0sInNoYXJlZFNjYWxlIjp0cnVlLCJjb2x1bW5zIjoyLCJkYXRhIjpbeyJ5ZWFyIjoyMDE0LCJjemVjaGlhIjoxMC40LCJnZXJtYW55Ijo4LjgsImphcGFuIjo4LCJuaWdlcmlhIjozOC44fSx7InllYXIiOjIwMTYsImN6ZWNoaWEiOjEwLjIsImdlcm1hbnkiOjkuNiwiamFwYW4iOjcuOCwibmlnZXJpYSI6MzguMX0seyJ5ZWFyIjoyMDE4LCJjemVjaGlhIjoxMC43LCJnZXJtYW55Ijo5LjUsImphcGFuIjo3LjQsIm5pZ2VyaWEiOjM3LjR9LHsieWVhciI6MjAyMCwiY3plY2hpYSI6MTAuMywiZ2VybWFueSI6OS4zLCJqYXBhbiI6Ni44LCJuaWdlcmlhIjozNi42fSx7InllYXIiOjIwMjIsImN6ZWNoaWEiOjguNiwiZ2VybWFueSI6OC44LCJqYXBhbiI6Ni4zLCJuaWdlcmlhIjozNS41fSx7InllYXIiOjIwMjQsImN6ZWNoaWEiOjcuOSwiZ2VybWFueSI6OC41LCJqYXBhbiI6Ni4xLCJuaWdlcmlhIjozNC42fV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "line-split",
  "title": "Birth rates, last decade",
  "subtitle": "Births per 1,000 people, 2014-2024",
  "source": "World Bank",
  "palette": "editorial",
  "x": "year",
  "y": [
    "czechia",
    "germany",
    "japan",
    "nigeria"
  ],
  "sharedScale": true,
  "columns": 2,
  "data": [
    {
      "year": 2014,
      "czechia": 10.4,
      "germany": 8.8,
      "japan": 8,
      "nigeria": 38.8
    },
    {
      "year": 2016,
      "czechia": 10.2,
      "germany": 9.6,
      "japan": 7.8,
      "nigeria": 38.1
    },
    {
      "year": 2018,
      "czechia": 10.7,
      "germany": 9.5,
      "japan": 7.4,
      "nigeria": 37.4
    },
    {
      "year": 2020,
      "czechia": 10.3,
      "germany": 9.3,
      "japan": 6.8,
      "nigeria": 36.6
    },
    {
      "year": 2022,
      "czechia": 8.6,
      "germany": 8.8,
      "japan": 6.3,
      "nigeria": 35.5
    },
    {
      "year": 2024,
      "czechia": 7.9,
      "germany": 8.5,
      "japan": 6.1,
      "nigeria": 34.6
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"line-split","title":"Birth rates, last decade","subtitle":"Births per 1,000 people, 2014-2024","source":"World Bank","palette":"editorial","x":"year","y":["czechia","germany","japan","nigeria"],"sharedScale":true,"columns":2,"data":[{"year":2014,"czechia":10.4,"germany":8.8,"japan":8,"nigeria":38.8},{"year":2016,"czechia":10.2,"germany":9.6,"japan":7.8,"nigeria":38.1},{"year":2018,"czechia":10.7,"germany":9.5,"japan":7.4,"nigeria":37.4},{"year":2020,"czechia":10.3,"germany":9.3,"japan":6.8,"nigeria":36.6},{"year":2022,"czechia":8.6,"germany":8.8,"japan":6.3,"nigeria":35.5},{"year":2024,"czechia":7.9,"germany":8.5,"japan":6.1,"nigeria":34.6}]}' \
  --output line-split-2.png
```

</details>

### 3. Metrics dashboard in a 3-column grid

Compact dashboard view: three different metrics shown as independent trend panels.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImxpbmUtc3BsaXQiLCJ0aXRsZSI6IldlYnNpdGUgS1BJcyIsInN1YnRpdGxlIjoiVHJhaWxpbmcgNy1kYXkgcm9sbGluZyBhdmVyYWdlcyIsInBhbGV0dGUiOiJtb25vLWJsdWUiLCJ4IjoiZGF5IiwieSI6WyJ2aXNpdG9ycyIsInNpZ251cHMiLCJjb252ZXJzaW9uIl0sImNvbHVtbnMiOjMsImludGVycG9sYXRpb24iOiJsaW5lYXIiLCJkYXRhIjpbeyJkYXkiOiJNb24iLCJ2aXNpdG9ycyI6NDEyMCwic2lnbnVwcyI6MTQyLCJjb252ZXJzaW9uIjowLjAzNH0seyJkYXkiOiJUdWUiLCJ2aXNpdG9ycyI6NDMxMCwic2lnbnVwcyI6MTU2LCJjb252ZXJzaW9uIjowLjAzNn0seyJkYXkiOiJXZWQiLCJ2aXNpdG9ycyI6NDI2MCwic2lnbnVwcyI6MTQ4LCJjb252ZXJzaW9uIjowLjAzNX0seyJkYXkiOiJUaHUiLCJ2aXNpdG9ycyI6NDQ4MCwic2lnbnVwcyI6MTY4LCJjb252ZXJzaW9uIjowLjAzN30seyJkYXkiOiJGcmkiLCJ2aXNpdG9ycyI6NDYyMCwic2lnbnVwcyI6MTc5LCJjb252ZXJzaW9uIjowLjAzOX0seyJkYXkiOiJTYXQiLCJ2aXNpdG9ycyI6Mzg5MCwic2lnbnVwcyI6MTI0LCJjb252ZXJzaW9uIjowLjAzMn0seyJkYXkiOiJTdW4iLCJ2aXNpdG9ycyI6MzcyMCwic2lnbnVwcyI6MTE4LCJjb252ZXJzaW9uIjowLjAzMn1dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "line-split",
  "title": "Website KPIs",
  "subtitle": "Trailing 7-day rolling averages",
  "palette": "mono-blue",
  "x": "day",
  "y": [
    "visitors",
    "signups",
    "conversion"
  ],
  "columns": 3,
  "interpolation": "linear",
  "data": [
    {
      "day": "Mon",
      "visitors": 4120,
      "signups": 142,
      "conversion": 0.034
    },
    {
      "day": "Tue",
      "visitors": 4310,
      "signups": 156,
      "conversion": 0.036
    },
    {
      "day": "Wed",
      "visitors": 4260,
      "signups": 148,
      "conversion": 0.035
    },
    {
      "day": "Thu",
      "visitors": 4480,
      "signups": 168,
      "conversion": 0.037
    },
    {
      "day": "Fri",
      "visitors": 4620,
      "signups": 179,
      "conversion": 0.039
    },
    {
      "day": "Sat",
      "visitors": 3890,
      "signups": 124,
      "conversion": 0.032
    },
    {
      "day": "Sun",
      "visitors": 3720,
      "signups": 118,
      "conversion": 0.032
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"line-split","title":"Website KPIs","subtitle":"Trailing 7-day rolling averages","palette":"mono-blue","x":"day","y":["visitors","signups","conversion"],"columns":3,"interpolation":"linear","data":[{"day":"Mon","visitors":4120,"signups":142,"conversion":0.034},{"day":"Tue","visitors":4310,"signups":156,"conversion":0.036},{"day":"Wed","visitors":4260,"signups":148,"conversion":0.035},{"day":"Thu","visitors":4480,"signups":168,"conversion":0.037},{"day":"Fri","visitors":4620,"signups":179,"conversion":0.039},{"day":"Sat","visitors":3890,"signups":124,"conversion":0.032},{"day":"Sun","visitors":3720,"signups":118,"conversion":0.032}]}' \
  --output line-split-3.png
```

</details>

---

## Pie chart {#pie}

### 1. Budget shares

Five-slice pie showing budget allocation. Labels placed outside the ring for readability.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InBpZSIsInRpdGxlIjoiTW9udGhseSBidWRnZXQgYWxsb2NhdGlvbiIsInN1YnRpdGxlIjoiV2hlcmUgMTAwIHBlcmNlbnQgb2YgdGFrZS1ob21lIHBheSBnb2VzIiwicGFsZXR0ZSI6ImVhcnRoIiwibGFiZWwiOiJjYXRlZ29yeSIsInZhbHVlIjoiYW1vdW50IiwibGFiZWxQbGFjZW1lbnQiOiJvdXRzaWRlIiwiZGF0YSI6W3siY2F0ZWdvcnkiOiJSZW50IiwiYW1vdW50IjoxNDAwfSx7ImNhdGVnb3J5IjoiRm9vZCIsImFtb3VudCI6NTQwfSx7ImNhdGVnb3J5IjoiVHJhbnNwb3J0IiwiYW1vdW50IjoxODB9LHsiY2F0ZWdvcnkiOiJMZWlzdXJlIiwiYW1vdW50IjozMDB9LHsiY2F0ZWdvcnkiOiJTYXZpbmdzIiwiYW1vdW50Ijo1ODB9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "pie",
  "title": "Monthly budget allocation",
  "subtitle": "Where 100 percent of take-home pay goes",
  "palette": "earth",
  "label": "category",
  "value": "amount",
  "labelPlacement": "outside",
  "data": [
    {
      "category": "Rent",
      "amount": 1400
    },
    {
      "category": "Food",
      "amount": 540
    },
    {
      "category": "Transport",
      "amount": 180
    },
    {
      "category": "Leisure",
      "amount": 300
    },
    {
      "category": "Savings",
      "amount": 580
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"pie","title":"Monthly budget allocation","subtitle":"Where 100 percent of take-home pay goes","palette":"earth","label":"category","value":"amount","labelPlacement":"outside","data":[{"category":"Rent","amount":1400},{"category":"Food","amount":540},{"category":"Transport","amount":180},{"category":"Leisure","amount":300},{"category":"Savings","amount":580}]}' \
  --output pie-1.png
```

</details>

### 2. Election result with Other grouping

Nine-party result; anything under the 4 percent threshold is automatically merged into "Other".

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InBpZSIsInRpdGxlIjoiMjAyNCBwYXJsaWFtZW50YXJ5IGVsZWN0aW9uIHJlc3VsdCIsInN1YnRpdGxlIjoiU2hhcmUgb2YgdmFsaWQgdm90ZXMiLCJzb3VyY2UiOiJPZmZpY2lhbCBlbGVjdGlvbiByZXN1bHRzIiwicGFsZXR0ZSI6ImRpdmVyZ2luZy1zdW5zZXQiLCJsYWJlbCI6InBhcnR5IiwidmFsdWUiOiJzaGFyZSIsInNvcnQiOiJkZXNjIiwiZGF0YSI6W3sicGFydHkiOiJQYXJ0eSBBIiwic2hhcmUiOjI5Ljh9LHsicGFydHkiOiJQYXJ0eSBCIiwic2hhcmUiOjIyLjF9LHsicGFydHkiOiJQYXJ0eSBDIiwic2hhcmUiOjE0LjR9LHsicGFydHkiOiJQYXJ0eSBEIiwic2hhcmUiOjEwLjN9LHsicGFydHkiOiJQYXJ0eSBFIiwic2hhcmUiOjcuMn0seyJwYXJ0eSI6IlBhcnR5IEYiLCJzaGFyZSI6NS45fSx7InBhcnR5IjoiUGFydHkgRyIsInNoYXJlIjo0LjF9LHsicGFydHkiOiJQYXJ0eSBIIiwic2hhcmUiOjMuMn0seyJwYXJ0eSI6IlBhcnR5IEkiLCJzaGFyZSI6M31dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "pie",
  "title": "2024 parliamentary election result",
  "subtitle": "Share of valid votes",
  "source": "Official election results",
  "palette": "diverging-sunset",
  "label": "party",
  "value": "share",
  "sort": "desc",
  "data": [
    {
      "party": "Party A",
      "share": 29.8
    },
    {
      "party": "Party B",
      "share": 22.1
    },
    {
      "party": "Party C",
      "share": 14.4
    },
    {
      "party": "Party D",
      "share": 10.3
    },
    {
      "party": "Party E",
      "share": 7.2
    },
    {
      "party": "Party F",
      "share": 5.9
    },
    {
      "party": "Party G",
      "share": 4.1
    },
    {
      "party": "Party H",
      "share": 3.2
    },
    {
      "party": "Party I",
      "share": 3
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"pie","title":"2024 parliamentary election result","subtitle":"Share of valid votes","source":"Official election results","palette":"diverging-sunset","label":"party","value":"share","sort":"desc","data":[{"party":"Party A","share":29.8},{"party":"Party B","share":22.1},{"party":"Party C","share":14.4},{"party":"Party D","share":10.3},{"party":"Party E","share":7.2},{"party":"Party F","share":5.9},{"party":"Party G","share":4.1},{"party":"Party H","share":3.2},{"party":"Party I","share":3}]}' \
  --output pie-2.png
```

</details>

### 3. Simple 3-slice mix

Minimal pie with labels inside the slices; ideal for hero charts in reports.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6InBpZSIsInRpdGxlIjoiUHJvZHVjdCBtaXgiLCJzdWJ0aXRsZSI6IlJldmVudWUgc2hhcmUgYnkgcHJvZHVjdCBsaW5lLCBGWTIwMjQiLCJwYWxldHRlIjoiYm9hcmRyb29tIiwibGFiZWwiOiJwcm9kdWN0IiwidmFsdWUiOiJyZXZlbnVlIiwibGFiZWxQbGFjZW1lbnQiOiJpbnNpZGUiLCJkYXRhIjpbeyJwcm9kdWN0IjoiU3Vic2NyaXB0aW9ucyIsInJldmVudWUiOjY4fSx7InByb2R1Y3QiOiJTZXJ2aWNlcyIsInJldmVudWUiOjIyfSx7InByb2R1Y3QiOiJIYXJkd2FyZSIsInJldmVudWUiOjEwfV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "pie",
  "title": "Product mix",
  "subtitle": "Revenue share by product line, FY2024",
  "palette": "boardroom",
  "label": "product",
  "value": "revenue",
  "labelPlacement": "inside",
  "data": [
    {
      "product": "Subscriptions",
      "revenue": 68
    },
    {
      "product": "Services",
      "revenue": 22
    },
    {
      "product": "Hardware",
      "revenue": 10
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"pie","title":"Product mix","subtitle":"Revenue share by product line, FY2024","palette":"boardroom","label":"product","value":"revenue","labelPlacement":"inside","data":[{"product":"Subscriptions","revenue":68},{"product":"Services","revenue":22},{"product":"Hardware","revenue":10}]}' \
  --output pie-3.png
```

</details>

---

## Donut chart {#donut}

### 1. Market share with KPI in center

Donut with total market size shown as the center value — KPI hero in a single visual.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImRvbnV0IiwidGl0bGUiOiJDbG91ZCBwcm92aWRlciBtYXJrZXQgc2hhcmUiLCJzdWJ0aXRsZSI6IlNoYXJlIG9mIGdsb2JhbCBJYWFTIHNwZW5kLCAyMDI0Iiwic291cmNlIjoiR2FydG5lciIsInBhbGV0dGUiOiJ0d2lsaWdodCIsImxhYmVsIjoicHJvdmlkZXIiLCJ2YWx1ZSI6InNoYXJlIiwiaW5uZXJSYWRpdXMiOiJtZWRpdW0iLCJjZW50ZXJWYWx1ZSI6InN1bSIsImNlbnRlckxhYmVsIjoiVG90YWwgc2hhcmUiLCJkYXRhIjpbeyJwcm92aWRlciI6IkFXUyIsInNoYXJlIjozMX0seyJwcm92aWRlciI6IkF6dXJlIiwic2hhcmUiOjI1fSx7InByb3ZpZGVyIjoiR0NQIiwic2hhcmUiOjExfSx7InByb3ZpZGVyIjoiQWxpYmFiYSIsInNoYXJlIjo4fSx7InByb3ZpZGVyIjoiT3RoZXIiLCJzaGFyZSI6MjV9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "donut",
  "title": "Cloud provider market share",
  "subtitle": "Share of global IaaS spend, 2024",
  "source": "Gartner",
  "palette": "twilight",
  "label": "provider",
  "value": "share",
  "innerRadius": "medium",
  "centerValue": "sum",
  "centerLabel": "Total share",
  "data": [
    {
      "provider": "AWS",
      "share": 31
    },
    {
      "provider": "Azure",
      "share": 25
    },
    {
      "provider": "GCP",
      "share": 11
    },
    {
      "provider": "Alibaba",
      "share": 8
    },
    {
      "provider": "Other",
      "share": 25
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"donut","title":"Cloud provider market share","subtitle":"Share of global IaaS spend, 2024","source":"Gartner","palette":"twilight","label":"provider","value":"share","innerRadius":"medium","centerValue":"sum","centerLabel":"Total share","data":[{"provider":"AWS","share":31},{"provider":"Azure","share":25},{"provider":"GCP","share":11},{"provider":"Alibaba","share":8},{"provider":"Other","share":25}]}' \
  --output donut-1.png
```

</details>

### 2. Thin ring with label outside

Slim donut ideal when screen real estate is tight; labels sit outside the ring.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImRvbnV0IiwidGl0bGUiOiJUcmFmZmljIHNvdXJjZXMiLCJzdWJ0aXRsZSI6IlNoYXJlIG9mIHNlc3Npb25zLCBsYXN0IDMwIGRheXMiLCJwYWxldHRlIjoibW9uby1ibHVlIiwibGFiZWwiOiJzb3VyY2UiLCJ2YWx1ZSI6InNlc3Npb25zIiwiaW5uZXJSYWRpdXMiOiJ0aGluIiwibGFiZWxQbGFjZW1lbnQiOiJvdXRzaWRlIiwiZGF0YSI6W3sic291cmNlIjoiT3JnYW5pYyIsInNlc3Npb25zIjo0MTJ9LHsic291cmNlIjoiRGlyZWN0Iiwic2Vzc2lvbnMiOjI4Nn0seyJzb3VyY2UiOiJQYWlkIiwic2Vzc2lvbnMiOjE5OH0seyJzb3VyY2UiOiJTb2NpYWwiLCJzZXNzaW9ucyI6MTQyfSx7InNvdXJjZSI6IkVtYWlsIiwic2Vzc2lvbnMiOjczfV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "donut",
  "title": "Traffic sources",
  "subtitle": "Share of sessions, last 30 days",
  "palette": "mono-blue",
  "label": "source",
  "value": "sessions",
  "innerRadius": "thin",
  "labelPlacement": "outside",
  "data": [
    {
      "source": "Organic",
      "sessions": 412
    },
    {
      "source": "Direct",
      "sessions": 286
    },
    {
      "source": "Paid",
      "sessions": 198
    },
    {
      "source": "Social",
      "sessions": 142
    },
    {
      "source": "Email",
      "sessions": 73
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"donut","title":"Traffic sources","subtitle":"Share of sessions, last 30 days","palette":"mono-blue","label":"source","value":"sessions","innerRadius":"thin","labelPlacement":"outside","data":[{"source":"Organic","sessions":412},{"source":"Direct","sessions":286},{"source":"Paid","sessions":198},{"source":"Social","sessions":142},{"source":"Email","sessions":73}]}' \
  --output donut-2.png
```

</details>

### 3. Thick ring with max highlight

Thick ring with the maximum value called out in the center, great for a one-at-a-glance KPI.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImRvbnV0IiwidGl0bGUiOiJDb2hvcnQgcmV0ZW50aW9uIiwic3VidGl0bGUiOiJXZWVrLTQgcmV0ZW50aW9uIGJ5IGFjcXVpc2l0aW9uIGNoYW5uZWwiLCJwYWxldHRlIjoidmlicmFudCIsImxhYmVsIjoiY2hhbm5lbCIsInZhbHVlIjoicmV0ZW50aW9uIiwiaW5uZXJSYWRpdXMiOiJ0aGljayIsImNlbnRlclZhbHVlIjoibWF4IiwiY2VudGVyTGFiZWwiOiJCZXN0IGNoYW5uZWwiLCJkYXRhIjpbeyJjaGFubmVsIjoiT3JnYW5pYyIsInJldGVudGlvbiI6MC40Mn0seyJjaGFubmVsIjoiUmVmZXJyYWwiLCJyZXRlbnRpb24iOjAuNTh9LHsiY2hhbm5lbCI6IlBhaWQiLCJyZXRlbnRpb24iOjAuMjh9LHsiY2hhbm5lbCI6IlNvY2lhbCIsInJldGVudGlvbiI6MC4yMn0seyJjaGFubmVsIjoiRW1haWwiLCJyZXRlbnRpb24iOjAuNDl9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "donut",
  "title": "Cohort retention",
  "subtitle": "Week-4 retention by acquisition channel",
  "palette": "vibrant",
  "label": "channel",
  "value": "retention",
  "innerRadius": "thick",
  "centerValue": "max",
  "centerLabel": "Best channel",
  "data": [
    {
      "channel": "Organic",
      "retention": 0.42
    },
    {
      "channel": "Referral",
      "retention": 0.58
    },
    {
      "channel": "Paid",
      "retention": 0.28
    },
    {
      "channel": "Social",
      "retention": 0.22
    },
    {
      "channel": "Email",
      "retention": 0.49
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"donut","title":"Cohort retention","subtitle":"Week-4 retention by acquisition channel","palette":"vibrant","label":"channel","value":"retention","innerRadius":"thick","centerValue":"max","centerLabel":"Best channel","data":[{"channel":"Organic","retention":0.42},{"channel":"Referral","retention":0.58},{"channel":"Paid","retention":0.28},{"channel":"Social","retention":0.22},{"channel":"Email","retention":0.49}]}' \
  --output donut-3.png
```

</details>

---

## Geo chart (choropleth) {#geo}

### 1. World choropleth

Global map shaded by internet penetration rate using ISO-3 country codes.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImdlbyIsInRpdGxlIjoiSW50ZXJuZXQgdXNlcnMgcGVyIGNvdW50cnkiLCJzdWJ0aXRsZSI6IlNoYXJlIG9mIHBvcHVsYXRpb24gb25saW5lLCAyMDIzIiwic291cmNlIjoiSVRVIiwicGFsZXR0ZSI6ImNsYXJpdHkiLCJiYXNlbWFwIjoid29ybGQiLCJjb2RlIjoiY29kZSIsInZhbHVlIjoic2hhcmUiLCJzY2FsZSI6ImxpbmVhciIsImRhdGEiOlt7ImNvZGUiOiJVU0EiLCJzaGFyZSI6MC45Mn0seyJjb2RlIjoiQ0FOIiwic2hhcmUiOjAuOTR9LHsiY29kZSI6IkJSQSIsInNoYXJlIjowLjg1fSx7ImNvZGUiOiJHQlIiLCJzaGFyZSI6MC45Nn0seyJjb2RlIjoiREVVIiwic2hhcmUiOjAuOTR9LHsiY29kZSI6IkZSQSIsInNoYXJlIjowLjkzfSx7ImNvZGUiOiJSVVMiLCJzaGFyZSI6MC44NX0seyJjb2RlIjoiQ0hOIiwic2hhcmUiOjAuNzV9LHsiY29kZSI6IklORCIsInNoYXJlIjowLjQ2fSx7ImNvZGUiOiJKUE4iLCJzaGFyZSI6MC45M30seyJjb2RlIjoiQVVTIiwic2hhcmUiOjAuOTF9LHsiY29kZSI6Ik5HQSIsInNoYXJlIjowLjU1fSx7ImNvZGUiOiJaQUYiLCJzaGFyZSI6MC43Mn0seyJjb2RlIjoiRUdZIiwic2hhcmUiOjAuNzJ9LHsiY29kZSI6Ik1FWCIsInNoYXJlIjowLjc3fV19`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "geo",
  "title": "Internet users per country",
  "subtitle": "Share of population online, 2023",
  "source": "ITU",
  "palette": "clarity",
  "basemap": "world",
  "code": "code",
  "value": "share",
  "scale": "linear",
  "data": [
    {
      "code": "USA",
      "share": 0.92
    },
    {
      "code": "CAN",
      "share": 0.94
    },
    {
      "code": "BRA",
      "share": 0.85
    },
    {
      "code": "GBR",
      "share": 0.96
    },
    {
      "code": "DEU",
      "share": 0.94
    },
    {
      "code": "FRA",
      "share": 0.93
    },
    {
      "code": "RUS",
      "share": 0.85
    },
    {
      "code": "CHN",
      "share": 0.75
    },
    {
      "code": "IND",
      "share": 0.46
    },
    {
      "code": "JPN",
      "share": 0.93
    },
    {
      "code": "AUS",
      "share": 0.91
    },
    {
      "code": "NGA",
      "share": 0.55
    },
    {
      "code": "ZAF",
      "share": 0.72
    },
    {
      "code": "EGY",
      "share": 0.72
    },
    {
      "code": "MEX",
      "share": 0.77
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"geo","title":"Internet users per country","subtitle":"Share of population online, 2023","source":"ITU","palette":"clarity","basemap":"world","code":"code","value":"share","scale":"linear","data":[{"code":"USA","share":0.92},{"code":"CAN","share":0.94},{"code":"BRA","share":0.85},{"code":"GBR","share":0.96},{"code":"DEU","share":0.94},{"code":"FRA","share":0.93},{"code":"RUS","share":0.85},{"code":"CHN","share":0.75},{"code":"IND","share":0.46},{"code":"JPN","share":0.93},{"code":"AUS","share":0.91},{"code":"NGA","share":0.55},{"code":"ZAF","share":0.72},{"code":"EGY","share":0.72},{"code":"MEX","share":0.77}]}' \
  --output geo-1.png
```

</details>

### 2. Europe-only map

Europe-focused choropleth using the europe basemap for better real-estate usage.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImdlbyIsInRpdGxlIjoiUmVuZXdhYmxlIGVsZWN0cmljaXR5IHNoYXJlIiwic3VidGl0bGUiOiJTaGFyZSBvZiBlbGVjdHJpY2l0eSBnZW5lcmF0ZWQgZnJvbSByZW5ld2FibGVzLCBFVSwgMjAyNCIsInNvdXJjZSI6IkVtYmVyIENsaW1hdGUiLCJwYWxldHRlIjoiZWFydGgiLCJiYXNlbWFwIjoiZXVyb3BlIiwiY29kZSI6ImNvZGUiLCJ2YWx1ZSI6InNoYXJlIiwic2NhbGUiOiJzdGVwcGVkIiwic3RlcHMiOjUsImRhdGEiOlt7ImNvZGUiOiJOT1IiLCJzaGFyZSI6OTh9LHsiY29kZSI6IklTTCIsInNoYXJlIjoxMDB9LHsiY29kZSI6IlNXRSIsInNoYXJlIjo2Nn0seyJjb2RlIjoiRklOIiwic2hhcmUiOjUyfSx7ImNvZGUiOiJETksiLCJzaGFyZSI6ODd9LHsiY29kZSI6IkRFVSIsInNoYXJlIjo2Mn0seyJjb2RlIjoiUE9MIiwic2hhcmUiOjI3fSx7ImNvZGUiOiJDWkUiLCJzaGFyZSI6MTZ9LHsiY29kZSI6IkZSQSIsInNoYXJlIjoyNn0seyJjb2RlIjoiRVNQIiwic2hhcmUiOjU5fSx7ImNvZGUiOiJJVEEiLCJzaGFyZSI6NDN9LHsiY29kZSI6IkdCUiIsInNoYXJlIjo1MX0seyJjb2RlIjoiSVJMIiwic2hhcmUiOjQwfSx7ImNvZGUiOiJQUlQiLCJzaGFyZSI6Njh9LHsiY29kZSI6Ik5MRCIsInNoYXJlIjo0N31dfQ`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "geo",
  "title": "Renewable electricity share",
  "subtitle": "Share of electricity generated from renewables, EU, 2024",
  "source": "Ember Climate",
  "palette": "earth",
  "basemap": "europe",
  "code": "code",
  "value": "share",
  "scale": "stepped",
  "steps": 5,
  "data": [
    {
      "code": "NOR",
      "share": 98
    },
    {
      "code": "ISL",
      "share": 100
    },
    {
      "code": "SWE",
      "share": 66
    },
    {
      "code": "FIN",
      "share": 52
    },
    {
      "code": "DNK",
      "share": 87
    },
    {
      "code": "DEU",
      "share": 62
    },
    {
      "code": "POL",
      "share": 27
    },
    {
      "code": "CZE",
      "share": 16
    },
    {
      "code": "FRA",
      "share": 26
    },
    {
      "code": "ESP",
      "share": 59
    },
    {
      "code": "ITA",
      "share": 43
    },
    {
      "code": "GBR",
      "share": 51
    },
    {
      "code": "IRL",
      "share": 40
    },
    {
      "code": "PRT",
      "share": 68
    },
    {
      "code": "NLD",
      "share": 47
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"geo","title":"Renewable electricity share","subtitle":"Share of electricity generated from renewables, EU, 2024","source":"Ember Climate","palette":"earth","basemap":"europe","code":"code","value":"share","scale":"stepped","steps":5,"data":[{"code":"NOR","share":98},{"code":"ISL","share":100},{"code":"SWE","share":66},{"code":"FIN","share":52},{"code":"DNK","share":87},{"code":"DEU","share":62},{"code":"POL","share":27},{"code":"CZE","share":16},{"code":"FRA","share":26},{"code":"ESP","share":59},{"code":"ITA","share":43},{"code":"GBR","share":51},{"code":"IRL","share":40},{"code":"PRT","share":68},{"code":"NLD","share":47}]}' \
  --output geo-2.png
```

</details>

### 3. USA states unemployment

US states choropleth using ISO-style state codes. Demonstrates the usa-states basemap.

**ChatGPT prompt** (copy-paste):

> Please fetch this URL and show me the PNG image inline:
> 
> `https://mcp-charts.vercel.app/chart?config=eyJjaGFydCI6ImdlbyIsInRpdGxlIjoiVVMgc3RhdGUgdW5lbXBsb3ltZW50Iiwic3VidGl0bGUiOiJVbmVtcGxveW1lbnQgcmF0ZSwgcGVyY2VudCwgTWFyY2ggMjAyNSIsInNvdXJjZSI6IkJMUyIsInBhbGV0dGUiOiJkaXZlcmdpbmctc3Vuc2V0IiwiYmFzZW1hcCI6InVzYS1zdGF0ZXMiLCJjb2RlIjoiY29kZSIsInZhbHVlIjoicmF0ZSIsInNjYWxlIjoibGluZWFyIiwiZGF0YSI6W3siY29kZSI6IkNBIiwicmF0ZSI6NS40fSx7ImNvZGUiOiJUWCIsInJhdGUiOjQuMX0seyJjb2RlIjoiTlkiLCJyYXRlIjo0LjN9LHsiY29kZSI6IkZMIiwicmF0ZSI6My4yfSx7ImNvZGUiOiJJTCIsInJhdGUiOjQuOH0seyJjb2RlIjoiUEEiLCJyYXRlIjozLjl9LHsiY29kZSI6Ik9IIiwicmF0ZSI6NC4yfSx7ImNvZGUiOiJHQSIsInJhdGUiOjMuNX0seyJjb2RlIjoiTkMiLCJyYXRlIjozLjh9LHsiY29kZSI6Ik1JIiwicmF0ZSI6NC43fSx7ImNvZGUiOiJOViIsInJhdGUiOjUuOH0seyJjb2RlIjoiQVoiLCJyYXRlIjo0LjR9LHsiY29kZSI6IldBIiwicmF0ZSI6NC42fSx7ImNvZGUiOiJORCIsInJhdGUiOjIuMX0seyJjb2RlIjoiVlQiLCJyYXRlIjoyLjN9XX0`

<details><summary>Raw JSON config (for POST)</summary>

```json
{
  "chart": "geo",
  "title": "US state unemployment",
  "subtitle": "Unemployment rate, percent, March 2025",
  "source": "BLS",
  "palette": "diverging-sunset",
  "basemap": "usa-states",
  "code": "code",
  "value": "rate",
  "scale": "linear",
  "data": [
    {
      "code": "CA",
      "rate": 5.4
    },
    {
      "code": "TX",
      "rate": 4.1
    },
    {
      "code": "NY",
      "rate": 4.3
    },
    {
      "code": "FL",
      "rate": 3.2
    },
    {
      "code": "IL",
      "rate": 4.8
    },
    {
      "code": "PA",
      "rate": 3.9
    },
    {
      "code": "OH",
      "rate": 4.2
    },
    {
      "code": "GA",
      "rate": 3.5
    },
    {
      "code": "NC",
      "rate": 3.8
    },
    {
      "code": "MI",
      "rate": 4.7
    },
    {
      "code": "NV",
      "rate": 5.8
    },
    {
      "code": "AZ",
      "rate": 4.4
    },
    {
      "code": "WA",
      "rate": 4.6
    },
    {
      "code": "ND",
      "rate": 2.1
    },
    {
      "code": "VT",
      "rate": 2.3
    }
  ]
}
```

```bash
curl -X POST https://mcp-charts.vercel.app/chart \
  -H 'Content-Type: application/json' \
  -d '{"chart":"geo","title":"US state unemployment","subtitle":"Unemployment rate, percent, March 2025","source":"BLS","palette":"diverging-sunset","basemap":"usa-states","code":"code","value":"rate","scale":"linear","data":[{"code":"CA","rate":5.4},{"code":"TX","rate":4.1},{"code":"NY","rate":4.3},{"code":"FL","rate":3.2},{"code":"IL","rate":4.8},{"code":"PA","rate":3.9},{"code":"OH","rate":4.2},{"code":"GA","rate":3.5},{"code":"NC","rate":3.8},{"code":"MI","rate":4.7},{"code":"NV","rate":5.8},{"code":"AZ","rate":4.4},{"code":"WA","rate":4.6},{"code":"ND","rate":2.1},{"code":"VT","rate":2.3}]}' \
  --output geo-3.png
```

</details>

---

## Tips for agents and humans

- The API is stateless. Every request carries the full chart config.
- Base64url is used in the `config` query parameter (RFC 4648 §5). Pad-stripping is allowed.
- PNG output is capped at 1,900 px on the longest edge so responses stay under the Anthropic multi-image request limit.
- The same service also speaks MCP at `https://mcp-charts.vercel.app/mcp` for agents that prefer tool-calling over HTTP fetch.
- 10 built-in palettes, 11 chart types, 11 basemaps. See the repo README for the full capability matrix.

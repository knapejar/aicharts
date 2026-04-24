import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const specs = JSON.parse(readFileSync(resolve(root, 'examples/specs.json'), 'utf8'));

const base = 'https://mcp-charts.vercel.app/chart';

function urlFor(spec) {
  const { _slug, ...config } = spec;
  const encoded = encodeURIComponent(JSON.stringify(config));
  return `${base}?j=${encoded}`;
}

function typeLabel(t) {
  return {
    line: 'Line',
    bar: 'Bar',
    'grouped-bar': 'Grouped bar',
    'stacked-bar': 'Stacked bar',
    'bar-split': 'Small multiples (bars)',
    'stacked-area': 'Stacked area',
    combo: 'Bar + line',
    'line-split': 'Small multiples (lines)',
    pie: 'Pie',
    donut: 'Donut',
    geo: 'Map',
  }[t] ?? t;
}

const rows = [];
rows.push('# 50 charts, zero configuration');
rows.push('');
rows.push(
  'Every chart below was produced by the [aicharts](../README.md) library in one pass from a flat JSON config. Click any chart to open the live rendered URL — the link is the chart.',
);
rows.push('');
rows.push(
  'These are real public-data stories across AI, climate, economy, demographics, tech, sports, and culture. Hover over a chart, right-click, copy image URL, paste it into Notion or a Slack message — it renders as an image. Or use the prompt in the main README to let ChatGPT produce similar URLs from plain-English requests.',
);
rows.push('');
rows.push('---');
rows.push('');

for (const spec of specs) {
  const url = urlFor(spec);
  rows.push(`### ${spec.title ?? spec._slug}`);
  const meta = [
    typeLabel(spec.chart),
    spec.palette ? `palette: ${spec.palette}` : null,
    spec.size ? `size: ${spec.size}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  if (spec.subtitle) rows.push(`_${spec.subtitle}_`);
  if (meta) rows.push(`<sub>${meta}</sub>`);
  rows.push('');
  rows.push(`[![${spec.title ?? spec._slug}](charts/${spec._slug}.png)](${url})`);
  rows.push('');
  if (spec.source) rows.push(`Source: ${spec.source}`);
  rows.push('');
  rows.push('---');
  rows.push('');
}

rows.push(
  '## Want something like this in your chat?',
);
rows.push('');
rows.push(
  'Open the [main README](../README.md), copy the ChatGPT prompt into any AI chat, then ask for the chart you want. The assistant will reply with a Markdown image that renders inline.',
);
rows.push('');
rows.push(
  'Full JSON for every chart on this page lives in [`specs.json`](./specs.json). Regenerate all PNGs with `node scripts/generate-examples.mjs` from the repo root.',
);
rows.push('');

writeFileSync(resolve(root, 'examples/README.md'), rows.join('\n'));
console.log(`Wrote examples/README.md (${rows.length} lines, ${specs.length} charts).`);

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const aspect = argValue('aspect', 'landscape');
const specsName = argValue('specs', 'specs');
const subdirName = argValue(
  'chartsDir',
  aspect === 'landscape' && specsName === 'specs' ? 'charts' : `charts-${aspect}${specsName === 'specs' ? '' : '-' + specsName}`,
);
const outFile = argValue(
  'readme',
  aspect === 'landscape' && specsName === 'specs' ? 'README.md' : `README.${aspect === 'landscape' ? '' : aspect}${specsName === 'specs' ? '' : (aspect === 'landscape' ? '' : '-') + specsName}.md`.replace('.md.md', '.md'),
);

const ASPECT_SIZE = {
  landscape: 'share',
  square: 'square',
  portrait: 'poster',
};
const sizeOverride = ASPECT_SIZE[aspect];

const specsFile = resolve(root, `examples/${specsName}.json`);
const specs = JSON.parse(readFileSync(specsFile, 'utf8'));

const base = 'https://mcp-charts.vercel.app/chart';

function urlFor(config) {
  const encoded = encodeURIComponent(JSON.stringify(config));
  return `${base}?j=${encoded}`;
}

function typeLabel(t) {
  return (
    {
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
    }[t] ?? t
  );
}

const aspectLabel = {
  landscape: 'Landscape (share 1200x675)',
  square: 'Square (1200x1200, default)',
  portrait: 'Portrait (poster 1600x2000)',
}[aspect];

const otherAspects = ['landscape', 'square', 'portrait'].filter((a) => a !== aspect);
const header = specsName === 'edge-cases'
  ? `# Edge-case zoo: ${aspectLabel}`
  : `# ${specs.length} charts, zero configuration — ${aspectLabel}`;

const rows = [];
rows.push(header);
rows.push('');
rows.push(
  specsName === 'edge-cases'
    ? 'These are deliberately hostile inputs — long titles, single data points, extreme values, huge labels. The library still renders a reasonable PNG for every one. Click any chart to open the live rendered URL.'
    : 'Every chart below was produced by the [aicharts](../README.md) library in one pass from a flat JSON config. Click any chart — or the URL beneath it — to open the live rendered PNG. The rendering URL is deterministic and can be pasted into Notion, Slack, or any Markdown viewer that loads images.',
);
rows.push('');
rows.push('Other aspect ratios for the same zoo:');
for (const other of otherAspects) {
  const otherReadme =
    specsName === 'edge-cases'
      ? `README.${other}-edge-cases.md`
      : other === 'landscape'
        ? 'README.md'
        : `README.${other}.md`;
  rows.push(`- [${other}](${otherReadme})`);
}
rows.push('');
rows.push('---');
rows.push('');

for (const spec of specs) {
  const { _slug, ...base } = spec;
  const config = { ...base, size: sizeOverride };
  const url = urlFor(config);
  rows.push(`### ${spec.title ?? spec._slug}`);
  const meta = [
    typeLabel(spec.chart),
    spec.palette ? `palette: ${spec.palette}` : null,
    `size: ${sizeOverride}`,
  ]
    .filter(Boolean)
    .join(' · ');
  if (spec.subtitle) rows.push(`_${spec.subtitle}_`);
  if (meta) rows.push(`<sub>${meta}</sub>`);
  rows.push('');
  rows.push(`[![${spec.title ?? spec._slug}](${subdirName}/${_slug}.png)](${url})`);
  rows.push('');
  rows.push(`Open rendered PNG: <${url}>`);
  rows.push('');
  if (spec.source) rows.push(`Source: ${spec.source}`);
  rows.push('');
  rows.push('---');
  rows.push('');
}

rows.push('## Want something like this in your chat?');
rows.push('');
rows.push(
  'Open the [main README](../README.md), copy the ChatGPT prompt into any AI chat, then ask for the chart you want. The assistant will reply with a Markdown image that renders inline.',
);
rows.push('');
rows.push(
  `Full JSON for every chart on this page lives in [\`${specsName}.json\`](./${specsName}.json). Regenerate all PNGs with \`npm run zoo:all\` from the repo root.`,
);
rows.push('');

writeFileSync(resolve(root, `examples/${outFile}`), rows.join('\n'));
console.log(`Wrote examples/${outFile} (${rows.length} lines, ${specs.length} charts, aspect=${aspect}).`);

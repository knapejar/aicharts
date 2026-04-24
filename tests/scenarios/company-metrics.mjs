import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const outDir = resolve(root, 'tests/scenarios/output/company-metrics');
mkdirSync(outDir, { recursive: true });

const { render } = await import(resolve(root, 'dist/index.js'));

const generated = [];

async function save(name, config) {
  const png = await render(config);
  const outFile = join(outDir, `${name}.png`);
  writeFileSync(outFile, Buffer.from(png));
  console.log(`[scenario/company] ${name}.png (${png.length} bytes)`);
  generated.push(outFile);
}

const quarterlyRevenue = [
  { quarter: 'Q1 2023', revenue: 12.5, expenses: 10.2 },
  { quarter: 'Q2 2023', revenue: 14.8, expenses: 11.1 },
  { quarter: 'Q3 2023', revenue: 16.2, expenses: 11.9 },
  { quarter: 'Q4 2023', revenue: 19.5, expenses: 13.2 },
  { quarter: 'Q1 2024', revenue: 22.1, expenses: 14.5 },
  { quarter: 'Q2 2024', revenue: 25.6, expenses: 16.2 },
  { quarter: 'Q3 2024', revenue: 28.9, expenses: 17.8 },
  { quarter: 'Q4 2024', revenue: 33.4, expenses: 19.5 },
];

await save('1-revenue-growth', {
  chart: 'line',
  data: quarterlyRevenue,
  x: 'quarter',
  y: 'revenue',
  title: 'Revenue growth',
  subtitle: 'Millions USD, quarterly',
  source: 'Internal financials',
  interpolation: 'curved',
  areaFill: true,
  showValueLabels: 'last',
});

await save('2-revenue-vs-expenses', {
  chart: 'line',
  data: quarterlyRevenue,
  x: 'quarter',
  y: ['revenue', 'expenses'],
  title: 'Revenue vs expenses',
  subtitle: 'Millions USD, quarterly',
  source: 'Internal financials',
  interpolation: 'curved',
  palette: 'boardroom',
});

const productMix = [
  { product: 'Subscription', revenue: 54 },
  { product: 'Services', revenue: 23 },
  { product: 'Hardware', revenue: 18 },
  { product: 'Other', revenue: 5 },
];

await save('3-revenue-mix', {
  chart: 'donut',
  data: productMix,
  label: 'product',
  value: 'revenue',
  title: 'Revenue mix',
  subtitle: 'Share of Q4 2024 revenue',
  source: 'Internal financials',
  centerValue: 'sum',
  centerLabel: 'Total %',
});

const regions = [
  { region: 'Americas', q1: 5.2, q2: 6.1, q3: 7.3, q4: 9.2 },
  { region: 'EMEA', q1: 4.1, q2: 4.8, q3: 5.4, q4: 6.7 },
  { region: 'APAC', q1: 3.2, q2: 3.9, q3: 4.6, q4: 6.1 },
];

await save('4-regional-breakdown', {
  chart: 'grouped-bar',
  data: regions,
  x: 'region',
  y: ['q1', 'q2', 'q3', 'q4'],
  title: 'Quarterly revenue by region',
  subtitle: 'Millions USD, 2024',
  source: 'Internal financials',
  showValueLabels: true,
});

await save('5-regional-stacked', {
  chart: 'stacked-bar',
  data: regions,
  x: 'region',
  y: ['q1', 'q2', 'q3', 'q4'],
  title: 'Annual revenue by region',
  subtitle: 'Stacked quarterly contribution',
  source: 'Internal financials',
  showTotals: true,
});

const adoption = [
  { month: 'Jan', onboarded: 120, churned: 12 },
  { month: 'Feb', onboarded: 148, churned: 15 },
  { month: 'Mar', onboarded: 182, churned: 18 },
  { month: 'Apr', onboarded: 221, churned: 21 },
  { month: 'May', onboarded: 264, churned: 24 },
  { month: 'Jun', onboarded: 312, churned: 28 },
];

await save('6-user-growth-combo', {
  chart: 'combo',
  data: adoption.map((r) => ({ ...r, net: r.onboarded - r.churned })),
  x: 'month',
  bars: ['onboarded', 'churned'],
  lines: 'net',
  title: 'Monthly user acquisition',
  subtitle: 'Onboarded vs churned; net growth line',
  source: 'Analytics',
  palette: 'clarity',
});

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const path of generated) {
  const bytes = readFileSync(path);
  assert.ok(bytes.byteLength > 20_000, `${path} too small: ${bytes.byteLength}`);
  assert.ok(PNG_MAGIC.equals(bytes.subarray(0, 8)), `${path} missing PNG magic`);
}
console.log(`[scenario/company-metrics] ${generated.length} scenario outputs verified`);

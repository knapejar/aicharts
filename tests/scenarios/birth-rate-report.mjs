import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const outDir = resolve(root, 'tests/scenarios/output/birth-rate');
mkdirSync(outDir, { recursive: true });

const { render } = await import(resolve(root, 'dist/index.js'));
const birthRate = JSON.parse(
  readFileSync(resolve(root, 'tests/fixtures/birth-rate.json'), 'utf-8'),
);

const generated = [];

async function save(name, config) {
  const png = await render(config);
  const outFile = join(outDir, `${name}.png`);
  writeFileSync(outFile, Buffer.from(png));
  console.log(`[scenario/birth-rate] ${name}.png (${png.length} bytes)`);
  generated.push(outFile);
}

await save('1-trend-multi-series', {
  chart: 'line',
  data: birthRate,
  x: 'year',
  y: ['czechia', 'germany', 'france', 'italy', 'poland'],
  title: 'Crude birth rate across five European countries',
  subtitle: 'Live births per 1,000 population, 2000-2023',
  source: 'Eurostat',
  interpolation: 'curved',
  palette: 'editorial',
});

await save('2-per-country-small-multiples', {
  chart: 'line-split',
  data: birthRate,
  x: 'year',
  y: ['czechia', 'germany', 'france', 'italy', 'poland'],
  columns: 3,
  title: 'Birth rate by country',
  subtitle: 'Each country on shared y scale',
  source: 'Eurostat',
  interpolation: 'curved',
});

const lastTwoYears = birthRate.slice(-2);
const earlierYear = lastTwoYears[0];
const laterYear = lastTwoYears[1];
const earlierKey = `y${earlierYear.year}`;
const laterKey = `y${laterYear.year}`;
await save('3-latest-comparison-grouped', {
  chart: 'grouped-bar',
  data: ['czechia', 'germany', 'france', 'italy', 'poland'].map((country) => ({
    country,
    [earlierKey]: earlierYear[country],
    [laterKey]: laterYear[country],
  })),
  x: 'country',
  y: [earlierKey, laterKey],
  title: `Birth rate in ${earlierYear.year} vs ${laterYear.year}`,
  subtitle: 'Last two data points',
  source: 'Eurostat',
  showValueLabels: true,
});

const latestRow = birthRate[birthRate.length - 1];
await save('4-share-donut', {
  chart: 'donut',
  data: ['czechia', 'germany', 'france', 'italy', 'poland'].map((country) => ({
    country,
    rate: latestRow[country],
  })),
  label: 'country',
  value: 'rate',
  title: `Birth rate share, ${latestRow.year}`,
  subtitle: 'Relative comparison of countries',
  source: 'Eurostat',
  centerValue: 'sum',
  centerLabel: 'Combined rate',
});

const countries = {
  czechia: 'CZE',
  germany: 'DEU',
  france: 'FRA',
  italy: 'ITA',
  poland: 'POL',
};
const geoData = Object.entries(countries).map(([key, code]) => ({
  code,
  rate: latestRow[key],
}));
await save('5-europe-geo', {
  chart: 'geo',
  data: geoData,
  code: 'code',
  value: 'rate',
  basemap: 'europe',
  title: `Birth rate across highlighted countries, ${latestRow.year}`,
  subtitle: 'Live births per 1,000 population',
  source: 'Eurostat',
  palette: 'mono-blue',
});

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (const path of generated) {
  const bytes = readFileSync(path);
  assert.ok(bytes.byteLength > 20_000, `${path} too small: ${bytes.byteLength}`);
  assert.ok(PNG_MAGIC.equals(bytes.subarray(0, 8)), `${path} missing PNG magic`);
}
console.log(`[scenario/birth-rate] ${generated.length} scenario outputs verified`);

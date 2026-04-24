import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const outDir = resolve(root, 'tests/scenarios/output/birth-rate');
mkdirSync(outDir, { recursive: true });

const { render } = await import(resolve(root, 'dist/index.js'));
const birthRate = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/birth-rate.json'), 'utf-8'));

async function save(name, config) {
  const png = await render(config);
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(png));
  console.log(`[scenario/birth-rate] ${name}.png (${png.length} bytes)`);
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
await save('3-latest-comparison-grouped', {
  chart: 'grouped-bar',
  data: ['czechia', 'germany', 'france', 'italy', 'poland'].map((country) => ({
    country,
    y2022: lastTwoYears[0][country],
    y2023: lastTwoYears[1][country],
  })),
  x: 'country',
  y: ['y2022', 'y2023'],
  title: 'Birth rate in 2022 vs 2023',
  subtitle: 'Last two data points',
  source: 'Eurostat',
  showValueLabels: true,
});

const year2023 = birthRate.find((r) => r.year === 2023);
await save('4-share-donut', {
  chart: 'donut',
  data: ['czechia', 'germany', 'france', 'italy', 'poland'].map((country) => ({
    country,
    rate: year2023[country],
  })),
  label: 'country',
  value: 'rate',
  title: 'Birth rate share, 2023',
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
  rate: year2023[key],
}));
await save('5-europe-geo', {
  chart: 'geo',
  data: geoData,
  code: 'code',
  value: 'rate',
  basemap: 'europe',
  title: 'Birth rate across highlighted countries, 2023',
  subtitle: 'Live births per 1,000 population',
  source: 'Eurostat',
  palette: 'mono-blue',
});

console.log('[scenario/birth-rate] done');

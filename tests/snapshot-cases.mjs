import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(name) {
  const p = resolve(__dirname, 'fixtures', name);
  return JSON.parse(readFileSync(p, 'utf-8'));
}

export function snapshotCases() {
  const temperature = fixture('temperature-anomaly.json');
  const birthRate = fixture('birth-rate.json');
  const co2 = fixture('co2-emissions.json');
  const stocks = fixture('stock-prices.json');
  const negatives = fixture('edge-negative.json');
  const revenueRegions = fixture('revenue-regions.json');
  const internet = fixture('internet-usage.json');
  const marketing = fixture('marketing-channels.json');
  const election = fixture('election-results.json');

  const cases = [];

  cases.push({
    name: 'line-basic',
    config: {
      chart: 'line',
      data: temperature,
      x: 'year',
      y: 'anomaly',
      title: 'Global temperature anomaly',
      subtitle: 'Relative to 1951-1980 average, degrees Celsius',
      source: 'NASA GISS',
    },
  });

  cases.push({
    name: 'line-multi-series',
    config: {
      chart: 'line',
      data: birthRate,
      x: 'year',
      y: ['czechia', 'germany', 'france', 'italy', 'poland'],
      title: 'Crude birth rate by country',
      subtitle: 'Live births per 1,000 population, 2000-2023',
      source: 'Eurostat',
    },
  });

  cases.push({
    name: 'line-curved-with-area',
    config: {
      chart: 'line',
      data: co2,
      x: 'year',
      y: 'coal',
      title: 'CO2 emissions from coal',
      subtitle: 'Millions of tonnes',
      source: 'Global Carbon Project',
      interpolation: 'curved',
      areaFill: true,
    },
  });

  cases.push({
    name: 'line-stock-prices',
    config: {
      chart: 'line',
      data: stocks,
      x: 'date',
      y: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'],
      title: 'Tech stocks 2024',
      subtitle: 'Daily close price, USD',
      source: 'Yahoo Finance (sample data)',
      palette: 'editorial',
    },
  });

  cases.push({
    name: 'line-negatives',
    config: {
      chart: 'line',
      data: negatives,
      x: 'month',
      y: 'profit',
      title: 'Monthly profit and loss',
      subtitle: 'Thousands of USD',
      source: 'Internal',
      showSymbols: 'all',
      showValueLabels: 'all',
      palette: 'diverging-sunset',
    },
  });

  cases.push({
    name: 'line-dashed',
    config: {
      chart: 'line',
      data: birthRate,
      x: 'year',
      y: ['czechia', 'germany'],
      title: 'Birth rate comparison',
      subtitle: 'Dashed vs solid lines',
      source: 'Eurostat',
      lineStyle: { czechia: 'solid', germany: 'dashed' },
      interpolation: 'curved',
    },
  });

  cases.push({
    name: 'line-palette-twilight',
    config: {
      chart: 'line',
      data: temperature,
      x: 'year',
      y: 'anomaly',
      title: 'Temperature anomaly',
      subtitle: 'Dark mode palette',
      source: 'NASA GISS',
      palette: 'twilight',
      interpolation: 'curved',
    },
  });

  cases.push({
    name: 'line-single-point',
    config: {
      chart: 'line',
      data: [{ year: 2024, value: 42 }],
      x: 'year',
      y: 'value',
      title: 'Single data point',
      subtitle: 'Edge case',
      source: 'Test fixture',
    },
  });

  cases.push({
    name: 'bar-vertical',
    config: {
      chart: 'bar',
      data: [
        { label: 'Q1', value: 120 },
        { label: 'Q2', value: 180 },
        { label: 'Q3', value: 160 },
        { label: 'Q4', value: 220 },
      ],
      title: 'Quarterly revenue',
      subtitle: 'Millions USD',
      source: 'Company filings',
    },
  });

  cases.push({
    name: 'bar-horizontal-sorted',
    config: {
      chart: 'bar',
      data: internet.slice(0, 20),
      label: 'country',
      value: 'usage',
      orientation: 'horizontal',
      sort: 'desc',
      title: 'Internet usage by country',
      subtitle: 'Percent of population, top 20 of selected sample',
      source: 'World Bank',
      palette: 'boardroom',
    },
  });

  cases.push({
    name: 'bar-negatives',
    config: {
      chart: 'bar',
      data: negatives,
      label: 'month',
      value: 'profit',
      title: 'Monthly profit and loss',
      subtitle: 'Thousands of USD',
      source: 'Internal',
      palette: 'diverging-sunset',
    },
  });

  cases.push({
    name: 'grouped-bar-basic',
    config: {
      chart: 'grouped-bar',
      data: revenueRegions,
      x: 'region',
      y: ['q1', 'q2', 'q3', 'q4'],
      title: 'Quarterly revenue by region',
      subtitle: 'Millions USD',
      source: 'Internal',
      showValueLabels: false,
    },
  });

  cases.push({
    name: 'grouped-bar-palette-vibrant',
    config: {
      chart: 'grouped-bar',
      data: revenueRegions,
      x: 'region',
      y: ['q1', 'q4'],
      title: 'Regional growth Q1 to Q4',
      subtitle: 'Millions USD',
      source: 'Internal',
      palette: 'vibrant',
      showValueLabels: true,
    },
  });

  cases.push({
    name: 'stacked-bar-vertical',
    config: {
      chart: 'stacked-bar',
      data: marketing,
      x: 'quarter',
      y: ['organic', 'paid', 'email', 'referral'],
      title: 'Marketing channel contribution',
      subtitle: 'Share of leads',
      source: 'Analytics',
      showTotals: true,
    },
  });

  cases.push({
    name: 'stacked-bar-normalized',
    config: {
      chart: 'stacked-bar',
      data: marketing,
      x: 'quarter',
      y: ['organic', 'paid', 'email', 'referral'],
      title: 'Marketing channel mix',
      subtitle: 'Normalized to 100% per quarter',
      source: 'Analytics',
      normalize: true,
      palette: 'carbon',
    },
  });

  cases.push({
    name: 'stacked-bar-horizontal',
    config: {
      chart: 'stacked-bar',
      data: revenueRegions,
      x: 'region',
      y: ['q1', 'q2', 'q3', 'q4'],
      orientation: 'horizontal',
      title: 'Revenue by region',
      subtitle: 'Quarterly stacks, millions USD',
      source: 'Internal',
      palette: 'editorial',
    },
  });

  cases.push({
    name: 'bar-split-marketing',
    config: {
      chart: 'bar-split',
      data: marketing,
      x: 'quarter',
      y: ['organic', 'paid', 'email', 'referral'],
      columns: 2,
      title: 'Marketing channels over time',
      subtitle: 'Small multiples, one panel per channel',
      source: 'Analytics',
    },
  });

  void election;
  void temperature;

  return cases;
}

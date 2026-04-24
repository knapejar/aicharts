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
  const usaUnemployment = fixture('usa-unemployment.json');
  const northAmericaGdp = fixture('north-america-gdp.json');

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

  cases.push({
    name: 'stacked-area-co2',
    config: {
      chart: 'stacked-area',
      data: co2,
      x: 'year',
      y: ['coal', 'oil', 'gas', 'other'],
      title: 'Global CO2 emissions by fuel',
      subtitle: 'Millions of tonnes, 1950-2021',
      source: 'Global Carbon Project',
    },
  });

  cases.push({
    name: 'stacked-area-normalized',
    config: {
      chart: 'stacked-area',
      data: co2,
      x: 'year',
      y: ['coal', 'oil', 'gas', 'other'],
      normalize: true,
      title: 'Share of CO2 emissions by fuel',
      subtitle: 'Normalized to 100% per year',
      source: 'Global Carbon Project',
      palette: 'earth',
    },
  });

  cases.push({
    name: 'combo-revenue-vs-margin',
    config: {
      chart: 'combo',
      data: [
        { quarter: 'Q1', revenue: 120, margin: 0.18 },
        { quarter: 'Q2', revenue: 150, margin: 0.21 },
        { quarter: 'Q3', revenue: 180, margin: 0.19 },
        { quarter: 'Q4', revenue: 220, margin: 0.24 },
        { quarter: 'Q1 Y2', revenue: 240, margin: 0.26 },
        { quarter: 'Q2 Y2', revenue: 275, margin: 0.29 },
      ],
      x: 'quarter',
      bars: 'revenue',
      lines: 'margin',
      title: 'Revenue and margin',
      subtitle: 'Bars: revenue in MUSD. Line: margin ratio.',
      source: 'Internal',
    },
  });

  cases.push({
    name: 'line-split-birth-rate',
    config: {
      chart: 'line-split',
      data: birthRate,
      x: 'year',
      y: ['czechia', 'germany', 'france', 'italy', 'poland'],
      columns: 3,
      title: 'Birth rate over time',
      subtitle: 'Small multiples, shared y scale',
      source: 'Eurostat',
      interpolation: 'curved',
    },
  });

  cases.push({
    name: 'pie-basic',
    config: {
      chart: 'pie',
      data: [
        { label: 'Mobile', value: 62 },
        { label: 'Desktop', value: 30 },
        { label: 'Tablet', value: 8 },
      ],
      title: 'Traffic by device',
      subtitle: 'Share of sessions',
      source: 'Analytics',
    },
  });

  cases.push({
    name: 'pie-election',
    config: {
      chart: 'pie',
      data: election,
      label: 'party',
      value: 'share',
      title: 'Election results',
      subtitle: 'Share of votes',
      source: 'Central Election Commission',
      palette: 'editorial',
    },
  });

  cases.push({
    name: 'pie-many-slices',
    config: {
      chart: 'pie',
      data: [
        { label: 'A', value: 40 },
        { label: 'B', value: 25 },
        { label: 'C', value: 12 },
        { label: 'D', value: 8 },
        { label: 'E', value: 5 },
        { label: 'F', value: 3 },
        { label: 'G', value: 2 },
        { label: 'H', value: 2 },
        { label: 'I', value: 1.5 },
        { label: 'J', value: 1.5 },
      ],
      title: 'Auto-grouped Other',
      subtitle: 'Small slices merged when >6 categories',
      source: 'Test',
      palette: 'vibrant',
    },
  });

  cases.push({
    name: 'donut-basic',
    config: {
      chart: 'donut',
      data: [
        { label: 'Subscription', value: 540 },
        { label: 'Services', value: 230 },
        { label: 'Hardware', value: 180 },
        { label: 'Other', value: 50 },
      ],
      title: 'Revenue mix',
      subtitle: 'Millions USD',
      source: 'Financial report',
      centerValue: 'sum',
      centerLabel: 'Total MUSD',
    },
  });

  cases.push({
    name: 'donut-carbon',
    config: {
      chart: 'donut',
      data: [
        { channel: 'organic', share: 42 },
        { channel: 'paid', share: 28 },
        { channel: 'email', share: 18 },
        { channel: 'referral', share: 12 },
      ],
      label: 'channel',
      value: 'share',
      title: 'Marketing share Q1 2024',
      subtitle: 'Share of leads',
      source: 'Analytics',
      palette: 'carbon',
      innerRadius: 'thin',
    },
  });

  cases.push({
    name: 'geo-world-internet',
    config: {
      chart: 'geo',
      data: internet,
      code: 'code',
      value: 'usage',
      basemap: 'world',
      title: 'Internet usage worldwide',
      subtitle: 'Percent of population with internet access',
      source: 'World Bank',
    },
  });

  cases.push({
    name: 'geo-europe-internet',
    config: {
      chart: 'geo',
      data: internet,
      code: 'code',
      value: 'usage',
      basemap: 'europe',
      title: 'Internet usage across Europe',
      subtitle: 'Percent of population',
      source: 'World Bank',
      palette: 'mono-blue',
    },
  });

  cases.push({
    name: 'geo-usa-unemployment',
    config: {
      chart: 'geo',
      data: usaUnemployment,
      code: 'code',
      value: 'rate',
      basemap: 'usa-states',
      title: 'Unemployment rate by state',
      subtitle: 'Selected US states, percent of labor force',
      source: 'Bureau of Labor Statistics (sample data)',
      palette: 'diverging-sunset',
    },
  });

  cases.push({
    name: 'geo-north-america-gdp',
    config: {
      chart: 'geo',
      data: northAmericaGdp,
      code: 'code',
      value: 'gdp',
      basemap: 'north-america',
      title: 'GDP per capita across North America',
      subtitle: 'Current USD, selected countries',
      source: 'IMF (sample data)',
      palette: 'earth',
    },
  });

  void election;
  void temperature;

  return cases;
}

const CHART_TYPES = [
  'line',
  'bar',
  'grouped-bar',
  'stacked-bar',
  'bar-split',
  'stacked-area',
  'combo',
  'line-split',
  'pie',
  'donut',
  'geo',
];

const PALETTES = [
  'clarity',
  'boardroom',
  'editorial',
  'vibrant',
  'carbon',
  'viridis',
  'earth',
  'twilight',
  'mono-blue',
  'diverging-sunset',
];

const EXAMPLES = {
  line: {
    chart: 'line',
    data: [
      { year: 1880, anomaly: -0.16 },
      { year: 1910, anomaly: -0.42 },
      { year: 1940, anomaly: 0.12 },
      { year: 1970, anomaly: 0.02 },
      { year: 1990, anomaly: 0.45 },
      { year: 2010, anomaly: 0.72 },
      { year: 2020, anomaly: 1.01 },
      { year: 2023, anomaly: 1.17 },
    ],
    x: 'year',
    y: 'anomaly',
    title: 'Global temperature anomaly',
    subtitle: 'Relative to 1951-1980 average, degrees Celsius',
    source: 'NASA GISS',
  },
  bar: {
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
  'grouped-bar': {
    chart: 'grouped-bar',
    data: [
      { region: 'North America', q1: 48, q2: 56, q3: 61, q4: 72 },
      { region: 'Europe', q1: 34, q2: 38, q3: 42, q4: 51 },
      { region: 'Asia Pacific', q1: 28, q2: 32, q3: 40, q4: 49 },
      { region: 'Latin America', q1: 12, q2: 14, q3: 15, q4: 18 },
    ],
    x: 'region',
    y: ['q1', 'q2', 'q3', 'q4'],
    title: 'Revenue by region',
    subtitle: 'Millions USD',
    source: 'Internal',
  },
  'stacked-bar': {
    chart: 'stacked-bar',
    data: [
      { quarter: 'Q1 2024', organic: 42, paid: 28, email: 18, referral: 12 },
      { quarter: 'Q2 2024', organic: 45, paid: 30, email: 16, referral: 9 },
      { quarter: 'Q3 2024', organic: 48, paid: 25, email: 17, referral: 10 },
      { quarter: 'Q4 2024', organic: 52, paid: 22, email: 16, referral: 10 },
    ],
    x: 'quarter',
    y: ['organic', 'paid', 'email', 'referral'],
    title: 'Marketing channel contribution',
    subtitle: 'Share of leads',
    source: 'Analytics',
    showTotals: true,
  },
  'bar-split': {
    chart: 'bar-split',
    data: [
      { quarter: 'Q1 2024', organic: 42, paid: 28, email: 18, referral: 12 },
      { quarter: 'Q2 2024', organic: 45, paid: 30, email: 16, referral: 9 },
      { quarter: 'Q3 2024', organic: 48, paid: 25, email: 17, referral: 10 },
      { quarter: 'Q4 2024', organic: 52, paid: 22, email: 16, referral: 10 },
    ],
    x: 'quarter',
    y: ['organic', 'paid', 'email', 'referral'],
    columns: 2,
    title: 'Channels over time',
    subtitle: 'Small multiples',
    source: 'Analytics',
  },
  'stacked-area': {
    chart: 'stacked-area',
    data: [
      { year: 1950, coal: 3856, gas: 353, oil: 1648, other: 146 },
      { year: 1970, coal: 5696, gas: 1791, oil: 6801, other: 611 },
      { year: 1990, coal: 8689, gas: 3833, oil: 9249, other: 986 },
      { year: 2010, coal: 13927, gas: 6195, oil: 11360, other: 1882 },
      { year: 2021, coal: 14980, gas: 7922, oil: 11837, other: 2385 },
    ],
    x: 'year',
    y: ['coal', 'oil', 'gas', 'other'],
    title: 'Global CO2 emissions by fuel',
    subtitle: 'Millions of tonnes',
    source: 'Global Carbon Project',
  },
  combo: {
    chart: 'combo',
    data: [
      { quarter: 'Q1', revenue: 120, margin: 0.18 },
      { quarter: 'Q2', revenue: 150, margin: 0.21 },
      { quarter: 'Q3', revenue: 180, margin: 0.19 },
      { quarter: 'Q4', revenue: 220, margin: 0.24 },
    ],
    x: 'quarter',
    bars: 'revenue',
    lines: 'margin',
    title: 'Revenue and margin',
    subtitle: 'Dual axis',
    source: 'Internal',
  },
  'line-split': {
    chart: 'line-split',
    data: [
      { year: 2000, czechia: 8.9, germany: 9.3, france: 13.2 },
      { year: 2005, czechia: 10.0, germany: 8.3, france: 12.9 },
      { year: 2010, czechia: 11.2, germany: 8.2, france: 13.0 },
      { year: 2015, czechia: 10.5, germany: 9.0, france: 12.0 },
      { year: 2020, czechia: 10.3, germany: 9.3, france: 10.9 },
      { year: 2023, czechia: 8.4, germany: 8.5, france: 10.0 },
    ],
    x: 'year',
    y: ['czechia', 'germany', 'france'],
    title: 'Birth rate over time',
    subtitle: 'Small multiples, per 1000 population',
    source: 'Eurostat',
    interpolation: 'curved',
  },
  pie: {
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
  donut: {
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
  geo: {
    chart: 'geo',
    data: [
      { code: 'USA', value: 74.45 },
      { code: 'DEU', value: 87.59 },
      { code: 'BRA', value: 59.08 },
      { code: 'IND', value: 26.0 },
      { code: 'CHN', value: 50.3 },
      { code: 'AUS', value: 84.56 },
      { code: 'RUS', value: 70.1 },
      { code: 'GBR', value: 92.0 },
      { code: 'FRA', value: 84.69 },
      { code: 'ZAF', value: 51.92 },
      { code: 'JPN', value: 91.06 },
      { code: 'CAN', value: 88.47 },
    ],
    basemap: 'world',
    code: 'code',
    value: 'value',
    title: 'Internet usage worldwide',
    subtitle: 'Percent of population',
    source: 'World Bank',
  },
};

const GALLERY = [
  { name: 'Line, multi-series', chart: 'line', palette: 'clarity', config: EXAMPLES.line },
  {
    name: 'Curved area',
    chart: 'line',
    palette: 'editorial',
    config: {
      chart: 'line',
      data: EXAMPLES['stacked-area'].data,
      x: 'year',
      y: 'coal',
      title: 'CO2 emissions from coal',
      subtitle: 'Millions of tonnes',
      source: 'Global Carbon Project',
      interpolation: 'curved',
      areaFill: true,
    },
  },
  { name: 'Bar vertical', chart: 'bar', palette: 'clarity', config: EXAMPLES.bar },
  {
    name: 'Bar horizontal sorted',
    chart: 'bar',
    palette: 'boardroom',
    config: {
      chart: 'bar',
      data: [
        { country: 'Denmark', usage: 96.33 },
        { country: 'Finland', usage: 92.65 },
        { country: 'Germany', usage: 87.59 },
        { country: 'USA', usage: 74.45 },
        { country: 'Brazil', usage: 59.08 },
        { country: 'Egypt', usage: 37.82 },
        { country: 'India', usage: 26.0 },
      ],
      label: 'country',
      value: 'usage',
      orientation: 'horizontal',
      sort: 'desc',
      title: 'Internet usage',
      subtitle: 'Percent of population',
      source: 'World Bank',
      palette: 'boardroom',
    },
  },
  { name: 'Grouped bar', chart: 'grouped-bar', palette: 'vibrant', config: { ...EXAMPLES['grouped-bar'], palette: 'vibrant' } },
  { name: 'Stacked bar', chart: 'stacked-bar', palette: 'carbon', config: { ...EXAMPLES['stacked-bar'], palette: 'carbon' } },
  { name: 'Stacked area', chart: 'stacked-area', palette: 'earth', config: { ...EXAMPLES['stacked-area'], palette: 'earth' } },
  { name: 'Combo', chart: 'combo', palette: 'clarity', config: EXAMPLES.combo },
  { name: 'Line split', chart: 'line-split', palette: 'clarity', config: EXAMPLES['line-split'] },
  { name: 'Pie', chart: 'pie', palette: 'vibrant', config: { ...EXAMPLES.pie, palette: 'vibrant' } },
  { name: 'Donut', chart: 'donut', palette: 'clarity', config: EXAMPLES.donut },
  { name: 'World map', chart: 'geo', palette: 'mono-blue', config: { ...EXAMPLES.geo, palette: 'mono-blue' } },
];

function el(id) {
  return document.getElementById(id);
}

function encodeConfig(config) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(config))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function chartUrl(config) {
  return `/chart?config=${encodeConfig(config)}`;
}

function populateSelect(selector, items) {
  const s = el(selector);
  s.innerHTML = '';
  for (const v of items) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    s.appendChild(opt);
  }
}

function fillExample(chart) {
  const ex = EXAMPLES[chart] ?? { chart, data: [] };
  el('config').value = JSON.stringify(ex, null, 2);
}

function currentConfig() {
  const chart = el('chart-type').value;
  const palette = el('palette').value;
  const size = el('size').value;
  let base;
  try {
    base = JSON.parse(el('config').value);
  } catch (e) {
    throw new Error('Invalid JSON: ' + e.message);
  }
  return { ...base, chart, palette, size };
}

async function renderNow() {
  const err = el('error');
  err.hidden = true;
  err.textContent = '';
  const img = el('preview');
  try {
    const config = currentConfig();
    img.src = chartUrl(config) + '&t=' + Date.now();
  } catch (e) {
    err.hidden = false;
    err.textContent = String(e.message ?? e);
  }
}

function loadGalleryCard(entry) {
  el('chart-type').value = entry.chart;
  el('palette').value = entry.palette ?? 'clarity';
  el('size').value = 'share';
  el('config').value = JSON.stringify(entry.config, null, 2);
  renderNow();
  document.getElementById('playground').scrollIntoView({ behavior: 'smooth' });
}

function buildGallery() {
  const grid = el('gallery-grid');
  for (const entry of GALLERY) {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    const h = document.createElement('h4');
    h.textContent = entry.name;
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = `chart: ${entry.chart} · palette: ${entry.palette}`;
    const img = document.createElement('img');
    img.src = chartUrl({ ...entry.config, size: 'inline' });
    img.alt = entry.name;
    card.appendChild(h);
    card.appendChild(desc);
    card.appendChild(img);
    card.addEventListener('click', () => loadGalleryCard(entry));
    grid.appendChild(card);
  }
}

populateSelect('chart-type', CHART_TYPES);
populateSelect('palette', PALETTES);
fillExample('line');
renderNow();
buildGallery();

el('chart-type').addEventListener('change', (e) => {
  fillExample(e.target.value);
  renderNow();
});
el('palette').addEventListener('change', renderNow);
el('size').addEventListener('change', renderNow);
el('render-btn').addEventListener('click', renderNow);

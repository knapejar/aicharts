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
      { year: 2018, revenue: 12 },
      { year: 2019, revenue: 14 },
      { year: 2020, revenue: 10 },
      { year: 2021, revenue: 18 },
      { year: 2022, revenue: 22 },
      { year: 2023, revenue: 28 },
    ],
    x: 'year',
    y: 'revenue',
    title: 'Revenue growth',
    subtitle: 'Fiscal years, millions USD',
    source: 'Company filings',
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
  },
  pie: {
    chart: 'pie',
    data: [
      { label: 'Mobile', value: 62 },
      { label: 'Desktop', value: 30 },
      { label: 'Tablet', value: 8 },
    ],
    title: 'Traffic share',
  },
};

function el(id) {
  return document.getElementById(id);
}

function populateSelect(id, items) {
  const s = el(id);
  s.innerHTML = '';
  for (const v of items) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    s.appendChild(opt);
  }
}

function currentConfig() {
  const chart = el('chart-type').value;
  const palette = el('palette').value;
  const size = el('size').value;
  const text = el('config').value;
  const base = JSON.parse(text);
  return { ...base, chart, palette, size };
}

function fillExample(chart) {
  const ex = EXAMPLES[chart] ?? { chart, data: [], title: `${chart} example` };
  el('config').value = JSON.stringify(ex, null, 2);
}

async function renderNow() {
  const err = el('error');
  err.hidden = true;
  err.textContent = '';
  const img = el('preview');
  try {
    const config = currentConfig();
    const encoded = btoa(JSON.stringify(config))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    img.src = `/chart?config=${encoded}&t=${Date.now()}`;
  } catch (e) {
    err.hidden = false;
    err.textContent = String(e);
  }
}

populateSelect('chart-type', CHART_TYPES);
populateSelect('palette', PALETTES);
fillExample('line');

el('chart-type').addEventListener('change', (e) => fillExample(e.target.value));
el('render-btn').addEventListener('click', renderNow);
renderNow();

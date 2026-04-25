import { mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..', '..');
const { render } = await import(resolve(root, 'dist/index.js'));

const round = Number(process.env.LOOP_ROUND ?? 1);
const seed = Number(process.env.LOOP_SEED ?? Date.now());

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(seed >>> 0);
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function range(n) { return Array.from({ length: n }, (_, i) => i); }
function randInt(lo, hi) { return Math.floor(rand() * (hi - lo + 1)) + lo; }
function randFloat(lo, hi) { return rand() * (hi - lo) + lo; }

const PALETTES = [
  'clarity', 'boardroom', 'editorial', 'vibrant', 'carbon',
  'viridis', 'earth', 'twilight', 'mono-blue', 'diverging-sunset',
];
const SIZES = ['share', 'square', 'poster'];

const WORDS = [
  'Revenue', 'Share', 'Growth', 'Inflation', 'Capital', 'Adoption',
  'Market', 'Signal', 'Index', 'Trend', 'Demand', 'Volume',
  'Output', 'Rate', 'Total', 'Average', 'Mean', 'Peak',
];
const ACCENT_WORDS = [
  'élève', 'café', 'naïve', 'Zürich', 'São Paulo',
  "O'Neill", 'A&M', 'Müller', 'renewables & storage',
];
const LONG_TAIL =
  'An extraordinarily verbose subtitle that describes the data provenance, methodology, statistical qualifiers, temporal coverage, and caveats in one very long sentence with commas, semicolons; and even an em-dash — to stress-test header wrapping behavior in every aspect.';
const LONG_TITLE =
  'A deliberately extremely long chart title engineered to break header wrapping, clip outer margins, collide with legends, or otherwise embarrass layout computations across all supported presets and palettes';

function longTitle() {
  return pick([
    undefined,
    'Short title',
    'Title with & special characters — and dashes',
    LONG_TITLE,
    `${pick(ACCENT_WORDS)} in the ${pick(WORDS).toLowerCase()} market, 2010 through 2025`,
  ]);
}
function longSubtitle() {
  return pick([
    undefined,
    'Subtitle, brief.',
    LONG_TAIL,
    'Units in billions (USD); adjusted for inflation using CPI-U; seasonally adjusted; smoothed with 4-quarter trailing average.',
  ]);
}
function longSource() {
  return pick([
    undefined,
    'BLS',
    'Bureau of Labor Statistics, quarterly release, methodology revised 2024-Q3, series DN-004719',
    'OECD · IMF · World Bank composite, author calculations',
  ]);
}

function years(n, start = 2005) {
  return range(n).map((i) => start + i);
}

function makeLine() {
  const n = pick([1, 2, 3, 7, 14, 22, 40]);
  const multi = rand() < 0.35 && n >= 3;
  const scaleExp = pick([-3, 0, 3, 6, 9]);
  const base = Math.pow(10, scaleExp);
  const x = years(n, randInt(1950, 2020));
  const data = x.map((yr, i) => {
    const row = { year: yr };
    if (multi) {
      row.series_a = +(base * (0.5 + rand()) * (1 + i / 10)).toFixed(4);
      row.series_b = +(base * (0.3 + rand()) * (1 + i / 12)).toFixed(4);
      row['north america'] = +(base * (0.2 + rand()) * (1 + i / 9)).toFixed(4);
    } else {
      row.value = +(base * (rand() - 0.3) * 2).toFixed(4);
    }
    return row;
  });
  return {
    _slug: 'line',
    chart: 'line',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'year',
    y: multi ? ['series_a', 'series_b', 'north america'] : 'value',
    interpolation: pick(['linear', 'curved', 'stepped']),
    showSymbols: pick(['none', 'first-last', 'all', 'last']),
    showValueLabels: pick(['none', 'last', 'first-last', 'all']),
    areaFill: rand() < 0.4,
    data,
  };
}

function makeBar() {
  const n = pick([1, 2, 5, 9, 14, 22]);
  const horizontal = rand() < 0.5;
  const labels = range(n).map((i) =>
    pick([
      `${pick(WORDS)} ${i + 1}`,
      `Very long category label number ${i + 1} with many words`,
      `${pick(ACCENT_WORDS)} ${i + 1}`,
      `Item ${i + 1}`,
    ]),
  );
  const scaleExp = pick([0, 3, 6]);
  const base = Math.pow(10, scaleExp);
  const data = labels.map((l) => ({
    label: l,
    value: +(base * (rand() + 0.05)).toFixed(2),
  }));
  return {
    _slug: 'bar',
    chart: 'bar',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    label: 'label',
    value: 'value',
    orientation: horizontal ? 'horizontal' : 'vertical',
    sort: pick(['asc', 'desc', 'none']),
    showValueLabels: rand() < 0.8,
    data,
  };
}

function makeGroupedBar() {
  const n = pick([2, 5, 9, 14]);
  const seriesCount = pick([2, 3, 4]);
  const seriesNames = range(seriesCount).map((i) => `${pick(WORDS)} ${i + 1}`);
  const data = range(n).map((i) => {
    const row = { label: `Group ${i + 1}` };
    for (const s of seriesNames) row[s] = +(rand() * 100).toFixed(1);
    return row;
  });
  return {
    _slug: 'grouped-bar',
    chart: 'grouped-bar',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'label',
    y: seriesNames,
    orientation: rand() < 0.5 ? 'horizontal' : 'vertical',
    showValueLabels: rand() < 0.5,
    data,
  };
}

function makeStackedBar() {
  const n = pick([1, 3, 6, 12]);
  const seriesCount = pick([2, 3, 5]);
  const seriesNames = range(seriesCount).map((i) => `Bucket ${i + 1}`);
  const data = range(n).map((i) => {
    const row = { x: `${pick(WORDS)} ${i + 1}` };
    for (const s of seriesNames) row[s] = +(rand() * 40 + 2).toFixed(1);
    return row;
  });
  return {
    _slug: 'stacked-bar',
    chart: 'stacked-bar',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'x',
    y: seriesNames,
    orientation: rand() < 0.5 ? 'horizontal' : 'vertical',
    normalize: rand() < 0.3,
    showTotals: rand() < 0.5,
    data,
  };
}

function makeStackedArea() {
  const n = pick([2, 6, 12, 25, 40]);
  const seriesCount = pick([2, 3, 4]);
  const seriesNames = range(seriesCount).map((i) => `Slice ${i + 1}`);
  const data = range(n).map((i) => {
    const row = { year: 2000 + i };
    for (const s of seriesNames) row[s] = +(rand() * 30 + 1).toFixed(2);
    return row;
  });
  return {
    _slug: 'stacked-area',
    chart: 'stacked-area',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'year',
    y: seriesNames,
    normalize: rand() < 0.3,
    interpolation: pick(['linear', 'curved', 'stepped']),
    data,
  };
}

function makeCombo() {
  const n = pick([4, 8, 15]);
  const data = range(n).map((i) => ({
    year: 2010 + i,
    revenue: +(rand() * 100 + 10).toFixed(1),
    margin: +(rand() * 20 + 5).toFixed(2),
  }));
  return {
    _slug: 'combo',
    chart: 'combo',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'year',
    bars: 'revenue',
    lines: 'margin',
    interpolation: pick(['linear', 'curved', 'stepped']),
    data,
  };
}

function makePie() {
  const n = pick([1, 2, 4, 8, 20]);
  const data = range(n).map((i) => ({
    label: pick([
      `Slice ${i + 1}`,
      `${pick(WORDS)} ${i + 1}`,
      `Very descriptive sector label ${i + 1}`,
    ]),
    value: +(rand() * 50 + 1).toFixed(1),
  }));
  return {
    _slug: 'pie',
    chart: 'pie',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    label: 'label',
    value: 'value',
    labelPlacement: pick(['inside', 'outside', 'none', undefined]),
    data,
  };
}

function makeDonut() {
  const n = pick([2, 4, 7, 15]);
  const data = range(n).map((i) => ({
    label: `${pick(WORDS)} ${i + 1}`,
    value: +(rand() * 100 + 1).toFixed(1),
  }));
  return {
    _slug: 'donut',
    chart: 'donut',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    label: 'label',
    value: 'value',
    labelPlacement: pick(['inside', 'outside', 'none', undefined]),
    innerRadius: pick(['thin', 'medium', 'thick']),
    centerValue: 'sum',
    centerLabel: 'total',
    data,
  };
}

function makeBarSplit() {
  const seriesCount = pick([3, 4, 6]);
  const years = pick([4, 8]);
  const seriesNames = range(seriesCount).map((i) => `Panel ${i + 1}`);
  const data = range(years).map((i) => {
    const row = { year: 2015 + i };
    for (const s of seriesNames) row[s] = +(rand() * 50 + 1).toFixed(1);
    return row;
  });
  return {
    _slug: 'bar-split',
    chart: 'bar-split',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'year',
    y: seriesNames,
    columns: pick([undefined, 2, 3]),
    sharedScale: rand() < 0.5,
    data,
  };
}

function makeLineSplit() {
  const seriesCount = pick([3, 4, 6]);
  const n = pick([5, 10, 20]);
  const seriesNames = range(seriesCount).map((i) => `Country ${i + 1}`);
  const data = range(n).map((i) => {
    const row = { year: 2005 + i };
    for (const s of seriesNames) row[s] = +(rand() * 100 + 20 + i * 3).toFixed(1);
    return row;
  });
  return {
    _slug: 'line-split',
    chart: 'line-split',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'year',
    y: seriesNames,
    columns: pick([undefined, 2, 3]),
    sharedScale: rand() < 0.5,
    interpolation: pick(['linear', 'curved']),
    data,
  };
}

function makeGeo() {
  const basemap = pick(['world', 'europe', 'asia', 'usa-states']);
  const codesByMap = {
    world: ['USA', 'CHN', 'IND', 'BRA', 'DEU', 'FRA', 'JPN', 'GBR', 'CAN', 'AUS', 'RUS', 'MEX', 'ZAF'],
    europe: ['DEU', 'FRA', 'ESP', 'ITA', 'POL', 'NLD', 'BEL', 'AUT', 'SWE', 'PRT'],
    asia: ['CHN', 'IND', 'JPN', 'KOR', 'IDN', 'PHL', 'THA', 'VNM', 'MYS'],
    'usa-states': ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'],
  };
  const codes = codesByMap[basemap];
  const data = codes.map((c) => ({ code: c, value: +(rand() * 900 + 10).toFixed(1) }));
  return {
    _slug: 'geo',
    chart: 'geo',
    title: longTitle(),
    subtitle: longSubtitle(),
    source: longSource(),
    palette: pick(PALETTES),
    size: pick(SIZES),
    basemap,
    code: 'code',
    value: 'value',
    scale: pick(['linear', 'stepped', 'diverging']),
    steps: pick([3, 5, 7]),
    data,
  };
}

function makePercentEdgeLine() {
  const asFraction = rand() < 0.5;
  const data = range(10).map((i) => ({
    year: 2015 + i,
    share: asFraction ? +(0.01 + rand() * 0.4).toFixed(3) : +(rand() * 75 + 5).toFixed(1),
  }));
  return {
    _slug: asFraction ? 'percent-fraction' : 'percent-prescaled',
    chart: 'line',
    title: asFraction ? 'Fractional percent (0..1)' : 'Already-scaled percent (0..100)',
    subtitle: 'Formatter must pick the right scale automatically',
    source: 'synthetic',
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'year',
    y: 'share',
    yFormat: 'percent',
    interpolation: 'curved',
    showValueLabels: 'last',
    data,
  };
}

function makeZeroRange() {
  const n = pick([5, 10]);
  const k = 42;
  const data = range(n).map((i) => ({ year: 2015 + i, v: k }));
  return {
    _slug: 'zero-range',
    chart: 'line',
    title: 'All values equal — range is zero',
    subtitle: 'nice-scale must not divide by zero, gridlines must not collapse',
    source: 'synthetic',
    palette: pick(PALETTES),
    size: pick(SIZES),
    x: 'year',
    y: 'v',
    interpolation: 'linear',
    showSymbols: 'all',
    data,
  };
}

function makeNegatives() {
  const n = pick([6, 12]);
  const data = range(n).map((i) => ({
    year: 2010 + i,
    delta: +(rand() * 20 - 10).toFixed(2),
  }));
  return {
    _slug: 'cross-zero',
    chart: 'bar',
    title: 'Values cross zero',
    subtitle: 'Negative and positive mixed; baseline must be zero',
    source: 'synthetic',
    palette: pick(PALETTES),
    size: pick(SIZES),
    label: 'year',
    value: 'delta',
    orientation: rand() < 0.5 ? 'horizontal' : 'vertical',
    showValueLabels: true,
    data,
  };
}

const MAKERS = [
  makeLine, makeBar, makeGroupedBar, makeStackedBar, makeStackedArea,
  makeCombo, makePie, makeDonut, makeBarSplit, makeLineSplit, makeGeo,
];

function buildSpecSet() {
  const specs = [];
  specs.push(makeLine());
  specs.push(makeBar());
  specs.push(makeGroupedBar());
  specs.push(makeStackedBar());
  specs.push(makeStackedArea());
  specs.push(makeCombo());
  specs.push(makePie());
  specs.push(makeDonut());
  specs.push(makeBarSplit());
  specs.push(makeLineSplit());
  specs.push(makeGeo());
  const extras = [makePercentEdgeLine(), makeZeroRange(), makeNegatives(), pick(MAKERS)()];
  specs.push(pick(extras));

  const aspectCounts = { share: 0, square: 0, poster: 0 };
  for (const s of specs) aspectCounts[s.size]++;
  for (const size of SIZES) {
    let safety = 200;
    while (aspectCounts[size] < 4 && safety-- > 0) {
      let donorIdx = -1;
      let donorCount = -1;
      for (let i = 0; i < specs.length; i++) {
        const prev = specs[i].size;
        if (prev === size) continue;
        if (aspectCounts[prev] > 4 && aspectCounts[prev] > donorCount) {
          donorIdx = i;
          donorCount = aspectCounts[prev];
        }
      }
      if (donorIdx < 0) break;
      const prev = specs[donorIdx].size;
      aspectCounts[prev]--;
      specs[donorIdx].size = size;
      aspectCounts[size]++;
    }
  }

  specs.forEach((s, i) => {
    const slug = `${String(i + 1).padStart(2, '0')}-${s._slug}-${s.size}-${s.palette}`;
    s._slug = slug;
  });
  return specs;
}

async function main() {
  const outDir = resolve(__dirname, 'renders', `round-${round}`);
  const advDir = join(outDir, 'adversarial');
  const sampledDir = join(outDir, 'sampled');
  mkdirSync(advDir, { recursive: true });
  mkdirSync(sampledDir, { recursive: true });

  const specs = buildSpecSet();
  writeFileSync(join(outDir, 'specs.json'), JSON.stringify(specs, null, 2));

  let ok = 0, failed = 0;
  for (const spec of specs) {
    const slug = spec._slug;
    const cfg = { ...spec };
    delete cfg._slug;
    try {
      const png = await render(cfg, { format: 'png' });
      const outFile = join(advDir, `${slug}.png`);
      writeFileSync(outFile, Buffer.from(png));
      ok++;
      process.stdout.write(`[adv] ${slug} ok (${png.length}B)\n`);
    } catch (err) {
      failed++;
      process.stdout.write(`[adv] ${slug} FAILED: ${err?.message ?? err}\n`);
      writeFileSync(join(advDir, `${slug}.error.txt`), String(err?.stack ?? err));
    }
  }

  const zooDirs = ['examples/charts', 'examples/charts-square', 'examples/charts-portrait'];
  const pool = [];
  for (const d of zooDirs) {
    const p = resolve(root, d);
    if (!existsSync(p)) continue;
    for (const f of readdirSync(p)) {
      if (f.endsWith('.png')) pool.push({ dir: d, file: f });
    }
  }
  const shuffled = pool.map((x) => [rand(), x]).sort((a, b) => a[0] - b[0]).slice(0, 5);
  for (const [, s] of shuffled) {
    const src = resolve(root, s.dir, s.file);
    const dst = join(sampledDir, `${s.dir.replace(/\//g, '_')}_${s.file}`);
    copyFileSync(src, dst);
  }

  writeFileSync(join(outDir, 'meta.json'), JSON.stringify({ round, seed, ok, failed, specs: specs.length }, null, 2));
  console.log(`[adv] round ${round} seed ${seed}: ${ok} ok, ${failed} failed, ${shuffled.length} sampled zoo PNGs`);
}

main();

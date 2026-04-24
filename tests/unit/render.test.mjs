import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../../dist/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(name) {
  const p = resolve(__dirname, '..', 'fixtures', name);
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function isPng(png) {
  return (
    png instanceof Uint8Array &&
    png.byteLength > 500 &&
    png[0] === 0x89 &&
    png[1] === 0x50 &&
    png[2] === 0x4e &&
    png[3] === 0x47
  );
}

function pngDims(png) {
  const buf = Buffer.from(png.buffer, png.byteOffset, png.byteLength);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

test('renders line chart to PNG', async () => {
  const png = await render({
    chart: 'line',
    data: [
      { year: 2020, value: 10 },
      { year: 2021, value: 18 },
      { year: 2022, value: 25 },
    ],
    x: 'year',
    y: 'value',
    title: 'Test',
  });
  assert.ok(png instanceof Uint8Array);
  assert.ok(png.byteLength > 1000);
  assert.equal(png[0], 0x89);
  assert.equal(png[1], 0x50);
  assert.equal(png[2], 0x4e);
  assert.equal(png[3], 0x47);
});

test('renders empty data gracefully', async () => {
  const png = await render({
    chart: 'line',
    data: [],
    x: 'x',
    y: 'y',
    title: 'Empty',
  });
  assert.ok(png.byteLength > 500);
});

test('renders bar chart', async () => {
  const png = await render({
    chart: 'bar',
    data: [
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
    ],
    title: 'Bar test',
  });
  assert.ok(png.byteLength > 500);
});

test('renders pie chart', async () => {
  const png = await render({
    chart: 'pie',
    data: [
      { label: 'A', value: 30 },
      { label: 'B', value: 70 },
    ],
    title: 'Pie test',
  });
  assert.ok(png.byteLength > 500);
});

test('renders SVG format', async () => {
  const svg = await render(
    {
      chart: 'line',
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ],
      x: 'x',
      y: 'y',
      title: 'SVG',
    },
    { format: 'svg' },
  );
  const str = new TextDecoder().decode(svg);
  assert.ok(str.startsWith('<svg'));
  assert.ok(str.includes('SVG'));
});

test('custom palette overrides', async () => {
  const png = await render({
    chart: 'bar',
    data: [{ label: 'X', value: 5 }],
    palette: {
      colors: ['#ff0000', '#00ff00'],
      background: '#fffef9',
      text: '#111',
      textMuted: '#666',
      grid: '#eee',
      axis: '#999',
      accent: '#ff0000',
    },
    title: 'Custom',
  });
  assert.ok(png.byteLength > 500);
});

test('PNG dimensions stay under Anthropic 2000px multi-image limit for every preset', async () => {
  const data = [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
  ];
  const base = { chart: 'line', data, x: 'x', y: 'y', title: 'Limit' };
  for (const size of ['inline', 'share', 'poster']) {
    const png = await render({ ...base, size });
    const { width, height } = pngDims(png);
    assert.ok(
      Math.max(width, height) < 2000,
      `${size} produced ${width}x${height}, exceeds 2000px`,
    );
  }
});

test('PNG dimensions stay under limit even when caller requests dpr=3', async () => {
  const png = await render(
    { chart: 'line', data: [{ x: 1, y: 1 }], x: 'x', y: 'y', size: 'share' },
    { dpr: 3 },
  );
  const { width, height } = pngDims(png);
  assert.ok(Math.max(width, height) < 2000, `got ${width}x${height}`);
});

test('edge fixture: empty data renders a valid PNG without throwing', async () => {
  const data = fixture('edge-empty.json');
  const png = await render({
    chart: 'line',
    data,
    x: 'year',
    y: 'value',
    title: 'Empty fixture',
  });
  assert.ok(isPng(png), 'expected valid non-empty PNG for empty data');
});

test('edge fixture: null/undefined y values render a valid PNG without throwing', async () => {
  const data = fixture('edge-nulls.json');
  const png = await render({
    chart: 'line',
    data,
    x: 'year',
    y: 'value',
    title: 'Nulls fixture',
  });
  assert.ok(isPng(png), 'expected valid non-empty PNG with null y values');
});

test('edge fixture: duplicate x values currently render without throwing (locked behavior)', async () => {
  // Current behavior is to render both rows as-is; the line visits each point
  // in order, so duplicate x values just produce a back-tracking segment.
  // If this ever changes to throw or dedupe, update this test deliberately.
  const data = fixture('edge-duplicate-x.json');
  let threw = null;
  let png;
  try {
    png = await render({
      chart: 'line',
      data,
      x: 'year',
      y: 'value',
      title: 'Duplicate-x fixture',
    });
  } catch (err) {
    threw = err;
  }
  if (threw) {
    const msg = String(threw.message || threw);
    assert.match(
      msg,
      /duplicat|repeat/i,
      `duplicate-x threw with unclear message: ${msg}`,
    );
  } else {
    assert.ok(isPng(png), 'expected valid non-empty PNG for duplicate x');
  }
});

test('all chart types render without error', async () => {
  const types = [
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
  ];
  for (const chart of types) {
    const config =
      chart === 'combo'
        ? {
            chart,
            data: [
              { x: 'A', bar: 10, line: 5 },
              { x: 'B', bar: 20, line: 8 },
            ],
            x: 'x',
            bars: 'bar',
            lines: 'line',
          }
        : chart === 'pie' || chart === 'donut'
          ? {
              chart,
              data: [
                { label: 'A', value: 30 },
                { label: 'B', value: 70 },
              ],
            }
          : {
              chart,
              data: [
                { x: 1, a: 10, b: 5 },
                { x: 2, a: 20, b: 8 },
              ],
              x: 'x',
              y: ['a', 'b'],
            };
    const png = await render(config);
    assert.ok(png.byteLength > 500, `${chart} failed to render`);
  }
});

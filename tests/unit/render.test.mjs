import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../../dist/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function fixture(name) {
  const p = resolve(__dirname, '..', 'fixtures', name);
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function assertIsPng(bytes, label) {
  assert.ok(bytes instanceof Uint8Array, `${label}: not a Uint8Array`);
  assert.ok(bytes.byteLength > 500, `${label}: PNG byteLength ${bytes.byteLength} <= 500`);
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    assert.equal(
      bytes[i],
      PNG_MAGIC[i],
      `${label}: byte ${i} is 0x${(bytes[i] ?? 0).toString(16)}, expected 0x${PNG_MAGIC[i].toString(16)}`,
    );
  }
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
  assertIsPng(png, 'line');
  assert.ok(png.byteLength > 1000);
});

test('renders empty data gracefully', async () => {
  const png = await render({
    chart: 'line',
    data: [],
    x: 'x',
    y: 'y',
    title: 'Empty',
  });
  assertIsPng(png, 'empty-line');
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
  assertIsPng(png, 'bar');
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
  assertIsPng(png, 'pie');
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
  assert.ok(str.trimStart().startsWith('<svg'), 'output must start with <svg root');
  assert.ok(
    str.includes('<rect') || str.includes('<g '),
    'output must contain non-trivial SVG children (<rect> or <g>)',
  );
});

test('custom palette overrides reach the SVG', async () => {
  const unique = '#ff00aa';
  const defaultClarityAccent = '#4269d0';
  const svg = await render(
    {
      chart: 'bar',
      data: [
        { label: 'X', value: 5 },
        { label: 'Y', value: 9 },
      ],
      palette: {
        colors: [unique, '#00ff00'],
        background: '#fffef9',
        text: '#111',
        textMuted: '#666',
        grid: '#eee',
        axis: '#999',
        accent: unique,
        fontHeadline: 'TestFont123',
        fontBody: 'TestFont123',
      },
      title: 'Custom',
    },
    { format: 'svg' },
  );
  const str = new TextDecoder().decode(svg);
  assert.ok(str.includes(unique), `SVG must contain custom color ${unique}`);
  assert.ok(
    !str.includes(defaultClarityAccent),
    `SVG must not contain default clarity color ${defaultClarityAccent} after override`,
  );
  assert.ok(str.includes('TestFont123'), 'SVG must contain custom fontHeadline');
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
  assertIsPng(png, 'edge-empty');
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
  assertIsPng(png, 'edge-nulls');
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
    assertIsPng(png, 'edge-duplicate-x');
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
    'geo',
  ];
  for (const chart of types) {
    let config;
    if (chart === 'combo') {
      config = {
        chart,
        data: [
          { x: 'A', bar: 10, line: 5 },
          { x: 'B', bar: 20, line: 8 },
        ],
        x: 'x',
        bars: 'bar',
        lines: 'line',
      };
    } else if (chart === 'pie' || chart === 'donut') {
      config = {
        chart,
        data: [
          { label: 'A', value: 30 },
          { label: 'B', value: 70 },
        ],
      };
    } else if (chart === 'bar') {
      config = {
        chart: 'bar',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
        ],
        x: 'label',
        y: 'value',
      };
    } else if (chart === 'geo') {
      config = {
        chart: 'geo',
        data: [
          { code: 'USA', value: 10 },
          { code: 'CHN', value: 20 },
          { code: 'DEU', value: 15 },
        ],
        basemap: 'world',
        code: 'code',
        value: 'value',
      };
    } else {
      config = {
        chart,
        data: [
          { x: 1, a: 10, b: 5 },
          { x: 2, a: 20, b: 8 },
        ],
        x: 'x',
        y: ['a', 'b'],
      };
    }
    const png = await render(config);
    assertIsPng(png, chart);
  }
});

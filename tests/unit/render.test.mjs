import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../../dist/index.js';

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

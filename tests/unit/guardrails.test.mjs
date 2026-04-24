import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { render, resolvePalette } from '../../dist/index.js';
import { loadMcpSchema } from './_fixtures/load-src.mjs';

const require = createRequire(import.meta.url);
const { z } = require('zod');

// ---------- pie "Other" auto-grouping ----------

test('pie with many tiny slices auto-groups them into "Other"', async () => {
  const svg = await render(
    {
      chart: 'pie',
      data: [
        { label: 'A', value: 40 },
        { label: 'B', value: 25 },
        { label: 'C', value: 15 },
        { label: 'D', value: 10 },
        { label: 'E', value: 5 },
        { label: 'F', value: 2 },
        { label: 'G', value: 1 },
        { label: 'H', value: 1 },
        { label: 'I', value: 0.5 },
        { label: 'J', value: 0.5 },
      ],
    },
    { format: 'svg' },
  );
  const str = new TextDecoder().decode(svg);
  assert.ok(str.includes('Other'), 'expected SVG to contain an "Other" label');
});

test('pie with 5 slices does NOT group into "Other"', async () => {
  const svg = await render(
    {
      chart: 'pie',
      data: [
        { label: 'A', value: 40 },
        { label: 'B', value: 30 },
        { label: 'C', value: 20 },
        { label: 'D', value: 1 },
        { label: 'E', value: 1 },
      ],
    },
    { format: 'svg' },
  );
  const str = new TextDecoder().decode(svg);
  assert.ok(!str.includes('Other'), 'expected 5-slice pie not to group "Other"');
});

test('pie with 7 slices of similar size does NOT group (no slice under 4%)', async () => {
  const svg = await render(
    {
      chart: 'pie',
      data: [
        { label: 'A', value: 20 },
        { label: 'B', value: 18 },
        { label: 'C', value: 15 },
        { label: 'D', value: 14 },
        { label: 'E', value: 12 },
        { label: 'F', value: 11 },
        { label: 'G', value: 10 },
      ],
    },
    { format: 'svg' },
  );
  const str = new TextDecoder().decode(svg);
  assert.ok(!str.includes('Other'), 'expected no grouping when every slice is above 4%');
});

// ---------- custom palette merge ----------

test('resolvePalette merges sparse custom palette with clarity defaults', () => {
  const resolved = resolvePalette({
    name: 'brand',
    colors: ['#ff0000'],
    background: '#ffffff',
  });
  assert.equal(resolved.name, 'brand');
  assert.equal(resolved.colors[0], '#ff0000');
  assert.ok(resolved.fontHeadline && resolved.fontHeadline.length > 0, 'fontHeadline should fall through');
  assert.ok(resolved.fontBody && resolved.fontBody.length > 0, 'fontBody should fall through');
  assert.ok(resolved.grid && resolved.grid.length > 0, 'grid should fall through');
  assert.ok(resolved.axis && resolved.axis.length > 0, 'axis should fall through');
  assert.ok(resolved.text && resolved.text.length > 0, 'text should fall through');
  assert.ok(resolved.textMuted && resolved.textMuted.length > 0, 'textMuted should fall through');
});

test('resolvePalette defaults name to "custom" when not provided', () => {
  const resolved = resolvePalette({ colors: ['#111'] });
  assert.equal(resolved.name, 'custom');
});

test('resolvePalette throws for unknown built-in palette name', () => {
  assert.throws(() => resolvePalette('doesnt-exist'), /Unknown palette: doesnt-exist/);
});

test('resolvePalette(undefined) falls back to default clarity palette', () => {
  const resolved = resolvePalette(undefined);
  assert.equal(resolved.name, 'clarity');
});

test('resolvePalette looks up known palette by string', () => {
  const resolved = resolvePalette('clarity');
  assert.equal(resolved.name, 'clarity');
  assert.ok(Array.isArray(resolved.colors) && resolved.colors.length > 0);
});

// ---------- MCP zod schema ----------

test('MCP render_chart schema accepts a minimal valid config', async () => {
  const schemaFields = await loadMcpSchema();
  const schema = z.object(schemaFields);
  const result = schema.safeParse({
    chart: 'line',
    data: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ],
    x: 'x',
    y: 'y',
  });
  assert.equal(result.success, true, result.success ? '' : JSON.stringify(result.error.issues));
});

test('MCP schema rejects unknown chart types', async () => {
  const schemaFields = await loadMcpSchema();
  const schema = z.object(schemaFields);
  const result = schema.safeParse({
    chart: 'not-a-chart',
    data: [{ x: 1 }],
  });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.join('.') === 'chart'));
});

test('MCP schema requires chart field', async () => {
  const schemaFields = await loadMcpSchema();
  const schema = z.object(schemaFields);
  const result = schema.safeParse({ data: [{ x: 1 }] });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.join('.') === 'chart'));
});

test('MCP schema requires data field', async () => {
  const schemaFields = await loadMcpSchema();
  const schema = z.object(schemaFields);
  const result = schema.safeParse({ chart: 'line' });
  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((i) => i.path.join('.') === 'data'));
});

test('MCP schema accepts all 11 supported chart kinds', async () => {
  const schemaFields = await loadMcpSchema();
  const kinds = [
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
  for (const k of kinds) {
    const r = schemaFields.chart.safeParse(k);
    assert.equal(r.success, true, `expected "${k}" to be valid chart kind`);
  }
});

test('MCP schema accepts palette as string or as object', async () => {
  const schemaFields = await loadMcpSchema();
  assert.equal(schemaFields.palette.safeParse('clarity').success, true);
  assert.equal(
    schemaFields.palette.safeParse({ name: 'brand', colors: ['#f00'] }).success,
    true,
  );
  assert.equal(schemaFields.palette.safeParse(42).success, false);
});

test('MCP schema clamps width/height to sensible bounds', async () => {
  const schemaFields = await loadMcpSchema();
  assert.equal(schemaFields.width.safeParse(1200).success, true);
  assert.equal(schemaFields.width.safeParse(150).success, false);
  assert.equal(schemaFields.width.safeParse(4500).success, false);
  assert.equal(schemaFields.height.safeParse(500).success, true);
});

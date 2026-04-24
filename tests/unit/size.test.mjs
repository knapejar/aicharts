import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSize } from './_fixtures/load-src.mjs';

const mod = await loadSize();
const { SIZE_PRESETS, DEFAULT_SIZE, resolveCanvas, classifyAspect } = mod;

test('SIZE_PRESETS locks inline at 800x500 landscape', () => {
  assert.deepEqual(SIZE_PRESETS.inline, { width: 800, height: 500, aspect: 'landscape' });
});

test('SIZE_PRESETS locks share at 1200x675 landscape', () => {
  assert.deepEqual(SIZE_PRESETS.share, { width: 1200, height: 675, aspect: 'landscape' });
});

test('SIZE_PRESETS locks square at 1200x1200 square', () => {
  assert.deepEqual(SIZE_PRESETS.square, { width: 1200, height: 1200, aspect: 'square' });
});

test('SIZE_PRESETS locks poster at 1600x2000 portrait', () => {
  assert.deepEqual(SIZE_PRESETS.poster, { width: 1600, height: 2000, aspect: 'portrait' });
});

test('DEFAULT_SIZE is "square"', () => {
  assert.equal(DEFAULT_SIZE, 'square');
});

test('resolveCanvas("inline") returns 800x500 landscape canvas', () => {
  const c = resolveCanvas('inline', undefined, undefined);
  assert.equal(c.width, 800);
  assert.equal(c.height, 500);
  assert.equal(c.aspect, 'landscape');
});

test('resolveCanvas("share") returns 1200x675 landscape canvas', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.equal(c.width, 1200);
  assert.equal(c.height, 675);
  assert.equal(c.aspect, 'landscape');
});

test('resolveCanvas("square") returns 1200x1200 square canvas', () => {
  const c = resolveCanvas('square', undefined, undefined);
  assert.equal(c.width, 1200);
  assert.equal(c.height, 1200);
  assert.equal(c.aspect, 'square');
});

test('resolveCanvas("poster") returns 1600x2000 portrait canvas', () => {
  const c = resolveCanvas('poster', undefined, undefined);
  assert.equal(c.width, 1600);
  assert.equal(c.height, 2000);
  assert.equal(c.aspect, 'portrait');
});

test('resolveCanvas(undefined) falls back to the "square" default', () => {
  const c = resolveCanvas(undefined, undefined, undefined);
  assert.equal(c.width, 1200);
  assert.equal(c.height, 1200);
});

test('classifyAspect: landscape when w/h > 1.25', () => {
  assert.equal(classifyAspect(1600, 900), 'landscape');
});

test('classifyAspect: square when 0.9 <= w/h <= 1.25', () => {
  assert.equal(classifyAspect(1000, 1000), 'square');
  assert.equal(classifyAspect(1200, 1000), 'square');
});

test('classifyAspect: portrait when w/h < 0.9', () => {
  assert.equal(classifyAspect(800, 1200), 'portrait');
});

test('resolveCanvas respects explicit width/height overrides', () => {
  const c = resolveCanvas('inline', 999, 444);
  assert.equal(c.width, 999);
  assert.equal(c.height, 444);
});

test('width override without height keeps preset height', () => {
  const c = resolveCanvas('inline', 1000, undefined);
  assert.equal(c.width, 1000);
  assert.equal(c.height, 500);
});

test('height override without width keeps preset width', () => {
  const c = resolveCanvas('share', undefined, 900);
  assert.equal(c.width, 1200);
  assert.equal(c.height, 900);
});

test('padding keys match { top, right, bottom, left }', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.deepEqual(Object.keys(c.padding).sort(), ['bottom', 'left', 'right', 'top']);
});

test('inline padding floors: top>=140, bottom>=96, left/right>=56', () => {
  const c = resolveCanvas('inline', undefined, undefined);
  assert.ok(c.padding.top >= 140, `inline top ${c.padding.top} < 140`);
  assert.ok(c.padding.bottom >= 96, `inline bottom ${c.padding.bottom} < 96`);
  assert.ok(c.padding.left >= 56, `inline left ${c.padding.left} < 56`);
  assert.ok(c.padding.right >= 56, `inline right ${c.padding.right} < 56`);
});

test('padding scales with canvas size (poster > inline top and side)', () => {
  const small = resolveCanvas('inline', undefined, undefined);
  const big = resolveCanvas('poster', undefined, undefined);
  assert.ok(big.padding.top > small.padding.top, 'poster top must exceed inline top');
  assert.ok(big.padding.left > small.padding.left, 'poster side must exceed inline side');
  assert.ok(big.padding.bottom > small.padding.bottom, 'poster bottom must exceed inline bottom');
});

test('share side padding is 5% of width (>=56)', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.equal(c.padding.left, Math.max(56, Math.round(1200 * 0.05)));
  assert.equal(c.padding.right, c.padding.left);
});

test('plot.x and plot.y equal padding.left and padding.top', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.equal(c.plot.x, c.padding.left);
  assert.equal(c.plot.y, c.padding.top);
});

test('plot width = canvas.width - padding.left - padding.right', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.equal(c.plot.width, c.width - c.padding.left - c.padding.right);
});

test('plot height = canvas.height - padding.top - padding.bottom', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.equal(c.plot.height, c.height - c.padding.top - c.padding.bottom);
});

test('plot has positive area for all four presets', () => {
  for (const name of ['inline', 'share', 'square', 'poster']) {
    const c = resolveCanvas(name, undefined, undefined);
    assert.ok(c.plot.width > 0, `${name}: plot width not positive`);
    assert.ok(c.plot.height > 0, `${name}: plot height not positive`);
  }
});

test('resolveCanvas is pure: same input -> structurally equal output', () => {
  const a = resolveCanvas('share', undefined, undefined);
  const b = resolveCanvas('share', undefined, undefined);
  assert.deepEqual(a, b);
});

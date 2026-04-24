import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSize } from './_fixtures/load-src.mjs';

const mod = await loadSize();
const { SIZE_PRESETS, DEFAULT_SIZE, resolveCanvas } = mod;

// ---------- preset constants ----------

test('SIZE_PRESETS locks inline at 800x500', () => {
  assert.deepEqual(SIZE_PRESETS.inline, { width: 800, height: 500 });
});

test('SIZE_PRESETS locks share at 1200x675', () => {
  assert.deepEqual(SIZE_PRESETS.share, { width: 1200, height: 675 });
});

test('SIZE_PRESETS locks poster at 1600x2000', () => {
  assert.deepEqual(SIZE_PRESETS.poster, { width: 1600, height: 2000 });
});

test('DEFAULT_SIZE is "share"', () => {
  assert.equal(DEFAULT_SIZE, 'share');
});

// ---------- resolveCanvas(size) ----------

test('resolveCanvas("inline") returns 800x500 canvas', () => {
  const c = resolveCanvas('inline', undefined, undefined);
  assert.equal(c.width, 800);
  assert.equal(c.height, 500);
});

test('resolveCanvas("share") returns 1200x675 canvas', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.equal(c.width, 1200);
  assert.equal(c.height, 675);
});

test('resolveCanvas("poster") returns 1600x2000 canvas', () => {
  const c = resolveCanvas('poster', undefined, undefined);
  assert.equal(c.width, 1600);
  assert.equal(c.height, 2000);
});

test('resolveCanvas(undefined) falls back to the "share" default', () => {
  const c = resolveCanvas(undefined, undefined, undefined);
  assert.equal(c.width, 1200);
  assert.equal(c.height, 675);
});

// ---------- overrides ----------

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

// ---------- padding ----------

test('padding keys match { top, right, bottom, left }', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.deepEqual(Object.keys(c.padding).sort(), ['bottom', 'left', 'right', 'top']);
});

test('inline padding floors: top>=120, bottom>=72, left/right>=48', () => {
  const c = resolveCanvas('inline', undefined, undefined);
  assert.ok(c.padding.top >= 120, `inline top ${c.padding.top} < 120`);
  assert.ok(c.padding.bottom >= 72, `inline bottom ${c.padding.bottom} < 72`);
  assert.ok(c.padding.left >= 48, `inline left ${c.padding.left} < 48`);
  assert.ok(c.padding.right >= 48, `inline right ${c.padding.right} < 48`);
});

test('padding scales with canvas size (poster > inline top and side)', () => {
  const small = resolveCanvas('inline', undefined, undefined);
  const big = resolveCanvas('poster', undefined, undefined);
  assert.ok(big.padding.top > small.padding.top, 'poster top must exceed inline top');
  assert.ok(big.padding.left > small.padding.left, 'poster side must exceed inline side');
  assert.ok(big.padding.bottom > small.padding.bottom, 'poster bottom must exceed inline bottom');
});

test('poster top padding is 18% of height (360)', () => {
  const c = resolveCanvas('poster', undefined, undefined);
  assert.equal(c.padding.top, Math.round(2000 * 0.18));
});

test('share side padding is 4% of width (48)', () => {
  const c = resolveCanvas('share', undefined, undefined);
  assert.equal(c.padding.left, Math.max(48, Math.round(1200 * 0.04)));
  assert.equal(c.padding.right, c.padding.left);
});

// ---------- plot ----------

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

test('plot has positive area for all three presets', () => {
  for (const name of ['inline', 'share', 'poster']) {
    const c = resolveCanvas(name, undefined, undefined);
    assert.ok(c.plot.width > 0, `${name}: plot width not positive`);
    assert.ok(c.plot.height > 0, `${name}: plot height not positive`);
  }
});

// ---------- purity ----------

test('resolveCanvas is pure: same input -> structurally equal output', () => {
  const a = resolveCanvas('share', undefined, undefined);
  const b = resolveCanvas('share', undefined, undefined);
  assert.deepEqual(a, b);
});

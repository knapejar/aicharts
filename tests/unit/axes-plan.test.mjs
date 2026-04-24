import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAxes, loadSize } from './_fixtures/load-src.mjs';

const { planBandXAxis } = await loadAxes();
const { resolveCanvas } = await loadSize();

const shareCanvas = resolveCanvas('share');
const squareCanvas = resolveCanvas('square');
const posterCanvas = resolveCanvas('poster');

test('planBandXAxis returns horizontal layout when labels fit', () => {
  const plan = planBandXAxis(shareCanvas, ['A', 'B', 'C', 'D'], shareCanvas.width * 0.85);
  assert.equal(plan.rotate, false);
  assert.equal(plan.angle, 0);
  assert.ok(plan.bandHeight > 0);
});

test('planBandXAxis rotates when labels overflow horizontal slot', () => {
  const labels = Array.from({ length: 14 }, (_, i) => `Group ${i + 1}`);
  const plan = planBandXAxis(shareCanvas, labels, shareCanvas.width * 0.85);
  assert.equal(plan.rotate, true);
  assert.ok(plan.angle >= 40 && plan.angle <= 90, `angle ${plan.angle} out of range`);
  assert.ok(plan.bandHeight >= plan.maxCatWidth * Math.sin((plan.angle * Math.PI) / 180) - 1);
});

test('planBandXAxis escalates rotation angle as labels get denser', () => {
  const few = planBandXAxis(shareCanvas, Array.from({ length: 8 }, (_, i) => `Category ${i + 1}`), shareCanvas.width * 0.85);
  const many = planBandXAxis(shareCanvas, Array.from({ length: 20 }, (_, i) => `Category ${i + 1}`), shareCanvas.width * 0.85);
  assert.ok(many.angle >= few.angle, `dense labels should rotate at least as much: few=${few.angle} many=${many.angle}`);
});

test('planBandXAxis caps band height and sets ellipsizedWidth when labels are too long', () => {
  const longLabels = Array.from({ length: 12 }, (_, i) => `An extraordinarily long category name that should get clipped ${i + 1}`);
  const plan = planBandXAxis(shareCanvas, longLabels, shareCanvas.width * 0.85);
  assert.equal(plan.rotate, true);
  assert.ok(plan.bandHeight <= Math.round(shareCanvas.height * 0.25) + 1, `bandHeight ${plan.bandHeight} exceeds 25% cap`);
  assert.ok(plan.ellipsizedWidth != null && plan.ellipsizedWidth > 0, 'expected ellipsizedWidth to be set');
});

test('planBandXAxis produces increasing bandHeight for square/portrait vs landscape when same labels', () => {
  const labels = Array.from({ length: 14 }, (_, i) => `Quarter ${i + 1}`);
  const share = planBandXAxis(shareCanvas, labels, shareCanvas.width * 0.85);
  const square = planBandXAxis(squareCanvas, labels, squareCanvas.width * 0.85);
  const poster = planBandXAxis(posterCanvas, labels, posterCanvas.width * 0.85);
  for (const p of [share, square, poster]) {
    assert.equal(p.rotate, true);
    assert.ok(p.bandHeight > 0);
  }
  assert.ok(
    poster.bandHeight >= share.bandHeight,
    `poster ${poster.bandHeight} should be >= share ${share.bandHeight} since fonts are larger`,
  );
});

test('planBandXAxis with empty categories returns zero rotation and a baseline height', () => {
  const plan = planBandXAxis(shareCanvas, [], shareCanvas.width * 0.85);
  assert.equal(plan.rotate, false);
  assert.ok(plan.bandHeight > 0);
  assert.equal(plan.ellipsizedWidth, null);
});

test('planBandXAxis never drops categories (stride-free)', () => {
  // Spec assertion: the plan does not thin labels. Height adjusts to accommodate ALL categories.
  const labels = Array.from({ length: 30 }, (_, i) => `Category ${i + 1}`);
  const plan = planBandXAxis(shareCanvas, labels, shareCanvas.width * 0.85);
  // No "stride" field exists in the plan — rotation + ellipsis must be the only toggle.
  assert.ok(!('stride' in plan), 'plan must not carry a stride — every label must render');
});

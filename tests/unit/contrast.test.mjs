import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  relativeLuminance,
  contrastRatio,
  ensureReadable,
  resolvePalette,
} from '../../dist/index.js';

test('relativeLuminance of white is 1 and black is 0', () => {
  assert.ok(Math.abs(relativeLuminance('#ffffff') - 1) < 1e-6);
  assert.ok(Math.abs(relativeLuminance('#000000')) < 1e-6);
});

test('relativeLuminance handles 3-digit shorthand', () => {
  assert.ok(Math.abs(relativeLuminance('#fff') - relativeLuminance('#ffffff')) < 1e-6);
  assert.ok(Math.abs(relativeLuminance('#000') - relativeLuminance('#000000')) < 1e-6);
});

test('contrastRatio of black on white is ~21', () => {
  const ratio = contrastRatio('#000', '#fff');
  assert.ok(Math.abs(ratio - 21) < 0.01, `expected ~21, got ${ratio}`);
});

test('contrastRatio is symmetric', () => {
  assert.ok(Math.abs(contrastRatio('#123456', '#abcdef') - contrastRatio('#abcdef', '#123456')) < 1e-9);
});

test('contrastRatio of #777 and #888 is below 4.5', () => {
  const ratio = contrastRatio('#777', '#888');
  assert.ok(ratio < 4.5, `expected below 4.5, got ${ratio}`);
});

test('ensureReadable darkens light fg against white background', () => {
  const out = ensureReadable('#cccccc', '#ffffff', 4.5);
  assert.notEqual(out.toLowerCase(), '#cccccc');
  assert.ok(contrastRatio(out, '#ffffff') >= 4.5);
});

test('ensureReadable returns fg unchanged when already passing', () => {
  const out = ensureReadable('#333333', '#ffffff', 4.5);
  assert.equal(out.toLowerCase(), '#333333');
});

test('ensureReadable lightens dark fg against black background', () => {
  const out = ensureReadable('#222222', '#000000', 4.5);
  assert.notEqual(out.toLowerCase(), '#222222');
  assert.ok(contrastRatio(out, '#000000') >= 4.5);
});

test('ensureReadable falls back to pure endpoints when adjustments insufficient', () => {
  const outOnWhite = ensureReadable('#ffffff', '#ffffff', 4.5);
  assert.ok(contrastRatio(outOnWhite, '#ffffff') >= 4.5);
  const outOnBlack = ensureReadable('#000000', '#000000', 4.5);
  assert.ok(contrastRatio(outOnBlack, '#000000') >= 4.5);
});

test('resolvePalette guards low-contrast custom palette text', () => {
  const resolved = resolvePalette({
    name: 'bad-brand',
    colors: ['#112233'],
    fontHeadline: 'Inter',
    fontBody: 'Inter',
    background: '#fefefe',
    text: '#e0e0e0',
    textMuted: '#ededed',
    grid: '#eee',
    axis: '#ccc',
    accent: '#ff0000',
  });
  assert.ok(
    contrastRatio(resolved.text, resolved.background) >= 4.5,
    `text ratio too low: ${contrastRatio(resolved.text, resolved.background)}`,
  );
  assert.ok(
    contrastRatio(resolved.textMuted, resolved.background) >= 3.0,
    `textMuted ratio too low: ${contrastRatio(resolved.textMuted, resolved.background)}`,
  );
  assert.deepEqual(resolved.colors, ['#112233']);
  assert.equal(resolved.grid, '#eee');
  assert.equal(resolved.axis, '#ccc');
});

test('resolvePalette leaves high-contrast built-in palettes unchanged', () => {
  const resolved = resolvePalette('clarity');
  assert.equal(resolved.text.toLowerCase(), '#1c1e21');
  assert.equal(resolved.textMuted.toLowerCase(), '#61676f');
});

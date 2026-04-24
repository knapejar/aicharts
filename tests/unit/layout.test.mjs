import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLayout, loadSize, loadTheme, loadSvg } from './_fixtures/load-src.mjs';

const layout = await loadLayout();
const size = await loadSize();
const theme = await loadTheme();
const svg = await loadSvg();

const {
  titleFontSize,
  subtitleFontSize,
  labelFontSize,
  axisFontSize,
  renderHeader,
  renderFooter,
  renderLegend,
  reservedHeaderHeight,
  headerBottomY,
} = layout;

const { resolveCanvas } = size;
const { resolvePalette } = theme;
const { serialize } = svg;

const palette = resolvePalette(undefined);

function canvas(name = 'share') {
  return resolveCanvas(name, undefined, undefined);
}

// ---------- font size helpers ----------

test('titleFontSize grows with canvas width, clamped to [18, 32]', () => {
  const inlineT = titleFontSize(canvas('inline'));
  const posterT = titleFontSize(canvas('poster'));
  assert.ok(inlineT >= 18 && inlineT <= 32, `inline title out of range: ${inlineT}`);
  assert.ok(posterT >= 18 && posterT <= 32, `poster title out of range: ${posterT}`);
  assert.ok(posterT >= inlineT, 'poster title should be >= inline title');
});

test('subtitleFontSize is ~66% of title size', () => {
  const c = canvas('share');
  assert.equal(subtitleFontSize(c), Math.round(titleFontSize(c) * 0.66));
});

test('labelFontSize is clamped to [11, 14]', () => {
  for (const s of ['inline', 'share', 'poster']) {
    const v = labelFontSize(canvas(s));
    assert.ok(v >= 11 && v <= 14, `${s}: label size ${v} out of [11,14]`);
  }
});

test('axisFontSize equals labelFontSize', () => {
  const c = canvas('share');
  assert.equal(axisFontSize(c), labelFontSize(c));
});

// ---------- reservedHeaderHeight / headerBottomY ----------

test('reservedHeaderHeight(false,false) is 0', () => {
  assert.equal(reservedHeaderHeight(canvas(), false, false), 0);
});

test('reservedHeaderHeight grows when title and subtitle are added', () => {
  const c = canvas('share');
  const none = reservedHeaderHeight(c, false, false);
  const titleOnly = reservedHeaderHeight(c, true, false);
  const both = reservedHeaderHeight(c, true, true);
  assert.ok(titleOnly > none, 'title alone must reserve more than nothing');
  assert.ok(both > titleOnly, 'title + subtitle must reserve more than title alone');
});

test('headerBottomY returns a non-negative y offset', () => {
  const c = canvas('share');
  assert.ok(headerBottomY(c, false, false) >= 0);
  assert.ok(headerBottomY(c, true, false) > 0);
  assert.ok(headerBottomY(c, true, true) >= headerBottomY(c, true, false));
});

// ---------- renderHeader ----------

test('renderHeader returns [] when no title or subtitle', () => {
  const out = renderHeader({ palette, canvas: canvas('share') });
  assert.deepEqual(out, []);
});

test('renderHeader emits a title text node with font-weight 700', () => {
  const out = renderHeader({ title: 'Hello', palette, canvas: canvas('share') });
  assert.equal(out.length, 1);
  const str = serialize(out[0]);
  assert.ok(str.includes('>Hello</text>'), `expected title body in: ${str}`);
  assert.ok(str.includes('font-weight="700"'), `expected bold title: ${str}`);
});

test('renderHeader title+subtitle emits two nodes in order', () => {
  const out = renderHeader({
    title: 'T',
    subtitle: 'S',
    palette,
    canvas: canvas('share'),
  });
  assert.equal(out.length, 2);
  assert.ok(serialize(out[0]).includes('>T</text>'));
  assert.ok(serialize(out[1]).includes('>S</text>'));
});

test('renderHeader subtitle-only still emits the subtitle', () => {
  const out = renderHeader({ subtitle: 'Only', palette, canvas: canvas('share') });
  assert.equal(out.length, 1);
  assert.ok(serialize(out[0]).includes('>Only</text>'));
});

// ---------- renderFooter ----------

test('renderFooter with no source still emits the logo by default', () => {
  const out = renderFooter({ palette, canvas: canvas('share') });
  assert.ok(out.length >= 1, 'logo group should be emitted');
  const body = out.map(serialize).join('');
  assert.ok(body.includes('aicharts'), 'logo text should say "aicharts"');
});

test('renderFooter logo: "none" suppresses the logo group', () => {
  const out = renderFooter({ logo: 'none', palette, canvas: canvas('share') });
  const body = out.map(serialize).join('');
  assert.ok(!body.includes('aicharts'), 'logo must be suppressed');
});

test('renderFooter source is prefixed with "Source: " when not already', () => {
  const out = renderFooter({
    source: 'World Bank',
    logo: 'none',
    palette,
    canvas: canvas('share'),
  });
  const body = out.map(serialize).join('');
  assert.ok(body.includes('Source: World Bank'), `missing prefix: ${body}`);
});

test('renderFooter source already starting with "Source" is not double-prefixed', () => {
  const out = renderFooter({
    source: 'Source: NASA',
    logo: 'none',
    palette,
    canvas: canvas('share'),
  });
  const body = out.map(serialize).join('');
  assert.ok(body.includes('Source: NASA'), 'expected source text');
  assert.ok(!body.includes('Source: Source: NASA'), 'must not double-prefix');
});

// ---------- renderLegend ----------

test('renderLegend returns [] for empty items', () => {
  const out = renderLegend({ items: [], palette, canvas: canvas('share'), y: 100 });
  assert.deepEqual(out, []);
});

test('renderLegend emits a swatch + label per solid item', () => {
  const out = renderLegend({
    items: [
      { label: 'A', color: '#f00' },
      { label: 'B', color: '#0f0' },
    ],
    palette,
    canvas: canvas('share'),
    y: 100,
  });
  const body = out.map(serialize).join('');
  assert.ok(body.includes('>A</text>'));
  assert.ok(body.includes('>B</text>'));
  assert.ok(body.includes('fill="#f00"'));
  assert.ok(body.includes('fill="#0f0"'));
});

test('renderLegend uses a dashed line swatch when dash="dashed"', () => {
  const out = renderLegend({
    items: [{ label: 'D', color: '#00f', dash: 'dashed' }],
    palette,
    canvas: canvas('share'),
    y: 100,
  });
  const body = out.map(serialize).join('');
  assert.ok(body.includes('stroke="#00f"'), 'dashed item should stroke with color');
  assert.ok(body.includes('stroke-dasharray="4 2"'), `expected dashed pattern, got ${body}`);
});

test('renderLegend wraps onto a new line when items exceed canvas width', () => {
  const items = Array.from({ length: 30 }, (_, i) => ({
    label: `VeryLongLegendEntry${i}`,
    color: '#123456',
  }));
  const c = canvas('inline');
  const out = renderLegend({ items, palette, canvas: c, y: 100 });
  const yValues = new Set();
  for (const node of out) {
    if (node.tag === 'text' && typeof node.attrs.y === 'number') {
      yValues.add(node.attrs.y);
    }
  }
  assert.ok(yValues.size > 1, 'long legends must wrap to multiple lines');
});

// ---------- header reserves enough room for chart ----------

test('a long title does not collapse chart area: header height < canvas height', () => {
  const c = canvas('inline');
  const reserved = reservedHeaderHeight(c, true, true);
  assert.ok(reserved < c.height, 'header reservation must leave room for plot');
  assert.ok(c.height - c.padding.top - c.padding.bottom > 0, 'plot area must stay positive');
});

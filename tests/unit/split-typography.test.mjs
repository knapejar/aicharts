import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../../dist/index.js';
import { loadSize, loadFrame } from './_fixtures/load-src.mjs';

async function renderSvg(cfg) {
  const bytes = await render(cfg, { format: 'svg' });
  return new TextDecoder().decode(bytes);
}

const { resolveCanvas } = await loadSize();
const { smallFont } = await loadFrame();

function parseFontSizes(svg) {
  const out = [];
  const re = /<text[^>]*font-size="([^"]*)"[^>]*>([^<]*)<\/text>/g;
  let m;
  while ((m = re.exec(svg)) !== null) {
    out.push({ size: parseFloat(m[1]), text: m[2] });
  }
  return out;
}

const PRESETS = ['share', 'square', 'poster'];

const barSplitSpec = {
  chart: 'bar-split',
  title: 'Title',
  subtitle: 'Subtitle',
  source: 'Src',
  palette: 'clarity',
  x: 'year',
  y: ['A', 'B', 'C'],
  sharedScale: true,
  columns: 3,
  data: [
    { year: 2020, A: 10, B: 20, C: 30 },
    { year: 2021, A: 40, B: 50, C: 60 },
    { year: 2022, A: 70, B: 80, C: 90 },
  ],
};

const lineSplitSpec = {
  chart: 'line-split',
  title: 'Title',
  subtitle: 'Subtitle',
  source: 'Src',
  palette: 'clarity',
  x: 'year',
  y: ['A', 'B', 'C'],
  sharedScale: true,
  columns: 3,
  data: [
    { year: 2020, A: 10, B: 20, C: 30 },
    { year: 2021, A: 25, B: 45, C: 65 },
    { year: 2022, A: 40, B: 70, C: 85 },
    { year: 2023, A: 55, B: 85, C: 95 },
  ],
};

for (const preset of PRESETS) {
  test(`bar-split preset=${preset} uses no text below smallFont`, async () => {
    const canvas = resolveCanvas(preset);
    const expected = smallFont(canvas);
    const svg = await renderSvg({ ...barSplitSpec, size: preset });
    const sizes = parseFontSizes(svg);
    assert.ok(sizes.length > 0, 'svg contained no text elements');
    const tiny = sizes.filter(
      (s) => s.size < expected - 0.5 && s.text && !['aicharts', ''].includes(s.text.trim()),
    );
    assert.equal(
      tiny.length,
      0,
      `bar-split has ${tiny.length} text elements below smallFont=${expected}: ${tiny
        .slice(0, 5)
        .map((s) => `"${s.text}"@${s.size}`)
        .join(', ')}`,
    );
  });

  test(`line-split preset=${preset} uses no text below smallFont`, async () => {
    const canvas = resolveCanvas(preset);
    const expected = smallFont(canvas);
    const svg = await renderSvg({ ...lineSplitSpec, size: preset });
    const sizes = parseFontSizes(svg);
    assert.ok(sizes.length > 0, 'svg contained no text elements');
    const tiny = sizes.filter(
      (s) => s.size < expected - 0.5 && s.text && !['aicharts', ''].includes(s.text.trim()),
    );
    assert.equal(
      tiny.length,
      0,
      `line-split has ${tiny.length} text elements below smallFont=${expected}: ${tiny
        .slice(0, 5)
        .map((s) => `"${s.text}"@${s.size}`)
        .join(', ')}`,
    );
  });
}

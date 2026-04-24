import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadFrame, loadSize } from './_fixtures/load-src.mjs';

const frameMod = await loadFrame();
const sizeMod = await loadSize();

const { computeFrame, boxesOverlap, boxContains, outerMargin, bigFont, smallFont } = frameMod;
const { resolveCanvas } = sizeMod;

const PRESETS = ['inline', 'share', 'square', 'poster'];

function canvas(name) {
  return resolveCanvas(name, undefined, undefined);
}

function allBoxes(frame) {
  const out = [];
  if (frame.title) out.push(['title', frame.title]);
  if (frame.subtitle) out.push(['subtitle', frame.subtitle]);
  if (frame.legend) out.push(['legend', frame.legend]);
  out.push(['yTickBand', frame.yTickBand]);
  out.push(['plot', frame.plot]);
  out.push(['xTickBand', frame.xTickBand]);
  if (frame.source) out.push(['source', frame.source]);
  if (frame.logo) out.push(['logo', frame.logo]);
  return out;
}

function stackBoxes(frame) {
  const out = [];
  if (frame.title) out.push(['title', frame.title]);
  if (frame.subtitle) out.push(['subtitle', frame.subtitle]);
  if (frame.legend) out.push(['legend', frame.legend]);
  out.push(['plot', frame.plot]);
  if (frame.source || frame.logo) {
    const footer = frame.source ?? frame.logo;
    out.push(['footer', footer]);
  }
  return out;
}

// ---------- outer margin is strictly positive and per-preset ----------

test('outerMargin is strictly positive for every preset', () => {
  for (const s of PRESETS) {
    const m = outerMargin(canvas(s));
    assert.ok(m >= 16, `${s}: margin ${m} < 16`);
  }
});

test('square preset has the reference 48px outer margin', () => {
  const m = outerMargin(canvas('square'));
  assert.equal(m, 48);
});

// ---------- every region lives inside inner ----------

test('all regions contained in inner rect for every preset, every config', () => {
  const configs = [
    {},
    { title: 'Title only' },
    { title: 'T', subtitle: 'S' },
    { title: 'T', subtitle: 'S', source: 'World Bank' },
    { title: 'T', subtitle: 'S', source: 'W', logo: 'default' },
    {
      title: 'T',
      subtitle: 'S',
      source: 'W',
      logo: 'default',
      hasLegend: true,
      legendLabels: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    },
  ];
  for (const preset of PRESETS) {
    const c = canvas(preset);
    for (const opts of configs) {
      const f = computeFrame(c, opts);
      for (const [name, box] of allBoxes(f)) {
        assert.ok(
          boxContains(f.inner, box),
          `${preset} ${JSON.stringify(opts)}: ${name} box ${JSON.stringify(box)} not inside inner ${JSON.stringify(f.inner)}`,
        );
      }
    }
  }
});

// ---------- no overlap between stacked regions ----------

test('header stack regions do not overlap with plot or with each other', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, {
      title: 'Long stacked header',
      subtitle: 'And a subtitle that wraps to maybe two lines to stress the layout',
      source: 'World Bank',
      logo: 'default',
      hasLegend: true,
      legendLabels: ['alpha', 'beta', 'gamma', 'delta'],
    });
    const stack = stackBoxes(f);
    for (let i = 0; i < stack.length; i++) {
      for (let j = i + 1; j < stack.length; j++) {
        const [an, ab] = stack[i];
        const [bn, bb] = stack[j];
        assert.ok(
          !boxesOverlap(ab, bb),
          `${preset}: ${an} ${JSON.stringify(ab)} overlaps ${bn} ${JSON.stringify(bb)}`,
        );
      }
    }
  }
});

// ---------- header stack stays in top->bottom order ----------

test('title is above subtitle is above legend is above plot is above footer', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, {
      title: 'T',
      subtitle: 'S',
      source: 'Src',
      logo: 'default',
      hasLegend: true,
      legendLabels: ['a', 'b'],
    });
    assert.ok(f.title.y + f.title.height <= f.subtitle.y + 0.5, 'title above subtitle');
    assert.ok(f.subtitle.y + f.subtitle.height <= f.legend.y + 0.5, 'subtitle above legend');
    assert.ok(f.legend.y + f.legend.height <= f.plot.y + 0.5, 'legend above plot');
    assert.ok(f.plot.y + f.plot.height <= f.xTickBand.y + 0.5, 'plot above xTicks');
    assert.ok(f.xTickBand.y + f.xTickBand.height <= f.source.y + 0.5, 'xTicks above source');
  }
});

// ---------- fixed outer margin respected at all four edges ----------

test('title touches the left margin', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, { title: 'T' });
    assert.equal(f.title.x, f.margin.left);
  }
});

test('source touches the left margin', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, { source: 'Src' });
    assert.equal(f.source.x, f.margin.left);
  }
});

test('logo right edge touches the right margin', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, { logo: 'default' });
    assert.equal(f.logo.x + f.logo.width, c.width - f.margin.right);
  }
});

test('title top edge touches the top margin', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, { title: 'T' });
    assert.equal(f.title.y, f.margin.top);
  }
});

test('inner rect exactly equals canvas minus margin on every side', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, {});
    assert.equal(f.inner.x, f.margin.left);
    assert.equal(f.inner.y, f.margin.top);
    assert.equal(f.inner.x + f.inner.width, c.width - f.margin.right);
    assert.equal(f.inner.y + f.inner.height, c.height - f.margin.bottom);
  }
});

// ---------- plot has enforced minimum size ----------

test('plot width is at least 40% of canvas width and height is at least 25%', () => {
  for (const preset of PRESETS) {
    const c = canvas(preset);
    const f = computeFrame(c, {
      title: 'A very long title that could eat into the plot if unchecked, keep pushing',
      subtitle: 'Same for the subtitle, add more and more words to try to push the plot out of view',
      source: 'Source: stressed',
      logo: 'default',
      hasLegend: true,
      legendLabels: Array.from({ length: 12 }, (_, i) => `series-${i}`),
    });
    assert.ok(f.plot.width >= c.width * 0.4 - 1, `${preset}: plot too narrow ${f.plot.width}`);
    assert.ok(f.plot.height >= c.height * 0.25 - 1, `${preset}: plot too short ${f.plot.height}`);
  }
});

// ---------- y ticks band is to the left of plot, x ticks below ----------

test('yTickBand sits immediately to the left of plot, same y and height', () => {
  const f = computeFrame(canvas('square'), { title: 'T' });
  assert.equal(f.yTickBand.x + f.yTickBand.width, f.plot.x);
  assert.equal(f.yTickBand.y, f.plot.y);
  assert.equal(f.yTickBand.height, f.plot.height);
});

test('xTickBand sits immediately below plot, same x and width', () => {
  const f = computeFrame(canvas('square'), { title: 'T' });
  assert.equal(f.xTickBand.x, f.plot.x);
  assert.equal(f.xTickBand.width, f.plot.width);
  assert.ok(f.xTickBand.y >= f.plot.y + f.plot.height);
});

// ---------- font floors ----------

test('big font always larger than small font on every preset', () => {
  for (const s of PRESETS) {
    const c = canvas(s);
    assert.ok(bigFont(c) > smallFont(c), `${s}: big not > small`);
  }
});

test('small font floor is 18', () => {
  for (const s of PRESETS) {
    const c = canvas(s);
    assert.ok(smallFont(c) >= 18, `${s}: small ${smallFont(c)} < 18`);
  }
});

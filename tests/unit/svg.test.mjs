import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSvg } from './_fixtures/load-src.mjs';

const svg = await loadSvg();
const { h, text, g, rect, line, path, circle, polygon, serialize, svgDocument, estimateTextWidth } =
  svg;

// ---------- text + escaping ----------

test('text() escapes < > & " \' in body', () => {
  const node = text(`a < b & c > d "quoted" 'apos'`);
  const out = serialize(node);
  assert.ok(out.includes('&lt;'), 'missing &lt;');
  assert.ok(out.includes('&gt;'), 'missing &gt;');
  assert.ok(out.includes('&amp;'), 'missing &amp;');
  assert.ok(out.includes('&quot;'), 'missing &quot;');
  assert.ok(out.includes('&#39;'), 'missing &#39;');
  assert.ok(!/[^&]<[^\/a-z]/.test(out), 'raw < leaked into body');
});

test('text() renders as paired tag with body (not self-closing)', () => {
  const out = serialize(text('hello', { x: 10, y: 20 }));
  assert.equal(out, '<text x="10" y="20">hello</text>');
});

test('serialize escapes attribute values too', () => {
  const out = serialize(rect({ x: 0, y: 0, width: 10, height: 10, 'data-note': 'a<b&c' }));
  assert.ok(out.includes('data-note="a&lt;b&amp;c"'), 'attr value not escaped: ' + out);
});

// ---------- rect / line / path / group ----------

test('rect() produces self-closing <rect> with attributes', () => {
  const out = serialize(rect({ x: 1, y: 2, width: 3, height: 4, fill: '#fff' }));
  assert.equal(out, '<rect x="1" y="2" width="3" height="4" fill="#fff"/>');
});

test('line() prepends x1/y1/x2/y2 and serializes self-closing', () => {
  const out = serialize(line(0, 0, 10, 20, { stroke: '#000' }));
  assert.equal(out, '<line x1="0" y1="0" x2="10" y2="20" stroke="#000"/>');
});

test('path() prepends d and serializes self-closing', () => {
  const out = serialize(path('M0 0 L10 10', { fill: 'none', stroke: '#000' }));
  assert.equal(out, '<path d="M0 0 L10 10" fill="none" stroke="#000"/>');
});

test('circle() prepends cx/cy/r and serializes self-closing', () => {
  const out = serialize(circle(5, 10, 3, { fill: '#f00' }));
  assert.equal(out, '<circle cx="5" cy="10" r="3" fill="#f00"/>');
});

test('polygon() joins points as "x,y x,y ..." in the points attribute', () => {
  const out = serialize(
    polygon(
      [
        [0, 0],
        [10, 0],
        [10, 10],
      ],
      { fill: '#0f0' },
    ),
  );
  assert.equal(out, '<polygon points="0,0 10,0 10,10" fill="#0f0"/>');
});

test('g() produces paired <g>...</g> wrapping children', () => {
  const out = serialize(
    g({ transform: 'translate(5 5)' }, [rect({ x: 0, y: 0, width: 1, height: 1 })]),
  );
  assert.equal(out, '<g transform="translate(5 5)"><rect x="0" y="0" width="1" height="1"/></g>');
});

test('h() with no children self-closes; with children renders paired', () => {
  assert.equal(serialize(h('foo', { a: 1 })), '<foo a="1"/>');
  const withKid = h('foo', { a: 1 }, [rect({ x: 0 })]);
  assert.equal(serialize(withKid), '<foo a="1"><rect x="0"/></foo>');
});

// ---------- attribute order + falsy handling ----------

test('attribute order follows insertion order (Object.entries)', () => {
  const out = serialize(rect({ b: 2, a: 1, c: 3 }));
  assert.equal(out, '<rect b="2" a="1" c="3"/>');
});

test('attributes with undefined/null/false are skipped; 0 and "" are kept', () => {
  const out = serialize(
    rect({ x: 0, y: null, width: undefined, height: false, fill: '', stroke: '#000' }),
  );
  assert.equal(out, '<rect x="0" fill="" stroke="#000"/>');
});

// ---------- numeric serialization ----------

test('numeric attributes stringify via String(v); very small numbers become scientific notation', () => {
  const out = serialize(rect({ x: 0.0000001, y: 1e20, width: 1.5, height: 0 }));
  assert.ok(out.includes('x="1e-7"'), `expected x="1e-7" in ${out}`);
  assert.ok(
    out.includes('y="100000000000000000000"'),
    `expected y="100000000000000000000" in ${out}`,
  );
  assert.ok(out.includes('width="1.5"'));
  assert.ok(out.includes('height="0"'));
});

test('large integer-ish numbers render without separators', () => {
  const out = serialize(rect({ width: 1234567 }));
  assert.ok(out.includes('width="1234567"'), `no separators: ${out}`);
});

// ---------- string nodes ----------

test('serialize() on a plain string escapes it as text content', () => {
  assert.equal(serialize('<b>hi</b>'), '&lt;b&gt;hi&lt;/b&gt;');
});

// ---------- svgDocument ----------

test('svgDocument produces well-formed root with xmlns, width, height, viewBox, font-family', () => {
  const doc = svgDocument(
    120,
    80,
    '#fff',
    [rect({ x: 0, y: 0, width: 120, height: 80, fill: '#eee' })],
    'Inter',
  );
  assert.ok(doc.startsWith('<svg'), 'root must be <svg>');
  assert.ok(doc.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(doc.includes('width="120"'));
  assert.ok(doc.includes('height="80"'));
  assert.ok(doc.includes('viewBox="0 0 120 80"'));
  assert.ok(doc.includes('font-family="Inter"'));
  assert.ok(doc.includes('fill="#fff"'), 'background rect must be emitted first');
});

test('svgDocument prepends a background rect before user children', () => {
  const doc = svgDocument(
    10,
    10,
    '#abc',
    [rect({ x: 1, y: 1, width: 2, height: 2, fill: '#000' })],
    'X',
  );
  const bgIndex = doc.indexOf('fill="#abc"');
  const userIndex = doc.indexOf('fill="#000"');
  assert.ok(bgIndex > 0 && userIndex > bgIndex, 'background must come before user content');
});

// ---------- estimateTextWidth ----------

test('estimateTextWidth returns 0 for empty string', () => {
  assert.equal(estimateTextWidth('', 12), 0);
});

test('estimateTextWidth grows with font size and string length', () => {
  const a = estimateTextWidth('hello', 12);
  const b = estimateTextWidth('hello', 24);
  const c = estimateTextWidth('hello world', 12);
  assert.ok(b > a, 'larger font must be wider');
  assert.ok(c > a, 'longer string must be wider');
});

test('estimateTextWidth narrow glyphs count less than wide glyphs', () => {
  const thin = estimateTextWidth('iiii', 20);
  const wide = estimateTextWidth('MMMM', 20);
  assert.ok(wide > thin, 'M wider than i');
});

// ---------- determinism ----------

test('serialize is deterministic: same input -> same string', () => {
  const node = g({ id: 'x' }, [
    rect({ x: 1, y: 2, width: 3, height: 4, fill: '#000' }),
    text('hi', { x: 5, y: 6, 'font-size': 12 }),
  ]);
  assert.equal(serialize(node), serialize(node));
});

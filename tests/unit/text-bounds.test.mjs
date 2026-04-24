import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

async function bundleAndImport(entry) {
  const result = await build({
    stdin: { contents: entry, resolveDir: repoRoot, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'node',
    external: ['@resvg/*'],
    write: false,
    absWorkingDir: repoRoot,
  });
  const outDir = resolve(here, '_out');
  mkdirSync(outDir, { recursive: true });
  const file = resolve(
    outDir,
    `text-bounds-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mjs`,
  );
  writeFileSync(file, result.outputFiles[0].text);
  try {
    return await import(pathToFileURL(file).href);
  } finally {
    try { rmSync(file); } catch {}
  }
}

const mod = await bundleAndImport(
  `export { renderSvg } from '${repoRoot}/src/render/index.ts';
   export { estimateTextWidth } from '${repoRoot}/src/core/svg.ts';
   export { resolveCanvas } from '${repoRoot}/src/core/size.ts';
   export { outerMargin } from '${repoRoot}/src/core/frame.ts';`
);

const { renderSvg, estimateTextWidth, resolveCanvas, outerMargin } = mod;

const specs = JSON.parse(readFileSync(resolve(repoRoot, 'examples/specs.json'), 'utf8'));
const edge = JSON.parse(readFileSync(resolve(repoRoot, 'examples/edge-cases.json'), 'utf8'));
const ALL_SPECS = [...specs, ...edge];
const PRESETS = ['share', 'square', 'poster'];

function stripTransformedGroups(svg) {
  let out = '';
  let i = 0;
  while (i < svg.length) {
    const gStart = svg.indexOf('<g ', i);
    if (gStart === -1) {
      out += svg.slice(i);
      break;
    }
    out += svg.slice(i, gStart);
    const tagEnd = svg.indexOf('>', gStart);
    const openTag = svg.slice(gStart, tagEnd + 1);
    if (!openTag.includes('transform="')) {
      out += openTag;
      i = tagEnd + 1;
      continue;
    }
    let depth = 1;
    let j = tagEnd + 1;
    while (j < svg.length && depth > 0) {
      if (svg.startsWith('<g ', j) || svg.startsWith('<g>', j)) {
        depth++;
        j += 3;
      } else if (svg.startsWith('</g>', j)) {
        depth--;
        j += 4;
      } else {
        j++;
      }
    }
    i = j;
  }
  return out;
}

function unescapeXml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseTextElements(svg) {
  const stripped = stripTransformedGroups(svg);
  const re = /<text([^>]*)>([^<]*)<\/text>/g;
  const out = [];
  let m;
  while ((m = re.exec(stripped)) !== null) {
    const attrs = m[1];
    const text = unescapeXml(m[2]);
    const get = (name) => {
      const r = new RegExp(`\\b${name}="([^"]*)"`).exec(attrs);
      return r ? r[1] : undefined;
    };
    const x = parseFloat(get('x') ?? '0');
    const y = parseFloat(get('y') ?? '0');
    const fontSize = parseFloat(get('font-size') ?? '14');
    const anchor = get('text-anchor') ?? 'start';
    const transform = get('transform');
    out.push({ x, y, fontSize, anchor, text, transform });
  }
  return out;
}

function textBBox(el) {
  const width = estimateTextWidth(el.text, el.fontSize);
  let left = el.x;
  if (el.anchor === 'middle') left = el.x - width / 2;
  else if (el.anchor === 'end') left = el.x - width;
  const ascender = el.fontSize * 0.82;
  const descender = el.fontSize * 0.28;
  return {
    left,
    right: left + width,
    top: el.y - ascender,
    bottom: el.y + descender,
    text: el.text,
    transform: el.transform,
  };
}

const TOLERANCE = 2;

function describeSpec(spec, preset) {
  const s = spec._slug ?? spec.slug ?? spec.title ?? 'unnamed';
  return `${spec.chart}/${s}/${preset}`;
}

async function collectViolations() {
  const violations = [];
  for (const spec of ALL_SPECS) {
    for (const preset of PRESETS) {
      const config = { ...spec, size: preset };
      const canvas = resolveCanvas(preset, undefined, undefined);
      const margin = outerMargin(canvas);
      const svg = await renderSvg(config);
      const texts = parseTextElements(svg);
      for (const el of texts) {
        if (el.transform) continue;
        if (!el.text || !el.text.trim()) continue;
        const bb = textBBox(el);
        const leftOverflow = margin - bb.left;
        const rightOverflow = bb.right - (canvas.width - margin);
        const topOverflow = margin - bb.top;
        const bottomOverflow = bb.bottom - (canvas.height - margin);
        const worst = Math.max(leftOverflow, rightOverflow, topOverflow, bottomOverflow);
        if (worst > TOLERANCE) {
          violations.push({
            where: describeSpec(spec, preset),
            text: el.text,
            anchor: el.anchor,
            x: el.x,
            fontSize: el.fontSize,
            bbox: bb,
            canvas: { width: canvas.width, height: canvas.height, margin },
            leftOverflow, rightOverflow, topOverflow, bottomOverflow,
          });
        }
      }
    }
  }
  return violations;
}

const violations = await collectViolations();

test('no text element escapes outside inner (margin) box', () => {
  if (violations.length > 0) {
    const sample = violations.slice(0, 50).map((v) => {
      const worst = Math.max(v.leftOverflow, v.rightOverflow, v.topOverflow, v.bottomOverflow);
      const dirs = [];
      if (v.leftOverflow > TOLERANCE) dirs.push(`L${v.leftOverflow.toFixed(0)}`);
      if (v.rightOverflow > TOLERANCE) dirs.push(`R${v.rightOverflow.toFixed(0)}`);
      if (v.topOverflow > TOLERANCE) dirs.push(`T${v.topOverflow.toFixed(0)}`);
      if (v.bottomOverflow > TOLERANCE) dirs.push(`B${v.bottomOverflow.toFixed(0)}`);
      return `  ${v.where}: "${v.text.slice(0, 40)}" [${v.anchor}] worst=${worst.toFixed(0)}px ${dirs.join(',')}`;
    }).join('\n');
    assert.fail(
      `${violations.length} text overflow(s) (tolerance ${TOLERANCE}px). First ${Math.min(50, violations.length)}:\n${sample}`,
    );
  }
});

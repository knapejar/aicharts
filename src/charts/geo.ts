import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { g, path, rect, text } from '../core/svg.js';
import { labelFontSize, reservedHeaderHeight } from '../core/layout.js';
import { pickNumberFormatter } from '../formatters/number.js';
import type { GeoConfig, SvgElement, Theme } from '../core/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findBasemapsDir(): string | null {
  const candidates = [
    resolve(__dirname, '..', '..', 'basemaps'),
    resolve(__dirname, '..', '..', '..', 'basemaps'),
    resolve(process.cwd(), 'basemaps'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

interface DwArc {
  [i: number]: [number, number, number | null];
}

interface DwGeometry {
  type: string;
  arcs: unknown;
  properties: Record<string, string | number>;
}

interface DwTopo {
  content: {
    type: 'Topology';
    bbox: [number, number, number, number];
    objects: Record<string, { type: string; geometries: DwGeometry[] }>;
    arcs: DwArc[];
  };
  meta: { label: string; keys: Array<{ value: string; label: string }> };
}

function loadBasemap(id: string): DwTopo | null {
  const dir = findBasemapsDir();
  if (!dir) return null;
  const p = join(dir, `${id}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as DwTopo;
  } catch {
    return null;
  }
}

function resolveArcs(
  topo: DwTopo['content'],
  arcRefs: number[],
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (const raw of arcRefs) {
    const idx = raw >= 0 ? raw : ~raw;
    const arc = topo.arcs[idx];
    if (!arc) continue;
    const seq: Array<[number, number]> = raw >= 0 ? (arc as unknown as Array<[number, number, number | null]>).map((p) => [p[0], p[1]]) : (arc as unknown as Array<[number, number, number | null]>)
      .slice()
      .reverse()
      .map((p) => [p[0], p[1]]);
    if (points.length > 0 && seq.length > 0) {
      const last = points[points.length - 1]!;
      const first = seq[0]!;
      if (last[0] === first[0] && last[1] === first[1]) seq.shift();
    }
    points.push(...seq);
  }
  return points;
}

function polygonPath(rings: Array<Array<[number, number]>>, scale: (p: [number, number]) => [number, number]): string {
  const parts: string[] = [];
  for (const ring of rings) {
    if (ring.length === 0) continue;
    const pts = ring.map(scale);
    let s = `M ${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      s += ` L ${pts[i]![0].toFixed(2)} ${pts[i]![1].toFixed(2)}`;
    }
    s += ' Z';
    parts.push(s);
  }
  return parts.join(' ');
}

function interpolateColor(hex1: string, hex2: string, t: number): string {
  const h1 = parseInt(hex1.slice(1), 16);
  const h2 = parseInt(hex2.slice(1), 16);
  const r1 = (h1 >> 16) & 255;
  const g1 = (h1 >> 8) & 255;
  const b1 = h1 & 255;
  const r2 = (h2 >> 16) & 255;
  const g2 = (h2 >> 8) & 255;
  const b2 = h2 & 255;
  const r = Math.round(r1 + (r2 - r1) * t);
  const gc = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return '#' + [r, gc, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function pickColor(palette: string[], value: number, min: number, max: number, steps: number): string {
  const range = max - min || 1;
  const t = Math.max(0, Math.min(1, (value - min) / range));
  if (steps > 0 && steps < 50) {
    const bin = Math.min(steps - 1, Math.floor(t * steps));
    const col = palette[bin]!;
    return col;
  }
  const n = palette.length;
  const idx = t * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(n - 1, lo + 1);
  const frac = idx - lo;
  return interpolateColor(palette[lo]!, palette[hi]!, frac);
}

function lighten(hex: string, amount: number): string {
  const h = parseInt(hex.slice(1), 16);
  const r = (h >> 16) & 255;
  const g = (h >> 8) & 255;
  const b = h & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return '#' + [mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function darken(hex: string, amount: number): string {
  const h = parseInt(hex.slice(1), 16);
  const r = (h >> 16) & 255;
  const g = (h >> 8) & 255;
  const b = h & 255;
  const mix = (c: number) => Math.round(c * (1 - amount));
  return '#' + [mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function luminance(hex: string): number {
  const h = parseInt(hex.slice(1), 16);
  const r = (h >> 16) & 255;
  const g = (h >> 8) & 255;
  const b = h & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function looksSequential(colors: string[]): boolean {
  if (colors.length < 3) return false;
  const first = luminance(colors[0]!);
  const last = luminance(colors[colors.length - 1]!);
  return Math.abs(first - last) > 80;
}

function buildPalette(baseColors: string[], accent: string, scale: GeoConfig['scale']): string[] {
  if (scale === 'diverging') {
    return ['#2166ac', '#67a9cf', '#d1e5f0', '#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b'];
  }
  if (looksSequential(baseColors)) {
    const firstL = luminance(baseColors[0]!);
    const lastL = luminance(baseColors[baseColors.length - 1]!);
    return firstL > lastL ? baseColors : [...baseColors].reverse();
  }
  return [
    lighten(accent, 0.85),
    lighten(accent, 0.6),
    lighten(accent, 0.35),
    accent,
    darken(accent, 0.25),
  ];
}

export function renderGeo(cfg: GeoConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const out: SvgElement[] = [];
  const basemapId = cfg.basemap ?? 'world';
  const topo = loadBasemap(basemapId);
  if (!topo) {
    const top = reservedHeaderHeight(canvas, !!cfg.title, !!cfg.subtitle) + 32;
    out.push(
      text(`Basemap "${basemapId}" not found. Place JSON in basemaps/.`, {
        x: canvas.width / 2,
        y: top + 40,
        'font-size': 14,
        'font-family': palette.fontBody,
        fill: palette.text,
        'text-anchor': 'middle',
      }),
    );
    return out;
  }

  const codeKey = cfg.code ?? 'code';
  const valueKey = cfg.value ?? 'value';
  const dataByCode = new Map<string, number>();
  for (const row of cfg.data) {
    const code = String(row[codeKey] ?? '').trim().toUpperCase();
    const val = Number(row[valueKey] ?? NaN);
    if (code && Number.isFinite(val)) dataByCode.set(code, val);
  }
  const values = [...dataByCode.values()];
  const vMin = values.length ? Math.min(...values) : 0;
  const vMax = values.length ? Math.max(...values) : 1;

  const content = topo.content;
  const bbox = content.bbox;
  const header = reservedHeaderHeight(canvas, !!cfg.title, !!cfg.subtitle);
  const footer = labelFontSize(canvas) * 3.2;
  const top = header + 16;
  const bottom = canvas.height - footer - 56;
  const width = canvas.width - canvas.padding.left - canvas.padding.right;
  const height = bottom - top;
  const bboxW = bbox[2] - bbox[0];
  const bboxH = bbox[3] - bbox[1];
  const scaleFactor = Math.min(width / bboxW, height / bboxH);
  const offsetX = canvas.padding.left + (width - bboxW * scaleFactor) / 2 - bbox[0] * scaleFactor;
  const offsetY = top + (height - bboxH * scaleFactor) / 2 - bbox[1] * scaleFactor;
  const scale = (p: [number, number]): [number, number] => [
    p[0] * scaleFactor + offsetX,
    p[1] * scaleFactor + offsetY,
  ];

  const paletteColors = buildPalette(palette.colors, palette.accent, cfg.scale);
  const steps = cfg.steps ?? 0;
  const missingColor = cfg.missingColor ?? palette.grid;

  const regionObj = content.objects['regions'] ?? Object.values(content.objects)[0];
  if (!regionObj) return out;

  const shapes: SvgElement[] = [];
  for (const geom of regionObj.geometries) {
    let d = '';
    if (geom.type === 'Polygon') {
      const rings = (geom.arcs as number[][]).map((ring) =>
        resolveArcs(content, ring),
      );
      d = polygonPath(rings, scale);
    } else if (geom.type === 'MultiPolygon') {
      const polys = geom.arcs as number[][][];
      const allRings: Array<Array<[number, number]>> = [];
      for (const poly of polys) {
        for (const ring of poly) allRings.push(resolveArcs(content, ring));
      }
      d = polygonPath(allRings, scale);
    } else {
      continue;
    }
    const props = geom.properties ?? {};
    const candidates = [
      props['DW_STATE_CODE'],
      props['ISO_3'],
      props['ISO_3_SOV'],
      props['ISO_A3'],
      props['ISO'],
      props['iso3'],
      props['ISO_2'],
      props['ISO_2_SOV'],
      props['ISO_A2'],
      props['iso2'],
      props['DW_NAME'],
      props['NAME_SHORT'],
      props['NAME'],
      props['NAME_SOV'],
      props['name'],
      props['code'],
    ]
      .filter((v) => typeof v === 'string' || typeof v === 'number')
      .map((v) => String(v).trim().toUpperCase());
    let val: number | undefined;
    for (const c of candidates) {
      if (dataByCode.has(c)) {
        val = dataByCode.get(c);
        break;
      }
    }
    const fill =
      val !== undefined
        ? pickColor(paletteColors, val, vMin, vMax, steps)
        : missingColor;
    shapes.push(
      path(d, {
        fill,
        stroke: palette.background,
        'stroke-width': 0.5,
      }),
    );
  }
  out.push(g({}, shapes));

  if (cfg.showLegend !== false && values.length > 0) {
    const legendSize = labelFontSize(canvas);
    const legendW = Math.min(360, width * 0.3);
    const legendH = 12;
    const legendX = canvas.padding.left;
    const legendY = canvas.height - footer - 24;
    const steps2 = steps > 0 ? steps : 60;
    const gradient: SvgElement[] = [];
    for (let i = 0; i < steps2; i++) {
      const t = i / (steps2 - 1);
      const v = vMin + t * (vMax - vMin);
      gradient.push(
        rect({
          x: legendX + (i * legendW) / steps2,
          y: legendY,
          width: legendW / steps2 + 1,
          height: legendH,
          fill: pickColor(paletteColors, v, vMin, vMax, steps),
        }),
      );
    }
    out.push(g({}, gradient));
    const fmt = pickNumberFormatter(values);
    out.push(
      text(fmt(vMin), {
        x: legendX,
        y: legendY + legendH + legendSize * 1.2,
        'font-size': legendSize,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
      }),
    );
    out.push(
      text(fmt(vMax), {
        x: legendX + legendW,
        y: legendY + legendH + legendSize * 1.2,
        'font-size': legendSize,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
        'text-anchor': 'end',
      }),
    );
  }

  return out;
}

import { circle, estimateTextWidth, g, line as svgLine, path, rect, text } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import {
  emptyPlotHint,
  estimateBandXAxisHeight,
  estimateYTickBandWidth,
  renderBandXAxis,
  renderYAxis,
} from './axes.js';
import { niceScale } from '../formatters/tick.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { smartLabel } from '../formatters/label.js';
import type { ComboConfig, SvgElement, Theme } from '../core/types.js';

function buildPath(points: Array<[number, number]>, interpolation: 'linear' | 'curved' | 'stepped'): string {
  if (points.length === 0) return '';
  if (interpolation === 'linear') {
    return points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  }
  if (interpolation === 'stepped') {
    let d = `M ${points[0]![0]} ${points[0]![1]}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const cur = points[i]!;
      d += ` L ${cur[0]} ${prev[1]} L ${cur[0]} ${cur[1]}`;
    }
    return d;
  }
  let d = `M ${points[0]![0]} ${points[0]![1]}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]!;
    const p1 = points[i]!;
    const pm1 = points[i - 2] ?? p0;
    const p2 = points[i + 1] ?? p1;
    const t = 0.2;
    const c1x = p0[0] + (p1[0] - pm1[0]) * t;
    const c1y = p0[1] + (p1[1] - pm1[1]) * t;
    const c2x = p1[0] - (p2[0] - p0[0]) * t;
    const c2y = p1[1] - (p2[1] - p0[1]) * t;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p1[0]} ${p1[1]}`;
  }
  return d;
}

export function renderCombo(cfg: ComboConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const bars = Array.isArray(cfg.bars) ? cfg.bars : [cfg.bars];
  const lines = Array.isArray(cfg.lines) ? cfg.lines : [cfg.lines];
  const out: SvgElement[] = [];
  const legendLabels = [...bars, ...lines];
  const categoriesForHeight = (cfg.data ?? []).map((r) => String(r[cfg.x] ?? ''));
  const xTickBandHeight = estimateBandXAxisHeight(
    canvas,
    categoriesForHeight,
    canvas.width * 0.85,
    0.3,
    0.15,
  );

  const barValues: number[] = [];
  const lineValues: number[] = [];
  for (const r of cfg.data ?? []) {
    for (const b of bars) {
      const v = Number(r[b] ?? 0);
      if (Number.isFinite(v)) barValues.push(v);
    }
    for (const l of lines) {
      const v = Number(r[l] ?? NaN);
      if (Number.isFinite(v)) lineValues.push(v);
    }
  }

  const separateAxis =
    lineValues.length > 0 &&
    barValues.length > 0 &&
    Math.max(...lineValues) < Math.max(...barValues) * 0.5;

  const lineMin = lineValues.length ? Math.min(...lineValues) : 0;
  const lineMax = lineValues.length ? Math.max(...lineValues) : 1;
  const lineScale = niceScale(lineMin, lineMax * 1.08, 5);
  const lineFmt = pickNumberFormatter(lineValues, cfg.yFormat);

  let rightGutter = 0;
  if (separateAxis) {
    const labelSize = labelFontSize(canvas);
    const widest = Math.max(
      ...lineScale.ticks.map((t) => estimateTextWidth(lineFmt(t), labelSize)),
      20,
    );
    rightGutter = Math.round(widest + labelSize * 0.8);
  }

  const yTickBandWidth = estimateYTickBandWidth(canvas, barValues.length ? barValues : [0, 1]);

  const frame = computeFrame(canvas, {
    xTickBandHeight,
    rightGutter,
    yTickBandWidth,
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend: true,
    legendLabels,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
  });
  const plot = frame.plot;
  if (!cfg.data || cfg.data.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No data'));
    return out;
  }

  const barMin = Math.min(0, ...barValues);
  const barMax = Math.max(...barValues);
  const barScale = niceScale(barMin, barMax * 1.08, 5);
  const barFmt = pickNumberFormatter(barValues, cfg.yFormat);

  const { elements: yElems, scale: yBarScale } = renderYAxis({
    canvas,
    min: barScale.min,
    max: barScale.max,
    palette,
    plot,
    format: barFmt,
  });
  out.push(...yElems);

  const yLineScale = (v: number) =>
    plot.y + plot.height - ((v - lineScale.min) / (lineScale.max - lineScale.min || 1)) * plot.height;

  if (separateAxis) {
    for (const t of lineScale.ticks) {
      out.push(
        text(lineFmt(t), {
          x: plot.x + plot.width + 8,
          y: yLineScale(t) + labelFontSize(canvas) * 0.35,
          'font-size': labelFontSize(canvas),
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'start',
        }),
      );
    }
  }

  const categories = cfg.data.map((r) => String(r[cfg.x] ?? ''));
  const { elements: xElems, bandStart, bandWidth } = renderBandXAxis({
    canvas,
    categories,
    palette,
    plot,
    paddingInner: 0.3,
    paddingOuter: 0.15,
  });
  out.push(...xElems);

  const barWidthAvailable = bandWidth();
  const barGap = 2;
  const oneBarW =
    bars.length > 0
      ? (barWidthAvailable - barGap * (bars.length - 1)) / bars.length
      : barWidthAvailable;
  const barsGroup: SvgElement[] = [];
  const baseY = yBarScale(0);
  for (let i = 0; i < cfg.data.length; i++) {
    const bxStart = bandStart(i);
    for (let bi = 0; bi < bars.length; bi++) {
      const key = bars[bi]!;
      const v = Number(cfg.data[i]![key] ?? 0);
      if (!Number.isFinite(v)) continue;
      const bx = bxStart + bi * (oneBarW + barGap);
      const by = v >= 0 ? yBarScale(v) : baseY;
      const bh = Math.abs(yBarScale(v) - baseY);
      barsGroup.push(
        rect({
          x: bx,
          y: by,
          width: oneBarW,
          height: bh,
          fill: palette.colors[bi % palette.colors.length]!,
          rx: 1,
          opacity: 0.9,
        }),
      );
    }
  }
  out.push(g({}, barsGroup));

  const linesGroup: SvgElement[] = [];
  const symbols: SvgElement[] = [];
  for (let li = 0; li < lines.length; li++) {
    const key = lines[li]!;
    const color = palette.colors[(bars.length + li) % palette.colors.length]!;
    const points: Array<[number, number]> = [];
    for (let i = 0; i < cfg.data.length; i++) {
      const v = Number(cfg.data[i]![key] ?? NaN);
      if (!Number.isFinite(v)) continue;
      const cx = bandStart(i) + bandWidth() / 2;
      const cy = separateAxis ? yLineScale(v) : yBarScale(v);
      points.push([cx, cy]);
      symbols.push(circle(cx, cy, 4, { fill: palette.background, stroke: color, 'stroke-width': 2.5 }));
    }
    linesGroup.push(
      path(buildPath(points, cfg.interpolation ?? 'curved'), {
        fill: 'none',
        stroke: color,
        'stroke-width': 2.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-dasharray': cfg.lineStyle === 'dashed' ? '6 4' : cfg.lineStyle === 'dotted' ? '1 4' : undefined,
      }),
    );
  }
  out.push(g({}, linesGroup));
  out.push(g({}, symbols));

  out.push(
    svgLine(plot.x, baseY, plot.x + plot.width, baseY, {
      stroke: palette.axis,
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',
    }),
  );

  const legendItems = [
    ...bars.map((key, i) => ({
      label: smartLabel(key),
      color: palette.colors[i % palette.colors.length]!,
    })),
    ...lines.map((key, li) => ({
      label: smartLabel(key),
      color: palette.colors[(bars.length + li) % palette.colors.length]!,
      dash: 'solid' as const,
    })),
  ];
  if (frame.legend) {
    out.push(
      ...renderLegend({
        items: legendItems,
        palette,
        canvas,
        y: frame.legend.y + frame.tokens.ascender,
      }),
    );
  }

  return out;
}

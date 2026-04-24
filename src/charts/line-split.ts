import { g, line as svgLine, path, text } from '../core/svg.js';
import { labelFontSize } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import { niceScale } from '../formatters/tick.js';
import { pickNumberFormatter, looksLikeYearSeries } from '../formatters/number.js';
import type { LineSplitConfig, SvgElement, Theme } from '../core/types.js';

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

export function renderLineSplit(cfg: LineSplitConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = cfg.y;
  if (!cfg.data || cfg.data.length === 0 || series.length === 0) return [];
  const out: SvgElement[] = [];
  const labelSize = labelFontSize(canvas);
  const columns = cfg.columns ?? (series.length <= 2 ? series.length : series.length <= 4 ? 2 : 3);
  const rows = Math.ceil(series.length / columns);
  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    hasXAxis: false,
    hasYAxis: false,
  });
  const gridX = frame.plot.x;
  const gridW = frame.plot.width;
  const gridY = frame.plot.y;
  const gridH = frame.plot.height;
  const cellGapX = Math.round(labelSize * 1.1);
  const cellGapY = Math.round(labelSize * 1.4);
  const cellW = (gridW - cellGapX * (columns - 1)) / columns;
  const cellH = (gridH - cellGapY * (rows - 1)) / rows;
  const innerPadLeft = Math.round(labelSize * 2.2);
  const innerPadBottom = Math.round(labelSize * 1.9);
  const innerPadTop = Math.round(labelSize * 1.7);

  const xIsYear = looksLikeYearSeries(cfg.data.map((r) => Number(r[cfg.x])));
  const xRawNumbers = cfg.data.map((r) => Number(r[cfg.x]));

  let allValues: number[] = [];
  if (cfg.sharedScale !== false) {
    for (const s of series) {
      for (const r of cfg.data) {
        const v = Number(r[s] ?? NaN);
        if (Number.isFinite(v)) allValues.push(v);
      }
    }
  }

  for (let si = 0; si < series.length; si++) {
    const s = series[si]!;
    const col = si % columns;
    const rowIdx = Math.floor(si / columns);
    const cellX = gridX + col * (cellW + cellGapX);
    const cellY = gridY + rowIdx * (cellH + cellGapY);
    const plotX = cellX + innerPadLeft;
    const plotY = cellY + innerPadTop;
    const plotW = cellW - innerPadLeft;
    const plotH = cellH - innerPadTop - innerPadBottom;

    const values = cfg.data.map((r) => Number(r[s] ?? NaN));
    const localAll = cfg.sharedScale !== false ? allValues : values.filter(Number.isFinite);
    const vMin = Math.min(0, ...localAll);
    const vMax = Math.max(...localAll);
    const yscl = niceScale(vMin, vMax, 3);
    const yScale = (v: number) =>
      plotY + plotH - ((v - yscl.min) / (yscl.max - yscl.min || 1)) * plotH;

    out.push(
      text(s, {
        x: cellX,
        y: cellY + labelSize,
        'font-size': labelSize,
        'font-weight': 700,
        'font-family': palette.fontBody,
        fill: palette.text,
      }),
    );

    const fmt = pickNumberFormatter(localAll);
    for (const t of yscl.ticks) {
      const y = yScale(t);
      out.push(
        svgLine(plotX, y, plotX + plotW, y, {
          stroke: palette.grid,
          'stroke-width': 1,
          'shape-rendering': 'crispEdges',
        }),
      );
      out.push(
        text(fmt(t), {
          x: plotX - 6,
          y: y + labelSize * 0.35,
          'font-size': labelSize * 0.85,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'end',
        }),
      );
    }

    const xMin = Math.min(...xRawNumbers);
    const xMax = Math.max(...xRawNumbers);
    const xScale = (v: number) =>
      plotX + ((v - xMin) / (xMax - xMin || 1)) * plotW;

    const color = palette.colors[si % palette.colors.length]!;
    const points: Array<[number, number]> = [];
    for (let i = 0; i < cfg.data.length; i++) {
      const v = values[i];
      if (!Number.isFinite(v)) continue;
      points.push([xScale(xRawNumbers[i]!), yScale(v!)]);
    }
    out.push(
      path(buildPath(points, cfg.interpolation ?? 'curved'), {
        fill: 'none',
        stroke: color,
        'stroke-width': 2.5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );

    out.push(
      svgLine(plotX, yScale(yscl.min), plotX + plotW, yScale(yscl.min), {
        stroke: palette.axis,
        'stroke-width': 1,
        'shape-rendering': 'crispEdges',
      }),
    );

    if (xIsYear) {
      const first = xRawNumbers[0]!;
      const last = xRawNumbers[xRawNumbers.length - 1]!;
      out.push(
        text(String(first), {
          x: plotX,
          y: plotY + plotH + labelSize * 1.4,
          'font-size': labelSize * 0.8,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'start',
        }),
      );
      out.push(
        text(String(last), {
          x: plotX + plotW,
          y: plotY + plotH + labelSize * 1.4,
          'font-size': labelSize * 0.8,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'end',
        }),
      );
    } else {
      const firstLabel = String(cfg.data[0]?.[cfg.x] ?? '');
      const lastLabel = String(cfg.data[cfg.data.length - 1]?.[cfg.x] ?? '');
      out.push(
        text(firstLabel, {
          x: plotX,
          y: plotY + plotH + labelSize * 1.4,
          'font-size': labelSize * 0.8,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'start',
        }),
      );
      out.push(
        text(lastLabel, {
          x: plotX + plotW,
          y: plotY + plotH + labelSize * 1.4,
          'font-size': labelSize * 0.8,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'end',
        }),
      );
    }
  }
  return out;
}

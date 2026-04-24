import { circle, estimateTextWidth, g, line as svgLine, path, text } from '../core/svg.js';
import { renderLegend, labelFontSize } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import {
  emptyPlotHint,
  estimateYTickBandWidth,
  pickXAxisKind,
  renderBandXAxis,
  renderDateXAxis,
  renderLinearXAxis,
  renderYAxis,
} from './axes.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { toDate } from '../formatters/date.js';
import type { LineConfig, SvgElement, Theme } from '../core/types.js';

function toNumbers(rows: LineConfig['data'], key: string): number[] {
  return rows.map((r) => {
    const v = r[key];
    if (v === null || v === undefined || v === '') return NaN;
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  });
}

function buildLinePath(
  points: Array<[number, number]>,
  interpolation: 'linear' | 'curved' | 'stepped',
): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const [x, y] = points[0]!;
    return `M ${x} ${y}`;
  }
  if (interpolation === 'linear') {
    return points
      .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
      .join(' ');
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

function dashArray(style: string): string | undefined {
  if (style === 'dashed') return '6 4';
  if (style === 'dotted') return '1 4';
  return undefined;
}

export function renderLine(cfg: LineConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = Array.isArray(cfg.y) ? cfg.y : [cfg.y];
  const hasLegend = series.length > 1;
  const allYUpfront: number[] = [];
  for (const s of series) {
    for (const r of cfg.data ?? []) {
      const v = Number(r[s] ?? NaN);
      if (Number.isFinite(v)) allYUpfront.push(v);
    }
  }
  const yTickBandWidth = estimateYTickBandWidth(canvas, allYUpfront, cfg.yFormat ? undefined : undefined);
  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend,
    legendLabels: hasLegend ? series : undefined,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    yTickBandWidth,
  });
  const plot = frame.plot;
  const out: SvgElement[] = [];

  if (!cfg.data || cfg.data.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No data'));
    return out;
  }

  const xRaw = cfg.data.map((r) => r[cfg.x] ?? null);
  const xKind = pickXAxisKind(xRaw);

  const allYValues: number[] = [];
  for (const s of series) {
    for (const v of toNumbers(cfg.data, s)) {
      if (Number.isFinite(v)) allYValues.push(v);
    }
  }
  if (allYValues.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No numeric values'));
    return out;
  }
  const yMin = Math.min(...allYValues, 0);
  const yMax = Math.max(...allYValues);
  const yPad = (yMax - yMin) * 0.08 || 1;

  const { elements: yElems, scale: yScale } = renderYAxis({
    canvas,
    min: Math.min(yMin, yMin < 0 ? yMin - yPad : 0),
    max: yMax + yPad,
    palette,
    plot,
    format: pickNumberFormatter(allYValues, cfg.yFormat),
  });
  out.push(...yElems);

  let xScale: (i: number, row: LineConfig['data'][number]) => number;
  if (xKind === 'date') {
    const dates = cfg.data.map((r) => toDate(r[cfg.x] as string | number) ?? new Date(0));
    const { elements, scale } = renderDateXAxis({ canvas, values: dates, palette, plot });
    out.push(...elements);
    xScale = (i) => scale(dates[i]!);
  } else if (xKind === 'number') {
    const numbers = cfg.data.map((r) => Number(r[cfg.x]));
    const { elements, scale } = renderLinearXAxis({
      canvas,
      values: numbers,
      palette,
      plot,
      format: pickNumberFormatter(numbers, cfg.xFormat),
    });
    out.push(...elements);
    xScale = (i) => scale(numbers[i]!);
  } else {
    const cats = cfg.data.map((r) => String(r[cfg.x] ?? ''));
    const { elements, bandStart, bandWidth } = renderBandXAxis({
      canvas,
      categories: cats,
      palette,
      plot,
    });
    out.push(...elements);
    xScale = (i) => bandStart(i) + bandWidth() / 2;
  }

  const lineWidth = cfg.lineWidth ?? 2.5;
  const interpolation = cfg.interpolation ?? 'linear';

  const linesGroup: SvgElement[] = [];
  const symbolsGroup: SvgElement[] = [];
  const labelsGroup: SvgElement[] = [];
  const labelSize = labelFontSize(canvas);

  for (let s = 0; s < series.length; s++) {
    const key = series[s]!;
    const color = palette.colors[s % palette.colors.length]!;
    const dashStyle =
      typeof cfg.lineStyle === 'string'
        ? cfg.lineStyle
        : cfg.lineStyle?.[key] ?? 'solid';
    const ys = toNumbers(cfg.data, key);
    const points: Array<[number, number]> = [];
    for (let i = 0; i < cfg.data.length; i++) {
      const y = ys[i];
      if (!Number.isFinite(y)) continue;
      const px = xScale(i, cfg.data[i]!);
      const py = yScale(y!);
      points.push([px, py]);
    }
    if (points.length === 0) continue;

    if (cfg.areaFill) {
      const firstX = points[0]![0];
      const lastX = points[points.length - 1]![0];
      const baseY = yScale(Math.max(0, yMin));
      const areaPath =
        buildLinePath(points, interpolation) + ` L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
      linesGroup.push(
        path(areaPath, {
          fill: color,
          opacity: 0.15,
        }),
      );
    }

    linesGroup.push(
      path(buildLinePath(points, interpolation), {
        fill: 'none',
        stroke: color,
        'stroke-width': lineWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-dasharray': dashArray(dashStyle),
      }),
    );

    const symbolMode =
      cfg.showSymbols ??
      (points.length === 1 ? 'all' : 'none');
    if (symbolMode !== 'none') {
      const showAll = symbolMode === 'all';
      const showFirstLast = symbolMode === 'first-last';
      const showLast = symbolMode === 'last';
      for (let i = 0; i < points.length; i++) {
        const [px, py] = points[i]!;
        const isFirst = i === 0;
        const isLast = i === points.length - 1;
        if (showAll || (showFirstLast && (isFirst || isLast)) || (showLast && isLast)) {
          symbolsGroup.push(
            circle(px, py, Math.max(3, lineWidth + 1), {
              fill: palette.background,
              stroke: color,
              'stroke-width': lineWidth,
            }),
          );
        }
      }
    }

    const valueLabelMode = cfg.showValueLabels ?? 'none';
    if (valueLabelMode !== 'none') {
      const fmt = pickNumberFormatter(allYValues, cfg.yFormat);
      const showAll = valueLabelMode === 'all';
      const showLast = valueLabelMode === 'last';
      const showFL = valueLabelMode === 'first-last';
      for (let i = 0; i < points.length; i++) {
        const [px, py] = points[i]!;
        const isFirst = i === 0;
        const isLast = i === points.length - 1;
        const realIdx = cfg.data.findIndex((_, j) => j >= i);
        void realIdx;
        if (showAll || (showFL && (isFirst || isLast)) || (showLast && isLast)) {
          const valueNum = ys.filter(Number.isFinite)[showAll ? i : showLast || isLast ? ys.filter(Number.isFinite).length - 1 : 0]!;
          const anchor = isLast ? 'end' : isFirst ? 'start' : 'middle';
          labelsGroup.push(
            text(fmt(valueNum), {
              x: px,
              y: py - lineWidth - 4,
              'font-size': labelSize,
              'font-weight': 600,
              'font-family': palette.fontBody,
              fill: palette.text,
              'text-anchor': anchor,
            }),
          );
        }
      }
    }

    const valueLabelModeForCollision = cfg.showValueLabels ?? 'none';
    const valueLabelsOnEndpoint =
      valueLabelModeForCollision === 'last' ||
      valueLabelModeForCollision === 'all' ||
      valueLabelModeForCollision === 'first-last';
    if (!hasLegend && series.length === 1 && points.length > 1 && !valueLabelsOnEndpoint) {
      const lastPoint = points[points.length - 1]!;
      const plotRight = plot.x + plot.width;
      const labelW = estimateTextWidth(key, labelSize);
      const labelX = Math.min(lastPoint[0] + labelSize * 0.35, plotRight - labelW);
      labelsGroup.push(
        text(key, {
          x: labelX,
          y: Math.max(plot.y + labelSize, lastPoint[1] - labelSize * 0.8),
          'font-size': labelSize,
          'font-weight': 600,
          'font-family': palette.fontBody,
          fill: color,
        }),
      );
    }
  }

  out.push(g({}, linesGroup));
  out.push(g({}, symbolsGroup));
  out.push(g({}, labelsGroup));

  if (hasLegend && frame.legend) {
    out.push(
      ...renderLegend({
        items: series.map((key, i) => ({
          label: key,
          color: palette.colors[i % palette.colors.length]!,
          dash: typeof cfg.lineStyle === 'string' ? (cfg.lineStyle as 'solid' | 'dashed' | 'dotted') : 'solid',
        })),
        palette,
        canvas,
        y: frame.legend.y + frame.tokens.ascender,
      }),
    );
  }

  out.push(
    svgLine(plot.x, plot.y + plot.height, plot.x + plot.width, plot.y + plot.height, {
      stroke: palette.axis,
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',
    }),
  );

  return out;
}

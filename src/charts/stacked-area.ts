import { g, line as svgLine, path } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import {
  emptyPlotHint,
  estimateYTickBandWidth,
  pickXAxisKind,
  renderDateXAxis,
  renderLinearXAxis,
  renderBandXAxis,
  renderYAxis,
} from './axes.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { smartLabel } from '../formatters/label.js';
import { toDate } from '../formatters/date.js';
import type { StackedAreaConfig, SvgElement, Theme } from '../core/types.js';

function curveThroughPath(points: Array<[number, number]>): string {
  let s = '';
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
    s += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p1[0]} ${p1[1]}`;
  }
  return s;
}

function curvedAreaPath(
  top: Array<[number, number]>,
  bottom: Array<[number, number]>,
  interpolation: 'linear' | 'curved' | 'stepped',
): string {
  if (top.length === 0) return '';
  if (top.length === 1) {
    const [tx, ty] = top[0]!;
    const [bx, by] = bottom[0]!;
    return `M ${tx} ${ty} L ${bx} ${by} Z`;
  }
  const rev = bottom.slice().reverse();

  if (interpolation === 'linear') {
    let d = `M ${top[0]![0]} ${top[0]![1]}`;
    for (let i = 1; i < top.length; i++) d += ` L ${top[i]![0]} ${top[i]![1]}`;
    for (let i = 0; i < rev.length; i++) d += ` L ${rev[i]![0]} ${rev[i]![1]}`;
    return d + ' Z';
  }

  if (interpolation === 'stepped') {
    const parts: string[] = [];
    const n = top.length;
    for (let i = 0; i < n; i++) {
      const [xi, ty] = top[i]!;
      const [, by] = bottom[i]!;
      const xLeft =
        i === 0 ? xi : (top[i - 1]![0] + xi) / 2;
      const xRight =
        i === n - 1 ? xi : (xi + top[i + 1]![0]) / 2;
      if (xRight === xLeft) continue;
      parts.push(`M ${xLeft} ${ty} L ${xRight} ${ty} L ${xRight} ${by} L ${xLeft} ${by} Z`);
    }
    return parts.join(' ');
  }

  let d = `M ${top[0]![0]} ${top[0]![1]}`;
  d += curveThroughPath(top);
  d += ` L ${rev[0]![0]} ${rev[0]![1]}`;
  d += curveThroughPath(rev);
  return d + ' Z';
}

export function renderStackedArea(cfg: StackedAreaConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = cfg.y;
  const out: SvgElement[] = [];
  const totalsUpfront: number[] = [];
  for (const r of cfg.data ?? []) {
    let t = 0;
    for (const s of series) t += Number(r[s] ?? 0);
    totalsUpfront.push(t);
  }
  const yTickBandWidth = estimateYTickBandWidth(canvas, totalsUpfront);
  const renderedLegendLabels = series.map((s) => smartLabel(s));
  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend: true,
    legendLabels: renderedLegendLabels,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    yTickBandWidth,
  });
  const plot = frame.plot;
  if (!cfg.data || cfg.data.length === 0 || series.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No data'));
    return out;
  }
  const interpolation = cfg.interpolation ?? 'curved';
  const opacity = cfg.opacity ?? 0.92;
  const xRaw = cfg.data.map((r) => r[cfg.x] ?? null);
  const xKind = pickXAxisKind(xRaw);

  const totals: number[] = cfg.data.map((r) => {
    let t = 0;
    for (const s of series) t += Number(r[s] ?? 0);
    return t;
  });
  const yMax = cfg.normalize ? 1 : Math.max(...totals, 0);
  const fmt = cfg.normalize
    ? (v: number) => Math.round(v * 100) + '%'
    : pickNumberFormatter(totals, cfg.yFormat);

  const { elements: yElems, scale: yScale } = renderYAxis({
    canvas,
    min: 0,
    max: cfg.normalize ? yMax : yMax * 1.05,
    palette,
    plot,
    format: fmt,
    maxTicks: cfg.normalize ? 5 : undefined,
  });
  out.push(...yElems);

  let xScale: (i: number) => number;
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

  const layers: SvgElement[] = [];
  const stackBottoms: number[] = new Array(cfg.data.length).fill(0);
  if (cfg.normalize && series.length > 0) {
    const lastIdx = series.length - 1;
    const topColor = palette.colors[lastIdx % palette.colors.length]!;
    layers.push({
      tag: 'rect',
      attrs: {
        x: plot.x,
        y: plot.y,
        width: plot.width,
        height: plot.height,
        fill: topColor,
        opacity,
      },
    });
  }
  const lastSeriesIdx = series.length - 1;
  for (let s = 0; s < series.length; s++) {
    const key = series[s]!;
    const color = palette.colors[s % palette.colors.length]!;
    const top: Array<[number, number]> = [];
    const bottom: Array<[number, number]> = [];
    for (let i = 0; i < cfg.data.length; i++) {
      let v = Number(cfg.data[i]![key] ?? 0);
      if (cfg.normalize) {
        const t = totals[i]!;
        v = t > 0 ? v / t : 0;
      }
      const curTop = stackBottoms[i]! + v;
      const curBot = stackBottoms[i]!;
      top.push([xScale(i), yScale(curTop)]);
      bottom.push([xScale(i), yScale(curBot)]);
      stackBottoms[i] = curTop;
    }
    if (cfg.normalize && s === lastSeriesIdx) {
      continue;
    }
    layers.push(
      path(curvedAreaPath(top, bottom, interpolation), {
        fill: color,
        opacity,
      }),
    );
  }
  out.push(g({}, layers));

  out.push(
    svgLine(plot.x, yScale(0), plot.x + plot.width, yScale(0), {
      stroke: palette.axis,
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',
    }),
  );

  if (frame.legend) {
    out.push(
      ...renderLegend({
        items: series.map((key, i) => ({
          label: smartLabel(key),
          color: palette.colors[i % palette.colors.length]!,
        })),
        palette,
        canvas,
        y: frame.legend.y + frame.tokens.ascender,
      }),
    );
  }

  void labelFontSize;
  return out;
}

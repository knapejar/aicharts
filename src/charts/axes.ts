import { estimateTextWidth, g, line, rect, text } from '../core/svg.js';
import { axisFontSize, labelFontSize, reservedHeaderHeight } from '../core/layout.js';
export const LEGEND_GAP = 16;
import { niceScale } from '../formatters/tick.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { pickDateFormatter, toDate } from '../formatters/date.js';
import type { Canvas, Palette, SvgElement } from '../core/types.js';

export interface PlotArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computePlotArea(
  canvas: Canvas,
  opts: {
    hasTitle?: boolean;
    hasSubtitle?: boolean;
    hasLegend?: boolean;
    legendHeight?: number;
    yTickWidth?: number;
    xTickHeight?: number;
    extraTop?: number;
  } = {},
): PlotArea {
  const header = reservedHeaderHeight(canvas, !!opts.hasTitle, !!opts.hasSubtitle);
  const footerH = Math.round(labelFontSize(canvas) * 3.0);
  const legendH = opts.hasLegend ? (opts.legendHeight ?? labelFontSize(canvas) * 2.2) : 0;
  const yTickW = opts.yTickWidth ?? 56;
  const xTickH = opts.xTickHeight ?? 28;
  const extraTop = opts.extraTop ?? 16;

  const topY = header + (legendH > 0 ? LEGEND_GAP + legendH : 0) + extraTop;
  const bottomY = canvas.height - footerH - xTickH;
  return {
    x: canvas.padding.left + yTickW,
    y: topY,
    width: canvas.width - canvas.padding.right - (canvas.padding.left + yTickW),
    height: Math.max(60, bottomY - topY),
  };
}

export function legendY(canvas: Canvas, hasTitle: boolean, hasSubtitle: boolean): number {
  return reservedHeaderHeight(canvas, hasTitle, hasSubtitle) + LEGEND_GAP + labelFontSize(canvas);
}

export interface YAxisOptions {
  min: number;
  max: number;
  palette: Palette;
  plot: PlotArea;
  format?: (v: number) => string;
  maxTicks?: number;
  showGrid?: boolean;
  showAxisLine?: boolean;
  label?: string;
}

export function renderYAxis(opts: YAxisOptions): { elements: SvgElement[]; scale: (v: number) => number; tickValues: number[] } {
  const { palette, plot } = opts;
  const { ticks, min, max } = niceScale(opts.min, opts.max, opts.maxTicks ?? 5);
  const scale = (v: number) =>
    plot.y + plot.height - ((v - min) / (max - min || 1)) * plot.height;
  const out: SvgElement[] = [];
  const size = labelFontSize({ width: plot.width + 100, height: plot.height } as Canvas);
  const format = opts.format ?? pickNumberFormatter(ticks);

  for (const t of ticks) {
    const y = scale(t);
    if (opts.showGrid !== false) {
      out.push(
        line(plot.x, y, plot.x + plot.width, y, {
          stroke: palette.grid,
          'stroke-width': 1,
          'shape-rendering': 'crispEdges',
        }),
      );
    }
    out.push(
      text(format(t), {
        x: plot.x - 8,
        y: y + size * 0.35,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
        'text-anchor': 'end',
      }),
    );
  }
  return { elements: out, scale, tickValues: ticks };
}

export interface XAxisBandOptions {
  categories: string[];
  palette: Palette;
  plot: PlotArea;
  paddingInner?: number;
  paddingOuter?: number;
  rotate?: boolean;
}

export function renderBandXAxis(opts: XAxisBandOptions): {
  elements: SvgElement[];
  bandStart: (i: number) => number;
  bandWidth: () => number;
} {
  const { categories, palette, plot } = opts;
  const pi = opts.paddingInner ?? 0.2;
  const po = opts.paddingOuter ?? 0.1;
  const n = categories.length;
  const step = n > 0 ? plot.width / Math.max(1, n - pi + 2 * po) : plot.width;
  const bandWidth = Math.max(2, step * (1 - pi));
  const bandStart = (i: number) => plot.x + po * step + i * step;
  const size = axisFontSize({ width: plot.width + 100, height: plot.height } as Canvas);
  const labelY = plot.y + plot.height + size * 1.4;
  const out: SvgElement[] = [];

  let rotate = opts.rotate ?? false;
  if (!rotate) {
    let max = 0;
    for (const cat of categories) max = Math.max(max, estimateTextWidth(cat, size));
    if (max > step * (1 - pi) * 1.2) rotate = true;
  }

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]!;
    const cx = bandStart(i) + bandWidth / 2;
    const attrs: Record<string, string | number> = {
      x: cx,
      y: labelY,
      'font-size': size,
      'font-family': palette.fontBody,
      fill: palette.textMuted,
      'text-anchor': rotate ? 'end' : 'middle',
    };
    if (rotate) {
      attrs['transform'] = `rotate(-40 ${cx} ${labelY})`;
    }
    out.push(text(cat, attrs));
  }

  return {
    elements: out,
    bandStart,
    bandWidth: () => bandWidth,
  };
}

export interface XAxisLinearOptions {
  values: number[];
  palette: Palette;
  plot: PlotArea;
  format?: (v: number) => string;
  maxTicks?: number;
  isYear?: boolean;
}

export function renderLinearXAxis(opts: XAxisLinearOptions): {
  elements: SvgElement[];
  scale: (v: number) => number;
  tickValues: number[];
} {
  const { values, palette, plot } = opts;
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  let min = dataMin;
  let max = dataMax;
  let ticks: number[];
  if (opts.isYear || values.every((v) => Number.isInteger(v) && v >= 1500 && v <= 2200)) {
    const span = dataMax - dataMin;
    const step = span <= 5 ? 1 : span <= 20 ? 5 : span <= 60 ? 10 : span <= 150 ? 20 : 50;
    min = dataMin;
    max = dataMax;
    ticks = [];
    const firstAligned = Math.ceil(dataMin / step) * step;
    for (let v = firstAligned; v <= dataMax; v += step) {
      if (v - dataMin >= step * 0.4 && dataMax - v >= step * 0.4) ticks.push(v);
    }
    if (ticks.length === 0 || ticks[0]! - dataMin > step * 0.2) ticks.unshift(dataMin);
    if (ticks[ticks.length - 1]! !== dataMax && dataMax - ticks[ticks.length - 1]! > step * 0.2) {
      ticks.push(dataMax);
    }
  } else {
    const s = niceScale(dataMin, dataMax, opts.maxTicks ?? 6);
    ticks = s.ticks;
    min = s.min;
    max = s.max;
  }
  const scale = (v: number) => plot.x + ((v - min) / (max - min || 1)) * plot.width;
  const format = opts.format ?? pickNumberFormatter(values);
  const size = axisFontSize({ width: plot.width + 100, height: plot.height } as Canvas);
  const out: SvgElement[] = [];
  const labelY = plot.y + plot.height + size * 1.6;
  for (const t of ticks) {
    const x = scale(t);
    out.push(
      text(format(t), {
        x,
        y: labelY,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
        'text-anchor': 'middle',
      }),
    );
  }
  out.push(
    line(plot.x, plot.y + plot.height, plot.x + plot.width, plot.y + plot.height, {
      stroke: palette.axis,
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',
    }),
  );
  return { elements: out, scale, tickValues: ticks };
}

export interface XAxisDateOptions {
  values: Date[];
  palette: Palette;
  plot: PlotArea;
  maxTicks?: number;
}

export function renderDateXAxis(opts: XAxisDateOptions): {
  elements: SvgElement[];
  scale: (v: Date) => number;
} {
  const { values, palette, plot } = opts;
  const min = Math.min(...values.map((v) => v.getTime()));
  const max = Math.max(...values.map((v) => v.getTime()));
  const scale = (v: Date) => plot.x + ((v.getTime() - min) / (max - min || 1)) * plot.width;
  const n = opts.maxTicks ?? 6;
  const ticks: Date[] = [];
  if (values.length <= n) {
    ticks.push(...values);
  } else {
    for (let i = 0; i < n; i++) {
      const t = min + ((max - min) * i) / (n - 1);
      ticks.push(new Date(t));
    }
  }
  const format = pickDateFormatter(values);
  const size = axisFontSize({ width: plot.width + 100, height: plot.height } as Canvas);
  const labelY = plot.y + plot.height + size * 1.6;
  const out: SvgElement[] = [];
  for (const t of ticks) {
    const x = scale(t);
    out.push(
      text(format(t), {
        x,
        y: labelY,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
        'text-anchor': 'middle',
      }),
    );
  }
  out.push(
    line(plot.x, plot.y + plot.height, plot.x + plot.width, plot.y + plot.height, {
      stroke: palette.axis,
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',
    }),
  );
  return { elements: out, scale };
}

export function plotBackground(plot: PlotArea, palette: Palette): SvgElement {
  return rect({
    x: plot.x,
    y: plot.y,
    width: plot.width,
    height: plot.height,
    fill: palette.background === '#ffffff' ? 'none' : 'none',
  });
}

export function emptyPlotHint(plot: PlotArea, palette: Palette, message: string): SvgElement {
  return g({}, [
    rect({
      x: plot.x,
      y: plot.y,
      width: plot.width,
      height: plot.height,
      fill: palette.grid,
      opacity: 0.3,
    }),
    text(message, {
      x: plot.x + plot.width / 2,
      y: plot.y + plot.height / 2,
      'font-size': 14,
      'font-family': palette.fontBody,
      fill: palette.textMuted,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
    }),
  ]);
}

export function pickXAxisKind(values: Array<string | number | Date | null | undefined>): 'date' | 'number' | 'band' {
  let dateHits = 0;
  let numberHits = 0;
  let totalDefined = 0;
  for (const v of values) {
    if (v === null || v === undefined || v === '') continue;
    totalDefined++;
    if (v instanceof Date) {
      dateHits++;
      continue;
    }
    if (typeof v === 'number') {
      numberHits++;
      continue;
    }
    const d = toDate(v);
    if (d && d.getUTCFullYear() > 1500 && d.getUTCFullYear() < 2200 && /\d{4}/.test(String(v))) {
      dateHits++;
    }
  }
  if (totalDefined === 0) return 'band';
  if (dateHits === totalDefined && numberHits === 0) return 'date';
  if (numberHits === totalDefined) return 'number';
  return 'band';
}

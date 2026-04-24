import { ellipsize, estimateTextWidth, g, line, rect, text } from '../core/svg.js';
import { reservedHeaderHeight, smallFontSize } from '../core/layout.js';
export const LEGEND_GAP = 16;
import { niceScale } from '../formatters/tick.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { pickDateFormatter, toDate } from '../formatters/date.js';
import type { Canvas, Palette, SvgElement } from '../core/types.js';

export interface BandAxisPlan {
  rotate: boolean;
  angle: number;
  bandHeight: number;
  maxCatWidth: number;
  step: number;
  bandW: number;
  ellipsizedWidth: number | null;
}

export function planBandXAxis(
  canvas: Canvas,
  categories: string[],
  availableWidth: number,
  paddingInner = 0.2,
  paddingOuter = 0.1,
): BandAxisPlan {
  const size = smallFontSize(canvas);
  const n = Math.max(1, categories.length);
  const step = availableWidth / Math.max(1, n - paddingInner + 2 * paddingOuter);
  const bandW = Math.max(1, step * (1 - paddingInner));
  let maxCatWidth = 0;
  for (const cat of categories) {
    maxCatWidth = Math.max(maxCatWidth, estimateTextWidth(cat, size));
  }
  if (categories.length === 0 || maxCatWidth === 0) {
    return { rotate: false, angle: 0, bandHeight: Math.round(size * 1.8), maxCatWidth, step, bandW, ellipsizedWidth: null };
  }
  if (maxCatWidth <= bandW * 1.05) {
    return { rotate: false, angle: 0, bandHeight: Math.round(size * 1.8), maxCatWidth, step, bandW, ellipsizedWidth: null };
  }
  const tryAngles = [40, 55, 70, 90];
  let chosen = 90;
  for (const a of tryAngles) {
    const rad = (a * Math.PI) / 180;
    if (maxCatWidth * Math.cos(rad) <= step * 1.05) {
      chosen = a;
      break;
    }
  }
  const rad = (chosen * Math.PI) / 180;
  const maxBandHeight = Math.max(Math.round(size * 3), Math.round(canvas.height * 0.25));
  const rawHeight = Math.ceil(maxCatWidth * Math.sin(rad) + size * 1.0);
  let ellipsizedWidth: number | null = null;
  let bandHeight = rawHeight;
  if (rawHeight > maxBandHeight) {
    bandHeight = maxBandHeight;
    const maxTextLen = Math.floor((bandHeight - size * 1.0) / Math.max(0.5, Math.sin(rad)));
    ellipsizedWidth = Math.max(Math.round(size * 3), maxTextLen);
  }
  return { rotate: true, angle: chosen, bandHeight, maxCatWidth, step, bandW, ellipsizedWidth };
}

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
    title?: string;
    subtitle?: string;
    hasLegend?: boolean;
    legendHeight?: number;
    yTickWidth?: number;
    xTickHeight?: number;
    extraTop?: number;
    extraBottom?: number;
    rightGutter?: number;
  } = {},
): PlotArea {
  const font = smallFontSize(canvas);
  const header = reservedHeaderHeight(
    canvas,
    !!opts.hasTitle,
    !!opts.hasSubtitle,
    opts.title,
    opts.subtitle,
  );
  const footerH = Math.max(canvas.padding.bottom, Math.round(font * 3.2));
  const legendH = opts.hasLegend ? (opts.legendHeight ?? font * 2.4) : 0;
  const yTickW = opts.yTickWidth ?? Math.round(font * 3.2);
  const rightGutter = opts.rightGutter ?? Math.round(yTickW * 0.5);
  const xTickH = opts.xTickHeight ?? Math.round(font * 2.2);
  const extraTop = opts.extraTop ?? Math.round(font * 1.6);
  const extraBottom = opts.extraBottom ?? Math.round(font * 1.5);

  const topY = header + (legendH > 0 ? LEGEND_GAP + legendH : 0) + extraTop;
  const bottomY = canvas.height - footerH - xTickH - extraBottom;
  return {
    x: canvas.padding.left + yTickW,
    y: topY,
    width: canvas.width - canvas.padding.right - rightGutter - (canvas.padding.left + yTickW),
    height: Math.max(60, bottomY - topY),
  };
}

export function legendY(
  canvas: Canvas,
  hasTitle: boolean,
  hasSubtitle: boolean,
  title?: string,
  subtitle?: string,
): number {
  return (
    reservedHeaderHeight(canvas, hasTitle, hasSubtitle, title, subtitle) +
    LEGEND_GAP +
    smallFontSize(canvas)
  );
}

export interface YAxisOptions {
  canvas: Canvas;
  min: number;
  max: number;
  palette: Palette;
  plot: PlotArea;
  format?: (v: number) => string;
  maxTicks?: number;
  showGrid?: boolean;
  showAxisLine?: boolean;
  label?: string;
  skipBottomLabel?: boolean;
}

export function renderYAxis(opts: YAxisOptions): {
  elements: SvgElement[];
  scale: (v: number) => number;
  tickValues: number[];
} {
  const { canvas, palette, plot } = opts;
  const { ticks, min, max } = niceScale(opts.min, opts.max, opts.maxTicks ?? 5);
  const scale = (v: number) => plot.y + plot.height - ((v - min) / (max - min || 1)) * plot.height;
  const out: SvgElement[] = [];
  const size = smallFontSize(canvas);
  const format = opts.format ?? pickNumberFormatter(ticks);
  const footerTop = canvas.height - canvas.padding.bottom;
  const sortedAsc = [...ticks].sort((a, b) => a - b);
  const lowestValue = sortedAsc[0];
  const shouldSkipBottom = opts.skipBottomLabel !== false && ticks.length >= 3;

  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i]!;
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
    const textBaseline = y + size * 0.35;
    const collidesWithFooter = textBaseline > footerTop - size * 1.4;
    const isBottomMost = shouldSkipBottom && t === lowestValue;
    if (!collidesWithFooter && !isBottomMost) {
      out.push(
        text(format(t), {
          x: plot.x - 10,
          y: textBaseline,
          'font-size': size,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'end',
        }),
      );
    }
  }
  return { elements: out, scale, tickValues: ticks };
}

export interface XAxisBandOptions {
  canvas: Canvas;
  categories: string[];
  palette: Palette;
  plot: PlotArea;
  paddingInner?: number;
  paddingOuter?: number;
  rotate?: boolean;
}

export function estimateBandXAxisHeight(
  canvas: Canvas,
  categories: string[],
  availableWidth: number,
  paddingInner = 0.2,
  paddingOuter = 0.1,
): number {
  return planBandXAxis(canvas, categories, availableWidth, paddingInner, paddingOuter).bandHeight;
}

export function estimateYTickBandWidth(canvas: Canvas, values: number[], format?: (v: number) => string): number {
  const size = smallFontSize(canvas);
  if (values.length === 0) return Math.round(size * 3.0);
  const dataMin = Math.min(0, ...values);
  const dataMax = Math.max(0, ...values);
  const pad = (dataMax - dataMin) * 0.1 || 1;
  const { ticks } = niceScale(dataMin, dataMax + pad, 5);
  const fmt = format ?? pickNumberFormatter(values.length ? values : ticks);
  let widest = 0;
  for (const t of ticks) {
    widest = Math.max(widest, estimateTextWidth(fmt(t), size));
  }
  return Math.round(widest + size * 0.9);
}

export function renderBandXAxis(opts: XAxisBandOptions): {
  elements: SvgElement[];
  bandStart: (i: number) => number;
  bandWidth: () => number;
} {
  const { canvas, categories, palette, plot } = opts;
  const pi = opts.paddingInner ?? 0.2;
  const po = opts.paddingOuter ?? 0.1;
  const n = categories.length;
  const step = n > 0 ? plot.width / Math.max(1, n - pi + 2 * po) : plot.width;
  const bandWidth = Math.max(2, step * (1 - pi));
  const bandStart = (i: number) => plot.x + po * step + i * step;
  const size = smallFontSize(canvas);
  const out: SvgElement[] = [];

  const plan = planBandXAxis(canvas, categories, plot.width, pi, po);
  const rotate = opts.rotate ?? plan.rotate;
  const angle = rotate ? (opts.rotate ? 40 : plan.angle) : 0;
  const ellipsizeTo = rotate && plan.ellipsizedWidth != null ? plan.ellipsizedWidth : null;
  const labelY = plot.y + plot.height + (rotate ? size * 1.0 : size * 1.4);

  for (let i = 0; i < categories.length; i++) {
    const raw = categories[i]!;
    const cat = ellipsizeTo != null ? ellipsize(raw, size, ellipsizeTo) : raw;
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
      attrs['transform'] = `rotate(-${angle} ${cx} ${labelY})`;
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
  canvas: Canvas;
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
  const { canvas, values, palette, plot } = opts;
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
  const size = smallFontSize(canvas);
  const out: SvgElement[] = [];
  const labelY = plot.y + plot.height + size * 1.7;
  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i]!;
    const x = scale(t);
    const anchor = i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle';
    out.push(
      text(format(t), {
        x,
        y: labelY,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
        'text-anchor': anchor,
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
  canvas: Canvas;
  values: Date[];
  palette: Palette;
  plot: PlotArea;
  maxTicks?: number;
}

export function renderDateXAxis(opts: XAxisDateOptions): {
  elements: SvgElement[];
  scale: (v: Date) => number;
} {
  const { canvas, values, palette, plot } = opts;
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
  const size = smallFontSize(canvas);
  const labelY = plot.y + plot.height + size * 1.7;
  const out: SvgElement[] = [];
  for (let i = 0; i < ticks.length; i++) {
    const t = ticks[i]!;
    const x = scale(t);
    const anchor = i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle';
    out.push(
      text(format(t), {
        x,
        y: labelY,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
        'text-anchor': anchor,
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
      'font-size': 18,
      'font-family': palette.fontBody,
      fill: palette.textMuted,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
    }),
  ]);
}

export function pickXAxisKind(
  values: Array<string | number | Date | null | undefined>,
): 'date' | 'number' | 'band' {
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

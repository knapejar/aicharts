import { classifyAspect } from './size.js';
import { estimateTextWidth, wrapText } from './svg.js';
import type { AspectClass, Canvas, SizeName, SvgElement } from './types.js';

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Frame {
  canvas: Canvas;
  margin: { top: number; right: number; bottom: number; left: number };
  inner: BBox;
  title: BBox | null;
  subtitle: BBox | null;
  legend: BBox | null;
  plot: BBox;
  yTickBand: BBox;
  xTickBand: BBox;
  source: BBox | null;
  logo: BBox | null;
  tokens: FrameTokens;
  regions(): DebugRegion[];
}

export interface FrameTokens {
  bigFont: number;
  smallFont: number;
  titleLineHeight: number;
  subtitleLineHeight: number;
  descender: number;
  ascender: number;
  gapTitleToSubtitle: number;
  gapHeaderToLegend: number;
  gapLegendToPlot: number;
  gapPlotToXTicks: number;
  gapXTicksToFooter: number;
  legendSwatchHeight: number;
  legendLineHeight: number;
  yTickBandWidth: number;
  xTickBandHeight: number;
  footerHeight: number;
  plotMinWidth: number;
  plotMinHeight: number;
}

export interface DebugRegion {
  name: string;
  bbox: BBox;
  color: string;
}

export interface FrameOptions {
  title?: string;
  subtitle?: string;
  hasLegend?: boolean;
  legendLabels?: string[];
  source?: string;
  logo?: 'default' | 'none' | string;
  yTickBandWidth?: number;
  xTickBandHeight?: number;
  rightGutter?: number;
  hasXAxis?: boolean;
  hasYAxis?: boolean;
}

const OUTER_MARGIN_BY_PRESET: Record<SizeName, number> = {
  inline: 24,
  share: 32,
  square: 48,
  poster: 64,
};

const TYPOGRAPHY: Record<AspectClass, { big: number; small: number }> = {
  landscape: { big: 46, small: 28 },
  square: { big: 60, small: 34 },
  portrait: { big: 72, small: 42 },
};

const LANDSCAPE_COMPACT_THRESHOLD = 900;
const PORTRAIT_COMPACT_THRESHOLD = 1200;

function canvasAspect(canvas: Canvas): AspectClass {
  return canvas.aspect ?? classifyAspect(canvas.width, canvas.height);
}

export function bigFont(canvas: Canvas): number {
  const aspect = canvasAspect(canvas);
  const base = TYPOGRAPHY[aspect].big;
  if (aspect === 'landscape' && canvas.width < LANDSCAPE_COMPACT_THRESHOLD) return 34;
  if (aspect === 'portrait' && canvas.height < PORTRAIT_COMPACT_THRESHOLD) return 56;
  return base;
}

export function smallFont(canvas: Canvas): number {
  const aspect = canvasAspect(canvas);
  const base = TYPOGRAPHY[aspect].small;
  if (aspect === 'landscape' && canvas.width < LANDSCAPE_COMPACT_THRESHOLD) return 20;
  if (aspect === 'portrait' && canvas.height < PORTRAIT_COMPACT_THRESHOLD) return 30;
  return base;
}

export function outerMargin(canvas: Canvas): number {
  const aspect = canvasAspect(canvas);
  if (aspect === 'landscape' && canvas.width < LANDSCAPE_COMPACT_THRESHOLD) {
    return OUTER_MARGIN_BY_PRESET.inline;
  }
  if (aspect === 'portrait' && canvas.height < PORTRAIT_COMPACT_THRESHOLD) {
    return OUTER_MARGIN_BY_PRESET.square;
  }
  if (aspect === 'landscape') return OUTER_MARGIN_BY_PRESET.share;
  if (aspect === 'square') return OUTER_MARGIN_BY_PRESET.square;
  return OUTER_MARGIN_BY_PRESET.poster;
}

function maxHeaderTextWidth(canvas: Canvas, margin: number): number {
  const logoReserve = Math.round(smallFont(canvas) * 4.6);
  return canvas.width - margin * 2 - logoReserve;
}

function wrapTitle(canvas: Canvas, margin: number, title?: string): string[] {
  if (!title) return [];
  return wrapText(title, bigFont(canvas), maxHeaderTextWidth(canvas, margin), 3);
}

function wrapSubtitle(canvas: Canvas, margin: number, subtitle?: string): string[] {
  if (!subtitle) return [];
  const aspect = canvasAspect(canvas);
  const maxLines = aspect === 'portrait' ? 5 : aspect === 'square' ? 4 : 3;
  return wrapText(subtitle, smallFont(canvas), maxHeaderTextWidth(canvas, margin), maxLines);
}

function legendRowCount(
  canvas: Canvas,
  margin: number,
  labels: string[] | undefined,
): number {
  if (!labels || labels.length === 0) return 0;
  const size = smallFont(canvas);
  const swatchW = size * 1.4;
  const gap = size * 0.7;
  const itemPadX = size * 1.4;
  const availW = canvas.width - margin * 2;
  let rows = 1;
  let cursor = 0;
  for (let i = 0; i < labels.length; i++) {
    const w = swatchW + gap * 0.5 + estimateTextWidth(labels[i]!, size) + (i < labels.length - 1 ? itemPadX : 0);
    if (cursor + w > availW && cursor !== 0) {
      rows += 1;
      cursor = w;
    } else {
      cursor += w;
    }
  }
  return rows;
}

export function computeFrame(canvas: Canvas, opts: FrameOptions = {}): Frame {
  const margin = outerMargin(canvas);
  const innerX = margin;
  const innerY = margin;
  const innerW = canvas.width - margin * 2;
  const innerH = canvas.height - margin * 2;
  const inner: BBox = { x: innerX, y: innerY, width: innerW, height: innerH };

  const big = bigFont(canvas);
  const small = smallFont(canvas);
  const titleLH = Math.round(big * 1.15);
  const subtitleLH = Math.round(small * 1.3);
  const descender = Math.round(small * 0.28);
  const bigDescender = Math.round(big * 0.28);
  const ascender = Math.round(small * 0.82);

  const gapTitleToSubtitle = Math.round(small * 0.45);
  const gapHeaderToLegend = Math.round(small * 0.9);
  const gapLegendToPlot = Math.round(small * 1.0);
  const gapPlotToXTicks = Math.round(small * 0.6);
  const gapXTicksToFooter = Math.round(small * 1.0);

  const hasTitle = !!opts.title;
  const hasSubtitle = !!opts.subtitle;
  const hasLegend = !!opts.hasLegend && (opts.legendLabels?.length ?? 0) > 0;
  const hasSource = !!opts.source;
  const hasLogo = opts.logo !== 'none';
  const hasXAxis = opts.hasXAxis !== false;
  const hasYAxis = opts.hasYAxis !== false;

  const titleLines = wrapTitle(canvas, margin, opts.title);
  const subtitleLines = wrapSubtitle(canvas, margin, opts.subtitle);
  const legendRows = hasLegend ? legendRowCount(canvas, margin, opts.legendLabels) : 0;

  let cursor = innerY;
  let titleBox: BBox | null = null;
  if (hasTitle && titleLines.length > 0) {
    const h = titleLines.length * titleLH + bigDescender;
    titleBox = { x: innerX, y: cursor, width: innerW, height: h };
    cursor += h;
  }

  let subtitleBox: BBox | null = null;
  if (hasSubtitle && subtitleLines.length > 0) {
    if (titleBox) cursor += gapTitleToSubtitle;
    const h = subtitleLines.length * subtitleLH + descender;
    subtitleBox = { x: innerX, y: cursor, width: innerW, height: h };
    cursor += h;
  }

  let legendBox: BBox | null = null;
  if (hasLegend) {
    if (titleBox || subtitleBox) cursor += gapHeaderToLegend;
    const legendLineHeight = Math.round(small * 1.8);
    const legendSwatchHeight = Math.round(small * 0.75);
    const rowHeight = Math.max(legendLineHeight, legendSwatchHeight + descender);
    const h = legendRows * rowHeight;
    legendBox = { x: innerX, y: cursor, width: innerW, height: h };
    cursor += h;
  }

  const hasHeaderStack = !!(titleBox || subtitleBox || legendBox);
  if (hasHeaderStack) cursor += gapLegendToPlot;

  const footerContentH = (hasSource || hasLogo) ? small + descender : 0;
  const footerBoxH = footerContentH;
  const footerY = innerY + innerH - footerBoxH;

  let sourceBox: BBox | null = null;
  if (hasSource) {
    sourceBox = { x: innerX, y: footerY, width: innerW - Math.round(small * 4.6), height: footerContentH };
  }
  let logoBox: BBox | null = null;
  if (hasLogo) {
    const logoW = Math.round(small * 1.3 * 3.5);
    const logoH = Math.round(small * 1.5);
    logoBox = {
      x: innerX + innerW - logoW,
      y: footerY + footerContentH - logoH,
      width: logoW,
      height: logoH,
    };
  }

  const xTickBandH = hasXAxis ? (opts.xTickBandHeight ?? Math.round(small * 1.8)) : 0;
  const yTickBandW = hasYAxis ? (opts.yTickBandWidth ?? Math.round(small * 3.0)) : 0;
  const rightGutter = opts.rightGutter ?? 0;

  const plotTop = cursor;
  const plotBottom = footerY - (hasSource || hasLogo ? gapXTicksToFooter : 0) - xTickBandH - (hasXAxis ? gapPlotToXTicks : 0);

  const plotMinHeight = Math.max(80, Math.round(canvas.height * 0.25));
  const plotMinWidth = Math.max(120, Math.round(canvas.width * 0.4));

  const plotH = Math.max(plotMinHeight, plotBottom - plotTop);
  const plotX = innerX + yTickBandW;
  const plotY = plotTop;
  const plotW = Math.max(plotMinWidth, innerW - yTickBandW - rightGutter);

  const plot: BBox = { x: plotX, y: plotY, width: plotW, height: plotH };
  const yTickBand: BBox = { x: innerX, y: plotY, width: yTickBandW, height: plotH };
  const xTickBand: BBox = {
    x: plotX,
    y: plotY + plotH + (hasXAxis ? gapPlotToXTicks : 0),
    width: plotW,
    height: xTickBandH,
  };

  const tokens: FrameTokens = {
    bigFont: big,
    smallFont: small,
    titleLineHeight: titleLH,
    subtitleLineHeight: subtitleLH,
    descender,
    ascender,
    gapTitleToSubtitle,
    gapHeaderToLegend,
    gapLegendToPlot,
    gapPlotToXTicks,
    gapXTicksToFooter,
    legendSwatchHeight: Math.round(small * 0.75),
    legendLineHeight: Math.round(small * 1.8),
    yTickBandWidth: yTickBandW,
    xTickBandHeight: xTickBandH,
    footerHeight: footerBoxH,
    plotMinWidth,
    plotMinHeight,
  };

  const frame: Frame = {
    canvas,
    margin: { top: margin, right: margin, bottom: margin, left: margin },
    inner,
    title: titleBox,
    subtitle: subtitleBox,
    legend: legendBox,
    plot,
    yTickBand,
    xTickBand,
    source: sourceBox,
    logo: logoBox,
    tokens,
    regions() {
      const out: DebugRegion[] = [];
      if (titleBox) out.push({ name: 'title', bbox: titleBox, color: '#e63946' });
      if (subtitleBox) out.push({ name: 'subtitle', bbox: subtitleBox, color: '#f4a261' });
      if (legendBox) out.push({ name: 'legend', bbox: legendBox, color: '#2a9d8f' });
      out.push({ name: 'yTicks', bbox: yTickBand, color: '#9b5de5' });
      out.push({ name: 'plot', bbox: plot, color: '#1d4ed8' });
      if (hasXAxis) out.push({ name: 'xTicks', bbox: xTickBand, color: '#06b6d4' });
      if (sourceBox) out.push({ name: 'source', bbox: sourceBox, color: '#d946ef' });
      if (logoBox) out.push({ name: 'logo', bbox: logoBox, color: '#fbbf24' });
      return out;
    },
  };
  return frame;
}

export function boxesOverlap(a: BBox, b: BBox): boolean {
  if (a.x + a.width <= b.x) return false;
  if (b.x + b.width <= a.x) return false;
  if (a.y + a.height <= b.y) return false;
  if (b.y + b.height <= a.y) return false;
  return true;
}

export function boxContains(outer: BBox, inner: BBox, tolerance = 0.5): boolean {
  if (inner.x < outer.x - tolerance) return false;
  if (inner.y < outer.y - tolerance) return false;
  if (inner.x + inner.width > outer.x + outer.width + tolerance) return false;
  if (inner.y + inner.height > outer.y + outer.height + tolerance) return false;
  return true;
}

export function debugOverlay(frame: Frame): SvgElement[] {
  const out: SvgElement[] = [];
  for (const r of frame.regions()) {
    out.push({
      tag: 'rect',
      attrs: {
        x: r.bbox.x,
        y: r.bbox.y,
        width: r.bbox.width,
        height: r.bbox.height,
        fill: r.color,
        'fill-opacity': 0.12,
        stroke: r.color,
        'stroke-width': 2,
        'stroke-dasharray': '6 4',
      },
    });
    out.push({
      tag: 'text',
      attrs: {
        x: r.bbox.x + 6,
        y: r.bbox.y + 18,
        'font-size': 14,
        'font-weight': 700,
        fill: r.color,
        'font-family': 'monospace',
      },
      text: r.name,
    });
  }
  const m = frame.margin;
  out.push({
    tag: 'rect',
    attrs: {
      x: m.left,
      y: m.top,
      width: frame.canvas.width - m.left - m.right,
      height: frame.canvas.height - m.top - m.bottom,
      fill: 'none',
      stroke: '#000000',
      'stroke-width': 1,
      'stroke-dasharray': '2 4',
      'stroke-opacity': 0.5,
    },
  });
  return out;
}

import { classifyAspect } from './size.js';
import { computeFrame, outerMargin } from './frame.js';
import type { Frame } from './frame.js';
import { ellipsize, estimateTextWidth, g, line, rect, text, wrapText } from './svg.js';
import type { AspectClass, Canvas, Palette, SvgElement } from './types.js';

function headerMaxWidth(canvas: Canvas): number {
  const logoPad = Math.round(smallFontSize(canvas) * 4.6);
  return canvas.width - canvas.padding.left - canvas.padding.right - logoPad;
}

function titleLines(canvas: Canvas, title?: string): string[] {
  if (!title) return [];
  return wrapText(title, titleFontSize(canvas), headerMaxWidth(canvas), 3);
}

function subtitleLines(canvas: Canvas, subtitle?: string): string[] {
  if (!subtitle) return [];
  return wrapText(subtitle, subtitleFontSize(canvas), headerMaxWidth(canvas), 3);
}

export interface HeaderOptions {
  title?: string;
  subtitle?: string;
  palette: Palette;
  canvas: Canvas;
}

export interface FooterOptions {
  source?: string;
  logo?: 'default' | 'none' | string;
  palette: Palette;
  canvas: Canvas;
}

export interface LegendItem {
  label: string;
  color: string;
  dash?: 'solid' | 'dashed' | 'dotted';
}

export interface LegendOptions {
  items: LegendItem[];
  palette: Palette;
  canvas: Canvas;
  y: number;
}

const TYPOGRAPHY: Record<AspectClass, { big: number; small: number }> = {
  landscape: { big: 46, small: 28 },
  square: { big: 60, small: 34 },
  portrait: { big: 72, small: 42 },
};

const LANDSCAPE_COMPACT_THRESHOLD = 900;

function canvasAspect(canvas: Canvas): AspectClass {
  return canvas.aspect ?? classifyAspect(canvas.width, canvas.height);
}

export function bigFontSize(canvas: Canvas): number {
  const aspect = canvasAspect(canvas);
  const base = TYPOGRAPHY[aspect].big;
  if (aspect === 'landscape' && canvas.width < LANDSCAPE_COMPACT_THRESHOLD) return 34;
  if (aspect === 'portrait' && canvas.height < 1200) return 56;
  return base;
}

export function smallFontSize(canvas: Canvas): number {
  const aspect = canvasAspect(canvas);
  const base = TYPOGRAPHY[aspect].small;
  if (aspect === 'landscape' && canvas.width < LANDSCAPE_COMPACT_THRESHOLD) return 20;
  if (aspect === 'portrait' && canvas.height < 1200) return 30;
  return base;
}

export function titleFontSize(canvas: Canvas): number {
  return bigFontSize(canvas);
}
export function subtitleFontSize(canvas: Canvas): number {
  return smallFontSize(canvas);
}
export function labelFontSize(canvas: Canvas): number {
  return smallFontSize(canvas);
}
export function axisFontSize(canvas: Canvas): number {
  return smallFontSize(canvas);
}

export function renderHeader(opts: HeaderOptions): SvgElement[] {
  const { title, subtitle, palette, canvas } = opts;
  const out: SvgElement[] = [];
  const frame = computeFrame(canvas, { title, subtitle });
  const titleSize = frame.tokens.bigFont;
  const subtitleSize = frame.tokens.smallFont;
  const titleLineHeight = frame.tokens.titleLineHeight;
  const subtitleLineHeight = frame.tokens.subtitleLineHeight;
  const tLines = titleLines(canvas, title);
  const sLines = subtitleLines(canvas, subtitle);

  if (frame.title && tLines.length > 0) {
    let y = frame.title.y + titleSize;
    for (const l of tLines) {
      out.push(
        text(l, {
          x: frame.title.x,
          y,
          'font-size': titleSize,
          'font-weight': 700,
          'font-family': palette.fontHeadline,
          fill: palette.text,
        }),
      );
      y += titleLineHeight;
    }
  }

  if (frame.subtitle && sLines.length > 0) {
    let y = frame.subtitle.y + Math.round(subtitleSize * 0.95);
    for (const l of sLines) {
      out.push(
        text(l, {
          x: frame.subtitle.x,
          y,
          'font-size': subtitleSize,
          'font-weight': 400,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
        }),
      );
      y += subtitleLineHeight;
    }
  }
  return out;
}

export function renderFooter(opts: FooterOptions): SvgElement[] {
  const { source, logo, palette, canvas } = opts;
  const out: SvgElement[] = [];
  const frame = computeFrame(canvas, { source, logo });
  const size = frame.tokens.smallFont;
  if (source && frame.source) {
    const baseline = frame.source.y + Math.round(size * 0.82);
    const full = source.startsWith('Source') ? source : `Source: ${source}`;
    const clipped = ellipsize(full, size, frame.source.width);
    out.push(
      text(clipped, {
        x: frame.source.x,
        y: baseline,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
      }),
    );
  }
  if (logo !== 'none' && frame.logo) {
    const iconS = Math.round(size * 1.3);
    const logoX = frame.logo.x;
    const logoY = frame.logo.y;
    out.push(renderLogo(logoX, logoY, iconS, palette));
  }
  return out;
}

function renderLogo(x: number, y: number, size: number, palette: Palette): SvgElement {
  const s = size;
  const cx = x + s / 2;
  const cy = y + s / 2;
  return g(
    {
      transform: `translate(${cx} ${cy}) scale(${s / 24})`,
    },
    [
      {
        tag: 'path',
        attrs: {
          d: 'M0 -9 C -5 -9 -8 -5 -8 -1 C -8 2 -6 4 -4 5 L -4 7 C -4 8 -3 9 -2 9 L 2 9 C 3 9 4 8 4 7 L 4 5 C 6 4 8 2 8 -1 C 8 -5 5 -9 0 -9 Z',
          fill: palette.accent,
        },
      },
      {
        tag: 'rect',
        attrs: {
          x: -3,
          y: 9,
          width: 6,
          height: 2,
          rx: 1,
          fill: palette.accent,
        },
      },
      {
        tag: 'text',
        attrs: {
          x: 12,
          y: 4,
          'font-size': 14,
          'font-weight': 700,
          'font-family': palette.fontHeadline,
          fill: palette.text,
        },
        text: 'aicharts',
      },
    ],
  );
}

export function renderLegend(opts: LegendOptions): SvgElement[] {
  const { items, palette, canvas, y } = opts;
  if (items.length === 0) return [];
  const size = smallFontSize(canvas);
  const swatchW = size * 1.4;
  const gap = size * 0.7;
  const itemPadX = size * 1.4;

  const widths = items.map((item) => swatchW + gap * 0.5 + estimateTextWidth(item.label, size));

  const m = outerMargin(canvas);
  const startX = m;
  const wrapAt = canvas.width - m;

  const out: SvgElement[] = [];
  let cursorX = startX;
  let cursorY = y;
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const w = widths[i]!;
    if (cursorX + w > wrapAt && cursorX !== startX) {
      cursorX = startX;
      cursorY += size * 1.8;
    }
    const swatchY = cursorY - size * 0.65;
    if (item.dash && item.dash !== 'solid') {
      out.push(
        line(cursorX, cursorY - size * 0.3, cursorX + swatchW, cursorY - size * 0.3, {
          stroke: item.color,
          'stroke-width': 3,
          'stroke-dasharray': item.dash === 'dashed' ? '6 3' : '1 3',
          'stroke-linecap': 'round',
        }),
      );
    } else {
      out.push(
        rect({
          x: cursorX,
          y: swatchY,
          width: swatchW,
          height: size * 0.75,
          rx: 2,
          fill: item.color,
        }),
      );
    }
    out.push(
      text(item.label, {
        x: cursorX + swatchW + gap * 0.5,
        y: cursorY,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.text,
        'dominant-baseline': 'alphabetic',
      }),
    );
    cursorX += w + itemPadX;
  }
  return out;
}

export function reservedHeaderHeight(
  canvas: Canvas,
  hasTitle: boolean,
  hasSubtitle: boolean,
  title?: string,
  subtitle?: string,
): number {
  const frame = computeFrame(canvas, {
    title: hasTitle ? title ?? 'X' : undefined,
    subtitle: hasSubtitle ? subtitle ?? 'X' : undefined,
  });
  if (frame.subtitle) return frame.subtitle.y + frame.subtitle.height;
  if (frame.title) return frame.title.y + frame.title.height;
  return frame.margin.top;
}

export function headerBottomY(
  canvas: Canvas,
  hasTitle: boolean,
  hasSubtitle: boolean,
  title?: string,
  subtitle?: string,
): number {
  return reservedHeaderHeight(canvas, hasTitle, hasSubtitle, title, subtitle);
}

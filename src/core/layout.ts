import { estimateTextWidth, g, line, rect, text } from './svg.js';
import type { Canvas, Palette, SvgElement } from './types.js';

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

export function titleFontSize(canvas: Canvas): number {
  return Math.round(Math.max(18, Math.min(32, canvas.width * 0.022)));
}
export function subtitleFontSize(canvas: Canvas): number {
  return Math.round(titleFontSize(canvas) * 0.66);
}
export function labelFontSize(canvas: Canvas): number {
  return Math.round(Math.max(11, Math.min(14, canvas.width * 0.011)));
}
export function axisFontSize(canvas: Canvas): number {
  return labelFontSize(canvas);
}

export function renderHeader(opts: HeaderOptions): SvgElement[] {
  const { title, subtitle, palette, canvas } = opts;
  const out: SvgElement[] = [];
  const x = canvas.padding.left;
  const titleSize = titleFontSize(canvas);
  const subtitleSize = subtitleFontSize(canvas);
  let y = Math.round(titleSize * 1.5);
  if (title) {
    out.push(
      text(title, {
        x,
        y,
        'font-size': titleSize,
        'font-weight': 700,
        'font-family': palette.fontHeadline,
        fill: palette.text,
      }),
    );
    y += Math.round(subtitleSize * 1.8);
  }
  if (subtitle) {
    out.push(
      text(subtitle, {
        x,
        y,
        'font-size': subtitleSize,
        'font-weight': 400,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
      }),
    );
  }
  return out;
}

export function renderFooter(opts: FooterOptions): SvgElement[] {
  const { source, logo, palette, canvas } = opts;
  const out: SvgElement[] = [];
  const size = labelFontSize(canvas);
  const y = canvas.height - Math.round(size * 1.4);
  if (source) {
    out.push(
      text(source.startsWith('Source') ? source : `Source: ${source}`, {
        x: canvas.padding.left,
        y,
        'font-size': size,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
      }),
    );
  }
  if (logo !== 'none') {
    const logoSize = Math.round(size * 1.6);
    const logoX = canvas.width - canvas.padding.right - logoSize;
    const logoY = y - logoSize * 0.8;
    out.push(renderLogo(logoX, logoY, logoSize, palette));
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
          'font-size': 12,
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
  const size = labelFontSize(canvas);
  const swatchW = size * 1.4;
  const gap = size * 0.8;
  const itemPadX = size * 1.8;

  const widths = items.map((item) => swatchW + gap * 0.5 + estimateTextWidth(item.label, size));
  const totalW = widths.reduce((a, b) => a + b + itemPadX, -itemPadX);

  const startX = canvas.padding.left;
  const wrapAt = canvas.width - canvas.padding.right;

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
    const swatchY = cursorY - size * 0.6;
    if (item.dash && item.dash !== 'solid') {
      out.push(
        line(cursorX, cursorY - size * 0.3, cursorX + swatchW, cursorY - size * 0.3, {
          stroke: item.color,
          'stroke-width': 2.5,
          'stroke-dasharray': item.dash === 'dashed' ? '4 2' : '1 2',
          'stroke-linecap': 'round',
        }),
      );
    } else {
      out.push(
        rect({
          x: cursorX,
          y: swatchY,
          width: swatchW,
          height: size * 0.7,
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
  void totalW;
  return out;
}

export function reservedHeaderHeight(canvas: Canvas, hasTitle: boolean, hasSubtitle: boolean): number {
  const t = titleFontSize(canvas);
  const s = subtitleFontSize(canvas);
  let h = 0;
  if (hasTitle) h += Math.round(t * 1.5);
  if (hasSubtitle) h += Math.round(s * 1.8);
  return h;
}

export function headerBottomY(canvas: Canvas, hasTitle: boolean, hasSubtitle: boolean): number {
  const t = titleFontSize(canvas);
  const s = subtitleFontSize(canvas);
  let y = 0;
  if (hasTitle) y = Math.round(t * 1.5) + Math.round(s * 1.0);
  if (hasSubtitle) y = (hasTitle ? y : 0) + Math.round(s * 1.0);
  return y;
}

import { g, line as svgLine, rect, text } from '../core/svg.js';
import { labelFontSize, reservedHeaderHeight } from '../core/layout.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { niceScale } from '../formatters/tick.js';
import type { BarSplitConfig, SvgElement, Theme } from '../core/types.js';

export function renderBarSplit(cfg: BarSplitConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = cfg.y;
  const out: SvgElement[] = [];
  if (!cfg.data || cfg.data.length === 0 || series.length === 0) {
    return out;
  }
  const labelSize = labelFontSize(canvas);
  const categories = cfg.data.map((r) => String(r[cfg.x] ?? ''));

  const columns = cfg.columns ?? Math.min(series.length, series.length <= 3 ? series.length : 3);
  const rows = Math.ceil(series.length / columns);
  const top = reservedHeaderHeight(canvas, !!cfg.title, !!cfg.subtitle) + 32;
  const footer = labelSize * 3.2;
  const gridX = canvas.padding.left;
  const gridW = canvas.width - canvas.padding.left - canvas.padding.right;
  const gridY = top;
  const gridH = canvas.height - top - footer;
  const cellGapX = 24;
  const cellGapY = 36;
  const cellW = (gridW - cellGapX * (columns - 1)) / columns;
  const cellH = (gridH - cellGapY * (rows - 1)) / rows;
  const innerPadLeft = 52;
  const innerPadBottom = 26;
  const innerPadTop = 22;

  let allValues: number[] = [];
  if (cfg.sharedScale !== false) {
    for (const s of series) {
      for (const r of cfg.data) {
        const v = Number(r[s] ?? 0);
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

    const values = cfg.data.map((r) => Number(r[s] ?? 0));
    const localAll = cfg.sharedScale !== false ? allValues : values;
    const vMin = Math.min(0, ...localAll);
    const vMax = Math.max(0, ...localAll);
    const scale = niceScale(vMin, vMax, 4);
    const yScale = (v: number) =>
      plotY + plotH - ((v - scale.min) / (scale.max - scale.min || 1)) * plotH;

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
    for (const t of scale.ticks) {
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

    const n = categories.length;
    const bandW = plotW / n;
    const barW = bandW * 0.7;
    const baseY = yScale(0);
    const color = palette.colors[si % palette.colors.length]!;
    const bars: SvgElement[] = [];
    for (let i = 0; i < n; i++) {
      const v = values[i]!;
      const bx = plotX + i * bandW + (bandW - barW) / 2;
      const by = v >= 0 ? yScale(v) : baseY;
      const bh = Math.abs(yScale(v) - baseY);
      bars.push(
        rect({
          x: bx,
          y: by,
          width: barW,
          height: Math.max(0.5, bh),
          fill: color,
          rx: 1,
        }),
      );
    }
    out.push(g({}, bars));
    out.push(
      svgLine(plotX, baseY, plotX + plotW, baseY, {
        stroke: palette.axis,
        'stroke-width': 1,
        'shape-rendering': 'crispEdges',
      }),
    );

    const labelStride = Math.max(1, Math.ceil(n / 5));
    for (let i = 0; i < n; i += labelStride) {
      out.push(
        text(categories[i]!, {
          x: plotX + i * bandW + bandW / 2,
          y: plotY + plotH + labelSize * 1.4,
          'font-size': labelSize * 0.8,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'middle',
        }),
      );
    }
  }

  return out;
}

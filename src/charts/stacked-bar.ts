import { g, line as svgLine, rect, text } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import {
  computePlotArea,
  emptyPlotHint,
  legendY,
  renderBandXAxis,
  renderYAxis,
} from './axes.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { niceScale } from '../formatters/tick.js';
import type { StackedBarConfig, SvgElement, Theme } from '../core/types.js';

export function renderStackedBar(cfg: StackedBarConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = Array.isArray(cfg.y) ? cfg.y : [cfg.y];
  const plot = computePlotArea(canvas, {
    hasTitle: !!cfg.title,
    hasSubtitle: !!cfg.subtitle,
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend: true,
  });
  const out: SvgElement[] = [];

  if (!cfg.data || cfg.data.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No data'));
    return out;
  }

  const orientation = cfg.orientation ?? 'vertical';
  const categories = cfg.data.map((r) => String(r[cfg.x] ?? ''));
  const totals: number[] = [];
  for (const r of cfg.data) {
    let t = 0;
    for (const s of series) t += Number(r[s] ?? 0);
    totals.push(t);
  }
  const maxTotal = cfg.normalize ? 1 : Math.max(...totals, 0);
  const padMax = cfg.normalize ? 0 : maxTotal * 0.04 || 1;
  const fmt = cfg.normalize
    ? (v: number) => Math.round(v * 100) + '%'
    : pickNumberFormatter(totals, cfg.yFormat);
  const labelSize = labelFontSize(canvas);
  const orderedSeries = cfg.reverseStackOrder ? [...series].reverse() : series;

  if (orientation === 'vertical') {
    const { elements: yElems, scale: yScale } = renderYAxis({
      canvas,
      min: 0,
      max: maxTotal + padMax,
      palette,
      plot,
      format: fmt,
    });
    out.push(...yElems);

    const { elements: xElems, bandStart, bandWidth } = renderBandXAxis({
      canvas,
      categories,
      palette,
      plot,
      paddingInner: 0.3,
      paddingOuter: 0.15,
    });
    out.push(...xElems);

    const bw = bandWidth();
    const baseY = yScale(0);
    const bars: SvgElement[] = [];
    for (let i = 0; i < categories.length; i++) {
      const row = cfg.data[i]!;
      const rowTotal = totals[i]!;
      const bx = bandStart(i);
      let cursor = 0;
      for (let s = 0; s < orderedSeries.length; s++) {
        const key = orderedSeries[s]!;
        let v = Number(row[key] ?? 0);
        if (cfg.normalize) v = rowTotal > 0 ? v / rowTotal : 0;
        if (v <= 0) continue;
        const top = cursor + v;
        const y = yScale(top);
        const h = yScale(cursor) - y;
        cursor = top;
        bars.push(
          rect({
            x: bx,
            y,
            width: bw,
            height: Math.max(0.5, h),
            fill: palette.colors[
              series.indexOf(key) % palette.colors.length
            ]!,
          }),
        );
      }
      if (cfg.showTotals && !cfg.normalize) {
        const top = yScale(rowTotal);
        bars.push(
          text(fmt(rowTotal), {
            x: bx + bw / 2,
            y: top - 6,
            'font-size': labelSize,
            'font-weight': 600,
            'font-family': palette.fontBody,
            fill: palette.text,
            'text-anchor': 'middle',
          }),
        );
      }
    }
    out.push(g({}, bars));

    out.push(
      svgLine(plot.x, baseY, plot.x + plot.width, baseY, {
        stroke: palette.axis,
        'stroke-width': 1,
        'shape-rendering': 'crispEdges',
      }),
    );
  } else {
    const maxLabelLen = Math.max(...categories.map((c) => c.length));
    const yTickWidth = Math.min(240, 8 + Math.max(64, maxLabelLen * labelSize * 0.55));
    const horizPlot = computePlotArea(canvas, {
      hasTitle: !!cfg.title,
      hasSubtitle: !!cfg.subtitle,
      title: cfg.title,
      subtitle: cfg.subtitle,
      hasLegend: true,
      yTickWidth,
    });
    const n = categories.length;
    const po = 0.15;
    const pi = 0.3;
    const step = horizPlot.height / Math.max(1, n - pi + 2 * po);
    const bh = Math.max(2, step * (1 - pi));
    const niceX = niceScale(0, maxTotal + padMax, 5);
    const xScale = (v: number) =>
      horizPlot.x + ((v - niceX.min) / (niceX.max - niceX.min || 1)) * horizPlot.width;

    for (const t of niceX.ticks) {
      out.push(
        svgLine(xScale(t), horizPlot.y, xScale(t), horizPlot.y + horizPlot.height, {
          stroke: palette.grid,
          'stroke-width': 1,
          'shape-rendering': 'crispEdges',
        }),
      );
      out.push(
        text(fmt(t), {
          x: xScale(t),
          y: horizPlot.y + horizPlot.height + labelSize * 1.6,
          'font-size': labelSize,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'middle',
        }),
      );
    }

    for (let i = 0; i < categories.length; i++) {
      const row = cfg.data[i]!;
      const rowTotal = totals[i]!;
      const by = horizPlot.y + po * step + i * step;
      let cursor = 0;
      for (const key of orderedSeries) {
        let v = Number(row[key] ?? 0);
        if (cfg.normalize) v = rowTotal > 0 ? v / rowTotal : 0;
        if (v <= 0) continue;
        const bx = xScale(cursor);
        const bwidth = xScale(cursor + v) - bx;
        cursor += v;
        out.push(
          rect({
            x: bx,
            y: by,
            width: Math.max(1, bwidth),
            height: bh,
            fill: palette.colors[series.indexOf(key) % palette.colors.length]!,
          }),
        );
      }
      out.push(
        text(categories[i]!, {
          x: horizPlot.x - 8,
          y: by + bh / 2 + labelSize * 0.35,
          'font-size': labelSize,
          'font-family': palette.fontBody,
          fill: palette.text,
          'text-anchor': 'end',
        }),
      );
    }
  }

  out.push(
    ...renderLegend({
      items: series.map((key, i) => ({
        label: key,
        color: palette.colors[i % palette.colors.length]!,
      })),
      palette,
      canvas,
      y: legendY(canvas, !!cfg.title, !!cfg.subtitle, cfg.title, cfg.subtitle),
    }),
  );

  return out;
}

import { estimateTextWidth, g, line as svgLine, rect, text } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import {
  emptyPlotHint,
  estimateBandXAxisHeight,
  estimateYTickBandWidth,
  renderBandXAxis,
  renderYAxis,
} from './axes.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { smartLabel } from '../formatters/label.js';
import { niceScale } from '../formatters/tick.js';
import type { StackedBarConfig, SvgElement, Theme } from '../core/types.js';

export function renderStackedBar(cfg: StackedBarConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = Array.isArray(cfg.y) ? cfg.y : [cfg.y];
  const out: SvgElement[] = [];

  if (!cfg.data || cfg.data.length === 0) {
    const frame = computeFrame(canvas, {
      title: cfg.title,
      subtitle: cfg.subtitle,
      hasLegend: true,
      legendLabels: series,
      source: cfg.source,
      logo: cfg.logo ?? 'default',
    });
    out.push(emptyPlotHint(frame.plot, palette, 'No data'));
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
  const totalFmt = pickNumberFormatter(totals, cfg.yFormat);
  const labelSize = labelFontSize(canvas);
  const orderedSeries = cfg.reverseStackOrder ? [...series].reverse() : series;

  let legendFrameRef: ReturnType<typeof computeFrame> | null = null;
  if (orientation === 'vertical') {
    const xTickBandHeight = estimateBandXAxisHeight(
      canvas,
      categories,
      canvas.width * 0.85,
      0.3,
      0.15,
    );
    const yTickBandWidth = estimateYTickBandWidth(
      canvas,
      cfg.normalize ? [0, 1] : totals,
      fmt,
    );
    const frame = computeFrame(canvas, {
      xTickBandHeight,
      yTickBandWidth,
      title: cfg.title,
      subtitle: cfg.subtitle,
      hasLegend: true,
      legendLabels: series,
      source: cfg.source,
      logo: cfg.logo ?? 'default',
    });
    legendFrameRef = frame;
    const plot = frame.plot;
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
      if (cfg.showTotals) {
        const top = yScale(cfg.normalize ? 1 : rowTotal);
        const totalText = totalFmt(rowTotal);
        bars.push(
          text(totalText, {
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
    const widestCat = Math.max(...categories.map((c) => estimateTextWidth(c, labelSize)));
    const yTickWidth = Math.min(
      Math.round(canvas.width * 0.34),
      Math.ceil(widestCat + labelSize * 0.8),
    );
    const rightGutter = Math.round(labelSize * 0.8);
    const frame = computeFrame(canvas, {
      title: cfg.title,
      subtitle: cfg.subtitle,
      hasLegend: true,
      legendLabels: series,
      source: cfg.source,
      logo: cfg.logo ?? 'default',
      yTickBandWidth: yTickWidth,
    });
    legendFrameRef = frame;
    const horizPlot = {
      x: frame.plot.x,
      y: frame.plot.y,
      width: Math.max(60, frame.plot.width - rightGutter),
      height: frame.plot.height,
    };
    const n = categories.length;
    const po = 0.15;
    const pi = 0.3;
    const step = horizPlot.height / Math.max(1, n - pi + 2 * po);
    const bh = Math.max(2, step * (1 - pi));
    const niceX = niceScale(0, maxTotal + padMax, 5);
    const xScale = (v: number) =>
      horizPlot.x + ((v - niceX.min) / (niceX.max - niceX.min || 1)) * horizPlot.width;

    for (let ti = 0; ti < niceX.ticks.length; ti++) {
      const t = niceX.ticks[ti]!;
      const anchor = ti === 0 ? 'start' : ti === niceX.ticks.length - 1 ? 'end' : 'middle';
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
          'text-anchor': anchor,
        }),
      );
    }

    for (let i = 0; i < categories.length; i++) {
      const row = cfg.data[i]!;
      const rowTotal = totals[i]!;
      const by = horizPlot.y + po * step + i * step;
      let cursor = 0;
      const rightLimit = horizPlot.x + horizPlot.width;
      for (const key of orderedSeries) {
        let v = Number(row[key] ?? 0);
        if (cfg.normalize) v = rowTotal > 0 ? v / rowTotal : 0;
        if (v <= 0) continue;
        const bx = xScale(cursor);
        const rawRight = xScale(cursor + v);
        const clippedRight = Math.min(rawRight, rightLimit);
        const bwidth = Math.max(0.5, clippedRight - bx);
        cursor += v;
        out.push(
          rect({
            x: bx,
            y: by,
            width: bwidth,
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
      if (cfg.showTotals) {
        const labelX = xScale(cfg.normalize ? 1 : rowTotal);
        out.push(
          text(totalFmt(rowTotal), {
            x: Math.min(rightLimit, labelX) + 6,
            y: by + bh / 2 + labelSize * 0.35,
            'font-size': labelSize,
            'font-weight': 600,
            'font-family': palette.fontBody,
            fill: palette.text,
            'text-anchor': 'start',
          }),
        );
      }
    }
  }

  if (legendFrameRef && legendFrameRef.legend) {
    out.push(
      ...renderLegend({
        items: series.map((key, i) => ({
          label: smartLabel(key),
          color: palette.colors[i % palette.colors.length]!,
        })),
        palette,
        canvas,
        y: legendFrameRef.legend.y + legendFrameRef.tokens.ascender,
      }),
    );
  }

  return out;
}

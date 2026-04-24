import { g, line as svgLine, rect, text } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import {
  emptyPlotHint,
  estimateBandXAxisHeight,
  renderBandXAxis,
  renderYAxis,
} from './axes.js';
import { pickNumberFormatter } from '../formatters/number.js';
import type { GroupedBarConfig, SvgElement, Theme } from '../core/types.js';

export function renderGroupedBar(cfg: GroupedBarConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = Array.isArray(cfg.y) ? cfg.y : [cfg.y];
  const hasLegend = series.length > 1;
  const categoriesForHeight = (cfg.data ?? []).map((r) => String(r[cfg.x] ?? ''));
  const xTickBandHeight = estimateBandXAxisHeight(
    canvas,
    categoriesForHeight,
    canvas.width * 0.85,
  );
  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend,
    legendLabels: hasLegend ? series : undefined,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    xTickBandHeight,
  });
  const plot = frame.plot;
  const out: SvgElement[] = [];

  if (!cfg.data || cfg.data.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No data'));
    return out;
  }

  const categories = cfg.data.map((r) => String(r[cfg.x] ?? ''));
  const allValues: number[] = [];
  for (const s of series) {
    for (const r of cfg.data) {
      const v = Number(r[s] ?? 0);
      if (Number.isFinite(v)) allValues.push(v);
    }
  }
  if (allValues.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No numeric values'));
    return out;
  }
  const vMin = Math.min(0, ...allValues);
  const vMax = Math.max(0, ...allValues);
  const padMax = (vMax - vMin) * 0.08 || 1;
  const fmt = pickNumberFormatter(allValues, cfg.yFormat);
  const labelSize = labelFontSize(canvas);

  const { elements: yElems, scale: yScale } = renderYAxis({
    canvas,
    min: vMin,
    max: vMax + padMax,
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
    paddingOuter: 0.1,
  });
  out.push(...xElems);

  const groupWidth = bandWidth();
  const barGap = cfg.barGap ?? 2;
  const barWidth = Math.max(
    2,
    (groupWidth - barGap * (series.length - 1)) / series.length,
  );
  const baseY = yScale(0);

  const bars: SvgElement[] = [];
  for (let i = 0; i < categories.length; i++) {
    const groupX = bandStart(i);
    for (let s = 0; s < series.length; s++) {
      const key = series[s]!;
      const v = Number(cfg.data[i]![key] ?? 0);
      if (!Number.isFinite(v)) continue;
      const bx = groupX + s * (barWidth + barGap);
      const by = v >= 0 ? yScale(v) : baseY;
      const bh = Math.abs(yScale(v) - baseY);
      bars.push(
        rect({
          x: bx,
          y: by,
          width: barWidth,
          height: bh,
          fill: palette.colors[s % palette.colors.length]!,
          rx: 1,
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

  if (hasLegend && frame.legend) {
    out.push(
      ...renderLegend({
        items: series.map((key, i) => ({
          label: key,
          color: palette.colors[i % palette.colors.length]!,
        })),
        palette,
        canvas,
        y: frame.legend.y + frame.tokens.ascender,
      }),
    );
  }

  if (cfg.showValueLabels) {
    const labels: SvgElement[] = [];
    for (let i = 0; i < categories.length; i++) {
      const groupX = bandStart(i);
      for (let s = 0; s < series.length; s++) {
        const key = series[s]!;
        const v = Number(cfg.data[i]![key] ?? 0);
        const cx = groupX + s * (barWidth + barGap) + barWidth / 2;
        const cy = v >= 0 ? yScale(v) - 6 : yScale(v) + labelSize + 4;
        labels.push(
          text(fmt(v), {
            x: cx,
            y: cy,
            'font-size': labelSize,
            'font-weight': 600,
            'font-family': palette.fontBody,
            fill: palette.text,
            'text-anchor': 'middle',
          }),
        );
      }
    }
    out.push(g({}, labels));
  }

  return out;
}

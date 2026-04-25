import { ellipsizeUniqueLabels, estimateTextWidth, g, line as svgLine, rect, text } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import {
  emptyPlotHint,
  estimateBandXAxisHeight,
  estimateYTickBandWidth,
  renderBandXAxis,
  renderYAxis,
} from './axes.js';
import { niceScale } from '../formatters/tick.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { smartLabel } from '../formatters/label.js';
import type { GroupedBarConfig, SvgElement, Theme } from '../core/types.js';

export function renderGroupedBar(cfg: GroupedBarConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const series = Array.isArray(cfg.y) ? cfg.y : [cfg.y];
  const hasLegend = series.length > 1;
  if (cfg.orientation === 'horizontal') {
    return renderGroupedBarHorizontal(cfg, theme, series, hasLegend);
  }
  const categoriesForHeight = (cfg.data ?? []).map((r) => String(r[cfg.x] ?? ''));
  const xTickBandHeight = estimateBandXAxisHeight(
    canvas,
    categoriesForHeight,
    canvas.width * 0.85,
    0.3,
    0.1,
  );
  const yValuesUpfront: number[] = [];
  for (const s of series) {
    for (const r of cfg.data ?? []) {
      const v = Number(r[s] ?? NaN);
      if (Number.isFinite(v)) yValuesUpfront.push(v);
    }
  }
  const yTickBandWidth = estimateYTickBandWidth(canvas, yValuesUpfront);
  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend,
    legendLabels: hasLegend ? series.map((s) => smartLabel(s)) : undefined,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    xTickBandHeight,
    yTickBandWidth,
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
          label: smartLabel(key),
          color: palette.colors[i % palette.colors.length]!,
        })),
        palette,
        canvas,
        y: frame.legend.y + frame.tokens.ascender,
      }),
    );
  }

  if (cfg.showValueLabels) {
    let widestValueLabel = 0;
    for (const s of series) {
      for (const r of cfg.data) {
        const v = Number(r[s] ?? 0);
        if (!Number.isFinite(v)) continue;
        widestValueLabel = Math.max(widestValueLabel, estimateTextWidth(fmt(v), labelSize));
      }
    }
    const labelsFitHorizontal = widestValueLabel <= barWidth * 1.05;
    const useSmaller = !labelsFitHorizontal;
    const valueLabelSize = useSmaller ? Math.max(Math.round(labelSize * 0.75), 14) : labelSize;
    const widestSmaller = widestValueLabel * (valueLabelSize / labelSize);
    const fitsAfterShrink = widestSmaller <= barWidth * 1.1;
    const useRotated = false;
    if (labelsFitHorizontal || fitsAfterShrink || useRotated) {
      const labels: SvgElement[] = [];
      for (let i = 0; i < categories.length; i++) {
        const groupX = bandStart(i);
        for (let s = 0; s < series.length; s++) {
          const key = series[s]!;
          const v = Number(cfg.data[i]![key] ?? 0);
          if (!Number.isFinite(v)) continue;
          const cx = groupX + s * (barWidth + barGap) + barWidth / 2;
          if (useRotated) {
            const ty = v >= 0 ? yScale(v) - valueLabelSize * 0.4 : yScale(v) + valueLabelSize * 1.2;
            labels.push(
              text(fmt(v), {
                x: cx,
                y: ty,
                'font-size': valueLabelSize,
                'font-weight': 600,
                'font-family': palette.fontBody,
                fill: palette.text,
                'text-anchor': 'end',
                transform: `rotate(-90 ${cx} ${ty})`,
              }),
            );
          } else {
            const cy = v >= 0 ? yScale(v) - 6 : yScale(v) + valueLabelSize + 4;
            labels.push(
              text(fmt(v), {
                x: cx,
                y: cy,
                'font-size': valueLabelSize,
                'font-weight': 600,
                'font-family': palette.fontBody,
                fill: palette.text,
                'text-anchor': 'middle',
              }),
            );
          }
        }
      }
      out.push(g({}, labels));
    }
  }

  return out;
}

function renderGroupedBarHorizontal(
  cfg: GroupedBarConfig,
  theme: Theme,
  series: string[],
  hasLegend: boolean,
): SvgElement[] {
  const { palette, canvas } = theme;
  const out: SvgElement[] = [];
  const data = cfg.data ?? [];
  const labelSize = labelFontSize(canvas);

  if (data.length === 0) {
    const frame = computeFrame(canvas, {
      title: cfg.title,
      subtitle: cfg.subtitle,
      hasLegend,
      legendLabels: hasLegend ? series.map((s) => smartLabel(s)) : undefined,
      source: cfg.source,
      logo: cfg.logo ?? 'default',
      hasXAxis: false,
      hasYAxis: false,
    });
    out.push(emptyPlotHint(frame.plot, palette, 'No data'));
    return out;
  }

  const categories = data.map((r) => String(r[cfg.x] ?? ''));
  const allValues: number[] = [];
  for (const s of series) {
    for (const r of data) {
      const v = Number(r[s] ?? 0);
      if (Number.isFinite(v)) allValues.push(v);
    }
  }
  if (allValues.length === 0) {
    const frame = computeFrame(canvas, {
      title: cfg.title,
      subtitle: cfg.subtitle,
      hasLegend,
      legendLabels: hasLegend ? series.map((s) => smartLabel(s)) : undefined,
      source: cfg.source,
      logo: cfg.logo ?? 'default',
      hasXAxis: false,
      hasYAxis: false,
    });
    out.push(emptyPlotHint(frame.plot, palette, 'No numeric values'));
    return out;
  }

  const fmt = pickNumberFormatter(allValues, cfg.yFormat);
  const widestValueLabel = Math.max(
    ...allValues.map((v) => estimateTextWidth(fmt(v), labelSize)),
  );
  const widestCategory = Math.max(
    ...categories.map((c) => estimateTextWidth(c, labelSize)),
  );
  const valueLabelReserve = cfg.showValueLabels
    ? Math.ceil(widestValueLabel + labelSize * 0.8)
    : Math.round(labelSize * 0.4);
  const yTickWidth = Math.min(
    Math.round(canvas.width * 0.34),
    Math.ceil(widestCategory + labelSize * 0.8),
  );

  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend,
    legendLabels: hasLegend ? series.map((s) => smartLabel(s)) : undefined,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    yTickBandWidth: yTickWidth,
  });
  const horizPlot = {
    x: frame.plot.x,
    y: frame.plot.y,
    width: Math.max(60, frame.plot.width - valueLabelReserve),
    height: frame.plot.height,
  };

  const vMin = Math.min(0, ...allValues);
  const vMax = Math.max(0, ...allValues);
  const xMin = vMin;
  const xMax = vMax <= 0 ? 0 : vMax;
  const xScale = (v: number) =>
    horizPlot.x + ((v - xMin) / (xMax - xMin || 1)) * horizPlot.width;
  const niceTicks = niceScale(xMin, xMax, 5).ticks.filter(
    (t) => t >= xMin - 1e-9 && t <= xMax + xMax * 0.02 + 1e-9,
  );

  for (let ti = 0; ti < niceTicks.length; ti++) {
    const t = niceTicks[ti]!;
    const anchor = ti === 0 ? 'start' : ti === niceTicks.length - 1 ? 'end' : 'middle';
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
        y: horizPlot.y + horizPlot.height + labelSize * 1.8,
        'font-size': labelSize,
        'font-family': palette.fontBody,
        fill: palette.textMuted,
        'text-anchor': anchor,
      }),
    );
  }

  const n = categories.length;
  const groupStep = horizPlot.height / Math.max(1, n);
  const groupPad = groupStep * 0.2;
  const innerHeight = groupStep - groupPad;
  const barH = Math.max(2, innerHeight / series.length);
  const labelBudget = yTickWidth - labelSize * 0.8;
  const ellipsizedCats = ellipsizeUniqueLabels(categories, labelSize, labelBudget);

  const bars: SvgElement[] = [];
  const labels: SvgElement[] = [];
  for (let i = 0; i < n; i++) {
    const groupY = horizPlot.y + i * groupStep + groupPad / 2;
    out.push(
      text(ellipsizedCats[i]!, {
        x: horizPlot.x - 10,
        y: groupY + innerHeight / 2 + labelSize * 0.35,
        'font-size': labelSize,
        'font-family': palette.fontBody,
        fill: palette.text,
        'text-anchor': 'end',
      }),
    );
    for (let s = 0; s < series.length; s++) {
      const key = series[s]!;
      const v = Number(data[i]![key] ?? 0);
      if (!Number.isFinite(v)) continue;
      const cxStart = xScale(0);
      const cx = xScale(v);
      const bx = Math.min(cxStart, cx);
      const bw = Math.abs(cx - cxStart);
      const by = groupY + s * barH;
      bars.push(
        rect({
          x: bx,
          y: by,
          width: Math.max(1, bw),
          height: barH * 0.92,
          fill: palette.colors[s % palette.colors.length]!,
          rx: 1,
        }),
      );
      if (cfg.showValueLabels) {
        const labelX = v >= 0 ? cx + labelSize * 0.4 : cx - labelSize * 0.4;
        labels.push(
          text(fmt(v), {
            x: labelX,
            y: by + barH * 0.5 + labelSize * 0.35,
            'font-size': labelSize,
            'font-weight': 600,
            'font-family': palette.fontBody,
            fill: palette.text,
            'text-anchor': v >= 0 ? 'start' : 'end',
          }),
        );
      }
    }
  }
  out.push(g({}, bars));
  out.push(g({}, labels));

  if (hasLegend && frame.legend) {
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

  return out;
}

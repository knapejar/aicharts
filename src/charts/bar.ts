import { estimateTextWidth, g, line as svgLine, rect, text } from '../core/svg.js';
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
import type { BarConfig, SvgElement, Theme } from '../core/types.js';

function resolveFields(cfg: BarConfig): { labelKey: string; valueKey: string } {
  const labelKey = cfg.label ?? cfg.x ?? 'label';
  const valueKey = cfg.value ?? cfg.y ?? 'value';
  return { labelKey, valueKey };
}

function thickness(t: BarConfig['barThickness']): number {
  if (t === 'thin') return 0.4;
  if (t === 'thick') return 0.85;
  return 0.65;
}

export function renderBar(cfg: BarConfig, theme: Theme): SvgElement[] {
  const { palette, canvas } = theme;
  const out: SvgElement[] = [];
  const plot = computePlotArea(canvas, {
    hasTitle: !!cfg.title,
    hasSubtitle: !!cfg.subtitle,
    title: cfg.title,
    subtitle: cfg.subtitle,
  });
  if (!cfg.data || cfg.data.length === 0) {
    out.push(emptyPlotHint(plot, palette, 'No data'));
    return out;
  }
  const { labelKey, valueKey } = resolveFields(cfg);
  let rows = cfg.data.map((r, i) => ({
    label: String(r[labelKey] ?? i),
    value: Number(r[valueKey] ?? 0),
    _idx: i,
  }));
  if (cfg.sort === 'desc') rows = [...rows].sort((a, b) => b.value - a.value);
  else if (cfg.sort === 'asc') rows = [...rows].sort((a, b) => a.value - b.value);

  const orientation = cfg.orientation ?? (rows.length > 8 ? 'horizontal' : 'vertical');
  const values = rows.map((r) => r.value);
  const vMin = Math.min(0, ...values);
  const vMax = Math.max(0, ...values);
  const padMax = (vMax - vMin) * 0.08 || 1;

  const labelSize = labelFontSize(canvas);
  const fmt = pickNumberFormatter(values, cfg.yFormat);
  const barPad = 1 - thickness(cfg.barThickness);
  const primaryColor = palette.colors[0]!;

  if (orientation === 'vertical') {
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
      categories: rows.map((r) => r.label),
      palette,
      plot,
      paddingInner: barPad,
      paddingOuter: barPad * 0.7,
    });
    out.push(...xElems);

    const bars: SvgElement[] = [];
    const labels: SvgElement[] = [];
    const baseY = yScale(0);
    const bandW = bandWidth();
    const widestLabel = Math.max(...rows.map((r) => estimateTextWidth(fmt(r.value), labelSize)));
    const labelsFit = widestLabel <= bandW * 1.1;
    const showLabels = cfg.showValueLabels === true || (cfg.showValueLabels !== false && labelsFit);
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const bx = bandStart(i);
      const bw = bandW;
      const by = row.value >= 0 ? yScale(row.value) : baseY;
      const bh = Math.abs(yScale(row.value) - baseY);
      bars.push(
        rect({
          x: bx,
          y: by,
          width: bw,
          height: bh,
          fill: primaryColor,
          rx: 1,
        }),
      );
      if (showLabels) {
        const textY = row.value >= 0 ? by - labelSize * 0.4 : by + bh + labelSize + 2;
        labels.push(
          text(fmt(row.value), {
            x: bx + bw / 2,
            y: textY,
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
    out.push(g({}, labels));
    out.push(
      svgLine(plot.x, baseY, plot.x + plot.width, baseY, {
        stroke: palette.axis,
        'stroke-width': 1,
        'shape-rendering': 'crispEdges',
      }),
    );
  } else {
    const categories = rows.map((r) => r.label);
    const maxLabelLen = Math.max(...categories.map((c) => c.length));
    const valueLabelReserve =
      cfg.showValueLabels !== false ? Math.round(labelSize * 3.5) : Math.round(labelSize * 0.8);
    const yTickWidth = Math.min(
      Math.round(canvas.width * 0.3),
      Math.round(labelSize * 0.6) + Math.max(Math.round(labelSize * 4), maxLabelLen * labelSize * 0.6),
    );
    const horizPlot = computePlotArea(canvas, {
      hasTitle: !!cfg.title,
      hasSubtitle: !!cfg.subtitle,
      yTickWidth,
    });
    const usableWidth = Math.max(60, horizPlot.width - valueLabelReserve);
    const n = rows.length;
    const po = barPad * 0.7;
    const step = horizPlot.height / Math.max(1, n - barPad + 2 * po);
    const bh = Math.max(2, step * (1 - barPad));
    const xMin = Math.min(0, vMin);
    const xMax = vMax <= 0 ? 0 : vMax;
    const xScale = (v: number) =>
      horizPlot.x + ((v - xMin) / (xMax - xMin || 1)) * usableWidth;
    const niceTicks = niceScale(xMin, xMax, 5).ticks.filter(
      (t) => t >= xMin - 1e-9 && t <= xMax + xMax * 0.02 + 1e-9,
    );

    for (const t of niceTicks) {
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
          'text-anchor': 'middle',
        }),
      );
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const by = horizPlot.y + po * step + i * step;
      const cxStart = xScale(0);
      const cx = xScale(row.value);
      const bx = Math.min(cxStart, cx);
      const bw = Math.abs(cx - cxStart);
      out.push(
        rect({
          x: bx,
          y: by,
          width: Math.max(1, bw),
          height: bh,
          fill: primaryColor,
          rx: 1,
        }),
      );
      out.push(
        text(row.label, {
          x: horizPlot.x - 10,
          y: by + bh / 2 + labelSize * 0.35,
          'font-size': labelSize,
          'font-family': palette.fontBody,
          fill: palette.text,
          'text-anchor': 'end',
        }),
      );
      if (cfg.showValueLabels !== false) {
        const baseX = xScale(0);
        const labelX = row.value >= 0 ? cx + labelSize * 0.4 : Math.max(baseX + labelSize * 0.4, cx + labelSize * 0.4);
        out.push(
          text(fmt(row.value), {
            x: labelX,
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

  if (cfg.legendPosition && cfg.legendPosition !== 'none' && cfg.legendPosition !== 'auto') {
    out.push(
      ...renderLegend({
        items: [{ label: valueKey, color: primaryColor }],
        palette,
        canvas,
        y: legendY(canvas, !!cfg.title, !!cfg.subtitle, cfg.title, cfg.subtitle),
      }),
    );
  }

  return out;
}

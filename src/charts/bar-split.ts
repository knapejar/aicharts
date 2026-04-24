import { ellipsize, estimateTextWidth, g, line as svgLine, rect, text } from '../core/svg.js';
import { labelFontSize } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import { pickNumberFormatter } from '../formatters/number.js';
import { smartLabel } from '../formatters/label.js';
import { niceScale } from '../formatters/tick.js';
import { planBandXAxis } from './axes.js';
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
  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    hasXAxis: false,
    hasYAxis: false,
  });
  const gridX = frame.plot.x;
  const gridW = frame.plot.width;
  const gridY = frame.plot.y;
  const gridH = frame.plot.height;
  const cellGapX = Math.round(labelSize * 0.9);
  const cellGapY = Math.round(labelSize * 1.3);
  const cellW = (gridW - cellGapX * (columns - 1)) / columns;

  let allUpfront: number[] = [];
  for (const s of series) {
    for (const r of cfg.data) {
      const v = Number(r[s] ?? NaN);
      if (Number.isFinite(v)) allUpfront.push(v);
    }
  }
  const previewScale = niceScale(Math.min(0, ...allUpfront), Math.max(0, ...allUpfront), 4);
  const previewFmt = pickNumberFormatter(allUpfront);
  let widestTickLabel = 0;
  for (const t of previewScale.ticks) {
    widestTickLabel = Math.max(widestTickLabel, estimateTextWidth(previewFmt(t), labelSize));
  }
  const innerPadLeft = Math.max(Math.round(labelSize * 2.0), Math.ceil(widestTickLabel + labelSize * 0.7));
  const innerPadTop = Math.round(labelSize * 1.6);
  const estimatedPlotW = cellW - innerPadLeft;
  const bandPlan = planBandXAxis(canvas, categories, Math.max(60, estimatedPlotW), 0.2, 0.05);
  const xAxisBandBase = Math.round(labelSize * 1.4);
  const cellH = (gridH - cellGapY * (rows - 1)) / rows;
  const minPlotH = Math.round(labelSize * 3.0);
  const fullPadBottom = Math.max(xAxisBandBase + Math.round(labelSize * 0.6), bandPlan.bandHeight + Math.round(labelSize * 0.6));
  const tightPadBottom = xAxisBandBase + Math.round(labelSize * 0.3);
  const minimalPadBottom = Math.round(labelSize * 0.6);
  let innerPadBottom = fullPadBottom;
  let xAxisMode: 'full' | 'sparse' | 'none' = 'full';
  if (cellH - innerPadTop - innerPadBottom < minPlotH) {
    innerPadBottom = tightPadBottom;
    xAxisMode = 'sparse';
  }
  if (cellH - innerPadTop - innerPadBottom < minPlotH) {
    innerPadBottom = minimalPadBottom;
    xAxisMode = 'none';
  }

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
      text(smartLabel(s), {
        x: cellX,
        y: cellY + labelSize,
        'font-size': labelSize,
        'font-weight': 700,
        'font-family': palette.fontBody,
        fill: palette.text,
      }),
    );

    const fmt = pickNumberFormatter(localAll);
    const sortedTicks = [...scale.ticks].sort((a, b) => a - b);
    const lowestTick = sortedTicks[0]!;
    const localDataMin = localAll.length > 0 ? Math.min(...localAll) : 0;
    const isPaddingOnlyBottom = lowestTick < localDataMin - 1e-9;
    const skipBottomTick =
      scale.ticks.length >= 3 && isPaddingOnlyBottom && lowestTick >= -1 && lowestTick <= 1;
    for (const t of scale.ticks) {
      const y = yScale(t);
      out.push(
        svgLine(plotX, y, plotX + plotW, y, {
          stroke: palette.grid,
          'stroke-width': 1,
          'shape-rendering': 'crispEdges',
        }),
      );
      if (skipBottomTick && t === lowestTick) continue;
      out.push(
        text(fmt(t), {
          x: plotX - 6,
          y: y + labelSize * 0.32,
          'font-size': labelSize,
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

    if (xAxisMode !== 'none') {
      const axisSize = labelSize;
      const axisPlan = planBandXAxis(canvas, categories, plotW, 0.2, 0.05);
      const useRotation = xAxisMode === 'full' && axisPlan.rotate;
      const ellipsizeTo = useRotation && axisPlan.ellipsizedWidth != null ? axisPlan.ellipsizedWidth : null;
      const angle = axisPlan.angle;
      const labelY = plotY + plotH + (useRotation ? labelSize * 0.9 : labelSize * 1.35);
      const indices = xAxisMode === 'sparse' && n > 2 ? [0, n - 1] : [...Array(n).keys()];
      for (const i of indices) {
        const raw = categories[i]!;
        const cat = ellipsizeTo != null ? ellipsize(raw, axisSize, ellipsizeTo) : raw;
        const cx = plotX + i * bandW + bandW / 2;
        const attrs: Record<string, string | number> = {
          x: cx,
          y: labelY,
          'font-size': axisSize,
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': useRotation ? 'end' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle',
        };
        if (useRotation) {
          attrs['transform'] = `rotate(-${angle} ${cx} ${labelY})`;
        }
        out.push(text(cat, attrs));
      }
    }
  }

  return out;
}

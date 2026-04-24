import { ellipsize, estimateTextWidth, g, path, text } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import { formatPercent } from '../formatters/percent.js';
import type { DonutConfig, PieConfig, SvgElement, Theme } from '../core/types.js';

export interface PreparedSlice {
  label: string;
  value: number;
  fraction: number;
  startAngle: number;
  endAngle: number;
  color: string;
}

export function prepareSlices(
  cfg: PieConfig | DonutConfig,
  colors: string[],
  threshold: number,
): { slices: PreparedSlice[]; total: number } {
  const labelKey = cfg.label ?? 'label';
  const valueKey = cfg.value ?? 'value';
  const raw = cfg.data.map((r, i) => ({
    label: String(r[labelKey] ?? `Item ${i + 1}`),
    value: Math.max(0, Number(r[valueKey] ?? 0)),
  }));
  const total = raw.reduce((a, b) => a + b.value, 0);
  if (total <= 0) return { slices: [], total: 0 };

  let sorted = [...raw];
  if (cfg.sort !== 'none') {
    sorted.sort((a, b) => (cfg.sort === 'asc' ? a.value - b.value : b.value - a.value));
  }
  if (threshold > 0) {
    const main: typeof sorted = [];
    let otherSum = 0;
    for (const s of sorted) {
      if (s.value / total < threshold && sorted.length > 6) {
        otherSum += s.value;
      } else {
        main.push(s);
      }
    }
    if (otherSum > 0) main.push({ label: 'Other', value: otherSum });
    sorted = main;
  }

  let cursor = -Math.PI / 2;
  const slices: PreparedSlice[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i]!;
    const fraction = s.value / total;
    const angle = fraction * Math.PI * 2;
    slices.push({
      label: s.label,
      value: s.value,
      fraction,
      startAngle: cursor,
      endAngle: cursor + angle,
      color: colors[i % colors.length]!,
    });
    cursor += angle;
  }
  return { slices, total };
}

export function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
): string {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const x0 = cx + rOuter * Math.cos(start);
  const y0 = cy + rOuter * Math.sin(start);
  const x1 = cx + rOuter * Math.cos(end);
  const y1 = cy + rOuter * Math.sin(end);
  if (rInner > 0) {
    const xi0 = cx + rInner * Math.cos(end);
    const yi0 = cy + rInner * Math.sin(end);
    const xi1 = cx + rInner * Math.cos(start);
    const yi1 = cy + rInner * Math.sin(start);
    return [
      `M ${x0} ${y0}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1} ${y1}`,
      `L ${xi0} ${yi0}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${xi1} ${yi1}`,
      'Z',
    ].join(' ');
  }
  return [
    `M ${cx} ${cy}`,
    `L ${x0} ${y0}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1} ${y1}`,
    'Z',
  ].join(' ');
}

export function renderPieLike(
  cfg: PieConfig | DonutConfig,
  theme: Theme,
  inner: { ratio: number; centerText?: string; centerLabel?: string },
): SvgElement[] {
  const { palette, canvas } = theme;
  const out: SvgElement[] = [];
  const threshold = cfg.otherThreshold ?? 0.04;
  const { slices, total } = prepareSlices(cfg, palette.colors, threshold);
  if (slices.length === 0 || total === 0) return out;

  const legendItems = slices.map((s) => ({
    label: `${s.label} · ${formatPercent(s.fraction, s.fraction >= 0.1 ? 0 : 1)}`,
    color: s.color,
  }));
  const showLegend = slices.length > 4 || cfg.legendPosition === 'right' || cfg.legendPosition === 'bottom';

  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    source: cfg.source,
    logo: cfg.logo ?? 'default',
    hasXAxis: false,
    hasYAxis: false,
  });
  let chartArea = {
    x: frame.inner.x,
    y: frame.plot.y,
    w: frame.inner.width,
    h: frame.plot.height,
  };
  if (showLegend) {
    const legendWidth = Math.min(350, chartArea.w * 0.35);
    chartArea.w -= legendWidth + 20;
  }

  const r = Math.min(chartArea.w, chartArea.h) / 2 - 8;
  const cx = chartArea.x + chartArea.w / 2;
  const cy = chartArea.y + chartArea.h / 2;
  const rOuter = r;
  const rInner = inner.ratio * r;

  const arcs: SvgElement[] = [];
  for (const s of slices) {
    arcs.push(
      path(arcPath(cx, cy, rOuter, rInner, s.startAngle, s.endAngle), {
        fill: s.color,
        stroke: palette.background,
        'stroke-width': 2,
      }),
    );
  }
  out.push(g({}, arcs));

  const explicitPlacement = cfg.labelPlacement !== undefined;
  const autoSuppressLabels = showLegend && !explicitPlacement;
  if (cfg.labelPlacement !== 'none' && !autoSuppressLabels) {
    const placement = cfg.labelPlacement ?? (slices.length > 6 ? 'outside' : 'inside');
    const labelSize = labelFontSize(canvas);
    for (const s of slices) {
      if (s.fraction < 0.03) continue;
      const mid = (s.startAngle + s.endAngle) / 2;
      if (placement === 'inside') {
        const lr = rInner > 0 ? (rInner + rOuter) / 2 : rOuter * 0.65;
        const lx = cx + lr * Math.cos(mid);
        const ly = cy + lr * Math.sin(mid);
        out.push(
          text(formatPercent(s.fraction, s.fraction >= 0.1 ? 0 : 1), {
            x: lx,
            y: ly + labelSize * 0.35,
            'font-size': labelSize,
            'font-weight': 700,
            'font-family': palette.fontBody,
            fill: '#ffffff',
            'text-anchor': 'middle',
          }),
        );
      } else {
        const lx = cx + (rOuter + 14) * Math.cos(mid);
        const ly = cy + (rOuter + 14) * Math.sin(mid);
        out.push(
          text(`${s.label} ${formatPercent(s.fraction, 0)}`, {
            x: lx,
            y: ly + labelSize * 0.35,
            'font-size': labelSize,
            'font-family': palette.fontBody,
            fill: palette.text,
            'text-anchor': mid > Math.PI / 2 && mid < (Math.PI * 3) / 2 ? 'end' : 'start',
          }),
        );
      }
    }
  }

  if (inner.centerText) {
    const size = Math.max(18, Math.round(r * 0.18));
    out.push(
      text(inner.centerText, {
        x: cx,
        y: cy + size * 0.35,
        'font-size': size,
        'font-weight': 700,
        'font-family': palette.fontHeadline,
        fill: palette.text,
        'text-anchor': 'middle',
      }),
    );
    if (inner.centerLabel) {
      out.push(
        text(inner.centerLabel, {
          x: cx,
          y: cy + size * 0.35 + size * 1.0,
          'font-size': labelFontSize(canvas),
          'font-family': palette.fontBody,
          fill: palette.textMuted,
          'text-anchor': 'middle',
        }),
      );
    }
  }

  if (showLegend) {
    const legendX = chartArea.x + chartArea.w + 20;
    const legendSize = labelFontSize(canvas);
    const legendRightEdge = frame.inner.x + frame.inner.width;
    const legendWidthAvail = Math.max(80, legendRightEdge - (legendX + legendSize * 1.7));
    const legendBottomLimit = frame.plot.y + frame.plot.height;
    const lineHeight = legendSize * 2.0;
    const visibleCount = Math.max(
      1,
      Math.min(legendItems.length, Math.floor((legendBottomLimit - chartArea.y - legendSize * 0.3) / lineHeight)),
    );
    const legendYBase =
      chartArea.y + Math.max(legendSize * 0.8, (chartArea.h - visibleCount * lineHeight) / 2 + legendSize);
    for (let i = 0; i < visibleCount; i++) {
      const it = legendItems[i]!;
      const yLine = legendYBase + i * lineHeight;
      out.push({
        tag: 'rect',
        attrs: {
          x: legendX,
          y: yLine - legendSize * 0.7,
          width: legendSize * 1.2,
          height: legendSize * 0.9,
          fill: it.color,
          rx: 2,
        },
      });
      const clippedLabel = ellipsize(it.label, legendSize, legendWidthAvail);
      out.push(
        text(clippedLabel, {
          x: legendX + legendSize * 1.7,
          y: yLine,
          'font-size': legendSize,
          'font-family': palette.fontBody,
          fill: palette.text,
        }),
      );
    }
  } else if (cfg.labelPlacement === 'none') {
    const legendSize = labelFontSize(canvas);
    out.push(
      ...renderLegend({
        items: legendItems,
        palette,
        canvas,
        y: frame.plot.y + frame.plot.height - legendSize * 0.4,
      }),
    );
  }

  return out;
}

export function renderPie(cfg: PieConfig, theme: Theme): SvgElement[] {
  return renderPieLike(cfg, theme, { ratio: 0 });
}

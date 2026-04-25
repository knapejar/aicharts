import { ellipsize, ellipsizeMiddle, estimateTextWidth, g, path, text } from '../core/svg.js';
import { labelFontSize, renderLegend } from '../core/layout.js';
import { computeFrame } from '../core/frame.js';
import { formatPercent } from '../formatters/percent.js';
import type { DonutConfig, PieConfig, SvgElement, Theme } from '../core/types.js';

function renderLegendLabel(fullLabel: string, fontSize: number, maxWidth: number): string {
  if (estimateTextWidth(fullLabel, fontSize) <= maxWidth) return fullLabel;
  const sepIdx = fullLabel.lastIndexOf(' · ');
  if (sepIdx > 0) {
    const name = fullLabel.slice(0, sepIdx);
    const suffix = fullLabel.slice(sepIdx);
    const suffixW = estimateTextWidth(suffix, fontSize);
    const nameBudget = maxWidth - suffixW;
    if (nameBudget >= fontSize * 2) {
      return ellipsize(name, fontSize, nameBudget) + suffix;
    }
  }
  return ellipsizeMiddle(fullLabel, fontSize, maxWidth, 6);
}

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
  sorted.sort((a, b) => b.value - a.value);
  const MAX_SLICES = 6;
  if (threshold > 0) {
    const main: typeof sorted = [];
    let otherSum = 0;
    for (const s of sorted) {
      if (s.value / total < threshold && sorted.length > MAX_SLICES) {
        otherSum += s.value;
      } else {
        main.push(s);
      }
    }
    if (otherSum > 0) main.push({ label: 'Other', value: otherSum });
    sorted = main;
  }
  if (sorted.length > MAX_SLICES) {
    const kept = sorted.slice(0, MAX_SLICES - 1);
    const rest = sorted.slice(MAX_SLICES - 1);
    const otherSum = rest.reduce((a, b) => a + b.value, 0);
    const existingOther = kept.find((s) => s.label === 'Other');
    if (existingOther) existingOther.value += otherSum;
    else kept.push({ label: 'Other', value: otherSum });
    sorted = kept;
  }
  if (cfg.sort === 'asc') {
    sorted.sort((a, b) => (a.label === 'Other' ? 1 : b.label === 'Other' ? -1 : a.value - b.value));
  } else if (cfg.sort === 'none') {
    const order = new Map(raw.map((r, i) => [r.label, i]));
    sorted.sort((a, b) => {
      if (a.label === 'Other') return 1;
      if (b.label === 'Other') return -1;
      return (order.get(a.label) ?? 0) - (order.get(b.label) ?? 0);
    });
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
  const sweep = end - start;
  if (sweep >= Math.PI * 2 - 1e-6) {
    if (rInner > 0) {
      return [
        `M ${cx - rOuter} ${cy}`,
        `a ${rOuter} ${rOuter} 0 1 0 ${rOuter * 2} 0`,
        `a ${rOuter} ${rOuter} 0 1 0 ${-rOuter * 2} 0`,
        `M ${cx - rInner} ${cy}`,
        `a ${rInner} ${rInner} 0 1 1 ${rInner * 2} 0`,
        `a ${rInner} ${rInner} 0 1 1 ${-rInner * 2} 0`,
        'Z',
      ].join(' ');
    }
    return [
      `M ${cx - rOuter} ${cy}`,
      `a ${rOuter} ${rOuter} 0 1 0 ${rOuter * 2} 0`,
      `a ${rOuter} ${rOuter} 0 1 0 ${-rOuter * 2} 0`,
      'Z',
    ].join(' ');
  }
  const largeArc = sweep > Math.PI ? 1 : 0;
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
  const explicitLegendPosition = cfg.legendPosition === 'right' || cfg.legendPosition === 'bottom';
  const placementAlreadyCarriesLabels =
    cfg.labelPlacement === 'inside' || cfg.labelPlacement === 'outside';
  const showLegend = explicitLegendPosition || (slices.length > 4 && !placementAlreadyCarriesLabels);
  const useTopLegend = !showLegend && cfg.labelPlacement === 'none';

  const frame = computeFrame(canvas, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    hasLegend: useTopLegend,
    legendLabels: useTopLegend ? legendItems.map((it) => it.label) : undefined,
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
        const pctStr = formatPercent(s.fraction, s.fraction >= 0.1 ? 0 : 1);
        const sliceChord = 2 * (rOuter - rInner) * Math.min(1, Math.abs(Math.tan((s.endAngle - s.startAngle) / 2)));
        const widthAtMid = 2 * lr * Math.sin(Math.min(Math.PI / 2, (s.endAngle - s.startAngle) / 2));
        const labelBudget = Math.max(16, Math.min(widthAtMid, (rOuter - rInner) * 1.6));
        const labelFits =
          !showLegend &&
          estimateTextWidth(s.label, labelSize * 0.8) <= labelBudget &&
          s.fraction >= 0.08 &&
          sliceChord > 1;
        if (labelFits) {
          out.push(
            text(s.label, {
              x: lx,
              y: ly - labelSize * 0.2,
              'font-size': labelSize * 0.8,
              'font-weight': 600,
              'font-family': palette.fontBody,
              fill: '#ffffff',
              'text-anchor': 'middle',
            }),
          );
          out.push(
            text(pctStr, {
              x: lx,
              y: ly + labelSize * 0.95,
              'font-size': labelSize,
              'font-weight': 700,
              'font-family': palette.fontBody,
              fill: '#ffffff',
              'text-anchor': 'middle',
            }),
          );
        } else {
          out.push(
            text(pctStr, {
              x: lx,
              y: ly + labelSize * 0.35,
              'font-size': labelSize,
              'font-weight': 700,
              'font-family': palette.fontBody,
              fill: '#ffffff',
              'text-anchor': 'middle',
            }),
          );
        }
      } else {
        const lx = cx + (rOuter + 14) * Math.cos(mid);
        const ly = cy + (rOuter + 14) * Math.sin(mid);
        const anchor: 'start' | 'end' = mid > Math.PI / 2 && mid < (Math.PI * 3) / 2 ? 'end' : 'start';
        const labelText = `${s.label} ${formatPercent(s.fraction, 0)}`;
        const textW = estimateTextWidth(labelText, labelSize);
        const marginX = frame.inner.x;
        const marginRight = frame.inner.x + frame.inner.width;
        const availLeft = (anchor === 'end' ? lx - marginX : Infinity);
        const availRight = (anchor === 'start' ? marginRight - lx : Infinity);
        const maxTextWidth = Math.max(labelSize * 3, anchor === 'end' ? availLeft : availRight);
        const rendered = textW > maxTextWidth ? ellipsize(labelText, labelSize, maxTextWidth) : labelText;
        out.push(
          text(rendered, {
            x: lx,
            y: ly + labelSize * 0.35,
            'font-size': labelSize,
            'font-family': palette.fontBody,
            fill: palette.text,
            'text-anchor': anchor,
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
    const baseLegendSize = labelFontSize(canvas);
    const legendRightEdge = frame.inner.x + frame.inner.width;
    const legendBottomLimit = frame.plot.y + frame.plot.height;
    const availableHeight = Math.max(40, legendBottomLimit - chartArea.y - baseLegendSize * 0.3);
    const items = legendItems.length;
    const lineHeightFactor = 1.4;
    let legendSize = baseLegendSize;
    const minLegendSize = Math.max(12, Math.round(baseLegendSize * 0.55));
    while (
      legendSize > minLegendSize &&
      items * legendSize * lineHeightFactor > availableHeight
    ) {
      legendSize = Math.max(minLegendSize, legendSize - 1);
    }
    const lineHeight = legendSize * lineHeightFactor;
    const legendWidthAvail = Math.max(80, legendRightEdge - (legendX + legendSize * 1.7));
    const visibleCount = Math.max(
      1,
      Math.min(items, Math.floor(availableHeight / lineHeight)),
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
      const clippedLabel = renderLegendLabel(it.label, legendSize, legendWidthAvail);
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
  } else if (cfg.labelPlacement === 'none' && frame.legend) {
    out.push(
      ...renderLegend({
        items: legendItems,
        palette,
        canvas,
        y: frame.legend.y + frame.tokens.ascender,
      }),
    );
  }

  return out;
}

export function renderPie(cfg: PieConfig, theme: Theme): SvgElement[] {
  return renderPieLike(cfg, theme, { ratio: 0 });
}

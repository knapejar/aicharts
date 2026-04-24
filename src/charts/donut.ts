import { pickNumberFormatter } from '../formatters/number.js';
import type { DonutConfig, SvgElement, Theme } from '../core/types.js';
import { prepareSlices, renderPieLike } from './pie.js';

function innerRatio(size: DonutConfig['innerRadius']): number {
  if (size === 'thin') return 0.75;
  if (size === 'thick') return 0.5;
  return 0.62;
}

function computeCenter(cfg: DonutConfig): { centerText?: string; centerLabel?: string } {
  if (!cfg.centerValue && !cfg.centerLabel) return {};
  const { slices, total } = prepareSlices(cfg, ['#000'], cfg.otherThreshold ?? 0.04);
  const fmt = pickNumberFormatter(slices.map((s) => s.value));
  let centerText: string | undefined;
  if (typeof cfg.centerValue === 'string') {
    if (cfg.centerValue === 'sum') centerText = fmt(total);
    else if (cfg.centerValue === 'max' && slices.length > 0) {
      const max = slices.reduce((a, b) => (b.value > a.value ? b : a));
      centerText = fmt(max.value);
    } else if (cfg.centerValue === 'count') centerText = String(slices.length);
    else centerText = cfg.centerValue;
  }
  return { centerText, centerLabel: cfg.centerLabel };
}

export function renderDonut(cfg: DonutConfig, theme: Theme): SvgElement[] {
  const center = computeCenter(cfg);
  return renderPieLike(cfg, theme, {
    ratio: innerRatio(cfg.innerRadius),
    ...(center.centerText !== undefined ? { centerText: center.centerText } : {}),
    ...(center.centerLabel !== undefined ? { centerLabel: center.centerLabel } : {}),
  });
}

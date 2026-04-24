import { formatNumber } from './number.js';

export function formatPercent(value: number, decimals?: number): string {
  const pct = value * 100;
  if (decimals === undefined && value !== 0) {
    const abs = Math.abs(pct);
    if (abs < 0.01) return value > 0 ? '<0.01%' : '>-0.01%';
    if (abs < 0.1) return formatNumber(pct, { decimals: 2 }) + '%';
  }
  const d = decimals ?? (Number.isInteger(pct) ? 0 : 1);
  return formatNumber(pct, { decimals: d }) + '%';
}

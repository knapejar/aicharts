import { formatNumber } from './number.js';

export function formatPercent(value: number, decimals?: number): string {
  const d = decimals ?? (Number.isInteger(value * 100) ? 0 : 1);
  return formatNumber(value * 100, { decimals: d }) + '%';
}

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

export function pickPercentFormatter(values: number[]): (v: number) => string {
  const finite = values.filter((v) => Number.isFinite(v));
  const maxAbs = finite.length ? Math.max(...finite.map((v) => Math.abs(v))) : 0;
  const alreadyPercent = maxAbs >= 1.5;
  const scale = alreadyPercent ? 1 : 100;
  return (v: number) => {
    const scaled = v * scale;
    const abs = Math.abs(scaled);
    const decimals = abs >= 10 || Number.isInteger(scaled) ? 0 : 1;
    return formatNumber(scaled, { decimals }) + '%';
  };
}

import { formatNumber } from './number.js';

export function formatCurrency(value: number, currency = 'USD'): string {
  const symbol: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CZK: 'Kč' };
  const sym = symbol[currency] ?? currency + ' ';
  const abs = Math.abs(value);
  const formatted = formatNumber(value, { compact: abs >= 1000 });
  return currency === 'CZK' ? `${formatted} ${sym}` : `${sym}${formatted}`;
}

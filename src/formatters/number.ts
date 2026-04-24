export interface NumberFormatOptions {
  compact?: boolean;
  decimals?: number;
  thousandsSep?: string;
  decimalSep?: string;
  signed?: boolean;
}

export function isYearLike(value: number): boolean {
  return Number.isInteger(value) && value >= 1500 && value <= 2200;
}

export function looksLikeYearSeries(values: number[]): boolean {
  if (values.length < 2) return values.length === 1 && isYearLike(values[0]!);
  return values.every(isYearLike);
}

export function formatNumber(value: number, opts: NumberFormatOptions = {}): string {
  if (!Number.isFinite(value)) return '—';
  const { compact, thousandsSep = ',', decimalSep = '.', signed } = opts;
  const sign = signed && value > 0 ? '+' : '';

  if (compact && Math.abs(value) >= 1000) {
    return sign + compactNumber(value, decimalSep);
  }

  const abs = Math.abs(value);
  let decimals = opts.decimals;
  if (decimals === undefined) {
    if (abs === 0) decimals = 0;
    else if (abs < 0.01) decimals = 4;
    else if (abs < 1) decimals = 2;
    else if (abs < 100) decimals = Number.isInteger(value) ? 0 : 1;
    else decimals = 0;
  }

  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const intWithSep = addThousands(intPart!, thousandsSep);
  const trimmedDec = decPart ? decPart.replace(/0+$/, '') : '';
  const num = trimmedDec ? `${intWithSep}${decimalSep}${trimmedDec}` : intWithSep;
  return sign + num;
}

export function compactNumber(value: number, decimalSep = '.'): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  let scaled: number;
  let suffix: string;
  if (abs >= 1e12) {
    scaled = value / 1e12;
    suffix = 'T';
  } else if (abs >= 1e9) {
    scaled = value / 1e9;
    suffix = 'B';
  } else if (abs >= 1e6) {
    scaled = value / 1e6;
    suffix = 'M';
  } else if (abs >= 1e3) {
    scaled = value / 1e3;
    suffix = 'k';
  } else {
    scaled = value;
    suffix = '';
  }
  const rounded = Math.abs(scaled) >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
  const asStr = String(rounded).replace('.', decimalSep);
  return sign.replace('-', '') + asStr + suffix;
}

function addThousands(intPart: string, sep: string): string {
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += sep;
    out += digits[i];
  }
  return negative ? '-' + out : out;
}

export function formatYear(value: number): string {
  return String(Math.round(value));
}

export function pickNumberFormatter(
  values: number[],
  explicit?: 'auto' | 'number' | 'year' | 'date' | 'percent' | 'currency',
): (v: number) => string {
  if (explicit === 'year') return formatYear;
  if (explicit === 'percent') return (v: number) => formatNumber(v * 100, { decimals: 0 }) + '%';
  if (explicit === 'currency')
    return (v: number) => '$' + formatNumber(v, { compact: Math.abs(v) >= 1000 });

  if (explicit === 'auto' || explicit === undefined) {
    if (values.length > 0 && looksLikeYearSeries(values)) return formatYear;
    const max = Math.max(...values.map((v) => Math.abs(v)));
    if (max >= 1000) return (v) => formatNumber(v, { compact: true });
    return (v) => formatNumber(v);
  }
  return (v) => formatNumber(v);
}

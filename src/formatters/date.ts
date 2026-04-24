const DAY = 86_400_000;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    if (value > 1500 && value < 2200 && Number.isInteger(value)) {
      return new Date(Date.UTC(value, 0, 1));
    }
    const asMs = value < 1e11 ? value * 1000 : value;
    const d = new Date(asMs);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function pickDateFormatter(values: Date[]): (d: Date) => string {
  if (values.length === 0) return (d) => d.toISOString().slice(0, 10);
  const min = Math.min(...values.map((v) => v.getTime()));
  const max = Math.max(...values.map((v) => v.getTime()));
  const span = max - min;

  if (span < 2 * DAY) {
    return (d) =>
      `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  if (span < 60 * DAY) {
    return (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }
  if (span < 365 * DAY) {
    return (d) => MONTHS[d.getUTCMonth()]!;
  }
  if (span < 3 * 365 * DAY) {
    return (d) => `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  }
  return (d) => String(d.getUTCFullYear());
}

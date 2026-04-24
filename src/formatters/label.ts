const COMMON_ACRONYMS = new Set([
  'usa', 'us', 'uk', 'eu', 'un', 'ai', 'gdp', 'cpi', 'ppi', 'roi', 'ipo',
  'sme', 'nyc', 'la', 'sf', 'uae', 'eur', 'usd', 'gbp', 'jpy', 'cny',
  'aws', 'gcp', 'ibm', 'hp', 'ge', 'mit', 'fbi', 'cia', 'nasa', 'nato',
  'iot', 'api', 'sdk', 'sql', 'css', 'html', 'url', 'uri', 'id', 'ui',
  'ux', 'ml', 'llm', 'arpm', 'arpu', 'mau', 'dau', 'q1', 'q2', 'q3', 'q4',
  'h1', 'h2', 'ev', 'ice', 'oled', 'lcd', 'cpu', 'gpu', 'ram', 'ssd',
]);

export function smartLabel(raw: string): string {
  if (!raw) return raw;
  if (/[A-Z]/.test(raw) && raw !== raw.toLowerCase()) return raw;
  const words = raw.split(/(\s+|[-_/])/);
  return words
    .map((w) => {
      if (/^[\s\-_/]+$/.test(w)) return w;
      if (w.length === 0) return w;
      const lower = w.toLowerCase();
      if (COMMON_ACRONYMS.has(lower)) return lower.toUpperCase();
      return w[0]!.toUpperCase() + w.slice(1);
    })
    .join('');
}

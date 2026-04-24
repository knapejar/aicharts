function normalizeHex(hex: string): string {
  const raw = hex.trim().replace(/^#/, '');
  if (raw.length === 3) {
    return raw
      .split('')
      .map((c) => c + c)
      .join('')
      .toLowerCase();
  }
  if (raw.length === 6) return raw.toLowerCase();
  throw new Error(`Invalid hex color: ${hex}`);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = normalizeHex(hex);
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (c: number) => Math.max(0, Math.min(255, Math.round(c)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  );
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function adjustLightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  if (amount >= 0) {
    return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  }
  const k = 1 + amount;
  return rgbToHex(r * k, g * k, b * k);
}

export function ensureReadable(fg: string, bg: string, minRatio = 4.5): string {
  if (contrastRatio(fg, bg) >= minRatio) return fg;
  const bgLuminance = relativeLuminance(bg);
  const direction = bgLuminance > 0.5 ? -1 : 1;
  const step = 0.05;
  let current = fg;
  for (let i = 1; i <= 20; i++) {
    current = adjustLightness(fg, direction * step * i);
    if (contrastRatio(current, bg) >= minRatio) return current;
  }
  return bgLuminance > 0.5 ? '#000000' : '#ffffff';
}

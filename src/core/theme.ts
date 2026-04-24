import { PALETTES, DEFAULT_PALETTE_NAME } from '../palettes/index.js';
import { resolveCanvas } from './size.js';
import { ensureReadable } from './contrast.js';
import type { Palette, SizeName, Theme } from './types.js';

function applyContrastGuard(palette: Palette): Palette {
  return {
    ...palette,
    text: ensureReadable(palette.text, palette.background, 4.5),
    textMuted: ensureReadable(palette.textMuted, palette.background, 3.0),
  };
}

export function resolvePalette(input: string | Partial<Palette> | undefined): Palette {
  if (!input) return applyContrastGuard(PALETTES[DEFAULT_PALETTE_NAME]!);
  if (typeof input === 'string') {
    const p = PALETTES[input];
    if (!p) throw new Error(`Unknown palette: ${input}`);
    return applyContrastGuard(p);
  }
  const base = PALETTES[DEFAULT_PALETTE_NAME]!;
  const merged: Palette = { ...base, ...input, name: input.name ?? 'custom' };
  return applyContrastGuard(merged);
}

export function resolveTheme(
  palette: string | Partial<Palette> | undefined,
  size: SizeName | undefined,
  width: number | undefined,
  height: number | undefined,
): Theme {
  return {
    palette: resolvePalette(palette),
    size: size ?? 'share',
    canvas: resolveCanvas(size, width, height),
  };
}

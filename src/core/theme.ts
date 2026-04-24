import { PALETTES, DEFAULT_PALETTE_NAME } from '../palettes/index.js';
import { resolveCanvas } from './size.js';
import type { Palette, SizeName, Theme } from './types.js';

export function resolvePalette(input: string | Partial<Palette> | undefined): Palette {
  if (!input) return PALETTES[DEFAULT_PALETTE_NAME]!;
  if (typeof input === 'string') {
    const p = PALETTES[input];
    if (!p) throw new Error(`Unknown palette: ${input}`);
    return p;
  }
  const base = PALETTES[DEFAULT_PALETTE_NAME]!;
  return { ...base, ...input, name: input.name ?? 'custom' };
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

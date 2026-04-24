import type { Canvas, SizeName } from './types.js';

export const SIZE_PRESETS: Record<SizeName, { width: number; height: number }> = {
  inline: { width: 800, height: 500 },
  share: { width: 1200, height: 675 },
  poster: { width: 1600, height: 2000 },
};

export const DEFAULT_SIZE: SizeName = 'share';

export function resolveCanvas(
  size: SizeName | undefined,
  widthOverride: number | undefined,
  heightOverride: number | undefined,
): Canvas {
  const preset = SIZE_PRESETS[size ?? DEFAULT_SIZE];
  const width = widthOverride ?? preset.width;
  const height = heightOverride ?? preset.height;

  const topPadForHeader = Math.max(120, Math.round(height * 0.18));
  const bottomPadForFooter = Math.max(72, Math.round(height * 0.1));
  const sidePad = Math.max(48, Math.round(width * 0.04));

  const padding = {
    top: topPadForHeader,
    right: sidePad,
    bottom: bottomPadForFooter,
    left: sidePad,
  };

  const plot = {
    x: padding.left,
    y: padding.top,
    width: width - padding.left - padding.right,
    height: height - padding.top - padding.bottom,
  };

  return { width, height, padding, plot };
}

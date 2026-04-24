import type { AspectClass, Canvas, SizeName } from './types.js';

export const SIZE_PRESETS: Record<
  SizeName,
  { width: number; height: number; aspect: AspectClass }
> = {
  inline: { width: 800, height: 500, aspect: 'landscape' },
  share: { width: 1200, height: 675, aspect: 'landscape' },
  square: { width: 1200, height: 1200, aspect: 'square' },
  poster: { width: 1600, height: 2000, aspect: 'portrait' },
};

export const DEFAULT_SIZE: SizeName = 'square';

export function classifyAspect(width: number, height: number): AspectClass {
  const r = width / Math.max(1, height);
  if (r > 1.25) return 'landscape';
  if (r < 0.9) return 'portrait';
  return 'square';
}

export function resolveAspect(size: SizeName | undefined, width: number, height: number): AspectClass {
  if (size && SIZE_PRESETS[size]) return SIZE_PRESETS[size].aspect;
  return classifyAspect(width, height);
}

export function resolveCanvas(
  size: SizeName | undefined,
  widthOverride: number | undefined,
  heightOverride: number | undefined,
): Canvas {
  const preset = SIZE_PRESETS[size ?? DEFAULT_SIZE];
  const width = widthOverride ?? preset.width;
  const height = heightOverride ?? preset.height;
  const aspect = resolveAspect(size, width, height);

  const topPadForHeader = Math.max(140, Math.round(height * (aspect === 'portrait' ? 0.14 : 0.2)));
  const bottomPadForFooter = Math.max(
    96,
    Math.round(height * (aspect === 'portrait' ? 0.07 : 0.12)),
  );
  const sidePad = Math.max(56, Math.round(width * 0.05));

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

  return { width, height, padding, plot, aspect };
}

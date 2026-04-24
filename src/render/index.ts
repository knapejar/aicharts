import { svgDocument } from '../core/svg.js';
import { resolveTheme } from '../core/theme.js';
import { renderChart } from '../charts/index.js';
import { svgToPng } from './svg-to-png.js';
import { renderHeader, renderFooter } from '../core/layout.js';
import { computeFrame, debugOverlay } from '../core/frame.js';
import type { ChartConfig } from '../core/types.js';

export interface RenderOptions {
  format?: 'png' | 'svg';
  dpr?: number;
  debugLayout?: boolean;
}

function debugLayoutEnabled(opts: RenderOptions): boolean {
  if (opts.debugLayout) return true;
  const flag = typeof process !== 'undefined' ? process.env?.AICHARTS_DEBUG_LAYOUT : undefined;
  return flag === '1' || flag === 'true';
}

function legendLabelsFor(config: ChartConfig): string[] | undefined {
  const y = (config as { y?: unknown }).y;
  if (Array.isArray(y) && y.length > 1) return y.map(String);
  return undefined;
}

export async function renderSvg(config: ChartConfig, opts: RenderOptions = {}): Promise<string> {
  const theme = resolveTheme(
    config.palette,
    config.size,
    config.width,
    config.height,
  );
  const chartElements = renderChart(config, theme);
  const header = renderHeader({
    title: config.title,
    subtitle: config.subtitle,
    palette: theme.palette,
    canvas: theme.canvas,
  });
  const footer = renderFooter({
    source: config.source,
    logo: config.logo ?? 'default',
    palette: theme.palette,
    canvas: theme.canvas,
  });
  const all = [...header, ...chartElements, ...footer];
  if (debugLayoutEnabled(opts)) {
    const legendLabels = legendLabelsFor(config);
    const frame = computeFrame(theme.canvas, {
      title: config.title,
      subtitle: config.subtitle,
      hasLegend: (legendLabels?.length ?? 0) > 1,
      legendLabels,
      source: config.source,
      logo: config.logo ?? 'default',
    });
    all.push(...debugOverlay(frame));
  }
  return svgDocument(
    theme.canvas.width,
    theme.canvas.height,
    config.background ?? theme.palette.background,
    all,
    theme.palette.fontStack,
  );
}

export async function render(config: ChartConfig, opts: RenderOptions = {}): Promise<Uint8Array> {
  const svg = await renderSvg(config, opts);
  if (opts.format === 'svg') return new TextEncoder().encode(svg);
  const theme = resolveTheme(config.palette, config.size, config.width, config.height);
  return svgToPng(svg, {
    width: theme.canvas.width,
    height: theme.canvas.height,
    background: config.background ?? theme.palette.background,
    dpr: opts.dpr ?? 2,
    defaultFontFamily: theme.palette.fontHeadline,
  });
}

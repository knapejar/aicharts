import { svgDocument } from '../core/svg.js';
import { resolveTheme } from '../core/theme.js';
import { renderChart } from '../charts/index.js';
import { svgToPng } from './svg-to-png.js';
import { renderHeader, renderFooter } from '../core/layout.js';
import type { ChartConfig } from '../core/types.js';

export interface RenderOptions {
  format?: 'png' | 'svg';
  dpr?: number;
}

export async function renderSvg(config: ChartConfig): Promise<string> {
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
  return svgDocument(
    theme.canvas.width,
    theme.canvas.height,
    config.background ?? theme.palette.background,
    all,
    theme.palette.fontStack,
  );
}

export async function render(config: ChartConfig, opts: RenderOptions = {}): Promise<Uint8Array> {
  const svg = await renderSvg(config);
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

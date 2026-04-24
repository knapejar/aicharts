import type { ChartConfig, Theme, SvgElement } from '../core/types.js';
import { renderLine } from './line.js';
import { renderBar } from './bar.js';
import { renderGroupedBar } from './grouped-bar.js';
import { renderStackedBar } from './stacked-bar.js';
import { renderBarSplit } from './bar-split.js';
import { renderStackedArea } from './stacked-area.js';
import { renderCombo } from './combo.js';
import { renderLineSplit } from './line-split.js';
import { renderPie } from './pie.js';
import { renderDonut } from './donut.js';
import { renderGeo } from './geo.js';

export type ChartRenderer = (config: ChartConfig, theme: Theme) => SvgElement[];

export function renderChart(config: ChartConfig, theme: Theme): SvgElement[] {
  switch (config.chart) {
    case 'line':
      return renderLine(config, theme);
    case 'bar':
      return renderBar(config, theme);
    case 'grouped-bar':
      return renderGroupedBar(config, theme);
    case 'stacked-bar':
      return renderStackedBar(config, theme);
    case 'bar-split':
      return renderBarSplit(config, theme);
    case 'stacked-area':
      return renderStackedArea(config, theme);
    case 'combo':
      return renderCombo(config, theme);
    case 'line-split':
      return renderLineSplit(config, theme);
    case 'pie':
      return renderPie(config, theme);
    case 'donut':
      return renderDonut(config, theme);
    case 'geo':
      return renderGeo(config, theme);
  }
}

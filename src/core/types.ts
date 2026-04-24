export type ChartType =
  | 'line'
  | 'bar'
  | 'grouped-bar'
  | 'stacked-bar'
  | 'bar-split'
  | 'stacked-area'
  | 'combo'
  | 'line-split'
  | 'pie'
  | 'donut'
  | 'geo';

export type SizeName = 'inline' | 'share' | 'poster';

export type Orientation = 'vertical' | 'horizontal';

export interface Palette {
  name: string;
  colors: string[];
  background: string;
  text: string;
  textMuted: string;
  grid: string;
  axis: string;
  accent: string;
  fontHeadline: string;
  fontBody: string;
  fontStack: string;
}

export interface Canvas {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  plot: { x: number; y: number; width: number; height: number };
}

export interface Theme {
  palette: Palette;
  size: SizeName;
  canvas: Canvas;
}

export type SvgAttr = Record<string, string | number | undefined | null | false>;

export interface SvgNode {
  tag: string;
  attrs: SvgAttr;
  children?: SvgElement[];
  text?: string;
}

export type SvgElement = SvgNode | string;

export interface DataPoint {
  [key: string]: string | number | null | undefined;
}

export interface ChartConfigBase {
  title?: string;
  subtitle?: string;
  source?: string;
  palette?: string | Partial<Palette>;
  size?: SizeName;
  width?: number;
  height?: number;
  background?: string;
  logo?: 'default' | 'none' | string;
  legendPosition?: 'top' | 'right' | 'bottom' | 'inline' | 'none' | 'auto';
  xLabel?: string;
  yLabel?: string;
  xFormat?: 'auto' | 'number' | 'year' | 'date' | 'percent' | 'currency';
  yFormat?: 'auto' | 'number' | 'year' | 'date' | 'percent' | 'currency';
}

export interface LineConfig extends ChartConfigBase {
  chart: 'line';
  data: DataPoint[];
  x: string;
  y: string | string[];
  lineStyle?: 'solid' | 'dashed' | 'dotted' | Record<string, 'solid' | 'dashed' | 'dotted'>;
  lineWidth?: number;
  interpolation?: 'linear' | 'curved' | 'stepped';
  showSymbols?: 'none' | 'first-last' | 'all' | 'last';
  showValueLabels?: 'none' | 'last' | 'first-last' | 'all';
  areaFill?: boolean;
}

export interface BarConfig extends ChartConfigBase {
  chart: 'bar';
  data: DataPoint[];
  x?: string;
  y?: string;
  label?: string;
  value?: string;
  orientation?: Orientation;
  sort?: 'asc' | 'desc' | 'none';
  showValueLabels?: boolean;
  barThickness?: 'thin' | 'medium' | 'thick';
  separatingLines?: boolean;
}

export interface GroupedBarConfig extends ChartConfigBase {
  chart: 'grouped-bar';
  data: DataPoint[];
  x: string;
  y: string[];
  orientation?: Orientation;
  groupGap?: number;
  barGap?: number;
  showValueLabels?: boolean;
}

export interface StackedBarConfig extends ChartConfigBase {
  chart: 'stacked-bar';
  data: DataPoint[];
  x: string;
  y: string[];
  orientation?: Orientation;
  normalize?: boolean;
  reverseStackOrder?: boolean;
  showTotals?: boolean;
  showValueLabels?: boolean;
}

export interface BarSplitConfig extends ChartConfigBase {
  chart: 'bar-split';
  data: DataPoint[];
  x: string;
  y: string[];
  orientation?: Orientation;
  columns?: number;
  sharedScale?: boolean;
}

export interface StackedAreaConfig extends ChartConfigBase {
  chart: 'stacked-area';
  data: DataPoint[];
  x: string;
  y: string[];
  normalize?: boolean;
  interpolation?: 'linear' | 'curved' | 'stepped';
  opacity?: number;
}

export interface ComboConfig extends ChartConfigBase {
  chart: 'combo';
  data: DataPoint[];
  x: string;
  bars: string | string[];
  lines: string | string[];
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  interpolation?: 'linear' | 'curved' | 'stepped';
}

export interface LineSplitConfig extends ChartConfigBase {
  chart: 'line-split';
  data: DataPoint[];
  x: string;
  y: string[];
  columns?: number;
  sharedScale?: boolean;
  interpolation?: 'linear' | 'curved' | 'stepped';
}

export interface PieConfig extends ChartConfigBase {
  chart: 'pie';
  data: DataPoint[];
  label?: string;
  value?: string;
  labelPlacement?: 'inside' | 'outside' | 'none';
  sort?: 'desc' | 'asc' | 'none';
  otherThreshold?: number;
}

export interface DonutConfig extends ChartConfigBase {
  chart: 'donut';
  data: DataPoint[];
  label?: string;
  value?: string;
  labelPlacement?: 'inside' | 'outside' | 'none';
  innerRadius?: 'thin' | 'medium' | 'thick';
  centerValue?: 'sum' | 'max' | 'count' | string;
  centerLabel?: string;
  sort?: 'desc' | 'asc' | 'none';
  otherThreshold?: number;
}

export interface GeoConfig extends ChartConfigBase {
  chart: 'geo';
  data: DataPoint[];
  basemap?: string;
  code?: string;
  value?: string;
  label?: string;
  scale?: 'linear' | 'stepped' | 'diverging';
  steps?: number;
  missingColor?: string;
  showLegend?: boolean;
}

export type ChartConfig =
  | LineConfig
  | BarConfig
  | GroupedBarConfig
  | StackedBarConfig
  | BarSplitConfig
  | StackedAreaConfig
  | ComboConfig
  | LineSplitConfig
  | PieConfig
  | DonutConfig
  | GeoConfig;

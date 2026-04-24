import type { SvgAttr, SvgElement, SvgNode } from './types.js';

export function h(tag: string, attrs: SvgAttr = {}, children: SvgElement[] = []): SvgNode {
  return { tag, attrs, children };
}

export function text(value: string, attrs: SvgAttr = {}): SvgNode {
  return { tag: 'text', attrs, text: value };
}

export function g(attrs: SvgAttr, children: SvgElement[]): SvgNode {
  return { tag: 'g', attrs, children };
}

export function rect(attrs: SvgAttr): SvgNode {
  return { tag: 'rect', attrs };
}

export function line(x1: number, y1: number, x2: number, y2: number, attrs: SvgAttr = {}): SvgNode {
  return { tag: 'line', attrs: { x1, y1, x2, y2, ...attrs } };
}

export function path(d: string, attrs: SvgAttr = {}): SvgNode {
  return { tag: 'path', attrs: { d, ...attrs } };
}

export function circle(cx: number, cy: number, r: number, attrs: SvgAttr = {}): SvgNode {
  return { tag: 'circle', attrs: { cx, cy, r, ...attrs } };
}

export function polygon(points: Array<[number, number]>, attrs: SvgAttr = {}): SvgNode {
  return { tag: 'polygon', attrs: { points: points.map(([x, y]) => `${x},${y}`).join(' '), ...attrs } };
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function serializeAttrs(attrs: SvgAttr): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    parts.push(`${k}="${escapeText(String(v))}"`);
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

export function serialize(node: SvgElement): string {
  if (typeof node === 'string') return escapeText(node);
  const attrs = serializeAttrs(node.attrs);
  if (node.text !== undefined) {
    return `<${node.tag}${attrs}>${escapeText(node.text)}</${node.tag}>`;
  }
  if (!node.children || node.children.length === 0) {
    return `<${node.tag}${attrs}/>`;
  }
  const inner = node.children.map(serialize).join('');
  return `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}

export function svgDocument(
  width: number,
  height: number,
  background: string,
  children: SvgElement[],
  fontStack: string,
): string {
  const root = h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      'font-family': fontStack,
    },
    [rect({ x: 0, y: 0, width, height, fill: background }), ...children],
  );
  return serialize(root);
}

export function estimateTextWidth(str: string, fontSize: number): number {
  let w = 0;
  for (const ch of str) {
    if (/[iltIjf\.,:;'`!|]/.test(ch)) w += fontSize * 0.32;
    else if (/[A-Z0-9]/.test(ch)) w += fontSize * 0.62;
    else w += fontSize * 0.54;
  }
  return w;
}

export function wrapText(value: string, fontSize: number, maxWidth: number, maxLines = 3): string[] {
  if (!value) return [];
  if (estimateTextWidth(value, fontSize) <= maxWidth) return [value];
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [value];
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const attempt = current ? `${current} ${w}` : w;
    if (estimateTextWidth(attempt, fontSize) <= maxWidth) {
      current = attempt;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current) lines.push(current);
  if (lines.length >= maxLines && words.join(' ') !== lines.join(' ')) {
    const last = lines[lines.length - 1]!;
    const joinedRest = words.slice(lines.slice(0, -1).reduce((acc, l) => acc + l.split(/\s+/).length, 0)).join(' ');
    lines[lines.length - 1] = ellipsize(joinedRest, fontSize, maxWidth);
    void last;
  }
  return lines;
}

export function ellipsize(value: string, fontSize: number, maxWidth: number): string {
  if (estimateTextWidth(value, fontSize) <= maxWidth) return value;
  const ellipsis = '…';
  const ellipsisW = estimateTextWidth(ellipsis, fontSize);
  let lo = 0;
  let hi = value.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const trial = value.slice(0, mid);
    if (estimateTextWidth(trial, fontSize) + ellipsisW <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return value.slice(0, lo).trimEnd() + ellipsis;
}

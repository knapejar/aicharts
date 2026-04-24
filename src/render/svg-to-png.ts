import { Resvg } from '@resvg/resvg-js';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { EMBEDDED_FONTS } from './embedded-fonts.js';

let cachedFontFiles: string[] | null = null;

function materializeFonts(): string[] {
  if (cachedFontFiles) return cachedFontFiles;
  if (EMBEDDED_FONTS.length === 0) {
    cachedFontFiles = [];
    return cachedFontFiles;
  }
  const dir = join(tmpdir(), 'aicharts-fonts');
  const paths: string[] = [];
  try {
    mkdirSync(dir, { recursive: true });
    for (const font of EMBEDDED_FONTS) {
      const target = join(dir, font.name);
      if (!existsSync(target)) {
        writeFileSync(target, Buffer.from(font.base64, 'base64'));
      }
      paths.push(target);
    }
  } catch (err) {
    console.error('[aicharts] font materialization failed:', err);
  }
  cachedFontFiles = paths;
  return paths;
}

export interface SvgToPngOptions {
  width?: number;
  height?: number;
  background?: string;
  dpr?: number;
  defaultFontFamily?: string;
}

const MAX_OUTPUT_DIM = 1900;

export function effectiveDpr(width: number | undefined, height: number | undefined, dpr: number): number {
  const longest = Math.max(width ?? 0, height ?? 0);
  if (longest <= 0) return dpr;
  const cap = MAX_OUTPUT_DIM / longest;
  return Math.min(dpr, cap);
}

export async function svgToPng(svg: string, opts: SvgToPngOptions = {}): Promise<Uint8Array> {
  const fontFiles = materializeFonts();

  const dpr = effectiveDpr(opts.width, opts.height, opts.dpr ?? 2);

  const resvg = new Resvg(svg, {
    background: opts.background,
    fitTo: opts.width ? { mode: 'width', value: Math.round(opts.width * dpr) } : undefined,
    font: {
      fontFiles,
      loadSystemFonts: fontFiles.length === 0,
      defaultFontFamily: opts.defaultFontFamily ?? 'Inter',
      serifFamily: 'Merriweather',
      sansSerifFamily: 'Inter',
    },
  });
  const png = resvg.render().asPng();
  return png;
}

export function _debugFontState() {
  const files = materializeFonts();
  const details = files.slice(0, 5).map((p) => {
    try {
      const s = statSync(p);
      return { path: p, size: s.size };
    } catch (err) {
      return { path: p, error: (err as Error).message };
    }
  });
  return {
    embedded: EMBEDDED_FONTS.length,
    materialized: files.length,
    tmp: tmpdir(),
    sample: details,
  };
}

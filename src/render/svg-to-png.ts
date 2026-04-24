import { Resvg } from '@resvg/resvg-js';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function locateFontsDir(): string | null {
  const candidates = [
    resolve(__dirname, '..', 'fonts'),
    resolve(__dirname, '..', '..', 'fonts'),
    resolve(__dirname, '..', '..', 'src', 'fonts'),
    resolve(process.cwd(), 'fonts'),
    resolve(process.cwd(), 'src', 'fonts'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function listFontFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => /\.(ttf|otf|woff|woff2)$/i.test(f))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
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
  const fontsDir = locateFontsDir();
  const fontFiles = fontsDir ? listFontFiles(fontsDir) : [];

  const dpr = effectiveDpr(opts.width, opts.height, opts.dpr ?? 2);

  const resvg = new Resvg(svg, {
    background: opts.background,
    fitTo: opts.width ? { mode: 'width', value: Math.round(opts.width * dpr) } : undefined,
    font: {
      fontFiles,
      loadSystemFonts: true,
      defaultFontFamily: opts.defaultFontFamily ?? 'Inter',
    },
  });
  const png = resvg.render().asPng();
  return png;
}

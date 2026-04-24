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
  background?: string;
  dpr?: number;
  defaultFontFamily?: string;
}

export async function svgToPng(svg: string, opts: SvgToPngOptions = {}): Promise<Uint8Array> {
  const fontsDir = locateFontsDir();
  const fontFiles = fontsDir ? listFontFiles(fontsDir) : [];

  const resvg = new Resvg(svg, {
    background: opts.background,
    fitTo: opts.width ? { mode: 'width', value: opts.width * (opts.dpr ?? 2) } : undefined,
    font: {
      fontFiles,
      loadSystemFonts: fontFiles.length === 0,
      defaultFontFamily: opts.defaultFontFamily ?? 'Inter',
    },
  });
  const png = resvg.render().asPng();
  return png;
}

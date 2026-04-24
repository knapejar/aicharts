import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const fontsDir = resolve(root, 'fonts');
const outPath = resolve(root, 'src', 'render', 'embedded-fonts.ts');

if (!existsSync(fontsDir)) {
  console.log('[embed-fonts] no fonts/ dir, writing empty registry');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `export const EMBEDDED_FONTS: { name: string; base64: string }[] = [];\n`);
  process.exit(0);
}

const files = readdirSync(fontsDir)
  .filter((f) => /\.(ttf|otf|woff|woff2)$/i.test(f))
  .sort();

const entries = files
  .map((name) => {
    const bytes = readFileSync(resolve(fontsDir, name));
    const base64 = bytes.toString('base64');
    return `  { name: ${JSON.stringify(name)}, base64: ${JSON.stringify(base64)} },`;
  })
  .join('\n');

const ts = `export const EMBEDDED_FONTS: { name: string; base64: string }[] = [\n${entries}\n];\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, ts);
console.log(`[embed-fonts] wrote ${files.length} fonts to ${outPath}`);

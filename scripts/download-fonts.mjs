import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'fonts');
mkdirSync(outDir, { recursive: true });

const FAMILIES = [
  { slug: 'inter', filePrefix: 'Inter', weights: [400, 500, 600, 700] },
  { slug: 'source-sans-3', filePrefix: 'SourceSans3', weights: [400, 600, 700] },
  { slug: 'source-serif-4', filePrefix: 'SourceSerif4', weights: [400, 700] },
  { slug: 'playfair-display', filePrefix: 'PlayfairDisplay', weights: [400, 700] },
  { slug: 'poppins', filePrefix: 'Poppins', weights: [400, 500, 700] },
  { slug: 'ibm-plex-sans', filePrefix: 'IBMPlexSans', weights: [400, 500, 700] },
  { slug: 'libre-franklin', filePrefix: 'LibreFranklin', weights: [400, 600, 700] },
  { slug: 'merriweather', filePrefix: 'Merriweather', weights: [400, 700] },
  { slug: 'lato', filePrefix: 'Lato', weights: [400, 700] },
];

async function fetchBinary(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

let ok = 0;
for (const fam of FAMILIES) {
  for (const weight of fam.weights) {
    const filename = `${fam.filePrefix}-${weight}.ttf`;
    const out = join(outDir, filename);
    if (existsSync(out) && !process.argv.includes('--force')) {
      ok++;
      continue;
    }
    const url = `https://cdn.jsdelivr.net/fontsource/fonts/${fam.slug}@latest/latin-${weight}-normal.ttf`;
    try {
      const buf = await fetchBinary(url);
      writeFileSync(out, buf);
      console.log(`[fonts] ${fam.slug} ${weight} -> ${filename} (${buf.length} bytes)`);
      ok++;
    } catch (err) {
      console.error(`[fonts] ${fam.slug} ${weight} failed: ${err.message}`);
    }
  }
}
console.log(`[fonts] total ${ok} files`);

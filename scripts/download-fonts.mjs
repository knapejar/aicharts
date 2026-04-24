import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'fonts');
mkdirSync(outDir, { recursive: true });

const GOOGLE_API = (family, weights) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(
    / /g,
    '+',
  )}:wght@${weights.join(';')}&display=swap`;

const FONT_REQUESTS = [
  { name: 'Inter', weights: [400, 500, 600, 700] },
  { name: 'Source Sans 3', weights: [400, 600, 700] },
  { name: 'Source Serif 4', weights: [400, 700] },
  { name: 'Playfair Display', weights: [400, 700] },
  { name: 'Poppins', weights: [400, 500, 700] },
  { name: 'IBM Plex Sans', weights: [400, 500, 700] },
  { name: 'Libre Franklin', weights: [400, 600, 700] },
  { name: 'Merriweather', weights: [400, 700] },
  { name: 'Lato', weights: [400, 700] },
];

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36';

async function fetchText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.text();
}

async function fetchBinary(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

function slug(family) {
  return family.replace(/ /g, '').replace(/[^A-Za-z0-9]/g, '');
}

async function downloadFamily(family, weights) {
  const css = await fetchText(GOOGLE_API(family, weights));
  const latin = css.split('/* latin */').pop();
  const urlRe = /url\(([^)]+)\) format\('(woff2|truetype)'\)/g;
  let m;
  const targets = [];
  const weightRe = /font-weight: (\d+);[\s\S]*?src: url\((.*?)\) format\('woff2'\)/g;
  while ((m = weightRe.exec(css)) !== null) {
    targets.push({ weight: m[1], url: m[2] });
  }
  void latin;
  void urlRe;

  if (targets.length === 0) {
    console.warn(`[fonts] ${family}: no targets found in css`);
    return 0;
  }
  let done = 0;
  for (const t of targets) {
    const filename = `${slug(family)}-${t.weight}.woff2`;
    const out = join(outDir, filename);
    if (existsSync(out) && !process.argv.includes('--force')) {
      done++;
      continue;
    }
    try {
      const buf = await fetchBinary(t.url);
      writeFileSync(out, buf);
      console.log(`[fonts] ${family} ${t.weight} -> ${filename}`);
      done++;
    } catch (err) {
      console.error(`[fonts] ${family} ${t.weight} failed: ${err.message}`);
    }
  }
  return done;
}

let ok = 0;
for (const req of FONT_REQUESTS) {
  try {
    const n = await downloadFamily(req.name, req.weights);
    ok += n;
  } catch (err) {
    console.error(`[fonts] ${req.name} failed: ${err.message}`);
  }
}
console.log(`[fonts] total ${ok} files`);

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'basemaps');
mkdirSync(outDir, { recursive: true });

const BASEMAPS = [
  { id: 'world', url: 'https://datawrapper.dwcdn.net/lib/basemaps/world-2019.58b8a300.json' },
  { id: 'europe', url: 'https://app.datawrapper.de/api/v3/basemaps/europe-sovereign-states' },
  { id: 'africa', url: 'https://app.datawrapper.de/api/v3/basemaps/africa' },
  { id: 'asia', url: 'https://app.datawrapper.de/api/v3/basemaps/asia' },
  { id: 'north-america', url: 'https://app.datawrapper.de/api/v3/basemaps/north-america' },
  { id: 'south-america', url: 'https://app.datawrapper.de/api/v3/basemaps/south-america' },
  { id: 'oceania', url: 'https://app.datawrapper.de/api/v3/basemaps/oceania' },
  { id: 'usa-states', url: 'https://app.datawrapper.de/api/v3/basemaps/usa-states' },
  { id: 'germany-states', url: 'https://app.datawrapper.de/api/v3/basemaps/germany-states' },
  { id: 'uk-counties', url: 'https://app.datawrapper.de/api/v3/basemaps/uk-counties' },
  { id: 'france-regions', url: 'https://app.datawrapper.de/api/v3/basemaps/france-regions' },
];

async function fetchJson(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'aicharts-build/0.1', Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return await r.json();
}

let ok = 0;
let failed = 0;
for (const b of BASEMAPS) {
  const out = join(outDir, `${b.id}.json`);
  if (existsSync(out) && !process.argv.includes('--force')) {
    console.log(`[basemaps] ${b.id} already present, skip`);
    ok++;
    continue;
  }
  try {
    const data = await fetchJson(b.url);
    writeFileSync(out, JSON.stringify(data));
    console.log(`[basemaps] ${b.id} ok`);
    ok++;
  } catch (err) {
    console.error(`[basemaps] ${b.id} failed: ${err.message}`);
    failed++;
  }
}
console.log(`[basemaps] done: ${ok} ok, ${failed} failed`);

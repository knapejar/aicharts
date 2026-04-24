import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'tests/snapshots');
mkdirSync(outDir, { recursive: true });

const { render } = await import(resolve(root, 'dist/index.js'));
const { snapshotCases } = await import(resolve(root, 'tests/snapshot-cases.mjs'));

let ok = 0;
let failed = 0;
for (const c of snapshotCases()) {
  try {
    const png = await render(c.config, { format: 'png' });
    const outFile = join(outDir, `${c.name}.png`);
    writeFileSync(outFile, Buffer.from(png));
    console.log(`[snapshot] ${c.name} -> ${outFile} (${png.length} bytes)`);
    ok++;
  } catch (err) {
    console.error(`[snapshot] ${c.name} failed:`, err);
    failed++;
  }
}

console.log(`[snapshot] done: ${ok} ok, ${failed} failed`);
if (failed > 0) process.exit(1);

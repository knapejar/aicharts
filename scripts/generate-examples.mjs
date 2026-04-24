import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const specsFile = resolve(root, 'examples/specs.json');
const outDir = resolve(root, 'examples/charts');
mkdirSync(outDir, { recursive: true });

const { render } = await import(resolve(root, 'dist/index.js'));

const specs = JSON.parse(readFileSync(specsFile, 'utf8'));

let ok = 0;
let failed = 0;
const failures = [];

for (const entry of specs) {
  const { _slug, ...config } = entry;
  try {
    const png = await render(config, { format: 'png' });
    const outFile = join(outDir, `${_slug}.png`);
    writeFileSync(outFile, Buffer.from(png));
    console.log(`ok  ${_slug.padEnd(32)} ${png.length} bytes`);
    ok++;
  } catch (err) {
    console.error(`FAIL ${_slug}: ${err.message}`);
    failures.push({ slug: _slug, error: err.message });
    failed++;
  }
}

console.log(`\n${ok} ok, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
}
process.exit(failed > 0 ? 1 : 0);

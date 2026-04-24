import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const aspect = argValue('aspect', 'landscape');
const specsName = argValue('specs', 'specs');
const subdirName = argValue('out', aspect === 'landscape' && specsName === 'specs' ? 'charts' : `charts-${aspect}${specsName === 'specs' ? '' : '-' + specsName}`);

const ASPECT_SIZE = {
  landscape: 'share',
  square: 'square',
  portrait: 'poster',
};
const sizeOverride = ASPECT_SIZE[aspect];
if (!sizeOverride) {
  console.error(`unknown aspect: ${aspect}. Use landscape|square|portrait.`);
  process.exit(1);
}

const specsFile = resolve(root, `examples/${specsName}.json`);
const outDir = resolve(root, `examples/${subdirName}`);
mkdirSync(outDir, { recursive: true });

const { render } = await import(resolve(root, 'dist/index.js'));
const specs = JSON.parse(readFileSync(specsFile, 'utf8'));

let ok = 0;
let failed = 0;
const failures = [];

for (const entry of specs) {
  const { _slug, ...base } = entry;
  const config = { ...base, size: sizeOverride };
  try {
    const png = await render(config, { format: 'png' });
    const outFile = join(outDir, `${_slug}.png`);
    writeFileSync(outFile, Buffer.from(png));
    console.log(`ok  ${aspect.padEnd(10)} ${_slug.padEnd(32)} ${png.length} bytes`);
    ok++;
  } catch (err) {
    console.error(`FAIL ${aspect} ${_slug}: ${err.message}`);
    failures.push({ slug: _slug, error: err.message });
    failed++;
  }
}

console.log(`\n[${aspect}/${specsName}] ${ok} ok, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
}
process.exit(failed > 0 ? 1 : 0);

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const started = Date.now();

function run(label, argv) {
  console.log(`\n==> ${label}`);
  const r = spawnSync('node', argv, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n${label} FAILED with exit ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

const aspects = ['landscape', 'square', 'portrait'];
const specs = ['specs', 'edge-cases'];

for (const specsName of specs) {
  for (const aspect of aspects) {
    run(`render ${specsName} / ${aspect}`, [
      'scripts/generate-examples.mjs',
      '--aspect',
      aspect,
      '--specs',
      specsName,
    ]);
    run(`readme ${specsName} / ${aspect}`, [
      'scripts/generate-zoo-readme.mjs',
      '--aspect',
      aspect,
      '--specs',
      specsName,
    ]);
  }
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\nzoo:all done in ${elapsed}s — rendered ${aspects.length * specs.length} variants.`);

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function run(argv, label) {
  const r = spawnSync('node', argv, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`${label} failed with ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

function git(argv) {
  const r = spawnSync('git', argv, { cwd: root, stdio: ['inherit', 'pipe', 'pipe'] });
  return { status: r.status, out: String(r.stdout ?? ''), err: String(r.stderr ?? '') };
}

const changed = git(['diff', '--cached', '--name-only']).out.split('\n').filter(Boolean);

const srcTouched = changed.some((p) =>
  p.startsWith('src/') ||
  p.startsWith('scripts/generate-examples.mjs') ||
  p.startsWith('scripts/generate-zoo-readme.mjs') ||
  p.startsWith('examples/specs.json') ||
  p.startsWith('examples/edge-cases.json') ||
  p === 'scripts/zoo-all.mjs',
);

if (!srcTouched) {
  console.log('[precommit:zoos] no rendering-affecting files touched; skip.');
  process.exit(0);
}

console.log('[precommit:zoos] rendering-affecting change detected, regenerating zoos...');
run(['scripts/zoo-all.mjs'], 'zoo:all');

const statusOut = git(['status', '--porcelain', 'examples/']).out;
if (statusOut.trim()) {
  console.log('[precommit:zoos] staging regenerated zoo artifacts:');
  console.log(statusOut);
  const add = spawnSync('git', ['add', 'examples/'], { cwd: root, stdio: 'inherit' });
  if (add.status !== 0) process.exit(add.status ?? 1);
} else {
  console.log('[precommit:zoos] no zoo changes to stage.');
}

console.log('[precommit:zoos] done.');

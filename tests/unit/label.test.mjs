import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const result = await build({
  stdin: {
    contents: `export { smartLabel } from '${repoRoot}/src/formatters/label.ts';`,
    resolveDir: repoRoot,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
});
const outDir = resolve(here, '_out');
mkdirSync(outDir, { recursive: true });
const file = resolve(outDir, `label-${process.pid}-${Date.now()}.mjs`);
writeFileSync(file, result.outputFiles[0].text);
const { smartLabel } = await import(pathToFileURL(file).href);
try { rmSync(file); } catch {}

test('country-like short all-lowercase strings get uppercased', () => {
  assert.equal(smartLabel('usa'), 'USA');
  assert.equal(smartLabel('uk'), 'UK');
  assert.equal(smartLabel('eu'), 'EU');
});

test('common acronyms in the allowlist get uppercased even at 4+ chars', () => {
  assert.equal(smartLabel('arpm'), 'ARPM');
  assert.equal(smartLabel('arpu'), 'ARPU');
  assert.equal(smartLabel('nasa'), 'NASA');
  assert.equal(smartLabel('nato'), 'NATO');
});

test('long lowercase country names get Title Case', () => {
  assert.equal(smartLabel('japan'), 'Japan');
  assert.equal(smartLabel('spain'), 'Spain');
  assert.equal(smartLabel('germany'), 'Germany');
  assert.equal(smartLabel('france'), 'France');
  assert.equal(smartLabel('nigeria'), 'Nigeria');
});

test('hyphenated and underscored names get each chunk processed', () => {
  assert.equal(smartLabel('new-york'), 'New-York');
  assert.equal(smartLabel('south_korea'), 'South_Korea');
});

test('strings that already have uppercase letters are left unchanged', () => {
  assert.equal(smartLabel('iPhone'), 'iPhone');
  assert.equal(smartLabel('McDonald'), 'McDonald');
  assert.equal(smartLabel('Netflix'), 'Netflix');
});

test('empty and whitespace strings are preserved', () => {
  assert.equal(smartLabel(''), '');
  assert.equal(smartLabel(' '), ' ');
});

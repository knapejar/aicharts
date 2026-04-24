import { build, context } from 'esbuild';
import { existsSync, chmodSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const watch = process.argv.includes('--watch');

const shared = {
  platform: 'node',
  format: 'esm',
  target: 'node20',
  bundle: true,
  sourcemap: true,
  packages: 'external',
  logLevel: 'info',
};

const entries = [
  { in: 'src/index.ts', out: 'dist/index.js' },
  { in: 'src/mcp/stdio.ts', out: 'dist/mcp/stdio.js', shebang: true },
  { in: 'src/mcp/http.ts', out: 'dist/mcp/http.js' },
  { in: 'src/api/chart.ts', out: 'dist/api/chart.js' },
  { in: 'src/api/mcp.ts', out: 'dist/api/mcp.js' },
  { in: 'src/api/agent-guide.ts', out: 'dist/api/agent-guide.js' },
];

async function buildEntry(entry) {
  const inPath = resolve(root, entry.in);
  const outPath = resolve(root, entry.out);
  if (!existsSync(inPath)) {
    console.log(`[build] skip missing ${entry.in}`);
    return;
  }
  mkdirSync(dirname(outPath), { recursive: true });

  const opts = {
    ...shared,
    entryPoints: [inPath],
    outfile: outPath,
    banner: entry.shebang ? { js: '#!/usr/bin/env node' } : undefined,
  };

  if (watch) {
    const ctx = await context(opts);
    await ctx.watch();
    console.log(`[build:watch] watching ${entry.in}`);
  } else {
    await build(opts);
    if (entry.shebang && existsSync(outPath)) {
      chmodSync(outPath, 0o755);
    }
  }
}

for (const entry of entries) {
  await buildEntry(entry);
}

if (!watch) {
  console.log('[build] done');
}

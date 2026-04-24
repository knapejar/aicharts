import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');

async function bundleEntry(entryCode, { external = [] } = {}) {
  const result = await build({
    stdin: {
      contents: entryCode,
      resolveDir: repoRoot,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    external,
    write: false,
    absWorkingDir: repoRoot,
  });
  return result.outputFiles[0].text;
}

async function importBundle(bundleText) {
  const outDir = resolve(here, '_out');
  mkdirSync(outDir, { recursive: true });
  const file = resolve(
    outDir,
    `bundle-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mjs`,
  );
  writeFileSync(file, bundleText);
  try {
    return await import(pathToFileURL(file).href);
  } finally {
    try {
      rmSync(file);
    } catch {}
  }
}

export async function loadFormatters() {
  const entry = [
    "export * from '" + repoRoot + "/src/formatters/number.ts';",
    "export { pickDateFormatter, toDate } from '" + repoRoot + "/src/formatters/date.ts';",
    "export { formatPercent } from '" + repoRoot + "/src/formatters/percent.ts';",
    "export { formatCurrency } from '" + repoRoot + "/src/formatters/currency.ts';",
    "export { niceNumber, niceScale } from '" + repoRoot + "/src/formatters/tick.ts';",
  ].join('\n');
  const text = await bundleEntry(entry);
  return importBundle(text);
}

export async function loadMcpSchema() {
  const entry = "export { renderChartInputSchema } from '" + repoRoot + "/src/mcp/server.ts';";
  const text = await bundleEntry(entry, {
    external: ['@modelcontextprotocol/sdk/*', '@resvg/*', 'zod'],
  });
  const mod = await importBundle(text);
  return mod.renderChartInputSchema;
}

export async function loadSvg() {
  const entry = "export * from '" + repoRoot + "/src/core/svg.ts';";
  const text = await bundleEntry(entry);
  return importBundle(text);
}

export async function loadLayout() {
  const entry = "export * from '" + repoRoot + "/src/core/layout.ts';";
  const text = await bundleEntry(entry);
  return importBundle(text);
}

export async function loadSize() {
  const entry = "export * from '" + repoRoot + "/src/core/size.ts';";
  const text = await bundleEntry(entry);
  return importBundle(text);
}

export async function loadTheme() {
  const entry = "export * from '" + repoRoot + "/src/core/theme.ts';";
  const text = await bundleEntry(entry);
  return importBundle(text);
}

export async function loadFrame() {
  const entry = "export * from '" + repoRoot + "/src/core/frame.ts';";
  const text = await bundleEntry(entry);
  return importBundle(text);
}

export async function loadAxes() {
  const entry = [
    "export { planBandXAxis, estimateBandXAxisHeight, estimateYTickBandWidth } from '" + repoRoot + "/src/charts/axes.ts';",
  ].join('\n');
  const text = await bundleEntry(entry);
  return importBundle(text);
}

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
    contents: `export { detectAgent, KNOWN_AGENT_LIST } from '${repoRoot}/src/api/agent-detect.ts';
               export { AGENT_GUIDE, AGENT_GUIDE_BYTES } from '${repoRoot}/src/api/agent-guide-content.ts';`,
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
const file = resolve(outDir, `agent-detect-${process.pid}-${Date.now()}.mjs`);
writeFileSync(file, result.outputFiles[0].text);
const { detectAgent, KNOWN_AGENT_LIST, AGENT_GUIDE, AGENT_GUIDE_BYTES } = await import(
  pathToFileURL(file).href
);
try { rmSync(file); } catch {}

test('OpenAI GPTBot UA is detected as agent', () => {
  const ua = 'Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)';
  const d = detectAgent(ua);
  assert.equal(d.isAgent, true);
  assert.equal(d.reason, 'user-agent');
  assert.match(d.label ?? '', /GPTBot/i);
});

test('Anthropic ClaudeBot UA is detected as agent', () => {
  const d = detectAgent('Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://www.anthropic.com)');
  assert.equal(d.isAgent, true);
  assert.match(d.label ?? '', /ClaudeBot/i);
});

test('ChatGPT-User UA is detected as agent', () => {
  const d = detectAgent('Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com)');
  assert.equal(d.isAgent, true);
});

test('Perplexity UA is detected as agent', () => {
  const d = detectAgent('PerplexityBot/1.0');
  assert.equal(d.isAgent, true);
});

test('a normal desktop Firefox UA is NOT detected as agent', () => {
  const d = detectAgent('Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0');
  assert.equal(d.isAgent, false);
});

test('iPhone Safari UA is NOT detected as agent', () => {
  const d = detectAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
  assert.equal(d.isAgent, false);
});

test('?as=agent query string forces agent response', () => {
  const d = detectAgent('Mozilla/5.0 Firefox/124.0', 'as=agent');
  assert.equal(d.isAgent, true);
  assert.equal(d.reason, 'query-param');
});

test('?as=human query string overrides even a ClaudeBot UA', () => {
  const d = detectAgent('ClaudeBot/1.0', 'as=human&foo=bar');
  assert.equal(d.isAgent, false);
});

test('empty / missing UA returns non-agent', () => {
  assert.equal(detectAgent(undefined).isAgent, false);
  assert.equal(detectAgent(null).isAgent, false);
  assert.equal(detectAgent('').isAgent, false);
});

test('known-agent list covers the big four (OpenAI, Anthropic, Perplexity, Google-Extended)', () => {
  const joined = KNOWN_AGENT_LIST.join(' ').toLowerCase();
  for (const probe of ['gptbot', 'claudebot', 'perplexitybot', 'google-extended']) {
    assert.ok(joined.includes(probe), `expected ${probe} in known agents`);
  }
});

// ---------- guide content integrity ----------

test('agent guide contains canonical POST endpoint', () => {
  assert.ok(AGENT_GUIDE.includes('POST https://mcp-charts.vercel.app/chart'), 'must document POST /chart');
});

test('agent guide documents every chart type', () => {
  const types = [
    'line', 'bar', 'grouped-bar', 'stacked-bar', 'bar-split',
    'stacked-area', 'combo', 'line-split', 'pie', 'donut', 'geo',
  ];
  for (const t of types) {
    assert.ok(AGENT_GUIDE.includes(`\`${t}\``), `guide must mention chart type \`${t}\``);
  }
});

test('agent guide lists the guard-rails that could surprise an agent', () => {
  assert.match(AGENT_GUIDE, /Pie\/donut with > 6 slices/i);
  assert.match(AGENT_GUIDE, /3D/i);
  assert.match(AGENT_GUIDE, /Year values/i);
});

test('agent guide stays small (< 12 KB) to fit in an LLM context budget', () => {
  assert.ok(AGENT_GUIDE_BYTES < 12 * 1024, `guide is ${AGENT_GUIDE_BYTES} bytes; budget is 12288`);
  assert.ok(AGENT_GUIDE_BYTES > 1024, `guide is only ${AGENT_GUIDE_BYTES} bytes; too small to be useful`);
});

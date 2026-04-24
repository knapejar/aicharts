import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stdioBin = resolve(__dirname, '..', '..', 'dist', 'mcp', 'stdio.js');

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startChild() {
  const child = spawn('node', [stdioBin], { stdio: ['pipe', 'pipe', 'pipe'] });
  const stderr = { text: '' };
  child.stderr.on('data', (chunk) => {
    stderr.text += chunk.toString('utf-8');
  });
  return { child, stderr };
}

async function sendRequest(child, request, { stderr } = {}) {
  return new Promise((resolveP, rejectP) => {
    let buffer = '';
    const onData = (chunk) => {
      buffer += chunk.toString('utf-8');
      const lines = buffer.split('\n');
      for (const line of lines.slice(0, -1)) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === request.id) {
            child.stdout.off('data', onData);
            resolveP(msg);
          }
        } catch {}
      }
      buffer = lines[lines.length - 1] ?? '';
    };
    child.stdout.on('data', onData);
    const body = JSON.stringify(request);
    child.stdin.write(body + '\n');
    setTimeout(() => {
      child.stdout.off('data', onData);
      const err = new Error(
        `mcp request ${request.method} id=${request.id} timed out after 3000ms. stderr: ${stderr?.text ?? '<not captured>'}`,
      );
      rejectP(err);
    }, 3000);
  });
}

async function initialize(child, stderr) {
  const init = await sendRequest(
    child,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0.0.1' },
      },
    },
    { stderr },
  );
  child.stdin.write(
    JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
  );
  return init;
}

test('MCP stdio server initializes and lists render_chart tool', async () => {
  const { child, stderr } = startChild();
  try {
    const init = await initialize(child, stderr);
    assert.equal(init.jsonrpc, '2.0');
    assert.ok(init.result);

    const tools = await sendRequest(
      child,
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      { stderr },
    );
    assert.ok(tools.result.tools.length >= 1, `tools list empty. stderr: ${stderr.text}`);
    assert.equal(tools.result.tools[0].name, 'render_chart');
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
});

test('MCP render_chart returns valid PNG image content', async () => {
  const { child, stderr } = startChild();
  try {
    await initialize(child, stderr);

    const res = await sendRequest(
      child,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'render_chart',
          arguments: {
            chart: 'bar',
            data: [
              { label: 'A', value: 10 },
              { label: 'B', value: 20 },
            ],
            title: 'MCP test',
          },
        },
      },
      { stderr },
    );
    const content = res.result.content;
    const image = content.find((c) => c.type === 'image');
    assert.ok(image, `expected image content. stderr: ${stderr.text}`);
    assert.equal(image.mimeType, 'image/png');
    const bytes = Buffer.from(image.data, 'base64');
    assert.ok(bytes.length > 500, `decoded PNG too small: ${bytes.length}`);
    for (let i = 0; i < PNG_MAGIC.length; i++) {
      assert.equal(
        bytes[i],
        PNG_MAGIC[i],
        `PNG byte ${i} is 0x${bytes[i].toString(16)}, expected 0x${PNG_MAGIC[i].toString(16)}`,
      );
    }
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
});

test('MCP render_chart rejects invalid chart argument', async () => {
  const { child, stderr } = startChild();
  try {
    await initialize(child, stderr);

    const res = await sendRequest(
      child,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'render_chart',
          arguments: { chart: 'not-a-chart', data: [] },
        },
      },
      { stderr },
    );
    const isJsonRpcError = res.error !== undefined;
    const isToolError = res.result?.isError === true;
    assert.ok(
      isJsonRpcError || isToolError,
      `expected error response for invalid chart, got: ${JSON.stringify(res)}`,
    );
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
});

test('MCP unknown tool name returns error', async () => {
  const { child, stderr } = startChild();
  try {
    await initialize(child, stderr);

    const res = await sendRequest(
      child,
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'nope_tool', arguments: {} },
      },
      { stderr },
    );
    const isJsonRpcError = res.error !== undefined;
    const isToolError = res.result?.isError === true;
    assert.ok(
      isJsonRpcError || isToolError,
      `expected error response for unknown tool, got: ${JSON.stringify(res)}`,
    );
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
});

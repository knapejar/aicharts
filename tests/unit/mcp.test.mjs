import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stdioBin = resolve(__dirname, '..', '..', 'dist', 'mcp', 'stdio.js');

async function sendRequest(child, request) {
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
      rejectP(new Error('mcp request timeout'));
    }, 15000);
  });
}

test('MCP stdio server initializes and lists render_chart tool', async () => {
  const child = spawn('node', [stdioBin], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.on('data', () => {});
  try {
    const init = await sendRequest(child, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0.0.1' },
      },
    });
    assert.equal(init.jsonrpc, '2.0');
    assert.ok(init.result);

    child.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
    );

    const tools = await sendRequest(child, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    assert.ok(tools.result.tools.length >= 1);
    assert.equal(tools.result.tools[0].name, 'render_chart');
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
});

test('MCP render_chart returns image content', async () => {
  const child = spawn('node', [stdioBin], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.on('data', () => {});
  try {
    await sendRequest(child, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0.0.1' },
      },
    });
    child.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
    );

    const res = await sendRequest(child, {
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
    });
    const content = res.result.content;
    const image = content.find((c) => c.type === 'image');
    assert.ok(image);
    assert.equal(image.mimeType, 'image/png');
    assert.ok(image.data.length > 1000);
  } finally {
    child.kill();
    await once(child, 'exit').catch(() => {});
  }
});

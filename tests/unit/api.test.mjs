import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import handler from '../../dist/api/chart.js';

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function makeRequest(method, url, body) {
  const req = new PassThrough();
  req.method = method;
  req.url = url;
  req.headers = { 'content-type': 'application/json' };
  if (body) {
    req.write(body);
  }
  req.end();
  return req;
}

function makeResponse() {
  const res = new PassThrough();
  res.statusCode = 200;
  res.headers = {};
  res.setHeader = (k, v) => {
    res.headers[k.toLowerCase()] = v;
  };
  res.getHeader = (k) => res.headers[k.toLowerCase()];
  const chunks = [];
  const originalWrite = res.write.bind(res);
  res.write = (chunk) => {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return originalWrite(chunk);
  };
  res._body = () => Buffer.concat(chunks);
  const originalEnd = res.end.bind(res);
  res.end = (chunk) => {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return originalEnd(chunk);
  };
  return res;
}

function assertBodyIsPng(body, label) {
  assert.ok(body.length > 500, `${label}: body too small: ${body.length}`);
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    assert.equal(
      body[i],
      PNG_MAGIC[i],
      `${label}: byte ${i} is 0x${body[i].toString(16)}, expected 0x${PNG_MAGIC[i].toString(16)}`,
    );
  }
}

function encodeBase64UrlConfig(config) {
  return Buffer.from(JSON.stringify(config))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

test('POST /chart returns PNG with CORS headers', async () => {
  const req = makeRequest(
    'POST',
    '/chart',
    JSON.stringify({
      chart: 'bar',
      data: [
        { label: 'A', value: 10 },
        { label: 'B', value: 20 },
      ],
      title: 'API test',
    }),
  );
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'image/png');
  assert.equal(res.headers['access-control-allow-origin'], '*');
  assertBodyIsPng(res._body(), 'POST /chart');
});

test('GET /chart?config=<base64> returns PNG', async () => {
  const encoded = encodeBase64UrlConfig({
    chart: 'line',
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ],
    x: 'x',
    y: 'y',
    title: 'GET test',
  });
  const req = makeRequest('GET', `/chart?config=${encoded}`);
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'image/png');
  assertBodyIsPng(res._body(), 'GET /chart');
});

test('GET /chart?config=<base64>&format=svg returns SVG body', async () => {
  const encoded = encodeBase64UrlConfig({
    chart: 'line',
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ],
    x: 'x',
    y: 'y',
    title: 'SVG via GET',
  });
  const req = makeRequest('GET', `/chart?config=${encoded}&format=svg`);
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'image/svg+xml');
  const body = res._body().toString('utf-8');
  assert.ok(body.trimStart().startsWith('<svg'), `body must start with <svg, got: ${body.slice(0, 64)}`);
});

test('OPTIONS /chart returns 204 with CORS headers', async () => {
  const req = makeRequest('OPTIONS', '/chart');
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['access-control-allow-origin'], '*');
  assert.ok(
    (res.headers['access-control-allow-methods'] ?? '').includes('POST'),
    `expected POST in allow-methods, got: ${res.headers['access-control-allow-methods']}`,
  );
});

test('PUT and DELETE /chart return 405', async () => {
  for (const method of ['PUT', 'DELETE']) {
    const req = makeRequest(method, '/chart');
    const res = makeResponse();
    await handler(req, res);
    assert.equal(res.statusCode, 405, `${method} should be 405, got ${res.statusCode}`);
  }
});

test('GET /chart without config returns 400', async () => {
  const req = makeRequest('GET', '/chart');
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('POST /chart with invalid JSON returns 400', async () => {
  const req = makeRequest('POST', '/chart', 'not json');
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 400);
});

test('POST /chart with invalid chart type returns 4xx or 5xx (locked current behavior)', async () => {
  const req = makeRequest(
    'POST',
    '/chart',
    JSON.stringify({ chart: 'neexistuje', data: [] }),
  );
  const res = makeResponse();
  await handler(req, res);
  assert.ok(
    res.statusCode >= 400 && res.statusCode < 600,
    `expected 4xx or 5xx for invalid chart, got ${res.statusCode}`,
  );
});

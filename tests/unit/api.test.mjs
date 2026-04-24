import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import handler from '../../dist/api/chart.js';

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

test('POST /chart returns PNG', async () => {
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
  const body = res._body();
  assert.equal(body[0], 0x89);
  assert.equal(body[1], 0x50);
  assert.equal(body[2], 0x4e);
  assert.equal(body[3], 0x47);
});

test('GET /chart?config=<base64> returns PNG', async () => {
  const config = {
    chart: 'line',
    data: [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ],
    x: 'x',
    y: 'y',
    title: 'GET test',
  };
  const encoded = Buffer.from(JSON.stringify(config))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const req = makeRequest('GET', `/chart?config=${encoded}`);
  const res = makeResponse();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'image/png');
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

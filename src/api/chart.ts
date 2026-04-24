import type { IncomingMessage, ServerResponse } from 'node:http';
import { render } from '../render/index.js';
import type { ChartConfig } from '../core/types.js';

function decodeBase64Url(input: string): string {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : '';
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64').toString('utf-8');
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf-8');
  return JSON.parse(raw);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  let config: ChartConfig | null = null;
  let format: 'png' | 'svg' = 'png';

  try {
    if (req.method === 'POST') {
      config = (await readJsonBody(req)) as ChartConfig;
    } else if (req.method === 'GET') {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const param = url.searchParams.get('config');
      const fmt = url.searchParams.get('format');
      if (fmt === 'svg') format = 'svg';
      if (!param) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error:
              'Missing ?config=<base64url-encoded JSON>. Example: /chart?config=eyJjaGFydCI6ImJhciIsImRhdGEiOlt7ImxhYmVsIjoiQSIsInZhbHVlIjoxMn1dfQ',
          }),
        );
        return;
      }
      config = JSON.parse(decodeBase64Url(param)) as ChartConfig;
    } else {
      res.statusCode = 405;
      res.end('method not allowed');
      return;
    }
  } catch (err) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({ error: 'invalid request body', detail: (err as Error).message }),
    );
    return;
  }

  try {
    const out = await render(config!, { format });
    if (format === 'svg') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.end(Buffer.from(out));
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end(Buffer.from(out));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({ error: 'render failed', detail: (err as Error).message }),
    );
  }
}

import type { IncomingMessage, ServerResponse } from 'node:http';
import { render } from '../render/index.js';
import { _debugFontState } from '../render/svg-to-png.js';
import { detectAgent } from './agent-detect.js';
import { AGENT_GUIDE } from './agent-guide-content.js';
import type { ChartConfig } from '../core/types.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isValidPng(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  const head = Buffer.from(data.buffer, data.byteOffset, 8);
  return head.equals(PNG_SIGNATURE);
}

function decodeBase64Url(input: string): string {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : '';
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64').toString('utf-8');
}

function parseSimpleData(input: string): Array<{ label: string; value: number }> {
  const rows: Array<{ label: string; value: number }> = [];
  for (const pair of input.split(',')) {
    const idx = pair.lastIndexOf(':');
    if (idx === -1) continue;
    const label = pair.slice(0, idx).trim();
    const value = Number(pair.slice(idx + 1).trim());
    if (label && Number.isFinite(value)) rows.push({ label, value });
  }
  return rows;
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
      if (url.searchParams.get('_debug') === 'fonts') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(_debugFontState(), null, 2));
        return;
      }
      const jParam = url.searchParams.get('j');
      const param = url.searchParams.get('config');
      const dataParam = url.searchParams.get('data');
      const fmt = url.searchParams.get('format');
      if (fmt === 'svg') format = 'svg';
      if (!param && !jParam && !dataParam) {
        const detection = detectAgent(req.headers['user-agent'], url.search.slice(1));
        if (detection.isAgent) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.setHeader(
            'X-AIcharts-Served',
            `agent-guide:${detection.reason}:${detection.label ?? 'unknown'}`,
          );
          res.end(AGENT_GUIDE);
          return;
        }
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error:
              'Provide chart parameters. Simplest: /chart?title=Demo&data=A:10,B:20. Advanced: /chart?j=<url-encoded JSON>.',
            hint: 'If you are an AI agent, fetch /agent-guide for full schema.',
          }),
        );
        return;
      }
      if (jParam) {
        config = JSON.parse(jParam) as ChartConfig;
      } else if (param) {
        const raw = param.trim();
        config = JSON.parse(
          raw.startsWith('{') || raw.startsWith('[') ? raw : decodeBase64Url(raw),
        ) as ChartConfig;
      } else {
        const data = parseSimpleData(dataParam!);
        if (data.length === 0) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'invalid data param',
              hint: 'Use ?data=Label1:Value1,Label2:Value2 with numeric values.',
            }),
          );
          return;
        }
        const pickStr = (name: string): string | undefined => {
          const v = url.searchParams.get(name);
          return v && v.trim() ? v : undefined;
        };
        config = {
          chart: 'bar',
          title: pickStr('title'),
          subtitle: pickStr('subtitle'),
          source: pickStr('source'),
          data,
        } as ChartConfig;
      }
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
    if (!isValidPng(out)) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'render produced non-PNG output',
          bytes: out.length,
          hint: 'resvg returned bytes that do not start with the PNG magic signature',
        }),
      );
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

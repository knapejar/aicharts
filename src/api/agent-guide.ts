import type { IncomingMessage, ServerResponse } from 'node:http';
import { AGENT_GUIDE } from './agent-guide-content.js';
import { detectAgent } from './agent-detect.js';

function sendGuide(res: ServerResponse, reason: string) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-AIcharts-Served', `agent-guide:${reason}`);
  res.end(AGENT_GUIDE);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('method not allowed');
    return;
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  const detection = detectAgent(req.headers['user-agent'], url.search.slice(1));
  sendGuide(res, detection.reason === 'none' ? 'explicit-path' : detection.reason);
}

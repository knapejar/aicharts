import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer as createHttp, type IncomingMessage, type ServerResponse } from 'node:http';
import { createServer } from './server.js';

const port = Number(process.env.PORT ?? 3000);

const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
const server = createServer();
await server.connect(transport);

const http = createHttp(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.url?.startsWith('/mcp')) {
    await transport.handleRequest(req, res);
    return;
  }
  res.statusCode = 404;
  res.end('not found');
});

http.listen(port, () => {
  console.log(`[aicharts] http mcp server on :${port}/mcp`);
});

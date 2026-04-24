import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { render } from '../render/index.js';
import type { ChartConfig } from '../core/types.js';
import { listPalettes } from '../palettes/index.js';

const SIZE_ENUM = z.enum(['inline', 'share', 'poster']).optional();

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function isValidPng(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  const head = Buffer.from(data.buffer, data.byteOffset, 8);
  return head.equals(PNG_SIGNATURE);
}

const paletteSchema = z.union([
  z.string(),
  z.object({
    name: z.string().optional(),
    colors: z.array(z.string()).optional(),
    background: z.string().optional(),
    text: z.string().optional(),
    textMuted: z.string().optional(),
    grid: z.string().optional(),
    axis: z.string().optional(),
    accent: z.string().optional(),
    fontHeadline: z.string().optional(),
    fontBody: z.string().optional(),
    fontStack: z.string().optional(),
  }),
]);

const dataSchema = z.array(z.record(z.union([z.string(), z.number(), z.null()])));

export const renderChartInputSchema = {
  chart: z
    .enum([
      'line',
      'bar',
      'grouped-bar',
      'stacked-bar',
      'bar-split',
      'stacked-area',
      'combo',
      'line-split',
      'pie',
      'donut',
      'geo',
    ])
    .describe('Chart type. Pick one from the 11 supported kinds.'),
  data: dataSchema.describe(
    'Array of row objects. Each row has string or number values keyed by column name.',
  ),
  title: z.string().optional().describe('Main chart title, left-aligned at the top.'),
  subtitle: z.string().optional().describe('One-line subtitle under the title.'),
  source: z.string().optional().describe('Source attribution shown at the bottom.'),
  x: z.string().optional().describe('Name of the column to use for the x axis or category labels.'),
  y: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Name(s) of the column(s) plotted on the y axis.'),
  label: z.string().optional().describe('Category label column for pie / donut charts.'),
  value: z.string().optional().describe('Value column for pie / donut / geo charts.'),
  code: z.string().optional().describe('Country / region code column for geo charts (ISO3).'),
  bars: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Bar series column(s) for combo charts.'),
  lines: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Line series column(s) for combo charts.'),
  basemap: z.string().optional().describe('Basemap id for geo charts. Default: world.'),
  palette: paletteSchema.optional().describe('Palette name or custom palette object.'),
  size: SIZE_ENUM.describe(
    'Preset size: inline (800x500), share (1200x675, default), poster (1600x2000).',
  ),
  width: z.number().int().min(200).max(4000).optional(),
  height: z.number().int().min(200).max(4000).optional(),
  orientation: z.enum(['vertical', 'horizontal']).optional(),
  interpolation: z.enum(['linear', 'curved', 'stepped']).optional(),
  sort: z.enum(['asc', 'desc', 'none']).optional(),
  normalize: z.boolean().optional(),
  format: z.enum(['png', 'svg']).optional().default('png'),
};

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'aicharts',
    version: '0.1.0',
  });

  server.registerTool(
    'render_chart',
    {
      title: 'Render chart',
      description:
        'Render a declarative chart config to an image. Supports line, bar, grouped-bar, stacked-bar, bar-split, stacked-area, combo, line-split, pie, donut, and geo chart types. Returns a base64 PNG by default. Available palettes: ' +
        listPalettes().join(', ') +
        '.',
      inputSchema: renderChartInputSchema,
    },
    async (args) => {
      const config = args as unknown as ChartConfig;
      const format = (args as { format?: 'png' | 'svg' }).format ?? 'png';
      const data = await render(config, { format });
      if (format === 'svg') {
        const text = new TextDecoder().decode(data);
        return {
          content: [
            { type: 'text', text },
          ],
        };
      }
      if (!isValidPng(data)) {
        return {
          content: [
            {
              type: 'text',
              text: `Render produced ${data.length} bytes that are not a valid PNG. Returning text instead of a corrupt image to avoid poisoning the conversation.`,
            },
          ],
          isError: true,
        };
      }
      const base64 = Buffer.from(data).toString('base64');
      if (base64.length > 900_000) {
        return {
          content: [
            {
              type: 'text',
              text: `Generated image is too large (${base64.length} bytes). Try a smaller size.`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          { type: 'image', data: base64, mimeType: 'image/png' },
          {
            type: 'text',
            text: `Rendered ${config.chart} chart${config.title ? ` — ${config.title}` : ''}.`,
          },
        ],
      };
    },
  );

  return server;
}

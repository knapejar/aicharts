import type { Palette } from '../core/types.js';
import { clarity } from './clarity.js';
import { boardroom } from './boardroom.js';
import { editorial } from './editorial.js';
import { vibrant } from './vibrant.js';
import { carbon } from './carbon.js';
import { viridis } from './viridis.js';
import { earth } from './earth.js';
import { twilight } from './twilight.js';
import { monoBlue } from './mono-blue.js';
import { divergingSunset } from './diverging-sunset.js';

export const PALETTES: Record<string, Palette> = {
  clarity,
  boardroom,
  editorial,
  vibrant,
  carbon,
  viridis,
  earth,
  twilight,
  'mono-blue': monoBlue,
  'diverging-sunset': divergingSunset,
};

export const DEFAULT_PALETTE_NAME = 'clarity';

export function listPalettes(): string[] {
  return Object.keys(PALETTES);
}

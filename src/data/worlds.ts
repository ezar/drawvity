import type { WorldDef } from '../types'

export const WORLDS: WorldDef[] = [
  {
    id: 'lab',
    name: 'The Lab',
    subtitle: 'Warm paper · graph grid',
    bg: '#FAF4E6',
    fg: '#1F1A14',
    accent: '#E25C3B',
    glyph: '⚗',
    pattern: 'graph',
    gravity: 1.0,
    levels: 10,
  },
  {
    id: 'factory',
    name: 'The Factory',
    subtitle: 'Steel mesh · safety paint',
    bg: '#D7D2C5',
    fg: '#2A2622',
    accent: '#E89A1F',
    glyph: '⚙',
    pattern: 'metal',
    gravity: 1.2,
    levels: 10,
  },
  {
    id: 'castle',
    name: 'The Castle',
    subtitle: 'Stone walls · torchlight',
    bg: '#C8B791',
    fg: '#2E2218',
    accent: '#B33A2C',
    glyph: '♛',
    pattern: 'stone',
    gravity: 0.9,
    levels: 10,
  },
  {
    id: 'space',
    name: 'Space',
    subtitle: 'Vacuum · slow gravity',
    bg: '#0F1330',
    fg: '#F2EBDA',
    accent: '#7BD3F0',
    glyph: '✦',
    pattern: 'stars',
    gravity: 0.15,
    levels: 10,
  },
]

export const WORLD_MAP: Record<string, WorldDef> =
  Object.fromEntries(WORLDS.map((w) => [w.id, w]))

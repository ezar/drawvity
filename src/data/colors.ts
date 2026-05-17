import { palette } from '../theme/toy'

export interface StrokeColor {
  id: string
  hex: string
  name: string
  unlockStars: number
}

export const STROKE_COLORS: StrokeColor[] = [
  { id: 'ink',     hex: palette.ink,       name: 'Pencil ink',    unlockStars: 0  },
  { id: 'primary', hex: palette.primary,   name: 'Coral marker',  unlockStars: 0  },
  { id: 'second',  hex: palette.secondary, name: 'Mustard chalk', unlockStars: 0  },
  { id: 'third',   hex: palette.tertiary,  name: 'Cobalt pen',    unlockStars: 0  },
  { id: 'accent',  hex: '#5BB390',         name: 'Mint liner',    unlockStars: 10 },
  { id: 'rose',    hex: '#F4D8E4',         name: 'Rose pastel',   unlockStars: 20 },
  { id: 'neon',    hex: '#A0FF00',         name: 'Neon glow',     unlockStars: 30 },
]

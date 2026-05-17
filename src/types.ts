export type WorldId = 'lab' | 'factory' | 'castle' | 'space'
export type BallId = 'classic' | 'heavy' | 'bouncy' | 'feather' | 'magnet' | 'comet'
export type ScreenId = 'menu' | 'map' | 'level' | 'free' | 'collection' | 'editor' | 'custom'

export interface CustomLevel extends Level {
  createdAt: number
}
export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_STROKES: Record<Difficulty, number> = {
  easy:   4,
  medium: 3,
  hard:   2,
}

export interface Point { x: number; y: number }

export interface Obstacle {
  points: Point[]  // normalized 0–1
}

export interface Level {
  id: string
  name: string
  worldId: WorldId
  ballSpawn: Point   // normalized 0–1
  goal: Point        // normalized 0–1
  strokesMax: number
  obstacles: Obstacle[]
}

export interface WorldDef {
  id: WorldId
  name: string
  subtitle: string
  bg: string
  fg: string
  accent: string
  glyph: string
  pattern: 'graph' | 'metal' | 'stone' | 'stars'
  gravity: number    // Matter.js gravity.y scale
  levels: number     // always 10
}

export interface BallDef {
  id: BallId
  name: string
  color: string
  density: number
  restitution: number
  friction: number
  trailFrames: number
  trailColor: string
  hint: string
  locked: boolean
}

export interface Progress {
  stars: number[]    // index = level index (0–9), value = 0|1|2|3
}

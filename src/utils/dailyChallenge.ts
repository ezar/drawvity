import type { Level, WorldId, Point } from '../types'

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dateToSeed(dateStr: string): number {
  // e.g. '2026-05-19' → 20260519
  return parseInt(dateStr.replace(/-/g, ''), 10)
}

/** Today's date as YYYY-MM-DD (local time) */
export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Days since an epoch — used as challenge number */
export function dayNumber(dateStr: string): number {
  const epoch = new Date('2026-05-19').getTime()
  const d = new Date(dateStr).getTime()
  return Math.floor((d - epoch) / 86_400_000) + 1
}

/** Seconds until midnight (local) */
export function secondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

// ── Obstacle generation ───────────────────────────────────────────────────────
function genObstacle(rng: () => number): { points: Point[] } {
  const numPts = 2 + Math.floor(rng() * 2)  // 2–3 points
  // anchor in mid-canvas with meaningful horizontal span
  const x0 = 0.12 + rng() * 0.55
  const y0 = 0.2  + rng() * 0.55
  const pts: Point[] = [{ x: x0, y: y0 }]
  for (let i = 1; i < numPts; i++) {
    const prev = pts[i - 1]
    pts.push({
      x: Math.max(0.05, Math.min(0.92, prev.x + 0.08 + rng() * 0.28)),
      y: Math.max(0.12, Math.min(0.88, prev.y + (rng() - 0.55) * 0.22)),
    })
  }
  return { points: pts }
}

// ── Level generator ───────────────────────────────────────────────────────────
export function generateDailyLevel(dateStr: string): Level {
  const rng = mulberry32(dateToSeed(dateStr))

  const worlds: WorldId[] = ['lab', 'factory', 'castle', 'space']
  const worldId = worlds[Math.floor(rng() * 4)]

  // Spawn top-left quadrant, goal bottom-right quadrant
  const ballSpawn: Point = { x: 0.05 + rng() * 0.18, y: 0.05 + rng() * 0.22 }
  const goal:      Point = { x: 0.68 + rng() * 0.24, y: 0.58 + rng() * 0.32 }

  const numObs = 2 + Math.floor(rng() * 3)  // 2–4 obstacles
  const obstacles = Array.from({ length: numObs }, () => genObstacle(rng))

  const strokesMax = 2 + Math.floor(rng() * 2)  // 2–3

  return {
    id: `daily-${dateStr}`,
    name: `Daily #${dayNumber(dateStr)}`,
    worldId,
    ballSpawn,
    goal,
    strokesMax,
    obstacles,
  }
}

/** Format countdown hh:mm:ss */
export function formatCountdown(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Wordle-style result for sharing */
export function buildShareText(dateStr: string, stars: number, strokes: number, strokesMax: number): string {
  const num   = dayNumber(dateStr)
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars)
  const stroke  = '✏️'.repeat(strokes) + '⬜'.repeat(Math.max(0, strokesMax - strokes))
  return `🎮 Drawvity Daily #${num}\n${starStr}\n${stroke}\nhttps://ezar.github.io/drawvity/`
}

# Drawvity — Game Design Spec

**Date:** 2026-05-17
**Status:** Approved

---

## Overview

Drawvity is a physics puzzle game. The player draws up to 3 freehand strokes on a canvas, then launches a ball that rolls, bounces, and slides along those strokes toward a glowing star goal. Each level includes pre-placed static obstacles as part of the puzzle. Success requires guiding the ball to the goal using as few strokes as possible.

**Tagline:** Draw. Watch. Wonder.

---

## Decisions Made

| Decision | Choice |
|---|---|
| Visual style | Modern Toy (clean surfaces, soft shadows, rounded) |
| Physics engine | Matter.js (headless, canvas handles rendering) |
| Scope | 4 worlds × 10 levels = 40 levels total |
| State persistence | localStorage via Zustand persist middleware |
| Levels | Pre-placed static obstacles + ball spawn + goal position |

---

## Architecture

```
src/
├── data/
│   └── levels/
│       ├── world-1-lab.ts
│       ├── world-2-factory.ts
│       ├── world-3-castle.ts
│       └── world-4-space.ts
├── store/
│   └── gameStore.ts          # Zustand: screen, progress, ball, world
├── engine/
│   ├── physics.ts            # Matter.js world setup and body factories
│   └── renderer.ts           # canvas drawing primitives
├── components/
│   ├── GameCanvas.tsx        # two stacked <canvas> refs + draw/physics loop
│   ├── HUD.tsx               # top bar: level name, stroke counter, back button
│   └── BallBar.tsx           # bottom: ball selector + Launch button
├── screens/
│   ├── MenuScreen.tsx
│   ├── WorldMapScreen.tsx
│   ├── LevelScreen.tsx       # owns GameCanvas + win/loss overlays
│   ├── CollectionScreen.tsx
│   └── overlays/
│       ├── WinOverlay.tsx
│       └── LossOverlay.tsx
├── theme/
│   └── toy.ts                # Modern Toy design tokens
└── App.tsx                   # screen routing via Zustand screen state
```

### Data Flow Per Level

1. `LevelScreen` reads current level from store → passes `Level` data to `GameCanvas`
2. `GameCanvas` renders static canvas: world background + pre-placed obstacles
3. Player draws strokes → each stroke appended to local `strokes[]` → static canvas re-renders
4. Launch button pressed → `physics.ts` creates Matter world: static bodies for obstacles + strokes, dynamic ball body
5. RAF loop: `Matter.Engine.update()` → read ball position → redraw dynamic canvas
6. Win (ball within threshold of goal) → stop engine → `WinOverlay`
7. Loss (ball off-screen or frame limit exceeded) → stop engine → `LossOverlay`

---

## State & Data Model

### Zustand Store (`gameStore.ts`)

```ts
type Screen = 'menu' | 'map' | 'level' | 'collection'
type WorldId = 'lab' | 'factory' | 'castle' | 'space'
type BallId = 'classic' | 'heavy' | 'bouncy' | 'feather' | 'magnet' | 'comet'

interface GameStore {
  screen: Screen
  currentWorld: WorldId
  currentLevel: number           // 0–9 within world
  selectedBall: BallId
  progress: Record<WorldId, { stars: number[] }>  // stars[i] = 0|1|2|3
  unlockedBalls: BallId[]
  unlockedColors: string[]

  // actions
  setScreen: (s: Screen) => void
  setWorld: (w: WorldId) => void
  setLevel: (n: number) => void
  selectBall: (b: BallId) => void
  recordResult: (world: WorldId, level: number, stars: number) => void
}
```

Persisted to localStorage via `zustand/middleware` `persist`. Key: `drawvity-v1`.

### Level Data Format

```ts
interface Obstacle {
  points: { x: number; y: number }[]  // polyline, normalized 0–1
}

interface Level {
  id: string
  name: string
  ballSpawn: { x: number; y: number }  // normalized 0–1
  goal: { x: number; y: number }       // normalized 0–1
  strokesMax: number                   // always 3 in v1
  obstacles: Obstacle[]
}
```

All positions normalized (0–1) and scaled to canvas dimensions at runtime. This makes levels resolution-independent across mobile/tablet/desktop.

### Star Rating

| Strokes used | Stars |
|---|---|
| 1 | ★★★ |
| 2 | ★★☆ |
| 3 | ★☆☆ |
| Failed | 0 |

### World Unlock Threshold

Each world requires ≥ 15 stars from the previous world to unlock. Lab is always unlocked.

### Ball Unlocks

| Ball | Unlock condition |
|---|---|
| Classic | Always |
| Heavy | Always |
| Bouncy | Always |
| Feather | Always |
| Magnet | Earn 20 stars total |
| Comet | Complete all 40 levels |

### Stroke Color Unlocks

4 colors unlocked from start. 4 more unlock at 10 / 20 / 30 / 40 total stars.

---

## Game Canvas & Physics

### Layered Canvases (`GameCanvas.tsx`)

```
┌─────────────────────────────┐
│  dynamic canvas (top)       │  ball, trail, goal star pulse
├─────────────────────────────┤
│  static canvas (bottom)     │  world BG, obstacles, player strokes
└─────────────────────────────┘
```

Both canvases fill the level area (viewport minus HUD chrome, ~56px top, ~96px bottom).
HiDPI: `canvas.width = cssWidth * Math.min(devicePixelRatio, 2)`.

### Drawing Phase (pre-Launch)

- Pointer events (`mousedown/move/up`, `touchstart/move/end`) on static canvas
- Collect `{x, y}[]` with minimum distance filter (>2px between samples)
- On pointer-up: append completed stroke to `strokes[]` → re-render static canvas
- Enforce `strokes.length < strokesMax` before starting new stroke
- Stroke visual: smooth filled-circle chain, 6px wide, ball color, 90% opacity

### Launch Phase (Matter.js)

```ts
// engine/physics.ts
function createWorld(level, strokes, ball, canvasW, canvasH) {
  const engine = Matter.Engine.create()
  engine.gravity.y = WORLD_GRAVITY[level.worldId]

  // walls
  addWalls(engine, canvasW, canvasH)

  // pre-placed obstacles (static)
  for (const obs of level.obstacles) {
    addPolylineBody(engine, obs.points, canvasW, canvasH, { isStatic: true })
  }

  // player strokes (static)
  for (const stroke of strokes) {
    addPolylineBody(engine, stroke.points, 1, 1, { isStatic: true })
    // stroke points already in canvas px (not normalized)
  }

  // ball (dynamic)
  const ballBody = Matter.Bodies.circle(
    level.ballSpawn.x * canvasW,
    level.ballSpawn.y * canvasH,
    12,
    { density: ball.weight * 0.001, restitution: ball.bounce, friction: 0.3 }
  )
  Matter.Body.setVelocity(ballBody, { x: 1.5, y: 0 })
  Matter.World.add(engine.world, ballBody)

  return { engine, ballBody }
}
```

Polyline → Matter.js: each consecutive pair of points becomes a thin rectangle body (static). Width = stroke visual width + 2px collision margin.

### RAF Loop

```ts
let frames = 0
const step = () => {
  Matter.Engine.update(engine, 1000 / 60)
  const { x, y } = ballBody.position

  // win check
  if (dist(x, y, goalX, goalY) < 20) { onWin(strokesUsed); return }
  // loss check
  if (y > canvasH + 60 || frames > 600) { onLoss(); return }

  drawDynamicFrame(dynCtx, { x, y }, trail, goal)
  frames++
  rafId = requestAnimationFrame(step)
}
```

### World Gravity

| World | `gravity.y` |
|---|---|
| Lab | 1.0 |
| Factory | 1.2 |
| Castle | 0.9 |
| Space | 0.15 |

### Ball Physics Properties

| Ball | density | restitution | friction |
|---|---|---|---|
| Classic | 0.001 | 0.6 | 0.3 |
| Heavy | 0.0022 | 0.2 | 0.4 |
| Bouncy | 0.0007 | 0.95 | 0.1 |
| Feather | 0.0003 | 0.5 | 0.2 |
| Magnet | 0.001 | 0.4 | 0.6 |
| Comet | 0.0009 | 0.7 | 0.1 |

**Notes:**
- Magnet: no actual magnetic attraction physics in v1. High friction makes it "stick" to surfaces naturally.
- Comet: renders a 30-frame trail (vs 18 for others) with warm orange tint (`rgba(255,140,40,0.5)`). Same physics as Bouncy otherwise.

---

## Visual System — Modern Toy

### Design Tokens (`theme/toy.ts`)

```ts
export const toy = {
  radius: 22,
  btnRadius: 999,
  shadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 20px rgba(31,26,20,.14), 0 2px 4px rgba(31,26,20,.08)',
  border: '1.5px solid rgba(31,26,20,.12)',
  grain: 0,
}

export const palette = {
  paper:      '#FAF4E6',
  paperDeep:  '#F1E8D2',
  ink:        '#1F1A14',
  inkSoft:    '#5C5240',
  primary:    '#E25C3B',
  secondary:  '#E8B73E',
  tertiary:   '#2E5BB8',
  accent:     '#5BB390',
}
```

### Typography

| Role | Font | Size |
|---|---|---|
| Display / headings | Caprasimo | 24–96px |
| Body / UI labels | Nunito | 12–18px |
| Data / counters | JetBrains Mono | 10–13px |

Loaded via Google Fonts in `index.html`.

### World Backgrounds (canvas-rendered)

| World | Pattern |
|---|---|
| Lab | Graph grid (28px cells, blue accent every 5) |
| Factory | Diamond mesh + rivets |
| Castle | Stone blocks + torch radial glow |
| Space | Seeded starfield + nebula gradient |

### Ball Rendering (dynamic canvas)

- Filled circle, ball color
- Radial gradient highlight: `rgba(255,255,255,.4)` spot at (-30%, -30%)
- Outline: `rgba(31,26,20,.5)`, 1.4px
- Trail: 18 frames, opacity `i/18 * 0.4`, radius scales `i/18 * ballRadius`

### Animations

- Screen transitions: Framer Motion `AnimatePresence` with `y: 20 → 0, opacity: 0 → 1`
- Overlays: spring pop `scale: 0.85 → 1, opacity: 0 → 1`
- Goal star: `Math.sin(Date.now() / 600) * 0.08` scale on dynamic canvas
- Launch button: CSS `@keyframes dp-pulse` scale 1 → 1.04 while ready

---

## Screens

### Menu
Two-column layout (landscape) / stacked (portrait). Hero tagline left, 3 nav cards right: Play → map, Free Draw → free-draw mode, Collection.

### Free Draw
Same as Level screen but: `strokesMax = Infinity`, no goal star rendered, no win/loss conditions, no ball selector lock, retry button clears all strokes. Ball launches and simulates indefinitely until off-screen (auto-reset) or user taps retry.

### World Map
4 world cards in 2×2 grid. Each shows: world name, subtitle, glyph icon, level progress dots (filled = star earned). Locked worlds show blur overlay. Current world highlighted with primary color border.

### Level
Top HUD: back button, level name, stroke counter, retry button.
Canvas area: static + dynamic layers.
Bottom HUD: ball selector strip, hint text, Launch button.

### Win Overlay
Blurred backdrop, card with animated 3-star reveal (staggered 250ms/600ms/950ms), stats ("2 of 3 strokes · Classic ball"), Improve + Next Level buttons.

### Loss Overlay
Blurred backdrop, sad ball face, "So close." message, World Map + Try Again buttons.

### Collection
Two sections: Balls grid (3 cols portrait / 6 cols landscape), Stroke Colors grid. Locked items shown at 55% opacity with lock icon.

---

## Persistence

Zustand `persist` middleware writes to `localStorage` key `drawvity-v1`. Shape:

```json
{
  "progress": {
    "lab":     { "stars": [3, 2, 1, 0, 0, 0, 0, 0, 0, 0] },
    "factory": { "stars": [] },
    "castle":  { "stars": [] },
    "space":   { "stars": [] }
  },
  "unlockedBalls": ["classic", "heavy", "bouncy", "feather"],
  "unlockedColors": ["ink", "primary", "secondary", "tertiary"],
  "selectedBall": "classic"
}
```

No migration strategy needed for v1 — schema is stable.

---

## Out of Scope (v1)

- Sound / music
- Haptic feedback
- Cloud sync / leaderboards
- Level editor
- Multiplayer
- IAP / monetization
- Undo stroke (retry resets all strokes)

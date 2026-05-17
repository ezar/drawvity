# Drawvity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Drawvity — a physics puzzle game where players draw stroke paths, then launch a ball to reach a star goal across 40 levels in 4 worlds.

**Architecture:** Layered canvas (static: BG + obstacles + strokes; dynamic: ball + trail + goal). Matter.js headless physics engine. React + Zustand for UI/state. Modern Toy visual style.

**Tech Stack:** React 19, TypeScript, Vite, Matter.js, Zustand (persist), Framer Motion, Vitest

---

## File Map

```
src/
├── types.ts                          # Level, World, Ball, GameState interfaces
├── theme/
│   └── toy.ts                        # Design tokens + palette
├── store/
│   └── gameStore.ts                  # Zustand store with localStorage persist
├── data/
│   ├── balls.ts                      # BALLS array with physics props
│   ├── worlds.ts                     # WORLDS array with gravity/pattern/colors
│   └── levels/
│       ├── index.ts                  # re-exports all worlds
│       ├── world-1-lab.ts            # 10 Lab levels
│       ├── world-2-factory.ts        # 10 Factory levels
│       ├── world-3-castle.ts         # 10 Castle levels
│       └── world-4-space.ts          # 10 Space levels
├── engine/
│   ├── physics.ts                    # Matter.js world factory + body helpers
│   └── renderer.ts                   # Canvas drawing primitives
├── components/
│   ├── GameCanvas.tsx                # Two stacked canvases + draw/launch loop
│   ├── HUD.tsx                       # Top bar: level name, stroke counter, back
│   ├── BallBar.tsx                   # Bottom: ball selector + Launch button
│   └── StrokeCounter.tsx             # Dot indicator for strokes used/remaining
├── screens/
│   ├── MenuScreen.tsx
│   ├── WorldMapScreen.tsx
│   ├── LevelScreen.tsx
│   ├── FreeDrawScreen.tsx
│   ├── CollectionScreen.tsx
│   └── overlays/
│       ├── WinOverlay.tsx
│       └── LossOverlay.tsx
├── App.tsx                           # Screen router with AnimatePresence
├── index.css                         # Global reset + font import
└── main.tsx                          # Entry point
```

---

## Task 1: Project Setup

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Modify: `index.html`
- Modify: `src/index.css`
- Create: `src/App.tsx` (replace)

- [ ] **Step 1: Install Vitest**

```bash
cd D:/Development/Personal/drawvity
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

Expected: vitest added to devDependencies.

- [ ] **Step 2: Configure Vitest in vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test types to tsconfig.app.json**

Add to `compilerOptions`:
```json
"types": ["vitest/globals"]
```

- [ ] **Step 5: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 6: Add Google Fonts to index.html**

Replace `<head>` content with:
```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Drawvity</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" />
```

- [ ] **Step 7: Replace src/index.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { width: 100%; height: 100%; overflow: hidden; }
body {
  font-family: 'Nunito', system-ui, sans-serif;
  background: #14110d;
  -webkit-font-smoothing: antialiased;
}
button { font-family: inherit; }
```

- [ ] **Step 8: Replace src/App.tsx with minimal shell**

```typescript
export default function App() {
  return <div style={{ color: 'white', padding: 32 }}>Drawvity loading...</div>
}
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite starts on localhost:5173, page shows "Drawvity loading..."

- [ ] **Step 10: Verify test runner works**

```bash
npm test
```

Expected: "No test files found" — no error, just empty suite.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: project setup — Vitest, fonts, global reset"
```

---

## Task 2: Types & Theme

**Files:**
- Create: `src/types.ts`
- Create: `src/theme/toy.ts`

- [ ] **Step 1: Create src/types.ts**

```typescript
export type WorldId = 'lab' | 'factory' | 'castle' | 'space'
export type BallId = 'classic' | 'heavy' | 'bouncy' | 'feather' | 'magnet' | 'comet'
export type ScreenId = 'menu' | 'map' | 'level' | 'free' | 'collection'

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
  levels: number     // count = 10
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
```

- [ ] **Step 2: Create src/theme/toy.ts**

```typescript
export const toy = {
  radius: 22,
  btnRadius: 999,
  shadow: '0 1px 0 rgba(255,255,255,.6) inset, 0 8px 20px rgba(31,26,20,.14), 0 2px 4px rgba(31,26,20,.08)',
  border: '1.5px solid rgba(31,26,20,.12)',
  grain: 0,
} as const

export const palette = {
  paper:     '#FAF4E6',
  paperDeep: '#F1E8D2',
  ink:       '#1F1A14',
  inkSoft:   '#5C5240',
  primary:   '#E25C3B',
  secondary: '#E8B73E',
  tertiary:  '#2E5BB8',
  accent:    '#5BB390',
} as const

export type Palette = typeof palette
export type ToyTheme = typeof toy
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/theme/toy.ts
git commit -m "feat: types and Modern Toy design tokens"
```

---

## Task 3: Zustand Store (TDD)

**Files:**
- Create: `src/store/gameStore.ts`
- Create: `src/store/gameStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/store/gameStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

// Reset store between tests
beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState())
})

describe('recordResult', () => {
  it('saves stars for a level', () => {
    useGameStore.getState().recordResult('lab', 0, 3)
    expect(useGameStore.getState().progress.lab.stars[0]).toBe(3)
  })

  it('does not downgrade existing stars', () => {
    useGameStore.getState().recordResult('lab', 0, 3)
    useGameStore.getState().recordResult('lab', 0, 1)
    expect(useGameStore.getState().progress.lab.stars[0]).toBe(3)
  })
})

describe('totalStars', () => {
  it('counts stars across a world', () => {
    useGameStore.getState().recordResult('lab', 0, 3)
    useGameStore.getState().recordResult('lab', 1, 2)
    expect(useGameStore.getState().totalStars('lab')).toBe(5)
  })
})

describe('isWorldUnlocked', () => {
  it('lab always unlocked', () => {
    expect(useGameStore.getState().isWorldUnlocked('lab')).toBe(true)
  })

  it('factory locked when lab has < 15 stars', () => {
    expect(useGameStore.getState().isWorldUnlocked('factory')).toBe(false)
  })

  it('factory unlocked when lab has >= 15 stars', () => {
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().recordResult('lab', i, 3)
    }
    expect(useGameStore.getState().isWorldUnlocked('factory')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- gameStore
```

Expected: "Cannot find module './gameStore'"

- [ ] **Step 3: Create src/store/gameStore.ts**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorldId, BallId, ScreenId, Progress } from '../types'

const WORLD_ORDER: WorldId[] = ['lab', 'factory', 'castle', 'space']
const UNLOCK_THRESHOLD = 15

function emptyProgress(): Progress { return { stars: Array(10).fill(0) } }

interface GameState {
  screen: ScreenId
  currentWorld: WorldId
  currentLevel: number
  selectedBall: BallId
  progress: Record<WorldId, Progress>
  unlockedBalls: BallId[]
  unlockedColors: string[]

  // derived helpers (not persisted — recomputed)
  totalStars: (world: WorldId) => number
  isWorldUnlocked: (world: WorldId) => boolean

  // actions
  setScreen: (s: ScreenId) => void
  setWorld: (w: WorldId) => void
  setLevel: (n: number) => void
  selectBall: (b: BallId) => void
  recordResult: (world: WorldId, level: number, stars: number) => void

  // for test reset
  getInitialState: () => Partial<GameState>
}

const initialData = {
  screen: 'menu' as ScreenId,
  currentWorld: 'lab' as WorldId,
  currentLevel: 0,
  selectedBall: 'classic' as BallId,
  progress: {
    lab:     emptyProgress(),
    factory: emptyProgress(),
    castle:  emptyProgress(),
    space:   emptyProgress(),
  },
  unlockedBalls:  ['classic', 'heavy', 'bouncy', 'feather'] as BallId[],
  unlockedColors: ['ink', 'primary', 'secondary', 'tertiary'],
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialData,

      getInitialState: () => initialData,

      totalStars: (world) =>
        get().progress[world].stars.reduce((a, b) => a + b, 0),

      isWorldUnlocked: (world) => {
        const idx = WORLD_ORDER.indexOf(world)
        if (idx === 0) return true
        const prev = WORLD_ORDER[idx - 1]
        return get().totalStars(prev) >= UNLOCK_THRESHOLD
      },

      setScreen: (screen) => set({ screen }),
      setWorld: (currentWorld) => set({ currentWorld }),
      setLevel: (currentLevel) => set({ currentLevel }),
      selectBall: (selectedBall) => set({ selectedBall }),

      recordResult: (world, level, stars) => {
        const prev = get().progress[world].stars[level] ?? 0
        if (stars <= prev) return
        const updated = [...get().progress[world].stars]
        updated[level] = stars
        set({
          progress: {
            ...get().progress,
            [world]: { stars: updated },
          },
        })
        // unlock balls by total stars
        const total = Object.values(get().progress)
          .flatMap(p => p.stars)
          .reduce((a, b) => a + b, 0)
        const unlocked = [...get().unlockedBalls]
        if (total >= 20 && !unlocked.includes('magnet')) unlocked.push('magnet')
        if (total >= 40 && !unlocked.includes('comet')) unlocked.push('comet')
        set({ unlockedBalls: unlocked })
      },
    }),
    { name: 'drawvity-v1', partialize: (s) => ({
        progress: s.progress,
        unlockedBalls: s.unlockedBalls,
        unlockedColors: s.unlockedColors,
        selectedBall: s.selectedBall,
      })
    }
  )
)
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- gameStore
```

Expected: 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/store/ src/test-setup.ts
git commit -m "feat: Zustand game store with persist and unlock logic (TDD)"
```

---

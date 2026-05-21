# Drawvity

> Draw. Watch. Wonder.

A physics puzzle game where you sketch freehand paths, drop a ball, and guide it to the star. Available as a PWA — installable on mobile and desktop.

🎮 **Play:** [ezar.github.io/drawvity](https://ezar.github.io/drawvity)

---

## Gameplay

1. **Draw** strokes on the canvas — each line becomes a solid physics surface
2. **Tap the ball** (or press Launch) to release it
3. The ball rolls, bounces, and slides along your strokes
4. Guide it to the ⭐ star within your stroke limit

### Star ratings

| Stars | Condition |
|---|---|
| ⭐ | Ball reaches the goal |
| ⭐⭐ | Fewer strokes than the maximum |
| ⭐⭐⭐ | Reaches the goal in under 5 seconds |

---

## Worlds

| World | Theme | Gravity |
|---|---|---|
| ⚗ The Lab | Graph paper | Normal |
| ⚙ The Factory | Steel mesh | High |
| ♛ The Castle | Stone walls | Low |
| ✦ Space | Starfield | Very low |

15 levels per world — **60 total**. Obstacles include lines, circles, triangles, and moving platforms (sinusoidal motion).

---

## Balls

6 ball types with distinct physics. Unlock by earning stars.

| Ball | Physics |
|---|---|
| Classic | Balanced |
| Heavy | Dense, drops fast |
| Bouncy | High restitution |
| Feather | Light and floaty |
| Magnet *(unlock at 20★)* | High friction, sticks |
| Comet *(unlock at 40★)* | Fast, fiery trail |

---

## Features

- **60 levels** across 4 worlds — obstacles with circles, triangles, and moving platforms
- **Trajectory preview** — simulates 280 physics frames to show predicted path
- **Daily Challenge** — seeded level that changes at midnight, with streak tracking
- **Free Draw mode** — open sandbox with a preset shapes palette (shelves, ramps, bumpers, wedges, arches…)
- **Level Editor** — build custom levels, drag/reposition obstacles, place preset shapes, share via URL
- **Custom level sharing** — base64-encoded URL hash, no backend required
- **Personal bests** — tracks minimum strokes per level
- **14 achievements** — one-stroke clears, world perfection, daily streaks, ball collector, and more
- **Stats screen** — games played, perfect clears, completion rate, streak
- **6 balls + 7 ink colors** — unlockable collection
- **World-themed audio** — ambient music + world-specific bounce and win sounds (Web Audio API, no files)
- **Haptic feedback** — Vibration API on mobile
- **PWA** — installable, works offline, service worker caches all assets
- **Responsive** — portrait and landscape on mobile, tablet, and desktop

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Physics | Matter.js (headless) |
| State | Zustand with localStorage persist |
| Animations | Framer Motion |
| Audio | Web Audio API (procedural, zero audio files) |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest |
| CI/CD | GitHub Actions → GitHub Pages |

### Canvas architecture

Two stacked `<canvas>` elements share the screen:

- **Static layer** — background, obstacles, player strokes, trajectory preview. Redraws on content change only.
- **Dynamic layer** — ball, trail, goal star, moving obstacles. Redraws every animation frame via RAF.

Physics run headless in Matter.js. The canvas reads body positions each frame — no DOM, no SVG.

---

## Development

```bash
npm install
npm run dev        # localhost:5173
npm test           # Vitest (physics + store tests)
npm run build      # production build with PWA service worker
npm run lint       # ESLint
```

### Project structure

```
src/
├── types.ts                   # Level, WorldDef, BallDef, Point, Obstacle
├── theme/toy.ts               # Modern Toy design tokens + palette
├── store/gameStore.ts         # Zustand — progress, unlocks, daily, custom levels
├── data/
│   ├── worlds.ts              # 4 world definitions
│   ├── balls.ts               # 6 ball definitions
│   ├── achievements.ts        # 14 achievements
│   └── levels/                # 60 levels (15 per world, normalized 0–1 coords)
├── engine/
│   ├── physics.ts             # Matter.js world factory, polyline bodies, moving obstacles
│   ├── renderer.ts            # Canvas draw calls (bg, obstacles, ball, trail, particles)
│   └── audio.ts               # Web Audio ambient music + SFX
├── hooks/
│   ├── useIsPortrait.ts
│   └── useHaptic.ts
├── components/
│   ├── GameCanvas.tsx         # Two-canvas game loop (pointer input + physics RAF)
│   └── ShapesPalette.tsx      # Free Draw preset shapes panel
├── screens/
│   ├── MenuScreen.tsx
│   ├── WorldMapScreen.tsx
│   ├── LevelScreen.tsx
│   ├── LevelEditorScreen.tsx  # Custom level editor with drag, presets, share
│   ├── StatsScreen.tsx
│   ├── DailyScreen.tsx
│   └── overlays/              # WinOverlay · LossOverlay
├── utils/
│   ├── dailyChallenge.ts      # Seeded PRNG, daily level generation
│   └── levelShare.ts          # Base64 URL encoding for custom level sharing
└── App.tsx                    # AnimatePresence screen routing
```

### Adding a level

Edit any file in `src/data/levels/`. Coordinates are normalized 0–1 (scaled to canvas at runtime).

```ts
{
  id: 'lab-11',
  name: 'My Level',
  worldId: 'lab',
  ballSpawn: { x: 0.1, y: 0.1 },
  goal:      { x: 0.85, y: 0.78 },
  strokesMax: 3,
  obstacles: [
    // line
    { points: [{ x: 0.2, y: 0.4 }, { x: 0.7, y: 0.4 }] },
    // circle bumper
    { kind: 'circle', points: [], center: { x: 0.5, y: 0.5 }, radius: 0.08 },
    // triangle
    { kind: 'triangle', points: [{ x: 0.3, y: 0.7 }, { x: 0.5, y: 0.4 }, { x: 0.7, y: 0.7 }] },
    // moving obstacle
    { points: [{ x: 0.2, y: 0.6 }, { x: 0.4, y: 0.6 }], motion: { ax: 0.15, ay: 0, period: 2 } },
  ],
}
```

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`) — typecheck → lint → test → build on every push/PR
- **Pages** (`.github/workflows/pages.yml`) — auto-deploy to GitHub Pages on merge to `main`

---

## Design

- **Visual style** — Modern Toy: clean surfaces, soft shadows, pill shapes, rounded corners
- **Fonts** — Caprasimo (display) · Nunito (body) · JetBrains Mono (data)
- **Palette** — warm paper `#FAF4E6` · coral `#E25C3B` · mustard `#E8B73E` · cobalt `#2E5BB8`

---

## License

MIT

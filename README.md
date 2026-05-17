# Drawvity

> Draw. Watch. Wonder.

A physics puzzle game where you sketch freehand paths, drop a ball, and guide it to the star. Available as a PWA — installable on mobile and desktop.

🎮 **Play:** [ezar.github.io/drawvity](https://ezar.github.io/drawvity)

---

## Gameplay

1. **Draw** up to 3 strokes on the canvas to create a path
2. **Tap the ball** (or press Launch) to release it
3. The ball rolls, bounces, and slides along your strokes
4. Guide it to the ⭐ star to clear the level

### Difficulty

| Mode | Strokes | Trajectory preview |
|---|---|---|
| Easy | 4 | ✅ Shows predicted path |
| Medium | 3 | — |
| Hard | 2 | — |

### Worlds

| World | Theme | Gravity |
|---|---|---|
| ⚗ The Lab | Graph paper | Normal |
| ⚙ The Factory | Steel mesh | Heavy |
| ♛ The Castle | Stone walls | Light |
| ✦ Space | Starfield | Very low |

Each world has 10 levels. Unlock next world by earning 15+ stars in the previous one.

### Balls

6 ball types with different physics (density, restitution, friction). Unlock Magnet at 20 total stars and Comet at 40.

### Stroke Colors

Draw in 7 colors. Unlock new ones as you earn stars across all worlds.

---

## Features

- **Physics engine** — Matter.js with per-world gravity, real bounce/friction per ball
- **Trajectory preview** — Easy mode simulates 280 physics frames before launch
- **Tap to launch** — Tap the spawn ball to launch without reaching the bottom bar
- **Undo** — Remove last stroke without resetting the whole level
- **Share solution** — Web Share API (mobile) or PNG download on win
- **Procedural audio** — Web Audio API: draw scratch, launch whoosh, bounce, win arpeggio, loss
- **Haptic feedback** — Vibration API on mobile for taps, launch, win, loss
- **PWA** — Install as app, plays offline, service worker caches all assets
- **Responsive** — Portrait/landscape on mobile, tablet, and desktop

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Physics | Matter.js |
| State | Zustand with localStorage persist |
| Animations | Framer Motion |
| Audio | Web Audio API (procedural, no files) |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest (12 tests) |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Development

```bash
npm install
npm run dev        # localhost:5173
npm test           # Vitest
npm run build      # production build with PWA
npm run lint       # ESLint
```

### Project structure

```
src/
├── types.ts              # Level, WorldDef, BallDef, Difficulty
├── theme/toy.ts          # Modern Toy design tokens + palette
├── store/gameStore.ts    # Zustand: progress, unlocks, difficulty
├── data/                 # worlds, balls, colors, 40 levels
├── engine/
│   ├── physics.ts        # Matter.js world factory + trajectory sim
│   ├── renderer.ts       # Canvas draw primitives + particle system
│   └── audio.ts          # Procedural Web Audio sounds
├── hooks/
│   ├── useIsPortrait.ts
│   └── useHaptic.ts
├── components/
│   ├── GameCanvas.tsx    # Layered canvas: static + dynamic + physics loop
│   ├── HUD.tsx           # Top bar: level name, strokes, undo, back
│   └── BallBar.tsx       # Ball selector + ink colors + Launch
├── screens/
│   ├── MenuScreen.tsx    # Difficulty selector + navigation
│   ├── WorldMapScreen.tsx
│   ├── LevelScreen.tsx   # Assembles all game components
│   ├── CollectionScreen.tsx
│   └── overlays/         # WinOverlay (particles + share) · LossOverlay (shake)
└── App.tsx               # AnimatePresence routing
```

### Adding a level

Edit any file in `src/data/levels/`. Coordinates are normalized (0–1):

```ts
{
  id: 'lab-11',
  name: 'My Level',
  worldId: 'lab',
  ballSpawn: { x: 0.1, y: 0.1 },  // top-left
  goal:      { x: 0.85, y: 0.78 }, // bottom-right
  strokesMax: 3,
  obstacles: [
    { points: [{ x: 0.2, y: 0.4 }, { x: 0.7, y: 0.4 }] },
  ],
}
```

---

## CI/CD

- **CI** (`.github/workflows/ci.yml`): typecheck → lint → test → build on every push/PR
- **Pages** (`.github/workflows/pages.yml`): auto-deploy to GitHub Pages on merge to `main`
- **Version**: injected at build time as `yy.mm.dd.hhmm`, shown in menu footer

---

## Design

- **Visual style**: Modern Toy — clean surfaces, soft shadows, pill shapes
- **Fonts**: Caprasimo (display) · Nunito (body) · JetBrains Mono (data)
- **Palette**: warm paper `#FAF4E6`, coral `#E25C3B`, mustard `#E8B73E`, cobalt `#2E5BB8`
- **Design docs**: `docs/superpowers/specs/2026-05-17-drawvity-design.md`

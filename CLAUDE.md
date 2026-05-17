# Drawvity

Physics puzzle game. Player draws freehand strokes on canvas, launches a ball that rolls/bounces along strokes to reach a star goal. 40 levels across 4 worlds.

## Stack
React 19 + TypeScript + Vite + Matter.js + Zustand (persist) + Framer Motion + Vitest + vite-plugin-pwa

## Key decisions
- **Visual style**: Modern Toy (clean surfaces, soft shadows, rounded corners)
- **Physics**: Matter.js headless — canvas handles all rendering
- **Canvas**: Two stacked layers — static (BG + obstacles + strokes) + dynamic (ball + trail + goal)
- **Levels**: Normalized 0–1 coordinates, pre-placed static obstacles in `src/data/levels/`
- **State**: Zustand with localStorage persist key `drawvity-v1`
- **Naming**: English only. No `any`. PascalCase components, `use` prefix hooks.

## Structure
```
src/
├── types.ts              # Level, WorldDef, BallDef, Point, etc.
├── theme/toy.ts          # Design tokens + palette
├── store/gameStore.ts    # Zustand store (screen, progress, unlocks)
├── data/                 # worlds.ts, balls.ts, levels/index.ts + 4 world files
├── engine/               # physics.ts (Matter.js), renderer.ts (canvas draws)
├── hooks/useIsPortrait.ts
├── components/           # GameCanvas, HUD, BallBar, StrokeCounter
├── screens/              # MenuScreen, WorldMapScreen, LevelScreen, CollectionScreen
│   └── overlays/         # WinOverlay, LossOverlay
└── App.tsx               # AnimatePresence screen routing
```

## Commands
- `npm run dev` — start dev server (localhost:5173)
- `npm test` — Vitest (12 tests: store + physics)
- `npm run build` — production build with PWA service worker
- `npm run lint` — ESLint

## Game round flow
1. Player draws strokes → points captured via pointer events → static canvas redraws
2. Player taps Launch → `createPhysicsWorld()` builds Matter.js engine
3. RAF loop: `stepEngine()` → read ball position → dynamic canvas redraws
4. Win: ball within 24px of goal → `recordResult()` → WinOverlay
5. Loss: ball off-screen or 720 frames → LossOverlay (or silent retry in free draw)

## Docs
- Design spec: `docs/superpowers/specs/2026-05-17-drawvity-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-17-drawvity-impl.md`
- Design prototype (reference): `docs/design-extracted/`

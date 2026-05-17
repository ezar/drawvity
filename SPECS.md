# SPECS — Draw & Play
> A 2D physics game where the player draws freely on screen and the physics engine turns those strokes into real solid geometry. The goal is to guide a ball to a star using only what you draw.

---

## Tech stack

- React 18 + TypeScript + Vite
- Matter.js 0.19 (physics engine)
- Zustand (global state: progress, levels, unlocks)
- Framer Motion (screen transitions, celebrations)
- Native Canvas API (two layers: drawing + physics, same as PoC)
- GitHub Pages (deployment)
- No backend. All state persists in localStorage.

### PoC reference
The file `draw-and-play-poc.html` contains the working core:
- Dual canvas system (draw + physics)
- `strokeToBodies()`: converts strokes into Matter.js rectangle segments
- Inline poly-decomp for Matter.js
- 4 ball types with distinct physics properties
- Draw / play modes

The PoC is the foundation. Do not rewrite what already works — port it to React and build on top.

---

## Core concept: why it's addictive

The addiction loop has three parts:

1. **Physics surprise**: you never know exactly how the ball will fall. That triggers "one more try".
2. **Visible progression**: each level unlocks something new. The player sees their collection grow.
3. **Constrained challenge**: you cannot draw infinitely — each level has a stroke limit. The restriction forces creativity.

---

## Game modes

### Challenge mode (main mode, the addictive one)
The player sees the screen with:
- A **ball** at a fixed starting position (top-left area)
- A **goal** (blinking star) at a fixed target position (bottom-right, or as defined by the level)
- A **stroke counter** showing available strokes (e.g. "3 strokes left")
- **Static obstacles** pre-drawn by the level (walls, platforms, spikes)

The player draws freely until strokes are exhausted, then taps "Launch!" and watches.

**Win condition**: the ball touches the star.  
**Fail condition**: the ball falls off the bottom without reaching the star.  
**No time limit**: the player can think as long as they want before launching.

#### Star rating per level (1–3)
- ⭐ — Ball reaches the goal (minimum to pass)
- ⭐⭐ — Reaches the goal using fewer strokes than the maximum allowed
- ⭐⭐⭐ — Reaches the goal in under 5 seconds from launch (elegant solution)

Saved in localStorage per level. The player can retry any level to improve their rating.

### Sandbox mode (free play, no objective)
Same as the current PoC. No limits, no goal, no stars. The child plays, experiments, and stops when they want. Always accessible from the main menu.

---

## Level progression

### World 1 — The Lab (levels 1–8)
Introduction. No obstacles. Just ramps and gravity.
- L1: 1 stroke allowed. Goal in bottom-right corner. Tutorial visible.
- L2: 2 strokes. Goal farther away.
- L3: 3 strokes. First static wall in the middle.
- L4–L8: Combinations of ramps and walls. Player learns to make bowls and zigzags.

### World 2 — The Factory (levels 9–18)
Dynamic obstacles appear: platforms moving horizontally (Matter.js bodies with fixed velocity bouncing off walls).
- The player must time their drawing around the obstacle movement.

### World 3 — The Castle (levels 19–28)
**Spikes** appear (static triangles that destroy the ball on contact). The player's strokes can also be used as shields.
- Introduces the heavy ball type (the only one that survives certain impacts).

### World 4 — Space (levels 29–40)
Reduced gravity (0.3 instead of 1.5). Physics changes completely. Strokes need to be longer to have effect. Dark background with stars.

Each world unlocks when the player earns at least ⭐ on every level of the previous world.

---

## Unlock system (the carrot)

Unlocks are what make the player want to reach the next milestone. Everything unlocks by accumulating stars.

### Ball types (unlocked progressively)
| Ball | Unlocks at | Special property |
|------|------------|-----------------|
| Normal (yellow) | From the start | Balanced |
| Heavy (grey) | 5 stars | Crushes small obstacles |
| Bouncy (green) | 15 stars | Restitution 0.9 |
| Small (pink) | 25 stars | Fits through narrow gaps |
| Giant (orange) | 40 stars | Double radius, sweeps everything |
| Ghost (translucent blue) | 60 stars | Passes through the player's own strokes |

### Stroke colors (cosmetic, unlocked by world)
- World 1: blue, orange, green, purple, black (same as PoC)
- World 2: gold, fire red, turquoise
- World 3: silver, rainbow gradient (special stroke)
- World 4: neon purple, neon green

### Backgrounds
Each world unlocks a new background for Sandbox mode.

---

## Screen structure

```
App
├── MainMenu
│   ├── BtnChallengeMode  →  WorldMap
│   ├── BtnSandbox        →  Sandbox
│   └── BtnCollection     →  Collection
├── WorldMap
│   └── [WorldCard]  →  LevelList  →  LevelGame
├── LevelGame
│   ├── DrawCanvas       (draw layer)
│   ├── PhysicsCanvas    (physics layer)
│   ├── StrokeHUD        (remaining stroke counter)
│   ├── BallHUD          (ball type selector)
│   ├── BtnLaunch
│   ├── BtnRetry
│   └── ResultOverlay    (win/lose + stars)
├── Sandbox              (same as PoC, no restrictions)
└── Collection           (unlocked balls and colors)
```

---

## Main React components

### `<GameCanvas />`
Manages the two stacked canvases. Props:
- `strokes`: array of strokes already drawn
- `levelBodies`: static obstacles for the level
- `onStrokeEnd(stroke)`: callback when a stroke is finished
- `mode`: `'draw' | 'play'`
- `ballType`: selected ball type
- `goalPosition`: `{ x: number; y: number }` of the star goal
- `onGoalReached()`: callback when ball-goal collision is detected
- `onBallLost()`: callback when ball falls off the bottom

Internally manages Matter.js. Does not expose the engine outward.

### `<StrokeHUD />`
Shows available strokes as circles: filled = available, empty = used.
"Pop" animation when a stroke is spent (Framer Motion).

### `<ResultOverlay />`
Appears on win or loss. Shows:
- **Win**: confetti animation + stars earned + "Next level" and "Improve" buttons
- **Loss**: sad ball animation + "Retry" button + optional hint (shown after 3 failed attempts)

### `<WorldMap />`
Grid of worlds. Each world is a card with:
- World name and icon
- Progress bar (X/8 levels completed)
- State: locked / unlocked / completed

### `<LevelCard />`
Inside each world. Shows level number and earned stars (0–3). Click → opens LevelGame.

---

## Level definition (JSON format)

Each level is a JSON object in `src/data/levels.ts`:

```typescript
interface Level {
  id: number;
  world: 1 | 2 | 3 | 4;
  name: string;                          // e.g. "The Slide", "The Trap"
  maxStrokes: number;                    // Maximum strokes allowed
  ballStart: { x: number; y: number };   // Ball start position (fraction of canvas: 0–1)
  goalPosition: { x: number; y: number }; // Goal position (fraction of canvas: 0–1)
  gravity?: number;                      // Default 1.5. World 4 uses 0.3
  obstacles: Obstacle[];                 // Pre-drawn level obstacles
  hint?: string;                         // Hint shown after 3 failed attempts
  starConditions: {
    twoStar: number;                     // Strokes used ≤ this → 2 stars
    threeStar: number;                   // Seconds from launch ≤ this → 3 stars
  };
}

interface Obstacle {
  type: 'wall' | 'platform' | 'spike' | 'moving-platform';
  x: number; y: number;                 // Fraction of canvas (0–1)
  width: number; height: number;        // Fraction of canvas (0–1)
  angle?: number;                       // Radians
  motion?: {                            // Only for moving-platform
    axis: 'x' | 'y';
    range: number;                      // Travel distance in px
    speed: number;                      // px per frame
  };
}
```

Using fractions (0–1) for all positions ensures levels work at any screen resolution.

---

## Global state (Zustand)

```typescript
type BallType = 'normal' | 'heavy' | 'bouncy' | 'small' | 'giant' | 'ghost';

interface LevelRecord {
  stars: number;
  bestStrokes: number;
  bestTime: number;
}

interface GameStore {
  // Progress
  levelProgress: Record<number, LevelRecord>;
  totalStars: number;

  // Unlocks
  unlockedBalls: BallType[];
  unlockedColors: string[];

  // Current session
  currentLevel: number | null;
  selectedBall: BallType;
  selectedColor: string;
  strokesUsed: number;

  // Actions
  completeLevel: (levelId: number, stars: number, strokes: number, time: number) => void;
  selectBall: (ball: BallType) => void;
  selectColor: (color: string) => void;
}
```

All state is automatically persisted to localStorage via the Zustand `persist` middleware.

---

## Physics parameters per world

| World | gravity.y | Stroke friction | Stroke restitution | Notes |
|-------|-----------|-----------------|--------------------|-------|
| 1 — The Lab | 1.5 | 0.5 | 0.2 | PoC baseline |
| 2 — The Factory | 1.5 | 0.4 | 0.25 | Moving obstacles |
| 3 — The Castle | 1.8 | 0.6 | 0.15 | Higher gravity, more dramatic |
| 4 — Space | 0.3 | 0.1 | 0.5 | Strokes barely slow the ball |

---

## Visual and audio feedback

### Visual (no extra libraries beyond Framer Motion)
- Stroke finished: small animated ripple at the endpoint
- Ball launched: ball appears with a pop (scale 0→1 in 150ms)
- Goal reached: CSS particle explosion (circles dispersing outward)
- Ball lost: ball squashes against the floor before disappearing
- Goal star: CSS `pulse` animation (scale 0.9→1.1, looping)

### Audio (Web Audio API, no external files)
All sounds are generated procedurally with oscillators. Zero audio file dependencies.

| Event | Sound |
|-------|-------|
| Stroke complete | Soft click — sine oscillator, 200 Hz, 80 ms |
| Ball launched | Whoosh — frequency sweep 400→100 Hz, 200 ms |
| Ball bounce | Pop — triangle oscillator, frequency proportional to impact velocity |
| Win | 3-note ascending melody — C-E-G, 150 ms each |
| Loss | Soft descending note — 400→200 Hz, 400 ms |
| Unlock | 5-note special melody |

Reusable helper: `playTone(freq: number, type: OscillatorType, duration: number, volume: number): void`

---

## File structure

```
src/
├── components/
│   ├── GameCanvas.tsx        # Dual canvas + Matter.js
│   ├── StrokeHUD.tsx
│   ├── BallHUD.tsx
│   ├── ResultOverlay.tsx
│   ├── WorldMap.tsx
│   ├── LevelCard.tsx
│   └── Collection.tsx
├── screens/
│   ├── MainMenu.tsx
│   ├── LevelGame.tsx
│   └── Sandbox.tsx
├── store/
│   └── gameStore.ts          # Zustand store with persist middleware
├── data/
│   └── levels.ts             # JSON definitions for all 40 levels
├── physics/
│   ├── strokeToBodies.ts     # Ported from PoC
│   ├── ballConfigs.ts        # Physics properties per ball type
│   └── decomp.ts             # Inline poly-decomp for Matter.js
├── audio/
│   └── sounds.ts             # Web Audio API helpers
├── hooks/
│   ├── useDrawing.ts         # Stroke capture logic
│   └── usePhysics.ts         # Matter.js loop
└── utils/
    └── levelToPhysics.ts     # Converts level fractions (0–1) to real px
```

---

## CLAUDE.md (for Claude Code)

```markdown
# Draw & Play

A 2D physics game for kids. The player draws free strokes that become solid geometry,
guiding a ball to a star goal.

## Stack
React 18 + TypeScript + Vite + Matter.js + Zustand + Framer Motion

## Existing foundation
- Working PoC in `draw-and-play-poc.html` (plain HTML — read it before writing any code)
- Key logic already implemented: `strokeToBodies()`, dual canvas, 4 ball types

## Development rules
- Port logic from the PoC, do not rewrite it
- Levels are defined in `src/data/levels.ts` as typed JSON objects
- All level positions use fractions (0–1), never raw pixels
- All sounds are procedural via Web Audio API — no audio files
- No animation libraries other than Framer Motion
- Persistence via localStorage only, through Zustand persist middleware
- Deploy to GitHub Pages using `gh-pages`

## Naming conventions
- Components: PascalCase
- Hooks: camelCase prefixed with `use`
- Types: separate interfaces, never inline
- No `any` — strict TypeScript throughout
- All identifiers, comments, and strings in English

## Single game round flow
1. Player draws → useDrawing captures points → strokeToBodies generates Matter.js bodies
2. Player taps Launch → Matter.js simulation activates
3. GameCanvas detects ball-goal collision → calls onGoalReached()
4. ResultOverlay calculates stars → calls completeLevel() on the store
5. Store updates progress in localStorage and recalculates unlocks
```

---

## Implementation order

| Step | Deliverable | Done when |
|------|-------------|-----------|
| 1 | Vite + React + TypeScript scaffold | `npm run dev` serves a blank page |
| 2 | `GameCanvas` ported from PoC | Canvas renders, strokes work |
| 3 | `useDrawing` + `strokeToBodies` ported | Drawing produces physics bodies |
| 4 | `LevelGame` with one hardcoded test level | Ball launches and falls |
| 5 | Win / loss detection | Round ends correctly |
| 6 | `gameStore` with Zustand + persist | State survives page reload |
| 7 | World 1 levels defined in `levels.ts` | 8 playable levels |
| 8 | `WorldMap` + `MainMenu` | Navigation between screens works |
| 9 | `ResultOverlay` with stars + Framer Motion | Win/loss feels satisfying |
| 10 | Unlock system (balls and colors) | Progression hooks working |
| 11 | Procedural audio via Web Audio API | Sound on every key event |
| 12 | Worlds 2, 3, 4 levels in `levels.ts` | All 40 levels playable |
| 13 | `Collection` screen | Player can browse unlocks |
| 14 | Deploy to GitHub Pages | Live URL, shareable with kids |

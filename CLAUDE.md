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

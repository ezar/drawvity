import Matter from 'matter-js'
import type { Level, BallDef, WorldDef, Point } from '../types'

const WALL_THICKNESS = 60
const SEGMENT_HEIGHT = 10

/** Convert polyline points to Matter.js static bodies. Returns the created bodies. */
export function createPolylineBodies(
  world: Matter.World,
  points: Point[],
  options: Partial<Matter.IBodyDefinition> = {}
): Matter.Body[] {
  const bodies: Matter.Body[] = []
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1], p2 = points[i]
    const dx = p2.x - p1.x, dy = p2.y - p1.y
    const len = Math.hypot(dx, dy)
    if (len < 1) continue
    const body = Matter.Bodies.rectangle(
      (p1.x + p2.x) / 2, (p1.y + p2.y) / 2, len, SEGMENT_HEIGHT,
      { isStatic: options.isStatic ?? true, angle: Math.atan2(dy, dx), friction: options.friction ?? 0.3, restitution: options.restitution ?? 0.3 }
    )
    Matter.World.add(world, body)
    bodies.push(body)
  }
  return bodies
}

function addWalls(world: Matter.World, w: number, h: number): void {
  Matter.World.add(world, [
    Matter.Bodies.rectangle(w / 2, -WALL_THICKNESS / 2, w, WALL_THICKNESS, { isStatic: true, friction: 0.3 }),
    Matter.Bodies.rectangle(w / 2, h + WALL_THICKNESS / 2, w, WALL_THICKNESS, { isStatic: true, friction: 0.3 }),
    Matter.Bodies.rectangle(-WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h, { isStatic: true, friction: 0.3 }),
    Matter.Bodies.rectangle(w + WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h, { isStatic: true, friction: 0.3 }),
  ])
}

// ── Moving obstacle support ──────────────────────────────────────────────────
export interface MovingObstacleDef {
  bodies: Matter.Body[]
  originPositions: { x: number; y: number }[]  // per-segment center origins (px)
  pixelPoints: Point[]    // original polyline points (px) for rendering
  ax: number              // pixel amplitude x
  ay: number              // pixel amplitude y
  period: number          // seconds per cycle
}

export function stepMovingObstacles(defs: MovingObstacleDef[], frame: number): void {
  for (const def of defs) {
    const phase = (frame / 60 / def.period) * 2 * Math.PI
    const dx = def.ax * Math.sin(phase)
    const dy = def.ay * Math.sin(phase)
    for (let i = 0; i < def.bodies.length; i++) {
      Matter.Body.setPosition(def.bodies[i], {
        x: def.originPositions[i].x + dx,
        y: def.originPositions[i].y + dy,
      })
    }
  }
}

/** Compute the pixel displacement for a moving obstacle at a given time (ms). */
export function movingObstacleOffset(ax: number, ay: number, period: number, timeMs: number): { dx: number; dy: number } {
  const phase = (timeMs / 1000 / period) * 2 * Math.PI
  return { dx: ax * Math.sin(phase), dy: ay * Math.sin(phase) }
}

export interface PhysicsWorld {
  engine: Matter.Engine
  ballBody: Matter.Body
  movingObstacles: MovingObstacleDef[]
}

export function createPhysicsWorld(
  level: Level, strokes: Point[][], ball: BallDef, worldDef: WorldDef, canvasW: number, canvasH: number
): PhysicsWorld {
  const engine = Matter.Engine.create()
  engine.gravity.y = worldDef.gravity

  addWalls(engine.world, canvasW, canvasH)

  const movingObstacles: MovingObstacleDef[] = []

  for (const obs of level.obstacles) {
    const px = obs.points.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }))
    const bodies = createPolylineBodies(engine.world, px, { isStatic: true })

    if (obs.motion) {
      const ax = obs.motion.ax * canvasW
      const ay = obs.motion.ay * canvasH
      movingObstacles.push({
        bodies,
        originPositions: bodies.map(b => ({ x: b.position.x, y: b.position.y })),
        pixelPoints: px,
        ax, ay, period: obs.motion.period,
      })
    }
  }

  for (const stroke of strokes) {
    createPolylineBodies(engine.world, stroke, { isStatic: true })
  }

  const ballRadius = 12
  const ballBody = Matter.Bodies.circle(
    level.ballSpawn.x * canvasW, level.ballSpawn.y * canvasH, ballRadius,
    { density: ball.density, restitution: ball.restitution, friction: ball.friction, frictionAir: 0.005, label: 'ball' }
  )
  Matter.Body.setVelocity(ballBody, { x: 1.5, y: 0 })
  Matter.World.add(engine.world, ballBody)

  return { engine, ballBody, movingObstacles }
}

export function stepEngine(engine: Matter.Engine): void {
  Matter.Engine.update(engine, 1000 / 60)
}

export function destroyPhysicsWorld(engine: Matter.Engine): void {
  Matter.World.clear(engine.world, false)
  Matter.Engine.clear(engine)
}

// ── Trajectory simulation ────────────────────────────────────────────────────
export function simulateTrajectory(
  level: Level, strokes: Point[][], ball: BallDef, worldDef: WorldDef, canvasW: number, canvasH: number, steps: number
): Point[] {
  const { engine, ballBody } = createPhysicsWorld(level, strokes, ball, worldDef, canvasW, canvasH)
  const pts: Point[] = []
  for (let i = 0; i < steps; i++) {
    Matter.Engine.update(engine, 1000 / 60)
    if (i % 4 === 0) pts.push({ x: ballBody.position.x, y: ballBody.position.y })
  }
  destroyPhysicsWorld(engine)
  return pts
}

import Matter from 'matter-js'
import type { Level, BallDef, WorldDef, Point } from '../types'

const WALL_THICKNESS = 60
const SEGMENT_HEIGHT = 10  // collision width of each polyline segment

/** Convert an array of canvas-space points into static Matter rectangle bodies. */
export function createPolylineBodies(
  world: Matter.World,
  points: Point[],
  options: Partial<Matter.IBodyDefinition> = {}
): void {
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1]
    const p2 = points[i]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.hypot(dx, dy)
    if (len < 1) continue

    const angle = Math.atan2(dy, dx)
    const mx = (p1.x + p2.x) / 2
    const my = (p1.y + p2.y) / 2

    const body = Matter.Bodies.rectangle(mx, my, len, SEGMENT_HEIGHT, {
      isStatic: options.isStatic ?? true,
      angle,
      friction: options.friction ?? 0.3,
      restitution: options.restitution ?? 0.3,
    })
    Matter.World.add(world, body)
  }
}

/** Add four static wall bodies around the canvas boundary. */
function addWalls(world: Matter.World, w: number, h: number): void {
  const walls = [
    // top
    Matter.Bodies.rectangle(w / 2, -WALL_THICKNESS / 2, w, WALL_THICKNESS, { isStatic: true, friction: 0.3 }),
    // bottom
    Matter.Bodies.rectangle(w / 2, h + WALL_THICKNESS / 2, w, WALL_THICKNESS, { isStatic: true, friction: 0.3 }),
    // left
    Matter.Bodies.rectangle(-WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h, { isStatic: true, friction: 0.3 }),
    // right
    Matter.Bodies.rectangle(w + WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h, { isStatic: true, friction: 0.3 }),
  ]
  Matter.World.add(world, walls)
}

export interface PhysicsWorld {
  engine: Matter.Engine
  ballBody: Matter.Body
}

/**
 * Build a complete Matter.js physics world for a level.
 *
 * @param level      Level definition (normalized 0–1 positions)
 * @param strokes    Player-drawn strokes as canvas-px point arrays
 * @param ball       Ball definition with physics properties
 * @param worldDef   World definition providing gravity scale
 * @param canvasW    Canvas width in CSS pixels
 * @param canvasH    Canvas height in CSS pixels
 */
export function createPhysicsWorld(
  level: Level,
  strokes: Point[][],
  ball: BallDef,
  worldDef: WorldDef,
  canvasW: number,
  canvasH: number
): PhysicsWorld {
  const engine = Matter.Engine.create()
  engine.gravity.y = worldDef.gravity

  addWalls(engine.world, canvasW, canvasH)

  // Pre-placed obstacles (normalized → canvas px)
  for (const obs of level.obstacles) {
    const px = obs.points.map((p) => ({ x: p.x * canvasW, y: p.y * canvasH }))
    createPolylineBodies(engine.world, px, { isStatic: true })
  }

  // Player-drawn strokes (already in canvas px)
  for (const stroke of strokes) {
    createPolylineBodies(engine.world, stroke, { isStatic: true })
  }

  // Ball body
  const ballRadius = 12
  const ballBody = Matter.Bodies.circle(
    level.ballSpawn.x * canvasW,
    level.ballSpawn.y * canvasH,
    ballRadius,
    {
      density: ball.density,
      restitution: ball.restitution,
      friction: ball.friction,
      frictionAir: 0.005,
      label: 'ball',
    }
  )
  Matter.Body.setVelocity(ballBody, { x: 1.5, y: 0 })
  Matter.World.add(engine.world, ballBody)

  return { engine, ballBody }
}

/** Step the physics engine one frame at 60fps. */
export function stepEngine(engine: Matter.Engine): void {
  Matter.Engine.update(engine, 1000 / 60)
}

/** Clean up a physics world, removing all bodies and constraints. */
export function destroyPhysicsWorld(engine: Matter.Engine): void {
  Matter.World.clear(engine.world, false)
  Matter.Engine.clear(engine)
}

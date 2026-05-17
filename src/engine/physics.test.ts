import { describe, it, expect } from 'vitest'
import Matter from 'matter-js'
import { createPolylineBodies, createPhysicsWorld } from './physics'
import { labLevels } from '../data/levels/world-1-lab'
import { BALL_MAP } from '../data/balls'
import { WORLD_MAP } from '../data/worlds'

describe('createPolylineBodies', () => {
  it('creates N-1 bodies for N points', () => {
    const world = Matter.World.create()
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 200, y: 50 },
    ]
    createPolylineBodies(world, points, { isStatic: true })
    expect(world.bodies).toHaveLength(2)
  })

  it('skips degenerate segments (length < 1)', () => {
    const world = Matter.World.create()
    const points = [
      { x: 0, y: 0 },
      { x: 0.1, y: 0 }, // too short
      { x: 200, y: 0 },
    ]
    createPolylineBodies(world, points, { isStatic: true })
    expect(world.bodies).toHaveLength(1)
  })

  it('all bodies are static', () => {
    const world = Matter.World.create()
    const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 100 }]
    createPolylineBodies(world, points, { isStatic: true })
    for (const body of world.bodies) {
      expect(body.isStatic).toBe(true)
    }
  })
})

describe('createPhysicsWorld', () => {
  it('returns engine and ball body', () => {
    const level = labLevels[0]
    const ball = BALL_MAP['classic']
    const world = WORLD_MAP['lab']
    const result = createPhysicsWorld(level, [], ball, world, 800, 600)
    expect(result.engine).toBeDefined()
    expect(result.ballBody).toBeDefined()
    expect(result.ballBody.isStatic).toBe(false)
  })

  it('applies world gravity', () => {
    const level = labLevels[0]
    const ball = BALL_MAP['classic']
    const labWorld = WORLD_MAP['lab']
    const spaceWorld = WORLD_MAP['space']
    const lab = createPhysicsWorld(level, [], ball, labWorld, 800, 600)
    const space = createPhysicsWorld(level, [], ball, spaceWorld, 800, 600)
    expect(lab.engine.gravity.y).toBeGreaterThan(space.engine.gravity.y)
  })

  it('includes obstacle bodies', () => {
    const level = labLevels[1] // has 1 obstacle
    const ball = BALL_MAP['classic']
    const world = WORLD_MAP['lab']
    const { engine } = createPhysicsWorld(level, [], ball, world, 800, 600)
    // walls(4) + obstacle segments + ball
    expect(engine.world.bodies.length).toBeGreaterThan(5)
  })
})

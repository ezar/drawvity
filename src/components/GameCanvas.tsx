import { useRef, useEffect, useCallback } from 'react'
import type { Level, WorldDef, BallDef, Point } from '../types'
import { setupCanvas, drawWorldBg, drawObstacles, drawStrokes, drawGoalStar, drawBallAndTrail, drawBallSpawn } from '../engine/renderer'
import { createPhysicsWorld, stepEngine, destroyPhysicsWorld } from '../engine/physics'
import { playDraw, playLaunch, playBounce } from '../engine/audio'
import Matter from 'matter-js'
import type { TrailPoint } from '../engine/renderer'

const BALL_RADIUS = 12
const WIN_THRESHOLD = 24

interface Props {
  width: number
  height: number
  level: Level
  world: WorldDef
  ball: BallDef
  strokeColor: string
  launching: boolean
  onWin: (strokesUsed: number) => void
  onLoss: () => void
  strokes: Point[][]
  setStrokes: (s: Point[][]) => void
}

export function GameCanvas({
  width, height, level, world, ball,
  strokeColor, launching, onWin, onLoss,
  strokes, setStrokes,
}: Props) {
  const staticRef = useRef<HTMLCanvasElement>(null)
  const dynamicRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef<Point[] | null>(null)
  const rafRef = useRef(0)

  // ── render static layer (BG + obstacles + strokes + spawn indicator)
  const renderStatic = useCallback(() => {
    const c = staticRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    drawWorldBg(ctx, width, height, world)
    drawObstacles(ctx, level.obstacles, width, height, world.accent)
    drawStrokes(ctx, strokes, strokeColor)
    drawBallSpawn(ctx, level.ballSpawn, width, height, ball.color, launching)
  }, [width, height, world, level, strokes, strokeColor, ball.color, launching])

  // ── setup canvases ONLY on size change (avoids compounding ctx.scale)
  useEffect(() => {
    if (staticRef.current)  setupCanvas(staticRef.current,  width, height)
    if (dynamicRef.current) setupCanvas(dynamicRef.current, width, height)
  }, [width, height])

  // ── re-render static layer whenever content changes
  useEffect(() => {
    renderStatic()
  }, [renderStatic])

  // ── goal star pulse on dynamic canvas (idle)
  useEffect(() => {
    if (launching) return
    const c = dynamicRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    let stop = false
    const tick = () => {
      if (stop) return
      ctx.clearRect(0, 0, width, height)
      const pulse = Math.sin(Date.now() / 600)
      drawGoalStar(ctx, level.goal, width, height, world.accent, pulse)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { stop = true; cancelAnimationFrame(rafRef.current) }
  }, [launching, level.goal, world.accent, width, height])

  // ── physics loop on launch
  useEffect(() => {
    if (!launching) return
    const c = dynamicRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    const goalX = level.goal.x * width
    const goalY = level.goal.y * height

    playLaunch()
    const { engine, ballBody } = createPhysicsWorld(level, strokes, ball, world, width, height)
    const trail: TrailPoint[] = []
    let frames = 0
    let done = false

    // bounce sounds via collision events
    Matter.Events.on(engine, 'collisionStart', () => {
      if (done) return
      playBounce(ballBody.speed)
    })

    const tick = () => {
      if (done) return
      stepEngine(engine)
      const { x, y } = ballBody.position

      // win
      if (Math.hypot(x - goalX, y - goalY) < BALL_RADIUS + WIN_THRESHOLD) {
        done = true
        destroyPhysicsWorld(engine)
        // draw explosion on static canvas
        const sCtx = staticRef.current?.getContext('2d')
        if (sCtx) {
          sCtx.fillStyle = world.accent
          for (let k = 0; k < 24; k++) {
            const a = (k / 24) * Math.PI * 2
            const r = 28 + Math.random() * 18
            sCtx.beginPath()
            sCtx.arc(goalX + Math.cos(a) * r, goalY + Math.sin(a) * r, 5, 0, Math.PI * 2)
            sCtx.fill()
          }
        }
        setTimeout(() => onWin(strokes.length), 350)
        return
      }

      // loss — ball falls off bottom or time limit
      if (y > height + 60 || frames > 720) {
        done = true
        destroyPhysicsWorld(engine)
        setTimeout(() => onLoss(), 200)
        return
      }

      // update trail
      trail.push({ x, y })
      if (trail.length > ball.trailFrames) trail.shift()

      ctx.clearRect(0, 0, width, height)
      drawGoalStar(ctx, level.goal, width, height, world.accent, Math.sin(Date.now() / 600))
      drawBallAndTrail(ctx, x, y, BALL_RADIUS, ball.color, ball.trailColor, trail)

      frames++
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      done = true
      cancelAnimationFrame(rafRef.current)
      destroyPhysicsWorld(engine)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launching])

  // ── pointer drawing handlers
  const getPt = (e: React.PointerEvent): Point => {
    const r = staticRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (launching || strokes.length >= level.strokesMax) return
    e.preventDefault()
    drawingRef.current = [getPt(e)]
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return
    e.preventDefault()
    playDraw()
    const pt = getPt(e)
    const pts = drawingRef.current
    const last = pts[pts.length - 1]
    if (Math.hypot(pt.x - last.x, pt.y - last.y) < 2) return
    pts.push(pt)
    // live preview on static canvas
    const ctx = staticRef.current?.getContext('2d')
    if (ctx) {
      renderStatic()
      drawStrokes(ctx, [pts], strokeColor)
    }
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    const pts = drawingRef.current
    drawingRef.current = null
    if (pts.length > 1) {
      const next = [...strokes, pts]
      setStrokes(next)
    }
  }

  return (
    <div style={{ position: 'relative', width, height, flexShrink: 0 }}>
      {/* static layer: BG + obstacles + strokes */}
      <canvas
        ref={staticRef}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      />
      {/* dynamic layer: ball + trail + goal star — captures pointer events */}
      <canvas
        ref={dynamicRef}
        style={{ position: 'absolute', inset: 0, display: 'block', cursor: launching ? 'default' : 'crosshair', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </div>
  )
}

import type { WorldDef, Point, Obstacle } from '../types'

// ─── World background patterns ───────────────────────────────────────────────

export function drawWorldBg(ctx: CanvasRenderingContext2D, w: number, h: number, world: WorldDef): void {
  ctx.save()
  ctx.fillStyle = world.bg
  ctx.fillRect(0, 0, w, h)

  if (world.pattern === 'graph') {
    const s = 28
    ctx.strokeStyle = 'rgba(31,26,20,.10)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y <= h; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    ctx.strokeStyle = 'rgba(46,91,184,.16)'
    ctx.lineWidth = 1.4
    for (let x = 0; x <= w; x += s * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y <= h; y += s * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

  } else if (world.pattern === 'metal') {
    ctx.strokeStyle = 'rgba(31,26,20,.12)'
    ctx.lineWidth = 1
    const s = 22
    for (let x = -h; x < w + h; x += s) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke()
    }
    ctx.fillStyle = 'rgba(31,26,20,.25)'
    for (let x = 30; x < w; x += 110) {
      for (let y = 30; y < h; y += 110) {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
      }
    }

  } else if (world.pattern === 'stone') {
    ctx.fillStyle = 'rgba(31,22,16,.08)'
    const bw = 80, bh = 44
    for (let row = 0; row * bh < h; row++) {
      const offset = row % 2 ? bw / 2 : 0
      for (let col = -1; col * bw < w; col++) {
        ctx.fillRect(col * bw + offset + 1, row * bh + 1, bw - 3, bh - 3)
      }
    }
    const g = ctx.createRadialGradient(w * 0.85, h * 0.12, 20, w * 0.85, h * 0.12, 280)
    g.addColorStop(0, 'rgba(255,180,80,.35)')
    g.addColorStop(1, 'rgba(255,180,80,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)

  } else if (world.pattern === 'stars') {
    let s = 1234
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
    ctx.fillStyle = 'rgba(255,255,255,.85)'
    for (let i = 0; i < 140; i++) {
      const x = rnd() * w, y = rnd() * h, r = rnd() * 1.4 + 0.3
      ctx.globalAlpha = rnd() * 0.7 + 0.3
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    const ng = ctx.createRadialGradient(w * 0.2, h * 0.6, 30, w * 0.2, h * 0.6, 320)
    ng.addColorStop(0, 'rgba(123,211,240,.25)')
    ng.addColorStop(1, 'rgba(123,211,240,0)')
    ctx.fillStyle = ng; ctx.fillRect(0, 0, w, h)
  }

  ctx.restore()
}

// ─── Pre-placed obstacles ────────────────────────────────────────────────────

export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  canvasW: number,
  canvasH: number,
  accentColor: string
): void {
  if (obstacles.length === 0) return
  ctx.save()
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 10
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = 'rgba(0,0,0,.18)'
  ctx.shadowBlur = 6

  for (const obs of obstacles) {
    if (obs.points.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(obs.points[0].x * canvasW, obs.points[0].y * canvasH)
    for (let i = 1; i < obs.points.length; i++) {
      ctx.lineTo(obs.points[i].x * canvasW, obs.points[i].y * canvasH)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// ─── Player strokes ──────────────────────────────────────────────────────────

export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Point[][],
  strokeColor: string
): void {
  if (strokes.length === 0) return
  ctx.save()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.9

  for (const pts of strokes) {
    if (pts.length < 2) continue
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  }
  ctx.restore()
}

// ─── Goal star ───────────────────────────────────────────────────────────────

export function drawGoalStar(
  ctx: CanvasRenderingContext2D,
  goal: Point,
  canvasW: number,
  canvasH: number,
  accentColor: string,
  pulse: number  // 0–1 from Math.sin, used for scale animation
): void {
  const gx = goal.x * canvasW
  const gy = goal.y * canvasH
  const scale = 1 + pulse * 0.08

  ctx.save()
  ctx.translate(gx, gy)
  ctx.scale(scale, scale)

  // glow
  const grd = ctx.createRadialGradient(0, 0, 4, 0, 0, 38)
  grd.addColorStop(0, accentColor + 'cc')
  grd.addColorStop(1, accentColor + '00')
  ctx.fillStyle = grd
  ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill()

  // star shape (10-point)
  ctx.fillStyle = accentColor
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 16 : 7
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r, y = Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = 'rgba(31,26,20,.45)'
  ctx.lineWidth = 1.5; ctx.stroke()

  ctx.restore()
}

// ─── Ball + trail ────────────────────────────────────────────────────────────

export interface TrailPoint { x: number; y: number }

export function drawBallAndTrail(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  radius: number,
  color: string,
  trailColor: string,
  trail: TrailPoint[]
): void {
  ctx.save()

  // trail
  for (let i = 0; i < trail.length; i++) {
    const t = i / trail.length
    ctx.globalAlpha = t * 0.4
    ctx.fillStyle = trailColor
    ctx.beginPath()
    ctx.arc(trail[i].x, trail[i].y, radius * t, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1

  // soft shadow under ball
  ctx.shadowColor = 'rgba(31,26,20,.3)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4

  // ball fill
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(bx, by, radius, 0, Math.PI * 2); ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // outline
  ctx.strokeStyle = 'rgba(31,26,20,.5)'
  ctx.lineWidth = 1.4
  ctx.stroke()

  // highlight
  const hlGrd = ctx.createRadialGradient(
    bx - radius * 0.3, by - radius * 0.3, 0,
    bx - radius * 0.3, by - radius * 0.3, radius * 0.55
  )
  hlGrd.addColorStop(0, 'rgba(255,255,255,.55)')
  hlGrd.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = hlGrd
  ctx.beginPath(); ctx.arc(bx, by, radius, 0, Math.PI * 2); ctx.fill()

  ctx.restore()
}

// ─── HiDPI canvas setup ──────────────────────────────────────────────────────

// ─── Trajectory preview (Easy mode) ──────────────────────────────────────────

export function drawTrajectory(ctx: CanvasRenderingContext2D, path: Point[], ballColor: string): void {
  if (path.length < 2) return
  ctx.save()
  for (let i = 0; i < path.length; i++) {
    const t = 1 - i / path.length          // 1 at start → 0 at end
    const r = 2.5 * t + 0.8
    ctx.globalAlpha = t * 0.55
    ctx.fillStyle = ballColor
    ctx.beginPath()
    ctx.arc(path[i].x, path[i].y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// ─── Ball spawn indicator ────────────────────────────────────────────────────

export function drawBallSpawn(
  ctx: CanvasRenderingContext2D,
  spawn: { x: number; y: number },
  canvasW: number,
  canvasH: number,
  ballColor: string,
  launching: boolean,
  hasStrokes = false
): void {
  if (launching) return
  const sx = spawn.x * canvasW
  const sy = spawn.y * canvasH
  const r = 12

  ctx.save()

  // outer dashed ring
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = 'rgba(31,26,20,.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(sx, sy, r + 5, 0, Math.PI * 2); ctx.stroke()
  ctx.setLineDash([])

  // ball preview (semi-transparent)
  ctx.globalAlpha = 0.55
  ctx.fillStyle = ballColor
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  // highlight
  ctx.fillStyle = 'rgba(255,255,255,.4)'
  ctx.beginPath(); ctx.arc(sx - r * 0.3, sy - r * 0.3, r * 0.32, 0, Math.PI * 2); ctx.fill()

  // drop arrow or tap hint below
  ctx.fillStyle = 'rgba(31,26,20,.4)'
  ctx.font = '11px JetBrains Mono, monospace'
  ctx.textAlign = 'center'
  ctx.fillText('↓', sx, sy + r + 14)
  // tap hint only when strokes exist
  if (hasStrokes) {
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.globalAlpha = 0.35
    ctx.fillText('tap to launch', sx, sy + r + 26)
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

// ─── Win particle system ─────────────────────────────────────────────────────

interface Particle {
  x: number; y: number
  vx: number; vy: number
  r: number; alpha: number
  color: string; shape: 'circle' | 'star'
}

interface Ring { r: number; alpha: number; color: string }

export interface WinParticles {
  step: (ctx: CanvasRenderingContext2D, w: number, h: number) => boolean
}

export function createWinParticles(gx: number, gy: number, accentColor: string, ballColor: string): WinParticles {
  const colors = [accentColor, ballColor, '#E8B73E', '#ffffff', '#FAF4E6']
  const particles: Particle[] = []
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 10
    particles.push({
      x: gx, y: gy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 4,
      r: 4 + Math.random() * 7, alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.6 ? 'star' : 'circle',
    })
  }
  const rings: Ring[] = [
    { r: 12, alpha: 1,   color: accentColor },
    { r: 8,  alpha: 0.8, color: '#ffffff'   },
    { r: 4,  alpha: 0.6, color: ballColor   },
  ]
  let flashAlpha = 1

  return {
    step(ctx, canvasW, canvasH) {
      ctx.clearRect(0, 0, canvasW, canvasH)

      // flash
      if (flashAlpha > 0) {
        ctx.save(); ctx.globalAlpha = flashAlpha; ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvasW, canvasH); ctx.restore()
        flashAlpha = Math.max(0, flashAlpha - 0.12)
      }

      // rings
      for (const ring of rings) {
        if (ring.alpha <= 0) continue
        ctx.save(); ctx.globalAlpha = ring.alpha
        ctx.strokeStyle = ring.color; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(gx, gy, ring.r, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
        ring.r += 6; ring.alpha -= 0.035
      }

      // particles
      let alive = 0
      for (const p of particles) {
        if (p.alpha <= 0) continue
        alive++
        p.vy += 0.18; p.vx *= 0.97; p.vy *= 0.97
        p.x += p.vx; p.y += p.vy
        p.alpha -= 0.022; p.r *= 0.985
        ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha); ctx.fillStyle = p.color
        if (p.shape === 'star') {
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2
            const b = a + Math.PI / 5
            ctx.lineTo(Math.cos(a) * p.r + p.x, Math.sin(a) * p.r + p.y)
            ctx.lineTo(Math.cos(b) * p.r * 0.4 + p.x, Math.sin(b) * p.r * 0.4 + p.y)
          }
          ctx.closePath(); ctx.fill()
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
        }
        ctx.restore()
      }

      return alive > 0 || flashAlpha > 0 || rings.some(r => r.alpha > 0)
    }
  }
}

// ─── HiDPI canvas setup ──────────────────────────────────────────────────────

export function setupCanvas(canvas: HTMLCanvasElement, cssW: number, cssH: number): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = cssW * dpr
  canvas.height = cssH * dpr
  canvas.style.width = cssW + 'px'
  canvas.style.height = cssH + 'px'
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  return ctx
}

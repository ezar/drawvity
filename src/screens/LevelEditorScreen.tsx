import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GameCanvas } from '../components/GameCanvas'
import { useGameStore } from '../store/gameStore'
import { WORLDS, WORLD_MAP } from '../data/worlds'
import { BALL_MAP } from '../data/balls'
import { palette, toy } from '../theme/toy'
import {
  setupCanvas, drawWorldBg, drawObstacles,
  drawGoalStar, drawBallSpawn, drawStrokes,
} from '../engine/renderer'
import { playTap } from '../engine/audio'
import { hapticTap } from '../hooks/useHaptic'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { buildShareURL } from '../utils/levelShare'
import type { Point, Obstacle, WorldId, CustomLevel } from '../types'

type Tool = 'obstacle' | 'spawn' | 'goal' | 'erase' | 'shapes'

interface Props { onBack: () => void }

const TOOLBAR_H = 64
// HUD height: 56px landscape, 96px portrait (2 rows)
function hudH(portrait: boolean) { return portrait ? 96 : 56 }

// ── Preset shapes (normalized coords) ─────────────────────────────────────────
const SHAPE_PRESETS: { id: string; label: string; icon: string; obs: Obstacle }[] = [
  { id: 'shelf',    label: 'Shelf',    icon: '—',  obs: { points: [{ x: 0.12, y: 0.45 }, { x: 0.85, y: 0.45 }] } },
  { id: 'ramp-up',  label: 'Ramp ↗',  icon: '↗',  obs: { points: [{ x: 0.1, y: 0.72 }, { x: 0.82, y: 0.22 }] } },
  { id: 'ramp-dn',  label: 'Ramp ↘',  icon: '↘',  obs: { points: [{ x: 0.1, y: 0.22 }, { x: 0.82, y: 0.72 }] } },
  { id: 'valley',   label: 'Valley',   icon: 'V',  obs: { points: [{ x: 0.08, y: 0.22 }, { x: 0.45, y: 0.68 }, { x: 0.85, y: 0.22 }] } },
  { id: 'steps',    label: 'Steps',    icon: '≡',  obs: { points: [{ x: 0.08, y: 0.28 }, { x: 0.33, y: 0.28 }, { x: 0.33, y: 0.5 }, { x: 0.58, y: 0.5 }, { x: 0.58, y: 0.72 }, { x: 0.85, y: 0.72 }] } },
  { id: 'wall',     label: 'Wall',     icon: '|',  obs: { points: [{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.78 }] } },
  { id: 'corner',   label: 'Corner',   icon: '⌐',  obs: { points: [{ x: 0.15, y: 0.2 }, { x: 0.15, y: 0.78 }, { x: 0.82, y: 0.78 }] } },
  { id: 'bumper',   label: 'Bumper',   icon: '◉',  obs: { kind: 'circle', points: [], center: { x: 0.5, y: 0.42 }, radius: 0.08 } },
  { id: 'bump-sm',  label: 'Mini ◎',   icon: '◎',  obs: { kind: 'circle', points: [], center: { x: 0.5, y: 0.42 }, radius: 0.05 } },
  { id: 'wedge-l',  label: 'Wedge ◁',  icon: '◁',  obs: { kind: 'triangle', points: [{ x: 0.12, y: 0.72 }, { x: 0.5, y: 0.22 }, { x: 0.5, y: 0.72 }] } },
  { id: 'wedge-r',  label: 'Wedge ▷',  icon: '▷',  obs: { kind: 'triangle', points: [{ x: 0.5, y: 0.72 }, { x: 0.5, y: 0.22 }, { x: 0.88, y: 0.72 }] } },
  { id: 'arch',     label: 'Arch',     icon: '∩',  obs: { points: [{ x: 0.12, y: 0.78 }, { x: 0.18, y: 0.35 }, { x: 0.5, y: 0.15 }, { x: 0.82, y: 0.35 }, { x: 0.88, y: 0.78 }] } },
]

export function LevelEditorScreen({ onBack }: Props) {
  const portrait = useIsPortrait()
  const { selectedBall, saveCustomLevel, deleteCustomLevel, playCustomLevel, customLevels } = useGameStore()

  // ── editor state ───────────────────────────────────────────────────────────
  const [worldId, setWorldId]     = useState<WorldId>('lab')
  const [levelName, setLevelName] = useState('My Level')
  const [strokesMax, setStrokesMax] = useState(3)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [spawn, setSpawn]         = useState<Point>({ x: 0.1, y: 0.15 })
  const [goal,  setGoal]          = useState<Point>({ x: 0.85, y: 0.8 })
  const [tool,  setTool]          = useState<Tool>('obstacle')
  const [shapesOpen, setShapesOpen] = useState(false)

  // ── test mode state ────────────────────────────────────────────────────────
  const [testing,        setTesting]        = useState(false)
  const [testStrokes,    setTestStrokes]    = useState<Point[][]>([])
  const [testLaunching,  setTestLaunching]  = useState(false)
  const [testRetryKey,   setTestRetryKey]   = useState(0)

  // ── export / save feedback ─────────────────────────────────────────────────
  const [copied,  setCopied]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [shared,  setShared]  = useState(false)

  const world  = WORLD_MAP[worldId]
  const ball   = BALL_MAP[selectedBall]
  const isSpace = worldId === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg   = isSpace ? 'rgba(255,255,255,.10)' : palette.paper

  // ── canvas sizing ──────────────────────────────────────────────────────────
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const drawingRef  = useRef<Point[] | null>(null)

  const canvasH = () => window.innerHeight - hudH(portrait) - TOOLBAR_H
  const [size, setSize] = useState({ w: window.innerWidth, h: canvasH() })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: canvasH() })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portrait])

  // ── canvas render ──────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')!
    const { w, h } = size

    drawWorldBg(ctx, w, h, world)

    // subtle grid dots
    ctx.save()
    ctx.fillStyle = isSpace ? 'rgba(255,255,255,.05)' : 'rgba(31,26,20,.05)'
    for (let x = 0; x <= w; x += 40)
      for (let y = 0; y <= h; y += 40) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill()
      }
    ctx.restore()

    drawObstacles(ctx, obstacles, w, h, world.accent)

    // in-progress stroke
    if (drawingRef.current && drawingRef.current.length > 1)
      drawStrokes(ctx, [drawingRef.current], world.accent)

    drawBallSpawn(ctx, spawn, w, h, ball.color, false, false)
    drawGoalStar(ctx, goal, w, h, world.accent, 0)
  }, [size, world, obstacles, spawn, goal, ball.color, isSpace])

  useEffect(() => {
    if (canvasRef.current) setupCanvas(canvasRef.current, size.w, size.h)
  }, [size])

  useEffect(() => { render() }, [render])

  // ── pointer helpers ────────────────────────────────────────────────────────
  const getPt = (e: React.PointerEvent): Point => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const normPt = (pt: Point): Point => ({ x: pt.x / size.w, y: pt.y / size.h })

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const pt = getPt(e)

    if (tool === 'spawn') {
      setSpawn(normPt(pt))
    } else if (tool === 'goal') {
      setGoal(normPt(pt))
    } else if (tool === 'obstacle') {
      drawingRef.current = [pt]
    } else if (tool === 'erase') {
      // remove obstacle closest to click (within 36px); check both points and center
      let closest = -1, minD = 36
      obstacles.forEach((obs, i) => {
        const checkPt = (np: Point) => {
          const d = Math.hypot(np.x * size.w - pt.x, np.y * size.h - pt.y)
          if (d < minD) { minD = d; closest = i }
        }
        obs.points.forEach(checkPt)
        if (obs.center) checkPt(obs.center)
      })
      if (closest >= 0) setObstacles(prev => prev.filter((_, i) => i !== closest))
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || tool !== 'obstacle') return
    e.preventDefault()
    const pt = getPt(e)
    const pts = drawingRef.current
    const last = pts[pts.length - 1]
    if (Math.hypot(pt.x - last.x, pt.y - last.y) < 4) return
    pts.push(pt)
    render()
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    const pts = drawingRef.current
    drawingRef.current = null
    if (pts.length > 1)
      setObstacles(prev => [...prev, { points: pts.map(normPt) }])
  }

  // ── save to store ──────────────────────────────────────────────────────────
  const buildLevel = (id: string, ts: number): CustomLevel => ({
    id,
    name: levelName || 'Untitled',
    worldId, ballSpawn: spawn, goal, strokesMax,
    obstacles: obstacles.map(o => ({
      ...(o.kind ? { kind: o.kind } : {}),
      points: o.points.map(p => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) })),
      ...(o.center ? { center: { x: +o.center.x.toFixed(3), y: +o.center.y.toFixed(3) } } : {}),
      ...(o.radius != null ? { radius: +o.radius.toFixed(3) } : {}),
      ...(o.restitution != null ? { restitution: o.restitution } : {}),
    })),
    createdAt: ts,
  })

  const saveLevel = () => {
    const now = Date.now()
    saveCustomLevel(buildLevel(`custom-${now}`, now))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const shareLevel = async () => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const lvl = buildLevel(`custom-${now}`, now)
    saveCustomLevel(lvl)
    const url = buildShareURL(lvl)
    try {
      if (navigator.share) {
        await navigator.share({ title: lvl.name, text: 'Play my Drawvity level!', url })
      } else {
        await navigator.clipboard.writeText(url)
        setShared(true); setTimeout(() => setShared(false), 2000)
      }
    } catch { /* cancelled */ }
  }

  // ── export ─────────────────────────────────────────────────────────────────
  const exportJSON = () => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const lvl = {
      id: `custom-${now}`,
      name: levelName,
      worldId,
      ballSpawn: { x: +spawn.x.toFixed(3), y: +spawn.y.toFixed(3) },
      goal:      { x: +goal.x.toFixed(3),  y: +goal.y.toFixed(3)  },
      strokesMax,
      obstacles: obstacles.map(o => ({
        ...(o.kind ? { kind: o.kind } : {}),
        points: o.points.map(p => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) })),
        ...(o.center ? { center: { x: +o.center.x.toFixed(3), y: +o.center.y.toFixed(3) } } : {}),
        ...(o.radius != null ? { radius: +o.radius.toFixed(3) } : {}),
      })),
    }
    navigator.clipboard.writeText(JSON.stringify(lvl, null, 2))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {/* clipboard denied */})
  }

  // ── test level def ─────────────────────────────────────────────────────────
  const testLevel = { id: 'editor-test', name: levelName, worldId, ballSpawn: spawn, goal, strokesMax, obstacles }

  // ── TEST MODE ──────────────────────────────────────────────────────────────
  if (testing) {
    const testH = window.innerHeight - hudH(portrait)
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: world.bg }}>
        <div style={{
          height: hudH(portrait), display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8,
          background: 'linear-gradient(to bottom, rgba(0,0,0,.06), transparent)',
          color: textColor, flexShrink: 0,
        }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { setTesting(false); setTestStrokes([]); setTestLaunching(false) }}
            style={{ width: 34, height: 34, borderRadius: 999, border: toy.border, background: panelBg, color: textColor, cursor: 'pointer', fontSize: 15, boxShadow: toy.shadow, flexShrink: 0 }}
          >←</motion.button>
          <span style={{ fontFamily: 'Caprasimo, serif', fontSize: 16, color: textColor }}>
            Testing · {levelName}
          </span>
          <div style={{ flex: 1 }} />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { setTestStrokes([]); setTestLaunching(false); setTestRetryKey(k => k + 1) }}
            title="Retry"
            style={{ width: 34, height: 34, borderRadius: 999, border: toy.border, background: panelBg, color: textColor, cursor: 'pointer', fontSize: 14, boxShadow: toy.shadow }}
          >↻</motion.button>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <GameCanvas
            key={testRetryKey}
            width={window.innerWidth}
            height={testH}
            level={testLevel}
            world={world}
            ball={ball}
            strokeColor={palette.ink}
            launching={testLaunching}
            showTrajectory={false}
            onRequestLaunch={() => { if (testStrokes.length > 0 && !testLaunching) setTestLaunching(true) }}
            onWin={() => { setTestLaunching(false) }}
            onLoss={() => { setTestLaunching(false); setTestStrokes([]); setTestRetryKey(k => k + 1) }}
            strokes={testStrokes}
            setStrokes={setTestStrokes}
          />
          {testStrokes.length === 0 && !testLaunching && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 18, color: isSpace ? 'rgba(242,235,218,.4)' : 'rgba(31,26,20,.28)', transform: 'rotate(-1.5deg)' }}>
                ✎ Draw a path to the star
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── TOOL BUTTON helper ─────────────────────────────────────────────────────
  const toolBtn = (id: Tool, icon: string, label: string) => (
    <motion.button
      key={id}
      whileTap={{ scale: 0.88 }}
      onClick={() => { hapticTap(); playTap(); setTool(id) }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        padding: '6px 14px', borderRadius: 14,
        background: tool === id ? palette.ink : panelBg,
        color: tool === id ? '#fff' : textColor,
        border: toy.border, cursor: 'pointer', boxShadow: toy.shadow,
        fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700,
        letterSpacing: '.08em', textTransform: 'uppercase',
        transition: 'background .15s ease, color .15s ease',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </motion.button>
  )

  // ── add preset shape obstacle ──────────────────────────────────────────────
  const addPreset = (obs: Obstacle) => {
    hapticTap(); playTap()
    setObstacles(prev => [...prev, obs])
    setShapesOpen(false)
  }

  // ── EDITOR VIEW ────────────────────────────────────────────────────────────
  const iconBtn = (onClick: () => void, icon: string, title: string, active = false) => (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 999,
        border: active ? `2px solid ${palette.primary}` : toy.border,
        background: active ? `${palette.primary}18` : panelBg,
        color: active ? palette.primary : textColor,
        cursor: 'pointer', fontSize: 13, boxShadow: toy.shadow, flexShrink: 0,
        transition: 'border .15s, color .15s, background .15s',
      }}
    >{icon}</motion.button>
  )

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: world.bg }}>

      {/* ── HUD — 1 row landscape / 2 rows portrait ── */}
      <div style={{
        height: hudH(portrait), display: 'flex', flexDirection: 'column',
        flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(to bottom, rgba(0,0,0,.06), transparent)',
        color: textColor,
      }}>

        {/* Row 1: back · name · [landscape extras] · Test · Save */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: portrait ? '6px 10px 3px' : '0 10px',
          flex: portrait ? '0 0 auto' : 1,
        }}>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => { hapticTap(); playTap(); onBack() }}
            style={{ width: 34, height: 34, borderRadius: 999, border: toy.border, background: panelBg, color: textColor, cursor: 'pointer', fontSize: 15, boxShadow: toy.shadow, flexShrink: 0 }}
          >←</motion.button>

          <input
            value={levelName}
            onChange={e => setLevelName(e.target.value)}
            placeholder="Level name"
            style={{
              flex: '1 1 50px', minWidth: 40,
              fontFamily: 'Caprasimo, serif', fontSize: 14,
              background: 'transparent', border: 'none', outline: 'none', color: textColor,
              borderBottom: `1.5px solid ${isSpace ? 'rgba(242,235,218,.25)' : 'rgba(31,26,20,.2)'}`,
              padding: '2px 4px',
            }}
          />

          {/* landscape: world picker + strokes + clear + share + json */}
          {!portrait && (<>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {WORLDS.map(w => (
                <motion.button key={w.id} whileTap={{ scale: 0.88 }}
                  onClick={() => { hapticTap(); playTap(); setWorldId(w.id) }} title={w.name}
                  style={{ width: 26, height: 26, borderRadius: 999, border: toy.border, background: worldId === w.id ? world.accent : panelBg, cursor: 'pointer', boxShadow: toy.shadow, fontSize: 11, transition: 'background .15s ease', flexShrink: 0 }}
                >{w.glyph}</motion.button>
              ))}
            </div>
            <select value={strokesMax} onChange={e => setStrokesMax(Number(e.target.value))}
              style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, background: panelBg, color: textColor, border: toy.border, borderRadius: 8, padding: '4px 5px', cursor: 'pointer', boxShadow: toy.shadow, flexShrink: 0 }}
            >{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} stroke{n>1?'s':''}</option>)}</select>
            <div style={{ flex: 1 }} />
            {iconBtn(() => { hapticTap(); setObstacles([]) }, '🧹', 'Clear obstacles')}
            {iconBtn(shareLevel, shared ? '✓' : '🔗', shared ? 'Copied!' : 'Share link', shared)}
            {iconBtn(exportJSON, copied ? '✓' : '{ }', copied ? 'Copied!' : 'Copy JSON', copied)}
          </>)}

          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { hapticTap(); playTap(); setTesting(true) }}
            style={{ height: 34, padding: '0 12px', borderRadius: 999, border: 'none', background: palette.primary, color: '#fff', fontFamily: 'Caprasimo, serif', fontSize: 13, cursor: 'pointer', boxShadow: toy.shadow, flexShrink: 0 }}
          >▶ Test</motion.button>

          <motion.button whileTap={{ scale: 0.9 }} onClick={saveLevel}
            style={{ height: 34, padding: '0 10px', borderRadius: 999, border: 'none', background: saved ? '#22c55e' : palette.secondary, color: '#fff', fontFamily: 'Caprasimo, serif', fontSize: 13, cursor: 'pointer', boxShadow: toy.shadow, transition: 'background .2s ease', flexShrink: 0 }}
          >{saved ? '✓' : '💾'}</motion.button>
        </div>

        {/* Row 2 (portrait only): world picker · strokes · clear · share · json */}
        {portrait && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px 5px' }}>
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {WORLDS.map(w => (
                <motion.button key={w.id} whileTap={{ scale: 0.88 }}
                  onClick={() => { hapticTap(); playTap(); setWorldId(w.id) }} title={w.name}
                  style={{ width: 26, height: 26, borderRadius: 999, border: toy.border, background: worldId === w.id ? world.accent : panelBg, cursor: 'pointer', boxShadow: toy.shadow, fontSize: 11, transition: 'background .15s ease', flexShrink: 0 }}
                >{w.glyph}</motion.button>
              ))}
            </div>
            <select value={strokesMax} onChange={e => setStrokesMax(Number(e.target.value))}
              style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, background: panelBg, color: textColor, border: toy.border, borderRadius: 8, padding: '3px 5px', cursor: 'pointer', boxShadow: toy.shadow, flexShrink: 0 }}
            >{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}✏</option>)}</select>
            <div style={{ flex: 1 }} />
            {iconBtn(() => { hapticTap(); setObstacles([]) }, '🧹', 'Clear')}
            {iconBtn(shareLevel, shared ? '✓' : '🔗', shared ? 'Copied!' : 'Share', shared)}
            {iconBtn(exportJSON, copied ? '✓' : '{}', copied ? 'Copied!' : 'Copy JSON', copied)}
          </div>
        )}
      </div>

      {/* ── Canvas area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0, display: 'block', touchAction: 'none',
            cursor: tool === 'erase' ? 'cell' : 'crosshair',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {/* tool hint */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '.1em',
            color: textColor, opacity: .35, whiteSpace: 'nowrap',
            background: isSpace ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.5)',
            padding: '4px 10px', borderRadius: 999,
          }}>
            {tool === 'obstacle' && '✏ Draw obstacle lines'}
            {tool === 'spawn'    && '🎱 Tap to place ball spawn'}
            {tool === 'goal'     && '⭐ Tap to place goal star'}
            {tool === 'erase'    && '🗑 Tap an obstacle to erase'}
            {tool === 'shapes'   && '⬡ Pick a preset shape below'}
          </div>
        </div>

        {/* shapes preset panel — slides up from bottom of canvas */}
        {shapesOpen && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: isSpace ? 'rgba(20,16,40,.92)' : 'rgba(255,255,255,.95)',
            borderTop: toy.border,
            padding: '10px 12px 12px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: textColor, opacity: .5 }}>
              Preset shapes — tap to add
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {SHAPE_PRESETS.map(s => (
                <motion.button key={s.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => addPreset(s.obs)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '7px 10px', borderRadius: 12, border: toy.border,
                    background: panelBg, cursor: 'pointer', boxShadow: toy.shadow,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: textColor, opacity: .6, whiteSpace: 'nowrap' }}>{s.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={{
        height: TOOLBAR_H, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 6, padding: '0 12px', flexShrink: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      }}>
        {toolBtn('obstacle', '✏️', 'Draw')}
        {toolBtn('spawn',    '🎱', 'Spawn')}
        {toolBtn('goal',     '⭐', 'Goal')}
        {toolBtn('erase',    '🗑️', 'Erase')}

        {/* Shapes toggle */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => { hapticTap(); playTap(); setShapesOpen(o => !o); setTool('shapes') }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '6px 12px', borderRadius: 14,
            background: shapesOpen ? palette.ink : panelBg,
            color: shapesOpen ? '#fff' : textColor,
            border: toy.border, cursor: 'pointer', boxShadow: toy.shadow,
            fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700,
            letterSpacing: '.08em', textTransform: 'uppercase',
            transition: 'background .15s ease, color .15s ease',
          }}
        >
          <span style={{ fontSize: 18 }}>⬡</span>
          <span>Shapes</span>
        </motion.button>
      </div>

      {/* ── Saved levels ── */}
      {customLevels.length > 0 && (
        <div style={{
          flexShrink: 0, padding: '8px 12px 12px',
          borderTop: `1px solid ${isSpace ? 'rgba(255,255,255,.1)' : 'rgba(31,26,20,.1)'}`,
          maxHeight: 120, overflowY: 'auto',
        }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: textColor, opacity: .45, marginBottom: 6 }}>
            Saved levels
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {customLevels.map(lvl => (
              <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: panelBg, border: toy.border, borderRadius: 999, padding: '4px 10px 4px 8px', boxShadow: toy.shadow }}>
                <span style={{ fontSize: 12 }}>{WORLD_MAP[lvl.worldId]?.glyph ?? '🌍'}</span>
                <span style={{ fontFamily: 'Nunito', fontSize: 12, color: textColor, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lvl.name}</span>
                <motion.button whileTap={{ scale: 0.88 }}
                  onClick={() => { hapticTap(); playCustomLevel(lvl.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, color: palette.primary }}
                >▶</motion.button>
                <motion.button whileTap={{ scale: 0.88 }}
                  onClick={() => { hapticTap(); deleteCustomLevel(lvl.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: 0, color: textColor, opacity: .4 }}
                >✕</motion.button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

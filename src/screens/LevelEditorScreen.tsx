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
import type { Point, Obstacle, WorldId, CustomLevel } from '../types'

type Tool = 'obstacle' | 'spawn' | 'goal' | 'erase'

interface Props { onBack: () => void }

const HUD_H     = 56
const TOOLBAR_H = 64

export function LevelEditorScreen({ onBack }: Props) {
  const { selectedBall, saveCustomLevel, deleteCustomLevel, playCustomLevel, customLevels } = useGameStore()

  // ── editor state ───────────────────────────────────────────────────────────
  const [worldId, setWorldId]     = useState<WorldId>('lab')
  const [levelName, setLevelName] = useState('My Level')
  const [strokesMax, setStrokesMax] = useState(3)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [spawn, setSpawn]         = useState<Point>({ x: 0.1, y: 0.15 })
  const [goal,  setGoal]          = useState<Point>({ x: 0.85, y: 0.8 })
  const [tool,  setTool]          = useState<Tool>('obstacle')

  // ── test mode state ────────────────────────────────────────────────────────
  const [testing,        setTesting]        = useState(false)
  const [testStrokes,    setTestStrokes]    = useState<Point[][]>([])
  const [testLaunching,  setTestLaunching]  = useState(false)
  const [testRetryKey,   setTestRetryKey]   = useState(0)

  // ── export / save feedback ─────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const world  = WORLD_MAP[worldId]
  const ball   = BALL_MAP[selectedBall]
  const isSpace = worldId === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg   = isSpace ? 'rgba(255,255,255,.10)' : palette.paper

  // ── canvas sizing ──────────────────────────────────────────────────────────
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const drawingRef  = useRef<Point[] | null>(null)

  const canvasH = () => window.innerHeight - HUD_H - TOOLBAR_H
  const [size, setSize] = useState({ w: window.innerWidth, h: canvasH() })
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: canvasH() })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
      // remove obstacle closest to click (within 24px)
      let closest = -1, minD = 24
      obstacles.forEach((obs, i) =>
        obs.points.forEach(np => {
          const d = Math.hypot(np.x * size.w - pt.x, np.y * size.h - pt.y)
          if (d < minD) { minD = d; closest = i }
        })
      )
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
  const buildLevel = (): CustomLevel => ({
    id: `custom-${Date.now()}`,
    name: levelName || 'Untitled',
    worldId, ballSpawn: spawn, goal, strokesMax,
    obstacles: obstacles.map(o => ({
      points: o.points.map(p => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) })),
    })),
    createdAt: Date.now(),
  })

  const saveLevel = () => {
    saveCustomLevel(buildLevel())
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  // ── export ─────────────────────────────────────────────────────────────────
  const exportJSON = () => {
    const lvl = {
      id: `custom-${Date.now()}`,
      name: levelName,
      worldId,
      ballSpawn: { x: +spawn.x.toFixed(3), y: +spawn.y.toFixed(3) },
      goal:      { x: +goal.x.toFixed(3),  y: +goal.y.toFixed(3)  },
      strokesMax,
      obstacles: obstacles.map(o => ({
        points: o.points.map(p => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) })),
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
    const testH = window.innerHeight - HUD_H
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: world.bg }}>
        <div style={{
          height: HUD_H, display: 'flex', alignItems: 'center',
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

  // ── EDITOR VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: world.bg }}>

      {/* HUD */}
      <div style={{
        height: HUD_H, display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 6, flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(to bottom, rgba(0,0,0,.06), transparent)',
        color: textColor,
      }}>
        {/* Back */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => { hapticTap(); playTap(); onBack() }}
          style={{ width: 34, height: 34, borderRadius: 999, border: toy.border, background: panelBg, color: textColor, cursor: 'pointer', fontSize: 15, boxShadow: toy.shadow, flexShrink: 0 }}
        >←</motion.button>

        {/* Level name */}
        <input
          value={levelName}
          onChange={e => setLevelName(e.target.value)}
          placeholder="Level name"
          style={{
            flex: '1 1 80px', minWidth: 60, maxWidth: 160,
            fontFamily: 'Caprasimo, serif', fontSize: 15,
            background: 'transparent', border: 'none', outline: 'none',
            color: textColor,
            borderBottom: `1.5px solid ${isSpace ? 'rgba(242,235,218,.25)' : 'rgba(31,26,20,.2)'}`,
            padding: '2px 4px',
          }}
        />

        {/* World selector */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {WORLDS.map(w => (
            <motion.button
              key={w.id}
              whileTap={{ scale: 0.88 }}
              onClick={() => { hapticTap(); playTap(); setWorldId(w.id) }}
              title={w.name}
              style={{
                width: 30, height: 30, borderRadius: 999, border: toy.border,
                background: worldId === w.id ? world.accent : panelBg,
                cursor: 'pointer', boxShadow: toy.shadow, fontSize: 13,
                transition: 'background .15s ease',
              }}
            >
              {w.glyph}
            </motion.button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Strokes */}
        <select
          value={strokesMax}
          onChange={e => setStrokesMax(Number(e.target.value))}
          style={{
            fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700,
            background: panelBg, color: textColor, border: toy.border,
            borderRadius: 8, padding: '4px 6px', cursor: 'pointer',
            boxShadow: toy.shadow, flexShrink: 0,
          }}
        >
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} stroke{n > 1 ? 's' : ''}</option>)}
        </select>

        {/* Clear obstacles */}
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => { hapticTap(); setObstacles([]) }}
          title="Clear all obstacles"
          style={{ width: 34, height: 34, borderRadius: 999, border: toy.border, background: panelBg, color: textColor, cursor: 'pointer', fontSize: 14, boxShadow: toy.shadow, flexShrink: 0 }}
        >🧹</motion.button>

        {/* Test */}
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => { hapticTap(); playTap(); setTesting(true) }}
          style={{
            height: 34, padding: '0 14px', borderRadius: 999, border: 'none',
            background: palette.primary, color: '#fff',
            fontFamily: 'Caprasimo, serif', fontSize: 14, cursor: 'pointer',
            boxShadow: toy.shadow, flexShrink: 0,
          }}
        >▶ Test</motion.button>

        {/* Save to game */}
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={saveLevel}
          style={{
            height: 34, padding: '0 14px', borderRadius: 999, border: 'none',
            background: saved ? '#22c55e' : palette.secondary,
            color: '#fff', fontFamily: 'Caprasimo, serif', fontSize: 14,
            cursor: 'pointer', boxShadow: toy.shadow,
            transition: 'background .2s ease', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >{saved ? '✓ Saved!' : '💾 Save'}</motion.button>

        {/* Copy JSON */}
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={exportJSON}
          style={{
            height: 34, padding: '0 12px', borderRadius: 999,
            border: toy.border,
            background: copied ? '#22c55e' : panelBg,
            color: copied ? '#fff' : textColor,
            fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700,
            letterSpacing: '.08em', cursor: 'pointer', boxShadow: toy.shadow,
            transition: 'background .2s ease', whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >{copied ? '✓ Copied!' : '{ } JSON'}</motion.button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0, display: 'block', touchAction: 'none',
            cursor: tool === 'obstacle' ? 'crosshair'
              : tool === 'erase' ? 'cell'
              : 'crosshair',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {/* tool hint overlay */}
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}>
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
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        height: TOOLBAR_H, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8, padding: '0 16px', flexShrink: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      }}>
        {toolBtn('obstacle', '✏️', 'Draw')}
        {toolBtn('spawn',    '🎱', 'Spawn')}
        {toolBtn('goal',     '⭐', 'Goal')}
        {toolBtn('erase',    '🗑️', 'Erase')}
      </div>

      {/* Saved levels panel */}
      {customLevels.length > 0 && (
        <div style={{
          flexShrink: 0, padding: '8px 12px 12px',
          borderTop: `1px solid ${isSpace ? 'rgba(255,255,255,.1)' : 'rgba(31,26,20,.1)'}`,
          maxHeight: 140, overflowY: 'auto',
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

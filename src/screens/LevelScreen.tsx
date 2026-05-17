import { useState, useCallback, useEffect } from 'react'
import { GameCanvas } from '../components/GameCanvas'
import { HUD } from '../components/HUD'
import { BallBar } from '../components/BallBar'
import { WinOverlay } from './overlays/WinOverlay'
import { LossOverlay } from './overlays/LossOverlay'
import { useGameStore } from '../store/gameStore'
import { WORLD_MAP } from '../data/worlds'
import { BALL_MAP } from '../data/balls'
import { getLevel } from '../data/levels'
import { palette } from '../theme/toy'
import { STROKE_COLORS } from '../data/colors'
import { DIFFICULTY_STROKES } from '../types'
import type { Point, Level } from '../types'

interface Props {
  onBack: () => void
  onNextLevel: () => void
  freeDraw?: boolean
  customLevel?: Level    // when set, overrides world/level from store
}

export function LevelScreen({ onBack, onNextLevel, freeDraw = false, customLevel }: Props) {
  const { currentWorld, currentLevel, selectedBall, selectBall, selectedColorId, difficulty, recordResult } = useGameStore()
  const strokeColor = STROKE_COLORS.find(c => c.id === selectedColorId)?.hex ?? palette.ink
  const strokesMax = customLevel ? customLevel.strokesMax : (freeDraw ? Infinity : DIFFICULTY_STROKES[difficulty])
  const showTrajectory = difficulty === 'easy' && !freeDraw && !customLevel
  const world = WORLD_MAP[customLevel?.worldId ?? currentWorld]
  const ball = BALL_MAP[selectedBall]
  const baseLevel = customLevel
    ? customLevel
    : freeDraw
      ? { id: 'free', name: 'Free Draw', worldId: currentWorld, ballSpawn: { x: 0.1, y: 0.1 }, goal: { x: -1, y: -1 }, strokesMax: Infinity, obstacles: [] }
      : getLevel(currentWorld, currentLevel)
  const level = { ...baseLevel, strokesMax }

  const [strokes, setStrokes] = useState<Point[][]>([])
  const [launching, setLaunching] = useState(false)
  const [overlay, setOverlay] = useState<'win' | 'loss' | null>(null)
  const [strokesUsedOnWin, setStrokesUsedOnWin] = useState(0)
  const [retryKey, setRetryKey] = useState(0)  // force GameCanvas remount on retry

  // Viewport-aware canvas size — updates on resize
  // Portrait: BallBar has 2 rows (~138px); Landscape: 1 row (~88px)
  const hudTop = 56
  const getHudBottom = () => 68   // single-row pill (46px) + padding (22px)
  const [size, setSize] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight - hudTop - getHudBottom(),
  }))

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight - hudTop - getHudBottom() })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        e.preventDefault()
        if (strokes.length > 0 && !launching && overlay === null) setLaunching(true)
      } else if ((e.code === 'KeyZ') && !e.repeat) {
        if (strokes.length > 0 && !launching) setStrokes(strokes.slice(0, -1))
      } else if (e.code === 'Escape') {
        if (overlay) { setOverlay(null) } else { onBack() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [strokes, launching, overlay, onBack])

  const handleWin = useCallback((strokesUsed: number) => {
    if (!freeDraw) {
      const stars = strokesUsed === 1 ? 3 : strokesUsed === 2 ? 2 : 1
      recordResult(currentWorld, currentLevel, stars)
    }
    setStrokesUsedOnWin(strokesUsed)
    setLaunching(false)
    setOverlay('win')
  }, [freeDraw, currentWorld, currentLevel, recordResult])

  const handleShare = async () => {
    // grab static canvas (has BG + obstacles + strokes)
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    try {
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(), 'image/png')
      )
      const file = new File([blob], 'drawvity-solution.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Drawvity', text: 'Check my solution! 🎯' })
      } else {
        // fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'drawvity-solution.png'; a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* user cancelled or not supported */ }
  }

  const handleLoss = useCallback(() => {
    setLaunching(false)
    if (freeDraw) {
      // free draw: silently reset so player can try again without modal
      setStrokes([])
      setRetryKey((k) => k + 1)
    } else {
      setOverlay('loss')
    }
  }, [freeDraw])

  const retry = () => {
    setRetryKey((k) => k + 1)
    setStrokes([])
    setLaunching(false)
    setOverlay(null)
  }

  const undo = () => {
    if (strokes.length === 0 || launching) return
    setStrokes(strokes.slice(0, -1))
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      background: world.bg,
    }}>
      <HUD
        world={world}
        levelName={level.name}
        levelIndex={currentLevel}
        strokesMax={level.strokesMax}
        strokesUsed={strokes.length}
        onBack={onBack}
        onRetry={retry}
        onUndo={undo}
      />

      {/* canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GameCanvas
          key={retryKey}
          width={size.w}
          height={size.h}
          level={level}
          world={world}
          ball={ball}
          strokeColor={strokeColor}
          launching={launching}
          showTrajectory={showTrajectory}
          onRequestLaunch={() => { if (!launching && strokes.length > 0) setLaunching(true) }}
          onWin={handleWin}
          onLoss={handleLoss}
          strokes={strokes}
          setStrokes={setStrokes}
        />

        {/* tutorial hint */}
        {strokes.length === 0 && !launching && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontFamily: 'Caprasimo, serif', fontSize: 20,
              color: world.id === 'space' ? 'rgba(242,235,218,.45)' : 'rgba(31,26,20,.3)',
              transform: 'rotate(-1.5deg)', userSelect: 'none',
            }}>
              {freeDraw ? '✎ Draw anything · then launch' : '✎ Draw a path to the star'}
            </div>
          </div>
        )}

        {/* overlays */}
        {overlay === 'win' && (
          <WinOverlay
            strokesUsed={strokesUsedOnWin}
            strokesMax={level.strokesMax}
            onImprove={retry}
            onNext={() => { setOverlay(null); onNextLevel() }}
            onShare={handleShare}
          />
        )}
        {overlay === 'loss' && (
          <LossOverlay onRetry={retry} onMap={onBack} />
        )}
      </div>

      <BallBar
        selectedBall={selectedBall}
        onSelectBall={selectBall}
        world={world}
        canLaunch={strokes.length > 0 && !launching && overlay === null}
        launching={launching}
        onLaunch={() => setLaunching(true)}
      />
    </div>
  )
}

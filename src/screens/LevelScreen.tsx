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
import type { Point } from '../types'

interface Props {
  onBack: () => void      // → world map
  onNextLevel: () => void // advance level index
  freeDraw?: boolean
}

export function LevelScreen({ onBack, onNextLevel, freeDraw = false }: Props) {
  const { currentWorld, currentLevel, selectedBall, selectBall, recordResult } = useGameStore()
  const world = WORLD_MAP[currentWorld]
  const ball = BALL_MAP[selectedBall]
  const level = freeDraw
    ? { id: 'free', name: 'Free Draw', worldId: currentWorld, ballSpawn: { x: 0.1, y: 0.1 }, goal: { x: -1, y: -1 }, strokesMax: Infinity, obstacles: [] }
    : getLevel(currentWorld, currentLevel)

  const [strokes, setStrokes] = useState<Point[][]>([])
  const [launching, setLaunching] = useState(false)
  const [overlay, setOverlay] = useState<'win' | 'loss' | null>(null)
  const [strokesUsedOnWin, setStrokesUsedOnWin] = useState(0)
  const [retryKey, setRetryKey] = useState(0)  // force GameCanvas remount on retry

  // Viewport-aware canvas size — updates on resize
  const hudTop = 56
  const hudBottom = 96
  const [size, setSize] = useState(() => ({
    w: window.innerWidth,
    h: window.innerHeight - hudTop - hudBottom,
  }))

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight - hudTop - hudBottom })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleWin = useCallback((strokesUsed: number) => {
    if (!freeDraw) {
      const stars = strokesUsed === 1 ? 3 : strokesUsed === 2 ? 2 : 1
      recordResult(currentWorld, currentLevel, stars)
    }
    setStrokesUsedOnWin(strokesUsed)
    setLaunching(false)
    setOverlay('win')
  }, [freeDraw, currentWorld, currentLevel, recordResult])

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
        strokesMax={freeDraw ? 3 : level.strokesMax}
        strokesUsed={strokes.length}
        onBack={onBack}
        onRetry={retry}
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
          strokeColor={palette.ink}
          launching={launching}
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

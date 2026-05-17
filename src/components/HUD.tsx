import { motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { StrokeCounter } from './StrokeCounter'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { playTap } from '../engine/audio'
import { hapticTap } from '../hooks/useHaptic'
import type { WorldDef } from '../types'

interface Props {
  world: WorldDef
  levelName: string
  levelIndex: number
  strokesMax: number
  strokesUsed: number
  onBack: () => void
  onRetry: () => void
  onUndo?: () => void
}

export function HUD({ world, levelName, levelIndex, strokesMax, strokesUsed, onBack, onRetry, onUndo }: Props) {
  const portrait = useIsPortrait()
  const isSpace = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const btnBg = isSpace ? 'rgba(255,255,255,.12)' : palette.paper

  return (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 8, justifyContent: 'space-between',
      background: 'linear-gradient(to bottom, rgba(0,0,0,.06), transparent)',
      color: textColor, flexShrink: 0, overflow: 'hidden',
    }}>
      {/* left: back + level name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => { hapticTap(); playTap(); onBack() }}
          style={{
            width: 34, height: 34, borderRadius: 999, border: toy.border,
            background: btnBg, color: textColor, cursor: 'pointer', fontSize: 15,
            boxShadow: toy.shadow, flexShrink: 0,
          }}
        >←</motion.button>
        <div style={{ lineHeight: 1.15, minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontFamily: 'JetBrains Mono', fontSize: 9, opacity: .65,
            letterSpacing: '.12em', textTransform: 'uppercase',
          }}>
            {world.name}
          </div>
          <div style={{
            fontFamily: 'Caprasimo, serif',
            fontSize: portrait ? 15 : 18,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {portrait
              ? `#${levelIndex + 1} ${levelName}`
              : `Level ${String(levelIndex + 1).padStart(2, '0')} · ${levelName}`}
          </div>
        </div>
      </div>

      {/* right: stroke counter + undo + retry */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <StrokeCounter max={strokesMax} used={strokesUsed} />
        {onUndo && strokesUsed > 0 && (
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => { hapticTap(); playTap(); onUndo() }}
            title="Undo last stroke"
            style={{
              width: 34, height: 34, borderRadius: 999, border: toy.border,
              background: btnBg, color: textColor, cursor: 'pointer', fontSize: 14,
              boxShadow: toy.shadow,
            }}
          >⌫</motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => { hapticTap(); playTap(); onRetry() }}
          title="Retry"
          style={{
            width: 34, height: 34, borderRadius: 999, border: toy.border,
            background: btnBg, color: textColor, cursor: 'pointer', fontSize: 14,
            boxShadow: toy.shadow,
          }}
        >↻</motion.button>
      </div>
    </div>
  )
}

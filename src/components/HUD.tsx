import { toy, palette } from '../theme/toy'
import { StrokeCounter } from './StrokeCounter'
import type { WorldDef } from '../types'

interface Props {
  world: WorldDef
  levelName: string
  levelIndex: number
  strokesMax: number
  strokesUsed: number
  onBack: () => void
  onRetry: () => void
}

export function HUD({ world, levelName, levelIndex, strokesMax, strokesUsed, onBack, onRetry }: Props) {
  const isSpace = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const btnBg = isSpace ? 'rgba(255,255,255,.12)' : palette.paper

  return (
    <div style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12, justifyContent: 'space-between',
      background: 'linear-gradient(to bottom, rgba(0,0,0,.06), transparent)',
      color: textColor, flexShrink: 0,
    }}>
      {/* left: back + level name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 999, border: toy.border,
          background: btnBg, color: textColor, cursor: 'pointer', fontSize: 16,
          boxShadow: toy.shadow,
        }}>←</button>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, opacity: .65, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {world.name}
          </div>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 18 }}>
            Level {String(levelIndex + 1).padStart(2, '0')} · {levelName}
          </div>
        </div>
      </div>

      {/* right: stroke counter + retry */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <StrokeCounter max={strokesMax} used={strokesUsed} />
        <button onClick={onRetry} title="Retry" style={{
          width: 36, height: 36, borderRadius: 999, border: toy.border,
          background: btnBg, color: textColor, cursor: 'pointer', fontSize: 15,
          boxShadow: toy.shadow,
        }}>↻</button>
      </div>
    </div>
  )
}

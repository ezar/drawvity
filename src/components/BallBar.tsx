import { toy, palette } from '../theme/toy'
import { BALLS } from '../data/balls'
import { useIsPortrait } from '../hooks/useIsPortrait'
import type { BallId, WorldDef } from '../types'
import { useGameStore } from '../store/gameStore'

interface Props {
  selectedBall: BallId
  onSelectBall: (id: BallId) => void
  world: WorldDef
  canLaunch: boolean
  launching: boolean
  onLaunch: () => void
  compact?: boolean
}

export function BallBar({ selectedBall, onSelectBall, world, canLaunch, launching, onLaunch, compact = false }: Props) {
  const unlockedBalls = useGameStore((s) => s.unlockedBalls)
  const portrait = useIsPortrait()
  const isSpace = world.id === 'space'
  // on portrait mobile, show only first 4 balls to prevent overflow
  const visibleBalls = portrait ? BALLS.slice(0, 4) : BALLS
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg = isSpace ? 'rgba(255,255,255,.08)' : palette.paper

  return (
    <div style={{
      minHeight: compact ? 72 : 96, padding: '10px 16px 14px',
      display: 'flex', alignItems: 'center', gap: 14,
      flexDirection: compact ? 'column' : 'row',
      background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      color: textColor, flexShrink: 0,
    }}>
      {/* ball chips */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center',
        padding: '8px 12px',
        background: panelBg, border: toy.border, borderRadius: 999,
        boxShadow: toy.shadow, flexShrink: 0,
      }}>
        {visibleBalls.map((b) => {
          const unlocked = unlockedBalls.includes(b.id)
          const selected = b.id === selectedBall
          return (
            <button
              key={b.id}
              onClick={() => unlocked && onSelectBall(b.id)}
              disabled={!unlocked}
              title={b.name}
              style={{
                width: 48, height: 48, borderRadius: 999, border: 'none',
                background: unlocked ? b.color : 'rgba(31,26,20,.08)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                position: 'relative', flexShrink: 0,
                boxShadow: selected
                  ? `0 0 0 3px ${palette.paper}, 0 0 0 5px ${palette.ink}, ${toy.shadow}`
                  : toy.shadow,
                transform: selected ? 'translateY(-3px)' : 'none',
                transition: 'transform .15s ease, box-shadow .15s ease',
              }}
            >
              {!unlocked && <span style={{ fontSize: 18, color: 'rgba(31,26,20,.45)' }}>🔒</span>}
              {unlocked && (
                <span style={{
                  position: 'absolute', right: 4, bottom: 2,
                  fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700,
                  color: 'rgba(0,0,0,.45)',
                }}>{b.density.toFixed(4).replace('0.00', '')}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* hint text */}
      {!compact && (
        <div style={{ flex: 1, fontFamily: 'JetBrains Mono', fontSize: 11, opacity: .6, letterSpacing: '.05em', color: textColor }}>
          {launching ? 'in flight…' : canLaunch ? `${BALLS.find(b => b.id === selectedBall)?.name} · ready` : 'draw a path · then launch'}
        </div>
      )}

      {/* launch button */}
      <button
        onClick={() => canLaunch && !launching && onLaunch()}
        disabled={!canLaunch || launching}
        style={{
          padding: compact ? '12px 22px' : '14px 32px',
          background: canLaunch && !launching ? palette.primary : 'rgba(31,26,20,.18)',
          color: '#fff', border: 'none', borderRadius: 999,
          fontFamily: 'Caprasimo, serif', fontSize: compact ? 20 : 22,
          cursor: canLaunch && !launching ? 'pointer' : 'not-allowed',
          boxShadow: canLaunch && !launching ? `0 4px 0 rgba(0,0,0,.2), ${toy.shadow}` : toy.shadow,
          animation: canLaunch && !launching ? 'dp-pulse 1.6s ease-in-out infinite' : 'none',
          flexShrink: 0,
          transition: 'background .2s ease',
        }}
      >
        {launching ? '…' : 'Launch'} {!launching && '↓'}
      </button>

      <style>{`@keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }`}</style>
    </div>
  )
}

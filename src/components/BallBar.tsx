import { motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { BALLS } from '../data/balls'
import { STROKE_COLORS } from '../data/colors'
import { useIsPortrait } from '../hooks/useIsPortrait'
import type { BallId, WorldDef } from '../types'
import { useGameStore } from '../store/gameStore'
import { playTap } from '../engine/audio'
import { hapticTap, hapticLaunch } from '../hooks/useHaptic'

interface Props {
  selectedBall: BallId
  onSelectBall: (id: BallId) => void
  world: WorldDef
  canLaunch: boolean
  launching: boolean
  onLaunch: () => void
}

export function BallBar({ selectedBall, onSelectBall, world, canLaunch, launching, onLaunch }: Props) {
  const { unlockedBalls, selectedColorId, selectColor, progress } = useGameStore()
  const portrait = useIsPortrait()
  const totalStarsAll = Object.values(progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)
  const unlockedColorObjs = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars)
  const isSpace = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg  = isSpace ? 'rgba(255,255,255,.08)' : palette.paper

  // chip size: smaller on portrait to fit Launch button
  const chipSize = portrait ? 40 : 48
  const chipGap  = portrait ? 7 : 10
  // portrait: 4 balls max; landscape: all 6
  const visibleBalls = portrait ? BALLS.slice(0, 4) : BALLS

  return (
    <div style={{
      padding: portrait ? '8px 12px 12px' : '10px 16px 14px',
      display: 'flex', alignItems: 'center',
      gap: portrait ? 10 : 14,
      flexDirection: 'row',
      background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      color: textColor, flexShrink: 0,
      minHeight: portrait ? 72 : 88,
    }}>

      {/* ball chips */}
      <div style={{
        display: 'flex', gap: chipGap, alignItems: 'center',
        padding: portrait ? '6px 10px' : '8px 12px',
        background: panelBg, border: toy.border, borderRadius: 999,
        boxShadow: toy.shadow, flexShrink: 0,
      }}>
        {visibleBalls.map((b) => {
          const unlocked = unlockedBalls.includes(b.id)
          const selected = b.id === selectedBall
          return (
            <motion.button
              key={b.id}
              whileTap={unlocked ? { scale: 0.88 } : {}}
              onClick={() => { if (!unlocked) return; hapticTap(); playTap(); onSelectBall(b.id) }}
              disabled={!unlocked}
              title={b.name}
              style={{
                width: chipSize, height: chipSize,
                borderRadius: 999, border: 'none',
                background: unlocked ? b.color : 'rgba(31,26,20,.08)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                flexShrink: 0,
                boxShadow: selected
                  ? `0 0 0 3px ${palette.paper}, 0 0 0 5px ${palette.ink}, ${toy.shadow}`
                  : toy.shadow,
                transform: selected ? 'translateY(-3px)' : 'none',
                transition: 'transform .15s ease, box-shadow .15s ease',
              }}
            >
              {!unlocked && <span style={{ fontSize: 16 }}>🔒</span>}
            </motion.button>
          )
        })}
      </div>

      {/* stroke color chips */}
      <div style={{
        display: 'flex', gap: portrait ? 5 : 7, alignItems: 'center',
        padding: portrait ? '6px 8px' : '8px 10px',
        background: panelBg, border: toy.border, borderRadius: 999,
        boxShadow: toy.shadow, flexShrink: 0,
      }}>
        {unlockedColorObjs.slice(0, portrait ? 4 : 7).map(c => {
          const sel = c.id === selectedColorId
          return (
            <button
              key={c.id}
              title={c.name}
              onClick={() => { selectColor(c.id); playTap() }}
              style={{
                width: portrait ? 22 : 26, height: portrait ? 22 : 26,
                borderRadius: 999, border: 'none', flexShrink: 0,
                background: c.hex,
                boxShadow: sel
                  ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.ink}`
                  : '0 1px 3px rgba(31,26,20,.2)',
                cursor: 'pointer',
                transform: sel ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform .12s ease, box-shadow .12s ease',
              }}
            />
          )
        })}
      </div>

      {/* hint — only on landscape */}
      {!portrait && (
        <div style={{
          flex: 1, fontFamily: 'JetBrains Mono', fontSize: 11,
          opacity: .6, letterSpacing: '.05em', color: textColor,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {launching ? 'in flight…' : canLaunch
            ? `${BALLS.find(b => b.id === selectedBall)?.name} · ready`
            : 'draw a path · then launch'}
        </div>
      )}

      {/* spacer on portrait so Launch stays right */}
      {portrait && <div style={{ flex: 1 }} />}

      {/* launch button */}
      <motion.button
        whileTap={canLaunch && !launching ? { scale: 0.93 } : {}}
        onClick={() => { if (!canLaunch || launching) return; hapticLaunch(); onLaunch() }}
        disabled={!canLaunch || launching}
        style={{
          padding: portrait ? '12px 20px' : '14px 32px',
          background: canLaunch && !launching ? palette.primary : 'rgba(31,26,20,.18)',
          color: '#fff', border: 'none', borderRadius: 999,
          fontFamily: 'Caprasimo, serif',
          fontSize: portrait ? 18 : 22,
          cursor: canLaunch && !launching ? 'pointer' : 'not-allowed',
          boxShadow: canLaunch && !launching ? `0 4px 0 rgba(0,0,0,.2), ${toy.shadow}` : toy.shadow,
          animation: canLaunch && !launching ? 'dp-pulse 1.6s ease-in-out infinite' : 'none',
          flexShrink: 0,
          whiteSpace: 'nowrap',
          transition: 'background .2s ease',
        }}
      >
        {launching ? '…' : 'Launch ↓'}
      </motion.button>

      <style>{`@keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }`}</style>
    </div>
  )
}

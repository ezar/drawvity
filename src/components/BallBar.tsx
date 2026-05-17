import { motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { BALLS } from '../data/balls'
import { STROKE_COLORS } from '../data/colors'
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

const BALL_SIZE  = 34
const COLOR_SIZE = 22

export function BallBar({ selectedBall, onSelectBall, world, canLaunch, launching, onLaunch }: Props) {
  const { unlockedBalls, selectedColorId, selectColor, progress } = useGameStore()
  const totalStarsAll = Object.values(progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)
  const unlockedColorObjs = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars)
  const isSpace = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg   = isSpace ? 'rgba(255,255,255,.08)' : palette.paper

  const INLINE_LABEL: React.CSSProperties = {
    fontFamily: 'JetBrains Mono',
    fontSize: 9, fontWeight: 700,
    letterSpacing: '.1em', textTransform: 'uppercase',
    color: textColor, opacity: .45,
    whiteSpace: 'nowrap', flexShrink: 0,
    paddingRight: 6,
  }

  const PILL_H = BALL_SIZE + 12  // 46px — both pills same height

  const PILL: React.CSSProperties = {
    display: 'flex', gap: 6, alignItems: 'center',
    padding: `0 10px`,
    height: PILL_H,
    background: panelBg, border: toy.border, borderRadius: 999,
    boxShadow: toy.shadow,
    overflowX: 'auto', scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
    flexShrink: 1, minWidth: 0, boxSizing: 'border-box',
  }

  const showHint = !canLaunch && !launching

  return (
    <div style={{
      padding: '8px 12px 12px',
      display: 'flex', alignItems: 'center',
      gap: 8, flexShrink: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      color: textColor,
    }}>

      {/* BALL pill */}
      <div style={PILL}>
        <span style={INLINE_LABEL}>Ball</span>
        {BALLS.map((b) => {
          const unlocked = unlockedBalls.includes(b.id)
          const selected = b.id === selectedBall
          return (
            <motion.button
              key={b.id}
              whileTap={unlocked ? { scale: 0.86 } : {}}
              onClick={() => { if (!unlocked) return; hapticTap(); playTap(); onSelectBall(b.id) }}
              disabled={!unlocked}
              title={b.name}
              style={{
                width: BALL_SIZE, height: BALL_SIZE, flexShrink: 0,
                borderRadius: 999, border: 'none',
                background: unlocked ? b.color : 'rgba(31,26,20,.08)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                boxShadow: selected
                  ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.ink}, ${toy.shadow}`
                  : toy.shadow,
                transform: selected ? 'translateY(-2px)' : 'none',
                transition: 'transform .15s ease, box-shadow .15s ease',
              }}
            >
              {!unlocked && <span style={{ fontSize: 12 }}>🔒</span>}
            </motion.button>
          )
        })}
      </div>

      {/* INK pill */}
      <div style={PILL}>
        <span style={INLINE_LABEL}>Ink</span>
        {unlockedColorObjs.map(c => {
          const sel = c.id === selectedColorId
          return (
            <motion.button
              key={c.id}
              title={c.name}
              whileTap={{ scale: 0.88 }}
              onClick={() => { hapticTap(); playTap(); selectColor(c.id) }}
              style={{
                width: COLOR_SIZE, height: COLOR_SIZE, flexShrink: 0,
                borderRadius: 999, border: 'none',
                background: c.hex,
                boxShadow: sel
                  ? `0 0 0 2px ${palette.paper}, 0 0 0 3px ${palette.ink}`
                  : '0 1px 3px rgba(31,26,20,.2)',
                cursor: 'pointer',
                transform: sel ? 'translateY(-2px) scale(1.18)' : 'none',
                transition: 'transform .12s ease, box-shadow .12s ease',
              }}
            />
          )
        })}
      </div>

      {/* hint / spacer */}
      <div style={{ flex: 1, textAlign: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
        {showHint && (
          <span style={{
            fontFamily: 'JetBrains Mono',
            fontSize: 10, letterSpacing: '.08em',
            color: textColor, opacity: .3,
            whiteSpace: 'nowrap',
          }}>
            draw a path · then launch
          </span>
        )}
      </div>

      {/* LAUNCH */}
      <motion.button
        whileTap={canLaunch && !launching ? { scale: 0.93 } : {}}
        onClick={() => { if (!canLaunch || launching) return; hapticLaunch(); onLaunch() }}
        disabled={!canLaunch || launching}
        style={{
          height: PILL_H,
          padding: '0 20px',
          background: canLaunch && !launching ? palette.primary : 'rgba(31,26,20,.18)',
          color: '#fff', border: 'none', borderRadius: 999,
          fontFamily: 'Caprasimo, serif', fontSize: 17,
          cursor: canLaunch && !launching ? 'pointer' : 'not-allowed',
          boxShadow: canLaunch && !launching ? `0 4px 0 rgba(0,0,0,.2), ${toy.shadow}` : toy.shadow,
          animation: canLaunch && !launching ? 'dp-pulse 1.6s ease-in-out infinite' : 'none',
          whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'background .2s ease',
        }}
      >
        {launching ? '…' : 'Launch ↓'}
      </motion.button>

      <style>{`
        @keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

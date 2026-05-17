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

const BALL_SIZE  = 40
const COLOR_SIZE = 26

export function BallBar({ selectedBall, onSelectBall, world, canLaunch, launching, onLaunch }: Props) {
  const { unlockedBalls, selectedColorId, selectColor, progress } = useGameStore()
  const totalStarsAll = Object.values(progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)
  const unlockedColorObjs = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars)
  const isSpace = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg   = isSpace ? 'rgba(255,255,255,.08)' : palette.paper

  const LABEL: React.CSSProperties = {
    fontFamily: 'JetBrains Mono',
    fontSize: 10, fontWeight: 700,
    letterSpacing: '.12em', textTransform: 'uppercase',
    color: textColor, opacity: .55,
    lineHeight: 1, marginBottom: 5, paddingLeft: 4,
    whiteSpace: 'nowrap',
  }

  const PILL: React.CSSProperties = {
    display: 'flex', gap: 8, alignItems: 'center',
    padding: '7px 10px',
    background: panelBg, border: toy.border, borderRadius: 999,
    boxShadow: toy.shadow,
    overflowX: 'auto', scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  }

  return (
    <div style={{
      padding: '10px 14px 14px',
      display: 'flex', alignItems: 'flex-end',
      gap: 10, flexShrink: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      color: textColor,
    }}>
      {/* BALL group */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexShrink: 1 }}>
        <div style={LABEL}>Ball</div>
        <div style={PILL}>
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
                    ? `0 0 0 3px ${palette.paper}, 0 0 0 5px ${palette.ink}, ${toy.shadow}`
                    : toy.shadow,
                  transform: selected ? 'translateY(-3px)' : 'none',
                  transition: 'transform .15s ease, box-shadow .15s ease',
                }}
              >
                {!unlocked && <span style={{ fontSize: 14 }}>🔒</span>}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* INK group */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexShrink: 1 }}>
        <div style={LABEL}>Ink</div>
        <div style={PILL}>
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
                    ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.ink}`
                    : '0 1px 3px rgba(31,26,20,.2)',
                  cursor: 'pointer',
                  transform: sel ? 'translateY(-2px) scale(1.15)' : 'none',
                  transition: 'transform .12s ease, box-shadow .12s ease',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* spacer */}
      <div style={{ flex: 1 }} />

      {/* LAUNCH */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ ...LABEL, opacity: 0, marginBottom: 6 }}>·</div>
        <motion.button
          whileTap={canLaunch && !launching ? { scale: 0.93 } : {}}
          onClick={() => { if (!canLaunch || launching) return; hapticLaunch(); onLaunch() }}
          disabled={!canLaunch || launching}
          style={{
            height: BALL_SIZE + 14,
            padding: '0 24px',
            background: canLaunch && !launching ? palette.primary : 'rgba(31,26,20,.18)',
            color: '#fff', border: 'none', borderRadius: 999,
            fontFamily: 'Caprasimo, serif', fontSize: 18,
            cursor: canLaunch && !launching ? 'pointer' : 'not-allowed',
            boxShadow: canLaunch && !launching ? `0 4px 0 rgba(0,0,0,.2), ${toy.shadow}` : toy.shadow,
            animation: canLaunch && !launching ? 'dp-pulse 1.6s ease-in-out infinite' : 'none',
            whiteSpace: 'nowrap',
            transition: 'background .2s ease',
          }}
        >
          {launching ? '…' : 'Launch ↓'}
        </motion.button>
      </div>

      <style>{`
        @keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

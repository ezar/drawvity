import { motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { BALLS } from '../data/balls'
import { STROKE_COLORS } from '../data/colors'
import type { BallId, WorldDef } from '../types'
import { useGameStore } from '../store/gameStore'
import { useIsPortrait } from '../hooks/useIsPortrait'
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

// All elements share this height so everything lines up
const PILL_H = 48

// Portrait: 2 rows that together = PILL_H
const ROW_GAP    = 6
const ROW_H      = (PILL_H - ROW_GAP) / 2  // 21px each

// Chip sizes per layout
const BALL_LG = 34   // landscape single row
const BALL_SM = 15   // portrait mini row
const INK_LG  = 22   // landscape
const INK_SM  = 13   // portrait

export function BallBar({ selectedBall, onSelectBall, world, canLaunch, launching, onLaunch }: Props) {
  const { unlockedBalls, selectedColorId, selectColor, progress } = useGameStore()
  const totalStarsAll = Object.values(progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)
  const unlockedColorObjs = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars)
  const portrait = useIsPortrait()
  const isSpace = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg   = isSpace ? 'rgba(255,255,255,.08)' : palette.paper

  const showHint = !canLaunch && !launching

  const LABEL: React.CSSProperties = {
    fontFamily: 'JetBrains Mono',
    fontSize: portrait ? 7 : 9,
    fontWeight: 700,
    letterSpacing: '.1em', textTransform: 'uppercase',
    color: textColor, opacity: .45,
    whiteSpace: 'nowrap', flexShrink: 0,
    paddingRight: 5,
  }

  const pillBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center',
    background: panelBg, border: toy.border, borderRadius: 999,
    boxShadow: toy.shadow,
    overflowX: 'auto', scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
    minWidth: 0, flexShrink: 1, boxSizing: 'border-box',
  }

  // ── PORTRAIT: stacked column of 2 mini-rows
  const portraitSelectors = (
    <div style={{
      display: 'flex', flexDirection: 'column',
      gap: ROW_GAP, flexShrink: 1, minWidth: 0,
      height: PILL_H,
    }}>
      {/* Ball mini-row */}
      <div style={{ ...pillBase, height: ROW_H, gap: 5, padding: '0 8px' }}>
        <span style={LABEL}>Ball</span>
        {BALLS.map((b) => {
          const unlocked = unlockedBalls.includes(b.id)
          const selected = b.id === selectedBall
          return (
            <motion.button
              key={b.id}
              whileTap={unlocked ? { scale: 0.84 } : {}}
              onClick={() => { if (!unlocked) return; hapticTap(); playTap(); onSelectBall(b.id) }}
              disabled={!unlocked}
              title={b.name}
              style={{
                width: BALL_SM, height: BALL_SM, flexShrink: 0,
                borderRadius: 999, border: 'none',
                background: unlocked ? b.color : 'rgba(31,26,20,.1)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                boxShadow: selected
                  ? `0 0 0 1.5px ${palette.paper}, 0 0 0 3px ${palette.ink}`
                  : 'none',
                outline: 'none',
                transition: 'box-shadow .12s ease',
              }}
            />
          )
        })}
      </div>

      {/* Ink mini-row */}
      <div style={{ ...pillBase, height: ROW_H, gap: 5, padding: '0 8px' }}>
        <span style={LABEL}>Ink</span>
        {unlockedColorObjs.map(c => {
          const sel = c.id === selectedColorId
          return (
            <motion.button
              key={c.id}
              title={c.name}
              whileTap={{ scale: 0.86 }}
              onClick={() => { hapticTap(); playTap(); selectColor(c.id) }}
              style={{
                width: INK_SM, height: INK_SM, flexShrink: 0,
                borderRadius: 999, border: 'none',
                background: c.hex,
                boxShadow: sel
                  ? `0 0 0 1.5px ${palette.paper}, 0 0 0 3px ${palette.ink}`
                  : '0 1px 2px rgba(31,26,20,.2)',
                cursor: 'pointer',
                transform: sel ? 'scale(1.2)' : 'none',
                transition: 'transform .12s ease, box-shadow .12s ease',
                outline: 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )

  // ── LANDSCAPE: single row pills
  const landscapeSelectors = (
    <>
      {/* Ball pill */}
      <div style={{ ...pillBase, height: PILL_H, gap: 6, padding: '0 10px' }}>
        <span style={LABEL}>Ball</span>
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
                width: BALL_LG, height: BALL_LG, flexShrink: 0,
                borderRadius: 999, border: 'none',
                background: unlocked ? b.color : 'rgba(31,26,20,.08)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                boxShadow: selected
                  ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.ink}, ${toy.shadow}`
                  : toy.shadow,
                transform: selected ? 'translateY(-2px)' : 'none',
                transition: 'transform .15s ease, box-shadow .15s ease',
                outline: 'none',
              }}
            >
              {!unlocked && <span style={{ fontSize: 12 }}>🔒</span>}
            </motion.button>
          )
        })}
      </div>

      {/* Ink pill */}
      <div style={{ ...pillBase, height: PILL_H, gap: 6, padding: '0 10px' }}>
        <span style={LABEL}>Ink</span>
        {unlockedColorObjs.map(c => {
          const sel = c.id === selectedColorId
          return (
            <motion.button
              key={c.id}
              title={c.name}
              whileTap={{ scale: 0.88 }}
              onClick={() => { hapticTap(); playTap(); selectColor(c.id) }}
              style={{
                width: INK_LG, height: INK_LG, flexShrink: 0,
                borderRadius: 999, border: 'none',
                background: c.hex,
                boxShadow: sel
                  ? `0 0 0 2px ${palette.paper}, 0 0 0 3px ${palette.ink}`
                  : '0 1px 3px rgba(31,26,20,.2)',
                cursor: 'pointer',
                transform: sel ? 'scale(1.18) translateY(-1px)' : 'none',
                transition: 'transform .12s ease, box-shadow .12s ease',
                outline: 'none',
              }}
            />
          )
        })}
      </div>
    </>
  )

  return (
    <div style={{
      padding: '8px 12px 12px',
      display: 'flex', alignItems: 'center',
      gap: 8, flexShrink: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      color: textColor,
    }}>

      {portrait ? portraitSelectors : landscapeSelectors}

      {/* hint / spacer */}
      <div style={{ flex: 1, textAlign: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
        {showHint && !portrait && (
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

      {/* LAUNCH — always visible, always PILL_H */}
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

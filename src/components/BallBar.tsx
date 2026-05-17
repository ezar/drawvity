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

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'JetBrains Mono',
  fontSize: 9, fontWeight: 700,
  letterSpacing: '.12em', textTransform: 'uppercase',
  opacity: .5, whiteSpace: 'nowrap',
}

export function BallBar({ selectedBall, onSelectBall, world, canLaunch, launching, onLaunch }: Props) {
  const { unlockedBalls, selectedColorId, selectColor, progress } = useGameStore()
  const portrait = useIsPortrait()
  const totalStarsAll = Object.values(progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)
  const unlockedColorObjs = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars)
  const isSpace = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg   = isSpace ? 'rgba(255,255,255,.08)' : palette.paper

  const visibleBalls  = portrait ? BALLS.slice(0, 4) : BALLS
  const visibleColors = unlockedColorObjs.slice(0, portrait ? 4 : 7)

  const ballChips = visibleBalls.map((b) => {
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
          width: 40, height: 40, borderRadius: 999, border: 'none', flexShrink: 0,
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
  })

  const colorChips = visibleColors.map(c => {
    const sel = c.id === selectedColorId
    return (
      <motion.button
        key={c.id}
        title={c.name}
        whileTap={{ scale: 0.88 }}
        onClick={() => { hapticTap(); playTap(); selectColor(c.id) }}
        style={{
          width: 24, height: 24, borderRadius: 999, border: 'none', flexShrink: 0,
          background: c.hex,
          boxShadow: sel
            ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.ink}`
            : '0 1px 3px rgba(31,26,20,.2)',
          cursor: 'pointer',
          transform: sel ? 'scale(1.18)' : 'scale(1)',
          transition: 'transform .12s ease, box-shadow .12s ease',
        }}
      />
    )
  })

  const launchBtn = (
    <motion.button
      whileTap={canLaunch && !launching ? { scale: 0.93 } : {}}
      onClick={() => { if (!canLaunch || launching) return; hapticLaunch(); onLaunch() }}
      disabled={!canLaunch || launching}
      style={{
        padding: '11px 22px',
        background: canLaunch && !launching ? palette.primary : 'rgba(31,26,20,.18)',
        color: '#fff', border: 'none', borderRadius: 999,
        fontFamily: 'Caprasimo, serif', fontSize: 18,
        cursor: canLaunch && !launching ? 'pointer' : 'not-allowed',
        boxShadow: canLaunch && !launching ? `0 4px 0 rgba(0,0,0,.2), ${toy.shadow}` : toy.shadow,
        animation: canLaunch && !launching ? 'dp-pulse 1.6s ease-in-out infinite' : 'none',
        flexShrink: 0, whiteSpace: 'nowrap',
        transition: 'background .2s ease',
      }}
    >
      {launching ? '…' : 'Launch ↓'}
    </motion.button>
  )

  /* ── PORTRAIT: 2-row layout ─────────────────────────────────────── */
  if (portrait) {
    return (
      <div style={{
        background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
        color: textColor, flexShrink: 0,
        padding: '8px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Row 1: ball selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ ...LABEL_STYLE, color: textColor }}>Ball</div>
          <div style={{
            display: 'flex', gap: 7, alignItems: 'center',
            padding: '6px 10px', background: panelBg,
            border: toy.border, borderRadius: 999, boxShadow: toy.shadow,
          }}>
            {ballChips}
          </div>
        </div>

        {/* Row 2: color + launch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ ...LABEL_STYLE, color: textColor }}>Ink</div>
          <div style={{
            display: 'flex', gap: 6, alignItems: 'center',
            padding: '7px 10px', background: panelBg,
            border: toy.border, borderRadius: 999, boxShadow: toy.shadow,
          }}>
            {colorChips}
          </div>
          <div style={{ flex: 1 }} />
          {launchBtn}
        </div>
        <style>{`@keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }`}</style>
      </div>
    )
  }

  /* ── LANDSCAPE: single-row with labels ──────────────────────────── */
  return (
    <div style={{
      padding: '10px 20px 14px',
      display: 'flex', alignItems: 'center', gap: 16,
      background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      color: textColor, flexShrink: 0, minHeight: 88,
    }}>
      {/* ball group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
        <div style={{ ...LABEL_STYLE, color: textColor, paddingLeft: 2 }}>Ball</div>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '7px 12px', background: panelBg,
          border: toy.border, borderRadius: 999, boxShadow: toy.shadow,
        }}>
          {ballChips}
        </div>
      </div>

      {/* color group */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
        <div style={{ ...LABEL_STYLE, color: textColor, paddingLeft: 2 }}>Ink color</div>
        <div style={{
          display: 'flex', gap: 7, alignItems: 'center',
          padding: '9px 12px', background: panelBg,
          border: toy.border, borderRadius: 999, boxShadow: toy.shadow,
        }}>
          {colorChips}
        </div>
      </div>

      {/* hint */}
      <div style={{
        flex: 1, fontFamily: 'JetBrains Mono', fontSize: 11,
        opacity: .55, letterSpacing: '.05em', color: textColor,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {launching ? 'in flight…' : canLaunch
          ? `${BALLS.find(b => b.id === selectedBall)?.name} · ready`
          : 'draw a path · then launch'}
      </div>

      {launchBtn}
      <style>{`@keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }`}</style>
    </div>
  )
}

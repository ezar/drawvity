import { useState } from 'react'
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

const PILL_H   = 48   // universal height — pills, tabs, launch all same
const CHIP     = 28   // uniform chip size on landscape
const CHIP_SM  = 26   // chip size on portrait tab row

export function BallBar({ selectedBall, onSelectBall, world, canLaunch, launching, onLaunch }: Props) {
  const { unlockedBalls, selectedColorId, selectColor, progress } = useGameStore()
  const totalStarsAll = Object.values(progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)
  const unlockedColorObjs = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars)
  const portrait = useIsPortrait()
  const [activeTab, setActiveTab] = useState<'ball' | 'ink'>('ball')

  const isSpace  = world.id === 'space'
  const textColor = isSpace ? '#F2EBDA' : palette.ink
  const panelBg   = isSpace ? 'rgba(255,255,255,.08)' : palette.paper

  const showHint = !canLaunch && !launching

  // ── shared chip styles ──────────────────────────────────────────────────────
  const ballChip = (b: typeof BALLS[number], size: number) => {
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
          width: size, height: size, flexShrink: 0,
          borderRadius: 999, border: 'none', outline: 'none',
          background: unlocked ? b.color : 'rgba(31,26,20,.08)',
          cursor: unlocked ? 'pointer' : 'not-allowed',
          boxShadow: selected
            ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.ink}`
            : toy.shadow,
          transform: selected ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'transform .15s ease, box-shadow .15s ease',
        }}
      >
        {!unlocked && <span style={{ fontSize: size * 0.45 }}>🔒</span>}
      </motion.button>
    )
  }

  const inkChip = (c: typeof STROKE_COLORS[number], size: number) => {
    const sel = c.id === selectedColorId
    return (
      <motion.button
        key={c.id}
        title={c.name}
        whileTap={{ scale: 0.86 }}
        onClick={() => { hapticTap(); playTap(); selectColor(c.id) }}
        style={{
          width: size, height: size, flexShrink: 0,
          borderRadius: 999, border: 'none', outline: 'none',
          background: c.hex,
          boxShadow: sel
            ? `0 0 0 2px ${palette.paper}, 0 0 0 4px ${palette.ink}`
            : '0 1px 3px rgba(31,26,20,.2)',
          cursor: 'pointer',
          transform: sel ? 'scale(1.15) translateY(-1px)' : 'scale(1) translateY(0)',
          transition: 'transform .12s ease, box-shadow .12s ease',
        }}
      />
    )
  }

  // ── PILL container ──────────────────────────────────────────────────────────
  const pillStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    height: PILL_H, padding: '0 10px',
    background: panelBg, border: toy.border, borderRadius: 999,
    boxShadow: toy.shadow,
    overflowX: 'auto', scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
    flexShrink: 1, minWidth: 0, boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700,
    letterSpacing: '.1em', textTransform: 'uppercase',
    color: textColor, opacity: .45, whiteSpace: 'nowrap', flexShrink: 0,
  }

  // ── LAUNCH ──────────────────────────────────────────────────────────────────
  const launchBtn = (
    <motion.button
      whileTap={canLaunch && !launching ? { scale: 0.93 } : {}}
      onClick={() => { if (!canLaunch || launching) return; hapticLaunch(); onLaunch() }}
      disabled={!canLaunch || launching}
      style={{
        height: PILL_H, padding: '0 20px',
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
  )

  // ── PORTRAIT: tab toggle + chip row ────────────────────────────────────────
  if (portrait) {
    const tabBtn = (id: 'ball' | 'ink', label: string) => {
      const active = activeTab === id
      return (
        <motion.button
          key={id}
          whileTap={{ scale: 0.9 }}
          onClick={() => { hapticTap(); playTap(); setActiveTab(id) }}
          style={{
            height: PILL_H, padding: '0 12px',
            background: active ? palette.ink : panelBg,
            color: active ? (isSpace ? '#1F1A14' : '#fff') : textColor,
            border: toy.border, borderRadius: 999,
            fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700,
            letterSpacing: '.1em', textTransform: 'uppercase',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: active ? 'none' : toy.shadow,
            transition: 'background .15s ease, color .15s ease',
          }}
        >
          {label}
        </motion.button>
      )
    }

    return (
      <div style={{
        padding: '8px 12px 12px',
        display: 'flex', alignItems: 'center',
        gap: 6, flexShrink: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
        color: textColor,
      }}>
        {/* Tabs */}
        {tabBtn('ball', 'Ball')}
        {tabBtn('ink', 'Ink')}

        {/* Chip row */}
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          height: PILL_H, padding: '0 10px',
          background: panelBg, border: toy.border, borderRadius: 999,
          boxShadow: toy.shadow,
          overflowX: 'auto', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flex: 1, minWidth: 0, boxSizing: 'border-box',
        }}>
          {activeTab === 'ball'
            ? BALLS.map(b => ballChip(b, CHIP_SM))
            : unlockedColorObjs.map(c => inkChip(c, CHIP_SM))
          }
        </div>

        {launchBtn}

        <style>{`
          @keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
          div::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    )
  }

  // ── LANDSCAPE: two pills side by side, uniform chip size ───────────────────
  return (
    <div style={{
      padding: '8px 12px 12px',
      display: 'flex', alignItems: 'center',
      gap: 8, flexShrink: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,.06), transparent)',
      color: textColor,
    }}>
      {/* Ball pill */}
      <div style={pillStyle}>
        <span style={labelStyle}>Ball</span>
        {BALLS.map(b => ballChip(b, CHIP))}
      </div>

      {/* Ink pill */}
      <div style={pillStyle}>
        <span style={labelStyle}>Ink</span>
        {unlockedColorObjs.map(c => inkChip(c, CHIP))}
      </div>

      {/* hint */}
      <div style={{ flex: 1, textAlign: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
        {showHint && (
          <span style={{
            fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '.08em',
            color: textColor, opacity: .3, whiteSpace: 'nowrap',
          }}>
            draw a path · then launch
          </span>
        )}
      </div>

      {launchBtn}

      <style>{`
        @keyframes dp-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

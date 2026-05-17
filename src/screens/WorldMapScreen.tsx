import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { WORLDS } from '../data/worlds'
import { useGameStore } from '../store/gameStore'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { playTap } from '../engine/audio'
import { hapticTap } from '../hooks/useHaptic'
import type { WorldId } from '../types'

interface Props {
  onBack: () => void
  onPickWorld: (w: WorldId, level: number) => void
}

export function WorldMapScreen({ onBack, onPickWorld }: Props) {
  const portrait = useIsPortrait()
  const { progress, isWorldUnlocked, totalStars } = useGameStore()
  const [expanded, setExpanded] = useState<WorldId | null>(null)

  const allStars = WORLDS.reduce((a, w) => a + totalStars(w.id), 0)
  const maxStars = WORLDS.reduce((a, w) => a + w.levels * 3, 0)

  /** First level with 0 stars, or 0 if world is fresh */
  const firstIncomplete = (wid: WorldId) => {
    const stars = progress[wid]?.stars ?? []
    const idx = stars.findIndex(s => s === 0)
    return idx === -1 ? 0 : idx
  }

  /** How many levels are accessible (completed + 1 next) */
  const accessible = (wid: WorldId) => {
    const stars = progress[wid]?.stars ?? []
    const done = stars.filter(s => s > 0).length
    return Math.min(done + 1, 10)
  }

  const handleWorldTap = (wid: WorldId) => {
    if (!isWorldUnlocked(wid)) return
    hapticTap(); playTap()
    const acc = accessible(wid)
    // If only level 0 accessible (fresh world) → go directly
    if (acc <= 1) {
      onPickWorld(wid, 0)
    } else {
      // Toggle accordion
      setExpanded(prev => prev === wid ? null : wid)
    }
  }

  return (
    <div style={{
      width: '100%', height: '100%', background: palette.paper,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'auto',
    }}>
    <div style={{
      width: '100%', maxWidth: portrait ? '100%' : 1100,
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: portrait ? '20px 16px 32px' : '28px 40px 32px',
      gap: portrait ? 12 : 16,
    }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => { hapticTap(); playTap(); onBack() }}
          aria-label="Back"
          style={{ width: 40, height: 40, borderRadius: 999, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontSize: 18, boxShadow: toy.shadow, flexShrink: 0 }}
        >←</motion.button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft }}>choose a world</div>
          <h2 style={{ fontFamily: 'Caprasimo, serif', fontSize: portrait ? 28 : 38, fontWeight: 400, color: palette.ink, margin: 0, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Where to today?</h2>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, padding: '6px 10px', background: palette.paperDeep, borderRadius: 999, border: toy.border, color: palette.ink, display: 'flex', gap: 4, flexShrink: 0 }}>
          <span>★</span><span>{allStars}</span><span style={{ opacity: .4 }}>/{maxStars}</span>
        </div>
      </div>

      {/* world list */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        style={{ display: 'grid', gridTemplateColumns: portrait ? '1fr' : 'repeat(2, 1fr)', gap: 14 }}
      >
        {WORLDS.map((w, idx) => {
          const unlocked  = isWorldUnlocked(w.id)
          const stars     = progress[w.id]?.stars ?? []
          const done      = stars.filter(s => s > 0).length
          const acc       = Math.min(done + 1, 10)
          const isOpen    = expanded === w.id
          const totalW    = stars.reduce((a, b) => a + b, 0)

          return (
            <motion.div
              key={w.id}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              style={{
                background: w.bg, color: w.fg,
                border: toy.border, borderRadius: toy.radius,
                boxShadow: toy.shadow, overflow: 'hidden',
                opacity: unlocked ? 1 : .6,
                position: 'relative',
              }}
            >
              {/* World card header — tappable */}
              <motion.button
                whileTap={unlocked ? { scale: 0.98 } : {}}
                onClick={() => handleWorldTap(w.id)}
                disabled={!unlocked}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent',
                  border: 'none', cursor: unlocked ? 'pointer' : 'not-allowed',
                  padding: 18, color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, opacity: .65, letterSpacing: '.1em', textTransform: 'uppercase' }}>World {idx + 1}</div>
                    <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 26, lineHeight: 1, marginTop: 4 }}>{w.name}</div>
                    <div style={{ fontSize: 11, opacity: .7, marginTop: 4 }}>{w.subtitle}</div>
                    {done > 0 && (
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, marginTop: 6, opacity: .8 }}>
                        {done}/10 levels · {totalW} ★
                        {done >= 10 && <span style={{ marginLeft: 6, color: w.accent }}>✓ Complete</span>}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{ fontSize: 28, background: w.accent, color: '#fff', width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.2)' }}>{w.glyph}</div>
                    {unlocked && acc > 1 && (
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontSize: 12, opacity: .5 }}
                      >▼</motion.div>
                    )}
                  </div>
                </div>
              </motion.button>

              {/* Level picker — accordion */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      borderTop: `1px solid ${w.fg}22`,
                      padding: '12px 18px 16px',
                    }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .45, marginBottom: 10 }}>
                        Select level
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Array.from({ length: w.levels }).map((_, li) => {
                          const s         = stars[li] ?? 0
                          const isAccessible = li < acc
                          const isCurrent    = li === firstIncomplete(w.id)

                          return (
                            <motion.button
                              key={li}
                              whileTap={isAccessible ? { scale: 0.88 } : {}}
                              onClick={() => {
                                if (!isAccessible) return
                                hapticTap(); playTap()
                                setExpanded(null)
                                onPickWorld(w.id, li)
                              }}
                              disabled={!isAccessible}
                              title={`Level ${li + 1}${s > 0 ? ` · ${s}★` : ''}`}
                              style={{
                                width: 40, height: 40, borderRadius: 12,
                                border: isCurrent
                                  ? `2px solid ${w.fg}`
                                  : `1.5px solid ${w.fg}44`,
                                background: s > 0
                                  ? w.accent
                                  : isAccessible
                                    ? `${w.fg}11`
                                    : 'transparent',
                                color: s > 0 ? '#fff' : w.fg,
                                cursor: isAccessible ? 'pointer' : 'not-allowed',
                                opacity: isAccessible ? 1 : .25,
                                fontFamily: 'Caprasimo, serif', fontSize: 13,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 1, lineHeight: 1,
                              }}
                            >
                              <span>{li + 1}</span>
                              {s > 0 && <span style={{ fontSize: 7 }}>{'★'.repeat(s)}</span>}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Locked overlay */}
              {!unlocked && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(31,26,20,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caprasimo, serif', fontSize: 24, color: '#fff', backdropFilter: 'blur(2px)', pointerEvents: 'none' }}>
                  🔒 Locked
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { WORLDS } from '../data/worlds'
import { useGameStore } from '../store/gameStore'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { playTap } from '../engine/audio'
import { hapticTap } from '../hooks/useHaptic'
import type { WorldId } from '../types'

interface Props {
  onBack: () => void
  onPickWorld: (w: WorldId) => void
}

export function WorldMapScreen({ onBack, onPickWorld }: Props) {
  const portrait = useIsPortrait()
  const { progress, isWorldUnlocked, totalStars } = useGameStore()
  const allStars = WORLDS.reduce((a, w) => a + totalStars(w.id), 0)
  const maxStars = WORLDS.reduce((a, w) => a + w.levels * 3, 0)

  return (
    <div style={{
      width: '100%', height: '100%', background: palette.paper,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: portrait ? 'auto' : 'hidden',
    }}>
    <div style={{
      width: '100%', maxWidth: portrait ? '100%' : 1100,
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: portrait ? '20px 16px 16px' : '28px 40px 24px',
      gap: portrait ? 12 : 16, minHeight: 0,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => { hapticTap(); playTap(); onBack() }} style={{ width: 40, height: 40, borderRadius: 999, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontSize: 18, boxShadow: toy.shadow, flexShrink: 0 }}>←</motion.button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft }}>choose a world</div>
          <h2 style={{ fontFamily: 'Caprasimo, serif', fontSize: portrait ? 28 : 38, fontWeight: 400, color: palette.ink, margin: 0, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Where to today?</h2>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, padding: '6px 10px', background: palette.paperDeep, borderRadius: 999, border: toy.border, color: palette.ink, display: 'flex', gap: 4, flexShrink: 0 }}>
          <span>★</span><span>{allStars}</span><span style={{ opacity: .4 }}>/{maxStars}</span>
        </div>
      </div>

      {/* world grid */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        style={{ flex: 1, display: 'grid', gridTemplateColumns: portrait ? '1fr' : 'repeat(2, 1fr)', gap: 14, minHeight: 0, overflowY: portrait ? 'auto' : 'hidden' }}
      >
        {WORLDS.map((w, idx) => {
          const unlocked = isWorldUnlocked(w.id)
          const stars = progress[w.id]?.stars ?? []
          const completed = stars.filter(s => s > 0).length
          return (
            <motion.button
              key={w.id}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              whileTap={unlocked ? { scale: 0.97 } : {}}
              onClick={() => { if (!unlocked) return; hapticTap(); playTap(); onPickWorld(w.id) }}
              disabled={!unlocked}
              style={{
                position: 'relative', overflow: 'hidden', cursor: unlocked ? 'pointer' : 'not-allowed',
                background: w.bg, color: w.fg,
                border: toy.border, borderRadius: toy.radius,
                boxShadow: toy.shadow, padding: 18, textAlign: 'left',
                opacity: unlocked ? 1 : .6,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              {/* top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, opacity: .65, letterSpacing: '.1em', textTransform: 'uppercase' }}>World {idx + 1}</div>
                  <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 26, lineHeight: 1, marginTop: 4 }}>{w.name}</div>
                  <div style={{ fontSize: 11, opacity: .7, marginTop: 4 }}>{w.subtitle}</div>
                </div>
                <div style={{ fontSize: 28, background: w.accent, color: '#fff', width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.2)' }}>{w.glyph}</div>
              </div>
              {/* level dots */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12 }}>
                {Array.from({ length: w.levels }).map((_, li) => {
                  const s = stars[li] ?? 0
                  const locked = !unlocked || li > completed
                  return (
                    <div key={li} style={{
                      width: 20, height: 20, borderRadius: 999,
                      background: s > 0 ? w.accent : 'transparent',
                      border: `2px solid ${w.fg}`,
                      opacity: locked ? .25 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 700,
                      color: s > 0 ? '#fff' : w.fg,
                    }}>{s > 0 ? '★' : li + 1}</div>
                  )
                })}
              </div>
              {/* locked overlay */}
              {!unlocked && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(31,26,20,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Caprasimo, serif', fontSize: 24, color: '#fff', backdropFilter: 'blur(2px)' }}>
                  🔒 Locked
                </div>
              )}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
    </div>
  )
}

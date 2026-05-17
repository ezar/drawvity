import { motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { playTap } from '../engine/audio'
import { hapticTap } from '../hooks/useHaptic'
import { useGameStore } from '../store/gameStore'
import type { Difficulty, ScreenId } from '../types'

interface Props { onNav: (s: ScreenId) => void }

const CARDS = [
  { id: 'map' as ScreenId,        label: 'Play',       desc: 'Challenge levels', icon: '▶', tone: palette.primary },
  { id: 'free' as ScreenId,       label: 'Free Draw',  desc: 'Sandbox mode',     icon: '✎', tone: palette.tertiary },
  { id: 'collection' as ScreenId, label: 'Collection', desc: 'Your unlocks',     icon: '★', tone: palette.secondary },
]

const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  { id: 'easy',   label: 'Easy',   desc: '4 strokes · preview' },
  { id: 'medium', label: 'Medium', desc: '3 strokes'           },
  { id: 'hard',   label: 'Hard',   desc: '2 strokes'           },
]

export function MenuScreen({ onNav }: Props) {
  const portrait = useIsPortrait()
  const { difficulty, setDifficulty } = useGameStore()

  return (
    <div style={{
      width: '100%', height: '100%', background: palette.paper,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflowY: portrait ? 'auto' : 'hidden',
    }}>
    <div style={{
      width: '100%', maxWidth: portrait ? '100%' : 1100,
      height: portrait ? 'auto' : '100%',
      display: 'flex',
      flexDirection: portrait ? 'column' : 'row',
      gap: portrait ? 24 : 48,
      padding: portrait ? '48px 28px 32px' : '72px 80px',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* hero */}
      <div style={{
        flex: portrait ? '0 0 auto' : 1,
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: portrait ? 'center' : 'flex-start',
        textAlign: portrait ? 'center' : 'left',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft }}>
          chapter one
        </div>
        <h1 style={{
          fontFamily: 'Caprasimo, serif',
          fontSize: portrait ? 56 : 88,
          fontWeight: 400, color: palette.ink,
          lineHeight: 0.95, margin: 0,
        }}>
          Draw.<br />
          <span style={{ color: palette.primary }}>Watch.</span><br />
          <span style={{ color: palette.tertiary }}>Wonder.</span>
        </h1>
        {!portrait && (
          <p style={{ fontFamily: 'Nunito', fontSize: 16, color: palette.inkSoft, maxWidth: 340, marginTop: 6, lineHeight: 1.5 }}>
            Sketch a path. Drop a ball. The drawing comes alive — bouncing, rolling, sliding to the star.
          </p>
        )}

        {/* difficulty selector */}
        <div style={{ display: 'flex', gap: 6, marginTop: portrait ? 4 : 8 }}>
          {DIFFICULTIES.map(d => {
            const active = d.id === difficulty
            return (
              <motion.button
                key={d.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => { hapticTap(); playTap(); setDifficulty(d.id) }}
                style={{
                  padding: '7px 14px', borderRadius: 999,
                  border: active ? `2px solid ${palette.ink}` : toy.border,
                  background: active ? palette.ink : palette.paper,
                  color: active ? palette.paper : palette.inkSoft,
                  fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
                  letterSpacing: '.06em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all .15s ease',
                }}
              >
                {d.label}
                {active && d.id === 'easy' && <span style={{ marginLeft: 4, opacity: .7 }}>✎</span>}
              </motion.button>
            )
          })}
        </div>
        {difficulty === 'easy' && (
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: palette.inkSoft, opacity: .8, marginTop: 2 }}>
            trajectory preview enabled
          </div>
        )}
      </div>

      {/* nav cards */}
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        style={{
          flex: portrait ? '0 0 auto' : 1,
          display: 'flex', flexDirection: 'column',
          gap: 12, width: portrait ? '100%' : 'auto',
          maxWidth: portrait ? 380 : 420,
        }}
      >
        {CARDS.map((c) => (
          <motion.button
            key={c.id}
            variants={{ hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { hapticTap(); playTap(); onNav(c.id) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: portrait ? '16px 18px' : '20px 22px',
              background: palette.paper, color: palette.ink,
              border: toy.border, borderRadius: toy.radius,
              boxShadow: toy.shadow, cursor: 'pointer', textAlign: 'left',
              fontFamily: 'Nunito',
            }}
          >
            <div style={{
              width: portrait ? 44 : 52, height: portrait ? 44 : 52,
              borderRadius: 999, background: c.tone, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: portrait ? 18 : 22, fontFamily: 'Caprasimo, serif',
              boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.18)', flexShrink: 0,
            }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: portrait ? 20 : 24, lineHeight: 1 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: palette.inkSoft, marginTop: 4, fontFamily: 'JetBrains Mono', letterSpacing: '.08em', textTransform: 'uppercase' }}>{c.desc}</div>
            </div>
            <div style={{ fontSize: 16, color: palette.inkSoft }}>→</div>
          </motion.button>
        ))}
        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: palette.inkSoft, textAlign: 'center', opacity: .65, marginTop: 4 }}
        >
          v{__BUILD_VERSION__} · draw. watch. wonder.
        </motion.div>
      </motion.div>
    </div>
    </div>
  )
}

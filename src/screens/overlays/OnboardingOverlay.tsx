import { motion } from 'framer-motion'
import { toy, palette } from '../../theme/toy'
import { playTap } from '../../engine/audio'
import { hapticTap } from '../../hooks/useHaptic'

interface Props { onDismiss: () => void }

const STEPS = [
  { icon: '✎', title: 'Draw a path',   body: 'Sketch freehand strokes on the canvas — they become ramps and guides for the ball.' },
  { icon: '●', title: 'Launch',         body: 'Tap Launch (or tap the ball directly) to release it. Physics does the rest.' },
  { icon: '⭐', title: 'Reach the star', body: 'Guide the ball to the star to clear the level. Fewer strokes = more stars.' },
]

const TIPS = [
  '⌫ Undo removes your last stroke',
  '🎯 Easy mode shows the predicted path',
  '🔒 Earn stars to unlock new balls and ink colors',
  '↻ Retry anytime — no penalty',
]

export function OnboardingOverlay({ onDismiss }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(31,26,20,.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, zIndex: 100,
      }}
      onClick={onDismiss}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: palette.paper, borderRadius: toy.radius,
          border: toy.border, boxShadow: '0 24px 48px rgba(31,26,20,.22)',
          width: '100%', maxWidth: 400,
          padding: '28px 28px 24px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* header */}
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft, marginBottom: 6 }}>
            How to play
          </div>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 28, color: palette.ink, lineHeight: 1 }}>
            Draw. Watch. Wonder.
          </div>
        </div>

        {/* 3 steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.22 }}
              style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 999, flexShrink: 0,
                background: palette.primary, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Caprasimo, serif', fontSize: 18,
                boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.15)',
              }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 16, color: palette.ink, lineHeight: 1.1 }}>{s.title}</div>
                <div style={{ fontFamily: 'Nunito', fontSize: 13, color: palette.inkSoft, marginTop: 3, lineHeight: 1.45 }}>{s.body}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* tips */}
        <div style={{
          background: 'rgba(31,26,20,.04)', borderRadius: 12,
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {TIPS.map((t, i) => (
            <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: palette.inkSoft, letterSpacing: '.04em' }}>
              {t}
            </div>
          ))}
        </div>

        {/* dismiss */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { hapticTap(); playTap(); onDismiss() }}
          style={{
            width: '100%', height: 48,
            background: palette.ink, color: palette.paper,
            border: 'none', borderRadius: 999,
            fontFamily: 'Caprasimo, serif', fontSize: 18,
            cursor: 'pointer',
            boxShadow: '0 4px 0 rgba(0,0,0,.2)',
          }}
        >
          Got it — let's play!
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { toy, palette } from '../../theme/toy'
import { playLoss, playTap } from '../../engine/audio'
import { hapticLoss, hapticTap } from '../../hooks/useHaptic'

interface Props {
  onRetry: () => void
  onMap: () => void
}

export function LossOverlay({ onRetry, onMap }: Props) {
  useEffect(() => { playLoss(); hapticLoss() }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(31,26,20,.35)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      {/* screen shake wrapper */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0] }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 340 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
          style={{
            background: palette.paper, border: toy.border, borderRadius: toy.radius * 1.4,
            boxShadow: toy.shadow, padding: '28px 28px 24px',
            width: '100%', textAlign: 'center',
          }}
        >
          {/* sad ball face — pop in */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.15 }}
            style={{ margin: '8px auto 14px', width: 72, height: 72, position: 'relative' }}
          >
            <div style={{ width: 72, height: 72, borderRadius: 999, background: palette.primary, boxShadow: toy.shadow, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 18, top: 26, width: 8, height: 4, background: 'rgba(0,0,0,.55)', borderRadius: 4 }} />
              <div style={{ position: 'absolute', right: 18, top: 26, width: 8, height: 4, background: 'rgba(0,0,0,.55)', borderRadius: 4 }} />
              <div style={{ position: 'absolute', left: 22, top: 46, width: 26, height: 8, borderTop: '3px solid rgba(0,0,0,.45)', borderRadius: '50%' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 32, color: palette.ink, lineHeight: 1 }}>So close.</div>
            <div style={{ fontFamily: 'Nunito', fontSize: 14, color: palette.inkSoft, marginTop: 8, marginBottom: 22 }}>
              The ball missed the star. Try a different path?
            </div>
          </motion.div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => { hapticTap(); playTap(); onMap() }}
              style={{ padding: '10px 18px', borderRadius: toy.radius, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 15, boxShadow: toy.shadow }}
            >
              World map
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => { hapticTap(); playTap(); onRetry() }}
              style={{ padding: '10px 20px', borderRadius: toy.btnRadius, border: 'none', background: palette.primary, color: '#fff', cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 15, boxShadow: toy.shadow }}
            >
              Try again ↻
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

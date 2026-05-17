import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { toy, palette } from '../../theme/toy'
import { playLoss } from '../../engine/audio'

interface Props {
  onRetry: () => void
  onMap: () => void
}

export function LossOverlay({ onRetry, onMap }: Props) {
  useEffect(() => { playLoss() }, [])
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(31,26,20,.35)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          background: palette.paper, border: toy.border, borderRadius: toy.radius * 1.4,
          boxShadow: toy.shadow, padding: '28px 32px 26px',
          maxWidth: 340, width: '100%', textAlign: 'center',
        }}
      >
        {/* sad ball face */}
        <div style={{ margin: '8px auto 14px', width: 72, height: 72, position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: palette.primary, boxShadow: toy.shadow, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 18, top: 26, width: 8, height: 4, background: 'rgba(0,0,0,.55)', borderRadius: 4 }} />
            <div style={{ position: 'absolute', right: 18, top: 26, width: 8, height: 4, background: 'rgba(0,0,0,.55)', borderRadius: 4 }} />
            <div style={{ position: 'absolute', left: 22, top: 46, width: 26, height: 8, borderTop: '3px solid rgba(0,0,0,.45)', borderRadius: '50%' }} />
          </div>
        </div>

        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 32, color: palette.ink, lineHeight: 1 }}>So close.</div>
        <div style={{ fontFamily: 'Nunito', fontSize: 14, color: palette.inkSoft, marginTop: 8, marginBottom: 22 }}>
          The ball missed the star. Try a different path?
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onMap} style={{ padding: '10px 18px', borderRadius: toy.radius, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 15, boxShadow: toy.shadow }}>
            World map
          </button>
          <button onClick={onRetry} style={{ padding: '10px 20px', borderRadius: toy.btnRadius, border: 'none', background: palette.primary, color: '#fff', cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 15, boxShadow: toy.shadow }}>
            Try again ↻
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

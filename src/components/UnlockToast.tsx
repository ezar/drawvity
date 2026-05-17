import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { palette, toy } from '../theme/toy'
import { useGameStore } from '../store/gameStore'
import { playUnlock } from '../engine/audio'
import { hapticWin } from '../hooks/useHaptic'

const DURATION = 3500 // ms before auto-dismiss

export function UnlockToast() {
  const { unlockToast, clearUnlockToast } = useGameStore()

  useEffect(() => {
    if (!unlockToast) return
    playUnlock()
    hapticWin()
    const t = setTimeout(clearUnlockToast, DURATION)
    return () => clearTimeout(t)
  }, [unlockToast, clearUnlockToast])

  return (
    <AnimatePresence>
      {unlockToast && (
        <motion.div
          initial={{ opacity: 0, y: -32, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={clearUnlockToast}
          style={{
            position: 'fixed', top: 16, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999, cursor: 'pointer',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: palette.ink, color: palette.paper,
            borderRadius: 999, padding: '10px 18px 10px 12px',
            boxShadow: `0 8px 24px rgba(31,26,20,.35), ${toy.shadow}`,
            border: `1.5px solid rgba(255,255,255,.1)`,
            whiteSpace: 'nowrap',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999, flexShrink: 0,
              background: palette.secondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {unlockToast.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .6, marginBottom: 2 }}>
                Unlocked!
              </div>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 16, lineHeight: 1 }}>
                {unlockToast.name}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, opacity: .55, marginTop: 2 }}>
                {unlockToast.detail}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

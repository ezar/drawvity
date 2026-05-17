import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toy, palette } from '../../theme/toy'

interface Props {
  strokesUsed: number
  strokesMax: number
  onImprove: () => void
  onNext: () => void
}

function Star({ shown, color }: { shown: boolean; color: string }) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.42
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    pts.push(`${Math.cos(a) * r * 28},${Math.sin(a) * r * 28}`)
  }
  return (
    <motion.svg
      width={56} height={56} viewBox="-28 -28 56 56"
      initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
      animate={shown ? { scale: 1, opacity: 1, rotate: 0 } : { scale: 0.4, opacity: 0.18, rotate: -30 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
    >
      <polygon points={pts.join(' ')} fill={shown ? color : 'rgba(31,26,20,.18)'} stroke="rgba(31,26,20,.35)" strokeWidth="1.2" />
    </motion.svg>
  )
}

export function WinOverlay({ strokesUsed, strokesMax, onImprove, onNext }: Props) {
  const [shown, setShown] = useState(0)
  const stars = strokesUsed === 1 ? 3 : strokesUsed === 2 ? 2 : 1

  useEffect(() => {
    const t1 = setTimeout(() => setShown(1), 250)
    const t2 = setTimeout(() => setShown(2), 600)
    const t3 = setTimeout(() => setShown(3), 950)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(31,26,20,.45)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          background: palette.paper, border: toy.border, borderRadius: toy.radius * 1.4,
          boxShadow: toy.shadow, padding: '32px 32px 28px',
          maxWidth: 380, width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: palette.inkSoft, letterSpacing: '.15em', textTransform: 'uppercase' }}>level cleared</div>
        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 44, color: palette.ink, lineHeight: 1, marginTop: 6 }}>Nice one!</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '22px 0 18px' }}>
          {[1, 2, 3].map((i) => (
            <Star key={i} shown={shown >= i} color={palette.secondary} />
          ))}
        </div>

        <div style={{ fontFamily: 'Nunito', fontSize: 13, color: palette.inkSoft, marginBottom: 22 }}>
          {stars === 3 ? 'Perfect — 1 stroke!' : `${strokesUsed} of ${strokesMax} strokes used`}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onImprove} style={{ padding: '10px 18px', borderRadius: toy.radius, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 15, boxShadow: toy.shadow }}>
            Improve
          </button>
          <button onClick={onNext} style={{ padding: '10px 20px', borderRadius: toy.btnRadius, border: 'none', background: palette.primary, color: '#fff', cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 15, boxShadow: toy.shadow }}>
            Next level →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

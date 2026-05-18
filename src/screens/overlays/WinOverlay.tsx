import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { toy, palette } from '../../theme/toy'
import { useIsPortrait } from '../../hooks/useIsPortrait'
import { playWin, playTap } from '../../engine/audio'
import { hapticWin, hapticTap } from '../../hooks/useHaptic'

interface Props {
  strokesUsed: number
  strokesMax: number
  onImprove: () => void
  onNext: () => void
  onShare: () => void
  autoAdvanceSecs?: number   // if set, auto-clicks Next after N seconds
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

const COUNTDOWN_DELAY = 1200 // ms after last star before countdown starts

export function WinOverlay({ strokesUsed, strokesMax, onImprove, onNext, onShare, autoAdvanceSecs = 4 }: Props) {
  const portrait = useIsPortrait()
  const [shown, setShown] = useState(0)
  const [countdown, setCountdown] = useState(autoAdvanceSecs)
  const [countdownActive, setCountdownActive] = useState(false)
  const cancelledRef = useRef(false)
  const stars = strokesUsed === 1 ? 3 : strokesUsed === 2 ? 2 : 1

  useEffect(() => {
    playWin(); hapticWin()
    const t1 = setTimeout(() => { setShown(1); playTap() }, 250)
    const t2 = setTimeout(() => { setShown(2); playTap() }, 600)
    const t3 = setTimeout(() => { setShown(3); playTap() }, 950)
    // start countdown after stars finish
    const t4 = setTimeout(() => {
      if (!cancelledRef.current) setCountdownActive(true)
    }, COUNTDOWN_DELAY)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  // countdown tick
  useEffect(() => {
    if (!countdownActive) return
    if (countdown <= 0) { onNext(); return }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdownActive, countdown, onNext])

  const cancelAndRun = (fn: () => void) => {
    cancelledRef.current = true
    setCountdownActive(false)
    fn()
  }

  // progress fraction for SVG ring (0 → 1 as time runs out)
  const progress = countdownActive ? 1 - countdown / autoAdvanceSecs : 0
  const R = 18
  const circ = 2 * Math.PI * R
  const dash = progress * circ

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
          boxShadow: toy.shadow,
          padding: portrait ? '24px 20px 20px' : '32px 32px 28px',
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
          {stars === 3 ? 'Perfect — 1 stroke!' : isFinite(strokesMax) ? `${strokesUsed} of ${strokesMax} strokes used` : `${strokesUsed} stroke${strokesUsed !== 1 ? 's' : ''} used`}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => { hapticTap(); playTap(); cancelAndRun(onImprove) }}
            style={{ padding: '10px 16px', borderRadius: toy.radius, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 14, boxShadow: toy.shadow }}>
            Improve
          </motion.button>
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => { hapticTap(); playTap(); cancelAndRun(onShare) }}
            style={{ padding: '10px 16px', borderRadius: toy.radius, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 14, boxShadow: toy.shadow }}>
            Share 📤
          </motion.button>

          {/* Next button with countdown ring */}
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => { hapticTap(); playTap(); cancelAndRun(onNext) }}
            style={{ padding: '10px 16px', borderRadius: toy.btnRadius, border: 'none', background: palette.primary, color: '#fff', cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 14, boxShadow: toy.shadow, position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Next →
            {/* countdown ring overlay */}
            {countdownActive && (
              <svg width={40} height={40} style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', overflow: 'visible', pointerEvents: 'none' }}>
                <circle cx={20} cy={20} r={R} fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.25)" strokeWidth={2.5} />
                <circle
                  cx={20} cy={20} r={R}
                  fill="none" stroke="#fff" strokeWidth={2.5}
                  strokeDasharray={`${dash} ${circ}`}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                  style={{ transition: 'stroke-dasharray 1s linear' }}
                />
                <text x={20} y={20} textAnchor="middle" dominantBaseline="central"
                  style={{ fill: '#fff', fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
                  {countdown}
                </text>
              </svg>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

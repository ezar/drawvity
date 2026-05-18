import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { playTap } from '../engine/audio'
import { hapticTap } from '../hooks/useHaptic'
import type { Point } from '../types'

interface Props {
  canvasW: number
  canvasH: number
  onAddShape: (pts: Point[]) => void
  strokesCount: number
  strokesMax: number
  disabled: boolean
  textColor: string
  panelBg: string
}

// Normalized 0–1 shapes (pts used as polyline; special ids handled separately)
const SHAPES: { id: string; label: string; pts: Point[]; isCircle?: boolean; circleR?: number }[] = [
  {
    id: 'shelf',
    label: 'Shelf',
    pts: [{ x: 0.15, y: 0.45 }, { x: 0.82, y: 0.45 }],
  },
  {
    id: 'ramp-up',
    label: 'Ramp ↗',
    pts: [{ x: 0.1, y: 0.72 }, { x: 0.82, y: 0.22 }],
  },
  {
    id: 'ramp-down',
    label: 'Ramp ↘',
    pts: [{ x: 0.1, y: 0.22 }, { x: 0.82, y: 0.72 }],
  },
  {
    id: 'valley',
    label: 'Valley',
    pts: [{ x: 0.08, y: 0.25 }, { x: 0.45, y: 0.72 }, { x: 0.85, y: 0.25 }],
  },
  {
    id: 'hill',
    label: 'Hill',
    pts: [{ x: 0.08, y: 0.72 }, { x: 0.45, y: 0.22 }, { x: 0.85, y: 0.72 }],
  },
  {
    id: 'steps',
    label: 'Steps',
    pts: [
      { x: 0.08, y: 0.28 }, { x: 0.33, y: 0.28 },
      { x: 0.33, y: 0.5  }, { x: 0.58, y: 0.5  },
      { x: 0.58, y: 0.72 }, { x: 0.85, y: 0.72 },
    ],
  },
  {
    id: 'corner',
    label: 'Corner',
    pts: [{ x: 0.15, y: 0.2 }, { x: 0.15, y: 0.78 }, { x: 0.82, y: 0.78 }],
  },
  {
    id: 'arch',
    label: 'Arch',
    pts: [
      { x: 0.12, y: 0.78 }, { x: 0.18, y: 0.35 },
      { x: 0.5,  y: 0.15 },
      { x: 0.82, y: 0.35 }, { x: 0.88, y: 0.78 },
    ],
  },
  {
    id: 'wall',
    label: 'Wall',
    pts: [{ x: 0.5, y: 0.1 }, { x: 0.5, y: 0.78 }],
  },
  {
    id: 'bumper-lg',
    label: 'Bumper',
    pts: [], isCircle: true, circleR: 0.12,
  },
  {
    id: 'bumper-sm',
    label: 'Mini Bump',
    pts: [], isCircle: true, circleR: 0.07,
  },
  {
    id: 'wedge-l',
    label: 'Wedge ◁',
    pts: [{ x: 0.15, y: 0.75 }, { x: 0.15, y: 0.2 }, { x: 0.82, y: 0.75 }],
  },
  {
    id: 'wedge-r',
    label: 'Wedge ▷',
    pts: [{ x: 0.85, y: 0.75 }, { x: 0.85, y: 0.2 }, { x: 0.18, y: 0.75 }],
  },
]

/** Mini SVG preview of a shape */
function ShapePreview({ pts, color, isCircle }: { pts: Point[]; color: string; isCircle?: boolean }) {
  const W = 36, H = 28
  if (isCircle) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <circle cx={W/2} cy={H/2} r={10} fill={color + '30'} stroke={color} strokeWidth={2} />
        <circle cx={W/2} cy={H/2} r={5}  fill="none"         stroke={color} strokeWidth={1.5} strokeDasharray="2 2" />
      </svg>
    )
  }
  const isClosed = pts.length >= 3
  const points = pts.map(p => `${p.x * W},${p.y * H}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {isClosed
        ? <polygon points={points} fill={color + '25'} stroke={color} strokeWidth={2} strokeLinejoin="round" />
        : <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>
  )
}

export function ShapesPalette({ canvasW, canvasH, onAddShape, strokesCount, strokesMax, disabled, textColor, panelBg }: Props) {
  const [open, setOpen] = useState(false)
  const canAdd = !disabled && strokesCount < strokesMax

  const add = (shape: typeof SHAPES[number]) => {
    if (!canAdd) return
    hapticTap(); playTap()

    if (shape.isCircle && shape.circleR) {
      // Approximate circle as 24-point polygon (closed polyline)
      const cx = 0.5 * canvasW, cy = 0.45 * canvasH
      const r  = shape.circleR * Math.min(canvasW, canvasH)
      const N  = 24
      const px = Array.from({ length: N + 1 }, (_, i) => ({
        x: cx + r * Math.cos(i / N * 2 * Math.PI),
        y: cy + r * Math.sin(i / N * 2 * Math.PI),
      }))
      onAddShape(px)
    } else if (shape.pts.length >= 3) {
      // Triangle: close the polygon
      const px = shape.pts.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }))
      onAddShape([...px, px[0]])
    } else {
      const px = shape.pts.map(p => ({ x: p.x * canvasW, y: p.y * canvasH }))
      onAddShape(px)
    }
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => { hapticTap(); playTap(); setOpen(o => !o) }}
        title="Add preset shape"
        style={{
          width: 40, height: 40, borderRadius: 999,
          border: open ? `2px solid ${palette.primary}` : toy.border,
          background: open ? `${palette.primary}18` : panelBg,
          color: open ? palette.primary : textColor,
          cursor: 'pointer', fontSize: 18, boxShadow: toy.shadow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border .15s, color .15s',
        }}
      >
        ⬡
      </motion.button>

      {/* Shapes panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', bottom: '100%', left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 8,
              background: panelBg, border: toy.border, borderRadius: 16,
              boxShadow: '0 8px 24px rgba(31,26,20,.18)',
              padding: 10,
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
              zIndex: 50,
            }}
          >
            {SHAPES.map(shape => {
              const clickable = canAdd
              return (
                <motion.button
                  key={shape.id}
                  whileTap={clickable ? { scale: 0.88 } : {}}
                  onClick={() => add(shape)}
                  title={shape.label}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '6px 8px', borderRadius: 10,
                    border: toy.border, background: clickable ? palette.paper : 'transparent',
                    cursor: clickable ? 'pointer' : 'not-allowed',
                    opacity: clickable ? 1 : 0.35,
                    boxShadow: clickable ? toy.shadow : 'none',
                  }}
                >
                  <ShapePreview pts={shape.pts} color={clickable ? palette.ink : palette.inkSoft} isCircle={shape.isCircle} />
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: palette.inkSoft, whiteSpace: 'nowrap' }}>
                    {shape.label}
                  </span>
                </motion.button>
              )
            })}
            {/* hint */}
            {!canAdd && (
              <div style={{ gridColumn: '1 / -1', fontFamily: 'JetBrains Mono', fontSize: 9, color: palette.inkSoft, textAlign: 'center', paddingTop: 2 }}>
                Max strokes reached
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

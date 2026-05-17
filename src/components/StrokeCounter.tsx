import { toy, palette } from '../theme/toy'

interface Props {
  max: number
  used: number
}

export function StrokeCounter({ max, used }: Props) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 14px',
      background: palette.paper,
      border: toy.border, borderRadius: 999,
      boxShadow: toy.shadow,
    }}>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .65, color: palette.ink }}>strokes</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: max }).map((_, i) => {
          const isUsed = i < used
          return (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: 999,
              background: isUsed ? 'transparent' : palette.ink,
              border: `2px solid ${palette.ink}`,
              opacity: isUsed ? 0.3 : 1,
              transition: 'all .2s ease',
              transform: isUsed ? 'scale(.7)' : 'scale(1)',
            }} />
          )
        })}
      </div>
    </div>
  )
}

import { toy, palette } from '../theme/toy'
import type { ScreenId } from '../types'

interface Props { onNav: (s: ScreenId) => void }

const CARDS = [
  { id: 'map' as ScreenId,        label: 'Play',       desc: 'Challenge levels', icon: '▶', tone: palette.primary },
  { id: 'free' as ScreenId,       label: 'Free Draw',  desc: 'Sandbox mode',     icon: '✎', tone: palette.tertiary },
  { id: 'collection' as ScreenId, label: 'Collection', desc: 'Your unlocks',     icon: '★', tone: palette.secondary },
]

export function MenuScreen({ onNav }: Props) {
  return (
    <div style={{
      width: '100%', height: '100%', background: palette.paper,
      display: 'flex', flexDirection: 'row',
      gap: 48, padding: '72px 80px',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {/* hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft }}>chapter one</div>
        <h1 style={{ fontFamily: 'Caprasimo, serif', fontSize: 88, fontWeight: 400, color: palette.ink, lineHeight: 0.95, margin: 0 }}>
          Draw.<br />
          <span style={{ color: palette.primary }}>Watch.</span><br />
          <span style={{ color: palette.tertiary }}>Wonder.</span>
        </h1>
        <p style={{ fontFamily: 'Nunito', fontSize: 16, color: palette.inkSoft, maxWidth: 340, marginTop: 6, lineHeight: 1.5 }}>
          Sketch a path. Drop a ball. The drawing comes alive — bouncing, rolling, sliding to the star.
        </p>
      </div>

      {/* nav cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
        {CARDS.map((c) => (
          <button
            key={c.id}
            onClick={() => onNav(c.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 18,
              padding: '20px 22px', background: palette.paper, color: palette.ink,
              border: toy.border, borderRadius: toy.radius,
              boxShadow: toy.shadow, cursor: 'pointer', textAlign: 'left',
              transition: 'transform .14s ease',
              fontFamily: 'Nunito',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(4px)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'none' }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: 999,
              background: c.tone, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontFamily: 'Caprasimo, serif',
              boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.18)', flexShrink: 0,
            }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 24, lineHeight: 1 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: palette.inkSoft, marginTop: 4, fontFamily: 'JetBrains Mono', letterSpacing: '.08em', textTransform: 'uppercase' }}>{c.desc}</div>
            </div>
            <div style={{ fontSize: 18, color: palette.inkSoft }}>→</div>
          </button>
        ))}
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: palette.inkSoft, textAlign: 'center', opacity: .65 }}>
          v0.1 · draw. watch. wonder.
        </div>
      </div>
    </div>
  )
}

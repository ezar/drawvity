import { toy, palette } from '../theme/toy'
import { BALLS } from '../data/balls'
import { useGameStore } from '../store/gameStore'

interface Props { onBack: () => void }

const STROKE_COLORS = [
  { id: 'ink',     hex: palette.ink,       name: 'Pencil ink' },
  { id: 'primary', hex: palette.primary,   name: 'Coral marker' },
  { id: 'second',  hex: palette.secondary, name: 'Mustard chalk' },
  { id: 'third',   hex: palette.tertiary,  name: 'Cobalt pen' },
  { id: 'accent',  hex: '#5BB390',         name: 'Mint liner' },
  { id: 'rose',    hex: '#F4D8E4',         name: 'Rose pastel' },
  { id: 'neon',    hex: '#A0FF00',         name: 'Neon glow' },
  { id: 'rainbow', hex: 'linear-gradient(90deg,#E25C3B,#E8B73E,#5BB390,#2E5BB8)', name: 'Rainbow' },
]

const UNLOCK_AT_STARS = [0, 0, 0, 0, 10, 20, 30, 40]

export function CollectionScreen({ onBack }: Props) {
  const { unlockedBalls, unlockedColors, progress } = useGameStore()
  const totalStarsAll = Object.values(progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)
  const unlockedColorIds = STROKE_COLORS
    .filter((_, i) => totalStarsAll >= UNLOCK_AT_STARS[i])
    .map(c => c.id)

  return (
    <div style={{ width: '100%', height: '100%', background: palette.paper, display: 'flex', flexDirection: 'column', padding: '28px 40px 24px', gap: 20, overflow: 'auto' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontSize: 18, boxShadow: toy.shadow }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft }}>your collection</div>
          <h2 style={{ fontFamily: 'Caprasimo, serif', fontSize: 38, fontWeight: 400, color: palette.ink, margin: 0, lineHeight: 1 }}>Sticker album</h2>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: palette.inkSoft }}>{unlockedBalls.length + unlockedColorIds.length} / {BALLS.length + STROKE_COLORS.length} unlocked</div>
      </div>

      {/* balls */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22, color: palette.ink }}>Balls</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: palette.inkSoft }}>{unlockedBalls.length} / {BALLS.length}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {BALLS.map((b) => {
            const unlocked = unlockedBalls.includes(b.id)
            return (
              <div key={b.id} style={{ padding: 14, background: palette.paper, border: toy.border, borderRadius: toy.radius, boxShadow: toy.shadow, opacity: unlocked ? 1 : .6, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 999, background: unlocked ? b.color : 'rgba(31,26,20,.12)', margin: '0 auto 10px', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!unlocked && <span style={{ fontSize: 20 }}>🔒</span>}
                  {unlocked && <div style={{ width: 14, height: 14, borderRadius: 999, background: 'rgba(255,255,255,.45)', marginLeft: -12, marginTop: -10 }} />}
                </div>
                <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 14, color: palette.ink }}>{b.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: palette.inkSoft, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>{unlocked ? b.hint : 'locked'}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* stroke colors */}
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22, color: palette.ink }}>Stroke colors</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: palette.inkSoft }}>{unlockedColorIds.length} / {STROKE_COLORS.length}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
          {STROKE_COLORS.map((s, i) => {
            const unlocked = unlockedColorIds.includes(s.id)
            return (
              <div key={s.id} style={{ padding: 10, background: palette.paper, border: toy.border, borderRadius: toy.radius, boxShadow: toy.shadow, opacity: unlocked ? 1 : .5, textAlign: 'center' }}>
                <div style={{ width: '100%', height: 32, borderRadius: toy.radius - 4, background: unlocked ? s.hex : 'rgba(31,26,20,.1)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!unlocked && <span style={{ fontSize: 12 }}>🔒</span>}
                  {!unlocked && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: palette.inkSoft, marginLeft: 4 }}>{UNLOCK_AT_STARS[i]}★</div>}
                </div>
                <div style={{ fontFamily: 'Nunito', fontSize: 10, color: palette.inkSoft, fontWeight: 600 }}>{s.name}</div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

import { motion } from 'framer-motion'
import { toy, palette } from '../theme/toy'
import { useGameStore } from '../store/gameStore'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { playTap } from '../engine/audio'
import { hapticTap } from '../hooks/useHaptic'
import { STROKE_COLORS } from '../data/colors'
import { ACHIEVEMENTS } from '../data/achievements'
import { WORLDS } from '../data/worlds'

interface Props { onBack: () => void }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: palette.paper, border: toy.border, borderRadius: toy.radius,
      boxShadow: toy.shadow, padding: '14px 16px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 28, color: palette.ink, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: palette.primary, letterSpacing: '.08em', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: palette.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  )
}

export function StatsScreen({ onBack }: Props) {
  const portrait = useIsPortrait()
  const { progress, unlockedBalls, dailyResults, dailyStreak, customLevels, unlockedAchievements, personalBests } = useGameStore()

  // ── Computed stats ─────────────────────────────────────────────────────────
  const allStars      = WORLDS.flatMap(w => progress[w.id]?.stars ?? [])
  const totalStars    = allStars.reduce((a, b) => a + b, 0)
  const levelsCompleted = allStars.filter(s => s > 0).length
  const perfectLevels   = allStars.filter(s => s === 3).length
  const maxStars        = 60 * 3

  const totalStarsAll = totalStars
  const colorsUnlocked = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars).length

  const perfectStrokes = Object.values(personalBests).filter(v => v === 1).length
  const dailiesCount   = Object.keys(dailyResults).length

  return (
    <div style={{
      width: '100%', height: '100%', background: palette.paper,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'auto',
    }}>
    <div style={{
      width: '100%', maxWidth: portrait ? '100%' : 860,
      padding: portrait ? '20px 16px 32px' : '28px 40px 40px',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => { hapticTap(); playTap(); onBack() }}
          aria-label="Back"
          style={{ width: 40, height: 40, borderRadius: 999, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontSize: 18, boxShadow: toy.shadow, flexShrink: 0 }}
        >←</motion.button>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft }}>your progress</div>
          <h2 style={{ fontFamily: 'Caprasimo, serif', fontSize: portrait ? 28 : 36, fontWeight: 400, color: palette.ink, margin: 0, lineHeight: 1 }}>Stats</h2>
        </div>
      </div>

      {/* stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${portrait ? 2 : 4}, 1fr)`, gap: 10 }}>
        <StatCard label="Levels done"    value={levelsCompleted}  sub={`/ 60`} />
        <StatCard label="Perfect (3★)"   value={perfectLevels}    sub={`/ 60`} />
        <StatCard label="Total stars"    value={totalStars}        sub={`/ ${maxStars}`} />
        <StatCard label="1-stroke clears" value={perfectStrokes}  />
        <StatCard label="Daily streak"   value={`${dailyStreak > 0 ? '🔥' : '—'} ${dailyStreak}`} />
        <StatCard label="Dailies done"   value={dailiesCount} />
        <StatCard label="Balls unlocked" value={`${unlockedBalls.length} / 6`} />
        <StatCard label="Colors unlocked" value={`${colorsUnlocked} / 7`} />
        {customLevels.length > 0 && (
          <StatCard label="Custom levels" value={customLevels.length} />
        )}
        <StatCard label="Achievements"  value={`${unlockedAchievements.length} / ${ACHIEVEMENTS.length}`} />
      </div>

      {/* achievements */}
      <div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: palette.inkSoft, marginBottom: 12 }}>
          Achievements
        </div>
        <motion.div
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${portrait ? 2 : 4}, 1fr)`, gap: 8 }}
        >
          {ACHIEVEMENTS.map(ach => {
            const done = unlockedAchievements.includes(ach.id)
            return (
              <motion.div
                key={ach.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: done ? `${palette.secondary}18` : palette.paper,
                  border: done ? `1.5px solid ${palette.secondary}55` : toy.border,
                  borderRadius: toy.radius, boxShadow: toy.shadow,
                  opacity: done ? 1 : 0.45,
                }}
              >
                <span style={{ fontSize: 22, filter: done ? 'none' : 'grayscale(1)', flexShrink: 0 }}>{ach.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 13, color: palette.ink, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ach.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: palette.inkSoft, marginTop: 2, lineHeight: 1.3 }}>{ach.desc}</div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
    </div>
  )
}

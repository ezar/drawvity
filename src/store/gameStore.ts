import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioEnabled } from '../engine/audio'
import { WORLD_MAP, WORLDS } from '../data/worlds'
import { STROKE_COLORS } from '../data/colors'
import { ACHIEVEMENTS } from '../data/achievements'
import type { WorldId, BallId, ScreenId, Progress, Difficulty, CustomLevel, DailyResult } from '../types'

export interface UnlockToast { icon: string; name: string; detail: string }

const WORLD_ORDER: WorldId[] = ['lab', 'factory', 'castle', 'space']
const UNLOCK_THRESHOLD = 15

function emptyProgress(): Progress {
  return { stars: Array(15).fill(0) as number[] }
}

const initialData = {
  screen: 'menu' as ScreenId,
  currentWorld: 'lab' as WorldId,
  currentLevel: 0,
  selectedBall: 'classic' as BallId,
  selectedColorId: 'ink' as string,
  difficulty: 'medium' as Difficulty,
  hasSeenOnboarding: false,
  audioEnabled: true,
  unlockToast: null as UnlockToast | null,
  customLevels: [] as CustomLevel[],
  playingCustomId: null as string | null,
  dailyResults: {} as Record<string, DailyResult>,
  dailyStreak: 0,
  lastDailyDate: null as string | null,
  personalBests: {} as Record<string, number>,      // `${world}-${level}` → min strokes
  unlockedAchievements: [] as string[],
  progress: {
    lab:     emptyProgress(),
    factory: emptyProgress(),
    castle:  emptyProgress(),
    space:   emptyProgress(),
  } as Record<WorldId, Progress>,
  unlockedBalls:  ['classic', 'heavy', 'bouncy', 'feather'] as BallId[],
  unlockedColors: ['ink', 'primary', 'secondary', 'tertiary'] as string[],
}

// ── Achievement checker ────────────────────────────────────────────────────────
function checkAchievements(
  get: () => typeof initialData & GameState,
  set: (p: Partial<typeof initialData & GameState>) => void
) {
  const s = get()
  const newUnlocked = [...s.unlockedAchievements]
  let toast: UnlockToast | null = null

  const unlock = (id: string) => {
    if (newUnlocked.includes(id)) return
    const ach = ACHIEVEMENTS.find(a => a.id === id)
    if (!ach) return
    newUnlocked.push(id)
    if (!toast) toast = { icon: ach.icon, name: ach.name, detail: ach.desc }
  }

  const allStars = WORLD_ORDER.flatMap(w => s.progress[w]?.stars ?? [])
  const totalStarsAll = allStars.reduce((a, b) => a + b, 0)
  const perfCounts = Object.values(s.personalBests).filter(v => v === 1).length

  if (perfCounts >= 1) unlock('one-stroke')
  if (perfCounts >= 5) unlock('five-perfect')

  for (const wid of WORLD_ORDER) {
    const ws = s.progress[wid]?.stars ?? []
    if (ws.length === 15 && ws.every(st => st === 3)) unlock(`perfect-${wid}`)
  }

  if (allStars.length === 60 && allStars.every(st => st === 3)) unlock('grand-master')
  if (allStars.filter(st => st > 0).length >= 60) unlock('completionist')

  const dailyCount = Object.keys(s.dailyResults).length
  if (dailyCount >= 1) unlock('daily-first')
  if (s.dailyStreak >= 7) unlock('daily-7')
  if (s.dailyStreak >= 30) unlock('daily-30')

  if (s.unlockedBalls.length >= 6) unlock('ball-collector')

  const unlockedColorCount = STROKE_COLORS.filter(c => totalStarsAll >= c.unlockStars).length
  if (unlockedColorCount >= 7) unlock('rainbow')

  if (s.customLevels.length >= 1) unlock('level-creator')

  if (newUnlocked.length !== s.unlockedAchievements.length) {
    set({ unlockedAchievements: newUnlocked, ...(toast && !s.unlockToast ? { unlockToast: toast } : {}) })
  }
}

interface GameState {
  screen: ScreenId
  currentWorld: WorldId
  currentLevel: number
  selectedBall: BallId
  selectedColorId: string
  difficulty: Difficulty
  progress: Record<WorldId, Progress>
  unlockedBalls: BallId[]
  unlockedColors: string[]
  hasSeenOnboarding: boolean
  audioEnabled: boolean
  unlockToast: UnlockToast | null
  customLevels: CustomLevel[]
  playingCustomId: string | null
  dailyResults: Record<string, DailyResult>
  dailyStreak: number
  lastDailyDate: string | null
  personalBests: Record<string, number>
  unlockedAchievements: string[]

  totalStars: (world: WorldId) => number
  isWorldUnlocked: (world: WorldId) => boolean

  setScreen: (s: ScreenId) => void
  setWorld: (w: WorldId) => void
  setLevel: (n: number) => void
  selectBall: (b: BallId) => void
  selectColor: (id: string) => void
  setDifficulty: (d: Difficulty) => void
  setAudio: (enabled: boolean) => void
  recordResult: (world: WorldId, level: number, stars: number, strokesUsed?: number) => void
  setSeenOnboarding: () => void
  clearUnlockToast: () => void
  saveCustomLevel: (lvl: CustomLevel) => void
  deleteCustomLevel: (id: string) => void
  playCustomLevel: (id: string) => void
  recordDailyResult: (dateStr: string, stars: number, strokes: number) => void
  getInitialState: () => typeof initialData
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialData,

      getInitialState: () => initialData,

      totalStars: (world) =>
        get().progress[world].stars.reduce((a, b) => a + b, 0),

      isWorldUnlocked: (world) => {
        const idx = WORLD_ORDER.indexOf(world)
        if (idx === 0) return true
        const prev = WORLD_ORDER[idx - 1]
        return get().totalStars(prev) >= UNLOCK_THRESHOLD
      },

      setSeenOnboarding: () => set({ hasSeenOnboarding: true }),
      clearUnlockToast: () => set({ unlockToast: null }),
      setAudio: (enabled) => { setAudioEnabled(enabled); set({ audioEnabled: enabled }) },
      setScreen: (screen) => set({ screen }),
      setWorld: (currentWorld) => set({ currentWorld }),
      setLevel: (currentLevel) => set({ currentLevel }),
      selectBall: (selectedBall) => set({ selectedBall }),
      selectColor: (selectedColorId) => set({ selectedColorId }),
      setDifficulty: (difficulty) => set({ difficulty }),

      saveCustomLevel: (lvl) => {
        set(s => ({ customLevels: [...s.customLevels.filter(c => c.id !== lvl.id), lvl] }))
        checkAchievements(get, set)
      },
      deleteCustomLevel: (id) => set(s => ({ customLevels: s.customLevels.filter(c => c.id !== id) })),
      playCustomLevel: (id) => set({ playingCustomId: id, screen: 'custom' }),

      recordDailyResult: (dateStr, stars, strokes) => {
        const s = get()
        if (s.dailyResults[dateStr]) return
        const newResults = { ...s.dailyResults, [dateStr]: { stars, strokes } }
        let streak = 1
        const check = new Date(dateStr)
        check.setDate(check.getDate() - 1)
        while (true) {
          const prev = check.toISOString().slice(0, 10)
          if (newResults[prev]) { streak++; check.setDate(check.getDate() - 1) } else break
        }
        set({ dailyResults: newResults, dailyStreak: streak, lastDailyDate: dateStr })
        checkAchievements(get, set)
      },

      recordResult: (world, level, stars, strokesUsed?) => {
        const prev = get().progress[world].stars[level] ?? 0
        if (stars <= prev) return

        const prevWorldStars = get().progress[world].stars.reduce((a, b) => a + b, 0)
        const prevTotal = Object.values(get().progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)

        const updated = [...get().progress[world].stars]
        updated[level] = stars
        const newProgress = { ...get().progress, [world]: { stars: updated } }

        // ── Personal best ─────────────────────────────────────────────────────
        const pbKey = `${world}-${level}`
        const newBests = { ...get().personalBests }
        if (strokesUsed !== undefined && (newBests[pbKey] === undefined || strokesUsed < newBests[pbKey])) {
          newBests[pbKey] = strokesUsed
        }

        set({ progress: newProgress, personalBests: newBests })

        const newWorldStars = prevWorldStars + (stars - prev)
        const newTotal      = prevTotal + (stars - prev)

        let toast: UnlockToast | null = null

        // ── Ball unlocks ───────────────────────────────────────────────────────
        const unlocked = [...get().unlockedBalls]
        if (newTotal >= 20 && !unlocked.includes('magnet')) {
          unlocked.push('magnet')
          toast = { icon: '🧲', name: 'Magnet Ball', detail: 'Pulls toward surfaces' }
        }
        if (newTotal >= 40 && !unlocked.includes('comet')) {
          unlocked.push('comet')
          toast = { icon: '☄️', name: 'Comet Ball', detail: 'Fast & fiery trail' }
        }
        set({ unlockedBalls: unlocked })

        // ── Color unlocks ──────────────────────────────────────────────────────
        if (!toast) {
          for (const c of STROKE_COLORS) {
            if (c.unlockStars > 0 && prevTotal < c.unlockStars && newTotal >= c.unlockStars) {
              toast = { icon: '🖌️', name: c.name, detail: 'New ink color unlocked!' }
              break
            }
          }
        }

        // ── World unlock ───────────────────────────────────────────────────────
        if (!toast) {
          const worldIdx = WORLDS.findIndex(w => w.id === world)
          const nextWorld = WORLDS[worldIdx + 1]
          if (nextWorld && prevWorldStars < UNLOCK_THRESHOLD && newWorldStars >= UNLOCK_THRESHOLD) {
            const def = WORLD_MAP[nextWorld.id]
            toast = { icon: def.glyph, name: `${def.name} unlocked!`, detail: def.subtitle }
          }
        }

        if (toast) set({ unlockToast: toast })
        checkAchievements(get, set)
      },
    }),
    {
      name: 'drawvity-v1',
      partialize: (s) => ({
        progress:               s.progress,
        unlockedBalls:          s.unlockedBalls,
        unlockedColors:         s.unlockedColors,
        selectedBall:           s.selectedBall,
        selectedColorId:        s.selectedColorId,
        difficulty:             s.difficulty,
        hasSeenOnboarding:      s.hasSeenOnboarding,
        audioEnabled:           s.audioEnabled,
        customLevels:           s.customLevels,
        dailyResults:           s.dailyResults,
        dailyStreak:            s.dailyStreak,
        lastDailyDate:          s.lastDailyDate,
        personalBests:          s.personalBests,
        unlockedAchievements:   s.unlockedAchievements,
      }),
    }
  )
)

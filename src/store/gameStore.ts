import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioEnabled } from '../engine/audio'
import { WORLD_MAP, WORLDS } from '../data/worlds'
import { STROKE_COLORS } from '../data/colors'
import type { WorldId, BallId, ScreenId, Progress, Difficulty, CustomLevel } from '../types'

export interface UnlockToast { icon: string; name: string; detail: string }

const WORLD_ORDER: WorldId[] = ['lab', 'factory', 'castle', 'space']
const UNLOCK_THRESHOLD = 15

function emptyProgress(): Progress {
  return { stars: Array(10).fill(0) as number[] }
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
  progress: {
    lab:     emptyProgress(),
    factory: emptyProgress(),
    castle:  emptyProgress(),
    space:   emptyProgress(),
  } as Record<WorldId, Progress>,
  unlockedBalls:  ['classic', 'heavy', 'bouncy', 'feather'] as BallId[],
  unlockedColors: ['ink', 'primary', 'secondary', 'tertiary'] as string[],
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

  totalStars: (world: WorldId) => number
  isWorldUnlocked: (world: WorldId) => boolean

  setScreen: (s: ScreenId) => void
  setWorld: (w: WorldId) => void
  setLevel: (n: number) => void
  selectBall: (b: BallId) => void
  selectColor: (id: string) => void
  setDifficulty: (d: Difficulty) => void
  setAudio: (enabled: boolean) => void
  recordResult: (world: WorldId, level: number, stars: number) => void
  setSeenOnboarding: () => void
  clearUnlockToast: () => void
  saveCustomLevel: (lvl: CustomLevel) => void
  deleteCustomLevel: (id: string) => void
  playCustomLevel: (id: string) => void
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
      saveCustomLevel: (lvl) => set(s => ({ customLevels: [...s.customLevels.filter(c => c.id !== lvl.id), lvl] })),
      deleteCustomLevel: (id) => set(s => ({ customLevels: s.customLevels.filter(c => c.id !== id) })),
      playCustomLevel: (id) => set({ playingCustomId: id, screen: 'custom' }),
      setAudio: (enabled) => { setAudioEnabled(enabled); set({ audioEnabled: enabled }) },
      setScreen: (screen) => set({ screen }),
      setWorld: (currentWorld) => set({ currentWorld }),
      setLevel: (currentLevel) => set({ currentLevel }),
      selectBall: (selectedBall) => set({ selectedBall }),
      selectColor: (selectedColorId) => set({ selectedColorId }),
      setDifficulty: (difficulty) => set({ difficulty }),

      recordResult: (world, level, stars) => {
        const prev = get().progress[world].stars[level] ?? 0
        if (stars <= prev) return

        // snapshot totals before update
        const prevWorldStars = get().progress[world].stars.reduce((a, b) => a + b, 0)
        const prevTotal = Object.values(get().progress).flatMap(p => p.stars).reduce((a, b) => a + b, 0)

        const updated = [...get().progress[world].stars]
        updated[level] = stars
        const newProgress = { ...get().progress, [world]: { stars: updated } }
        set({ progress: newProgress })

        const newWorldStars = prevWorldStars + (stars - prev)
        const newTotal      = prevTotal + (stars - prev)

        let toast: UnlockToast | null = null

        // ── Ball unlocks ──────────────────────────────────────────────────────
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

        // ── Color unlocks (thresholds: 10, 20, 30 global stars) ──────────────
        if (!toast) {
          for (const c of STROKE_COLORS) {
            if (c.unlockStars > 0 && prevTotal < c.unlockStars && newTotal >= c.unlockStars) {
              toast = { icon: '🖌️', name: c.name, detail: 'New ink color unlocked!' }
              break
            }
          }
        }

        // ── World unlock (world stars just crossed 15) ────────────────────────
        if (!toast) {
          const worldIdx = WORLDS.findIndex(w => w.id === world)
          const nextWorld = WORLDS[worldIdx + 1]
          if (nextWorld && prevWorldStars < UNLOCK_THRESHOLD && newWorldStars >= UNLOCK_THRESHOLD) {
            const def = WORLD_MAP[nextWorld.id]
            toast = { icon: def.glyph, name: `${def.name} unlocked!`, detail: def.subtitle }
          }
        }

        if (toast) set({ unlockToast: toast })
      },
    }),
    {
      name: 'drawvity-v1',
      partialize: (s) => ({
        progress:           s.progress,
        unlockedBalls:      s.unlockedBalls,
        unlockedColors:     s.unlockedColors,
        selectedBall:       s.selectedBall,
        selectedColorId:    s.selectedColorId,
        difficulty:         s.difficulty,
        hasSeenOnboarding:  s.hasSeenOnboarding,
        audioEnabled:       s.audioEnabled,
        customLevels:       s.customLevels,
      }),
    }
  )
)

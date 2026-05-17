import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAudioEnabled } from '../engine/audio'
import type { WorldId, BallId, ScreenId, Progress, Difficulty } from '../types'

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

      recordResult: (world, level, stars) => {
        const prev = get().progress[world].stars[level] ?? 0
        if (stars <= prev) return
        const updated = [...get().progress[world].stars]
        updated[level] = stars
        const newProgress = {
          ...get().progress,
          [world]: { stars: updated },
        }
        set({ progress: newProgress })
        // unlock balls by total stars across all worlds
        const total = Object.values(newProgress)
          .flatMap((p) => p.stars)
          .reduce((a, b) => a + b, 0)
        const unlocked = [...get().unlockedBalls]
        let toast: UnlockToast | null = null
        if (total >= 20 && !unlocked.includes('magnet')) {
          unlocked.push('magnet')
          toast = { icon: '🧲', name: 'Magnet Ball', detail: 'Pulls toward surfaces' }
        }
        if (total >= 40 && !unlocked.includes('comet')) {
          unlocked.push('comet')
          toast = { icon: '☄️', name: 'Comet Ball', detail: 'Fast & fiery trail' }
        }
        set({ unlockedBalls: unlocked, ...(toast ? { unlockToast: toast } : {}) })
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
      }),
    }
  )
)

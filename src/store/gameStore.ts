import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorldId, BallId, ScreenId, Progress } from '../types'

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
  progress: Record<WorldId, Progress>
  unlockedBalls: BallId[]
  unlockedColors: string[]

  totalStars: (world: WorldId) => number
  isWorldUnlocked: (world: WorldId) => boolean

  setScreen: (s: ScreenId) => void
  setWorld: (w: WorldId) => void
  setLevel: (n: number) => void
  selectBall: (b: BallId) => void
  recordResult: (world: WorldId, level: number, stars: number) => void
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

      setScreen: (screen) => set({ screen }),
      setWorld: (currentWorld) => set({ currentWorld }),
      setLevel: (currentLevel) => set({ currentLevel }),
      selectBall: (selectedBall) => set({ selectedBall }),

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
        if (total >= 20 && !unlocked.includes('magnet')) unlocked.push('magnet')
        if (total >= 40 && !unlocked.includes('comet')) unlocked.push('comet')
        set({ unlockedBalls: unlocked })
      },
    }),
    {
      name: 'drawvity-v1',
      partialize: (s) => ({
        progress:       s.progress,
        unlockedBalls:  s.unlockedBalls,
        unlockedColors: s.unlockedColors,
        selectedBall:   s.selectedBall,
      }),
    }
  )
)

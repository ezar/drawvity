import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

beforeEach(() => {
  useGameStore.setState(useGameStore.getState().getInitialState())
})

// ── recordResult ───────────────────────────────────────────────────────────────
describe('recordResult', () => {
  it('saves stars for a level', () => {
    useGameStore.getState().recordResult('lab', 0, 3)
    expect(useGameStore.getState().progress.lab.stars[0]).toBe(3)
  })

  it('does not downgrade existing stars', () => {
    useGameStore.getState().recordResult('lab', 0, 3)
    useGameStore.getState().recordResult('lab', 0, 1)
    expect(useGameStore.getState().progress.lab.stars[0]).toBe(3)
  })
})

// ── totalStars ─────────────────────────────────────────────────────────────────
describe('totalStars', () => {
  it('counts stars across a world', () => {
    useGameStore.getState().recordResult('lab', 0, 3)
    useGameStore.getState().recordResult('lab', 1, 2)
    expect(useGameStore.getState().totalStars('lab')).toBe(5)
  })
})

// ── isWorldUnlocked ────────────────────────────────────────────────────────────
describe('isWorldUnlocked', () => {
  it('lab always unlocked', () => {
    expect(useGameStore.getState().isWorldUnlocked('lab')).toBe(true)
  })

  it('factory locked when lab has fewer than 15 stars', () => {
    expect(useGameStore.getState().isWorldUnlocked('factory')).toBe(false)
  })

  it('factory unlocked when lab has 15 or more stars', () => {
    for (let i = 0; i < 5; i++) useGameStore.getState().recordResult('lab', i, 3)
    expect(useGameStore.getState().isWorldUnlocked('factory')).toBe(true)
  })
})

// ── ball unlocks ───────────────────────────────────────────────────────────────
describe('ball unlocks', () => {
  it('unlocks magnet at 20 total stars', () => {
    // 7 levels × 3 stars = 21 stars across lab
    for (let i = 0; i < 7; i++) useGameStore.getState().recordResult('lab', i, 3)
    expect(useGameStore.getState().unlockedBalls).toContain('magnet')
  })

  it('shows toast when magnet unlocks', () => {
    for (let i = 0; i < 7; i++) useGameStore.getState().recordResult('lab', i, 3)
    expect(useGameStore.getState().unlockToast?.name).toBe('Magnet Ball')
  })

  it('unlocks comet at 40 total stars', () => {
    for (let i = 0; i < 10; i++) useGameStore.getState().recordResult('lab', i, 3)
    for (let i = 0; i < 4; i++) useGameStore.getState().recordResult('factory', i, 3)
    // 30 + 12 = 42 stars — comet needs 40
    expect(useGameStore.getState().unlockedBalls).toContain('comet')
  })

  it('does not add duplicate unlocks', () => {
    for (let i = 0; i < 7; i++) useGameStore.getState().recordResult('lab', i, 3)
    for (let i = 0; i < 7; i++) useGameStore.getState().recordResult('lab', i, 3) // repeat
    const magnets = useGameStore.getState().unlockedBalls.filter(b => b === 'magnet')
    expect(magnets.length).toBe(1)
  })
})

// ── color unlock toast ─────────────────────────────────────────────────────────
describe('color unlock toast', () => {
  it('shows toast when Mint color unlocks at 10 stars', () => {
    // record 4 levels × 3 stars = 12 stars → crosses 10
    for (let i = 0; i < 4; i++) useGameStore.getState().recordResult('lab', i, 3)
    const toast = useGameStore.getState().unlockToast
    expect(toast?.name).toBe('Mint liner')
  })
})

// ── world unlock toast ─────────────────────────────────────────────────────────
describe('world unlock toast', () => {
  it('shows toast when factory unlocks', () => {
    for (let i = 0; i < 5; i++) useGameStore.getState().recordResult('lab', i, 3)
    // 15 stars in lab → factory unlocked
    const toast = useGameStore.getState().unlockToast
    expect(toast?.name).toContain('Factory')
  })
})

// ── audio toggle ───────────────────────────────────────────────────────────────
describe('setAudio', () => {
  it('toggles audioEnabled', () => {
    useGameStore.getState().setAudio(false)
    expect(useGameStore.getState().audioEnabled).toBe(false)
    useGameStore.getState().setAudio(true)
    expect(useGameStore.getState().audioEnabled).toBe(true)
  })
})

// ── clearUnlockToast ──────────────────────────────────────────────────────────
describe('clearUnlockToast', () => {
  it('clears the toast', () => {
    for (let i = 0; i < 7; i++) useGameStore.getState().recordResult('lab', i, 3)
    expect(useGameStore.getState().unlockToast).not.toBeNull()
    useGameStore.getState().clearUnlockToast()
    expect(useGameStore.getState().unlockToast).toBeNull()
  })
})

// ── custom levels ─────────────────────────────────────────────────────────────
describe('custom levels', () => {
  const mockLevel = {
    id: 'custom-1', name: 'Test', worldId: 'lab' as const,
    ballSpawn: { x: 0.1, y: 0.1 }, goal: { x: 0.9, y: 0.9 },
    strokesMax: 3, obstacles: [], createdAt: 1000,
  }

  it('saves a custom level', () => {
    useGameStore.getState().saveCustomLevel(mockLevel)
    expect(useGameStore.getState().customLevels).toHaveLength(1)
    expect(useGameStore.getState().customLevels[0].name).toBe('Test')
  })

  it('deletes a custom level', () => {
    useGameStore.getState().saveCustomLevel(mockLevel)
    useGameStore.getState().deleteCustomLevel('custom-1')
    expect(useGameStore.getState().customLevels).toHaveLength(0)
  })

  it('upserts on same id', () => {
    useGameStore.getState().saveCustomLevel(mockLevel)
    useGameStore.getState().saveCustomLevel({ ...mockLevel, name: 'Updated' })
    const levels = useGameStore.getState().customLevels
    expect(levels).toHaveLength(1)
    expect(levels[0].name).toBe('Updated')
  })
})

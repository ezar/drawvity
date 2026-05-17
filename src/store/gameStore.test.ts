import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

beforeEach(() => {
  useGameStore.setState(useGameStore.getState().getInitialState())
})

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

describe('totalStars', () => {
  it('counts stars across a world', () => {
    useGameStore.getState().recordResult('lab', 0, 3)
    useGameStore.getState().recordResult('lab', 1, 2)
    expect(useGameStore.getState().totalStars('lab')).toBe(5)
  })
})

describe('isWorldUnlocked', () => {
  it('lab always unlocked', () => {
    expect(useGameStore.getState().isWorldUnlocked('lab')).toBe(true)
  })

  it('factory locked when lab has fewer than 15 stars', () => {
    expect(useGameStore.getState().isWorldUnlocked('factory')).toBe(false)
  })

  it('factory unlocked when lab has 15 or more stars', () => {
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().recordResult('lab', i, 3)
    }
    expect(useGameStore.getState().isWorldUnlocked('factory')).toBe(true)
  })
})

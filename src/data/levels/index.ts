import type { Level, WorldId } from '../../types'
import { labLevels } from './world-1-lab'
import { factoryLevels } from './world-2-factory'
import { castleLevels } from './world-3-castle'
import { spaceLevels } from './world-4-space'

export const ALL_LEVELS: Record<WorldId, Level[]> = {
  lab:     labLevels,
  factory: factoryLevels,
  castle:  castleLevels,
  space:   spaceLevels,
}

export function getLevel(world: WorldId, index: number): Level {
  return ALL_LEVELS[world][index]
}

import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { MenuScreen } from './screens/MenuScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { LevelScreen } from './screens/LevelScreen'
import { CollectionScreen } from './screens/CollectionScreen'
import { LevelEditorScreen } from './screens/LevelEditorScreen'
import { UnlockToast } from './components/UnlockToast'
import { ErrorBoundary } from './components/ErrorBoundary'
import type { WorldId } from './types'

const slide = {
  initial:   { opacity: 0, y: 18 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
}

export default function App() {
  const { screen, setScreen, setWorld, setLevel, currentWorld, currentLevel, customLevels, playingCustomId } = useGameStore()

  const goMap = () => setScreen('map')
  const goMenu = () => setScreen('menu')

  const pickWorld = (w: WorldId) => {
    setWorld(w)
    setLevel(0)
    setScreen('level')
  }

  const nextLevel = () => {
    const allLevels = 10 // each world has 10
    const next = currentLevel + 1
    if (next < allLevels) {
      setLevel(next)
      // LevelScreen remounts via key change — reset happens internally
    } else {
      goMap()
    }
  }

  return (
    <ErrorBoundary>
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <motion.div key="menu" {...slide} style={{ position: 'absolute', inset: 0 }}>
            <MenuScreen onNav={setScreen} />
          </motion.div>
        )}

        {screen === 'map' && (
          <motion.div key="map" {...slide} style={{ position: 'absolute', inset: 0 }}>
            <WorldMapScreen onBack={goMenu} onPickWorld={pickWorld} />
          </motion.div>
        )}

        {screen === 'level' && (
          <motion.div key={`level-${currentWorld}-${currentLevel}`} {...slide} style={{ position: 'absolute', inset: 0 }}>
            <LevelScreen onBack={goMap} onNextLevel={nextLevel} />
          </motion.div>
        )}

        {screen === 'free' && (
          <motion.div key="free" {...slide} style={{ position: 'absolute', inset: 0 }}>
            <LevelScreen onBack={goMenu} onNextLevel={goMenu} freeDraw />
          </motion.div>
        )}

        {screen === 'collection' && (
          <motion.div key="collection" {...slide} style={{ position: 'absolute', inset: 0 }}>
            <CollectionScreen onBack={goMenu} />
          </motion.div>
        )}

        {screen === 'editor' && (
          <motion.div key="editor" {...slide} style={{ position: 'absolute', inset: 0 }}>
            <LevelEditorScreen onBack={goMenu} />
          </motion.div>
        )}

        {screen === 'custom' && (() => {
          const lvl = customLevels.find(c => c.id === playingCustomId)
          return lvl ? (
            <motion.div key={`custom-${playingCustomId}`} {...slide} style={{ position: 'absolute', inset: 0 }}>
              <LevelScreen onBack={() => setScreen('editor')} onNextLevel={() => setScreen('editor')} customLevel={lvl} />
            </motion.div>
          ) : null
        })()}
      </AnimatePresence>
      <UnlockToast />
    </div>
    </ErrorBoundary>
  )
}

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { MenuScreen } from './screens/MenuScreen'
import { WorldMapScreen } from './screens/WorldMapScreen'
import { LevelScreen } from './screens/LevelScreen'
import { CollectionScreen } from './screens/CollectionScreen'
import { LevelEditorScreen } from './screens/LevelEditorScreen'
import { StatsScreen } from './screens/StatsScreen'
import { UnlockToast } from './components/UnlockToast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { consumeImportHash } from './utils/levelShare'
import { todayStr } from './utils/dailyChallenge'
import { palette, toy } from './theme/toy'
import type { WorldId, CustomLevel } from './types'

const slide = {
  initial:   { opacity: 0, y: 18 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
}

export default function App() {
  const { screen, setScreen, setWorld, setLevel, currentWorld, currentLevel,
          customLevels, playingCustomId, saveCustomLevel, playCustomLevel } = useGameStore()

  // parse #import= hash once on mount — lazy init avoids setState-in-effect
  const [importLevel, setImportLevel] = useState<CustomLevel | null>(() => consumeImportHash())

  const goMap  = () => setScreen('map')
  const goMenu = () => setScreen('menu')

  const pickWorld = (w: WorldId, level: number) => {
    setWorld(w); setLevel(level); setScreen('level')
  }

  const nextLevel = () => {
    const next = currentLevel + 1
    if (next < 10) { setLevel(next) } else { goMap() }
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
        {screen === 'stats' && (
          <motion.div key="stats" {...slide} style={{ position: 'absolute', inset: 0 }}>
            <StatsScreen onBack={goMenu} />
          </motion.div>
        )}

        {screen === 'daily' && (
          <motion.div key={`daily-${todayStr()}`} {...slide} style={{ position: 'absolute', inset: 0 }}>
            <LevelScreen onBack={goMenu} onNextLevel={goMenu} dailyDate={todayStr()} />
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

      {/* ── Import level dialog ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {importLevel && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(31,26,20,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              style={{ background: palette.paper, borderRadius: toy.radius * 1.4, border: toy.border, boxShadow: '0 24px 48px rgba(31,26,20,.25)', padding: '28px 28px 24px', maxWidth: 380, width: '100%', textAlign: 'center' }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎮</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: palette.inkSoft, marginBottom: 6 }}>Shared level</div>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 26, color: palette.ink, marginBottom: 4 }}>{importLevel.name}</div>
              <div style={{ fontFamily: 'Nunito', fontSize: 13, color: palette.inkSoft, marginBottom: 24 }}>
                {importLevel.strokesMax} stroke{importLevel.strokesMax !== 1 ? 's' : ''} · {importLevel.obstacles.length} obstacle{importLevel.obstacles.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <motion.button whileTap={{ scale: 0.94 }}
                  onClick={() => setImportLevel(null)}
                  style={{ padding: '10px 16px', borderRadius: toy.radius, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 14, boxShadow: toy.shadow }}>
                  Dismiss
                </motion.button>
                <motion.button whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    saveCustomLevel({ ...importLevel, id: `import-${Date.now()}`, createdAt: Date.now() })
                    setImportLevel(null)
                    setScreen('editor')
                  }}
                  style={{ padding: '10px 16px', borderRadius: toy.radius, border: toy.border, background: palette.paper, color: palette.ink, cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 14, boxShadow: toy.shadow }}>
                  💾 Save
                </motion.button>
                <motion.button whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    const lvl: CustomLevel = { ...importLevel, id: `import-${Date.now()}`, createdAt: Date.now() }
                    saveCustomLevel(lvl)
                    setImportLevel(null)
                    playCustomLevel(lvl.id)
                  }}
                  style={{ padding: '10px 16px', borderRadius: toy.btnRadius, border: 'none', background: palette.primary, color: '#fff', cursor: 'pointer', fontFamily: 'Caprasimo, serif', fontSize: 14, boxShadow: toy.shadow }}>
                  ▶ Play
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  )
}

// app.jsx — main app, tweaks, viewport frame

const { useState: useA, useEffect: useAE, useMemo: useAM } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "viewport": "tablet",
  "screen": "menu",
  "world": "lab",
  "palette": "pantone",
  "style": "sketchbook",
  "stroke": "pencil"
}/*EDITMODE-END*/;

function ThemeCSS({ palette, world, style, dark }) {
  const css = `
    :root {
      --paper: ${palette.paper};
      --paper-deep: ${palette.paperDeep};
      --ink: ${palette.ink};
      --ink-soft: ${palette.inkSoft};
      --primary: ${palette.primary};
      --secondary: ${palette.secondary};
      --tertiary: ${palette.tertiary};
      --accent: ${palette.accent};
      --world-bg: ${world.bg};
      --world-fg: ${world.fg};
      --world-accent: ${world.accent};
    }
    @keyframes dp-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }
    @keyframes dp-pop {
      from { transform: scale(.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

function GrainOverlay({ amount }) {
  if (!amount) return null;
  // SVG noise filter overlay
  return (
    <div aria-hidden style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      opacity: amount, mixBlendMode: "multiply",
      backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='3'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`
      )}")`,
      backgroundSize: "200px 200px",
      zIndex: 30,
    }}/>
  );
}

function DeviceFrame({ vp, children, style: styleName }) {
  // outer rounded frame imitating a device, scaled to fit viewport
  const [scale, setScale] = useA(1);
  const wrapRef = React.useRef(null);

  useAE(() => {
    const compute = () => {
      const el = wrapRef.current; if (!el) return;
      const padX = 60;
      const padTop = 90; // room for top switcher
      const padBot = 60;
      const availW = window.innerWidth - padX * 2 - 320; // leave room for tweaks panel
      const availH = window.innerHeight - padTop - padBot;
      const s = Math.min(availW / vp.w, availH / vp.h, 1);
      setScale(s);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [vp.w, vp.h]);

  const isMobile = vp.name === "Mobile";
  const isDesktop = vp.name === "Desktop";

  return (
    <div ref={wrapRef} style={{
      position: "absolute", left: "50%", top: "calc(50% + 30px)",
      transform: `translate(-50%, -50%) scale(${scale})`,
      transformOrigin: "center center",
    }}>
      {/* frame chrome */}
      <div style={{
        position: "relative",
        width: vp.w + (isMobile ? 24 : isDesktop ? 0 : 32),
        height: vp.h + (isMobile ? 24 : isDesktop ? 48 : 32),
        background: isDesktop ? "transparent" : "#1f1a14",
        borderRadius: isMobile ? 44 : isDesktop ? 0 : 18,
        padding: isMobile ? 12 : isDesktop ? "0 0 48px" : 16,
        boxShadow: isDesktop
          ? "0 30px 80px rgba(0,0,0,.45)"
          : "0 1px 0 rgba(255,255,255,.08) inset, 0 30px 80px rgba(0,0,0,.45), 0 4px 12px rgba(0,0,0,.3)",
      }}>
        {/* device speaker / notch for mobile */}
        {isMobile && <div style={{
          position: "absolute", left: "50%", top: 18,
          transform: "translateX(-50%)",
          width: 90, height: 22, background: "#0a0805", borderRadius: 999,
          zIndex: 100,
        }}/>}
        {/* desktop laptop base */}
        {isDesktop && <div style={{
          position: "absolute", left: -40, right: -40, bottom: 0, height: 22,
          background: "linear-gradient(to bottom, #2a2520, #1a1612)",
          borderRadius: "0 0 24px 24px",
          boxShadow: "0 8px 20px rgba(0,0,0,.3)",
        }}>
          <div style={{
            position: "absolute", left: "50%", top: 4, transform: "translateX(-50%)",
            width: 60, height: 6, background: "#0a0805", borderRadius: 999,
          }}/>
        </div>}
        {/* screen */}
        <div style={{
          position: "relative",
          width: vp.w, height: vp.h,
          background: "var(--paper)",
          borderRadius: isMobile ? 32 : isDesktop ? 0 : 8,
          overflow: "hidden",
        }}>
          {children}
        </div>
      </div>

      {/* label below */}
      <div style={{
        position: "absolute", left: "50%", bottom: -38, transform: "translateX(-50%)",
        fontFamily: "JetBrains Mono", fontSize: 11, letterSpacing: ".15em",
        textTransform: "uppercase", color: "rgba(255,255,255,.4)",
        whiteSpace: "nowrap",
      }}>
        {vp.name} · {vp.w}×{vp.h} · {styleName}
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = PALETTES[t.palette] || PALETTES.pantone;
  const world = WORLDS[t.world] || WORLDS.lab;
  const ds = STYLES[t.style] || STYLES.sketchbook;
  const vp = VIEWPORTS[t.viewport] || VIEWPORTS.tablet;
  const strokeStyle = STROKE_STYLES[t.stroke] || STROKE_STYLES.pencil;

  const [selectedBall, setSelectedBall] = useA("classic");
  const [overlay, setOverlay] = useA(null); // "win" | "loss" | null
  const [levelKey, setLevelKey] = useA(0);

  // navigation
  const screen = t.screen;
  const setScreen = (s) => { setOverlay(null); setTweak("screen", s); };

  // when entering level, clear overlay
  useAE(() => { setOverlay(null); }, [screen]);

  // When user picks "win" or "loss" in the tweak select, show the corresponding overlay
  useAE(() => {
    if (screen === "win") setOverlay("win");
    else if (screen === "loss") setOverlay("loss");
  }, [screen]);

  const goWin = () => setOverlay("win");
  const goLose = () => setOverlay("loss");
  const retryLevel = () => { setOverlay(null); setLevelKey(k => k + 1); if (screen !== "level") setTweak("screen", "level"); };

  // Default world bg fallback for non-level screens uses palette paper
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(ellipse at center, #2a241c 0%, #14110d 100%)",
      overflow: "hidden",
      fontFamily: "Nunito, system-ui, sans-serif",
    }}>
      <ThemeCSS palette={palette} world={world} style={ds} />

      {/* Always-visible viewport + screen switcher */}
      <div style={{
        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, display: "flex", gap: 10, alignItems: "center",
        background: "rgba(20,17,13,.7)", backdropFilter: "blur(12px)",
        padding: "8px 10px", borderRadius: 999,
        border: "1px solid rgba(255,255,255,.08)",
        boxShadow: "0 8px 24px rgba(0,0,0,.4)",
      }}>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
          letterSpacing: ".15em", textTransform: "uppercase",
          color: "rgba(255,255,255,.45)", padding: "0 8px 0 4px",
        }}>device</div>
        {Object.entries(VIEWPORTS).map(([id, v]) => {
          const active = id === t.viewport;
          return (
            <button key={id} onClick={() => setTweak("viewport", id)} style={{
              padding: "6px 14px", borderRadius: 999,
              background: active ? "#FAF4E6" : "transparent",
              color: active ? "#1F1A14" : "rgba(255,255,255,.7)",
              border: "none", cursor: "pointer",
              fontFamily: "Nunito", fontSize: 12, fontWeight: 700,
              letterSpacing: ".02em",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>{id === "mobile" ? "📱" : id === "tablet" ? "▭" : "▬"}</span>
              <span>{v.name}</span>
            </button>
          );
        })}
        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,.12)", margin: "0 2px" }}/>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
          letterSpacing: ".15em", textTransform: "uppercase",
          color: "rgba(255,255,255,.45)", padding: "0 6px",
        }}>screen</div>
        <select value={t.screen} onChange={(e) => { setOverlay(null); setTweak("screen", e.target.value); }} style={{
          appearance: "none", WebkitAppearance: "none",
          background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.9)",
          border: "1px solid rgba(255,255,255,.1)", borderRadius: 999,
          padding: "6px 26px 6px 14px", fontFamily: "Nunito", fontSize: 12, fontWeight: 600,
          backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M1 3 L5 7 L9 3' stroke='%23fff' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>\")",
          backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
          cursor: "pointer",
        }}>
          <option value="menu">Main menu</option>
          <option value="map">World map</option>
          <option value="level">Level</option>
          <option value="win">Win overlay</option>
          <option value="loss">Loss overlay</option>
          <option value="collection">Collection</option>
          <option value="styleguide">Style guide</option>
        </select>
      </div>

      <DeviceFrame vp={vp} styleName={ds.name}>
        {/* Screen routing */}
        {screen === "menu" && (
          <MenuScreen ds={ds} vp={vp} onNav={setScreen} palette={palette} currentWorld={t.world} />
        )}
        {screen === "map" && (
          <WorldMapScreen ds={ds} vp={vp} onNav={setScreen}
            onPickWorld={(id) => { setTweak("world", id); setScreen("level"); }}
            currentWorld={t.world} palette={palette}/>
        )}
        {(screen === "level" || screen === "free") && (
          <LevelScreen key={levelKey} ds={ds} vp={vp} world={world} palette={palette}
            strokeStyle={strokeStyle}
            selectedBall={selectedBall} setSelectedBall={setSelectedBall}
            onNav={setScreen} onWin={goWin} onLose={goLose} />
        )}
        {screen === "collection" && (
          <CollectionScreen ds={ds} vp={vp} palette={palette} onNav={setScreen}/>
        )}
        {screen === "styleguide" && (
          <StyleGuideScreen ds={ds} vp={vp} palette={palette} onNav={setScreen}/>
        )}
        {(screen === "win" || screen === "loss") && (
          <LevelScreen ds={ds} vp={vp} world={world} palette={palette}
            strokeStyle={strokeStyle}
            selectedBall={selectedBall} setSelectedBall={setSelectedBall}
            onNav={setScreen} onWin={() => {}} onLose={() => {}} />
        )}

        {/* Overlays */}
        {overlay === "win" && <WinOverlay ds={ds} palette={palette}
          onNav={(s) => { setOverlay(null); if (s === "level") retryLevel(); else setScreen(s); }}
          onRetry={retryLevel} />}
        {overlay === "loss" && <LossOverlay ds={ds} palette={palette}
          onNav={(s) => { setOverlay(null); setScreen(s); }}
          onRetry={retryLevel} />}

        {/* Grain overlay for sketchbook/riso style */}
        <GrainOverlay amount={ds.grain} />
      </DeviceFrame>

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection label="Viewport" />
        <TweakRadio label="Device" value={t.viewport}
          options={["mobile", "tablet", "desktop"]}
          onChange={(v) => setTweak("viewport", v)} />

        <TweakSection label="Screen" />
        <TweakSelect label="Active screen" value={t.screen}
          options={[
            { value: "menu", label: "Main menu" },
            { value: "map", label: "World map" },
            { value: "level", label: "Level (gameplay)" },
            { value: "win", label: "Win overlay" },
            { value: "loss", label: "Loss overlay" },
            { value: "collection", label: "Collection" },
            { value: "styleguide", label: "Style guide" },
          ]}
          onChange={(v) => { setOverlay(null); setTweak("screen", v); }} />

        <TweakSection label="World" />
        <TweakRadio label="World" value={t.world}
          options={[
            { value: "lab", label: "Lab" },
            { value: "factory", label: "Factory" },
            { value: "castle", label: "Castle" },
            { value: "space", label: "Space" },
          ]}
          onChange={(v) => setTweak("world", v)} />

        <TweakSection label="Visual style" />
        <TweakRadio label="Direction" value={t.style}
          options={[
            { value: "sketchbook", label: "Sketch" },
            { value: "riso", label: "Riso" },
            { value: "toy", label: "Toy" },
          ]}
          onChange={(v) => setTweak("style", v)} />
        <TweakRadio label="Palette" value={t.palette}
          options={[
            { value: "pantone", label: "Pantone" },
            { value: "pencils", label: "Pencils" },
            { value: "sorbet", label: "Sorbet" },
          ]}
          onChange={(v) => setTweak("palette", v)} />

        <TweakSection label="Drawing" />
        <TweakRadio label="Stroke" value={t.stroke}
          options={[
            { value: "pencil", label: "Pencil" },
            { value: "marker", label: "Marker" },
            { value: "chalk", label: "Chalk" },
          ]}
          onChange={(v) => setTweak("stroke", v)} />
      </TweaksPanel>
    </div>
  );
}

injectFonts();
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

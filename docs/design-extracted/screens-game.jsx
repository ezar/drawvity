// screens-game.jsx — level screen, win/loss overlays, collection, style guide

const { useState: useGS, useMemo: useGM, useEffect: useGE, useRef: useGR } = React;

// ═══ LEVEL SCREEN ═══════════════════════════════════════════════════════
function LevelScreen({ ds, vp, world, palette, strokeStyle, selectedBall, setSelectedBall, onNav, onWin, onLose }) {
  const isPortrait = vp.orient === "portrait";
  const isSmall = vp.w < 700;

  // canvas dims = full inner area minus chrome
  const hudTop = 56;
  const hudBottom = isSmall ? 110 : 96;
  const canvasW = vp.w;
  const canvasH = vp.h - hudTop - hudBottom;

  const [strokes, setStrokes] = useGS([]);
  const [launching, setLaunching] = useGS(false);
  const STROKES_MAX = 3;

  // goal position — bottom right area, in-bounds
  const goal = useGM(() => ({
    x: Math.round(canvasW * 0.82),
    y: Math.round(canvasH * 0.7),
  }), [canvasW, canvasH]);

  const ball = useGM(() => BALLS.find(b => b.id === selectedBall) || BALLS[0], [selectedBall]);
  const canLaunch = strokes.length > 0 && !launching;

  const reset = () => { setStrokes([]); setLaunching(false); };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative", background: world.bg }}>
      {/* TOP HUD */}
      <div style={{
        height: hudTop, display: "flex", alignItems: "center", padding: "0 16px",
        gap: 12, justifyContent: "space-between",
        background: "linear-gradient(to bottom, rgba(0,0,0,.06), transparent)",
        position: "relative", zIndex: 5,
        color: world.id === "space" ? "#F2EBDA" : "var(--ink)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => onNav("map")} style={{
            width: 36, height: 36, borderRadius: 999, border: ds.border, borderStyle: ds.borderStyle,
            background: world.id === "space" ? "rgba(255,255,255,.1)" : "var(--paper)",
            color: "inherit", cursor: "pointer", fontSize: 16,
            backdropFilter: "blur(8px)",
          }}>←</button>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, opacity: .65, letterSpacing: ".12em", textTransform: "uppercase" }}>{world.name}</div>
            <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 18 }}>Level 03 · The Curve</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StrokeCounter max={STROKES_MAX} used={strokes.length} ds={ds} />
          <button onClick={reset} title="Retry" style={{
            width: 36, height: 36, borderRadius: 999, border: ds.border, borderStyle: ds.borderStyle,
            background: world.id === "space" ? "rgba(255,255,255,.1)" : "var(--paper)",
            color: "inherit", cursor: "pointer", fontSize: 14,
          }}>↻</button>
        </div>
      </div>

      {/* CANVAS */}
      <div style={{
        position: "relative", flex: 1, overflow: "hidden",
      }}>
        <DrawCanvas
          width={canvasW} height={canvasH}
          world={world} palette={palette}
          strokeStyle={strokeStyle}
          strokeColor={strokeStyle.color === "paper" ? palette.paper : palette.ink}
          strokesMax={STROKES_MAX}
          strokes={strokes} setStrokes={setStrokes}
          ball={ball} goal={goal}
          launching={launching}
          onWin={() => { setLaunching(false); onWin(); }}
          onLose={() => { setLaunching(false); onLose(); }}
        />
        {/* tutorial hint when empty */}
        {strokes.length === 0 && !launching && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily: "Caprasimo, serif", fontSize: 22,
              color: world.id === "space" ? "rgba(242,235,218,.5)" : "rgba(31,26,20,.35)",
              transform: "rotate(-2deg)",
            }}>
              <span style={{ fontSize: 26, marginRight: 8 }}>✎</span>
              Draw a path to the star
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM HUD */}
      <div style={{
        minHeight: hudBottom, padding: "10px 16px 14px",
        display: "flex", alignItems: "center", gap: 14,
        flexDirection: isSmall ? "column" : "row",
        background: "linear-gradient(to top, rgba(0,0,0,.06), transparent)",
        color: world.id === "space" ? "#F2EBDA" : "var(--ink)",
        position: "relative", zIndex: 5,
      }}>
        {/* Ball selector */}
        <div style={{
          display: "flex", gap: 10, alignItems: "center",
          padding: "8px 12px",
          background: world.id === "space" ? "rgba(255,255,255,.08)" : "var(--paper)",
          border: ds.border, borderStyle: ds.borderStyle, borderRadius: 999,
          boxShadow: ds.shadow,
          backdropFilter: "blur(8px)",
          flexShrink: 0,
        }}>
          {BALLS.slice(0, isSmall ? 4 : 6).map(b => (
            <BallChip key={b.id} ball={b} selected={b.id === selectedBall}
              onClick={() => setSelectedBall(b.id)} ds={ds} />
          ))}
        </div>

        {/* Spacer / hint */}
        {!isSmall && <div style={{ flex: 1, fontFamily: "JetBrains Mono", fontSize: 11, opacity: .6, letterSpacing: ".05em" }}>
          {strokes.length === 0 ? "draw paths · then launch" : `${STROKES_MAX - strokes.length} stroke(s) left · ${ball.name} selected`}
        </div>}

        {/* Launch button */}
        <button
          onClick={() => canLaunch && setLaunching(true)}
          disabled={!canLaunch}
          style={{
            position: "relative",
            padding: isSmall ? "14px 28px" : "16px 36px",
            background: canLaunch ? palette.primary : "rgba(31,26,20,.18)",
            color: "#fff", border: "none", borderRadius: 999,
            fontFamily: 'Caprasimo, serif', fontSize: isSmall ? 22 : 24,
            cursor: canLaunch ? "pointer" : "not-allowed",
            boxShadow: canLaunch
              ? `0 4px 0 rgba(0,0,0,.2), 0 0 0 4px ${palette.primary}30, ${ds.shadow}`
              : ds.shadow,
            letterSpacing: ".02em",
            animation: canLaunch ? "dp-pulse 1.6s ease-in-out infinite" : "none",
            flexShrink: 0,
          }}>
          {launching ? "…" : "Launch"} <span style={{ marginLeft: 6 }}>↓</span>
        </button>
      </div>
    </div>
  );
}

// ═══ WIN OVERLAY ════════════════════════════════════════════════════════
function WinOverlay({ ds, palette, onNav, onRetry }) {
  const [shown, setShown] = useGS(0);
  useGE(() => {
    const t1 = setTimeout(() => setShown(1), 250);
    const t2 = setTimeout(() => setShown(2), 600);
    const t3 = setTimeout(() => setShown(3), 950);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "rgba(31,26,20,.45)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "var(--paper)",
        border: ds.border, borderStyle: ds.borderStyle, borderRadius: ds.radius * 1.4,
        boxShadow: ds.shadow,
        padding: "32px 32px 28px",
        maxWidth: 380, width: "100%",
        textAlign: "center",
        position: "relative",
        animation: "dp-pop .4s cubic-bezier(.2,1.4,.5,1) both",
      }}>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--ink-soft)", letterSpacing: ".15em", textTransform: "uppercase" }}>level cleared</div>
        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 44, color: "var(--ink)", lineHeight: 1, marginTop: 6 }}>Nice one!</div>

        {/* Stars */}
        <div style={{ display: "flex", justifyContent: "center", gap: 14, margin: "22px 0 18px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              width: 64, height: 64,
              opacity: shown >= i ? 1 : 0.18,
              transform: shown >= i ? "scale(1) rotate(0)" : "scale(.5) rotate(-30deg)",
              transition: "all .35s cubic-bezier(.2,1.4,.5,1)",
              filter: shown >= i ? `drop-shadow(0 4px 12px ${palette.secondary}80)` : "none",
            }}>
              <GoalStar size={64} color={shown >= i ? palette.secondary : "rgba(31,26,20,.18)"} />
            </div>
          ))}
        </div>

        <div style={{ fontFamily: "Nunito", fontSize: 13, color: "var(--ink-soft)", marginBottom: 22 }}>
          You used 2 of 3 strokes · ball reached the star in 4.2s
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn ds={ds} onClick={onRetry}>Improve</Btn>
          <Btn ds={ds} primary tone={palette.primary} onClick={() => onNav("level")}>Next level →</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══ LOSS OVERLAY ═══════════════════════════════════════════════════════
function LossOverlay({ ds, palette, onNav, onRetry }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "rgba(31,26,20,.35)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "var(--paper)",
        border: ds.border, borderStyle: ds.borderStyle, borderRadius: ds.radius * 1.4,
        boxShadow: ds.shadow,
        padding: "28px 32px 26px",
        maxWidth: 340, width: "100%",
        textAlign: "center",
        animation: "dp-pop .35s cubic-bezier(.2,1.4,.5,1) both",
      }}>
        {/* Sad ball */}
        <div style={{ margin: "8px auto 14px", width: 80, height: 80, position: "relative" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 999,
            background: palette.primary,
            boxShadow: ds.shadow,
            position: "relative",
          }}>
            <div style={{ position: "absolute", left: 22, top: 30, width: 8, height: 4, background: "rgba(0,0,0,.6)", borderRadius: 4 }} />
            <div style={{ position: "absolute", right: 22, top: 30, width: 8, height: 4, background: "rgba(0,0,0,.6)", borderRadius: 4 }} />
            <div style={{ position: "absolute", left: 28, top: 52, width: 24, height: 8, borderTop: "3px solid rgba(0,0,0,.55)", borderRadius: "50%" }} />
          </div>
        </div>

        <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 32, color: "var(--ink)", lineHeight: 1 }}>So close.</div>
        <div style={{ fontFamily: "Nunito", fontSize: 14, color: "var(--ink-soft)", marginTop: 8, marginBottom: 22 }}>
          The ball missed the star. Try a different curve?
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn ds={ds} onClick={() => onNav("map")}>World map</Btn>
          <Btn ds={ds} primary tone={palette.primary} onClick={onRetry}>Try again ↻</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══ COLLECTION SCREEN ══════════════════════════════════════════════════
function CollectionScreen({ ds, vp, palette, onNav }) {
  const isPortrait = vp.orient === "portrait";

  const strokeColors = [
    { id: "ink",     hex: palette.ink,       name: "Pencil ink",    locked: false },
    { id: "primary", hex: palette.primary,   name: "Coral marker",  locked: false },
    { id: "second",  hex: palette.secondary, name: "Mustard chalk", locked: false },
    { id: "third",   hex: palette.tertiary,  name: "Cobalt pen",    locked: false },
    { id: "accent",  hex: palette.accent,    name: "Mint highlighter", locked: true },
    { id: "rose",    hex: "#F4D8E4",         name: "Rose pastel",   locked: true },
    { id: "neon",    hex: "#A0FF00",         name: "Neon glow",     locked: true },
    { id: "rainbow", hex: "linear-gradient(90deg,#E25C3B,#E8B73E,#5BB390,#2E5BB8,#B79CDB)", name: "Rainbow", locked: true },
  ];

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      padding: isPortrait ? "24px 18px 18px" : "28px 40px 24px",
      gap: 18, overflow: "auto",
    }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => onNav("menu")} style={{
          width: 40, height: 40, borderRadius: 999, border: ds.border, borderStyle: ds.borderStyle,
          background: "var(--paper)", color: "var(--ink)", cursor: "pointer",
          fontSize: 18, boxShadow: ds.shadow,
        }}>←</button>
        <div style={{ flex: 1 }}>
          <Sub>your collection</Sub>
          <Title size={isPortrait ? 32 : 40}>Sticker album</Title>
        </div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "var(--ink-soft)" }}>
          8 / 14 unlocked
        </div>
      </div>

      {/* Balls section */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22, color: "var(--ink)" }}>Balls</div>
          <Sub>{BALLS.filter(b => !b.locked).length} / {BALLS.length}</Sub>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isPortrait ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
          gap: 12,
        }}>
          {BALLS.map(b => (
            <div key={b.id} style={{
              padding: 14, background: "var(--paper)",
              border: ds.border, borderStyle: ds.borderStyle, borderRadius: ds.radius,
              boxShadow: ds.shadow,
              opacity: b.locked ? .65 : 1,
              textAlign: "center", position: "relative",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 999,
                background: b.locked ? "rgba(31,26,20,.15)" : b.color,
                margin: "0 auto 10px",
                boxShadow: "inset 0 -3px 0 rgba(0,0,0,.15)",
                position: "relative",
              }}>
                {b.locked && <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>🔒</div>}
                {!b.locked && <div style={{
                  position: "absolute", left: "26%", top: "22%",
                  width: 16, height: 16, borderRadius: 999,
                  background: "rgba(255,255,255,.45)",
                }}/>}
              </div>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 16, color: "var(--ink)" }}>{b.name}</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: "var(--ink-soft)", letterSpacing: ".08em", textTransform: "uppercase", marginTop: 2 }}>
                {b.locked ? "locked" : b.hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stroke colors */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22, color: "var(--ink)" }}>Stroke colors</div>
          <Sub>{strokeColors.filter(s => !s.locked).length} / {strokeColors.length}</Sub>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isPortrait ? "repeat(4, 1fr)" : "repeat(8, 1fr)",
          gap: 10,
        }}>
          {strokeColors.map(s => (
            <div key={s.id} style={{
              padding: 10, background: "var(--paper)",
              border: ds.border, borderStyle: ds.borderStyle, borderRadius: ds.radius,
              boxShadow: ds.shadow,
              opacity: s.locked ? .55 : 1,
              textAlign: "center",
            }}>
              <div style={{
                width: "100%", height: 36, borderRadius: ds.radius - 4,
                background: s.locked ? "rgba(31,26,20,.12)" : s.hex,
                marginBottom: 6, position: "relative", overflow: "hidden",
              }}>
                {s.locked && <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>🔒</div>}
              </div>
              <div style={{ fontFamily: "Nunito", fontSize: 10, color: "var(--ink-soft)", fontWeight: 600 }}>{s.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ═══ STYLE GUIDE SCREEN ═════════════════════════════════════════════════
function StyleGuideScreen({ ds, vp, palette, onNav }) {
  const swatches = [
    ["paper", palette.paper], ["paper deep", palette.paperDeep],
    ["ink", palette.ink], ["ink soft", palette.inkSoft],
    ["primary", palette.primary], ["secondary", palette.secondary],
    ["tertiary", palette.tertiary], ["accent", palette.accent],
  ];
  const worlds = Object.values(WORLDS);
  return (
    <div style={{ width: "100%", height: "100%", overflow: "auto", padding: "28px 32px", color: "var(--ink)", fontFamily: "Nunito" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <button onClick={() => onNav("menu")} style={{
          width: 40, height: 40, borderRadius: 999, border: ds.border, borderStyle: ds.borderStyle,
          background: "var(--paper)", color: "var(--ink)", cursor: "pointer", fontSize: 18, boxShadow: ds.shadow,
        }}>←</button>
        <div>
          <Sub>visual system</Sub>
          <Title size={36}>Style guide</Title>
        </div>
      </div>

      {/* type */}
      <SGSection title="Typography">
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 56, lineHeight: 1 }}>Draw &amp; Play</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--ink-soft)", marginTop: 4, letterSpacing: ".1em", textTransform: "uppercase" }}>Caprasimo · display · 32–96px</div>
          </div>
          <div>
            <div style={{ fontFamily: "Nunito", fontSize: 18, fontWeight: 600 }}>The quick brown ball rolls over the hand-drawn ramp.</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--ink-soft)", marginTop: 4, letterSpacing: ".1em", textTransform: "uppercase" }}>Nunito · body · 13–18px</div>
          </div>
          <div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 13 }}>STROKES · 02 / 03 · WEIGHT 1.4</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "var(--ink-soft)", marginTop: 4, letterSpacing: ".1em", textTransform: "uppercase" }}>JetBrains Mono · data · 10–13px</div>
          </div>
        </div>
      </SGSection>

      {/* palette */}
      <SGSection title="Palette">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {swatches.map(([name, hex]) => (
            <div key={name} style={{
              background: hex, height: 80, borderRadius: ds.radius,
              border: ds.border, borderStyle: ds.borderStyle,
              padding: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end",
              color: ["paper", "paper deep", "secondary", "accent"].includes(name) ? "var(--ink)" : "#fff",
              fontFamily: "JetBrains Mono", fontSize: 10,
            }}>
              <div style={{ fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{name}</div>
              <div style={{ opacity: .8 }}>{hex}</div>
            </div>
          ))}
        </div>
      </SGSection>

      {/* worlds */}
      <SGSection title="World accents">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {worlds.map(w => (
            <div key={w.id} style={{ background: w.bg, color: w.fg, borderRadius: ds.radius, border: ds.border, borderStyle: ds.borderStyle, padding: 14, position: "relative", overflow: "hidden", minHeight: 100 }}>
              <WorldBg world={w}/>
              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 20, lineHeight: 1 }}>{w.name}</div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, opacity: .7, marginTop: 4, letterSpacing: ".08em", textTransform: "uppercase" }}>{w.subtitle}</div>
                <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 999, background: w.accent }}/>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, opacity: .8 }}>{w.accent}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SGSection>

      {/* components */}
      <SGSection title="Components">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <Btn ds={ds} primary tone={palette.primary} big>Launch ↓</Btn>
          <Btn ds={ds}>Try again</Btn>
          <Btn ds={ds} primary tone={palette.tertiary}>Free Draw</Btn>
          <StrokeCounter max={3} used={1} ds={ds} />
          <div style={{ display: "flex", gap: 8 }}>
            {BALLS.slice(0, 4).map(b => <BallChip key={b.id} ball={b} selected={b.id === "classic"} onClick={() => {}} ds={ds} />)}
          </div>
        </div>
      </SGSection>

      {/* rules */}
      <SGSection title="Rules">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <RuleCard label="Radius" value={`${ds.radius}px`} note="card · panel" ds={ds}/>
          <RuleCard label="Button radius" value={ds.btnRadius >= 100 ? "pill" : `${ds.btnRadius}px`} note="primary CTA" ds={ds}/>
          <RuleCard label="Grain" value={`${(ds.grain*100).toFixed(0)}%`} note="paper texture" ds={ds}/>
          <RuleCard label="Spacing" value="4·8·12·16·24·32" note="base 4px scale" ds={ds}/>
          <RuleCard label="Hit target" value="≥ 44px" note="all taps" ds={ds}/>
          <RuleCard label="Animation" value="120–350ms" note="ease-spring" ds={ds}/>
        </div>
      </SGSection>
    </div>
  );
}

function SGSection({ title, children }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{
        fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700,
        letterSpacing: ".15em", textTransform: "uppercase",
        color: "var(--ink-soft)", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span>{title}</span>
        <div style={{ flex: 1, height: 1, background: "currentColor", opacity: .25 }}/>
      </div>
      {children}
    </section>
  );
}

function RuleCard({ label, value, note, ds }) {
  return (
    <div style={{
      padding: 14, background: "var(--paper)",
      border: ds.border, borderStyle: ds.borderStyle, borderRadius: ds.radius,
      boxShadow: ds.shadow,
    }}>
      <div style={{ fontFamily: "JetBrains Mono", fontSize: 9, opacity: .65, letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 22, lineHeight: 1, marginTop: 4 }}>{value}</div>
      <div style={{ fontFamily: "Nunito", fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>{note}</div>
    </div>
  );
}

Object.assign(window, { LevelScreen, WinOverlay, LossOverlay, CollectionScreen, StyleGuideScreen });

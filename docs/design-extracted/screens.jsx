// screens.jsx — all app screens (menu, map, level, win, loss, collection, styleguide)

const { useState, useMemo, useEffect } = React;

// ─── Shared little components ───────────────────────────────────────────
function Btn({ children, onClick, primary, big, style, variant = "default", tone, ds }) {
  const base = {
    fontFamily: 'Caprasimo, "Nunito", serif',
    border: ds.border,
    borderStyle: ds.borderStyle,
    borderRadius: primary ? ds.btnRadius : ds.radius,
    background: "var(--paper)",
    color: "var(--ink)",
    padding: big ? "18px 28px" : "10px 18px",
    fontSize: big ? 22 : 15,
    boxShadow: ds.shadow,
    cursor: "pointer",
    letterSpacing: ".01em",
    transition: "transform .12s ease, box-shadow .12s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    ...style,
  };
  if (primary) {
    base.background = tone || "var(--primary)";
    base.color = "#fff";
    base.borderColor = "rgba(0,0,0,.18)";
  }
  return <button onClick={onClick} style={base}>{children}</button>;
}

function StrokeCounter({ max, used, ds }) {
  const dots = [];
  for (let i = 0; i < max; i++) {
    const isUsed = i < used;
    dots.push(
      <div key={i} style={{
        width: 18, height: 18, borderRadius: 999,
        background: isUsed ? "transparent" : "var(--ink)",
        border: "2px solid var(--ink)",
        opacity: isUsed ? 0.35 : 1,
        transition: "all .25s ease",
        transform: isUsed ? "scale(.7)" : "scale(1)",
      }} />
    );
  }
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px",
      background: "var(--paper)",
      border: ds.border, borderStyle: ds.borderStyle, borderRadius: 999,
      boxShadow: ds.shadow,
      color: "var(--ink)",
    }}>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", opacity: .65 }}>strokes</span>
      <div style={{ display: "flex", gap: 6 }}>{dots}</div>
    </div>
  );
}

function BallChip({ ball, selected, onClick, ds }) {
  return (
    <button onClick={onClick} disabled={ball.locked} style={{
      width: 56, height: 56, borderRadius: 999, border: "none",
      background: ball.locked ? "rgba(31,26,20,.08)" : ball.color,
      cursor: ball.locked ? "not-allowed" : "pointer",
      position: "relative", flexShrink: 0,
      boxShadow: selected
        ? `0 0 0 3px var(--paper), 0 0 0 6px var(--ink), ${ds.shadow}`
        : ds.shadow,
      transition: "transform .15s ease",
      transform: selected ? "translateY(-4px)" : "none",
    }}>
      {ball.locked ? (
        <span style={{ fontSize: 22, color: "rgba(31,26,20,.55)" }}>🔒</span>
      ) : (
        <span style={{
          position: "absolute", inset: "auto 6px 4px auto",
          fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700,
          color: "rgba(0,0,0,.5)", letterSpacing: ".05em",
        }}>{ball.weight.toFixed(1)}</span>
      )}
    </button>
  );
}

function GoalStar({ size = 28, color = "currentColor" }) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.42;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${Math.cos(a) * r * (size/2)},${Math.sin(a) * r * (size/2)}`);
  }
  return (
    <svg width={size} height={size} viewBox={`-${size/2} -${size/2} ${size} ${size}`}>
      <polygon points={pts.join(" ")} fill={color} stroke="rgba(31,26,20,.45)" strokeWidth="1.2" />
    </svg>
  );
}

// ─── Title ──────────────────────────────────────────────────────────────
function Title({ children, size = 64, color = "var(--ink)", style }) {
  return (
    <h1 style={{
      fontFamily: 'Caprasimo, "Nunito", serif',
      fontSize: size, fontWeight: 400,
      color, margin: 0, lineHeight: 0.95,
      letterSpacing: "-.01em",
      ...style,
    }}>{children}</h1>
  );
}

function Sub({ children, style }) {
  return (
    <div style={{
      fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600,
      letterSpacing: ".14em", textTransform: "uppercase",
      color: "var(--ink-soft)", ...style,
    }}>{children}</div>
  );
}

// ═══ MENU SCREEN ════════════════════════════════════════════════════════
function MenuScreen({ ds, vp, onNav, palette, currentWorld }) {
  const isPortrait = vp.orient === "portrait";
  const cards = [
    { id: "map",        label: "Play",       desc: "Challenge levels", tone: palette.primary,   icon: "▶", emoji: "🎯" },
    { id: "free",       label: "Free Draw",  desc: "Sandbox mode",     tone: palette.tertiary,  icon: "✎", emoji: "✏️" },
    { id: "collection", label: "Collection", desc: "Your unlocks",     tone: palette.secondary, icon: "★", emoji: "🌟" },
  ];
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: isPortrait ? "column" : "row",
      gap: isPortrait ? 24 : 48,
      padding: isPortrait ? "48px 28px" : "72px 80px",
      alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      {/* Hero */}
      <div style={{
        flex: isPortrait ? "0 0 auto" : 1,
        display: "flex", flexDirection: "column",
        gap: 14, alignItems: isPortrait ? "center" : "flex-start",
        textAlign: isPortrait ? "center" : "left",
      }}>
        <Sub>chapter one</Sub>
        <Title size={isPortrait ? 64 : 96}>
          Draw.<br/>
          <span style={{ color: palette.primary }}>Watch.</span><br/>
          <span style={{ color: palette.tertiary }}>Wonder.</span>
        </Title>
        <div style={{
          fontFamily: "Nunito", fontSize: isPortrait ? 14 : 17,
          color: "var(--ink-soft)", maxWidth: 360, marginTop: 6,
          lineHeight: 1.45,
        }}>
          Sketch a path. Drop a ball. The drawing comes alive — bouncing, rolling, sliding to the star.
        </div>
      </div>

      {/* Three cards */}
      <div style={{
        flex: isPortrait ? "0 0 auto" : 1,
        display: "flex", flexDirection: "column",
        gap: 14, width: isPortrait ? "100%" : "auto",
        maxWidth: isPortrait ? 360 : 420, alignSelf: "stretch",
        justifyContent: "center",
      }}>
        {cards.map(c => (
          <button key={c.id} onClick={() => onNav(c.id)} style={{
            display: "flex", alignItems: "center", gap: 18,
            padding: "20px 22px",
            background: "var(--paper)",
            color: "var(--ink)",
            border: ds.border, borderStyle: ds.borderStyle, borderRadius: ds.radius,
            boxShadow: ds.shadow, cursor: "pointer", textAlign: "left",
            transition: "transform .14s ease",
            fontFamily: "Nunito",
          }} onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
             onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{
              width: 56, height: 56, borderRadius: ds.btnRadius < 100 ? ds.btnRadius : 999,
              background: c.tone, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontFamily: 'Caprasimo, serif',
              boxShadow: "inset 0 -3px 0 rgba(0,0,0,.18)",
              flexShrink: 0,
            }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 26, lineHeight: 1 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4,
                fontFamily: "JetBrains Mono", letterSpacing: ".08em", textTransform: "uppercase" }}>{c.desc}</div>
            </div>
            <div style={{ fontSize: 20, color: "var(--ink-soft)" }}>→</div>
          </button>
        ))}

        <div style={{
          marginTop: 12, fontFamily: "JetBrains Mono", fontSize: 10,
          color: "var(--ink-soft)", textAlign: "center", opacity: .7,
          letterSpacing: ".1em",
        }}>v0.1 · made for tiny scientists</div>
      </div>

      {/* decorative loose scribbles */}
      {!isPortrait && <div aria-hidden style={{ position: "absolute", left: 32, bottom: 32, opacity: .25 }}>
        <svg width="180" height="60" viewBox="0 0 180 60">
          <path d="M5 40 Q 30 5, 60 35 T 120 25 T 175 45" stroke={palette.primary} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>}
    </div>
  );
}

// ═══ WORLD MAP SCREEN ═══════════════════════════════════════════════════
function WorldMapScreen({ ds, vp, onNav, onPickWorld, currentWorld, palette }) {
  const isPortrait = vp.orient === "portrait";
  const worlds = Object.values(WORLDS);

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      padding: isPortrait ? "24px 18px 18px" : "28px 40px 24px",
      gap: 16, overflow: "hidden",
    }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => onNav("menu")} style={{
          width: 40, height: 40, borderRadius: 999, border: ds.border, borderStyle: ds.borderStyle,
          background: "var(--paper)", color: "var(--ink)", cursor: "pointer",
          fontSize: 18, boxShadow: ds.shadow,
        }}>←</button>
        <div style={{ flex: 1 }}>
          <Sub>choose a world</Sub>
          <Title size={isPortrait ? 32 : 40}>Where to today?</Title>
        </div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 11, padding: "8px 12px",
          background: "var(--paper-deep)", borderRadius: 999, border: ds.border, borderStyle: ds.borderStyle,
          color: "var(--ink)", display: "flex", gap: 6, alignItems: "center",
        }}>
          <span>★</span><span>7</span>
          <span style={{ opacity: .4 }}>/ 120</span>
        </div>
      </div>

      {/* worlds grid */}
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: isPortrait ? "1fr" : "repeat(2, 1fr)",
        gridTemplateRows: isPortrait ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
        gap: 14,
        minHeight: 0,
      }}>
        {worlds.map((w, idx) => {
          const completed = idx === 0 ? 7 : idx === 1 ? 3 : idx === 2 ? 0 : 0;
          const unlocked = idx <= 1;
          const isCurrent = w.id === currentWorld;
          return (
            <button key={w.id} onClick={() => unlocked && onPickWorld(w.id)} disabled={!unlocked}
              style={{
                position: "relative", overflow: "hidden", cursor: unlocked ? "pointer" : "not-allowed",
                background: w.bg, color: w.fg,
                border: isCurrent ? `3px solid ${palette.primary}` : ds.border,
                borderStyle: ds.borderStyle, borderRadius: ds.radius,
                boxShadow: ds.shadow, padding: 18, textAlign: "left",
                fontFamily: "Nunito",
                opacity: unlocked ? 1 : .55,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: 110,
              }}>
              <WorldBg world={w} />
              <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{
                    fontFamily: "JetBrains Mono", fontSize: 10, opacity: .65,
                    letterSpacing: ".1em", textTransform: "uppercase",
                  }}>World {idx + 1}</div>
                  <div style={{ fontFamily: 'Caprasimo, serif', fontSize: 28, lineHeight: 1, marginTop: 4 }}>{w.name}</div>
                  <div style={{ fontSize: 11, opacity: .7, marginTop: 4 }}>{w.subtitle}</div>
                </div>
                <div style={{
                  fontSize: 32, lineHeight: 1, opacity: .9,
                  background: w.accent, color: "#fff",
                  width: 46, height: 46, borderRadius: 999,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "inset 0 -2px 0 rgba(0,0,0,.2)",
                  flexShrink: 0,
                }}>{w.glyph}</div>
              </div>
              {/* level dots */}
              <div style={{ position: "relative", display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                {Array.from({ length: w.levels }).map((_, li) => {
                  const isDone = li < completed;
                  const isLocked = !unlocked || li > completed;
                  return (
                    <div key={li} style={{
                      width: 22, height: 22, borderRadius: 999,
                      background: isDone ? w.accent : "transparent",
                      border: `2px solid ${w.fg}`,
                      opacity: isLocked ? .25 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontFamily: "JetBrains Mono", fontWeight: 700,
                      color: isDone ? "#fff" : w.fg,
                    }}>{isDone ? "★" : li + 1}</div>
                  );
                })}
              </div>
              {!unlocked && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(31,26,20,.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Caprasimo, serif", fontSize: 28, color: "#fff",
                  backdropFilter: "blur(2px)",
                }}>🔒 Locked</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorldBg({ world }) {
  // small decorative pattern preview as svg
  return (
    <div aria-hidden style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      opacity: 0.55,
    }}>
      {world.pattern === "graph" && (
        <svg width="100%" height="100%" style={{ display: "block" }}>
          <defs>
            <pattern id={`gp-${world.id}`} width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M22 0 L0 0 0 22" fill="none" stroke="rgba(31,26,20,.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#gp-${world.id})`} />
        </svg>
      )}
      {world.pattern === "metal" && (
        <svg width="100%" height="100%" style={{ display: "block" }}>
          <defs>
            <pattern id={`mt-${world.id}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M0 18 L18 0 M0 0 L18 18" stroke="rgba(31,26,20,.18)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#mt-${world.id})`} />
        </svg>
      )}
      {world.pattern === "stone" && (
        <svg width="100%" height="100%" style={{ display: "block" }}>
          <defs>
            <pattern id={`st-${world.id}`} width="60" height="32" patternUnits="userSpaceOnUse">
              <rect width="58" height="14" x="1" y="1" fill="rgba(31,22,16,.1)"/>
              <rect width="58" height="14" x="31" y="17" fill="rgba(31,22,16,.1)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#st-${world.id})`} />
        </svg>
      )}
      {world.pattern === "stars" && (
        <svg width="100%" height="100%" style={{ display: "block" }}>
          {Array.from({length: 25}).map((_, i) => {
            const x = (i * 137) % 100, y = (i * 53) % 100, r = (i % 3) * 0.6 + 0.5;
            return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="rgba(255,255,255,.7)"/>;
          })}
        </svg>
      )}
    </div>
  );
}

Object.assign(window, { MenuScreen, WorldMapScreen, Btn, StrokeCounter, BallChip, GoalStar, Title, Sub, WorldBg });

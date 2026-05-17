// canvas.jsx — drawing surface + simple physics simulation

const { useRef, useEffect, useState, useCallback } = React;

// ─── Patterns ────────────────────────────────────────────────────────────
function drawPattern(ctx, w, h, world, palette) {
  ctx.save();
  // base fill
  ctx.fillStyle = world.bg;
  ctx.fillRect(0, 0, w, h);

  if (world.pattern === "graph") {
    ctx.strokeStyle = "rgba(31,26,20,.10)";
    ctx.lineWidth = 1;
    const s = 28;
    for (let x = 0; x < w; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = "rgba(46,91,184,.16)";
    ctx.lineWidth = 1.4;
    for (let x = 0; x < w; x += s * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += s * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  } else if (world.pattern === "metal") {
    // metal mesh diamond
    ctx.strokeStyle = "rgba(31,26,20,.12)";
    ctx.lineWidth = 1;
    const s = 22;
    for (let x = -h; x < w + h; x += s) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke();
    }
    // rivets
    ctx.fillStyle = "rgba(31,26,20,.25)";
    for (let x = 30; x < w; x += 110) {
      for (let y = 30; y < h; y += 110) {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (world.pattern === "stone") {
    // mortar stone blocks
    ctx.fillStyle = "rgba(31,22,16,.08)";
    const bw = 80, bh = 44;
    for (let row = 0; row * bh < h; row++) {
      const offset = row % 2 ? bw / 2 : 0;
      for (let col = -1; col * bw < w; col++) {
        const x = col * bw + offset;
        const y = row * bh;
        ctx.fillRect(x + 1, y + 1, bw - 3, bh - 3);
      }
    }
    // torchlight glow
    const g = ctx.createRadialGradient(w * 0.85, h * 0.15, 20, w * 0.85, h * 0.15, 260);
    g.addColorStop(0, "rgba(255,180,80,.35)");
    g.addColorStop(1, "rgba(255,180,80,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else if (world.pattern === "stars") {
    // starfield
    ctx.fillStyle = "rgba(255,255,255,.85)";
    const seed = 1234;
    let s = seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 140; i++) {
      const x = rnd() * w, y = rnd() * h, r = rnd() * 1.4 + 0.3;
      ctx.globalAlpha = rnd() * 0.7 + 0.3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // nebula
    const ng = ctx.createRadialGradient(w * 0.2, h * 0.6, 30, w * 0.2, h * 0.6, 320);
    ng.addColorStop(0, "rgba(123,211,240,.25)");
    ng.addColorStop(1, "rgba(123,211,240,0)");
    ctx.fillStyle = ng; ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

// ─── Hand-drawn stroke renderer ──────────────────────────────────────────
function drawStroke(ctx, points, color, width, tex) {
  if (points.length < 2) {
    if (points.length === 1) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;

  if (tex === "marker") {
    ctx.lineWidth = width * 1.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (tex === "chalk") {
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    // chalk specks
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < points.length; i += 2) {
      const p = points[i];
      for (let k = 0; k < 3; k++) {
        const ox = (Math.random() - 0.5) * width * 1.6;
        const oy = (Math.random() - 0.5) * width * 1.6;
        ctx.fillRect(p.x + ox, p.y + oy, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  } else {
    // pencil — slightly variable width, double pass for texture
    ctx.lineWidth = width;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = width * 0.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x + 0.6, points[0].y + 0.4);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x + 0.6, points[i].y + 0.4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ─── Physics ─────────────────────────────────────────────────────────────
function segCircleCollide(ball, p1, p2) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((ball.x - p1.x) * dx + (ball.y - p1.y) * dy) / len2));
  const cx = p1.x + t * dx, cy = p1.y + t * dy;
  const nx = ball.x - cx, ny = ball.y - cy;
  const d = Math.hypot(nx, ny);
  if (d < ball.r + 2) {
    const ux = nx / (d || 1), uy = ny / (d || 1);
    // push out
    ball.x = cx + ux * (ball.r + 2);
    ball.y = cy + uy * (ball.r + 2);
    // reflect
    const dot = ball.vx * ux + ball.vy * uy;
    ball.vx = (ball.vx - 2 * dot * ux) * ball.bounce;
    ball.vy = (ball.vy - 2 * dot * uy) * ball.bounce;
    return true;
  }
  return false;
}

// ─── Drawing canvas component ────────────────────────────────────────────
function DrawCanvas({
  width, height, world, palette, strokeStyle, strokeColor,
  strokesMax, strokes, setStrokes,
  ball, goal, launching, onWin, onLose, onResetStrokes,
  showGoal = true,
}) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const drawingRef = useRef(null);
  const ballStateRef = useRef(null);
  const rafRef = useRef(0);
  const dprRef = useRef(1);

  // resolve actual stroke color
  const inkColor = strokeColor || palette.ink;

  // ── render base + strokes
  const renderBase = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = dprRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPattern(ctx, width, height, world, palette);
    // goal star
    if (showGoal && goal) {
      const t = (Date.now() / 600) % (Math.PI * 2);
      const pulse = 1 + Math.sin(t) * 0.08;
      ctx.save();
      ctx.translate(goal.x, goal.y);
      ctx.scale(pulse, pulse);
      // glow
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
      g.addColorStop(0, world.accent + "cc");
      g.addColorStop(1, world.accent + "00");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();
      // star shape
      ctx.fillStyle = world.accent;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 16 : 7;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(31,26,20,.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    // strokes
    for (const s of strokes) drawStroke(ctx, s.points, s.color, s.width, s.tex);
  }, [width, height, world, palette, strokes, goal, showGoal]);

  // ── high-dpi setup
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    c.width = width * dpr;
    c.height = height * dpr;
    c.style.width = width + "px";
    c.style.height = height + "px";
    renderBase();
  }, [width, height, renderBase]);

  // ── pulse animation (star)
  useEffect(() => {
    if (launching) return;
    let stop = false;
    const tick = () => { if (stop) return; renderBase(); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => { stop = true; cancelAnimationFrame(rafRef.current); };
  }, [renderBase, launching]);

  // ── pointer drawing
  const getPt = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const onDown = (e) => {
    if (launching) return;
    if (strokes.length >= strokesMax) return;
    e.preventDefault();
    const p = getPt(e);
    drawingRef.current = { points: [p], color: inkColor, width: strokeStyle.width, tex: strokeStyle.tex };
  };
  const onMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const p = getPt(e);
    const pts = drawingRef.current.points;
    const last = pts[pts.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 2) pts.push(p);
    // live preview render
    renderBase();
    const ctx = canvasRef.current.getContext("2d");
    drawStroke(ctx, drawingRef.current.points, drawingRef.current.color, drawingRef.current.width, drawingRef.current.tex);
  };
  const onUp = () => {
    if (!drawingRef.current) return;
    const s = drawingRef.current;
    drawingRef.current = null;
    if (s.points.length > 1) setStrokes([...strokes, s]);
  };

  // ── physics sim
  useEffect(() => {
    if (!launching) return;
    const c = canvasRef.current; if (!c) return;
    const gravity = world.id === "space" ? 0.18 : 0.42;
    const bs = {
      x: width * 0.15,
      y: 60,
      vx: 1.2,
      vy: 0,
      r: 12,
      bounce: ball.bounce,
      weight: ball.weight,
      color: ball.color,
    };
    ballStateRef.current = bs;
    let frames = 0;
    let won = false, lost = false;
    let trail = [];

    const step = () => {
      if (won || lost) return;
      bs.vy += gravity * bs.weight;
      bs.vx *= 0.995;
      bs.x += bs.vx;
      bs.y += bs.vy;

      // walls
      if (bs.x < bs.r) { bs.x = bs.r; bs.vx = -bs.vx * bs.bounce; }
      if (bs.x > width - bs.r) { bs.x = width - bs.r; bs.vx = -bs.vx * bs.bounce; }

      // collide with all stroke segments
      for (const s of strokes) {
        for (let i = 1; i < s.points.length; i++) {
          if (segCircleCollide(bs, s.points[i - 1], s.points[i])) break;
        }
      }

      // trail
      trail.push({ x: bs.x, y: bs.y });
      if (trail.length > 18) trail.shift();

      // goal
      if (goal && Math.hypot(bs.x - goal.x, bs.y - goal.y) < bs.r + 16) {
        won = true;
        renderBase();
        // explode
        const ctx = c.getContext("2d");
        for (let k = 0; k < 30; k++) {
          const a = (k / 30) * Math.PI * 2;
          const rr = 30 + Math.random() * 20;
          ctx.fillStyle = world.accent;
          ctx.beginPath();
          ctx.arc(goal.x + Math.cos(a) * rr, goal.y + Math.sin(a) * rr, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        setTimeout(() => onWin && onWin(), 400);
        return;
      }

      // off-screen
      if (bs.y > height + 40 || frames > 600) {
        lost = true;
        setTimeout(() => onLose && onLose(), 250);
        return;
      }

      // draw
      renderBase();
      const ctx = c.getContext("2d");
      // trail
      for (let i = 0; i < trail.length; i++) {
        ctx.globalAlpha = (i / trail.length) * 0.4;
        ctx.fillStyle = bs.color;
        ctx.beginPath(); ctx.arc(trail[i].x, trail[i].y, bs.r * (i / trail.length), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // ball
      ctx.fillStyle = bs.color;
      ctx.beginPath(); ctx.arc(bs.x, bs.y, bs.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(31,26,20,.5)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // hilight
      ctx.fillStyle = "rgba(255,255,255,.4)";
      ctx.beginPath(); ctx.arc(bs.x - bs.r * 0.3, bs.y - bs.r * 0.3, bs.r * 0.3, 0, Math.PI * 2); ctx.fill();

      frames++;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [launching]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={onUp}
      style={{
        display: "block",
        width: width + "px",
        height: height + "px",
        cursor: launching ? "default" : "crosshair",
        touchAction: "none",
        borderRadius: 0,
      }}
    />
  );
}

Object.assign(window, { DrawCanvas });

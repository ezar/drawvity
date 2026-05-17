// Procedural Web Audio — no audio files needed

let _ctx: AudioContext | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    try { _ctx = new AudioContext() } catch { return null }
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// ── Draw (soft pencil scratch) ────────────────────────────────────────────
let _lastDraw = 0
export function playDraw(): void {
  const now = performance.now()
  if (now - _lastDraw < 60) return  // throttle: max ~16/s
  _lastDraw = now
  const c = ctx(); if (!c) return
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.04), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.25
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 2800
  filter.Q.value = 1.2
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.18, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)
  src.start(); src.stop(c.currentTime + 0.04)
}

// ── Launch (frequency sweep up) ───────────────────────────────────────────
export function playLaunch(): void {
  const c = ctx(); if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.18)
  gain.gain.setValueAtTime(0.28, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22)
  osc.connect(gain); gain.connect(c.destination)
  osc.start(); osc.stop(c.currentTime + 0.22)
}

// ── Bounce (short click scaled by speed) ──────────────────────────────────
export function playBounce(speed: number): void {
  const vol = Math.min(speed / 8, 1) * 0.22
  if (vol < 0.025) return
  const c = ctx(); if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(280 + speed * 8, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(90, c.currentTime + 0.06)
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07)
  osc.connect(gain); gain.connect(c.destination)
  osc.start(); osc.stop(c.currentTime + 0.07)
}

// ── Win (ascending arpeggio) ──────────────────────────────────────────────
export function playWin(): void {
  const c = ctx(); if (!c) return
  ;[523, 659, 784, 1047].forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = c.currentTime + i * 0.11
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.25, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
    osc.connect(gain); gain.connect(c.destination)
    osc.start(t); osc.stop(t + 0.32)
  })
}

// ── Loss (descending minor tones) ─────────────────────────────────────────
export function playLoss(): void {
  const c = ctx(); if (!c) return
  ;[392, 330, 262].forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    const t = c.currentTime + i * 0.16
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38)
    osc.connect(gain); gain.connect(c.destination)
    osc.start(t); osc.stop(t + 0.38)
  })
}

// ── UI tap ────────────────────────────────────────────────────────────────
export function playTap(): void {
  const c = ctx(); if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(750, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.04)
  gain.gain.setValueAtTime(0.12, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05)
  osc.connect(gain); gain.connect(c.destination)
  osc.start(); osc.stop(c.currentTime + 0.05)
}

// Procedural Web Audio — no audio files needed

let _ctx: AudioContext | null = null
let _master: GainNode | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    try { _ctx = new AudioContext() } catch { return null }
    _master = _ctx.createGain()
    _master.connect(_ctx.destination)
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function out(): AudioNode { return _master! }

export function setAudioEnabled(enabled: boolean): void {
  if (_master) _master.gain.value = enabled ? 1 : 0
  _pendingEnabled = enabled
}
let _pendingEnabled = true

function applyPending() {
  if (_master) _master.gain.value = _pendingEnabled ? 1 : 0
}

// ── Ambient music ─────────────────────────────────────────────────────────────
let _ambientOscs: OscillatorNode[] = []
let _ambientGain: GainNode | null  = null
let _ambientRunning = false

interface AmbientCfg { freq1: number; freq2: number; type: OscillatorType; lfoHz: number; cutoff: number }
const AMBIENT: Record<string, AmbientCfg> = {
  lab:     { freq1:  65.4, freq2: 130.8, type: 'sine',     lfoHz: 0.20, cutoff: 900 },
  factory: { freq1:  55.0, freq2:  82.4, type: 'triangle', lfoHz: 0.45, cutoff: 650 },
  castle:  { freq1:  73.4, freq2: 110.0, type: 'sine',     lfoHz: 0.13, cutoff: 550 },
  space:   { freq1:  49.0, freq2:  73.4, type: 'sine',     lfoHz: 0.07, cutoff: 320 },
}

export function startAmbient(worldId: string): void {
  if (_ambientRunning) stopAmbient()
  const c = ctx(); if (!c) return
  _ambientRunning = true

  const cfg = AMBIENT[worldId] ?? AMBIENT.lab

  const masterG = c.createGain()
  masterG.gain.setValueAtTime(0, c.currentTime)
  masterG.gain.linearRampToValueAtTime(0.07, c.currentTime + 3)
  masterG.connect(out())
  _ambientGain = masterG

  // Low-pass filter + LFO
  const filt = c.createBiquadFilter()
  filt.type = 'lowpass'; filt.frequency.value = cfg.cutoff; filt.Q.value = 2
  filt.connect(masterG)

  const lfoOsc = c.createOscillator()
  const lfoGain = c.createGain()
  lfoOsc.frequency.value = cfg.lfoHz
  lfoGain.gain.value = cfg.cutoff * 0.45
  lfoOsc.connect(lfoGain); lfoGain.connect(filt.frequency)
  lfoOsc.start(); _ambientOscs.push(lfoOsc)

  // Drone — root
  const osc1 = c.createOscillator()
  const g1   = c.createGain()
  osc1.type = cfg.type; osc1.frequency.value = cfg.freq1
  g1.gain.value = 0.6
  osc1.connect(g1); g1.connect(filt)
  osc1.start(); _ambientOscs.push(osc1)

  // Harmonic — octave/fifth
  const osc2 = c.createOscillator()
  const g2   = c.createGain()
  osc2.type = 'sine'; osc2.frequency.value = cfg.freq2
  g2.gain.value = 0.3
  osc2.connect(g2); g2.connect(filt)
  osc2.start(); _ambientOscs.push(osc2)

  // Subtle slow-moving third oscillator for depth
  const osc3 = c.createOscillator()
  const g3   = c.createGain()
  osc3.type = 'sine'; osc3.frequency.value = cfg.freq1 * 1.498  // perfect fifth
  g3.gain.value = 0.15
  osc3.connect(g3); g3.connect(filt)
  osc3.start(); _ambientOscs.push(osc3)
}

export function stopAmbient(): void {
  if (!_ambientRunning) return
  _ambientRunning = false
  if (_ctx && _ambientGain) {
    const t = _ctx.currentTime
    _ambientGain.gain.linearRampToValueAtTime(0, t + 1.5)
    const oscs = [..._ambientOscs]
    setTimeout(() => oscs.forEach(o => { try { o.stop() } catch { /* already stopped */ } }), 1600)
  } else {
    _ambientOscs.forEach(o => { try { o.stop() } catch { /* already stopped */ } })
  }
  _ambientOscs = []
  _ambientGain = null
}

// ── Draw (pencil scratch, pitch varies with speed) ────────────────────────────
let _lastDraw = 0
export function playDraw(speed = 3): void {
  const now = performance.now()
  if (now - _lastDraw < 55) return
  _lastDraw = now
  const c = ctx(); if (!c) return; applyPending()
  const dur = 0.04
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.22
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = Math.min(4200, 2400 + speed * 80)  // faster = higher pitch
  filter.Q.value = 1.4
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.16, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  src.connect(filter); filter.connect(gain); gain.connect(out())
  src.start(); src.stop(c.currentTime + dur)
}

// ── Stroke complete (soft whoosh) ─────────────────────────────────────────────
export function playStroke(): void {
  const c = ctx(); if (!c) return; applyPending()
  const dur = 0.14
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.5
  const src = c.createBufferSource(); src.buffer = buf
  const hi = c.createBiquadFilter()
  hi.type = 'highpass'; hi.frequency.value = 2200
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.14, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  src.connect(hi); hi.connect(gain); gain.connect(out())
  src.start(); src.stop(c.currentTime + dur)
}

// ── World-specific bounce ─────────────────────────────────────────────────────
interface BounceCfg { type: OscillatorType; freqMult: number; endFreq: number; dur: number }
const BOUNCE: Record<string, BounceCfg> = {
  lab:     { type: 'triangle', freqMult: 8,  endFreq: 90,  dur: 0.07 },  // clean tok
  factory: { type: 'sawtooth', freqMult: 6,  endFreq: 55,  dur: 0.05 },  // metallic clank
  castle:  { type: 'triangle', freqMult: 5,  endFreq: 65,  dur: 0.10 },  // stone thud
  space:   { type: 'sine',     freqMult: 12, endFreq: 180, dur: 0.14 },  // ethereal ping
}

export function playBounce(speed: number, worldId = 'lab'): void {
  const vol = Math.min(speed / 8, 1) * 0.22
  if (vol < 0.025) return
  const c = ctx(); if (!c) return; applyPending()
  const cfg = BOUNCE[worldId] ?? BOUNCE.lab
  const osc = c.createOscillator(); const gain = c.createGain()
  osc.type = cfg.type
  osc.frequency.setValueAtTime(260 + speed * cfg.freqMult, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(cfg.endFreq, c.currentTime + cfg.dur)
  gain.gain.setValueAtTime(vol, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + cfg.dur)
  osc.connect(gain); gain.connect(out())
  osc.start(); osc.stop(c.currentTime + cfg.dur)
}

// ── Launch ────────────────────────────────────────────────────────────────────
export function playLaunch(): void {
  const c = ctx(); if (!c) return; applyPending()
  const osc = c.createOscillator(); const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.18)
  gain.gain.setValueAtTime(0.28, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22)
  osc.connect(gain); gain.connect(out())
  osc.start(); osc.stop(c.currentTime + 0.22)
}

// ── Win (ascending arpeggio, world-tinted) ────────────────────────────────────
const WIN_FREQS: Record<string, number[]> = {
  lab:     [523, 659, 784, 1047],
  factory: [440, 554, 659, 880],
  castle:  [494, 587, 740, 988],
  space:   [392, 523, 659, 1047],
}
export function playWin(worldId = 'lab'): void {
  const c = ctx(); if (!c) return; applyPending()
  const freqs = WIN_FREQS[worldId] ?? WIN_FREQS.lab
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator(); const gain = c.createGain()
    const t = c.currentTime + i * 0.11
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.25, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32)
    osc.connect(gain); gain.connect(out())
    osc.start(t); osc.stop(t + 0.32)
  })
}

// ── Loss ──────────────────────────────────────────────────────────────────────
export function playLoss(): void {
  const c = ctx(); if (!c) return; applyPending()
  ;[392, 330, 262].forEach((freq, i) => {
    const osc = c.createOscillator(); const gain = c.createGain()
    const t = c.currentTime + i * 0.16
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.22, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38)
    osc.connect(gain); gain.connect(out())
    osc.start(t); osc.stop(t + 0.38)
  })
}

// ── UI tap ────────────────────────────────────────────────────────────────────
export function playTap(): void {
  const c = ctx(); if (!c) return; applyPending()
  const osc = c.createOscillator(); const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(750, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.04)
  gain.gain.setValueAtTime(0.12, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05)
  osc.connect(gain); gain.connect(out())
  osc.start(); osc.stop(c.currentTime + 0.05)
}

// ── Unlock chime ──────────────────────────────────────────────────────────────
export function playUnlock(): void {
  const c = ctx(); if (!c) return; applyPending()
  ;[660, 880].forEach((freq, i) => {
    const osc = c.createOscillator(); const gain = c.createGain()
    const t = c.currentTime + i * 0.14
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.2, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    osc.connect(gain); gain.connect(out())
    osc.start(t); osc.stop(t + 0.4)
  })
}

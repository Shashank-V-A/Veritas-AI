const STORAGE_KEY = 'veritas-investigation-sound'
/** Overall loudness — kept under 1.0 to avoid clipping. */
const MASTER_GAIN = 0.55

type Listener = (enabled: boolean) => void
type FxKind = 'scan' | 'type' | 'radio' | 'tick'

/**
 * Procedural investigation soundscape — detective-desk / forensics lab vibe:
 * tense pulse bed, CRT hum, typewriter ticks, evidence-scan sweeps,
 * radio squelch, and a case-stamped resolve.
 */
class InvestigationAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private bedNodes: AudioNode[] = []
  private bedSources: Array<OscillatorNode | AudioBufferSourceNode> = []
  private fxTimer: number | null = null
  private pulseTimer: number | null = null
  private running = false
  private unlocked = false
  private fxIndex = 0
  private listeners = new Set<Listener>()

  isEnabled(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === null) return true
      return stored === '1'
    } catch {
      return true
    }
  }

  setEnabled(enabled: boolean) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (!enabled) this.stop()
    this.listeners.forEach((fn) => fn(enabled))
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  unlock() {
    if (!this.isEnabled()) return
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') void ctx.resume()
    this.unlocked = true
  }

  start() {
    if (!this.isEnabled() || this.running || typeof window === 'undefined') return
    this.unlock()
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => this.beginBed())
      return
    }
    this.beginBed()
  }

  stop() {
    this.running = false
    if (this.fxTimer != null) {
      window.clearInterval(this.fxTimer)
      this.fxTimer = null
    }
    if (this.pulseTimer != null) {
      window.clearInterval(this.pulseTimer)
      this.pulseTimer = null
    }

    const now = this.ctx?.currentTime ?? 0
    for (const node of this.bedNodes) {
      if (node instanceof GainNode) {
        try {
          node.gain.cancelScheduledValues(now)
          node.gain.setValueAtTime(Math.max(node.gain.value, 0.0001), now)
          node.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
        } catch {
          /* ignore */
        }
      }
    }

    window.setTimeout(() => this.teardownBed(), 280)
  }

  /** Evidence-scan sweep — used on phase changes. */
  ping() {
    this.playScanBurst()
  }

  /** Preview clip from Settings. */
  preview() {
    this.unlock()
    this.playCaseOpen()
    window.setTimeout(() => this.playScanBurst(), 280)
    window.setTimeout(() => this.playTypeClacks(3), 700)
  }

  /** Dossier sealed. */
  resolve() {
    if (!this.isEnabled() || !this.unlocked) return
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') return
    this.playStamp()
    this.playResolveChord()
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()

      this.compressor = this.ctx.createDynamicsCompressor()
      this.compressor.threshold.value = -18
      this.compressor.knee.value = 12
      this.compressor.ratio.value = 3.5
      this.compressor.attack.value = 0.01
      this.compressor.release.value = 0.2
      this.compressor.connect(this.ctx.destination)

      this.master = this.ctx.createGain()
      this.master.gain.value = MASTER_GAIN
      this.master.connect(this.compressor)
    }
    return this.ctx
  }

  private out(): AudioNode {
    return this.master!
  }

  private beginBed() {
    if (this.running || !this.ctx || !this.master) return
    this.running = true
    this.fxIndex = 0
    const ctx = this.ctx

    // --- Tense low investigation pulse bed ---
    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.0001
    droneGain.connect(this.out())
    this.bedNodes.push(droneGain)

    for (const [freq, type, level] of [
      [48, 'sine', 0.7],
      [72, 'triangle', 0.35],
      [96, 'sine', 0.2],
    ] as const) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = type
      osc.frequency.value = freq
      filter.type = 'lowpass'
      filter.frequency.value = 180
      g.gain.value = level
      osc.connect(filter)
      filter.connect(g)
      g.connect(droneGain)
      osc.start()
      this.bedSources.push(osc)
    }

    // --- CRT / lab monitor hum ---
    const humGain = ctx.createGain()
    humGain.gain.value = 0.0001
    humGain.connect(this.out())
    this.bedNodes.push(humGain)

    const hum = ctx.createOscillator()
    hum.type = 'sawtooth'
    hum.frequency.value = 60
    const humFilter = ctx.createBiquadFilter()
    humFilter.type = 'bandpass'
    humFilter.frequency.value = 120
    humFilter.Q.value = 8
    const humLevel = ctx.createGain()
    humLevel.gain.value = 0.45
    hum.connect(humFilter)
    humFilter.connect(humLevel)
    humLevel.connect(humGain)
    hum.start()
    this.bedSources.push(hum)

    // --- Paper / radio room tone ---
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.0001
    noiseGain.connect(this.out())
    this.bedNodes.push(noiseGain)

    const buffer = this.makeNoiseBuffer(2)
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const nFilter = ctx.createBiquadFilter()
    nFilter.type = 'bandpass'
    nFilter.frequency.value = 1800
    nFilter.Q.value = 0.7
    noise.connect(nFilter)
    nFilter.connect(noiseGain)
    noise.start()
    this.bedSources.push(noise)

    const now = ctx.currentTime
    droneGain.gain.exponentialRampToValueAtTime(0.85, now + 0.45)
    humGain.gain.exponentialRampToValueAtTime(0.35, now + 0.55)
    noiseGain.gain.exponentialRampToValueAtTime(0.28, now + 0.6)

    this.playCaseOpen()
    this.playScanBurst()

    // Heartbeat-like pulse every ~1.1s
    this.pulseTimer = window.setInterval(() => {
      if (this.running) this.playHeartbeat()
    }, 1100)

    // Rotate desk FX: scan / typewriter / radio / tick
    this.fxTimer = window.setInterval(() => {
      if (!this.running) return
      const sequence: FxKind[] = ['scan', 'type', 'tick', 'radio', 'type', 'scan']
      const kind = sequence[this.fxIndex % sequence.length]!
      this.fxIndex += 1
      if (kind === 'scan') this.playScanBurst()
      else if (kind === 'type') this.playTypeClacks(4 + Math.floor(Math.random() * 3))
      else if (kind === 'radio') this.playRadioSquelch()
      else this.playClockTick()
    }, 2400)
  }

  private teardownBed() {
    for (const src of this.bedSources) {
      try {
        src.stop()
        src.disconnect()
      } catch {
        /* already stopped */
      }
    }
    this.bedSources = []
    for (const node of this.bedNodes) {
      try {
        node.disconnect()
      } catch {
        /* ignore */
      }
    }
    this.bedNodes = []
  }

  private makeNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i++) {
      // Brown-ish noise = warmer room tone
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    return buffer
  }

  private playCaseOpen() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime

    // File folder “thud”
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, t)
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18)
    filter.type = 'lowpass'
    filter.frequency.value = 220
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.9, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.out())
    osc.start(t)
    osc.stop(t + 0.3)

    // Paper flap noise burst
    this.playNoiseBurst(t + 0.04, 0.12, 2400, 0.55)
  }

  private playHeartbeat() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime

    const beat = (offset: number, freq: number, peak: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t + offset)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, t + offset + 0.12)
      gain.gain.setValueAtTime(0.0001, t + offset)
      gain.gain.exponentialRampToValueAtTime(peak, t + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.18)
      osc.connect(gain)
      gain.connect(this.out())
      osc.start(t + offset)
      osc.stop(t + offset + 0.2)
    }

    beat(0, 70, 0.55)
    beat(0.16, 58, 0.38)
  }

  private playScanBurst() {
    if (!this.isEnabled() || !this.unlocked || !this.ctx || !this.master) return
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') return
    const t = ctx.currentTime

    // Rising forensic scanner sweep
    const sweep = ctx.createOscillator()
    const sweepGain = ctx.createGain()
    const sweepFilter = ctx.createBiquadFilter()
    sweep.type = 'sawtooth'
    sweep.frequency.setValueAtTime(280, t)
    sweep.frequency.exponentialRampToValueAtTime(1400, t + 0.35)
    sweepFilter.type = 'bandpass'
    sweepFilter.frequency.setValueAtTime(400, t)
    sweepFilter.frequency.exponentialRampToValueAtTime(1600, t + 0.35)
    sweepFilter.Q.value = 6
    sweepGain.gain.setValueAtTime(0.0001, t)
    sweepGain.gain.exponentialRampToValueAtTime(0.45, t + 0.04)
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    sweep.connect(sweepFilter)
    sweepFilter.connect(sweepGain)
    sweepGain.connect(this.out())
    sweep.start(t)
    sweep.stop(t + 0.42)

    // Digital confirmation beeps (evidence hit)
    ;[880, 1175, 1480].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      const start = t + 0.12 + i * 0.07
      const clickFilter = ctx.createBiquadFilter()
      clickFilter.type = 'lowpass'
      clickFilter.frequency.value = 2200
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09)
      osc.connect(clickFilter)
      clickFilter.connect(gain)
      gain.connect(this.out())
      osc.start(start)
      osc.stop(start + 0.1)
    })
  }

  private playTypeClacks(count: number) {
    if (!this.isEnabled() || !this.unlocked || !this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime

    for (let i = 0; i < count; i++) {
      const start = t + i * (0.07 + Math.random() * 0.05)
      // Metallic typewriter key
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1800 + Math.random() * 900, start)
      osc.frequency.exponentialRampToValueAtTime(400, start + 0.04)
      filter.type = 'highpass'
      filter.frequency.value = 600
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.out())
      osc.start(start)
      osc.stop(start + 0.05)
      this.playNoiseBurst(start, 0.025, 5000, 0.35)
    }
  }

  private playRadioSquelch() {
    if (!this.isEnabled() || !this.unlocked || !this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime

    this.playNoiseBurst(t, 0.08, 3200, 0.5)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(420, t)
    osc.frequency.linearRampToValueAtTime(180, t + 0.15)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 900
    filter.Q.value = 4
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.out())
    osc.start(t)
    osc.stop(t + 0.2)
  }

  private playClockTick() {
    if (!this.isEnabled() || !this.unlocked || !this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 2100
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    osc.connect(gain)
    gain.connect(this.out())
    osc.start(t)
    osc.stop(t + 0.06)
  }

  private playStamp() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(110, t)
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.22)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(1.0, t + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    osc.connect(gain)
    gain.connect(this.out())
    osc.start(t)
    osc.stop(t + 0.38)
    this.playNoiseBurst(t, 0.06, 900, 0.65)
  }

  private playResolveChord() {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const t = ctx.currentTime
    // Minor → major lift = case closed
    const notes = [
      { f: 196, d: 0 },
      { f: 246.94, d: 0.06 },
      { f: 293.66, d: 0.12 },
      { f: 392, d: 0.2 },
    ]
    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = note.f
      const start = t + 0.05 + note.d
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.42, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7)
      osc.connect(gain)
      gain.connect(this.out())
      osc.start(start)
      osc.stop(start + 0.75)
    }
  }

  private playNoiseBurst(
    start: number,
    duration: number,
    cutoff: number,
    peak: number,
  ) {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const buffer = this.makeNoiseBuffer(Math.max(duration + 0.05, 0.1))
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = cutoff
    filter.Q.value = 1.2
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.out())
    src.start(start)
    src.stop(start + duration + 0.02)
  }
}

export const investigationAudio = new InvestigationAudio()

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  unlock() {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
  }

  private getNoise(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const length = ctx.sampleRate * 0.2;
      this.noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }

  playTone(opts: {
    freqStart: number;
    freqEnd?: number;
    duration: number;
    type?: OscillatorType;
    volume?: number;
    delay?: number;
  }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const { freqStart, freqEnd, duration, type = 'sine', volume = 0.08, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
    }
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playNoise(opts: { duration: number; volume?: number; delay?: number }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const { duration, volume = 0.06, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.getNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t0);
    filter.frequency.exponentialRampToValueAtTime(300, t0 + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  spinStart() {
    this.playNoise({ duration: 0.35, volume: 0.07 });
    this.playTone({ freqStart: 160, freqEnd: 520, duration: 0.32, type: 'sawtooth', volume: 0.03 });
  }

  /* Act 1 — anticipatory pull: a low, rising swell that sells the wind-up. */
  windupSwell() {
    this.playTone({ freqStart: 90, freqEnd: 340, duration: 0.5, type: 'sawtooth', volume: 0.032 });
    this.playTone({ freqStart: 45, freqEnd: 120, duration: 0.52, type: 'sine', volume: 0.05 });
    this.playNoise({ duration: 0.42, volume: 0.05 });
  }

  /* Tension-aware tick: lower & heavier the slower the wheel moves. */
  tickTension(freq: number, volume = 0.028) {
    this.playTone({ freqStart: freq, freqEnd: freq * 0.86, duration: 0.05, type: 'square', volume });
  }

  /* Act 3 — sustained low drone held while the wheel settles on its winner. */
  startDrone() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.droneOsc) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(64, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.droneOsc = osc;
    this.droneGain = gain;
  }

  stopDrone() {
    if (!this.ctx || !this.droneOsc || !this.droneGain) return;
    const t = this.ctx.currentTime;
    this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, t);
    this.droneGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    const osc = this.droneOsc;
    this.droneOsc = null;
    this.droneGain = null;
    osc.stop(t + 0.22);
  }

  /* Sharp impact the instant the wheel locks onto its winner. */
  snap() {
    this.playTone({ freqStart: 240, freqEnd: 70, duration: 0.1, type: 'square', volume: 0.06 });
    this.playNoise({ duration: 0.09, volume: 0.09 });
  }

  tick() {
    this.playTone({ freqStart: 1000, freqEnd: 800, duration: 0.045, type: 'square', volume: 0.028 });
  }

  pointerClick() {
    this.playTone({ freqStart: 700, freqEnd: 900, duration: 0.06, type: 'triangle', volume: 0.05 });
  }

  winner() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      this.playTone({ freqStart: f, duration: 0.28, type: 'sine', volume: 0.08, delay: i * 0.1 });
    });
    this.playTone({ freqStart: 262, freqEnd: 523, duration: 0.5, type: 'triangle', volume: 0.05, delay: 0.35 });
    this.playNoise({ duration: 0.5, volume: 0.04, delay: 0.5 });
  }

  error() {
    this.playTone({ freqStart: 300, freqEnd: 150, duration: 0.25, type: 'square', volume: 0.05 });
    this.playTone({ freqStart: 250, freqEnd: 120, duration: 0.28, type: 'sawtooth', volume: 0.04, delay: 0.12 });
  }

  dispose() {
    this.stopDrone();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

export const audio = new AudioEngine();
export { audio as audioEngine };
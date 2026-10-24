/** Procedural WebAudio SFX. No assets; the context is created on the first user input. */
type Wave = OscillatorType;
/** ALT-02: four-bar bass line (A2, F2, C3, G2). */
const BASS = [110, 87.3, 130.8, 98];

export class Sfx {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  /** Call from a user gesture (pointer / key). Safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.7;
  }

  private tone(f0: number, f1: number, dur: number, type: Wave, vol: number, delay = 0): void {
    const c = this.ctx;
    if (!c || !this.master || this.muted) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Filtered noise burst; f0 -> f1 sweeps the filter. `swell` fades in instead of out. */
  private hiss(f0: number, f1: number, dur: number, type: BiquadFilterType, vol: number, swell = false, delay = 0): void {
    const c = this.ctx;
    if (!c || !this.master || !this.noise || this.muted) return;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    s.buffer = this.noise;
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    if (swell) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.45);
    } else {
      g.gain.setValueAtTime(vol, t);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  whoosh(): void {
    this.hiss(500, 2200, 0.22, 'bandpass', 0.16);
  }

  counter(combo: number): void {
    this.tone(170, 40, 0.22, 'sine', 0.9);
    this.hiss(1800, 300, 0.09, 'lowpass', 0.5);
    this.tone(520 + Math.min(combo, 8) * 60, 900 + Math.min(combo, 8) * 90, 0.12, 'triangle', 0.18, 0.02);
  }

  block(): void {
    this.tone(760, 420, 0.07, 'square', 0.22);
    this.tone(300, 200, 0.08, 'triangle', 0.4);
  }

  hit(): void {
    this.hiss(900, 120, 0.28, 'lowpass', 0.9);
    this.tone(120, 38, 0.3, 'sine', 0.8);
  }

  feint(): void {
    this.tone(500, 160, 0.18, 'sawtooth', 0.14);
  }

  knockout(): void {
    this.hiss(700, 300, 0.7, 'bandpass', 0.35, true);
    this.tone(1318, 1318, 1.0, 'sine', 0.3, 0.1);
    this.tone(1976, 1976, 0.8, 'sine', 0.16, 0.1);
    this.tone(659, 659, 1.2, 'sine', 0.2, 0.1);
  }

  gameOver(): void {
    this.tone(330, 220, 0.25, 'triangle', 0.35);
    this.tone(247, 147, 0.4, 'triangle', 0.35, 0.22);
    this.hiss(400, 150, 0.6, 'lowpass', 0.25, true, 0.1);
  }

  /** ALT-02 music: called on every eighth note. Kick on beats, hat on off-beats, bass on bar starts. */
  step(eighth: number): void {
    const beat = eighth % 2 === 0;
    if (beat) this.tone(140, 45, 0.16, 'sine', eighth % 8 === 0 ? 0.75 : 0.55);
    else this.hiss(9000, 6000, 0.04, 'highpass', 0.12);
    if (eighth % 8 === 0) this.tone(BASS[(eighth / 8) % BASS.length], BASS[(eighth / 8) % BASS.length], 0.35, 'triangle', 0.22);
    if (eighth % 8 === 6) this.tone(330, 330, 0.06, 'square', 0.05);
  }

  start(): void {
    this.tone(392, 392, 0.08, 'square', 0.14);
    this.tone(587, 587, 0.14, 'square', 0.14, 0.08);
  }
}

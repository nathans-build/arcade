// Tiny WebAudio chip-sound synth: square/triangle blips and noise bursts, plus an
// original looping bassline. No audio files needed.

const MUTE_KEY = "lunarPatrol.muted";

export class ChipAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private nextNoteTime = 0;
  muted: boolean;

  constructor() {
    let m = false;
    try {
      m = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      // ignore
    }
    this.muted = m;
  }

  /** Must be called from a user gesture (browsers block autoplay). */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.25;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.25;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? "1" : "0");
    } catch {
      // ignore
    }
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.5, slideTo?: number, at?: number) {
    if (!this.ctx || !this.master) return;
    const t = at ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.6) {
    if (!this.ctx || !this.master) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g).connect(this.master);
    src.start();
  }

  shoot() { this.tone(1400, 0.08, "square", 0.25, 500); }
  jump() { this.tone(300, 0.25, "triangle", 0.5, 700); }
  explode() { this.noise(0.4, 0.7); this.tone(120, 0.3, "square", 0.3, 40); }
  crash() { this.noise(0.9, 0.9); this.tone(200, 0.8, "sawtooth", 0.3, 30); }
  checkpoint() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, "square", 0.3, undefined, (this.ctx?.currentTime ?? 0) + i * 0.1)); }
  correct() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, "square", 0.35, undefined, (this.ctx?.currentTime ?? 0) + i * 0.08)); }
  wrong() { this.tone(180, 0.35, "sawtooth", 0.35, 90); }
  blip() { this.tone(880, 0.05, "square", 0.2); }

  // Original 16-step bassline (A minor-ish), ~140 BPM sixteenth notes.
  private static BASS = [110, 0, 110, 131, 0, 147, 0, 131, 110, 0, 110, 165, 0, 147, 131, 98];

  startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    const stepDur = 60 / 140 / 2;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
        const f = ChipAudio.BASS[this.step % ChipAudio.BASS.length];
        if (f) this.tone(f, stepDur * 0.9, "triangle", 0.45, undefined, this.nextNoteTime);
        if (this.step % 4 === 0) this.tone(60, 0.05, "square", 0.15, 30, this.nextNoteTime);
        this.step++;
        this.nextNoteTime += stepDur;
      }
    }, 30);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

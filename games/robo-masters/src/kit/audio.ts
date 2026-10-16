// Tiny WebAudio chip-sound synth for every arcade game. No audio files, no requests.
//
// 1. Sound effects: square/triangle blips and noise bursts (`tone`, `noise`, `shoot`, `jump`, ...).
// 2. The original looping 16-step bassline (`startMusic` / `stopMusic`) for games without a song.
// 3. NES-style 4-channel songs: pulse 1 (lead), pulse 2 (harmony/echo), triangle (bass) and noise
//    (drums), written as note strings in a small TypeScript song format (see kit/README.md), played
//    by a look-ahead scheduler (`playSong`, `stopSong`, `playJingle`, `setTempoScale`, `setIntensity`).
//
// Music and sound effects have separate on/off switches (`toggleMusic`, `toggleSfx`), saved per
// device like `arcade.muted`, which still silences everything.

const MUTE_KEY = "arcade.muted";
const MUSIC_OFF_KEY = "arcade.musicOff";
const SFX_OFF_KEY = "arcade.sfxOff";

/** Overall loudness when not muted. */
const MASTER_LEVEL = 0.25;
/** Music sits a little under the sound effects (classroom-friendly). */
const MUSIC_LEVEL = 0.62;
const SFX_LEVEL = 1;
/** How far ahead (s) the scheduler books notes, and how often (ms) it wakes up. */
const LOOKAHEAD = 0.1;
const TICK_MS = 25;

/* ================================================================== song format (pure) */

/** The four NES-style channels: pulse 1, pulse 2, triangle, noise. */
export type ChannelId = "lead" | "harmony" | "bass" | "drums";
export const CHANNELS: readonly ChannelId[] = ["lead", "harmony", "bass", "drums"];

/** Drum letters on the noise channel: kick, snare, closed hat, open hat, tom. */
export type DrumHit = "k" | "s" | "h" | "o" | "t";

/** One step of an expanded pattern. */
export type Step =
  | { kind: "note"; midi: number; arp?: number[] }
  | { kind: "drum"; hits: DrumHit[] }
  | { kind: "rest" }
  | { kind: "tie" };

/** How a channel sounds. Every field is optional. */
export interface Voice {
  /** Pulse width for lead/harmony: 0.125, 0.25 or 0.5 (default 0.25 lead, 0.5 harmony). */
  duty?: 0.125 | 0.25 | 0.5;
  /** Channel loudness (defaults: lead 0.2, harmony 0.1, bass 0.48, drums 0.5). */
  volume?: number;
  /** Envelope in seconds (attack, decay, release) and sustain level 0..1. */
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  /** Fraction of the note's steps that sound (1 = legato, 0.5 = staccato). Default about 0.9. */
  gate?: number;
  /** Delayed vibrato: depth in cents, rate in Hz, delay in seconds. */
  vibrato?: { depth: number; rate: number; delay?: number };
  /** Plays the channel this many octaves up/down. */
  octave?: number;
  /** Harmony only: when a section has no harmony part, echo the lead `steps` later. */
  echo?: { steps: number; octave?: number };
}

/**
 * A song: tempo, named patterns, sections (one pattern string per channel) and the order
 * they play in. Pattern strings are whitespace-separated tokens:
 *   C5  F#4  Bb3   a note (C4 = middle C)        .   rest        -   hold (tie) the note before
 *   C4+47          arpeggio: C4, E4, G4 cycling (semitone offsets, hex digits 0-c)
 *   k s h o t      drums: kick, snare, closed hat, open hat, tom ("kh" = kick + hat together)
 *   @name          a named pattern from `patterns`;  token*N  repeats a token (e.g. @a*2, .*4)
 *   |              bar line (ignored, just for reading)
 * A channel shorter than its section repeats to fill it (so a 16-step drum loop can sit under a
 * 64-step melody); the lengths must divide the section's length.
 */
export interface Song {
  title: string;
  bpm: number;
  /** Steps per beat (default 4, so a step is a 16th note). */
  stepsPerBeat?: number;
  /** Semitones added to every note. */
  transpose?: number;
  voices?: Partial<Record<ChannelId, Voice>>;
  patterns?: Record<string, string>;
  sections: Record<string, Section>;
  /** Section names in play order, e.g. ["intro", "A", "A", "B"]. */
  order: string[];
  /** Where a looping song goes back to after the last section: an index into `order` or a section name. Default 0. */
  loopTo?: number | string;
}

/** One pattern string per channel (missing channels rest), plus an optional transpose in semitones. */
export type Section = Partial<Record<ChannelId, string>> & { transpose?: number };

/** A jingle is just a short song that plays once. */
export type Jingle = Song;

const NOTE_RE = /^([A-G])(#|b)?(-?\d)(?:\+([0-9a-cA-C]{1,4}))?$/;
const SEMIS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C4" → 60, "A4" → 69, "Bb3" → 58. Returns null for anything that isn't a plain note name. */
export function noteToMidi(name: string): number | null {
  const m = NOTE_RE.exec(name);
  if (!m || m[4]) return null;
  return (Number(m[3]) + 1) * 12 + SEMIS[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** "A4" → 440. Throws on a bad name. */
export function noteHz(name: string): number {
  const m = noteToMidi(name);
  if (m === null) throw new Error(`not a note: ${name}`);
  return midiToHz(m);
}

/** Parses one token (without *N) into a step. Throws on an unknown token. */
export function parseToken(tok: string): Step {
  if (tok === ".") return { kind: "rest" };
  if (tok === "-") return { kind: "tie" };
  const m = NOTE_RE.exec(tok);
  if (m) {
    const midi = (Number(m[3]) + 1) * 12 + SEMIS[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    if (!m[4]) return { kind: "note", midi };
    return { kind: "note", midi, arp: [0, ...[...m[4]].map((c) => parseInt(c, 16))] };
  }
  if (/^[ksoht]+$/.test(tok) && new Set(tok).size === tok.length) return { kind: "drum", hits: [...tok] as DrumHit[] };
  throw new Error(`unknown token "${tok}"`);
}

/** Expands a pattern string (with @references and *N repeats) into steps. Throws on a bad token. */
export function parsePattern(src: string, patterns: Record<string, string> = {}, depth = 0): Step[] {
  if (depth > 8) throw new Error("patterns refer to each other too deeply (a loop?)");
  const out: Step[] = [];
  for (const raw of src.split(/\s+/)) {
    if (!raw || raw === "|") continue;
    const rep = /^(.+)\*(\d+)$/.exec(raw);
    const tok = rep ? rep[1] : raw;
    const n = rep ? Number(rep[2]) : 1;
    if (n < 1 || n > 256) throw new Error(`bad repeat in "${raw}"`);
    let steps: Step[];
    if (tok.startsWith("@")) {
      const ref = patterns[tok.slice(1)];
      if (ref === undefined) throw new Error(`unknown pattern "${tok}"`);
      steps = parsePattern(ref, patterns, depth + 1);
    } else steps = [parseToken(tok)];
    for (let i = 0; i < n; i++) out.push(...steps);
  }
  return out;
}

/** How many steps the note at `i` lasts: itself plus the ties right after it. */
export function noteLength(steps: readonly Step[], i: number): number {
  let n = 1;
  while (i + n < steps.length && steps[i + n].kind === "tie") n++;
  return n;
}

/** Seconds per step. */
export function stepSeconds(bpm: number, stepsPerBeat = 4, tempoScale = 1): number {
  return 60 / (bpm * stepsPerBeat * tempoScale);
}

export interface CompiledSection {
  name: string;
  length: number;
  transpose: number;
  channels: Record<ChannelId, Step[]>;
}

export interface CompiledSong {
  song: Song;
  stepsPerBeat: number;
  sections: CompiledSection[];
  /** Indices into `sections`, in play order. */
  order: number[];
  /** Index into `order` where a loop restarts. */
  loopTo: number;
}

export interface SongPos {
  order: number;
  step: number;
}

/** Expands every section to full-length per-channel step lists. Throws on a malformed song. */
export function compileSong(song: Song): CompiledSong {
  const names = Object.keys(song.sections);
  const sections: CompiledSection[] = names.map((name) => {
    const sec = song.sections[name];
    const parts: Partial<Record<ChannelId, Step[]>> = {};
    let length = 0;
    for (const ch of CHANNELS) {
      const src = sec[ch];
      if (src === undefined) continue;
      const steps = parsePattern(src, song.patterns ?? {});
      if (!steps.length) throw new Error(`section ${name}: ${ch} is empty`);
      parts[ch] = steps;
      length = Math.max(length, steps.length);
    }
    if (!length) throw new Error(`section ${name} has no parts`);
    const channels = {} as Record<ChannelId, Step[]>;
    for (const ch of CHANNELS) {
      const steps = parts[ch];
      if (!steps) {
        channels[ch] = Array.from({ length }, (): Step => ({ kind: "rest" }));
        continue;
      }
      if (length % steps.length) throw new Error(`section ${name}: ${ch} has ${steps.length} steps, which doesn't divide ${length}`);
      channels[ch] = Array.from({ length }, (_, i) => steps[i % steps.length]);
    }
    const echo = song.voices?.harmony?.echo;
    if (echo && sec.harmony === undefined && parts.lead) {
      const lead = channels.lead;
      const shift = Math.max(1, Math.round(echo.steps));
      const oct = (echo.octave ?? 0) * 12;
      channels.harmony = Array.from({ length }, (_, i): Step => {
        const s = lead[(i - shift + length) % length];
        return s.kind === "note" ? { ...s, midi: s.midi + oct } : s;
      });
      // A tie can't start the echo: the note it held belongs to the end of the section.
      for (let i = 0; i < length && channels.harmony[i].kind === "tie"; i++) channels.harmony[i] = { kind: "rest" };
    }
    return { name, length, transpose: sec.transpose ?? 0, channels };
  });
  const order = song.order.map((n) => {
    const i = names.indexOf(n);
    if (i < 0) throw new Error(`order: unknown section "${n}"`);
    return i;
  });
  if (!order.length) throw new Error("order is empty");
  const loopTo = typeof song.loopTo === "string" ? song.order.indexOf(song.loopTo) : song.loopTo ?? 0;
  if (!Number.isInteger(loopTo) || loopTo < 0 || loopTo >= order.length) throw new Error(`loopTo ${String(song.loopTo)} is not in the order`);
  return { song, stepsPerBeat: song.stepsPerBeat ?? 4, sections, order, loopTo };
}

/** The position after `pos`: next step, next section, back to `loopTo`, or null at the end of a one-shot. */
export function advance(c: CompiledSong, pos: SongPos, loop: boolean): SongPos | null {
  const sec = c.sections[c.order[pos.order]];
  if (pos.step + 1 < sec.length) return { order: pos.order, step: pos.step + 1 };
  if (pos.order + 1 < c.order.length) return { order: pos.order + 1, step: 0 };
  return loop ? { order: c.loopTo, step: 0 } : null;
}

/** Seconds for the intro (the order before loopTo), one pass of the looping part, and both. */
export function songSeconds(song: Song): { intro: number; loop: number; total: number } {
  const c = compileSong(song);
  const sd = stepSeconds(song.bpm, c.stepsPerBeat);
  let intro = 0;
  let loop = 0;
  c.order.forEach((si, i) => {
    const s = c.sections[si].length * sd;
    if (i < c.loopTo) intro += s;
    else loop += s;
  });
  return { intro, loop, total: intro + loop };
}

/** Lowest and highest MIDI note a song plays (after transposes, arps and octave shifts), or null if silent. */
export function songRange(song: Song): { low: number; high: number } | null {
  const c = compileSong(song);
  let low = Infinity;
  let high = -Infinity;
  for (const si of new Set(c.order)) {
    const sec = c.sections[si];
    for (const ch of ["lead", "harmony", "bass"] as const) {
      const shift = (song.transpose ?? 0) + sec.transpose + (song.voices?.[ch]?.octave ?? 0) * 12;
      for (const s of sec.channels[ch]) {
        if (s.kind !== "note") continue;
        low = Math.min(low, s.midi + shift);
        high = Math.max(high, s.midi + Math.max(0, ...(s.arp ?? [0])) + shift);
      }
    }
  }
  return low === Infinity ? null : { low, high };
}

/** Problems with a song (empty when it's fine): parsing, lengths, channel contents, note range, order. */
export function validateSong(song: Song): string[] {
  const out: string[] = [];
  const t = song.title || "(untitled)";
  if (!song.title) out.push("song has no title");
  if (!(song.bpm >= 40 && song.bpm <= 240)) out.push(`${t}: bpm ${song.bpm} is outside 40-240`);
  const spb = song.stepsPerBeat ?? 4;
  if (!(Number.isInteger(spb) && spb >= 1 && spb <= 8)) out.push(`${t}: stepsPerBeat ${spb} must be 1-8`);
  for (const [name, src] of Object.entries(song.patterns ?? {})) {
    try {
      parsePattern(src, song.patterns ?? {});
    } catch (e) {
      out.push(`${t}: pattern ${name}: ${(e as Error).message}`);
    }
  }
  let c: CompiledSong;
  try {
    c = compileSong(song);
  } catch (e) {
    out.push(`${t}: ${(e as Error).message}`);
    return out;
  }
  for (const sec of c.sections) {
    for (const ch of CHANNELS) {
      const steps = sec.channels[ch];
      if (steps[0]?.kind === "tie") out.push(`${t}: section ${sec.name}: ${ch} starts with a tie`);
      if (ch === "drums" && steps.some((s) => s.kind === "note")) out.push(`${t}: section ${sec.name}: a note on the drum channel`);
      if (ch !== "drums" && steps.some((s) => s.kind === "drum")) out.push(`${t}: section ${sec.name}: a drum hit on the ${ch} channel`);
    }
  }
  const r = songRange(song);
  // E1 (28) up to C7 (96): low enough for a deep triangle, high enough for a bright lead, never shrill.
  if (r && (r.low < 28 || r.high > 96)) out.push(`${t}: notes ${r.low}-${r.high} (MIDI) go outside 28-96`);
  return out;
}

/** Builds a one-section song for a short jingle. */
export function jingle(title: string, bpm: number, parts: Section, voices?: Song["voices"], stepsPerBeat = 4): Jingle {
  return { title, bpm, stepsPerBeat, voices, sections: { J: parts }, order: ["J"] };
}

/** Which channels each intensity keeps: "calm" = lead + bass, "normal" = + drums, "full" = all four. */
export type Intensity = "calm" | "normal" | "full" | readonly ChannelId[];

export function intensityChannels(level: Intensity): ChannelId[] {
  if (typeof level !== "string") return [...level];
  if (level === "calm") return ["lead", "bass"];
  if (level === "normal") return ["lead", "bass", "drums"];
  return [...CHANNELS];
}

/** Fourier coefficients of a pulse wave with the given duty cycle (for createPeriodicWave). */
export function pulseCoefficients(duty: number, harmonics = 48): { real: Float32Array; imag: Float32Array } {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  return { real, imag };
}

/* ================================================================== synth voices */

type Tonal = "lead" | "harmony" | "bass";
type VoiceSettings = Voice & { volume: number; attack: number; decay: number; sustain: number; release: number; gate: number };

const DEFAULT_VOICES: Record<ChannelId, VoiceSettings> = {
  lead: { duty: 0.25, volume: 0.2, attack: 0.004, decay: 0.12, sustain: 0.65, release: 0.05, gate: 0.9 },
  harmony: { duty: 0.5, volume: 0.1, attack: 0.004, decay: 0.12, sustain: 0.55, release: 0.05, gate: 0.85 },
  bass: { volume: 0.48, attack: 0.003, decay: 0.05, sustain: 1, release: 0.03, gate: 0.92 },
  drums: { volume: 0.5, attack: 0, decay: 0, sustain: 0, release: 0, gate: 1 },
};

interface ToneVoice {
  osc: OscillatorNode;
  env: GainNode;
  lfoGain?: GainNode;
  v: VoiceSettings;
}

/**
 * One set of persistent voices (2 pulses, triangle, noise drums) feeding one output gain.
 * Notes are envelope and frequency automation on these nodes, so playing a song creates no
 * nodes per note; everything is stopped and disconnected when the band stops.
 */
class Band {
  readonly out: GainNode;
  readonly mix = {} as Record<ChannelId, GainNode>;
  private tones: Partial<Record<Tonal, ToneVoice>> = {};
  private hatEnv: GainNode;
  private snareEnv: GainNode;
  private kickOsc: OscillatorNode;
  private kickEnv: GainNode;
  private drumVol: number;
  private sources: AudioScheduledSourceNode[] = [];
  private nodes: AudioNode[] = [];
  private stopped = false;

  constructor(private ctx: BaseAudioContext, dest: AudioNode, voices: Song["voices"], waves: (duty: number) => PeriodicWave | null, noiseBuf: AudioBuffer) {
    this.out = this.gain(1);
    this.out.connect(dest);
    for (const ch of CHANNELS) {
      this.mix[ch] = this.gain(1);
      this.mix[ch].connect(this.out);
    }
    for (const ch of ["lead", "harmony", "bass"] as const) {
      const v: VoiceSettings = { ...DEFAULT_VOICES[ch], ...(voices?.[ch] ?? {}) };
      const osc = ctx.createOscillator();
      if (ch === "bass") osc.type = "triangle";
      else {
        const w = waves(v.duty ?? 0.5);
        if (w) osc.setPeriodicWave(w);
        else osc.type = "square";
      }
      const env = this.gain(0);
      osc.connect(env).connect(this.mix[ch]);
      const tv: ToneVoice = { osc, env, v };
      if (v.vibrato) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = v.vibrato.rate;
        const lfoGain = this.gain(v.vibrato.delay ? 0 : v.vibrato.depth);
        lfo.connect(lfoGain).connect(osc.detune);
        tv.lfoGain = lfoGain;
        this.start(lfo);
      }
      this.start(osc);
      this.tones[ch] = tv;
    }
    this.drumVol = voices?.drums?.volume ?? DEFAULT_VOICES.drums.volume;
    // Drums: one looping noise buffer through a high-pass (hats) and a band-pass (snare), plus a
    // triangle "kick" oscillator whose pitch drops for kicks and toms.
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1900;
    bp.Q.value = 0.7;
    this.nodes.push(hp, bp);
    this.hatEnv = this.gain(0);
    this.snareEnv = this.gain(0);
    noise.connect(hp).connect(this.hatEnv).connect(this.mix.drums);
    noise.connect(bp).connect(this.snareEnv).connect(this.mix.drums);
    this.kickOsc = ctx.createOscillator();
    this.kickOsc.type = "triangle";
    this.kickEnv = this.gain(0);
    this.kickOsc.connect(this.kickEnv).connect(this.mix.drums);
    this.start(noise);
    this.start(this.kickOsc);
  }

  private gain(v: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = v;
    this.nodes.push(g);
    return g;
  }

  private start(s: AudioScheduledSourceNode) {
    s.start();
    this.sources.push(s);
    this.nodes.push(s);
  }

  /** Books a tonal note at `t` lasting `dur` seconds (arpeggio and vibrato included). Returns 1 if booked. */
  note(ch: Tonal, midi: number, arp: number[] | undefined, t: number, dur: number): number {
    const tv = this.tones[ch];
    if (!tv || this.stopped) return 0;
    const v = tv.v;
    const m = midi + (v.octave ?? 0) * 12;
    const f = tv.osc.frequency;
    f.setValueAtTime(midiToHz(m), t);
    if (arp && arp.length > 1) {
      // The classic chip chord: cycle through the chord tones about 40 times a second.
      const sub = 1 / 40;
      for (let k = 1, tt = t + sub; tt < t + dur; k++, tt += sub) f.setValueAtTime(midiToHz(m + arp[k % arp.length]), tt);
    }
    const g = tv.env.gain;
    const attack = Math.min(v.attack, dur * 0.4);
    g.setTargetAtTime(v.volume, t, Math.max(0.001, attack / 3));
    g.setTargetAtTime(v.volume * v.sustain, t + attack, Math.max(0.005, v.decay / 3));
    g.setTargetAtTime(0, t + dur, Math.max(0.005, v.release / 3));
    if (tv.lfoGain && v.vibrato?.delay) {
      tv.lfoGain.gain.setValueAtTime(0, t);
      if (v.vibrato.delay < dur) tv.lfoGain.gain.setTargetAtTime(v.vibrato.depth, t + v.vibrato.delay, 0.04);
    }
    return 1;
  }

  /** Books drum hits at `t`. Returns how many were booked. */
  drum(hits: readonly DrumHit[], t: number): number {
    if (this.stopped) return 0;
    const vol = this.drumVol;
    for (const h of hits) {
      if (h === "k" || h === "t") {
        const [from, to, len] = h === "k" ? [150, 42, 0.12] : [260, 110, 0.14];
        this.kickOsc.frequency.setValueAtTime(from, t);
        this.kickOsc.frequency.exponentialRampToValueAtTime(to, t + len);
        this.kickEnv.gain.setValueAtTime(vol * (h === "k" ? 1.2 : 0.8), t);
        this.kickEnv.gain.setTargetAtTime(0, t + 0.03, 0.04);
      } else if (h === "s") {
        this.snareEnv.gain.setValueAtTime(vol * 0.75, t);
        this.snareEnv.gain.setTargetAtTime(0, t + 0.01, 0.045);
      } else {
        const open = h === "o";
        this.hatEnv.gain.setValueAtTime(vol * (open ? 0.4 : 0.32), t);
        this.hatEnv.gain.setTargetAtTime(0, t + (open ? 0.02 : 0.004), open ? 0.07 : 0.014);
      }
    }
    return hits.length;
  }

  /** Fades out from `at`, then stops and disconnects every node. */
  stop(at: number) {
    if (this.stopped) return;
    this.stopped = true;
    this.out.gain.cancelScheduledValues(at);
    this.out.gain.setTargetAtTime(0, at, 0.02);
    let left = this.sources.length;
    for (const s of this.sources) {
      s.onended = () => {
        if (--left === 0) for (const n of this.nodes) n.disconnect();
      };
      try {
        s.stop(at + 0.15);
      } catch {
        // already stopped
      }
    }
  }
}

interface Player {
  c: CompiledSong;
  band: Band;
  pos: SongPos | null;
  /** Audio-clock time of the next step. */
  next: number;
  loop: boolean;
  jingle: boolean;
  /** While a jingle plays, the song waits (silently) until this time, then carries on where it was. */
  holdUntil: number;
  /** Jingles: when the last note has finished. */
  endAt: number;
  then: "resume" | "stop" | Song;
}

/** Books every step of `p` that starts before `horizon`; returns how many steps and notes were booked. */
function bookSteps(p: Player, now: number, horizon: number, tempoScale: number): { steps: number; notes: number } {
  let steps = 0;
  let notes = 0;
  // Fell far behind (e.g. a throttled background timer): pick up from now, never burst.
  if (p.next < now - 0.2) p.next = now + 0.02;
  while (p.pos && p.next < horizon && steps < 100000) {
    const sec = p.c.sections[p.c.order[p.pos.order]];
    const sd = stepSeconds(p.c.song.bpm, p.c.stepsPerBeat, p.jingle ? 1 : tempoScale);
    const tr = (p.c.song.transpose ?? 0) + sec.transpose;
    for (const ch of CHANNELS) {
      const st = sec.channels[ch][p.pos.step];
      if (st.kind === "note" && ch !== "drums") {
        const len = noteLength(sec.channels[ch], p.pos.step);
        const gate = p.c.song.voices?.[ch]?.gate ?? DEFAULT_VOICES[ch].gate;
        notes += p.band.note(ch, st.midi + tr, st.arp, p.next, len * sd * gate);
      } else if (st.kind === "drum" && ch === "drums") {
        notes += p.band.drum(st.hits, p.next);
      }
    }
    steps++;
    p.next += sd;
    p.pos = advance(p.c, p.pos, p.loop);
  }
  return { steps, notes };
}

function makeNoise(ctx: BaseAudioContext): AudioBuffer {
  const len = ctx.sampleRate;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** A pulse wave for the duty cycle (null → plain square, which is 50% anyway). */
function makeWave(ctx: BaseAudioContext, duty: number): PeriodicWave | null {
  try {
    if (duty === 0.5 || typeof ctx.createPeriodicWave !== "function") return null;
    const { real, imag } = pulseCoefficients(duty);
    return ctx.createPeriodicWave(real, imag);
  } catch {
    return null;
  }
}

/**
 * Books `seconds` of a song onto any audio context in one go: for rendering a preview with an
 * OfflineAudioContext (games use `ChipAudio.playSong`). Returns how many notes were booked.
 */
export function scheduleSong(ctx: BaseAudioContext, dest: AudioNode, song: Song, seconds: number, opts: { loop?: boolean; tempoScale?: number; channels?: Intensity } = {}): number {
  const waves = new Map<number, PeriodicWave | null>();
  const band = new Band(ctx, dest, song.voices, (d) => {
    if (!waves.has(d)) waves.set(d, makeWave(ctx, d));
    return waves.get(d) ?? null;
  }, makeNoise(ctx));
  const on = intensityChannels(opts.channels ?? "full");
  for (const ch of CHANNELS) band.mix[ch].gain.value = on.includes(ch) ? 1 : 0;
  const p: Player = { c: compileSong(song), band, pos: { order: 0, step: 0 }, next: 0.02, loop: opts.loop ?? true, jingle: false, holdUntil: 0, endAt: 0, then: "resume" };
  const { notes } = bookSteps(p, 0, seconds, opts.tempoScale ?? 1);
  band.stop(Math.min(seconds, p.next + 0.3));
  return notes;
}

export interface MusicStats {
  /** Scheduler wake-ups, steps booked, notes and drum hits booked, songs and jingles started, AudioContexts made. */
  ticks: number;
  steps: number;
  notes: number;
  songs: number;
  jingles: number;
  contexts: number;
}

/* ================================================================== ChipAudio */

export class ChipAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private nextNoteTime = 0;
  private waves = new Map<number, PeriodicWave | null>();
  private noiseBuf: AudioBuffer | null = null;
  private song: Player | null = null;
  private jinglePlayer: Player | null = null;
  private pending: { song: Song; loop: boolean } | null = null;
  private songTimer: number | null = null;
  private tempoScale = 1;
  private channelsOn: ChannelId[] = [...CHANNELS];
  private ducked = false;
  private hidden = false;
  muted: boolean;
  /** Music (songs, jingles, the classic bassline) on/off; saved per device in `arcade.musicOff`. */
  musicOn: boolean;
  /** Sound effects on/off; saved per device in `arcade.sfxOff`. */
  sfxOn: boolean;
  /** Turn the music down while read-aloud (speechSynthesis) is talking. */
  duckForSpeech = true;
  /** Music level while ducked (fraction of normal). */
  duckLevel = 0.28;
  /** Debug counters (for tests and ?debug hooks). */
  readonly stats: MusicStats = { ticks: 0, steps: 0, notes: 0, songs: 0, jingles: 0, contexts: 0 };
  /** The latest music calls, oldest first: "song:<title>", "jingle:<title>", "stop", "tempo:1.1", ... */
  readonly history: string[] = [];

  /** `bass` lets each game have its own 16-step loop (Hz, 0 = rest). */
  constructor(private bass: number[] = ChipAudio.DEFAULT_BASS, private bpm = 140) {
    this.muted = readFlag(MUTE_KEY);
    this.musicOn = !readFlag(MUSIC_OFF_KEY);
    this.sfxOn = !readFlag(SFX_OFF_KEY);
  }

  private log(s: string) {
    this.history.push(s);
    if (this.history.length > 60) this.history.splice(0, this.history.length - 60);
  }

  /** Must be called from a user gesture (browsers block autoplay). */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.stats.contexts++;
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_LEVEL;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxOn ? SFX_LEVEL : 0;
      this.sfxBus.connect(this.master);
      this.duckGain = this.ctx.createGain();
      this.duckGain.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicOn ? MUSIC_LEVEL : 0;
      this.musicBus.connect(this.duckGain);
      if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => this.onVisibility());
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.pending) {
      const p = this.pending;
      this.pending = null;
      this.stopLegacyLoop();
      this.startSongAt(p.song, p.loop, this.ctx.currentTime + 0.05);
    }
  }

  /** The AudioContext, once `unlock` has made one. */
  get context(): AudioContext | null {
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_LEVEL;
    writeFlag(MUTE_KEY, this.muted);
    return this.muted;
  }

  /** Music on/off (songs, jingles and the classic bassline). Returns the new `musicOn`. */
  toggleMusic() {
    this.setMusicOn(!this.musicOn);
    return this.musicOn;
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    writeFlag(MUSIC_OFF_KEY, !on);
    if (this.musicBus && this.ctx) this.musicBus.gain.setTargetAtTime(on ? MUSIC_LEVEL : 0, this.ctx.currentTime, 0.03);
    this.log(on ? "music:on" : "music:off");
  }

  /** Sound effects on/off. Returns the new `sfxOn`. */
  toggleSfx() {
    this.setSfxOn(!this.sfxOn);
    return this.sfxOn;
  }

  setSfxOn(on: boolean) {
    this.sfxOn = on;
    writeFlag(SFX_OFF_KEY, !on);
    if (this.sfxBus && this.ctx) this.sfxBus.gain.setTargetAtTime(on ? SFX_LEVEL : 0, this.ctx.currentTime, 0.01);
    this.log(on ? "sfx:on" : "sfx:off");
  }

  /** Turns the music down (e.g. while a narrator talks) or back up. Read-aloud ducks it automatically. */
  duck(on: boolean) {
    this.ducked = on;
    this.applyDuck();
  }

  private applyDuck() {
    if (!this.ctx || !this.duckGain) return;
    const target = this.ducked || (this.duckForSpeech && isSpeaking()) ? this.duckLevel : 1;
    if (Math.abs(this.duckGain.gain.value - target) > 0.01) this.duckGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
  }

  tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.5, slideTo?: number, at?: number) {
    this.toneTo(this.sfxBus, freq, dur, type, vol, slideTo, at);
  }

  private toneTo(bus: GainNode | null, freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, at?: number) {
    if (!this.ctx || !bus) return;
    const t = at ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(bus);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur: number, vol = 0.6) {
    if (!this.ctx || !this.sfxBus) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g).connect(this.sfxBus);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
    };
    src.start();
  }

  private seq(freqs: number[], dur: number, gap: number, vol = 0.3) {
    const t0 = this.ctx?.currentTime ?? 0;
    freqs.forEach((f, i) => this.tone(f, dur, "square", vol, undefined, t0 + i * gap));
  }

  shoot() { this.tone(1400, 0.08, "square", 0.25, 500); }
  jump() { this.tone(300, 0.25, "triangle", 0.5, 700); }
  explode() { this.noise(0.4, 0.7); this.tone(120, 0.3, "square", 0.3, 40); }
  crash() { this.noise(0.9, 0.9); this.tone(200, 0.8, "sawtooth", 0.3, 30); }
  checkpoint() { this.seq([523, 659, 784], 0.12, 0.1); }
  correct() { this.seq([523, 659, 784, 1047], 0.14, 0.08, 0.35); }
  wrong() { this.tone(180, 0.35, "sawtooth", 0.35, 90); }
  blip() { this.tone(880, 0.05, "square", 0.2); }
  levelUp() { this.seq([392, 523, 659, 784, 1047, 1319], 0.1, 0.07, 0.3); }
  gameOver() { this.seq([392, 330, 262, 196], 0.25, 0.22, 0.3); }

  static DEFAULT_BASS = [110, 0, 110, 131, 0, 147, 0, 131, 110, 0, 110, 165, 0, 147, 131, 98];

  /** The classic 16-step bassline loop (for games without a song). */
  startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    const stepDur = 60 / this.bpm / 2;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx) return;
      this.applyDuck();
      // After the tab was in the background, pick up from now instead of catching up in a burst.
      if (this.nextNoteTime < this.ctx.currentTime - 0.25) this.nextNoteTime = this.ctx.currentTime + 0.05;
      while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
        const f = this.bass[this.step % this.bass.length];
        if (f) this.toneTo(this.musicBus, f, stepDur * 0.9, "triangle", 0.45, undefined, this.nextNoteTime);
        if (this.step % 4 === 0) this.toneTo(this.musicBus, 60, 0.05, "square", 0.15, 30, this.nextNoteTime);
        this.step++;
        this.nextNoteTime += stepDur;
      }
    }, 30);
  }

  /** Stops the classic bassline and the song (a jingle that is playing finishes). */
  stopMusic() {
    this.stopLegacyLoop();
    if (this.song || this.pending) this.stopSong();
  }

  /** Replaces the classic bassline (and optionally its tempo) for the next `startMusic`. */
  setBass(bass: number[], bpm?: number) {
    this.bass = bass;
    if (bpm) this.bpm = bpm;
  }

  private stopLegacyLoop() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /* ---------------------------------------------------------------- songs */

  /** Title of the song that is playing (or waiting for the first tap), or null. */
  get currentSong(): string | null {
    return this.song?.c.song.title ?? this.pending?.song.title ?? null;
  }

  /**
   * Plays a song (looping unless `loop: false`), replacing the one playing. Asking for the song that
   * is already playing does nothing (pass `restart: true` to start it over). Before the first tap
   * (`unlock`) the song waits and starts on that tap. During a jingle it starts when the jingle ends.
   */
  playSong(song: Song, opts: { loop?: boolean; restart?: boolean } = {}) {
    const loop = opts.loop ?? true;
    if (!opts.restart && (this.song?.c.song === song || this.pending?.song === song)) return;
    this.log(`song:${song.title}`);
    if (!this.ctx || !this.musicBus) {
      this.pending = { song, loop };
      return;
    }
    this.stopLegacyLoop();
    if (this.jinglePlayer) this.jinglePlayer.then = "resume";
    this.startSongAt(song, loop, this.ctx.currentTime + 0.05);
  }

  private startSongAt(song: Song, loop: boolean, at: number) {
    if (!this.ctx || !this.musicBus) return;
    if (this.song) this.song.band.stop(Math.max(this.ctx.currentTime, at - 0.04));
    const c = compileSong(song);
    const band = this.makeBand(song, this.musicBus);
    this.applyIntensity(band, true);
    const holdUntil = this.jinglePlayer && this.jinglePlayer.then === "resume" ? this.jinglePlayer.endAt : 0;
    if (holdUntil) {
      band.out.gain.value = 0;
      band.out.gain.setTargetAtTime(1, holdUntil, 0.05);
    }
    this.song = { c, band, pos: { order: 0, step: 0 }, next: at, loop, jingle: false, holdUntil, endAt: 0, then: "resume" };
    this.stats.songs++;
    this.ensureTimer();
  }

  /** Stops the song (a jingle that is playing finishes). */
  stopSong() {
    if (this.song || this.pending) this.log("stop");
    this.pending = null;
    if (this.song && this.ctx) this.song.band.stop(this.ctx.currentTime);
    this.song = null;
    if (this.jinglePlayer) this.jinglePlayer.then = "stop";
    this.stopTimerIfIdle();
  }

  /**
   * Plays a short one-shot stinger. The song fades out while it plays and then carries on where it
   * was (`then: "resume"`, the default); `then: "stop"` ends the song; `then: song` starts that song
   * afterwards. Jingles play at the music volume, or at the sound-effects volume when music is off.
   */
  playJingle(j: Jingle, opts: { then?: "resume" | "stop" | Song } = {}) {
    const then = opts.then ?? "resume";
    this.log(`jingle:${j.title}`);
    if (!this.ctx || !this.musicBus || !this.sfxBus) {
      if (then === "stop") this.pending = null;
      else if (then !== "resume") this.pending = { song: then, loop: true };
      return;
    }
    const now = this.ctx.currentTime;
    if (this.jinglePlayer) this.jinglePlayer.band.stop(now);
    this.stopLegacyLoop();
    const c = compileSong(j);
    const band = this.makeBand(j, this.musicOn ? this.musicBus : this.sfxBus);
    const start = now + 0.04;
    const endAt = start + songSeconds(j).total + 0.05;
    this.jinglePlayer = { c, band, pos: { order: 0, step: 0 }, next: start, loop: false, jingle: true, holdUntil: 0, endAt, then };
    this.stats.jingles++;
    if (this.song) {
      if (then === "stop") {
        this.song.band.stop(now);
        this.song = null;
      } else {
        const g = this.song.band.out.gain;
        g.cancelScheduledValues(now);
        g.setTargetAtTime(0, now, 0.02);
        this.song.holdUntil = endAt;
        if (then === "resume") g.setTargetAtTime(1, endAt, 0.05);
      }
    }
    this.ensureTimer();
  }

  /** Speeds the song up or slows it down (1 = as written; e.g. 1.12 for a "hurry up"). Jingles ignore it. */
  setTempoScale(x: number) {
    const v = Math.max(0.5, Math.min(2, x));
    if (v === this.tempoScale) return;
    this.tempoScale = v;
    this.log(`tempo:${v}`);
  }

  get tempo(): number {
    return this.tempoScale;
  }

  /** Thins or fills the arrangement: "calm" = lead + bass, "normal" = + drums, "full" = all four, or a channel list. It stays until changed. */
  setIntensity(level: Intensity) {
    const chans = intensityChannels(level);
    if (chans.length === this.channelsOn.length && chans.every((c) => this.channelsOn.includes(c))) return;
    this.channelsOn = chans;
    this.log(`intensity:${typeof level === "string" ? level : chans.join("+")}`);
    if (this.song) this.applyIntensity(this.song.band, false);
  }

  /** The channels the current intensity lets through. */
  get activeChannels(): readonly ChannelId[] {
    return this.channelsOn;
  }

  private applyIntensity(band: Band, now: boolean) {
    for (const ch of CHANNELS) {
      const v = this.channelsOn.includes(ch) ? 1 : 0;
      if (now || !this.ctx) band.mix[ch].gain.value = v;
      else band.mix[ch].gain.setTargetAtTime(v, this.ctx.currentTime, 0.12);
    }
  }

  private makeBand(song: Song, dest: AudioNode): Band {
    const ctx = this.ctx!;
    if (!this.noiseBuf) this.noiseBuf = makeNoise(ctx);
    return new Band(ctx, dest, song.voices, (duty) => {
      // Pulse waves are cached per duty cycle and shared by every band.
      if (!this.waves.has(duty)) this.waves.set(duty, makeWave(ctx, duty));
      return this.waves.get(duty) ?? null;
    }, this.noiseBuf);
  }

  private ensureTimer() {
    if (this.songTimer !== null || this.hidden) return;
    this.songTimer = window.setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  private stopTimerIfIdle() {
    if (this.songTimer !== null && !this.song && !this.jinglePlayer) {
      clearInterval(this.songTimer);
      this.songTimer = null;
    }
  }

  /** The look-ahead scheduler: books every step that starts within the next LOOKAHEAD seconds. */
  private tick() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.stats.ticks++;
    this.applyDuck();
    const now = ctx.currentTime;
    const horizon = now + LOOKAHEAD;
    const j = this.jinglePlayer;
    if (j) {
      this.run(j, now, horizon);
      if (typeof j.then === "object" && horizon >= j.endAt && this.song?.c.song !== j.then) this.startSongAt(j.then, true, j.endAt);
      if (now >= j.endAt) {
        this.jinglePlayer = null;
        j.band.stop(now);
      }
    }
    const s = this.song;
    if (s) {
      if (s.holdUntil && horizon >= s.holdUntil) {
        s.next = Math.max(s.holdUntil, now + 0.01);
        s.holdUntil = 0;
      }
      if (!s.holdUntil) this.run(s, now, horizon);
      if (!s.pos && now > s.next) {
        s.band.stop(now);
        this.song = null;
      }
    }
    this.stopTimerIfIdle();
  }

  private run(p: Player, now: number, horizon: number) {
    const r = bookSteps(p, now, horizon, this.tempoScale);
    this.stats.steps += r.steps;
    this.stats.notes += r.notes;
  }

  private onVisibility() {
    const ctx = this.ctx;
    if (!ctx || typeof document === "undefined") return;
    const hidden = document.visibilityState === "hidden";
    if (hidden === this.hidden) return;
    this.hidden = hidden;
    const now = ctx.currentTime;
    if (hidden) {
      // Pause scheduling in the background; the song continues from the same spot when the tab returns.
      if (this.songTimer !== null) {
        clearInterval(this.songTimer);
        this.songTimer = null;
      }
      const j = this.jinglePlayer;
      if (j) {
        this.jinglePlayer = null;
        j.band.stop(now);
        if (this.song) this.song.holdUntil = 0;
        if (typeof j.then === "object") this.startSongAt(j.then, true, now);
      }
      if (this.song) {
        this.song.band.out.gain.cancelScheduledValues(now);
        this.song.band.out.gain.setTargetAtTime(0, now, 0.02);
      }
    } else if (this.song) {
      this.song.next = ctx.currentTime + 0.05;
      this.song.band.out.gain.cancelScheduledValues(now);
      this.song.band.out.gain.setTargetAtTime(1, now, 0.05);
      this.ensureTimer();
    }
  }
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? "1" : "0");
  } catch {
    // ignore
  }
}

function isSpeaking(): boolean {
  try {
    return typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking;
  } catch {
    return false;
  }
}

/**
 * With `?debug` in the page URL, exposes the game's ChipAudio and soundtrack as `window.__music`
 * for automated playtests (call counts, history, toggles) and preview rendering.
 */
export function exposeMusicDebug(audio: ChipAudio, songs: Record<string, Song>, jingles: Record<string, Jingle>) {
  try {
    if (typeof window === "undefined" || !new URLSearchParams(window.location.search).has("debug")) return;
    (window as unknown as { __music: unknown }).__music = { audio, songs, jingles, scheduleSong, validateSong, songSeconds };
  } catch {
    // ignore
  }
}

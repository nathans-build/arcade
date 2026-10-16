/*
 * Soundtrack checks:   npm test   (npx tsx scripts/check-music.ts)
 * 1. The kit's chiptune song helpers (src/kit/audio.ts): note names → MIDI/Hz, token and pattern
 *    parsing (@references, *N repeats, bar lines, arpeggios, drums), ties, section filling and the
 *    harmony echo, order/loop iteration, step timing, song length, validation and intensity levels.
 * 2. This game's soundtrack (src/music.ts): every song and jingle parses and validates, every channel
 *    divides its section, notes stay in range (bass low, lead in a bright but not shrill range),
 *    songs loop after roughly 25-75 s, jingles are short one-shots, and titles are unique.
 * This file is identical in every game that has a soundtrack.
 */
import {
  CHANNELS, advance, compileSong, intensityChannels, jingle, midiToHz, noteHz, noteLength, noteToMidi, parsePattern, parseToken,
  pulseCoefficients, songRange, songSeconds, stepSeconds, validateSong, type CompiledSong, type Song, type SongPos,
} from "../src/kit/audio";
import { JINGLES, SONGS } from "../src/music";

let checks = 0;
const problems: string[] = [];
function check(cond: boolean, msg: string | (() => string)) {
  checks++;
  if (!cond) problems.push(typeof msg === "string" ? msg : msg());
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
function throws(f: () => unknown): boolean {
  try {
    f();
    return false;
  } catch {
    return true;
  }
}

/* ---------------------------------------------------------------- 1. helpers */

check(noteToMidi("C4") === 60, "C4 is MIDI 60");
check(noteToMidi("A4") === 69, "A4 is MIDI 69");
check(noteToMidi("Bb3") === 58 && noteToMidi("A#3") === 58, "Bb3 = A#3 = 58");
check(noteToMidi("C#5") === 73 && noteToMidi("Db5") === 73, "C#5 = Db5 = 73");
check(noteToMidi("E1") === 28 && noteToMidi("C7") === 96, "E1 = 28, C7 = 96");
check(noteToMidi("H4") === null && noteToMidi("c4") === null && noteToMidi("C") === null && noteToMidi("C4+47") === null, "bad note names give null");
check(near(midiToHz(69), 440) && near(midiToHz(81), 880) && near(midiToHz(57), 220), "A4 = 440 Hz, octaves double");
check(near(noteHz("C4"), 261.6255653, 1e-4), "C4 ≈ 261.63 Hz");
check(throws(() => noteHz("Q9")), "noteHz throws on a bad name");

check(parseToken(".").kind === "rest" && parseToken("-").kind === "tie", "rest and tie tokens");
{
  const t = parseToken("C4+47");
  check(t.kind === "note" && t.midi === 60 && JSON.stringify(t.arp) === "[0,4,7]", "C4+47 is a C major arpeggio");
  const m = parseToken("D4+37a");
  check(m.kind === "note" && JSON.stringify(m.arp) === "[0,3,7,10]", "hex arpeggio digits (a = 10)");
  const d = parseToken("kh");
  check(d.kind === "drum" && d.hits.join("") === "kh", "kh = kick + hat");
  check(throws(() => parseToken("kk")) && throws(() => parseToken("x")) && throws(() => parseToken("C4+")), "unknown tokens throw");
}
{
  const pats = { a: "C4 . E4 -", b: "@a G4*2" };
  const steps = parsePattern("@b | @a*2 .*3", pats);
  check(steps.length === 6 + 8 + 3, () => `@refs, *N and bar lines expand (got ${steps.length})`);
  check(steps[4].kind === "note" && steps[4].midi === 67 && steps[5].kind === "note", "G4*2 repeats a note");
  check(steps.slice(-3).every((s) => s.kind === "rest"), ".*3 is three rests");
  check(throws(() => parsePattern("@nope")), "unknown pattern reference throws");
  check(throws(() => parsePattern("@x", { x: "@y", y: "@x" })), "a pattern loop throws");
  check(noteLength(parsePattern("C4 - - D4 . E4 -"), 0) === 3 && noteLength(parsePattern("C4 - - D4 . E4 -"), 3) === 1 && noteLength(parsePattern("C4 - - D4 . E4 -"), 5) === 2, "ties lengthen notes");
}
check(near(stepSeconds(120, 4), 0.125) && near(stepSeconds(120, 2), 0.25) && near(stepSeconds(120, 4, 2), 0.0625), "step timing (bpm, steps per beat, tempo scale)");

const demo: Song = {
  title: "Test Tune",
  bpm: 120,
  stepsPerBeat: 2,
  voices: { harmony: { echo: { steps: 2, octave: -1 } } },
  patterns: { riff: "C5 - E5 . G5 - E5 ." },
  sections: {
    intro: { drums: "k h" },
    A: { lead: "@riff*2", bass: "C3 . G2 .", drums: "k h s h" },
    B: { lead: "F5 - - - E5 - - -", harmony: "A4+37 - - - - - - -", bass: "F2 - - - C3 - - -", transpose: 2 },
  },
  order: ["intro", "A", "B"],
  loopTo: "A",
};
{
  const c: CompiledSong = compileSong(demo);
  check(c.sections.map((s) => s.length).join() === "2,16,8", "section lengths are their longest channel");
  check(c.sections[1].channels.bass.length === 16 && c.sections[1].channels.drums.length === 16, "shorter channels repeat to fill the section");
  const h = c.sections[1].channels.harmony;
  check(h[0].kind === "rest" || h[0].kind === "note", "echo starts cleanly");
  check(h[2].kind === "note" && h[2].midi === 72 - 12, "harmony echoes the lead 2 steps later, an octave down");
  check(c.sections[2].channels.harmony[0].kind === "note", "a written harmony part beats the echo");
  check(c.loopTo === 1 && c.order.join() === "0,1,2", "order and loopTo (by section name)");
  // Walk one pass and a loop.
  let pos: SongPos | null = { order: 0, step: 0 };
  let n = 0;
  while (pos && n < 1000) {
    const nxt: SongPos | null = advance(c, pos, true);
    n++;
    if (nxt && nxt.order === 1 && nxt.step === 0 && pos.order === 2) break;
    pos = nxt;
  }
  check(n === 2 + 16 + 8, () => `one pass is 26 steps before looping back to A (got ${n})`);
  let one: SongPos | null = { order: 0, step: 0 };
  let k = 0;
  while (one) {
    one = advance(c, one, false);
    k++;
  }
  check(k === 26, "a one-shot ends after its last step");
  const secs = songSeconds(demo);
  check(near(secs.intro, 2 * 0.25) && near(secs.loop, 24 * 0.25) && near(secs.total, 26 * 0.25), "songSeconds splits intro and loop");
  const r = songRange(demo);
  check(!!r && r.low === 43 && r.high === 77 + 2, () => `songRange covers transposes, arps and echo (got ${JSON.stringify(r)})`);
  check(validateSong(demo).length === 0, () => `demo song validates: ${validateSong(demo).join("; ")}`);
}
{
  const bad = (patch: Partial<Song>) => validateSong({ ...demo, ...patch });
  check(bad({ bpm: 10 }).length > 0, "silly tempo is caught");
  check(bad({ order: ["A", "Z"] }).length > 0, "unknown section in order is caught");
  check(bad({ loopTo: 7 }).length > 0, "loopTo outside the order is caught");
  check(bad({ sections: { A: { lead: "C5 D5 E5", bass: "C3 . . ." } }, order: ["A"], loopTo: 0 }).length > 0, "lengths that don't divide are caught");
  check(bad({ sections: { A: { lead: "C5 k" } }, order: ["A"], loopTo: 0 }).length > 0, "a drum on the lead is caught");
  check(bad({ sections: { A: { drums: "k C4" } }, order: ["A"], loopTo: 0 }).length > 0, "a note on the drums is caught");
  check(bad({ sections: { A: { lead: "- C5" } }, order: ["A"], loopTo: 0 }).length > 0, "a leading tie is caught");
  check(bad({ sections: { A: { lead: "C8" } }, order: ["A"], loopTo: 0 }).length > 0, "a shrill note is caught");
  check(bad({ sections: { A: { bass: "C0" } }, order: ["A"], loopTo: 0 }).length > 0, "a too-low note is caught");
  check(bad({ sections: { A: { lead: "C5 @gone" } }, order: ["A"], loopTo: 0 }).length > 0, "a missing pattern is caught");
}
{
  const j = jingle("Ding", 150, { lead: "C5 E5 G5 C6" });
  check(j.order.length === 1 && validateSong(j).length === 0 && near(songSeconds(j).total, 4 * stepSeconds(150, 4)), "jingle() builds a one-section song");
}
check(intensityChannels("calm").join() === "lead,bass" && intensityChannels("full").length === 4 && intensityChannels("normal").join() === "lead,bass,drums" && intensityChannels(["bass"]).join() === "bass", "intensity levels");
check(CHANNELS.join() === "lead,harmony,bass,drums", "four NES-style channels");
{
  const half = pulseCoefficients(0.5, 8).real;
  const quarter = pulseCoefficients(0.25, 8).real;
  check(near(half[2], 0) && near(half[4], 0) && half[1] > 0.6, "50% pulse has only odd harmonics");
  check(near(quarter[4], 0) && quarter[2] > 0.3, "25% pulse has every 4th harmonic missing");
}

/* ---------------------------------------------------------------- 2. this game's soundtrack */

const titles = new Set<string>();
const songs = Object.entries(SONGS);
const jingles = Object.entries(JINGLES);
check(songs.length >= 1, "the game has a song");
check(jingles.length >= 1, "the game has jingles");
for (const [key, s] of [...songs, ...jingles]) {
  for (const p of validateSong(s)) problems.push(`${key}: ${p}`);
  checks++;
  check(!titles.has(s.title), `${key}: title "${s.title}" is used twice`);
  titles.add(s.title);
  const c = compileSong(s);
  for (const sec of c.sections) for (const ch of CHANNELS) check(sec.channels[ch].length === sec.length, `${key}/${sec.name}/${ch} fills the section`);
  // Every section is used.
  const used = new Set(c.order);
  check(c.sections.every((_, i) => used.has(i)), `${key}: every section is in the order`);
  // Bass stays low, the lead stays in a singing range.
  for (const si of used) {
    const sec = c.sections[si];
    const tr = (s.transpose ?? 0) + sec.transpose;
    for (const st of sec.channels.bass) if (st.kind === "note") check(st.midi + tr + (s.voices?.bass?.octave ?? 0) * 12 <= 64, `${key}/${sec.name}: bass note ${st.midi + tr} is above E4`);
    for (const st of sec.channels.lead) if (st.kind === "note") check(st.midi + tr >= 50 && st.midi + tr <= 92, `${key}/${sec.name}: lead note ${st.midi + tr} outside D3-G#6`);
  }
}
for (const [key, s] of songs) {
  const { loop, total } = songSeconds(s);
  check(loop >= 25 && loop <= 75, `${key}: loops after ${loop.toFixed(1)} s (want about 30-60)`);
  check(total <= 90, `${key}: a pass takes ${total.toFixed(1)} s`);
  check(s.bpm >= 60 && s.bpm <= 190, `${key}: tempo ${s.bpm}`);
}
for (const [key, j] of jingles) {
  const t = songSeconds(j).total;
  check(t >= 0.5 && t <= 8, `${key}: jingle lasts ${t.toFixed(2)} s (want 0.5-8)`);
}

if (problems.length) {
  console.error(`Music: ${problems.length} problem(s) in ${checks} checks`);
  for (const p of problems.slice(0, 60)) console.error(" - " + p);
  process.exit(1);
}
console.log(`Music: all ${checks} checks passed (${songs.length} songs, ${jingles.length} jingles).`);

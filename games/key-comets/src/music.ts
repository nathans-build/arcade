/*
 * Key Comets' soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Every printable key is typing input, so the music stays steady and out of the way: a driving
 * minor-key space groove for timed rounds (it speeds up a little with the combo), a slower, softer
 * tune for Practice, and a short title loop. Music and SFX switches are on-screen buttons only.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Timed rounds: A minor, a pulsing octave bass and a sparse lead that leaves room for the typing clicks. */
export const ROUND_SONG: Song = {
  title: "Comet Watch",
  bpm: 144,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.14, gate: 0.8, vibrato: { depth: 8, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.05, gate: 0.6 },
    bass: { volume: 0.42, gate: 0.55 },
    drums: { volume: 0.26 },
  },
  patterns: {
    a1: "E5 - - . A5 - G5 . | E5 - - - . . D5 E5",
    a2: "D5 - - . G5 - F5 . | E5 - - - B4 - - .",
    a3: "C5 . E5 . A5 - - . | A5 . G5 . F5 - - .",
    a4: "F5 - E5 - D5 - - . | E5 - - - G#4 - B4 .",
    b1: "C6 - - - B5 - A5 - | G5 - - - D5 - G5 -",
    b2: "B5 - - - G5 - E5 - | A5 - - - E5 - - -",
    b3: "C6 - - - B5 - A5 - | B5 - - - D6 - - -",
    b4: "B5 - - - G#5 - E5 - | B4 - - - . . . .",
    c1: "A4 - - - - - C5 - | D5 - - - C5 - - -",
    c2: "A4 - - - - - E5 - | D5 - - - - - . .",
    c3: "F5 - - - E5 - D5 - | C5 - - - D5 - - -",
    c4: "E5 - - - - - - - | G#4 - - - B4 - - -",
    Am: "A2 . A3 A2 . A2 A3 .", F: "F2 . F3 F2 . F2 F3 .", G: "G2 . G3 G2 . G2 G3 .", Em: "E2 . E3 E2 . E2 E3 .",
    Dm: "D2 . D3 D2 . D2 D3 .", E: "E2 . E3 E2 . E2 E3 .", C: "C3 . C3 C2 . C2 C3 .",
    hAm: "A3+37 - . . A3+37 - . .", hF: "F3+47 - . . F3+47 - . .", hG: "G3+47 - . . G3+47 - . .", hEm: "E3+37 - . . E3+37 - . .",
    hDm: "D4+37 - . . D4+37 - . .", hE: "E3+47 - . . E3+47 - . .",
    rAm: "A4 C5 E5 C5 A4 C5 E5 C5", rF: "F4 A4 C5 A4 F4 A4 C5 A4", rDm: "D4 F4 A4 F4 D4 F4 A4 F4", rE: "E4 G#4 B4 G#4 E4 G#4 B4 G#4",
    beat: "k . h . s . h . | k . h k s . h h",
    ride: "k . h . h . h . | k . h . h . h o",
  },
  sections: {
    intro: { bass: "@Am @Am", drums: "k . k . s . k . | k . k . s s s s" },
    A: {
      lead: "@a1 @a2 @a3 @a4",
      harmony: "@hAm @hF @hG @hEm @hAm @hF @hDm @hE",
      bass: "@Am @F @G @Em @Am @F @Dm @E",
      drums: "@beat",
    },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "@hF @hG @hEm @hAm @hF @hG @hE @hE",
      bass: "@F @G @Em @Am @F @G @E @E",
      drums: "@beat",
    },
    C: {
      lead: "@c1 @c2 @c3 @c4",
      harmony: "@rAm @rF @rAm @rF @rDm @rDm @rE @rE",
      bass: "A2 - - - - - - - | F2 - - - - - - - | A2 - - - - - - - | F2 - - - - - - - | D2 - - - - - - - | D2 - - - - - - - | E2 - - - - - - - | E2 - - - E3 - E2 -",
      drums: "@ride",
    },
  },
  order: ["intro", "A", "B", "A", "C"],
  loopTo: "A",
};

/** Practice: comets wait for you, so the music floats (D major, slow, soft, no snare). */
export const PRACTICE_SONG: Song = {
  title: "Orbit Drift",
  bpm: 108,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.1, attack: 0.02, sustain: 0.55, vibrato: { depth: 9, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.04, gate: 0.5 },
    bass: { volume: 0.34, gate: 0.85 },
    drums: { volume: 0.16 },
  },
  patterns: {
    p1: "F#5 - - - A5 - - - | E5 - - - - - D5 -",
    p2: "B4 - - - D5 - E5 - | F#5 - - - - - - -",
    p3: "G5 - - - F#5 - E5 - | D5 - - - A4 - - -",
    p4: "B4 - D5 - E5 - - - | D5 - - - - - . .",
    q1: "A5 - - - B5 - A5 - | F#5 - - - - - - -",
    q2: "G5 - - - A5 - G5 - | E5 - - - - - - -",
    q3: "F#5 - - - G5 - F#5 - | D5 - - - B4 - - -",
    q4: "C#5 - - - E5 - - - | A4 - - - - - . .",
    D: "D2 - - - A2 - - -", Bm: "B1 - - - F#2 - - -", G: "G1 - - - D2 - - -", A: "A1 - - - E2 - - -", Em: "E2 - - - B2 - - -",
    Fsm: "F#2 - - - C#3 - - -",
    aD: ". . D4+47 . . . D4+47 .", aBm: ". . B3+37 . . . B3+37 .", aG: ". . G3+47 . . . G3+47 .", aA: ". . A3+47 . . . A3+47 .",
    aEm: ". . E4+37 . . . E4+37 .", aFsm: ". . F#3+37 . . . F#3+37 .",
    soft: "k . . . h . . . | k . . h h . . .",
  },
  sections: {
    A: {
      lead: "@p1 @p2 @p3 @p4",
      harmony: "@aD @aA @aBm @aD @aG @aD @aEm @aA",
      bass: "@D @A @Bm @D @G @D @Em @A",
      drums: "@soft",
    },
    B: {
      lead: "@q1 @q2 @q3 @q4",
      harmony: "@aD @aBm @aG @aEm @aD @aBm @aA @aA",
      bass: "@D @Bm @G @Em @D @Bm @A @A",
      drums: "@soft",
    },
  },
  order: ["A", "B"],
};

/** The lesson picker: a twinkly countdown-to-launch loop in E minor. */
export const TITLE_SONG: Song = {
  title: "Launch Bay",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.11, gate: 0.7, vibrato: { depth: 8, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.25, volume: 0.04, echo: { steps: 3, octave: -1 } },
    bass: { volume: 0.36, gate: 0.6 },
    drums: { volume: 0.18 },
  },
  patterns: {
    t1: "B5 . G5 . E5 . G5 . | A5 - - - F#5 - - -",
    t2: "G5 . E5 . C5 . E5 . | D5 - - - B4 - - -",
    t3: "B5 . G5 . E5 . B5 . | C6 - - - A5 - - -",
    t4: "B5 . A5 . F#5 . D#5 . | E5 - - - . . . .",
    Em: "E2 . E3 . E2 . E3 .", D: "D2 . D3 . D2 . D3 .", C: "C2 . C3 . C2 . C3 .", B: "B1 . B2 . B1 . B2 .", Am: "A1 . A2 . A1 . A2 .",
    tick: "k . h . s . h . | k . h . s . h h",
  },
  sections: {
    A: {
      lead: "@t1 @t2 @t3 @t4",
      bass: "@Em @D @C @B @Em @Am @B @Em",
      drums: "@tick",
    },
    B: {
      lead: ".*16 @t2 @t4 .*16",
      bass: "@C @D @Em @Em @C @Am @B @Em",
      drums: "k . h . h . h . | k . h . s . h .",
    },
  },
  order: ["A", "B"],
};

export const ROUND_CLEAR: Jingle = {
  title: "Round Clear",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.19 }, harmony: { duty: 0.125, volume: 0.07 } },
  sections: {
    J: {
      lead: "E5 . A5 . C6 . E6 - | - - D6 . C6 . D6 - | - - - - - - E6 - | - - - - - - . .",
      harmony: "C5 . E5 . A5 . C6 - | - - B5 . A5 . B5 - | - - - - - - C6 - | - - - - - - . .",
      bass: "A2 . . . A3 . . . | F2 . . . F3 . . . | G2 . . . G3 . . . | A2 - - - - - . .",
      drums: "k . h . s . h . | k . h . s . s s | k . . . s . . . | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const ROUND_DONE: Jingle = {
  title: "Round Done",
  bpm: 138,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.5, volume: 0.06 } },
  sections: {
    J: {
      lead: "A5 . G5 . E5 . G5 . A5 - - - . . . . C6 - - - B5 - - - A5 - - - - - . .",
      harmony: "F4+47 -*7 G4+47 -*7 A4+37 -*13 . .",
      bass: "F2 . . . F3 . . . G2 . . . G3 . . . A2 . . . . . . . A2 - - - - - . .",
      drums: "k . . . s . . . k . . . s . . . k . . . . . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SHIELD_DOWN: Jingle = {
  title: "Shield Down",
  bpm: 120,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.17, vibrato: { depth: 20, rate: 7, delay: 0.1 } } },
  sections: {
    J: {
      lead: "E5 - - . D5 - - . C5 - - . B4 - - . A4 - - - - - - - G#4 - - - - - . .",
      bass: "A2 - - . G2 - - . F2 - - . E2 - - . A1 - - - - - - - E2 - - - - - . .",
      drums: "k . . . . . . . k . . . . . . . k . . . s . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { round: ROUND_SONG, practice: PRACTICE_SONG, title: TITLE_SONG };
export const JINGLES: Record<string, Jingle> = { clear: ROUND_CLEAR, done: ROUND_DONE, shieldDown: SHIELD_DOWN };

/** A little faster as the combo builds (up to +8%), in steps so the tempo doesn't wobble every comet. */
export function comboTempo(combo: number): number {
  const steps = Math.min(4, Math.floor(combo / 5));
  return 1 + steps * 0.02;
}

/*
 * Lane Leap's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * The main theme is built on octave "hops" (a low note, then the same note an octave up), a
 * rolling minor-key river section and a car-horn break of syncopated stabs.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Levels 1-3: a hoppy F-major street tune with a D-minor river section and a horn break. */
export const HOP_SONG: Song = {
  title: "Rush Hour Hop",
  bpm: 150,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, gate: 0.75, vibrato: { depth: 10, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.48, gate: 0.65 },
    drums: { volume: 0.42 },
  },
  patterns: {
    a1: "F4 . F5 . C5 . A4 C5 | D5 . D6 . C6 - A5 .",
    a2: "Bb4 . Bb5 . A5 . G5 F5 | G5 - - - . . C5 .",
    a3: "F4 . F5 . C5 . A4 C5 | D5 . F5 . G5 - A5 .",
    a4: "Bb5 . A5 G5 . F5 E5 G5 | F5 - - - . . . .",
    b1: "A5 - - G5 F5 - D5 - | E5 - F5 - G5 - - .",
    b2: "F5 - - E5 D5 - Bb4 - | C5 - D5 - E5 - - .",
    b3: "A5 - - G5 F5 - D5 - | E5 - F5 - A5 - - .",
    b4: "Bb5 - - A5 G5 - F5 - | E5 - - - - - . .",
    c1: "C6 . . C6 . . A5 . | Bb5 . . Bb5 . . G5 .",
    c2: "A5 . . A5 . . F5 . | G5 - - - C5 - - -",
    c3: "C6 . . C6 . . A5 . | Bb5 . . Bb5 . . D6 .",
    c4: "C6 - - - G5 - E5 - | F5 - - - . . . .",
    F: "F2 . C3 . F2 . C3 F2",
    Dm: "D3 . A2 . D3 . A2 D3",
    Bb: "Bb2 . F2 . Bb2 . F2 Bb2",
    C: "C3 . G2 . C3 . G2 C3",
    Gm: "G2 . D3 . G2 . D3 G2",
    A: "A2 . E3 . A2 . E3 A2",
    BbC: "Bb2 . F2 . C3 . G2 .",
    hop: "k h . k s h . h",
  },
  sections: {
    intro: {
      lead: ". . . . . . . . | C5 . . C6 . . C5 .",
      bass: "@F @C",
      drums: "k . h . k . h . | k . s . s . s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@F @Dm @Bb @C @F @Dm @BbC @F", drums: "@hop" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "D4+37 -*7 C4+47 -*7 Bb3+47 -*7 C4+47 -*7 D4+37 -*7 A3+47 -*7 G3+37 -*7 A3+47 -*7",
      bass: "@Dm @C @Bb @C @Dm @A @Gm @A",
      drums: "k . h . s . h . | k . h k s . h h",
    },
    C: {
      lead: "@c1 @c2 @c3 @c4",
      harmony: "F4+47 -*7 G3+37 -*7 F4+47 -*7 C4+47 -*7 F4+47 -*7 G3+37 -*7 C4+47 -*7 F4+47 -*7",
      bass: "@F @Gm @F @C @F @Gm @C @F",
      drums: "k . s k . k s . | k . s k . k s . | k . s k . k s . | t t . t t . s s",
    },
  },
  order: ["intro", "A", "B", "A", "C"],
  loopTo: 1,
};

/** Levels 4+: the same streets after dark, a tone higher and a little faster, with a hollow lead. */
export const EVENING_SONG: Song = {
  ...HOP_SONG,
  title: "Evening Traffic",
  bpm: 158,
  transpose: 2,
  voices: {
    ...HOP_SONG.voices,
    lead: { duty: 0.5, volume: 0.16, gate: 0.75, vibrato: { depth: 14, rate: 6.5, delay: 0.22 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } },
  },
};

/** The right home: leap in! */
export const HOME_SAFE: Jingle = {
  title: "Home Safe",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "C5 . F5 . A5 . C6 . . . A5 C6 F6 - - - - - . .",
      harmony: "A4 . C5 . F5 . A5 . . . F5 A5 C6 - - - - - . .",
      bass: "F2 . . . F3 . . . . . C3 . F2 - - - - - . .",
      drums: "k . h . k . h . . . s . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The transmission question was answered right: an extra shield. */
export const SHIELD_EARNED: Jingle = {
  title: "Shield Earned",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.16 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "F5 . C5 . F5 . A5 . G5 . C6 - - - - - . .",
      harmony: "C5 . A4 . C5 . F5 . E5 . G5 - - - - - . .",
      bass: "F2 . . . F2 . . . C3 . F2 - - - - - . .",
      drums: "h . h . h . h . s . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of lives. A soft, friendly ending. */
export const LAST_LEAP: Jingle = {
  title: "Last Leap",
  bpm: 108,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "C6 - A5 - F5 - D5 - | E5 - G5 - F5 - - .",
      bass: "F2 - - - Bb2 - - - | C3 - - - F2 - - .",
      drums: "k . . . . . . . | s . . . k . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { hop: HOP_SONG, evening: EVENING_SONG };
export const JINGLES: Record<string, Jingle> = { homeSafe: HOME_SAFE, shieldEarned: SHIELD_EARNED, lastLeap: LAST_LEAP };

/** The music for a level (level 4 and up get the evening version). */
export function levelSong(level: number): Song {
  return level >= 4 ? EVENING_SONG : HOP_SONG;
}

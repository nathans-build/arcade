/*
 * Sum Stack's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * The tunes are built from "stacking" figures: short motifs that climb a step at a time, like
 * numbered blocks piling up in the well.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Levels 1-4: a bright D-major puzzle groove with a B-minor bridge and a climbing "stack" section. */
export const WELL_SONG: Song = {
  title: "Number Well",
  bpm: 144,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, vibrato: { depth: 10, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.48 },
    drums: { volume: 0.45 },
  },
  patterns: {
    a1: "D5 . F#5 A5 . F#5 G5 A5 | B5 - A5 - F#5 - E5 .",
    a2: "D5 . E5 F#5 . A5 G5 F#5 | E5 - - - . . C#5 .",
    a3: "B4 . D5 E5 . D5 E5 F#5 | D5 - - - . . . .",
    b1: "F#5 - - E5 D5 - B4 - | C#5 - D5 - E5 - - .",
    b2: "G5 - - F#5 E5 - D5 - | E5 - F#5 - A5 - - .",
    b3: "F#5 - - E5 D5 - B4 - | D5 - E5 - F#5 - G5 -",
    b4: "A5 - - - G5 - F#5 - | E5 - - - - - . .",
    c1: "D5 D5 . E5 E5 . F#5 F#5 | . G5 G5 . A5 - - .",
    c2: "B5 A5 G5 F#5 E5 D5 E5 F#5 | A5 - - - . . . .",
    c4: "B5 A5 G5 A5 F#5 - E5 - | D5 - - - . . . .",
    D: "D2 . D3 . A2 . D3 A2",
    G: "G2 . G3 . D3 . G3 D3",
    A: "A2 . A3 . E3 . A3 E3",
    C: "C3 . C3 . G2 . C3 G2",
    Bm: "B2 . B2 . F#2 . B2 F#2",
    Em: "E2 . E3 . B2 . E3 B2",
    beat: "k . h k s . h h",
  },
  sections: {
    intro: {
      lead: ". . . . . . . . | D5 . E5 . F#5 . A5 .",
      bass: "@D @D",
      drums: "k . h . k . h . | k . s . s s s s",
    },
    A: { lead: "@a1 @a2 @a1 @a3", bass: "@D @G @D @A @D @G @Em @D", drums: "@beat" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "B3+37 -*7 A3+47 -*7 G3+47 -*7 A3+47 -*7 B3+37 -*7 A3+47 -*7 G3+47 -*7 A3+47 -*7",
      bass: "@Bm @A @G @A @Bm @A @G @A",
      drums: "k . h . s . h . | k . h k s . h h",
    },
    C: {
      lead: "@c1 @c2 @c1 @c4",
      harmony: "G3+47 -*7 A3+47 -*7 B3+37 -*7 A3+47 -*7 G3+47 -*7 A3+47 -*7 D4+47 -*7 D4+47 -*7",
      bass: "@G @A @Bm @A @G @A @D @D",
      drums: "k h s h k h s h | k h s h k k s o",
    },
  },
  order: ["intro", "A", "B", "A", "C"],
  loopTo: 1,
};

/** Levels 5+: the same well a minor third higher and a little quicker, with a thin, glassy lead. */
export const HIGH_STACK_SONG: Song = {
  ...WELL_SONG,
  title: "High Stack",
  bpm: 152,
  transpose: 3,
  voices: {
    ...WELL_SONG.voices,
    lead: { duty: 0.125, volume: 0.19, vibrato: { depth: 14, rate: 7, delay: 0.2 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } },
  },
};

/** A level's goal is met: blocks click into place, quick rising arpeggio. */
export const LEVEL_STACKED: Jingle = {
  title: "Level Stacked",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "D5 F#5 A5 D6 . . E5 G5 B5 E6 . . F#5 A5 D6 - - - - - . .",
      harmony: "A4 D5 F#5 A5 . . B4 E5 G5 B5 . . D5 F#5 A5 - - - - - . .",
      bass: "D3 . . . . . E3 . . . . . D3 - - - - - - - . .",
      drums: "k . . . s . k . . . s . k . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** The transmission question was answered right: a power-up fanfare. */
export const POWER_UP: Jingle = {
  title: "Power Up",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.17 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "A4 . A4 . D5 . A4 . F#5 - - - A5 - - - - - - .",
      harmony: "F#4 . F#4 . A4 . F#4 . D5 - - - F#5 - - - - - - .",
      bass: "D3 . D3 . D3 . D3 . D3 - - - D2 - - - - - - .",
      drums: "h . h . h . h . k . . . s . . . k . . .",
    },
  },
  order: ["J"],
};

/** The stack reached the top. Gentle, not scolding. */
export const TOPPED_OUT: Jingle = {
  title: "Topped Out",
  bpm: 108,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "A5 - F#5 - E5 - D5 - | B4 - C#5 - D5 - - .",
      bass: "D3 - - - G2 - - - | A2 - - - D2 - - .",
      drums: "k . . . . . . . | s . . . k . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { well: WELL_SONG, high: HIGH_STACK_SONG };
export const JINGLES: Record<string, Jingle> = { levelStacked: LEVEL_STACKED, powerUp: POWER_UP, toppedOut: TOPPED_OUT };

/** The music for a level (level 5 and up get the higher, quicker version). */
export function levelSong(level: number): Song {
  return level >= 5 ? HIGH_STACK_SONG : WELL_SONG;
}

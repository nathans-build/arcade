/*
 * Stack Chef's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * A tiptoeing night-kitchen tune in A dorian: staccato "sneaking" phrases over a walking bass, a
 * chromatic chase section for the food critters, and a short spice-shaker break.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Levels 1-3: the night kitchen. */
export const KITCHEN_SONG: Song = {
  title: "Midnight Kitchen",
  bpm: 138,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, gate: 0.7, vibrato: { depth: 10, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.5, gate: 0.6 },
    drums: { volume: 0.42 },
  },
  patterns: {
    a1: "A4 . C5 . E5 . D5 C5 | B4 . . D5 . . F#5 .",
    a2: "E5 . G5 . A5 . G5 E5 | D5 - - - . . . .",
    a3: "A4 . C5 . E5 . D5 C5 | B4 . . D5 . . A5 .",
    a4: "B5 . G#5 . E5 . D5 . | C5 - B4 - A4 - - .",
    b1: "E5 E5 . E5 F5 . E5 D#5 | E5 . . . . . B4 .",
    b2: "D5 D5 . D5 Eb5 . D5 C#5 | D5 . . . . . A4 .",
    b3: "C5 C5 . C5 D5 . E5 F5 | G5 . . . F5 . E5 .",
    b4: "D5 - - - E5 - - - | E5 - - - . . . .",
    Am: "A2 . C3 . E3 . G3 .",
    D: "D3 . F#3 . A3 . C4 .",
    F: "F2 . A2 . C3 . E3 .",
    G: "G2 . B2 . D3 . F3 .",
    E: "E2 . G#2 . B2 . D3 .",
    sneak: "k . h . s . h h | k . h k s . h .",
  },
  sections: {
    intro: {
      lead: ". . . . . . . . | E5 . . E5 . . A4 .",
      bass: "@Am @E",
      drums: "h . h . h . h . | h . h . s . s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@Am @D @Am @D @F @G @E @Am", drums: "@sneak" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "A3+37 -*7 A3+37 -*7 D4+37 -*7 D4+37 -*7 F3+47 -*7 G3+47 -*7 E3+47 -*7 E3+47 -*7",
      bass: "@Am @Am @D @D @F @G @E @E",
      drums: "k h s h k h s h | k h s h k k s o",
    },
    C: {
      lead: "A5 . . A5 . . G5 . | A5 . . C6 . . B5 . | A5 . . A5 . . G5 . | E5 - - - . . . .",
      harmony: "A4+37 -*7 A4+37 -*7 A4+37 -*7 E4+47 -*7",
      bass: "@Am @Am @Am @E",
      drums: "k . t . s . t t | k . t . s . t t | k . t . s . t t | s s s s s s o .",
    },
  },
  order: ["intro", "A", "B", "A", "C"],
  loopTo: 1,
};

/** Levels 4+: the late shift, a tone lower and quicker, with a hollow square lead. */
export const LATE_SHIFT_SONG: Song = {
  ...KITCHEN_SONG,
  title: "Late Shift",
  bpm: 146,
  transpose: -2,
  voices: {
    ...KITCHEN_SONG.voices,
    lead: { duty: 0.5, volume: 0.16, gate: 0.7, vibrato: { depth: 14, rate: 6.5, delay: 0.22 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } },
  },
};

/** A finished stack. */
export const ORDER_UP: Jingle = {
  title: "Order Up",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "E5 . A5 . C6 . B5 . A5 . E6 - - - - - . .",
      harmony: "C5 . E5 . A5 . G#5 . E5 . C6 - - - - - . .",
      bass: "A2 . . . E3 . . . A2 . A3 - - - - - . .",
      drums: "k . h . s . h . k . s . . . . . . .",
    },
  },
  order: ["J"],
};

/** The transmission question was answered right: +2 spice. */
export const SPICE_BONUS: Jingle = {
  title: "Extra Spice",
  bpm: 168,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.16 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "A5 . G5 . A5 . C6 . D6 . . . E6 - - - - - . .",
      harmony: "E5 . D5 . E5 . A5 . A5 . . . C6 - - - - - . .",
      bass: "A2 . . . A2 . . . D3 . . . A2 - - - - - . .",
      drums: "h . h . h . h . s . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of lives: the kitchen closes for the night. */
export const KITCHEN_CLOSED: Jingle = {
  title: "Kitchen Closed",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "E5 - D5 - C5 - B4 - | C5 - B4 - A4 - - .",
      bass: "A2 - - - D3 - - - | E2 - - - A2 - - .",
      drums: "k . . . . . . . | s . . . k . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { kitchen: KITCHEN_SONG, lateShift: LATE_SHIFT_SONG };
export const JINGLES: Record<string, Jingle> = { orderUp: ORDER_UP, spiceBonus: SPICE_BONUS, kitchenClosed: KITCHEN_CLOSED };

/** The music for a level (level 4 and up get the late shift). */
export function levelSong(level: number): Song {
  return level >= 4 ? LATE_SHIFT_SONG : KITCHEN_SONG;
}

/*
 * Cube Hop's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * The two round kinds get their own tunes: "Build it" rounds a floaty C-lydian hop (thirds that
 * step down and back up, like hopping across the pyramid), "Color the category" rounds a quicker
 * F-major cascade.
 */
import type { Jingle, Song } from "@/kit/audio";

/** "Build it" rounds: a floating pyramid in space. */
export const BUILD_SONG: Song = {
  title: "Pyramid Hop",
  bpm: 136,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, gate: 0.8, vibrato: { depth: 12, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.46, gate: 0.7 },
    drums: { volume: 0.4 },
  },
  patterns: {
    a1: "G5 . E5 . C5 . E5 G5 | F#5 . D5 . B4 . D5 F#5",
    a2: "E5 . C5 . A4 . C5 E5 | D5 - - - G5 - - -",
    a3: "G5 . E5 . C5 . E5 G5 | A5 . F#5 . D5 . F#5 A5",
    a4: "B5 - A5 - G5 - F#5 - | G5 - - - . . . .",
    b1: "E5 - - - - - D5 - | C5 - - - B4 - - -",
    b2: "A4 - - - - - B4 - | C5 - - - D5 - - -",
    b3: "E5 - - - - - F#5 - | G5 - - - A5 - - -",
    b4: "B5 - - - A5 - - - | G5 - - - - - . .",
    C: "C3 . G2 . C3 C3 G2 .",
    D: "D3 . A2 . D3 D3 A2 .",
    Am: "A2 . E2 . A2 A2 E2 .",
    G: "G2 . D3 . G2 G2 D3 .",
    F: "F2 . C3 . F2 F2 C3 .",
    Em: "E2 . B2 . E2 E2 B2 .",
    hop: "k . h . s . h k | k . h . s . h h",
  },
  sections: {
    intro: {
      harmony: "C4+47b -*7 D4+47 -*7",
      bass: "@C @D",
      drums: "h . . . h . . . | h . h . s . s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@C @D @Am @G @C @D @G @C", drums: "@hop" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "F3+47b -*7 G3+47 -*7 A3+37 -*7 D4+47 -*7 E3+37 -*7 C4+47b -*7 D4+47 -*7 D4+47 -*7",
      bass: "@F @G @Am @D @Em @C @D @D",
      drums: "k . . . s . . . | k . . k s . h .",
    },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: 1,
};

/** "Color the category" rounds: cubes flipping colour in a quick cascade. */
export const COLOR_SONG: Song = {
  title: "Color Cascade",
  bpm: 144,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.18, gate: 0.7, vibrato: { depth: 10, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } },
    bass: { volume: 0.48, gate: 0.65 },
    drums: { volume: 0.42 },
  },
  patterns: {
    a1: "C6 A5 F5 A5 C6 . . . | Bb5 G5 E5 G5 Bb5 . . .",
    a2: "A5 F5 D5 F5 A5 . . . | G5 - - - . . . .",
    a3: "C6 A5 F5 A5 C6 . . . | D6 Bb5 G5 Bb5 D6 . . .",
    a4: "C6 - Bb5 - A5 - G5 - | F5 - - - . . . .",
    b1: "D5 - F5 - A5 - - . | C5 - E5 - G5 - - .",
    b2: "Bb4 - D5 - F5 - - . | A4 - C5 - E5 - - .",
    b3: "G4 - Bb4 - D5 - - . | A4 - C#5 - E5 - - .",
    b4: "D5 - - - F5 - - - | E5 - - - G5 - - -",
    F: "F2 . F3 . C3 . F3 .",
    C: "C3 . C4 . G2 . C4 .",
    Dm: "D3 . D4 . A2 . D4 .",
    Gm: "G2 . G3 . D3 . G3 .",
    Bb: "Bb2 . Bb3 . F2 . Bb3 .",
    Am: "A2 . A3 . E3 . A3 .",
    A: "A2 . A3 . E3 . A3 .",
    beat: "k h s h k h s h | k h s h k k s o",
  },
  sections: {
    intro: {
      lead: ". . . . . . . . | C5 . F5 . A5 . C6 .",
      bass: "@F @C",
      drums: "k . h . k . h . | k . s . s s s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@F @C @Dm @C @F @Gm @C @F", drums: "@beat" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "D4+37 -*7 C4+47 -*7 Bb3+47 -*7 A3+37 -*7 G3+37 -*7 A3+47 -*7 D4+37 -*7 C4+47 -*7",
      bass: "@Dm @C @Bb @Am @Gm @A @Dm @C",
      drums: "k . h . s . h . | k . h k s . h h",
    },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: 1,
};

/** A round is done (sentence built or every matching cube colored). */
export const ROUND_CLEAR: Jingle = {
  title: "Round Clear",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "G5 . E5 . G5 . C6 . . . B5 . D6 . E6 - - - - - . .",
      harmony: "E5 . C5 . E5 . G5 . . . G5 . B5 . C6 - - - - - . .",
      bass: "C3 . . . G2 . . . . . D3 . . . C3 - - - - - . .",
      drums: "k . h . s . h . . . k . s . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The transmission question was answered right: shields refilled. */
export const SHIELDS_FULL: Jingle = {
  title: "Shields Full",
  bpm: 168,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.16 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "C5 E5 G5 C6 E5 G5 C6 E6 . . G6 - - - - - . .",
      harmony: "G4 C5 E5 G5 C5 E5 G5 C6 . . D6 - - - - - . .",
      bass: "C3 . . . C3 . . . . . G2 - - - - - . .",
      drums: "h h h h h h h h . . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of lives: the signal fades. */
export const SIGNAL_LOST: Jingle = {
  title: "Signal Lost",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "G5 - F#5 - E5 - D5 - | C5 - D5 - C5 - - .",
      bass: "C3 - - - D3 - - - | G2 - - - C3 - - .",
      drums: "k . . . . . . . | s . . . k . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { build: BUILD_SONG, color: COLOR_SONG };
export const JINGLES: Record<string, Jingle> = { roundClear: ROUND_CLEAR, shieldsFull: SHIELDS_FULL, signalLost: SIGNAL_LOST };

/** The music for a round kind. */
export function roundSong(kind: "build" | "color"): Song {
  return kind === "build" ? BUILD_SONG : COLOR_SONG;
}

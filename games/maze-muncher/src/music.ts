/*
 * Maze Muncher's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 * The game swaps to a woozy song while the critters are dizzy, speeds up while they are fired up, and thins
 * the band to lead + bass while the end-of-maze question is open.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Mazes 1-3: a zippy D-major chase with arpeggio hops and a bouncing octave bass. */
export const DOT_DASH_SONG: Song = {
  title: "Data Dot Dash",
  bpm: 150,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.17, gate: 0.8, vibrato: { depth: 10, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
    bass: { volume: 0.48 },
    drums: { volume: 0.42 },
  },
  patterns: {
    m1: "D5 . F#5 . A5 . F#5 . | G5 . E5 . C#5 . A4 .",
    m2: "B4 . D5 . G5 . D5 . | F#5 - E5 - D5 - . .",
    m3: "D5 . F#5 . A5 . B5 . | A5 . F#5 . D5 . E5 .",
    m4: "F#5 . E5 . D5 . C#5 . | D5 - - - . . . .",
    k1: "B4 - B4 . D5 - F#5 . | E5 - D5 . B4 - - .",
    k2: "G4 - G4 . B4 - D5 . | C#5 - - - A4 - - -",
    k3: "B4 - B4 . D5 - F#5 . | G5 - F#5 . E5 - - .",
    k4: "E5 - E5 . F#5 - G5 . | A5 - - - - - . .",
    D: "D2 . A2 . D3 . A2 .",
    A: "A1 . E2 . A2 . E2 .",
    G: "G1 . D2 . G2 . D2 .",
    Bm: "B1 . F#2 . B2 . F#2 .",
    Em: "E2 . B2 . E3 . B2 .",
    beat: "k h s h k h s h | k h s h k k s o",
  },
  sections: {
    intro: { bass: "@D @A", drums: "k h k h s h s h | k h k h s s s s", harmony: "D4+47 -*7 A3+47 -*7" },
    A1: { lead: "@m1 @m2", bass: "@D @A @G @D", drums: "@beat" },
    A2: { lead: "@m3 @m4", bass: "@D @Bm @A @D", drums: "@beat" },
    B: { lead: "@k1 @k2", bass: "@Bm @Bm @G @A", drums: "k h s h k h s h" },
    B2: { lead: "@k3 @k4", bass: "@Bm @Em @Em @A", drums: "k h s h k h s h | k h s h s s s s" },
    C: {
      lead: "F#5 . . F#5 . . E5 . | D5 . . D5 . . C#5 . | B4 . . B4 . . C#5 . | D5 - E5 - F#5 - A5 -",
      harmony: "D4+47 -*7 A3+47 -*7 B3+37 -*7 A3+47 -*7",
      bass: "@D @A @Bm @A",
      drums: "k . . k . . s . | k . . k . . s s",
    },
  },
  order: ["intro", "A1", "A2", "B", "B2", "A1", "C"],
  loopTo: 1,
};

/** Maze 4 onward: the chase a tone higher and faster. */
export const HALLWAY_SONG: Song = {
  ...DOT_DASH_SONG,
  title: "Hallway Rush",
  bpm: 160,
  transpose: 2,
  voices: {
    ...DOT_DASH_SONG.voices,
    lead: { duty: 0.125, volume: 0.18, gate: 0.8, vibrato: { depth: 14, rate: 7, delay: 0.2 } },
    harmony: { duty: 0.25, volume: 0.05, echo: { steps: 2 } },
  },
};

/** After a right answer: the critters are dizzy. A wobbly B-flat bounce with chromatic slides and a wide vibrato. */
export const DIZZY_SONG: Song = {
  title: "Dizzy Critters",
  bpm: 160,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.14, vibrato: { depth: 30, rate: 4.5, delay: 0.05 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2 } },
    bass: { volume: 0.46, gate: 0.6 },
    drums: { volume: 0.4 },
  },
  patterns: {
    z1: "F5 . E5 . Eb5 . D5 . | F5 . E5 . Eb5 . D5 .",
    z2: "C5 . D5 . Eb5 . E5 . | F5 - - - Bb4 - - -",
    z3: "G5 . F#5 . F5 . E5 . | G5 . F#5 . F5 . E5 .",
    z4: "Eb5 . D5 . C5 . A4 . | Bb4 - - - - - . .",
    Bb: "Bb1 . F2 . Bb1 . F2 .",
    Eb: "Eb2 . Bb2 . Eb2 . Bb2 .",
    F: "F1 . C2 . F1 . C2 .",
    Gm: "G1 . D2 . G1 . D2 .",
    C: "C2 . G2 . C2 . G2 .",
    beat: "k . o . s . o .",
  },
  sections: {
    A: { lead: "@z1 @z2", bass: "@Bb @Bb @Eb @Bb", drums: "@beat" },
    B: { lead: "@z3 @z4", bass: "@C @C @F @Bb", drums: "@beat" },
    C: {
      lead: "D5 - F5 - Bb5 - - - | A5 - F5 - C5 - - - | Bb4 - D5 - G5 - - - | F5 - - - - - . .",
      bass: "@Bb @F @Gm @F",
      drums: "k . o . s . o . | k . o . s s o .",
    },
  },
  order: ["A", "B", "A", "C", "B"],
};

/** A right pellet is munched. */
export const RIGHT_PELLET: Jingle = {
  title: "Right Pellet",
  bpm: 180,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "D5 F#5 A5 D6 - - . .",
      harmony: "A4 D5 F#5 A5 - - . .",
      bass: "D3 . . D2 - - . .",
      drums: "k . . s . . . .",
    },
  },
  order: ["J"],
};

/** Every dot in the maze is munched. */
export const MAZE_CLEAR: Jingle = {
  title: "Maze Clear",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "D5 F#5 A5 D6 . . A5 . B5 . C#6 . D6 - - - - - - - . . . .",
      harmony: "A4 D5 F#5 A5 . . F#5 . G5 . A5 . F#5 - - - - - - - . . . .",
      bass: "D3 . . . . . D3 . G2 . A2 . D2 - - - - - - - . . . .",
      drums: "k . . . s . . . k . k . s . . . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of lives. */
export const GAME_OVER: Jingle = {
  title: "Out of Munches",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 14, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "A4 - B4 - A4 - F#4 - | E4 - - - D4 - . .",
      bass: "D3 - - - G2 - - - | A2 - - - D2 - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { dotDash: DOT_DASH_SONG, hallway: HALLWAY_SONG, dizzy: DIZZY_SONG };
export const JINGLES: Record<string, Jingle> = { rightPellet: RIGHT_PELLET, mazeClear: MAZE_CLEAR, gameOver: GAME_OVER };

/** The chase song for a maze (1-based): maze 4 onward gets the faster version. */
export function mazeSong(level: number): Song {
  return level >= 4 ? HALLWAY_SONG : DOT_DASH_SONG;
}

/*
 * Word Worm's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 * While the end-of-level question is open the game thins the band to lead + bass.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Levels 1-3: a playful F-major notebook doodle; chromatic wiggles in the lead, a bouncing bass. */
export const INKWELL_SONG: Song = {
  title: "Inkwell Wiggle",
  bpm: 138,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.15, gate: 0.75, vibrato: { depth: 10, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2 } },
    bass: { volume: 0.48, gate: 0.6 },
    drums: { volume: 0.42 },
  },
  patterns: {
    w1: "F4 . A4 C5 . A4 Bb4 B4 | C5 - A4 - F4 - . .",
    w2: "G4 . Bb4 D5 . Bb4 C5 C#5 | D5 - Bb4 - G4 - . .",
    w3: "A4 . C5 F5 . E5 Eb5 D5 | C5 - A4 - Bb4 - G4 -",
    w4: "F4 . G4 A4 . Bb4 C5 E4 | F4 - - - . . . .",
    x1: "D5 - C5 - Bb4 - A4 - | G4 - A4 - Bb4 - - -",
    x2: "C5 - Bb4 - A4 - G4 - | F4 - G4 - A4 - - -",
    x3: "D5 - E5 - F5 - D5 - | C5 - Bb4 - A4 - - -",
    x4: "G4 - A4 - Bb4 - C5 - | E5 - - - - - . .",
    F: "F2 . C3 . F2 . C3 .",
    Gm: "G2 . D3 . G2 . D3 .",
    Dm: "D2 . A2 . D2 . A2 .",
    C: "C2 . G2 . C2 . G2 .",
    Bb: "Bb1 . F2 . Bb1 . F2 .",
    beat: "k . h . s . h h | k k h . s . h .",
  },
  sections: {
    intro: {
      lead: "C5 . C5 . . C5 . . | Bb4 . A4 . G4 . E4 .",
      bass: "@F @C",
      drums: "k . s . k . s . | k . s . k s s s",
    },
    A1: { lead: "@w1 @w2", bass: "@F @Dm @Gm @Bb", drums: "@beat" },
    A2: { lead: "@w3 @w4", bass: "@F @Gm @C @F", drums: "@beat" },
    B: { lead: "@x1 @x2", bass: "@Bb @Gm @F @Dm", drums: "k . h s . h s h" },
    B2: { lead: "@x3 @x4", bass: "@Dm @F @Gm @C", drums: "k . h s . h s h | k . h s . s s s" },
    C: {
      lead: "F5 E5 F5 . . . . . | E5 Eb5 E5 . . . . . | D5 C#5 D5 . . . . . | C5 B4 C5 . E5 . G5 .",
      harmony: "F3+47 -*7 C4+47 -*7 Bb3+47 -*7 C4+47 -*7",
      bass: "@F @C @Bb @C",
      drums: "k . . . s . . . | k . . k s . . .",
    },
  },
  order: ["intro", "A1", "A2", "B", "B2", "A1", "C"],
  loopTo: 1,
};

/** Level 4 onward: the doodle a tone higher and quicker, scribbled into the margins. */
export const MARGIN_SONG: Song = {
  ...INKWELL_SONG,
  title: "Margin Scramble",
  bpm: 148,
  transpose: 2,
  voices: {
    ...INKWELL_SONG.voices,
    lead: { duty: 0.25, volume: 0.17, gate: 0.75, vibrato: { depth: 14, rate: 7, delay: 0.2 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
  },
};

/** The whole word (or word part) is built. */
export const WORD_BUILT: Jingle = {
  title: "Word Built",
  bpm: 168,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.17 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "C5 . F5 . A5 . C6 - - - . .",
      harmony: "A4 . C5 . F5 . A5 - - - . .",
      bass: "F2 . . . C3 . F3 - - - . .",
      drums: "k . . . s . k . . . . .",
    },
  },
  order: ["J"],
};

/** Every worm of the level is solved: the page is done. */
export const PAGE_COMPLETE: Jingle = {
  title: "Page Complete",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.18, vibrato: { depth: 10, rate: 6, delay: 0.25 } }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "F5 E5 F5 . A5 G5 A5 . C6 - - - Bb5 - A5 - G5 - - - F5 - - - - - - - . . . .",
      harmony: "C5 . C5 . F5 . F5 . A5 - - - G5 - F5 - E5 - - - A4 - - - - - - - . . . .",
      bass: "F2 . . . F2 . . . F2 - - - Bb1 - - - C2 - - - F2 - - - - - - - . . . .",
      drums: "k . . . s . . . k . . . s . . . k . . . k . . . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of lives. */
export const GAME_OVER: Jingle = {
  title: "Out of Ink",
  bpm: 100,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.5, volume: 0.15, vibrato: { depth: 12, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "C5 - Bb4 - A4 - G4 - | F4 - E4 - F4 - . .",
      bass: "F2 - - - C2 - - - | F1 - - - . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { inkwell: INKWELL_SONG, margin: MARGIN_SONG };
export const JINGLES: Record<string, Jingle> = { wordBuilt: WORD_BUILT, pageComplete: PAGE_COMPLETE, gameOver: GAME_OVER };

/** The song for a level (1-based): level 4 onward gets the faster margin version. */
export function levelSong(level: number): Song {
  return level >= 4 ? MARGIN_SONG : INKWELL_SONG;
}

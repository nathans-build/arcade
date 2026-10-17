/*
 * Rock Driller's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 * While a gem question, field challenge or transmission is open the game thins the band to lead + bass.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Levels 1-2: a chunky E-minor digging groove; the bass riff is the drill, the lead goes exploring. */
export const STRATA_SONG: Song = {
  title: "Strata Groove",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, gate: 0.85, vibrato: { depth: 12, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
    bass: { volume: 0.52 },
    drums: { volume: 0.45 },
  },
  patterns: {
    d1: "B4 . . B4 D5 . E5 . | G5 - E5 - D5 - B4 -",
    d2: "A4 . . A4 C5 . D5 . | E5 - - - . . . .",
    d3: "B4 . . B4 D5 . E5 . | G5 - A5 - B5 - A5 -",
    d4: "G5 - E5 - D5 - B4 - | E5 - - - - - . .",
    e1: "E5 - D5 - C5 - - - | D5 - C5 - B4 - - -",
    e2: "C5 - B4 - A4 - - - | B4 - - - - - - -",
    e3: "E5 - F#5 - G5 - - - | A5 - G5 - F#5 - - -",
    e4: "G5 - F#5 - E5 - D5 - | D#5 - - - F#5 - - -",
    E: "E2 . E3 E2 G2 . A2 B2",
    C: "C2 . C3 C2 E2 . F#2 G2",
    D: "D2 . D3 D2 F#2 . G2 A2",
    A: "A1 . A2 A1 C2 . D2 E2",
    B: "B1 . B2 B1 D#2 . E2 F#2",
    G: "G1 . G2 G1 B1 . C2 D2",
    beat: "k . h k s . h . | k . h . s h o .",
  },
  sections: {
    intro: { harmony: "E3+37 -*7 E3+37 -*3 B2+47 -*3", bass: "@E @E", drums: "t . t . t . t t | k . h . s . h h" },
    A1: { lead: "@d1 @d2", bass: "@E @C @A @E", drums: "@beat" },
    A2: { lead: "@d3 @d4", bass: "@E @G @A @E", drums: "@beat" },
    B1: { lead: "@e1 @e2", bass: "@C @G @A @E", drums: "k . h . s . h h" },
    B2: { lead: "@e3 @e4", bass: "@E @D @C @B", drums: "k . h . s . h h | k . h . s s t t" },
    C: {
      lead: "B4 - - - - - - - | C5 - - - - - - - | D5 - - - - - - - | D#5 - - - F#5 - - -",
      harmony: "E4+37 -*7 C4+47 -*7 D4+47 -*7 B3+47 -*7",
      bass: "@E @C @D @B",
      drums: "k . t . s . t . | k . t t s . t .",
    },
  },
  order: ["intro", "A1", "A2", "B1", "B2", "A1", "C"],
  loopTo: 1,
};

/** Level 3 onward (deeper sites): the groove lower and slower, with a hollow square lead and longer echo. */
export const DEEP_ROCK_SONG: Song = {
  ...STRATA_SONG,
  title: "Deep Rock",
  bpm: 112,
  transpose: -3,
  voices: {
    ...STRATA_SONG.voices,
    lead: { duty: 0.5, volume: 0.15, gate: 0.85, vibrato: { depth: 16, rate: 5, delay: 0.25 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 4, octave: -1 } },
  },
};

/** A right gem answer: the specimen is collected. */
export const SPECIMEN_FOUND: Jingle = {
  title: "Specimen Found",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "E5 . G5 . B5 . E6 - - - . .",
      harmony: "B4 . E5 . G5 . B5 - - - . .",
      bass: "E2 . . . E3 . E2 - - - . .",
      drums: "t . t . k . s . . . . .",
    },
  },
  order: ["J"],
};

/** The level's goal is complete. */
export const GOAL_COMPLETE: Jingle = {
  title: "Goal Complete",
  bpm: 144,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 12, rate: 6, delay: 0.25 } }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "E5 . E5 G5 . . B5 . A5 - G5 - A5 - B5 - E6 - - - - - - - . . . .",
      harmony: "B4 . B4 E5 . . G5 . F#5 - E5 - F#5 - F#5 - G#5 - - - - - - - . . . .",
      bass: "E2 . . . E2 . . . C2 - - - D2 - - - E2 - - - - - - - . . . .",
      drums: "k . . . s . . . k . . . s . s s k . . . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of lives. */
export const GAME_OVER: Jingle = {
  title: "Drill Rests",
  bpm: 96,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 12, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "B4 - A4 - G4 - F#4 - | E4 - - - - - . .",
      bass: "E2 - - - C2 - - - | B1 - - - E1 - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { strata: STRATA_SONG, deepRock: DEEP_ROCK_SONG };
export const JINGLES: Record<string, Jingle> = { specimenFound: SPECIMEN_FOUND, goalComplete: GOAL_COMPLETE, gameOver: GAME_OVER };

/** The song for a level (1-based): level 3 onward gets the deep version. */
export function levelSong(level: number): Song {
  return level >= 3 ? DEEP_ROCK_SONG : STRATA_SONG;
}

/*
 * Factor Blaster's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 * While an incoming transmission (a question) is open the game thins the band to lead + bass.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Levels 1-4: a cool A-minor space drift in a 3-3-2 rhythm, with chord arpeggios and a harmonic-minor lift. */
export const DRIFT_SONG: Song = {
  title: "Prime Drift",
  bpm: 132,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 14, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06 },
    bass: { volume: 0.5 },
    drums: { volume: 0.42 },
  },
  patterns: {
    p1: "A4 . . E5 . . A5 . | G5 - E5 - D5 - C5 -",
    p2: "D5 . . F5 . . A5 . | G5 - - - E5 - - -",
    p3: "A4 . . E5 . . A5 . | B5 - A5 - G#5 - E5 -",
    p4: "F5 . . E5 . . D5 . | E5 - - - - - . .",
    q1: "C5 - D5 - E5 - G5 - | A5 - - - G5 - E5 -",
    q2: "F5 - E5 - D5 - C5 - | B4 - - - G#4 - - -",
    q3: "C5 - D5 - E5 - G5 - | C6 - - - B5 - G5 -",
    q4: "A5 - G5 - F5 - E5 - | E5 - - - - - - -",
    Am: "A1 . . A1 . . A2 .",
    F: "F1 . . F1 . . F2 .",
    G: "G1 . . G1 . . G2 .",
    Dm: "D2 . . D2 . . D3 .",
    E: "E1 . . E1 . . E2 .",
    C: "C2 . . C2 . . C3 .",
    beat: "k . h k . h s h",
  },
  sections: {
    intro: { harmony: "A3+37 -*7 F3+47 -*7", bass: "@Am @F", drums: "h . . h . . h . | h . . h . . s s" },
    A1: { lead: "@p1 @p2", harmony: "A3+37 -*7 G3+47 -*7 D4+37 -*7 C4+47 -*7", bass: "@Am @G @Dm @C", drums: "@beat" },
    A2: { lead: "@p3 @p4", harmony: "A3+37 -*7 E3+47 -*7 D4+37 -*7 E3+47 -*7", bass: "@Am @E @Dm @E", drums: "@beat" },
    B: { lead: "@q1 @q2", harmony: "C4+47 -*7 A3+37 -*7 F3+47 -*7 E3+47 -*7", bass: "@C @Am @F @E", drums: "k . h k s . h h" },
    B2: { lead: "@q3 @q4", harmony: "C4+47 -*7 G3+47 -*7 F3+47 -*7 E3+47 -*7", bass: "@C @G @F @E", drums: "k . h k s . h h | k . h k s s s s" },
    C: {
      lead: "E5 - - - - - - - | D5 - - - C5 - - - | B4 - - - - - - - | C5 - B4 - G#4 - - -",
      harmony: "A3+37 -*7 F3+47 -*7 D3+37 -*7 E3+47 -*7",
      bass: "@Am @F @Dm @E",
      drums: "k . . . . . . . | s . . . . . . .",
    },
  },
  order: ["intro", "A1", "A2", "B", "B2", "A2", "C"],
  loopTo: 1,
};

/** Level 5 onward: the drift a minor third higher and faster, with a thin bright lead and an echo. */
export const DEEP_FIELD_SONG: Song = {
  ...DRIFT_SONG,
  title: "Deep Field",
  bpm: 140,
  transpose: 3,
  voices: {
    ...DRIFT_SONG.voices,
    lead: { duty: 0.125, volume: 0.19, vibrato: { depth: 18, rate: 6.5, delay: 0.2 } },
    harmony: { duty: 0.25, volume: 0.055 },
  },
};

/** Every target rock and core is cleared. */
export const SECTOR_CLEAR: Jingle = {
  title: "Sector Clear",
  bpm: 156,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "A4 C5 E5 A5 . . G5 . A5 - - - C6 - - - - - - .",
      harmony: "E4 A4 C5 E5 . . D5 . E5 - - - E5 - - - - - - .",
      bass: "A2 . . . . . G2 . A2 - - - A2 - - - - - - .",
      drums: "k . . . . . k . s . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** A right answer to the transmission: shields recharge. */
export const SHIELDS_UP: Jingle = {
  title: "Shields Recharged",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.2 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "E5 . A5 . C6 . E6 - - - - - - - . .",
      harmony: "C5 . E5 . A5 . C6 - - - - - - - . .",
      bass: "A2 . . . . . A2 - - - - - - - . .",
      drums: "k . . . s . k . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** The last ship is lost. */
export const GAME_OVER: Jingle = {
  title: "Signal Lost",
  bpm: 92,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 14, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "E5 - D5 - C5 - B4 - | A4 - - - - - . .",
      bass: "A2 - - - F2 - - - | E2 - - - A1 - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { drift: DRIFT_SONG, deepField: DEEP_FIELD_SONG };
export const JINGLES: Record<string, Jingle> = { sectorClear: SECTOR_CLEAR, shieldsUp: SHIELDS_UP, gameOver: GAME_OVER };

/** The song for a level (1-based): level 5 onward gets the deep-field version. */
export function levelSong(level: number): Song {
  return level >= 5 ? DEEP_FIELD_SONG : DRIFT_SONG;
}

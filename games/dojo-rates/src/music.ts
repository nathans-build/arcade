/*
 * Dojo Tower's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Floors 1-5: an energetic A-minor pentatonic climb (A C D E G) with an echoing second pulse. */
export const FLOORS_SONG: Song = {
  title: "Dojo Climb",
  bpm: 150,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.2, vibrato: { depth: 12, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.08, echo: { steps: 3 } },
    bass: { volume: 0.5 },
    drums: { volume: 0.5 },
  },
  patterns: {
    // Lead phrases, two bars each.
    a1: "A4 . C5 D5 E5 . D5 C5 | D5 - E5 G5 E5 - D5 .",
    a2: "C5 . D5 E5 G5 . E5 D5 | E5 - - - . . . .",
    a3: "C5 . A4 G4 A4 . C5 D5 | A4 - - - . . . .",
    b1: "G5 . E5 G5 A5 . G5 E5 | D5 - E5 - G5 - . .",
    b2: "E5 . D5 C5 D5 . C5 A4 | C5 - D5 - E5 - - -",
    c1: "D5 - - - A4 - - - | C5 - D5 - E5 - . .",
    c2: "D5 - - - A4 - C5 - | B4 - - - E5 - . .",
    // Bass: one bar per chord, root and octave.
    Am: "A2 . A2 A3 . A2 A3 A2",
    G: "G2 . G2 G3 . G2 G3 G2",
    F: "F2 . F2 F3 . F2 F3 F2",
    E: "E2 . E2 E3 . E2 E3 E2",
    C: "C3 . C3 C4 . C3 C4 C3",
    Dm: "D2 . D2 D3 . D2 D3 D2",
    beat: "k h s h k k s h",
  },
  sections: {
    intro: {
      lead: "A5 - - - G5 E5 D5 C5 | A4 - - - . . . .",
      harmony: "A3+37 - - - - - - - | A3+37 - - - - - - -",
      bass: "@Am @Am",
      drums: "k . k . s . s s | t t t t s s s s",
    },
    A1: { lead: "@a1 @a2", bass: "@Am @G @F @E", drums: "@beat" },
    A2: { lead: "@a1 @a3", bass: "@Am @G @F @Am", drums: "@beat" },
    B: { lead: "@b1 @b2", bass: "@C @G @F @E", drums: "k h s h k h s s" },
    C: {
      lead: "@c1 @c2",
      harmony: "D4+37 -*7 A3+37 -*7 D4+37 -*7 E4+47 -*7",
      bass: "@Dm @Am @Dm @E",
      drums: "k . h . s . h . | k . h . s . h . | k . h . s . h . | k . s . s s s s",
    },
  },
  order: ["intro", "A1", "A2", "B", "A2", "C"],
  loopTo: 1,
};

/** Floors 6-10: the same climb a tone higher, a little faster, with a thinner, brighter lead. */
export const UPPER_FLOORS_SONG: Song = {
  ...FLOORS_SONG,
  title: "Upper Floors",
  bpm: 158,
  transpose: 2,
  voices: {
    ...FLOORS_SONG.voices,
    lead: { duty: 0.125, volume: 0.2, vibrato: { depth: 16, rate: 7, delay: 0.2 } },
    harmony: { duty: 0.25, volume: 0.07, echo: { steps: 2 } },
  },
};

/** Floor masters: a tense E-phrygian duel over a creeping bass. */
export const BOSS_SONG: Song = {
  title: "Floor Master Duel",
  bpm: 164,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.17, vibrato: { depth: 20, rate: 7, delay: 0.18 } },
    harmony: { duty: 0.25, volume: 0.07, echo: { steps: 2, octave: -1 } },
    bass: { volume: 0.52 },
  },
  patterns: {
    p1: "E5 - - - F5 - E5 - | B4 - - - - - . .",
    p2: "E5 - - - G5 - F5 - | E5 - D5 - C5 - B4 -",
    p3: "A4 - - - C5 - B4 - | A4 - G4 - F4 - E4 -",
    p4: "E5 . E5 . F5 . G5 . | A5 - G5 - F5 - E5 -",
    p5: "C5 - B4 - A4 - B4 - | E5 - - - - - . .",
    E: "E2 E2 E3 E2 E2 E3 F2 E2",
    A: "A2 A2 A3 A2 A2 A3 Bb2 A2",
    D: "D2 D2 D3 D2 D2 D3 Eb2 D2",
    C: "C3 C3 C4 C3 C3 C4 B2 C3",
    beat: "kh h sh h kh kh sh o",
  },
  sections: {
    intro: { bass: "@E", drums: "t . t . t t s s" },
    A: { lead: "@p1 @p2", bass: "@E @E @E @A", drums: "@beat" },
    B: { lead: "@p3 @p4", bass: "@A @D @E @E", drums: "@beat" },
    A2: { lead: "@p1 @p2", harmony: "E4+37 -*7 F4+47 -*7 E4+37 -*7 A3+37 -*7", bass: "@E @E @E @A", drums: "@beat" },
    B2: { lead: "@p3 @p5", bass: "@A @D @C @E", drums: "kh h sh h kh h sh sh" },
    C: {
      lead: "E5 . E5 . F5 . E5 . | E5 . E5 . G5 . F5 . | E5 . E5 . A5 . G5 . | F5 - - - B5 - - -",
      harmony: "E4+37 -*7 E4+37 -*7 E4+37 -*7 F4+47 -*7",
      bass: "@E @E @E @E",
      drums: "k . s . k k s . | k . s . k k s . | k . s . k k s . | t t t t s s s s",
    },
  },
  order: ["intro", "A", "B", "A2", "B2", "C"],
  loopTo: 1,
};

export const FLOOR_CLEAR: Jingle = {
  title: "Floor Clear",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.22 }, harmony: { duty: 0.125, volume: 0.1 } },
  sections: {
    J: {
      lead: "A4 C5 D5 E5 G5 . A5 - - - G5 A5 C6 - - - - - - - . . . .",
      harmony: "E4 G4 A4 C5 D5 . E5 - - - D5 E5 E5 - - - - - - - . . . .",
      bass: "A2 . . . . . A2 - - - . . A2 - - - - - - - . . . .",
      drums: "k . . . . . k . . . s . k . . . . . . . . . . .",
    },
  },
  order: ["J"],
};

export const TOWER_CLEARED: Jingle = {
  title: "Tower Cleared",
  bpm: 132,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.22, vibrato: { depth: 15, rate: 6, delay: 0.3 } }, harmony: { duty: 0.5, volume: 0.08 } },
  sections: {
    J: {
      lead: "E5 . E5 . D5 . E5 . | G5 - - - E5 - G5 - | A5 - - - G5 - A5 - | C#6 - - - - - - .",
      harmony: "A3+37 -*7 C4+47 -*7 D4+47 -*7 A3+47 - - - - - - .",
      bass: "A2 . A2 . A2 . A2 . | C3 . C3 . C3 . C3 . | D3 . D3 . D3 . D3 . | A2 - - - - - - .",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const BOSS_INTRO: Jingle = {
  title: "Master Appears",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.18 } },
  sections: {
    J: {
      lead: "E4 . E4 . F4 . E4 . B4 - - - E5 - - -",
      bass: "E2 - - - - - - - E2 - - - - - - -",
      drums: "t . t . t . t . s s s s k . . .",
    },
  },
  order: ["J"],
};

export const GAME_OVER: Jingle = {
  title: "Rest and Try Again",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "E5 - D5 - C5 - A4 - | G4 - - - A4 - - .",
      bass: "A2 - - - F2 - - - | E2 - - - A2 - - .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { floors: FLOORS_SONG, upper: UPPER_FLOORS_SONG, boss: BOSS_SONG };
export const JINGLES: Record<string, Jingle> = { floorClear: FLOOR_CLEAR, towerCleared: TOWER_CLEARED, bossIntro: BOSS_INTRO, gameOver: GAME_OVER };

/** The climbing music for a floor (floors 6-10 get their own flavour). */
export function floorSong(floor: number): Song {
  return floor >= 6 ? UPPER_FLOORS_SONG : FLOORS_SONG;
}

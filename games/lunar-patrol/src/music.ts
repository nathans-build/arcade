/*
 * Lunar Patrol Academy's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Sectors A-E: a bouncy D-dorian rover cruise over an octave-hopping bass, with an echoing second pulse. */
export const CRUISE_SONG: Song = {
  title: "Regolith Cruise",
  bpm: 144,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 14, rate: 6, delay: 0.22 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.5 },
    drums: { volume: 0.45 },
  },
  patterns: {
    a1: "D5 . A4 . D5 E5 F5 . | E5 - D5 - C5 . A4 .",
    a2: "G4 . A4 C5 D5 . C5 A4 | D5 - - - . . . .",
    a3: "D5 . A4 . D5 E5 F5 . | G5 - F5 - E5 . C5 .",
    a4: "D5 - E5 - C5 - A4 - | D5 - - - - - . .",
    b1: "F5 . F5 G5 A5 . G5 F5 | E5 - - - C5 - - -",
    b2: "D5 . D5 E5 F5 . E5 D5 | C5 - A4 - B4 - C5 -",
    b3: "F5 . F5 G5 A5 . C6 A5 | G5 - - - E5 - G5 -",
    b4: "A5 - - - G5 F5 E5 C5 | D5 - - - - - . .",
    Dm: "D2 . D3 D2 A2 . D3 A2",
    C: "C2 . C3 C2 G2 . C3 G2",
    Bb: "Bb1 . Bb2 Bb1 F2 . Bb2 F2",
    Am: "A1 . A2 A1 E2 . A2 E2",
    A: "A1 . A2 A1 E2 . A2 C#3",
    F: "F2 . F3 F2 C3 . F3 C3",
    beat: "k . h k s . h h",
  },
  sections: {
    intro: {
      harmony: "D4+37 -*7 C4+47 -*7",
      bass: "@Dm @C",
      drums: "k . h . k . h h | k . h . s s s s",
    },
    A1: { lead: "@a1 @a2", bass: "@Dm @C @Bb @Dm", drums: "@beat" },
    A2: { lead: "@a3 @a4", bass: "@Dm @C @Am @Dm", drums: "@beat" },
    B: { lead: "@b1 @b2", bass: "@F @C @Bb @Am", drums: "k . h k s . h k" },
    B2: { lead: "@b3 @b4", bass: "@F @C @Am @Dm", drums: "k . h k s . h k | k . h k s s h s" },
    C: {
      lead: "A4 - - - D5 - - - | C5 - - - G4 - - - | Bb4 - - - F5 - - - | E5 - - - - - - -",
      harmony: "D4+37 -*7 C4+47 -*7 Bb3+47 -*7 A3+47 -*7",
      bass: "@Dm @C @Bb @A",
      drums: "k . . . s . . . | k . . k s . . .",
    },
  },
  order: ["intro", "A1", "A2", "B", "B2", "A1", "C"],
  loopTo: 1,
};

/** Sectors F onward: the same cruise a tone higher and a little faster, with a thinner, brighter lead. */
export const FAR_SIDE_SONG: Song = {
  ...CRUISE_SONG,
  title: "Far Side Drive",
  bpm: 152,
  transpose: 2,
  voices: {
    ...CRUISE_SONG.voices,
    lead: { duty: 0.125, volume: 0.19, vibrato: { depth: 18, rate: 7, delay: 0.18 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2 } },
  },
};

/** The Quiz Squadron: a tense E-minor alarm while the answer UFOs are in the sky. */
export const SQUADRON_SONG: Song = {
  title: "Squadron Alert",
  bpm: 160,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.15, vibrato: { depth: 18, rate: 7, delay: 0.15 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } },
    bass: { volume: 0.5 },
    drums: { volume: 0.5 },
  },
  patterns: {
    s1: "E5 . E5 . G5 . F#5 . | E5 . B4 . D5 - - -",
    s2: "E5 . E5 . G5 . A5 . | B5 - A5 - G5 - F#5 -",
    s3: "C5 . C5 . E5 . D5 . | C5 . G4 . B4 - - -",
    s4: "A4 . B4 . C5 . D5 . | E5 - - - - - . .",
    Em: "E2 E3 E2 E3 E2 E3 B2 D3",
    C: "C2 C3 C2 C3 C2 C3 G2 B2",
    D: "D2 D3 D2 D3 D2 D3 A2 C3",
    B: "B1 B2 B1 B2 B1 B2 F#2 A2",
    Am: "A1 A2 A1 A2 A1 A2 E2 G2",
    beat: "kh h sh h kh kh sh h",
  },
  sections: {
    intro: { harmony: "E4+37 -*15", bass: "@Em @Em", drums: "t . t . t t t t | s s s s s s s s" },
    A: { lead: "@s1 @s2", bass: "@Em @Em @C @D", drums: "@beat" },
    B: { lead: "@s3 @s4", bass: "@C @C @Am @B", drums: "@beat" },
    C: {
      lead: "B4 . . B4 . . B4 . | C5 . . C5 . . C5 . | D5 . . D5 . . D5 . | F#5 - - - D#5 - - -",
      harmony: "E4+37 -*7 C4+47 -*7 D4+47 -*7 B3+47 -*7",
      bass: "@Em @C @D @B",
      drums: "k . s . k k s . | k . s . k k s s",
    },
    C2: { lead: "@s2 @s4", bass: "@C @D @Am @B", drums: "@beat" },
  },
  order: ["intro", "A", "B", "A", "C", "C2"],
  loopTo: 1,
};

/** A right checkpoint answer: the fuel cells fill up. */
export const REFUELED: Jingle = {
  title: "Fuel Cells Full",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "D5 F5 A5 . D6 - - - C6 - D6 - - - - -",
      harmony: "A4 D5 F5 . A5 - - - G5 - A5 - - - - -",
      bass: "D3 . . . D3 - - - C3 - D3 - - - - -",
      drums: "k . . . s . . . k . k . . . . .",
    },
  },
  order: ["J"],
};

/** The right answer UFO is shot down. */
export const DIRECT_HIT: Jingle = {
  title: "Direct Hit",
  bpm: 170,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.5, volume: 0.08 } },
  sections: {
    J: {
      lead: "E5 G5 B5 . E6 - - - - - . .",
      harmony: "B4 E5 G5 . B5 - - - - - . .",
      bass: "E3 . E3 . E2 - - - - - . .",
      drums: "k . k . s . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of rovers or fuel. */
export const GAME_OVER: Jingle = {
  title: "Rover Down",
  bpm: 100,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 12, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "A4 - - - G4 - F4 - | E4 - F4 - D4 - . .",
      bass: "D3 - - - Bb2 - - - | A2 - - - D2 - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { cruise: CRUISE_SONG, farSide: FAR_SIDE_SONG, squadron: SQUADRON_SONG };
export const JINGLES: Record<string, Jingle> = { refueled: REFUELED, directHit: DIRECT_HIT, gameOver: GAME_OVER };

/** The driving music for a sector (0 = A); F onward gets the far-side flavour. */
export function sectorSong(sector: number): Song {
  return sector >= 5 ? FAR_SIDE_SONG : CRUISE_SONG;
}

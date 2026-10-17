/*
 * Route Runner's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * The street theme is a sunny bike ride with a "bike bell" motif (repeated high notes); the bonus
 * yard gets a calmer tune so the question is easy to think about.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Streets 1-4: a bright G-major ride, an E-minor uphill pedal, and a bike-bell break. */
export const ROUTE_SONG: Song = {
  title: "Morning Route",
  bpm: 132,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, vibrato: { depth: 10, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.48, gate: 0.7 },
    drums: { volume: 0.42 },
  },
  patterns: {
    a1: "G5 . G5 . B5 . A5 G5 | E5 - D5 - . . B4 .",
    a2: "C5 . E5 G5 . E5 D5 C5 | D5 - - - . . . .",
    a3: "G5 . G5 . B5 . A5 G5 | E5 - G5 - A5 - B5 .",
    a4: "C6 . B5 A5 . G5 E5 F#5 | G5 - - - . . . .",
    b1: "E5 - - - F#5 - G5 - | A5 - G5 - F#5 - D5 -",
    b2: "E5 - - - B4 - - - | C5 - D5 - E5 - - .",
    b3: "A5 - - - G5 - F#5 - | E5 - D5 - C5 - B4 -",
    b4: "C5 - - - D5 - - - | D5 - - - . . . .",
    G: "G2 . D3 . G2 G2 D3 .",
    Em: "E2 . B2 . E2 E2 B2 .",
    C: "C3 . G2 . C3 C3 G2 .",
    D: "D3 . A2 . D3 D3 A2 .",
    Am: "A2 . E3 . A2 A2 E3 .",
    CD: "C3 . G2 . D3 . A2 .",
    ride: "k . s k . k s .",
  },
  sections: {
    intro: {
      lead: ". . . . . . . . | B5 . B5 . . . . .",
      bass: "@G @G",
      drums: "k . h . k . h . | k . h . s s s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@G @Em @C @D @G @Em @CD @G", drums: "@ride" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "E4+37 -*7 D4+47 -*7 E4+37 -*7 A3+37 -*7 C4+47 -*7 D4+47 -*7 A3+37 -*7 D4+47 -*7",
      bass: "@Em @D @Em @Am @C @D @Am @D",
      drums: "k h s h k h s h",
    },
    C: {
      lead: "B5 . B5 . . . . . | A5 . A5 . . . . . | G5 . A5 . B5 . D6 . | D6 - - - . . . .",
      harmony: "G4+47 -*7 C4+47 -*7 D4+47 -*7 D4+47 -*7",
      bass: "@G @C @D @D",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s . | t t t t s s s o",
    },
  },
  order: ["intro", "A", "B", "A", "C"],
  loopTo: 1,
};

/** Streets 5+: the same ride a tone higher and a bit quicker, with a thinner lead. */
export const AFTERNOON_SONG: Song = {
  ...ROUTE_SONG,
  title: "Afternoon Route",
  bpm: 140,
  transpose: 2,
  voices: {
    ...ROUTE_SONG.voices,
    lead: { duty: 0.125, volume: 0.19, vibrato: { depth: 14, rate: 6.5, delay: 0.22 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } },
  },
};

/** The bonus yard: the bike stops and a question waits. A calm, sparse C-major tune. */
export const YARD_SONG: Song = {
  title: "Bonus Yard",
  bpm: 108,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.14, vibrato: { depth: 8, rate: 5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.05 },
    bass: { volume: 0.4, gate: 0.6 },
    drums: { volume: 0.25 },
  },
  patterns: {
    y1: "E5 - . G5 - . A5 . | G5 - - - E5 - . .",
    y2: "D5 - . F5 - . G5 . | E5 - - - C5 - . .",
    y3: "E5 - . G5 - . C6 . | B5 - - - A5 - . .",
    y4: "G5 - F5 - E5 - D5 - | C5 - - - . . . .",
    z1: "A5 - - - G5 - E5 - | F5 - - - D5 - - -",
    z2: "G5 - - - E5 - C5 - | D5 - - - - - . .",
    z3: "A5 - - - G5 - E5 - | F5 - - - A5 - - -",
    z4: "G5 - - - F5 - D5 - | C5 - - - - - . .",
    C: "C3 . . G2 . . C3 .",
    Am: "A2 . . E2 . . A2 .",
    F: "F2 . . C3 . . F2 .",
    G: "G2 . . D3 . . G2 .",
    Dm: "D3 . . A2 . . D3 .",
  },
  sections: {
    A: {
      lead: "@y1 @y2 @y3 @y4",
      bass: "@C @Am @F @G @C @Am @G @C",
      drums: "k . h . . . h .",
    },
    B: {
      lead: "@z1 @z2 @z3 @z4",
      harmony: "A3+37 -*7 D4+37 -*7 C4+47 -*7 G3+47 -*7 A3+37 -*7 F3+47 -*7 G3+47 -*7 C4+47 -*7",
      bass: "@Am @Dm @C @G @Am @F @G @C",
      drums: "k . h . . . h . | k . h . . . h h",
    },
  },
  order: ["A", "B"],
};

/** A street with no misses: an extra bike. */
export const PERFECT_STREET: Jingle = {
  title: "Perfect Street",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "G5 . G5 . B5 . G5 . D6 . . . B5 . D6 . G6 - - - - - . .",
      harmony: "D5 . D5 . G5 . D5 . B5 . . . G5 . B5 . D6 - - - - - . .",
      bass: "G2 . . . G3 . . . D3 . . . D3 . . . G2 - - - - - . .",
      drums: "k . h . s . h . k . h . s . s s k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The end of a street (with misses): pulling into the bonus yard. */
export const STREET_DONE: Jingle = {
  title: "Into the Yard",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.19 } },
  sections: {
    J: {
      lead: "D5 . G5 . B5 . A5 . G5 - - - . . . .",
      bass: "G2 . . . D3 . . . G2 - - - . . . .",
      drums: "k . . . s . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** A bonus-yard bullseye. */
export const BULLSEYE: Jingle = {
  title: "Bullseye",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.16 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "C5 E5 G5 C6 . . G5 C6 E6 - - - - - . .",
      harmony: "G4 C5 E5 G5 . . E5 G5 C6 - - - - - . .",
      bass: "C3 . . . . . G2 . C3 - - - - - . .",
      drums: "h . h . k . . . s . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of bikes. A friendly wind-down, not a scolding one. */
export const ROUTE_END: Jingle = {
  title: "End of the Route",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "B5 - A5 - G5 - E5 - | D5 - E5 - G5 - - .",
      bass: "G2 - - - C3 - - - | D3 - - - G2 - - .",
      drums: "k . . . . . . . | s . . . k . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { route: ROUTE_SONG, afternoon: AFTERNOON_SONG, yard: YARD_SONG };
export const JINGLES: Record<string, Jingle> = { perfectStreet: PERFECT_STREET, streetDone: STREET_DONE, bullseye: BULLSEYE, routeEnd: ROUTE_END };

/** The riding music for a street (streets 5 and up get the afternoon version). */
export function streetSong(street: number): Song {
  return street >= 5 ? AFTERNOON_SONG : ROUTE_SONG;
}

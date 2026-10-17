/*
 * Page Quest's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * It's a reading game, so every tune is calm and sits well under the text and read-aloud (the music
 * ducks while the page is read out, and thins to lead + bass while Quill's gate question is up).
 * The Arcade Library has its own cozy tune; each shelf genre has a mood of its own.
 */
import type { Jingle, Song } from "@/kit/audio";

/** The Arcade Library and the Writer's Desk: a cozy D-major tune for browsing the shelves. */
export const LIBRARY_SONG: Song = {
  title: "Quill's Reading Nook",
  bpm: 88,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.085, attack: 0.02, sustain: 0.55, gate: 0.85, vibrato: { depth: 8, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.45 },
    bass: { volume: 0.28, gate: 0.8 },
    drums: { volume: 0.08 },
  },
  patterns: {
    D: "D2 - - - A2 - - -", Bm: "B1 - - - F#2 - - -", G: "G2 - - - D3 - - -", A: "A2 - - - E2 - - -", Em: "E2 - - - B2 - - -", EmA: "E2 - - - A2 - - -",
    hD: ". . D4+47 . . . D4+47 .", hBm: ". . B3+37 . . . B3+37 .", hG: ". . G3+47 . . . G3+47 .", hA: ". . A3+47 . . . A3+47 .",
    hEm: ". . E4+37 . . . E4+37 .", hEmA: ". . E4+37 . . . A3+47 .",
    page: "k . . . h . . . | . . . . h . . .",
  },
  sections: {
    A: {
      lead: "F#5 - - - E5 - D5 - | B4 - - - D5 - - - | G5 - - - F#5 - E5 - | E5 - - - - - . . | F#5 - - - A5 - D6 - | B5 - - - A5 - F#5 - | G5 - E5 - C#5 - E5 - | D5 - - - - - . .",
      harmony: "@hD @hBm @hG @hA @hD @hBm @hEmA @hD",
      bass: "@D @Bm @G @A @D @Bm @EmA @D",
      drums: "@page",
    },
    B: {
      lead: "B5 - - - A5 - G5 - | F#5 - - - D5 - - - | E5 - G5 - B5 - G5 - | A5 - - - - - . . | B5 - - - C#6 - D6 - | A5 - - - F#5 - D5 - | E5 - - - G5 - C#5 - | D5 - - - - - . .",
      harmony: "@hG @hD @hEm @hA @hG @hD @hEmA @hD",
      bass: "@G @D @Em @A @G @D @EmA @D",
      drums: "@page",
    },
  },
  order: ["A", "B"],
};

/** MYSTERY: a sneaky D-minor tiptoe over a staccato walking bass. */
export const MYSTERY_SONG: Song = {
  title: "Fogbound Clues",
  bpm: 92,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.09, gate: 0.7, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.4 },
    bass: { volume: 0.3, gate: 0.45 },
    drums: { volume: 0.09 },
  },
  patterns: {
    Dm: "D2 . F2 . A2 . F2 .", Gm: "G2 . Bb2 . D3 . Bb2 .", A7: "A2 . C#3 . E3 . G2 .", Bb: "Bb1 . D2 . F2 . D2 .", GmA: "G2 . Bb2 . A2 . C#3 .",
    F: "F2 . A2 . C3 . A2 .", A: "A2 . C#3 . E3 . C#3 .",
    hDm: ". . . . D4+37 . . .", hGm: ". . . . G3+37 . . .", hA7: ". . . . A3+47a . . .", hBb: ". . . . Bb3+47 . . .", hF: ". . . . F3+47 . . .",
    hA: ". . . . A3+47 . . .",
    brush: "h . . . s . . . | h . . h s . . .",
  },
  sections: {
    A: {
      lead: "D5 . . F5 . . E5 . | D5 - - - . . A4 . | Bb4 . . D5 . . G5 . | E5 - - - C#5 - . . | D5 . . F5 . . A5 . | Bb5 - - - A5 . G5 . | F5 - - - E5 - - - | D5 - - - . . . .",
      harmony: "@hDm @hDm @hGm @hA7 @hDm @hBb @hGm @hDm",
      bass: "@Dm @Dm @Gm @A7 @Dm @Bb @GmA @Dm",
      drums: "@brush",
    },
    B: {
      lead: "F5 - - - . . D5 . | C5 - - - . . A4 . | Bb4 . D5 . G5 . F5 . | E5 - - - . . . . | F5 . . G5 . . A5 . | C6 - - - A5 . F5 . | G5 . . F5 . . E5 . | D5 - - - . . . .",
      harmony: "@hBb @hF @hGm @hA @hBb @hF @hGm @hDm",
      bass: "@Bb @F @Gm @A @Bb @F @GmA @Dm",
      drums: "@brush",
    },
  },
  order: ["A", "B"],
};

/** ADVENTURE: a hopeful G-major hiking tune with a light marching beat. */
export const ADVENTURE_SONG: Song = {
  title: "Over the Ridge",
  bpm: 104,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.1, gate: 0.8, vibrato: { depth: 9, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.5, volume: 0.03, gate: 0.4 },
    bass: { volume: 0.3, gate: 0.55 },
    drums: { volume: 0.12 },
  },
  patterns: {
    G: "G2 . G2 D3 G2 . D3 .", C: "C3 . C3 G2 C3 . G2 .", D: "D2 . D2 A2 D2 . A2 .", Em: "E2 . E2 B2 E2 . B2 .", Am: "A2 . A2 E2 A2 . E2 .",
    hG: ". . G4+47 . . . G4+47 .", hC: ". . C4+47 . . . C4+47 .", hD: ". . D4+47 . . . D4+47 .", hEm: ". . E4+37 . . . E4+37 .",
    hAm: ". . A3+37 . . . A3+37 .",
    march: "k . h . s . h . | k . h k s . h .",
  },
  sections: {
    A: {
      lead: "D5 - G5 - B5 - - A5 | G5 - E5 - C5 - - - | D5 - F#5 - A5 - - G5 | G5 - - - D5 - - - | E5 - G5 - B5 - - A5 | G5 - E5 - C6 - - - | B5 - A5 - G5 - F#5 - | A5 - - - - - . .",
      harmony: "@hG @hC @hD @hG @hEm @hC @hD @hD",
      bass: "@G @C @D @G @Em @C @D @D",
      drums: "@march",
    },
    B: {
      lead: "E5 - - - G5 - C6 - | B5 - - - G5 - D5 - | C5 - - - E5 - A5 - | F#5 - - - D5 - - - | E5 - - - G5 - C6 - | D6 - - - B5 - G5 - | A5 - - - F#5 - D5 - | G5 - - - - - . .",
      harmony: "@hC @hG @hAm @hD @hC @hG @hD @hG",
      bass: "@C @G @Am @D @C @G @D @G",
      drums: "@march",
    },
  },
  order: ["A", "B"],
};

/** SPACE: slow E-minor starlight, long lead notes over a twinkling broken-chord harmony. */
export const SPACE_SONG: Song = {
  title: "Starlit Logbook",
  bpm: 96,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.09, attack: 0.03, sustain: 0.6, gate: 0.95, vibrato: { depth: 12, rate: 4, delay: 0.4 } },
    harmony: { duty: 0.25, volume: 0.03, gate: 0.5 },
    bass: { volume: 0.28, gate: 0.9 },
    drums: { volume: 0.07 },
  },
  patterns: {
    rEm: "E4 G4 B4 E5 B4 G4 E4 G4", rC: "C4 E4 G4 C5 G4 E4 C4 E4", rG: "G4 B4 D5 G5 D5 B4 G4 B4", rD: "D4 F#4 A4 D5 A4 F#4 D4 F#4",
    rAm: "A4 C5 E5 A5 E5 C5 A4 C5", rB: "B3 D#4 F#4 B4 F#4 D#4 B3 D#4", rBm: "B3 D4 F#4 B4 F#4 D4 B3 D4",
    float: "h . . . . . . . | h . . . k . . .",
  },
  sections: {
    A: {
      lead: "B5 - - - - - - - | G5 - - - E5 - - - | D5 - - - G5 - - - | F#5 - - - - - - - | B5 - - - - - C6 - | G5 - - - E5 - - - | A5 - - - C6 - - - | B5 - - - D#5 - - -",
      harmony: "@rEm @rC @rG @rD @rEm @rC @rAm @rB",
      bass: "E2 - - - - - - - | C2 - - - - - - - | G2 - - - - - - - | D2 - - - - - - - | E2 - - - - - - - | C2 - - - - - - - | A1 - - - - - - - | B1 - - - - - - -",
      drums: "@float",
    },
    B: {
      lead: "E5 - - - G5 - - - | A5 - - - F#5 - - - | D5 - - - F#5 - B5 - | G5 - - - - - - - | E5 - - - G5 - C6 - | D6 - - - A5 - - - | B5 - - - - - - - | D#5 - - - F#5 - - -",
      harmony: "@rC @rD @rBm @rEm @rC @rD @rB @rB",
      bass: "C2 - - - - - - - | D2 - - - - - - - | B1 - - - - - - - | E2 - - - - - - - | C2 - - - - - - - | D2 - - - - - - - | B1 - - - - - - - | B1 - - - F#2 - - -",
      drums: "@float",
    },
  },
  order: ["A", "B"],
};

/** FANTASY: an A-minor waltz with a bright modal (dorian) lift, like an old story told by firelight. */
export const FANTASY_SONG: Song = {
  title: "Rune Meadow",
  bpm: 96,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.085, attack: 0.02, sustain: 0.55, gate: 0.85, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.45 },
    bass: { volume: 0.28, gate: 0.8 },
  },
  patterns: {
    Am: "A2 - - - E2 -", D: "D2 - - - A2 -", G: "G2 - - - D2 -", F: "F2 - - - C3 -", Em: "E2 - - - B2 -", E: "E2 - - - B1 -",
    hAm: ". . A3+37 . A3+37 .", hD: ". . D4+47 . D4+47 .", hG: ". . G3+47 . G3+47 .", hF: ". . F3+47 . F3+47 .", hEm: ". . E4+37 . E4+37 .",
    hE: ". . E3+47 . E3+47 .",
  },
  sections: {
    A: {
      lead: "A4 - C5 - E5 - | F#5 - - - E5 - | D5 - C5 - B4 - | D5 - - - - - | C5 - D5 - E5 - | G5 - - - D5 - | E5 - D5 - B4 - | A4 - - - - -",
      harmony: "@hAm @hD @hAm @hG @hF @hG @hEm @hAm",
      bass: "@Am @D @Am @G @F @G @Em @Am",
    },
    B: {
      lead: "A5 - - - G5 - | B5 - - - G5 - | A5 - E5 - C5 - | E5 - - - - - | F5 - A5 - C6 - | B5 - - - G5 - | G#5 - - - E5 - | B4 - - - - -",
      harmony: "@hF @hG @hAm @hAm @hF @hG @hE @hE",
      bass: "@F @G @Am @Am @F @G @E @E",
    },
  },
  order: ["A", "B"],
};

/** SPOOKY: creaky C-minor footsteps with a ghostly echo; mysterious, never scary. */
export const SPOOKY_SONG: Song = {
  title: "Creaky Stairs",
  bpm: 84,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.085, gate: 0.75, vibrato: { depth: 18, rate: 5.5, delay: 0.2 } },
    harmony: { duty: 0.125, volume: 0.035, echo: { steps: 3, octave: -1 } },
    bass: { volume: 0.3, gate: 0.6 },
    drums: { volume: 0.09 },
  },
  patterns: {
    Cm: "C2 . . . G2 . Gb2 .", Ab: "Ab1 . . . Eb2 . D2 .", G: "G1 . . . D2 . Db2 .", Fm: "F2 . . . C2 . B1 .", AbG: "Ab1 . . . G1 . . .",
    Eb: "Eb2 . . . Bb1 . A1 .", FmG: "F2 . . . G1 . . .",
    tick: "k . h . . . h . | . . h . t . h .",
  },
  sections: {
    A: {
      lead: "C5 . . Eb5 . . D5 . | C5 - - - B4 - - - | C5 . . Eb5 . . G5 . | F#5 - - - G5 - - - | Ab5 - - - G5 . . . | F5 - - - Eb5 . . . | D5 . Eb5 . D5 . C5 . | B4 - - - . . . .",
      bass: "@Cm @Cm @Ab @G @Cm @Fm @AbG @Cm",
      drums: "@tick",
    },
    B: {
      lead: "F5 - - - Ab5 - - - | G5 - - - Eb5 - - - | F5 - - - Ab5 - C6 - | B5 - - - - - - - | C6 - - - Ab5 - - - | G5 - - - Eb5 - - - | F5 - Ab5 - G5 - B4 - | C5 - - - - - . .",
      bass: "@Fm @Cm @Fm @G @Ab @Eb @FmG @Cm",
      drums: "@tick",
    },
  },
  order: ["A", "B"],
};

/** ROBOTS: a clockwork F-major tune with a pumping octave bass and staccato bleeps. */
export const ROBOTS_SONG: Song = {
  title: "Gear Garden",
  bpm: 108,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.09, gate: 0.5 },
    harmony: { duty: 0.25, volume: 0.03, gate: 0.35 },
    bass: { volume: 0.28, gate: 0.4 },
    drums: { volume: 0.12 },
  },
  patterns: {
    F: "F2 F3 F2 F3 F2 F3 F2 F3", Bb: "Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2", C: "C2 C3 C2 C3 C2 C3 C2 C3", Dm: "D2 D3 D2 D3 D2 D3 D2 D3",
    BbC: "Bb1 Bb2 Bb1 Bb2 C2 C3 C2 C3", G: "G2 G3 G2 G3 G2 G3 G2 G3",
    hF: "F4+47 . . . F4+47 . . .", hBb: "Bb3+47 . . . Bb3+47 . . .", hC: "C4+47 . . . C4+47 . . .", hDm: "D4+37 . . . D4+37 . . .",
    hBbC: "Bb3+47 . . . C4+47 . . .", hG: "G3+47 . . . G3+47 . . .",
    clank: "k . h . s . h h | k k h . s . h .",
  },
  sections: {
    A: {
      lead: "F5 . A5 . C6 . A5 . | F5 . G5 . A5 - - - | D5 . F5 . Bb5 . F5 . | E5 . G5 . C6 - - - | F5 . A5 . C6 . A5 . | D6 - - - A5 - F5 - | G5 . Bb5 . E5 . G5 . | F5 - - - . . . .",
      harmony: "@hF @hF @hBb @hC @hF @hDm @hBbC @hF",
      bass: "@F @F @Bb @C @F @Dm @BbC @F",
      drums: "@clank",
    },
    B: {
      lead: "D5 D5 . F5 . A5 . . | Bb5 - - - F5 . . . | C5 C5 . E5 . G5 . . | A5 - - - . . . . | D5 D5 . F5 . A5 . . | D6 - - - Bb5 . . . | B5 . A5 . G5 . D5 . | E5 - - - G5 - - -",
      harmony: "@hDm @hBb @hC @hF @hDm @hBb @hG @hC",
      bass: "@Dm @Bb @C @F @Dm @Bb @G @C",
      drums: "@clank",
    },
  },
  order: ["A", "B"],
};

/** A happy ending (THE END). */
export const END_WIN: Jingle = {
  title: "The End",
  bpm: 120,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.17 }, harmony: { duty: 0.125, volume: 0.06 } },
  sections: {
    J: {
      lead: "D5 . F#5 . A5 . D6 - | - - C#6 . B5 . C#6 - | - - - - D6 - - - | - - - - - - . .",
      harmony: "A4 . D5 . F#5 . A5 - | - - A5 . G5 . A5 - | - - - - F#5 - - - | - - - - - - . .",
      bass: "D3 . . . A2 . . . | G2 . . . A2 . . . | D2 - - - - - - - | - - - - - - . .",
      drums: "k . . . s . . . | k . . . s . s s | k . . . . . . . | . . . . . . . .",
    },
  },
  order: ["J"],
};

/** A secret ending: a sparkly E-major flourish. */
export const END_SECRET: Jingle = {
  title: "Secret Ending",
  bpm: 120,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.17 }, harmony: { duty: 0.25, volume: 0.05 } },
  sections: {
    J: {
      lead: "E5 . G#5 . B5 . E6 . | D#6 . B5 . G#5 . B5 . | E6 - - - - - - - | . . . .",
      harmony: "E4+47 -*15 E4+47 -*7 . . . .",
      bass: "E2 . . . B2 . . . | A2 . . . B2 . . . | E2 - - - - - - - | . . . .",
      drums: "k . . . h . . . | k . . . s . . . | k . . . . . . . | . . . .",
    },
  },
  order: ["J"],
};

/** A dead end (THE END?): a gentle sinking line, never harsh. */
export const END_LOSE: Jingle = {
  title: "The End?",
  bpm: 100,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.15, vibrato: { depth: 15, rate: 6, delay: 0.1 } } },
  sections: {
    J: {
      lead: "A4 - - . G#4 - - . G4 - - . F#4 - - - - - - - | . . . .",
      bass: "D3 - - . C#3 - - . C3 - - . B2 - - - - - - - | . . . .",
    },
  },
  order: ["J"],
};

/** Quill's checkpoint transmission comes in. */
export const TRANSMISSION: Jingle = {
  title: "Incoming Transmission",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.14 } },
  sections: {
    J: {
      lead: "A5 . A5 . E6 . . . | A5 . E6 - - - . .",
    },
  },
  order: ["J"],
};

/** The genre songs, by the shelf genre in a book's header. */
export const GENRE_SONGS: Record<string, Song> = {
  mystery: MYSTERY_SONG,
  adventure: ADVENTURE_SONG,
  space: SPACE_SONG,
  fantasy: FANTASY_SONG,
  spooky: SPOOKY_SONG,
  robots: ROBOTS_SONG,
};

/** The song for a book: its genre's mood, or the adventure tune for a book with another genre. */
export function songForGenre(genre: string | undefined): Song {
  return GENRE_SONGS[(genre ?? "").toLowerCase()] ?? ADVENTURE_SONG;
}

export const SONGS: Record<string, Song> = { library: LIBRARY_SONG, ...GENRE_SONGS };
export const JINGLES: Record<string, Jingle> = { win: END_WIN, secret: END_SECRET, lose: END_LOSE, transmission: TRANSMISSION };

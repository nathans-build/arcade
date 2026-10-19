/*
 * Germ Fighters' soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * The eight body zones and the Lymph Node share one E-minor "immune patrol" groove (bass, drums and a
 * bridge); each zone gets its own lead lines, key, tempo and pulse colour. Steps are 8th notes in songs
 * and 16th notes in jingles; "|" marks the bars.
 */
import type { Jingle, Song, Voice } from "@/kit/audio";
import type { StageId, ZoneId } from "@/germs/roster";

/** Stage select: a bright F-major "map of the body" tune. */
export const SELECT_SONG: Song = {
  title: "Body Map",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.46, gate: 0.7 },
    drums: { volume: 0.38 },
  },
  patterns: {
    q1: "F5 . A5 . C6 . A5 F5 | G5 . Bb5 . D6 - Bb5 .",
    q2: "E5 . G5 . C6 . G5 E5 | F5 - A5 - C6 - . .",
    q3: "D5 . F5 . A5 . F5 D5 | Bb4 - D5 - F5 - Bb5 -",
    q4: "C5 . E5 . G5 . Bb5 . | C6 - - - . . . .",
    r1: "A5 - G5 - F5 - C5 - | D5 - E5 - F5 - - -",
    r2: "E5 - G5 - C6 - G5 - | A5 - - - F5 - - -",
    r3: "Bb5 - A5 - G5 - F5 - | G5 - A5 - C6 - - -",
    r4: "F5 - A5 - C6 - A5 - | F5 - - - . . . .",
    F: "F2 . F3 . C3 . F3 .",
    Gm: "G2 . G3 . D3 . G3 .",
    C: "C2 . C3 . G2 . C3 .",
    Dm: "D2 . D3 . A2 . D3 .",
    Bb: "Bb1 . Bb2 . F2 . Bb2 .",
    Am: "A2 . A3 . E3 . A3 .",
  },
  sections: {
    A: { lead: "@q1 @q2 @q3 @q4", bass: "@F @Gm @C @F @Dm @Bb @C @C", drums: "k . h . s . h . | k . h h s . h ." },
    B: { lead: "@r1 @r2 @r3 @r4", bass: "@Bb @C @Am @Dm @Bb @C @F @F", drums: "k . h . s . h . | k h . h s . s s" },
  },
  order: ["A", "B"],
  loopTo: 0,
};

/** The shared patrol groove in E minor (each zone transposes it). */
const GROOVE = {
  Em: "E2 . E3 . B2 E2 E3 B2",
  C: "C2 . C3 . G2 C2 C3 G2",
  G: "G2 . G3 . D3 G2 G3 D3",
  D: "D2 . D3 . A2 D2 D3 A2",
  B: "B1 . B2 . F#2 B1 B2 F#2",
  Am: "A1 . A2 . E2 A1 A2 E2",
};

interface ZoneLines {
  /** Five 2-bar lead phrases in E minor: a1 (Em|C), a2 (G|D), a3 (G|B), b1 (C|D), b2 (B|Em). */
  a1: string;
  a2: string;
  a3: string;
  b1: string;
  b2: string;
}

/**
 * A zone theme: an intro (2 bars), then A (a1 a2), A' (a1 a3), B (b1 b2) and a 4-bar bridge of chord
 * arpeggios; about 27-32 s before it loops.
 */
function zoneSong(title: string, lines: ZoneLines, o: { transpose: number; bpm: number; beat: string; lead: Voice; harmony?: Voice }): Song {
  return {
    title,
    bpm: o.bpm,
    stepsPerBeat: 2,
    transpose: o.transpose,
    voices: {
      lead: o.lead,
      harmony: o.harmony ?? { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
      bass: { volume: 0.5, gate: 0.75 },
      drums: { volume: 0.44 },
    },
    patterns: { ...GROOVE, ...lines, beat: o.beat },
    sections: {
      intro: { bass: "@Em @Em", harmony: "E4+37 -*7 E4+37 -*7", drums: "k . . k s . . . | k . . k s s s s" },
      A: { lead: "@a1 @a2", bass: "@Em @C @G @D", drums: "@beat" },
      A2: { lead: "@a1 @a3", bass: "@Em @C @G @B", drums: "@beat" },
      B: { lead: "@b1 @b2", bass: "@C @D @B @Em", drums: "@beat" },
      bridge: {
        harmony: "A4+37 -*7 B4+37 -*7 C5+47 -*7 D5+47 -*7",
        bass: "@Am @B @C @D",
        drums: "k . h . s . h . | k . h . s . h . | k . h . s . h . | k k s . s s s s",
      },
    },
    order: ["intro", "A", "A2", "B", "bridge"],
    loopTo: 1,
  };
}

const BOUNCE = "k . h k s . h .";
const PULSE = "k h h k s h h h";
const STRIDE = "k . s . k k s h";

export const ZONE_SONGS: Record<ZoneId, Song> = {
  // Nose & Airways: bouncy, sniffly staccato in F# minor.
  nose: zoneSong("Nose & Airways", {
    a1: "E5 . G5 . B5 . G5 E5 | C5 . E5 . G5 - E5 .",
    a2: "D5 . G5 . B5 . A5 G5 | F#5 . A5 . D6 - . .",
    a3: "D5 . G5 . B5 . A5 G5 | F#5 - D#5 - B4 - . .",
    b1: "E5 - G5 - C6 - B5 A5 | F#5 - A5 - D6 - C6 B5",
    b2: "B5 - A5 - F#5 - D5 - | E5 - - - . . . .",
  }, { transpose: 2, bpm: 136, beat: BOUNCE, lead: { duty: 0.125, volume: 0.2, gate: 0.6 } }),
  // Throat & Tonsils: a smooth, swallowing legato in E minor.
  throat: zoneSong("Throat & Tonsils", {
    a1: "B4 - E5 - G5 - F#5 E5 | E5 - D5 - C5 - - -",
    a2: "B4 - D5 - G5 - A5 B5 | A5 - - - F#5 - - -",
    a3: "B4 - D5 - G5 - A5 B5 | D#5 - - - F#5 - - -",
    b1: "C5 - E5 - G5 - E5 - | D5 - F#5 - A5 - F#5 -",
    b2: "D5 - B4 - F#4 - B4 - | E5 - - - - - . .",
  }, { transpose: 0, bpm: 130, beat: STRIDE, lead: { duty: 0.5, volume: 0.17, vibrato: { depth: 16, rate: 5, delay: 0.25 } } }),
  // Lung Bubbles: long breathing notes in C# minor.
  lungs: zoneSong("Lung Bubbles", {
    a1: "E5 - - - - - D5 - | E5 - - - C5 - - -",
    a2: "D5 - - - B4 - - - | A4 - - - D5 - - -",
    a3: "D5 - - - B4 - - - | B4 - - - D#5 - - -",
    b1: "G5 - - - E5 - C5 - | A5 - - - F#5 - D5 -",
    b2: "F#5 - - - D5 - B4 - | E5 - - - - - - -",
  }, { transpose: -3, bpm: 124, beat: STRIDE, lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 20, rate: 4, delay: 0.3 } }, harmony: { duty: 0.5, volume: 0.06, echo: { steps: 4, octave: -1 } } }),
  // Bloodstream: flowing 8th-note runs in G minor.
  blood: zoneSong("Bloodstream", {
    a1: "E5 F#5 G5 B5 G5 F#5 E5 B4 | C5 E5 G5 C6 G5 E5 C5 G4",
    a2: "D5 G5 B5 D6 B5 G5 D5 B4 | A4 D5 F#5 A5 F#5 D5 A4 F#4",
    a3: "D5 G5 B5 D6 B5 G5 D5 B4 | B4 D#5 F#5 B5 - - . .",
    b1: "C6 - B5 - A5 - G5 - | A5 - G5 - F#5 - D5 -",
    b2: "D5 - F#5 - B5 - A5 - | G5 - E5 - E5 - . .",
  }, { transpose: 3, bpm: 140, beat: PULSE, lead: { duty: 0.25, volume: 0.18 } }),
  // Stomach: bubbly syncopation in D minor.
  stomach: zoneSong("Stomach", {
    a1: "E5 . . E5 G5 . E5 . | C5 . . C5 E5 . G5 .",
    a2: "G5 . . G5 B5 . A5 G5 | F#5 . . D5 A5 . . .",
    a3: "G5 . . G5 B5 . A5 G5 | F#5 . . D#5 B4 . . .",
    b1: "E5 . G5 . C6 . G5 . | F#5 . A5 . D6 . A5 .",
    b2: "B5 . F#5 . D5 . B4 . | E5 - - - E4 - . .",
  }, { transpose: -2, bpm: 128, beat: BOUNCE, lead: { duty: 0.25, volume: 0.19, gate: 0.7 } }),
  // Gut Garden: a cheerful skip in G# minor.
  gut: zoneSong("Gut Garden", {
    a1: "B4 . E5 . E5 . F#5 G5 | G5 . E5 . C5 . . .",
    a2: "D5 . G5 . G5 . A5 B5 | A5 . F#5 . D5 . . .",
    a3: "D5 . G5 . G5 . A5 B5 | B5 . A5 . F#5 . D#5 .",
    b1: "C5 . E5 . G5 . A5 G5 | D5 . F#5 . A5 . B5 A5",
    b2: "B5 . A5 . F#5 . D5 . | E5 - - - . . . .",
  }, { transpose: 4, bpm: 132, beat: STRIDE, lead: { duty: 0.125, volume: 0.2, vibrato: { depth: 8, rate: 6, delay: 0.2 } } }),
  // Skin & Cut: a brave little march in F minor.
  skin: zoneSong("Skin & Cut", {
    a1: "E5 - E5 . B4 . E5 . | G5 - E5 . C5 . G5 .",
    a2: "G5 - D5 . B4 . G5 . | A5 - F#5 . D5 . A5 .",
    a3: "G5 - D5 . B4 . G5 . | F#5 - D#5 . B4 . F#5 .",
    b1: "C6 - - - G5 - E5 - | D6 - - - A5 - F#5 -",
    b2: "B5 - - - F#5 - D5 - | E5 - B4 - E5 - . .",
  }, { transpose: 1, bpm: 134, beat: STRIDE, lead: { duty: 0.25, volume: 0.2, gate: 0.8 } }),
  // Mouth & Teeth: chompy arpeggios in C minor.
  mouth: zoneSong("Mouth & Teeth", {
    a1: "E4+37 - - - E4+37 - B4 - | C5+47 - - - C5+47 - G5 -",
    a2: "G4+47 - - - G4+47 - D5 - | D5+47 - - - A5 - F#5 -",
    a3: "G4+47 - - - G4+47 - D5 - | B4+47 - - - F#5 - D#5 -",
    b1: "C5 . C5 . E5 . G5 . | D5 . D5 . F#5 . A5 .",
    b2: "B4 . D5 . F#5 . B5 . | E5 - - - E4 - . .",
  }, { transpose: -4, bpm: 138, beat: PULSE, lead: { duty: 0.125, volume: 0.19 }, harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } } }),
};

/** The Lymph Node run, on the way to the Major Viruses. */
export const LYMPH_SONG: Song = zoneSong("Lymph Node", {
  a1: "B4 . E5 G5 B5 . G5 E5 | C5 . E5 G5 C6 . G5 E5",
  a2: "D5 . G5 B5 D6 . B5 G5 | A5 . F#5 D5 A4 . . .",
  a3: "D5 . G5 B5 D6 . B5 G5 | B5 . A5 F#5 D#5 . . .",
  b1: "E6 - D6 - C6 - G5 - | F#5 - A5 - D6 - - -",
  b2: "D6 - B5 - F#5 - D5 - | E5 - - - - - . .",
}, { transpose: 0, bpm: 142, beat: PULSE, lead: { duty: 0.25, volume: 0.19, vibrato: { depth: 12, rate: 6, delay: 0.2 } } });

/** Every stage germ's fight: a G-minor showdown with a creeping line. */
export const BOSS_SONG: Song = {
  title: "Germ Showdown",
  bpm: 158,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, vibrato: { depth: 16, rate: 7, delay: 0.2 } },
    harmony: { duty: 0.5, volume: 0.07, echo: { steps: 2, octave: -1 } },
    bass: { volume: 0.52 },
    drums: { volume: 0.5 },
  },
  patterns: {
    x1: "G5 - - - F#5 - G5 - | Bb5 - - - A5 - - -",
    x2: "G5 F5 Eb5 D5 C5 D5 Eb5 F5 | D5 - - - A4 - - -",
    x3: "D6 - C6 - Bb5 - A5 - | Bb5 - G5 - D5 - Bb4 -",
    x4: "Eb5 - G5 - Bb5 - D6 - | C6 - - - A5 - F#5 -",
    Gm: "G2 G2 G3 G2 D3 G2 G3 D3",
    Eb: "Eb2 Eb2 Eb3 Eb2 Bb2 Eb2 Eb3 Bb2",
    Cm: "C2 C2 C3 C2 G2 C2 C3 G2",
    D: "D2 D2 D3 D2 A2 D2 D3 A2",
    beat: "kh h s h kh kh s h",
  },
  sections: {
    intro: { bass: "@Gm", drums: "t . t . t t t t" },
    A: { lead: "@x1 @x2", bass: "@Gm @Eb @Cm @D", drums: "@beat" },
    B: { lead: "@x3 @x4", bass: "@Eb @Gm @Cm @D", drums: "@beat" },
    C: {
      lead: "D5 . D5 . Eb5 . D5 . | D5 . D5 . F5 . Eb5 . | D5 . D5 . G5 . F5 . | F#5 - - - A5 - - -",
      harmony: "G3+37 -*7 G3+37 -*7 C4+37 -*7 D4+47 -*7",
      bass: "@Gm @Gm @Cm @D",
      drums: "k . s . k k s . | k . s . k k s . | k . s . k k s . | s s s s s s s s",
    },
  },
  order: ["intro", "A", "B", "A", "B", "C"],
  loopTo: 1,
};

/** The Major Virus boss rush: tense but fun, a C-minor gallop. */
export const RUSH_SONG: Song = {
  title: "Major Virus Rush",
  bpm: 164,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.2, vibrato: { depth: 20, rate: 8, delay: 0.15 } },
    harmony: { duty: 0.25, volume: 0.07 },
    bass: { volume: 0.52 },
    drums: { volume: 0.5 },
  },
  patterns: {
    y1: "C5 . Eb5 . G5 . C6 . | Bb5 - G5 - Ab5 - F5 -",
    y2: "G5 . F5 . Eb5 . D5 . | Eb5 - C5 - G4 - . .",
    y3: "C5 . Eb5 . G5 . C6 . | D6 - B5 - G5 - D5 -",
    y4: "Ab5 - G5 - F5 - Eb5 - | F5 - Eb5 - D5 - Bb4 -",
    y5: "Eb5 . F5 G5 . Ab5 G5 F5 | G5 - - - B4 - - -",
    y6: "C6 - - - G5 - Eb5 - | C5 - - - . . . .",
    Cm: "C2 C2 C3 C2 G2 C2 Bb2 G2",
    Ab: "Ab1 Ab1 Ab2 Ab1 Eb2 Ab1 G2 Eb2",
    G: "G1 G1 G2 G1 D2 G1 G2 D2",
    Fm: "F1 F1 F2 F1 C2 F1 F2 C2",
    Bb: "Bb1 Bb1 Bb2 Bb1 F2 Bb1 Bb2 F2",
    gallop: "k . k s . k s h",
  },
  sections: {
    intro: { bass: "@Cm @Cm", harmony: "C4+37 -*7 C4+37 -*7", drums: "t . . t . . t . | t . t . s s s s" },
    A: { lead: "@y1 @y2", bass: "@Cm @Ab @G @Cm", drums: "@gallop" },
    A2: { lead: "@y3 @y4", bass: "@Cm @G @Fm @Bb", drums: "@gallop" },
    B: { lead: "@y5 @y6", harmony: "Ab3+47 -*7 G3+47 -*7 C4+37 -*7 C4+37 -*7", bass: "@Ab @G @Cm @Cm", drums: "k . k s . k s h | k . s s k s s s" },
    C: {
      lead: "C5 . C5 . G5 . C5 . | Ab4 . Ab4 . Eb5 . Ab4 . | Bb4 . Bb4 . F5 . Bb4 . | B4 - - - D5 - - -",
      harmony: "C4+37 -*7 Ab3+47 -*7 Bb3+47 -*7 G3+47 -*7",
      bass: "@Cm @Ab @Bb @G",
      drums: "k . h . s . h . | k . h . s . h . | k . h . s . h . | t t t t s s s s",
    },
  },
  order: ["intro", "A", "A2", "B", "A", "C"],
  loopTo: 1,
};

/** A boss is dropping in. */
export const BOSS_WARNING: Jingle = {
  title: "Germ Alert",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.17 } },
  sections: {
    J: {
      lead: "E5 . E6 . E5 . E6 . E5 . E6 . . . . .",
      bass: "E2 - - - - - - - F2 - - - - - - -",
      drums: "t . . . t . . . t . t . s s s s",
    },
  },
  order: ["J"],
};

/** A stage germ identified: you earn its immune skill. */
export const STAGE_CLEARED: Jingle = {
  title: "Germ Identified",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "G4 . B4 . D5 . G5 . | F#5 - D5 - A5 - - - | G5 - - - - - - -",
      harmony: "G3+47 -*7 D4+47 -*7 G3+47 -*7",
      bass: "G2 . G2 . G2 . G2 . | D2 . D2 . D2 . D2 . | G2 - - - - - - -",
      drums: "k . s . k . s . | k . s . k k s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The whole Major Virus rush is cleared: the big final fanfare. */
export const VICTORY: Jingle = {
  title: "Immune System Victory",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 15, rate: 6, delay: 0.25 } }, harmony: { duty: 0.5, volume: 0.08 } },
  sections: {
    J: {
      lead: "C5 . E5 . G5 . C6 . | A5 - F5 - C6 - - - | B5 - G5 - D6 - B5 - | C6 - - - E6 - - - | C6 - - - - - - .",
      harmony: "C4+47 -*7 F4+47 -*7 G4+47 -*7 C4+47 -*7 C4+47 - - - - - - .",
      bass: "C3 . C3 . C3 . C3 . | F2 . F2 . F2 . F2 . | G2 . G2 . G2 . G2 . | C3 . C3 . C3 . C3 . | C2 - - - - - - .",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s s | k . s . k . s . | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of lives: Cyto needs a rest. */
export const GAME_OVER: Jingle = {
  title: "Cyto Needs a Rest",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "G5 - E5 - C5 - - - | D5 - B4 - G4 - - .",
      bass: "C3 - - - A2 - - - | G2 - - - G2 - - .",
    },
  },
  order: ["J"],
};

/** An Antigen Clue answered right: a bright "you got it!" */
export const CLUE_RIGHT: Jingle = {
  title: "Antigen Identified",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "C5 . E5 . G5 . C6 - | B5 . C6 - D6 - . .",
      harmony: "C4+47 -*7 G3+47 -*7",
      bass: "C3 . . . G2 . . . | C3 - - - . . . .",
      drums: "k . h . s . h . | k . . . s . . .",
    },
  },
  order: ["J"],
};

/** A power-up grabbed: a rising arpeggio with a sparkly top. */
export const POWER_UP: Jingle = {
  title: "Immune Boost!",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.2, vibrato: { depth: 12, rate: 7, delay: 0.1 } }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "C5 E5 G5 C6 D5 F#5 A5 D6 | E5 G#5 B5 E6 - - F#6 - | G6 - - - - - . .",
      harmony: "C4+47 -*3 D4+47 -*3 E4+47 -*7 G4+47 -*5 . .",
      bass: "C3 . C3 . D3 . D3 . | E3 . E3 . E3 . E3 . | G2 - - - - - . .",
      drums: "k . h . k . h . | k . s . k s s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** One Major Virus identified (more to come in the rush). */
export const VIRUS_DOWN: Jingle = {
  title: "Virus Spotted",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 } },
  sections: {
    J: {
      lead: "G5 . D6 . B5 . G6 - | - - . . . . . .",
      bass: "G2 . . . D3 . . . | G2 - - - . . . .",
      drums: "k . s . k . s . | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Every song and jingle, for the music checks and the ?debug player. */
export const SONGS: Record<string, Song> = { select: SELECT_SONG, ...ZONE_SONGS, lymph: LYMPH_SONG, boss: BOSS_SONG, rush: RUSH_SONG };
export const JINGLES: Record<string, Jingle> = {
  warning: BOSS_WARNING, stageCleared: STAGE_CLEARED, victory: VICTORY, gameOver: GAME_OVER, clueRight: CLUE_RIGHT, powerUp: POWER_UP, virusDown: VIRUS_DOWN,
};

/** The music for a stage (the Lymph Node has its own run theme). */
export function stageSongFor(id: StageId): Song {
  return id === "rush" ? LYMPH_SONG : ZONE_SONGS[id];
}

/** The fight music: stage germs share the showdown; the Major Viruses get the rush theme. */
export function bossSongFor(id: StageId): Song {
  return id === "rush" ? RUSH_SONG : BOSS_SONG;
}

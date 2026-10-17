/*
 * Robo Masters' soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * The eight stages share one A-minor groove (bass, drums and a bridge) and each gets its own lead
 * lines, key, tempo and pulse colour. Steps are 8th notes; "|" marks the bars.
 */
import type { Jingle, Song, Voice } from "@/kit/audio";
import type { RobotId } from "@/robo/robots";

/** Stage select: a bright C-major "pick your robot" tune. */
export const SELECT_SONG: Song = {
  title: "Pick a Robo Master",
  bpm: 126,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, vibrato: { depth: 10, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.48, gate: 0.7 },
    drums: { volume: 0.4 },
  },
  patterns: {
    q1: "C5 . E5 G5 . E5 C5 E5 | D5 . F5 A5 . F5 D5 .",
    q2: "B4 . D5 G5 . F5 D5 B4 | C5 - E5 - G5 - . .",
    q3: "A4 . C5 E5 . C5 A4 C5 | F5 - E5 - C5 - A4 -",
    q4: "G4 . B4 D5 . G5 F5 D5 | G5 - - - . . . .",
    r1: "A5 - G5 - F5 - C5 - | D5 - E5 - G5 - - -",
    r2: "G5 - E5 - B4 - E5 - | C5 - - - A4 - - -",
    r3: "F5 - A5 - C6 - A5 - | G5 - B5 - D6 - B5 -",
    r4: "C6 - - - G5 - E5 - | C5 - - - . . . .",
    C: "C2 . C3 . G2 . C3 .",
    Dm: "D2 . D3 . A2 . D3 .",
    G: "G2 . G3 . D3 . G3 .",
    Am: "A2 . A3 . E3 . A3 .",
    F: "F2 . F3 . C3 . F3 .",
    Em: "E2 . E3 . B2 . E3 .",
  },
  sections: {
    A: { lead: "@q1 @q2 @q3 @q4", bass: "@C @Dm @G @C @Am @F @G @G", drums: "k . h . s . h h" },
    B: { lead: "@r1 @r2 @r3 @r4", bass: "@F @G @Em @Am @F @G @C @C", drums: "k . h . s . h h | k . h . s h s s" },
  },
  order: ["A", "B"],
};

/** The shared stage groove, written in A minor (each stage transposes it). */
const GROOVE = {
  Am: "A2 A2 A3 A2 . A2 A3 A2",
  F: "F2 F2 F3 F2 . F2 F3 F2",
  G: "G2 G2 G3 G2 . G2 G3 G2",
  E: "E2 E2 E3 E2 . E2 E3 E2",
  Dm: "D2 D2 D3 D2 . D2 D3 D2",
};

interface StageLines {
  /** Five 2-bar lead phrases in A minor: a1 (Am|F), a2 (G|Am), a3 (G|E), b1 (F|G), b2 (Em|Am). */
  a1: string;
  a2: string;
  a3: string;
  b1: string;
  b2: string;
}

/**
 * A stage theme: intro (2 bars) then A (a1 a2), A' (a1 a3), B (b1 b2) and a 4-bar bridge of
 * chord arpeggios, about 30 s before it loops.
 */
function stageSong(title: string, lines: StageLines, o: { transpose: number; bpm: number; beat: string; lead: Voice; harmony?: Voice }): Song {
  return {
    title,
    bpm: o.bpm,
    stepsPerBeat: 2,
    transpose: o.transpose,
    voices: {
      lead: o.lead,
      harmony: o.harmony ?? { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
      bass: { volume: 0.5, gate: 0.8 },
      drums: { volume: 0.45 },
    },
    patterns: { ...GROOVE, ...lines, beat: o.beat },
    sections: {
      intro: { bass: "@Am @Am", harmony: "A3+37 -*7 A3+37 -*7", drums: "k . k . s . s . | k . k . s s s s" },
      A: { lead: "@a1 @a2", bass: "@Am @F @G @Am", drums: "@beat" },
      A2: { lead: "@a1 @a3", bass: "@Am @F @G @E", drums: "@beat" },
      B: { lead: "@b1 @b2", bass: "@F @G @E @Am", drums: "@beat" },
      bridge: {
        harmony: "D4+37 -*7 E4+37 -*7 F4+47 -*7 E4+47 -*7",
        bass: "@Dm @E @F @E",
        drums: "k . h . s . h . | k . h . s . h . | k . h . s . h . | k . s . s s s s",
      },
    },
    order: ["intro", "A", "A2", "B", "bridge"],
    loopTo: 1,
  };
}

const ROCK = "k h s h k k s h";
const STOMP = "k . s . k k s .";
const MACHINE = "k h s h k h s s";

export const STAGE_SONGS: Record<RobotId, Song> = {
  // Pie Factory: bouncy broken chords in C minor.
  splitz: stageSong("Pie Factory", {
    a1: "A4 . C5 . E5 . C5 E5 | F5 . E5 . C5 . A4 .",
    a2: "B4 . D5 . G5 . F5 D5 | E5 - - - C5 - A4 -",
    a3: "B4 . D5 . G5 . F5 D5 | E5 - G#4 - B4 - - -",
    b1: "C5 - F5 - A5 - G5 F5 | D5 - G5 - B5 - A5 G5",
    b2: "G5 - E5 - B4 - E5 - | A5 - - - - - . .",
  }, { transpose: 3, bpm: 140, beat: ROCK, lead: { duty: 0.25, volume: 0.2 } }),
  // Magma Mines: slow, heavy long notes in G minor.
  igneous: stageSong("Magma Mines", {
    a1: "A4 - - - C5 - B4 - | A4 - - - F4 - - -",
    a2: "G4 - - - B4 - D5 - | C5 - B4 - A4 - - -",
    a3: "G4 - - - B4 - D5 - | E5 - - - - - - -",
    b1: "F5 - E5 - C5 - A4 - | D5 - - - G4 - - -",
    b2: "E5 - D5 - B4 - G4 - | A4 - - - - - - -",
  }, { transpose: -2, bpm: 128, beat: STOMP, lead: { duty: 0.5, volume: 0.18, vibrato: { depth: 20, rate: 5, delay: 0.25 } } }),
  // Punctuation Press: typewriter staccato in A minor.
  syntaxor: stageSong("Punctuation Press", {
    a1: "A5 A5 . E5 . A5 . E5 | F5 F5 . C5 . F5 . C5",
    a2: "G5 G5 . D5 . G5 . B4 | C5 . E5 . A5 . . .",
    a3: "G5 G5 . D5 . G5 . B4 | E5 . G#5 . B5 . . .",
    b1: "C5 . . C5 F5 . . A5 | B5 . . G5 D5 . . G5",
    b2: "B4 . . B4 E5 . . G5 | A5 . E5 . A4 . . .",
  }, { transpose: 0, bpm: 144, beat: MACHINE, lead: { duty: 0.125, volume: 0.2, gate: 0.5 } }),
  // Compass Cliffs: wide adventurous leaps in D minor.
  meridian: stageSong("Compass Cliffs", {
    a1: "E4 - A4 - B4 - C5 - | A5 - - - G5 F5 E5 -",
    a2: "D5 - - - B4 G4 D5 - | E5 - - - - - . .",
    a3: "D5 - - - B4 G4 D5 - | G#5 - - - E5 - . .",
    b1: "C5 - F5 - A5 - - - | B5 - G5 - D5 - - -",
    b2: "E5 - G5 - B5 - - - | A5 - - - E5 - . .",
  }, { transpose: 5, bpm: 136, beat: ROCK, lead: { duty: 0.25, volume: 0.2, vibrato: { depth: 12, rate: 6, delay: 0.25 } } }),
  // Thunderhead Tower: stormy rolling 8ths in Bb minor.
  cumulo: stageSong("Thunderhead Tower", {
    a1: "E5 D5 C5 B4 A4 B4 C5 E5 | F5 E5 C5 A4 F4 A4 C5 F5",
    a2: "D5 C5 B4 G4 D5 G5 B5 G5 | A5 - - - E5 - - -",
    a3: "D5 C5 B4 G4 D5 G5 B5 G5 | G#5 - - - E5 - - -",
    b1: "A5 - - - G5 F5 E5 F5 | G5 - - - F5 E5 D5 E5",
    b2: "E5 - - - D5 C5 B4 C5 | A4 - - - - - . .",
  }, { transpose: 1, bpm: 146, beat: MACHINE, lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 25, rate: 7, delay: 0.15 } } }),
  // Number Line Neon: arpeggio chords in the lead, C# minor.
  polarix: stageSong("Number Line Neon", {
    a1: "A4+37 - - - A4+37 - E5 - | F4+47 - - - F4+47 - C5 -",
    a2: "G4+47 - - - G4+47 - D5 - | A4+37 - - - E5 - A5 -",
    a3: "G4+47 - - - G4+47 - D5 - | E4+47 - - - B4 - E5 -",
    b1: "C5 . C5 . F5 . A5 . | D5 . D5 . G5 . B5 .",
    b2: "B4 . E5 . G5 . B5 . | A5 - - - A4 - . .",
  }, { transpose: 4, bpm: 150, beat: ROCK, lead: { duty: 0.125, volume: 0.19 }, harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2, octave: -1 } } }),
  // Greenhouse Grove: gentle, growing quarter notes in E minor.
  chlorophil: stageSong("Greenhouse Grove", {
    a1: "E5 - - - C5 - D5 E5 | F5 - - - C5 - - -",
    a2: "D5 - - - B4 - C5 D5 | E5 - - - A4 - - -",
    a3: "D5 - - - B4 - C5 D5 | B4 - - - G#4 - - -",
    b1: "A4 - C5 - F5 - - - | G5 - - - D5 - - -",
    b2: "B4 - - - E5 - G5 - | A5 - - - - - - -",
  }, { transpose: -5, bpm: 128, beat: STOMP, lead: { duty: 0.5, volume: 0.17, vibrato: { depth: 14, rate: 5, delay: 0.3 } } }),
  // Gearworks Museum: tick-tock clockwork in F# minor.
  clio: stageSong("Gearworks Museum", {
    a1: "A4 E5 A4 E5 C5 E5 A4 E5 | F4 C5 F4 C5 A4 C5 F4 C5",
    a2: "G4 D5 G4 D5 B4 D5 G4 D5 | A4 E5 C5 E5 A5 . . .",
    a3: "G4 D5 G4 D5 B4 D5 G4 D5 | G#4 E5 B4 E5 G#5 . . .",
    b1: "A5 . G5 . F5 . C5 . | B5 . A5 . G5 . D5 .",
    b2: "G5 . E5 . B4 . G4 . | A4 - - - A5 - . .",
  }, { transpose: -3, bpm: 134, beat: MACHINE, lead: { duty: 0.25, volume: 0.19, gate: 0.6 } }),
};

/** Every Robo Master's fight: a tense A-minor duel with a creeping chromatic line. */
export const BOSS_SONG: Song = {
  title: "Robo Master Showdown",
  bpm: 160,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.19, vibrato: { depth: 18, rate: 7, delay: 0.2 } },
    harmony: { duty: 0.5, volume: 0.07, echo: { steps: 2, octave: -1 } },
    bass: { volume: 0.52 },
    drums: { volume: 0.5 },
  },
  patterns: {
    x1: "A5 - - - G#5 - - - | F5 - - - E5 - - -",
    x2: "D5 E5 F5 E5 D5 C5 B4 C5 | A4 - - - E5 - - -",
    x3: "C6 - B5 - A5 - G#5 - | A5 - E5 - C5 - A4 -",
    x4: "D5 - F5 - A5 - C6 - | B5 - - - G#5 - - -",
    A: "A2 A2 A3 A2 A2 A3 A2 A3",
    F: "F2 F2 F3 F2 F2 F3 F2 F3",
    E: "E2 E2 E3 E2 E2 E3 E2 E3",
    D: "D2 D2 D3 D2 D2 D3 D2 D3",
    beat: "kh h sh h kh h sh kh",
  },
  sections: {
    intro: { bass: "@A", drums: "t . t . t t t t" },
    A: { lead: "@x1 @x2", bass: "@A @F @D @E", drums: "@beat" },
    B: { lead: "@x3 @x4", bass: "@F @A @D @E", drums: "@beat" },
    C: {
      lead: "E5 . E5 . F5 . E5 . | E5 . E5 . G5 . F5 . | E5 . E5 . A5 . G5 . | G#5 - - - B5 - - -",
      harmony: "A3+369 -*7 A3+369 -*7 A3+369 -*7 E4+47 -*7",
      bass: "@A @A @A @E",
      drums: "k . s . k k s . | k . s . k k s . | k . s . k k s . | s s s s s s s s",
    },
  },
  order: ["intro", "A", "B", "A", "B", "C"],
  loopTo: 1,
};

/** Lord Static in the Static Citadel: the final fight, a darker D-minor march with organ-like arpeggios. */
export const CITADEL_SONG: Song = {
  title: "Static Citadel",
  bpm: 152,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.18, vibrato: { depth: 22, rate: 6, delay: 0.2 } },
    harmony: { duty: 0.125, volume: 0.07 },
    bass: { volume: 0.52 },
    drums: { volume: 0.5 },
  },
  patterns: {
    y1: "D5 - - - A5 - - - | Bb5 - A5 - G5 - F5 -",
    y2: "E5 - - - G5 - - - | A5 - - - C#5 - - -",
    y3: "F5 - E5 - D5 - A4 - | Bb4 - D5 - G5 - - -",
    y4: "A5 - G5 - F5 - E5 - | C#5 - E5 - A5 - - -",
    y5: "D6 - - - C6 - Bb5 - | C6 - - - G5 - E5 -",
    y6: "F5 - - - E5 - C#5 - | D5 - - - - - . .",
    Dm: "D2 D2 D3 D2 C3 D2 A2 D2",
    Bb: "Bb1 Bb1 Bb2 Bb1 A2 Bb1 F2 Bb1",
    C: "C2 C2 C3 C2 Bb2 C2 G2 C2",
    A: "A1 A1 A2 A1 G2 A1 E2 A1",
    Gm: "G1 G1 G2 G1 F2 G1 D2 G1",
    arpA: "D4+37 -*7 Bb3+47 -*7 C4+47 -*7 A3+47 -*7",
    march: "k . s k k . s s",
  },
  sections: {
    intro: { bass: "@Dm @Dm", harmony: "D4+37 -*7 D4+37 -*7", drums: "k . . . k . . . | k . k . s s s s" },
    A: { lead: "@y1 @y2", harmony: "@arpA", bass: "@Dm @Bb @C @A", drums: "@march" },
    A2: { lead: "@y3 @y4", harmony: "D4+37 -*7 G3+37 -*7 A3+47 -*7 A3+47 -*7", bass: "@Dm @Gm @A @A", drums: "@march" },
    B: { lead: "@y5 @y6", harmony: "Bb3+47 -*7 C4+47 -*7 D4+37 -*7 D4+37 -*7", bass: "@Bb @C @Dm @Dm", drums: "k . s k k . s s | k . s k s s s s" },
    C: {
      harmony: "@arpA",
      bass: "@Dm @Bb @C @A",
      drums: "k . h . s . h . | k . h . s . h . | k . h . s . h . | t t t t s s s s",
    },
  },
  order: ["intro", "A", "A2", "B", "A", "C"],
  loopTo: 1,
};

export const BOSS_WARNING: Jingle = {
  title: "Warning",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.17 } },
  sections: {
    J: {
      lead: "A4 . A5 . A4 . A5 . A4 . A5 . . . . .",
      bass: "A2 - - - - - - - G#2 - - - - - - -",
      drums: "t . . . t . . . t . t . s s s s",
    },
  },
  order: ["J"],
};

export const POWER_EARNED: Jingle = {
  title: "Power Earned",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "C5 . E5 . G5 . C6 . | B5 - G5 - D6 - - - | C6 - - - - - - -",
      harmony: "C4+47 -*7 G3+47 -*7 C4+47 -*7",
      bass: "C3 . C3 . C3 . C3 . | G2 . G2 . G2 . G2 . | C3 - - - - - - -",
      drums: "k . s . k . s . | k . s . k k s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const CITADEL_CLEARED: Jingle = {
  title: "Citadel Cleared",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 15, rate: 6, delay: 0.25 } }, harmony: { duty: 0.5, volume: 0.08 } },
  sections: {
    J: {
      lead: "G4 . C5 . E5 . G5 . | A5 - F5 - C6 - - - | B5 - G5 - D6 - B5 - | C6 - - - - - - - | E6 - - - - - - .",
      harmony: "C4+47 -*7 F4+47 -*7 G4+47 -*7 C4+47 -*7 C4+47 - - - - - - .",
      bass: "C3 . C3 . C3 . C3 . | F2 . F2 . F2 . F2 . | G2 . G2 . G2 . G2 . | C3 . C3 . C3 . C3 . | C2 - - - - - - .",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s s | k . s . k . s . | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const RECHARGE: Jingle = {
  title: "Rivet Recharges",
  bpm: 108,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "E5 - C5 - A4 - - - | B4 - G#4 - E4 - - .",
      bass: "A2 - - - F2 - - - | E2 - - - E2 - - .",
    },
  },
  order: ["J"],
};

/** A Quiz Bot answered right: a quick bright "ding-ding-ding!" */
export const QUIZ_RIGHT: Jingle = {
  title: "Quiz Bot Rebooted",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "E5 . G5 . C6 . E6 - | D6 . E6 - - - . .",
      harmony: "C4+47 -*7 G3+47 -*7",
      bass: "C3 . . . G2 . . . | C3 - - - . . . .",
      drums: "k . h . s . h . | k . . . s . . .",
    },
  },
  order: ["J"],
};

/** A power-up grabbed: a rising arpeggio with a sparkly top. */
export const POWER_UP: Jingle = {
  title: "Power-Up!",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.2, vibrato: { depth: 12, rate: 7, delay: 0.1 } }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "G4 B4 D5 G5 A4 C#5 E5 A5 | B4 D#5 F#5 B5 - - D6 - | E6 - - - - - . .",
      harmony: "G3+47 -*3 A3+47 -*3 B3+47 -*7 E4+47 -*5 . .",
      bass: "G2 . G2 . A2 . A2 . | B2 . B2 . B2 . B2 . | E3 - - - - - . .",
      drums: "k . h . k . h . | k . s . k s s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { select: SELECT_SONG, ...STAGE_SONGS, boss: BOSS_SONG, citadel: CITADEL_SONG };
export const JINGLES: Record<string, Jingle> = { warning: BOSS_WARNING, powerEarned: POWER_EARNED, citadelCleared: CITADEL_CLEARED, recharge: RECHARGE, quizRight: QUIZ_RIGHT, powerUp: POWER_UP };

/** Lord Static's own fight: the showdown a fourth higher, faster and thinner-edged. */
export const LORD_STATIC_SONG: Song = {
  ...BOSS_SONG,
  title: "Lord Static",
  bpm: 170,
  transpose: 5,
  voices: { ...BOSS_SONG.voices, lead: { duty: 0.125, volume: 0.2, vibrato: { depth: 24, rate: 8, delay: 0.15 } } },
};

SONGS.lordStatic = LORD_STATIC_SONG;

/** The music for a stage (the Static Citadel has the final theme). */
export function stageSongFor(id: RobotId | "fortress"): Song {
  return id === "fortress" ? CITADEL_SONG : STAGE_SONGS[id];
}

/** The fight music for a stage's boss. */
export function bossSongFor(id: RobotId | "fortress"): Song {
  return id === "fortress" ? LORD_STATIC_SONG : BOSS_SONG;
}

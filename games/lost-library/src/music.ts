/*
 * Quest of the Lost Library's soundtrack: original 4-channel chiptunes for the kit's ChipAudio
 * (see src/kit/README.md). Steps are 8th notes; "|" marks the bars.
 */
import type { Jingle, Song } from "@/kit/audio";
import type { QuestDef } from "@/library/quest";

/** Bramblebury Square: a cozy F-major waltz (3/4, so 6 steps a bar). */
export const TOWN_SONG: Song = {
  title: "Bramblebury Square",
  bpm: 108,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.15, vibrato: { depth: 14, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06, gate: 0.5 },
    bass: { volume: 0.45, gate: 0.6 },
    drums: { volume: 0.25 },
  },
  patterns: {
    t1: "A4 - - - C5 - | E5 - D5 - C5 -",
    t2: "D5 - - - F5 - | C5 - - - - -",
    t3: "F5 - - - A5 - | G5 - F5 - D5 -",
    t4: "E5 - F5 - G5 - | E5 - - - . .",
    u1: "F5 - - - D5 - | E5 - - - C5 -",
    u2: "C5 - - - A4 - | D5 - - - F5 -",
    u3: "Bb4 - - - D5 - | C5 - E5 - G5 -",
    u4: "F5 - - - - - | . . . . . .",
    // Oom-pah-pah: bass on beat 1, soft chord arpeggios on beats 2 and 3.
    F: "F2 - . . . .", C: "C3 - . . . .", Bb: "Bb2 - . . . .", Dm: "D3 - . . . .", Am: "A2 - . . . .", Gm: "G2 - . . . .",
    hF: ". . F4+47 . F4+47 .", hC: ". . C4+47 . C4+47 .", hBb: ". . Bb3+47 . Bb3+47 .", hDm: ". . D4+37 . D4+37 .",
    hAm: ". . A3+37 . A3+37 .", hGm: ". . G3+37 . G3+37 .",
    waltz: "k . h . h .",
  },
  sections: {
    intro: { harmony: "@hF @hF", bass: "@F @F", drums: "@waltz" },
    A: {
      lead: "@t1 @t2 @t3 @t4",
      harmony: "@hF @hC @hBb @hF @hDm @hBb @hC @hC",
      bass: "@F @C @Bb @F @Dm @Bb @C @C",
      drums: "@waltz",
    },
    B: {
      lead: "@u1 @u2 @u3 @u4",
      harmony: "@hBb @hC @hAm @hDm @hGm @hC @hF @hF",
      bass: "@Bb @C @Am @Dm @Gm @C @F @F",
      drums: "@waltz",
    },
    A2: {
      lead: "@t1 @t2 @t3 @t4",
      harmony: "C5 -*5 C5 -*5 D5 -*5 C5 -*5 A4 -*5 Bb4 -*5 G4 -*5 E4 -*5",
      bass: "@F @C @Bb @F @Dm @Bb @C @C",
      drums: "@waltz",
    },
  },
  order: ["intro", "A", "B", "A2", "B"],
  loopTo: 1,
};

/** The library wings: hushed and curious (D dorian, minor-7th arpeggios), never scary. */
export const WING_SONG: Song = {
  title: "Hushed Stacks",
  bpm: 96,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.15, vibrato: { depth: 12, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.05 },
    bass: { volume: 0.42 },
    drums: { volume: 0.22 },
  },
  patterns: {
    m1: "A4 - - - D5 - E5 - | G5 - - - E5 - - -",
    m2: "F5 - - - D5 - - - | E5 - - - . . . .",
    m3: "A5 - - - G5 - F5 - | E5 - - - C5 - - -",
    m4: "D5 - - - F5 - - - | E5 - - - C#5 - - -",
    n1: "G4 - Bb4 - D5 - - - | F5 - - - A4 - - -",
    n2: "G4 - Bb4 - D5 - G5 - | E5 - - - C#5 - - -",
    n3: "D5 - - - F5 - Bb5 - | A5 - - - F5 - - -",
    n4: "G5 - F5 - D5 - Bb4 - | A4 - - - - - . .",
    Dm: "D2 - - - A2 - - -", C: "C2 - - - G2 - - -", Bb: "Bb1 - - - F2 - - -", A: "A1 - - - E2 - - -",
    Gm: "G1 - - - D2 - - -", F: "F2 - - - C3 - - -",
    hush: "k . h . . . h .",
  },
  sections: {
    A: {
      lead: "@m1 @m2 @m3 @m4",
      harmony: "D4+37a -*7 C4+47 -*7 Bb3+47b -*7 C4+47 -*7 D4+37a -*7 C4+47 -*7 Bb3+47 -*7 A3+47 -*7",
      bass: "@Dm @C @Bb @C @Dm @C @Bb @A",
      drums: "@hush",
    },
    B: {
      lead: "@n1 @n2 @n3 @n4",
      harmony: "G3+37 -*7 D4+37 -*7 G3+37 -*7 A3+47 -*7 Bb3+47 -*7 F3+47 -*7 G3+37 -*7 A3+47 -*7",
      bass: "@Gm @Dm @Gm @A @Bb @F @Gm @A",
      drums: "@hush",
    },
  },
  order: ["A", "B"],
};

/** Each wing gets its own key, tempo and pulse colour of the same hushed tune. */
export const WING_SONGS: Record<"math" | "science" | "story" | "history", Song> = {
  math: { ...WING_SONG, title: "Hushed Stacks: Math Wing" },
  science: {
    ...WING_SONG,
    title: "Hushed Stacks: Science Wing",
    transpose: 2,
    bpm: 100,
    voices: { ...WING_SONG.voices, lead: { duty: 0.125, volume: 0.15, vibrato: { depth: 18, rate: 6, delay: 0.25 } } },
  },
  story: {
    ...WING_SONG,
    title: "Hushed Stacks: Story Wing",
    transpose: -2,
    bpm: 92,
    voices: { ...WING_SONG.voices, lead: { duty: 0.5, volume: 0.14, vibrato: { depth: 16, rate: 4, delay: 0.3 } }, harmony: { duty: 0.25, volume: 0.05 } },
  },
  history: {
    ...WING_SONG,
    title: "Hushed Stacks: History Wing",
    transpose: 5,
    bpm: 98,
    voices: { ...WING_SONG.voices, lead: { duty: 0.25, volume: 0.15, octave: -1, vibrato: { depth: 10, rate: 5, delay: 0.3 } } },
  },
};

/** Talking to a guardian: a playful riddle in A minor with a bit of tension. */
export const GUARDIAN_SONG: Song = {
  title: "Guardian's Riddle",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.16, gate: 0.7 },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 2, octave: -1 } },
    bass: { volume: 0.45, gate: 0.6 },
    drums: { volume: 0.3 },
  },
  patterns: {
    g1: "C5 . B4 . A4 . E5 . | D5 . C5 . B4 . G#4 .",
    g2: "C5 . E5 . A5 . G#5 . | B5 - - - . . . .",
    g3: "A5 . G5 . F5 . C5 . | B4 . D5 . G5 . F5 .",
    g4: "E5 . C5 . A4 . C5 . | B4 - - - E4 - - -",
    g5: "F5 - - - A5 - - - | E5 - - - C5 - - -",
    g6: "D5 - F5 - A5 - - - | G#5 - - - E5 - - -",
    g7: "F5 - E5 - D5 - F5 - | E5 - C5 - A4 - C5 -",
    g8: "D5 - - - C5 - - - | B4 - - - G#4 - - -",
    Am: "A2 . E2 . A2 . E2 .", E: "E2 . B1 . E2 . B1 .", F: "F2 . C2 . F2 . C2 .", G: "G2 . D2 . G2 . D2 .", Dm: "D2 . A1 . D2 . A1 .",
  },
  sections: {
    A: { lead: "@g1 @g2 @g3 @g4", bass: "@Am @E @Am @E @F @G @Am @E", drums: "k . h . s . h ." },
    B: { lead: "@g5 @g6 @g7 @g8", bass: "@Dm @Am @Dm @E @Dm @Am @F @E", drums: "k . h . s . h . | k . h . s . h h" },
  },
  order: ["A", "B"],
};

/** The Reading Room: the warm, triumphant finale in C major. */
export const READING_ROOM_SONG: Song = {
  title: "The Reading Room",
  bpm: 112,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 14, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.5, volume: 0.06 },
    bass: { volume: 0.46 },
    drums: { volume: 0.35 },
  },
  patterns: {
    f1: "E5 - - - G5 - C6 - | B5 - - - G5 - D5 -",
    f2: "A5 - - - E5 - C5 - | F5 - - - - - . .",
    f3: "E5 - - - G5 - C6 - | D6 - - - B5 - G5 -",
    f4: "A5 - - - C6 - A5 - | G5 - - - - - . .",
    f5: "C6 - A5 - F5 - A5 - | B5 - G5 - D5 - G5 -",
    f6: "G5 - E5 - B4 - E5 - | A5 - E5 - C5 - E5 -",
    f7: "F5 - - - A5 - C6 - | D6 - - - B5 - - -",
    f8: "C6 - - - - - - - | . . . . . . . .",
    C: "C2 . C3 . G2 . C3 .", G: "G2 . G3 . D3 . G3 .", Am: "A2 . A3 . E3 . A3 .", F: "F2 . F3 . C3 . F3 .", Em: "E2 . E3 . B2 . E3 .",
  },
  sections: {
    A: {
      lead: "@f1 @f2 @f3 @f4",
      harmony: "C4+47 -*7 G3+47 -*7 A3+37 -*7 F3+47 -*7 C4+47 -*7 G3+47 -*7 F3+47 -*7 G3+47 -*7",
      bass: "@C @G @Am @F @C @G @F @G",
      drums: "k . h . s . h .",
    },
    B: {
      lead: "@f5 @f6 @f7 @f8",
      harmony: "F3+47 -*7 G3+47 -*7 E3+37 -*7 A3+37 -*7 F3+47 -*7 G3+47 -*7 C4+47 -*7 C4+47 -*7",
      bass: "@F @G @Em @Am @F @G @C @C",
      drums: "k . h . s . h . | k . h . s . s s",
    },
  },
  order: ["A", "B"],
};

export const BOOK_FOUND: Jingle = {
  title: "Book Found",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.18 }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "C5 E5 G5 C6 E6 - - - - - - - . . . .",
      harmony: "C4+47 - - - - - - - - - - - . . . .",
      bass: "C3 - - - - - - - G2 - - - . . . .",
    },
  },
  order: ["J"],
};

export const WING_RESTORED: Jingle = {
  title: "Wing Restored",
  bpm: 120,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "G4 . C5 . E5 . G5 . | F5 - A5 - C6 - - - | B5 - G5 - D6 - - - | C6 - - - - - - .",
      harmony: "C4+47 -*7 F4+47 -*7 G4+47 -*7 C4+47 - - - - - - .",
      bass: "C3 . . . C3 . . . | F2 . . . F2 . . . | G2 . . . G2 . . . | C3 - - - - - - .",
      drums: "k . . . s . . . | k . . . s . . . | k . . . s . s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const FAINT: Jingle = {
  title: "A Little Rest",
  bpm: 100,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.5, volume: 0.15 } },
  sections: { J: { lead: "C5 - A4 - F4 - - - | G4 - - - F4 - - .", bass: "F2 - - - D2 - - - | C2 - - - F2 - - ." } },
  order: ["J"],
};

/* ----------------------------------------------------------- Quest 2: The Sunken Lighthouse */

/** Saltwhistle Cove: a rolling 6/8 tune in G major, like waves on the sand (6 steps a bar). */
export const SEA_HUB_SONG: Song = {
  title: "Saltwhistle Shanty",
  bpm: 76,
  stepsPerBeat: 3,
  voices: {
    lead: { duty: 0.5, volume: 0.15, vibrato: { depth: 12, rate: 5, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.06, gate: 0.6 },
    bass: { volume: 0.44, gate: 0.7 },
    drums: { volume: 0.22 },
  },
  patterns: {
    a1: "D5 - B4 G4 - B4", a2: "D5 - - E5 - D5", a3: "E5 - C5 G4 - C5", a4: "A4 - - - . F#4",
    a5: "G4 - B4 D5 - G5", a6: "E5 - D5 B4 - G4", a7: "A4 - C5 B4 - A4", a8: "G4 - - - . .",
    b1: "G5 - E5 C5 - E5", b2: "D5 - B4 G4 - B4", b3: "C5 - A4 E5 - C5", b4: "D5 - - F#5 - -",
    b5: "E5 - G5 E5 - C5", b6: "D5 - B4 D5 - G5", b7: "F#5 - E5 D5 - A4", b8: "G4 - - - . .",
    G: "G2 - . D3 - .", C: "C3 - . G2 - .", D: "D3 - . A2 - .", Em: "E2 - . B2 - .", Am: "A2 - . E3 - .",
    hG: "G3+47 - - - - -", hC: "C4+47 - - - - -", hD: "D4+47 - - - - -", hEm: "E3+37 - - - - -", hAm: "A3+37 - - - - -",
    roll: "k . h s . h",
  },
  sections: {
    A: {
      lead: "@a1 @a2 @a3 @a4 @a5 @a6 @a7 @a8",
      harmony: "@hG @hG @hC @hD @hG @hEm @hC @hG",
      bass: "@G @G @C @D @G @Em @C @G",
      drums: "@roll",
    },
    B: {
      lead: "@b1 @b2 @b3 @b4 @b5 @b6 @b7 @b8",
      harmony: "@hC @hG @hAm @hD @hC @hG @hD @hG",
      bass: "@C @G @Am @D @C @G @D @G",
      drums: "@roll",
    },
  },
  order: ["A", "B", "A", "B"],
};

/** The sunken halls: drifting and curious in D minor, never scary. */
export const SEA_WING_SONG: Song = {
  title: "Under the Waves",
  bpm: 92,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.14, vibrato: { depth: 16, rate: 4, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.05 },
    bass: { volume: 0.42 },
    drums: { volume: 0.18 },
  },
  patterns: {
    p1: "D5 - F5 - A5 - - -", p2: "G5 - F5 - E5 - D5 -", p3: "F5 - - - D5 - Bb4 -", p4: "C5 - E5 - G5 - - -",
    p5: "A5 - G5 - F5 - A5 -", p6: "D6 - - - A5 - - -", p7: "Bb5 - A5 - G5 - F5 -", p8: "E5 - - - C#5 - . .",
    q1: "D5 - - F5 - - Bb5 -", q2: "G5 - - E5 - - C5 -", q3: "F5 - E5 - D5 - A4 -", q4: "D5 - - - - - . .",
    q5: "G4 - Bb4 - D5 - G5 -", q6: "E5 - - - C5 - E5 -", q7: "F5 - A5 - C6 - A5 -", q8: "A5 - - - C#5 - - -",
    Dm: "D2 - - - A2 - - -", Bb: "Bb1 - - - F2 - - -", C: "C2 - - - G2 - - -", Gm: "G1 - - - D2 - - -", A: "A1 - - - E2 - - -", F: "F2 - - - C3 - - -",
    drift: "k . . h . . h .",
  },
  sections: {
    A: {
      lead: "@p1 @p2 @p3 @p4 @p5 @p6 @p7 @p8",
      harmony: "D4+37 -*7 D4+37 -*7 Bb3+47 -*7 C4+47 -*7 D4+37 -*7 D4+37 -*7 G3+37 -*7 A3+47 -*7",
      bass: "@Dm @Dm @Bb @C @Dm @Dm @Gm @A",
      drums: "@drift",
    },
    B: {
      lead: "@q1 @q2 @q3 @q4 @q5 @q6 @q7 @q8",
      harmony: "Bb3+47 -*7 C4+47 -*7 D4+37 -*7 D4+37 -*7 G3+37 -*7 C4+47 -*7 F3+47 -*7 A3+47 -*7",
      bass: "@Bb @C @Dm @Dm @Gm @C @F @A",
      drums: "@drift",
    },
  },
  order: ["A", "B"],
};

export const SEA_SONGS: Record<string, Song> = {
  seaHub: SEA_HUB_SONG,
  seaCoral: { ...SEA_WING_SONG, title: "Under the Waves: Coral Gardens" },
  seaTide: {
    ...SEA_WING_SONG,
    title: "Under the Waves: Tide Halls",
    transpose: 2,
    bpm: 96,
    voices: { ...SEA_WING_SONG.voices, lead: { duty: 0.5, volume: 0.14, vibrato: { depth: 12, rate: 5, delay: 0.25 } } },
  },
  seaWreck: {
    ...SEA_WING_SONG,
    title: "Under the Waves: Shipwreck Archive",
    transpose: -2,
    bpm: 88,
    voices: { ...SEA_WING_SONG.voices, lead: { duty: 0.125, volume: 0.15, vibrato: { depth: 18, rate: 3.5, delay: 0.35 } }, harmony: { duty: 0.25, volume: 0.05 } },
  },
  seaLamp: {
    ...SEA_HUB_SONG,
    title: "Saltwhistle Shanty: The Lamp Shines",
    transpose: 2,
    bpm: 84,
    voices: { ...SEA_HUB_SONG.voices, lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 14, rate: 5.5, delay: 0.3 } }, drums: { volume: 0.32 } },
  },
};

/* ----------------------------------------------------------- Quest 3: The Clockwork Castle */

/** Tickhollow Courtyard: a bouncy wind-up march in C major, staccato like ticking gears. */
export const CLOCK_HUB_SONG: Song = {
  title: "Tickhollow March",
  bpm: 112,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.15, gate: 0.6 },
    harmony: { duty: 0.125, volume: 0.06, gate: 0.4 },
    bass: { volume: 0.44, gate: 0.5 },
    drums: { volume: 0.26 },
  },
  patterns: {
    a1: "C5 . E5 . G5 . E5 .", a2: "D5 . G5 . B4 - - .", a3: "C5 . A4 . E5 . C5 .", a4: "F5 - - . A5 - - .",
    a5: "G5 . E5 . C5 . E5 .", a6: "D5 . B4 . G4 . B4 .", a7: "A4 . C5 . F5 . E5 .", a8: "C5 - - - . . . .",
    b1: "E5 . . E5 D5 . C5 .", b2: "A4 . C5 . F5 - - .", b3: "G5 . . G5 F5 . D5 .", b4: "E5 - - . G5 - - .",
    b5: "F5 . A5 . F5 . D5 .", b6: "B4 . D5 . G5 - - .", b7: "E5 . G5 . C6 . G5 .", b8: "D5 - - - B4 . . .",
    C: "C3 . G2 . C3 . G2 .", G: "G2 . D3 . G2 . D3 .", Am: "A2 . E2 . A2 . E2 .", F: "F2 . C3 . F2 . C3 .", Dm: "D3 . A2 . D3 . A2 .",
    march: "k h s h k h s h",
  },
  sections: {
    A: {
      lead: "@a1 @a2 @a3 @a4 @a5 @a6 @a7 @a8",
      harmony: "C4+47 . C4+47 . -*4 G3+47 . G3+47 . -*4 A3+37 . A3+37 . -*4 F3+47 . F3+47 . -*4 C4+47 . C4+47 . -*4 G3+47 . G3+47 . -*4 F3+47 . F3+47 . -*4 C4+47 . C4+47 . -*4",
      bass: "@C @G @Am @F @C @G @F @C",
      drums: "@march",
    },
    B: {
      lead: "@b1 @b2 @b3 @b4 @b5 @b6 @b7 @b8",
      harmony: "A3+37 -*7 F3+47 -*7 G3+47 -*7 C4+47 -*7 D4+37 -*7 G3+47 -*7 C4+47 -*7 G3+47 -*7",
      bass: "@Am @F @G @C @Dm @G @C @G",
      drums: "@march",
    },
  },
  order: ["A", "B"],
};

/** The castle wings: a curious tick-tock tune in A minor (hats tick on every step). */
export const CLOCK_WING_SONG: Song = {
  title: "Gears and Springs",
  bpm: 104,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.14, gate: 0.7, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.05 },
    bass: { volume: 0.4, gate: 0.6 },
    drums: { volume: 0.2 },
  },
  patterns: {
    p1: "A4 . C5 . E5 . A5 .", p2: "G5 . E5 . C5 . E5 .", p3: "F5 . A5 . C6 - - .", p4: "B5 . G5 . D5 - - .",
    p5: "E5 . A5 . E5 . C5 .", p6: "B4 . C5 . D5 . E5 .", p7: "G#4 . B4 . E5 - - .", p8: "D5 - - - B4 . . .",
    q1: "D5 . F5 . A5 . F5 .", q2: "G5 . B5 . D6 - - .", q3: "C6 . G5 . E5 . C5 .", q4: "A4 - - . E5 - - .",
    q5: "F5 . D5 . A4 . D5 .", q6: "E5 . G#5 . B5 - - .", q7: "A5 . E5 . C5 . E5 .", q8: "A4 - - - . . . .",
    Am: "A2 . A2 . E2 . E2 .", F: "F2 . F2 . C3 . C3 .", G: "G2 . G2 . D3 . D3 .", E: "E2 . E2 . B2 . B2 .", Dm: "D3 . D3 . A2 . A2 .", C: "C3 . C3 . G2 . G2 .",
    tick: "k h h h s h h h",
  },
  sections: {
    A: {
      lead: "@p1 @p2 @p3 @p4 @p5 @p6 @p7 @p8",
      harmony: "A3+37 -*7 A3+37 -*7 F3+47 -*7 G3+47 -*7 A3+37 -*7 A3+37 -*7 E3+47 -*7 E3+47 -*7",
      bass: "@Am @Am @F @G @Am @Am @E @E",
      drums: "@tick",
    },
    B: {
      lead: "@q1 @q2 @q3 @q4 @q5 @q6 @q7 @q8",
      harmony: "D4+37 -*7 G3+47 -*7 C4+47 -*7 A3+37 -*7 D4+37 -*7 E3+47 -*7 A3+37 -*7 A3+37 -*7",
      bass: "@Dm @G @C @Am @Dm @E @Am @Am",
      drums: "@tick",
    },
  },
  order: ["A", "B"],
};

export const CLOCK_SONGS: Record<string, Song> = {
  clockHub: CLOCK_HUB_SONG,
  clockGears: { ...CLOCK_WING_SONG, title: "Gears and Springs: Gear Works" },
  clockPend: {
    ...CLOCK_WING_SONG,
    title: "Gears and Springs: Pendulum Hall",
    transpose: -3,
    bpm: 96,
    voices: { ...CLOCK_WING_SONG.voices, lead: { duty: 0.5, volume: 0.14, gate: 0.85, vibrato: { depth: 14, rate: 4, delay: 0.3 } } },
  },
  clockToys: {
    ...CLOCK_WING_SONG,
    title: "Gears and Springs: Toy Workshop",
    transpose: 2,
    bpm: 112,
    voices: { ...CLOCK_WING_SONG.voices, lead: { duty: 0.125, volume: 0.15, gate: 0.55 } },
  },
  clockTower: {
    ...CLOCK_HUB_SONG,
    title: "Tickhollow March: The Great Clock",
    transpose: 5,
    bpm: 120,
    voices: { ...CLOCK_HUB_SONG.voices, lead: { duty: 0.5, volume: 0.16, gate: 0.75, vibrato: { depth: 12, rate: 5, delay: 0.3 } }, drums: { volume: 0.34 } },
  },
};

/* ------------------------------------------------------ Quest 4: The Volcano Observatory */

/** Ashfall Trail: a steady, hopeful climb in D (mixolydian, with a bright C chord). */
export const VOLC_HUB_SONG: Song = {
  title: "Emberpeak Trail",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.15, vibrato: { depth: 12, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06 },
    bass: { volume: 0.45, gate: 0.7 },
    drums: { volume: 0.26 },
  },
  patterns: {
    a1: "D5 - F#5 - A5 - - .", a2: "G5 - E5 - C5 - - .", a3: "D5 - G5 - B5 - A5 -", a4: "F#5 - - - D5 - . .",
    a5: "A5 - F#5 - D5 - F#5 -", a6: "E5 - C5 - G4 - C5 -", a7: "B4 - D5 - G5 - F#5 -", a8: "E5 - - - . . . .",
    b1: "B5 - - - G5 - D5 -", b2: "C#6 - - - A5 - E5 -", b3: "D6 - - - A5 - F#5 -", b4: "F#5 - - - D5 - B4 -",
    b5: "G5 - B5 - G5 - D5 -", b6: "A5 - C#6 - A5 - E5 -", b7: "F#5 - A5 - D6 - C#6 -", b8: "D6 - - - - - . .",
    D: "D2 - D3 - A2 - D3 -", C: "C2 - C3 - G2 - C3 -", G: "G1 - G2 - D2 - G2 -", A: "A1 - A2 - E2 - A2 -", Bm: "B1 - B2 - F#2 - B2 -",
    climb: "k . h . s . h k",
  },
  sections: {
    A: {
      lead: "@a1 @a2 @a3 @a4 @a5 @a6 @a7 @a8",
      harmony: "D4+47 -*7 C4+47 -*7 G3+47 -*7 D4+47 -*7 D4+47 -*7 C4+47 -*7 G3+47 -*7 A3+47 -*7",
      bass: "@D @C @G @D @D @C @G @A",
      drums: "@climb",
    },
    B: {
      lead: "@b1 @b2 @b3 @b4 @b5 @b6 @b7 @b8",
      harmony: "G3+47 -*7 A3+47 -*7 D4+47 -*7 B3+37 -*7 G3+47 -*7 A3+47 -*7 D4+47 -*7 D4+47 -*7",
      bass: "@G @A @D @Bm @G @A @D @D",
      drums: "@climb",
    },
  },
  order: ["A", "B"],
};

/** Inside the mountain: low and rumbly in B minor, but warm. */
export const VOLC_WING_SONG: Song = {
  title: "Rumbling Deep",
  bpm: 88,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.14, vibrato: { depth: 14, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.05 },
    bass: { volume: 0.46 },
    drums: { volume: 0.22 },
  },
  patterns: {
    p1: "B4 - - D5 - - F#5 -", p2: "E5 - D5 - C#5 - B4 -", p3: "D5 - - B4 - - G4 -", p4: "A4 - C#5 - E5 - - -",
    p5: "F#5 - - - B5 - - -", p6: "A5 - G5 - F#5 - D5 -", p7: "G5 - - E5 - - B4 -", p8: "A#4 - - - C#5 - - -",
    q1: "G5 - - - D5 - B4 -", q2: "A4 - C#5 - E5 - A5 -", q3: "F#5 - - - D5 - B4 -", q4: "B4 - - - - - . .",
    q5: "E5 - G5 - B5 - - -", q6: "A#5 - - - F#5 - - -", q7: "D5 - F#5 - B5 - A5 -", q8: "B5 - - - - - . .",
    Bm: "B1 - - - F#2 - - -", G: "G1 - - - D2 - - -", A: "A1 - - - E2 - - -", Em: "E2 - - - B1 - - -", Fs: "F#2 - - - C#2 - - -",
    rumble: "k . . . k . h .",
  },
  sections: {
    A: {
      lead: "@p1 @p2 @p3 @p4 @p5 @p6 @p7 @p8",
      harmony: "B3+37 -*7 B3+37 -*7 G3+47 -*7 A3+47 -*7 B3+37 -*7 B3+37 -*7 E3+37 -*7 F#3+47 -*7",
      bass: "@Bm @Bm @G @A @Bm @Bm @Em @Fs",
      drums: "@rumble",
    },
    B: {
      lead: "@q1 @q2 @q3 @q4 @q5 @q6 @q7 @q8",
      harmony: "G3+47 -*7 A3+47 -*7 B3+37 -*7 B3+37 -*7 E3+37 -*7 F#3+47 -*7 B3+37 -*7 B3+37 -*7",
      bass: "@G @A @Bm @Bm @Em @Fs @Bm @Bm",
      drums: "@rumble",
    },
  },
  order: ["A", "B"],
};

export const VOLC_SONGS: Record<string, Song> = {
  volcHub: VOLC_HUB_SONG,
  volcMagma: { ...VOLC_WING_SONG, title: "Rumbling Deep: Magma Labs" },
  volcSteam: {
    ...VOLC_WING_SONG,
    title: "Rumbling Deep: Steam Tunnels",
    transpose: 3,
    bpm: 92,
    voices: { ...VOLC_WING_SONG.voices, lead: { duty: 0.125, volume: 0.15, gate: 0.8, vibrato: { depth: 10, rate: 6, delay: 0.2 } } },
  },
  volcStars: {
    ...VOLC_WING_SONG,
    title: "Rumbling Deep: Star Dome",
    transpose: -2,
    bpm: 84,
    voices: { ...VOLC_WING_SONG.voices, lead: { duty: 0.5, volume: 0.13, vibrato: { depth: 18, rate: 3.5, delay: 0.4 } }, harmony: { duty: 0.25, volume: 0.05 } },
  },
  volcScope: {
    ...VOLC_HUB_SONG,
    title: "Emberpeak Trail: The Great Telescope",
    transpose: -2,
    bpm: 108,
    voices: { ...VOLC_HUB_SONG.voices, lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 14, rate: 5.5, delay: 0.3 } }, drums: { volume: 0.34 } },
  },
};

/* ---------------------------------------------------------- Quest 5: The Haunted Museum */

/** Mossbrook Museum Plaza: a sunny, bouncy stroll in F major. */
export const MUSE_HUB_SONG: Song = {
  title: "Mossbrook Stroll",
  bpm: 116,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.15, gate: 0.75, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06, gate: 0.5 },
    bass: { volume: 0.44, gate: 0.55 },
    drums: { volume: 0.24 },
  },
  patterns: {
    a1: "F5 . A5 . C6 - A5 .", a2: "D5 . F5 . A5 - F5 .", a3: "G5 . Bb5 . D6 - Bb5 .", a4: "C6 - - . E5 - G5 .",
    a5: "A5 . F5 . C5 . F5 .", a6: "A5 . D5 . F5 . A5 .", a7: "Bb5 - - . G5 - E5 .", a8: "F5 - - - . . . .",
    b1: "D5 - F5 - Bb5 - - .", b2: "C5 - E5 - G5 - - .", b3: "A4 . C5 . E5 . A5 .", b4: "F5 - - . D5 - - .",
    b5: "Bb4 . D5 . G5 . Bb5 .", b6: "C6 . G5 . E5 . C5 .", b7: "A5 . C6 . A5 . F5 .", b8: "F5 - - - . . . .",
    F: "F2 . C3 . F2 . C3 .", Dm: "D2 . A2 . D2 . A2 .", Gm: "G2 . D3 . G2 . D3 .", C: "C2 . G2 . C2 . G2 .", Bb: "Bb1 . F2 . Bb1 . F2 .", Am: "A1 . E2 . A1 . E2 .",
    stroll: "k . h . s . h h",
  },
  sections: {
    A: {
      lead: "@a1 @a2 @a3 @a4 @a5 @a6 @a7 @a8",
      harmony: "F3+47 -*7 D4+37 -*7 G3+37 -*7 C4+47 -*7 F3+47 -*7 D4+37 -*7 Bb3+47 -*7 F3+47 -*7",
      bass: "@F @Dm @Gm @C @F @Dm @Bb @F",
      drums: "@stroll",
    },
    B: {
      lead: "@b1 @b2 @b3 @b4 @b5 @b6 @b7 @b8",
      harmony: "Bb3+47 -*7 C4+47 -*7 A3+37 -*7 D4+37 -*7 G3+37 -*7 C4+47 -*7 F3+47 -*7 F3+47 -*7",
      bass: "@Bb @C @Am @Dm @Gm @C @F @F",
      drums: "@stroll",
    },
  },
  order: ["A", "B"],
};

/** The exhibit halls: a comic tiptoe in E minor, more giggly than spooky. */
export const MUSE_WING_SONG: Song = {
  title: "Tiptoe Through the Exhibits",
  bpm: 96,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.14, gate: 0.55 },
    harmony: { duty: 0.125, volume: 0.05, gate: 0.5 },
    bass: { volume: 0.42, gate: 0.4 },
    drums: { volume: 0.2 },
  },
  patterns: {
    p1: "E5 . G5 . B5 . G5 .", p2: "E5 . . D#5 E5 . . .", p3: "C5 . E5 . G5 . E5 .", p4: "D#5 . F#5 . B5 - - .",
    p5: "G5 . F#5 . E5 . B4 .", p6: "E5 . G5 . B5 . E6 .", p7: "C6 . B5 . A5 . E5 .", p8: "D#5 - - - B4 . . .",
    q1: "A4 . C5 . E5 . A5 .", q2: "F#5 . A5 . D6 - - .", q3: "G5 . B5 . D6 . B5 .", q4: "E5 - - . C5 - - .",
    q5: "A5 . G5 . F#5 . E5 .", q6: "D#5 . F#5 . B5 - - .", q7: "G5 . E5 . B4 . E5 .", q8: "E5 - - - . . . .",
    Em: "E2 . . . B1 . . .", C: "C2 . . . G1 . . .", B: "B1 . . . F#2 . . .", Am: "A1 . . . E2 . . .", D: "D2 . . . A1 . . .", G: "G1 . . . D2 . . .",
    tiptoe: "h . h . s . . .",
  },
  sections: {
    A: {
      lead: "@p1 @p2 @p3 @p4 @p5 @p6 @p7 @p8",
      harmony: "E3+37 -*7 E3+37 -*7 C4+47 -*7 B3+47 -*7 E3+37 -*7 E3+37 -*7 A3+37 -*7 B3+47 -*7",
      bass: "@Em @Em @C @B @Em @Em @Am @B",
      drums: "@tiptoe",
    },
    B: {
      lead: "@q1 @q2 @q3 @q4 @q5 @q6 @q7 @q8",
      harmony: "A3+37 -*7 D4+47 -*7 G3+47 -*7 C4+47 -*7 A3+37 -*7 B3+47 -*7 E3+37 -*7 E3+37 -*7",
      bass: "@Am @D @G @C @Am @B @Em @Em",
      drums: "@tiptoe",
    },
  },
  order: ["A", "B"],
};

export const MUSE_SONGS: Record<string, Song> = {
  museHub: MUSE_HUB_SONG,
  museDino: { ...MUSE_WING_SONG, title: "Tiptoe Through the Exhibits: Dinosaur Hall" },
  museArmor: {
    ...MUSE_WING_SONG,
    title: "Tiptoe Through the Exhibits: Armor Gallery",
    transpose: 2,
    bpm: 100,
    voices: { ...MUSE_WING_SONG.voices, lead: { duty: 0.5, volume: 0.14, gate: 0.6 } },
  },
  museTomb: {
    ...MUSE_WING_SONG,
    title: "Tiptoe Through the Exhibits: Ancient Wing",
    transpose: -2,
    bpm: 90,
    voices: { ...MUSE_WING_SONG.voices, lead: { duty: 0.125, volume: 0.15, gate: 0.7, vibrato: { depth: 16, rate: 4, delay: 0.3 } } },
  },
  museGallery: {
    ...MUSE_HUB_SONG,
    title: "Mossbrook Stroll: The Grand Gallery",
    transpose: 2,
    bpm: 124,
    voices: { ...MUSE_HUB_SONG.voices, lead: { duty: 0.25, volume: 0.16, gate: 0.8, vibrato: { depth: 12, rate: 5.5, delay: 0.3 } }, drums: { volume: 0.32 } },
  },
};

export const SONGS: Record<string, Song> = { town: TOWN_SONG, ...WING_SONGS, guardian: GUARDIAN_SONG, readingRoom: READING_ROOM_SONG, ...SEA_SONGS, ...CLOCK_SONGS, ...VOLC_SONGS, ...MUSE_SONGS };
export const JINGLES: Record<string, Jingle> = { bookFound: BOOK_FOUND, wingRestored: WING_RESTORED, faint: FAINT };

/** The music for where the player is in a quest (a guardian quiz has its own). */
export function songFor(q: QuestDef, area: string, guardian: boolean): Song {
  if (guardian) return GUARDIAN_SONG;
  const key = area === q.hub ? q.music.hub : area === q.final ? q.music.final : q.music.wings[area];
  return SONGS[key] ?? TOWN_SONG;
}

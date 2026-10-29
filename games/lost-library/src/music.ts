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

export const SONGS: Record<string, Song> = { town: TOWN_SONG, ...WING_SONGS, guardian: GUARDIAN_SONG, readingRoom: READING_ROOM_SONG };
export const JINGLES: Record<string, Jingle> = { bookFound: BOOK_FOUND, wingRestored: WING_RESTORED, faint: FAINT };

/** The music for where the player is in a quest (a guardian quiz has its own). */
export function songFor(q: QuestDef, area: string, guardian: boolean): Song {
  if (guardian) return GUARDIAN_SONG;
  const key = area === q.hub ? q.music.hub : area === q.final ? q.music.final : q.music.wings[area];
  return SONGS[key] ?? TOWN_SONG;
}

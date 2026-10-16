/*
 * Cipher Pursuit's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * The road theme is a sneaky D-minor driving groove; while a code checkpoint is waiting the game
 * thins it to lead + bass (setIntensity("calm")) so the question is easy to think about.
 */
import type { Jingle, Song } from "@/kit/audio";

/** On the road (city and coast): a sneaky spy groove, 8th-note steps. */
export const ROAD_SONG: Song = {
  title: "Night Drive",
  bpm: 138,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.2, gate: 0.8, vibrato: { depth: 14, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.5, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.52, gate: 0.75 },
    drums: { volume: 0.45 },
  },
  patterns: {
    r1: "A4 . D5 . . F5 E5 D5 | C5 . D5 - - - . .",
    r2: "Bb4 . D5 . . F5 E5 D5 | E5 . G5 - - - . .",
    r3: "A5 . . G5 F5 . E5 D5 | F5 - - - D5 . . .",
    r4: "Bb4 - D5 - F5 - E5 - | C#5 - - - E5 - - -",
    s1: "G5 - - - Bb5 - A5 G5 | D5 - - - - - . .",
    s2: "F5 - - - A5 - G5 F5 | E5 - - - - - . .",
    s3: "D5 - F5 - Bb5 - A5 - | G5 - E5 - C5 - . .",
    s4: "C#5 - E5 - A5 - - - | G5 - F5 - E5 - . .",
    Dm: "D2 . D3 . . D2 C3 A2",
    Bb: "Bb1 . Bb2 . . Bb1 A2 F2",
    C: "C2 . C3 . . C2 Bb2 G2",
    A: "A1 . A2 . . A1 G2 E2",
    Gm: "G1 . G2 . . G1 F2 D2",
    groove: "k . h k s . h h",
  },
  sections: {
    intro: { bass: "@Dm @Dm", drums: ". . h . . . h h | . . h . s . h h" },
    A: { lead: "@r1 @r2 @r3 @r4", bass: "@Dm @Dm @Bb @C @Dm @Dm @Bb @A", drums: "@groove" },
    B: { lead: "@s1 @s2 @s3 @s4", bass: "@Gm @Gm @Dm @Dm @Bb @C @A @A", drums: "k . h k s . h h | k . h k s h s s" },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: 1,
};

/** The river (boat mode): the same agent, rolling along in a bouncy 6/8 in G minor. */
export const BOAT_SONG: Song = {
  title: "River Run",
  bpm: 92,
  stepsPerBeat: 3,
  voices: {
    lead: { duty: 0.5, volume: 0.17, vibrato: { depth: 18, rate: 5, delay: 0.25 } },
    harmony: { duty: 0.25, volume: 0.07, echo: { steps: 2 } },
    bass: { volume: 0.5, gate: 0.8 },
    drums: { volume: 0.38 },
  },
  patterns: {
    w1: "D5 - Bb4 G4 - Bb4 | C5 - A4 F4 - .",
    w2: "Bb4 - G4 Eb5 - D5 | C5 - A4 F#4 - .",
    w3: "D5 - G5 F5 - D5 | C5 - F5 Eb5 - C5",
    w4: "Eb5 - - G5 - - | F#5 - - - - .",
    v1: "G5 - - Bb5 - G5 | F5 - - A5 - F5",
    v2: "G5 - D5 Bb4 - D5 | G4 - - - - .",
    v3: "Eb5 - G5 Bb5 - G5 | A5 - F5 C5 - F5",
    v4: "F#5 - - A5 - F#5 | D5 - - - - .",
    Gm: "G2 . D3 G3 . D3",
    F: "F2 . C3 F3 . C3",
    Eb: "Eb2 . Bb2 Eb3 . Bb2",
    D: "D2 . A2 D3 . A2",
    C: "C2 . G2 C3 . G2",
    roll: "k . h s . h",
  },
  sections: {
    intro: { bass: "@Gm @Gm", drums: "k . h . . h | k . h s s s" },
    A: { lead: "@w1 @w2 @w3 @w4", bass: "@Gm @F @Eb @D @Gm @F @C @D", drums: "@roll" },
    B: { lead: "@v1 @v2 @v3 @v4", bass: "@Eb @F @Gm @Gm @Eb @F @D @D", drums: "@roll" },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: 1,
};

export const CODE_CRACKED: Jingle = {
  title: "Code Cracked",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.1 } },
  sections: {
    J: {
      lead: "A4 D5 F5 A5 . D6 - - - - . .",
      harmony: "F4 A4 D5 F5 . A5 - - - - . .",
      bass: "D3 . . . . D2 - - - - . .",
      drums: "k . . . . s . . . . . .",
    },
  },
  order: ["J"],
};

export const MISSION_OVER: Jingle = {
  title: "Mission Paused",
  bpm: 110,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.125, volume: 0.17 } },
  sections: {
    J: {
      lead: "A4 - G4 - F4 - E4 - | D4 - - - - - . .",
      bass: "D2 - - - Bb1 - - - | A1 - - - D2 - - .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { road: ROAD_SONG, boat: BOAT_SONG };
export const JINGLES: Record<string, Jingle> = { codeCracked: CODE_CRACKED, missionOver: MISSION_OVER };

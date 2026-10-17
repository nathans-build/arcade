/*
 * Jungle Run's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 * The game swaps to a sparse cave song in the tunnel shortcut, thins the band to lead + bass while a
 * treasure question, crossroads, timeline gate or base-camp call is open, and speeds up as the clock runs low.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Above ground: an adventurous D-minor trek with tom-tom drums and a swinging vine section. */
export const TREK_SONG: Song = {
  title: "Canopy Trek",
  bpm: 126,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, gate: 0.85, vibrato: { depth: 12, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
    bass: { volume: 0.5 },
    drums: { volume: 0.45 },
  },
  patterns: {
    j1: "D5 . F5 . G5 . A5 . | C6 - A5 - G5 - F5 -",
    j2: "G5 . A5 . F5 . D5 . | C5 - - - D5 - - -",
    j3: "D5 . F5 . G5 . A5 . | C6 - D6 - C6 - A5 -",
    j4: "G5 - F5 - D5 - C5 - | D5 - - - - - . .",
    v1: "A4 - - - D5 - - - | C5 - Bb4 - A4 - - -",
    v2: "G4 - - - C5 - - - | Bb4 - A4 - G4 - - -",
    v3: "F4 - - - Bb4 - - - | A4 - G4 - F4 - - -",
    v4: "E4 - - - A4 - - - | C#5 - - - E5 - - -",
    Dm: "D2 . . D2 A2 . D3 .",
    C: "C2 . . C2 G2 . C3 .",
    Bb: "Bb1 . . Bb1 F2 . Bb2 .",
    F: "F2 . . F2 C3 . F3 .",
    Gm: "G1 . . G1 D2 . G2 .",
    Am: "A1 . . A1 E2 . A2 .",
    beat: "k . t . s . t t | k . t k s . t .",
  },
  sections: {
    intro: { harmony: "D4+37 -*7 C4+47 -*7", bass: "@Dm @Dm", drums: "t . t . t t . t | t . t . t t t t" },
    A1: { lead: "@j1 @j2", bass: "@Dm @F @Gm @C", drums: "@beat" },
    A2: { lead: "@j3 @j4", bass: "@Dm @F @Bb @Dm", drums: "@beat" },
    B: { lead: "@v1 @v2", bass: "@Dm @Dm @C @C", drums: "k . h . s . h . | k . h . s . h h" },
    B2: { lead: "@v3 @v4", bass: "@Bb @Bb @Am @Am", drums: "k . h . s . h . | k . t t s t t t" },
    C: {
      lead: "F5 - - - E5 - - - | D5 - - - C5 - - - | Bb4 - - - A4 - - - | C#5 - - - - - . .",
      harmony: "D4+37 -*7 C4+47 -*7 Bb3+47 -*7 A3+47 -*7",
      bass: "@Dm @C @Bb @Am",
      drums: "k . . . t . . . | k . . t t . . .",
    },
  },
  order: ["intro", "A1", "A2", "B", "B2", "A1", "C"],
  loopTo: 1,
};

/** The tunnel shortcut: slow, drippy E-phrygian cave music with a long echo. */
export const TUNNEL_SONG: Song = {
  title: "Tunnel Shortcut",
  bpm: 108,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.16, gate: 0.6, vibrato: { depth: 10, rate: 5, delay: 0.2 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
    bass: { volume: 0.5 },
    drums: { volume: 0.35 },
  },
  patterns: {
    t1: "E5 . . . B4 . . . | F5 . . . E5 . . .",
    t2: "G5 . . . F5 . E5 . | D5 . . . E5 . . .",
    t3: "E5 . . . B4 . . . | C5 . . . D5 . . .",
    t4: "C5 . B4 . A4 . G4 . | F4 . . . E4 . . .",
    Em: "E2 - - - - - E2 .",
    F: "F2 - - - - - F2 .",
    Dm: "D2 - - - - - D2 .",
    Am: "A1 - - - - - A1 .",
    C: "C2 - - - - - C2 .",
    drip: "k . . . . . h . | . . h . s . . .",
  },
  sections: {
    A: { lead: "@t1 @t2", bass: "@Em @F @C @Dm", drums: "@drip" },
    B: { lead: "@t3 @t4", bass: "@Em @Am @Dm @Em", drums: "@drip" },
    A2: { lead: "@t1 @t2", harmony: "E4+37 -*7 F4+47 -*7 C4+47 -*7 D4+37 -*7", bass: "@Em @F @C @Dm", drums: "@drip" },
  },
  order: ["A", "B", "A2", "B"],
};

/** A treasure question answered right: the treasure is kept. */
export const TREASURE_KEPT: Jingle = {
  title: "Treasure Kept",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "A5 . C6 . D6 - - - . .",
      harmony: "F5 . A5 . A5 - - - . .",
      bass: "D3 . . . D2 - - - . .",
      drums: "t . t . k . . . . .",
    },
  },
  order: ["J"],
};

/** Base camp's call is answered: the leg is complete. */
export const LEG_COMPLETE: Jingle = {
  title: "Leg Complete",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 12, rate: 6, delay: 0.25 } }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "D5 . F5 . G5 . A5 . C6 - A5 - D6 - - - - - - - . . . .",
      harmony: "A4 . C5 . D5 . F5 . G5 - F5 - F#5 - - - - - - - . . . .",
      bass: "D2 . . . D2 . . . C2 . . . D2 - - - - - - - . . . .",
      drums: "t . t . t . t . k . s . k . . . s . . . . . . .",
    },
  },
  order: ["J"],
};

/** The clock ran out or the lives are gone. */
export const GAME_OVER: Jingle = {
  title: "Expedition Over",
  bpm: 96,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 12, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "F4 - A4 - G4 - E4 - | D4 - - - - - . .",
      bass: "D2 - - - Bb1 - - - | A1 - - - D2 - . .",
      drums: "t . . . t . . . | t . t . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { trek: TREK_SONG, tunnel: TUNNEL_SONG };
export const JINGLES: Record<string, Jingle> = { treasureKept: TREASURE_KEPT, legComplete: LEG_COMPLETE, gameOver: GAME_OVER };

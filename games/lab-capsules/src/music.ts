/*
 * Lab Capsules' soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * A bubbling B-flat lab tune with a G-minor "experiment" section (little chromatic bubbles that
 * rise a semitone at a time), and a slower, gentler F-major tune for the SLOW speed.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Medium and fast speeds: a bubbling beaker. */
export const BEAKER_SONG: Song = {
  title: "Bubble Beaker",
  bpm: 128,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, gate: 0.8, vibrato: { depth: 10, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.46, gate: 0.65 },
    drums: { volume: 0.4 },
  },
  patterns: {
    a1: "D5 . F5 . Bb5 . A5 Bb5 | G5 . D5 . . . Bb4 .",
    a2: "Eb5 . G5 . Bb5 . G5 F5 | F5 - - - C5 . D5 Eb5",
    a3: "D5 . F5 . Bb5 . A5 Bb5 | G5 . Bb5 . D6 . C6 Bb5",
    a4: "C6 . Bb5 . G5 . A5 . | Bb5 - - - . . . .",
    b1: "G5 - - - F#5 G5 A5 - | F#5 - - - D5 - - -",
    b2: "Bb5 - - - A5 Bb5 C6 - | A5 - - - - - . .",
    b3: "G5 - - - Bb5 - Eb6 - | D6 - - - Bb5 - - -",
    b4: "C6 - - - Bb5 - A5 - | F#5 - - - A5 - - -",
    Bb: "Bb2 . F2 . Bb2 Bb2 F2 .",
    Gm: "G2 . D3 . G2 G2 D3 .",
    Eb: "Eb2 . Bb2 . Eb2 Eb2 Bb2 .",
    F: "F2 . C3 . F2 F2 C3 .",
    D: "D3 . A2 . D3 D3 A2 .",
    Cm: "C3 . G2 . C3 C3 G2 .",
    CmF: "C3 . G2 . F2 . C3 .",
    bubble: "k . h . s . h h | k h . k s . h .",
  },
  sections: {
    intro: {
      lead: ". . . . . . . . | F5 . F#5 . G5 . A5 .",
      bass: "@Bb @F",
      drums: "h . h . h . h . | h . h . s . s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@Bb @Gm @Eb @F @Bb @Gm @CmF @Bb", drums: "@bubble" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "G3+37 -*7 D4+47 -*7 G3+37 -*7 D4+47 -*7 Eb4+47 -*7 Bb3+47 -*7 C4+37 -*7 D4+47 -*7",
      bass: "@Gm @D @Gm @D @Eb @Bb @Cm @D",
      drums: "k . h . s . h . | k . h k s . h o",
    },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: 1,
};

/** SLOW speed (and the youngest players): a gentle simmer. */
export const SIMMER_SONG: Song = {
  title: "Slow Simmer",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.14, vibrato: { depth: 10, rate: 5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.05, echo: { steps: 4, octave: -1 } },
    bass: { volume: 0.4, gate: 0.7 },
    drums: { volume: 0.28 },
  },
  patterns: {
    F: "F2 . . C3 . . F2 .",
    Am: "A2 . . E2 . . A2 .",
    Bb: "Bb2 . . F2 . . Bb2 .",
    C: "C3 . . G2 . . C3 .",
    Dm: "D3 . . A2 . . D3 .",
    BbC: "Bb2 . . F2 C3 . . G2",
  },
  sections: {
    A: {
      lead: "A5 - - - G5 - F5 - | E5 - - - C5 - - - | D5 - - - F5 - Bb5 - | A5 - - - G5 - - - | A5 - - - G5 - F5 - | E5 - - - A5 - C6 - | D6 - - - C6 - Bb5 G5 | F5 - - - - - . .",
      bass: "@F @Am @Bb @C @F @Am @BbC @F",
      drums: "k . . . h . . . | k . . . h . h .",
    },
    B: {
      lead: "F5 - E5 - D5 - - - | D5 - C5 - Bb4 - - - | A4 - C5 - F5 - - - | E5 - - - G5 - - - | F5 - E5 - D5 - - - | D5 - C5 - Bb4 - D5 - | C5 - - - A4 - G4 - | F4 - - - - - . .",
      harmony: "D4+37 -*7 Bb3+47 -*7 F3+47 -*7 C4+47 -*7 D4+37 -*7 Bb3+47 -*7 C4+47 -*7 F3+47 -*7",
      bass: "@Dm @Bb @F @C @Dm @Bb @C @F",
      drums: "k . . . h . . . | k . . . h . h .",
    },
  },
  order: ["A", "B"],
};

/** A chain reaction (two or more clears from one capsule). Very short. */
export const CHAIN_REACTION: Jingle = {
  title: "Chain Reaction",
  bpm: 180,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.17 } },
  sections: {
    J: {
      lead: "F5 F#5 G5 . A5 Bb5 B5 . C6 - - - . .",
      bass: "F2 . . . . . . . F3 - - - . .",
      drums: "h . h . h . h . k . . . . .",
    },
  },
  order: ["J"],
};

/** Every germ is gone: lab clean! */
export const LAB_CLEAN: Jingle = {
  title: "Lab Clean",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "Bb4 . D5 . F5 . Bb5 . . . A5 . C6 . D6 - - - - - - - . .",
      harmony: "F4 . Bb4 . D5 . F5 . . . F5 . A5 . Bb5 - - - - - - - . .",
      bass: "Bb2 . . . F2 . . . . . F2 . F2 . Bb2 - - - - - - - . .",
      drums: "k . h . s . h . . . k . s . k . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** The lab-quiz question was answered right. */
export const EUREKA: Jingle = {
  title: "Eureka",
  bpm: 168,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.16 }, harmony: { duty: 0.25, volume: 0.08 } },
  sections: {
    J: {
      lead: "F5 . Bb5 . D6 . . . C6 . F6 - - - - - . .",
      harmony: "D5 . F5 . Bb5 . . . A5 . C6 - - - - - . .",
      bass: "Bb2 . . . Bb2 . . . F2 . Bb2 - - - - - . .",
      drums: "h . h . k . . . s . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The bottle filled up. Gentle: try again! */
export const BOTTLE_FULL: Jingle = {
  title: "Bottle Full",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "D6 - Bb5 - G5 - F5 - | Eb5 - D5 - Bb4 - - .",
      bass: "Bb2 - - - Eb2 - - - | F2 - - - Bb2 - - .",
      drums: "k . . . . . . . | s . . . k . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { beaker: BEAKER_SONG, simmer: SIMMER_SONG };
export const JINGLES: Record<string, Jingle> = { chain: CHAIN_REACTION, labClean: LAB_CLEAN, eureka: EUREKA, bottleFull: BOTTLE_FULL };

/** The music for a speed setting. */
export function speedSong(speed: string): Song {
  return speed === "slow" ? SIMMER_SONG : BEAKER_SONG;
}

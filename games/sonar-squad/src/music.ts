/*
 * Sonar Squad's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * Placing the fleet gets a light F-major deployment tune; the battle is a D-minor patrol with a
 * "torpedo run" section and a sonar-ping break (single high pings echoed an octave down).
 */
import type { Jingle, Song } from "@/kit/audio";

/** Placing ships (and the pass-and-play cover screens): calm, steady, getting ready. */
export const DEPLOY_SONG: Song = {
  title: "Fleet Deployment",
  bpm: 112,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.16, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 4, octave: -1 } },
    bass: { volume: 0.44, gate: 0.7 },
    drums: { volume: 0.32 },
  },
  patterns: {
    d1: "C5 . C5 . F5 - A5 - | G5 . F5 . E5 - C5 -",
    d2: "D5 . D5 . G5 - Bb5 - | A5 - - - . . . .",
    d3: "C5 . C5 . F5 - A5 - | C6 . Bb5 . A5 - G5 -",
    d4: "F5 . E5 . D5 . E5 . | F5 - - - . . . .",
    F: "F2 . C3 . F2 . C3 .",
    C: "C3 . G2 . C3 . G2 .",
    Gm: "G2 . D3 . G2 . D3 .",
    Bb: "Bb2 . F2 . Bb2 . F2 .",
    Dm: "D3 . A2 . D3 . A2 .",
    march: "k . h . s . h . | k . h . s . h h",
  },
  sections: {
    A: { lead: "@d1 @d2 @d3 @d4", bass: "@F @C @Gm @F @F @C @Bb @F", drums: "@march" },
    B: {
      lead: "D5 - - - C5 - - - | Bb4 - - - A4 - - - | G4 - - - A4 - Bb4 - | C5 - - - - - - - | D5 - - - E5 - - - | F5 - - - G5 - - - | A5 - - - G5 - E5 - | F5 - - - - - . .",
      harmony: "D4+37 -*7 C4+47 -*7 Bb3+47 -*7 F3+47 -*7 G3+37 -*7 F3+47 -*7 C4+47 -*7 F3+47 -*7",
      bass: "@Dm @C @Bb @F @Gm @F @C @F",
      drums: "k . h . . . h . | k . h . s . h .",
    },
  },
  order: ["A", "B"],
};

/** The battle: a D-minor patrol, a torpedo run and a sonar-ping break. */
export const PATROL_SONG: Song = {
  title: "Deep Patrol",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 14, rate: 5.5, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3, octave: -1 } },
    bass: { volume: 0.5, gate: 0.75 },
    drums: { volume: 0.42 },
  },
  patterns: {
    a1: "D5 - - - F5 - E5 - | D5 - A4 - - - . .",
    a2: "Bb4 - - - D5 - C5 - | A4 - - - - - . .",
    a3: "D5 - - - F5 - G5 - | A5 - - - C6 - A5 -",
    a4: "G5 - - - F5 - E5 - | D5 - - - - - . .",
    b1: "A5 A5 . A5 Bb5 . A5 G5 | A5 . . . . . D5 .",
    b2: "G5 G5 . G5 A5 . G5 F5 | E5 . . . . . A4 .",
    b3: "F5 F5 . F5 G5 . A5 Bb5 | C6 . . . Bb5 . A5 .",
    b4: "G5 - - - E5 - - - | A5 - - - - - . .",
    Dm: "D2 . D2 A2 D3 . C3 A2",
    Bb: "Bb2 . Bb2 F2 Bb2 . A2 F2",
    A: "A2 . A2 E2 A2 . G2 E2",
    F: "F2 . F2 C3 F3 . E3 C3",
    C: "C3 . C3 G2 C3 . Bb2 G2",
    Gm: "G2 . G2 D3 G3 . F3 D3",
    sub: "k . h . s . h k | k . h . s . h h",
  },
  sections: {
    intro: {
      lead: "A5 - - - . . . . | . . . . A5 - . .",
      bass: "@Dm @Dm",
      drums: "k . . . . . . . | k . . . s . s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@Dm @Dm @Bb @A @Dm @F @A @Dm", drums: "@sub" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "D4+37 -*7 D4+37 -*7 C4+47 -*7 A3+47 -*7 Bb3+47 -*7 F3+47 -*7 G3+37 -*7 A3+47 -*7",
      bass: "@Dm @Dm @C @A @Bb @F @Gm @A",
      drums: "k h s h k h s h | k h s h k k s o",
    },
    C: {
      lead: "A5 - . . . . . . | . . . . A5 - . . | A5 - . . . . . . | . . . . E5 . F5 .",
      bass: "D2 - - - - - - - | D2 - - - - - - - | D2 - - - - - - - | A2 - - - - - - -",
      drums: "k . . . t . . . | k . . . t . t t | k . . . t . . . | k . s . t t s s",
    },
  },
  order: ["intro", "A", "B", "A", "C"],
  loopTo: 1,
};

/** You sank an enemy ship. */
export const ENEMY_SUNK: Jingle = {
  title: "Enemy Sunk",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "D5 . F5 . A5 . D6 . . . C6 . D6 - - - - - . .",
      harmony: "A4 . D5 . F5 . A5 . . . G5 . A5 - - - - - . .",
      bass: "D3 . . . A2 . . . . . C3 . D3 - - - - - . .",
      drums: "k . . . s . . . k . s . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The enemy sank one of your ships. */
export const SHIP_LOST: Jingle = {
  title: "Ship Lost",
  bpm: 120,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.15 } },
  sections: {
    J: {
      lead: "A4 - - - G4 - - - F4 - - - E4 - - - - - . .",
      bass: "D2 - - - - - - - C2 - - - A1 - - - - - . .",
      drums: "k . . . . . . . k . . . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** The whole enemy fleet is sunk (or, pass and play: a player wins). */
export const VICTORY: Jingle = {
  title: "Fleet Victory",
  bpm: 132,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 14, rate: 6, delay: 0.3 } }, harmony: { duty: 0.5, volume: 0.08 } },
  sections: {
    J: {
      lead: "D5 . F5 . A5 . D6 . | C6 - A5 - Bb5 - G5 - | A5 - F5 - G5 - E5 - | D6 - - - - - - .",
      harmony: "D4+37 -*7 F3+47 -*7 F3+47 -*7 D4+47 - - - - - - .",
      bass: "D3 . D3 . D3 . D3 . | F2 . F2 . G2 . G2 . | A2 . A2 . A2 . A2 . | D2 - - - - - - .",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Your fleet was sunk. Gentle, and ready for another go. */
export const FLEET_LOST: Jingle = {
  title: "Back to Port",
  bpm: 104,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "F5 - E5 - D5 - A4 - | Bb4 - C5 - D5 - - .",
      bass: "D3 - - - A2 - - - | Bb2 - - - D2 - - .",
      drums: "k . . . . . . . | s . . . k . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { patrol: PATROL_SONG, deploy: DEPLOY_SONG };
export const JINGLES: Record<string, Jingle> = { enemySunk: ENEMY_SUNK, shipLost: SHIP_LOST, victory: VICTORY, fleetLost: FLEET_LOST };

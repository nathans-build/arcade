/*
 * Web Invaders' soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 * (The engine's own low "march" blips are sound effects and stay on the SFX switch.)
 */
import type { Jingle, Song } from "@/kit/audio";

/** Waves 1-3: a heroic G-mixolydian rooftop theme with a web-swoop intro and an echoing second pulse. */
export const ROOFTOP_SONG: Song = {
  title: "Rooftop Web-Slinger",
  bpm: 138,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 12, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },
    bass: { volume: 0.5 },
    drums: { volume: 0.45 },
  },
  patterns: {
    h1: "G4 . B4 D5 G5 - F5 D5 | E5 - C5 - D5 - - -",
    h2: "G4 . B4 D5 G5 - A5 G5 | F5 - D5 - C5 - D5 -",
    h3: "E5 . E5 F5 G5 . E5 C5 | D5 - B4 - G4 - - -",
    h4: "C5 . C5 D5 E5 . F5 E5 | D5 - - - . . . .",
    b1: "Bb4 - C5 - D5 - F5 - | G5 - - - F5 - D5 -",
    b2: "C5 - D5 - E5 - G5 - | A5 - G5 - F5 - E5 -",
    b3: "F5 . F5 . G5 . A5 . | Bb5 - A5 - G5 - F5 -",
    b4: "D5 . D5 . E5 . F#5 . | G5 - - - - - . .",
    G: "G2 . D3 G2 . G2 F2 D2",
    C: "C3 . G2 C3 . C3 Bb2 G2",
    F: "F2 . C3 F2 . F2 A2 C3",
    D: "D2 . A2 D3 . D3 C3 A2",
    Bb: "Bb1 . F2 Bb2 . Bb2 A2 F2",
    Am: "A2 . E3 A2 . A2 G2 E2",
    beat: "k . h . s . h k | k . h . s . h h",
  },
  sections: {
    intro: {
      lead: "D5 G5 D6 . . . . . | C6 . Bb5 . A5 . F5 .",
      harmony: "G3+47 -*7 F3+47 -*7",
      bass: "@G @F",
      drums: "k . s . k . s . | k k s . s s s s",
    },
    A1: { lead: "@h1 @h2", bass: "@G @C @G @F", drums: "@beat" },
    A2: { lead: "@h3 @h4", bass: "@C @G @Am @D", drums: "@beat" },
    B: { lead: "@b1 @b2", bass: "@Bb @F @C @Am", drums: "k . h k s . h . | k . h k s . h h" },
    B2: { lead: "@b3 @b4", bass: "@F @Bb @D @G", drums: "k . h k s . h . | k . s . s s s s" },
    C: {
      lead: "G5 - - - D5 - - - | F5 - - - C5 - - - | E5 - - - B4 - - - | D5 - - - - - - -",
      harmony: "G3+47 -*7 F3+47 -*7 C4+47 -*7 D4+47 -*7",
      bass: "@G @F @C @D",
      drums: "k . h . s . h . | k . h . s . h h",
    },
  },
  order: ["intro", "A1", "A2", "B", "B2", "A1", "C"],
  loopTo: 1,
};

/** Wave 4 onward: the rooftop theme a tone higher and faster, as the swarm gets bolder. */
export const SWARM_SONG: Song = {
  ...ROOFTOP_SONG,
  title: "Swarm Rising",
  bpm: 148,
  transpose: 2,
  voices: {
    ...ROOFTOP_SONG.voices,
    lead: { duty: 0.125, volume: 0.19, vibrato: { depth: 16, rate: 7, delay: 0.18 } },
    harmony: { duty: 0.25, volume: 0.06, echo: { steps: 2 } },
  },
};

/** The right answer invader is webbed: the whole wave scatters. */
export const BUG_BUSTED: Jingle = {
  title: "Bug Busted",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21 }, harmony: { duty: 0.5, volume: 0.08 } },
  sections: {
    J: {
      lead: "G5 . D5 G5 B5 . D6 - - - . .",
      harmony: "D5 . B4 D5 G5 . B5 - - - . .",
      bass: "G2 . . . G2 . G3 - - - . .",
      drums: "k . . . s . k . . . . .",
    },
  },
  order: ["J"],
};

/** Every bug of the wave is cleared. */
export const WAVE_CLEAR: Jingle = {
  title: "Wave Clear",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 12, rate: 6, delay: 0.25 } }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "C5 E5 G5 C6 . . Bb5 - G5 - A5 - B5 - - - D6 - - - - - - -",
      harmony: "G4 C5 E5 G5 . . F5 - D5 - E5 - F5 - - - B5 - - - - - - -",
      bass: "C3 . . . . . Bb2 - - - - - G2 - - - G2 - - - - - . .",
      drums: "k . . . s . k . . . s . k . . . s . . . . . . .",
    },
  },
  order: ["J"],
};

/** The last hero is down. */
export const GAME_OVER: Jingle = {
  title: "Webs Down",
  bpm: 96,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 12, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "D5 - C5 - Bb4 - A4 - | G4 - - - - - . .",
      bass: "G2 - - - Eb2 - - - | D2 - - - G1 - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { rooftop: ROOFTOP_SONG, swarm: SWARM_SONG };
export const JINGLES: Record<string, Jingle> = { bugBusted: BUG_BUSTED, waveClear: WAVE_CLEAR, gameOver: GAME_OVER };

/** The song for a wave (1-based): wave 4 onward gets the faster swarm version. */
export function waveSong(level: number): Song {
  return level >= 4 ? SWARM_SONG : ROOFTOP_SONG;
}

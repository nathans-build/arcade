/*
 * Plants vs Undead's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see
 * src/kit/README.md). Silly, slow, shambling undead get a creepy-cute oom-pah; dusk, frost and the
 * Weed Lich each get their own mood. The music thins to lead + bass while a question is on screen
 * and speeds up a little for a huge wave.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Sunny Backyard and Garden Afternoon: a creepy-cute E-minor shamble with a lurching oom-pah. */
export const DAY_SONG: Song = {
  title: "Backyard Shamble",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.14, gate: 0.65, vibrato: { depth: 12, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.05, gate: 0.4 },
    bass: { volume: 0.4, gate: 0.5 },
    drums: { volume: 0.2 },
  },
  patterns: {
    Em: "E2 . B2 . E2 . B2 .", Am: "A2 . E2 . A2 . E2 .", B7: "B1 . F#2 . B1 . A2 .", C: "C3 . G2 . C3 . G2 .", AmB7: "A2 . E2 . B1 . F#2 .",
    G: "G2 . D3 . G2 . D3 .", D: "D3 . A2 . D3 . A2 .",
    hEm: ". . E4+37 . . . E4+37 .", hAm: ". . A3+37 . . . A3+37 .", hB7: ". . B3+47a . . . B3+47a .", hC: ". . C4+47 . . . C4+47 .",
    hAmB7: ". . A3+37 . . . B3+47a .", hG: ". . G3+47 . . . G3+47 .", hD: ". . D4+47 . . . D4+47 .",
    polka: "k . s . k . s . | k . s . k k s .",
    lurch: "k . t . k . t t | k . t . s . t .",
  },
  sections: {
    intro: { bass: "@Em @B7", drums: "k . s . k . s . | k . t t s s s s" },
    A: {
      lead: "E5 . G5 . F#5 . E5 . | B4 - - . . . B4 C5 | A4 . C5 . E5 . D#5 E5 | F#5 - - - D#5 - . . | E5 . G5 . B5 . A5 G5 | C6 - - . B5 . A5 . | A5 . G5 F#5 B4 . D#5 . | E5 - - - . . . .",
      harmony: "@hEm @hEm @hAm @hB7 @hEm @hC @hAmB7 @hEm",
      bass: "@Em @Em @Am @B7 @Em @C @AmB7 @Em",
      drums: "@polka",
    },
    B: {
      lead: "D5 . D5 . G5 - - . | F#5 . A5 . D5 - - . | E5 . G5 . B5 - A5 . | F#5 - - - D#5 - - . | E5 . G5 . C6 - B5 . | B5 . A5 . G5 - - . | A5 . C6 . B5 . F#5 . | E5 - - - . . . .",
      harmony: "@hG @hD @hEm @hB7 @hC @hG @hAmB7 @hEm",
      bass: "@G @D @Em @B7 @C @G @AmB7 @Em",
      drums: "@polka",
    },
    C: {
      lead: "B4 - - - C5 - - - | B4 - - - A4 - - - | C5 - - - D5 - - - | D#5 - - - F#5 - - - | E5 - - - G5 - - - | E5 - - - C5 - - - | C5 - - - A4 - - - | B4 - - - - - . .",
      bass: "E2 F2 F#2 G2 G#2 A2 A#2 B2 | B2 A#2 A2 G#2 G2 F#2 F2 E2 | A2 . E2 . A2 . E2 . | B1 . F#2 . B1 . A2 . | E2 F2 F#2 G2 G#2 A2 A#2 B2 | C3 . G2 . C3 . G2 . | A2 . E2 . B1 . F#2 . | E2 . B1 . E2 . . .",
      drums: "@lurch",
    },
  },
  order: ["intro", "A", "B", "C"],
  loopTo: "A",
};

/** The Weed Lich's level, before the boss: the backyard tune a step lower and a touch quicker. */
export const LICH_LAWN_SONG: Song = { ...DAY_SONG, title: "Lich Lawn Shamble", bpm: 126, transpose: -2 };

/** Twilight Beds: dim light, a slower B-minor dusk with a soft echo. */
export const TWILIGHT_SONG: Song = {
  title: "Twilight Beds",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.12, gate: 0.85, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.045, echo: { steps: 3, octave: -1 } },
    bass: { volume: 0.38, gate: 0.6 },
    drums: { volume: 0.16 },
  },
  patterns: {
    Bm: "B1 . . . F#2 . B2 .", G: "G1 . . . D2 . G2 .", Em: "E2 . . . B2 . E2 .", Fs: "F#2 . . . C#2 . F#2 .", D: "D2 . . . A2 . D2 .",
    EmFs: "E2 . . . F#2 . . .",
    dusk: "k . . . h . . . | k . . h s . . .",
  },
  sections: {
    A: {
      lead: "F#5 - - - D5 - B4 - | D5 - - - B4 - G4 - | G4 - B4 - E5 - D5 - | C#5 - - - A#4 - - - | F#5 - - - B5 - A5 - | G5 - - - F#5 - E5 - | E5 - G5 - F#5 - A#4 - | B4 - - - - - . .",
      bass: "@Bm @G @Em @Fs @Bm @G @EmFs @Bm",
      drums: "@dusk",
    },
    B: {
      lead: "B5 - - - A5 - G5 - | F#5 - - - D5 - - - | E5 - - - G5 - B5 - | A#5 - - - - - - - | B5 - - - D6 - B5 - | A5 - - - F#5 - D5 - | E5 - - - C#5 - A#4 - | B4 - - - - - . .",
      bass: "@G @D @Em @Fs @G @D @EmFs @Bm",
      drums: "@dusk",
    },
  },
  order: ["A", "B"],
};

/** Frosty Dawn: icy F#-minor / A-major sparkle, cold arpeggios high above a steady bass. */
export const FROST_SONG: Song = {
  title: "Frosty Dawn",
  bpm: 108,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.12, gate: 0.85, vibrato: { depth: 8, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.035, gate: 0.5 },
    bass: { volume: 0.36, gate: 0.6 },
    drums: { volume: 0.15 },
  },
  patterns: {
    Fsm: "F#2 . . F#2 . . C#3 .", D: "D2 . . D2 . . A2 .", A: "A2 . . A2 . . E2 .", E: "E2 . . E2 . . B2 .", Csm: "C#2 . . C#2 . . G#2 .",
    rFsm: "A5 F#5 C#5 F#5 A5 F#5 C#5 F#5", rD: "A5 F#5 D5 F#5 A5 F#5 D5 F#5", rA: "A5 E5 C#5 E5 A5 E5 C#5 E5", rE: "G#5 E5 B4 E5 G#5 E5 B4 E5",
    rCsm: "G#5 E5 C#5 E5 G#5 E5 C#5 E5",
    ice: "h . h . s . h . | h . h . s . h h",
  },
  sections: {
    A: {
      lead: "C#5 - - - - - B4 - | A4 - - - F#4 - - - | E4 - A4 - C#5 - E5 - | B4 - - - - - - - | C#5 - - - F#5 - E5 - | D5 - - - A4 - F#4 - | G#4 - B4 - E5 - G#5 - | E5 - - - - - . .",
      harmony: "@rFsm @rD @rA @rE @rFsm @rD @rE @rE",
      bass: "@Fsm @D @A @E @Fsm @D @E @E",
      drums: "@ice",
    },
    B: {
      lead: "F#5 - - - A5 - - - | G#5 - - - E5 - - - | E5 - G#5 - C#6 - - - | A5 - - - - - - - | F#5 - - - A5 - D6 - | B5 - - - G#5 - E5 - | A5 - - - C#6 - B5 - | A5 - - - - - . .",
      harmony: "@rD @rE @rCsm @rFsm @rD @rE @rA @rA",
      bass: "@D @E @Csm @Fsm @D @E @A @A",
      drums: "@ice",
    },
  },
  order: ["A", "B"],
};

/** The Weed Lich: a stomping C-minor boss tune with a driving bass. */
export const BOSS_SONG: Song = {
  title: "Weed Lich Stomp",
  bpm: 138,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.15, gate: 0.8, vibrato: { depth: 14, rate: 6.5, delay: 0.2 } },
    harmony: { duty: 0.125, volume: 0.05, gate: 0.5 },
    bass: { volume: 0.42, gate: 0.55 },
    drums: { volume: 0.24 },
  },
  patterns: {
    Cm: "C2 C3 C2 C3 C2 C3 Eb2 F2", Ab: "Ab1 Ab2 Ab1 Ab2 Ab1 Ab2 C2 Eb2", Bb: "Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 D2 F2", G: "G1 G2 G1 G2 G1 G2 B1 D2",
    Fm: "F2 F3 F2 F3 F2 F3 Ab2 C3",
    hCm: "C4+7c - . . C4+7c - . .", hAb: "Ab3+7c - . . Ab3+7c - . .", hBb: "Bb3+7c - . . Bb3+7c - . .", hG: "G3+7c - . . G3+7c - . .",
    hFm: "F3+7c - . . F3+7c - . .",
    a: "C5 - Eb5 - G5 - - . | Gb5 - F5 - Eb5 - - . | Ab5 - - - G5 - F5 - | D5 - - - Bb4 - - - | C5 - Eb5 - G5 - C6 - | B5 - - - G5 - - - | Ab5 - G5 - F5 - Eb5 - | D5 - - - B4 - - -",
    stomp: "k . h . s . h . | k k h . s . h o",
  },
  sections: {
    intro: { bass: "@Cm @G", drums: "k . k . s . k . | k . k . s s s s" },
    A: { lead: "@a", harmony: "@hCm @hCm @hAb @hBb @hCm @hCm @hAb @hG", bass: "@Cm @Cm @Ab @Bb @Cm @Cm @Ab @G", drums: "@stomp" },
    B: {
      lead: "F5 . F5 . Ab5 - C6 - | Bb5 - Ab5 - G5 - F5 - | G5 . G5 . Eb5 - C5 - | D5 - Eb5 - D5 - C5 - | Ab4 - C5 - Eb5 - Ab5 - | Bb5 - - - F5 - D5 - | G5 - - - F5 - D5 - | B4 - - - D5 - F5 -",
      harmony: "@hFm @hFm @hCm @hCm @hAb @hBb @hG @hG",
      bass: "@Fm @Fm @Cm @Cm @Ab @Bb @G @G",
      drums: "@stomp",
    },
    A2: { lead: "@a", harmony: "@hCm @hCm @hAb @hBb @hCm @hCm @hAb @hG", bass: "@Cm @Cm @Ab @Bb @Cm @Cm @Ab @G", drums: "@stomp", transpose: 2 },
  },
  order: ["intro", "A", "B", "A2"],
  loopTo: "A",
};

export const WAVE_CLEAR: Jingle = {
  title: "Wave Cleared",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.125, volume: 0.06 } },
  sections: {
    J: {
      lead: "G5 . B5 . D6 . B5 . | C6 . E6 . D6 - - - | . . . .",
      harmony: "D5 . G5 . B5 . G5 . | A5 . C6 . B5 - - - | . . . .",
      bass: "G2 . . . D3 . . . | C3 . . . G2 - - - | . . . .",
      drums: "k . . . s . . . | k . s . k - - - | . . . .",
    },
  },
  order: ["J"],
};

export const NEW_LEVEL: Jingle = {
  title: "New Garden Bed",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.5, volume: 0.06 } },
  sections: {
    J: {
      lead: "E5 . G5 . B5 . E6 . | D6 . B5 . G5 . B5 . | C6 - - - D6 - - - | E6 - - - - - . .",
      harmony: "B4 . E5 . G5 . B5 . | B5 . G5 . D5 . G5 . | E5 - - - F#5 - - - | G#5 - - - - - . .",
      bass: "E2 . . . B2 . . . | G2 . . . D3 . . . | C3 . . . D3 . . . | E2 - - - - - . .",
      drums: "k . h . s . h . | k . h . s . h . | k . . . k . . . | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const HUGE_WAVE: Jingle = {
  title: "Huge Wave",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.17 } },
  sections: {
    J: {
      lead: "E5 - B4 - E5 - B4 - | F5 - B4 - F5 - - - | . . . .",
      bass: "E2 - - - E2 - - - | F2 - - - F2 - - - | . . . .",
      drums: "k . . . k . . . | k . k . s s s s | . . . .",
    },
  },
  order: ["J"],
};

export const LICH_RISES: Jingle = {
  title: "The Lich Rises",
  bpm: 110,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 25, rate: 6, delay: 0.05 } } },
  sections: {
    J: {
      lead: "C5 - - - Gb4 - - - | C5 - - - Gb4 - - - | Ab4 - - - G4 - - - - - - - . . . .",
      bass: "C2 - - - Gb2 - - - | C2 - - - Gb2 - - - | Ab1 - - - G1 - - - - - - - . . . .",
      drums: "k . . . . . . . | k . . . . . . . | k . . . k . k . s s s s . . . .",
    },
  },
  order: ["J"],
};

export const GARDEN_SAVED: Jingle = {
  title: "Garden Saved",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.19 }, harmony: { duty: 0.125, volume: 0.07 } },
  sections: {
    J: {
      lead: "G5 . G5 . G5 . E5 . | G5 - - - C6 - - - | B5 . A5 . G5 . A5 . | B5 - - - C6 - - - | E6 - - - - - - - | . . . .",
      harmony: "E5 . E5 . E5 . C5 . | E5 - - - G5 - - - | G5 . F5 . E5 . F5 . | G5 - - - G5 - - - | C6 - - - - - - - | . . . .",
      bass: "C3 . . . G2 . . . | C3 . . . E3 . . . | G2 . . . D3 . . . | G2 . . . C3 . . . | C2 - - - - - - - | . . . .",
      drums: "k . h . s . h . | k . h . s . h . | k . h . s . h . | k . s . s s s s | k . . . . . . . | . . . .",
    },
  },
  order: ["J"],
};

export const OVERRUN: Jingle = {
  title: "Greenhouse Overrun",
  bpm: 112,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.17, vibrato: { depth: 18, rate: 6, delay: 0.1 } } },
  sections: {
    J: {
      lead: "B4 - - . A#4 - - . A4 - - . G#4 - - - | - - - - E4 - - - - - - - . . . .",
      bass: "E2 - - . D#2 - - . D2 - - . C#2 - - - | - - - - E1 - - - - - - - . . . .",
      drums: "k . . . . . . . k . . . . . . . | k . . . k . . . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** The song for a level (1-5); the boss song takes over when the Weed Lich appears. */
export function songForLevel(level: number): Song {
  return level >= 5 ? LICH_LAWN_SONG : level === 4 ? FROST_SONG : level === 3 ? TWILIGHT_SONG : DAY_SONG;
}

export const SONGS: Record<string, Song> = { day: DAY_SONG, twilight: TWILIGHT_SONG, frost: FROST_SONG, lichLawn: LICH_LAWN_SONG, boss: BOSS_SONG };
export const JINGLES: Record<string, Jingle> = {
  waveClear: WAVE_CLEAR, newLevel: NEW_LEVEL, hugeWave: HUGE_WAVE, lichRises: LICH_RISES, saved: GARDEN_SAVED, overrun: OVERRUN,
};

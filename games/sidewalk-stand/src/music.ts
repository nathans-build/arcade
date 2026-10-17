/*
 * Sidewalk Stand's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Each day has its own arc: an easy-going morning while you plan, a bouncy lunch rush at the cart (a
 * softer minor-key patter on rainy days), and a mellow evening for the ledger. The music thins to
 * lead + bass while a customer is paying (the make-change question) and hurries a little when a line builds up.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Morning: planning and buying supplies, an easy B-flat-major stroll. */
export const MORNING_SONG: Song = {
  title: "Morning Prep",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.11, gate: 0.8, vibrato: { depth: 8, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.035, gate: 0.45 },
    bass: { volume: 0.32, gate: 0.75 },
    drums: { volume: 0.1 },
  },
  patterns: {
    Bb: "Bb1 - - - F2 - - -", Gm: "G2 - - - D2 - - -", Eb: "Eb2 - - - Bb1 - - -", F: "F2 - - - C2 - - -", Cm: "C2 - - - G2 - - -", CmF: "C2 - - - F2 - - -",
    hBb: ". . Bb3+47 . . . Bb3+47 .", hGm: ". . G3+37 . . . G3+37 .", hEb: ". . Eb4+47 . . . Eb4+47 .", hF: ". . F3+47 . . . F3+47 .",
    hCm: ". . C4+37 . . . C4+37 .", hCmF: ". . C4+37 . . . F3+47 .",
    stroll: "k . h . s . h . | k . h . s . h h",
  },
  sections: {
    A: {
      lead: "D5 - F5 - Bb5 - - - | G5 - - - D5 - - - | Eb5 - G5 - Bb5 - G5 - | A5 - - - F5 - - - | D5 - F5 - Bb5 - D6 - | C6 - Bb5 - G5 - - - | Eb5 - - - C5 - A4 - | Bb4 - - - - - . .",
      harmony: "@hBb @hGm @hEb @hF @hBb @hGm @hCmF @hBb",
      bass: "@Bb @Gm @Eb @F @Bb @Gm @CmF @Bb",
      drums: "@stroll",
    },
    B: {
      lead: "G5 - - - Eb5 - G5 - | F5 - - - D5 - - - | Eb5 - - - G5 - C6 - | A5 - - - - - - - | Bb5 - - - G5 - Eb5 - | F5 - D5 - Bb4 - D5 - | C5 - Eb5 - A5 - C6 - | Bb5 - - - - - . .",
      harmony: "@hEb @hBb @hCm @hF @hEb @hBb @hCmF @hBb",
      bass: "@Eb @Bb @Cm @F @Eb @Bb @CmF @Bb",
      drums: "@stroll",
    },
  },
  order: ["A", "B"],
};

/** The midday rush at the cart: a bouncy C-major tune over a walking bass. */
export const RUSH_SONG: Song = {
  title: "Lunch Rush",
  bpm: 138,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.13, gate: 0.6, vibrato: { depth: 8, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.045, gate: 0.4 },
    bass: { volume: 0.38, gate: 0.5 },
    drums: { volume: 0.2 },
  },
  patterns: {
    C: "C2 . E2 . G2 . A2 .", F: "F2 . A2 . C3 . D3 .", G: "G2 . B2 . D3 . E3 .", Am: "A2 . C3 . E3 . C3 .", Em: "E2 . G2 . B2 . G2 .",
    Dm: "D2 . F2 . A2 . F2 .",
    hC: ". C4+47 . . . C4+47 . .", hF: ". A3+38 . . . A3+38 . .", hG: ". B3+38 . . . B3+38 . .", hAm: ". A3+37 . . . A3+37 . .",
    hEm: ". E4+37 . . . E4+37 . .", hDm: ". D4+37 . . . D4+37 . .",
    busy: "k . h k s . h . | k h h k s . h h",
  },
  sections: {
    intro: { bass: "@C @G", drums: "k . h . s . h . | k . k . s s s s" },
    A: {
      lead: "G5 . E5 . G5 A5 G5 . | E5 . C5 . D5 E5 . . | F5 . A5 . C6 . A5 . | G5 . E5 . C5 - . . | D5 . G5 . B5 . G5 . | F5 . A5 . C6 - A5 . | G5 . E5 . C5 . E5 . | D5 - - - G4 - . .",
      harmony: "@hC @hC @hF @hC @hG @hF @hC @hG",
      bass: "@C @C @F @C @G @F @C @G",
      drums: "@busy",
    },
    B: {
      lead: "A5 - - . G5 . E5 . | G5 - - . E5 . B4 . | C5 . F5 . A5 . F5 . | E5 - - - G5 - . . | F5 . D5 . F5 . A5 . | B5 . A5 . G5 . F5 . | E5 . G5 . C6 . G5 . | C6 - - - . . . .",
      harmony: "@hAm @hEm @hF @hC @hDm @hG @hC @hC",
      bass: "@Am @Em @F @C @Dm @G @C @C",
      drums: "@busy",
    },
    C: {
      lead: "C6 . . . . . . . | G5 . . . . . . . | A5 . . . . . . . | G5 . E5 . C5 . . . | C6 . . . . . . . | G5 . . . . . . . | F5 . E5 . D5 . . . | G5 - - - . . . .",
      harmony: "@hC @hC @hF @hC @hC @hC @hDm @hG",
      bass: "@C @C @F @C @C @C @Dm @G",
      drums: "k . h k s . h k | k . h k s s h h",
    },
  },
  order: ["intro", "A", "B", "A", "C"],
  loopTo: "A",
};

/** A rainy-day rush: fewer customers, a softer A-minor tune with a pattering hat like rain on the umbrella. */
export const RAIN_SONG: Song = {
  title: "Rainy Rush",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.11, gate: 0.75, vibrato: { depth: 9, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.035, echo: { steps: 3, octave: -1 } },
    bass: { volume: 0.34, gate: 0.6 },
    drums: { volume: 0.09 },
  },
  patterns: {
    Am: "A2 . . A2 E2 . . .", F: "F2 . . F2 C3 . . .", C: "C3 . . C3 G2 . . .", G: "G2 . . G2 D3 . . .", E: "E2 . . E2 B1 . . .", Em: "E2 . . E2 B2 . . .",
    patter: "h h h h s h h h",
  },
  sections: {
    A: {
      lead: "E5 . . E5 D5 . C5 . | A4 - - - C5 - . . | G5 . . G5 E5 . C5 . | D5 - - - B4 - . . | E5 . . E5 A5 . G5 . | F5 - - - A5 - . . | G#5 . . E5 B4 . D5 . | E5 - - - - - . .",
      bass: "@Am @F @C @G @Am @F @E @E",
      drums: "@patter",
    },
    B: {
      lead: "C6 - - - A5 - F5 - | B5 - - - G5 - D5 - | G5 - - - E5 - B4 - | C5 - - - E5 - - - | A5 - - - F5 - C5 - | D5 - - - G5 - B5 - | G#5 - - - E5 - - - | A5 - - - - - . .",
      bass: "@F @G @Em @Am @F @G @E @Am",
      drums: "@patter",
    },
  },
  order: ["A", "B"],
};

/** Evening: counting up the day in the ledger, upgrades and the week's report. Mellow G major, no drums. */
export const EVENING_SONG: Song = {
  title: "Evening Ledger",
  bpm: 84,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.09, attack: 0.02, sustain: 0.55, gate: 0.85, vibrato: { depth: 8, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.45 },
    bass: { volume: 0.28, gate: 0.8 },
  },
  patterns: {
    G: "G2 - - - D2 - - -", Em: "E2 - - - B1 - - -", C: "C3 - - - G2 - - -", D: "D2 - - - A2 - - -", Am: "A2 - - - E2 - - -", AmD: "A2 - - - D2 - - -",
    hG: ". . G3+47 . . . G3+47 .", hEm: ". . E4+37 . . . E4+37 .", hC: ". . C4+47 . . . C4+47 .", hD: ". . D4+47 . . . D4+47 .",
    hAm: ". . A3+37 . . . A3+37 .", hAmD: ". . A3+37 . . . D4+47 .",
  },
  sections: {
    A: {
      lead: "B4 - - - D5 - G5 - | E5 - - - B4 - - - | C5 - E5 - G5 - E5 - | F#5 - - - D5 - - - | B4 - - - D5 - B5 - | G5 - - - E5 - - - | C5 - - - A4 - F#4 - | G4 - - - - - . .",
      harmony: "@hG @hEm @hC @hD @hG @hEm @hAmD @hG",
      bass: "@G @Em @C @D @G @Em @AmD @G",
    },
    B: {
      lead: "E5 - - - G5 - C6 - | B5 - - - G5 - - - | A5 - - - E5 - C5 - | D5 - - - - - - - | E5 - - - G5 - A5 - | B5 - - - D6 - - - | C6 - - - A5 - F#5 - | G5 - - - - - . .",
      harmony: "@hC @hG @hAm @hD @hC @hG @hAmD @hG",
      bass: "@C @G @Am @D @C @G @AmD @G",
    },
  },
  order: ["A", "B"],
};

/** The stand opens for the day. */
export const STAND_OPEN: Jingle = {
  title: "Stand Open",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.17 }, harmony: { duty: 0.25, volume: 0.06 } },
  sections: {
    J: {
      lead: "C6 . . . C6 . . . | G5 . A5 . B5 . C6 . | E6 - - - . . . .",
      harmony: "E5 . . . E5 . . . | E5 . F5 . G5 . A5 . | C6 - - - . . . .",
      bass: "C3 . . . G2 . . . | G2 . . . G2 . . . | C3 - - - . . . .",
      drums: "k . . . k . . . | s . s . s . s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The day is done: the evening ledger opens. */
export const DAY_DONE: Jingle = {
  title: "Day Done",
  bpm: 120,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.16 }, harmony: { duty: 0.125, volume: 0.05 } },
  sections: {
    J: {
      lead: "D5 . G5 . B5 . A5 . | G5 . E5 . D5 - - - | G5 - - - - - . .",
      harmony: "B4 . D5 . G5 . F#5 . | E5 . C5 . B4 - - - | D5 - - - - - . .",
      bass: "G2 . . . D3 . . . | C3 . . . D3 . . . | G2 - - - - - . .",
    },
  },
  order: ["J"],
};

/** An upgrade for the cart (sign, umbrella, counter, cooler). */
export const UPGRADE: Jingle = {
  title: "Cart Upgrade",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.17 } },
  sections: {
    J: {
      lead: "G5 . B5 . D6 . G6 - | - - - - . . . .",
      bass: "G2 . . . D3 . . . | G2 - - - . . . .",
      drums: "k . . . s . . . | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The week is over: the report. */
export const WEEK_DONE: Jingle = {
  title: "Week Wrapped",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.125, volume: 0.06 } },
  sections: {
    J: {
      lead: "C5 . E5 . G5 . C6 . | A5 . C6 . F6 - - - | E6 . D6 . C6 . D6 . | C6 - - - - - . .",
      harmony: "G4 . C5 . E5 . G5 . | F5 . A5 . C6 - - - | C6 . B5 . A5 . B5 . | G5 - - - - - . .",
      bass: "C3 . . . G2 . . . | F2 . . . F3 . . . | G2 . . . G2 . . . | C2 - - - - - . .",
      drums: "k . h . s . h . | k . h . s . h . | k . h . s . s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { rush: RUSH_SONG, rain: RAIN_SONG, morning: MORNING_SONG, evening: EVENING_SONG };
export const JINGLES: Record<string, Jingle> = { open: STAND_OPEN, dayDone: DAY_DONE, upgrade: UPGRADE, week: WEEK_DONE };

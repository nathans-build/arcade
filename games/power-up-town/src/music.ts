/*
 * Power Up Town's soundtrack: original 4-channel chiptunes for the kit's ChipAudio
 * (see src/kit/README.md). The snowy town map, the circuit workbench (thins to lead + bass
 * during a Science Check), the heat lab, a fast electric Sparky Run, and jingles for lights on,
 * circuit complete, a friendly short-circuit "bzzt", a building powered and the whole town lit.
 */
import type { Jingle, Song } from "@/kit/audio";

/** The town map: a cozy F-major tune with soft sleigh-bell hats. */
export const TOWN_SONG: Song = {
  title: "Snowy Main Street",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.16, gate: 0.9, vibrato: { depth: 14, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.05, gate: 1 },
    bass: { volume: 0.4, gate: 0.7 },
    drums: { volume: 0.22 },
  },
  patterns: {
    a1: "A4 - C5 - F5 - E5 D5 | C5 - - - A4 - G4 -",
    a2: "F4 - A4 - C5 - D5 C5 | Bb4 - - - G4 - - -",
    a3: "A4 - C5 - F5 - G5 F5 | E5 - D5 - C5 - A4 -",
    a4: "Bb4 - A4 - G4 - E4 - | F4 - - - - - . .",
    b1: "D5 - D5 E5 F5 - D5 - | C5 - A4 - F4 - - -",
    b2: "Bb4 - Bb4 C5 D5 - Bb4 - | A4 - - - . . . .",
    b3: "G4 - A4 - Bb4 - C5 - | D5 - E5 - F5 - - -",
    b4: "G5 - F5 - E5 - C5 - | F5 - - - - - . .",
    F: "F2 . C3 . F2 . C3 .",
    C: "C3 . G2 . C3 . G2 .",
    Gm: "G2 . D3 . G2 . D3 .",
    Bb: "Bb2 . F3 . Bb2 . F3 .",
    Dm: "D3 . A2 . D3 . A2 .",
    hF: "F4+47 -*7",
    hC: "C4+47 -*7",
    hGm: "G4+37 -*7",
    hBb: "Bb3+47 -*7",
    hDm: "D4+37 -*7",
    bells: "k . h . h . h h | . . h . h . h .",
  },
  sections: {
    A: { lead: "@a1 @a2 @a3 @a4", harmony: "@hF @hC @hF @hGm @hF @hC @hBb @hF", bass: "@F @C @F @Gm @F @C @Bb @F", drums: "@bells" },
    B: { lead: "@b1 @b2 @b3 @b4", harmony: "@hDm @hF @hBb @hF @hGm @hC @hC @hF", bass: "@Dm @F @Bb @F @Gm @C @C @F", drums: "@bells" },
  },
  order: ["A", "B"],
  loopTo: 0,
};

/** The circuit workbench: a calm A-minor thinking groove with rolling arpeggios. */
export const WORKBENCH_SONG: Song = {
  title: "Workbench Focus",
  bpm: 112,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.13, gate: 0.85, vibrato: { depth: 10, rate: 5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.05, gate: 0.6 },
    bass: { volume: 0.4, gate: 0.9 },
    drums: { volume: 0.2 },
  },
  patterns: {
    w1: "E5 . . . C5 . D5 . | E5 . G5 . E5 - - .",
    w2: "D5 . . . B4 . C5 . | D5 . E5 . C5 - - .",
    w3: "A4 . C5 . E5 . A5 . | G5 - E5 . D5 - - .",
    w4: "C5 . B4 . A4 . G4 . | A4 - - - . . . .",
    w5: "A5 . . . G5 . E5 . | F5 . E5 . D5 - - .",
    w6: "E5 . . . D5 . C5 . | D5 . C5 . B4 - - .",
    w7: "C5 . E5 . A5 . E5 . | F5 - E5 . D5 - B4 .",
    w8: "C5 . B4 . G#4 . B4 . | A4 - - - . . . .",
    Am: "A2 . . . E3 . . .",
    C: "C3 . . . G2 . . .",
    G: "G2 . . . D3 . . .",
    F: "F2 . . . C3 . . .",
    Dm: "D3 . . . A2 . . .",
    E: "E2 . . . B2 . . .",
    hAm: "A3 C4 E4 C4 A3 C4 E4 C4",
    hC: "C4 E4 G4 E4 C4 E4 G4 E4",
    hG: "G3 B3 D4 B3 G3 B3 D4 B3",
    hF: "F3 A3 C4 A3 F3 A3 C4 A3",
    hDm: "D4 F4 A4 F4 D4 F4 A4 F4",
    hE: "E3 G#3 B3 G#3 E3 G#3 B3 G#3",
    tick: "k . h . s . h . | k . h h s . h .",
  },
  sections: {
    A: { lead: "@w1 @w2 @w3 @w4", harmony: "@hAm @hC @hG @hAm @hAm @hG @hF @hAm", bass: "@Am @C @G @Am @Am @G @F @Am", drums: "@tick" },
    B: { lead: "@w5 @w6 @w7 @w8", harmony: "@hAm @hDm @hC @hG @hAm @hDm @hE @hAm", bass: "@Am @Dm @C @G @Am @Dm @E @Am", drums: "@tick" },
  },
  order: ["A", "B"],
  loopTo: 0,
};

/** Sparky's Run: a fast E-minor gallop with a driving octave bass and an echoing lead. */
export const RUN_SONG: Song = {
  title: "Sparky Dash",
  bpm: 168,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.17, gate: 0.75 },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
    bass: { volume: 0.44, gate: 0.6 },
    drums: { volume: 0.34 },
  },
  patterns: {
    r1: "E5 . G5 . B5 . G5 . | A5 . G5 . F#5 . E5 .",
    r2: "D5 . F#5 . A5 . F#5 . | G5 . F#5 . E5 . D5 .",
    r3: "E5 . G5 . B5 . E6 . | D6 . B5 . A5 . B5 .",
    r4: "C6 . B5 . A5 . G5 . | F#5 - - - D#5 - - -",
    s1: "B5 B5 . B5 A5 . G5 . | A5 A5 . A5 G5 . F#5 .",
    s2: "G5 G5 . G5 F#5 . E5 . | F#5 - - - B4 - - -",
    s3: "E5 F#5 G5 A5 B5 . E6 . | D6 . C6 . B5 . A5 .",
    s4: "G5 . F#5 . E5 . D#5 . | E5 - - - . . . .",
    Em: "E2 E3 E2 E3 E2 E3 E2 E3",
    Am: "A1 A2 A1 A2 A1 A2 A1 A2",
    D: "D2 D3 D2 D3 D2 D3 D2 D3",
    G: "G1 G2 G1 G2 G1 G2 G1 G2",
    B: "B1 B2 B1 B2 B1 B2 B1 B2",
    C: "C2 C3 C2 C3 C2 C3 C2 C3",
    beat: "k . h . s . h . | k . h k s . h h",
    fill: "k . h . s . h . | k k s . s s s s",
  },
  sections: {
    A: { lead: "@r1 @r2 @r3 @r4", bass: "@Em @Am @D @G @Em @B @C @B", drums: "@beat @beat @beat @fill" },
    B: { lead: "@s1 @s2 @s3 @s4", bass: "@Em @D @C @B @Em @Am @B @Em", drums: "@beat @beat @beat @fill" },
  },
  order: ["A", "B", "A"],
  loopTo: 0,
};

/** The heat lab: a bubbly D-dorian tune, like something simmering on the stove. */
export const HEATLAB_SONG: Song = {
  title: "Heat Lab Simmer",
  bpm: 120,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.15, gate: 0.8, vibrato: { depth: 12, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.05, gate: 1 },
    bass: { volume: 0.42, gate: 0.7 },
    drums: { volume: 0.24 },
  },
  patterns: {
    h1: "D5 . F5 . A5 . F5 . | G5 . E5 . C5 . E5 .",
    h2: "F5 . D5 . A4 . D5 . | E5 - - - C5 - - -",
    h3: "D5 . F5 . A5 . C6 . | B5 . G5 . E5 . G5 .",
    h4: "A5 . G5 . F5 . E5 . | D5 - - - . . . .",
    k1: "A5 - - . G5 . F5 . | G5 - - . F5 . E5 .",
    k2: "F5 - - . E5 . D5 . | C5 - - - A4 - - -",
    k3: "B4 . C5 . D5 . E5 . | F5 . G5 . A5 . B5 .",
    k4: "C6 . A5 . G5 . E5 . | D5 - - - - - . .",
    Dm: "D3 . A2 . D3 . A2 .",
    C: "C3 . G2 . C3 . G2 .",
    G: "G2 . D3 . G2 . D3 .",
    F: "F2 . C3 . F2 . C3 .",
    Bb: "Bb2 . F3 . Bb2 . F3 .",
    Am: "A2 . E3 . A2 . E3 .",
    xDm: "D4+37 -*7",
    xC: "C4+47 -*7",
    xG: "G3+47 -*7",
    xF: "F3+47 -*7",
    xBb: "Bb3+47 -*7",
    xAm: "A3+37 -*7",
    bubble: "k . h . s h . h",
  },
  sections: {
    A: { lead: "@h1 @h2 @h3 @h4", harmony: "@xDm @xC @xDm @xC @xDm @xG @xF @xDm", bass: "@Dm @C @Dm @C @Dm @G @F @Dm", drums: "@bubble" },
    B: { lead: "@k1 @k2 @k3 @k4", harmony: "@xF @xC @xBb @xF @xG @xG @xAm @xDm", bass: "@F @C @Bb @F @G @G @Am @Dm", drums: "@bubble" },
  },
  order: ["A", "B"],
  loopTo: 0,
};

export const LIGHTS_ON: Jingle = {
  title: "Lights On",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.07 } },
  sections: {
    J: {
      lead: "C5 . E5 . G5 . C6 - - - - - . . . .",
      harmony: "E4 . G4 . C5 . E5 - - - - - . . . .",
      bass: "C3 . . . G2 . . . C3 - - - . . . .",
      drums: "k . . . h . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

export const CIRCUIT_COMPLETE: Jingle = {
  title: "Circuit Complete",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.5, volume: 0.06 } },
  sections: {
    J: {
      lead: "G4 . C5 . E5 . G5 . | E5 . G5 . C6 - - - | . . . . . . . .",
      harmony: "E4 . G4 . C5 . E5 . | C5 . E5 . G5 - - - | . . . . . . . .",
      bass: "C3 . . . C3 . . . | G2 . . . C3 - - - | . . . . . . . .",
      drums: "k . h . s . h . | k . h . s s s . | . . . . . . . .",
    },
  },
  order: ["J"],
};

/** A friendly short-circuit "bzzt": a wobble, a sputter and a silly drop. */
export const SHORT_BZZT: Jingle = {
  title: "Bzzt!",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.17 } },
  sections: {
    J: {
      lead: "C5 C#5 C5 C#5 C5 C#5 C5 . | G4 . . . E4 - - .",
      bass: "C3 . C3 . C3 . . . | C2 - - - . . . .",
      drums: "s s s s . s . . | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const BUILDING_POWERED: Jingle = {
  title: "Building Powered",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 14, rate: 6, delay: 0.25 } }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "F4 . A4 . C5 . F5 . | E5 - C5 - G5 - - - | A5 - F5 - C6 - - - | A5 - - - - - - .",
      harmony: "F3+47 -*7 C4+47 -*7 F3+47 -*7 F3+47 - - - - - - .",
      bass: "F2 . F2 . F2 . F2 . | C3 . C3 . C3 . C3 . | F2 . F2 . F2 . F2 . | F2 - - - - - - .",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The finale: every window in town glows. */
export const TOWN_LIT: Jingle = {
  title: "Town Fully Lit",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.22, vibrato: { depth: 16, rate: 6, delay: 0.2 } }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "C5 . F5 . A5 . C6 . | A5 . C6 . F5 - - - | Bb5 . A5 . G5 . F5 . | G5 - - - C5 - - - | D5 . F5 . Bb5 . D6 . | C6 - A5 - F5 - A5 - | G5 - - - E5 - - - | F5 - - - - - - .",
      harmony: "F4+47 -*7 F4+47 -*7 Bb3+47 -*7 C4+47 -*7 Bb3+47 -*7 F4+47 -*7 C4+47 -*7 F4+47 - - - - - - .",
      bass: "F2 . C3 . F2 . C3 . | F2 . C3 . F2 . C3 . | Bb2 . F3 . Bb2 . F3 . | C3 . G2 . C3 . G2 . | Bb2 . F3 . Bb2 . F3 . | F2 . C3 . F2 . C3 . | C3 . G2 . C3 . E3 . | F2 - - - - - - .",
      drums: "k . h . s . h . | k . h . s . h . | k . h . s . h . | k . h . s s s s | k . h . s . h . | k . h . s . h . | k . s . k . s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const RUN_CLEAR: Jingle = {
  title: "Run Clear",
  bpm: 170,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 } },
  sections: {
    J: {
      lead: "E5 G5 B5 E6 . . B5 . | E6 - - - . . . .",
      harmony: "B4 E5 G5 B5 . . G5 . | B5 - - - . . . .",
      bass: "E2 . E3 . E2 . E3 . | E2 - - - . . . .",
      drums: "k h s h k h s h | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { town: TOWN_SONG, workbench: WORKBENCH_SONG, run: RUN_SONG, heatlab: HEATLAB_SONG };
export const JINGLES: Record<string, Jingle> = {
  lightsOn: LIGHTS_ON, circuitComplete: CIRCUIT_COMPLETE, shortBzzt: SHORT_BZZT, buildingPowered: BUILDING_POWERED, townLit: TOWN_LIT, runClear: RUN_CLEAR,
};

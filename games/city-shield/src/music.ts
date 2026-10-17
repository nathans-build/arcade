/*
 * City Shield's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2) unless a jingle says otherwise, so a 4/4 bar is 8 tokens; "|" marks the bars.
 * While the between-wave question is open the game thins the band to lead + bass.
 */
import type { Jingle, Song } from "@/kit/audio";

/** TARGET waves: a watchful C-minor night patrol over a steady bass, with searchlight notes in the intro. */
export const NIGHT_WATCH_SONG: Song = {
  title: "Night Watch",
  bpm: 128,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 14, rate: 5.5, delay: 0.28 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
    bass: { volume: 0.5 },
    drums: { volume: 0.42 },
  },
  patterns: {
    n1: "G4 . C5 . Eb5 . D5 C5 | D5 - - - G4 - - -",
    n2: "Ab4 . C5 . F5 . Eb5 D5 | Eb5 - - - - - . .",
    n3: "G4 . C5 . Eb5 . G5 F5 | Eb5 - D5 - C5 - Bb4 -",
    n4: "Ab4 . Bb4 . C5 . D5 . | C5 - - - - - . .",
    m1: "Eb5 - - - F5 - G5 - | Ab5 - G5 - F5 - Eb5 -",
    m2: "D5 - - - Eb5 - F5 - | G5 - - - - - . .",
    m3: "Eb5 - - - F5 - G5 - | Bb5 - Ab5 - G5 - F5 -",
    m4: "G5 - F5 - Eb5 - D5 - | B4 - - - D5 - - -",
    Cm: "C2 . G2 C3 G2 . C2 G2",
    Ab: "Ab1 . Eb2 Ab2 Eb2 . Ab1 Eb2",
    Bb: "Bb1 . F2 Bb2 F2 . Bb1 F2",
    Fm: "F2 . C3 F3 C3 . F2 C3",
    G: "G1 . D2 G2 D2 . G1 D2",
    Eb: "Eb2 . Bb2 Eb3 Bb2 . Eb2 Bb2",
    beat: "k . h k s . h . | k . h . s . h h",
  },
  sections: {
    intro: {
      harmony: "G4 - - - - - . . | Ab4 - - - - - . .",
      bass: "@Cm @Ab",
      drums: "k . . . . . . . | k . . . s . s .",
    },
    A1: { lead: "@n1 @n2", bass: "@Cm @G @Fm @Eb", drums: "@beat" },
    A2: { lead: "@n3 @n4", bass: "@Cm @Eb @Bb @Cm", drums: "@beat" },
    B: { lead: "@m1 @m2", bass: "@Ab @Fm @Bb @Eb", drums: "k . h k s . h k" },
    B2: { lead: "@m3 @m4", bass: "@Ab @Eb @Fm @G", drums: "k . h k s . h k | k . h k s s s s" },
    C: {
      lead: "C5 - - - - - - - | Bb4 - - - - - - - | Ab4 - - - - - - - | G4 - - - B4 - D5 -",
      harmony: "C4+37 -*7 Bb3+47 -*7 Ab3+47 -*7 G3+47 -*7",
      bass: "@Cm @Bb @Ab @G",
      drums: "k . h . s . h . | k . h . s . h h",
    },
  },
  order: ["intro", "A1", "A2", "B", "B2", "A1", "C"],
  loopTo: 1,
};

/** STOP THE WRONG ANSWERS waves (every third wave): an urgent D-minor alarm with see-sawing notes. */
export const RED_ALERT_SONG: Song = {
  title: "Red Alert",
  bpm: 152,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.14, gate: 0.8, vibrato: { depth: 16, rate: 7, delay: 0.2 } },
    harmony: { duty: 0.25, volume: 0.06 },
    bass: { volume: 0.5 },
    drums: { volume: 0.5 },
  },
  patterns: {
    r1: "D5 F5 D5 F5 E5 G5 E5 G5 | F5 A5 F5 A5 G5 - E5 -",
    r2: "D5 F5 D5 F5 E5 G5 E5 G5 | A5 - C6 - A5 - - -",
    r3: "Bb4 D5 Bb4 D5 C5 E5 C5 E5 | D5 F5 D5 F5 E5 - C#5 -",
    r4: "D5 - - - A4 - - - | D5 - - - - - . .",
    Dm: "D2 D3 D2 D3 D2 D3 D2 D3",
    C: "C2 C3 C2 C3 C2 C3 C2 C3",
    Bb: "Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2",
    A: "A1 A2 A1 A2 A1 A2 A1 A2",
    Gm: "G1 G2 G1 G2 G1 G2 G1 G2",
    F: "F1 F2 F1 F2 F1 F2 F1 F2",
    beat: "kh h sh h kh h sh sh",
  },
  sections: {
    intro: { harmony: "D4+37 -*7 A3+47 -*7", bass: "@Dm @A", drums: "s . s . s . s . | s s s s s s s s" },
    A: { lead: "@r1 @r2", bass: "@Dm @Bb @Dm @F", drums: "@beat" },
    B: { lead: "@r3 @r4", bass: "@Bb @A @Gm @Dm", drums: "@beat" },
    C: {
      lead: "A5 - - - - - - - | G5 - - - - - - - | F5 - - - - - - - | E5 - C#5 - E5 - G5 -",
      harmony: "D4+37 -*7 C4+47 -*7 Bb3+47 -*7 A3+47 -*7",
      bass: "@Dm @C @Bb @A",
      drums: "k . s . k k s . | k . s . k k s s",
    },
  },
  order: ["intro", "A", "B", "A", "C", "B"],
  loopTo: 1,
};

/** A wave is over and cities are still standing. */
export const CITIES_SAFE: Jingle = {
  title: "Cities Safe",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 12, rate: 6, delay: 0.25 } }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "G4 . C5 . Eb5 . F5 . G5 - - - Bb5 - - - C6 - - - - - - - . .",
      harmony: "Eb4 . G4 . C5 . D5 . Eb5 - - - F5 - - - E5 - - - - - - - . .",
      bass: "C2 . . . C3 . . . Eb2 - - - Bb2 - - - C2 - - - - - - - . .",
      drums: "k . . . s . . . k . . . s . . . k . . . . . . . . .",
    },
  },
  order: ["J"],
};

/** A right answer to the between-wave question: a city is rebuilt (or a bonus). */
export const CITY_REBUILT: Jingle = {
  title: "City Rebuilt",
  bpm: 160,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "C5 E5 G5 C6 - - . . . .",
      harmony: "G4 C5 E5 G5 - - . . . .",
      bass: "C3 . . C2 - - . . . .",
      drums: "k . . s . . . . . .",
    },
  },
  order: ["J"],
};

/** Every city has fallen. */
export const GAME_OVER: Jingle = {
  title: "Lights Out",
  bpm: 88,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 14, rate: 5, delay: 0.3 } } },
  sections: {
    J: {
      lead: "G4 - - - F4 - Eb4 - | D4 - - - C4 - - -",
      bass: "C2 - - - Ab1 - - - | G1 - - - C2 - - -",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { nightWatch: NIGHT_WATCH_SONG, redAlert: RED_ALERT_SONG };
export const JINGLES: Record<string, Jingle> = { citiesSafe: CITIES_SAFE, cityRebuilt: CITY_REBUILT, gameOver: GAME_OVER };

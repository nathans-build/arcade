/*
 * Silly Story Studio's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see
 * src/kit/README.md). It's a reading and writing game, so the music is soft and unhurried: a goofy
 * little oom-pah for the menus, a calm doodling tune while you fill in words or write, and a gentle
 * "curtain call" under the big reveal. It ducks under read-aloud. No keyboard shortcuts (typing is input).
 */
import type { Jingle, Song } from "@/kit/audio";

/** Title, story picker and shelf: a bouncy F-major oom-pah with a cheeky chromatic hiccup. */
export const WORKSHOP_SONG: Song = {
  title: "Giggle Workshop",
  bpm: 112,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.12, gate: 0.6, vibrato: { depth: 10, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.04, gate: 0.4 },
    bass: { volume: 0.34, gate: 0.5 },
    drums: { volume: 0.14 },
  },
  patterns: {
    a: "C5 . F5 . A5 . G#5 A5 | F5 - - - D5 . . . | Bb4 . D5 . G5 . E5 . | F5 - - - . . C5 . | A5 . C6 . A5 . F5 . | D5 - F5 - Bb5 - - . | B4 . D5 . F5 . G5 . | E5 - - - G5 . Bb4 .",
    b: "D5 . . D5 F5 . . . | C5 . . C5 A4 . . . | E5 . G5 . C6 . Bb5 . | A5 - - - . . . . | D6 . . C6 Bb5 . . . | A5 . . G5 F5 . . . | G5 . F5 . E5 . D5 . | F5 - - - . . . .",
    F: "F2 . C3 . F2 . C3 .", Dm: "D2 . A2 . D2 . A2 .", GmC: "G2 . D3 . C3 . G2 .", Bb: "Bb1 . F2 . Bb1 . F2 .", G7: "G2 . D3 . G2 . B2 .",
    C7: "C3 . G2 . C3 . Bb2 .", C: "C3 . G2 . C3 . G2 .", G7C7: "G2 . D3 . C3 . G2 .",
    hF: ". . F4+47 . . . F4+47 .", hDm: ". . D4+37 . . . D4+37 .", hGm: ". . G3+37 . . . C4+47 .", hBb: ". . Bb3+47 . . . Bb3+47 .",
    hG7: ". . G3+47a . . . G3+47a .", hC7: ". . C4+47a . . . C4+47a .", hC: ". . C4+47 . . . C4+47 .",
    bop: "k . h . s . h . | k . h . s . t t",
  },
  sections: {
    A: { lead: "@a", harmony: "@hF @hDm @hGm @hF @hF @hBb @hG7 @hC7", bass: "@F @Dm @GmC @F @F @Bb @G7 @C7", drums: "@bop" },
    B: { lead: "@b", harmony: "@hBb @hF @hC @hF @hBb @hF @hG7 @hF", bass: "@Bb @F @C @F @Bb @F @G7C7 @F", drums: "@bop" },
  },
  order: ["A", "B"],
};

/** Filling in words and writing your own story: a calm A-major doodle, no drums, nothing to race. */
export const DOODLE_SONG: Song = {
  title: "Pencil Doodle",
  bpm: 92,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.085, attack: 0.02, sustain: 0.5, gate: 0.85, vibrato: { depth: 8, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.45 },
    bass: { volume: 0.28, gate: 0.85 },
  },
  patterns: {
    A: "A2 - - - E2 - - -", Fsm: "F#2 - - - C#3 - - -", D: "D2 - - - A2 - - -", E: "E2 - - - B2 - - -", Bm: "B1 - - - F#2 - - -",
    Csm: "C#2 - - - G#2 - - -", BmE: "B1 - - - E2 - - -",
    hA: ". . A3+47 . . . A3+47 .", hFsm: ". . F#3+37 . . . F#3+37 .", hD: ". . D4+47 . . . D4+47 .", hE: ". . E3+47 . . . E3+47 .",
    hBm: ". . B3+37 . . . B3+37 .", hCsm: ". . C#4+37 . . . C#4+37 .", hBmE: ". . B3+37 . . . E3+47 .",
  },
  sections: {
    A: {
      lead: "C#5 - - - E5 - A5 - | F#5 - - - C#5 - - - | D5 - F#5 - A5 - - - | G#5 - - - E5 - - - | C#5 - - - E5 - A5 - | B5 - - - A5 - F#5 - | D5 - - - G#4 - B4 - | A4 - - - - - . .",
      harmony: "@hA @hFsm @hD @hE @hA @hFsm @hBmE @hA",
      bass: "@A @Fsm @D @E @A @Fsm @BmE @A",
    },
    B: {
      lead: "F#5 - - - E5 - D5 - | C#5 - - - A4 - - - | D5 - - - F#5 - B5 - | G#5 - - - - - - - | A5 - - - F#5 - D5 - | E5 - - - C#5 - - - | B4 - D5 - E5 - G#5 - | A5 - - - - - . .",
      harmony: "@hD @hA @hBm @hE @hD @hCsm @hBmE @hA",
      bass: "@D @A @Bm @E @D @Csm @BmE @A",
    },
  },
  order: ["A", "B"],
};

/** The reveal: a gentle C-major curtain-call march that sits under the story being read aloud. */
export const CURTAIN_SONG: Song = {
  title: "Curtain Call",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.1, gate: 0.75, vibrato: { depth: 9, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.5, volume: 0.035, gate: 0.4 },
    bass: { volume: 0.3, gate: 0.6 },
    drums: { volume: 0.13 },
  },
  patterns: {
    C: "C3 . G2 . C3 . G2 .", G: "G2 . D3 . G2 . D3 .", Am: "A2 . E2 . A2 . E2 .", E: "E2 . B2 . E2 . G#2 .", F: "F2 . C3 . F2 . C3 .",
    D7: "D3 . A2 . D3 . C3 .",
    hC: ". C4+47 . . . C4+47 . .", hG: ". B3+38 . . . B3+38 . .", hAm: ". A3+37 . . . A3+37 . .", hE: ". G#3+38 . . . G#3+38 . .",
    hF: ". A3+38 . . . A3+38 . .", hD7: ". D4+47a . . . D4+47a . .",
    step: "k . . . s . . . | k . k . s . . .",
  },
  sections: {
    A: {
      lead: "G5 - E5 - C5 - E5 - | D5 - B4 - G4 - . . | A4 - C5 - E5 - A5 - | G#5 - - - E5 - . . | F5 - A5 - C6 - A5 - | G5 - E5 - C5 - . . | D5 - F#5 - A5 - C6 - | B5 - - - G5 - . .",
      harmony: "@hC @hG @hAm @hE @hF @hC @hD7 @hG",
      bass: "@C @G @Am @E @F @C @D7 @G",
      drums: "@step",
    },
    B: {
      lead: "A5 . A5 . C6 - A5 - | G5 - - - E5 - . . | F5 . F5 . A5 - F5 - | D5 - - - B4 - . . | A4 - C5 - F5 - A5 - | G5 - E5 - C5 - E5 - | D5 - - - G5 - - - | C5 - - - - - . .",
      harmony: "@hF @hC @hF @hG @hF @hC @hG @hC",
      bass: "@F @C @F @G @F @C @G @C",
      drums: "@step",
    },
  },
  order: ["A", "B"],
};

/** The story is finished: a goofy ta-da with a slide-up hiccup. */
export const STORY_READY: Jingle = {
  title: "Ta-Da Story",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.125, volume: 0.07 } },
  sections: {
    J: {
      lead: "G4 . C5 . E5 . G5 . | F#5 G5 . . C6 - - - | - - - - . . . .",
      harmony: "E4 . G4 . C5 . E5 . | D#5 E5 . . E5 - - - | - - - - . . . .",
      bass: "C3 . . . G2 . . . | C3 . . . C2 - - - | - - - - . . . .",
      drums: "k . . . s . . . | k . s s k . . . | . . . . . . . .",
    },
  },
  order: ["J"],
};

/** A story goes on the shelf. */
export const SHELVED: Jingle = {
  title: "On the Shelf",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.16 } },
  sections: {
    J: {
      lead: "E5 . G5 . C6 - - - | - - . .",
      bass: "C3 . . . C3 - - - | - - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { workshop: WORKSHOP_SONG, doodle: DOODLE_SONG, curtain: CURTAIN_SONG };
export const JINGLES: Record<string, Jingle> = { ready: STORY_READY, shelved: SHELVED };

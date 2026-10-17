/*
 * Clue Compass's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * A reading-and-geography chase, so the music is calm and curious (a tiptoeing walk, never a siren),
 * ducks under read-aloud, thins to lead + bass while you read a dead-end lesson or a transmission,
 * and only nudges the tempo when the compass charges run low or you're picking the hideout.
 * Nothing here borrows from any other detective game's music.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Title and mission report: a breezy D-major tune for Pip, flapping over the map. */
export const TITLE_SONG: Song = {
  title: "Pip's Lookout",
  bpm: 110,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.12, gate: 0.7, vibrato: { depth: 9, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.04, gate: 0.45 },
    bass: { volume: 0.34, gate: 0.6 },
    drums: { volume: 0.14 },
  },
  patterns: {
    D: "D2 . A2 . D3 . A2 .", A: "A2 . E2 . A2 . E2 .", Bm: "B1 . F#2 . B2 . F#2 .", G: "G2 . D3 . G2 . D3 .", GA: "G2 . D3 . A2 . E2 .",
    Em: "E2 . B2 . E2 . B2 .", EmA: "E2 . B2 . A2 . E2 .",
    hD: ". . D4+47 . . . D4+47 .", hA: ". . A3+47 . . . A3+47 .", hBm: ". . B3+37 . . . B3+37 .", hG: ". . G3+47 . . . G3+47 .",
    hGA: ". . G3+47 . . . A3+47 .", hEm: ". . E4+37 . . . E4+37 .", hEmA: ". . E4+37 . . . A3+47 .",
    flap: "k . h . s . h h",
  },
  sections: {
    A: {
      lead: "A5 . F#5 . D5 . F#5 . | E5 - - - C#5 - - - | D5 . F#5 . B5 . A5 . | G5 - - - B4 - - - | A5 . F#5 . D5 . A5 . | C#6 - - - A5 - - - | B5 . G5 . A5 . E5 . | D5 - - - - - . .",
      harmony: "@hD @hA @hBm @hG @hD @hA @hGA @hD",
      bass: "@D @A @Bm @G @D @A @GA @D",
      drums: "@flap",
    },
    B: {
      lead: "B4 - D5 - G5 - - - | F#5 - - - D5 - - - | E5 - G5 - B5 - - - | A5 - - - - - - - | B5 - - - G5 - D5 - | F#5 - - - A5 - - - | G5 - E5 - C#5 - E5 - | D5 - - - - - . .",
      harmony: "@hG @hD @hEm @hA @hG @hD @hEmA @hD",
      bass: "@G @D @Em @A @G @D @EmA @D",
      drums: "@flap",
    },
  },
  order: ["A", "B"],
};

/** On the case: a curious G-mixolydian tiptoe over a walking bass (calm, for reading clues). */
export const CASE_SONG: Song = {
  title: "Trail of IOUs",
  bpm: 96,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.1, gate: 0.7, vibrato: { depth: 8, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.035, gate: 0.4 },
    bass: { volume: 0.32, gate: 0.45 },
    drums: { volume: 0.1 },
  },
  patterns: {
    G: "G2 . B2 . D3 . B2 .", F: "F2 . A2 . C3 . A2 .", C: "C3 . E3 . G2 . E3 .", Em: "E2 . G2 . B2 . G2 .", D: "D2 . F#2 . A2 . F#2 .",
    Am: "A2 . C3 . E3 . C3 .",
    hG: ". . . . G3+47 . . .", hF: ". . . . F3+47 . . .", hC: ". . . . C4+47 . . .", hEm: ". . . . E4+37 . . .", hD: ". . . . D4+47 . . .",
    hAm: ". . . . A3+37 . . .",
    tiptoe: "k . h . s . h . | k . h . . . h .",
  },
  sections: {
    A: {
      lead: "D5 . . B4 . . D5 . | C5 - - - A4 - . . | E5 . . C5 . . E5 . | D5 - - - B4 - . . | G5 . . E5 . . B4 . | C5 - - - A4 - F5 - | F#5 - - - A5 - - - | D5 - - - - - . .",
      harmony: "@hG @hF @hC @hG @hEm @hF @hD @hD",
      bass: "@G @F @C @G @Em @F @D @D",
      drums: "@tiptoe",
    },
    B: {
      lead: "E5 - - - G5 - E5 - | D5 - - - B4 - - - | A4 - C5 - F5 - A5 - | G5 - - - E5 - - - | C5 - E5 - A5 - C6 - | B5 - - - F#5 - - - | A5 - G5 - F5 - C5 - | D5 - - - - - . .",
      harmony: "@hC @hG @hF @hC @hAm @hD @hF @hD",
      bass: "@C @G @F @C @Am @D @F @D",
      drums: "@tiptoe",
    },
  },
  order: ["A", "B"],
};

/** Pocket is caught at the hideout. */
export const GOTCHA: Jingle = {
  title: "Gotcha, Pocket!",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.125, volume: 0.06 } },
  sections: {
    J: {
      lead: "D5 . G5 . B5 . D6 . | C6 . A5 . F#5 . A5 . | G5 - - - D6 - - - | G6 - - - - - . .",
      harmony: "B4 . D5 . G5 . B5 . | A5 . F#5 . D5 . F#5 . | D5 - - - B5 - - - | D6 - - - - - . .",
      bass: "G2 . . . D3 . . . | D2 . . . A2 . . . | G2 . . . D3 . . . | G2 - - - - - . .",
      drums: "k . h . s . h . | k . h . s . s s | k . . . k . . . | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Out of compass charges: Pocket zips away (playful, not sad). */
export const ZIPPED: Jingle = {
  title: "Pocket Zipped Off",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.125, volume: 0.16 } },
  sections: {
    J: {
      lead: "G5 F#5 E5 D5 C5 B4 A4 G4 | . . . . B4 - - - | A4 - - - G4 - - - | . . . .",
      bass: "G2 . . . . . . . | . . . . D2 - - - | D2 - - - G1 - - - | . . . .",
      drums: "h h h h h h h h | . . . . k . . . | s . . . k . . . | . . . .",
    },
  },
  order: ["J"],
};

/** The mission report. */
export const REPORT: Jingle = {
  title: "Mission Report",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.17 }, harmony: { duty: 0.5, volume: 0.05 } },
  sections: {
    J: {
      lead: "A4 . D5 . F#5 . A5 - | - - G5 . F#5 . E5 - | - - F#5 - D5 - - - | - - - - . . . .",
      harmony: "F#4 . A4 . D5 . F#5 - | - - E5 . D5 . C#5 - | - - D5 - A4 - - - | - - - - . . . .",
      bass: "D3 . . . A2 . . . | G2 . . . A2 . . . | D2 - - - - - - - | - - - - . . . .",
      drums: "k . . . s . . . | k . . . s . . . | k . . . . . . . | . . . . . . . .",
    },
  },
  order: ["J"],
};

/** A transmission from Pip arrives between cases: a soft two-note coo. */
export const COO: Jingle = {
  title: "Pip's Transmission",
  bpm: 120,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.13, vibrato: { depth: 20, rate: 8, delay: 0.05 } } },
  sections: {
    J: {
      lead: "E5 - - - C5 - - - | E5 - C5 - - - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { case: CASE_SONG, title: TITLE_SONG };
export const JINGLES: Record<string, Jingle> = { gotcha: GOTCHA, zipped: ZIPPED, report: REPORT, coo: COO };

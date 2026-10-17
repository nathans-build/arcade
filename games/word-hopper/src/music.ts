/*
 * Word Hopper's soundtrack (K-2): original, very gentle 4-channel chiptunes for the kit's ChipAudio
 * (see src/kit/README.md). Read-aloud is constant here, so everything is quiet and slow, with no
 * busy drums, and the music ducks well down whenever Hoppy talks (duckLevel is set in WordHopper).
 */
import type { Jingle, Song } from "@/kit/audio";

/** The title, word garden and sticker book: a slow, sunny G-major stroll from lily pad to lily pad. */
export const GARDEN_SONG: Song = {
  title: "Lily Pad Stroll",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.085, attack: 0.02, sustain: 0.55, gate: 0.85, vibrato: { depth: 8, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.5 },
    bass: { volume: 0.28, gate: 0.8 },
    drums: { volume: 0.1 },
  },
  patterns: {
    a1: "B4 - D5 - G5 - - - | E5 - - - C5 - - -",
    a2: "D5 - B4 - G4 - B4 - | A4 - - - - - - -",
    a3: "B4 - D5 - G5 - A5 - | G5 - - - E5 - - -",
    a4: "D5 - - - F#5 - - - | G5 - - - - - . .",
    b1: "E5 - - - G5 - E5 - | D5 - - - B4 - - -",
    b2: "C5 - - - E5 - C5 - | A4 - - - D5 - - -",
    b3: "E5 - - - G5 - A5 - | B5 - - - G5 - - -",
    b4: "A5 - - - F#5 - - - | G5 - - - - - . .",
    G: "G2 - - - D3 - - -", C: "C3 - - - G2 - - -", D: "D3 - - - A2 - - -", Am: "A2 - - - E3 - - -",
    hG: ". . G4+47 . . . G4+47 .", hC: ". . C4+47 . . . C4+47 .", hD: ". . D4+47 . . . D4+47 .", hAm: ". . A3+37 . . . A3+37 .",
    tap: "k . . . h . . . | k . . . h . h .",
  },
  sections: {
    A: {
      lead: "@a1 @a2 @a3 @a4",
      harmony: "@hG @hC @hG @hD @hG @hC @hD @hG",
      bass: "@G @C @G @D @G @C @D @G",
      drums: "@tap",
    },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "@hC @hG @hAm @hD @hC @hG @hD @hG",
      bass: "@C @G @Am @D @C @G @D @G",
      drums: "@tap",
    },
  },
  order: ["A", "B"],
};

/** Inside an activity: a soft C-major waltz with no drums at all, so the words come first. */
export const POND_SONG: Song = {
  title: "Pond Waltz",
  bpm: 84,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.07, attack: 0.03, sustain: 0.5, gate: 0.9, vibrato: { depth: 7, rate: 4, delay: 0.4 } },
    harmony: { duty: 0.125, volume: 0.025, gate: 0.45 },
    bass: { volume: 0.24, gate: 0.85 },
  },
  patterns: {
    C: "C3 - - - G2 -", Am: "A2 - - - E2 -", F: "F2 - - - C3 -", G: "G2 - - - D3 -", Dm: "D3 - - - A2 -",
    hC: ". . C4+47 . C4+47 .", hAm: ". . A3+37 . A3+37 .", hF: ". . F3+47 . F3+47 .", hG: ". . G3+47 . G3+47 .", hDm: ". . D4+37 . D4+37 .",
  },
  sections: {
    A: {
      lead: "E5 - - - G5 - | A5 - - - E5 - | F5 - E5 - D5 - | D5 - - - - - | E5 - - - G5 - | C6 - - - A5 - | G5 - F5 - D5 - | C5 - - - - -",
      harmony: "@hC @hAm @hF @hG @hC @hAm @hDm @hC",
      bass: "@C @Am @F @G @C @Am @Dm @C",
    },
    B: {
      lead: "A5 - - - C6 - | G5 - - - E5 - | D5 - E5 - F5 - | E5 - - - - - | A5 - - - C6 - | G5 - - - E5 - | F5 - D5 - B4 - | C5 - - - - -",
      harmony: "@hF @hC @hG @hC @hF @hC @hG @hC",
      bass: "@F @C @G @C @F @C @G @C",
    },
  },
  order: ["A", "B"],
};

/** A round is done and a brand-new sticker goes in the book. */
export const NEW_STICKER: Jingle = {
  title: "New Sticker",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.13 }, harmony: { duty: 0.125, volume: 0.05 }, bass: { volume: 0.3 }, drums: { volume: 0.12 } },
  sections: {
    J: {
      lead: "G4 . B4 . D5 . G5 . | A5 . G5 . A5 . B5 - | - - - - D6 - - - | - - - - . . . .",
      harmony: "D4 . G4 . B4 . D5 . | F#5 . E5 . F#5 . G5 - | - - - - B5 - - - | - - - - . . . .",
      bass: "G2 . . . D3 . . . | D2 . . . D3 . . . | G2 - - - - - - - | . . . . . . . .",
      drums: "k . . . h . . . | k . . . h . h . | k . . . . . . . | . . . . . . . .",
    },
  },
  order: ["J"],
};

/** A round is done and a sticker you already had is added again. */
export const ANOTHER_STICKER: Jingle = {
  title: "Another Sticker",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.12 }, bass: { volume: 0.28 } },
  sections: {
    J: {
      lead: "D5 . G5 . B5 . A5 . | G5 - - - - - . .",
      bass: "G2 . . . D3 . . . | G2 - - - - - . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { garden: GARDEN_SONG, pond: POND_SONG };
export const JINGLES: Record<string, Jingle> = { newSticker: NEW_STICKER, anotherSticker: ANOTHER_STICKER };

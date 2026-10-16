/*
 * Kitchen Chemistry Café's soundtrack: original 4-channel chiptunes for the kit's ChipAudio
 * (see src/kit/README.md). The kitchen boogie speeds up a little as the rush goes on (grades 3+
 * only: K-2 never get time pressure) and thins to lead + bass during a Science Check.
 */
import type { Jingle, Song } from "@/kit/audio";

/** The kitchen: a G-major 12-bar boogie with a walking boogie bass and chord stabs. */
export const KITCHEN_SONG: Song = {
  title: "Kitchen Boogie",
  bpm: 132,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.18, gate: 0.8, vibrato: { depth: 12, rate: 6, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.06, gate: 0.4 },
    bass: { volume: 0.46, gate: 0.8 },
    drums: { volume: 0.38 },
  },
  patterns: {
    k1: "B4 D5 . E5 . G5 . E5 | D5 - B4 . G4 . . .",
    k2: "B4 D5 . E5 . G5 . A5 | Bb5 - A5 . G5 . . .",
    k3: "C5 E5 . G5 . A5 . G5 | Bb5 - A5 . G5 . E5 .",
    k4: "D5 - B4 . G4 . A4 B4 | D5 - - - . . . .",
    k5: "A5 - F#5 . D5 . F#5 A5 | G5 - E5 . C5 . E5 G5",
    k6: "D5 . B4 . G4 . . . | A4 - - - F#4 - D4 .",
    l1: "G5 . . G5 . . F5 G5 | . . D5 . E5 . G5 .",
    l2: "Bb5 . A5 . G5 . E5 . | D5 . E5 . G5 - - -",
    l3: "G5 . . G5 . . E5 G5 | A5 . G5 . E5 . C5 .",
    l4: "D5 . B4 . D5 . E5 . | G5 - - - . . . .",
    l5: "F#5 . A5 . C6 . A5 . | G5 . E5 . C5 . A4 .",
    l6: "G4 - B4 - D5 - G5 - | F#5 - - - . . . .",
    G: "G2 B2 D3 E3 F3 E3 D3 B2",
    C: "C3 E3 G3 A3 Bb3 A3 G3 E3",
    D: "D3 F#3 A3 B3 C4 B3 A3 F#3",
    sG: ". . G4+47 . . . G4+47 .",
    sC: ". . C4+47 . . . C4+47 .",
    sD: ". . D4+47 . . . D4+47 .",
    chords: "@sG @sG @sG @sG @sC @sC @sG @sG @sD @sC @sG @sD",
    blues: "@G @G @G @G @C @C @G @G @D @C @G @D",
    shuffle: "k h s h k h s h",
  },
  sections: {
    intro: { bass: "@G @G", drums: ". . h . . . h . | k . s . k s s s" },
    K: { lead: "@k1 @k2 @k3 @k4 @k5 @k6", harmony: "@chords", bass: "@blues", drums: "@shuffle" },
    L: { lead: "@l1 @l2 @l3 @l4 @l5 @l6", harmony: "@chords", bass: "@blues", drums: "k h s h k h s h | k h s h k h s s" },
  },
  order: ["intro", "K", "L"],
  loopTo: 1,
};

export const ORDER_SERVED: Jingle = {
  title: "Order Up",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "G5 . B5 . D6 - B5 . G5 - - - . . . .",
      harmony: "B4 . D5 . G5 - D5 . B4 - - - . . . .",
      bass: "G2 . . . G2 . . . G2 - - - . . . .",
      drums: "k . . . s . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

export const KITCHEN_UNLOCKED: Jingle = {
  title: "New Kitchen Open",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.21, vibrato: { depth: 14, rate: 6, delay: 0.25 } }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "G4 . B4 . D5 . G5 . | E5 - C5 - A5 - - - | F#5 - D5 - A5 - C6 - | B5 - - - - - - .",
      harmony: "G3+47 -*7 C4+47 -*7 D4+47 -*7 G3+47 - - - - - - .",
      bass: "G2 . G2 . G2 . G2 . | C3 . C3 . C3 . C3 . | D3 . D3 . D3 . D3 . | G2 - - - - - - .",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SHIFT_DONE: Jingle = {
  title: "Shift Done",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.19 } },
  sections: {
    J: {
      lead: "D5 . G5 . B5 . A5 . | G5 - - - - - - .",
      harmony: "B4 . D5 . G5 . F#5 . | D5 - - - - - - .",
      bass: "G2 . . . D3 . . . | G2 - - - - - - .",
      drums: "k . . . s . . . | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { kitchen: KITCHEN_SONG };
export const JINGLES: Record<string, Jingle> = { orderServed: ORDER_SERVED, kitchenUnlocked: KITCHEN_UNLOCKED, shiftDone: SHIFT_DONE };

/**
 * How fast the boogie runs: as written for the first orders, then a little quicker as the rush
 * builds (up to 12% on the last order). K-2 always get 1: no time pressure.
 */
export function rushTempo(orderIdx: number, orders: number, early: boolean): number {
  if (early || orders <= 1) return 1;
  const t = Math.max(0, Math.min(1, orderIdx / (orders - 1)));
  return t < 0.5 ? 1 : Math.round((1 + 0.12 * (t - 0.5) * 2) * 100) / 100;
}

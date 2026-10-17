/*
 * Trail Ledger's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * A calm museum tune for the guide, and one travel song per expedition in a style that suits its era
 * (a 6/8 folk jig for the 1753 wagon road, a steady prairie plod for 1846, a 12-bar train blues for
 * the 1917 rail journey north). Each landmark plays the expedition's own era motif as a jingle.
 * The music thins to lead + bass while you read a primary source or answer, ducks under read-aloud,
 * and hurries a little when the calendar is about to run out.
 */
import type { Jingle, Song } from "@/kit/audio";
import { EXPEDITIONS } from "./data/expeditions";

/** The museum: the guide's calm C-major tune for choosing, packing and the report. */
export const MUSEUM_SONG: Song = {
  title: "Museum Hall",
  bpm: 92,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.09, attack: 0.02, sustain: 0.55, gate: 0.85, vibrato: { depth: 8, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.45 },
    bass: { volume: 0.3, gate: 0.8 },
    drums: { volume: 0.07 },
  },
  patterns: {
    C: "C3 - - - G2 - - -", Am: "A2 - - - E2 - - -", F: "F2 - - - C3 - - -", G: "G2 - - - D2 - - -", DmG: "D2 - - - G2 - - -", Dm: "D2 - - - A2 - - -",
    Em: "E2 - - - B2 - - -", D7: "D2 - - - F#2 - - -",
    hC: ". . C4+47 . . . C4+47 .", hAm: ". . A3+37 . . . A3+37 .", hF: ". . F3+47 . . . F3+47 .", hG: ". . G3+47 . . . G3+47 .",
    hDmG: ". . D4+37 . . . G3+47 .", hDm: ". . D4+37 . . . D4+37 .", hEm: ". . E4+37 . . . E4+37 .", hD7: ". . D4+47a . . . D4+47a .",
    hush: "k . . . h . . . | . . . . h . . .",
  },
  sections: {
    A: {
      lead: "E5 - - - G5 - C6 - | A5 - - - E5 - - - | F5 - A5 - C6 - A5 - | G5 - - - D5 - - - | E5 - - - G5 - C6 - | C6 - B5 - A5 - E5 - | F5 - - - D5 - B4 - | C5 - - - - - . .",
      harmony: "@hC @hAm @hF @hG @hC @hAm @hDmG @hC",
      bass: "@C @Am @F @G @C @Am @DmG @C",
      drums: "@hush",
    },
    B: {
      lead: "A5 - - - G5 - F5 - | E5 - - - C5 - - - | D5 - F5 - A5 - - - | G5 - - - - - - - | G5 - - - B5 - E5 - | A5 - - - C6 - - - | F#5 - - - A5 - C6 - | B5 - - - D5 - - -",
      harmony: "@hF @hC @hDm @hG @hEm @hAm @hD7 @hG",
      bass: "@F @C @Dm @G @Em @Am @D7 @G",
      drums: "@hush",
    },
  },
  order: ["A", "B"],
};

/** Wagon Road South, 1753: a G-major folk jig in 6/8 (each bar is two dotted beats of three steps). */
export const WAGON_SONG: Song = {
  title: "Wagon Road South",
  bpm: 76,
  stepsPerBeat: 3,
  voices: {
    lead: { duty: 0.25, volume: 0.11, gate: 0.75, vibrato: { depth: 8, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.035, echo: { steps: 3, octave: -1 } },
    bass: { volume: 0.32, gate: 0.6 },
    drums: { volume: 0.11 },
  },
  patterns: {
    G: "G2 - - D3 - -", C: "C3 - - G2 - -", D: "D2 - - A2 - -", Em: "E2 - - B2 - -", Am: "A2 - - E2 - -", CD: "C3 - - D2 - -",
    jig: "k . h s . h",
  },
  sections: {
    A: {
      lead: "D5 - B4 G4 - B4 | C5 - E5 G5 - E5 | D5 - B4 D5 - G5 | A5 - - F#5 - - | G5 - B5 D6 - B5 | C6 - A5 E5 - G5 | F#5 - E5 D5 - F#5 | G5 - - - - .",
      bass: "@G @C @G @D @G @C @D @G",
      drums: "@jig",
    },
    B: {
      lead: "B5 - - G5 - - | E5 - G5 C6 - - | B5 - G5 D5 - - | A5 - - - - - | B5 - - G5 - E5 | C6 - B5 A5 - - | D6 - C6 B5 - A5 | A5 - - - - .",
      bass: "@Em @C @G @D @Em @Am @D @D",
      drums: "@jig",
    },
    C: {
      lead: "B4 - - D5 - - | A4 - - F#4 - - | G4 - B4 E5 - - | E5 - - C5 - - | B4 - D5 G5 - - | F#5 - - D5 - - | E5 - C5 A4 - F#4 | G4 - - - - .",
      bass: "@G @D @Em @C @G @D @CD @G",
      drums: "k . . s . . | k . h s . h",
    },
  },
  order: ["A", "B", "C"],
};

/** Westward Trail, 1846: a wide-open D-major prairie tune over a slow, steady plod. */
export const WESTWARD_SONG: Song = {
  title: "Prairie Miles",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.1, gate: 0.85, vibrato: { depth: 10, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.5, volume: 0.03, gate: 0.4 },
    bass: { volume: 0.32, gate: 0.6 },
    drums: { volume: 0.11 },
  },
  patterns: {
    D: "D2 . . . A2 . . .", G: "G2 . . . D2 . . .", A: "A2 . . . E2 . . .", Bm: "B1 . . . F#2 . . .", Em: "E2 . . . B2 . . .", EmA: "E2 . . . A2 . . .",
    hD: ". . D4+47 . . . D4+47 .", hG: ". . G3+47 . . . G3+47 .", hA: ". . A3+47 . . . A3+47 .", hBm: ". . B3+37 . . . B3+37 .",
    hEm: ". . E4+37 . . . E4+37 .", hEmA: ". . E4+37 . . . A3+47 .",
    plod: "k . . . s . . . | k . . . s . h .",
  },
  sections: {
    A: {
      lead: "A4 - - - D5 - F#5 - | G5 - - - B4 - - - | A4 - - - F#5 - A5 - | E5 - - - - - - - | F#5 - - - B5 - A5 - | G5 - - - D5 - B4 - | C#5 - - - E5 - A5 - | F#5 - - - - - . .",
      harmony: "@hD @hG @hD @hA @hBm @hG @hA @hD",
      bass: "@D @G @D @A @Bm @G @A @D",
      drums: "@plod",
    },
    B: {
      lead: "D6 - - - B5 - G5 - | A5 - - - F#5 - - - | G5 - - - E5 - B4 - | C#5 - - - E5 - - - | D5 - - - G5 - B5 - | A5 - - - F#5 - D5 - | E5 - F#5 - G5 - C#5 - | D5 - - - - - . .",
      harmony: "@hG @hD @hEm @hA @hG @hD @hEmA @hD",
      bass: "@G @D @Em @A @G @D @EmA @D",
      drums: "@plod",
    },
  },
  order: ["A", "B"],
};

/** Northbound, 1917: a 12-bar train blues in F with a boogie bass and a chugging snare. */
export const NORTHBOUND_SONG: Song = {
  title: "Northbound Rails",
  bpm: 112,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.1, gate: 0.8, vibrato: { depth: 12, rate: 5.5, delay: 0.25 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.35 },
    bass: { volume: 0.3, gate: 0.55 },
    drums: { volume: 0.1 },
  },
  patterns: {
    F: "F2 A2 C3 D3 Eb3 D3 C3 A2", Bb: "Bb1 D2 F2 G2 Ab2 G2 F2 D2", C: "C2 E2 G2 A2 Bb2 A2 G2 E2",
    hF: ". . F4+47a . . . F4+47a .", hBb: ". . Bb3+47a . . . Bb3+47a .", hC: ". . C4+47a . . . C4+47a .",
    chug: "h h s h h h s h",
    blues: "@F @F @F @F @Bb @Bb @F @F @C @Bb @F @C",
    stabs: "@hF @hF @hF @hF @hBb @hBb @hF @hF @hC @hBb @hF @hC",
  },
  sections: {
    A: {
      lead: "C5 - Eb5 E5 F5 - - . | A5 - G5 - F5 - - . | C5 - Eb5 E5 F5 - A5 - | C6 - - - Bb5 - A5 . | Bb5 - - - Ab5 - F5 - | D5 - - - F5 - - . | C5 - Eb5 E5 F5 - - . | A5 - - - - - . . | G5 - - - E5 - C5 - | F5 - - - D5 - Bb4 - | C5 - - - A4 - F4 - | G4 - - - C5 - - .",
      harmony: "@stabs",
      bass: "@blues",
      drums: "@chug",
    },
    B: {
      lead: "A5 - - - - - - - | Ab5 - - - F5 - - - | A5 - - - C6 - - - | Eb6 - - - C6 - - - | D6 - - - - - Bb5 - | Ab5 - - - F5 - - - | A5 - - - C6 - A5 - | F5 - - - - - - - | G5 - - - Bb5 - G5 - | F5 - - - D5 - - - | C5 - - - F5 - A5 - | G5 - - - E5 - - -",
      harmony: "@stabs",
      bass: "@blues",
      drums: "@chug",
    },
  },
  order: ["A", "B"],
};

/** You made it: arrival fanfare. */
export const ARRIVED: Jingle = {
  title: "Journey's End",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.17 }, harmony: { duty: 0.125, volume: 0.06 } },
  sections: {
    J: {
      lead: "G4 . C5 . E5 . G5 - | - - E5 . G5 . C6 - | - - - - B5 - D6 - | C6 - - - - - . .",
      harmony: "E4 . G4 . C5 . E5 - | - - C5 . E5 . G5 - | - - - - G5 - B5 - | G5 - - - - - . .",
      bass: "C3 . . . G2 . . . | C3 . . . E3 . . . | G2 . . . G2 . . . | C2 - - - - - . .",
      drums: "k . . . s . . . | k . . . s . . . | k . . . s . s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The calendar ran out (you can retry the leg): a soft, unhurried sigh. */
export const OUT_OF_TIME: Jingle = {
  title: "Out of Time",
  bpm: 96,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.14, vibrato: { depth: 12, rate: 5, delay: 0.1 } } },
  sections: {
    J: {
      lead: "G5 - - . E5 - - . D5 - - . C5 - - - | B4 - - - C5 - - - - - - - . . . .",
      bass: "C3 - - . A2 - - . F2 - - . G2 - - - | G2 - - - C2 - - - - - - - . . . .",
    },
  },
  order: ["J"],
};

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function hzToNote(hz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/**
 * An expedition's era motif ([Hz, beats] pairs from its data) as a landmark jingle: the tune on the
 * lead with the first note's root held in the bass. One step per beat, as the motif was always played.
 */
export function motifJingle(title: string, motif: [number, number][]): Jingle {
  const lead: string[] = [];
  for (const [hz, beats] of motif) lead.push(hzToNote(hz), ...Array<string>(Math.max(0, beats - 1)).fill("-"));
  const n = lead.length;
  const root = Math.round(69 + 12 * Math.log2(motif[0][0] / 440)) - 24;
  const bass = [`${NAMES[root % 12]}${Math.floor(root / 12) - 1}`, ...Array<string>(n - 1).fill("-")];
  return {
    title,
    bpm: 176,
    stepsPerBeat: 2,
    voices: { lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 8, rate: 5, delay: 0.15 } }, bass: { volume: 0.3 } },
    sections: { J: { lead: [...lead, ".", "."].join(" "), bass: [...bass, ".", "."].join(" ") } },
    order: ["J"],
  };
}

/** The landmark motif jingles, by expedition id. */
export const MOTIFS: Record<string, Jingle> = Object.fromEntries(
  EXPEDITIONS.map((e) => [e.id, motifJingle(`${e.title} Motif`, e.motif)]),
);

/** The travel song for an expedition. */
export const TRAVEL_SONGS: Record<string, Song> = { "wagon-road": WAGON_SONG, westward: WESTWARD_SONG, northbound: NORTHBOUND_SONG };

export const SONGS: Record<string, Song> = { wagon: WAGON_SONG, westward: WESTWARD_SONG, northbound: NORTHBOUND_SONG, museum: MUSEUM_SONG };
export const JINGLES: Record<string, Jingle> = {
  arrived: ARRIVED,
  outOfTime: OUT_OF_TIME,
  ...Object.fromEntries(Object.entries(MOTIFS).map(([id, j]) => [`motif-${id}`, j])),
};

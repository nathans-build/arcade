/*
 * Count Carnival's soundtrack (K-2): original 4-channel chiptunes for the kit's ChipAudio
 * (see src/kit/README.md). The midway gets a bouncy oom-pah march; the booths get a soft, slow
 * tune that stays out of the way of read-aloud (the music also ducks while Tally talks).
 */
import type { Jingle, Song } from "@/kit/audio";

/** The midway: a bouncy C-major oom-pah, bass on the beat and chord "pahs" off the beat. */
export const MIDWAY_SONG: Song = {
  title: "Midway March",
  bpm: 132,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.17, gate: 0.75, vibrato: { depth: 10, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.5, volume: 0.06, gate: 0.45 },
    bass: { volume: 0.46, gate: 0.6 },
    drums: { volume: 0.32 },
  },
  patterns: {
    c1: "E5 . G5 . E5 . C5 . | D5 E5 F5 . E5 . . .",
    c2: "D5 . F5 . D5 . B4 . | C5 D5 E5 . D5 . . .",
    c3: "B4 . D5 . G5 . F5 . | E5 . D5 . B4 . G4 .",
    c4: "C5 . E5 . G5 . E5 . | C5 - - - . . . .",
    d1: "A5 - - - F5 . A5 . | G5 - - - E5 . G5 .",
    d2: "F5 . E5 . D5 . F5 . | E5 - - - . . . .",
    d3: "A5 . A5 . C6 . A5 . | G5 . G5 . E5 . C5 .",
    d4: "F#5 - - - A5 - - - | G5 - - - D5 . . .",
    // Oom (bass) and pah (chord) for one bar of each chord.
    C: "C3 . G2 . C3 . G2 .", G: "G2 . D3 . G2 . D3 .", F: "F2 . C3 . F2 . C3 .", D: "D3 . A2 . D3 . A2 .",
    pC: ". C4+47 . C4+47 . C4+47 . C4+47", pG: ". B3+38 . B3+38 . B3+38 . B3+38", pF: ". A3+38 . A3+38 . A3+38 . A3+38",
    pD: ". D4+47 . D4+47 . D4+47 . D4+47",
    march: "k h s h k h s h",
  },
  sections: {
    intro: { harmony: "@pC @pG", bass: "@C @G", drums: "k . s . k . s . | k . s . k s s s" },
    A: {
      lead: "@c1 @c2 @c3 @c4",
      harmony: "@pC @pC @pG @pG @pG @pG @pC @pC",
      bass: "@C @C @G @G @G @G @C @C",
      drums: "@march",
    },
    B: {
      lead: "@d1 @d2 @d3 @d4",
      harmony: "@pF @pC @pG @pC @pF @pC @pD @pG",
      bass: "@F @C @G @C @F @C @D @G",
      drums: "@march",
    },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: 1,
};

/** Inside a booth: slow, soft and simple (no drums), so counting and read-aloud come first. */
export const BOOTH_SONG: Song = {
  title: "Booth Breeze",
  bpm: 88,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.1, attack: 0.02, sustain: 0.5, vibrato: { depth: 10, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.125, volume: 0.035, gate: 0.6 },
    bass: { volume: 0.32, gate: 0.85 },
  },
  patterns: {
    h1: "A4 - C5 - F5 - - - | D5 - - - A4 - - -",
    h2: "Bb4 - D5 - F5 - - - | E5 - - - C5 - - -",
    h3: "A4 - C5 - F5 - G5 - | A5 - - - F5 - - -",
    h4: "G5 - F5 - D5 - - - | C5 - - - - - - -",
    j1: "D5 - - - F5 - - - | E5 - - - G5 - - -",
    j2: "C5 - - - E5 - - - | D5 - - - A4 - - -",
    j3: "D5 - - - Bb4 - - - | C5 - E5 - G5 - - -",
    j4: "F5 - - - - - - - | . . . . . . . .",
    F: "F2 - - - C3 - - -", Dm: "D2 - - - A2 - - -", Bb: "Bb1 - - - F2 - - -", C: "C2 - - - G2 - - -", Am: "A2 - - - E2 - - -",
    aF: ". . F4+47 . . . F4+47 .", aDm: ". . D4+37 . . . D4+37 .", aBb: ". . Bb3+47 . . . Bb3+47 .", aC: ". . C4+47 . . . C4+47 .",
    aAm: ". . A3+37 . . . A3+37 .",
  },
  sections: {
    A: {
      lead: "@h1 @h2 @h3 @h4",
      harmony: "@aF @aDm @aBb @aC @aF @aDm @aBb @aC",
      bass: "@F @Dm @Bb @C @F @Dm @Bb @C",
    },
    B: {
      lead: "@j1 @j2 @j3 @j4",
      harmony: "@aBb @aC @aAm @aDm @aBb @aC @aF @aF",
      bass: "@Bb @C @Am @Dm @Bb @C @F @F",
    },
  },
  order: ["A", "B"],
};

export const PRIZE: Jingle = {
  title: "Prize Won",
  bpm: 150,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "G5 . G5 . A5 . B5 . C6 - - - G5 - C6 - - - - - . . . .",
      harmony: "E5 . E5 . F5 . G5 . E5 - - - E5 - E5 - - - - - . . . .",
      bass: "C3 . . . G2 . . . C3 . . . G2 . C3 - - - - - . . . .",
      drums: "k . . . s . . . k . . . s . k . . . . . . . . .",
    },
  },
  order: ["J"],
};

export const BOOTH_DONE: Jingle = {
  title: "Booth Done",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "C5 . E5 . G5 . E5 . | F5 . A5 . C6 - - - | B5 . G5 . D6 - - - | C6 - - - - - - .",
      harmony: "C4+47 -*7 F4+47 -*7 G4+47 -*7 C4+47 - - - - - - .",
      bass: "C3 . . . G2 . . . | F2 . . . C3 . . . | G2 . . . D3 . . . | C3 - - - - - - .",
      drums: "k . . . s . . . | k . . . s . . . | k . . . s . s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { midway: MIDWAY_SONG, booth: BOOTH_SONG };
export const JINGLES: Record<string, Jingle> = { prize: PRIZE, boothDone: BOOTH_DONE };

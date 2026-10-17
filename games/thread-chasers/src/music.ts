/*
 * Thread Chasers' soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * A reading-heavy history chase, so the music is calm and sits under the fact cards and read-aloud:
 * a stately tune for the Long Archive, a spinning-wheel ostinato while you follow a thread, and a
 * gentle weaving waltz for the re-weave questions. Music stays silent on sensitive (quiet) beads,
 * thins to lead + bass while a question or a dead-end explanation is up, and only hurries a little
 * when Wick's lantern is nearly out.
 */
import type { Jingle, Song } from "@/kit/audio";

/** Title, case shelf, briefs and the report: a stately A-minor tune with harpsichord-like broken chords. */
export const ARCHIVE_SONG: Song = {
  title: "The Long Archive",
  bpm: 92,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.09, attack: 0.02, sustain: 0.55, gate: 0.85, vibrato: { depth: 8, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.25, volume: 0.03, gate: 0.6 },
    bass: { volume: 0.3, gate: 0.8 },
    drums: { volume: 0.07 },
  },
  patterns: {
    Am: "A2 - - - E2 - - -", Dm: "D2 - - - A2 - - -", G: "G2 - - - D2 - - -", C: "C3 - - - G2 - - -", F: "F2 - - - C3 - - -", E: "E2 - - - B1 - - -",
    Em: "E2 - - - B2 - - -", CE: "C3 - - - E2 - - -",
    rAm: "A3 C4 E4 A4 E4 C4 A3 C4", rDm: "D4 F4 A4 D5 A4 F4 D4 F4", rG: "G3 B3 D4 G4 D4 B3 G3 B3", rC: "C4 E4 G4 C5 G4 E4 C4 E4",
    rF: "F3 A3 C4 F4 C4 A3 F3 A3", rE: "E3 G#3 B3 E4 B3 G#3 E3 G#3", rEm: "E3 G3 B3 E4 B3 G3 E3 G3", rCE: "C4 E4 G4 C5 B3 E4 G#4 B4",
    hush: "k . . . h . . . | . . . . h . . .",
  },
  sections: {
    A: {
      lead: "E5 - - - A5 - - - | F5 - - - D5 - - - | D5 - - - G5 - B4 - | C5 - - - E5 - - - | F5 - - - A5 - C6 - | B5 - - - A5 - F5 - | G#5 - - - E5 - D5 - | E5 - - - - - . .",
      harmony: "@rAm @rDm @rG @rC @rF @rDm @rE @rE",
      bass: "@Am @Dm @G @C @F @Dm @E @E",
      drums: "@hush",
    },
    B: {
      lead: "A5 - - - G5 - F5 - | G5 - - - D5 - - - | E5 - G5 - B5 - - - | A5 - - - E5 - - - | F5 - - - D5 - A5 - | B5 - - - G5 - D5 - | E5 - - - G#5 - B5 - | A5 - - - - - . .",
      harmony: "@rF @rG @rEm @rAm @rDm @rG @rCE @rAm",
      bass: "@F @G @Em @Am @Dm @G @CE @Am",
      drums: "@hush",
    },
  },
  order: ["A", "B"],
};

/** Following a thread from bead to bead: an E-minor spinning-wheel ostinato under a calm, searching lead. */
export const THREAD_SONG: Song = {
  title: "Following the Thread",
  bpm: 100,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.1, gate: 0.8, vibrato: { depth: 9, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.4 },
    bass: { volume: 0.28, gate: 0.5 },
    drums: { volume: 0.09 },
  },
  patterns: {
    Em: "E2 B2 E3 B2 E2 B2 E3 B2", C: "C2 G2 C3 G2 C2 G2 C3 G2", D: "D2 A2 D3 A2 D2 A2 D3 A2", Am: "A1 E2 A2 E2 A1 E2 A2 E2",
    B: "B1 F#2 B2 F#2 B1 F#2 B2 F#2", G: "G1 D2 G2 D2 G1 D2 G2 D2",
    hEm: ". . . . E4+37 . . .", hC: ". . . . C4+47 . . .", hD: ". . . . D4+47 . . .", hAm: ". . . . A3+37 . . .", hB: ". . . . B3+47 . . .",
    hG: ". . . . G3+47 . . .",
    spin: "k . h . . . h . | k . h . s . h .",
  },
  sections: {
    A: {
      lead: "B4 - - - E5 - - - | G5 - F#5 - E5 - D5 - | E5 - - - C5 - - - | D5 - - - A4 - - - | B4 - - - E5 - G5 - | A5 - - - - - E5 - | F#5 - - - D#5 - B4 - | B4 - - - - - . .",
      harmony: "@hEm @hEm @hC @hD @hEm @hAm @hB @hB",
      bass: "@Em @Em @C @D @Em @Am @B @B",
      drums: "@spin",
    },
    B: {
      lead: "G5 - - - E5 - - - | F#5 - - - D5 - - - | B5 - - - G5 - D5 - | E5 - - - - - - - | G5 - - - A5 - B5 - | A5 - - - F#5 - D5 - | D#5 - - - F#5 - A5 - | B5 - - - - - . .",
      harmony: "@hC @hD @hG @hEm @hC @hD @hB @hB",
      bass: "@C @D @G @Em @C @D @B @B",
      drums: "@spin",
    },
  },
  order: ["A", "B"],
};

/** Re-weaving the thread on the Great Loom: a gentle F-major waltz, shuttle going back and forth. */
export const LOOM_SONG: Song = {
  title: "The Great Loom",
  bpm: 104,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.5, volume: 0.09, attack: 0.02, sustain: 0.55, gate: 0.85, vibrato: { depth: 8, rate: 5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.03, gate: 0.45 },
    bass: { volume: 0.28, gate: 0.8 },
    drums: { volume: 0.08 },
  },
  patterns: {
    F: "F2 - - - C3 -", C: "C3 - - - G2 -", Dm: "D2 - - - A2 -", Bb: "Bb1 - - - F2 -", Gm: "G2 - - - D2 -", BbC: "Bb1 - - - C2 -", GmC: "G2 - - - C2 -",
    hF: ". . F4+47 . F4+47 .", hC: ". . C4+47 . C4+47 .", hDm: ". . D4+37 . D4+37 .", hBb: ". . Bb3+47 . Bb3+47 .", hGm: ". . G3+37 . G3+37 .",
    hBbC: ". . Bb3+47 . C4+47 .", hGmC: ". . G3+37 . C4+47 .",
    shuttle: "k . h . h .",
  },
  sections: {
    A: {
      lead: "A4 - C5 - F5 - | E5 - - - C5 - | D5 - F5 - A5 - | Bb5 - - - F5 - | A5 - G5 - F5 - | E5 - G5 - C6 - | D5 - - - E5 - | F5 - - - - -",
      harmony: "@hF @hC @hDm @hBb @hF @hC @hBbC @hF",
      bass: "@F @C @Dm @Bb @F @C @BbC @F",
      drums: "@shuttle",
    },
    B: {
      lead: "D6 - - - Bb5 - | C6 - - - A5 - | Bb5 - A5 - G5 - | E5 - - - - - | F5 - G5 - A5 - | C6 - - - A5 - | G5 - - - E5 - | F5 - - - - -",
      harmony: "@hBb @hF @hGm @hC @hBb @hF @hGmC @hF",
      bass: "@Bb @F @Gm @C @Bb @F @GmC @F",
      drums: "@shuttle",
    },
  },
  order: ["A", "B"],
};

/** A right jump: the next bead clicks onto the thread. */
export const BEAD_WOVEN: Jingle = {
  title: "Bead Woven",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.16 }, harmony: { duty: 0.125, volume: 0.05 } },
  sections: {
    J: {
      lead: "B4 . E5 . G5 . B5 - | - - - - . . . .",
      harmony: "G4 . B4 . E5 . G5 - | - - - - . . . .",
      bass: "E2 . . . B2 . . . | E2 - - - . . . .",
    },
  },
  order: ["J"],
};

/** Wick's lantern runs out: a soft, sinking line (the thread slips back a bead, nothing is lost). */
export const LANTERN_OUT: Jingle = {
  title: "Lantern Out",
  bpm: 100,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.5, volume: 0.14, vibrato: { depth: 14, rate: 6, delay: 0.1 } } },
  sections: {
    J: {
      lead: "E5 - - . D5 - - . B4 - - . A4 - - - | G4 - - - F#4 - - - - - - - . . . .",
      bass: "C3 - - . B2 - - . G2 - - . A2 - - - | B1 - - - B1 - - - - - - - . . . .",
    },
  },
  order: ["J"],
};

/** The thread is re-woven and Knot is wound (gently) back onto the Loom. */
export const REWOVEN: Jingle = {
  title: "Thread Rewoven",
  bpm: 132,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.125, volume: 0.06 } },
  sections: {
    J: {
      lead: "C5 . F5 . A5 . C6 . | Bb5 . G5 . E5 . G5 . | A5 - - - C6 - - - | F6 - - - - - . .",
      harmony: "A4 . C5 . F5 . A5 . | G5 . E5 . C5 . E5 . | F5 - - - A5 - - - | C6 - - - - - . .",
      bass: "F2 . . . C3 . . . | C2 . . . G2 . . . | F2 . . . C3 . . . | F2 - - - - - . .",
      drums: "k . h . s . h . | k . h . s . s s | k . . . k . . . | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { thread: THREAD_SONG, archive: ARCHIVE_SONG, loom: LOOM_SONG };
export const JINGLES: Record<string, Jingle> = { bead: BEAD_WOVEN, lanternOut: LANTERN_OUT, rewoven: REWOVEN };

/*
 * Splash Arc's soundtrack: original 4-channel chiptunes for the kit's ChipAudio (see src/kit/README.md).
 * Steps are 8th notes (stepsPerBeat 2), so a 4/4 bar is 8 tokens; "|" marks the bars.
 * Every throw starts with a geometry question, so the music stays relaxed: a sunny A-major rooftop
 * bounce (city and park levels), a slower, mellower version at dusk, and a floaty E-minor tune for
 * the Mars and Moon bases. It drops to lead + bass while a question is on screen.
 */
import type { Jingle, Song } from "@/kit/audio";

/** City and park levels: a sunny rooftop bounce with a syncopated, calypso-style bass. */
export const ROOFTOP_SONG: Song = {
  title: "Rooftop Splash",
  bpm: 116,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.25, volume: 0.17, vibrato: { depth: 10, rate: 5.5, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.06, echo: { steps: 3 } },
    bass: { volume: 0.44, gate: 0.7 },
    drums: { volume: 0.36 },
  },
  patterns: {
    a1: "E5 . A5 . . C#6 . B5 | A5 - . F#5 . . D5 .",
    a2: "E5 . G#5 . . B5 . A5 | A5 - . E5 - - C#5 .",
    a3: "E5 . A5 . . C#6 . B5 | A5 - . F#5 . . A5 .",
    a4: "B5 . G#5 . E5 . F#5 G#5 | A5 - - - . . . .",
    b1: "C#6 - - - B5 - A5 - | F#5 - - - A5 - - -",
    b2: "E5 - - - C#5 - E5 - | B4 - - - - - . .",
    b3: "C#6 - - - B5 - A5 - | F#5 - - - D6 - - -",
    b4: "C#6 - - - B5 - A5 - | B5 - - - - - . .",
    A: "A2 . . E2 A2 . E2 .",
    D: "D3 . . A2 D3 . A2 .",
    E: "E2 . . B2 E2 . B2 .",
    Fm: "F#2 . . C#3 F#2 . C#3 .",
    bounce: "k . h k s . h .",
  },
  sections: {
    intro: {
      lead: ". . . . . . . . | E5 . . E5 . . A5 .",
      bass: "@A @E",
      drums: "h . h . h . h . | k . h k s . s s",
    },
    A: { lead: "@a1 @a2 @a3 @a4", bass: "@A @D @E @A @A @D @E @A", drums: "@bounce" },
    B: {
      lead: "@b1 @b2 @b3 @b4",
      harmony: "F#3+37 -*7 D4+47 -*7 A3+47 -*7 E4+47 -*7 F#3+37 -*7 D4+47 -*7 A3+47 -*7 E4+47 -*7",
      bass: "@Fm @D @A @E @Fm @D @A @E",
      drums: "k . h . s . h . | k . h k s . h h",
    },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: 1,
};

/** Dusk levels: the same tune a tone lower, slower and mellower. */
export const SUNSET_SONG: Song = {
  ...ROOFTOP_SONG,
  title: "Sunset Splash",
  bpm: 104,
  transpose: -2,
  voices: {
    ...ROOFTOP_SONG.voices,
    lead: { duty: 0.5, volume: 0.15, vibrato: { depth: 14, rate: 5, delay: 0.25 } },
    harmony: { duty: 0.25, volume: 0.05, echo: { steps: 4, octave: -1 } },
    drums: { volume: 0.28 },
  },
};

/** Mars and Moon bases: slow, floaty and spacious. */
export const LOW_GRAVITY_SONG: Song = {
  title: "Low Gravity",
  bpm: 96,
  stepsPerBeat: 2,
  voices: {
    lead: { duty: 0.125, volume: 0.15, vibrato: { depth: 16, rate: 4.5, delay: 0.35 } },
    harmony: { duty: 0.25, volume: 0.05 },
    bass: { volume: 0.42 },
    drums: { volume: 0.3 },
  },
  patterns: {
    Em: "E2 - - - B2 - - -",
    C: "C3 - - - G2 - - -",
    D: "D3 - - - A2 - - -",
    Bm: "B2 - - - F#2 - - -",
    Am: "A2 - - - E2 - - -",
    B: "B2 - - - F#2 - - -",
    G: "G2 - - - D3 - - -",
  },
  sections: {
    A: {
      lead: "B5 - - - - - G5 - | E5 - - - - - . . | F#5 - - - A5 - - - | F#5 - - - D5 - - - | B5 - - - - - G5 - | E5 - - - G5 - - - | A5 - - - C6 - - - | B5 - - - - - . .",
      harmony: "E4+37 -*7 C4+47 -*7 D4+47 -*7 B3+37 -*7 E4+37 -*7 C4+47 -*7 A3+37 -*7 B3+47 -*7",
      bass: "@Em @C @D @Bm @Em @C @Am @B",
      drums: "k . . . h . . . | . . . . h . . .",
    },
    B: {
      lead: "G5 - - - E5 - C5 - | D5 - - - G5 - - - | F#5 - - - E5 - D5 - | E5 - - - - - . . | G5 - - - E5 - C5 - | D5 - - - B5 - - - | A5 - - - F#5 - D5 - | E5 - - - - - . .",
      harmony: "C4+47 -*7 G3+47 -*7 D4+47 -*7 E4+37 -*7 C4+47 -*7 G3+47 -*7 D4+47 -*7 E4+37 -*7",
      bass: "@C @G @D @Em @C @G @D @Em",
      drums: "k . . . h . . . | . . h . h . . .",
    },
  },
  order: ["A", "B"],
};

/** A target is watered. Short, so it never gets in the way of the next question. */
export const SPLASH_HIT: Jingle = {
  title: "Splash",
  bpm: 170,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.18 }, harmony: { duty: 0.125, volume: 0.08 } },
  sections: {
    J: {
      lead: "E6 C#6 A5 E5 . . A5 C#6 E6 - - - . .",
      harmony: "C#6 A5 E5 C#5 . . E5 A5 C#6 - - - . .",
      bass: "A2 . . . . . E2 . A2 - - - . .",
      drums: "o . . . . . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** Every target on the level watered. */
export const ALL_WATERED: Jingle = {
  title: "All Watered",
  bpm: 140,
  stepsPerBeat: 4,
  voices: { lead: { duty: 0.25, volume: 0.2, vibrato: { depth: 12, rate: 6, delay: 0.2 } }, harmony: { duty: 0.125, volume: 0.09 } },
  sections: {
    J: {
      lead: "A5 . E5 . A5 . C#6 . B5 . G#5 . E5 . F#5 . G#5 . A5 - - - - - - - . .",
      harmony: "E5 . C#5 . E5 . A5 . G#5 . E5 . B4 . D5 . E5 . C#5 - - - - - - - . .",
      bass: "A2 . . . A2 . . . E2 . . . E2 . . . D3 . E3 . A2 - - - - - . .",
      drums: "k . h . s . h . k . h . s . h . k . s . k . . . . . . .",
    },
  },
  order: ["J"],
};

/** The last level is done. */
export const SPLASH_FINALE: Jingle = {
  title: "Splash Finale",
  bpm: 126,
  stepsPerBeat: 2,
  voices: { lead: { duty: 0.25, volume: 0.2 }, harmony: { duty: 0.5, volume: 0.07 } },
  sections: {
    J: {
      lead: "A5 . C#6 . E6 - C#6 . | D6 - B5 - E6 - D6 - | C#6 - A5 - B5 - G#5 - | A5 - - - - - - .",
      harmony: "A3+47 -*7 D4+47 -*7 A3+47 - - - E4+47 - - - A3+47 - - - - - - .",
      bass: "A2 . A2 . A2 . A2 . | D3 . D3 . E3 . E3 . | A2 . A2 . E2 . E2 . | A2 - - - - - - .",
      drums: "k . s . k . s . | k . s . k . s . | k . s . k k s s | k . . . . . . .",
    },
  },
  order: ["J"],
};

export const SONGS: Record<string, Song> = { rooftop: ROOFTOP_SONG, sunset: SUNSET_SONG, lowGravity: LOW_GRAVITY_SONG };
export const JINGLES: Record<string, Jingle> = { splash: SPLASH_HIT, allWatered: ALL_WATERED, finale: SPLASH_FINALE };

/** The music for a level theme. */
export function themeSong(theme: string): Song {
  if (theme === "mars" || theme === "moon") return LOW_GRAVITY_SONG;
  if (theme === "dusk") return SUNSET_SONG;
  return ROOFTOP_SONG;
}

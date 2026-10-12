/* Silly chiptune sound effects, built on the arcade kit's ChipAudio tones. */
import type { ChipAudio } from "@/kit/audio";

export type Silly = "boing" | "slide" | "honk" | "pop" | "kazoo" | "ding" | "wobble" | "zip";
export const SILLIES: Silly[] = ["boing", "slide", "honk", "pop", "kazoo", "ding", "wobble", "zip"];

export function silly(a: ChipAudio, kind: Silly) {
  switch (kind) {
    case "boing": a.tone(180, 0.3, "triangle", 0.5, 720); break;
    case "slide": a.tone(900, 0.45, "sine", 0.35, 220); break;
    case "honk": a.tone(220, 0.12, "square", 0.3); a.tone(165, 0.18, "square", 0.3, undefined, undefined); break;
    case "pop": a.noise(0.05, 0.4); a.tone(1200, 0.05, "square", 0.2, 600); break;
    case "kazoo": a.tone(330, 0.25, "sawtooth", 0.2, 360); break;
    case "ding": a.tone(1568, 0.25, "triangle", 0.35); break;
    case "wobble": a.tone(440, 0.4, "triangle", 0.3, 300); a.tone(300, 0.2, "triangle", 0.2, 500); break;
    case "zip": a.tone(300, 0.12, "square", 0.2, 1500); break;
  }
}

/** A little fanfare for the big reveal. */
export function fanfare(a: ChipAudio) {
  a.levelUp();
}

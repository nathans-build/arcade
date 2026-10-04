/* Diagram descriptions for questions and explanations (drawn as SVG by Diagram.tsx). */
import type { AreaShape } from "./levels";
import type { Cut, Parts, Shape2D, Solid, Tank } from "./shapes";

export type Dir = "right" | "up" | "left" | "down";

export type Diagram =
  /** An angle from the ground (right-pointing ray) up to `deg`. */
  | { t: "angle"; deg: number; label: string; back?: boolean; backLabel?: string; protractor?: boolean; square?: boolean }
  /** Two angles side by side: rays at 0, a and a+b. */
  | { t: "two"; a: number; b: number; la: string; lb: string; total?: string }
  /** Two lines crossing; `deg` is the angle between the right ray and the upper-right ray. Labels: [upper-right, upper-left, lower-left, lower-right]. */
  | { t: "cross"; deg: number; labels: [string, string, string, string] }
  /** Parallel lines cut by a transversal at `alpha`; labels for 8 angle spots (top: 0-3, bottom: 4-7; each: above-right, above-left, below-left, below-right). */
  | { t: "parallel"; alpha: number; labels: string[] }
  /** A triangle with angle labels at its three corners (bottom-left, bottom-right, top). `ext` draws an exterior angle at bottom-right. */
  | { t: "triangle"; angles: [number, number, number]; labels: [string, string, string]; ext?: string }
  /** A right triangle: run along the bottom, rise up the right side. */
  | { t: "right"; run: number; rise: number; lRun: string; lRise: string; lHyp: string; lAngle: string }
  /** A coordinate grid with lettered points and an optional polygon. */
  | { t: "grid"; nx: number; ny: number; points: { x: number; y: number; label: string; dim?: boolean }[]; poly?: [number, number][]; origin?: boolean }
  /** Targets at their real places on screen (for position words). */
  | { t: "skyline"; items: { x: number; y: number; icon: Diagram; label: string; ring?: boolean }[] }
  | { t: "shape"; shape: Shape2D; label?: string; grid?: boolean }
  | { t: "bed"; w: number; h: number }
  | { t: "area"; area: AreaShape }
  | { t: "solid"; solid: Solid; cut?: Cut }
  | { t: "tank"; tank: Tank; unit?: string; cubes?: boolean; labels?: boolean }
  | { t: "parts"; parts: Parts }
  | { t: "net"; solid: Solid }
  | { t: "turn"; from: Dir; to?: Dir; kind: "half" | "quarter" | "full" }
  | { t: "power"; side: "short" | "long" }
  | { t: "parabola"; p: number; d: number; k: number; mark?: "vertex" | "land" | "zeros" }
  | { t: "shot"; X: number; Y: number; angle?: number }
  | { t: "scale"; cm: number; per: number; unit: string }
  | { t: "spin"; shape: "rect" | "tri" | "semi" }
  | { t: "cav"; r: number; h: number }
  | { t: "fire" | "bell" | "egg" };

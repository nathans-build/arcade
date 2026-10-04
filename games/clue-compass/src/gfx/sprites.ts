/*
 * Character sprites as character grids (original art):
 *  HERO   — the arcade's detective hero (red helmet, cyan visor, blue suit, yellow diamond)
 *  POCKET — the runaway souvenir robot who borrows things (and always gives them back)
 *  PIP    — the homing-pigeon sidekick who carries transmissions
 *  PERSON — witnesses and friendly locals (hair, skin and clothes vary)
 */

export const HERO = [
  "......hh........",
  "......hh........",
  "......BB........",
  "......BB........",
  ".....KRRRK......",
  "....KRRRRRK.....",
  "....KRRRRRK.....",
  "....KVVVVVK.....",
  "....KRRRRRK.....",
  ".....KRRRK......",
  "....BBRRRBB.....",
  "....BBYYYBBB....",
  "....BBBYBB.BB...",
  "....BBBBBB..hh..",
  ".....RRRRR......",
  ".....BBBBB......",
  ".....BB.BB......",
  "....BB...BB.....",
  "...hh.....hh....",
];
export const HERO_COLORS: Record<string, string> = { h: "#e3262f", R: "#e3262f", K: "#05060f", V: "#7ff3ff", B: "#2456e8", Y: "#ffd23f" };

export const POCKET = [
  ".......Y........",
  ".......K........",
  "....KKKKKKK.....",
  "...KsssssssK....",
  "...KsCCCCCsK....",
  "...KsCKCKCsK....",
  "...KsCCCCCsK....",
  "...KsssMMssK....",
  "....KKKKKKK.....",
  "..s.KbbbbbK.s...",
  "..sKbbbbbbbKs...",
  "..sKbOOOOObKs...",
  "...KbOWWWObK....",
  "...KbOOOOObK....",
  "...KbbbbbbbK....",
  "....KKKKKKK.....",
  "....DD...DD.....",
  "...DKKD.DKKD....",
];
export const POCKET_COLORS: Record<string, string> = {
  Y: "#ffd23f", K: "#05060f", s: "#c8cede", C: "#7ff3ff", M: "#ff8a2a", b: "#3aa6a0", O: "#ff8a2a", W: "#fff2c0", D: "#555a6a",
};

export const PIP = [
  [
    "............",
    "....sss.....",
    "...sKsss....",
    "..Ossssss...",
    "....ssssss..",
    "...bbbssss..",
    "....sssssss.",
    ".....sssss..",
    ".....O..O...",
  ],
  [
    "......ss....",
    "....sssss...",
    "...sKsss....",
    "..Osssss....",
    "....ssssss..",
    "....sssssss.",
    ".....sbbss..",
    ".....sssss..",
    ".....O..O...",
  ],
];
export const PIP_COLORS: Record<string, string> = { s: "#b8bfd8", K: "#05060f", O: "#ff8a2a", b: "#5fd38a" };

export const PERSON = [
  "....hhhh....",
  "...hhhhhh...",
  "...hSSSSh...",
  "...SKSSKS...",
  "...SSSSSS...",
  "....SmmS....",
  ".....SS.....",
  "...cccccc...",
  "..cccccccc..",
  "..cccccccc..",
  "..ScccccccS.",
  "..S.cccc..S.",
  "....cccc....",
  "....pppp....",
  "....pppp....",
  "....pp.pp...",
  "....pp.pp...",
  "....pp.pp...",
  "...KKK.KKK..",
  "............",
];

const SKINS = ["#f0c090", "#c68a5a", "#8d5a3a", "#5e3a22", "#e8b48a"];
const HAIRS = ["#2a1a0a", "#5a3a1a", "#d8a040", "#111111", "#a04a20", "#888899"];
const SHIRTS = ["#3cb043", "#e3262f", "#8a4ad8", "#ff8a2a", "#2456e8", "#ffd23f", "#ff9ac8", "#2aa6a0"];
const PANTS = ["#2a2f45", "#4a3a2a", "#2456e8", "#555a6a"];

/** A varied, stable witness look for a seed number. */
export function personColors(seed: number): Record<string, string> {
  const s = Math.abs(Math.floor(seed));
  return {
    h: HAIRS[s % HAIRS.length],
    S: SKINS[(s * 7 + 3) % SKINS.length],
    K: "#05060f",
    m: "#a0303a",
    c: SHIRTS[(s * 5 + 1) % SHIRTS.length],
    p: PANTS[(s * 3 + 2) % PANTS.length],
  };
}

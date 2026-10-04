/*
 * Pixel sprites defined in code as character grids. One letter = one pixel; "." is clear.
 * The arcade hero (HERO) is the original SpiderBen10 character from the arcade menu; in Trail
 * Ledger he appears only as the museum guide (title, intro, report), never inside an era.
 */

export const PAL: Record<string, string> = {
  K: "#05060f", // outline
  R: "#e3262f", // red
  h: "#e3262f",
  B: "#2456e8", // blue
  b: "#6ea0ff", // light blue
  V: "#7ff3ff", // visor
  Y: "#ffd23f", // yellow
  W: "#f2f4ff", // white / canvas
  w: "#c9c2a8", // worn canvas
  N: "#7a4a22", // brown wood
  n: "#4e2e14", // dark wood
  T: "#b07a44", // tan (ox)
  t: "#8a5a2c", // dark tan
  G: "#3a3a46", // iron / grey
  g: "#6c6c7a", // light grey
  S: "#e0b48a", // skin light
  s: "#8d5a3a", // skin dark
  C: "#2a2018", // dark cloth
  P: "#5a3e8a", // purple cloth
  O: "#e07a2a", // orange
  E: "#2f6a3a", // green
};

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

/** Covered wagon (canvas top), 26×15. */
export const WAGON = [
  "....wwwwwwwwwwwwwwwww.....",
  "...wWWWWWWWWWWWWWWWWWw....",
  "..wWWWWWWWWWWWWWWWWWWWw...",
  "..wWWWWWWWWWWWWWWWWWWWw...",
  ".wWWWWWWWWWWWWWWWWWWWWWw..",
  ".wWWWWWWWWWWWWWWWWWWWWWw..",
  ".wwwwwwwwwwwwwwwwwwwwwww..",
  "NNNNNNNNNNNNNNNNNNNNNNNNNn",
  "nNNNNNNNNNNNNNNNNNNNNNNNnn",
  "..nnn..............nnn....",
  ".nGGGn............nGGGn...",
  "nGgNgGn..........nGgNgGn..",
  "nGNnNGn..........nGNnNGn..",
  ".nGGGn............nGGGn...",
  "..nnn..............nnn....",
];

/** Ox, two walking frames, 14×9. */
export const OX = [
  [
    "...........tt.",
    "..TTTTTTTTTTTt",
    ".TTTTTTTTTTTTT",
    "tTTTTTTTTTTTK.",
    "tTTTTTTTTTT...",
    ".TTTTTTTTTT...",
    "..Tt....Tt....",
    "..Tt....Tt....",
    "..KK....KK....",
  ],
  [
    "...........tt.",
    "..TTTTTTTTTTTt",
    ".TTTTTTTTTTTTT",
    "tTTTTTTTTTTTK.",
    "tTTTTTTTTTT...",
    ".TTTTTTTTTT...",
    ".Tt......Tt...",
    "Tt......Tt....",
    "KK.....KK.....",
  ],
];

/** Horse, two frames, 14×10. */
export const HORSE = [
  [
    "...........nn.",
    "..........nNNn",
    "..nNNNNNNNNNN.",
    ".nNNNNNNNNNN..",
    "nnNNNNNNNNNN..",
    "n.NNNNNNNNN...",
    "..N.N...N.N...",
    "..N.N...N.N...",
    "..N.N...N.N...",
    "..K.K...K.K...",
  ],
  [
    "...........nn.",
    "..........nNNn",
    "..nNNNNNNNNNN.",
    ".nNNNNNNNNNN..",
    "nnNNNNNNNNNN..",
    "n.NNNNNNNNN...",
    "...NN...NN....",
    "..N..N.N..N...",
    ".N....N....N..",
    ".K....K....K..",
  ],
];

/** A walker in period clothes, two frames, 5×10. `C` coat, `S` or `s` face. */
export const WALKER = [
  [".CCC.", ".SSS.", ".SSS.", "CCCCC", "CCCCC", ".CCC.", ".CCC.", ".C.C.", ".C.C.", ".K.K."],
  [".CCC.", ".SSS.", ".SSS.", "CCCCC", "CCCCC", ".CCC.", ".CCC.", "C...C", "C...C", "K...K"],
];

/** Steam locomotive, 34×17. */
export const ENGINE = [
  "...GG.............................",
  "..GggG............................",
  "..GggG.............KKKKKKKKKKK....",
  "...GG..............KbbbKbbbbbK....",
  "...GG..............KbbbKbbbbbK....",
  "..GGGGGGGGGGGGGGGGGKKKKKKKKKKK....",
  ".GGGGGGGGGGGGGGGGGGGGGGGGGGGGG....",
  "GGgggggggggggggggggGGGGGGGGGGG....",
  "GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG....",
  "RGGGGGGGGGGGGGGGGGGGGGGGGGGGGG....",
  "RRGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
  "..KKKK..KKKKK..KKKKK..KKKK...KK...",
  ".KGggGK.GgggG..GgggG.KGggGK.KggK..",
  ".KGgYgGKGgYgG..GgYgGKKGgYgGKKggK..",
  ".KGggGK.GgggG..GgggG.KGggGK.KggK..",
  "..KKKK..KKKKK..KKKKK..KKKK...KK...",
  "..................................",
];

/** Passenger coach, 32×14. */
export const COACH = [
  "................................",
  "..NNNNNNNNNNNNNNNNNNNNNNNNNNNN..",
  ".NnnnnnnnnnnnnnnnnnnnnnnnnnnnnN.",
  "NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN",
  "NYbbYNYbbYNYbbYNYbbYNYbbYNYbbYNN",
  "NYbbYNYbbYNYbbYNYbbYNYbbYNYbbYNN",
  "NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN",
  "NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN",
  "nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn",
  "..KKKK....................KKKK..",
  ".KGggGK..................KGggGK.",
  ".KGgYGK..................KGgYGK.",
  ".KGggGK..................KGggGK.",
  "..KKKK....................KKKK..",
];

export type Grid = string[];

const cache = new Map<string, HTMLCanvasElement>();

/** Renders a grid once (optionally with color swaps) and caches the bitmap. */
export function bitmap(grid: Grid, swap: Record<string, string> = {}): HTMLCanvasElement {
  const key = grid.join("|") + JSON.stringify(swap);
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = Math.max(...grid.map((r) => r.length));
  c.height = grid.length;
  const g = c.getContext("2d")!;
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const col = swap[ch] ?? PAL[ch];
      if (ch !== "." && col) {
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
  });
  cache.set(key, c);
  return c;
}

/** Every sprite, for the test that checks grids are rectangular and use known letters. */
export const ALL_GRIDS: Record<string, Grid> = {
  HERO, WAGON, ENGINE, COACH,
  OX0: OX[0], OX1: OX[1], HORSE0: HORSE[0], HORSE1: HORSE[1], WALKER0: WALKER[0], WALKER1: WALKER[1],
};

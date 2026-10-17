/*
 * Original pixel art for Count Carnival, drawn in code as inline SVG (no image files, no emoji).
 * Pixel sprites are character maps: each character is one pixel, looked up in a palette
 * ("." = clear). `mirror` builds symmetric sprites from their left half.
 */
import { memo, type CSSProperties, type ReactNode } from "react";
import type { CoinName, ShapeName } from "./items";

type Pal = Record<string, string>;

/** Mirror left halves into full rows. `odd`: the last column of each half is the centre column. */
export function mirror(halves: string[], odd = false): string[] {
  return halves.map((h) => h + h.slice(0, odd ? -1 : undefined).split("").reverse().join(""));
}

interface PixProps {
  rows: string[];
  pal: Pal;
  /** Rendered width in px (height follows the sprite's aspect). Omit to fill the parent. */
  w?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children?: ReactNode;
}

/** Draws a pixel map as SVG rects, merging runs of the same colour on each row. */
export const Pix = memo(function Pix({ rows, pal, w, className, style, title, children }: PixProps) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const rects: ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      const fill = pal[ch];
      if (ch !== "." && fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />);
      x += run;
    }
  });
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${width} ${height}`}
      width={w}
      height={w ? (w * height) / width : undefined}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
      {children}
    </svg>
  );
});

const K = "#2b1810";

/* ------------------------------------------------------------------ Tally the kangaroo */

/** Tally Hop, the carnival's ringmaster kangaroo (original character). */
const TALLY = mirror([
  ".......kkk",
  ".......khh",
  "..kk...khh",
  ".kpbk..khh",
  ".kpbk..kyy",
  ".kpbk.kkkk",
  "..kpbkbbbb",
  "...kbbbbbb",
  "..kbbbbbbb",
  "..kbbbewbb",
  "..kbbbeebb",
  "..kbpbbbbc",
  "...kbbbccn",
  "...kbbbccc",
  "....kbbcck",
  ".....kkbbb",
  "....kkhhhy",
  "...krrrrcc",
  "..kbkrrrcc",
  ".kbbkrgrcc",
  ".kbbkrrrct",
  "..kkkrrrct",
  "....krgrcc",
  "....kbbbbb",
  "....kbbbbk",
  "...kbbbbk.",
  ".kcbbbbbk.",
  ".kkkkkkkk.",
]);
const TALLY_PAL: Pal = {
  k: K, b: "#d98a3b", c: "#f7dcae", h: "#d6243a", y: "#ffd23f", e: "#1b1b1b", w: "#ffffff",
  p: "#ff9aa8", n: "#3a2010", r: "#2f5fd0", g: "#ffd23f", t: "#ff5a7a",
};
export const MASCOT_NAME = "Tally Hop";

export function Tally({ w = 80, className, style }: { w?: number; className?: string; style?: CSSProperties }) {
  return <Pix rows={TALLY} pal={TALLY_PAL} w={w} className={className} style={style} title={`${MASCOT_NAME} the kangaroo`} />;
}

/* ------------------------------------------------------------------ small sprites */

const BALLOON = [
  "..kkkkk..",
  ".kwcccck.",
  "kwcccccck",
  "kwcccccck",
  "kccccccck",
  "kccccccck",
  ".kccccck.",
  "..kccck..",
  "...kck...",
  "....k....",
  "....s....",
  "...s.....",
  "....s....",
  ".....s...",
];
export const BALLOON_COLORS = ["#e3262f", "#2f6fe0", "#21a35a", "#f29e1f", "#9b4fd1", "#e0559a"];
export function Balloon({ color, w = 24 }: { color: string; w?: number }) {
  return <Pix rows={BALLOON} pal={{ k: K, c: color, w: "#ffffffcc", s: "#7a6a5a" }} w={w} />;
}

const DUCK = [
  "......kkkk...",
  ".....kyyyyk..",
  ".....kyyeyk..",
  ".....kyyyyooo",
  "..k...kyyyk..",
  ".kyk..kyyk...",
  "kyyykkyyyyk..",
  "kyyyyyyyyyyk.",
  "kyyywwwyyyyk.",
  ".kyyyyyyyyk..",
  "..kkkkkkkk...",
];
export function Duck({ w = 28, flip = false }: { w?: number; flip?: boolean }) {
  return <Pix rows={DUCK} pal={{ k: K, y: "#ffd23f", e: "#1b1b1b", o: "#ff8a1f", w: "#fff3b0" }} w={w} style={flip ? { transform: "scaleX(-1)" } : undefined} />;
}

const STAR = mirror([
  "....k",
  "...ky",
  "...ky",
  "kkkky",
  ".kyyy",
  "..kyy",
  "..kyy",
  ".kyyk",
  ".kk..",
], true);
export function Star({ w = 24, color = "#ffd23f" }: { w?: number; color?: string }) {
  return <Pix rows={STAR} pal={{ k: K, y: color }} w={w} />;
}

const POPCORN = [
  "..w.ww...",
  ".wwwwwww.",
  "wwywwwyww",
  "kkkkkkkkk",
  "krwrwrwrk",
  "krwrwrwrk",
  "krwrwrwrk",
  ".krwrwrk.",
  ".krwrwrk.",
  ".kkkkkkk.",
];
export function Popcorn({ w = 24 }: { w?: number }) {
  return <Pix rows={POPCORN} pal={{ k: K, w: "#fff8e0", y: "#ffd23f", r: "#e3262f" }} w={w} />;
}

const SOCK = [
  "..kkkk.",
  "..kssk.",
  "..kttk.",
  "..kssk.",
  "..kssk.",
  "kkksssk",
  "ksssssk",
  "ksssssk",
  ".kkkkk.",
];
export function Sock({ w = 18, color = "#2f6fe0" }: { w?: number; color?: string }) {
  return <Pix rows={SOCK} pal={{ k: K, s: color, t: "#ffffff" }} w={w} />;
}

/** A carnival prize ticket. */
export function Ticket({ w = 36, className }: { w?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 10" width={w} height={(w * 10) / 18} shapeRendering="crispEdges" aria-hidden>
      <path d="M1 0h16v3h-1v4h1v3H1V7h1V3H1z" fill={K} />
      <path d="M2 1h14v2h-1v4h1v2H2V7h1V3H2z" fill="#ff5a7a" />
      <rect x="4" y="2" width="10" height="6" fill="#ffd23f" />
      <rect x="8" y="3" width="2" height="4" fill="#e3262f" />
      <rect x="7" y="4" width="4" height="2" fill="#e3262f" />
    </svg>
  );
}

/** A roll of 100 tickets (for skip-counting by 100s). */
export function TicketRoll({ w = 34 }: { w?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={w} height={w} aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#ff5a7a" stroke={K} strokeWidth="1" />
      <circle cx="10" cy="10" r="6" fill="#ffd23f" stroke={K} strokeWidth="0.6" />
      <circle cx="10" cy="10" r="2.2" fill="#fff8e0" stroke={K} strokeWidth="0.6" />
      <text x="10" y="18.6" fontSize="4.4" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fill={K}>100</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ prizes */

const PRIZE_ART: Record<string, { rows: string[]; pal: Pal }> = {
  bear: {
    rows: mirror([
      "..kkk...", ".kblbkkk", ".kbbbbbb", "..kbbbbb", "..kbkbbb", "..kbbbll", "..kbbblk", "...kbbll",
      "....kkrr", "..kkbbbr", ".kbbbbll", ".kbkbbll", "..kbbbll", "..kbbbbb", ".klllbbk", ".kkkkkk.",
    ]),
    pal: { k: K, b: "#b86b2e", l: "#e8b07a", r: "#e3262f" },
  },
  fish: {
    rows: [
      "...kkkkkkkkkk...", "...kcccccccck...", "..kcwwwwwwwwck..", ".kcwwwwwwwwwwck.", ".kwwwwwwwwwwwwk.",
      "kwwwwwoooowwwwwk", "kwwwwoooeoowowwk", "kwgwwoooooooowwk", "kwgwwwoooowowwwk", "kwgwwwwwwwwwwwwk",
      ".kgwwwwwwwwwwwk.", ".kgsssssssssssk.", "..kssssssssssk..", "...kkkkkkkkkk...",
    ],
    pal: { k: K, c: "#e6f6ff", w: "#7cc8f0", o: "#ff8a1f", e: "#1b1b1b", g: "#3caa4a", s: "#e3c98a" },
  },
  dino: {
    rows: [
      ".........kkkk...", "........kggggk..", "........kgwegk..", "........kgggggk.", "..d.....kggkkkk.",
      ".dgd...kgggk....", ".kgk..kgggggk...", "kggkkkgggggggk..", "kgggggglllgggk..", ".kgggggllllggk..",
      "..kggggglllgk...", "...kgggggggk....", "...kggk.kggk....", "...kggk.kggk....", "..kkkk..kkkk....",
    ],
    pal: { k: K, g: "#4fbf4f", d: "#2e8b3a", l: "#c8f0a0", w: "#ffffff", e: "#1b1b1b" },
  },
  robot: {
    rows: mirror([
      ".......k", "......kr", ".......k", "..kkkkkk", "..ksssss", "..kseess", "..ksssss", "..kssrrr",
      "..kkkkkk", "kk.kbbbb", "ks.kbybb", "ks.kbbbb", "kk.kbbbb", "...kkkkk", "....ksk.", "...kkkk.",
    ]),
    pal: { k: K, r: "#e3262f", s: "#c9d2e0", e: "#2f6fe0", b: "#2f6fe0", y: "#ffd23f" },
  },
  crown: {
    rows: mirror([
      "........", "........", ".k....k.", "kyk..kyk", "kyyk.kyy", "kyyykyyy", "kyyyyyyy", "kyyryyyb",
      "kyyyyyyy", "kooooooo", "kkkkkkkk",
    ]),
    pal: { k: K, y: "#ffd23f", r: "#e3262f", b: "#2f6fe0", o: "#f29e1f" },
  },
  trophy: {
    rows: mirror([
      "........", "..kkkkkk", "kkkyyyyy", "ky.kyyyy", "ky.kyyww", ".kykyyyy", "..kkyyyy", "...kyyyy",
      "....kkyy", ".....kyy", ".....kyy", "....kyyy", "...kkkkk", "...kbbbb", "...kbbbb", "...kkkkk",
    ]),
    pal: { k: K, y: "#ffd23f", w: "#fff8c0", b: "#9b4fd1" },
  },
  rocket: {
    rows: mirror([
      ".......k", "......kr", ".....krr", ".....kww", ".....kww", "....kwwb", "....kwbb", "....kwwb",
      "....kwww", "...kkwww", "..krkwww", ".krrkwww", ".krrkkkk", ".kk..kyo", "......ky", ".......k",
    ]),
    pal: { k: K, r: "#e3262f", w: "#f2f4ff", b: "#6ec6ff", y: "#ffd23f", o: "#ff8a1f" },
  },
  horse: {
    rows: [
      "..........kk....", ".........kbbk...", "........kmbbbk..", "........kmbebbk.", "........kmbbbbbk",
      "........kmbbkkk.", "..kkkkkkmbbk....", ".kbbbbbbbbbk....", "kmbbbbbbbbbk....", "kmkbbbbbbbk.....",
      ".m.kbk..kbk.....", "...kbk..kbk.....", "kk.kk....kk..kk.", ".kkrrrrrrrrrrk..", "...kkkkkkkkk....",
    ],
    pal: { k: K, b: "#fff3e0", m: "#e0559a", e: "#1b1b1b", r: "#e3262f" },
  },
  wand: {
    rows: [
      "......k.........", ".....kyk........", "..kkkyyykkk.....", "...kyyyyyk......", "....kyyyk.......",
      "...kyk.kyk......", "...k..s..k......", "......s.........", ".......s........", "........s.......",
      ".........s......", "..........s.....", "...........s....", "............s...",
    ],
    pal: { k: K, y: "#ffd23f", s: "#9b4fd1" },
  },
};

export function PrizeArt({ id, w = 48 }: { id: string; w?: number }) {
  const p = PRIZE_ART[id];
  if (p) return <Pix rows={p.rows} pal={p.pal} w={w} />;
  if (id === "pinwheel")
    return (
      <svg viewBox="0 0 16 16" width={w} height={w} aria-hidden>
        <rect x="7.4" y="7" width="1.2" height="9" fill="#7a5230" />
        <polygon points="8,6 8,0.5 12.5,6" fill="#e3262f" stroke={K} strokeWidth="0.4" />
        <polygon points="8,6 13.5,6 8,10.5" fill="#2f6fe0" stroke={K} strokeWidth="0.4" />
        <polygon points="8,6 8,11.5 3.5,6" fill="#ffd23f" stroke={K} strokeWidth="0.4" />
        <polygon points="8,6 2.5,6 8,1.5" fill="#21a35a" stroke={K} strokeWidth="0.4" />
        <circle cx="8" cy="6" r="0.9" fill="#fff" stroke={K} strokeWidth="0.3" />
      </svg>
    );
  if (id === "yoyo")
    return (
      <svg viewBox="0 0 16 16" width={w} height={w} aria-hidden>
        <path d="M8 0.5 V5" stroke={K} strokeWidth="0.5" />
        <circle cx="8" cy="10" r="5.5" fill="#e3262f" stroke={K} strokeWidth="0.6" />
        <circle cx="8" cy="10" r="2.8" fill="#ffd23f" stroke={K} strokeWidth="0.4" />
        <circle cx="8" cy="10" r="0.8" fill={K} />
        <rect x="5" y="6.2" width="2" height="1" fill="#ffffffaa" />
      </svg>
    );
  if (id === "kite")
    return (
      <svg viewBox="0 0 16 16" width={w} height={w} aria-hidden>
        <polygon points="7,0.5 12,5 7,11 2,5" fill="#2f6fe0" stroke={K} strokeWidth="0.5" />
        <polygon points="7,0.5 12,5 7,5" fill="#e3262f" />
        <polygon points="7,5 2,5 7,11" fill="#ffd23f" />
        <path d="M7 11 Q9 13 8 15.5" stroke={K} strokeWidth="0.4" fill="none" />
        <rect x="8.3" y="12.4" width="1.6" height="1" fill="#e0559a" />
        <rect x="7.2" y="14.4" width="1.6" height="1" fill="#21a35a" />
      </svg>
    );
  return <Star w={w} />;
}

/* ------------------------------------------------------------------ carnival tents */

export function Tent({ a, b, w = 150, children }: { a: string; b: string; w?: number; children?: ReactNode }) {
  const stripes = [];
  for (let i = 0; i < 8; i++) stripes.push(<polygon key={i} points={`50,4 ${6 + i * 11},40 ${17 + i * 11},40`} fill={i % 2 ? b : a} />);
  return (
    <svg viewBox="0 0 100 92" width={w} height={(w * 92) / 100} aria-hidden>
      <rect x="49" y="0" width="2" height="8" fill={K} />
      <polygon points="51,0 60,3 51,6" fill="#ffd23f" stroke={K} strokeWidth="0.6" />
      {stripes}
      <polygon points="50,4 6,40 94,40" fill="none" stroke={K} strokeWidth="1.6" />
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={11.5 + i * 11} cy="41" r="5.5" fill={i % 2 ? b : a} stroke={K} strokeWidth="1.2" />
      ))}
      <rect x="10" y="44" width="80" height="44" fill="#fff8e0" stroke={K} strokeWidth="1.6" />
      <rect x="10" y="84" width="80" height="6" fill="#7a5230" stroke={K} strokeWidth="1.2" />
      <g transform="translate(50 65)">{children}</g>
    </svg>
  );
}

/* ------------------------------------------------------------------ shapes */

function polyPoints(n: number, r: number, rot = -90): string {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

export function ShapeArt({ shape, rot = 0, size = 1, color }: { shape: ShapeName; rot?: number; size?: number; color: string }) {
  const s = size;
  const st = { stroke: K, strokeWidth: 3, strokeLinejoin: "round" as const };
  let body: ReactNode;
  switch (shape) {
    case "circle":
      body = <circle cx="50" cy="50" r={40 * s} fill={color} {...st} />;
      break;
    case "square":
      body = <rect x={50 - 34 * s} y={50 - 34 * s} width={68 * s} height={68 * s} fill={color} {...st} />;
      break;
    case "rectangle":
      body = <rect x={50 - 44 * s} y={50 - 24 * s} width={88 * s} height={48 * s} fill={color} {...st} />;
      break;
    case "triangle":
      body = <polygon points={polyPoints(3, 44 * s)} transform={`translate(0 ${8 * s})`} fill={color} {...st} />;
      break;
    case "hexagon":
      body = <polygon points={polyPoints(6, 42 * s, 0)} fill={color} {...st} />;
      break;
    case "cube": {
      const d = 54 * s;
      const o = 18 * s;
      const x = 50 - (d + o) / 2;
      const y = 50 - (d + o) / 2 + o;
      body = (
        <g {...st}>
          <polygon points={`${x},${y} ${x + o},${y - o} ${x + o + d},${y - o} ${x + d},${y}`} fill={shade(color, 1.25)} />
          <polygon points={`${x + d},${y} ${x + o + d},${y - o} ${x + o + d},${y - o + d} ${x + d},${y + d}`} fill={shade(color, 0.7)} />
          <rect x={x} y={y} width={d} height={d} fill={color} />
        </g>
      );
      break;
    }
    case "cone":
      body = (
        <g {...st}>
          <path d={`M${50 - 34 * s} ${50 + 30 * s} L50 ${50 - 42 * s} L${50 + 34 * s} ${50 + 30 * s} A${34 * s} ${10 * s} 0 0 1 ${50 - 34 * s} ${50 + 30 * s} Z`} fill={color} />
          <path d={`M50 ${50 - 42 * s} L${50 + 34 * s} ${50 + 30 * s} A${34 * s} ${10 * s} 0 0 1 ${50 + 10 * s} ${50 + 39 * s} Z`} fill={shade(color, 0.72)} stroke="none" />
          <ellipse cx="50" cy={50 + 30 * s} rx={34 * s} ry={10 * s} fill="none" strokeDasharray="5 4" strokeWidth="1.5" />
        </g>
      );
      break;
    case "cylinder":
      body = (
        <g {...st}>
          <path d={`M${50 - 30 * s} ${50 - 30 * s} V${50 + 30 * s} A${30 * s} ${10 * s} 0 0 0 ${50 + 30 * s} ${50 + 30 * s} V${50 - 30 * s} Z`} fill={color} />
          <path d={`M${50 + 12 * s} ${50 - 21 * s} V${50 + 39 * s} A${30 * s} ${10 * s} 0 0 0 ${50 + 30 * s} ${50 + 30 * s} V${50 - 30 * s} Z`} fill={shade(color, 0.72)} stroke="none" />
          <ellipse cx="50" cy={50 - 30 * s} rx={30 * s} ry={10 * s} fill={shade(color, 1.3)} />
        </g>
      );
      break;
    case "sphere":
      body = (
        <g>
          <circle cx="50" cy="50" r={38 * s} fill={shade(color, 0.7)} {...st} />
          <circle cx={50 - 6 * s} cy={50 - 6 * s} r={30 * s} fill={color} />
          <circle cx={50 - 16 * s} cy={50 - 16 * s} r={9 * s} fill="#ffffffb0" />
          <ellipse cx="50" cy="50" rx={38 * s} ry={11 * s} fill="none" stroke="#00000033" strokeWidth="2" />
        </g>
      );
      break;
  }
  return (
    <svg viewBox="0 0 100 100" className="cc-shape" aria-hidden>
      <g transform={`rotate(${rot} 50 50)`}>{body}</g>
    </svg>
  );
}

/* ------------------------------------------------------------------ fractions */

export function FracArt({ form, parts, equal, shaded }: { form: "circle" | "rect"; parts: number; equal: boolean; shaded: boolean }) {
  const fillA = "#ff8a1f";
  const fillB = "#fff3d6";
  const st = { stroke: K, strokeWidth: 2.5 };
  // Part boundaries as fractions of the width (rect) or as angles (circle).
  if (form === "rect") {
    const cuts = equal ? Array.from({ length: parts - 1 }, (_, i) => (i + 1) / parts) : parts === 2 ? [0.3] : [0.14, 0.42, 0.58];
    const xs = [0, ...cuts, 1].map((f) => 10 + f * 80);
    return (
      <svg viewBox="0 0 100 100" className="cc-shape" aria-hidden>
        {xs.slice(0, -1).map((x, i) => (
          <rect key={i} x={x} y="16" width={xs[i + 1] - x} height="68" fill={shaded && i === 0 ? fillA : fillB} {...st} />
        ))}
        <rect x="10" y="16" width="80" height="14" fill="#ff9aa8" opacity="0.45" />
      </svg>
    );
  }
  const r = 40;
  if (equal) {
    const paths = Array.from({ length: parts }, (_, i) => {
      const a0 = (-90 + (360 / parts) * i) * (Math.PI / 180);
      const a1 = (-90 + (360 / parts) * (i + 1)) * (Math.PI / 180);
      const large = 360 / parts > 180 ? 1 : 0;
      return `M50 50 L${50 + r * Math.cos(a0)} ${50 + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${50 + r * Math.cos(a1)} ${50 + r * Math.sin(a1)} Z`;
    });
    return (
      <svg viewBox="0 0 100 100" className="cc-shape" aria-hidden>
        <circle cx="50" cy="50" r={r} fill={fillB} {...st} />
        {paths.map((d, i) => <path key={i} d={d} fill={shaded && i === 0 ? fillA : fillB} {...st} />)}
      </svg>
    );
  }
  // Unequal: an off-centre cut (and, for 4 parts, a cross cut).
  const cx = 50 + 20;
  return (
    <svg viewBox="0 0 100 100" className="cc-shape" aria-hidden>
      <defs>
        <clipPath id={`cc-clip-${parts}-${shaded ? 1 : 0}`}>
          <circle cx="50" cy="50" r={r} />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r={r} fill={fillB} />
      <g clipPath={`url(#cc-clip-${parts}-${shaded ? 1 : 0})`}>
        {shaded && <rect x="0" y="0" width={cx} height={parts === 4 ? 32 : 100} fill={fillA} />}
        <line x1={cx} y1="0" x2={cx} y2="100" {...st} />
        {parts === 4 && <line x1="0" y1="32" x2="100" y2="32" {...st} />}
      </g>
      <circle cx="50" cy="50" r={r} fill="none" {...st} />
    </svg>
  );
}

/* ------------------------------------------------------------------ clock */

export function Clock({ h, m, lit = 0 }: { h: number; m: number; lit?: number }) {
  const hourA = (((h % 12) + m / 60) * 30 - 90) * (Math.PI / 180);
  const minA = (m * 6 - 90) * (Math.PI / 180);
  return (
    <svg viewBox="0 0 200 200" className="cc-clock" role="img" aria-label="clock">
      <circle cx="100" cy="100" r="94" fill="#e3262f" stroke={K} strokeWidth="4" />
      <circle cx="100" cy="100" r="82" fill="#fffdf4" stroke={K} strokeWidth="3" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 - 90) * (Math.PI / 180);
        const r0 = i % 5 === 0 ? 70 : 75;
        return <line key={i} x1={100 + r0 * Math.cos(a)} y1={100 + r0 * Math.sin(a)} x2={100 + 80 * Math.cos(a)} y2={100 + 80 * Math.sin(a)} stroke={K} strokeWidth={i % 5 === 0 ? 3 : 1} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 - 90) * (Math.PI / 180);
        return (
          <text key={n} x={100 + 56 * Math.cos(a)} y={100 + 56 * Math.sin(a) + 8} fontSize="22" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fontWeight="bold" fill={K}>
            {n}
          </text>
        );
      })}
      {Array.from({ length: lit }, (_, i) => {
        const a = ((i + 1) * 30 - 90) * (Math.PI / 180);
        return (
          <g key={i}>
            <circle cx={100 + 88 * Math.cos(a)} cy={100 + 88 * Math.sin(a)} r="11" fill="#ffd23f" stroke={K} strokeWidth="2" />
            <text x={100 + 88 * Math.cos(a)} y={100 + 88 * Math.sin(a) + 4} fontSize="10" textAnchor="middle" fontFamily="'Press Start 2P', monospace" fill={K}>
              {(i + 1) * 5}
            </text>
          </g>
        );
      })}
      <line x1="100" y1="100" x2={100 + 40 * Math.cos(hourA)} y2={100 + 40 * Math.sin(hourA)} stroke="#2f5fd0" strokeWidth="10" strokeLinecap="round" />
      <line x1="100" y1="100" x2={100 + 68 * Math.cos(minA)} y2={100 + 68 * Math.sin(minA)} stroke="#21a35a" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill={K} />
    </svg>
  );
}

/* ------------------------------------------------------------------ coins (original pixel designs) */

/*
 * Coins are drawn so children learn them by LOOK, like real US coins: colour (copper penny, silver
 * others), relative size (from real diameters: dime 17.9 mm < penny 19.05 < nickel 21.2 < quarter 24.3)
 * and edge (ridged dime and quarter, smooth penny and nickel). No value, letters or words are printed;
 * the faces are original simple pixel art (a generic head silhouette and little stars), not copies of
 * any real coin design.
 */
export const COIN_MM: Record<CoinName, number> = { dime: 17.91, penny: 19.05, nickel: 21.21, quarter: 24.26 };
/** Rendered px per real mm (the default coin size). */
const COIN_PX_PER_MM = 3.4;
/** Default rendered width of a coin in px, proportional to its real diameter. */
export const coinPx = (name: CoinName) => Math.round(COIN_MM[name] * COIN_PX_PER_MM);

interface CoinLook {
  face: string; rim: string; shade: string; light: string; ridged: boolean; faceRight: boolean; stars: number;
}
const COIN_LOOK: Record<CoinName, CoinLook> = {
  penny: { face: "#c8733f", rim: "#8e4a22", shade: "#9e5328", light: "#e9a173", ridged: false, faceRight: true, stars: 0 },
  nickel: { face: "#c3c8cf", rim: "#7f8792", shade: "#959ca6", light: "#e6e9ee", ridged: false, faceRight: false, stars: 2 },
  dime: { face: "#dfe3e9", rim: "#8a929e", shade: "#a6adb7", light: "#f7f9fb", ridged: true, faceRight: false, stars: 1 },
  quarter: { face: "#d5dae1", rim: "#7c8592", shade: "#9aa2ad", light: "#f1f3f6", ridged: true, faceRight: false, stars: 6 },
};

/** A generic head-and-shoulders silhouette (facing right), one character per pixel. */
const PROFILE = [
  "...####...",
  "..######..",
  ".########.",
  ".#########",
  ".#########",
  ".##########",
  ".#########",
  ".########.",
  "..#######.",
  "...####...",
  "...#####..",
  "..#######.",
  ".#########",
];

function ProfilePix({ fill, flip, dx = 0, dy = 0 }: { fill: string; flip: boolean; dx?: number; dy?: number }) {
  const px = 2.2;
  const W = 11;
  const ox = (-W * px) / 2 + dx;
  const oy = (-PROFILE.length * px) / 2 - 1 + dy;
  const rects: ReactNode[] = [];
  PROFILE.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "#") continue;
      const cx = flip ? W - 1 - x : x;
      rects.push(<rect key={`${x}-${y}`} x={ox + cx * px} y={oy + y * px} width={px + 0.05} height={px + 0.05} fill={fill} />);
    }
  });
  return <g>{rects}</g>;
}

/** A tiny pixel star (plus shape) centred at x, y. */
function PixStar({ x, y, fill }: { x: number; y: number; fill: string }) {
  const p = 1.3;
  return (
    <g fill={fill}>
      <rect x={x - p / 2} y={y - (p * 3) / 2} width={p} height={p * 3} />
      <rect x={x - (p * 3) / 2} y={y - p / 2} width={p * 3} height={p} />
    </g>
  );
}

function starSpots(n: number): [number, number][] {
  if (n === 0) return [];
  if (n === 1) return [[-12, -11]];
  if (n === 2) return [[-13, 10], [13, 10]];
  return Array.from({ length: n }, (_, i) => {
    const a = Math.PI * (0.62 + (i / (n - 1)) * 0.76);
    return [Math.cos(a) * 17.5, Math.sin(a) * 17.5] as [number, number];
  });
}

/** A coin drawn by look only (no printed value). `w` overrides its real-proportion size. */
export function Coin({ name, w }: { name: CoinName; w?: number }) {
  const c = COIN_LOOK[name];
  const size = w ?? coinPx(name);
  const R = 24;
  return (
    <svg viewBox="-26 -26 52 52" width={size} height={size} className={`cc-coin cc-coin-${name}`} role="img" aria-label={name}>
      <circle r={R + 1} fill={c.rim} stroke={K} strokeWidth="1.6" />
      {c.ridged && <circle r={R - 0.2} fill="none" stroke={K} strokeOpacity="0.75" strokeWidth="2.2" strokeDasharray="0.9 1.1" />}
      <circle r={R - 3} fill={c.face} />
      <path d={`M ${-(R - 5)} -2 A ${R - 5} ${R - 5} 0 0 1 -2 ${-(R - 5)}`} fill="none" stroke={c.light} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <circle r={R - 5.5} fill="none" stroke={c.shade} strokeWidth="0.9" />
      <ProfilePix fill={c.light} flip={!c.faceRight} dx={-0.7} dy={-0.7} />
      <ProfilePix fill={c.shade} flip={!c.faceRight} />
      {starSpots(c.stars).map(([x, y], i) => <PixStar key={i} x={x} y={y} fill={c.shade} />)}
    </svg>
  );
}

/* ------------------------------------------------------------------ base-ten blocks */

export function Blocks({ n }: { n: number }) {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const u = 4; // unit size
  const items: ReactNode[] = [];
  let x = 0;
  for (let i = 0; i < h; i++) {
    items.push(
      <g key={`h${i}`} transform={`translate(${x} 0)`}>
        <rect width={u * 10} height={u * 10} fill="#ffd23f" stroke={K} strokeWidth="0.8" />
        {Array.from({ length: 9 }, (_, j) => (
          <g key={j}>
            <line x1={(j + 1) * u} y1="0" x2={(j + 1) * u} y2={u * 10} stroke="#b88a10" strokeWidth="0.4" />
            <line x1="0" y1={(j + 1) * u} x2={u * 10} y2={(j + 1) * u} stroke="#b88a10" strokeWidth="0.4" />
          </g>
        ))}
      </g>,
    );
    x += u * 10 + 3;
  }
  for (let i = 0; i < t; i++) {
    items.push(
      <g key={`t${i}`} transform={`translate(${x} 0)`}>
        <rect width={u} height={u * 10} fill="#2f6fe0" stroke={K} strokeWidth="0.8" />
        {Array.from({ length: 9 }, (_, j) => <line key={j} x1="0" y1={(j + 1) * u} x2={u} y2={(j + 1) * u} stroke="#9cc0ff" strokeWidth="0.4" />)}
      </g>,
    );
    x += u + 2;
  }
  if (o) x += 2;
  for (let i = 0; i < o; i++) {
    const col = Math.floor(i / 5);
    items.push(<rect key={`o${i}`} x={x + col * (u + 1.5)} y={u * 10 - (i % 5) * (u + 1.5) - u} width={u} height={u} fill="#21a35a" stroke={K} strokeWidth="0.8" />);
  }
  const width = x + (o ? Math.ceil(o / 5) * (u + 1.5) : 0) + 1;
  return (
    <svg viewBox={`-1 -1 ${Math.max(width, 10) + 1} ${u * 10 + 2}`} className="cc-blocks" aria-hidden>
      {items}
    </svg>
  );
}

/* ------------------------------------------------------------------ confetti */

const CONFETTI_COLORS = ["#e3262f", "#2f6fe0", "#ffd23f", "#21a35a", "#e0559a", "#ff8a1f"];
export function Confetti({ burst }: { burst: number }) {
  if (!burst) return null;
  return (
    <div className="cc-confetti" key={burst} aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 9) * 0.05}s`,
            animationDuration: `${1.2 + ((i * 7) % 10) / 10}s`,
            transform: `rotate(${i * 23}deg)`,
          }}
        />
      ))}
    </div>
  );
}

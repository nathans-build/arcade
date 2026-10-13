import { PALETTE } from "./palette";
import { MASCOT, SPRITES, type Grid } from "./sprites";

interface Run {
  x: number;
  y: number;
  w: number;
  fill: string;
}

const cache = new Map<Grid, Run[]>();

/** Merge each row's same-colour pixels into runs, so a sprite is a few dozen rects. */
function runsOf(grid: Grid): Run[] {
  const hit = cache.get(grid);
  if (hit) return hit;
  const runs: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      if (PALETTE[ch]) runs.push({ x, y, w, fill: PALETTE[ch] });
      x += w;
    }
  });
  cache.set(grid, runs);
  return runs;
}

function PixelSvg({ grid, size, className, label, silhouette }: { grid: Grid; size?: number | string; className?: string; label?: string; silhouette?: boolean }) {
  const runs = runsOf(grid);
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={silhouette ? "#8a8fb0" : r.fill} />
      ))}
    </svg>
  );
}

export function hasSprite(word: string): boolean {
  return !!SPRITES[word];
}

/** A picture word, e.g. <Sprite word="cat" />. */
export function Sprite({ word, size, className, silhouette, labelled = true }: { word: string; size?: number | string; className?: string; silhouette?: boolean; labelled?: boolean }) {
  const grid = SPRITES[word];
  if (!grid) return null;
  return <PixelSvg grid={grid} size={size} className={className} label={labelled ? word : undefined} silhouette={silhouette} />;
}

/** Tadwin the frog. */
export function Mascot({ hop, size, className }: { hop?: boolean; size?: number | string; className?: string }) {
  return <PixelSvg grid={MASCOT[hop ? 1 : 0]} size={size} className={className} label="Tadwin the frog" />;
}

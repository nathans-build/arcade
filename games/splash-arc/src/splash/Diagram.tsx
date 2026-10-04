/* SVG diagrams for questions, explanations and choice pictures. */
import type { ReactElement } from "react";
import type { Diagram as D, Dir } from "./diagram";
import { PART_CUTS, SHAPE_VERTS, frac, tankDims, type Pt, type Solid, type Tank } from "./shapes";

const Y = "#ffd23f";
const CY = "#6ea0ff";
const WH = "#f2f4ff";
const DIM = "#6a78b8";
const RD = "#e3262f";
const GR = "#5fff8a";
const FACE = { front: "#3b5bd6", top: "#8fb0ff", side: "#22379a" };

const rad = (d: number) => (d * Math.PI) / 180;
const pts = (p: Pt[]) => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

function T({ x, y, children, c = WH, s = 9, a = "middle" }: { x: number; y: number; children: string; c?: string; s?: number; a?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} fill={c} fontSize={s} textAnchor={a} dominantBaseline="middle" fontFamily="'Press Start 2P', ui-monospace, monospace" style={{ paintOrder: "stroke" }} stroke="#070c30" strokeWidth={2}>
      {children}
    </text>
  );
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy - r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy - r * Math.sin(rad(a1));
  return `M${x0},${y0} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${x1},${y1}`;
}

function Ray({ cx, cy, deg, len, c = WH, w = 2 }: { cx: number; cy: number; deg: number; len: number; c?: string; w?: number }) {
  return <line x1={cx} y1={cy} x2={cx + len * Math.cos(rad(deg))} y2={cy - len * Math.sin(rad(deg))} stroke={c} strokeWidth={w} strokeLinecap="round" />;
}

function AngleMark({ cx, cy, a0, a1, r, label, c = Y }: { cx: number; cy: number; a0: number; a1: number; r: number; label: string; c?: string }) {
  const mid = (a0 + a1) / 2;
  const right = Math.abs(a1 - a0 - 90) < 0.01;
  return (
    <g>
      {right ? (
        <path
          d={`M${cx + 9 * Math.cos(rad(a0))},${cy - 9 * Math.sin(rad(a0))} L${cx + 9 * Math.SQRT2 * Math.cos(rad(a0 + 45))},${cy - 9 * Math.SQRT2 * Math.sin(rad(a0 + 45))} L${cx + 9 * Math.cos(rad(a1))},${cy - 9 * Math.sin(rad(a1))}`}
          fill="none"
          stroke={c}
          strokeWidth={1.5}
        />
      ) : (
        <path d={arcPath(cx, cy, r, a0, a1)} fill="none" stroke={c} strokeWidth={1.5} />
      )}
      {label && (
        <T x={cx + (r + 13) * Math.cos(rad(mid))} y={cy - (r + 10) * Math.sin(rad(mid))} c={c} s={8}>
          {label}
        </T>
      )}
    </g>
  );
}

// ------------------------------------------------------------------ solids (isometric-ish)

function Box({ x, y, w, h, dx, dy, grid = 0 }: { x: number; y: number; w: number; h: number; dx: number; dy: number; grid?: number }) {
  // (x, y) = bottom-left of the front face
  const top = y - h;
  const lines: ReactElement[] = [];
  if (grid) {
    const nx = Math.round(w / grid);
    const ny = Math.round(h / grid);
    const nd = Math.max(1, Math.round(Math.hypot(dx, dy) / (grid * 0.75)));
    for (let i = 1; i < nx; i++) lines.push(<line key={`f${i}`} x1={x + i * grid} y1={top} x2={x + i * grid} y2={y} stroke="#0a1a60" />);
    for (let j = 1; j < ny; j++) lines.push(<line key={`g${j}`} x1={x} y1={top + j * grid} x2={x + w} y2={top + j * grid} stroke="#0a1a60" />);
    for (let i = 1; i < nx; i++) lines.push(<line key={`t${i}`} x1={x + i * grid} y1={top} x2={x + i * grid + dx} y2={top + dy} stroke="#0a1a60" />);
    for (let k = 1; k < nd; k++) {
      const fx = (dx * k) / nd;
      const fy = (dy * k) / nd;
      lines.push(<line key={`d${k}`} x1={x + fx} y1={top + fy} x2={x + w + fx} y2={top + fy} stroke="#0a1a60" />);
      lines.push(<line key={`s${k}`} x1={x + w + fx} y1={top + fy} x2={x + w + fx} y2={y + fy} stroke="#0a1a60" />);
    }
    for (let j = 1; j < ny; j++) lines.push(<line key={`r${j}`} x1={x + w} y1={top + j * grid} x2={x + w + dx} y2={top + j * grid + dy} stroke="#0a1a60" />);
  }
  return (
    <g stroke="#0a1030" strokeWidth={1.2} strokeLinejoin="round">
      <polygon points={pts([[x, top], [x + w, top], [x + w + dx, top + dy], [x + dx, top + dy]])} fill={FACE.top} />
      <polygon points={pts([[x + w, top], [x + w + dx, top + dy], [x + w + dx, y + dy], [x + w, y]])} fill={FACE.side} />
      <rect x={x} y={top} width={w} height={h} fill={FACE.front} />
      {lines}
    </g>
  );
}

function SolidShape({ solid, cx, by, k = 1 }: { solid: Solid; cx: number; by: number; k?: number }) {
  const s = (v: number) => v * k;
  switch (solid) {
    case "cube":
      return <Box x={cx - s(20)} y={by} w={s(30)} h={s(30)} dx={s(14)} dy={-s(10)} />;
    case "prism":
      return <Box x={cx - s(26)} y={by} w={s(40)} h={s(22)} dx={s(12)} dy={-s(9)} />;
    case "triprism": {
      const x = cx - s(24);
      const b = s(30);
      const ap: Pt = [x + b / 2, by - s(28)];
      const d: Pt = [s(16), -s(9)];
      return (
        <g stroke="#0a1030" strokeWidth={1.2} strokeLinejoin="round">
          <polygon points={pts([ap, [ap[0] + d[0], ap[1] + d[1]], [x + b + d[0], by + d[1]], [x + b, by]])} fill={FACE.side} />
          <polygon points={pts([[x, by], [x + b, by], ap])} fill={FACE.front} />
        </g>
      );
    }
    case "pyramid": {
      const x = cx - s(22);
      const w = s(32);
      const d: Pt = [s(14), -s(9)];
      const ap: Pt = [x + w / 2 + d[0] / 2, by - s(36)];
      return (
        <g stroke="#0a1030" strokeWidth={1.2} strokeLinejoin="round">
          <polygon points={pts([[x + w, by], [x + w + d[0], by + d[1]], ap])} fill={FACE.side} />
          <polygon points={pts([[x, by], [x + w, by], ap])} fill={FACE.front} />
        </g>
      );
    }
    case "cylinder": {
      const r = s(18);
      const ry = s(6);
      const h = s(28);
      return (
        <g stroke="#0a1030" strokeWidth={1.2}>
          <path d={`M${cx - r},${by - ry - h} L${cx - r},${by - ry} A${r},${ry} 0 0 0 ${cx + r},${by - ry} L${cx + r},${by - ry - h}`} fill={FACE.front} />
          <ellipse cx={cx} cy={by - ry - h} rx={r} ry={ry} fill={FACE.top} />
        </g>
      );
    }
    case "cone": {
      const r = s(20);
      const ry = s(6);
      const h = s(36);
      return (
        <g stroke="#0a1030" strokeWidth={1.2}>
          <path d={`M${cx},${by - ry - h} L${cx - r},${by - ry} A${r},${ry} 0 0 0 ${cx + r},${by - ry} Z`} fill={FACE.front} />
          <path d={`M${cx - r},${by - ry} A${r},${ry} 0 0 1 ${cx + r},${by - ry}`} fill="none" stroke="#0a1030" strokeDasharray="2 2" />
        </g>
      );
    }
    case "sphere": {
      const r = s(20);
      return (
        <g stroke="#0a1030" strokeWidth={1.2}>
          <circle cx={cx} cy={by - r} r={r} fill={FACE.front} />
          <ellipse cx={cx} cy={by - r} rx={r} ry={r / 3.2} fill="none" strokeDasharray="2 2" />
          <circle cx={cx - r / 2.5} cy={by - r * 1.4} r={r / 4} fill={FACE.top} stroke="none" />
        </g>
      );
    }
  }
}

function CutPlane({ solid, cut, cx, by }: { solid: Solid; cut: "level" | "upright"; cx: number; by: number }) {
  if (cut === "level") {
    const y = by - (solid === "sphere" ? 20 : solid === "cone" || solid === "pyramid" ? 16 : 14);
    return <polygon points={pts([[cx - 38, y + 6], [cx + 30, y + 6], [cx + 44, y - 6], [cx - 24, y - 6]])} fill="#ffd23f55" stroke={Y} strokeWidth={1.2} />;
  }
  return <polygon points={pts([[cx - 2, by + 8], [cx + 10, by], [cx + 10, by - 50], [cx - 2, by - 42]])} fill="#ffd23f55" stroke={Y} strokeWidth={1.2} />;
}

function TankShape({ tank, cx, by, cubes, labels, unit }: { tank: Tank; cx: number; by: number; cubes?: boolean; labels?: boolean; unit?: string }) {
  const u = unit ?? "";
  if (tank.kind === "box" || tank.kind === "step") {
    const parts = tank.kind === "box" ? [{ l: tank.l, h: tank.h }] : [{ l: tank.l1, h: tank.h1 }, { l: tank.l2, h: tank.h2 }];
    const wdep = tank.w;
    const total = parts.reduce((a, p) => a + p.l, 0);
    const maxH = Math.max(...parts.map((p) => p.h));
    const k = Math.min(12, 70 / (total + wdep * 0.6), 44 / (maxH + wdep * 0.5));
    let x = cx - ((total + wdep * 0.6) * k) / 2;
    const dx = wdep * k * 0.6;
    const dy = -wdep * k * 0.45;
    const out: ReactElement[] = [];
    parts.forEach((p, i) => {
      out.push(<Box key={i} x={x} y={by} w={p.l * k} h={p.h * k} dx={dx} dy={dy} grid={cubes ? k : 0} />);
      if (labels) {
        out.push(<T key={`l${i}`} x={x + (p.l * k) / 2} y={by + 7} c={Y} s={7}>{`${frac(p.l)}${u}`}</T>);
        if (i === 0) out.push(<T key={`h${i}`} x={x - 7} y={by - (p.h * k) / 2} c={Y} s={7} a="end">{`${frac(p.h)}`}</T>);
        if (i === parts.length - 1) out.push(<T key={`w${i}`} x={x + p.l * k + dx / 2 + 6} y={by - p.h * k + dy / 2 - 2} c={Y} s={7} a="start">{`${frac(wdep)}`}</T>);
        if (i === 1) out.push(<T key={`h${i}`} x={x + p.l * k + dx + 3} y={by + dy - (p.h * k) / 2} c={Y} s={7} a="start">{`${frac(p.h)}`}</T>);
      }
      x += p.l * k;
    });
    return <g>{out}</g>;
  }
  const label = labels ? tankDims(tank, u) : "";
  const map: Record<string, Solid> = { tri: "triprism", cylinder: "cylinder", cone: "cone", sphere: "sphere", pyramid: "pyramid" };
  return (
    <g>
      <SolidShape solid={map[tank.kind]} cx={cx} by={by - 6} k={0.85} />
      {label && (
        <T x={cx + 4} y={by + 5} c={Y} s={6}>
          {label}
        </T>
      )}
    </g>
  );
}

// ------------------------------------------------------------------ 2-D

function ShapeIcon({ shape, cx, cy, size }: { shape: keyof typeof SHAPE_VERTS; cx: number; cy: number; size: number }) {
  const v = SHAPE_VERTS[shape];
  if (!v.length) return <circle cx={cx} cy={cy} r={size / 2} fill="#ff6fb0" stroke="#0a1030" strokeWidth={1.5} />;
  const w = Math.max(...v.map((p) => p[0]));
  const h = Math.max(...v.map((p) => p[1]));
  const k = size / Math.max(w, h);
  return <polygon points={pts(v.map((p) => [cx - (w * k) / 2 + p[0] * k, cy + (h * k) / 2 - p[1] * k]))} fill="#ffd23f" stroke="#0a1030" strokeWidth={1.5} strokeLinejoin="round" />;
}

function Parts({ parts, cx, cy, r }: { parts: keyof typeof PART_CUTS; cx: number; cy: number; r: number }) {
  const cuts = PART_CUTS[parts];
  const cols = ["#e3262f", "#ffd23f", "#2456e8", "#5fff8a"];
  return (
    <g stroke="#0a1030" strokeWidth={1.5}>
      {cuts.map((a, i) => {
        const b = cuts[(i + 1) % cuts.length];
        const span = (b - a + 360) % 360 || 360;
        const p0 = [cx + r * Math.sin(rad(a)), cy - r * Math.cos(rad(a))];
        const p1 = [cx + r * Math.sin(rad(a + span)), cy - r * Math.cos(rad(a + span))];
        return <path key={i} d={`M${cx},${cy} L${p0[0]},${p0[1]} A${r},${r} 0 ${span > 180 ? 1 : 0} 1 ${p1[0]},${p1[1]} Z`} fill={cols[i % 4]} />;
      })}
    </g>
  );
}

function Net({ solid }: { solid: Solid }) {
  const sq = (x: number, y: number, w: number, h: number, k: number) => <rect key={k} x={x} y={y} width={w} height={h} fill={FACE.front} stroke={WH} strokeWidth={1} />;
  const tri = (p: Pt[], k: number) => <polygon key={k} points={pts(p)} fill={FACE.top} stroke={WH} strokeWidth={1} />;
  const s = 16;
  switch (solid) {
    case "cube":
      return <g>{[sq(60, 10, s, s, 1), sq(28, 26, s, s, 2), sq(44, 26, s, s, 3), sq(60, 26, s, s, 4), sq(76, 26, s, s, 5), sq(60, 42, s, s, 6)]}</g>;
    case "prism":
      return <g>{[sq(50, 6, 30, 10, 1), sq(20, 16, 14, 20, 2), sq(34, 16, 16, 20, 7), sq(50, 16, 30, 20, 3), sq(80, 16, 16, 20, 4), sq(96, 16, 14, 20, 8), sq(50, 36, 30, 10, 5)].slice(0, 6)}</g>;
    case "triprism":
      return <g>{[sq(30, 22, 22, 20, 1), sq(52, 22, 22, 20, 2), sq(74, 22, 22, 20, 3), tri([[52, 22], [74, 22], [63, 3]], 4), tri([[52, 42], [74, 42], [63, 61]], 5)]}</g>;
    case "pyramid":
      return <g>{[sq(48, 24, 22, 22, 1), tri([[48, 24], [70, 24], [59, 4]], 2), tri([[48, 46], [70, 46], [59, 66]], 3), tri([[48, 24], [48, 46], [28, 35]], 4), tri([[70, 24], [70, 46], [90, 35]], 5)]}</g>;
    default:
      return null;
  }
}

const DIRV: Record<Dir, Pt> = { right: [1, 0], up: [0, -1], left: [-1, 0], down: [0, 1] };

// ------------------------------------------------------------------ main

export function Diagram({ d, icon = false }: { d: D; icon?: boolean }) {
  const vb = icon ? "0 0 100 64" : "0 0 160 100";
  return (
    <svg className={icon ? "sa-icon" : "sa-diagram"} viewBox={vb} role="img" aria-hidden="true">
      {body(d, icon)}
    </svg>
  );
}

function body(d: D, icon: boolean): ReactElement | null {
  switch (d.t) {
    case "angle": {
      const cx = 80;
      const cy = 82;
      return (
        <g>
          {d.protractor && (
            <g>
              <path d={arcPath(cx, cy, 64, 0, 180)} fill="#0c1a5a" stroke={DIM} />
              {Array.from({ length: 19 }, (_, i) => i * 10).map((a) => (
                <line key={a} x1={cx + 64 * Math.cos(rad(a))} y1={cy - 64 * Math.sin(rad(a))} x2={cx + (a % 30 ? 59 : 55) * Math.cos(rad(a))} y2={cy - (a % 30 ? 59 : 55) * Math.sin(rad(a))} stroke={DIM} />
              ))}
              {[0, 30, 60, 90, 120, 150, 180].map((a) => (
                <g key={a}>
                  <T x={cx + 47 * Math.cos(rad(a))} y={cy - 47 * Math.sin(rad(a))} c={CY} s={5}>{String(a)}</T>
                  <T x={cx + 37 * Math.cos(rad(a))} y={cy - 37 * Math.sin(rad(a))} c="#8a6a9a" s={4}>{String(180 - a)}</T>
                </g>
              ))}
            </g>
          )}
          <line x1={8} y1={cy} x2={152} y2={cy} stroke={DIM} strokeWidth={2} />
          <Ray cx={cx} cy={cy} deg={0} len={70} c={WH} />
          <Ray cx={cx} cy={cy} deg={d.deg} len={66} c={RD} w={3} />
          <AngleMark cx={cx} cy={cy} a0={0} a1={d.deg} r={18} label={d.label} />
          {d.back && <AngleMark cx={cx} cy={cy} a0={d.deg} a1={180} r={13} label={d.backLabel ?? ""} c={CY} />}
          {d.square && (
            <g>
              <Ray cx={cx} cy={cy} deg={90} len={50} c={GR} w={1} />
              <path d={`M${cx + 8},${cy} L${cx + 8},${cy - 8} L${cx},${cy - 8}`} fill="none" stroke={GR} />
            </g>
          )}
        </g>
      );
    }
    case "two": {
      const cx = 80;
      const cy = 86;
      return (
        <g>
          <Ray cx={cx} cy={cy} deg={0} len={70} />
          <Ray cx={cx} cy={cy} deg={d.a} len={66} c={RD} w={3} />
          <Ray cx={cx} cy={cy} deg={d.a + d.b} len={66} />
          <AngleMark cx={cx} cy={cy} a0={0} a1={d.a} r={20} label={d.la} />
          <AngleMark cx={cx} cy={cy} a0={d.a} a1={d.a + d.b} r={30} label={d.lb} c={CY} />
          {d.total && <T x={20} y={12} c={DIM} s={7} a="start">{`total ${d.total}`}</T>}
        </g>
      );
    }
    case "cross": {
      const cx = 80;
      const cy = 52;
      const a = d.deg;
      const lab = d.labels;
      return (
        <g>
          <Ray cx={cx} cy={cy} deg={0} len={70} />
          <Ray cx={cx} cy={cy} deg={180} len={70} />
          <Ray cx={cx} cy={cy} deg={a} len={50} c={RD} w={3} />
          <Ray cx={cx} cy={cy} deg={a + 180} len={50} />
          {lab[0] && <AngleMark cx={cx} cy={cy} a0={0} a1={a} r={16} label={lab[0]} />}
          {lab[1] && <AngleMark cx={cx} cy={cy} a0={a} a1={180} r={12} label={lab[1]} c={CY} />}
          {lab[2] && <AngleMark cx={cx} cy={cy} a0={180} a1={180 + a} r={16} label={lab[2]} c={CY} />}
          {lab[3] && <AngleMark cx={cx} cy={cy} a0={180 + a} a1={360} r={12} label={lab[3]} c={CY} />}
        </g>
      );
    }
    case "parallel": {
      const al = d.alpha;
      const y1 = 34;
      const y2 = 74;
      const cot = 1 / Math.tan(rad(al));
      const x1 = 80 + ((y2 - y1) / 2) * cot;
      const x2 = 80 - ((y2 - y1) / 2) * cot;
      const spots = (cx: number, cy: number, off: number) =>
        [0, 1, 2, 3].map((k) => {
          const lab = d.labels[off + k];
          if (!lab) return null;
          const ranges: [number, number][] = [[0, al], [al, 180], [180, al + 180], [al + 180, 360]];
          const [a0, a1] = ranges[k];
          return <AngleMark key={off + k} cx={cx} cy={cy} a0={a0} a1={a1} r={10} label={lab} c={lab === "?" ? Y : CY} />;
        });
      return (
        <g>
          <line x1={6} y1={y1} x2={154} y2={y1} stroke={WH} strokeWidth={2} />
          <line x1={6} y1={y2} x2={154} y2={y2} stroke={WH} strokeWidth={2} />
          <path d={`M24,${y1 - 3} l4,3 l-4,3 M24,${y2 - 3} l4,3 l-4,3`} stroke={WH} fill="none" />
          <line x1={x1 + 30 * cot} y1={y1 - 30} x2={x2 - 26 * cot} y2={y2 + 26} stroke={RD} strokeWidth={2} />
          {spots(x1, y1, 0)}
          {spots(x2, y2, 4)}
        </g>
      );
    }
    case "triangle": {
      const [a, b] = d.angles;
      const L = 110;
      const x0 = 22;
      const y0 = 86;
      // Apex from the two base angles (law of sines).
      const c = 180 - a - b;
      const side = (L * Math.sin(rad(b))) / Math.sin(rad(c));
      const apex: Pt = [x0 + side * Math.cos(rad(a)), y0 - side * Math.sin(rad(a))];
      const k = Math.min(1, 74 / (y0 - apex[1]));
      const P: Pt[] = [[x0, y0], [x0 + L * k, y0], [x0 + (apex[0] - x0) * k, y0 - (y0 - apex[1]) * k]];
      return (
        <g>
          <polygon points={pts(P)} fill="#0c1a5a" stroke={WH} strokeWidth={2} />
          {d.ext && <line x1={P[1][0]} y1={y0} x2={P[1][0] + 30} y2={y0} stroke={WH} strokeWidth={2} strokeDasharray="3 2" />}
          <AngleMark cx={P[0][0]} cy={y0} a0={0} a1={a} r={12} label={d.labels[0]} />
          {d.labels[1] && <AngleMark cx={P[1][0]} cy={y0} a0={180 - b} a1={180} r={12} label={d.labels[1]} c={CY} />}
          {d.ext && <AngleMark cx={P[1][0]} cy={y0} a0={0} a1={180 - b} r={9} label={d.ext} c={GR} />}
          <AngleMark cx={P[2][0]} cy={P[2][1]} a0={180 + a} a1={360 - b} r={10} label={d.labels[2]} c={CY} />
        </g>
      );
    }
    case "right": {
      const k = Math.min(110 / d.run, 70 / d.rise);
      const x0 = 80 - (d.run * k) / 2;
      const y0 = 88;
      const x1 = x0 + d.run * k;
      const y1 = y0 - d.rise * k;
      return (
        <g>
          <polygon points={pts([[x0, y0], [x1, y0], [x1, y1]])} fill="#0c1a5a" stroke={WH} strokeWidth={2} strokeLinejoin="round" />
          <path d={`M${x1 - 7},${y0} L${x1 - 7},${y0 - 7} L${x1},${y0 - 7}`} fill="none" stroke={WH} />
          {d.lRun && <T x={(x0 + x1) / 2} y={y0 + 8} c={Y} s={7}>{d.lRun}</T>}
          {d.lRise && <T x={x1 + 4} y={(y0 + y1) / 2} c={Y} s={7} a="start">{d.lRise}</T>}
          {d.lHyp && <T x={(x0 + x1) / 2 - 8} y={(y0 + y1) / 2 - 6} c={CY} s={7} a="end">{d.lHyp}</T>}
          {d.lAngle && <AngleMark cx={x0} cy={y0} a0={0} a1={(Math.atan2(d.rise, d.run) * 180) / Math.PI} r={16} label={d.lAngle} />}
        </g>
      );
    }
    case "grid": {
      const u = Math.min(150 / d.nx, 90 / d.ny);
      const ox = 6;
      const oy = 94;
      const X = (x: number) => ox + x * u;
      const Yp = (y: number) => oy - y * u;
      return (
        <g>
          {Array.from({ length: d.nx + 1 }, (_, i) => (
            <line key={`x${i}`} x1={X(i)} y1={Yp(0)} x2={X(i)} y2={Yp(d.ny)} stroke={i % 5 ? "#1c2a6a" : "#3a4a8a"} strokeWidth={0.6} />
          ))}
          {Array.from({ length: d.ny + 1 }, (_, j) => (
            <line key={`y${j}`} x1={X(0)} y1={Yp(j)} x2={X(d.nx)} y2={Yp(j)} stroke={j % 5 ? "#1c2a6a" : "#3a4a8a"} strokeWidth={0.6} />
          ))}
          <line x1={X(0)} y1={Yp(0)} x2={X(d.nx)} y2={Yp(0)} stroke={WH} />
          <line x1={X(0)} y1={Yp(0)} x2={X(0)} y2={Yp(d.ny)} stroke={WH} />
          {[0, 5, 10, 15, 20].filter((i) => i <= d.nx).map((i) => <T key={`lx${i}`} x={X(i)} y={oy + 4} c={DIM} s={4}>{String(i)}</T>)}
          {[5, 10].filter((j) => j <= d.ny).map((j) => <T key={`ly${j}`} x={ox - 3} y={Yp(j)} c={DIM} s={4}>{String(j)}</T>)}
          {d.poly && <polygon points={pts(d.poly.map(([x, y]) => [X(x), Yp(y)]))} fill="#ffd23f22" stroke={Y} strokeDasharray="3 2" />}
          {d.points.map((p, i) => (
            <g key={i}>
              <circle cx={X(p.x)} cy={Yp(p.y)} r={2.4} fill={p.dim ? DIM : RD} />
              {p.label && <T x={X(p.x)} y={Yp(p.y) - 6} c={p.dim ? DIM : Y} s={6}>{p.label}</T>}
            </g>
          ))}
        </g>
      );
    }
    case "skyline": {
      return (
        <g>
          <line x1={0} y1={96} x2={160} y2={96} stroke={DIM} />
          {d.items.map((it, i) => {
            const x = (it.x / 320) * 160;
            const y = 8 + ((it.y - 50) / 150) * 80;
            return (
              <g key={i}>
                <rect x={x - 12} y={y + 9} width={24} height={96 - y - 9} fill="#1c2450" />
                <svg x={x - 13} y={y - 9} width={26} height={18} viewBox="0 0 100 64">
                  {body(it.icon, true)}
                </svg>
                <T x={x} y={y - 12} c={Y} s={7}>{it.label}</T>
              </g>
            );
          })}
        </g>
      );
    }
    case "shape":
      return <ShapeIcon shape={d.shape} cx={icon ? 50 : 80} cy={icon ? 32 : 50} size={icon ? 44 : 70} />;
    case "bed": {
      const k = Math.min(80 / d.w, 44 / d.h);
      const x0 = 50 - (d.w * k) / 2;
      const y0 = 30 - (d.h * k) / 2;
      return (
        <g>
          <rect x={x0} y={y0} width={d.w * k} height={d.h * k} fill="#5a3a1a" stroke="#c08a50" strokeWidth={1.5} />
          {Array.from({ length: d.w - 1 }, (_, i) => <line key={`a${i}`} x1={x0 + (i + 1) * k} y1={y0} x2={x0 + (i + 1) * k} y2={y0 + d.h * k} stroke="#8a6a40" strokeWidth={0.6} />)}
          {Array.from({ length: d.h - 1 }, (_, j) => <line key={`b${j}`} x1={x0} y1={y0 + (j + 1) * k} x2={x0 + d.w * k} y2={y0 + (j + 1) * k} stroke="#8a6a40" strokeWidth={0.6} />)}
          <T x={50} y={y0 + d.h * k + 7} c={Y} s={7}>{String(d.w)}</T>
          <T x={x0 + d.w * k + 4} y={30} c={Y} s={7} a="start">{String(d.h)}</T>
        </g>
      );
    }
    case "area": {
      const v = d.area.verts;
      const w = Math.max(...v.map((p) => p[0]));
      const h = Math.max(...v.map((p) => p[1]));
      const k = Math.min((icon ? 70 : 110) / w, (icon ? 40 : 70) / h);
      const cx = icon ? 50 : 80;
      const base = icon ? 50 : 84;
      const P = (p: [number, number]): Pt => [cx - (w * k) / 2 + p[0] * k, base - p[1] * k];
      return (
        <g>
          <polygon points={pts(v.map(P))} fill="#ffd23f" fillOpacity={0.85} stroke="#0a1030" strokeWidth={1.5} strokeLinejoin="round" />
          {(d.area.kind === "tri" || d.area.kind === "para" || d.area.kind === "trap") && (() => {
            const top = v.reduce((a, p) => (p[1] > a[1] ? p : a), v[0]);
            const [x, y] = P(top);
            return <line x1={x} y1={y} x2={x} y2={base} stroke={RD} strokeDasharray="3 2" strokeWidth={1.2} />;
          })()}
          {d.area.labels.map(([s, x, y], i) => {
            const [px, py] = P([x, y]);
            return <T key={i} x={px} y={py} c={i === d.area.labels.length - 1 && d.area.kind !== "L" ? RD : WH} s={icon ? 7 : 8}>{s}</T>;
          })}
        </g>
      );
    }
    case "solid":
      return (
        <g>
          <SolidShape solid={d.solid} cx={icon ? 48 : 74} by={icon ? 58 : 84} k={icon ? 0.95 : 1.4} />
          {d.cut && <CutPlane solid={d.solid} cut={d.cut} cx={74} by={84} />}
        </g>
      );
    case "tank":
      return <TankShape tank={d.tank} cx={icon ? 46 : 74} by={icon ? 52 : 82} cubes={d.cubes} labels={d.labels} unit={d.unit} />;
    case "parts":
      return <Parts parts={d.parts} cx={icon ? 50 : 80} cy={icon ? 32 : 50} r={icon ? 26 : 40} />;
    case "net":
      return (
        <g transform="translate(20, 15)">
          <Net solid={d.solid} />
        </g>
      );
    case "turn": {
      const cx = 80;
      const cy = 52;
      const [fx, fy] = DIRV[d.from];
      const to = d.to ?? d.from;
      const [tx, ty] = DIRV[to];
      return (
        <g>
          <defs>
            <marker id="sa-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={Y} />
            </marker>
          </defs>
          <circle cx={cx} cy={cy} r={36} fill="none" stroke={DIM} strokeDasharray="3 3" />
          <line x1={cx} y1={cy} x2={cx + fx * 32} y2={cy + fy * 32} stroke={DIM} strokeWidth={3} />
          <line x1={cx} y1={cy} x2={cx + tx * 32} y2={cy + ty * 32} stroke={Y} strokeWidth={3} markerEnd="url(#sa-arrow)" />
          <T x={8} y={10} c={CY} s={7} a="start">{d.kind === "quarter" ? "1/4 TURN ↻" : d.kind === "half" ? "1/2 TURN" : "FULL TURN"}</T>
        </g>
      );
    }
    case "power": {
      const short = d.side === "short";
      return (
        <g>
          <line x1={0} y1={90} x2={160} y2={90} stroke={DIM} />
          <rect x={6} y={70} width={16} height={20} fill="#1c2450" />
          <rect x={112} y={60} width={24} height={30} fill="#1c2450" />
          <circle cx={124} cy={54} r={5} fill="#ff6fb0" />
          <path d={`M18,68 Q${short ? 60 : 90},${short ? 10 : 0} ${short ? 90 : 150},90`} fill="none" stroke={CY} strokeDasharray="3 3" strokeWidth={2} />
          <T x={short ? 90 : 150} y={82} c={RD} s={9}>✕</T>
          <T x={80} y={10} c={Y} s={8}>{short ? "TOO SHORT" : "TOO FAR"}</T>
        </g>
      );
    }
    case "parabola": {
      const { p, d: half, k } = d;
      const maxX = p + half + 5;
      const sx = 140 / maxX;
      const sy = 70 / k;
      const X = (x: number) => 10 + x * sx;
      const Yp = (y: number) => 88 - y * sy;
      const path = Array.from({ length: 41 }, (_, i) => {
        const x = p - half + (2 * half * i) / 40;
        const y = k - (k / (half * half)) * (x - p) ** 2;
        return `${i ? "L" : "M"}${X(x)},${Yp(y)}`;
      }).join(" ");
      return (
        <g>
          <line x1={10} y1={88} x2={155} y2={88} stroke={DIM} />
          <line x1={10} y1={88} x2={10} y2={8} stroke={DIM} />
          <path d={path} fill="none" stroke={CY} strokeWidth={2} />
          {d.mark === "vertex" && (
            <g>
              <circle cx={X(p)} cy={Yp(k)} r={3} fill={Y} />
              <line x1={X(p)} y1={Yp(k)} x2={X(p)} y2={88} stroke={Y} strokeDasharray="2 2" />
              <T x={X(p)} y={Yp(k) - 7} c={Y} s={6}>{`(${p}, ${k})`}</T>
            </g>
          )}
          {(d.mark === "land" || d.mark === "zeros") && (
            <g>
              <circle cx={X(p + half)} cy={88} r={3} fill={RD} />
              <circle cx={X(p - half)} cy={88} r={3} fill={RD} />
              <T x={X(p + half)} y={80} c={RD} s={6}>?</T>
            </g>
          )}
        </g>
      );
    }
    case "shot": {
      const sx = 120 / Math.max(10, d.X);
      const sy = Math.min(sx, 60 / Math.max(10, Math.abs(d.Y) + 10));
      const X0 = 16;
      const Y0 = d.Y >= 0 ? 84 : 40;
      return (
        <g>
          <line x1={X0} y1={Y0} x2={152} y2={Y0} stroke={DIM} />
          <circle cx={X0} cy={Y0} r={3} fill={RD} />
          <circle cx={X0 + d.X * sx} cy={Y0 - d.Y * sy} r={4} fill={Y} />
          <line x1={X0 + d.X * sx} y1={Y0} x2={X0 + d.X * sx} y2={Y0 - d.Y * sy} stroke={Y} strokeDasharray="2 2" />
          <T x={(X0 + X0 + d.X * sx) / 2} y={Y0 + 8} c={Y} s={6}>{`x = ${d.X} m`}</T>
          <T x={X0 + d.X * sx - 4} y={Y0 - d.Y * sy - 9} c={Y} s={6} a="end">{`y = ${d.Y < 0 ? "−" : ""}${Math.abs(d.Y)} m`}</T>
          {d.angle !== undefined && <Ray cx={X0} cy={Y0} deg={d.angle} len={22} c={CY} />}
          {d.angle !== undefined && <AngleMark cx={X0} cy={Y0} a0={0} a1={d.angle} r={10} label="θ" />}
        </g>
      );
    }
    case "scale":
      return (
        <g>
          <rect x={10} y={30} width={140} height={14} fill="none" stroke={WH} />
          {Array.from({ length: 6 }, (_, i) => <rect key={i} x={10 + i * 28} y={30} width={14} height={14} fill={WH} />)}
          <T x={10} y={56} c={Y} s={7} a="start">{`1 cm = ${d.per} ${d.unit}`}</T>
          <T x={80} y={76} c={CY} s={7}>{`${d.cm} cm on the drawing`}</T>
        </g>
      );
    case "spin": {
      const ax = 70;
      return (
        <g>
          <line x1={ax} y1={8} x2={ax} y2={94} stroke={RD} strokeDasharray="4 3" strokeWidth={2} />
          {d.shape === "rect" && <rect x={ax} y={24} width={36} height={56} fill="#ffd23f" fillOpacity={0.8} stroke="#0a1030" />}
          {d.shape === "tri" && <polygon points={pts([[ax, 20], [ax, 80], [ax + 40, 80]])} fill="#ffd23f" fillOpacity={0.8} stroke="#0a1030" />}
          {d.shape === "semi" && <path d={`M${ax},16 A34,34 0 0 1 ${ax},84 Z`} fill="#ffd23f" fillOpacity={0.8} stroke="#0a1030" />}
          <path d={`M${ax - 26},50 A26,8 0 1 0 ${ax + 26},50`} fill="none" stroke={CY} strokeWidth={1.5} />
          <T x={ax + 30} y={50} c={CY} s={10} a="start">↻</T>
        </g>
      );
    }
    case "cav":
      return (
        <g stroke="#0a1030" strokeWidth={1.2}>
          <path d="M20,30 L20,80 A20,6 0 0 0 60,80 L60,30" fill={FACE.front} />
          <ellipse cx={40} cy={30} rx={20} ry={6} fill={FACE.top} />
          <path d="M96,30 L86,80 A20,6 0 0 0 126,80 L136,30" fill={FACE.front} />
          <ellipse cx={116} cy={30} rx={20} ry={6} fill={FACE.top} />
          <line x1={10} y1={55} x2={150} y2={55} stroke={Y} strokeDasharray="3 2" />
          <T x={80} y={94} c={Y} s={6}>same slices, same height</T>
        </g>
      );
    case "fire":
    case "bell":
    case "egg":
      return <T x={50} y={32} c={Y} s={10}>{d.t.toUpperCase()}</T>;
  }
}

/*
 * Splash Arc content and physics checks (npm test). Recomputes everything independently:
 *  - physics: simulation vs the range formula and the exact equations of motion, wind,
 *    guide arc = prefix of the real flight, planets;
 *  - levels: every level at every grade is solvable (a known whole-number angle/power hits
 *    every target), targets sit on screen and don't overlap;
 *  - questions: hundreds per grade; each answer recomputed from the question's numbers
 *    (angle relationships, trig to the nearest degree, Pythagorean triples and non-triples,
 *    areas by the shoelace formula, volumes by slicing, surface areas from faces, faces/edges/
 *    vertices from vertex lists, cross-sections by cutting the solids), exactly one correct
 *    choice, the aim an answer gives really hits, text limits, NC codes valid for the grade.
 */
import { GRADES } from "../src/kit/grades";
import { mathQuestion } from "../src/kit/math";
import type { Grade } from "../src/kit/types";
import { hasGlyphs } from "../src/splash/font";
import { bandOf, bestAim, buildLevel, goodAngles, hitBox, levelCount, plansFor, shotBase, worldOf, type Level } from "../src/splash/levels";
import { DT, PLANETS, S, exactPos, heightAt, rangeFormula, simulate, speedOf, type PlanetId, type World } from "../src/splash/physics";
import { GENS, gensFor, nextQuestion, spotAngle, turnDir, type ShotQ } from "../src/splash/questions";
import { makeRng } from "../src/splash/rng";
import { PARTS_INFO, PART_CUTS, SECTION, SHAPE_VERTS, SOLID_FACTS, attrs2D, boxSurface, partSizes, polyArea, tankVolume, type Cut, type Solid, type Tank } from "../src/splash/shapes";

let failures = 0;
let checks = 0;
function ok(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    if (failures < 60) console.error("FAIL:", msg);
  }
}
const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps;

// ================================================================== physics
{
  const flat: World = { width: 100000, groundY: 0, rects: [], targets: [] };
  for (const planet of ["earth", "mars", "moon"] as PlanetId[]) {
    for (const ang of [15, 30, 45, 60, 75]) {
      for (const pw of [30, 60, 90]) {
        const r = simulate(flat, { x0: 0, y0: 0, angle: ang, power: pw, planet, wind: 0 });
        const R = rangeFormula(speedOf(pw, planet), ang, PLANETS[planet].g) * S;
        ok(r.end.kind === "ground" && near(r.end.x, R, 0.05), `range ${planet} ${ang}° p${pw}: sim ${r.end.x.toFixed(3)} vs formula ${R.toFixed(3)}`);
        // Every simulated point lies on the exact trajectory.
        let worst = 0;
        r.pts.slice(0, -1).forEach((p, i) => {
          const [ex, ey] = exactPos({ x0: 0, y0: 0, angle: ang, power: pw, planet, wind: 0 }, i * DT);
          worst = Math.max(worst, Math.abs(ex - p[0]), Math.abs(ey - p[1]));
        });
        ok(worst < 1e-6, `trajectory error ${worst} at ${planet} ${ang}° p${pw}`);
        // y = x tanθ − g x² / (2 v² cos²θ) matches the flight (in metres).
        const mid = r.pts[Math.floor(r.pts.length / 2)];
        const yF = heightAt(mid[0] / S, speedOf(pw, planet), ang, PLANETS[planet].g);
        ok(near(yF, -mid[1] / S, 1e-6), `trajectory equation ${planet} ${ang}°`);
      }
    }
  }
  // Wind: exact with a sideways acceleration, and it pushes the landing downwind.
  for (const wind of [-2, -0.5, 0.5, 2]) {
    const shot = { x0: 0, y0: 0, angle: 50, power: 60, planet: "earth" as PlanetId, wind };
    const r = simulate(flat, shot);
    const calm = simulate(flat, { ...shot, wind: 0 });
    ok(wind > 0 ? r.end.x > calm.end.x : r.end.x < calm.end.x, `wind ${wind} moves the landing downwind`);
    let worst = 0;
    r.pts.slice(0, -1).forEach((p, i) => {
      const [ex, ey] = exactPos(shot, i * DT);
      worst = Math.max(worst, Math.abs(ex - p[0]), Math.abs(ey - p[1]));
    });
    ok(worst < 1e-6, `wind trajectory error ${worst}`);
    // Flight time unchanged by a sideways wind: 2 v sinθ / g.
    const T = (2 * speedOf(60, "earth") * Math.sin((50 * Math.PI) / 180)) / 9.8;
    ok(near(r.end.t, T, DT), `wind flight time ${r.end.t} vs ${T}`);
  }
  // Guide arc = prefix of the real flight on a real level (same function, deterministic).
  const lv = buildLevel("7", 2, 1);
  const shot = { ...shotBase(lv), angle: 47, power: 66 };
  const a = simulate(worldOf(lv), shot);
  const b = simulate(worldOf(lv), shot);
  const guide = a.pts.slice(0, Math.ceil(a.pts.length * 0.6));
  ok(guide.every((p, i) => p[0] === b.pts[i][0] && p[1] === b.pts[i][1]), "guide arc is a prefix of the flight");
  ok(a.end.kind === b.end.kind && a.end.x === b.end.x, "simulation is deterministic");
}

// ================================================================== independent geometry facts
{
  type V3 = [number, number, number];
  const polys: Record<string, { v: V3[]; f: number[][] }> = {
    cube: { v: [[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0], [0, 0, 2], [2, 0, 2], [2, 2, 2], [0, 2, 2]], f: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] },
    prism: { v: [[0, 0, 0], [6, 0, 0], [6, 3, 0], [0, 3, 0], [0, 0, 4], [6, 0, 4], [6, 3, 4], [0, 3, 4]], f: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] },
    // Lies on a rectangle; triangle ends at x = 0 and x = 6.
    triprism: { v: [[0, 0, 0], [0, 4, 0], [0, 2, 3], [6, 0, 0], [6, 4, 0], [6, 2, 3]], f: [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]] },
    pyramid: { v: [[0, 0, 0], [4, 0, 0], [4, 4, 0], [0, 4, 0], [2, 2, 5]], f: [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]] },
  };
  for (const [name, p] of Object.entries(polys)) {
    const edges = new Set<string>();
    for (const f of p.f) for (let i = 0; i < f.length; i++) edges.add([f[i], f[(i + 1) % f.length]].sort().join("-"));
    const facts = SOLID_FACTS[name as Solid];
    ok(facts.faces === p.f.length && facts.edges === edges.size && facts.vertices === p.v.length, `F/E/V of ${name}`);
    ok(p.f.length - edges.size + p.v.length === 2, `Euler for ${name}`);
    const squares = p.f.every((f) => {
      if (f.length !== 4) return false;
      const L = f.map((k, i) => {
        const a = p.v[k];
        const b = p.v[f[(i + 1) % 4]];
        return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      });
      return L.every((x) => near(x, L[0], 1e-9));
    });
    ok(facts.allSquareFaces === squares, `all-square faces of ${name}`);
    // Cross-sections: cut the solid, count the cut polygon's corners, compare side lengths.
    const cutShape = (cut: Cut): string => {
      const pts: V3[] = [];
      const zs = p.v.map((v) => v[2]);
      const xs = p.v.map((v) => v[0]);
      const ys = p.v.map((v) => v[1]);
      // "level" = parallel to the base (z = mid); "upright" = through the middle parallel to a front face.
      // For the triangular prism the front faces are its triangles (x = const).
      const axis = cut === "level" ? 2 : name === "triprism" ? 0 : 1;
      const lo = Math.min(...(axis === 2 ? zs : axis === 0 ? xs : ys));
      const hi = Math.max(...(axis === 2 ? zs : axis === 0 ? xs : ys));
      const c = lo + (hi - lo) * 0.5;
      for (const e of edges) {
        const [i, j] = e.split("-").map(Number);
        const a = p.v[i];
        const b = p.v[j];
        if ((a[axis] - c) * (b[axis] - c) <= 0 && a[axis] !== b[axis]) {
          const t = (c - a[axis]) / (b[axis] - a[axis]);
          pts.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])]);
        }
      }
      const uniq = pts.filter((q, k) => pts.findIndex((r) => Math.hypot(r[0] - q[0], r[1] - q[1], r[2] - q[2]) < 1e-9) === k);
      if (uniq.length === 3) return "triangle";
      if (uniq.length === 4) {
        const ds = uniq.flatMap((q, k) => uniq.slice(k + 1).map((r) => Math.hypot(r[0] - q[0], r[1] - q[1], r[2] - q[2]))).sort((x, y) => x - y);
        return near(ds[0], ds[3], 1e-9) ? "square" : "rectangle";
      }
      return `${uniq.length}-gon`;
    };
    for (const cut of ["level", "upright"] as Cut[]) ok(SECTION[name as Solid][cut] === cutShape(cut), `cross-section ${name} ${cut}: table ${SECTION[name as Solid][cut]} vs cut ${cutShape(cut)}`);
  }
  // Round solids: a level cut of a cylinder, cone or sphere is a circle; upright cuts through the axis.
  ok(SECTION.cylinder.level === "circle" && SECTION.cone.level === "circle" && SECTION.sphere.level === "circle" && SECTION.sphere.upright === "circle", "round solids level cuts");
  ok(SECTION.cylinder.upright === "rectangle" && SECTION.cone.upright === "triangle", "round solids upright cuts");
  ok(SOLID_FACTS.cylinder.rolls && SOLID_FACTS.cone.rolls && SOLID_FACTS.sphere.rolls && !SOLID_FACTS.cube.rolls, "rolling solids");

  // 2-D attributes recomputed with angles in degrees.
  for (const [name, v] of Object.entries(SHAPE_VERTS)) {
    if (!v.length) continue;
    const a = attrs2D(name as keyof typeof SHAPE_VERTS);
    let right = 0;
    for (let i = 0; i < v.length; i++) {
      const p = v[(i + v.length - 1) % v.length];
      const q = v[i];
      const r = v[(i + 1) % v.length];
      const ang = Math.abs(Math.atan2(p[1] - q[1], p[0] - q[0]) - Math.atan2(r[1] - q[1], r[0] - q[0])) * (180 / Math.PI);
      if (near(ang % 180, 90, 1e-9)) right++;
    }
    ok(a.rightAngles === right && a.sides === v.length, `2-D attributes of ${name}`);
  }
  const names: Record<string, number> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, rhombus: 4, parallelogram: 4, trapezoid: 4, rightTrapezoid: 4, kite: 4 };
  for (const [n, k] of Object.entries(names)) ok(SHAPE_VERTS[n as keyof typeof SHAPE_VERTS].length === k, `${n} has ${k} sides`);
  ok(attrs2D("square").rightAngles === 4 && attrs2D("square").allSidesEqual, "square");
  ok(attrs2D("rhombus").allSidesEqual && attrs2D("rhombus").rightAngles === 0 && attrs2D("rhombus").parallelPairs === 2, "rhombus");
  ok(attrs2D("trapezoid").parallelPairs === 1 && attrs2D("rightTrapezoid").rightAngles === 2 && attrs2D("kite").parallelPairs === 0, "trapezoids and kite");
  // Halves / thirds / fourths really are equal; the unequal ones are not.
  for (const [k, info] of Object.entries(PARTS_INFO)) {
    const sz = partSizes(k as keyof typeof PART_CUTS);
    ok(sz.length === info.count && near(sz.reduce((x, y) => x + y, 0), 1, 1e-9), `${k} parts add to a whole`);
    ok(sz.every((s) => near(s, sz[0], 1e-9)) === info.equal, `${k} equal = ${info.equal}`);
  }
  // Turns
  ok(turnDir("right", "half") === "left" && turnDir("up", "quarter") === "right" && turnDir("right", "quarter") === "down" && turnDir("left", "full") === "left", "turns");
}

/** Volume by slicing (Cavalieri / Riemann sum over the height). */
function sliceVolume(t: Tank): number {
  const N = 4000;
  let v = 0;
  const H = t.kind === "box" ? t.h : t.kind === "step" ? Math.max(t.h1, t.h2) : t.kind === "tri" ? t.th : t.kind === "sphere" ? 2 * t.r : t.h;
  for (let i = 0; i < N; i++) {
    const z = ((i + 0.5) / N) * H;
    let A = 0;
    switch (t.kind) {
      case "box":
        A = t.l * t.w;
        break;
      case "step":
        A = t.w * ((z < t.h1 ? t.l1 : 0) + (z < t.h2 ? t.l2 : 0));
        break;
      case "tri":
        A = t.b * (1 - z / t.th) * t.len;
        break;
      case "cylinder":
        A = t.r * t.r; // ÷ π
        break;
      case "cone":
        A = (t.r * (1 - z / t.h)) ** 2;
        break;
      case "sphere":
        A = t.r * t.r - (z - t.r) ** 2;
        break;
      case "pyramid":
        A = (t.s * (1 - z / t.h)) ** 2;
        break;
    }
    v += (A * H) / N;
  }
  return v;
}

// ================================================================== levels and questions
const CODE = /^NC\.(K|[1-8])\.(G|MD|EE)\.\d+$|^NC\.M[1-3]\.[A-Z]-[A-Z]{2,4}\.\d+$/;
function codeBandOk(code: string, g: Grade): boolean {
  const m = code.match(/^NC\.(K|\d)\./);
  const hs = code.match(/^NC\.M(\d)\./);
  const b = bandOf(g);
  if (b === "HS") return !!hs;
  if (!m) return false;
  const cg = m[1] === "K" ? 0 : Number(m[1]);
  const n = g === "K" ? 0 : Number(g);
  if (b === "K2") return cg <= 2 && cg <= n;
  return cg === n;
}

const gensSeen = new Set<string>();
const num = (s: string) => Number(s.replace(/[^\d.\-]/g, ""));

function checkQuestion(q: ShotQ, lv: Level, g: Grade) {
  const tag = `[${g} L${lv.index + 1} ${q.gen}] ${q.prompt}`;
  gensSeen.add(q.gen);
  ok(q.choices.length === 4 && new Set(q.choices).size === 4, `4 distinct choices: ${tag} ${JSON.stringify(q.choices)}`);
  ok(q.answer >= 0 && q.answer < 4, `answer index ${tag}`);
  ok(CODE.test(q.standard), `code format ${q.standard} ${tag}`);
  ok(codeBandOk(q.standard, g), `code ${q.standard} fits grade ${g}: ${tag}`);
  ok(q.prompt.length <= (bandOf(g) === "K2" ? 110 : 240), `prompt length ${q.prompt.length}: ${tag}`);
  ok(q.choices.every((c) => c.length <= 28), `choice length: ${tag} ${JSON.stringify(q.choices)}`);
  ok(q.explanation.length > 10 && q.explanation.length <= 300, `explanation: ${tag}`);
  ok(!/\d\.\d{4,}/.test(q.prompt + q.explanation + q.choices.join("|")), `no long float digits: ${tag} ${JSON.stringify(q.choices)}`);
  ok(!/undefined|NaN|Infinity/.test(q.prompt + q.explanation + q.choices.join("|")), `no undefined/NaN: ${tag} ${q.explanation}`);
  ok(!lv.targets[q.target].watered || q.effect.type === "pick", `question aims at a dry target: ${tag}`);
  const e = q.effect;
  const m = q.meta as Record<string, number & string & boolean & unknown[]>;
  if (e.type === "pick") {
    ok(e.targets.join() === "0,1,2,3", `pick maps A-D to targets: ${tag}`);
    ok(q.target === q.answer && !lv.targets[q.answer].watered, `pick answer is a dry target: ${tag}`);
    if (Array.isArray(m.values)) ok((m.values as boolean[]).filter(Boolean).length === 1 && (m.values as boolean[])[q.answer], `pick has exactly one matching target: ${tag}`);
    ok(goodAngles(lv, q.answer).length > 0, `picked target reachable: ${tag}`);
  }
  if (e.type === "angle") {
    ok(new Set(e.values).size === 4 && e.values.every((v) => Number.isInteger(v) && v > 0 && v < 180), `angle values: ${tag}`);
    ok(q.choices.every((c, i) => c === `${e.values[i]}°`), `angle text matches value: ${tag}`);
    const a = e.values[q.answer];
    ok(lv.sol[q.target].has(a), `correct angle ${a}° can hit the target: ${tag}`);
  }
  if (e.type === "pair") {
    const [a, p] = e.values[q.answer];
    const r = simulate(worldOf(lv), { ...shotBase(lv), angle: a, power: p }, { record: false });
    ok(r.end.kind === "target" && r.end.target === q.target, `correct pair hits: ${tag}`);
    const { X, Y, g: gg, tol } = q.meta as { X: number; Y: number; g: number; tol: number };
    e.values.forEach(([an, pw], i) => {
      const y = heightAt(X, speedOf(pw, lv.planet), an, gg);
      const hit = Math.abs(y - Y) <= tol;
      ok(i === q.answer ? hit : !hit, `pair ${i} formula check (y=${y.toFixed(1)} vs ${Y}): ${tag}`);
      if (i !== q.answer) {
        const rr = simulate(worldOf(lv), { ...shotBase(lv), angle: an, power: pw }, { record: false });
        ok(!(rr.end.kind === "target" && rr.end.target === q.target), `wrong pair misses: ${tag}`);
      }
      ok(q.choices[i] === `${an}°, ${Math.round(speedOf(pw, lv.planet) * 100) / 100} m/s`, `pair text: ${tag}`);
    });
  }
  const ansVal = e.type === "angle" ? e.values[q.answer] : NaN;
  const ansTxt = q.choices[q.answer];
  // ---- per-generator recomputation
  switch (q.gen) {
    case "g4-protractor":
      ok(ansVal === m.a && q.preset?.angle === m.a, tag);
      break;
    case "g4-turn":
      ok(ansVal === (m.one ? (360 * (m.n as number)) / (m.d as number) : m.a), tag);
      break;
    case "g4-add":
      ok(ansVal === (m.x !== undefined ? (m.x as number) + (m.y as number) : 180 - (m.b as number)), tag);
      break;
    case "g4-classify": {
      const s = m.shown as number;
      ok(ansTxt === (s < 90 ? "Acute" : s === 90 ? "Right" : s < 180 ? "Obtuse" : "Straight"), tag);
      break;
    }
    case "g3-right":
      ok(ansTxt === ((m.shown as number) < 90 ? "Smaller than a right angle" : "Bigger than a right angle"), tag);
      break;
    case "g7-compsupp":
      ok(ansVal + (m.given as number) === (m.supp ? 180 : 90), tag);
      break;
    case "g7-vertical":
      ok(ansVal === (m.vert ? m.given : 180 - (m.given as number)), tag);
      break;
    case "g7-equation":
      ok(ansVal + (m.k as number) * ansVal + (m.r as number) === m.tot, tag);
      break;
    case "g7-scale":
      ok(num(ansTxt) === (m.cm as number) * (m.per as number), tag);
      break;
    case "g8-parallel": {
      // Independent: angles at each crossing alternate α, 180−α going round; same spots at both crossings.
      const alpha = m.alpha as number;
      const at = (s: number) => [alpha, 180 - alpha, alpha, 180 - alpha][s % 4];
      ok(at(m.given as number) === spotAngle(alpha, m.given as number) && ansVal === at(m.launch as number), tag);
      const gv = at(m.given as number);
      ok(m.rel === "same-side interior" ? gv + ansVal === 180 : gv === ansVal, `relation ${m.rel}: ${tag}`);
      break;
    }
    case "g8-triangle":
      ok(m.isExt ? ansVal === (m.ext as number) - (m.top as number) : ansVal + (m.b as number) + (m.top as number) === 180, tag);
      break;
    case "g8-reflect":
      ok(ansVal === 180 - (m.g as number), tag);
      break;
    case "g8-pyth": {
      const c = Math.hypot(m.a as number, m.b as number);
      ok(Number.isInteger(c) === m.triple, `triple flag: ${tag}`);
      ok(near(num(ansTxt), Math.round(c * 10) / 10, 1e-9), `hypotenuse ${c}: ${tag}`);
      ok(q.choices.filter((x) => near(num(x), Math.round(c * 10) / 10, 1e-9)).length === 1, `one right choice: ${tag}`);
      break;
    }
    case "g8-dist": {
      const c = Math.hypot(m.dx as number, m.dy as number);
      ok(num(ansTxt) === c && q.choices.filter((x) => num(x) === c).length === 1, tag);
      break;
    }
    case "g8-slope": {
      const [p, r] = ansTxt.split("/").map(Number);
      ok(near((p ?? 0) / (r ?? 1), (m.rise as number) / (m.run as number), 1e-9), tag);
      ok(q.choices.filter((x) => {
        const [a, b] = x.split("/").map(Number);
        return near(a / (b ?? 1), (m.rise as number) / (m.run as number), 1e-9);
      }).length === 1, `one equal slope: ${tag}`);
      break;
    }
    case "h-trig": {
      const { fn, p, q: qq } = m as unknown as { fn: string; p: number; q: number };
      const val = fn === "tan" ? Math.atan2(p, qq) : fn === "sin" ? Math.asin(p / qq) : Math.acos(p / qq);
      const d = Math.round((val * 180) / Math.PI);
      ok(ansVal === d && e.type === "angle" && e.values.filter((v) => v === d).length === 1, `trig nearest degree ${d}: ${tag}`);
      break;
    }
    case "h-vertex": {
      const { d, k, x, p, ask } = m as unknown as { d: number; k: number; x: number; p: number; ask: string };
      ok(near(k / (d * d), 1 / x, 1e-12), `parabola coefficient: ${tag}`);
      const h = (xx: number) => -(1 / x) * (xx - p) ** 2 + k;
      const want = ask === "max" ? k : ask === "vx" ? p : p + d;
      ok(num(ansTxt) === want && (ask !== "land" || near(h(want), 0, 1e-9)), tag);
      break;
    }
    case "h-zeros": {
      const { L, m: mm, ask } = m as unknown as { L: number; m: number; ask: string };
      const h = (xx: number) => -(1 / mm) * xx * (xx - L);
      const want = ask === "land" ? L : ask === "max" ? h(L / 2) : L / 2;
      ok(num(ansTxt) === want, `zeros ${want}: ${tag}`);
      break;
    }
    case "h-cavalieri":
      ok(ansTxt === `${(m.r as number) ** 2 * (m.h as number)}π m³`, tag);
      break;
    case "h-density":
      ok(num(ansTxt) === (m.v as number) * 1000, tag);
      break;
    case "g6-side":
      ok(num(ansTxt) === (m.x as number) - (m.x0 as number), tag);
      break;
    case "g5-units":
      ok(num(ansTxt) === (m.meters as number) / 1000, tag);
      break;
    case "g4-units":
      ok(num(ansTxt) === (m.m as number) * 100, tag);
      break;
    case "g1-turn":
    case "g2-turn":
      ok(ansTxt.toLowerCase().includes(turnDir(m.from as never, m.kind as never)), tag);
      break;
    case "g7-section":
    case "h-section":
      ok(ansTxt.toLowerCase() === SECTION[m.solid as Solid][m.cut as Cut], tag);
      break;
    case "g5-coord":
    case "g5-word": {
      const coords = m.coords as [number, number][];
      ok(coords.filter((c) => c[0] === m.x && c[1] === m.y).length === 1 && coords[q.answer][0] === m.x && coords[q.answer][1] === m.y, tag);
      break;
    }
    case "g6-corner": {
      const coords = m.coords as [number, number][];
      // The 4th corner of a rectangle (a,by) (a,d) (cx,d) is (cx,by): recompute with vectors.
      const A = [m.a as number, m.by as number];
      const B = [m.a as number, m.d as number];
      const C = [m.cx as number, m.d as number];
      const D = [A[0] + C[0] - B[0], A[1] + C[1] - B[1]];
      ok(coords[q.answer][0] === D[0] && coords[q.answer][1] === D[1] && coords.filter((c) => c[0] === D[0] && c[1] === D[1]).length === 1, tag);
      break;
    }
  }
  // Pick questions about numbers: recompute what each target measures.
  const n = Number((q.prompt.match(/(\d+(?:[½¼¾])?)/g) ?? []).pop()?.replace("½", ".5").replace("¼", ".25").replace("¾", ".75"));
  if (q.gen === "g6-area") {
    const areas = lv.targets.map((t) => polyArea(t.area!.verts));
    ok(areas.filter((a) => near(a, n, 1e-9)).length === 1 && near(areas[q.answer], n, 1e-9), `area by shoelace ${areas}: ${tag}`);
    lv.targets.forEach((t) => ok(near(polyArea(t.area!.verts), t.area!.area, 1e-9), `area formula vs shoelace: ${tag}`));
  }
  if (["g5-volume", "g6-fracvol", "g8-volume", "h-volume", "g5-cubes"].includes(q.gen) || (q.gen === "g7-volume" && !q.prompt.includes("surface"))) {
    const pi = q.prompt.includes("π");
    const vols = lv.targets.map((t) => (t.tank && (t.tank.kind === "cylinder" || t.tank.kind === "cone" || t.tank.kind === "sphere") === pi ? sliceVolume(t.tank) : NaN));
    const matches = vols.filter((v) => near(v, n, 0.01)).length;
    ok(matches === 1 && near(vols[q.answer], n, 0.01), `volume by slicing ${vols.map((v) => v.toFixed(2))} vs ${n}: ${tag}`);
    lv.targets.forEach((t) => t.tank && ok(near(sliceVolume(t.tank), tankVolume(t.tank), 0.01), `volume formula vs slicing ${t.tank.kind}`));
  }
  if (q.gen === "g6-surface" || (q.gen === "g7-volume" && q.prompt.includes("surface"))) {
    const sa = lv.targets.map((t) => {
      const k = t.tank as { l: number; w: number; h: number };
      // Six faces, listed one by one.
      return k.l * k.w + k.l * k.w + k.l * k.h + k.l * k.h + k.w * k.h + k.w * k.h;
    });
    ok(sa.filter((v) => near(v, n, 1e-9)).length === 1 && near(sa[q.answer], n, 1e-9), `surface area ${sa}: ${tag}`);
    lv.targets.forEach((t) => {
      const k = t.tank as { l: number; w: number; h: number };
      ok(boxSurface(k.l, k.w, k.h) === sa[t.i], "surface formula");
    });
  }
  if (q.gen === "g3-perim") {
    const per = lv.targets.map((t) => {
      const v: [number, number][] = [[0, 0], [t.bed![0], 0], [t.bed![0], t.bed![1]], [0, t.bed![1]]];
      return v.reduce((s, p, i) => s + Math.hypot(v[(i + 1) % 4][0] - p[0], v[(i + 1) % 4][1] - p[1]), 0);
    });
    const P = Number(q.prompt.match(/perimeter of (\d+)/)![1]);
    ok(per.filter((p) => p === P).length === 1 && per[q.answer] === P, `perimeter ${per}: ${tag}`);
  }
  if (q.gen === "g3-area") {
    const A = Number(q.prompt.match(/AREA of (\d+)/)![1]);
    const areas = lv.targets.map((t) => polyArea([[0, 0], [t.bed![0], 0], [t.bed![0], t.bed![1]], [0, t.bed![1]]]));
    ok(areas.filter((a) => a === A).length === 1 && areas[q.answer] === A, tag);
  }
  if (q.gen === "g6-net") ok(lv.targets[q.answer].solid === m.solid && lv.targets.filter((t) => t.solid === m.solid).length === 1, tag);
}

const SEEDS = [1, 2, 3];
let levelsBuilt = 0;
let questions = 0;
const perGrade: Record<string, number> = {};
for (const g of GRADES) {
  const plans = plansFor(g);
  ok(levelCount(g) === plans.length && plans.length >= 4, `grade ${g} has levels`);
  ok(plans.some((p) => p.wind !== 0), `grade ${g} has a windy level`);
  ok(gensFor(g).length >= 3, `grade ${g} has generators`);
  for (let i = 0; i < plans.length; i++) {
    for (const seed of SEEDS) {
      let lv: Level;
      try {
        lv = buildLevel(g, i, seed);
      } catch (err) {
        ok(false, `build grade ${g} level ${i} seed ${seed}: ${err}`);
        continue;
      }
      levelsBuilt++;
      // Solvable: the known aim for each target hits it.
      lv.targets.forEach((t) => {
        const aim = bestAim(lv, t.i);
        const r = simulate(worldOf(lv), { ...shotBase(lv), ...aim }, { record: false });
        ok(r.end.kind === "target" && r.end.target === t.i, `grade ${g} L${i + 1} seed ${seed}: known aim ${JSON.stringify(aim)} hits ${t.letter}`);
        const b = hitBox(t);
        ok(b.x >= 0 && b.x + b.w <= 320 && b.y >= 20, `target ${t.letter} on screen`);
        ok(lv.buildings.some((r2) => r2.x <= t.x && r2.x + r2.w >= t.x && r2.y === t.y), `target ${t.letter} sits on a roof`);
      });
      for (let a = 0; a < 4; a++) for (let c = a + 1; c < 4; c++) {
        const A = hitBox(lv.targets[a]);
        const B = hitBox(lv.targets[c]);
        ok(A.x + A.w < B.x || B.x + B.w < A.x, `targets ${a}/${c} don't overlap`);
      }
      ok(lv.targets.every((t, k) => k === 0 || t.x > lv.targets[k - 1].x), "targets A-D run left to right");
      if (lv.grid) lv.targets.forEach((t) => ok(t.coord && t.x === t.coord[0] * 16 && t.y === 192 - t.coord[1] * 16, "grid coordinates match positions"));
      // Questions: many per level, with targets watered progressively.
      const rng = makeRng(seed * 97 + i);
      for (let k = 0; k < 36; k++) {
        if (k === 18) lv.targets[rng.int(0, 3)].watered = true;
        const live = lv.targets.filter((t) => !t.watered).map((t) => t.i);
        const target = rng.pick(live);
        const lastMiss = rng() < 0.3 ? { target, side: rng() < 0.5 ? ("short" as const) : ("long" as const) } : null;
        const q = nextQuestion({ grade: g, lv, target, rng, lastMiss, power: rng.int(30, 90) });
        checkQuestion(q, lv, g);
        questions++;
        perGrade[g] = (perGrade[g] ?? 0) + 1;
      }
      lv.targets.forEach((t) => (t.watered = false));
    }
  }
  // Kit transmissions (the deck's generated math) work for every grade.
  for (let k = 0; k < 5; k++) {
    const tq = mathQuestion(g);
    ok(tq.subject === "math" && tq.choices.length === 4 && tq.answer >= 0 && tq.answer < 4, `transmission for grade ${g}`);
  }
}
for (const gen of GENS) ok(gensSeen.has(gen.id), `generator ${gen.id} was exercised`);

// Canvas text uses only glyphs the bitmap font has.
for (const g of GRADES) for (const p of plansFor(g)) ok(hasGlyphs(p.title) && hasGlyphs(`LEVEL 5`), `font glyphs for ${p.title}`);
for (const s of ["SPLASH!", "CALM", "→1.5", "←2.0", "55°", "0123456789", "ABCD"]) ok(hasGlyphs(s), `glyphs for ${s}`);

console.log(`levels built: ${levelsBuilt}, questions checked: ${questions}`, perGrade);
console.log(`generators exercised: ${gensSeen.size}/${GENS.length}`);
console.log(`${checks} checks, ${failures} failures`);
if (failures) process.exit(1);

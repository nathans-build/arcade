/*
 * npm test: checks Lab Capsules' rules and content without a browser.
 *  - Board: spawn, move, rotate (CW/CCW, wall kicks), lock, drop, 4-in-a-line matches by
 *    MEANING, bonus clusters (number bonds, molecules, ionic compounds), gravity, chains,
 *    win and lose through the game clock.
 *  - Content: every fact/expression/equation label computes to its kind; element symbols,
 *    names and atomic numbers, ion charges, molecule and compound formulas are accurate;
 *    balancing items balance.
 *  - Lab Quiz items: 4 unique choices, a valid answer index that is really right, an
 *    explanation and a standard code.
 *  - Every grade × focus × level generates a level a bot can clear; quiz answers never end a run.
 *  - Topics: ?topic= handling and every focus gives lab sets at every grade.
 */
import { Bottle, COLS, ROWS, germRows, germTarget, placeGerms, pieceCells, type Piece, type Pos } from "../src/lab/board";
import {
  BALANCING, ELEMENTS, ELEMENT_GROUPS_3, ELEMENT_GROUPS_4, IONS, MATTER, NOT_A_COMPOUND, RECIPES,
  balanceAnswer, balanceText, bandOf, compoundFor, evalInt, factProducts, factReps, gradeN, ionById, ionicFormula, makeLevelSet, makeQuiz,
  plain, solveEquation, type LevelSet, type SetId, type Token,
} from "../src/lab/content";
import { FALL_STEP_MS, FLASH_MS, LabGame, SPEEDS } from "../src/lab/game";
import { seeded } from "../src/lab/rng";
import { LabRun } from "../src/lab/run";
import { DEFAULT_PREF, OFFERED, TOPICS, parsePref, readUrlFocus, resolveFocus, setCycle, type Focus } from "../src/lab/topics";
import { GRADES } from "../src/kit/grades";
import type { Grade } from "../src/kit/types";

let passed = 0;
const failures: string[] = [];
function ok(cond: unknown, msg: string) {
  if (cond) passed++;
  else failures.push(msg);
}
function eq<T>(a: T, b: T, msg: string) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  ok(sa === sb, `${msg}: got ${sa}, want ${sb}`);
}

const tok = (kind: number, label = `k${kind}`, key = label, num?: number): Token => (num === undefined ? { kind, key, label, say: label } : { kind, key, label, say: label, num });

/* ================================================================== board basics */
{
  const b = new Bottle();
  const p = b.spawn(tok(0), tok(1))!;
  eq(pieceCells(p), [[0, 3], [0, 4]], "spawn cells");
  ok(!p.vertical, "spawns horizontal");

  // move to the walls
  let q: Piece | null = p;
  let lefts = 0;
  while ((q = b.move(q!, -1))) lefts++, (p.c = q.c);
  eq(lefts, 3, "3 moves left to the wall");
  let r: Piece = { ...p, c: 3 };
  let rights = 0;
  for (let n = b.move(r, 1); n; n = b.move(r, 1)) (r = n), rights++;
  eq(rights, 3, "3 moves right to the wall (horizontal piece ends at column 6)");
  eq(r.c, 6, "rightmost horizontal anchor");

  // rotation CW / CCW in open space
  const open: Piece = { r: 8, c: 3, vertical: false, a: tok(0, "A"), b: tok(1, "B") };
  const cw = b.rotate(open, 1)!;
  ok(cw.vertical, "CW makes vertical");
  eq([cw.r, cw.c], [8, 3], "CW keeps the anchor in open space");
  eq([cw.a.label, cw.b.label], ["B", "A"], "CW: left half goes on top");
  const back = b.rotate(cw, -1)!;
  eq([back.r, back.c, back.vertical, back.a.label, back.b.label], [8, 3, false, "A", "B"], "CCW undoes CW");
  const ccw = b.rotate(open, -1)!;
  eq([ccw.a.label, ccw.b.label], ["A", "B"], "CCW: right half goes on top");
  let spin: Piece = open;
  for (let i = 0; i < 4; i++) spin = b.rotate(spin, 1)!;
  eq([spin.r, spin.c, spin.vertical, spin.a.label, spin.b.label], [8, 3, false, "A", "B"], "four CW turns = no change");

  // wall kick: vertical on the right wall → horizontal slides left
  const wall: Piece = { r: 8, c: 7, vertical: true, a: tok(0, "A"), b: tok(1, "B") };
  const kicked = b.rotate(wall, 1)!;
  ok(kicked && !kicked.vertical && kicked.c === 6, "wall kick off the right wall");
  eq(pieceCells(kicked), [[8, 6], [8, 7]], "kicked cells");
  // kick off a tile
  const b2 = new Bottle();
  b2.put(8, 4, tok(2));
  const v: Piece = { r: 8, c: 3, vertical: true, a: tok(0), b: tok(1) };
  const k2 = b2.rotate(v, 1)!;
  eq(pieceCells(k2), [[8, 2], [8, 3]], "kick left off a tile");
  // fully blocked: no rotation
  b2.put(8, 2, tok(2));
  ok(b2.rotate(v, 1) === null, "no rotation when both sides are blocked");
  // top row: horizontal → vertical kicks down
  const top = b.spawn(tok(0), tok(1))!;
  const tv = b.rotate(top, 1)!;
  ok(tv && tv.vertical && tv.r === 1 && tv.c === 3, "rotating on the top row kicks down one row");
  // horizontal → vertical with the column above blocked: tries the right half's column
  const b3 = new Bottle();
  b3.put(7, 3, tok(2));
  const h3: Piece = { r: 8, c: 3, vertical: false, a: tok(0), b: tok(1) };
  const r3 = b3.rotate(h3, 1)!;
  eq(pieceCells(r3), [[8, 4], [7, 4]], "H→V kick to the right half's column");

  // drop & lock
  const b4 = new Bottle();
  const d = b4.dropPos(b4.spawn(tok(0, "A"), tok(1, "B"))!);
  eq(d.r, ROWS - 1, "drops to the floor");
  const cells = b4.lock(d);
  eq(cells, [[15, 3], [15, 4]], "lock cells");
  eq([b4.at(15, 3)!.link, b4.at(15, 4)!.link], ["R", "L"], "horizontal halves are linked");
  const d2 = b4.dropPos(b4.rotate(b4.spawn(tok(2), tok(3))!, 1)!);
  eq(d2.r, 14, "lands on top of a tile");
  b4.lock(d2);
  eq([b4.at(14, 3)!.link, b4.at(13, 3)!.link], ["U", "D"], "vertical halves are linked");
  // spawn blocked → null
  const b5 = new Bottle();
  b5.put(0, 4, tok(0));
  ok(b5.spawn(tok(0), tok(1)) === null, "blocked spawn returns null");
}

/* ================================================================== matching by meaning */
{
  const b = new Bottle();
  // 3×4, 12, 2×6, 6×2 are one kind (12) → match
  ["3×4", "12", "2×6", "6×2"].forEach((l, i) => b.put(15, i, tok(0, l)));
  const m = b.findMatches();
  eq(m.length, 1, "4 labels of one meaning match");
  eq(m[0]?.cells.length, 4, "match length 4");
  const b2 = new Bottle();
  ["3×4", "12", "2×6"].forEach((l, i) => b2.put(15, i, tok(0, l)));
  b2.put(15, 3, tok(1, "15"));
  eq(b2.findMatches().length, 0, "3 + a different meaning: no match");
  const b3 = new Bottle();
  // same colour family label but different kind: "12" kind 0 vs "12?" never — check vertical 5-run
  for (let r = 11; r < 16; r++) b3.put(r, 2, tok(1, `x${r}`));
  const v = b3.findMatches();
  ok(v.length === 1 && v[0].cells.length === 5, "vertical run of 5 matches as one group");
  // match includes germs
  const b4 = new Bottle();
  b4.put(15, 0, tok(0, "Na"), true);
  b4.put(15, 1, tok(0, "sodium"));
  b4.put(15, 2, tok(0, "Na"));
  b4.put(15, 3, tok(0, "sodium"), true);
  const removed = b4.clear(b4.findMatches()[0].cells);
  eq(removed.filter((t) => t.germ).length, 2, "germs in a match are cleared");
  eq(b4.germCount(), 0, "germ count after clear");
}

/* ================================================================== gravity and chains */
{
  const b = new Bottle();
  b.put(15, 0, tok(0), true); // germ
  b.put(12, 0, tok(1)); // lone half floating
  b.put(14, 2, tok(2), true); // germ (never falls)
  // horizontal capsule over (13,4)-(13,5), supported only under column 4
  b.put(13, 4, tok(1), false, "R");
  b.put(13, 5, tok(2), false, "L");
  b.put(14, 4, tok(0), true);
  // vertical capsule floating at column 6
  b.put(10, 6, tok(1), false, "U");
  b.put(9, 6, tok(2), false, "D");
  b.settleFall();
  ok(b.at(14, 0) && !b.at(12, 0), "lone half falls onto the germ");
  ok(b.at(14, 2)?.germ, "germs never fall");
  ok(b.at(13, 4) && b.at(13, 5), "half-supported horizontal capsule stays");
  ok(b.at(15, 6) && b.at(14, 6) && b.at(15, 6)!.link === "U", "vertical capsule falls together");

  // chain: clearing a column lets a half fall into a row match
  const c = new Bottle();
  // bottom row: kind 0 at cols 0,1,2 ; col 3 has kind1 germ? no: build so that a half falls into (15,3)
  c.put(15, 0, tok(0), true);
  c.put(15, 1, tok(0), true);
  c.put(15, 2, tok(0), true);
  // column 3: (12..15) kind 2 ×4 vertical run: clearing it drops the kind-0 half on top into (15,3)
  c.put(11, 3, tok(0));
  for (let r = 12; r < 16; r++) c.put(r, 3, tok(2));
  const steps = c.resolve([[15, 3]], null);
  eq(steps.length, 2, "chain: 2 clear steps");
  eq(c.germCount(), 0, "chain cleared the germs");
}

/* ================================================================== bonus clusters */
{
  const rule = (set: LevelSet) => ({ sizes: set.bonusSizes, check: set.bonusCheck });
  const rng = seeded(1);
  // molecules (grade 8, level 1: H, O, C)
  const el = makeLevelSet("elements", "8", 1, rng);
  const kindOf = (sym: string) => el.kinds.findIndex((k) => k.id === sym);
  const b = new Bottle();
  b.put(15, 0, { kind: kindOf("H"), key: "H", label: "H", say: "" }, true);
  b.put(15, 1, { kind: kindOf("O"), key: "O", label: "oxygen", say: "" });
  b.put(14, 1, { kind: kindOf("H"), key: "H", label: "hydrogen", say: "" });
  const g = b.findBonuses([[14, 1]], rule(el));
  ok(g.length === 1 && g[0].bonus?.formula === "H₂O", "H, H, O touching make H₂O");
  // CO₂ needs both O
  const b2 = new Bottle();
  b2.put(15, 0, { kind: kindOf("C"), key: "C", label: "C", say: "" });
  b2.put(15, 1, { kind: kindOf("O"), key: "O", label: "O", say: "" });
  eq(b2.findBonuses([[15, 1]], rule(el)).length, 0, "C + one O is no bonus (CO left out)");
  b2.put(15, 2, { kind: kindOf("O"), key: "O", label: "O", say: "" });
  eq(b2.findBonuses([[15, 2]], rule(el))[0]?.bonus?.formula, "CO₂", "C + 2 O → CO₂");
  // a capsule can't bond with itself
  const el2 = makeLevelSet("elements", "8", 2, rng); // Na, Cl, H
  const k = (sym: string) => el2.kinds.findIndex((x) => x.id === sym);
  const b3 = new Bottle();
  const p: Piece = { r: 15, c: 0, vertical: false, a: { kind: k("Na"), key: "Na", label: "Na", say: "" }, b: { kind: k("Cl"), key: "Cl", label: "Cl", say: "" } };
  const fresh = b3.lock(p);
  eq(b3.findBonuses(fresh, rule(el2)).length, 0, "a capsule's own two halves never make a bonus");
  b3.put(14, 0, { kind: k("Cl"), key: "Cl", label: "chlorine", say: "" });
  eq(b3.findBonuses([[14, 0]], rule(el2))[0]?.bonus?.formula, "NaCl", "Na + Cl from different capsules → NaCl");

  // ionic (grade 11, level 1: charges 1+, 1−, 2+)
  const io = makeLevelSet("ions", "11", 1, rng);
  const ik = (id: string) => io.kinds.findIndex((x) => x.reps.some((r) => r.key === id));
  const it = (id: string): Token => ({ kind: ik(id), key: id, label: ionById(id).label, say: "" });
  const b4 = new Bottle();
  b4.put(15, 0, it("Mg+2"), true);
  b4.put(15, 1, it("Cl-1"));
  eq(b4.findBonuses([[15, 1]], rule(io)).length, 0, "Mg²⁺ + one Cl⁻ is not neutral");
  b4.put(14, 0, it("Cl-1"));
  eq(b4.findBonuses([[14, 0]], rule(io))[0]?.bonus?.formula, "MgCl₂", "Mg²⁺ + 2 Cl⁻ → MgCl₂");
  const b5 = new Bottle();
  b5.put(15, 0, it("Na+1"));
  b5.put(15, 1, it("Mg+2"));
  eq(b5.findBonuses([[15, 1]], rule(io)).length, 0, "two cations never bond");

  // number bonds (grade 1)
  const bo = makeLevelSet("bonds", "1", 1, rng);
  const b6 = new Bottle();
  b6.put(15, 0, { kind: 0, key: "3", label: "3", say: "", num: 3 }, true);
  b6.put(15, 1, { kind: 1, key: "7", label: "7", say: "", num: 7 });
  eq(b6.findBonuses([[15, 1]], rule(bo))[0]?.bonus?.title, "3 + 7 = 10!", "3 and 7 make 10 → bond");
  const b7 = new Bottle();
  b7.put(15, 0, { kind: 0, key: "8", label: "8", say: "", num: 8 }, true);
  b7.put(15, 1, { kind: 1, key: "2", label: "2", say: "", num: 2 });
  eq(b7.findBonuses([[15, 1]], rule(bo))[0]?.bonus?.title, "2 + 8 = 10!", "8 and 2 make 10 (smaller number first)");
  b6.put(14, 1, { kind: 2, key: "4", label: "4", say: "", num: 4 });
  eq(b6.findBonuses([[14, 1]], rule(bo)).length, 0, "7 and 4 don't make 10");
}

/* ================================================================== game clock: win, lose, scoring */
{
  const rng = seeded(7);
  const set = makeLevelSet("facts", "4", 1, rng);
  const g = new LabGame({ set, speed: "slow", rng, empty: true });
  ok(g.piece && g.phase === "play", "game starts with a capsule");
  // a germ with 3 matching halves above it in column 0, then drop a vertical capsule of that kind
  g.bottle.put(15, 0, set.germToken(0, rng), true);
  g.bottle.put(14, 0, set.halfToken(0, rng));
  g.debugSetPiece(0, 0);
  ok(g.rotate(1), "rotate in game");
  while (g.move(-1));
  eq(g.piece!.c, 0, "moved to column 0");
  g.hardDrop();
  ok(g.phase === "flash", "a match flashes");
  g.update(FLASH_MS + 1);
  ok(g.phase === "fall" && g.score > 0, "cleared and scored");
  for (let i = 0; i < 40 && g.phase !== "won"; i++) g.update(FALL_STEP_MS);
  eq(g.phase, "won", "clearing the last germ wins the level");

  // lose: fill the spawn cell
  const g2 = new LabGame({ set, speed: "fast", rng, empty: true });
  g2.bottle.put(15, 0, set.germToken(1, rng), true);
  for (let r = 1; r < ROWS; r++) for (const c of [3, 4]) if (!g2.bottle.at(r, c)) g2.bottle.put(r, c, { kind: (r + c) % 3, key: "x", label: "x", say: "" });
  // spread kinds so nothing matches: alternate per row
  for (let r = 1; r < ROWS; r++) {
    g2.bottle.at(r, 3)!.tok = { kind: r % 3, key: "x", label: "x", say: "" };
    g2.bottle.at(r, 4)!.tok = { kind: (r + 1) % 3, key: "x", label: "x", say: "" };
  }
  g2.debugSetPiece(0, 1);
  g2.hardDrop();
  for (let i = 0; i < 20 && g2.phase !== "lost"; i++) g2.update(100);
  eq(g2.phase, "lost", "a full neck loses");

  // gravity timing: slow speed drops one row per interval
  const g3 = new LabGame({ set, speed: "slow", rng, empty: true });
  g3.bottle.put(15, 7, set.germToken(0, rng), true);
  const r0 = g3.piece!.r;
  g3.update(g3.dropMs() + 1);
  eq(g3.piece!.r, r0 + 1, "gravity moves the capsule one row per interval");
  g3.setSoft(true);
  g3.update(200);
  ok(g3.piece!.r >= r0 + 4, "soft drop is faster");
  ok(SPEEDS.every((s, i) => i === 0 || s.ms < SPEEDS[i - 1].ms), "speeds get faster");
}

/* ================================================================== content accuracy */
{
  // elements: independent reference values
  const REF: Record<string, [string, number]> = {
    H: ["hydrogen", 1], He: ["helium", 2], Li: ["lithium", 3], C: ["carbon", 6], N: ["nitrogen", 7], O: ["oxygen", 8], F: ["fluorine", 9],
    Ne: ["neon", 10], Na: ["sodium", 11], Mg: ["magnesium", 12], Al: ["aluminum", 13], Si: ["silicon", 14], S: ["sulfur", 16],
    Cl: ["chlorine", 17], K: ["potassium", 19], Ca: ["calcium", 20], Fe: ["iron", 26], Ni: ["nickel", 28], Cu: ["copper", 29],
    Zn: ["zinc", 30], Ag: ["silver", 47], Sn: ["tin", 50], I: ["iodine", 53], Au: ["gold", 79], Pb: ["lead", 82],
  };
  for (const e of ELEMENTS) eq([e.name, e.z], REF[e.sym], `element ${e.sym}`);
  eq(new Set(ELEMENTS.map((e) => e.sym)).size, ELEMENTS.length, "element symbols unique");
  for (const grp of [...ELEMENT_GROUPS_3, ...ELEMENT_GROUPS_4]) for (const s of grp) ok(REF[s], `group element ${s} known`);

  // formulas: parse and compare to recipe atoms
  const parse = (f: string): Record<string, number> => {
    const s = plain(f);
    const out: Record<string, number> = {};
    const add = (k: string, n: number) => (out[k] = (out[k] ?? 0) + n);
    const re = /\(([A-Za-z0-9]+)\)(\d*)|([A-Z][a-z]?)(\d*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      if (m[1]) {
        const inner = parse(m[1]);
        const mul = m[2] ? Number(m[2]) : 1;
        for (const [k, n] of Object.entries(inner)) add(k, n * mul);
      } else add(m[3], m[4] ? Number(m[4]) : 1);
    }
    return out;
  };
  for (const r of RECIPES) eq(parse(r.formula), r.atoms, `recipe ${r.formula} atoms`);
  for (const r of RECIPES) ok(Object.keys(r.atoms).length >= 2, `recipe ${r.formula} mixes elements`);
  // ions: independent charges
  const CH: Record<string, number> = {
    "Na+1": 1, "K+1": 1, "Li+1": 1, "Ag+1": 1, "NH4+1": 1, "Cl-1": -1, "F-1": -1, "Br-1": -1, "I-1": -1, "OH-1": -1, "NO3-1": -1,
    "Mg+2": 2, "Ca+2": 2, "Zn+2": 2, "Ba+2": 2, "Cu+2": 2, "Fe+2": 2, "O-2": -2, "S-2": -2, "SO4-2": -2, "CO3-2": -2,
    "Al+3": 3, "Fe+3": 3, "PO4-3": -3,
  };
  for (const i of IONS) eq(i.charge, CH[i.id], `ion ${i.id} charge`);
  eq(new Set(IONS.map((i) => i.id)).size, IONS.length, "ion ids unique");
  const POLY_ATOMS: Record<string, Record<string, number>> = { NH4: { N: 1, H: 4 }, OH: { O: 1, H: 1 }, NO3: { N: 1, O: 3 }, SO4: { S: 1, O: 4 }, CO3: { C: 1, O: 3 }, PO4: { P: 1, O: 4 } };
  // every possible compound: neutral, lowest terms, sensible formula
  // well-known formulas the ion table must produce exactly
  const known = ["NaCl", "MgCl₂", "CaO", "Na₂O", "Ca(OH)₂", "(NH₄)₂SO₄", "Al₂O₃", "AlPO₄", "Fe₂O₃", "CuSO₄", "Mg(NO₃)₂", "K₂CO₃", "BaSO₄", "AgNO₃", "CaCO₃", "FeCl₃", "ZnS", "LiF", "KI", "NaOH"];
  const made = new Set<string>();
  let compounds = 0;
  for (const cat of IONS.filter((i) => i.charge > 0))
    for (const an of IONS.filter((i) => i.charge < 0)) {
      const f = ionicFormula(cat, an);
      made.add(f.formula);
      ok(f.nCat * cat.charge + f.nAn * an.charge === 0, `${f.formula} is neutral`);
      const atoms = parse(f.formula);
      const expect: Record<string, number> = {};
      const addAll = (ionF: string, n: number) => {
        const p = plain(ionF);
        const parts = POLY_ATOMS[p] ?? { [p]: 1 };
        for (const [k, c] of Object.entries(parts)) expect[k] = (expect[k] ?? 0) + c * n;
      };
      addAll(cat.formula, f.nCat);
      addAll(an.formula, f.nAn);
      eq(atoms, expect, `${f.formula} atom counts`);
      if (f.nCat + f.nAn <= 3) {
        const toks: Token[] = [...Array(f.nCat).fill(cat), ...Array(f.nAn).fill(an)].map((i) => ({ kind: 0, key: i.id, label: i.label, say: "" }));
        const c = compoundFor(toks);
        if (NOT_A_COMPOUND.includes(f.formula)) ok(c === null, `${f.formula} is excluded`);
        else {
          ok(c?.formula === f.formula, `${f.formula} recognised`);
          compounds++;
        }
      }
    }
  ok(compounds > 60, `plenty of real compounds (${compounds})`);
  eq(ionicFormula(ionById("Al+3"), ionById("O-2")).formula, "Al₂O₃", "Al₂O₃");
  eq(ionicFormula(ionById("NH4+1"), ionById("SO4-2")).formula, "(NH₄)₂SO₄", "(NH₄)₂SO₄");
  eq(ionicFormula(ionById("Ca+2"), ionById("OH-1")).formula, "Ca(OH)₂", "Ca(OH)₂");
  for (const k of known) ok(made.has(k), `ion table makes ${k}`);

  // matter: examples belong to one state
  const all = MATTER.flatMap((m) => m.examples);
  eq(new Set(all).size, all.length, "matter examples are in only one state");
  const REF_STATE: Record<string, string> = { ice: "SOLID", rock: "SOLID", wood: "SOLID", air: "GAS", helium: "GAS", milk: "LIQUID", water: "LIQUID", honey: "LIQUID", vapor: "GAS" };
  for (const [ex, st] of Object.entries(REF_STATE)) ok(MATTER.find((m) => m.examples.includes(ex))?.state === st, `${ex} is ${st}`);

  // balancing
  const atomsOf = (side: [number, string, Record<string, number>][]) => {
    const m: Record<string, number> = {};
    for (const [n, f, a] of side) {
      eq(parse(f), a, `balancing formula ${f}`);
      for (const [k, c] of Object.entries(a)) m[k] = (m[k] ?? 0) + n * c;
    }
    return Object.fromEntries(Object.entries(m).sort());
  };
  for (const b of BALANCING) {
    eq(atomsOf(b.left), atomsOf(b.right), `balanced: ${b.left.map((x) => x[1]).join("+")}`);
    // the answer is the only coefficient 1–6 that balances
    const terms = [...b.left, ...b.right];
    const ans = balanceAnswer(b);
    for (let v = 1; v <= 6; v++) {
      if (v === ans) continue;
      const t2 = terms.map((t, i) => (i === b.blank ? ([v, t[1], t[2]] as typeof t) : t));
      const L = t2.slice(0, b.left.length);
      const R = t2.slice(b.left.length);
      const sum = (side: typeof L) => JSON.stringify(Object.entries(side.reduce((m, [n, , a]) => { for (const [k, c] of Object.entries(a)) m[k] = (m[k] ?? 0) + n * c; return m; }, {} as Record<string, number>)).sort());
      ok(sum(L) !== sum(R), `balancing blank ${v} is wrong for item ${b.left[0][1]}`);
    }
  }
}

/* ================================================================== every label computes to its kind */
const factValue = (label: string): number => {
  if (label.includes("×")) return label.split("×").map(Number).reduce((a, b) => a * b);
  if (label.includes("÷")) {
    const [a, b] = label.split("÷").map(Number);
    ok(a % b === 0, `${label} divides evenly`);
    return a / b;
  }
  return Number(label);
};

function checkLabels(set: LevelSet, where: string, rng: () => number) {
  eq(new Set(set.kinds.map((k) => k.id)).size, set.kinds.length, `${where}: kinds distinct`);
  const toks: Token[] = [];
  for (let k = 0; k < set.kinds.length; k++) for (let i = 0; i < 25; i++) toks.push(set.halfToken(k, rng), set.germToken(k, rng));
  for (const t of toks) {
    const kd = set.kinds[t.kind];
    ok(t.label.length <= 9, `${where}: label "${t.label}" short enough`);
    switch (set.id) {
      case "facts":
        eq(factValue(t.label), Number(kd.id), `${where}: ${t.label}`);
        break;
      case "integers":
        eq(evalInt(t.label), Number(kd.id), `${where}: ${t.label}`);
        ok(t.label.length <= 7, `${where}: ${t.label} ≤ 7 chars`);
        break;
      case "equations":
        eq(solveEquation(t.label), Number(plain(kd.id).slice(2)), `${where}: ${t.label}`);
        ok(t.label.length <= 7, `${where}: ${t.label} ≤ 7 chars`);
        break;
      case "elements": {
        const e = ELEMENTS.find((x) => x.sym === kd.id)!;
        ok(t.label === e.sym || t.label === e.name, `${where}: ${t.label} is ${e.sym}`);
        eq(t.key, e.sym, `${where}: key`);
        break;
      }
      case "ions": {
        const io = ionById(t.key);
        eq(`${Math.abs(io.charge)}${io.charge > 0 ? "+" : "−"}`, kd.id, `${where}: ${t.label} charge kind`);
        eq(io.label, t.label, `${where}: ion label`);
        break;
      }
      case "matter":
        ok(t.label === kd.anchor || MATTER.find((m) => m.state === kd.anchor)!.examples.includes(t.label), `${where}: ${t.label} is ${kd.anchor}`);
        break;
      case "bonds":
        ok(t.num !== undefined && t.num >= 1 && t.num <= 9 && t.label === String(t.num), `${where}: number tile ${t.label}`);
        break;
      case "shapes":
        eq(t.key, kd.id, `${where}: shape key`);
        break;
    }
  }
  // every rep listed on the kind is right too (quizzes use them)
  for (const kd of set.kinds)
    for (const r of kd.reps) {
      if (set.id === "facts") eq(factValue(r.label), Number(kd.id), `${where}: rep ${r.label}`);
      if (set.id === "integers") eq(evalInt(r.label), Number(kd.id), `${where}: rep ${r.label}`);
      if (set.id === "equations") eq(solveEquation(r.label), Number(plain(kd.id).slice(2)), `${where}: rep ${r.label}`);
    }
}

for (const g of [3, 4, 5]) {
  for (const level of [1, 2, 3, 6]) {
    const ps = factProducts(g, level);
    ok(ps.length >= 4, `grade ${g} level ${level}: enough products`);
    for (const v of ps) ok(factReps(v, g).filter((r) => r.label.includes("×")).length >= 2, `${v} has 2+ facts at grade ${g}`);
  }
}

/* ================================================================== quiz items */
function checkQuiz(set: LevelSet, where: string, rng: () => number, log: LabGame["log"]) {
  const q = makeQuiz(set, rng, log);
  ok(q.choices.length === 4, `${where}: 4 choices`);
  eq(new Set(q.choices).size, 4, `${where}: unique choices (${q.choices.join(" | ")})`);
  ok(q.choices.every((c) => c.trim().length > 0), `${where}: no empty choice`);
  ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, `${where}: answer index`);
  ok(q.explanation.length > 15, `${where}: explanation`);
  ok(/^(NC\.(K|\d+)\.[A-Z]+\.\d+|NC\.M1\.A-REI\.3|PS\.(K|\d)\.\d(\.\d)?|PS\.\d\.\d\.\d|PS\.8\.1|PS\.Chm\.\d\.\d)$/.test(q.standard), `${where}: standard code "${q.standard}"`);
  ok(q.prompt.length > 5, `${where}: prompt`);
  eq(q.grade, set.grade, `${where}: grade`);
  const right = q.choices[q.answer];
  // the marked answer is really right
  if (/^(.+) = \?$/.test(q.prompt)) {
    const expr = q.prompt.replace(/ = \?$/, "");
    const v = expr.includes("×") || expr.includes("÷") ? (set.id === "facts" ? factValue(expr) : evalInt(expr)) : evalInt(expr);
    eq(plain(right), plain(String(v < 0 ? `−${-v}` : v)), `${where}: ${q.prompt} answer`);
  }
  if (q.prompt.startsWith("Solve: ")) eq(Number(plain(right).replace("x = ", "")), solveEquation(q.prompt.slice(7)), `${where}: ${q.prompt}`);
  if (q.prompt.startsWith("What number goes with")) eq(Number(right) + Number(q.prompt.match(/with (\d+)/)![1]), 10, `${where}: bond answer`);
  if (q.prompt.startsWith("Which one equals")) eq(factValue(right), Number(q.prompt.match(/equals (\d+)/)![1]), `${where}: fact answer`);
  if (q.prompt.startsWith("What is the symbol for")) eq(ELEMENTS.find((e) => e.sym === right)?.name, q.prompt.match(/for (\w+)\?/)![1], `${where}: symbol answer`);
  if (/ is the symbol for which element\?$/.test(q.prompt)) eq(ELEMENTS.find((e) => e.name === right)?.sym, q.prompt.split(" ")[0], `${where}: name answer`);
  if (q.prompt.startsWith("What is the charge on the")) {
    const io = IONS.find((i) => q.prompt.includes(`the ${i.name} ion (${i.formula})`))!;
    ok(io && right === `${Math.abs(io.charge)}${io.charge > 0 ? "+" : "−"}`, `${where}: charge answer`);
  }
  if (q.prompt.startsWith("Which one is a")) {
    const st = q.prompt.match(/is a (\w+)\?/)![1].toUpperCase();
    ok(MATTER.find((m) => m.state === st)!.examples.includes(right), `${where}: matter answer`);
    for (const c of q.choices) if (c !== right) ok(!MATTER.find((m) => m.state === st)!.examples.includes(c), `${where}: matter distractor ${c}`);
  }
  if (q.prompt.startsWith("Balance it:")) {
    const b = BALANCING.find((x) => q.prompt.includes(balanceText(x)));
    ok(b && Number(right) === balanceAnswer(b), `${where}: balancing answer`);
  }
  // step-by-step explanations end at the right value
  if (q.prompt.startsWith("Solve: ")) ok(q.explanation.includes(`x = ${right.replace("x = ", "")}`) || q.explanation.endsWith(`${right.replace("x = ", "")}.`), `${where}: explanation reaches ${right}`);
  if (/ = \?$/.test(q.prompt)) ok(q.explanation.includes(right), `${where}: explanation mentions ${right}`);
  return q;
}

/* ================================================================== bots clear every grade's levels */
const FOCUSES: Focus[] = [
  { mode: "mix" },
  { mode: "subject", subject: "science" },
  { mode: "subject", subject: "math" },
  { mode: "focus", topic: "physical" },
  { mode: "focus", topic: "numbers" },
  { mode: "focus", topic: "algebra" },
];

/** Clears a level by dropping vertical same-kind capsules on the column tops above germs. */
function botClear(g: LabGame): boolean {
  const run = (ms: number) => {
    for (let i = 0; i < 400 && (g.phase === "flash" || g.phase === "fall"); i++) g.update(ms);
  };
  let cur = -1;
  for (let n = 0; n < 900; n++) {
    if (g.phase === "won") return true;
    if (g.phase === "lost") return false;
    run(50);
    if (g.phase !== "play") continue;
    // finish one column before moving on (the column with a germ whose top tile is lowest)
    const colInfo = (c: number) => {
      let hasGerm = false;
      let top = -1;
      for (let r = 0; r < ROWS; r++) {
        const t = g.bottle.at(r, c);
        if (t) {
          if (top < 0) top = r;
          if (t.germ) hasGerm = true;
        }
      }
      return { hasGerm, top };
    };
    let best = -1;
    let bestTop = -1;
    if (cur >= 0) {
      const ci = colInfo(cur);
      if (ci.hasGerm && ci.top >= 3) (best = cur), (bestTop = ci.top);
    }
    if (best < 0)
      for (let c = 0; c < COLS; c++) {
        const ci = colInfo(c);
        if (ci.hasGerm && ci.top > bestTop) (best = c), (bestTop = ci.top);
      }
    cur = best;
    const kind = g.bottle.at(bestTop, best)!.tok.kind;
    g.debugSetPiece(kind, kind);
    if (!g.rotate(1)) return false;
    for (let i = 0; i < 8 && g.piece!.c > best; i++) g.move(-1);
    for (let i = 0; i < 8 && g.piece!.c < best; i++) g.move(1);
    if (g.piece!.c !== best) return false;
    g.hardDrop();
  }
  return g.phase === "won";
}

let levelsChecked = 0;
let quizzesChecked = 0;
for (const grade of GRADES as Grade[]) {
  for (const f of FOCUSES) {
    const cyc = setCycle(resolveFocus({ subject: f.mode === "mix" ? "mixed" : f.mode === "subject" ? f.subject : f.topic === "physical" ? "science" : "math", topic: f.mode === "focus" ? f.topic : "all" }, grade), grade);
    ok(cyc.length > 0, `grade ${grade} ${JSON.stringify(f)}: has lab sets`);
    for (const s of cyc) ok(bandOf(grade) === "k2" ? ["shapes", "bonds"].includes(s) : true, `grade ${grade}: set ${s} fits`);
  }
  for (const setId of new Set(FOCUSES.flatMap((f) => setCycle(f, grade))) as Set<SetId>) {
    for (let level = 1; level <= 9; level++) {
      for (const seed of [1, 2]) {
        const rng = seeded(seed * 1000 + level * 17 + gradeN(grade));
        const set = makeLevelSet(setId, grade, level, rng);
        const where = `grade ${grade} ${setId} L${level} s${seed}`;
        checkLabels(set, where, rng);
        const game = new LabGame({ set, speed: "medium", rng });
        eq(game.germs, germTarget(level), `${where}: germ count`);
        // no near-matches, top kept clear, kinds in range
        const b = game.bottle;
        let bad = 0;
        for (const { r, c, t } of b.tiles()) {
          if (!t.germ) continue;
          if (r < ROWS - germRows(level)) bad++;
          if (t.tok.kind < 0 || t.tok.kind >= set.kinds.length) bad++;
          const k = t.tok.kind;
          if (b.at(r, c + 1)?.tok.kind === k && b.at(r, c + 2)?.tok.kind === k) bad++;
          if (b.at(r + 1, c)?.tok.kind === k && b.at(r + 2, c)?.tok.kind === k) bad++;
        }
        eq(bad, 0, `${where}: germ layout`);
        eq(b.findMatches().length, 0, `${where}: no match at the start`);
        const kindsUsed = new Set(b.tiles().map((x) => x.t.tok.kind));
        ok(kindsUsed.size === Math.min(set.kinds.length, game.germs), `${where}: every kind has germs`);
        const won = botClear(game);
        ok(won, `${where}: bot clears the level (germs left ${game.germs}, phase ${game.phase})`);
        levelsChecked++;
        checkQuiz(set, where, rng, game.log);
        // quiz with an empty log too
        checkQuiz(set, `${where} (empty log)`, rng, { tokens: [], bonuses: [] });
        quizzesChecked += 2;
      }
    }
  }
}

/* ================================================================== many more quizzes */
for (const grade of GRADES as Grade[])
  for (const setId of new Set(FOCUSES.flatMap((f) => setCycle(f, grade))) as Set<SetId>)
    for (let i = 0; i < 60; i++) {
      const rng = seeded(i + 99);
      const set = makeLevelSet(setId, grade, 1 + (i % 8), rng);
      const toks: Token[] = [];
      for (let k = 0; k < set.kinds.length; k++) toks.push(set.halfToken(k, rng));
      const bonuses = [];
      if (set.bonus === "ionic") {
        const cat = IONS.find((x) => x.charge === 1)!;
        const an = IONS.find((x) => x.charge === -1)!;
        bonuses.push(set.bonusCheck([cat, an].map((x) => ({ kind: 0, key: x.id, label: x.label, say: "" })))!);
      }
      if (set.bonus === "molecule") bonuses.push(set.bonusCheck([{ kind: 0, key: "H", label: "H", say: "" }, { kind: 0, key: "H", label: "H", say: "" }, { kind: 1, key: "O", label: "O", say: "" }])!);
      checkQuiz(set, `quiz grade ${grade} ${setId} #${i}`, rng, { tokens: toks, bonuses: bonuses.filter(Boolean) });
      quizzesChecked++;
    }

/* ================================================================== quiz answers never end a run */
for (const grade of ["1", "4", "8", "11"] as Grade[]) {
  const run = new LabRun(grade, { mode: "mix" }, "slow", seeded(5));
  for (let lv = 1; lv <= 8; lv++) {
    const won = botClear(run.game);
    ok(won, `run grade ${grade} level ${lv} cleared`);
    const before = run.score;
    const q = run.finishLevel();
    ok(run.score > before, `level bonus at grade ${grade}`);
    const wrong = (q.answer + 1) % 4;
    const res = run.answer(lv % 2 ? wrong : q.answer);
    ok(res.correct === !(lv % 2), `quiz result at grade ${grade} level ${lv}`);
    ok(!run.over, `grade ${grade}: a ${res.correct ? "right" : "wrong"} quiz answer doesn't end the run`);
    run.nextLevel();
    eq(run.level, lv + 1, `grade ${grade}: next level after quiz`);
    ok(run.game.phase === "play", `grade ${grade}: next level is playing`);
  }
  ok(run.quizLog.filter((x) => !x.correct).length === 4, `grade ${grade}: wrong answers logged`);
}

/* ================================================================== topics and URLs */
{
  eq(readUrlFocus("?topic=physical", "8").pref, { subject: "science", topic: "physical" }, "?topic=physical");
  eq(readUrlFocus("?topic=numbers", "4").pref, { subject: "math", topic: "numbers" }, "?topic=numbers");
  eq(readUrlFocus("?topic=algebra", "9").pref, { subject: "math", topic: "algebra" }, "?topic=algebra");
  const fb = readUrlFocus("?topic=algebra", "2");
  ok(fb.pref?.subject === "math" && fb.pref.topic === "all" && !!fb.note, "?topic=algebra at grade 2 falls back with a note");
  eq(readUrlFocus("?topic=science-mix", "5").pref, { subject: "science", topic: "all" }, "science-mix");
  eq(readUrlFocus("?topic=mix", "5").pref, DEFAULT_PREF, "mix");
  eq(readUrlFocus("?topic=bogus", "5").pref, null, "unknown topic ignored");
  eq(readUrlFocus("?topic=physical&subject=math", "5").pref, null, "contradicting subject ignored");
  eq(parsePref("science", "numbers"), { subject: "science", topic: "all" }, "saved topic from another subject → ALL");
  eq(parsePref("weird", null), DEFAULT_PREF, "bad saved subject → MIXED");
  for (const t of TOPICS)
    for (const n of OFFERED[t.id]) {
      const grade = (n === 0 ? "K" : String(n)) as Grade;
      const f = resolveFocus({ subject: t.subject, topic: t.id }, grade);
      ok(f.mode === "focus", `${t.id} available at grade ${grade}`);
      const sets = setCycle(f, grade);
      ok(sets.length > 0, `${t.id} grade ${grade} has sets`);
      for (const s of sets) {
        const set = makeLevelSet(s, grade, 1, seeded(3));
        eq(set.topic, t.id, `${t.id} grade ${grade}: set ${s} topic`);
      }
    }
  // mixed starts with science except K–2 (number bonds first)
  ok(setCycle({ mode: "mix" }, "4").includes("facts") && setCycle({ mode: "mix" }, "4").includes("matter"), "mixed at grade 4 has math and science");
}

/* ================================================================== placement sanity */
{
  const b = new Bottle();
  const set = makeLevelSet("facts", "3", 20, seeded(9));
  const n = placeGerms(b, 20, set.kinds.length, set.germToken, seeded(9));
  eq(n, germTarget(20), "high level places every germ");
  ok(germTarget(20) <= germRows(20) * COLS * 0.6, "germs fit");
  const pos: Pos[] = b.tiles().map(({ r, c }) => [r, c]);
  ok(pos.every(([r]) => r >= ROWS - germRows(20)), "germs stay low");
}

console.log(`Lab Capsules rules: ${passed} checks passed, ${failures.length} failed (${levelsChecked} levels cleared by the bot, ${quizzesChecked} quiz items).`);
if (failures.length) {
  for (const f of failures.slice(0, 60)) console.log("  ✗ " + f);
  if (failures.length > 60) console.log(`  … and ${failures.length - 60} more`);
  process.exit(1);
}

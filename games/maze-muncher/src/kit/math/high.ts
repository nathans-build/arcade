/* High school generators: NC Math 1 (grade 9), NC Math 2 (10), NC Math 3 (11), NC Math 4 (12). */
import {
  chance, dec, distinctInts, fr, fracs, fstr, type Gen, lin, MINUS, n, ns, nums, nz, padPoint,
  paren, pick, PI, piStr, point, poly, pow, radical, randInt, shuffle, sub, sup, xPlus,
} from "./core";

const SUPX = "ˣ"; // superscript x

/** "ax + by" with tidy signs and unit coefficients. */
function twoVar(a: number, b: number): string {
  const first = a === 1 ? "x" : a === -1 ? `${MINUS}x` : `${ns(a)}x`;
  const bAbs = Math.abs(b) === 1 ? "y" : `${Math.abs(b)}y`;
  return `${first} ${b < 0 ? MINUS : "+"} ${bAbs}`;
}

/** Complex number text: "3 − 2i", "5i", "−i", "4". */
function cx(re: number, im: number): string {
  const imPart = (v: number) => (Math.abs(v) === 1 ? "i" : `${Math.abs(v)}i`);
  if (im === 0) return ns(re);
  if (re === 0) return (im < 0 ? MINUS : "") + imPart(im);
  return `${ns(re)} ${im < 0 ? MINUS : "+"} ${imPart(im)}`;
}

/** "(x − 3)" style factor, or "x" for a zero at 0. */
function factor(r: number): string {
  return r === 0 ? "x" : `(${xPlus(-r)})`;
}

function listNums(vs: number[]): string {
  return [...vs].sort((a, b) => a - b).map(ns).join(", ");
}

const TRIPLES: [number, number, number][] = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29],
];

// ======================================================================== NC Math 1 (grade 9)

export const GRADE_9: Gen[] = [
  {
    key: "arei3",
    standard: "NC.M1.A-REI.3",
    skill: "Solve linear equations",
    make() {
      const x = nz(-9, 9);
      const a = pick([2, 3, 4, 5, 6, -2, -3]);
      const b = nz(-8, 8);
      const c = a * (x + b);
      const noDist = (c - b) / a;
      return {
        prompt: `Solve for x: ${ns(a)}(${xPlus(b)}) = ${ns(c)}`,
        ...nums(x, [Number.isInteger(noDist) && noDist !== x ? noDist : x + b, -x, c / a + b, x - 1]),
        explanation: `Divide both sides by ${ns(a)}: ${xPlus(b)} = ${ns(c / a)}. Then ${b > 0 ? "subtract" : "add"} ${Math.abs(b)}: x = ${ns(x)}.`,
      };
    },
  },
  {
    key: "fif6",
    standard: "NC.M1.F-IF.6",
    skill: "Average rate of change",
    make() {
      const x1 = randInt(-3, 4);
      const dx = randInt(1, 5);
      const x2 = x1 + dx;
      const a = nz(-3, 3);
      const b = randInt(-5, 5);
      const c = randInt(-9, 9);
      const f = (x: number) => a * x * x + b * x + c;
      const y1 = f(x1);
      const y2 = f(x2);
      const r = fr(y2 - y1, dx);
      return {
        prompt: `f(${ns(x1)}) = ${ns(y1)} and f(${ns(x2)}) = ${ns(y2)}. What is the average rate of change from x = ${ns(x1)} to x = ${ns(x2)}?`,
        ...fracs(r, [y2 - y1 !== 0 ? fr(dx, y2 - y1) : null, fr(y1 - y2, dx), fr(y2 + y1, x2 + x1 || 1), fr(y2 - y1, 1)], fstr),
        explanation: `Rate of change = (f(${ns(x2)}) − f(${ns(x1)})) ÷ (${ns(x2)} − ${paren(x1)}) = ${ns(y2 - y1)}/${dx}${fstr(r) !== `${ns(y2 - y1)}/${dx}` ? ` = ${fstr(r)}` : ""}.`,
      };
    },
  },
  {
    key: "fif2",
    standard: "NC.M1.F-IF.2",
    skill: "Function notation",
    make() {
      const a = pick([1, 2, 3, -1, -2]);
      const b = nz(-6, 6);
      const c = randInt(-9, 9);
      const x = -randInt(1, 4);
      const v = a * x * x + b * x + c;
      return {
        prompt: `If f(x) = ${poly([a, b, c])}, what is f(${ns(x)})?`,
        ...nums(v, [-a * x * x + b * x + c, a * x * x - b * x + c, a * 2 * x + b * x + c, v + 1]),
        explanation: `Replace x with (${ns(x)}): ${ns(a)}(${ns(x)})² ${b < 0 ? MINUS : "+"} ${Math.abs(b)}(${ns(x)}) ${c < 0 ? MINUS : "+"} ${Math.abs(c)} = ${ns(v)}. Remember (${ns(x)})² = ${x * x}.`,
      };
    },
  },
  {
    key: "arei6",
    standard: "NC.M1.A-REI.6",
    skill: "Systems of linear equations",
    make() {
      const x = randInt(-5, 7);
      const y = randInt(-5, 7);
      let a1 = 0, b1 = 0, a2 = 0, b2 = 0;
      while (a1 * b2 - a2 * b1 === 0) {
        a1 = nz(-3, 4);
        b1 = nz(-3, 4);
        a2 = nz(-3, 4);
        b2 = nz(-3, 4);
      }
      const c1 = a1 * x + b1 * y;
      const c2 = a2 * x + b2 * y;
      return {
        prompt: `Solve the system: ${twoVar(a1, b1)} = ${ns(c1)} and ${twoVar(a2, b2)} = ${ns(c2)}`,
        answer: point(x, y),
        wrong: [point(y, x), point(-x, y), point(x, -y), point(x + 1, y - 1), point(-x, -y)],
        pad: padPoint(x, y),
        explanation: `Eliminate one variable by adding or subtracting multiples of the equations. x = ${ns(x)} and y = ${ns(y)} work in both.`,
      };
    },
  },
  {
    key: "nrn2",
    standard: "NC.M1.N-RN.2",
    skill: "Properties of exponents",
    make() {
      const kind = randInt(0, 2);
      const m = randInt(2, 7);
      const k = randInt(2, 5);
      if (kind === 0) {
        return {
          prompt: `Simplify: ${pow("x", m)} · ${pow("x", k)}`,
          answer: pow("x", m + k),
          wrong: [pow("x", m * k), `2${pow("x", m + k)}`, pow("x", Math.abs(m - k) || m + k + 1), `2${pow("x", m * k)}`],
          pad: () => pow("x", m + k + nz(-3, 3)),
          explanation: `Multiplying powers with the same base: add the exponents. ${m} + ${k} = ${m + k}.`,
        };
      }
      if (kind === 1) {
        const c = randInt(2, 5);
        return {
          prompt: `Simplify: (${c}${pow("x", m)})${sup(k === 5 ? 2 : Math.min(k, 3))}`,
          ...(() => {
            const p = k === 5 ? 2 : Math.min(k, 3);
            return {
              answer: `${c ** p}${pow("x", m * p)}`,
              wrong: [`${c}${pow("x", m * p)}`, `${c * p}${pow("x", m * p)}`, `${c ** p}${pow("x", m + p)}`, `${c * p}${pow("x", m + p)}`],
              pad: () => `${c ** p + nz(-3, 3)}${pow("x", m * p + nz(-2, 2))}`,
              explanation: `Raise each factor to the power ${p}: ${c}${sup(p)} = ${c ** p} and (${pow("x", m)})${sup(p)} = ${pow("x", m * p)}.`,
            };
          })(),
        };
      }
      const hi = m + k;
      return {
        prompt: `Simplify: ${pow("x", hi)} ÷ ${pow("x", k)}`,
        answer: pow("x", m),
        wrong: [pow("x", hi + k), Number.isInteger(hi / k) && hi / k !== m ? pow("x", hi / k) : pow("x", hi * k), `x${sup(-m)}`, pow("x", m + 1)],
        pad: () => pow("x", Math.max(2, m + nz(-3, 3))),
        explanation: `Dividing powers with the same base: subtract the exponents. ${hi} − ${k} = ${m}.`,
      };
    },
  },
  {
    key: "asse3",
    standard: "NC.M1.A-SSE.3",
    skill: "Factor quadratics",
    make() {
      let p = 0, q = 0;
      while (p === q || Math.abs(p) === Math.abs(q) || p === 0 || q === 0) {
        p = nz(-9, 9);
        q = nz(-9, 9);
      }
      const f = (a: number, b: number) => {
        const [s, t] = [a, b].sort((u, v) => v - u);
        return `(${xPlus(s)})(${xPlus(t)})`;
      };
      const pairs: [number, number][] = [];
      const prod = p * q;
      for (let d = -Math.abs(prod); d <= Math.abs(prod); d++) {
        if (d !== 0 && prod % d === 0 && d <= prod / d) pairs.push([d, prod / d]);
      }
      const wrongPairs = shuffle(pairs.filter(([a, b]) => a + b !== p + q)).slice(0, 2);
      return {
        prompt: `Factor: ${poly([1, p + q, p * q])}`,
        answer: f(p, q),
        wrong: [f(-p, -q), f(p, -q), ...wrongPairs.map(([a, b]) => f(a, b)), f(-p, q)],
        explanation: `Find two numbers that multiply to ${ns(p * q)} and add to ${ns(p + q)}: ${ns(p)} and ${ns(q)}.`,
      };
    },
  },
  {
    key: "aapr3",
    standard: "NC.M1.A-APR.3",
    skill: "Zeros of a quadratic",
    make() {
      let [r1, r2] = distinctInts(2, -9, 9);
      if (r1 === -r2) r2 += 1;
      const show = (a: number, b: number) => `${ns(Math.min(a, b))} and ${ns(Math.max(a, b))}`;
      return {
        prompt: `What are the zeros of f(x) = ${factor(r1)}${factor(r2)}?`,
        answer: show(r1, r2),
        wrong: [show(-r1, -r2), show(-r1, r2), show(r1, -r2), `${ns(r1 * r2)} only`],
        pad: () => show(r1 + nz(-2, 2), r2),
        explanation: `A product is 0 when a factor is 0. ${factor(r1)} = 0 gives x = ${ns(r1)}; ${factor(r2)} = 0 gives x = ${ns(r2)}.`,
      };
    },
  },
  {
    key: "aapr1",
    standard: "NC.M1.A-APR.1",
    skill: "Multiply polynomials",
    make() {
      const a = nz(-9, 9);
      let b = nz(-9, 9);
      if (a + b === 0) b += b > 0 ? 1 : -1;
      if (b === 0) b = 2;
      return {
        prompt: `Multiply: (${xPlus(a)})(${xPlus(b)})`,
        answer: poly([1, a + b, a * b]),
        wrong: [poly([1, 0, a * b]), poly([1, a * b, a + b]), poly([1, a + b, a + b]), poly([1, -(a + b), a * b]), poly([1, a + b, -a * b])],
        explanation: `Use FOIL: x·x + ${paren(b)}x + ${paren(a)}x + ${paren(a)}·${paren(b)} = ${poly([1, a + b, a * b])}.`,
      };
    },
  },
  {
    key: "fbf2",
    standard: "NC.M1.F-BF.2",
    skill: "Arithmetic and geometric sequences",
    make() {
      if (chance()) {
        const a1 = randInt(-10, 20);
        const d = nz(-6, 9);
        const k = randInt(8, 25);
        const ans = a1 + (k - 1) * d;
        return {
          prompt: `Arithmetic sequence: ${[0, 1, 2, 3].map((i) => ns(a1 + i * d)).join(", ")}, … What is term ${k}?`,
          ...nums(ans, [a1 + k * d, k * d, a1 + (k - 2) * d, ans + 1]),
          explanation: `aₙ = a₁ + (n − 1)d = ${ns(a1)} + ${k - 1}(${ns(d)}) = ${ns(ans)}.`,
        };
      }
      const a = randInt(1, 5);
      const r = pick([2, 3, -2, 4]);
      const seq = [0, 1, 2, 3].map((i) => a * r ** i);
      const next = a * r ** 4;
      return {
        prompt: `Geometric sequence: ${seq.map(ns).join(", ")}, … What comes next?`,
        ...nums(next, [seq[3] + (seq[3] - seq[2]), seq[3] * 2 === next ? seq[3] * 3 : seq[3] * 2, -next, seq[3] + r]),
        explanation: `Each term is multiplied by ${ns(r)}. ${ns(seq[3])} × ${paren(r)} = ${ns(next)}.`,
      };
    },
  },
  {
    key: "sid2",
    standard: "NC.M1.S-ID.2",
    skill: "Center and spread",
    make() {
      let vals: number[] = [];
      do vals = Array.from({ length: 6 }, () => randInt(40, 99));
      while (vals.reduce((a, b) => a + b, 0) % 6 !== 0 || (vals.slice().sort((a, b) => a - b)[2] + vals.slice().sort((a, b) => a - b)[3]) % 2 !== 0);
      const sorted = [...vals].sort((a, b) => a - b);
      const mean = vals.reduce((a, b) => a + b, 0) / 6;
      const median = (sorted[2] + sorted[3]) / 2;
      const range = sorted[5] - sorted[0];
      const which = pick(["mean", "median", "range"] as const);
      const ans = which === "mean" ? mean : which === "median" ? median : range;
      return {
        prompt: `Test scores: ${vals.join(", ")}. What is the ${which}?`,
        ...nums(ans, [mean, median, range, sorted[2], (vals[2] + vals[3]) / 2, ans + 2], { min: 0 }),
        explanation:
          which === "mean"
            ? `Add the scores (${vals.reduce((a, b) => a + b, 0)}) and divide by 6: ${mean}.`
            : which === "median"
              ? `In order: ${sorted.join(", ")}. The median is halfway between ${sorted[2]} and ${sorted[3]}: ${median}.`
              : `Range = highest − lowest = ${sorted[5]} − ${sorted[0]} = ${range}.`,
      };
    },
  },
  {
    key: "fle5",
    standard: "NC.M1.F-LE.5",
    skill: "Interpret exponential models",
    make() {
      const grow = chance();
      const r = grow ? pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25]) : pick([2, 5, 10, 12, 15, 20, 25, 30, 40]);
      const factor100 = grow ? 100 + r : 100 - r;
      const a = pick([50, 100, 200, 500, 1000, 1200]);
      const thing = grow ? pick(["a town's population", "a savings account", "a bacteria colony"]) : pick(["a car's value", "a medicine dose", "a phone's battery"]);
      return {
        prompt: `f(t) = ${n(a)}(${dec(factor100, 2)})ᵗ models ${thing}. What is the ${grow ? "growth" : "decay"} rate?`,
        ...nums(r, [factor100, r * 10, 100 - r, r + 1], { min: 1, fmt: (v) => `${v}%` }),
        explanation: `The base is ${dec(factor100, 2)} = 1 ${grow ? "+" : MINUS} ${dec(r, 2)}, so it ${grow ? "grows" : "decays"} ${r}% per time unit.`,
      };
    },
  },
  {
    key: "ggpe6",
    standard: "NC.M1.G-GPE.6",
    skill: "Midpoint",
    make() {
      const mx = randInt(-6, 6);
      const my = randInt(-6, 6);
      const dx = randInt(1, 6);
      const dy = randInt(-6, 6);
      const A: [number, number] = [mx - dx, my - dy];
      const B: [number, number] = [mx + dx, my + dy];
      return {
        prompt: `What is the midpoint of ${point(...A)} and ${point(...B)}?`,
        answer: point(mx, my),
        wrong: [point(dx, dy), point(B[0] - A[0], B[1] - A[1]), point(my, mx), point(A[0] + B[0], A[1] + B[1])],
        pad: padPoint(mx, my),
        explanation: `Average the coordinates: ((${ns(A[0])} + ${paren(B[0])})/2, (${ns(A[1])} + ${paren(B[1])})/2) = ${point(mx, my)}.`,
      };
    },
  },
];

// ======================================================================== NC Math 2 (grade 10)

export const GRADE_10: Gen[] = [
  {
    key: "arei4",
    standard: "NC.M2.A-REI.4",
    skill: "Solve quadratic equations",
    make() {
      if (chance(0.35)) {
        const k = randInt(2, 12);
        return {
          prompt: `Solve: x² = ${k * k}`,
          answer: `x = ±${k}`,
          wrong: [`x = ${k}`, `x = ±${(k * k) / 2}`, `x = ${MINUS}${k}`, `x = ±${k * k}`],
          pad: () => `x = ±${k + nz(-2, 2)}`,
          explanation: `Take the square root of both sides, and remember both signs: x = ±√${k * k} = ±${k}.`,
        };
      }
      let [r1, r2] = distinctInts(2, -9, 9);
      if (r1 === -r2) r2 += 1;
      const show = (a: number, b: number) => `x = ${ns(Math.min(a, b))} or ${ns(Math.max(a, b))}`;
      return {
        prompt: `Solve: ${poly([1, -(r1 + r2), r1 * r2])} = 0`,
        answer: show(r1, r2),
        wrong: [show(-r1, -r2), show(-r1, r2), show(r1, -r2)],
        pad: () => show(r1 + nz(-2, 2), r2 + randInt(-1, 1)),
        explanation: `Factor: ${factor(r1)}${factor(r2)} = 0. Set each factor to 0: x = ${ns(r1)} or x = ${ns(r2)}.`,
      };
    },
  },
  {
    key: "fif8",
    standard: "NC.M2.F-IF.8",
    skill: "Vertex of a parabola",
    make() {
      const a = pick([1, -1, 2, -2]);
      let h = randInt(-5, 5);
      let k = randInt(-9, 9);
      if (h === 0) h = 3;
      if (k === 0) k = 4;
      if (k === h || k === -h) k += 1;
      if (chance()) {
        const hx = h === 0 ? "x" : `(${xPlus(-h)})`;
        return {
          prompt: `What is the vertex of y = ${a === 1 ? "" : a === -1 ? MINUS : ns(a)}${hx}² ${k < 0 ? MINUS : "+"} ${Math.abs(k)}?`,
          answer: point(h, k),
          wrong: [point(-h, k), point(h, -k), point(-h, -k), point(k, h)],
          pad: padPoint(h, k),
          explanation: `In y = a(x − h)² + k, the vertex is (h, k). Watch the sign inside: (${xPlus(-h)}) means h = ${ns(h)}. Vertex: ${point(h, k)}.`,
        };
      }
      const b = -2 * a * h;
      const c = a * h * h + k;
      return {
        prompt: `What is the vertex of y = ${poly([a, b, c])}?`,
        answer: point(h, k),
        wrong: [point(-h, a * h * h - b * h + c), point(h, c), point(-h, k), point(b, c)],
        pad: padPoint(h, k),
        explanation: `x = −b/(2a) = ${ns(-b)}/${ns(2 * a)} = ${ns(h)}. Plug in: y = ${ns(k)}. Vertex: ${point(h, k)}.`,
      };
    },
  },
  {
    key: "nrn2r",
    standard: "NC.M2.N-RN.2",
    skill: "Simplify radicals",
    make() {
      const m = pick([2, 3, 5, 6, 7, 10]);
      const k = randInt(2, 7);
      const inside = k * k * m;
      const ans = radical(inside);
      const wrong = [`${k * k}√${m}`, `${m}√${k}`, `${k}√${m * k}`, `${k + 1}√${m}`, `${Math.floor(inside / 2)}√2`].filter((w) => w !== ans);
      return {
        prompt: `Simplify: √${inside}`,
        answer: ans,
        wrong,
        explanation: `${inside} = ${k * k} × ${m}, and √${k * k} = ${k}. So √${inside} = ${ans}.`,
      };
    },
  },
  {
    key: "nrn2e",
    standard: "NC.M2.N-RN.2",
    skill: "Rational exponents",
    make() {
      const q = pick([2, 3]);
      const r = q === 2 ? randInt(2, 9) : randInt(2, 5);
      const p = q === 2 ? pick([1, 3]) : pick([1, 2]);
      const b = r ** q;
      const ans = r ** p;
      return {
        prompt: `What is ${b}^(${p}/${q})?`,
        ...nums(ans, [(b * p) / q, b ** p, r * p, ans + r, r], { min: 1 }),
        explanation: `The denominator ${q} means ${q === 2 ? "square" : "cube"} root${p > 1 ? ` and the numerator ${p} means a power` : ""}: ${p > 1 ? `(${q === 2 ? "√" : "∛"}${b})${sup(p)} = ${pow(r, p)} = ${ans}` : `${q === 2 ? "√" : "∛"}${b} = ${ans}`}.`,
      };
    },
  },
  {
    key: "gsrt6",
    standard: "NC.M2.G-SRT.6",
    skill: "Trigonometric ratios",
    make() {
      const [a, b, c] = pick(TRIPLES);
      const [opp, adj] = chance() ? [a, b] : [b, a];
      const fn = pick(["sin", "cos", "tan"] as const);
      const val = fn === "sin" ? fr(opp, c) : fn === "cos" ? fr(adj, c) : fr(opp, adj);
      return {
        prompt: `In right triangle ABC, angle C = 90°, BC = ${opp}, AC = ${adj}, AB = ${c}. What is ${fn} A?`,
        ...fracs(val, [fr(opp, c), fr(adj, c), fr(opp, adj), fr(adj, opp), fr(c, opp)], fstr),
        explanation: `For angle A: opposite = BC = ${opp}, adjacent = AC = ${adj}, hypotenuse = ${c}. ${fn} = ${fn === "sin" ? "opp/hyp" : fn === "cos" ? "adj/hyp" : "opp/adj"} = ${fstr(val)}.`,
      };
    },
  },
  {
    key: "gsrt12",
    standard: "NC.M2.G-SRT.12",
    skill: "Special right triangles",
    make() {
      const k = randInt(2, 12);
      if (chance()) {
        return {
          prompt: `A 45°-45°-90° triangle has legs of ${k}. How long is the hypotenuse?`,
          answer: `${k}√2`,
          wrong: [`${k}√3`, `${2 * k}`, `${k * k}√2`, `${k}`],
          explanation: `In a 45-45-90 triangle, hypotenuse = leg × √2 = ${k}√2.`,
        };
      }
      const ask = pick(["hyp", "long"] as const);
      return {
        prompt: `A 30°-60°-90° triangle has a short leg of ${k}. How long is the ${ask === "hyp" ? "hypotenuse" : "longer leg"}?`,
        answer: ask === "hyp" ? `${2 * k}` : `${k}√3`,
        wrong: ask === "hyp" ? [`${k}√3`, `${k}√2`, `${3 * k}`, `${2 * k}√3`] : [`${2 * k}`, `${k}√2`, `${2 * k}√3`, `${3 * k}`],
        explanation: `The sides of a 30-60-90 triangle are x, x√3, 2x. With x = ${k}: longer leg ${k}√3, hypotenuse ${2 * k}.`,
      };
    },
  },
  {
    key: "gsrt8",
    standard: "NC.M2.G-SRT.8",
    skill: "Right triangles in context",
    make() {
      const [a, b, c] = pick(TRIPLES);
      return {
        prompt: `A ${c} ft ladder leans on a wall. Its foot is ${a} ft from the wall. How high up the wall does it reach?`,
        ...nums(b, [c - a, c + a, c * c - a * a, b + 1], { min: 1, fmt: (v) => `${v} ft` }),
        explanation: `The ladder is the hypotenuse: h² = ${c}² − ${a}² = ${c * c - a * a}, so h = ${b} ft.`,
      };
    },
  },
  {
    key: "gsrt4",
    standard: "NC.M2.G-SRT.4",
    skill: "Similar triangles",
    make() {
      const ab = randInt(2, 12);
      const bc = randInt(2, 12);
      const k = pick([fr(3, 2), fr(2, 1), fr(3, 1), fr(5, 2), fr(4, 3)]);
      if ((ab * k.n) % k.d || (bc * k.n) % k.d) return GRADE_10[7].make(false);
      const de = (ab * k.n) / k.d;
      const ef = (bc * k.n) / k.d;
      return {
        prompt: `△ABC ~ △DEF. AB = ${ab}, BC = ${bc}, and DE = ${de}. What is EF?`,
        ...nums(ef, [bc + (de - ab), (ab * bc) / de, ef + 1, de], { min: 1 }),
        explanation: `The scale factor is DE/AB = ${de}/${ab} = ${fstr(k)}. So EF = ${bc} × ${fstr(k)} = ${ef}.`,
      };
    },
  },
  {
    key: "scp7",
    standard: "NC.M2.S-CP.7",
    skill: "Addition rule",
    make() {
      const pa = randInt(2, 7) * 10;
      const pb = randInt(1, 6) * 10;
      const both = randInt(1, Math.min(pa, pb) / 10) * 10 - pick([0, 5]);
      const or = pa + pb - both;
      if (or > 100 || both <= 0) return GRADE_10[8].make(false);
      const p = (v: number) => dec(v, 2);
      return {
        prompt: `P(A) = ${p(pa)}, P(B) = ${p(pb)}, and P(A and B) = ${p(both)}. What is P(A or B)?`,
        answer: p(or),
        wrong: [p(pa + pb), dec(pa * pb, 4), p(pa + pb - 2 * both), p(or + 10)].filter((w) => Number(w.replace(MINUS, "-")) <= 1.5),
        explanation: `P(A or B) = P(A) + P(B) − P(A and B) = ${p(pa)} + ${p(pb)} − ${p(both)} = ${p(or)}.`,
      };
    },
  },
  {
    key: "scp6",
    standard: "NC.M2.S-CP.6",
    skill: "Conditional probability",
    make() {
      const total = pick([40, 50, 60, 80, 100]);
      const s = randInt(total / 5, total / 2);
      const both = randInt(2, s - 2);
      const m = randInt(both + 2, total - s + both - 1);
      const P = fr(both, s);
      return {
        prompt: `Of ${total} students, ${s} play sports and ${m} play music. ${both} do both. What is P(music | sports)?`,
        ...fracs(P, [fr(both, m), fr(both, total), fr(m, total), fr(s, total)], fstr),
        explanation: `Given sports means only look at the ${s} athletes. ${both} of them play music: ${both}/${s}${fstr(P) !== `${both}/${s}` ? ` = ${fstr(P)}` : ""}.`,
      };
    },
  },
  {
    key: "gco2",
    standard: "NC.M2.G-CO.2",
    skill: "Transformations",
    make() {
      const x = nz(-8, 8);
      let y = nz(-8, 8);
      if (Math.abs(x) === Math.abs(y)) y += y > 0 ? 1 : -1;
      const kind = randInt(0, 3);
      const P = point(x, y);
      if (kind === 0) {
        return {
          prompt: `Reflect ${P} over the x-axis. What is the image?`,
          answer: point(x, -y),
          wrong: [point(-x, y), point(-x, -y), point(y, x)],
          explanation: `Reflecting over the x-axis keeps x and flips the sign of y: ${point(x, -y)}.`,
        };
      }
      if (kind === 1) {
        return {
          prompt: `Reflect ${P} over the y-axis. What is the image?`,
          answer: point(-x, y),
          wrong: [point(x, -y), point(-x, -y), point(y, x)],
          explanation: `Reflecting over the y-axis flips the sign of x and keeps y: ${point(-x, y)}.`,
        };
      }
      if (kind === 2) {
        return {
          prompt: `Rotate ${P} 90° counterclockwise about the origin. What is the image?`,
          answer: point(-y, x),
          wrong: [point(y, -x), point(-x, -y), point(y, x), point(x, -y)],
          explanation: `A 90° counterclockwise rotation maps (x, y) to (−y, x): ${point(-y, x)}.`,
        };
      }
      const dx = nz(-6, 6);
      const dy = nz(-6, 6);
      return {
        prompt: `Translate ${P} by (x, y) → (x ${dx < 0 ? MINUS : "+"} ${Math.abs(dx)}, y ${dy < 0 ? MINUS : "+"} ${Math.abs(dy)}). What is the image?`,
        answer: point(x + dx, y + dy),
        wrong: [point(x - dx, y - dy), point(x + dy, y + dx), point(x + dx, y - dy), point(x - dx, y + dy)],
        explanation: `Add ${ns(dx)} to x and ${ns(dy)} to y: ${point(x + dx, y + dy)}.`,
      };
    },
  },
];

// ======================================================================== NC Math 3 (grade 11)

const TRIG_VALUES = ["0", "1", `${MINUS}1`, "1/2", `${MINUS}1/2`, "√2/2", `${MINUS}√2/2`, "√3/2", `${MINUS}√3/2`];

function exactTrig(deg: number): { sin: string; cos: string } {
  const base: Record<number, [string, string]> = { 0: ["0", "1"], 30: ["1/2", "√3/2"], 45: ["√2/2", "√2/2"], 60: ["√3/2", "1/2"], 90: ["1", "0"] };
  const d = ((deg % 360) + 360) % 360;
  const ref = d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d;
  const [s, c] = base[ref];
  const sSign = d > 180 && d < 360 ? -1 : 1;
  const cSign = d > 90 && d < 270 ? -1 : 1;
  const sg = (v: string, sign: number) => (v === "0" || sign > 0 ? v : MINUS + v);
  return { sin: sg(s, sSign), cos: sg(c, cSign) };
}

const UNIT_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

export const GRADE_11: Gen[] = [
  {
    key: "aapr2",
    standard: "NC.M3.A-APR.2",
    skill: "Remainder theorem",
    make() {
      const co = [nz(-3, 3), randInt(-5, 5), randInt(-6, 6), randInt(-9, 9)];
      const r = nz(-3, 3);
      const P = (x: number) => co[0] * x ** 3 + co[1] * x ** 2 + co[2] * x + co[3];
      return {
        prompt: `What is the remainder when P(x) = ${poly(co)} is divided by (${xPlus(-r)})?`,
        ...nums(P(r), [P(-r), co[3], P(r) + r, -P(r)]),
        explanation: `By the Remainder Theorem, the remainder is P(${ns(r)}) = ${ns(P(r))}.`,
      };
    },
  },
  {
    key: "aapr3",
    standard: "NC.M3.A-APR.3",
    skill: "Zeros of polynomials",
    make() {
      const zs = distinctInts(3, -6, 6);
      if (zs.every((z) => z !== 0) && chance(0.4)) zs[0] = 0;
      if (new Set(zs).size < 3) return GRADE_11[1].make(false);
      const f = zs.map(factor).join("");
      const neg = zs.map((z) => -z);
      return {
        prompt: `What are the zeros of f(x) = ${f}?`,
        answer: listNums(zs),
        wrong: [listNums(neg), listNums([-zs[0], zs[1], zs[2]]), listNums([zs[0], -zs[1], zs[2]]), listNums([zs[0], zs[1], -zs[2]])],
        pad: () => listNums([zs[0] + nz(-2, 2), zs[1], zs[2]]),
        explanation: `Set each factor equal to 0: x = ${zs.map(ns).join(", x = ")}.`,
      };
    },
  },
  {
    key: "fle4",
    standard: "NC.M3.F-LE.4",
    skill: "Logarithms and exponential equations",
    make() {
      const b = pick([2, 3, 4, 5, 10]);
      const k = b === 2 ? randInt(3, 8) : b === 10 ? randInt(2, 6) : randInt(2, 4);
      const N = b ** k;
      const wrong = [N / b, k + 1, k - 1, b * k, N / k].filter((v) => Number.isInteger(v));
      if (chance()) {
        return {
          prompt: `Solve: ${b}${SUPX} = ${n(N)}`,
          ...nums(k, wrong, { min: 0 }),
          explanation: `Write ${n(N)} as a power of ${b}: ${n(N)} = ${pow(b, k)}. So x = ${k}.`,
        };
      }
      return {
        prompt: `What is log${b === 10 ? "" : sub(b)} ${n(N)}?`,
        ...nums(k, wrong, { min: 0 }),
        explanation: `log${b === 10 ? "" : sub(b)} ${n(N)} asks: ${b} to what power is ${n(N)}? Since ${pow(b, k)} = ${n(N)}, the answer is ${k}.`,
      };
    },
  },
  {
    key: "ftf1",
    standard: "NC.M3.F-TF.1",
    skill: "Radians and degrees",
    make() {
      const deg = pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]);
      const rad = fr(deg, 180);
      if (chance()) {
        return {
          prompt: `Convert ${deg}° to radians.`,
          ...fracs(rad, [fr(deg, 360), fr(deg, 90), fr(180, deg), fr(deg, 60)], piStr),
          explanation: `Multiply by ${PI}/180: ${deg} × ${PI}/180 = ${piStr(rad)}.`,
        };
      }
      return {
        prompt: `Convert ${piStr(rad)} radians to degrees.`,
        ...nums(deg, [deg * 2, deg / 2, 180 - deg, deg + 90], { min: 1, fmt: (v) => `${v}°` }),
        explanation: `Replace ${PI} with 180°: ${piStr(rad)} = ${deg}°.`,
      };
    },
  },
  {
    key: "ftf2",
    standard: "NC.M3.F-TF.2",
    skill: "Unit circle values",
    make() {
      const deg = pick(UNIT_ANGLES);
      const fn = pick(["sin", "cos"] as const);
      const vals = exactTrig(deg);
      const ans = vals[fn];
      const other = fn === "sin" ? vals.cos : vals.sin;
      const flip = ans === "0" ? "1" : ans.startsWith(MINUS) ? ans.slice(1) : MINUS + ans;
      return {
        prompt: `What is ${fn}(${piStr(fr(deg, 180))})?`,
        answer: ans,
        wrong: [flip, other, ...shuffle(TRIG_VALUES)],
        explanation: `On the unit circle, the point at ${piStr(fr(deg, 180))} (${deg}°) is (cos, sin) = (${vals.cos}, ${vals.sin}). So ${fn} = ${ans}.`,
      };
    },
  },
  {
    key: "ggpe1",
    standard: "NC.M3.G-GPE.1",
    skill: "Equation of a circle",
    make() {
      const h = nz(-7, 7);
      let k = nz(-7, 7);
      if (Math.abs(h) === Math.abs(k)) k += k > 0 ? 1 : -1;
      const r = randInt(2, 9);
      const eq = `(${xPlus(-h)})² + (${xPlus(-k, "y")})² = ${r * r}`;
      if (chance()) {
        return {
          prompt: `What is the center of the circle ${eq}?`,
          answer: point(h, k),
          wrong: [point(-h, -k), point(-h, k), point(h, -k), point(k, h)],
          explanation: `(x − h)² + (y − k)² = r² has center (h, k). The signs flip: center ${point(h, k)}.`,
        };
      }
      return {
        prompt: `What is the radius of the circle ${eq}?`,
        ...nums(r, [r * r, (r * r) / 2, 2 * r, r + 1], { min: 1 }),
        explanation: `r² = ${r * r}, so r = √${r * r} = ${r}.`,
      };
    },
  },
  {
    key: "gc5",
    standard: "NC.M3.G-C.5",
    skill: "Arc length and sector area",
    make() {
      const theta = pick([30, 45, 60, 90, 120, 135, 150, 180, 240, 270, 300]);
      const r = randInt(2, 12);
      const arc = fr(theta * r, 180);
      const area = fr(theta * r * r, 360);
      if (chance()) {
        return {
          prompt: `A circle has radius ${r}. What is the length of an arc with a central angle of ${theta}°?`,
          ...fracs(arc, [area, fr(2 * r, 1), fr(theta * r, 360), fr(theta * r, 90)], piStr),
          explanation: `Arc length = (${theta}/360) × 2${PI}r = (${theta}/360) × ${2 * r}${PI} = ${piStr(arc)}.`,
        };
      }
      return {
        prompt: `A circle has radius ${r}. What is the area of a sector with a central angle of ${theta}°?`,
        ...fracs(area, [arc, fr(r * r, 1), fr(theta * r * r, 180), fr(theta * r, 360)], piStr),
        explanation: `Sector area = (${theta}/360) × ${PI}r² = (${theta}/360) × ${r * r}${PI} = ${piStr(area)}.`,
      };
    },
  },
  {
    key: "fbf4",
    standard: "NC.M3.F-BF.4",
    skill: "Inverse functions",
    make() {
      const a = randInt(2, 6);
      const b = nz(-9, 9);
      if (chance()) {
        const t = randInt(-5, 8);
        const v = a * t + b;
        return {
          prompt: `f(x) = ${lin(a, b)}. What is f⁻¹(${ns(v)})?`,
          ...nums(t, [a * v + b, v - b, (v + b) / a, t + 1]),
          explanation: `f⁻¹(${ns(v)}) is the input that gives ${ns(v)}: ${lin(a, b)} = ${ns(v)} → x = ${ns(t)}.`,
        };
      }
      return {
        prompt: `f(x) = ${lin(a, b)}. What is f⁻¹(x)?`,
        answer: `(${xPlus(-b)})/${a}`,
        wrong: [`(${xPlus(b)})/${a}`, `x/${a} ${b > 0 ? MINUS : "+"} ${Math.abs(b)}`, lin(a, -b), `1/(${lin(a, b)})`],
        explanation: `Swap x and y: x = ${lin(a, b, "y")}. Solve for y: y = (${xPlus(-b)})/${a}.`,
      };
    },
  },
  {
    key: "fif7",
    standard: "NC.M3.F-IF.7",
    skill: "Asymptotes of rational functions",
    make() {
      const p = nz(-5, 5);
      const r = nz(-6, 6);
      let q = nz(-9, 9);
      if (q === -p * r) q += 1;
      if (q === 0) q = 2;
      const f = `(${lin(p, q)})/(${xPlus(-r)})`;
      if (chance()) {
        return {
          prompt: `What is the vertical asymptote of f(x) = ${f}?`,
          answer: `x = ${ns(r)}`,
          wrong: [`x = ${ns(-r)}`, `y = ${ns(p)}`, `x = ${ns(p)}`, `x = ${ns(q)}`],
          pad: () => `x = ${ns(r + nz(-3, 3))}`,
          explanation: `The denominator is 0 when x = ${ns(r)}, and the top isn't 0 there, so x = ${ns(r)} is a vertical asymptote.`,
        };
      }
      return {
        prompt: `What is the horizontal asymptote of f(x) = ${f}?`,
        answer: `y = ${ns(p)}`,
        wrong: [`y = ${ns(q)}`, `x = ${ns(r)}`, "y = 0", `y = ${ns(-p)}`, `y = ${ns(r)}`],
        pad: () => `y = ${ns(p + nz(-3, 3))}`,
        explanation: `The top and bottom have the same degree, so y = (leading coefficients) = ${ns(p)}/1 = ${ns(p)}.`,
      };
    },
  },
  {
    key: "arei2",
    standard: "NC.M3.A-REI.2",
    skill: "Radical equations",
    make() {
      const b = randInt(2, 9);
      const a = nz(-9, 9);
      const x = b * b - a;
      return {
        prompt: `Solve: √(${xPlus(a)}) = ${b}`,
        ...nums(x, [b - a, b * b + a, b * b, 2 * b - a]),
        explanation: `Square both sides: ${xPlus(a)} = ${b * b}. So x = ${ns(x)}. Check: √${b * b} = ${b}. ✓`,
      };
    },
  },
  {
    key: "gc2",
    standard: "NC.M3.G-C.2",
    skill: "Inscribed angles",
    make() {
      const ins = randInt(15, 85);
      if (chance()) {
        return {
          prompt: `An inscribed angle intercepts an arc of ${2 * ins}°. What is the measure of the angle?`,
          ...nums(ins, [2 * ins, 4 * ins, 180 - 2 * ins, 360 - 2 * ins], { min: 1, fmt: (v) => `${v}°` }),
          explanation: `An inscribed angle is half its intercepted arc: ${2 * ins}° ÷ 2 = ${ins}°.`,
        };
      }
      return {
        prompt: `A central angle and an inscribed angle intercept the same arc. The central angle is ${2 * ins}°. Find the inscribed angle.`,
        ...nums(ins, [2 * ins, 4 * ins, 180 - 2 * ins], { min: 1, fmt: (v) => `${v}°` }),
        explanation: `The central angle equals the arc (${2 * ins}°), and an inscribed angle is half the arc: ${ins}°.`,
      };
    },
  },
];

// ======================================================================== NC Math 4 (grade 12)

const LAW_OF_COS: { a: number; b: number; C: number; c: number }[] = [];
for (let a = 2; a <= 16; a++) {
  for (let b = a + 1; b <= 20; b++) {
    for (const C of [60, 120]) {
      const c2 = a * a + b * b + (C === 60 ? -a * b : a * b);
      const c = Math.round(Math.sqrt(c2));
      if (c * c === c2) LAW_OF_COS.push({ a, b, C, c });
    }
  }
}

export const GRADE_12: Gen[] = [
  {
    key: "af12",
    standard: "NC.M4.AF.1.2",
    skill: "Evaluate composite functions",
    make() {
      const a = nz(-4, 5);
      const b = randInt(-6, 6);
      const c = randInt(-5, 5);
      const k = randInt(-3, 3);
      const f = (x: number) => a * x + b;
      const g = (x: number) => x * x + c;
      const fog = chance();
      const ans = fog ? f(g(k)) : g(f(k));
      return {
        prompt: `f(x) = ${lin(a, b)} and g(x) = ${poly([1, 0, c])}. What is ${fog ? "f(g" : "g(f"}(${ns(k)}))?`,
        ...nums(ans, [fog ? g(f(k)) : f(g(k)), f(k) * g(k), f(k) + g(k), ans + 1]),
        explanation: fog
          ? `Work inside out: g(${ns(k)}) = ${ns(g(k))}, then f(${ns(g(k))}) = ${ns(ans)}.`
          : `Work inside out: f(${ns(k)}) = ${ns(f(k))}, then g(${ns(f(k))}) = ${ns(ans)}.`,
      };
    },
  },
  {
    key: "af11",
    standard: "NC.M4.AF.1.1",
    skill: "Compose functions",
    make() {
      const a = randInt(2, 5);
      const b = nz(-7, 7);
      let c = randInt(2, 5);
      const d = nz(-7, 7);
      if (a === c) c += 1;
      return {
        prompt: `f(x) = ${lin(a, b)} and g(x) = ${lin(c, d)}. What is f(g(x))?`,
        answer: lin(a * c, a * d + b),
        wrong: [lin(a * c, c * b + d), lin(a * c, b + d), lin(a + c, b + d), lin(a * c, d + b * d)],
        pad: () => lin(a * c + nz(-2, 2), a * d + b + randInt(-2, 2)),
        explanation: `Put g(x) into f: ${a}(${lin(c, d)}) ${b < 0 ? MINUS : "+"} ${Math.abs(b)} = ${lin(a * c, a * d + b)}.`,
      };
    },
  },
  {
    key: "af21",
    standard: "NC.M4.AF.2.1",
    skill: "Trigonometric identities",
    make() {
      if (chance(0.3)) {
        const id = pick([
          { q: "1 + tan²θ", a: "sec²θ", w: ["csc²θ", "cot²θ", "cos²θ"] },
          { q: "1 − sin²θ", a: "cos²θ", w: ["tan²θ", "sec²θ", `${MINUS}cos²θ`] },
          { q: "1 + cot²θ", a: "csc²θ", w: ["sec²θ", "tan²θ", "sin²θ"] },
          { q: "sec²θ − tan²θ", a: "1", w: ["0", `${MINUS}1`, "sin²θ"] },
        ]);
        return {
          prompt: `Simplify: ${id.q}`,
          answer: id.a,
          wrong: id.w,
          explanation: `Start from sin²θ + cos²θ = 1 and divide or rearrange: ${id.q} = ${id.a}.`,
        };
      }
      const [a, b, c] = pick(TRIPLES);
      const quad = randInt(1, 4);
      const sSign = quad <= 2 ? 1 : -1;
      const cSign = quad === 1 || quad === 4 ? 1 : -1;
      const sin = fr(sSign * a, c);
      const cos = fr(cSign * b, c);
      const tan = fr(sSign * a * cSign, b);
      const ask = pick(["cos", "tan"] as const);
      const ans = ask === "cos" ? cos : tan;
      return {
        prompt: `sin θ = ${fstr(sin)} and θ is in Quadrant ${["I", "II", "III", "IV"][quad - 1]}. What is ${ask} θ?`,
        ...fracs(ans, [fr(-ans.n, ans.d), ask === "cos" ? fr(b, a) : fr(b, a * cSign * sSign), ask === "cos" ? sin : cos, fr(ans.d, ans.n)], fstr),
        explanation: `Use sin²θ + cos²θ = 1: cos θ = ±${fstr(fr(b, c))}; Quadrant ${["I", "II", "III", "IV"][quad - 1]} makes it ${fstr(cos)}.${ask === "tan" ? ` Then tan θ = sin/cos = ${fstr(tan)}.` : ""}`,
      };
    },
  },
  {
    key: "af22",
    standard: "NC.M4.AF.2.2",
    skill: "Law of Cosines",
    make() {
      const t = pick(LAW_OF_COS);
      const [a, b] = chance() ? [t.a, t.b] : [t.b, t.a];
      const flipped = t.C === 60 ? a * a + b * b + a * b : a * a + b * b - a * b;
      return {
        prompt: `In triangle ABC, a = ${a}, b = ${b}, and angle C = ${t.C}°. Find c.`,
        answer: String(t.c),
        wrong: [radical(a * a + b * b), radical(flipped), String(a + b), String(t.c + 1)].filter((w) => w !== String(t.c)),
        explanation: `c² = a² + b² − 2ab·cos C = ${a * a} + ${b * b} − 2(${a})(${b})(${t.C === 60 ? "1/2" : `${MINUS}1/2`}) = ${t.c * t.c}, so c = ${t.c}.`,
      };
    },
  },
  {
    key: "af23",
    standard: "NC.M4.AF.2.3",
    skill: "Sinusoid features",
    make() {
      const A = randInt(2, 6) * (chance(0.25) ? -1 : 1);
      const B = pick([fr(1, 1), fr(2, 1), fr(3, 1), fr(4, 1), fr(1, 2)]);
      const D = nz(-5, 5);
      const fn = pick(["sin", "cos"]);
      const trig = B.d === 2 ? `${fn}(x/2)` : B.n === 1 ? `${fn} x` : `${fn}(${B.n}x)`;
      const eq = `y = ${ns(A)} ${trig}${D < 0 ? ` ${MINUS} ${-D}` : ` + ${D}`}`;
      const which = pick(["amplitude", "period", "midline"] as const);
      if (which === "amplitude") {
        return {
          prompt: `What is the amplitude of ${eq}?`,
          ...nums(Math.abs(A), [2 * Math.abs(A), D, Math.abs(A) + Math.abs(D), -Math.abs(A)], { min: 0 }),
          explanation: `The amplitude is |A|, the number in front of ${fn}: |${ns(A)}| = ${Math.abs(A)}.`,
        };
      }
      if (which === "period") {
        const per = fdivPi(2, B);
        return {
          prompt: `What is the period of ${eq}?`,
          ...fracs(per, [fdivPi(1, B), fr(2 * B.n, B.d), fr(2, 1), fr(B.n, B.d)].map((f) => (feqF(f, per) ? null : f)), piStr),
          explanation: `Period = 2${PI} ÷ B = 2${PI} ÷ ${fstr(B)} = ${piStr(per)}.`,
        };
      }
      return {
        prompt: `What is the midline of ${eq}?`,
        answer: `y = ${ns(D)}`,
        wrong: [`y = ${ns(A)}`, "y = 0", `y = ${ns(-D)}`, `y = ${ns(D + Math.abs(A))}`],
        pad: () => `y = ${ns(D + nz(-3, 3))}`,
        explanation: `The midline is y = D, the number added at the end: y = ${ns(D)}.`,
      };
    },
  },
  {
    key: "af31",
    standard: "NC.M4.AF.3.1",
    skill: "Exponential and logarithmic forms",
    make() {
      const b = pick([2, 3, 4, 5, 10]);
      const k = b === 2 ? randInt(3, 7) : b === 10 ? randInt(2, 5) : randInt(2, 4);
      const N = b ** k;
      const lg = (base: number) => (base === 10 ? "log" : `log${sub(base)}`);
      if (chance()) {
        return {
          prompt: `Rewrite ${pow(b, k)} = ${n(N)} in logarithmic form.`,
          answer: `${lg(b)} ${n(N)} = ${k}`,
          wrong: [`${lg(k)} ${n(N)} = ${b}`, `${lg(b)} ${k} = ${n(N)}`, `log${sub(N)} ${b} = ${k}`, `${lg(k)} ${b} = ${n(N)}`],
          pad: () => `${lg(b)} ${n(N)} = ${k + nz(-2, 2)}`,
          explanation: `bʸ = x means log_b x = y. So ${pow(b, k)} = ${n(N)} becomes ${lg(b)} ${n(N)} = ${k}.`,
        };
      }
      return {
        prompt: `If f(x) = ${b}${SUPX}, what is f⁻¹(${n(N)})?`,
        ...nums(k, [N / b, b * k, k + 1, N], { min: 0 }),
        explanation: `The inverse of ${b}${SUPX} is ${lg(b)} x. ${lg(b)} ${n(N)} = ${k}, because ${pow(b, k)} = ${n(N)}.`,
      };
    },
  },
  {
    key: "af32",
    standard: "NC.M4.AF.3.2",
    skill: "Solve logarithmic equations",
    make() {
      const kind = randInt(0, 2);
      if (kind === 0) {
        const b = pick([2, 3, 4, 5]);
        const k = b === 2 ? randInt(3, 6) : randInt(2, 4);
        return {
          prompt: `Solve: log${sub(b)} x = ${k}`,
          ...nums(b ** k, [b * k, k ** b, b + k, b ** (k - 1)], { min: 1 }),
          explanation: `Rewrite in exponential form: x = ${pow(b, k)} = ${b ** k}.`,
        };
      }
      if (kind === 1) {
        const b = pick([2, 3]);
        const k = randInt(4, 7);
        const j = randInt(1, k - 2);
        const m = b ** j;
        const x = b ** (k - j);
        return {
          prompt: `Solve: log${sub(b)} x + log${sub(b)} ${m} = ${k}`,
          ...nums(x, [b ** k - m, k - j, b ** k, b ** k / j], { min: 1 }),
          explanation: `Combine: log${sub(b)}(${m}x) = ${k}, so ${m}x = ${pow(b, k)} = ${b ** k} and x = ${x}.`,
        };
      }
      const pair = pick([[2, 50, 2], [4, 25, 2], [5, 20, 2], [8, 125, 3], [25, 40, 3], [2, 500, 3], [20, 50, 3]] as const);
      const [p, q, e] = pair;
      return {
        prompt: `What is log ${p} + log ${q}?`,
        ...nums(e, [e + 1, e - 1, p + q], { min: 0 }),
        explanation: `log a + log b = log(ab): log(${p} × ${q}) = log ${n(p * q)} = ${e}.`,
      };
    },
  },
  {
    key: "af41",
    standard: "NC.M4.AF.4.1",
    skill: "Piecewise functions",
    make() {
      const k = randInt(-2, 3);
      const c = randInt(-5, 5);
      const a = nz(-4, 4);
      const b = randInt(-6, 6);
      const left = (x: number) => x * x + c;
      const right = (x: number) => a * x + b;
      const x = pick([k, k, k - randInt(1, 3), k + randInt(1, 3)]);
      const ans = x < k ? left(x) : right(x);
      const other = x < k ? right(x) : left(x);
      return {
        prompt: `f(x) = ${poly([1, 0, c])} if x < ${ns(k)}, and ${lin(a, b)} if x ≥ ${ns(k)}. What is f(${ns(x)})?`,
        ...nums(ans, [other, ans + other, -ans, ans + 1]),
        explanation: `${ns(x)} ${x < k ? "<" : "≥"} ${ns(k)}, so use ${x < k ? poly([1, 0, c]) : lin(a, b)}: f(${ns(x)}) = ${ns(ans)}.`,
      };
    },
  },
  {
    key: "n1",
    standard: "NC.M4.N.1",
    skill: "Complex numbers",
    make() {
      const kind = randInt(0, 2);
      const a = nz(-6, 6);
      const b = nz(-6, 6);
      const c = nz(-6, 6);
      const d = nz(-6, 6);
      if (kind === 0) {
        return {
          prompt: `Simplify: (${cx(a, b)}) + (${cx(c, d)})`,
          answer: cx(a + c, b + d),
          wrong: [cx(a + c, b - d), cx(a - c, b + d), cx(a + b, c + d), cx(a + c + b + d, 0)],
          pad: () => cx(a + c + nz(-2, 2), b + d + randInt(-2, 2)),
          explanation: `Add real parts and imaginary parts: (${ns(a)} + ${paren(c)}) + (${ns(b)} + ${paren(d)})i = ${cx(a + c, b + d)}.`,
        };
      }
      if (kind === 1) {
        const re = a * c - b * d;
        const im = a * d + b * c;
        return {
          prompt: `Multiply: (${cx(a, b)})(${cx(c, d)})`,
          answer: cx(re, im),
          wrong: [cx(a * c + b * d, im), cx(a * c, b * d), cx(re, -im), cx(-re, im)],
          pad: () => cx(re + nz(-3, 3), im + randInt(-3, 3)),
          explanation: `FOIL, then use i² = −1: ${ns(a * c)} + ${paren(a * d + b * c)}i + ${paren(b * d)}i² = ${cx(re, im)}.`,
        };
      }
      const e = randInt(5, 60);
      const cyc = ["1", "i", `${MINUS}1`, `${MINUS}i`];
      return {
        prompt: `Simplify: i${sup(e)}`,
        answer: cyc[e % 4],
        wrong: cyc.filter((_, i) => i !== e % 4),
        explanation: `Powers of i repeat every 4: i, −1, −i, 1. ${e} ÷ 4 has remainder ${e % 4}, so i${sup(e)} = ${cyc[e % 4]}.`,
      };
    },
  },
  {
    key: "sp3",
    standard: "NC.M4.SP.3",
    skill: "Normal distribution",
    make() {
      const mu = pick([50, 60, 70, 75, 80, 100, 500]);
      const sd = pick([2, 4, 5, 8, 10, 15, 20].filter((v) => mu - 3 * v > 0));
      const kinds = [
        { q: `between ${mu - sd} and ${mu + sd}`, a: "68%" },
        { q: `between ${mu - 2 * sd} and ${mu + 2 * sd}`, a: "95%" },
        { q: `between ${mu - 3 * sd} and ${mu + 3 * sd}`, a: "99.7%" },
        { q: `above ${mu + sd}`, a: "16%" },
        { q: `above ${mu + 2 * sd}`, a: "2.5%" },
        { q: `between ${mu} and ${mu + sd}`, a: "34%" },
        { q: `below ${mu}`, a: "50%" },
      ];
      const k = pick(kinds);
      const pool = ["68%", "95%", "99.7%", "34%", "16%", "2.5%", "50%", "47.5%", "13.5%"].filter((v) => v !== k.a);
      return {
        prompt: `Scores are normal with mean ${mu} and SD ${sd}. About what percent are ${k.q}?`,
        answer: k.a,
        wrong: shuffle(pool),
        explanation: `Use the 68-95-99.7 rule: 68% within 1 SD, 95% within 2 SD, 99.7% within 3 SD. That gives about ${k.a}.`,
      };
    },
  },
  {
    key: "af5",
    standard: "NC.M4.AF.5",
    skill: "Choose a model",
    make() {
      const xs = [0, 1, 2, 3, 4];
      const kind = pick(["Linear", "Quadratic", "Exponential"] as const);
      let ys: number[];
      if (kind === "Linear") {
        const m = nz(-5, 6);
        const b = randInt(-5, 10);
        ys = xs.map((x) => m * x + b);
      } else if (kind === "Quadratic") {
        const a = pick([1, 2, -1]);
        const c = randInt(-3, 5);
        ys = xs.map((x) => a * x * x + c);
      } else {
        const a = randInt(1, 5);
        const r = pick([2, 3]);
        ys = xs.map((x) => a * r ** x);
      }
      const why =
        kind === "Linear"
          ? "The y-values change by the same amount each step (constant first differences)."
          : kind === "Quadratic"
            ? "The first differences change, but the second differences are constant."
            : "Each y-value is multiplied by the same number each step (constant ratio).";
      return {
        prompt: `x: ${xs.join(", ")}; y: ${ys.map(ns).join(", ")}. Which model fits best?`,
        answer: kind,
        wrong: ["Linear", "Quadratic", "Exponential", "Logarithmic"].filter((m) => m !== kind),
        explanation: why,
      };
    },
  },
];

function fdivPi(num: number, B: { n: number; d: number }) {
  return fr(num * B.d, B.n);
}
function feqF(a: { n: number; d: number }, b: { n: number; d: number }) {
  return a.n * b.d === b.n * a.d;
}

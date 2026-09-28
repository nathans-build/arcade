import type { DeliveryRule } from "./types";
import { asFunction, gcd, isPrime, near, parseRelation, relationIsFunction, valueOf } from "./expr";

/*
 * Math delivery rules, K–12 (NC Standard Course of Study for Mathematics).
 * Every rule has a `test` that computes the answer from the label itself; the check
 * script (scripts/check-rules.ts) makes sure the hand-sorted yes/no lists agree with it.
 */

const fmt = (v: number) => {
  if (Number.isInteger(v)) return v < 0 ? `−${-v}` : String(v);
  const r = Math.round(v * 1000) / 1000;
  return r < 0 ? `−${-r}` : String(r);
};
/** Label as plain text for explanations: x{2} → x^2, log[2]8 → log base 2 of 8. */
export const plain = (s: string) =>
  s.replace(/log\[([^\]]+)\]/g, "log base $1 of ").replace(/\{([^}]*)\}/g, "^($1)").replace(/\^\((\w)\)/g, "^$1").replace(/\[([^\]]*)\]/g, "$1");

const smallestFactor = (v: number) => {
  for (let i = 2; i * i <= v; i++) if (v % i === 0) return i;
  return v;
};

const oddEven = (f: (x: number) => number, kind: "even" | "odd"): boolean => {
  for (const x of [0.5, 1, 1.5, 2, 3, 4]) {
    const a = f(x), b = f(-x);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    if (kind === "even" ? !near(a, b, 1e-7) : !near(b, -a, 1e-7)) return false;
  }
  return true;
};

const isLinear = (f: (x: number) => number): boolean => {
  const xs = [-3, -2, -1, 0, 1, 2, 3, 4.5];
  const ys = xs.map(f);
  if (ys.some((y) => !Number.isFinite(y))) return false;
  const m = (ys[1] - ys[0]) / (xs[1] - xs[0]);
  if (near(m, 0)) return false; // constant functions are left out of the lists
  return xs.every((x, i) => near(ys[i], ys[0] + m * (x - xs[0]), 1e-7));
};

/** Denominator of a fraction label in lowest terms has a prime factor other than 2 and 5. */
const repeats = (label: string) => {
  const [a, b] = label.split("/").map(Number);
  let d = b / gcd(a, b);
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d !== 1;
};

const irrational = (label: string) => /π/.test(label) || [...label.matchAll(/√(\d+)/g)].some((m) => !Number.isInteger(Math.sqrt(Number(m[1]))));

export const MATH_RULES: DeliveryRule[] = [
  // ---------------------------------------------------------------- K
  {
    id: "m-k-less10", subject: "math", grades: ["K"], standard: "NC.K.CC.7", skill: "Compare numbers",
    target: "LESS THAN 10", prompt: "Deliver to numbers LESS THAN 10.",
    yes: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    no: ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"],
    yesWhy: "{x} is less than 10.", noWhy: "{x} is not less than 10.",
    test: (s) => valueOf(s) < 10,
    why: (s, m) => (m ? `${s} comes before 10 when we count, so it is less than 10.` : s === "10" ? "10 is equal to 10, not less than 10." : `${s} comes after 10 when we count, so it is more than 10.`),
  },
  {
    id: "m-k-make5", subject: "math", grades: ["K"], standard: "NC.K.OA.3", skill: "Ways to make 5",
    target: "MAKES 5", prompt: "Deliver to the houses that MAKE 5.",
    yes: ["2+3", "3+2", "4+1", "1+4", "5+0", "0+5", "6−1", "7−2"],
    no: ["2+2", "3+3", "4+2", "1+2", "3+1", "2+4", "6−2", "5−1", "4+0"],
    yesWhy: "{x} makes 5.", noWhy: "{x} does not make 5.",
    test: (s) => valueOf(s) === 5,
    why: (s, m) => `${s} = ${fmt(valueOf(s))}${m ? ". It makes 5!" : ", not 5."}`,
  },
  // ---------------------------------------------------------------- 1
  {
    id: "m-1-make10", subject: "math", grades: ["1"], standard: "NC.1.OA.6", skill: "Make 10",
    target: "MAKES 10", prompt: "Deliver to the houses that MAKE 10.",
    yes: ["3+7", "7+3", "6+4", "4+6", "5+5", "2+8", "8+2", "9+1", "12−2"],
    no: ["3+6", "4+5", "5+6", "2+7", "8+3", "9+2", "6+3", "7+4", "12−3"],
    yesWhy: "{x} makes 10.", noWhy: "{x} does not make 10.",
    test: (s) => valueOf(s) === 10,
    why: (s, m) => `${s} = ${fmt(valueOf(s))}${m ? ". That makes 10!" : ", not 10."}`,
  },
  {
    id: "m-1-tens", subject: "math", grades: ["1"], standard: "NC.1.NBT.2", skill: "Tens and ones",
    target: "4 TENS", prompt: "Deliver to numbers with 4 TENS.",
    yes: ["40", "41", "42", "43", "45", "47", "48", "49"],
    no: ["14", "24", "34", "54", "50", "39", "64", "4", "74"],
    yesWhy: "{x} has 4 tens.", noWhy: "{x} does not have 4 tens.",
    test: (s) => Math.floor(valueOf(s) / 10) === 4,
    why: (s) => {
      const v = valueOf(s);
      return `${s} is ${Math.floor(v / 10)} ten${Math.floor(v / 10) === 1 ? "" : "s"} and ${v % 10} one${v % 10 === 1 ? "" : "s"}.`;
    },
  },
  // ---------------------------------------------------------------- 2
  {
    id: "m-2-even", subject: "math", grades: ["2"], standard: "NC.2.OA.3", skill: "Odd and even",
    target: "EVEN NUMBERS", prompt: "Deliver to EVEN numbers.",
    yes: ["4", "6", "8", "10", "12", "14", "16", "18", "20"],
    no: ["3", "5", "7", "9", "11", "13", "15", "17", "19"],
    yesWhy: "{x} is even.", noWhy: "{x} is odd.",
    test: (s) => valueOf(s) % 2 === 0,
    why: (s, m) => {
      const v = valueOf(s);
      return m ? `${s} is even: it splits into two equal groups of ${v / 2}.` : `${s} is odd: two equal groups of ${(v - 1) / 2} leave 1 left over.`;
    },
  },
  {
    id: "m-2-hund", subject: "math", grades: ["2"], standard: "NC.2.NBT.1", skill: "Place value to 1,000",
    target: "3 HUNDREDS", prompt: "Deliver to numbers with 3 HUNDREDS.",
    yes: ["300", "315", "342", "389", "307", "360", "399", "331"],
    no: ["30", "203", "130", "413", "293", "503", "433", "230"],
    yesWhy: "{x} has 3 hundreds.", noWhy: "{x} does not have 3 hundreds.",
    test: (s) => Math.floor(valueOf(s) / 100) === 3,
    why: (s) => {
      const v = valueOf(s);
      return `${s} = ${Math.floor(v / 100)} hundreds, ${Math.floor(v / 10) % 10} tens and ${v % 10} ones.`;
    },
  },
  // ---------------------------------------------------------------- 3
  {
    id: "m-3-mult4", subject: "math", grades: ["3"], standard: "NC.3.OA.7", skill: "Multiples",
    target: "MULTIPLES OF 4", prompt: "Deliver to MULTIPLES OF 4.",
    yes: ["4", "8", "12", "16", "20", "24", "28", "32", "36", "40"],
    no: ["6", "10", "14", "18", "22", "26", "30", "34", "38"],
    yesWhy: "{x} is a multiple of 4.", noWhy: "{x} is not a multiple of 4.",
    test: (s) => valueOf(s) % 4 === 0,
    why: (s, m) => {
      const v = valueOf(s);
      return m ? `${s} = 4 × ${v / 4}, so it is a multiple of 4.` : `${s} = 4 × ${Math.floor(v / 4)} + ${v % 4}. It is not in the 4s count.`;
    },
  },
  {
    id: "m-3-prod24", subject: "math", grades: ["3"], standard: "NC.3.OA.7", skill: "Multiplication facts",
    target: "EQUALS 24", prompt: "Deliver to products EQUAL TO 24.",
    yes: ["3×8", "8×3", "4×6", "6×4", "2×12", "12×2", "24×1", "1×24"],
    no: ["5×5", "3×7", "4×5", "6×5", "2×11", "3×9", "4×7", "5×4"],
    yesWhy: "{x} = 24.", noWhy: "{x} is not 24.",
    test: (s) => valueOf(s) === 24,
    why: (s, m) => `${s} = ${valueOf(s)}${m ? "." : ", not 24."}`,
  },
  // ---------------------------------------------------------------- 4
  {
    id: "m-4-prime", subject: "math", grades: ["4", "5"], standard: "NC.4.OA.4", skill: "Prime and composite",
    target: "PRIME NUMBERS", prompt: "Deliver to PRIME numbers: exactly two factors, 1 and itself.",
    yes: ["2", "3", "5", "7", "11", "13", "17", "19", "23", "29", "31", "37"],
    no: ["1", "4", "9", "15", "21", "27", "33", "39", "49", "51", "57", "91"],
    yesWhy: "{x} is prime.", noWhy: "{x} is not prime.",
    test: (s) => isPrime(valueOf(s)),
    why: (s, m) => {
      const v = valueOf(s);
      if (m) return `${s} is prime: its only factors are 1 and ${s}.`;
      if (v === 1) return "1 is not prime: it has only one factor.";
      const f = smallestFactor(v);
      return `${s} = ${f} × ${v / f}, so it is composite, not prime.`;
    },
  },
  {
    id: "m-4-half", subject: "math", grades: ["4"], standard: "NC.4.NF.1", skill: "Equivalent fractions",
    target: "EQUAL TO 1/2", prompt: "Deliver to fractions EQUAL TO 1/2.",
    yes: ["2/4", "3/6", "4/8", "5/10", "6/12", "7/14", "8/16", "10/20", "50/100"],
    no: ["1/3", "2/3", "3/4", "2/5", "3/8", "4/6", "5/8", "6/10", "1/4"],
    yesWhy: "{x} = 1/2.", noWhy: "{x} is not 1/2.",
    test: (s) => near(valueOf(s), 0.5),
    why: (s, m) => {
      const [a, b] = s.split("/").map(Number);
      return m ? `${s}: the top is half of the bottom (${a} is half of ${b}), so it equals 1/2.` : `${s}: ${a} is not half of ${b}, so it does not equal 1/2.`;
    },
  },
  {
    id: "m-4-mult6", subject: "math", grades: ["4"], standard: "NC.4.OA.4", skill: "Factors and multiples",
    target: "MULTIPLES OF 6", prompt: "Deliver to MULTIPLES OF 6.",
    yes: ["6", "12", "18", "24", "30", "36", "42", "48", "54"],
    no: ["16", "20", "26", "32", "34", "40", "44", "50", "62"],
    yesWhy: "{x} is a multiple of 6.", noWhy: "{x} is not a multiple of 6.",
    test: (s) => valueOf(s) % 6 === 0,
    why: (s, m) => {
      const v = valueOf(s);
      return m ? `${s} = 6 × ${v / 6}.` : `${s} ÷ 6 leaves a remainder of ${v % 6}, so it is not a multiple of 6.`;
    },
  },
  // ---------------------------------------------------------------- 5
  {
    id: "m-5-gthalf", subject: "math", grades: ["5"], standard: "NC.5.NBT.3", skill: "Compare decimals",
    target: "MORE THAN 0.5", prompt: "Deliver to decimals GREATER THAN 0.5.",
    yes: ["0.6", "0.51", "0.75", "0.9", "0.55", "0.8", "0.501", "0.65", "0.7"],
    no: ["0.45", "0.05", "0.49", "0.3", "0.099", "0.5", "0.25", "0.15", "0.405"],
    yesWhy: "{x} > 0.5.", noWhy: "{x} is not greater than 0.5.",
    test: (s) => valueOf(s) > 0.5,
    why: (s, m) => {
      if (s === "0.5") return "0.5 is equal to 0.5, not greater.";
      const v = valueOf(s);
      return m ? `${s} is more than 0.500 (compare tenths first, then hundredths).` : `${s} is less than 0.500: it has ${Math.floor(v * 10)} tenths, and 0.5 has 5 tenths.`;
    },
  },
  {
    id: "m-5-half", subject: "math", grades: ["5"], standard: "NC.5.NBT.3", skill: "Decimals and fractions",
    target: "WORTH 1/2", prompt: "Deliver to numbers WORTH ONE HALF.",
    yes: ["0.5", "0.50", "5/10", "50/100", "3/6", "0.500", "6/12", "4/8", "1/2"],
    no: ["0.05", "5/100", "1/5", "0.55", "2/5", "0.2", "2/3", "0.15", "5/12"],
    yesWhy: "{x} = 0.5 = 1/2.", noWhy: "{x} is not one half.",
    test: (s) => near(valueOf(s), 0.5),
    why: (s, m) => (m ? `${s} = 0.5, which is one half.` : `${s} = ${fmt(valueOf(s))}, not 0.5.`),
  },
  // ---------------------------------------------------------------- 6
  {
    id: "m-6-int", subject: "math", grades: ["6"], standard: "NC.6.NS.6", skill: "Integers and rational numbers",
    target: "INTEGERS", prompt: "Deliver to INTEGERS: whole numbers and their opposites.",
    yes: ["−7", "0", "12", "−15", "3", "−1", "100", "8/2", "−20"],
    no: ["−3.5", "1/2", "0.25", "−2/3", "4.1", "7/2", "−0.8", "1.5", "9/4"],
    yesWhy: "{x} is an integer.", noWhy: "{x} is not an integer.",
    test: (s) => Number.isInteger(valueOf(s)),
    why: (s, m) => (m ? (s.includes("/") ? `${s} = ${fmt(valueOf(s))}, an integer.` : `${s} is a whole number or its opposite: an integer.`) : `${s} = ${fmt(valueOf(s))}, which is between two integers.`),
  },
  {
    id: "m-6-gtneg3", subject: "math", grades: ["6"], standard: "NC.6.NS.7", skill: "Order rational numbers",
    target: "MORE THAN −3", prompt: "Deliver to numbers GREATER THAN −3.",
    yes: ["−2", "−1", "0", "2", "−2.5", "−0.5", "3", "−1/2", "−2.9"],
    no: ["−4", "−5", "−3.5", "−10", "−3", "−7", "−3.1", "−6", "−9/2"],
    yesWhy: "{x} > −3.", noWhy: "{x} is not greater than −3.",
    test: (s) => valueOf(s) > -3,
    why: (s, m) => (s === "−3" ? "−3 is equal to −3, not greater." : m ? `${s} is to the right of −3 on the number line, so it is greater.` : `${s} is to the left of −3 on the number line, so it is less.`),
  },
  {
    id: "m-6-pct25", subject: "math", grades: ["6", "7"], standard: "NC.6.RP.3", skill: "Percents, fractions, decimals",
    target: "EQUAL TO 25%", prompt: "Deliver to numbers EQUAL TO 25%.",
    yes: ["1/4", "0.25", "25/100", "2/8", "3/12", "0.250", "4/16", "5/20", "10/40"],
    no: ["1/25", "2.5", "0.025", "1/5", "2/5", "0.52", "25/10", "3/4", "1/3"],
    yesWhy: "{x} = 0.25 = 25%.", noWhy: "{x} is not 25%.",
    test: (s) => near(valueOf(s), 0.25),
    why: (s, m) => (m ? `${s} = 0.25 = 25 out of 100 = 25%.` : `${s} = ${fmt(valueOf(s))} = ${fmt(valueOf(s) * 100)}%, not 25%.`),
  },
  // ---------------------------------------------------------------- 7
  {
    id: "m-7-neg", subject: "math", grades: ["7"], standard: "NC.7.NS.2", skill: "Multiply and divide integers",
    target: "NEGATIVE", prompt: "Deliver to NEGATIVE answers.",
    yes: ["−3×4", "−8÷2", "−2×5", "7×(−1)", "−10÷5", "6×(−3)", "−12÷4", "9÷(−3)", "−1×8"],
    no: ["−2×(−3)", "−8÷(−2)", "−4×0", "6÷3", "−5×(−5)", "−9÷(−9)", "3×4", "0÷(−7)"],
    yesWhy: "{x} is negative.", noWhy: "{x} is not negative.",
    test: (s) => valueOf(s) < 0,
    why: (s, m) => {
      const v = valueOf(s);
      if (v === 0) return `${s} = 0. Zero is neither positive nor negative.`;
      return m ? `${s} = ${fmt(v)}: the signs are different, so the answer is negative.` : `${s} = ${fmt(v)}: the signs are the same, so the answer is positive.`;
    },
  },
  {
    id: "m-7-repeat", subject: "math", grades: ["7"], standard: "NC.7.NS.2", skill: "Repeating decimals",
    target: "REPEATING", prompt: "Deliver to fractions that are REPEATING decimals.",
    yes: ["1/3", "2/3", "1/6", "5/6", "1/7", "2/9", "1/11", "4/15", "5/12"],
    no: ["1/4", "3/8", "1/5", "7/10", "3/20", "5/16", "9/25", "1/2", "11/40"],
    yesWhy: "{x} repeats.", noWhy: "{x} terminates.",
    test: repeats,
    why: (s, m) => {
      const [a, b] = s.split("/").map(Number);
      const d = b / gcd(a, b);
      return m ? `${s} in lowest terms has denominator ${d}, which has a prime factor other than 2 or 5, so its decimal repeats.` : `${s} = ${fmt(a / b)}: the denominator only has factors of 2 and 5, so the decimal ends.`;
    },
  },
  // ---------------------------------------------------------------- 8
  {
    id: "m-8-squares", subject: "math", grades: ["8"], standard: "NC.8.EE.2", skill: "Perfect squares",
    target: "PERFECT SQUARES", prompt: "Deliver to PERFECT SQUARES.",
    yes: ["1", "4", "9", "16", "25", "36", "49", "64", "81", "100", "121", "144"],
    no: ["8", "12", "18", "24", "32", "50", "72", "90", "99", "120", "48"],
    yesWhy: "{x} is a perfect square.", noWhy: "{x} is not a perfect square.",
    test: (s) => Number.isInteger(Math.sqrt(valueOf(s))),
    why: (s, m) => {
      const v = valueOf(s), r = Math.floor(Math.sqrt(v));
      return m ? `${s} = ${r} × ${r}.` : `${s} is between ${r}² = ${r * r} and ${r + 1}² = ${(r + 1) * (r + 1)}, so it is not a perfect square.`;
    },
  },
  {
    id: "m-8-irr", subject: "math", grades: ["8"], standard: "NC.8.NS.1", skill: "Rational and irrational numbers",
    target: "IRRATIONAL", prompt: "Deliver to IRRATIONAL numbers.",
    yes: ["√2", "√3", "√5", "π", "√7", "√10", "√15", "√20", "2π", "−√2"],
    no: ["√4", "√9", "√16", "0.5", "1/3", "−2", "3.14", "√25", "0.75", "22/7", "√100"],
    yesWhy: "{x} is irrational.", noWhy: "{x} is rational.",
    test: irrational,
    why: (s, m) => {
      if (m) return s.includes("π") ? `${s}: π never ends or repeats, so ${s} is irrational.` : `${s}: the number under the root is not a perfect square, so its decimal never ends or repeats.`;
      if (s.includes("√")) return `${s} = ${fmt(valueOf(s))}, a whole number, so it is rational.`;
      if (s === "3.14" || s === "22/7") return `${s} is close to π, but it is a fraction of integers, so it is rational.`;
      return `${s} can be written as a fraction of integers, so it is rational.`;
    },
  },
  // ---------------------------------------------------------------- 9 (NC Math 1)
  {
    id: "m-9-func", subject: "math", grades: ["9"], standard: "NC.M1.F-IF.1", skill: "Functions",
    target: "FUNCTIONS", prompt: "Deliver to equations where y is a FUNCTION of x (one y for each x).",
    yes: ["y=2x+1", "y=x{2}", "y=|x|", "y=3", "y=−x+4", "y=x{3}", "y=√x", "y=2{x}", "y=x{2}−1"],
    no: ["x=3", "x=y{2}", "x{2}+y{2}=9", "x=|y|", "y{2}=x+1", "x=−2", "x=y{2}−4", "x=2y{2}", "y{2}=4x"],
    yesWhy: "{x} is a function.", noWhy: "{x} is not a function.",
    test: relationIsFunction,
    why: (s, m) => {
      if (m) return `${plain(s)}: each x gives only one y, so it is a function.`;
      // find a witness x with two y values
      const f = parseRelation(s);
      for (let xi = -12; xi <= 12; xi++) {
        const ys: number[] = [];
        for (let yi = -48; yi <= 48 && ys.length < 2; yi++) if (Math.abs(f({ x: xi / 2, y: yi / 4 })) < 1e-9) ys.push(yi / 4);
        if (ys.length === 2) return `${plain(s)}: x = ${fmt(xi / 2)} gives y = ${fmt(ys[0])} and y = ${fmt(ys[1])}. Two outputs for one input, so it is not a function.`;
      }
      return `${plain(s)} fails the vertical line test.`;
    },
  },
  {
    id: "m-9-linear", subject: "math", grades: ["9"], standard: "NC.M1.F-LE.1", skill: "Linear vs. nonlinear",
    target: "LINEAR", prompt: "Deliver to LINEAR functions (constant rate of change).",
    yes: ["y=3x+1", "y=−2x", "y=x−5", "y=x/2+3", "y=0.5x", "y=−x+7", "y=2(x+1)", "y=5−3x", "y=4x"],
    no: ["y=x{2}", "y=2{x}", "y=|x|", "y=x{3}", "y=√x", "y=1/x", "y=x{2}+x", "y=3{x}", "y=(x−1){2}"],
    yesWhy: "{x} is linear.", noWhy: "{x} is not linear.",
    test: (s) => isLinear(asFunction(s)),
    why: (s, m) => (m ? `${plain(s)} has the form y = mx + b: y changes by the same amount each time x goes up by 1.` : `${plain(s)} does not change at a constant rate, so its graph is not a line.`),
  },
  // ---------------------------------------------------------------- 10 (NC Math 2)
  {
    id: "m-10-eight", subject: "math", grades: ["10"], standard: "NC.M2.N-RN.2", skill: "Rational exponents",
    target: "EQUAL TO 8", prompt: "Deliver to expressions EQUAL TO 8.",
    yes: ["2{3}", "√64", "64{1/2}", "4{3/2}", "16{3/4}", "512{1/3}", "32{3/5}", "(√2){6}", "2{6}÷2{3}"],
    no: ["2{4}", "8{1/2}", "4{2}", "3{2}", "16{1/2}", "2{8}", "64{1/3}", "8{2}", "4{1/2}"],
    yesWhy: "{x} = 8.", noWhy: "{x} is not 8.",
    test: (s) => near(valueOf(s), 8),
    why: (s, m) => (m ? `${plain(s)} = 8.` : `${plain(s)} = ${fmt(valueOf(s))}, not 8.`),
  },
  {
    id: "m-10-sol3", subject: "math", grades: ["10"], standard: "NC.M2.A-REI.4", skill: "Solutions of equations",
    target: "SOLVED BY x=3", prompt: "Deliver to equations that x = 3 SOLVES.",
    yes: ["x{2}=9", "2x+1=7", "x{2}−9=0", "x−3=0", "3x=9", "x{2}=3x", "x/3=1", "(x−3){2}=0", "x{2}−5x+6=0"],
    no: ["x{2}=6", "x+3=0", "2x=3", "x{2}=−9", "x/3=3", "x{2}+9=0", "3x=1", "x−3=3", "2x+1=5"],
    yesWhy: "x = 3 solves {x}.", noWhy: "x = 3 does not solve {x}.",
    test: (s) => near(parseRelation(s)({ x: 3, y: NaN }), 0),
    why: (s, m) => {
      const k = s.indexOf("=");
      const l = valueOf(s.slice(0, k).replace(/x/g, "(3)")), r = valueOf(s.slice(k + 1).replace(/x/g, "(3)"));
      return `Put 3 in for x: ${fmt(l)} ${m ? "=" : "≠"} ${fmt(r)}${m ? ", so x = 3 is a solution." : ", so x = 3 is not a solution."}`;
    },
  },
  // ---------------------------------------------------------------- 11 (NC Math 3)
  {
    id: "m-11-even", subject: "math", grades: ["11"], standard: "NC.M3.F-BF.3", skill: "Even and odd functions",
    target: "EVEN FUNCTIONS", prompt: "Deliver to EVEN functions: f(−x) = f(x).",
    yes: ["y=x{2}", "y=|x|", "y=x{4}−1", "y=cos x", "y=5", "y=−x{2}", "y=x{2}+3", "y=2|x|", "y=x{6}"],
    no: ["y=x{3}", "y=x+1", "y=2x", "y=sin x", "y=x{3}+x", "y=(x−1){2}", "y=2{x}", "y=x{2}+x", "y=√x"],
    yesWhy: "{x} is even.", noWhy: "{x} is not even.",
    test: (s) => oddEven(asFunction(s), "even"),
    why: (s, m) => {
      const f = asFunction(s);
      return m ? `${plain(s)}: f(−2) = f(2) = ${fmt(f(2))}. The graph is symmetric about the y-axis.` : `${plain(s)}: f(2) = ${fmt(f(2))} but f(−2) = ${Number.isFinite(f(-2)) ? fmt(f(-2)) : "not a real number"}, so it is not even.`;
    },
  },
  {
    id: "m-11-log2", subject: "math", grades: ["11"], standard: "NC.M3.F-LE.4", skill: "Logarithms",
    target: "EQUAL TO 2", prompt: "Deliver to logarithms EQUAL TO 2.",
    yes: ["log 100", "log[2]4", "log[3]9", "log[5]25", "ln e{2}", "log[4]16", "log[7]49", "log[9]81", "log[6]36"],
    no: ["log 10", "log[2]8", "log[3]27", "log[2]2", "log 1000", "log[4]2", "ln e", "log[5]5", "log[9]3"],
    yesWhy: "{x} = 2.", noWhy: "{x} is not 2.",
    test: (s) => near(valueOf(s), 2),
    why: (s, m) => `${plain(s)} = ${fmt(valueOf(s))}${m ? ": the base raised to 2 gives the number." : ", not 2."}`,
  },
  // ---------------------------------------------------------------- 12 (NC Math 4 / precalculus)
  {
    id: "m-12-sinpos", subject: "math", grades: ["12"], standard: "NC.M3.F-TF.2", skill: "Unit circle",
    target: "SIN > 0", prompt: "Deliver to angles where the SINE IS POSITIVE.",
    yes: ["sin 30°", "sin 90°", "sin 150°", "sin 45°", "sin 120°", "sin 170°", "sin 60°", "sin 135°", "sin 390°"],
    no: ["sin 210°", "sin 270°", "sin 330°", "sin 0°", "sin 180°", "sin 240°", "sin 300°", "sin 360°", "sin −30°"],
    yesWhy: "{x} > 0.", noWhy: "{x} is not positive.",
    test: (s) => valueOf(s) > 1e-9,
    why: (s, m) => {
      const v = valueOf(s);
      if (Math.abs(v) < 1e-9) return `${s} = 0, which is not positive (the point is on the x-axis).`;
      return m ? `${s} = ${fmt(v)}: the angle ends above the x-axis (quadrant I or II).` : `${s} = ${fmt(v)}: the angle ends below the x-axis (quadrant III or IV).`;
    },
  },
  {
    id: "m-12-odd", subject: "math", grades: ["12"], standard: "NC.M3.F-BF.3", skill: "Even and odd functions",
    target: "ODD FUNCTIONS", prompt: "Deliver to ODD functions: f(−x) = −f(x).",
    yes: ["y=x{3}", "y=x", "y=sin x", "y=−2x", "y=x{5}", "y=x{3}−x", "y=1/x", "y=tan x", "y=−x{3}"],
    no: ["y=x{2}", "y=x+1", "y=cos x", "y=|x|", "y=x{3}+1", "y=2{x}", "y=x{4}", "y=5", "y=(x+1){3}"],
    yesWhy: "{x} is odd.", noWhy: "{x} is not odd.",
    test: (s) => oddEven(asFunction(s), "odd"),
    why: (s, m) => {
      const f = asFunction(s);
      return m ? `${plain(s)}: f(−1) = ${fmt(f(-1))} = −f(1). The graph is symmetric about the origin.` : `${plain(s)}: f(1) = ${fmt(f(1))} but f(−1) = ${fmt(f(-1))}, not ${fmt(-f(1))}, so it is not odd.`;
    },
  },
];

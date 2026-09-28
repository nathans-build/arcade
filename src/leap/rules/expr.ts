/*
 * A tiny evaluator for the math labels on Lane Leap's logs ("4×6", "3/4+1/4", "x²+5x+6",
 * "16^(1/2)", "log₂8", "sin 30°", "|−8|", "y=2ˣ"). Used to write each log's reason and,
 * in scripts/check-rules.ts, to recompute every math item's membership.
 *
 * Supports: + − × ÷ · * / ^, parentheses, |absolute|, unary minus, √ (prefix), superscript
 * powers (², ³, ˣ …), %, °, π, e, the variable x, implicit multiplication (2x, 3√2, 4(2)ˣ),
 * sin/cos/tan, ln, and log with an optional subscript base (log 1000 is base 10).
 */

type Tok =
  | { t: "num"; v: number }
  | { t: "op"; v: string }
  | { t: "sup"; v: number | "x" }
  | { t: "sub"; v: number }
  | { t: "fn"; v: string }
  | { t: "x" | "pi" | "e" | "(" | ")" | "|" | "√" | "°" | "%" | "end" };

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.,]/.test(s[j])) j++;
      const raw = s.slice(i, j).replace(/,/g, "");
      out.push({ t: "num", v: Number(raw) });
      i = j;
      continue;
    }
    if (SUP.includes(c) || c === "⁻" || c === "ˣ") {
      if (c === "ˣ") {
        out.push({ t: "sup", v: "x" });
        i++;
        continue;
      }
      let neg = false;
      if (c === "⁻") {
        neg = true;
        i++;
      }
      let n = "";
      while (i < s.length && SUP.includes(s[i])) n += SUP.indexOf(s[i++]);
      out.push({ t: "sup", v: (neg ? -1 : 1) * Number(n) });
      continue;
    }
    if (SUB.includes(c)) {
      let n = "";
      while (i < s.length && SUB.includes(s[i])) n += SUB.indexOf(s[i++]);
      out.push({ t: "sub", v: Number(n) });
      continue;
    }
    const rest = s.slice(i);
    const fn = /^(sin|cos|tan|log|ln)/.exec(rest);
    if (fn) {
      out.push({ t: "fn", v: fn[1] });
      i += fn[1].length;
      continue;
    }
    if (c === "x") out.push({ t: "x" });
    else if (c === "π") out.push({ t: "pi" });
    else if (c === "e") out.push({ t: "e" });
    else if (c === "(" || c === ")" || c === "|" || c === "√" || c === "°" || c === "%") out.push({ t: c });
    else if ("+-−×÷·*/^".includes(c)) out.push({ t: "op", v: c === "-" ? "−" : c });
    else throw new Error(`can't read "${c}" in ${s}`);
    i++;
  }
  out.push({ t: "end" });
  return out;
}

class Parser {
  private i = 0;
  constructor(private toks: Tok[], private x: number) {}

  private peek(): Tok {
    return this.toks[this.i];
  }
  private next(): Tok {
    return this.toks[this.i++];
  }
  private isOp(v: string) {
    const p = this.peek();
    return p.t === "op" && p.v === v;
  }

  parse(): number {
    const v = this.sum();
    if (this.peek().t !== "end") throw new Error("unexpected token");
    return v;
  }

  private sum(): number {
    let v = this.product();
    for (;;) {
      if (this.isOp("+")) {
        this.next();
        v += this.product();
      } else if (this.isOp("−")) {
        this.next();
        v -= this.product();
      } else return v;
    }
  }

  private startsAtom(t: Tok): boolean {
    return t.t === "num" || t.t === "x" || t.t === "pi" || t.t === "e" || t.t === "(" || t.t === "√" || t.t === "fn";
  }

  private product(): number {
    let v = this.unary();
    for (;;) {
      const p = this.peek();
      if (p.t === "op" && (p.v === "×" || p.v === "·" || p.v === "*")) {
        this.next();
        v *= this.unary();
      } else if (p.t === "op" && (p.v === "÷" || p.v === "/")) {
        this.next();
        v /= this.unary();
      } else if (this.startsAtom(p)) {
        v *= this.power();
      } else return v;
    }
  }

  private unary(): number {
    if (this.isOp("−")) {
      this.next();
      return -this.unary();
    }
    if (this.isOp("+")) {
      this.next();
      return this.unary();
    }
    return this.power();
  }

  private power(): number {
    const base = this.postfix();
    if (this.isOp("^")) {
      this.next();
      return base ** this.unary();
    }
    return base;
  }

  private postfix(): number {
    let v = this.atom();
    for (;;) {
      const p = this.peek();
      if (p.t === "sup") {
        this.next();
        v = v ** (p.v === "x" ? this.x : p.v);
      } else if (p.t === "°") {
        this.next();
        v = (v * Math.PI) / 180;
      } else if (p.t === "%") {
        this.next();
        v = v / 100;
      } else return v;
    }
  }

  private atom(): number {
    const t = this.next();
    switch (t.t) {
      case "num":
        return t.v;
      case "x":
        return this.x;
      case "pi":
        return Math.PI;
      case "e":
        return Math.E;
      case "(": {
        const v = this.sum();
        if (this.next().t !== ")") throw new Error("missing )");
        return v;
      }
      case "|": {
        const v = this.sum();
        if (this.next().t !== "|") throw new Error("missing |");
        return Math.abs(v);
      }
      case "√":
        return Math.sqrt(this.postfix());
      case "fn": {
        if (t.v === "log") {
          let base = 10;
          const p = this.peek();
          if (p.t === "sub") {
            this.next();
            base = p.v;
          }
          return Math.log(this.postfix()) / Math.log(base);
        }
        const arg = this.postfix();
        if (t.v === "ln") return Math.log(arg);
        if (t.v === "sin") return Math.sin(arg);
        if (t.v === "cos") return Math.cos(arg);
        return Math.tan(arg);
      }
      default:
        throw new Error(`unexpected ${t.t}`);
    }
  }
}

/** Value of an expression label, with the variable x set to `x`. */
export function evaluate(expr: string, x = 0): number {
  return new Parser(tokenize(expr), x).parse();
}

/** Rounds away floating-point noise and prints a value the way a kid would write it. */
export function fmt(v: number): string {
  const r = Math.round(v * 1e4) / 1e4;
  const s = Math.abs(r - v) < 1e-9 * Math.max(1, Math.abs(v)) ? String(Object.is(r, -0) ? 0 : r) : `${v.toFixed(3)}…`;
  return s.replace("-", "−");
}

export function near(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

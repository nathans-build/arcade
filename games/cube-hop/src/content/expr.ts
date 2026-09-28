/*
 * A small parser for math labels and built equations, so every math answer in Cube Hop is
 * computed, never trusted from a hand-made list.
 *
 * Syntax (the same marks the bitmap font draws):
 *   numbers 12, 0.5      operators + − - × · ÷ /      powers 3², 2⁻², 4^(3/2), 2^x
 *   √a √(a+b)  π  |a|  25%  x      log₂8, log 100      sin 30°, cos 60°, tan 45°
 *   implicit products 2x, 2(x+1), (x+2)(x+3), 3√2, 2π      relations lhs = rhs
 * Two plain numbers side by side ("3 4") are never multiplied, so a scrambled equation
 * can't sneak through as a product.
 */

type Fn = (x: number) => number;

const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
const SUB: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };

class Parser {
  i = 0;
  absDepth = 0;
  constructor(private s: string) {}

  peek(): string {
    return this.s[this.i] ?? "";
  }
  skipWs() {
    while (this.peek() === " ") this.i++;
  }
  eat(tok: string): boolean {
    this.skipWs();
    if (this.s.startsWith(tok, this.i)) {
      this.i += tok.length;
      return true;
    }
    return false;
  }
  expect(tok: string) {
    if (!this.eat(tok)) throw new Error(`expected "${tok}" at ${this.i} in "${this.s}"`);
  }
  done(): boolean {
    this.skipWs();
    return this.i >= this.s.length;
  }

  expr(): Fn {
    let left = this.term();
    for (;;) {
      if (this.eat("+")) {
        const a = left, b = this.term();
        left = (x) => a(x) + b(x);
      } else if (this.eat("−") || this.eat("-")) {
        const a = left, b = this.term();
        left = (x) => a(x) - b(x);
      } else return left;
    }
  }

  /** Could an implicit product start here? Not before a plain digit. */
  startsImplicit(): boolean {
    this.skipWs();
    const c = this.peek();
    if (!c) return false;
    if (c === "|") return this.absDepth === 0;
    return /[x(√π]/.test(c) || ["sin", "cos", "tan", "log"].some((f) => this.s.startsWith(f, this.i));
  }

  term(): Fn {
    let left = this.unary();
    for (;;) {
      if (this.eat("×") || this.eat("·") || this.eat("*")) {
        const a = left, b = this.unary();
        left = (x) => a(x) * b(x);
      } else if (this.eat("÷") || this.eat("/")) {
        const a = left, b = this.unary();
        left = (x) => a(x) / b(x);
      } else if (this.startsImplicit()) {
        const a = left, b = this.power();
        left = (x) => a(x) * b(x);
      } else return left;
    }
  }

  unary(): Fn {
    if (this.eat("−") || this.eat("-")) {
      const a = this.unary();
      return (x) => -a(x);
    }
    return this.power();
  }

  power(): Fn {
    const base = this.postfix();
    // Superscript exponent, e.g. ², ⁻², ¹⁰
    let sup = "";
    while (this.peek() in SUP) sup += SUP[this.s[this.i++]];
    if (sup) {
      const e = Number(sup);
      if (!Number.isFinite(e)) throw new Error(`bad exponent in "${this.s}"`);
      return (x) => Math.pow(base(x), e);
    }
    if (this.s[this.i] === "^") {
      this.i++;
      const ex = this.unary();
      return (x) => Math.pow(base(x), ex(x));
    }
    return base;
  }

  postfix(): Fn {
    const a = this.atom();
    if (this.s[this.i] === "%") {
      this.i++;
      return (x) => a(x) / 100;
    }
    return a;
  }

  number(): Fn {
    const m = /^[0-9]*\.?[0-9]+/.exec(this.s.slice(this.i));
    if (!m) throw new Error(`number expected at ${this.i} in "${this.s}"`);
    this.i += m[0].length;
    let v = Number(m[0]);
    if (this.s[this.i] === "°") {
      this.i++;
      v = (v * Math.PI) / 180;
    }
    return () => v;
  }

  atom(): Fn {
    this.skipWs();
    const c = this.peek();
    if (/[0-9.]/.test(c)) return this.number();
    if (this.eat("(")) {
      const e = this.expr();
      this.expect(")");
      return e;
    }
    if (c === "|" && this.absDepth === 0) {
      this.i++;
      this.absDepth++;
      const e = this.expr();
      this.absDepth--;
      this.expect("|");
      return (x) => Math.abs(e(x));
    }
    if (this.eat("√")) {
      const a = this.postfix();
      return (x) => Math.sqrt(a(x));
    }
    if (this.eat("π")) return () => Math.PI;
    for (const [name, f] of [["sin", Math.sin], ["cos", Math.cos], ["tan", Math.tan]] as const) {
      if (this.eat(name)) {
        const a = this.power();
        return (x) => {
          const v = f(a(x));
          return Math.abs(v) < 1e-12 ? 0 : v;
        };
      }
    }
    if (this.eat("log")) {
      let base = "";
      while (this.peek() in SUB) base += SUB[this.s[this.i++]];
      const b = base ? Number(base) : 10;
      const a = this.power();
      return (x) => Math.log(a(x)) / Math.log(b);
    }
    if (this.eat("x")) return (x) => x;
    throw new Error(`unexpected "${c}" at ${this.i} in "${this.s}"`);
  }
}

/** Parses an expression (no "="). Throws on bad syntax. */
export function parseExpr(s: string): Fn {
  const p = new Parser(s);
  const f = p.expr();
  if (!p.done()) throw new Error(`trailing text in "${s}"`);
  return f;
}

/** Value of a constant label like "3/6", "2⁴", "√49", "sin 30°". NaN if it doesn't parse. */
export function valueOf(label: string): number {
  try {
    return parseExpr(label)(NaN);
  } catch {
    return NaN;
  }
}

export const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** How a built equation is judged. */
export type Check =
  | { kind: "num" }
  | { kind: "solve"; x: number }
  | { kind: "identity" };

const ID_XS = [-2.3, 0.7, 1.9, 3.1, 5.4];

/** Is `text` (e.g. "12 = 3 × 4") a single true equation under `check`? */
export function isTrueEquation(text: string, check: Check): boolean {
  const parts = text.split("=");
  if (parts.length !== 2) return false;
  let l: Fn, r: Fn;
  try {
    l = parseExpr(parts[0]);
    r = parseExpr(parts[1]);
  } catch {
    return false;
  }
  const hasX = /x/.test(text);
  const xs = check.kind === "num" ? [NaN] : check.kind === "solve" ? [check.x] : ID_XS;
  if (check.kind === "num" && hasX) return false;
  if (check.kind !== "num" && !hasX) return false;
  return xs.every((x) => {
    const a = l(x), b = r(x);
    return Number.isFinite(a) && Number.isFinite(b) && near(a, b);
  });
}

/** Every order of `tokens` (joined with spaces) that makes a true equation. */
export function trueOrders(tokens: string[], check: Check): string[][] {
  const out: string[][] = [];
  const seen = new Set<string>();
  const used = tokens.map(() => false);
  const cur: string[] = [];
  const rec = () => {
    if (cur.length === tokens.length) {
      const t = cur.join(" ");
      if (!seen.has(t) && isTrueEquation(t, check)) {
        seen.add(t);
        out.push([...cur]);
      }
      return;
    }
    for (let i = 0; i < tokens.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(tokens[i]);
      rec();
      cur.pop();
      used[i] = false;
    }
  };
  rec();
  return out;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

/** Formats a number the way the labels write it: − for negatives, up to 3 decimals. */
export function fmt(v: number): string {
  const r = Math.round(v * 1000) / 1000;
  const s = String(Math.abs(r));
  return r < 0 ? `−${s}` : s;
}

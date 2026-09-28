/*
 * A tiny parser for the math labels on house signs, so math rules are checked by
 * computing each label rather than trusting a hand-made list.
 *
 * Label syntax (same markup the bitmap font draws):
 *   numbers 12, 0.5, 3/4   operators + − - × · ÷ /   powers a{b}   |abs|   √a   π   e
 *   variables x, y         functions sin cos tan (degrees with °, else radians), ln, log, log[b]
 *   implicit products 2x, 2(x+1), 3|x|, 2π     relations lhs=rhs
 */

type Env = { x: number; y: number };
type Fn = (v: Env) => number;

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
  eat(ch: string): boolean {
    this.skipWs();
    if (this.s.startsWith(ch, this.i)) {
      this.i += ch.length;
      return true;
    }
    return false;
  }
  expect(ch: string) {
    if (!this.eat(ch)) throw new Error(`expected "${ch}" at ${this.i} in "${this.s}"`);
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
        left = (v) => a(v) + b(v);
      } else if (this.eat("−") || this.eat("-")) {
        const a = left, b = this.term();
        left = (v) => a(v) - b(v);
      } else return left;
    }
  }

  /** Could an implicit product start here (2x, 2(x+1), 3|x|, 2π, 2√3)? */
  startsAtom(): boolean {
    this.skipWs();
    const c = this.peek();
    if (!c) return false;
    if (c === "|") return this.absDepth === 0;
    return /[0-9.xyπe(√]/.test(c) || this.s.startsWith("sin", this.i) || this.s.startsWith("cos", this.i) ||
      this.s.startsWith("tan", this.i) || this.s.startsWith("log", this.i) || this.s.startsWith("ln", this.i);
  }

  term(): Fn {
    let left = this.unary();
    for (;;) {
      if (this.eat("×") || this.eat("·") || this.eat("*")) {
        const a = left, b = this.unary();
        left = (v) => a(v) * b(v);
      } else if (this.eat("÷") || this.eat("/")) {
        const a = left, b = this.unary();
        left = (v) => a(v) / b(v);
      } else if (this.startsAtom()) {
        const a = left, b = this.power();
        left = (v) => a(v) * b(v);
      } else return left;
    }
  }

  unary(): Fn {
    if (this.eat("−") || this.eat("-")) {
      const a = this.unary();
      return (v) => -a(v);
    }
    if (this.eat("+")) return this.unary();
    return this.power();
  }

  power(): Fn {
    const base = this.atom();
    this.skipWs();
    if (this.eat("{")) {
      const ex = this.expr();
      this.expect("}");
      return (v) => Math.pow(base(v), ex(v));
    }
    return base;
  }

  number(): Fn {
    const m = /^[0-9]*\.?[0-9]+/.exec(this.s.slice(this.i));
    if (!m) throw new Error(`number expected at ${this.i} in "${this.s}"`);
    this.i += m[0].length;
    let val = Number(m[0]);
    if (this.eat("°")) val = (val * Math.PI) / 180;
    return () => val;
  }

  /** Argument of sin/cos/log: a parenthesised expression, or a signed power term. */
  fnArg(): Fn {
    this.skipWs();
    if (this.eat("−") || this.eat("-")) {
      const a = this.fnArg();
      return (v) => -a(v);
    }
    return this.power();
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
    if (c === "|") {
      this.i++;
      this.absDepth++;
      const e = this.expr();
      this.absDepth--;
      this.expect("|");
      return (v) => Math.abs(e(v));
    }
    if (this.eat("√")) {
      const a = this.power();
      return (v) => Math.sqrt(a(v));
    }
    if (this.eat("π")) return () => Math.PI;
    for (const [name, f] of [["sin", Math.sin], ["cos", Math.cos], ["tan", Math.tan]] as const) {
      if (this.eat(name)) {
        const a = this.fnArg();
        return (v) => f(a(v));
      }
    }
    if (this.eat("ln")) {
      const a = this.fnArg();
      return (v) => Math.log(a(v));
    }
    if (this.eat("log")) {
      let base: Fn = () => 10;
      if (this.eat("[")) {
        base = this.expr();
        this.expect("]");
      }
      const a = this.fnArg();
      return (v) => Math.log(a(v)) / Math.log(base(v));
    }
    if (this.eat("x")) return (v) => v.x;
    if (this.eat("y")) return (v) => v.y;
    if (this.eat("e")) return () => Math.E;
    throw new Error(`unexpected "${c}" at ${this.i} in "${this.s}"`);
  }
}

/** Parses a label with no "=". */
export function parseExpr(label: string): Fn {
  const p = new Parser(label);
  const f = p.expr();
  if (!p.done()) throw new Error(`trailing text in "${label}"`);
  return f;
}

/** The numeric value of a constant label like "3/6", "2{3}", "sin 150°", "−3×4". */
export function valueOf(label: string): number {
  return parseExpr(label)({ x: NaN, y: NaN });
}

/** Parses "lhs=rhs" into lhs − rhs. */
export function parseRelation(label: string): Fn {
  const k = label.indexOf("=");
  if (k < 0) throw new Error(`no "=" in "${label}"`);
  const l = parseExpr(label.slice(0, k));
  const r = parseExpr(label.slice(k + 1));
  return (v) => l(v) - r(v);
}

export const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

/** For "y=…" labels: the right-hand side as a function of x. */
export function asFunction(label: string): (x: number) => number {
  const m = /^\s*y\s*=(.*)$/.exec(label);
  if (!m) throw new Error(`"${label}" is not y=…`);
  const f = parseExpr(m[1]);
  return (x) => f({ x, y: NaN });
}

/**
 * Is the relation a function of x? Looks for any x (−6..6 by halves) that has two or
 * more y values (−12..12 by quarters) on the graph.
 */
export function relationIsFunction(label: string): boolean {
  const f = parseRelation(label);
  for (let xi = -12; xi <= 12; xi++) {
    const x = xi / 2;
    let hits = 0;
    for (let yi = -48; yi <= 48; yi++) {
      const r = f({ x, y: yi / 4 });
      if (Number.isFinite(r) && Math.abs(r) < 1e-9) hits++;
      if (hits > 1) return false;
    }
  }
  return true;
}

export function isPrime(v: number): boolean {
  if (!Number.isInteger(v) || v < 2) return false;
  for (let i = 2; i * i <= v; i++) if (v % i === 0) return false;
  return true;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

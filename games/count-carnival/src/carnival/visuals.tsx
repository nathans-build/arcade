/* What each booth draws for an item, and how each answer button looks. */
import type { ReactNode } from "react";
import {
  BALLOON_COLORS, Balloon, Blocks, Clock, Coin, Duck, FracArt, Popcorn, ShapeArt, Sock, Star, Tally, TicketRoll,
} from "./art";
import { COIN_CENTS, type ChoiceArt, type Counter, type Sprite, type Visual } from "./items";

/** Puts a counting label over an object once the hint has reached it. */
function Lit({ on, label, children, className = "" }: { on: boolean; label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`cc-obj ${on ? "lit" : ""}`}>
      {children}
      {on && <b className={`cc-badge ${className}`}>{label}</b>}
    </span>
  );
}

function SpriteArt({ sprite, i, w }: { sprite: Sprite; i: number; w: number }) {
  if (sprite === "balloon") return <Balloon color={BALLOON_COLORS[i % BALLOON_COLORS.length]} w={w} />;
  if (sprite === "duck") return <Duck w={w * 1.2} />;
  if (sprite === "star") return <Star w={w} />;
  return <Popcorn w={w} />;
}

/** n objects in rows of five (like a ten frame), so they are easy to count. */
function Objects({ sprite, n, lit, steps, w = 34 }: { sprite: Sprite; n: number; lit: number; steps: string[]; w?: number }) {
  const fives = [];
  for (let g = 0; g * 5 < n; g++) {
    fives.push(
      <span className="cc-five" key={g}>
        {Array.from({ length: Math.min(5, n - g * 5) }, (_, j) => {
          const i = g * 5 + j;
          return (
            <Lit key={i} on={i < lit} label={steps[i] ?? String(i + 1)}>
              <SpriteArt sprite={sprite} i={i} w={w} />
            </Lit>
          );
        })}
      </span>,
    );
  }
  return <div className="cc-objects">{fives}</div>;
}

/** A bunch of 10 balloons tied together (one "ten"). */
function Bunch({ w = 30 }: { w?: number }) {
  return (
    <svg viewBox="0 0 20 46" width={w} height={(w * 46) / 20} aria-hidden>
      {Array.from({ length: 10 }, (_, i) => {
        const x = 5.5 + (i % 2) * 9;
        const y = 4 + Math.floor(i / 2) * 6.4;
        return <line key={`s${i}`} x1={x} y1={y} x2="10" y2="42" stroke="#7a6a5a" strokeWidth="0.5" />;
      })}
      {Array.from({ length: 10 }, (_, i) => {
        const x = 5.5 + (i % 2) * 9;
        const y = 4 + Math.floor(i / 2) * 6.4;
        return <ellipse key={i} cx={x} cy={y} rx="4.3" ry="3.3" fill={BALLOON_COLORS[i % 6]} stroke="#2b1810" strokeWidth="0.7" />;
      })}
      <rect x="7.5" y="40" width="5" height="5" fill="#ffd23f" stroke="#2b1810" strokeWidth="0.6" />
    </svg>
  );
}

function Group({ step }: { step: number }) {
  if (step === 2)
    return (
      <span className="cc-group">
        <Sock w={22} />
        <Sock w={22} />
      </span>
    );
  if (step === 5)
    return (
      <span className="cc-group cc-bag">
        {Array.from({ length: 5 }, (_, i) => <Balloon key={i} color={BALLOON_COLORS[i]} w={14} />)}
      </span>
    );
  if (step === 10) return <span className="cc-group"><Bunch w={30} /></span>;
  return <span className="cc-group"><TicketRoll w={40} /></span>;
}

function Counters({ list, lit, showGhost }: { list: Counter[]; lit: number; showGhost: boolean }) {
  const size = list.length <= 5 ? 5 : list.length <= 10 ? 10 : 20;
  const cells = Array.from({ length: size }, (_, i) => list[i] ?? null);
  const rows: (Counter | null)[][] = [];
  for (let i = 0; i < size; i += 5) rows.push(cells.slice(i, i + 5));
  return (
    <div className={`cc-frame cc-frame-${size}`}>
      {rows.map((r, ri) => (
        <div key={ri} className="cc-frame-row">
          {r.map((c, ci) => {
            const i = ri * 5 + ci;
            const show = c && (c !== "ghost" || showGhost);
            return (
              <span key={ci} className={`cc-cell ${i < lit && show ? "lit" : ""}`}>
                {show && <i className={`cc-counter ${c}`} />}
                {i < lit && show && <b className="cc-badge sm">{i + 1}</b>}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Tally on the tightrope, holding a balancing pole with a basket at each end. */
function Tightrope({ left, right, mood }: { left: string; right: string; mood: "idle" | "wobble" | "balanced" }) {
  return (
    <div className={`cc-rope ${mood}`}>
      <svg viewBox="0 0 300 70" className="cc-rope-line" aria-hidden preserveAspectRatio="none">
        <rect x="4" y="10" width="8" height="60" fill="#7a5230" />
        <rect x="288" y="10" width="8" height="60" fill="#7a5230" />
        <polygon points="8,0 14,10 2,10" fill="#e3262f" />
        <polygon points="292,0 298,10 286,10" fill="#2f6fe0" />
        <path d="M8 14 Q150 26 292 14" stroke="#2b1810" strokeWidth="3" fill="none" />
      </svg>
      <div className="cc-walker">
        <div className="cc-pole">
          <span className="cc-basket l">{left}</span>
          <span className="cc-basket r">{right}</span>
        </div>
        <Tally w={64} />
      </div>
    </div>
  );
}

export function Scene({ v, lit, steps, solved, wrongTries, answerLabel }: {
  v: Visual; lit: number; steps: string[]; solved: boolean; wrongTries: number; answerLabel: string;
}) {
  switch (v.kind) {
    case "objects":
      return <Objects sprite={v.sprite} n={v.n} lit={lit} steps={steps} w={v.n > 10 ? 28 : 36} />;
    case "tens":
      return (
        <div className="cc-objects cc-tens">
          <span className="cc-five">
            {Array.from({ length: v.tens }, (_, i) => (
              <Lit key={i} on={i < lit} label={steps[i]}>
                <Bunch w={v.tens > 9 ? 26 : 32} />
              </Lit>
            ))}
          </span>
          {v.ones > 0 && (
            <span className="cc-five cc-ones">
              {Array.from({ length: v.ones }, (_, j) => (
                <Lit key={j} on={v.tens + j < lit} label={steps[v.tens + j]}>
                  <Balloon color={BALLOON_COLORS[j % 6]} w={20} />
                </Lit>
              ))}
            </span>
          )}
        </div>
      );
    case "skip":
      return (
        <div className="cc-skip">
          <div className="cc-objects">
            <span className="cc-five">
              {Array.from({ length: v.groups }, (_, i) => (
                <Lit key={i} on={i < lit} label={steps[i]}>
                  <Group step={v.step} />
                </Lit>
              ))}
            </span>
          </div>
          <div className="cc-seq">
            {v.seq.map((t, i) => (
              <span key={i} className={`cc-card ${t === null ? "blank" : ""} ${t === null && solved ? "solved" : ""}`}>
                {t === null ? (solved ? answerLabel : "?") : t}
              </span>
            ))}
          </div>
        </div>
      );
    case "rope": {
      const mood = solved ? "balanced" : wrongTries > 0 ? "wobble" : "idle";
      const unknownShown = solved ? answerLabel : "?";
      const left = String(v.a);
      const right = v.unknown === "b" ? unknownShown : String(v.b);
      return (
        <div className="cc-ropebox">
          <Tightrope left={left} right={`${v.op}${right}`} mood={mood} />
          <div className="cc-eq">
            {v.a} {v.op} {v.unknown === "b" ? <span className="cc-q">{unknownShown}</span> : v.b} = {v.unknown === "c" ? <span className="cc-q">{unknownShown}</span> : v.c}
          </div>
          {v.counters && <Counters list={v.counters} lit={lit} showGhost={wrongTries > 0 || solved} />}
        </div>
      );
    }
    case "ducks":
      return (
        <div className="cc-pond big">
          <Objects sprite="duck" n={v.n} lit={lit} steps={steps} w={30} />
        </div>
      );
    case "numcmp":
      return (
        <div className="cc-signduck">
          <Duck w={70} />
          <span className="cc-sign">{v.n}</span>
          <span className="cc-dots">{Array.from({ length: v.n }, (_, i) => <i key={i} className={i < lit ? "lit" : ""} />)}</span>
        </div>
      );
    case "compare":
      return (
        <div className="cc-compare">
          {[v.a, v.b].map((n, i) => (
            <div key={i} className="cc-cmp-side">
              <div className="cc-signduck sm">
                <Duck w={44} flip={i === 1} />
                <span className="cc-sign">{n}</span>
              </div>
              {n < 100 ? (
                <Blocks n={n} />
              ) : (
                <span className="cc-place">
                  <span className="h">{Math.floor(n / 100)}<small>hund</small></span>
                  <span className="t">{Math.floor(n / 10) % 10}<small>tens</small></span>
                  <span className="o">{n % 10}<small>ones</small></span>
                </span>
              )}
            </div>
          ))}
        </div>
      );
    case "pick-shape":
    case "pick-frac":
      return (
        <div className="cc-host">
          <Tally w={90} className="cc-bob" />
        </div>
      );
    case "clock":
      return (
        <div className="cc-clockbox">
          <Clock h={v.h} m={v.m} lit={Math.min(lit, 12)} />
        </div>
      );
    case "coins": {
      // The coins carry no printed value; the hint names each one ("quarter 25¢") and counts on.
      const shown = Math.min(lit, v.coins.length);
      return (
        <div className="cc-coinbox">
          <div className="cc-objects cc-coins">
            <span className="cc-five">
              {v.coins.map((c, i) => (
                <Lit key={i} on={i < lit} label={<><span className="nm">{c}</span><span>{COIN_CENTS[c]}¢</span></>} className="cc-coinlbl">
                  <Coin name={c} />
                </Lit>
              ))}
            </span>
          </div>
          {shown > 0 && (
            <p className="cc-counton" aria-live="polite">
              {steps.slice(0, shown).map((s, i) => (i ? ` → ${s}` : s)).join("")}¢
            </p>
          )}
        </div>
      );
    }
  }
}

export function ChoiceFace({ art, label }: { art: ChoiceArt; label: string }) {
  switch (art.kind) {
    case "num":
      return (
        <span className="cc-face num">
          <b className={label.length > 3 ? "long" : ""}>{label}</b>
          {art.dots && art.n > 0 && (
            <span className="cc-dots sm">{Array.from({ length: art.n }, (_, i) => <i key={i} />)}</span>
          )}
        </span>
      );
    case "text":
      return <span className={`cc-face text ${label.length > 7 ? "long" : ""}`}>{label}</span>;
    case "ducks":
      return (
        <span className="cc-face ducks">
          {Array.from({ length: art.n }, (_, i) => <Duck key={i} w={22} />)}
        </span>
      );
    case "shape":
      return (
        <span className="cc-face pic">
          <ShapeArt shape={art.shape} rot={art.rot} size={art.size} color={art.color} />
        </span>
      );
    case "frac":
      return (
        <span className="cc-face pic">
          <FracArt form={art.form} parts={art.parts} equal={art.equal} shaded={art.shaded} />
        </span>
      );
  }
}

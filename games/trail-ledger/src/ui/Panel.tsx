/*
 * The Ledger panel next to the canvas: everything the player reads and taps. One component per
 * phase. Every choice is a button (tap or click) and also has a key (1–4 / A–D).
 */
import { useEffect, useRef } from "react";
import { GRADES, arcadeLink, gradeLabel, speak, speechSupported, type Grade } from "@/kit";
import { BANK, COMING_LATER, EXPEDITIONS } from "@/data/expeditions";
import { BAND_LABEL, CODE_NAMES, playable } from "@/data/standards";
import type { ExpeditionId } from "@/data/types";
import type { Game } from "@/game/game";
import { dailyFood, dateOf, dollars, forecast } from "@/sim/sim";

interface Props {
  game: Game;
  grade: Grade;
  fromArcade: boolean;
  highScore: number;
  readAloud: boolean;
  onGrade: (g: Grade) => void;
  onStart: (id: ExpeditionId) => void;
  onPause: () => void;
  onBump: () => void;
}

const LETTERS = "ABCD";

export function Panel(p: Props) {
  const { game, grade } = p;
  if (!playable(grade)) return <TooYoung {...p} />;
  switch (game.phase) {
    case "select":
      return <Select {...p} />;
    case "intro":
      return <Intro {...p} />;
    case "outfit":
      return <Outfit {...p} />;
    case "question":
      return <QuestionView {...p} />;
    case "landmark":
      return <LandmarkView {...p} />;
    case "travel":
      return <Ledger {...p} />;
    case "event":
      return <EventView {...p} />;
    case "outcome":
      return (
        <Card title={game.shown?.card.title ?? "WHAT HAPPENED"} tone="info">
          <p className="tl-big">{game.outcome}</p>
          <Continue onClick={() => game.continueOutcome()} label="Back on the road ▶" />
        </Card>
      );
    case "notice":
      return (
        <Card title={game.notice!.title} tone={game.notice!.tone}>
          <p className="tl-big">{game.notice!.text}</p>
          <Continue onClick={() => game.continueNotice()} label="Continue ▶" />
        </Card>
      );
    case "fork":
      return <Fork {...p} />;
    case "wintered":
      return (
        <Card title={game.exp!.lateLabel} tone="warn">
          <p className="tl-big">{game.exp!.lateText}</p>
          <p className="dim">Only the calendar can stop an expedition. Your answers and Ledger are kept. You will restart this leg on {dateOf(game.exp!, game.retryPoint()?.sim.day ?? 0).label} with the supplies you had then. Try a faster pace or fewer stops.</p>
          <Continue onClick={() => game.retry()} label="Retry from the checkpoint ▶" />
        </Card>
      );
    case "arrived":
      return (
        <Card title={`ARRIVED: ${game.exp!.landmarks[game.at].name.toUpperCase()}`} tone="good">
          <p className="tl-big">{game.exp!.guide.outro}</p>
          <p className="dim">{game.dateLabel()} · {game.sim.mile.toLocaleString("en-US")} miles · {game.sim.day} days</p>
          <Continue onClick={() => game.showReport()} label="Open the Ledger report ▶" />
        </Card>
      );
    case "report":
      return <Report {...p} />;
  }
}

/* ------------------------------------------------------------------ pieces */

function Card({ title, tone, children }: { title: string; tone?: "info" | "warn" | "good"; children: React.ReactNode }) {
  return (
    <div className={`tl-card ${tone ?? ""}`}>
      <div className="tl-h tl-pixel">{title}</div>
      {children}
    </div>
  );
}

function Continue({ onClick, label }: { onClick: () => void; label: string }) {
  // Focus the button (so Enter works) without scrolling the reading out of view.
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="tl-actions">
      <button className="tl-cta" ref={ref} onClick={onClick}>{label}</button>
      <span className="tl-keyhint tl-pixel">ENTER</span>
    </div>
  );
}

function Speaker({ text }: { text: string }) {
  if (!speechSupported()) return null;
  return (
    <button className="tl-speak" onClick={() => speak(text)} aria-label="Read aloud" title="Read aloud (R)">
      <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
        <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
        <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
      </svg>
    </button>
  );
}

function GradePicker({ grade, onGrade }: { grade: Grade; onGrade: (g: Grade) => void }) {
  return (
    <div className="tl-grades" role="radiogroup" aria-label="Grade">
      {GRADES.map((g) => (
        <button key={g} role="radio" aria-checked={g === grade} className={`tl-grade tl-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
          {g}
        </button>
      ))}
    </div>
  );
}

function GradeLine({ grade, fromArcade, onGrade }: { grade: Grade; fromArcade: boolean; onGrade: (g: Grade) => void }) {
  return fromArcade ? (
    <p className="tl-badge tl-pixel">
      {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
    </p>
  ) : (
    <GradePicker grade={grade} onGrade={onGrade} />
  );
}

/* ------------------------------------------------------------------ K–4 gate */

function TooYoung({ grade, fromArcade, onGrade }: Props) {
  return (
    <div className="tl-young">
      <h1 className="tl-pixel tl-logo">TRAIL LEDGER</h1>
      <p className="tl-credit tl-pixel">created by SpiderBen10 (NZDO)</p>
      <p className="tl-big">
        <b className="y">Trail Ledger is for grades 5 and up.</b> Our museum guide is saving these journeys for you!
        Until then, the arcade has lots of games for {gradeLabel(grade)}.
      </p>
      <p>
        <a className="tl-cta" href={arcadeLink(grade)}>◀ ARCADE</a>
      </p>
      <GradeLine grade={grade} fromArcade={fromArcade} onGrade={onGrade} />
    </div>
  );
}

/* ------------------------------------------------------------------ select */

function Select({ game, grade, fromArcade, onGrade, onStart, highScore }: Props) {
  const n = Number(grade);
  return (
    <div className="tl-card select">
      <h1 className="tl-pixel tl-logo">TRAIL LEDGER</h1>
      <p className="tl-credit tl-pixel">created by SpiderBen10 (NZDO) · a US history journey</p>
      <GradeLine grade={grade} fromArcade={fromArcade} onGrade={onGrade} />
      <p className="dim small">{BAND_LABEL[game.band]} · pack, travel, decide, read the sources, and keep the Ledger.</p>
      <div className="tl-exps">
        {EXPEDITIONS.map((e, i) => {
          const yours = n >= e.recommended[0] && n <= e.recommended[1];
          return (
            <button key={e.id} className="tl-exp" onClick={() => onStart(e.id)}>
              <span className="key tl-pixel">{i + 1}</span>
              <span className="body">
                <b className="tl-pixel">{e.title.toUpperCase()} · {e.year}</b>
                {yours && <span className="flag tl-pixel">YOUR LEVEL</span>}
                <small>{e.route}</small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="tl-label tl-pixel">COMING LATER</div>
      <div className="tl-locked">
        {COMING_LATER.map((c) => (
          <div key={c.title} className="tl-lock" aria-disabled="true">
            <span className="tl-pixel">LOCKED · {c.title.toUpperCase()}{c.year ? ` · ${c.year}` : ""}</span>
            <small>{c.note}</small>
          </div>
        ))}
      </div>
      <p className="dim small">HI-SCORE {String(highScore).padStart(6, "0")} · keys <kbd>1</kbd>–<kbd>3</kbd> pick · <kbd>M</kbd> mute · or just tap</p>
    </div>
  );
}

/* ------------------------------------------------------------------ intro */

function Intro({ game }: Props) {
  const e = game.exp!;
  return (
    <Card title={`${e.title.toUpperCase()} · ${e.year}`}>
      <p className="tl-big">{e.guide.intro} <Speaker text={e.guide.intro} /></p>
      <ul className="tl-facts">
        <li><b>Route</b> {e.route}</li>
        <li><b>You</b> {e.role}</li>
        <li><b>Leave</b> {dateOf(e, 0).label} · <b>Party</b> {e.partyLabel}</li>
        <li><b>Calendar</b> arrive by {dateOf(e, e.deadline[game.band]).label} or the trip is <i>{e.lateLabel.toLowerCase()}</i></li>
      </ul>
      <p className="dim small">
        Keys: <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer and choose · <kbd>Enter</kbd> continue · on the road <kbd>G</kbd> pace,
        {" "}<kbd>F</kbd> rations, <kbd>W</kbd> stop to work, <kbd>T</kbd> fast · <kbd>P</kbd> pause · <kbd>R</kbd> read aloud. Or tap.
      </p>
      <Continue onClick={() => game.begin()} label="Go to the store ▶" />
    </Card>
  );
}

/* ------------------------------------------------------------------ outfit */

function Outfit({ game, onBump }: Props) {
  const e = game.exp!;
  const items = game.storeItems();
  const cost = game.basketCost();
  const budget = game.budget();
  const over = game.overweight();
  const sourced = items.some((i) => i.priceSource);
  return (
    <Card title={`OUTFIT AT ${e.landmarks[0].name.toUpperCase()}`}>
      <p className="dim small">Budget {dollars(budget)} ({e.units.money}). Prices are <b>game numbers</b>{sourced ? " unless marked" : ""}. The basket starts with a sensible plan; change it if you like.</p>
      <table className="tl-store">
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>
                <b>{it.name}</b>
                <small>{it.unit} · {dollars(it.price)}{game.band === 2 ? ` · ${it.weight} lb` : ""}</small>
              </td>
              <td className="qty">
                <button className="tl-small" aria-label={`Fewer ${it.name}`} disabled={!game.canBuy(it.id, -1)} onClick={() => { game.buy(it.id, -1); onBump(); }}>−</button>
                <span>{game.basket[it.id] ?? 0}</span>
                <button className="tl-small" aria-label={`More ${it.name}`} disabled={!game.canBuy(it.id, 1)} onClick={() => { game.buy(it.id, 1); onBump(); }}>+</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="tl-totals">
        <span>Total <b className="y">{dollars(cost)}</b></span>
        <span>Left <b className="c">{dollars(budget - cost)}</b></span>
        <span>Food ≈ <b className="c">{game.basketFoodDays()} days</b></span>
        {game.band === 2 && <span className={over ? "no" : ""}>Load <b>{game.basketWeight()} / {e.weightLimit} lb</b></span>}
      </div>
      {over && <p className="no">Too heavy! Your wagon can carry {e.weightLimit} lb. Take something out.</p>}
      <div className="tl-actions">
        <button className="tl-cta" disabled={over} onClick={() => game.finishOutfit()}>Pay and pack ▶</button>
        <span className="tl-keyhint tl-pixel">ENTER</span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ questions */

const PURPOSE_HEAD = {
  outfit: "STORE MATH",
  forecast: "TRAIL FORECAST",
  landmark: "AT THE LANDMARK",
  transmission: "TRANSMISSION",
} as const;

function QuestionView({ game, readAloud }: Props) {
  const a = game.asking!;
  const q = a.q;
  const right = a.done && a.picked === q.answer;
  const spoken = `${a.header ? a.header.text + " " : ""}${q.passage ? q.passage + " " : ""}${q.prompt} ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}.`).join(" ")}`;
  const subj = q.subject === "math" ? "MATH" : q.source === "kit" ? "SOCIAL STUDIES (ARCADE DECK)" : q.subject === "social" && q.standard.startsWith("EPF") ? "PERSONAL FINANCE" : "HISTORY";
  return (
    <div className={`tl-card q ${a.purpose}`}>
      <div className="tl-h tl-pixel">{a.header ? `${a.header.kind}` : PURPOSE_HEAD[a.purpose]}</div>
      {a.header && (
        <div className="tl-letter">
          <span className="from">{a.header.from}:</span> {a.header.text}
        </div>
      )}
      <div className="tl-tagrow">
        <span className={`tl-tag tl-pixel ${q.subject}`}>{subj}</span>
        <span className="tl-tag tl-pixel std">{q.standard}{q.preview ? " · PREVIEW" : ""} · {q.skill}</span>
        <Speaker text={spoken} />
        {readAloud && <span className="dim small">read aloud on</span>}
      </div>
      {q.passage && <div className="tl-passage">{q.passage}</div>}
      <div className="tl-prompt">{q.prompt}</div>
      <div className="tl-choices">
        {q.choices.map((c, i) => {
          const state = a.done ? (i === q.answer ? "right" : i === a.picked ? "wrong" : "") : a.struck.includes(i) ? "struck" : "";
          return (
            <button key={i} className={`tl-btn ${state}`} disabled={a.done || a.struck.includes(i)} onClick={() => game.answer(i)}>
              <span className="key tl-pixel">{LETTERS[i]}</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {a.hintShown && !a.done && (
        <div className="tl-hint">
          <b className="tl-pixel">HINT</b> {q.hint ?? "Look back at the reading and think about each choice."} Try again!
        </div>
      )}
      {a.done && (
        <div className="tl-feedback">
          <div className={`verdict tl-pixel ${right ? "ok" : "no"}`}>
            {right ? (a.correct ? "✔ CORRECT!" : "✔ YOU GOT IT ON THE SECOND TRY") : `✘ THE ANSWER IS ${LETTERS[q.answer]}`}
          </div>
          <div>{q.explanation}</div>
          {a.penalty && <div className="no small">{a.penalty}</div>}
          <Continue onClick={() => game.continueQuestion()} label="Continue ▶" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ landmark */

function LandmarkView({ game }: Props) {
  const e = game.exp!;
  const lm = e.landmarks[game.at];
  const p = lm.read[game.band];
  const spoken = `${lm.name}. ${p.text}${p.excerpt ? ` ${p.excerpt.quote}` : ""}`;
  return (
    <div className="tl-card landmark">
      <div className="tl-h tl-pixel">{lm.name.toUpperCase()} <span className="dim">· MILE {lm.mile.toLocaleString("en-US")}</span></div>
      <div className="tl-place">{lm.place} · {game.dateLabel()} <Speaker text={spoken} /></div>
      <div className="tl-read">
        <p>{p.text}</p>
        {p.excerpt && (
          <blockquote className={`tl-excerpt ${p.excerpt.status === "retold" ? "retold" : ""}`}>
            “{p.excerpt.quote}”
            <cite>
              {p.excerpt.cite} · <b className="tl-pixel">{p.excerpt.status === "retold" ? "RETOLD" : "PRIMARY SOURCE · PUBLIC DOMAIN"}</b>
            </cite>
          </blockquote>
        )}
        {p.gloss && p.gloss.length > 0 && (
          <dl className="tl-gloss">
            {p.gloss.map(([w, m]) => (
              <div key={w}>
                <dt>{w}</dt>
                <dd>{m}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="tl-source">Source: {lm.source}</p>
      </div>
      <Continue onClick={() => game.continueLandmark()} label="Questions ▶" />
    </div>
  );
}

/* ------------------------------------------------------------------ the Ledger (travel) */

function Ledger({ game, onBump }: Props) {
  const e = game.exp!;
  const s = game.sim;
  const f = forecast(s, e);
  const next = e.landmarks[s.leg + 1];
  const left = e.deadline[game.band] - s.day;
  const tight = f.days > left;
  return (
    <div className="tl-card ledger">
      <div className="tl-h tl-pixel">THE LEDGER · {game.dateLabel().toUpperCase()}</div>
      <div className="tl-forecast">
        <b>{next.name}</b> in {f.miles} mi ≈ <b>{f.days} {f.days === 1 ? "day" : "days"}</b> at {f.speed} mi/day; food lasts <b className={f.foodDays < f.days ? "no" : ""}>{f.foodDays} {f.foodDays === 1 ? "day" : "days"}</b>.
        <span className={tight ? "no" : "dim"}> {left} days left before {e.lateLabel.toLowerCase()}.</span>
      </div>
      <div className="tl-res">
        <Res label={`Food (${e.units.food})`} value={Math.floor(s.res.food).toLocaleString("en-US")} warn={s.res.food < dailyFood(s, e) * 4} />
        <Res label="Money" value={dollars(s.res.money)} />
        <Res label="Day" value={`${s.day}`} />
        {game.band >= 1 && <Res label={cap(e.units.parts)} value={`${s.res.parts}`} warn={s.res.parts === 0 && e.mode === "wagon"} />}
        {game.band >= 1 && <Res label="Morale" value={`${s.res.morale}`} warn={s.res.morale < 25} />}
        {game.band >= 2 && <Res label={cap(e.units.trade)} value={`${s.res.trade}`} />}
      </div>
      {e.paces.length > 1 ? (
        <Choice3 label="Pace (G)" opts={e.paces.map((x) => ({ label: x.label, note: x.note }))} value={s.pace} onPick={(i) => { game.setPace(i); onBump(); }} />
      ) : (
        <p className="dim small">Travel: {e.paces[0].label}. {e.paces[0].note}.</p>
      )}
      <Choice3 label="Rations (F)" opts={e.rations.map((x) => ({ label: x.label, note: `${x.perPerson} ${e.units.food}/person/day` }))} value={s.ration} onPick={(i) => { game.setRation(i); onBump(); }} />
      <div className="tl-actions spread">
        <button className="tl-small" onClick={() => game.workNow()}>Stop to work (W)</button>
        <button className={`tl-small ${game.fast ? "on" : ""}`} onClick={() => { game.fast = !game.fast; onBump(); }}>{game.fast ? "Fast ▶▶ (T)" : "Normal ▶ (T)"}</button>
      </div>
      <div className="tl-journal">
        {game.journal.slice(-4).map((j, i) => (
          <div key={i}><span className="d">{dateOf(e, j.day).short}</span> {j.text}</div>
        ))}
      </div>
    </div>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function Res({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`tl-resv ${warn ? "warn" : ""}`}>
      <span className="lbl tl-pixel">{label}</span>
      <span className="val">{value}</span>
    </div>
  );
}

function Choice3({ label, opts, value, onPick }: { label: string; opts: { label: string; note: string }[]; value: number; onPick: (i: number) => void }) {
  return (
    <div className="tl-opts">
      <span className="tl-label tl-pixel">{label}</span>
      <div className="row" role="radiogroup" aria-label={label}>
        {opts.map((o, i) => (
          <button key={o.label} role="radio" aria-checked={i === value} className={`tl-opt ${i === value ? "on" : ""}`} onClick={() => onPick(i)} title={o.note}>
            {o.label}
            <small>{o.note}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ events */

function EventView({ game }: Props) {
  const sh = game.shown!;
  const spoken = `${sh.card.title}. ${sh.card.text} ${sh.choices.map((x, k) => `${LETTERS[k]}: ${x.c.label}.`).join(" ")}`;
  return (
    <div className="tl-card event">
      <div className="tl-h tl-pixel">{sh.card.title.toUpperCase()} <Speaker text={spoken} /></div>
      <p className="tl-big">{sh.card.text}</p>
      <div className="tl-choices one">
        {sh.choices.map((x, k) => (
          <button key={x.i} className="tl-btn" disabled={!x.enabled} onClick={() => game.decide(k)}>
            <span className="key tl-pixel">{LETTERS[k]}</span>
            <span>
              {x.c.label}
              {!x.enabled && <small className="no"> (you don't have enough)</small>}
            </span>
          </button>
        ))}
      </div>
      <p className="tl-source">Source: {sh.card.source}</p>
    </div>
  );
}

function Fork({ game }: Props) {
  const e = game.exp!;
  const here = e.landmarks[game.at];
  const last = e.landmarks[e.landmarks.length - 1];
  return (
    <Card title={`STAY IN ${here.name.toUpperCase()}?`}>
      <p className="tl-big">You could settle here and start work, or ride on to {last.name}.</p>
      <div className="tl-choices one">
        <button className="tl-btn" onClick={() => game.fork(true)}>
          <span className="key tl-pixel">A</span>
          <span>Settle in {here.name} (the journey ends here)</span>
        </button>
        <button className="tl-btn" onClick={() => game.fork(false)}>
          <span className="key tl-pixel">B</span>
          <span>Go on to {last.name}</span>
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ report */

function Report({ game, highScore }: Props) {
  const e = game.exp!;
  const sum = game.summary();
  const rows = new Map<string, { std: string; skill: string; n: number; c: number; preview: boolean }>();
  for (const l of game.log) {
    const key = l.standard;
    const r = rows.get(key) ?? { std: l.standard, skill: CODE_NAMES[l.standard] ?? l.skill, n: 0, c: 0, preview: l.preview };
    r.n++;
    if (l.correct) r.c++;
    rows.set(key, r);
  }
  const list = [...rows.values()].sort((a, b) => a.c / a.n - b.c / b.n);
  const weak = list.filter((r) => r.c / r.n < 0.75).slice(0, 3);
  const total = game.log.length;
  const right = game.log.filter((l) => l.correct).length;
  const expFor = (std: string) => {
    if (/^(NC|EPF)/.test(std)) return "any expedition's store and forecast math";
    const others = EXPEDITIONS.filter((x) => x.id !== e.id && BANK.some((b) => b.exp === x.id && b.band === game.band && b.code === std));
    return others.length ? others.map((x) => x.title).join(" or ") : e.title;
  };
  return (
    <div className="tl-card report">
      <div className="tl-h tl-pixel">MISSION REPORT · {e.title.toUpperCase()} · {e.year}</div>
      <div className="tl-big">
        Score <b className="y">{game.score}</b>{game.score >= highScore && game.score > 0 ? " · NEW HIGH SCORE!" : ""} · {gradeLabel(game.grade)} · answers {right}/{total}
      </div>
      <div className="tl-label tl-pixel">LEDGER SUMMARY</div>
      <ul className="tl-facts">
        <li><b>Distance</b> {sum.miles.toLocaleString("en-US")} miles to {sum.end}</li>
        <li><b>Days</b> {sum.days} (the real journey took about {sum.historicalDays} {sum.historicalDays === 1 ? "day" : "days"}). <span className="dim">{e.historicalNote}</span></li>
        <li><b>Food</b> {sum.foodPerPersonDay} {e.units.food} per person per day</li>
        <li><b>Money</b> spent {dollars(sum.spent)}, earned {dollars(sum.earned)}, {dollars(sum.money)} left</li>
        <li><b>Stops</b> {sum.workStops} to work, {game.sim.stats.tradeStops} to trade for food{sum.retries ? `, ${sum.retries} retried leg${sum.retries > 1 ? "s" : ""}` : ""}</li>
      </ul>
      <div className="tl-label tl-pixel">RESULTS BY STANDARD</div>
      <table className="tl-report-table">
        <thead>
          <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.std}>
              <td className="c">{r.std}{r.preview ? <small className="tl-preview"> preview</small> : null}</td>
              <td>{r.skill}</td>
              <td style={{ color: r.c === r.n ? "var(--tl-green)" : r.c / r.n >= 0.75 ? "var(--tl-yellow)" : "var(--tl-red)" }}>{r.c}/{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {list.some((r) => r.preview) && <p className="dim small">“Preview” codes are grade 8 NC history standards. Grades 6, 7 and 9 study world history in NC, so these are a look ahead.</p>}
      <p>
        <span className="y">Practice next:</span>{" "}
        {weak.length ? weak.map((r) => `${r.skill} (${r.std}) in ${expFor(r.std)}`).join("; ") : "everything was strong. Try another expedition!"}
      </p>
      <div className="tl-label tl-pixel">FROM THE LEDGER</div>
      <div className="tl-journal">
        {game.journal.slice(-6).map((j, i) => (
          <div key={i}><span className="d">{dateOf(e, j.day).short}</span> {j.text}</div>
        ))}
      </div>
      <div className="tl-actions">
        <button className="tl-cta ghost" onClick={() => game.choose(e.id)}>Play again</button>
        <button className="tl-cta" onClick={() => game.toSelect()}>Another expedition ▶</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the Ledger book (under the canvas on wide screens) */

export function LedgerBook({ game }: { game: Game }) {
  const e = game.exp;
  if (!e) {
    return (
      <div className="tl-book">
        <div className="tl-book-h tl-pixel">HOW AN EXPEDITION WORKS</div>
        <ol>
          <li><b>Outfit.</b> Pack within a budget at the store.</li>
          <li><b>Travel.</b> Set the pace and rations; watch the forecast and the calendar.</li>
          <li><b>Decide.</b> Real events from the sources: every choice has a cost.</li>
          <li><b>Read.</b> Stop at landmarks for primary sources and questions.</li>
        </ol>
        <p>Everything goes into your Ledger, which becomes the mission report.</p>
      </div>
    );
  }
  const s = game.sim;
  return (
    <div className="tl-book">
      <div className="tl-book-h tl-pixel">LEDGER · {e.title.toUpperCase()} · {e.partyLabel.toUpperCase()}</div>
      <div className="tl-book-row">
        <span>{dateOf(e, s.day).label}</span>
        <span>mile {s.mile.toLocaleString("en-US")}</span>
        <span>{Math.floor(s.res.food).toLocaleString("en-US")} {e.units.food}</span>
        <span>{dollars(s.res.money)}</span>
        <span>score {game.score}</span>
      </div>
      <div className="tl-book-lines">
        {game.journal.slice(-6).map((j, i) => (
          <div key={i}><span className="d">{dateOf(e, j.day).short}</span> {j.text}</div>
        ))}
        {game.journal.length === 0 && <div className="dim">The Ledger is empty. It fills in as you travel.</div>}
      </div>
    </div>
  );
}

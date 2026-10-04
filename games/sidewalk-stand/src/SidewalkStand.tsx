import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
  gradeFromArcade,
  gradeLabel,
  initialGrade,
  isEarlyReader,
  loadProgress,
  readAloudPref,
  rememberGrade,
  setReadAloudPref,
  speak,
  speakQuestion,
  speechSupported,
  stopSpeaking,
  type Grade,
  type Question,
} from "@/kit";
import { ITEMS, ITEM_LABEL, SUPPLIES, UPGRADES, gnum, type ItemId } from "@/stand/config";
import { WEATHER_WORD } from "@/stand/demand";
import { GAME_ID, StandGame, type LogEntry } from "@/stand/game";
import { PIECE_VALUE, type PieceId } from "@/stand/money";
import type { SSQuestion } from "@/stand/questions";
import { StandScreen, laneAt } from "@/stand/render";
import "@/stand/stand.css";

/** Sidewalk Stand's own 16-step bassline: a bouncy park-day shuffle (Hz; 0 = rest). */
const BASS = [131, 0, 196, 0, 165, 0, 196, 175, 147, 0, 220, 0, 175, 0, 196, 220];

const SUBJECT_LABELS: Record<string, string> = { math: "MATH", social: "ECONOMICS", science: "SCIENCE", ela: "ELA" };

function questionSpeech(q: Question & { say?: string }) {
  return q.passage ? `${q.passage} ${q.say ?? q.prompt}` : q.say ?? q.prompt;
}

export default function SidewalkStand() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 132), []);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const game = useMemo(() => {
    const g = new StandGame(
      audio,
      {
        say: (t) => {
          if (readAloudRef.current && t) speak(t);
        },
        sayQuestion: (q) => {
          if (readAloudRef.current) speakQuestion(questionSpeech(q), q.choices);
        },
        onChange: () => bump(),
      },
      initialGrade("3"),
    );
    g.makeDeck = (gr) => new QuestionDeck(gr, ["math", "social"], { gameId: GAME_ID });
    return g;
  }, [audio]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  const grade = game.grade;
  const early = isEarlyReader(grade);
  const phase = game.phase;

  // Fit the 16:10 screen inside the space left over, limited by width or height.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const ctl = controlsRef.current ? controlsRef.current.offsetHeight + 8 : 0;
      setScreenWidth(Math.floor(Math.max(120, Math.min(width, (height - ctl) * 1.6))));
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const screen = new StandScreen(canvasRef.current!, game);
    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) {
      (window as unknown as { __st: StandGame; __screen: StandScreen }).__st = game;
      (window as unknown as { __screen: StandScreen }).__screen = screen;
      if (params.has("fast")) screen.speed = 6;
    }
    screen.start();
    return () => {
      screen.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [game, audio]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (phase === "over") setHighScore(loadProgress(GAME_ID).highScore);
  }, [phase]);

  const chooseGrade = useCallback(
    (g: Grade) => {
      rememberGrade(g);
      setReadAloud(readAloudPref(isEarlyReader(g)));
      game.setGrade(g);
    },
    [game],
  );

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(game.grade);
    setPaused(false);
    game.setPaused(false);
    game.start();
  }, [audio, game]);

  const togglePause = useCallback(
    (force?: boolean) => {
      const ph = game.phase;
      if (ph !== "rush" && ph !== "pay") return;
      setPaused((p) => {
        const np = force ?? !p;
        game.setPaused(np);
        if (np) stopSpeaking();
        return np;
      });
    },
    [game],
  );

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const replay = useCallback(() => {
    const s = game.q;
    if (s) speakQuestion(questionSpeech(s.q as SSQuestion), s.q.choices);
    else speak(game.msg.text);
  }, [game]);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLElement && ev.target.tagName === "INPUT") return;
      const k = ev.key.toLowerCase();
      const plain = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
      if (k === "m" && plain) {
        setMuted(audio.toggleMute());
        return;
      }
      const ph = game.phase;
      if (ph === "title" || ph === "over") return;
      if ((k === "p" && plain) || ev.key === "Escape") {
        togglePause();
        return;
      }
      if (paused) return;
      if (k === "r" && plain) {
        replay();
        return;
      }
      const s = game.q;
      if (s) {
        const i = plain ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
        if (s.picked === null && i >= 0) {
          ev.preventDefault();
          game.answer(i);
        } else if (s.picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          game.continueQ();
        }
        return;
      }
      switch (ph) {
        case "plan":
          if (game.rescue) {
            if (ev.key === "Enter" || k === "y") {
              ev.preventDefault();
              game.acceptRescue();
            } else if (k === "n") game.declineRescue();
            return;
          }
          if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
            ev.preventDefault();
            game.moveRow(ev.key === "ArrowUp" ? -1 : 1);
          } else if (ev.key === "ArrowLeft" || ev.key === "ArrowRight" || ev.key === "-" || ev.key === "+" || ev.key === "=") {
            ev.preventDefault();
            game.adjustRow(ev.key === "ArrowLeft" || ev.key === "-" ? -1 : 1);
          } else if (k === "h" && plain) game.helpPlan();
          else if (ev.key === "Enter") {
            ev.preventDefault();
            game.openStand();
          }
          return;
        case "rush":
          if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
            ev.preventDefault();
            game.moveLane(ev.key === "ArrowUp" ? -1 : 1);
          } else if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") {
            ev.preventDefault();
            game.cycleItem(ev.key === "ArrowLeft" ? -1 : 1);
          } else if (ev.key === " " || ev.key === "Enter") {
            ev.preventDefault();
            game.serve();
          }
          return;
        case "upgrade": {
          const i = plain ? "1234".indexOf(k) : -1;
          if (i >= 0) {
            ev.preventDefault();
            game.buyUpgrade(UPGRADES[i].id);
          } else if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            game.nextFromUpgrade();
          }
          return;
        }
      }
    };
    const blur = () => {
      if (game.phase === "rush") togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [game, audio, paused, togglePause, replay]);

  // Tap the canvas: pick an item from the strip, or a lane to move there and serve.
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused || game.phase !== "rush") return;
    audio.unlock();
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320;
    const y = ((e.clientY - r.top) / r.height) * 200;
    if (y < 26 && x >= 58 && x < 58 + ITEMS.length * 46) {
      game.setItem(ITEMS[Math.floor((x - 58) / 46)]);
      return;
    }
    const lane = laneAt(y, game.lanes);
    if (lane >= 0) game.tapLane(lane);
  };

  const playing = phase !== "title" && phase !== "over";
  const t = game.today;

  return (
    <div className={`st-root ${early ? "early" : ""}`}>
      <div className="st-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="st-tools">
          {(phase === "rush" || phase === "pay") && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="st-cabinet">
        <div className="st-hud st-pixel">
          <div><span className="lbl">Day</span><span className="val">{playing ? `${game.day}/${game.days}` : "-"}</span></div>
          <div><span className="lbl">Cash</span><span className="val y">{playing || phase === "over" ? game.fmt(game.cash) : "-"}</span></div>
          <div><span className="lbl">Score</span><span className="val">{String(game.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, game.score)).padStart(6, "0")}</span></div>
          <div className="stock" title="Supplies on hand (servings)">
            <span className="lbl">Stock</span>
            <span className="val">
              {playing ? `CUP ${game.stock.cups} JUICE ${game.stock.jugs} ICE ${game.stock.ice} FRUIT ${game.stock.fruit} SNACK ${game.stock.snacks}` : "-"}
            </span>
          </div>
        </div>

        <div className={`st-banner ${game.msg.tone}`}>
          <div className="head st-pixel">
            <span className="kind">{PHASE_TITLE[phase]}</span>
            <span className="std">{gradeLabel(grade)} · {playing ? `${WEATHER_WORD[t.forecast.weather]} ${t.forecast.temp}°F` : "MONEY MATH & ECONOMICS"}</span>
          </div>
          <div className="row">
            {speechSupported() && (
              <button type="button" className={`st-speak ${readAloud ? "on" : ""}`} onClick={replay} aria-label="Read it aloud" title="Read aloud (R)">
                <SpeakerIcon />
              </button>
            )}
            <span className="msg">{phase === "title" ? "Run a juice-and-snack cart in the park: plan, serve the rush, make change, count your profit." : game.msg.text}</span>
          </div>
        </div>

        <div className="st-fill" ref={stageRef}>
          <div className="st-stage">
            <div className="st-screen" style={screenWidth ? { width: screenWidth } : undefined}>
              <canvas ref={canvasRef} aria-label="Sidewalk Stand game screen" onPointerDown={onPointerDown} onContextMenu={(e) => e.preventDefault()} />

              {phase === "title" && <TitleScreen grade={grade} highScore={highScore} onGrade={chooseGrade} onStart={startGame} />}
              {phase === "plan" && <PlanPanel game={game} />}
              {phase === "planQ" && game.q && <QuestionPanel game={game} early={early} head="◆ PLANNING CHECK — BEFORE THE PARK OPENS" />}
              {phase === "pay" && game.q && <QuestionPanel game={game} early={early} head="◆ THE CUSTOMER PAYS" pay />}
              {phase === "ledger" && <LedgerPanel game={game} early={early} />}
              {phase === "upgrade" && <UpgradePanel game={game} />}
              {phase === "transmission" && game.q && <QuestionPanel game={game} early={early} head="◆ TRANSMISSION FROM THE ARCADE — BETWEEN DAYS" />}
              {paused && (phase === "rush" || phase === "pay") && (
                <div className="st-overlay cover">
                  <div style={{ textAlign: "center" }}>
                    <div className="st-title st-pixel">PAUSED</div>
                    <div style={{ marginTop: 20 }}>
                      <button className="st-cta" onClick={() => togglePause(false)}>Resume</button>
                    </div>
                  </div>
                </div>
              )}
              {phase === "over" && <Report game={game} highScore={highScore} onAgain={startGame} onMenu={() => game.toTitle()} />}
            </div>
          </div>

          <div className={`st-controls show ${phase === "rush" ? "" : "idle"} ${touch ? "touch" : ""}`} ref={controlsRef}>
            <div className="st-items" role="radiogroup" aria-label="Item to serve">
              {ITEMS.map((it) => (
                <button key={it} role="radio" aria-checked={game.held === it} className={`st-ctl item ${game.held === it ? "on" : ""}`} onClick={() => game.setItem(it)}>
                  <ItemIcon item={it} /> {ITEM_LABEL[it]} <small>{game.canMake(it)}</small>
                </button>
              ))}
            </div>
            <div className="st-pad">
              <button className="st-ctl" aria-label="Lane up" onClick={() => game.moveLane(-1)}>▲</button>
              <button className="st-ctl" aria-label="Lane down" onClick={() => game.moveLane(1)}>▼</button>
              <button className="st-ctl serve" onClick={() => game.serve()}>SERVE <kbd>SPACE</kbd></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PHASE_TITLE: Record<StandGame["phase"], string> = {
  title: "SIDEWALK STAND",
  plan: "MORNING · PLAN THE DAY",
  planQ: "MORNING · PLANNING CHECK",
  rush: "MIDDAY · SERVING RUSH",
  pay: "MIDDAY · MAKE CHANGE",
  ledger: "EVENING · LEDGER",
  upgrade: "EVENING · UPGRADES",
  transmission: "TRANSMISSION",
  over: "WEEK OVER · REPORT",
};

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}

function ItemIcon({ item }: { item: ItemId }) {
  const fill = item === "juice" ? "#ff9a1f" : item === "fruit" ? "#e3262f" : "#c68642";
  return (
    <svg viewBox="0 0 8 8" width="1.2em" height="1.2em" aria-hidden="true" shapeRendering="crispEdges" className="st-icon">
      {item === "snack" ? (
        <>
          <rect x="0" y="2" width="8" height="5" fill="#ffd23f" />
          <rect x="1" y="3" width="6" height="3" fill={fill} />
        </>
      ) : (
        <>
          <rect x="1" y="2" width="6" height="6" fill="#f2f4ff" />
          <rect x="2" y="3" width="4" height="4" fill={fill} />
          {item === "juice" ? <rect x="5" y="0" width="1" height="3" fill="#e3262f" /> : <rect x="2" y="1" width="2" height="2" fill="#5fff8a" />}
        </>
      )}
    </svg>
  );
}

/** Coins drawn to relative size (US coin diameters in mm) and bills; coins show no numbers. */
function Piece({ id, big }: { id: PieceId; big: boolean }) {
  const v = PIECE_VALUE[id];
  if (v >= 100) {
    return (
      <svg viewBox="0 0 70 30" className="st-bill" aria-label={`${v / 100} dollar bill`}>
        <rect x="1" y="1" width="68" height="28" rx="2" fill="#cfe8c8" stroke="#3c7a3a" strokeWidth="2" />
        <rect x="5" y="5" width="60" height="20" fill="none" stroke="#3c7a3a" strokeWidth="1" />
        <circle cx="35" cy="15" r="7" fill="#9cc79a" stroke="#3c7a3a" />
        <text x="8" y="14" fontSize="9" fontFamily="monospace" fill="#1d4a1c" fontWeight="bold">{v / 100}</text>
        <text x="50" y="25" fontSize="9" fontFamily="monospace" fill="#1d4a1c" fontWeight="bold">{v / 100}</text>
      </svg>
    );
  }
  const mm = { penny: 19.05, nickel: 21.21, dime: 17.91, quarter: 24.26 }[id as "penny"];
  const r = mm * 1.2;
  const copper = id === "penny";
  const reeded = id === "dime" || id === "quarter";
  const size = 64;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="st-coin" style={{ width: `${(mm / 24.26) * (big ? 5.5 : 4)}em`, height: `${(mm / 24.26) * (big ? 5.5 : 4)}em` }} aria-label="coin">
      <circle cx={size / 2} cy={size / 2} r={r} fill={copper ? "#c47a3a" : "#c9ced8"} stroke={copper ? "#7a4318" : "#7e8596"} strokeWidth={reeded ? 4 : 2.5} strokeDasharray={reeded ? "1.6 1.2" : undefined} />
      <circle cx={size / 2} cy={size / 2} r={r - 5} fill="none" stroke={copper ? "#9a5a26" : "#a2a8b6"} strokeWidth="1.2" />
      {/* a simple profile, the same on every coin */}
      <path d={`M${size / 2 + 4} ${size / 2 - 9} q-9 0 -9 9 q0 5 3 7 l0 5 l7 0 l0 -4 q3 -2 3 -6 q0 -11 -4 -11z`} fill={copper ? "#a8642c" : "#aab0bd"} />
    </svg>
  );
}

function Pieces({ pieces }: { pieces: PieceId[] }) {
  return (
    <div className="st-pieces" aria-hidden="true">
      {pieces.map((p, i) => (
        <Piece key={i} id={p} big={pieces.length <= 3} />
      ))}
    </div>
  );
}

function Choices({ game, early }: { game: StandGame; early: boolean }) {
  const s = game.q!;
  const q = s.q;
  return (
    <div className={`st-choices ${early ? "big" : ""}`}>
      {q.choices.map((c, i) => {
        const state = s.picked === null ? "" : i === q.answer ? "right" : i === s.picked ? "wrong" : "";
        return (
          <button key={i} className={`st-btn ${state}`} disabled={s.picked !== null} onClick={() => game.answer(i)}>
            <span className="key">{"ABCD"[i]}</span>
            <span>{c}</span>
          </button>
        );
      })}
    </div>
  );
}

function Feedback({ game, nextLabel }: { game: StandGame; nextLabel: string }) {
  const s = game.q!;
  if (s.picked === null) return null;
  const right = s.picked === s.q.answer;
  const pay = s.purpose === "pay";
  return (
    <div className="st-feedback">
      {right ? (
        <div className="verdict ok">✔ CORRECT!{pay ? " THE CUSTOMER SAYS THANKS" : ""}</div>
      ) : (
        <div className="verdict no">
          {pay ? `THE CUSTOMER KINDLY CORRECTS YOU: IT'S ${s.q.choices[s.q.answer]}` : `NOT QUITE — THE ANSWER IS ${"ABCD"[s.q.answer]}: ${s.q.choices[s.q.answer]}`}
        </div>
      )}
      <div>{s.q.explanation}</div>
      <div style={{ marginTop: 10, textAlign: "right" }}>
        <button className="st-cta" autoFocus onClick={() => game.continueQ()}>{nextLabel} ▶</button>
      </div>
    </div>
  );
}

function QTags({ q }: { q: Question }) {
  return (
    <div className="st-tagrow">
      <span className={`st-tag st-pixel ${q.subject}`}>{SUBJECT_LABELS[q.subject] ?? q.subject.toUpperCase()}</span>
      <span className="st-tag st-pixel std">{q.standard} · {q.skill}</span>
      {speechSupported() && (
        <button className="st-speak" onClick={() => speakQuestion(questionSpeech(q as SSQuestion), q.choices)} aria-label="Read the question aloud">
          <SpeakerIcon />
        </button>
      )}
    </div>
  );
}

function QuestionPanel({ game, early, head, pay }: { game: StandGame; early: boolean; head: string; pay?: boolean }) {
  const s = game.q!;
  const q = s.q as SSQuestion;
  const next = s.purpose === "pay" ? "Back to the rush" : s.purpose === "plan" ? "Open the park" : "Start the next day";
  return (
    <div className="st-overlay">
      <div className={`st-panel ${pay ? "pay" : s.purpose === "transmission" ? "trans" : "plan"}`} role="dialog" aria-label={head}>
        <div className="st-h st-pixel">{head}</div>
        <QTags q={q} />
        {q.pieces && <Pieces pieces={q.pieces} />}
        <div className="st-prompt">{q.prompt}</div>
        <Choices game={game} early={early} />
        <Feedback game={game} nextLabel={next} />
      </div>
    </div>
  );
}

function PlanPanel({ game }: { game: StandGame }) {
  const s = game.scale;
  const f = game.today.forecast;
  const [lo, hi] = game.hint();
  const cost = game.cartCost();
  const n = gnum(game.grade);
  const fmt = (c: number) => game.fmt(c);
  if (game.rescue) {
    const loan = game.rescue === "loan";
    const principal = Math.round(s.start / 2 / 100) * 100;
    const days = game.days - game.day + 1;
    return (
      <div className="st-overlay">
        <div className="st-panel center" role="dialog" aria-label="Out of cash">
          <div className="st-h st-pixel">THE CASH BOX IS NEARLY EMPTY</div>
          <div className="st-help big">
            You have {fmt(game.cash)}, not enough for cups, juice and ice. That happens to real businesses too!
          </div>
          {loan ? (
            <div className="st-help" style={{ margin: "10px 0" }}>
              Your family offers a <b className="y">loan of {fmt(principal)}</b> at <b className="y">5% simple interest per day</b> for {days} day{days > 1 ? "s" : ""}.
              Interest I = P × r × t = {fmt(principal)} × 0.05 × {days} = <b className="y">{fmt((principal * 5 * days) / 100)}</b>. You pay back {fmt(principal + (principal * 5 * days) / 100)} at the end of the week (only what you can).
            </div>
          ) : (
            <div className="st-help" style={{ margin: "10px 0" }}>
              Your family says: “Let's start fresh tomorrow!” Your cash goes back to <b className="y">{fmt(Math.max(game.cash, s.start))}</b>. Try a new plan: check the forecast and the price.
            </div>
          )}
          <div className="st-row-btns">
            <button className="st-cta ghost" onClick={() => game.declineRescue()}>No thanks <kbd>N</kbd></button>
            <button className="st-cta" autoFocus onClick={() => game.acceptRescue()}>{loan ? "Take the loan" : "Fresh start"} <kbd>Y</kbd></button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="st-overlay">
      <div className="st-panel plan wide" role="dialog" aria-label="Plan the day">
        <div className="st-planhead">
          <div className={`st-weather ${f.weather}`}>
            <WeatherIcon w={f.weather} />
            <div>
              <div className="st-pixel">{WEATHER_WORD[f.weather]} · {f.temp}°F</div>
              <div className="st-help">
                About <b className="y">{lo === hi ? lo : `${lo}–${hi}`}</b> customers at the usual price ({fmt(s.ref)}).
                {f.weather === "rain" ? " Rain keeps people home." : f.temp >= 85 ? " Hot! People are thirsty." : ""}
              </div>
            </div>
          </div>
          <div className="st-cash st-pixel">
            CASH <b className="y">{fmt(game.cash)}</b>
          </div>
        </div>
        {n >= 8 && (
          <div className="st-formula">
            customers ≈ {n <= 2 ? 8 : 12} × weather × temperature × (2 − price ÷ {fmt(s.ref)}){game.upgrades.has("sign") ? " × 1.15 sign" : ""}, at most {game.upgrades.has("counter") ? 16 : 12}
          </div>
        )}
        <table className="st-shop">
          <thead>
            <tr>
              <th>SUPPLY</th>
              <th>PACK</th>
              <th>PRICE</th>
              <th>ON HAND</th>
              <th>BUY</th>
              <th>COST</th>
            </tr>
          </thead>
          <tbody>
            {SUPPLIES.map((sp, i) => (
              <tr key={sp.id} className={game.planRow === i ? "sel" : ""} onPointerDown={() => (game.planRow = i)}>
                <td><b>{sp.name}</b><small>{sp.note}</small></td>
                <td>{sp.pack}</td>
                <td>{fmt(s.pack[sp.id])}</td>
                <td>{game.stock[sp.id]}</td>
                <td className="qty">
                  <button className="st-step" aria-label={`Fewer ${sp.name}`} onClick={() => game.setPack(sp.id, -1)} disabled={!game.cart[sp.id]}>−</button>
                  <span className="st-pixel">{game.cart[sp.id]}</span>
                  <button className="st-step" aria-label={`More ${sp.name}`} onClick={() => game.setPack(sp.id, 1)} disabled={!game.canAdd(sp.id)}>+</button>
                </td>
                <td>{fmt(game.cart[sp.id] * s.pack[sp.id])}</td>
              </tr>
            ))}
            <tr className={`price ${game.planRow === SUPPLIES.length ? "sel" : ""}`}>
              <td><b>Juice price</b><small>fruit cup {fmt(s.fruitPrice)} · snack {fmt(s.snackPrice)}</small></td>
              <td colSpan={3} className="st-prices">
                {s.priceOptions.length <= 4 ? (
                  s.priceOptions.map((p, i) => (
                    <button key={p} className={`st-chip ${i === game.priceIdx ? "on" : ""}`} onClick={() => game.setPriceIdx(i)}>{fmt(p)}</button>
                  ))
                ) : (
                  <span className="st-help">{game.juicePrice > s.ref ? "Above" : game.juicePrice < s.ref ? "Below" : "The"} usual price</span>
                )}
              </td>
              <td className="qty">
                <button className="st-step" aria-label="Lower price" onClick={() => game.setPrice(-1)} disabled={game.priceIdx === 0}>−</button>
                <span className="st-pixel y">{fmt(game.juicePrice)}</span>
                <button className="st-step" aria-label="Raise price" onClick={() => game.setPrice(1)} disabled={game.priceIdx === s.priceOptions.length - 1}>+</button>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
        <div className="st-planfoot">
          <div className="st-help">
            Supplies <b className="y">{fmt(cost)}</b> · cash after <b className="y">{fmt(game.cash - cost)}</b>
            <span className="dim"> · game numbers, not real prices</span>
          </div>
          <div className="st-row-btns">
            <button className="st-cta ghost" onClick={() => game.helpPlan()}>Help me plan <kbd>H</kbd></button>
            <button className="st-cta" onClick={() => game.openStand()}>Open the stand <kbd>ENTER</kbd></button>
          </div>
        </div>
        <div className="st-help dim small">Keys: ↑ ↓ pick a row · ← → fewer / more · H help · Enter open. Or tap the buttons.</div>
      </div>
    </div>
  );
}

function WeatherIcon({ w }: { w: string }) {
  return (
    <svg viewBox="0 0 16 16" width="2.4em" height="2.4em" shapeRendering="crispEdges" aria-hidden="true">
      {w === "sunny" && (
        <>
          <rect x="5" y="5" width="6" height="6" fill="#ffd23f" />
          <rect x="7" y="1" width="2" height="2" fill="#ffd23f" />
          <rect x="7" y="13" width="2" height="2" fill="#ffd23f" />
          <rect x="1" y="7" width="2" height="2" fill="#ffd23f" />
          <rect x="13" y="7" width="2" height="2" fill="#ffd23f" />
        </>
      )}
      {w !== "sunny" && (
        <>
          <rect x="2" y="6" width="12" height="5" fill={w === "rain" ? "#8a92ac" : "#dde0ec"} />
          <rect x="4" y="3" width="6" height="4" fill={w === "rain" ? "#8a92ac" : "#dde0ec"} />
        </>
      )}
      {w === "rain" && (
        <>
          <rect x="4" y="12" width="1" height="3" fill="#6ea0ff" />
          <rect x="8" y="12" width="1" height="3" fill="#6ea0ff" />
          <rect x="12" y="12" width="1" height="3" fill="#6ea0ff" />
        </>
      )}
    </svg>
  );
}

function LedgerPanel({ game, early }: { game: StandGame; early: boolean }) {
  const t = game.today;
  const fmt = (c: number) => game.fmt(c);
  const profit = t.revenue - t.boughtCost;
  const s = game.q;
  const missed = t.missed + t.soldOut + t.tooBusy;
  return (
    <div className="st-overlay">
      <div className="st-panel ledger wide" role="dialog" aria-label="Evening ledger">
        <div className="st-h st-pixel">EVENING LEDGER · DAY {game.day}</div>
        <div className={`st-ledger ${s && s.picked !== null ? "done" : ""}`}>
          <div className="st-book">
            <div className="row head"><span>MONEY IN</span><span /></div>
            {ITEMS.filter((it) => t.sold[it]).map((it) => (
              <div className="row" key={it}>
                <span>{t.sold[it]} × {ITEM_LABEL[it].toLowerCase()} @ {fmt(game.price(it))}</span>
                <span>{fmt(t.sold[it] * game.price(it))}</span>
              </div>
            ))}
            {t.revenue !== ITEMS.reduce((a, it) => a + t.sold[it] * game.price(it), 0) && (
              <div className="row dim"><span>tips & coupons</span><span>{fmt(t.revenue - ITEMS.reduce((a, it) => a + t.sold[it] * game.price(it), 0))}</span></div>
            )}
            <div className="row total"><span>REVENUE</span><span className="g">{fmt(t.revenue)}</span></div>
            <div className="row head"><span>MONEY OUT</span><span /></div>
            {t.buys.length ? (
              t.buys.map((b) => (
                <div className="row" key={b.name}>
                  <span>{b.packs} × {b.name.toLowerCase()} @ {fmt(b.cost)}</span>
                  <span>{fmt(b.packs * b.cost)}</span>
                </div>
              ))
            ) : (
              <div className="row dim"><span>no supplies bought</span><span>{fmt(0)}</span></div>
            )}
            <div className="row total"><span>COSTS</span><span className="r">{fmt(t.boughtCost)}</span></div>
            <div className="row grand">
              <span>{profit >= 0 ? "PROFIT" : "LOSS"} = REVENUE − COSTS</span>
              <span className={profit >= 0 ? "g" : "r"}>{fmt(profit)}</span>
            </div>
          </div>
          <div className="st-side">
            <div className="st-help">
              Served <b className="c">{t.served}</b>{missed ? <> · missed <b className="r">{missed}</b></> : null}
              {t.soldOut ? <> ({t.soldOut} found you sold out)</> : null}
              {t.tooBusy ? <> ({t.tooBusy} saw lines too long)</> : null}
            </div>
            <div className="st-help">
              Left over: {game.stock.cups} cups, {game.stock.jugs} juice, {game.stock.snacks} snacks
              {t.melted ? `; ${t.melted} ice melted` : ""}
              {t.spoiled ? `; ${t.spoiled} fruit spoiled` : ""}.
            </div>
            <div className="st-help">Cash: {fmt(t.startCash)} → <b className="y">{fmt(game.cash)}</b></div>
          </div>
        </div>
        {s && (
          <div className="st-reflect">
            <QTags q={s.q} />
            <div className="st-prompt small">{s.q.prompt}</div>
            <Choices game={game} early={early} />
            <Feedback game={game} nextLabel="Upgrades" />
          </div>
        )}
      </div>
    </div>
  );
}

function UpgradePanel({ game }: { game: StandGame }) {
  const last = game.day >= game.days;
  return (
    <div className="st-overlay">
      <div className="st-panel center wide" role="dialog" aria-label="Upgrades">
        <div className="st-h st-pixel">{last ? "LAST DAY DONE!" : "SMALL UPGRADES FOR TOMORROW"} · CASH {game.fmt(game.cash)}</div>
        {!last && (
          <div className="st-ups">
            {UPGRADES.map((u, i) => {
              const own = game.upgrades.has(u.id);
              const cost = game.upgradeCost(u.id);
              const cant = !own && cost > game.cash;
              return (
                <button key={u.id} className={`st-up ${own ? "own" : ""} ${cant ? "off" : ""}`} onClick={() => game.buyUpgrade(u.id)} disabled={own}>
                  <span className="key st-pixel">{i + 1}</span>
                  <b className="st-pixel">{u.name}</b>
                  <small>{u.what}</small>
                  <span className="price st-pixel">{own ? "OWNED" : game.fmt(cost)}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="st-help" style={{ margin: "10px 0" }}>
          {last ? "Time to see how your week went." : "Spending on upgrades now means less cash for supplies tomorrow. Saving is a choice too!"}
        </div>
        <button className="st-cta" autoFocus onClick={() => game.nextFromUpgrade()}>{last ? "See the report" : "Next day"} ▶</button>
      </div>
    </div>
  );
}

function TitleScreen({ grade, highScore, onGrade, onStart }: { grade: Grade; highScore: number; onGrade: (g: Grade) => void; onStart: () => void }) {
  const fromArcade = gradeFromArcade();
  const n = gnum(grade);
  const band =
    n === 0
      ? "Know your coins, count pennies, needs and wants."
      : n === 1
        ? "Coin values, count coins to 50¢, goods and services."
        : n === 2
          ? "Count bills and coins, change from a dollar, $ and ¢."
          : n === 3
            ? "Make change by counting up, add money, price × quantity."
            : n <= 5
              ? "Multi-step money problems with decimals, budgets."
              : n === 6
                ? "Unit prices, best buys, percent off, recipe ratios."
                : n === 7
                  ? "Sales tax, tips, markup, discounts, simple interest."
                  : n === 8
                    ? "Profit as a linear function, slope, break-even."
                    : n === 12
                      ? "Paychecks, loan interest, budgets, opportunity cost."
                      : "Revenue, cost and profit functions, break-even, max revenue.";
  return (
    <div className="st-overlay" style={{ background: "rgba(3,8,24,0.72)" }}>
      <div className="st-panel title">
        <div className="st-title st-pixel">SIDEWALK STAND</div>
        <div className="st-sub st-pixel">SPIDERBEN10'S ARCADE · A JUICE CART IN THE PARK</div>
        {fromArcade ? (
          <div className="st-sub st-pixel st-badge" style={{ marginTop: 10 }}>
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="st-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`st-grade st-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="st-help center" style={{ marginTop: 6 }}>
          <span className="y">{gradeLabel(grade)}:</span> {band}
        </div>
        <div className="st-days">
          <div><b className="st-pixel">1 MORNING</b><span>Read the forecast, buy supplies, set your price.</span></div>
          <div><b className="st-pixel">2 MIDDAY</b><span>Serve the rush and make change for each customer.</span></div>
          <div><b className="st-pixel">3 EVENING</b><span>Count revenue − costs = profit. Pick an upgrade.</span></div>
        </div>
        <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
          <button className="st-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="st-help">
          <kbd>↑</kbd><kbd>↓</kbd> lane · <kbd>←</kbd><kbd>→</kbd> item · <kbd>Space</kbd> serve · <kbd>1</kbd>–<kbd>4</kbd>/<kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>R</kbd> read aloud ·{" "}
          <kbd>P</kbd> pause · <kbd>M</kbd> mute. Or just tap a lane!
        </div>
        <div className="st-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")} · All prices are made-up game numbers.</div>
      </div>
    </div>
  );
}

function groupBy(log: LogEntry[]) {
  const m = new Map<string, { std: string; skill: string; subject: string; n: number; c: number }>();
  for (const l of log) {
    const key = `${l.standard}|${l.skill}`;
    const cur = m.get(key) ?? { std: l.standard, skill: l.skill, subject: l.subject, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    m.set(key, cur);
  }
  return [...m.values()].sort((a, b) => a.std.localeCompare(b.std));
}

function Report({ game, highScore, onAgain, onMenu }: { game: StandGame; highScore: number; onAgain: () => void; onMenu: () => void }) {
  const fmt = (c: number) => game.fmt(c);
  const rows = groupBy(game.log);
  const practice = rows.filter((v) => v.c / v.n < 0.75);
  const n = game.log.length;
  const c = game.log.filter((l) => l.correct).length;
  const gain = game.finalCash - game.scale.start;
  return (
    <div className="st-overlay">
      <div className="st-panel report wide">
        <div className="st-h st-pixel" style={{ color: "var(--st-green)" }}>WEEK OVER — MISSION REPORT</div>
        <div className="st-help big">
          Score <b className="y">{game.score}</b>
          {game.score >= highScore && game.score > 0 ? " — NEW HIGH SCORE!" : ""} · {gradeLabel(game.grade)} · Cash {fmt(game.scale.start)} → <b className="y">{fmt(game.finalCash)}</b> (
          {gain >= 0 ? "up" : "down"} {fmt(Math.abs(gain))})
        </div>
        {game.loan && (
          <div className="st-help">
            Family loan {fmt(game.loan.principal)} + interest {fmt(game.loanOwed() - game.loan.principal)}: paid back {fmt(game.loanPaid)}
            {game.loanLeft ? `, ${fmt(game.loanLeft)} still to pay when you can` : ""}.
          </div>
        )}
        <table className="st-report-table">
          <thead>
            <tr><th>DAY</th><th>WEATHER</th><th>PRICE</th><th>SERVED</th><th>REVENUE</th><th>COSTS</th><th>PROFIT</th></tr>
          </thead>
          <tbody>
            {game.history.map((d) => (
              <tr key={d.day}>
                <td>{d.day}</td>
                <td>{d.weather} {d.temp}°</td>
                <td>{fmt(d.price)}</td>
                <td>{d.served}{d.missed + d.soldOut + d.tooBusy ? <span className="dim"> (+{d.missed + d.soldOut + d.tooBusy} missed)</span> : null}</td>
                <td>{fmt(d.revenue)}</td>
                <td>{fmt(d.costs)}</td>
                <td style={{ color: d.profit >= 0 ? "var(--st-green)" : "var(--st-red)" }}>{fmt(d.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="st-label st-pixel">RESULTS BY STANDARD {n ? `· ${c}/${n} (${Math.round((100 * c) / n)}%)` : ""}</div>
        <table className="st-report-table">
          <thead>
            <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={`${v.std}|${v.skill}`}>
                <td className="c">{v.std}</td>
                <td>{v.skill}</td>
                <td style={{ color: v.c === v.n ? "var(--st-green)" : v.c / v.n >= 0.75 ? "var(--st-yellow)" : "var(--st-red)" }}>{v.c}/{v.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="st-help" style={{ marginTop: 8 }}>
          <span className="y">Practice next:</span>{" "}
          {practice.length ? practice.map((v) => `${v.skill} (${v.std})`).join(", ") + "." : "Nothing missed this week. Try a higher price on a sunny day, or the next grade up!"}
        </div>
        <div className="st-row-btns" style={{ marginTop: 14 }}>
          <button className="st-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="st-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}


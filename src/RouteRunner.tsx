import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
  courseName,
  gradeFromArcade,
  gradeLabel,
  gradeNumber,
  initialGrade,
  isEarlyReader,
  loadProgress,
  readAloudPref,
  recordAnswer,
  rememberGrade,
  setReadAloudPref,
  speak,
  speakQuestion,
  speechSupported,
  stopSpeaking,
  submitScore,
  type DealtQuestion,
  type Grade,
  type Question,
  type Subject,
  type SubjectMode,
} from "@/kit";
import { RouteEngine, W, H, type Action, type HouseEvent, type HudState, type StreetTally } from "@/route/engine";
import { plainLabel } from "@/route/font";
import { rulesFor, type DeliveryRule } from "@/route/rules";
import { RuleRotation } from "@/route/street";
import "@/route/route.css";

const GAME_ID = "route-runner";

/** An original 16-step bassline for Route Runner (Hz, 0 = rest): a bouncy paper-route shuffle. */
const BASSLINE = [98, 0, 147, 98, 0, 123, 0, 147, 110, 0, 165, 110, 0, 131, 147, 165];

type Screen = "title" | "playing" | "over";

interface LogEntry {
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
  kind: "delivery" | "yard";
}

interface StreetView {
  rule: DeliveryRule;
  street: number;
  target: string | null;
  feedback: HouseEvent | null;
}

interface YardView {
  q: DealtQuestion;
  tally: StreetTally;
  picked: number | null;
  correct: boolean | null;
  bonus: number;
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  " ": "throw",
  z: "throw", Z: "throw", x: "throw", X: "throw",
};

const SUBJECT_LABELS: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA" };
const MODES: SubjectMode[] = ["science", "math", "ela", "mixed"];

function subjectNote(mode: SubjectMode, g: Grade): string {
  if (mode === "mixed") return "Science, math & ELA streets";
  const course = courseName(g, mode);
  const rules = rulesFor(g, mode).map((r) => r.target.toLowerCase());
  const list = rules.slice(0, 3).join(" · ");
  return course ? `${course}: ${list}` : list;
}

const EMPTY_HUD: HudState = { score: 0, lives: 3, street: 1, packets: 10, streak: 0, progress: 0, speed: 1 };

/** Stand-in Question so a delivery counts toward the rule's standard in the kit's progress store. */
function deliveryAsQuestion(rule: DeliveryRule, label: string, grade: Grade, explanation: string): Question {
  return {
    id: `${rule.id}:${label}`,
    subject: rule.subject,
    grade,
    standard: rule.standard,
    skill: rule.skill,
    prompt: rule.prompt,
    choices: ["Deliver", "Skip", "—", "—"],
    answer: rule.yes.includes(label) ? 0 : 1,
    explanation,
  };
}

/** Speech-friendly version of a label. */
const sayLabel = (s: string) => plainLabel(s).replace(/\//g, " over ").replace(/=/g, " equals ");

export default function RouteRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RouteEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASSLINE, 128), []);
  const deckRef = useRef<QuestionDeck | null>(null);
  const rotationRef = useRef<RuleRotation | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("4"));
  const [mode, setMode] = useState<SubjectMode>("science");
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [street, setStreet] = useState<StreetView | null>(null);
  const [yard, setYard] = useState<YardView | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("4"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [crashNote, setCrashNote] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  const early = isEarlyReader(grade);

  // Fit the 16:10 screen inside the space left over, limited by width or height.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScreenWidth(Math.floor(Math.min(width, height * 1.6)));
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // Create the engine once; it runs an attract-mode demo behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const demoRule = rulesFor("4", "science")[0];
    const engine = new RouteEngine(canvas, audio, {
      onHud: setHud,
      onStreet: (rule, n) => {
        setStreet({ rule, street: n, target: null, feedback: null });
        setYard(null);
        setCrashNote(null);
        if (readAloudRef.current) speak(`Street ${n}. ${rule.prompt}`);
      },
      onTarget: (label) => {
        setStreet((s) => (s ? { ...s, target: label } : s));
        if (label && readAloudRef.current) speak(sayLabel(label));
      },
      onHouse: (e) => {
        setStreet((s) => (s ? { ...s, feedback: e } : s));
        if (e.kind === "skipped") return;
        const correct = e.kind === "delivered";
        recordAnswer(GAME_ID, deliveryAsQuestion(e.rule, e.label, gradeRef.current, e.explanation), correct);
        setLog((l) => [...l, { subject: e.rule.subject, standard: e.rule.standard, skill: e.rule.skill, correct, kind: "delivery" }]);
        if (readAloudRef.current && e.kind === "cancelled") speak(`Cancelled! ${e.explanation}`);
      },
      requestQuestion: () => deckRef.current!.draw(),
      onYard: (q, tally) => {
        setYard({ q, tally, picked: null, correct: null, bonus: 0 });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onYardPick: (choice) => setYard((y) => (y ? { ...y, picked: choice } : y)),
      onYardResult: (q, choice, correct, bonus) => {
        recordAnswer(GAME_ID, q, correct);
        setLog((l) => [...l, { subject: q.subject, standard: q.standard, skill: q.skill, correct, kind: "yard" }]);
        setYard((y) => (y && y.q.id === q.id ? { ...y, picked: choice, correct, bonus } : y));
        if (readAloudRef.current) {
          if (correct) speak(`Bullseye! ${q.explanation}`);
          else speak(`The answer is ${q.choices[q.answer]}. ${q.explanation}`);
        }
      },
      onCrash: (what) => setCrashNote(`CRASH! You hit ${what}.`),
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
        stopSpeaking();
      },
    });
    engineRef.current = engine;
    engine.demo(demoRule);
    engine.start();
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __routeRunner: unknown }).__routeRunner = { engine };
    }
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const chooseGrade = useCallback((g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setReadAloud(readAloudPref(isEarlyReader(g)));
  }, []);

  const startGame = useCallback(
    (m: SubjectMode) => {
      audio.unlock();
      audio.startMusic();
      rememberGrade(grade);
      setMode(m);
      deckRef.current = new QuestionDeck(grade, m, { gameId: GAME_ID });
      const rotation = new RuleRotation(grade, m);
      rotationRef.current = rotation;
      setLog([]);
      setYard(null);
      setPaused(false);
      setScreen("playing");
      engineRef.current?.newGame({ grade: gradeNumber(grade), firstRule: rotation.next(), nextRule: () => rotation.next() });
    },
    [audio, grade],
  );

  const chooseAnswer = useCallback((i: number) => {
    engineRef.current?.selectAnswer(i);
  }, []);

  const continueStreet = useCallback(() => {
    stopSpeaking();
    engineRef.current?.nextStreet();
  }, []);

  const togglePause = useCallback((force?: boolean) => {
    const e = engineRef.current;
    if (!e) return;
    const p = e.togglePause(force);
    setPaused(p);
    if (p) stopSpeaking();
  }, []);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const replay = useCallback(() => {
    if (yard) speakQuestion(yard.q.prompt, yard.q.choices);
    else if (street) speak(`${street.rule.prompt}${street.target ? ` Next house: ${sayLabel(street.target)}.` : ""}`);
  }, [yard, street]);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const k = ev.key.toLowerCase();
      if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        // Bonus-yard answers: A–D / 1–4 throw at that target.
        const idx = "1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k);
        if (idx >= 0) {
          ev.preventDefault();
          if (!paused) chooseAnswer(idx);
          return;
        }
        if (k === "r") {
          replay();
          return;
        }
      }
      if (k === "p" || ev.key === "Escape") {
        togglePause();
        return;
      }
      if (yard && yard.correct !== null && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        if (!ev.repeat) continueStreet();
        return;
      }
      const a = KEYMAP[ev.key];
      if (a) {
        ev.preventDefault();
        if (!ev.repeat || a !== "throw") engineRef.current?.setKey(a, true);
      }
    };
    const up = (ev: KeyboardEvent) => {
      const a = KEYMAP[ev.key];
      if (a) engineRef.current?.setKey(a, false);
    };
    const blur = () => {
      engineRef.current?.releaseAllKeys();
      if (screen === "playing" && !yard) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, paused, yard, chooseAnswer, togglePause, replay, continueStreet, audio]);

  const touchProps = (a: Action) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      engineRef.current?.setKey(a, true);
    },
    onPointerUp: () => engineRef.current?.setKey(a, false),
    onPointerLeave: () => engineRef.current?.setKey(a, false),
    onPointerCancel: () => engineRef.current?.setKey(a, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  // Tap (or click) a house to throw at it; tap a target in the bonus yard to answer.
  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    audio.unlock();
    if (engineRef.current?.tap(x, y)) e.preventDefault();
  };

  return (
    <div className={`rr-root ${early ? "early" : ""}`}>
      <div className="rr-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="rr-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="rr-cabinet">
        <div className="rr-hud rr-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Street</span><span className="val">{hud.street}</span></div>
          <div><span className="lbl">Bikes</span><span className="val lives">{"▰".repeat(Math.max(0, hud.lives))}</span></div>
          <div>
            <span className="lbl">Packets</span>
            <span className={`val ${hud.packets <= 2 ? "low" : ""}`}>{hud.packets}</span>
            {hud.streak > 2 && <span className="streak">×{Math.min(5, 1 + Math.floor(hud.streak / 3))}</span>}
          </div>
        </div>

        {screen === "playing" && street && !yard && (
          <StreetBanner view={street} hud={hud} crashNote={crashNote} readAloud={readAloud} onReplay={replay} />
        )}
        {screen === "playing" && yard && (
          <YardBanner view={yard} readAloud={readAloud} onChoose={chooseAnswer} onReplay={replay} onContinue={continueStreet} open={!paused} />
        )}

        <div className="rr-stage" ref={stageRef}>
          <div className="rr-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Route Runner game screen" onPointerDown={onCanvasPointer} />

            {screen === "title" && <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />}

            {screen === "playing" && paused && (
              <div className="rr-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="rr-title rr-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="rr-cta" onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                score={hud.score}
                street={hud.street}
                grade={grade}
                highScore={highScore}
                onAgain={() => startGame(mode)}
                onMenu={() => {
                  engineRef.current?.demo(rulesFor("4", "science")[0]);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`rr-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="rr-pad">
            <button className="rr-touch rr-pixel" {...touchProps("left")} aria-label="Steer left">◀</button>
            <button className="rr-touch rr-pixel" {...touchProps("right")} aria-label="Steer right">▶</button>
          </div>
          <div className="rr-pad">
            <button className="rr-touch small rr-pixel" {...touchProps("down")} aria-label="Slow down">SLOW</button>
            <button className="rr-touch small rr-pixel" {...touchProps("up")} aria-label="Speed up">FAST</button>
            <button className="rr-touch big fire rr-pixel" {...touchProps("throw")} aria-label="Throw a packet">THROW</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}

function StreetBanner({
  view, hud, crashNote, readAloud, onReplay,
}: {
  view: StreetView;
  hud: HudState;
  crashNote: string | null;
  readAloud: boolean;
  onReplay: () => void;
}) {
  const { rule, feedback } = view;
  let head = `STREET ${view.street} — DELIVER ONLY TO ${rule.target}`;
  let cls = "";
  let info = "Throw a packet (SPACE, or tap a house) at every house that matches the rule. Skip the rest!";
  if (feedback) {
    const lbl = plainLabel(feedback.label);
    if (feedback.kind === "delivered") { cls = "correct"; info = `✔ ${lbl}: delivered! ${feedback.explanation}`; }
    if (feedback.kind === "cancelled") { cls = "wrong"; info = `✘ ${lbl}: subscriber cancelled! ${feedback.explanation}`; }
    if (feedback.kind === "missed") { cls = "wrong"; info = `Missed ${lbl}: it matched. ${feedback.explanation}`; }
    if (feedback.kind === "skipped") { cls = "correct"; info = `Good skip: ${feedback.explanation}`; }
  }
  if (crashNote && hud.packets >= 0 && feedback === null) info = crashNote;
  if (hud.packets === 0) head = "OUT OF PACKETS — RIDE OVER A BUNDLE";
  return (
    <div className={`rr-banner ${cls}`}>
      <div className="head rr-pixel">
        <span>{head}</span>
        <span className="std">{SUBJECT_LABELS[rule.subject]} · {rule.standard}</span>
      </div>
      <div className="prompt">
        {speechSupported() && (
          <button type="button" className={`speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read the rule aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        <span className="rule">{rule.prompt}</span>
        <span className={`next ${view.target ? "" : "none"}`} aria-live="polite">
          {view.target ? <>NEXT HOUSE: <b>{plainLabel(view.target)}</b></> : "NO HOUSE IN REACH"}
        </span>
      </div>
      <div className={`info ${feedback ? "" : "hint"}`}>{info}</div>
      <div className="danger" aria-hidden="true">
        <div className="fill" style={{ width: `${Math.round(hud.progress * 100)}%` }} />
      </div>
    </div>
  );
}

function YardBanner({
  view, readAloud, onChoose, onReplay, onContinue, open,
}: {
  view: YardView;
  readAloud: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
  onContinue: () => void;
  open: boolean;
}) {
  const { q, tally, correct } = view;
  let head = `◆ BONUS YARD — STREET ${tally.street} · THROW AT A TARGET: PRESS A–D OR TAP`;
  if (view.picked !== null && correct === null) head = `PACKET AWAY → ${"ABCD"[view.picked]}`;
  if (correct === true) head = `✔ BULLSEYE! +${view.bonus} · +6 PACKETS`;
  if (correct === false) head = "✘ MISSED THE MARK — THE RIGHT TARGET IS FLASHING · +3 PACKETS";
  const summary = `Delivered ${tally.delivered}/${tally.subscribers} · cancelled ${tally.cancelled} · missed ${tally.missed} · good skips ${tally.skipped}${tally.perfect ? " · PERFECT STREET +1000 and a bonus bike!" : ""}`;
  return (
    <div className={`rr-banner yard ${correct === true ? "correct" : correct === false ? "wrong" : ""}`} role="dialog" aria-label="Bonus yard question">
      <div className="head rr-pixel">
        <span>{head}</span>
        <span className="std">{SUBJECT_LABELS[q.subject]} · {q.standard} · {q.skill}</span>
      </div>
      <div className="tally">{summary}</div>
      {q.passage && <div className="passage">{q.passage}</div>}
      <div className="prompt">
        {speechSupported() && (
          <button type="button" className={`speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read the question aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        <span>{q.prompt}</span>
      </div>
      <div className="opts">
        {q.choices.map((c, i) => {
          const state = correct !== null && i === q.answer ? "ans" : view.picked === i ? (correct !== null ? "wrong" : "picked") : "";
          return (
            <button
              key={i}
              type="button"
              className={`opt ${state}`}
              disabled={!open || view.picked !== null}
              onPointerDown={(e) => {
                e.preventDefault();
                onChoose(i);
              }}
            >
              <b>{"ABCD"[i]}</b>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {correct !== null && (
        <div className="info result">
          <span>{correct ? q.explanation : `Answer: ${"ABCD"[q.answer]}) ${q.choices[q.answer]}. ${q.explanation}`}</span>
          <button type="button" className="rr-cta small" autoFocus onClick={onContinue}>Next street ▶</button>
        </div>
      )}
    </div>
  );
}

function TitleScreen({
  grade, onGrade, onStart, highScore,
}: {
  grade: Grade;
  onGrade: (g: Grade) => void;
  onStart: (m: SubjectMode) => void;
  highScore: number;
}) {
  const fromArcade = gradeFromArcade();
  return (
    <div className="rr-overlay" style={{ background: "rgba(10,15,46,0.62)" }}>
      <div className="rr-panel" style={{ borderColor: "var(--rr-red)" }}>
        <div className="rr-title rr-pixel">ROUTE RUNNER</div>
        <div className="rr-sub rr-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>

        {fromArcade ? (
          <div className="rr-sub rr-pixel rr-badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="rr-h rr-pixel" style={{ marginTop: 14 }}>1. PICK YOUR GRADE</div>
            <div className="rr-grades" role="radiogroup" aria-label="Grade">
              {GRADES.map((g) => (
                <button
                  key={g}
                  role="radio"
                  aria-checked={g === grade}
                  className={`rr-grade rr-pixel ${g === grade ? "on" : ""}`}
                  onClick={() => onGrade(g)}
                  title={gradeLabel(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="rr-h rr-pixel" style={{ marginTop: 12 }}>
          {fromArcade ? "" : "2. "}PICK A ROUTE TO START · {gradeLabel(grade).toUpperCase()}
        </div>
        <div className="rr-subjects">
          {MODES.map((m) => (
            <button key={m} className="rr-subject" onClick={() => onStart(m)}>
              {m === "mixed" ? "MIXED" : SUBJECT_LABELS[m]}
              <small>{subjectNote(m, grade)}</small>
            </button>
          ))}
        </div>
        <div className="rr-help">
          <kbd>◀</kbd> <kbd>▶</kbd> steer &nbsp;·&nbsp; <kbd>▲</kbd> faster <kbd>▼</kbd> slower &nbsp;·&nbsp; <kbd>SPACE</kbd>/<kbd>Z</kbd>/<kbd>X</kbd> throw at
          the flashing house, or tap any house &nbsp;·&nbsp; <kbd>A</kbd>–<kbd>D</kbd>/<kbd>1</kbd>–<kbd>4</kbd> bonus-yard targets &nbsp;·&nbsp;{" "}
          <kbd>P</kbd> pause &nbsp;·&nbsp; <kbd>M</kbd> mute &nbsp;·&nbsp; <kbd>R</kbd> read aloud
          <br />
          Every street has a <span style={{ color: "var(--rr-cyan)" }}>delivery rule</span>. Throw packets only to houses whose sign
          <span style={{ color: "var(--rr-green)" }}> matches</span>. A wrong house cancels a subscriber! Dodge cones, tires, sprinklers and
          dogs, grab packet bundles, and hit the right target in the bonus yard.
        </div>
        <div className="rr-help" style={{ marginTop: 6, color: "var(--rr-dim)" }}>
          HI-SCORE {String(highScore).padStart(6, "0")}
        </div>
      </div>
    </div>
  );
}

function MissionReport({
  log, score, street, grade, highScore, onAgain, onMenu,
}: {
  log: LogEntry[]; score: number; street: number; grade: Grade; highScore: number;
  onAgain: () => void; onMenu: () => void;
}) {
  const bySubject = (["science", "math", "ela"] as const)
    .map((s) => {
      const items = log.filter((l) => l.subject === s);
      return { s, n: items.length, c: items.filter((l) => l.correct).length };
    })
    .filter((x) => x.n > 0);

  const byStd = new Map<string, { skill: string; subject: Subject; n: number; c: number }>();
  for (const l of log) {
    const cur = byStd.get(l.standard) ?? { skill: l.skill, subject: l.subject, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.standard, cur);
  }
  const practice = [...byStd.entries()].filter(([, v]) => v.c < v.n);
  const deliveries = log.filter((l) => l.kind === "delivery");
  const yards = log.filter((l) => l.kind === "yard");

  return (
    <div className="rr-overlay">
      <div className="rr-panel">
        <div className="rr-h rr-pixel" style={{ color: "var(--rr-red)" }}>
          ROUTE OVER — MISSION REPORT · {gradeLabel(grade).toUpperCase()}
        </div>
        <div className="rr-help" style={{ fontSize: 22 }}>
          Score <b style={{ color: "var(--rr-yellow)" }}>{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached street{" "}
          <b style={{ color: "var(--rr-cyan)" }}>{street}</b> · Deliveries right {deliveries.filter((l) => l.correct).length}/{deliveries.length} ·
          Bonus yards {yards.filter((l) => l.correct).length}/{yards.length}
        </div>
        {bySubject.length > 0 && (
          <div className="rr-help" style={{ marginTop: 6 }}>
            {bySubject.map((b) => (
              <span key={b.s} style={{ marginRight: 16 }}>
                <span className={`rr-tag rr-pixel ${b.s}`}>{SUBJECT_LABELS[b.s]}</span>
                {b.c}/{b.n}
              </span>
            ))}
          </div>
        )}
        {byStd.size > 0 ? (
          <table className="rr-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td style={{ color: "var(--rr-cyan)" }}>{std}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: v.c === v.n ? "var(--rr-green)" : "var(--rr-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="rr-help" style={{ marginTop: 8 }}>No deliveries yet. Throw packets at houses that match the rule!</div>
        )}
        {practice.length > 0 && (
          <div className="rr-help" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--rr-yellow)" }}>Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
            Bonus-yard questions on these come up more often next time.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="rr-cta ghost" onClick={onMenu}>Change route</button>
          <button className="rr-cta" autoFocus onClick={onAgain}>Ride again ▶</button>
        </div>
      </div>
    </div>
  );
}

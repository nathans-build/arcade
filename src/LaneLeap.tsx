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
  type Subject,
  type SubjectMode,
} from "@/kit";
import { LeapEngine, W, H, type Action, type HudState } from "@/leap/engine";
import { RulePicker, rulesFor, type Rule } from "@/leap/rules";
import "@/leap/leap.css";

const GAME_ID = "lane-leap";

/** Lane Leap's own 16-step bassline (a bouncy G major hop; Hz, 0 = rest). */
const BASS = [98, 0, 147, 98, 123, 0, 147, 0, 110, 0, 165, 110, 131, 147, 165, 196];

type Screen = "title" | "playing" | "over";

interface LogEntry {
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
  kind: "logs" | "homes" | "transmissions";
}

interface RoundView {
  level: number;
  rule: Rule;
  q: DealtQuestion;
  picked: number | null;
  correct: boolean | null;
}

const SUBJECT_LABELS: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA" };
const MODES: SubjectMode[] = ["math", "science", "ela", "mixed"];

const KEYMAP: Record<string, Action> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const EMPTY_HUD: HudState = { score: 0, lives: 3, level: 1, shields: 1, maxShields: 1, streak: 0, time: 1, target: null };

function subjectNote(mode: SubjectMode, g: Grade): string {
  if (mode === "mixed") return "All three subjects";
  const course = courseName(g, mode);
  const rules = rulesFor(g, mode);
  const sample = rules[0]?.skill ?? "";
  return course ? `${course} · ${sample}` : sample;
}

function randomRule(g: Grade): Rule | null {
  const all = (["math", "science", "ela"] as Subject[]).flatMap((s) => rulesFor(g, s));
  return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}

export default function LaneLeap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LeapEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 148), []);
  const pickerRef = useRef<RulePicker | null>(null);
  const homeDecksRef = useRef<Partial<Record<Subject, QuestionDeck>>>({});
  const cpDeckRef = useRef<QuestionDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [mode, setMode] = useState<SubjectMode>("mixed");
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [round, setRound] = useState<RoundView | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "good" | "bad" | "info" } | null>(null);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; level: number } | null>(null);
  const [cpPicked, setCpPicked] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
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

  const addLog = useCallback((e: LogEntry) => setLog((l) => [...l, e]), []);

  const sayRound = useCallback((rule: Rule, q: DealtQuestion) => {
    speak(`${rule.say} Then hop into the right home. ${q.prompt} ${q.choices.map((c, i) => `${"ABCD"[i]}: ${c}.`).join(" ")}`);
  }, []);

  // Create the engine once; it runs traffic behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new LeapEngine(canvas, audio, {
      onHud: setHud,
      requestRound: () => {
        const rule = pickerRef.current!.next();
        const decks = homeDecksRef.current;
        const deck = decks[rule.subject] ?? decks.math!;
        return { rule, q: deck.draw() };
      },
      onRoundStart: (level, rule, q) => {
        setRound({ level, rule, q, picked: null, correct: null });
        setMessage(null);
        if (readAloudRef.current) sayRound(rule, q);
      },
      onLanding: (rule, item, ok) => {
        addLog({ subject: rule.subject, standard: rule.standard, skill: rule.skill, correct: ok, kind: "logs" });
        setMessage({ text: `${ok ? "✔" : "✘"} ${item.why}`, tone: ok ? "good" : "bad" });
        if (readAloudRef.current && !ok) speak(item.why);
      },
      onHome: (q, choice, correct, first) => {
        if (first) {
          recordAnswer(GAME_ID, q, correct);
          addLog({ subject: q.subject, standard: q.standard, skill: q.skill, correct, kind: "homes" });
        }
        setRound((r) => (r && r.q.id === q.id ? { ...r, picked: first ? choice : r.picked, correct: first ? correct : r.correct } : r));
        if (correct) setMessage({ text: `✔ Home ${"ABCD"[choice]} is right! ${q.explanation}`, tone: "good" });
        else setMessage({ text: `✘ Not home ${"ABCD"[choice]}. The answer is ${"ABCD"[q.answer]}: ${q.choices[q.answer]}. ${q.explanation}`, tone: "bad" });
        if (readAloudRef.current) speak(correct ? `Correct! ${q.explanation}` : `The answer is ${q.choices[q.answer]}. ${q.explanation}`);
      },
      onTarget: () => {},
      onMessage: (text, tone) => setMessage({ text, tone }),
      onLevelClear: (level) => {
        const q = cpDeckRef.current?.draw() ?? null;
        if (!q) {
          engine.resolveCheckpoint(false);
          return;
        }
        setCpPicked(null);
        setCheckpoint({ q, level });
        audio.checkpoint();
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
      },
    });
    engineRef.current = engine;
    // Playtest hook: ?debug exposes the engine to automated tests.
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __ll: LeapEngine }).__ll = engine;
    engine.demo(gradeNumber(grade), randomRule(grade));
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
    // The engine is created once; grade changes are pushed to it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, addLog, sayRound]);

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
    engineRef.current?.demo(gradeNumber(g), randomRule(g));
  }, []);

  const startGame = useCallback(
    (m: SubjectMode) => {
      audio.unlock();
      audio.startMusic();
      rememberGrade(grade);
      setMode(m);
      pickerRef.current = new RulePicker(grade, m);
      const subjects: Subject[] = m === "mixed" ? ["math", "science", "ela"] : [m];
      homeDecksRef.current = Object.fromEntries(subjects.map((s) => [s, new QuestionDeck(grade, s, { gameId: GAME_ID, quickOnly: true })]));
      cpDeckRef.current = new QuestionDeck(grade, m, { gameId: GAME_ID });
      setLog([]);
      setCheckpoint(null);
      setRound(null);
      setMessage(null);
      setPaused(false);
      setScreen("playing");
      engineRef.current?.newGame(gradeNumber(grade));
    },
    [audio, grade],
  );

  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || cpPicked !== null) return;
      setCpPicked(i);
      const correct = i === checkpoint.q.answer;
      if (correct) audio.correct();
      else audio.wrong();
      recordAnswer(GAME_ID, checkpoint.q, correct);
      addLog({ subject: checkpoint.q.subject, standard: checkpoint.q.standard, skill: checkpoint.q.skill, correct, kind: "transmissions" });
      if (readAloudRef.current) speak(`${correct ? "Correct!" : "Not quite."} ${checkpoint.q.explanation}`);
    },
    [checkpoint, cpPicked, audio, addLog],
  );

  const continueFromCheckpoint = useCallback(() => {
    if (!checkpoint || cpPicked === null) return;
    stopSpeaking();
    const correct = cpPicked === checkpoint.q.answer;
    setCheckpoint(null);
    setCpPicked(null);
    engineRef.current?.resolveCheckpoint(correct);
  }, [checkpoint, cpPicked]);

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
    if (checkpoint) speakQuestion(checkpoint.q.prompt, checkpoint.q.choices);
    else if (round) sayRound(round.rule, round.q);
  }, [checkpoint, round, sayRound]);

  const chooseHome = useCallback((i: number) => {
    audio.unlock();
    engineRef.current?.select(i);
  }, [audio]);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const k = ev.key.toLowerCase();
      const idx = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (checkpoint) {
        if (cpPicked === null && idx >= 0) {
          ev.preventDefault();
          answerCheckpoint(idx);
        } else if (cpPicked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          continueFromCheckpoint();
        } else if (k === "r") replay();
        return;
      }
      if (k === "p" || ev.key === "Escape") {
        togglePause();
        return;
      }
      if (paused) return;
      if (idx >= 0) {
        ev.preventDefault();
        chooseHome(idx);
        return;
      }
      if (k === "r") {
        replay();
        return;
      }
      const a = KEYMAP[ev.key];
      if (a) {
        ev.preventDefault();
        engineRef.current?.press(a);
      }
    };
    const blur = () => {
      if (screen === "playing" && !checkpoint) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [screen, checkpoint, cpPicked, paused, answerCheckpoint, continueFromCheckpoint, togglePause, replay, chooseHome, audio]);

  // Touch pad: a press hops once, holding repeats.
  const repeatRef = useRef<number | null>(null);
  const stopRepeat = () => {
    if (repeatRef.current !== null) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };
  const touchProps = (a: Action) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      engineRef.current?.press(a);
      stopRepeat();
      repeatRef.current = window.setInterval(() => engineRef.current?.press(a), 230);
    },
    onPointerUp: stopRepeat,
    onPointerLeave: stopRepeat,
    onPointerCancel: stopRepeat,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  useEffect(() => stopRepeat, []);

  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    engineRef.current?.tapAt(x, y);
  };

  const rule = round?.rule ?? null;

  return (
    <div className={`ll-root ${early ? "early" : ""}`}>
      <div className="ll-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="ll-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`ll-cabinet ${touch && screen === "playing" ? "touch-on" : ""}`}>
        <div className="ll-hud ll-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Lvl</span><span className="val">{hud.level}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, hud.lives))}</span></div>
          <div>
            <span className="lbl">Shield</span>
            <span className="val shield">
              {Array.from({ length: Math.max(1, hud.maxShields) }, (_, i) => (
                <span key={i} className={i < hud.shields ? "on" : "off"}>◆</span>
              ))}
            </span>
          </div>
        </div>

        {screen === "playing" && rule && round && (
          <>
            <div className="ll-rule" aria-live="polite">
              <span className="ll-pixel tag">RULE</span>
              <span className="txt">{rule.text}</span>
              {speechSupported() && (
                <button type="button" className={`ll-speak ${readAloud ? "on" : ""}`} onClick={replay} aria-label="Read the rule and question aloud" title="Read aloud (R)">
                  <SpeakerIcon />
                </button>
              )}
              <span className={`msg ${message?.tone ?? "hint"}`}>{message ? message.text : rule.hint}</span>
            </div>
            <HomeBanner round={round} target={hud.target} onChoose={chooseHome} />
          </>
        )}

        <div className="ll-stage" ref={stageRef}>
          <div className="ll-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Lane Leap game screen" onPointerDown={onCanvasPointer} />

            {screen === "title" && <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />}

            {screen === "playing" && checkpoint && (
              <div className="ll-overlay">
                <div className="ll-panel" role="dialog" aria-label="Transmission question">
                  <div className="ll-h ll-pixel ll-blink">◆ INCOMING TRANSMISSION — AFTER LEVEL {checkpoint.level}</div>
                  <div className="ll-tagrow">
                    <span className={`ll-tag ll-pixel ${checkpoint.q.subject}`}>{SUBJECT_LABELS[checkpoint.q.subject]}</span>
                    <span className="ll-tag ll-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                    {speechSupported() && (
                      <button className="ll-speak" onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)} aria-label="Read the question aloud">
                        <SpeakerIcon />
                      </button>
                    )}
                  </div>
                  {checkpoint.q.passage && <div className="ll-passage">{checkpoint.q.passage}</div>}
                  <div className="ll-prompt">{checkpoint.q.prompt}</div>
                  <div className="ll-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = cpPicked === null ? "" : i === checkpoint.q.answer ? "right" : i === cpPicked ? "wrong" : "";
                      return (
                        <button key={i} className={`ll-btn ${state}`} disabled={cpPicked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {cpPicked !== null && (
                    <div className="ll-feedback">
                      {cpPicked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! +{250 * checkpoint.level} · EXTRA SHIELD NEXT LEVEL</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — THE ANSWER IS {"ABCD"[checkpoint.q.answer]}</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="ll-cta" autoFocus onClick={continueFromCheckpoint}>Next level ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !checkpoint && (
              <div className="ll-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="ll-title ll-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="ll-cta" onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                grade={grade}
                score={hud.score}
                level={hud.level}
                highScore={highScore}
                onAgain={() => startGame(mode)}
                onMenu={() => {
                  engineRef.current?.demo(gradeNumber(grade), randomRule(grade));
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`ll-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="ll-pad">
            <button className="ll-touch" {...touchProps("left")} aria-label="Hop left">◀</button>
            <button className="ll-touch" {...touchProps("right")} aria-label="Hop right">▶</button>
          </div>
          <div className="ll-pad">
            <button className="ll-touch" {...touchProps("down")} aria-label="Hop down">▼</button>
            <button className="ll-touch big up" {...touchProps("up")} aria-label="Hop up">▲</button>
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

function HomeBanner({ round, target, onChoose }: { round: RoundView; target: number | null; onChoose: (i: number) => void }) {
  const { q } = round;
  const done = round.picked !== null;
  let head = "HOME QUESTION · CROSS, THEN HOP INTO THE RIGHT HOME · A–D OR TAP";
  if (target !== null && !done) head = `HOME ${"ABCD"[target]} LOCKED IN · CROSS TO THE BANK`;
  if (done && round.correct) head = "✔ RIGHT HOME!";
  if (done && !round.correct) head = `✘ WRONG HOME · HEAD FOR HOME ${"ABCD"[q.answer]}`;
  return (
    <div className={`ll-banner ${done ? (round.correct ? "correct" : "wrong") : ""}`}>
      <div className="head ll-pixel">
        <span>{head}</span>
        <span className="std">{SUBJECT_LABELS[q.subject]} · {q.standard}</span>
      </div>
      <div className="prompt">{q.prompt}</div>
      <div className="opts">
        {q.choices.map((c, i) => {
          const state = done && i === q.answer ? "ans" : round.picked === i ? "wrong" : target === i ? "picked" : "";
          return (
            <button
              key={i}
              type="button"
              className={`opt ${state}`}
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
    <div className="ll-overlay" style={{ background: "rgba(10,15,46,0.6)" }}>
      <div className="ll-panel title">
        <div className="ll-title ll-pixel">LANE LEAP</div>
        <div className="ll-sub ll-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>

        {fromArcade ? (
          <div className="ll-sub ll-pixel ll-gradebadge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="ll-h ll-pixel" style={{ marginTop: 14 }}>1. PICK YOUR GRADE</div>
            <div className="ll-grades" role="radiogroup" aria-label="Grade">
              {GRADES.map((g) => (
                <button
                  key={g}
                  role="radio"
                  aria-checked={g === grade}
                  className={`ll-grade ll-pixel ${g === grade ? "on" : ""}`}
                  onClick={() => onGrade(g)}
                  title={gradeLabel(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="ll-h ll-pixel" style={{ marginTop: 12 }}>{fromArcade ? "" : "2. "}PICK A SUBJECT TO START · {gradeLabel(grade).toUpperCase()}</div>
        <div className="ll-subjects">
          {MODES.map((m) => (
            <button key={m} className="ll-subject" onClick={() => onStart(m)}>
              {m === "mixed" ? "MIXED" : SUBJECT_LABELS[m]}
              <small>{subjectNote(m, grade)}</small>
            </button>
          ))}
        </div>
        <div className="ll-help">
          <kbd>◀</kbd> <kbd>▲</kbd> <kbd>▼</kbd> <kbd>▶</kbd> hop &nbsp;·&nbsp; <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> pick a home &nbsp;·&nbsp;
          <kbd>P</kbd> pause &nbsp;·&nbsp; <kbd>M</kbd> mute &nbsp;·&nbsp; <kbd>R</kbd> read aloud
          <br />
          Hop across the traffic, then cross the river on logs. Each level has a <span className="y">RULE</span> like
          <span className="c"> HOP ON NOUNS</span>: land only on logs that follow it, or they sink! At the top, leap into the home with the
          <span className="g"> right answer</span>.
        </div>
        <div className="ll-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function MissionReport({
  log, grade, score, level, highScore, onAgain, onMenu,
}: {
  log: LogEntry[]; grade: Grade; score: number; level: number; highScore: number;
  onAgain: () => void; onMenu: () => void;
}) {
  const byStd = new Map<string, { skill: string; subject: Subject; kinds: Set<string>; n: number; c: number }>();
  for (const l of log) {
    const cur = byStd.get(l.standard) ?? { skill: l.skill, subject: l.subject, kinds: new Set<string>(), n: 0, c: 0 };
    cur.n++;
    cur.kinds.add(l.kind);
    if (l.correct) cur.c++;
    byStd.set(l.standard, cur);
  }
  const count = (k: LogEntry["kind"]) => {
    const items = log.filter((l) => l.kind === k);
    return `${items.filter((l) => l.correct).length}/${items.length}`;
  };
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);

  return (
    <div className="ll-overlay">
      <div className="ll-panel">
        <div className="ll-h ll-pixel" style={{ color: "var(--ll-red)" }}>OUT OF LIVES — MISSION REPORT · {gradeLabel(grade).toUpperCase()}</div>
        <div className="ll-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached level <b className="c">{level}</b>
        </div>
        <div className="ll-help" style={{ marginTop: 4 }}>
          Rule logs {count("logs")} · Home questions {count("homes")} · Transmissions {count("transmissions")}
        </div>
        {byStd.size > 0 ? (
          <table className="ll-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td className="c">{std}</td>
                  <td><span className={`ll-dot ${v.subject}`} />{v.skill}</td>
                  <td className="dim">{[...v.kinds].join(" + ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--ll-green)" : v.c / v.n >= 0.75 ? "var(--ll-yellow)" : "var(--ll-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="ll-help" style={{ marginTop: 8 }}>No answers yet: land on a log or pick a home next time to see your standards here.</div>
        )}
        {practice.length > 0 && (
          <div className="ll-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}. These questions will come up more often.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="ll-cta ghost" onClick={onMenu}>Change {gradeFromArcade() ? "subject" : "grade / subject"}</button>
          <button className="ll-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

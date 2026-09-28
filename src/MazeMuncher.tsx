import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
  courseName,
  gradeFromArcade,
  gradeLabel,
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
import { H, W, MazeEngine, type HudState } from "@/maze/engine";
import { CRITTERS } from "@/maze/sim";
import { bandOf, tuningFor } from "@/maze/tuning";
import type { Dir } from "@/maze/maze";
import "@/maze/muncher.css";

const GAME_ID = "maze-muncher";
const SUBJECT_KEY = "arcade.maze-muncher.subject";

type Screen = "title" | "playing" | "over";

interface LogEntry {
  standard: string;
  skill: string;
  subject: Subject;
  correct: boolean;
  kind: "pellet" | "checkpoint";
}

interface BannerView {
  q: DealtQuestion;
  picked: number | null;
  correct: boolean | null;
  auto: boolean;
}

const ARROWS: Record<string, Dir> = { ArrowUp: 0, ArrowLeft: 1, ArrowDown: 2, ArrowRight: 3 };

/** Maze Muncher's own 16-step bassline (A minor chase, Hz; 0 = rest). */
const BASS = [110, 0, 131, 110, 165, 0, 147, 131, 98, 0, 123, 98, 147, 131, 123, 110];

const EMPTY_HUD: HudState = { score: 0, lives: 3, level: 1, streak: 0, mult: 1, mazeName: "", dotsLeft: 0, dotsTotal: 0, power: 0, rage: 0 };

const SUBJECTS: { id: SubjectMode; label: string }[] = [
  { id: "math", label: "MATH" },
  { id: "science", label: "SCIENCE" },
  { id: "ela", label: "ELA" },
  { id: "social", label: "SOCIAL STUDIES" },
  { id: "mixed", label: "MIXED" },
];

const SUBJECT_TAG: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" };

function loadSubject(): SubjectMode {
  try {
    const v = localStorage.getItem(SUBJECT_KEY);
    if (v === "math" || v === "science" || v === "ela" || v === "social" || v === "mixed") return v;
  } catch {
    // ignore
  }
  return "mixed";
}

function saveSubject(s: SubjectMode) {
  try {
    localStorage.setItem(SUBJECT_KEY, s);
  } catch {
    // ignore
  }
}

export default function MazeMuncher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MazeEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 150), []);
  const quickDeckRef = useRef<QuestionDeck | null>(null);
  const cpDeckRef = useRef<QuestionDeck | null>(null);
  const seenRef = useRef(new Set<string>());

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [subject, setSubject] = useState<SubjectMode>(loadSubject);
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [banner, setBanner] = useState<BannerView | null>(null);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; level: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
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

  // Create the engine once; a demo maze plays behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new MazeEngine(canvas, audio, {
      onHud: setHud,
      nextQuestion: () => quickDeckRef.current!.draw(),
      onQuestion: (q) => {
        seenRef.current.add(q.prompt);
        setBanner({ q, picked: null, correct: null, auto: false });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onAnswer: (i, correct, q) => {
        recordAnswer(GAME_ID, q, correct);
        addLog({ standard: q.standard, skill: q.skill, subject: q.subject, correct, kind: "pellet" });
        setBanner((b) => (b && b.q.id === q.id ? { ...b, picked: i, correct } : b));
        if (readAloudRef.current) {
          speak(correct ? `Correct! ${q.explanation} Munch the dizzy critters!` : `Not quite. The answer is ${"ABCD"[q.answer]}: ${q.choices[q.answer]}. ${q.explanation}`);
        }
      },
      onPowerEnd: () => {},
      onMazeStart: () => {},
      onMazeClear: (level) => {
        // Avoid repeating a question already met in this game.
        let q = cpDeckRef.current?.draw() ?? null;
        for (let i = 0; q && seenRef.current.has(q.prompt) && i < 6; i++) q = cpDeckRef.current!.draw();
        if (q) seenRef.current.add(q.prompt);
        if (!q) {
          engine.resolveCheckpoint(true);
          return;
        }
        setPicked(null);
        setCheckpoint({ q, level });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
        stopSpeaking();
      },
    });
    engineRef.current = engine;
    // Playtest hook: ?debug exposes the engine to automated tests.
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __mm: MazeEngine }).__mm = engine;
    engine.demo(initialGrade("3"));
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, addLog]);

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
    engineRef.current?.demo(g);
  }, []);

  const chooseSubject = useCallback((s: SubjectMode) => {
    setSubject(s);
    saveSubject(s);
  }, []);

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    quickDeckRef.current = new QuestionDeck(grade, subject, { gameId: GAME_ID, quickOnly: true });
    cpDeckRef.current = new QuestionDeck(grade, subject, { gameId: GAME_ID });
    seenRef.current = new Set();
    setLog([]);
    setCheckpoint(null);
    setPaused(false);
    setHud({ ...EMPTY_HUD, lives: tuningFor(grade, 1).lives });
    setScreen("playing");
    engineRef.current?.newGame(grade);
  }, [audio, grade, subject]);

  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || picked !== null) return;
      setPicked(i);
      const correct = i === checkpoint.q.answer;
      if (correct) audio.correct();
      else audio.wrong();
      recordAnswer(GAME_ID, checkpoint.q, correct);
      addLog({ standard: checkpoint.q.standard, skill: checkpoint.q.skill, subject: checkpoint.q.subject, correct, kind: "checkpoint" });
      if (readAloudRef.current) speak(`${correct ? "Correct!" : `Not quite. The answer is ${checkpoint.q.choices[checkpoint.q.answer]}.`} ${checkpoint.q.explanation}`);
    },
    [checkpoint, picked, audio, addLog],
  );

  const continueFromCheckpoint = useCallback(() => {
    if (!checkpoint || picked === null) return;
    stopSpeaking();
    engineRef.current?.resolveCheckpoint(picked === checkpoint.q.answer);
    setCheckpoint(null);
    setPicked(null);
  }, [checkpoint, picked]);

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
    else if (banner) {
      if (banner.picked === null) speakQuestion(banner.q.prompt, banner.q.choices);
      else speak(`The answer is ${"ABCD"[banner.q.answer]}: ${banner.q.choices[banner.q.answer]}. ${banner.q.explanation}`);
    }
  }, [checkpoint, banner]);

  const choose = useCallback(
    (i: number) => {
      audio.unlock();
      engineRef.current?.choose(i);
    },
    [audio],
  );

  const steer = useCallback(
    (d: Dir) => {
      audio.unlock();
      engineRef.current?.setWant(d);
    },
    [audio],
  );

  // Keyboard: arrows steer; 1–4 or A–D lock in an answer (letters never move the hero).
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const k = ev.key.toLowerCase();
      const plain = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
      const idx = plain ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (checkpoint) {
        if (picked === null && idx >= 0) {
          ev.preventDefault();
          answerCheckpoint(idx);
        } else if (picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          continueFromCheckpoint();
        } else if (k === "r" && plain) replay();
        return;
      }
      if (idx >= 0) {
        ev.preventDefault();
        if (!paused) choose(idx);
        return;
      }
      if (k === "r" && plain) {
        replay();
        return;
      }
      if (k === "p" || ev.key === "Escape") {
        togglePause();
        return;
      }
      const d = ARROWS[ev.key];
      if (d !== undefined) {
        ev.preventDefault();
        steer(d);
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
  }, [screen, checkpoint, picked, paused, answerCheckpoint, continueFromCheckpoint, togglePause, replay, choose, steer, audio]);

  // Canvas: tap a pellet or its label to answer; swipe to steer.
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const toLogical = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing" || checkpoint || paused) return;
    audio.unlock();
    swipe.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = swipe.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 3) : dy < 0 ? 0 : 2);
    swipe.current = { x: e.clientX, y: e.clientY, moved: true };
  };
  const onCanvasUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.moved) return;
    const p = toLogical(e);
    engineRef.current?.tapAt(p.x, p.y);
  };

  const padProps = (d: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      steer(d);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className={`mm-root ${early ? "early" : ""}`}>
      <div className="mm-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="mm-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`mm-cabinet ${touch && screen === "playing" ? "touch-on" : ""}`}>
        <div className="mm-hud mm-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Maze</span><span className="val">{hud.level}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, hud.lives))}</span></div>
          <div>
            <span className="lbl">Streak</span>
            <span className="val">{hud.streak}</span>
            {hud.mult > 1 && <span className="streak">×{hud.mult}</span>}
          </div>
        </div>

        {screen === "playing" && banner ? (
          <QuestionBanner view={banner} hud={hud} readAloud={readAloud} open={!paused && !checkpoint && banner.picked === null} onChoose={choose} onReplay={replay} />
        ) : (
          <div className="mm-banner idle">
            <div className="prompt">
              <span className="dim">
                {gradeLabel(grade)} · Eat the dots. Munch the pellet with the right answer to make the critters dizzy!
              </span>
            </div>
          </div>
        )}

        <div className="mm-stage" ref={stageRef}>
          <div className="mm-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas
              ref={canvasRef}
              aria-label="Maze Muncher game screen"
              onPointerDown={onCanvasDown}
              onPointerMove={onCanvasMove}
              onPointerUp={onCanvasUp}
              onPointerCancel={() => (swipe.current = null)}
              style={{ touchAction: "none" }}
            />

            {screen === "title" && (
              <TitleScreen grade={grade} subject={subject} onGrade={chooseGrade} onSubject={chooseSubject} onStart={startGame} highScore={highScore} />
            )}

            {screen === "playing" && checkpoint && (
              <div className="mm-overlay">
                <div className="mm-panel" role="dialog" aria-label="Transmission question">
                  <div className="mm-h mm-pixel mm-blink">◆ INCOMING TRANSMISSION — MAZE {checkpoint.level} CLEAR!</div>
                  <div className="mm-tagrow">
                    <span className="mm-tag mm-pixel ela">{SUBJECT_TAG[checkpoint.q.subject]}</span>
                    <span className="mm-tag mm-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                    {speechSupported() && (
                      <button className="mm-speak" onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)} aria-label="Read the question aloud">
                        <SpeakerIcon />
                      </button>
                    )}
                  </div>
                  {checkpoint.q.passage && <div className="mm-passage">{checkpoint.q.passage}</div>}
                  <div className="mm-prompt">{checkpoint.q.prompt}</div>
                  <div className="mm-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                      return (
                        <button key={i} className={`mm-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <div className="mm-feedback">
                      {picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! +{500 * checkpoint.level} · EXTRA LIFE</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — THE ANSWER IS {"ABCD"[checkpoint.q.answer]}</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="mm-cta" autoFocus onClick={continueFromCheckpoint}>Next maze ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !checkpoint && (
              <div className="mm-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="mm-title mm-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="mm-cta" onClick={() => togglePause(false)}>Resume</button>
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
                onAgain={startGame}
                onMenu={() => {
                  engineRef.current?.demo(grade);
                  setBanner(null);
                  setHud(EMPTY_HUD);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`mm-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="mm-pad dpad">
            <button className="mm-touch up" {...padProps(0)} aria-label="Move up">▲</button>
            <button className="mm-touch left" {...padProps(1)} aria-label="Move left">◀</button>
            <button className="mm-touch down" {...padProps(2)} aria-label="Move down">▼</button>
            <button className="mm-touch right" {...padProps(3)} aria-label="Move right">▶</button>
          </div>
          <div className="hint">Swipe the maze to steer. Tap a pellet, its label or an answer button to choose.</div>
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

function QuestionBanner({
  view, hud, readAloud, open, onChoose, onReplay,
}: {
  view: BannerView;
  hud: HudState;
  readAloud: boolean;
  open: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
}) {
  const { q, picked, correct } = view;
  const answered = picked !== null;
  const state = !answered ? "" : correct ? "correct" : "wrong";
  const head = `MAZE ${hud.level}${hud.mazeName ? ` · ${hud.mazeName}` : ""} · DOTS LEFT ${hud.dotsLeft}`;
  let info: string;
  if (!answered) info = "Munch pellet A–D with the right answer, or press 1–4 / A–D, or tap an answer.";
  else if (correct) info = `✔ Correct! Critters are dizzy — munch them! ${q.explanation}`;
  else info = `✘ The answer is ${"ABCD"[q.answer]}: ${q.choices[q.answer]}. ${q.explanation}`;
  return (
    <div className={`mm-banner ${state}`}>
      <div className="head mm-pixel">
        <span>{head}</span>
        <span className="std">{SUBJECT_TAG[q.subject]} · {q.standard} · {q.skill}</span>
      </div>
      <div className="prompt">
        {speechSupported() && (
          <button type="button" className={`mm-speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read it aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        <span className="ptext">{q.prompt}</span>
      </div>
      <div className="opts">
        {q.choices.map((c, i) => {
          const st = !answered ? "" : i === q.answer ? "right" : i === picked ? "wrong" : "";
          return (
            <button
              key={`${q.id}-${i}`}
              type="button"
              className={`opt l${i} ${st}`}
              disabled={!open}
              aria-label={`Answer ${"ABCD"[i]}: ${c}`}
              onPointerDown={(e) => {
                e.preventDefault();
                if (open) onChoose(i);
              }}
            >
              <b>{"ABCD"[i]}</b>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      <div className={`info ${answered ? (correct ? "ok" : "no") : "hint"}`}>{info}</div>
      <div className="meter" aria-hidden="true">
        {hud.power > 0 && <div className="fill power" style={{ width: `${Math.round(hud.power * 100)}%` }} />}
        {hud.rage > 0 && <div className="fill rage" style={{ width: `${Math.round(hud.rage * 100)}%` }} />}
      </div>
    </div>
  );
}

function TitleScreen({
  grade, subject, onGrade, onSubject, onStart, highScore,
}: {
  grade: Grade;
  subject: SubjectMode;
  onGrade: (g: Grade) => void;
  onSubject: (s: SubjectMode) => void;
  onStart: () => void;
  highScore: number;
}) {
  const t = tuningFor(grade, 1);
  const band = bandOf(grade);
  const courses = (subject === "mixed" ? (["math", "science", "ela"] as Subject[]) : [subject]).map((s) => courseName(grade, s)).filter(Boolean);
  const critters = t.critters.map((i) => CRITTERS[i]);
  return (
    <div className="mm-overlay" style={{ background: "rgba(5,8,24,0.6)" }}>
      <div className="mm-panel title">
        <div className="mm-title mm-pixel">MAZE MUNCHER</div>
        <div className="mm-sub mm-pixel">SPIDERBEN10'S ARCADE · NC MATH · SCIENCE · ELA · SOCIAL STUDIES K–12</div>
        {gradeFromArcade() ? (
          <div className="mm-sub mm-pixel mm-badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="mm-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={g === grade}
                className={`mm-grade mm-pixel ${g === grade ? "on" : ""}`}
                onClick={() => onGrade(g)}
                title={gradeLabel(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="mm-subjects" role="radiogroup" aria-label="Subject">
          {SUBJECTS.map((s) => (
            <button key={s.id} role="radio" aria-checked={s.id === subject} className={`mm-subject mm-pixel ${s.id === subject ? "on" : ""}`} onClick={() => onSubject(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="mm-help center">
          <b className="gl">{gradeLabel(grade)}{courses.length ? ` · ${courses.join(" · ")}` : ""}</b> — {critters.length} critters
          {band === 0 ? ", a smaller maze, slow critters and long dizzy spells" : band === 1 ? ", steady speed" : band === 2 ? ", quicker critters" : ", fast critters and short dizzy spells"}.
        </div>
        <div style={{ textAlign: "center", margin: "12px 0 10px" }}>
          <button className="mm-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="mm-help">
          <kbd>◀</kbd> <kbd>▶</kbd> <kbd>▲</kbd> <kbd>▼</kbd> steer (or swipe / D-pad) · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>R</kbd> read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute
          <br />
          Munch every data dot to clear the maze. A question sits in the banner and the four big corner pellets are its answers{" "}
          <span className="y">A–D</span>. Munch the <span className="y">right</span> pellet (or press its key, or tap it) and the critters get dizzy — munch
          them for points, more with a streak. A wrong pellet fires them up for a few seconds and shows the right answer. Then a fresh question
          appears. Clear the maze to get an incoming transmission.
        </div>
        <div className="mm-help mm-critters">
          {critters.map((c) => (
            <div key={c.name}><span className="c">{c.name}</span> — {c.blurb}</div>
          ))}
        </div>
        <div className="mm-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
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
  const byStd = new Map<string, { std: string; skill: string; subject: Subject; kinds: Set<string>; n: number; c: number }>();
  for (const l of log) {
    const key = `${l.standard}|${l.skill}`;
    const cur = byStd.get(key) ?? { std: l.standard, skill: l.skill, subject: l.subject, kinds: new Set<string>(), n: 0, c: 0 };
    cur.n++;
    cur.kinds.add(l.kind);
    if (l.correct) cur.c++;
    byStd.set(key, cur);
  }
  const pellets = log.filter((l) => l.kind === "pellet");
  const cps = log.filter((l) => l.kind === "checkpoint");
  const practice = [...byStd.values()].filter((v) => v.c / v.n < 0.75);

  return (
    <div className="mm-overlay">
      <div className="mm-panel">
        <div className="mm-h mm-pixel" style={{ color: "var(--mm-red)" }}>THE CRITTERS CAUGHT YOU — MISSION REPORT</div>
        <div className="mm-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached maze <b className="c">{level}</b> · {gradeLabel(grade)}
        </div>
        <div className="mm-help" style={{ marginTop: 4 }}>
          Pellet questions {pellets.filter((l) => l.correct).length}/{pellets.length} · Transmissions {cps.filter((l) => l.correct).length}/{cps.length}
        </div>
        {byStd.size > 0 && (
          <table className="mm-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>SUBJECT</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([key, v]) => (
                <tr key={key}>
                  <td className="c">{v.std}</td>
                  <td>{v.skill}</td>
                  <td className="dim">{SUBJECT_TAG[v.subject]}</td>
                  <td style={{ color: v.c === v.n ? "var(--mm-green)" : v.c / v.n >= 0.75 ? "var(--mm-yellow)" : "var(--mm-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 ? (
          <div className="mm-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}. Missed standards come up more often next time.
          </div>
        ) : (
          log.length > 0 && (
            <div className="mm-help" style={{ marginTop: 10 }}>
              <span className="y">Practice next:</span> nothing missed — try the next grade up or another subject!
            </div>
          )
        )}
        {log.length === 0 && <div className="mm-help" style={{ marginTop: 10 }}>No questions answered yet. Press 1–4 or tap an answer to pick a pellet.</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="mm-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="mm-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

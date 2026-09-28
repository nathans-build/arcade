import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
  courseName,
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
  gradeFromArcade,
} from "@/kit";
import { InvadersEngine, LABEL_W, W, type Action, type AnswerResult, type AnswerSlot, type HudState } from "@/invaders/engine";
import "@/invaders/invaders.css";

const GAME_ID = "web-invaders";

/** An original 16-step bassline for Web Invaders (Hz, 0 = rest). */
const BASSLINE = [82, 0, 82, 98, 0, 110, 98, 0, 73, 0, 73, 87, 0, 98, 110, 123];

type Screen = "title" | "playing" | "over";

interface AnswerLog {
  q: DealtQuestion;
  correct: boolean;
}

interface WaveView {
  q: DealtQuestion;
  level: number;
  picked: number | null;
  result: AnswerResult | null;
  bonus: number;
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "fire",
  " ": "fire",
  z: "fire", Z: "fire", x: "fire", X: "fire",
};

const SUBJECT_LABELS: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" };

function subjectNote(mode: SubjectMode, g: Grade): string {
  if (mode === "mixed") return "All three subjects";
  const course = courseName(g, mode);
  if (course) return course;
  const n = gradeNumber(g);
  const band = n <= 2 ? 0 : n <= 5 ? 1 : 2;
  const notes: Record<Subject, string[]> = {
    math: ["Counting · Add & subtract", "Multiply · Fractions", "Ratios · Equations"],
    science: ["Weather · Plants · Animals", "Matter · Energy · Earth", "Cells · Forces · Space"],
    ela: ["Letters · Words · Stories", "Reading · Grammar", "Vocabulary · Grammar"],
    social: ["Community · Maps", "NC · US History", "World · Civics"],
  };
  return notes[mode][band];
}

const MODES: SubjectMode[] = ["math", "science", "ela", "mixed"];

const EMPTY_HUD: HudState = { score: 0, lives: 3, level: 1, streak: 0, danger: 0 };

export default function WebInvaders() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<InvadersEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASSLINE, 132), []);
  const deckRef = useRef<QuestionDeck | null>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [mode, setMode] = useState<SubjectMode>("mixed");
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [wave, setWave] = useState<WaveView | null>(null);
  const [log, setLog] = useState<AnswerLog[]>([]);
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

  // Pin the choice labels to the answer invaders every frame (no React re-render).
  const onFrame = useCallback((slots: AnswerSlot[]) => {
    slots.forEach((s, i) => {
      const el = labelRefs.current[i];
      if (!el) return;
      if (!s.show) {
        if (el.style.display !== "none") el.style.display = "none";
        return;
      }
      el.style.display = "";
      el.style.left = `${(s.x / W) * 100}%`;
      el.style.top = `${(s.y / 200) * 100}%`;
      if (el.dataset.state !== s.state) el.dataset.state = s.state;
    });
  }, []);

  // Create the engine once; it runs the attract-mode demo behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new InvadersEngine(canvas, audio, {
      onHud: setHud,
      onFrame,
      requestQuestion: () => deckRef.current!.draw(),
      onWave: (q, level) => {
        setWave({ q, level, picked: null, result: null, bonus: 0 });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onPick: (choice) => setWave((w) => (w ? { ...w, picked: choice } : w)),
      onAnswer: (q, choice, result, bonus) => {
        const correct = result === "correct";
        recordAnswer(GAME_ID, q, correct);
        setLog((l) => [...l, { q, correct }]);
        setWave((w) => (w && w.q.id === q.id ? { ...w, picked: choice >= 0 ? choice : w.picked, result, bonus } : w));
        if (readAloudRef.current) {
          if (correct) speak("Correct!");
          else speak(`The answer is ${q.choices[q.answer]}. ${q.explanation}`);
        }
      },
      onWaveClear: () => {},
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
      },
    });
    engineRef.current = engine;
    engine.demo();
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, onFrame]);

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
      deckRef.current = new QuestionDeck(grade, m, { quickOnly: true, gameId: GAME_ID });
      setLog([]);
      setWave(null);
      setPaused(false);
      setScreen("playing");
      engineRef.current?.newGame({ grade: gradeNumber(grade) });
    },
    [audio, grade],
  );

  const chooseAnswer = useCallback((i: number) => {
    engineRef.current?.selectAnswer(i);
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
    if (wave) speakQuestion(wave.q.prompt, wave.q.choices);
  }, [wave]);

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
        // Answer picks: A-D / 1-4 fire a homing web at that invader.
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
      const a = KEYMAP[ev.key];
      if (a) {
        ev.preventDefault();
        engineRef.current?.setKey(a, true);
      }
    };
    const up = (ev: KeyboardEvent) => {
      const a = KEYMAP[ev.key];
      if (a) engineRef.current?.setKey(a, false);
    };
    const blur = () => {
      engineRef.current?.releaseAllKeys();
      if (screen === "playing") togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, paused, chooseAnswer, togglePause, replay, audio]);

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

  const scale = (screenWidth ?? 960) / W;
  const labelFont = (text: string) => {
    const max = (early ? 9 : 7.5) * scale;
    const fit = (LABEL_W * scale) / (Math.max(3, text.length) * 0.56);
    return `${Math.max(8, Math.min(max, fit))}px`;
  };
  const waveOpen = !!wave && wave.result === null && wave.picked === null;

  return (
    <div className={`wi-root ${early ? "early" : ""}`}>
      <div className="wi-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="wi-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="wi-cabinet">
        <div className="wi-hud wi-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Wave</span><span className="val">{hud.level}</span></div>
          <div>
            <span className="lbl">Lives</span>
            <span className="val lives">{"▰".repeat(Math.max(0, hud.lives))}</span>
            {hud.streak > 1 && <span className="streak">×{Math.min(hud.streak, 5)}</span>}
          </div>
        </div>

        {screen === "playing" && wave && (
          <QuestionBanner
            wave={wave}
            danger={hud.danger}
            readAloud={readAloud}
            onChoose={chooseAnswer}
            onReplay={replay}
            open={waveOpen && !paused}
          />
        )}

        <div className="wi-stage" ref={stageRef}>
          <div className="wi-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Web Invaders game screen" />

            {screen === "playing" &&
              wave &&
              wave.q.choices.map((c, i) => (
                <button
                  key={`${wave.q.id}-${i}`}
                  type="button"
                  ref={(el) => (labelRefs.current[i] = el)}
                  className="wi-label"
                  style={{ display: "none", width: `${(LABEL_W / W) * 100}%`, fontSize: labelFont(c) }}
                  tabIndex={-1}
                  aria-label={`Answer ${"ABCD"[i]}: ${c}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    chooseAnswer(i);
                  }}
                >
                  {c}
                </button>
              ))}

            {screen === "title" && (
              <TitleScreen
                grade={grade}
                onGrade={chooseGrade}
                onStart={startGame}
                highScore={highScore}
              />
            )}

            {screen === "playing" && paused && (
              <div className="wi-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="wi-title wi-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="wi-cta" onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                score={hud.score}
                level={hud.level}
                grade={grade}
                highScore={highScore}
                onAgain={() => startGame(mode)}
                onMenu={() => {
                  engineRef.current?.demo();
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`wi-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="wi-pad">
            <button className="wi-touch wi-pixel" {...touchProps("left")} aria-label="Move left">◀</button>
            <button className="wi-touch wi-pixel" {...touchProps("right")} aria-label="Move right">▶</button>
          </div>
          <div className="wi-pad">
            <button className="wi-touch big fire wi-pixel" {...touchProps("fire")}>FIRE</button>
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

function QuestionBanner({
  wave, danger, readAloud, onChoose, onReplay, open,
}: {
  wave: WaveView;
  danger: number;
  readAloud: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
  open: boolean;
}) {
  const { q, result } = wave;
  let head = `WAVE ${wave.level} — SHOOT THE RIGHT ANSWER · PRESS A–D OR TAP`;
  if (wave.picked !== null && !result) head = `WEB AWAY → ${"ABCD"[wave.picked]}`;
  if (result === "correct") head = `✔ CORRECT! +${wave.bonus} · WAVE CLEARED`;
  if (result === "wrong") head = "✘ NOT QUITE — THE RIGHT ANSWER IS FLASHING";
  if (result === "invaded") head = "⚠ THE INVADERS LANDED";
  const info = result
    ? result === "correct"
      ? q.explanation
      : `Answer: ${"ABCD"[q.answer]}) ${q.choices[q.answer]}. ${q.explanation}`
    : "Shoot the invader carrying the right answer, or pick its letter to throw a homing web.";
  return (
    <div className={`wi-banner ${result ?? ""}`}>
      <div className="head wi-pixel">
        <span>{head}</span>
        <span className="std">
          {SUBJECT_LABELS[q.subject]} · {q.standard}
        </span>
      </div>
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
          const state = result && i === q.answer ? "ans" : wave.picked === i ? (result ? "wrong" : "picked") : "";
          return (
            <button
              key={i}
              type="button"
              className={`opt ${state}`}
              disabled={!open}
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
      <div className={`info ${result ? "" : "hint"}`}>{info}</div>
      <div className="danger" aria-hidden="true">
        <div className="fill" style={{ width: `${Math.round(danger * 100)}%` }} />
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
  return (
    <div className="wi-overlay" style={{ background: "rgba(10,15,46,0.6)" }}>
      <div className="wi-panel" style={{ borderColor: "var(--wi-red)" }}>
        <div className="wi-title wi-pixel">WEB INVADERS</div>
        <div className="wi-sub wi-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>

        {!gradeFromArcade() && <div className="wi-h wi-pixel" style={{ marginTop: 14 }}>1. PICK YOUR GRADE</div>}
        {gradeFromArcade() ? (
        <div className="wi-sub wi-pixel" style={{ marginTop: 12 }}>
          {gradeLabel(grade).toUpperCase()} ·{" "}
          <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
        </div>
        ) : (
        <div className="wi-grades" role="radiogroup" aria-label="Grade">
          {GRADES.map((g) => (
            <button
              key={g}
              role="radio"
              aria-checked={g === grade}
              className={`wi-grade wi-pixel ${g === grade ? "on" : ""}`}
              onClick={() => onGrade(g)}
              title={gradeLabel(g)}
            >
              {g}
            </button>
          ))}
        </div>
        )}

        <div className="wi-h wi-pixel" style={{ marginTop: 12 }}>{gradeFromArcade() ? "" : "2. "}PICK A SUBJECT TO START · {gradeLabel(grade).toUpperCase()}</div>
        <div className="wi-subjects">
          {MODES.map((m) => (
            <button key={m} className="wi-subject" onClick={() => onStart(m)}>
              {m === "mixed" ? "MIXED" : SUBJECT_LABELS[m]}
              <small>{subjectNote(m, grade)}</small>
            </button>
          ))}
        </div>
        <div className="wi-help">
          <kbd>◀</kbd> <kbd>▶</kbd> move &nbsp;·&nbsp; <kbd>SPACE</kbd>/<kbd>Z</kbd>/<kbd>X</kbd> shoot webs &nbsp;·&nbsp;{" "}
          <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> homing web at an answer &nbsp;·&nbsp; <kbd>P</kbd> pause &nbsp;·&nbsp;{" "}
          <kbd>M</kbd> mute &nbsp;·&nbsp; <kbd>R</kbd> read aloud
          <br />
          Bug invaders are marching on the city! Each wave carries a question. Web the invader holding the{" "}
          <span style={{ color: "var(--wi-green)" }}>right answer</span> to clear the whole wave. Hide behind the web shields.
        </div>
        <div className="wi-help" style={{ marginTop: 6, color: "var(--wi-dim)" }}>
          HI-SCORE {String(highScore).padStart(6, "0")}
        </div>
      </div>
    </div>
  );
}

function MissionReport({
  log, score, level, grade, highScore, onAgain, onMenu,
}: {
  log: AnswerLog[]; score: number; level: number; grade: Grade; highScore: number;
  onAgain: () => void; onMenu: () => void;
}) {
  const bySubject = (["math", "science", "ela"] as const)
    .map((s) => {
      const items = log.filter((l) => l.q.subject === s);
      return { s, n: items.length, c: items.filter((l) => l.correct).length };
    })
    .filter((x) => x.n > 0);

  const byStd = new Map<string, { skill: string; n: number; c: number }>();
  for (const l of log) {
    const cur = byStd.get(l.q.standard) ?? { skill: l.q.skill, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.q.standard, cur);
  }
  const practice = [...byStd.entries()].filter(([, v]) => v.c < v.n);
  const total = log.length;
  const right = log.filter((l) => l.correct).length;

  return (
    <div className="wi-overlay">
      <div className="wi-panel">
        <div className="wi-h wi-pixel" style={{ color: "var(--wi-red)" }}>
          CITY OVERRUN — MISSION REPORT · {gradeLabel(grade).toUpperCase()}
        </div>
        <div className="wi-help" style={{ fontSize: 22 }}>
          Score <b style={{ color: "var(--wi-yellow)" }}>{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached wave{" "}
          <b style={{ color: "var(--wi-cyan)" }}>{level}</b> · Answered {right}/{total} correctly
        </div>
        {bySubject.length > 0 && (
          <div className="wi-help" style={{ marginTop: 6 }}>
            {bySubject.map((b) => (
              <span key={b.s} style={{ marginRight: 16 }}>
                <span className={`wi-tag wi-pixel ${b.s}`}>{SUBJECT_LABELS[b.s]}</span>
                {b.c}/{b.n}
              </span>
            ))}
          </div>
        )}
        {byStd.size > 0 && (
          <table className="wi-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td style={{ color: "var(--wi-cyan)" }}>{std}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: v.c === v.n ? "var(--wi-green)" : "var(--wi-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="wi-help" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--wi-yellow)" }}>Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
            These will come up more often next time.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="wi-cta ghost" onClick={onMenu}>Change grade / subject</button>
          <button className="wi-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

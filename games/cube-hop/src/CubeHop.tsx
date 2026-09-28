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
} from "@/kit";
import { HopEngine, MAX_SHIELD, ROUNDS_PER_LEVEL, spoken, type HudState, type RoundView } from "@/hop/engine";
import type { Dir } from "@/hop/geom";
import { RoundDeck, blurb, specId, type RoundSpec, type SubjectMode } from "@/content";
import "@/hop/hop.css";

const GAME_ID = "cube-hop";

type Screen = "title" | "playing" | "over";

interface LogEntry {
  subject: string;
  standard: string;
  skill: string;
  correct: boolean;
  kind: "round" | "checkpoint";
  what?: string;
}

/** Arrow keys are the four diagonals: ↑ up-right, → down-right, ↓ down-left, ← up-left. */
const KEYMAP: Record<string, Dir> = {
  ArrowUp: "ur",
  ArrowRight: "dr",
  ArrowDown: "dl",
  ArrowLeft: "ul",
};

/** Cube Hop's own 16-step bassline (a springy D-minor hop, Hz; 0 = rest). */
const BASS = [147, 0, 220, 147, 0, 175, 196, 0, 131, 0, 196, 131, 147, 0, 220, 262];

const SUBJECT_LABELS: Record<string, string> = { ela: "ELA", math: "MATH", science: "SCIENCE", social: "SOCIAL STUDIES" };
const MODES: SubjectMode[] = ["ela", "math", "science", "mixed"];

const EMPTY_HUD: HudState = { score: 0, lives: 3, shield: MAX_SHIELD, level: 1, streak: 0, round: 1 };

function roundWhat(spec: RoundSpec): string {
  return spec.kind === "build" ? spec.item.tokens.join(" ") : spec.rule.target.toLowerCase();
}

export default function CubeHop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HopEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 132), []);
  const deckRef = useRef<QuestionDeck | null>(null);
  const roundDeckRef = useRef<RoundDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [mode, setMode] = useState<SubjectMode>("ela");
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [view, setView] = useState<RoundView | null>(null);
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

  const addLog = useCallback((e: LogEntry) => setLog((l) => [...l, e]), []);

  const demoSpec = useCallback((g: Grade, m: SubjectMode) => {
    try {
      return new RoundDeck(g, m === "mixed" ? "ela" : m).next();
    } catch {
      return undefined;
    }
  }, []);

  // Create the engine once; a hero hops about behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new HopEngine(canvas, audio, {
      onHud: setHud,
      nextRound: () => roundDeckRef.current!.next(),
      onView: setView,
      say: (text) => {
        if (readAloudRef.current && text) speak(text);
      },
      onRoundClear: (spec, clean) => {
        const s = spec.kind === "build" ? spec.item : spec.rule;
        addLog({ subject: spec.subject, standard: s.standard, skill: s.skill, correct: clean, kind: "round", what: roundWhat(spec) });
        if (!clean) roundDeckRef.current?.retry(spec);
      },
      onLevelClear: (level) => {
        const q = deckRef.current?.draw() ?? null;
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
      },
    });
    engineRef.current = engine;
    // Playtest hook: ?debug exposes the engine to automated tests.
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __ch: HopEngine }).__ch = engine;
    engine.demo(gradeRef.current, demoSpec(gradeRef.current, "ela"));
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, addLog, demoSpec]);

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
    engineRef.current?.demo(g, demoSpec(g, mode));
  }, [demoSpec, mode]);

  const chooseMode = useCallback((m: SubjectMode) => {
    setMode(m);
    engineRef.current?.demo(gradeRef.current, demoSpec(gradeRef.current, m));
  }, [demoSpec]);

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    deckRef.current = new QuestionDeck(grade, mode, { gameId: GAME_ID });
    roundDeckRef.current = new RoundDeck(grade, mode);
    setLog([]);
    setCheckpoint(null);
    setPaused(false);
    setView(null);
    setScreen("playing");
    engineRef.current?.newGame(grade);
  }, [audio, grade, mode]);

  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || picked !== null) return;
      setPicked(i);
      const correct = i === checkpoint.q.answer;
      if (correct) audio.correct();
      else audio.wrong();
      recordAnswer(GAME_ID, checkpoint.q, correct);
      addLog({ subject: checkpoint.q.subject, standard: checkpoint.q.standard, skill: checkpoint.q.skill, correct, kind: "checkpoint" });
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
    else if (engineRef.current) speak(engineRef.current.sayPrompt());
  }, [checkpoint]);

  const choose = useCallback((i: number) => {
    audio.unlock();
    engineRef.current?.pick(i);
  }, [audio]);

  const hopDir = useCallback((d: Dir) => {
    audio.unlock();
    engineRef.current?.hop(d);
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
      const d = KEYMAP[ev.key];
      if (d) {
        ev.preventDefault();
        if (!ev.repeat) hopDir(d);
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
  }, [screen, checkpoint, picked, paused, answerCheckpoint, continueFromCheckpoint, togglePause, replay, choose, hopDir, audio]);

  const padProps = (d: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      hopDir(d);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  // Tap a cube on the screen: an adjacent cube is one hop; a farther one is an auto-hop.
  const onScreenTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing" || checkpoint || paused) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320;
    const y = ((e.clientY - r.top) / r.height) * 200;
    audio.unlock();
    engineRef.current?.tapAt(x, y);
  };

  const cpSubject = checkpoint?.q.subject;

  return (
    <div className={`ch-root ${early ? "early" : ""}`}>
      <div className="ch-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="ch-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`ch-cabinet ${touch && screen === "playing" ? "touch-on" : ""}`}>
        <div className="ch-hud ch-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Lvl</span><span className="val">{hud.level}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"▰".repeat(Math.max(0, hud.lives))}</span></div>
          <div>
            <span className="lbl">Shield</span>
            <span className="val shield">
              {Array.from({ length: MAX_SHIELD }, (_, i) => (
                <span key={i} className={i < hud.shield ? "on" : "off"}>◆</span>
              ))}
            </span>
            {hud.streak > 1 && <span className="streak">×{Math.min(hud.streak, 5)}</span>}
          </div>
        </div>

        {screen === "playing" && view ? (
          <RoundBanner
            view={view}
            hud={hud}
            touch={touch}
            readAloud={readAloud}
            open={!paused && !checkpoint && !view.solved}
            onChoose={choose}
            onReplay={replay}
          />
        ) : (
          <div className="ch-banner idle">
            <div className="prompt"><span className="dim">{gradeLabel(grade)} · {blurb(grade, mode)}</span></div>
          </div>
        )}

        <div className="ch-stage" ref={stageRef}>
          <div className="ch-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Cube Hop game screen" onPointerDown={onScreenTap} />

            {screen === "title" && (
              <TitleScreen grade={grade} mode={mode} onGrade={chooseGrade} onMode={chooseMode} onStart={startGame} highScore={highScore} />
            )}

            {screen === "playing" && checkpoint && (
              <div className="ch-overlay">
                <div className="ch-panel" role="dialog" aria-label="Transmission question">
                  <div className="ch-h ch-pixel ch-blink">◆ INCOMING TRANSMISSION — AFTER LEVEL {checkpoint.level}</div>
                  <div className="ch-tagrow">
                    <span className={`ch-tag ch-pixel ${cpSubject}`}>{cpSubject ? SUBJECT_LABELS[cpSubject] : ""}</span>
                    <span className="ch-tag ch-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                    {speechSupported() && (
                      <button className="ch-speak" onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)} aria-label="Read the question aloud">
                        <SpeakerIcon />
                      </button>
                    )}
                  </div>
                  {checkpoint.q.passage && <div className="ch-passage">{checkpoint.q.passage}</div>}
                  <div className="ch-prompt">{checkpoint.q.prompt}</div>
                  <div className="ch-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                      return (
                        <button key={i} className={`ch-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <div className="ch-feedback">
                      {picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! SHIELDS FULL · +{500 * checkpoint.level}</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — THE ANSWER IS {"ABCD"[checkpoint.q.answer]} · +1 SHIELD</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="ch-cta" autoFocus onClick={continueFromCheckpoint}>Next level ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !checkpoint && (
              <div className="ch-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="ch-title ch-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="ch-cta" onClick={() => togglePause(false)}>Resume</button>
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
                  engineRef.current?.demo(grade, demoSpec(grade, mode));
                  setView(null);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`ch-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="ch-pad diag">
            <button className="ch-touch diag" {...padProps("ul")} aria-label="Hop up-left">↖</button>
            <button className="ch-touch diag" {...padProps("dl")} aria-label="Hop down-left">↙</button>
          </div>
          <div className="ch-legend">
            Left thumb hops left, right thumb hops right. Tap a cube, or tap an answer above to auto-hop there.
          </div>
          <div className="ch-pad diag">
            <button className="ch-touch diag" {...padProps("ur")} aria-label="Hop up-right">↗</button>
            <button className="ch-touch diag" {...padProps("dr")} aria-label="Hop down-right">↘</button>
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

function RoundBanner({
  view, hud, touch, readAloud, open, onChoose, onReplay,
}: {
  view: RoundView;
  hud: HudState;
  touch: boolean;
  readAloud: boolean;
  open: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
}) {
  const { spec, msg, solved } = view;
  const s = spec.kind === "build" ? spec.item : spec.rule;
  const kindText = spec.kind === "build" ? "BUILD IT: HOP THE CUBES IN ORDER" : `COLOR THE CATEGORY: ${spec.rule.target}`;
  const head = solved ? `✔ ROUND CLEAR` : `LEVEL ${hud.level} · ROUND ${hud.round}/${ROUNDS_PER_LEVEL} · ${kindText}`;
  const state = solved ? "correct" : msg && !msg.ok ? "wrong" : "";
  const info = msg
    ? msg.text
    : view.hint
      ? "Hint: the flashing cube is the one you need."
      : touch
        ? "Hop with the diagonal pads, or tap a cube next to the hero. Tap an answer (or a farther cube) to auto-hop there."
        : "Hop with the arrow keys (↑ ↗, → ↘, ↓ ↙, ← ↖), or press A–D / 1–4 (or tap an answer or a cube) to auto-hop there.";
  const prompt = spec.kind === "build" ? spec.item.prompt : spec.rule.prompt;
  return (
    <div className={`ch-banner ${state}`} data-round={specId(spec)}>
      <div className="head ch-pixel">
        <span className="kind">{head}</span>
        <span className="std">{SUBJECT_LABELS[spec.subject]} · {s.standard} · {s.skill}</span>
      </div>
      <div className="prompt">
        {speechSupported() && (
          <button type="button" className={`ch-speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read it aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        <span className="ptext">{prompt}</span>
        {spec.kind === "build" ? (
          <span className="tray" aria-label="Built so far">
            {Array.from({ length: view.total }, (_, i) => (
              <span key={i} className={`cell ${i < view.built.length ? "done" : i === view.built.length ? "next" : ""}`}>
                {i < view.built.length ? view.built[i] : "_"}
              </span>
            ))}
          </span>
        ) : (
          <span className="rule">{view.found}/{view.total}</span>
        )}
      </div>
      <div className="opts">
        {view.options.map((label, i) => (
          <button
            key={`${label}-${i}`}
            type="button"
            className="opt"
            disabled={!open}
            aria-label={`Choice ${"ABCD"[i]}: ${spoken(label)}`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (open) onChoose(i);
            }}
          >
            <b>{"ABCD"[i]}</b>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className={`info ${msg ? (msg.ok ? "ok" : "no") : "hint"}`}>{info}</div>
    </div>
  );
}

function subjectNote(m: SubjectMode, g: Grade): string {
  if (m === "mixed") return "All three, in turn";
  const course = courseName(g, m);
  return course ?? blurb(g, m).split(",")[0];
}

function TitleScreen({
  grade, mode, onGrade, onMode, onStart, highScore,
}: {
  grade: Grade; mode: SubjectMode; onGrade: (g: Grade) => void; onMode: (m: SubjectMode) => void; onStart: () => void; highScore: number;
}) {
  const fromArcade = gradeFromArcade();
  return (
    <div className="ch-overlay" style={{ background: "rgba(5,8,24,0.6)" }}>
      <div className="ch-panel title">
        <div className="ch-title ch-pixel">CUBE HOP</div>
        <div className="ch-sub ch-pixel">SPIDERBEN10'S ARCADE · NC K–12 · GRAMMAR, MATH &amp; SCIENCE</div>
        {fromArcade ? (
          <div className="ch-sub ch-pixel ch-badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="ch-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={g === grade}
                className={`ch-grade ch-pixel ${g === grade ? "on" : ""}`}
                onClick={() => onGrade(g)}
                title={gradeLabel(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="ch-subjects" role="radiogroup" aria-label="Subject">
          {MODES.map((m) => (
            <button key={m} role="radio" aria-checked={m === mode} className={`ch-subject ${m === mode ? "on" : ""}`} onClick={() => onMode(m)}>
              {m === "mixed" ? "MIXED" : SUBJECT_LABELS[m]}
              <small>{subjectNote(m, grade)}</small>
            </button>
          ))}
        </div>
        <div className="ch-help center">
          <b className="gl">{gradeLabel(grade)}</b> — {blurb(grade, mode)}
        </div>
        <div style={{ textAlign: "center", margin: "12px 0 10px" }}>
          <button className="ch-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="ch-help">
          Arrow keys hop diagonally: <kbd>↑</kbd> up-right · <kbd>→</kbd> down-right · <kbd>↓</kbd> down-left · <kbd>←</kbd> up-left ·{" "}
          <kbd>A</kbd>–<kbd>D</kbd>/<kbd>1</kbd>–<kbd>4</kbd> auto-hop to an answer · <kbd>R</kbd> read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute
          <br />
          Every cube you land on changes color. <span className="y">Build it</span> rounds: hop the word cubes in order to build the
          sentence or a true equation. <span className="y">Color</span> rounds: color every cube that fits the rule. Wrong cubes cost a
          shield. Dodge the zap-balls and the Glitch, ride a side pad back to the top, and don't hop off the edge!
        </div>
        <div className="ch-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
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
  const byStd = new Map<string, { std: string; skill: string; subject: string; kinds: Set<string>; n: number; c: number }>();
  for (const l of log) {
    const key = `${l.standard}|${l.skill}`;
    const cur = byStd.get(key) ?? { std: l.standard, skill: l.skill, subject: l.subject, kinds: new Set<string>(), n: 0, c: 0 };
    cur.n++;
    cur.kinds.add(l.kind);
    if (l.correct) cur.c++;
    byStd.set(key, cur);
  }
  const cps = log.filter((l) => l.kind === "checkpoint");
  const rounds = log.filter((l) => l.kind === "round");
  const practice = [...byStd.values()].filter((v) => v.c / v.n < 0.75);
  const missed = [...new Set(rounds.filter((l) => !l.correct).map((l) => l.what!))];

  return (
    <div className="ch-overlay">
      <div className="ch-panel">
        <div className="ch-h ch-pixel" style={{ color: "var(--ch-red)" }}>OUT OF LIVES — MISSION REPORT</div>
        <div className="ch-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached level <b className="c">{level}</b> · {gradeLabel(grade)}
        </div>
        <div className="ch-help" style={{ marginTop: 4 }}>
          Rounds with no mistakes {rounds.filter((l) => l.correct).length}/{rounds.length} · Transmissions {cps.filter((l) => l.correct).length}/{cps.length}
        </div>
        {byStd.size > 0 && (
          <table className="ch-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([key, v]) => (
                <tr key={key}>
                  <td className="c">{v.std}</td>
                  <td>{v.skill}</td>
                  <td className="dim">{[...v.kinds].map((k) => (k === "round" ? "cube rounds" : "questions")).join(" + ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--ch-green)" : v.c / v.n >= 0.75 ? "var(--ch-yellow)" : "var(--ch-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="ch-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}.
          </div>
        )}
        {missed.length > 0 && (
          <div className="ch-help" style={{ marginTop: 6 }}>
            <span className="y">To review:</span> {missed.slice(0, 6).join(" · ")}. Missed rounds come back sooner next time.
          </div>
        )}
        {log.length === 0 && <div className="ch-help" style={{ marginTop: 10 }}>No rounds cleared yet. Try the auto-hop: press A–D or tap an answer.</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="ch-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="ch-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

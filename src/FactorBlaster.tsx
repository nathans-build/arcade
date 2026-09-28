import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
  courseName,
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
import { BlasterEngine, MAX_SHIELD, type Action, type HudState } from "@/blaster/engine";
import { gradeInfo, type Rule } from "@/blaster/splits";
import "@/blaster/blaster.css";

const GAME_ID = "factor-blaster";

type Screen = "title" | "playing" | "over";

interface LogEntry {
  standard: string;
  skill: string;
  correct: boolean;
  kind: "checkpoint" | "blast";
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
  ArrowUp: "thrust", w: "thrust", W: "thrust",
  " ": "fire", z: "fire", Z: "fire", x: "fire", X: "fire",
};

/** Factor Blaster's own 16-step bassline (D minor, Hz; 0 = rest). */
const BASS = [73, 0, 110, 73, 147, 0, 131, 110, 87, 0, 131, 87, 98, 110, 131, 147];

const EMPTY_HUD: HudState = { score: 0, lives: 3, shield: MAX_SHIELD, level: 1, streak: 0, rule: null };

export default function FactorBlaster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BlasterEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 150), []);
  const deckRef = useRef<QuestionDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("4"));
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; level: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("4"))));
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

  // Create the engine once; it drifts rocks behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new BlasterEngine(canvas, audio, {
      onHud: setHud,
      onLevelStart: (_level: number, rule: Rule) => {
        if (readAloudRef.current) speak(rule.say);
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
      onRuleShot: (rule, ok) => addLog({ standard: rule.standard, skill: rule.skill, correct: ok, kind: "blast" }),
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
      },
    });
    engineRef.current = engine;
    // Playtest hook: ?debug exposes the engine to automated tests.
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __fb: BlasterEngine }).__fb = engine;
    engine.demo(grade);
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
    // The engine is created once; grade changes are pushed to it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    deckRef.current = new QuestionDeck(grade, "math", { gameId: GAME_ID });
    setLog([]);
    setCheckpoint(null);
    setPaused(false);
    setScreen("playing");
    engineRef.current?.newGame(grade);
  }, [audio, grade]);

  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || picked !== null) return;
      setPicked(i);
      const correct = i === checkpoint.q.answer;
      if (correct) audio.correct();
      else audio.wrong();
      recordAnswer(GAME_ID, checkpoint.q, correct);
      addLog({ standard: checkpoint.q.standard, skill: checkpoint.q.skill, correct, kind: "checkpoint" });
      if (readAloudRef.current) speak(`${correct ? "Correct!" : "Not quite."} ${checkpoint.q.explanation}`);
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
    setPaused(e.togglePause(force));
  }, []);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      if (checkpoint) {
        const k = ev.key.toLowerCase();
        const idx = "1234".includes(k) && k.length === 1 ? Number(k) - 1 : "abcd".indexOf(k);
        if (picked === null && idx >= 0 && ev.key.length === 1) {
          ev.preventDefault();
          answerCheckpoint(idx);
        } else if (picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          continueFromCheckpoint();
        }
        return;
      }
      if (ev.key === "p" || ev.key === "P" || ev.key === "Escape") {
        togglePause();
        return;
      }
      const a = KEYMAP[ev.key];
      if (a) {
        ev.preventDefault();
        if (!ev.repeat || a !== "fire") engineRef.current?.setKey(a, true);
      }
    };
    const up = (ev: KeyboardEvent) => {
      const a = KEYMAP[ev.key];
      if (a) engineRef.current?.setKey(a, false);
    };
    const blur = () => {
      engineRef.current?.releaseAllKeys();
      if (screen === "playing" && !checkpoint) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, checkpoint, picked, answerCheckpoint, continueFromCheckpoint, togglePause, audio]);

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

  const rule = hud.rule;

  return (
    <div className={`fb-root ${early ? "early" : ""}`}>
      <div className="fb-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="fb-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && <button onClick={toggleReadAloud}>{readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}</button>}
        </div>
      </div>

      <div className={`fb-cabinet ${touch && screen === "playing" ? "touch-on" : ""}`}>
        <div className="fb-hud fb-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Ships</span><span className="val ships">{"▲".repeat(Math.max(0, hud.lives))}</span></div>
          <div>
            <span className="lbl">Shield</span>
            <span className="val shield">
              {Array.from({ length: MAX_SHIELD }, (_, i) => (
                <span key={i} className={i < hud.shield ? "on" : "off"}>◆</span>
              ))}
            </span>
          </div>
          <div><span className="lbl">Lvl</span><span className="val">{hud.level}</span></div>
        </div>

        <div className="fb-rule" aria-live="polite">
          {screen === "playing" && rule ? (
            <>
              <span className="fb-pixel tag">TARGET</span>
              <span className="txt">{rule.text}</span>
              <span className="note">Gold cores = safe{hud.streak > 1 ? ` · STREAK ×${Math.min(hud.streak, 5)}` : ""}</span>
              {readAloud && (
                <button className="fb-speak" onClick={() => speak(rule.say)} aria-label="Read the target aloud">🔊</button>
              )}
            </>
          ) : (
            <span className="txt dim">{gradeLabel(grade)} · {gradeInfo(grade).example}</span>
          )}
        </div>

        <div className="fb-stage" ref={stageRef}>
          <div className="fb-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Factor Blaster game screen" />

            {screen === "title" && (
              <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />
            )}

            {screen === "playing" && checkpoint && (
              <div className="fb-overlay">
                <div className="fb-panel" role="dialog" aria-label="Transmission question">
                  <div className="fb-h fb-pixel fb-blink">◆ INCOMING TRANSMISSION — AFTER LEVEL {checkpoint.level}</div>
                  <div className="fb-tagrow">
                    <span className="fb-tag fb-pixel math">MATH</span>
                    <span className="fb-tag fb-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                    {speechSupported() && (
                      <button
                        className="fb-speak"
                        onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)}
                        aria-label="Read the question aloud"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                  {checkpoint.q.passage && <div className="fb-passage">{checkpoint.q.passage}</div>}
                  <div className="fb-prompt">{checkpoint.q.prompt}</div>
                  <div className="fb-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                      return (
                        <button key={i} className={`fb-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <div className="fb-feedback">
                      {picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! SHIELDS FULL · +{500 * checkpoint.level}</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — +1 SHIELD</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="fb-cta" autoFocus onClick={continueFromCheckpoint}>Next level ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !checkpoint && (
              <div className="fb-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="fb-title fb-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="fb-cta" onClick={() => togglePause(false)}>Resume</button>
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
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`fb-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="fb-pad">
            <button className="fb-touch fb-pixel" {...touchProps("left")} aria-label="Rotate left">⟲</button>
            <button className="fb-touch fb-pixel" {...touchProps("right")} aria-label="Rotate right">⟳</button>
          </div>
          <div className="fb-pad">
            <button className="fb-touch big thrust fb-pixel" {...touchProps("thrust")}>THRUST</button>
            <button className="fb-touch big fire fb-pixel" {...touchProps("fire")}>FIRE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TitleScreen({
  grade, onGrade, onStart, highScore,
}: {
  grade: Grade; onGrade: (g: Grade) => void; onStart: () => void; highScore: number;
}) {
  const info = gradeInfo(grade);
  const course = courseName(grade, "math");
  return (
    <div className="fb-overlay" style={{ background: "rgba(5,8,24,0.55)" }}>
      <div className="fb-panel title">
        <div className="fb-title fb-pixel">FACTOR BLASTER</div>
        <div className="fb-sub fb-pixel">SPIDERBEN10'S ARCADE · NC MATH K–12</div>
        <div className="fb-grades" role="radiogroup" aria-label="Grade">
          {GRADES.map((g) => (
            <button
              key={g}
              role="radio"
              aria-checked={g === grade}
              className={`fb-grade fb-pixel ${g === grade ? "on" : ""}`}
              onClick={() => onGrade(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="fb-help center">
          <b className="gl">{gradeLabel(grade)}{course ? ` · ${course}` : ""}</b> — {info.blurb}
          <br />
          <span className="ex">{info.example}</span> <span className="dim">({info.standard} · {info.skill})</span>
        </div>
        <div style={{ textAlign: "center", margin: "14px 0 10px" }}>
          <button className="fb-cta" autoFocus onClick={onStart}>Launch ▶</button>
        </div>
        <div className="fb-help">
          <kbd>◀</kbd> <kbd>▶</kbd> rotate · <kbd>↑</kbd> thrust · <kbd>SPACE</kbd>/<kbd>Z</kbd>/<kbd>X</kbd> fire · <kbd>P</kbd> pause · <kbd>M</kbd> mute
          <br />
          Shoot a number rock and it splits so you can see the math. Each level has a <span className="y">TARGET</span> rule — only
          blast rocks that follow it! Gold cores are always safe. Clear the level to get a transmission question.
        </div>
        <div className="fb-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
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
  const byStd = new Map<string, { skill: string; kinds: Set<string>; n: number; c: number }>();
  for (const l of log) {
    const cur = byStd.get(l.standard) ?? { skill: l.skill, kinds: new Set<string>(), n: 0, c: 0 };
    cur.n++;
    cur.kinds.add(l.kind);
    if (l.correct) cur.c++;
    byStd.set(l.standard, cur);
  }
  const cps = log.filter((l) => l.kind === "checkpoint");
  const shots = log.filter((l) => l.kind === "blast");
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);
  const info = gradeInfo(grade);

  return (
    <div className="fb-overlay">
      <div className="fb-panel">
        <div className="fb-h fb-pixel" style={{ color: "var(--fb-red)" }}>ALL SHIPS LOST — MISSION REPORT</div>
        <div className="fb-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached level <b className="c">{level}</b> ·{" "}
          {gradeLabel(grade)}
        </div>
        <div className="fb-help" style={{ marginTop: 4 }}>
          Transmissions {cps.filter((l) => l.correct).length}/{cps.length} · Target shots {shots.filter((l) => l.correct).length}/{shots.length} ·
          Splitting: {info.skill} ({info.standard})
        </div>
        {byStd.size > 0 && (
          <table className="fb-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td className="c">{std}</td>
                  <td>{v.skill}</td>
                  <td className="dim">{[...v.kinds].map((k) => (k === "blast" ? "rocks" : "questions")).join(" + ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--fb-green)" : v.c / v.n >= 0.75 ? "var(--fb-yellow)" : "var(--fb-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="fb-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="fb-cta ghost" onClick={onMenu}>Change grade</button>
          <button className="fb-cta" autoFocus onClick={onAgain}>Launch again ▶</button>
        </div>
      </div>
    </div>
  );
}

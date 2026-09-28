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
import { H, ShieldEngine, W, type Action, type HudState, type WaveSummary } from "@/shield/engine";
import { gradeSkills, sayMath, type Round } from "@/shield/missions";
import "@/shield/shield.css";

const GAME_ID = "city-shield";

/** City Shield's own 16-step bassline (A minor march, Hz; 0 = rest). */
const BASS = [110, 0, 110, 0, 131, 0, 110, 98, 87, 0, 87, 0, 98, 0, 110, 131];

type Screen = "title" | "playing" | "over";

interface LogEntry {
  standard: string;
  skill: string;
  correct: boolean;
  kind: "checkpoint" | "missile";
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

const EMPTY_HUD: HudState = { score: 0, wave: 1, cities: 6, ammo: [0, 0, 0], streak: 0, threats: [] };

export default function CityShield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ShieldEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 128), []);
  const deckRef = useRef<QuestionDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("5"));
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [round, setRound] = useState<Round | null>(null);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; summary: WaveSummary } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("5"))));
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

  // Create the engine once; labelled missiles fall behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new ShieldEngine(canvas, audio, {
      onHud: setHud,
      onWaveStart: (r) => {
        setRound(r);
        if (readAloudRef.current) speak(r.say);
      },
      onDecision: (r, _o, correct) => addLog({ standard: r.standard, skill: r.skill, correct, kind: "missile" }),
      onWaveEnd: (summary) => {
        const q = deckRef.current?.draw() ?? null;
        if (!q) {
          engine.resolveCheckpoint(false);
          return;
        }
        setPicked(null);
        setCheckpoint({ q, summary });
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
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __cs: ShieldEngine }).__cs = engine;
    engine.demo(initialGrade("5"));
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

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    deckRef.current = new QuestionDeck(grade, "math", { gameId: GAME_ID });
    setLog([]);
    setCheckpoint(null);
    setPaused(false);
    setScreen("playing");
    (document.activeElement as HTMLElement | null)?.blur?.();
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
    (document.activeElement as HTMLElement | null)?.blur?.();
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

  const hudRef = useRef(hud);
  hudRef.current = hud;
  const replay = useCallback(() => {
    if (!round) return;
    const threats = hudRef.current.threats.map((t) => `${t.letter}: ${sayMath(t.label)}.`).join(" ");
    speak(`${round.say} ${threats}`);
  }, [round]);

  const chooseThreat = useCallback((i: number) => {
    audio.unlock();
    engineRef.current?.selectThreat(i);
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
      const idx = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (checkpoint) {
        if (picked === null && idx >= 0) {
          ev.preventDefault();
          answerCheckpoint(idx);
        } else if (picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          continueFromCheckpoint();
        }
        return;
      }
      if (k === "p" || ev.key === "Escape") {
        togglePause();
        return;
      }
      if (paused) return;
      if (idx >= 0) {
        ev.preventDefault();
        if (!ev.repeat) chooseThreat(idx);
        return;
      }
      if (k === "r") {
        replay();
        return;
      }
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        if (!ev.repeat) engineRef.current?.setKey("fire", true);
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
      if (ev.key === " " || ev.key === "Enter") engineRef.current?.setKey("fire", false);
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
  }, [screen, checkpoint, picked, paused, answerCheckpoint, continueFromCheckpoint, togglePause, replay, chooseThreat, audio]);

  // Mouse / touch on the game screen: tap a missile to auto-target it, or tap the sky to fire there.
  const toLogical = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing" || checkpoint) return;
    e.preventDefault();
    audio.unlock();
    const p = toLogical(e);
    engineRef.current?.tap(p.x, p.y);
  };
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing" || e.pointerType !== "mouse") return;
    const p = toLogical(e);
    engineRef.current?.aim(p.x, p.y);
  };

  const ammo = hud.ammo.reduce((a, b) => a + b, 0);

  return (
    <div className={`cs-root ${early ? "early" : ""}`}>
      <div className="cs-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="cs-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="cs-cabinet">
        <div className="cs-hud cs-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Wave</span><span className="val">{hud.wave}</span></div>
          <div><span className="lbl">Cities</span><span className="val cities">{"▰".repeat(hud.cities)}<span className="lost">{"▱".repeat(6 - hud.cities)}</span></span></div>
          <div>
            <span className="lbl">Webs</span><span className="val">{screen === "playing" ? ammo : "—"}</span>
            {hud.streak > 1 && <span className="streak">×{Math.min(hud.streak, 5)}</span>}
          </div>
        </div>

        <div className={`cs-target ${round?.mode === "wrong" ? "wrong" : ""}`} aria-live="polite">
          {screen === "playing" && round ? (
            <>
              {round.mode === "match" ? (
                <>
                  <span className="cs-pixel tag">TARGET</span>
                  <span className="val">{round.targetText}</span>
                </>
              ) : (
                <span className="cs-pixel tag red">STOP THE WRONG ANSWERS</span>
              )}
              {round.context && <span className="ctx">{round.context}</span>}
              <span className="note">{round.mode === "match" ? `Stop missiles = ${round.targetShort || round.targetText}` : "Shoot only the mistakes"} · {round.standard}</span>
              {speechSupported() && (
                <button type="button" className={`cs-speak ${readAloud ? "on" : ""}`} onClick={replay} aria-label="Read the target aloud" title="Read aloud (R)">
                  <SpeakerIcon />
                </button>
              )}
            </>
          ) : (
            <span className="val dim">{gradeLabel(grade)} · Missile Command with math</span>
          )}
        </div>

        <div className="cs-stage" ref={stageRef}>
          <div className="cs-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas
              ref={canvasRef}
              aria-label="City Shield game screen"
              onPointerDown={onCanvasDown}
              onPointerMove={onCanvasMove}
              onContextMenu={(e) => e.preventDefault()}
              style={{ cursor: screen === "playing" ? "crosshair" : "default" }}
            />

            {screen === "title" && <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />}

            {screen === "playing" && checkpoint && (
              <div className="cs-overlay">
                <div className="cs-panel" role="dialog" aria-label="Transmission question">
                  <div className="cs-h cs-pixel cs-blink">◆ INCOMING TRANSMISSION — AFTER WAVE {checkpoint.summary.wave}</div>
                  <div className="cs-help small">
                    Stopped {checkpoint.summary.stopped} · Wasted webs on {checkpoint.summary.wasted} decoy{checkpoint.summary.wasted === 1 ? "" : "s"} · Hits taken {checkpoint.summary.landed} · Cities {checkpoint.summary.cities}/6.
                    {checkpoint.summary.cities < 6 ? " Answer right to rebuild a city!" : " Answer right for a bonus!"}
                  </div>
                  <div className="cs-tagrow">
                    <span className="cs-tag cs-pixel math">MATH</span>
                    <span className="cs-tag cs-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                    {speechSupported() && (
                      <button className="cs-speak" onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)} aria-label="Read the question aloud">
                        <SpeakerIcon />
                      </button>
                    )}
                  </div>
                  {checkpoint.q.passage && <div className="cs-passage">{checkpoint.q.passage}</div>}
                  <div className="cs-prompt">{checkpoint.q.prompt}</div>
                  <div className="cs-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                      return (
                        <button key={i} className={`cs-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <div className="cs-feedback">
                      {picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! {checkpoint.summary.cities < 6 ? "A CITY IS REBUILT" : "+250 BONUS"}</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — THE ANSWER IS {"ABCD"[checkpoint.q.answer]}</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="cs-cta" autoFocus onClick={continueFromCheckpoint}>Next wave ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                grade={grade}
                score={hud.score}
                wave={hud.wave}
                highScore={highScore}
                onAgain={startGame}
                onMenu={() => {
                  engineRef.current?.demo(grade);
                  setRound(null);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`cs-threats ${screen === "playing" && !checkpoint ? "show" : ""} ${touch ? "touch" : ""}`}>
          {[0, 1, 2, 3].map((i) => {
            const t = hud.threats.find((x) => x.letter === "ABCD"[i]);
            return (
              <button
                key={i}
                type="button"
                className={`cs-threat ${t ? "" : "empty"} ${t?.locked ? "locked" : ""}`}
                disabled={!t || paused}
                onPointerDown={(e) => {
                  e.preventDefault();
                  chooseThreat(i);
                }}
                aria-label={t ? `Target ${"ABCD"[i]}: ${t.label}` : `Slot ${"ABCD"[i]} empty`}
              >
                <b className="cs-pixel">{"ABCD"[i]}</b>
                <span>{t ? t.label : "—"}</span>
              </button>
            );
          })}
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

function TitleScreen({
  grade, onGrade, onStart, highScore,
}: {
  grade: Grade; onGrade: (g: Grade) => void; onStart: () => void; highScore: number;
}) {
  const course = courseName(grade, "math");
  const skills = gradeSkills(grade);
  return (
    <div className="cs-overlay" style={{ background: "rgba(10,15,46,0.55)" }}>
      <div className="cs-panel title">
        <div className="cs-title cs-pixel">CITY SHIELD</div>
        <div className="cs-sub cs-pixel">SPIDERBEN10'S ARCADE · NC MATH K–12</div>
        {gradeFromArcade() ? (
          <div className="cs-sub cs-pixel badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="cs-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={g === grade}
                className={`cs-grade cs-pixel ${g === grade ? "on" : ""}`}
                onClick={() => onGrade(g)}
                title={gradeLabel(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="cs-help center">
          <b className="gl">{gradeLabel(grade)}{course ? ` · ${course}` : ""}</b> —{" "}
          {skills.map((s, i) => (
            <span key={s.key}>
              {i > 0 && " · "}
              {s.skill} <span className="dim">({s.standard})</span>
            </span>
          ))}
        </div>
        <div style={{ textAlign: "center", margin: "12px 0 10px" }}>
          <button className="cs-cta" autoFocus onClick={onStart}>Defend the city ▶</button>
        </div>
        <div className="cs-help">
          Missiles are falling on the city, and each one carries some math. Only the ones that equal the{" "}
          <span className="y">TARGET</span> are live: stop them with your web blasts. The rest are decoys that burn up
          by themselves, so don't waste webs on them! Some waves say <span className="r">STOP THE WRONG ANSWERS</span>.
          <br />
          <kbd>A</kbd>–<kbd>D</kbd> / <kbd>1</kbd>–<kbd>4</kbd> or tap a missile: auto-target it · <kbd>←↑↓→</kbd> + <kbd>SPACE</kbd> or
          click the sky: fire at the crosshair · <kbd>P</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud
        </div>
        <div className="cs-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function MissionReport({
  log, grade, score, wave, highScore, onAgain, onMenu,
}: {
  log: LogEntry[]; grade: Grade; score: number; wave: number; highScore: number;
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
  const shots = log.filter((l) => l.kind === "missile");
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);

  return (
    <div className="cs-overlay">
      <div className="cs-panel">
        <div className="cs-h cs-pixel" style={{ color: "var(--cs-red)" }}>THE CITY HAS FALLEN — MISSION REPORT</div>
        <div className="cs-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached wave <b className="c">{wave}</b> · {gradeLabel(grade)}
        </div>
        <div className="cs-help" style={{ marginTop: 4 }}>
          Missile calls {shots.filter((l) => l.correct).length}/{shots.length} right · Transmissions {cps.filter((l) => l.correct).length}/{cps.length}
        </div>
        {byStd.size > 0 && (
          <table className="cs-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td className="c">{std}</td>
                  <td>{v.skill}</td>
                  <td className="dim">{[...v.kinds].map((k) => (k === "missile" ? "missiles" : "questions")).join(" + ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--cs-green)" : v.c / v.n >= 0.75 ? "var(--cs-yellow)" : "var(--cs-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 ? (
          <div className="cs-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
          </div>
        ) : (
          log.length > 0 && <div className="cs-help" style={{ marginTop: 10 }}><span className="y">Practice next:</span> try the next grade up, or beat your high score!</div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="cs-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="cs-cta" autoFocus onClick={onAgain}>Defend again ▶</button>
        </div>
      </div>
    </div>
  );
}

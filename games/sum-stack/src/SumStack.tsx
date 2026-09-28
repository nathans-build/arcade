import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
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
  gradeFromArcade,
} from "@/kit";
import { StackEngine, type Action, type HudState, type PowerUp, type RowStat } from "@/stack/engine";
import { plainLabel } from "@/stack/font";
import { exampleText, ruleFor, type Rule } from "@/stack/rules";
import "@/stack/stack.css";

const GAME_ID = "sum-stack";

type Screen = "title" | "playing" | "over";

interface AnswerLog {
  q: DealtQuestion;
  correct: boolean;
}

/** Sum Stack's own 16-step bassline (Hz, 0 = rest): a bouncy climb in A minor. */
const BASS = [110, 0, 165, 110, 131, 0, 165, 196, 147, 0, 220, 147, 165, 196, 0, 247];

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "soft",
  ArrowUp: "rotate",
  x: "rotate", X: "rotate",
  z: "rotateCcw", Z: "rotateCcw",
  " ": "drop",
};

const POWERS: Record<PowerUp, { name: string; text: string }> = {
  blast: { name: "ROW BLAST", text: "The bottom two rows of your stack are blasted away!" },
  slow: { name: "SLOW-MO", text: "Blocks fall slower for 45 seconds." },
  wild: { name: "WILD ? CELL", text: "Your next piece has a ? block. It becomes exactly the number its row needs!" },
};

const EMPTY_HUD: HudState = { score: 0, level: 1, lines: 0, goal: 6, combo: 0, perfects: 0 };

export default function SumStack() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<StackEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 150), []);
  const deckRef = useRef<QuestionDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade());
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [rule, setRule] = useState<Rule>(() => ruleFor(grade, 1));
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; level: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [power, setPower] = useState<PowerUp | null>(null);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [rowStats, setRowStats] = useState<Record<string, RowStat>>({});
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(grade)));
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

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

  // Create the engine once; it runs the attract-mode demo behind the title screen.
  useEffect(() => {
    const engine = new StackEngine(canvasRef.current!, audio, {
      onHud: setHud,
      onRule: (r) => {
        setRule(r);
        if (readAloudRef.current) speak(`Level ${r.level}. ${r.speakText}`);
      },
      onCheckpoint: (level) => {
        const q = deckRef.current?.draw() ?? null;
        if (!q) {
          engine.resolveCheckpoint(true, null);
          return;
        }
        setPicked(null);
        setPower(null);
        setCheckpoint({ q, level });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onPerfect: (_eq, speech) => {
        if (readAloudRef.current && isEarlyReader(engine.grade)) speak(speech);
      },
      onGameOver: () => {
        setRowStats({ ...engine.rowStats });
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
      },
    });
    engineRef.current = engine;
    engine.demo(grade, rule);
    engine.start();
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __sumStack: unknown }).__sumStack = { engine };
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
    const r = ruleFor(g, 1);
    setRule(r);
    engineRef.current?.demo(g, r);
  }, []);

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    deckRef.current = new QuestionDeck(grade, "math", { gameId: GAME_ID });
    setLog([]);
    setRowStats({});
    setCheckpoint(null);
    setPaused(false);
    setScreen("playing");
    engineRef.current?.newGame(grade, rule.level === 1 ? rule : undefined);
  }, [audio, grade, rule]);

  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || picked !== null) return;
      setPicked(i);
      const correct = i === checkpoint.q.answer;
      if (correct) {
        audio.correct();
        const tall = (engineRef.current?.height ?? 0) >= 8;
        const options: PowerUp[] = ["blast", "slow", "wild", "wild"];
        const p = tall ? "blast" : options[Math.floor(Math.random() * options.length)];
        setPower(p);
        if (readAloudRef.current) speak(`Correct! Power up: ${POWERS[p].name}. ${checkpoint.q.explanation}`);
      } else {
        audio.wrong();
        if (readAloudRef.current) speak(`Not quite. ${checkpoint.q.explanation}`);
      }
      recordAnswer(GAME_ID, checkpoint.q, correct);
      setLog((l) => [...l, { q: checkpoint.q, correct }]);
    },
    [checkpoint, picked, audio],
  );

  const continueFromCheckpoint = useCallback(() => {
    if (!checkpoint || picked === null) return;
    engineRef.current?.resolveCheckpoint(picked === checkpoint.q.answer, power);
    setCheckpoint(null);
    setPicked(null);
    setPower(null);
  }, [checkpoint, picked, power]);

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
        engineRef.current?.setKey(a, true);
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

  const early = isEarlyReader(grade);

  return (
    <div className={`ss-root ${early ? "ss-early" : ""}`}>
      <div className="ss-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && <button onClick={toggleReadAloud}>{readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}</button>}
        </div>
      </div>

      <div className="ss-cabinet">
        <div className="ss-hud ss-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">{grade === "K" ? "" : "Gr"}</span><span className="val">{grade === "K" ? "K" : grade}</span> <span className="rule">{plainLabel(rule.title)}</span></div>
          <div><span className="lbl">Perfect</span><span className="val">{hud.perfects}</span></div>
        </div>

        <div className="ss-stage" ref={stageRef}>
          <div className="ss-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Sum Stack game screen" />

            {screen === "title" && (
              <TitleScreen grade={grade} rule={rule} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />
            )}

            {screen === "playing" && checkpoint && (
              <div className="ss-overlay">
                <div className="ss-panel" role="dialog" aria-label="Transmission question">
                  <div className="ss-h ss-pixel ss-blink">◆ INCOMING TRANSMISSION — LEVEL {checkpoint.level} CLEAR</div>
                  <div>
                    <span className="ss-tag ss-pixel math">MATH</span>
                    <span className="ss-tag ss-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                  </div>
                  <div className="ss-prompt">{checkpoint.q.prompt}</div>
                  <div className="ss-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                      return (
                        <button key={i} className={`ss-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {speechSupported() && picked === null && (
                    <div style={{ marginTop: 10 }}>
                      <button className="ss-cta ghost small" onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)}>
                        ♪ Read it to me
                      </button>
                    </div>
                  )}
                  {picked !== null && (
                    <div className="ss-feedback">
                      {picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! +{1000 * checkpoint.level} · POWER-UP!</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — NO POWER-UP THIS TIME</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      {power && (
                        <div className="ss-power">
                          ★ {POWERS[power].name}: {POWERS[power].text}
                        </div>
                      )}
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="ss-cta" autoFocus onClick={continueFromCheckpoint}>Next level ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !checkpoint && (
              <div className="ss-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="ss-title ss-pixel">PAUSED</div>
                  <div className="ss-help" style={{ margin: "14px 0" }}>{plainLabel(rule.title)} {rule.context.map(plainLabel).join(" · ")}</div>
                  <button className="ss-cta" onClick={() => togglePause(false)}>Resume</button>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                rowStats={rowStats}
                score={hud.score}
                level={hud.level}
                perfects={hud.perfects}
                highScore={highScore}
                onAgain={startGame}
                onMenu={() => {
                  const r = ruleFor(grade, 1);
                  engineRef.current?.demo(grade, r);
                  setRule(r);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`ss-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="ss-pad">
            <button className="ss-touch ss-pixel" {...touchProps("left")} aria-label="Move left">◀</button>
            <button className="ss-touch ss-pixel" {...touchProps("right")} aria-label="Move right">▶</button>
            <button className="ss-touch ss-pixel" {...touchProps("soft")} aria-label="Soft drop">▼</button>
          </div>
          <div className="ss-pad">
            <button className="ss-touch big rot ss-pixel" {...touchProps("rotate")}>ROTATE</button>
            <button className="ss-touch big drop ss-pixel" {...touchProps("drop")}>DROP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TitleScreen({
  grade, rule, onGrade, onStart, highScore,
}: {
  grade: Grade; rule: Rule; onGrade: (g: Grade) => void; onStart: () => void; highScore: number;
}) {
  const example = useMemo(() => exampleText(rule), [rule]);
  return (
    <div className="ss-overlay" style={{ background: "rgba(10,15,46,0.6)" }}>
      <div className="ss-panel" style={{ borderColor: "var(--ss-red)" }}>
        <div className="ss-title ss-pixel">SUM STACK</div>
        <div className="ss-sub ss-pixel">SPIDERBEN10'S ARCADE · K–12 MATH · NC STANDARDS</div>
        {gradeFromArcade() ? (
        <div className="ss-sub ss-pixel" style={{ marginTop: 12 }}>
          {gradeLabel(grade).toUpperCase()} ·{" "}
          <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
        </div>
        ) : (
        <div className="ss-grades" role="radiogroup" aria-label="Grade">
          {GRADES.map((g) => (
            <button key={g} role="radio" aria-checked={g === grade} className={`ss-grade ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)}>
              {g}
            </button>
          ))}
        </div>
        )}
        <div className="ss-rulebox">
          <b>{gradeLabel(grade)}: {plainLabel(rule.title)}</b>
          {rule.context.length > 0 && <> · {rule.context.map(plainLabel).join(" · ")}</>} — like <b>{example}</b>
          <br />
          <span style={{ color: "var(--ss-dim)" }}>{rule.standard} · {rule.skill}</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <button className="ss-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="ss-help">
          <kbd>◀</kbd> <kbd>▶</kbd> move · <kbd>↑</kbd>/<kbd>X</kbd> rotate · <kbd>↓</kbd> soft drop · <kbd>SPACE</kbd> drop · <kbd>P</kbd> pause · <kbd>M</kbd> mute
          <br />
          Every block has a number. A full row clears — but a row whose numbers make the{" "}
          <span style={{ color: "var(--ss-yellow)" }}>TARGET</span> exactly clears right away as a{" "}
          <span style={{ color: "var(--ss-red)" }}>PERFECT ROW</span> for big points and combos! Watch the row totals on the right.
          Clear a level to get a transmission question — answer it for a power-up.
        </div>
        <div className="ss-help" style={{ marginTop: 8, color: "var(--ss-dim)" }}>
          HI-SCORE {String(highScore).padStart(6, "0")} · Created by SpiderBen10 (NZDO)
        </div>
      </div>
    </div>
  );
}

function MissionReport({
  log, rowStats, score, level, perfects, highScore, onAgain, onMenu,
}: {
  log: AnswerLog[]; rowStats: Record<string, RowStat>; score: number; level: number; perfects: number; highScore: number;
  onAgain: () => void; onMenu: () => void;
}) {
  const byStd = new Map<string, { skill: string; n: number; c: number; perfect: number; full: number }>();
  for (const [std, s] of Object.entries(rowStats)) byStd.set(std, { skill: s.skill, n: 0, c: 0, perfect: s.perfect, full: s.full });
  for (const l of log) {
    const cur = byStd.get(l.q.standard) ?? { skill: l.q.skill, n: 0, c: 0, perfect: 0, full: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.q.standard, cur);
  }
  const practice = [...byStd.entries()].filter(([, v]) => v.c < v.n);
  const right = log.filter((l) => l.correct).length;

  return (
    <div className="ss-overlay">
      <div className="ss-panel">
        <div className="ss-h ss-pixel" style={{ color: "var(--ss-red)" }}>STACK TOPPED OUT — MISSION REPORT</div>
        <div className="ss-help" style={{ fontSize: 22 }}>
          Score <b style={{ color: "var(--ss-yellow)" }}>{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Level <b style={{ color: "var(--ss-sky)" }}>{level}</b> · Perfect rows{" "}
          <b style={{ color: "var(--ss-yellow)" }}>{perfects}</b> · Transmissions {right}/{log.length}
        </div>
        {byStd.size > 0 && (
          <table className="ss-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>ROWS</th><th>QUESTIONS</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td style={{ color: "var(--ss-sky)" }}>{std}</td>
                  <td>{v.skill}</td>
                  <td>{v.perfect || v.full ? `${v.perfect} perfect · ${v.full} full` : "—"}</td>
                  <td style={{ color: v.n === 0 ? undefined : v.c === v.n ? "var(--ss-green)" : "var(--ss-red)" }}>{v.n ? `${v.c}/${v.n}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="ss-help" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--ss-yellow)" }}>Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="ss-cta ghost" onClick={onMenu}>Change grade</button>
          <button className="ss-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

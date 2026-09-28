import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipAudio } from "@/lunar/audio";
import { LunarEngine, SECTOR_LETTERS, WAVE_TIME, type Action, type HudState, type WaveResult } from "@/lunar/engine";
import {
  QuestionDeck,
  SUBJECT_LABELS,
  loadProgress,
  saveProgress,
  type DealtQuestion,
  type Grade,
  type Progress,
  type SubjectMode,
} from "@/lunar/questions";
import {
  GRADES,
  arcadeLink,
  courseName,
  gradeLabel,
  initialGrade,
  isEarlyReader,
  readAloudPref,
  rememberGrade,
  setReadAloudPref,
  speak,
  speakQuestion,
  speechSupported,
  stopSpeaking,
  gradeFromArcade,
} from "@/kit";
import "@/lunar/lunar.css";

type Screen = "title" | "playing" | "over";

interface AnswerLog {
  q: DealtQuestion;
  correct: boolean;
  kind: "checkpoint" | "wave";
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
  ArrowUp: "jump", w: "jump", W: "jump", " ": "jump",
  z: "fire", Z: "fire", x: "fire", X: "fire", f: "fire", F: "fire", Control: "fire",
};

const MODES: { mode: SubjectMode; label: string; note: string }[] = [
  { mode: "math", label: "MATH", note: "Numbers · Shapes · Problem solving" },
  { mode: "science", label: "SCIENCE", note: "Earth · Life · Physical" },
  { mode: "ela", label: "ELA", note: "Reading · Words · Grammar" },
  { mode: "mixed", label: "MIXED", note: "All three subjects" },
];

const EMPTY_HUD: HudState = { score: 0, lives: 3, fuel: 100, sector: 0, sectorProgress: 0, streak: 0, waveTimeLeft: null, roverColor: "#e24ae2" };

export default function LunarPatrol({ standalone = false }: { standalone?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LunarEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(), []);
  const deckRef = useRef<QuestionDeck | null>(null);
  const progressRef = useRef<Progress>(loadProgress());

  const [screen, setScreen] = useState<Screen>("title");
  const [grade, setGradeState] = useState<Grade>(() => initialGrade("6"));
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("6"))));
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const [mode, setMode] = useState<SubjectMode>("mixed");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; sector: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [wave, setWave] = useState<{ q: DealtQuestion; result: WaveResult | null } | null>(null);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [overReason, setOverReason] = useState<"lives" | "fuel">("lives");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(progressRef.current.highScore);
  const waveHideTimer = useRef<number | null>(null);
  const [waveChoice, setWaveChoice] = useState<number | null>(null);
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

  const record = useCallback((q: DealtQuestion, correct: boolean, kind: AnswerLog["kind"]) => {
    const p = progressRef.current;
    const s = p.standards[q.standard] ?? { seen: 0, correct: 0 };
    p.standards[q.standard] = { seen: s.seen + 1, correct: s.correct + (correct ? 1 : 0) };
    saveProgress(p);
    setLog((l) => [...l, { q, correct, kind }]);
  }, []);

  // Create the engine once; it runs the attract-mode demo behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new LunarEngine(canvas, audio, {
      onHud: setHud,
      onCheckpoint: (sector) => {
        const q = deckRef.current?.draw() ?? null;
        if (!q) {
          engine.resolveCheckpoint(true);
          return;
        }
        setPicked(null);
        setCheckpoint({ q, sector });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      requestWaveQuestion: () => deckRef.current?.draw(true) ?? null,
      onWaveStart: (q) => {
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
        if (waveHideTimer.current) clearTimeout(waveHideTimer.current);
        setWaveChoice(null);
        setWave({ q, result: null });
      },
      onWaveEnd: (q, result) => {
        record(q, result === "correct", "wave");
        setWave({ q, result });
        if (waveHideTimer.current) clearTimeout(waveHideTimer.current);
        waveHideTimer.current = window.setTimeout(() => setWave(null), 3500);
      },
      onGameOver: (reason) => {
        setOverReason(reason);
        const p = progressRef.current;
        if (engine.score > p.highScore) {
          p.highScore = engine.score;
          saveProgress(p);
          setHighScore(engine.score);
        }
        setScreen("over");
      },
    });
    engineRef.current = engine;
    engine.demo();
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
    };
  }, [audio, record]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const startGame = useCallback(
    (m: SubjectMode) => {
      audio.unlock();
      audio.startMusic();
      setMode(m);
      rememberGrade(grade);
      deckRef.current = new QuestionDeck(m, grade);
      engineRef.current?.setEasy(isEarlyReader(grade));
      setLog([]);
      setCheckpoint(null);
      setWave(null);
      setPaused(false);
      setScreen("playing");
      engineRef.current?.newGame();
    },
    [audio, grade],
  );

  const chooseGrade = useCallback((g: Grade) => {
    setGradeState(g);
    rememberGrade(g);
    // Early readers get read-aloud by default unless they've set it themselves.
    setReadAloud(readAloudPref(isEarlyReader(g)));
  }, []);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || picked !== null) return;
      setPicked(i);
      const correct = i === checkpoint.q.answer;
      if (correct) audio.correct();
      else audio.wrong();
      if (readAloudRef.current) speak(correct ? `Correct! ${checkpoint.q.explanation}` : `The answer is ${checkpoint.q.choices[checkpoint.q.answer]}. ${checkpoint.q.explanation}`);
      record(checkpoint.q, correct, "checkpoint");
    },
    [checkpoint, picked, audio, record],
  );

  const continueFromCheckpoint = useCallback(() => {
    if (!checkpoint || picked === null) return;
    stopSpeaking();
    engineRef.current?.resolveCheckpoint(picked === checkpoint.q.answer);
    setCheckpoint(null);
    setPicked(null);
  }, [checkpoint, picked]);

  const chooseWaveAnswer = useCallback((i: number) => {
    if (engineRef.current?.selectWaveAnswer(i)) setWaveChoice(i);
  }, []);

  const togglePause = useCallback((force?: boolean) => {
    const e = engineRef.current;
    if (!e) return;
    setPaused(e.togglePause(force));
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
        const idx = ["1", "2", "3", "4"].indexOf(ev.key) >= 0 ? Number(ev.key) - 1 : "abcd".indexOf(ev.key.toLowerCase());
        if (picked === null && idx >= 0 && ev.key.length === 1) {
          ev.preventDefault();
          answerCheckpoint(idx);
        } else if (picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          continueFromCheckpoint();
        }
        return;
      }
      if (wave && !wave.result && ev.key.length === 1) {
        // Quiz Squadron: A-D / 1-4 fires an answer missile (takes priority over A/D steering).
        const k = ev.key.toLowerCase();
        const idx = "1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k);
        if (idx >= 0) {
          ev.preventDefault();
          chooseWaveAnswer(idx);
          return;
        }
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
  }, [screen, checkpoint, picked, wave, answerCheckpoint, continueFromCheckpoint, chooseWaveAnswer, togglePause, audio]);

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

  const letter = SECTOR_LETTERS[hud.sector % 26];
  const nextLetter = SECTOR_LETTERS[(hud.sector + 1) % 26];

  return (
    <div className="lp-root">
      <div className="lp-toolbar">
        {standalone ? <a href={arcadeLink(grade)}>◀ ARCADE</a> : <a href="/">◀ STORY SQUAD</a>}
        <div style={{ display: "flex", gap: 16 }}>
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && <button onClick={toggleReadAloud}>{readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}</button>}
        </div>
      </div>

      <div className="lp-cabinet">
        <div className="lp-hud lp-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Rovers</span><span className="val" style={{ color: hud.roverColor }}>{"▰".repeat(Math.max(0, hud.lives))}</span></div>
          <div className="lp-fuel">
            <span className="lbl">Fuel</span>
            <div className="bar"><div className={`fill ${hud.fuel < 25 ? "low" : ""}`} style={{ width: `${hud.fuel}%` }} /></div>
          </div>
        </div>

        {/* Sector progress track, like the arcade's A–E–J–O–T–Z meter */}
        <div className="lp-track lp-pixel" aria-label={`Sector ${letter}`}>
          <span className="tick on" style={{ left: "0%" }}>{letter}</span>
          <span className="tick" style={{ left: "100%", transform: "translateX(-100%)" }}>{nextLetter}</span>
          {hud.streak > 1 && (
            <span className="tick on" style={{ left: "50%" }}>STREAK ×{Math.min(hud.streak, 5)}</span>
          )}
          <div className="car" style={{ left: `${hud.sectorProgress * 100}%` }} />
        </div>

        <div className="lp-stage" ref={stageRef}>
        <div className="lp-screen" style={screenWidth ? { width: screenWidth } : undefined}>
          <canvas ref={canvasRef} aria-label="Lunar Patrol game screen" />

          {screen === "playing" && wave && <WaveBanner wave={wave} timeLeft={hud.waveTimeLeft} choice={waveChoice} onChoose={chooseWaveAnswer} />}

          {screen === "title" && <TitleScreen onStart={startGame} highScore={highScore} progress={progressRef.current} grade={grade} onGrade={chooseGrade} />}

          {screen === "playing" && checkpoint && (
            <div className="lp-overlay">
              <div className="lp-panel" role="dialog" aria-label="Checkpoint question">
                <div className="lp-h lp-pixel lp-blink">◆ INCOMING TRANSMISSION — CHECKPOINT {SECTOR_LETTERS[checkpoint.sector % 26]}</div>
                <div>
                  <span className={`lp-tag lp-pixel ${checkpoint.q.subject}`}>{SUBJECT_LABELS[checkpoint.q.subject]}</span>
                  <span className="lp-tag lp-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                </div>
                {checkpoint.q.passage && <div className="lp-passage">{checkpoint.q.passage}</div>}
                <div className="lp-prompt">{checkpoint.q.prompt}</div>
                <div className="lp-choices">
                  {checkpoint.q.choices.map((c, i) => {
                    const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                    return (
                      <button key={i} className={`lp-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                        <span className="key">{"ABCD"[i]}</span>
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
                {picked !== null && (
                  <div className="lp-feedback">
                    {picked === checkpoint.q.answer ? (
                      <div className="verdict ok">✔ CORRECT! +FUEL · +{1000 * Math.min(hud.streak + 1, 5)}</div>
                    ) : (
                      <div className="verdict no">✘ NOT QUITE — SMALL FUEL RATION</div>
                    )}
                    <div>{checkpoint.q.explanation}</div>
                    <div style={{ marginTop: 12, textAlign: "right" }}>
                      <button className="lp-cta" autoFocus onClick={continueFromCheckpoint}>Continue ▶</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {screen === "playing" && paused && !checkpoint && (
            <div className="lp-overlay">
              <div style={{ textAlign: "center" }}>
                <div className="lp-title lp-pixel">PAUSED</div>
                <div style={{ marginTop: 20 }}>
                  <button className="lp-cta" onClick={() => togglePause(false)}>Resume</button>
                </div>
              </div>
            </div>
          )}

          {screen === "over" && (
            <MissionReport
              log={log}
              score={hud.score}
              sector={hud.sector}
              reason={overReason}
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

        {screen === "playing" && wave && <WaveBanner wave={wave} timeLeft={hud.waveTimeLeft} choice={waveChoice} onChoose={chooseWaveAnswer} below />}

        <div className={`lp-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="lp-pad">
            <button className="lp-touch lp-pixel" {...touchProps("left")} aria-label="Slow down">◀</button>
            <button className="lp-touch lp-pixel" {...touchProps("right")} aria-label="Speed up">▶</button>
          </div>
          <div className="lp-pad">
            <button className="lp-touch big jump lp-pixel" {...touchProps("jump")}>JUMP</button>
            <button className="lp-touch big fire lp-pixel" {...touchProps("fire")}>FIRE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaveBanner({
  wave, timeLeft, choice, onChoose, below,
}: {
  wave: { q: DealtQuestion; result: WaveResult | null };
  timeLeft: number | null;
  choice: number | null;
  onChoose: (i: number) => void;
  below?: boolean;
}) {
  return (
    <div className={`lp-wave ${below ? "below" : ""}`}>
      <div className="head">
        <span>{wave.result ? resultLabel(wave.result) : "▲ QUIZ SQUADRON — PRESS A–D OR TAP AN ANSWER TO FIRE"}</span>
        <span>{SUBJECT_LABELS[wave.q.subject]} · {wave.q.standard}</span>
      </div>
      <div>{wave.q.prompt}</div>
      <div className="opts">
        {wave.q.choices.map((c, i) => (
          <button
            key={i}
            type="button"
            className={`opt ${wave.result && i === wave.q.answer ? "ans" : ""} ${choice === i ? "picked" : ""}`}
            disabled={wave.result !== null || choice !== null}
            onPointerDown={(e) => {
              e.preventDefault();
              onChoose(i);
            }}
          >
            <b>{"ABCD"[i]})</b> {c}
          </button>
        ))}
      </div>
      {wave.result && wave.result !== "correct" && <div style={{ color: "#b8c0f0", marginTop: 4 }}>{wave.q.explanation}</div>}
      {!wave.result && <div className="timer" style={{ width: `${((timeLeft ?? 0) / WAVE_TIME) * 100}%` }} />}
    </div>
  );
}

function resultLabel(r: WaveResult) {
  if (r === "correct") return "✔ DIRECT HIT! RIGHT ANSWER";
  if (r === "wrong") return "✘ WRONG UFO — THE RIGHT ANSWER IS FLASHING";
  return "⌛ THE SQUADRON ESCAPED";
}

function TitleScreen({
  onStart, highScore, progress, grade, onGrade,
}: {
  onStart: (m: SubjectMode) => void; highScore: number; progress: Progress; grade: Grade; onGrade: (g: Grade) => void;
}) {
  const seenStandards = Object.keys(progress.standards).length;
  const course = courseName(grade, "math");
  return (
    <div className="lp-overlay" style={{ background: "rgba(0,0,16,0.55)" }}>
      <div className="lp-panel" style={{ borderColor: "var(--lp-magenta)" }}>
        <div className="lp-title lp-pixel">LUNAR PATROL</div>
        <div className="lp-sub lp-pixel">ACADEMY · {gradeLabel(grade).toUpperCase()} · NC STANDARDS</div>
        {gradeFromArcade() ? (
        <div className="lp-sub lp-pixel" style={{ marginTop: 12 }}>
          {gradeLabel(grade).toUpperCase()} ·{" "}
          <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
        </div>
        ) : (
        <div className="lp-grades" role="group" aria-label="Grade level">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              className={`lp-grade lp-pixel ${g === grade ? "on" : ""}`}
              aria-pressed={g === grade}
              aria-label={gradeLabel(g)}
              onClick={() => onGrade(g)}
            >
              {g}
            </button>
          ))}
        </div>
        )}
        {course && <div className="lp-sub" style={{ marginTop: 4 }}>High school: {course} · {courseName(grade, "ela")} · {courseName(grade, "science")}</div>}
        <div className="lp-subjects">
          {MODES.map((m) => (
            <button key={m.mode} className="lp-subject" onClick={() => onStart(m.mode)}>
              {m.label}
              <small>{m.note}</small>
            </button>
          ))}
        </div>
        <div className="lp-help">
          <kbd>◀</kbd> <kbd>▶</kbd> slow / speed up &nbsp;·&nbsp; <kbd>↑</kbd>/<kbd>SPACE</kbd> jump craters &amp; rocks &nbsp;·&nbsp;{" "}
          <kbd>Z</kbd>/<kbd>X</kbd> fire forward + up &nbsp;·&nbsp; <kbd>P</kbd> pause &nbsp;·&nbsp; <kbd>M</kbd> mute
          <br />
          Your rover burns fuel as it drives. Answer Moon Base's transmission at every checkpoint to refuel. Mid-sector, a{" "}
          <span style={{ color: "var(--lp-green)" }}>Quiz Squadron</span> flies in — shoot the UFO carrying the right answer!
        </div>
        <div className="lp-help" style={{ marginTop: 8, color: "var(--lp-dim)" }}>
          HI-SCORE {String(highScore).padStart(6, "0")} · Standards practiced: {seenStandards}
        </div>
      </div>
    </div>
  );
}

function MissionReport({
  log, score, sector, reason, highScore, onAgain, onMenu,
}: {
  log: AnswerLog[]; score: number; sector: number; reason: "lives" | "fuel"; highScore: number;
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
    <div className="lp-overlay">
      <div className="lp-panel">
        <div className="lp-h lp-pixel" style={{ color: "var(--lp-red)" }}>
          {reason === "fuel" ? "OUT OF FUEL" : "ALL ROVERS LOST"} — MISSION REPORT
        </div>
        <div className="lp-help" style={{ fontSize: 22 }}>
          Score <b style={{ color: "var(--lp-yellow)" }}>{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached sector{" "}
          <b style={{ color: "var(--lp-cyan)" }}>{SECTOR_LETTERS[sector % 26]}</b> · Answered {right}/{total} correctly
        </div>
        {bySubject.length > 0 && (
          <div className="lp-help" style={{ marginTop: 6 }}>
            {bySubject.map((b) => (
              <span key={b.s} style={{ marginRight: 16 }}>
                <span className={`lp-tag lp-pixel ${b.s}`}>{SUBJECT_LABELS[b.s]}</span>
                {b.c}/{b.n}
              </span>
            ))}
          </div>
        )}
        {byStd.size > 0 && (
          <table className="lp-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td style={{ color: "var(--lp-cyan)" }}>{std}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: v.c === v.n ? "var(--lp-green)" : "var(--lp-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="lp-help" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--lp-yellow)" }}>Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
            These will come up more often in your next mission.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="lp-cta ghost" onClick={onMenu}>Change subject</button>
          <button className="lp-cta" autoFocus onClick={onAgain}>Launch again ▶</button>
        </div>
      </div>
    </div>
  );
}

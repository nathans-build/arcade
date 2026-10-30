import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipAudio, exposeMusicDebug } from "@/kit/audio";
import { arcadeLink } from "@/kit/grades";
import { loadProgress, recordAnswer, submitScore } from "@/kit/progress";
import { readAloudPref, setReadAloudPref, speak, speakQuestion, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade } from "@/kit/types";
import { DojoEngine } from "@/dojo/engine";
import { PRACTICES, practicePlan, retryPlan, type FloorPlan, type Practice } from "@/dojo/bosses";
import { METER_MAX, STAR_BURST, STAR_GOAL, type BossResult } from "@/dojo/rules";
import { START_LIVES, MAX_ENERGY, type Hud } from "@/dojo/sim";
import { U3Deck } from "@/dojo/u3deck";
import { tagName, type Combo, type Model, type U3Question } from "@/dojo/unit3";
import { ATTEMPT_LOG_MAX, GAME_ID, loadAttempts, loadPractice, saveAttempts, savePractice, tagRows, toCSV, toJSON, type Attempt } from "@/dojo/attempts";
import { JINGLES, SONGS, floorSong } from "@/music";
import "@/dojo/dojo.css";

/*
 * Dojo Tower: Rates & Percents — SpiderBen10's special edition (Math 6 · Unit 3).
 * The climb and fights are Dojo Tower's; the questions follow docs/math6-unit3.md.
 */

const GRADE: Grade = "6";

type Screen = "title" | "playing" | "over" | "won";

interface ComboState {
  c: Combo;
  /** -1: the final-answer question; 0..n-1: the step being asked. */
  phase: number;
  /** "Work so far" lines from finished steps. */
  work: string[];
}

interface Quiz {
  kind: "boss" | "scroll";
  floor: number;
  q: U3Question;
  picked: number | null;
  result: BossResult | null;
  /** Hint stages shown (0-2). */
  hints: number;
  combo?: ComboState;
}

const EMPTY_HUD: Hud = {
  score: 0, lives: START_LIVES, energy: MAX_ENERGY, floor: 1, meter: 0, streak: 0, mode: "intro", bossHp: 0, bossMaxHp: 0, progress: 0,
  stars: 0, burst: 0,
};

const HELD_KEYS: Record<string, "left" | "right" | "down"> = { ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down" };

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

/** The question as shown on the canvas card (a combo's final question without its story). */
function cardPrompt(quiz: Quiz): string {
  if (quiz.combo && quiz.combo.phase === -1) return quiz.q.prompt.slice(quiz.combo.c.story.length).trim();
  return quiz.q.prompt;
}

function download(name: string, type: string, text: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // downloads unavailable
  }
}

export default function DojoRates() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DojoEngine | null>(null);
  const deckRef = useRef<U3Deck>(new U3Deck());
  const audio = useMemo(() => new ChipAudio(), []);

  const [practice, setPractice] = useState<Practice>(() => loadPractice());
  const [runPlan, setRunPlan] = useState<FloorPlan[]>(() => practicePlan(loadPractice()));
  const runPlanRef = useRef(runPlan);
  runPlanRef.current = runPlan;
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [log, setLog] = useState<Attempt[]>([]);
  const [saved, setSaved] = useState<Attempt[]>(() => loadAttempts());
  const [retrying, setRetrying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  useEffect(() => exposeMusicDebug(audio, SONGS, JINGLES), [audio]);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(false));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  /** New floor-master items asked in the current fight (a combo counts once). */
  const bossAskRef = useRef(0);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;

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

  const say = useCallback((q: U3Question, combo?: ComboState) => {
    if (!readAloudRef.current) return;
    if (combo && combo.phase >= 0) speakQuestion(`${combo.c.story} ${q.prompt}`, q.choices);
    else speakQuestion(q.prompt, q.choices);
  }, []);

  const askScroll = useCallback((floor: number) => {
    const q = deckRef.current.scroll(runPlanRef.current[floor - 1]);
    engineRef.current?.releaseAll();
    setQuiz({ kind: "scroll", floor, q, picked: null, result: null, hints: 0 });
    say(q);
  }, [say]);

  const askBoss = useCallback((floor: number) => {
    const item = deckRef.current.boss(runPlanRef.current[floor - 1], bossAskRef.current++);
    engineRef.current?.releaseAll();
    if (item.type === "combo") {
      const combo: ComboState = { c: item.combo, phase: -1, work: [] };
      setQuiz({ kind: "boss", floor, q: item.combo.final, picked: null, result: null, hints: 0, combo });
      say(item.combo.final);
    } else {
      setQuiz({ kind: "boss", floor, q: item.q, picked: null, result: null, hints: 0 });
      say(item.q);
    }
  }, [say]);

  // Create the engine once; it plays an attract-mode demo behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new DojoEngine(canvas, audio, {
      onHud: setHud,
      onScroll: () => askScroll(engine.sim.floor),
      onBossStart: (floor) => {
        bossAskRef.current = 0;
        askBoss(floor);
      },
      onBossDown: () => {},
      onFloorStart: () => setQuiz(null),
      onLifeLost: () => {},
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.sim.score));
        setQuiz(null);
        setScreen("over");
        audio.stopMusic();
      },
      onTowerCleared: () => {
        setHighScore(submitScore(GAME_ID, engine.sim.score));
        setQuiz(null);
        setScreen("won");
        audio.stopMusic();
      },
    });
    engineRef.current = engine;
    if (debug) (window as unknown as { __dt: DojoEngine }).__dt = engine;
    engine.showDemo("g68", runPlanRef.current);
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, askBoss, askScroll]);

  // Mirror the open question on the game screen's hanging scroll.
  useEffect(() => {
    engineRef.current?.setCard(
      quiz
        ? {
            title: `${quiz.kind === "boss" ? `VS ${runPlan[quiz.floor - 1].boss.name}` : "QUESTION SCROLL"}${quiz.combo ? ` · COMBO: ${quiz.combo.c.title}` : ""}`,
            prompt: cardPrompt(quiz),
            choices: quiz.q.choices,
            picked: quiz.picked,
            answer: quiz.q.answer,
          }
        : null,
    );
    // Playtest hook: the open question (with its answer) for automated tests.
    if (debug) (window as unknown as { __dtQuiz: Quiz | null }).__dtQuiz = quiz;
  }, [quiz, runPlan]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // The title screen's floor list and attract demo follow the practice choice.
  const titlePlan = useMemo(() => practicePlan(practice), [practice]);
  useEffect(() => {
    if (screen === "title") engineRef.current?.showDemo("g68", titlePlan);
  }, [screen, titlePlan]);

  /** Starts a run with `plan`; `fromFloor` > 1 continues on the floor reached (the score is kept). */
  const startRun = useCallback((plan: FloorPlan[], fromFloor = 1, retry = false) => {
    audio.unlock();
    audio.playSong(floorSong(plan[fromFloor - 1]?.n || 1));
    const cont = fromFloor > 1;
    const keptScore = cont ? engineRef.current?.sim.score ?? 0 : 0;
    setRunPlan(plan);
    runPlanRef.current = plan;
    setRetrying(retry);
    engineRef.current?.setFocusTag(null);
    if (!cont) {
      deckRef.current = new U3Deck();
      setLog([]);
    }
    setQuiz(null);
    setPaused(false);
    setHud({ ...EMPTY_HUD, floor: fromFloor, score: keptScore });
    setScreen("playing");
    engineRef.current?.newGame("g68", plan, fromFloor, keptScore);
  }, [audio]);

  const startGame = useCallback(() => startRun(practicePlan(practice)), [startRun, practice]);

  const choosePractice = useCallback((p: Practice) => {
    setPractice(p);
    savePractice(p);
  }, []);

  const toMenu = useCallback(() => setScreen("title"), []);

  const answer = useCallback(
    (i: number) => {
      if (!quiz || quiz.picked !== null) return;
      audio.unlock();
      const q = quiz.q;
      const correct = i === q.answer;
      recordAnswer(GAME_ID, q, correct);
      const c = quiz.combo;
      const entry: Attempt = {
        date: new Date().toISOString(),
        game: GAME_ID,
        tag: q.tag,
        skill: tagName(q.tag),
        question: c && c.phase >= 0 ? `${c.c.title}: ${c.c.story} ${q.prompt}` : q.prompt,
        given: q.choices[i],
        correct: q.choices[q.answer],
        ok: correct,
        hints: quiz.hints,
        kind: quiz.kind,
        part: c ? (c.phase === -1 ? "combo final" : `combo step ${c.phase + 1}`) : "",
      };
      setLog((l) => [...l, entry]);
      setSaved((s) => {
        const nxt = [...s, entry].slice(-ATTEMPT_LOG_MAX);
        saveAttempts(nxt);
        return nxt;
      });
      let result: BossResult | null = null;
      if (quiz.kind === "boss") {
        const opts = !c ? {} : c.phase === -1 ? { power: 2 } : { power: 1, holdOn: c.phase < c.c.steps.length - 1 };
        result = engineRef.current?.answerBoss(correct, opts) ?? null;
      } else if (correct) audio.correct();
      else audio.wrong();
      setQuiz({ ...quiz, picked: i, result });
      if (readAloudRef.current) speak(correct ? `Correct! ${q.explanation}` : `${q.feedback[i]} The answer is ${q.choices[q.answer]}.`);
    },
    [quiz, audio],
  );

  const next = useCallback(() => {
    if (!quiz || quiz.picked === null) return;
    stopSpeaking();
    const e = engineRef.current;
    const correct = quiz.picked === quiz.q.answer;
    if (quiz.kind === "scroll") {
      e?.answerScroll(correct);
      setQuiz(null);
      return;
    }
    if (quiz.result?.defeated) {
      e?.finishFloor();
      setQuiz(null);
      return;
    }
    const c = quiz.combo;
    if (c) {
      const steps = c.c.steps;
      if (c.phase === -1 && !correct) {
        // Break the story into its steps.
        const combo = { ...c, phase: 0 };
        setQuiz({ kind: "boss", floor: quiz.floor, q: steps[0].q, picked: null, result: null, hints: 0, combo });
        say(steps[0].q, combo);
        return;
      }
      if (c.phase >= 0 && c.phase + 1 < steps.length) {
        const combo = { ...c, phase: c.phase + 1, work: [...c.work, steps[c.phase].result] };
        setQuiz({ kind: "boss", floor: quiz.floor, q: steps[c.phase + 1].q, picked: null, result: null, hints: 0, combo });
        say(steps[c.phase + 1].q, combo);
        return;
      }
    }
    askBoss(quiz.floor);
  }, [quiz, askBoss, say]);

  const hint = useCallback(() => {
    setQuiz((qz) => (qz && qz.picked === null && qz.hints < 2 ? { ...qz, hints: qz.hints + 1 } : qz));
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
    if (quiz) say(quiz.q, quiz.combo);
  }, [quiz, say]);

  // Keyboard. A-D are only ever answer keys, never movement; H is the hint key.
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k === "m") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen === "title") {
        if (ev.key === "Enter" && !(ev.target instanceof HTMLButtonElement)) {
          ev.preventDefault();
          startGame();
        }
        return;
      }
      if (screen !== "playing") return;
      const idx = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (quiz) {
        if (quiz.picked === null && idx >= 0) {
          ev.preventDefault();
          answer(idx);
        } else if (quiz.picked === null && k === "h") {
          ev.preventDefault();
          hint();
        } else if (quiz.picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          if (!ev.repeat) next();
        } else if (k === "r") replay();
        else if (ev.key === " " || ev.key.startsWith("Arrow")) ev.preventDefault();
        return;
      }
      if (k === "p" || ev.key === "Escape") {
        togglePause();
        return;
      }
      if (paused) return;
      const e = engineRef.current;
      if (!e) return;
      const held = HELD_KEYS[ev.key];
      if (held) {
        ev.preventDefault();
        e.setHeld(held, true);
        return;
      }
      if (ev.repeat) {
        if (ev.key === " " || ev.key === "ArrowUp") ev.preventDefault();
        return;
      }
      if (ev.key === "ArrowUp" || ev.key === " ") {
        ev.preventDefault();
        e.press("jump");
      } else if (k === "z") e.press("punch");
      else if (k === "x") e.press("kick");
      else if (k === "t") e.press("thunder");
      else if (k === "s") e.press("star");
    };
    const up = (ev: KeyboardEvent) => {
      const held = HELD_KEYS[ev.key];
      if (held) engineRef.current?.setHeld(held, false);
    };
    const blur = () => {
      engineRef.current?.releaseAll();
      if (screen === "playing" && !quiz) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, quiz, paused, answer, next, hint, togglePause, replay, startGame, audio]);

  // Touch pad: arrows are held, attack buttons fire on press.
  const holdProps = (k: "left" | "right" | "down") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      engineRef.current?.setHeld(k, true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        // pointer already gone
      }
    },
    onPointerUp: () => engineRef.current?.setHeld(k, false),
    onPointerCancel: () => engineRef.current?.setHeld(k, false),
    onLostPointerCapture: () => engineRef.current?.setHeld(k, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const pressProps = (a: "jump" | "punch" | "kick" | "thunder" | "star") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      engineRef.current?.press(a);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const playing = screen === "playing";
  const showPad = touch && playing && !quiz;
  const thunderReady = hud.meter >= METER_MAX;
  const starsOn = hud.burst > 0;
  const curFloor = runPlan[Math.max(0, Math.min(runPlan.length, hud.floor) - 1)];

  return (
    <div className="dt-root">
      <div className="dt-toolbar">
        <a href={arcadeLink(GRADE)}>◀ ARCADE</a>
        <div className="dt-tools">
          {playing && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          {muted ? (
            <button onClick={() => setMuted(audio.toggleMute())} title="Sound is off on this device (M)">SOUND OFF</button>
          ) : (
            <>
              <button onClick={() => setMusicOn(audio.toggleMusic())} aria-pressed={musicOn} title="Music on/off">{musicOn ? "MUSIC ON" : "MUSIC OFF"}</button>
              <button onClick={() => setSfxOn(audio.toggleSfx())} aria-pressed={sfxOn} title="Sound effects on/off">{sfxOn ? "SFX ON" : "SFX OFF"}</button>
            </>
          )}
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`dt-cabinet ${showPad ? "touch-on" : ""}`}>
        <div className="dt-hud dt-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Floor</span><span className="val">{curFloor?.n ? curFloor.n : "R"} ({hud.floor}/{runPlan.length})</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, hud.lives))}</span></div>
          <div><span className="lbl">Streak</span><span className={`val ${thunderReady ? "ready" : ""}`}>{hud.streak}{thunderReady ? " ⚡" : ""}</span></div>
          <div className="dt-starhud" title="Poof 5 star-throwing ninjas for an ink-star burst (S)">
            <span className="lbl">Stars</span>
            {starsOn ? (
              <span className="val ready">★ S! <span className="dt-burstbar" aria-label={`${Math.ceil(hud.burst)} seconds of ink stars left`}><i style={{ width: `${Math.round((hud.burst / STAR_BURST) * 100)}%` }} /></span></span>
            ) : (
              <span className="val">★ {hud.stars}/{STAR_GOAL}</span>
            )}
          </div>
        </div>

        <div className="dt-stage" ref={stageRef}>
          <div className="dt-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Dojo Tower: Rates & Percents game screen" />

            {screen === "title" && <TitleScreen practice={practice} onPractice={choosePractice} onStart={startGame} highScore={highScore} plan={titlePlan} saved={saved.length} />}

            {playing && paused && !quiz && (
              <div className="dt-overlay">
                <div className="dt-panel" style={{ textAlign: "center" }}>
                  <div className="dt-title dt-pixel">PAUSED</div>
                  <HowToPlay />
                  <div style={{ marginTop: 14 }}>
                    <button className="dt-cta" onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {(screen === "over" || screen === "won") && (
              <Report
                won={screen === "won"}
                log={log}
                saved={saved}
                score={hud.score}
                floor={hud.floor}
                highScore={highScore}
                plan={runPlan}
                retrying={retrying}
                onAgain={() => (retrying ? startGame() : startRun(runPlan))}
                onContinue={screen === "over" && hud.floor > 1 ? () => startRun(runPlan, hud.floor, retrying) : null}
                onRetry={(tags) => startRun(retryPlan(tags), 1, true)}
                onMenu={toMenu}
              />
            )}
          </div>
        </div>

        {playing && quiz && <QuizPanel quiz={quiz} plan={runPlan} onAnswer={answer} onNext={next} onHint={hint} onSpeak={replay} />}

        <div className={`dt-controls ${showPad ? "show" : ""}`}>
          <div className="dt-pad move">
            <button className="dt-touch" {...holdProps("left")} aria-label="Move left">◀</button>
            <div className="dt-col">
              <button className="dt-touch" {...pressProps("jump")} aria-label="Jump">▲</button>
              <button className="dt-touch" {...holdProps("down")} aria-label="Duck">▼</button>
            </div>
            <button className="dt-touch" {...holdProps("right")} aria-label="Move right">▶</button>
          </div>
          <div className="dt-pad act">
            <div className="dt-col">
              <button className={`dt-touch thunder ${thunderReady ? "ready" : ""}`} {...pressProps("thunder")} aria-label="Thunder Kick">⚡</button>
              <button className={`dt-touch star ${starsOn ? "ready" : ""}`} {...pressProps("star")} aria-label="Throw an ink star">★</button>
            </div>
            <button className="dt-touch word punch" {...pressProps("punch")} aria-label="Punch">PUNCH</button>
            <button className="dt-touch word kick" {...pressProps("kick")} aria-label="Kick">KICK</button>
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

/** The textbook pictures: double number line, tape diagram or ratio table ("?" marks the unknown). */
function ModelView({ model }: { model: Model }) {
  if (model.type === "table") {
    return (
      <div className="dt-modelwrap">
        <table className="dt-model table" aria-label="Ratio table">
          <thead>
            <tr>{model.head.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {model.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className={c === "?" ? "unk" : ""}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (model.type === "dnl") {
    const n = model.top.length;
    const x = (i: number) => 34 + (i * 284) / Math.max(1, n - 1);
    return (
      <svg className="dt-model dnl" viewBox="0 0 340 64" role="img" aria-label={`Double number line: ${model.topLabel} and ${model.bottomLabel}`}>
        <line x1="24" y1="22" x2="328" y2="22" />
        <line x1="24" y1="44" x2="328" y2="44" />
        {model.top.map((t, i) => (
          <g key={i}>
            <line x1={x(i)} y1="17" x2={x(i)} y2="27" />
            <line x1={x(i)} y1="39" x2={x(i)} y2="49" />
            <text x={x(i)} y="12" className={t === "?" ? "unk" : ""}>{t}</text>
            <text x={x(i)} y="62" className={model.bottom[i] === "?" ? "unk" : ""}>{model.bottom[i]}</text>
          </g>
        ))}
      </svg>
    );
  }
  const w = 300 / model.parts;
  return (
    <svg className="dt-model tape" viewBox="0 0 340 66" role="img" aria-label={`Tape diagram with ${model.parts} equal parts`}>
      <text x="20" y="11" textAnchor="start" className="unk">{model.shadedLabel}</text>
      {Array.from({ length: model.parts }, (_, i) => (
        <g key={i}>
          <rect x={20 + i * w} y="16" width={w} height="22" className={i < model.shaded ? "on" : ""} />
          {model.partLabel && w > 22 && <text x={20 + i * w + w / 2} y="31">{model.partLabel}</text>}
        </g>
      ))}
      <text x="170" y="56">{model.totalLabel}</text>
    </svg>
  );
}

function QuizPanel({ quiz, plan, onAnswer, onNext, onHint, onSpeak }: { quiz: Quiz; plan: FloorPlan[]; onAnswer: (i: number) => void; onNext: () => void; onHint: () => void; onSpeak: () => void }) {
  const { q, picked, result, combo } = quiz;
  const bossName = plan[quiz.floor - 1].boss.name;
  const done = picked !== null;
  const correct = done && picked === q.answer;
  const steps = combo?.c.steps.length ?? 0;
  let verdict = "";
  if (done && quiz.kind === "scroll") verdict = correct ? "✔ CORRECT! +ENERGY" : `✘ NOT QUITE — THE ANSWER IS ${"ABCD"[q.answer]}`;
  if (done && quiz.kind === "boss") {
    if (!correct) verdict = combo?.phase === -1 ? "✘ BLOCKED! LET'S BREAK IT INTO STEPS" : `✘ BLOCKED! THE ANSWER IS ${"ABCD"[q.answer]}`;
    else if (result?.defeated) verdict = `✔ ${result.big ? "BIG COMBO! " : result.thunder ? "THUNDER KICK! " : ""}${bossName} IS BEATEN!`;
    else if (result?.big) verdict = "✔ BIG COMBO! FIRST TRY — DOUBLE HIT!";
    else if (result?.thunder) verdict = "✔ THUNDER KICK! DOUBLE HIT!";
    else if (result && result.damage === 0) verdict = "✔ RIGHT! THE MASTER HANGS ON — FINISH THE STORY!";
    else verdict = "✔ RIGHT! COMBO HIT!";
  }
  const lastFloor = quiz.floor >= plan.length;
  let nextLabel = "Next question ▶";
  if (quiz.kind === "scroll") nextLabel = "Back to the fight ▶";
  else if (result?.defeated) nextLabel = lastFloor ? "Finish ▶" : "Climb to the next floor ▶";
  else if (combo && combo.phase === -1 && !correct) nextLabel = "Step 1 ▶";
  else if (combo && combo.phase >= 0 && combo.phase + 1 < steps) nextLabel = combo.phase + 2 === steps ? "Last step ▶" : `Step ${combo.phase + 2} ▶`;
  const sectionTag = q.section === "X" ? "BRIDGE BONUS" : `SECTION ${q.section}`;
  const showSteps = !!combo && combo.phase >= 0;
  const prompt = combo && combo.phase === -1 ? cardPrompt(quiz) : q.prompt;
  return (
    <div className={`dt-quiz ${quiz.kind} ${combo ? "combo" : ""} ${done ? (correct ? "correct" : "wrong") : ""}`} role="dialog" aria-label={quiz.kind === "boss" ? "Floor master question" : "Question scroll"}>
      <div className="head dt-pixel">
        <span>{quiz.kind === "boss" ? `VS ${bossName}` : "QUESTION SCROLL"}{combo ? ` · COMBO: ${combo.c.title}` : ""}</span>
        <span className="std">
          <span className="dt-tagname">{sectionTag} · {q.skill}</span>
          {speechSupported() && (
            <button type="button" className="dt-speak" onClick={onSpeak} aria-label="Read the question aloud" title="Read aloud (R)">
              <SpeakerIcon />
            </button>
          )}
        </span>
      </div>
      {combo && <div className="dt-story">{combo.c.story}</div>}
      {showSteps && (
        <ol className="dt-work" aria-label="Work so far">
          {combo.c.steps.map((s, i) => (
            <li key={i} className={i < combo.phase ? "done" : i === combo.phase ? "now" : ""}>
              {i < combo.phase ? `✔ ${combo.work[i] ?? s.result}` : i === combo.phase ? `Step ${i + 1} of ${steps}: solving now` : `Step ${i + 1}`}
            </li>
          ))}
        </ol>
      )}
      <div className="prompt">{prompt}</div>
      {q.model && <ModelView model={q.model} />}
      {quiz.hints > 0 && (
        <div className="dt-hints">
          <div><b className="y">HINT 1:</b> {q.hints[0]}</div>
          {quiz.hints > 1 && <div><b className="y">HINT 2:</b> {q.hints[1]}</div>}
        </div>
      )}
      {!done && (
        <div className="row dt-qfoot">
          <span className="hint dim">Press 1–4 or A–D, or tap an answer. H = hint.</span>
          <button type="button" className="dt-hintbtn dt-pixel" onClick={onHint} disabled={quiz.hints >= 2} aria-label="Show a hint">
            {quiz.hints === 0 ? "HINT" : quiz.hints === 1 ? "HINT 2" : "NO MORE HINTS"}
          </button>
        </div>
      )}
      <div className="opts">
        {q.choices.map((c, i) => {
          const state = done ? (i === q.answer ? "ans" : i === picked ? "wrong" : "") : "";
          return (
            <button key={i} type="button" className={`opt ${state}`} disabled={done} onClick={() => onAnswer(i)}>
              <b>{"ABCD"[i]}</b>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {done && (
        <div className="feedback">
          <div className={`verdict dt-pixel ${correct ? "ok" : "no"}`}>{verdict}</div>
          {!correct && <div className="dt-mistake">{q.feedback[picked]}</div>}
          <div className="why">{correct ? q.explanation : `Answer: ${q.choices[q.answer]}. ${q.explanation}`}</div>
          <div className="row">
            <span className="dim">{quiz.kind === "boss" && !correct ? "Wrong answers never cost a life — keep going!" : ""}</span>
            <button className="dt-cta" autoFocus onClick={onNext}>{nextLabel}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="dt-help" style={{ marginTop: 10, textAlign: "left" }}>
      <kbd>◀</kbd> <kbd>▶</kbd> walk · <kbd>▼</kbd> duck · <kbd>▲</kbd> or <kbd>SPACE</kbd> jump · <kbd>Z</kbd> punch · <kbd>X</kbd> kick ·{" "}
      <kbd>T</kbd> Thunder Kick · <kbd>S</kbd> throw ink stars · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>H</kbd> hint ·{" "}
      <kbd>P</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud. On a phone or tablet: ◀ ▶ ▲ ▼, PUNCH, KICK, ⚡, ★ and the HINT button.
      <br />
      Poof the <span className="c">Ink Ninjas</span> into confetti, then face each <span className="r">floor master</span>: every right answer lands a
      hit, and a wrong answer is only blocked (no lives lost, and you get a tip that names the mistake). <span className="y">COMBO</span> story
      problems: solve the final answer on the first try for a <span className="y">BIG COMBO</span>, or work it out step by step. Questions are never
      timed — take your time and use <span className="y">HINT</span> (twice for a worked step). Get <span className="g">{METER_MAX} right in a row</span> to charge the{" "}
      <span className="y">THUNDER KICK</span>!
    </div>
  );
}

/** Arrow keys move between (and pick) the buttons of a radio group; Home/End jump to the ends. */
function radioKeys(e: React.KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const btns = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[role=radio]:not(:disabled)")];
  if (btns.length === 0) return;
  e.preventDefault();
  const i = btns.indexOf(document.activeElement as HTMLButtonElement);
  let j = e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
  j = (j + btns.length) % btns.length;
  btns[j].focus();
  btns[j].click();
}

function TitleScreen({ practice, onPractice, onStart, highScore, plan, saved }: { practice: Practice; onPractice: (p: Practice) => void; onStart: () => void; highScore: number; plan: FloorPlan[]; saved: number }) {
  // Focus the start button without scrolling the panel down past the title and picker.
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { startRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="dt-overlay title">
      <div className="dt-panel title">
        <div className="dt-title dt-pixel">DOJO TOWER</div>
        <div className="dt-title dt-pixel dt-title2">RATES &amp; PERCENTS</div>
        <div className="dt-sub dt-pixel dt-edition">SPIDERBEN10'S SPECIAL EDITION · MATH 6 UNIT 3</div>

        <div className="dt-h dt-pixel" style={{ marginTop: 14 }}>PRACTICE</div>
        <div className="dt-subjects dt-practice" role="radiogroup" aria-label="Practice" onKeyDown={radioKeys}>
          {PRACTICES.map((p) => {
            const on = p.id === practice;
            return (
              <button key={p.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} data-practice={p.id} className={`dt-subject ${on ? "on" : ""} ${p.id === "full" ? "full" : ""}`} onClick={() => onPractice(p.id)}>
                <span className="dt-pixel">{p.id === "full" || p.id === "X" ? p.label : `SECTION ${p.label}`}</span>
                <small>{p.note}</small>
              </button>
            );
          })}
        </div>

        <div className="dt-h dt-pixel dt-floorshead" style={{ marginTop: 12 }}>{plan.length > 1 ? `THE ${plan.length} FLOOR MASTERS` : "THE FLOOR MASTER"}</div>
        <ol className="dt-floors compact" aria-label="Tower floors and their masters">
          {plan.map((f) => (
            <li key={f.n} className="dt-floorrow" data-boss={f.boss.id}>
              <span className="n dt-pixel">{f.n === 8 ? "★" : `${f.n}F`}</span>
              <span className="boss">{f.boss.name}</span>
              <span className="hall">
                {f.hall}
                <span className="dim"> · {f.sectionLabel}</span>
              </span>
            </li>
          ))}
        </ol>

        <div style={{ textAlign: "center", margin: "12px 0 4px" }}>
          <button ref={startRef} className="dt-cta big" onClick={onStart}>Enter the tower ▶</button>
        </div>
        <div className="dt-h dt-pixel" style={{ marginTop: 10 }}>HOW TO PLAY</div>
        <HowToPlay />
        <div className="dt-help dim" style={{ marginTop: 6 }}>
          HI-SCORE {String(highScore).padStart(6, "0")} · {saved} answers saved on this device
        </div>
      </div>
    </div>
  );
}

function Report({
  won, log, saved, score, floor, highScore, plan, retrying, onAgain, onContinue, onRetry, onMenu,
}: {
  won: boolean; log: Attempt[]; saved: Attempt[]; score: number; floor: number; highScore: number; plan: FloorPlan[]; retrying: boolean;
  onAgain: () => void; onContinue: (() => void) | null; onRetry: (tags: number[]) => void; onMenu: () => void;
}) {
  const rows = tagRows(log);
  const right = log.filter((l) => l.ok).length;
  const hints = log.reduce((s, l) => s + l.hints, 0);
  const missed = [...new Set(log.filter((l) => !l.ok).map((l) => l.tag))].sort((a, b) => a - b);
  const beaten = plan.slice(0, won ? plan.length : Math.max(0, floor - 1));
  const stamp = new Date().toISOString().slice(0, 10);
  const title = won ? (retrying ? "RETRY ROUND CLEARED!" : plan.length >= 7 ? "TOWER CLEARED! YOU ARE A RATES MASTER" : "PRACTICE CLEARED!") : "OUT OF LIVES — TRAINING REPORT";
  return (
    <div className="dt-overlay">
      <div className={`dt-panel dt-report ${won ? "won" : ""}`}>
        <div className="dt-h dt-pixel" style={{ color: won ? "var(--dt-yellow)" : "var(--dt-red)" }}>{title}</div>
        <div className="dt-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Questions <b className="g">{right}/{log.length}</b> · Hints <b className="c">{hints}</b>
        </div>
        {beaten.length > 0 && (
          <div className="dt-help dt-beaten">
            <span className="y">Masters beaten:</span> {beaten.map((f) => f.boss.name).join(" · ")}
          </div>
        )}
        {onContinue && <div className="dt-help dt-continue">Continue on this floor with 3 new lives and keep your score.</div>}
        {rows.length > 0 ? (
          <div className="dt-tablewrap">
            <table className="dt-report-table">
              <thead>
                <tr><th>#</th><th>SKILL</th><th>RIGHT</th><th>HINTS</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.tag} data-tag={r.tag}>
                    <td className="c">{r.tag}</td>
                    <td>{tagName(r.tag)}</td>
                    <td style={{ color: r.c === r.n ? "var(--dt-green)" : r.c / r.n >= 0.75 ? "var(--dt-yellow)" : "var(--dt-red)" }}>{r.c}/{r.n}</td>
                    <td>{r.hints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dt-help" style={{ marginTop: 8 }}>No questions answered yet. Reach a floor master or a scroll ninja next time!</div>
        )}
        {missed.length > 0 && (
          <div className="dt-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {missed.map(tagName).join(", ")}.
          </div>
        )}
        <div className="dt-exports">
          <span className="dim">Export this round:</span>
          <button className="dt-cta ghost small" data-export="csv" disabled={!log.length} onClick={() => download(`dojo-rates-${stamp}.csv`, "text/csv", toCSV(log))}>CSV</button>
          <button className="dt-cta ghost small" data-export="json" disabled={!log.length} onClick={() => download(`dojo-rates-${stamp}.json`, "application/json", toJSON(log))}>JSON</button>
          <span className="dim">All saved ({saved.length}):</span>
          <button className="dt-cta ghost small" data-export="all-csv" disabled={!saved.length} onClick={() => download(`dojo-rates-all-${stamp}.csv`, "text/csv", toCSV(saved))}>CSV</button>
          <button className="dt-cta ghost small" data-export="all-json" disabled={!saved.length} onClick={() => download(`dojo-rates-all-${stamp}.json`, "application/json", toJSON(saved))}>JSON</button>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="dt-cta ghost" onClick={onMenu}>Title screen</button>
          {missed.length > 0 && <button className="dt-cta dt-redo" autoFocus={!onContinue} onClick={() => onRetry(missed)}>Redo the ones I missed ▶</button>}
          <button className={`dt-cta ${onContinue || missed.length ? "ghost" : ""}`} autoFocus={!onContinue && !missed.length} onClick={onAgain}>{retrying ? "Play again ▶" : onContinue ? "Start over" : "Play again ▶"}</button>
          {onContinue && <button className="dt-cta" autoFocus onClick={onContinue}>Continue ▶</button>}
        </div>
      </div>
    </div>
  );
}

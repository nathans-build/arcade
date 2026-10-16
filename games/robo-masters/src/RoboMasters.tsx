import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  exposeMusicDebug,
  GRADES,
  arcadeLink,
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
  type Grade,
  type Question,
  type Subject,
} from "@/kit";
import { bandOf } from "@/robo/band";
import { catalog } from "@/robo/bank";
import { RoboEngine, type Hud } from "@/robo/engine";
import {
  FOCUS_SUBJECTS,
  MIXED,
  SUBJECT_CHOICES,
  allLabel,
  focusFromUrl,
  focusLabel,
  focusTopic,
  loadFocus,
  refocusSavedForGrade,
  saveFocus,
  topicForSubject,
  topicsOf,
  validateFocus,
  type FocusChoice,
  type RoboSubject,
  type TopicChoice,
} from "@/robo/focus";
import { gatePowerFor } from "@/robo/levels";
import { RoboQuestions, dealQuestion, resolveRobot, sourceLabel } from "@/robo/questions";
import { drawHero, drawPowerIcon, drawRobot, HERO_COLORS } from "@/robo/render";
import { FINAL_BOSS, HERO, POWERS, ROBOTS, robotById, type PowerId, type Robot, type RobotId, type StageId } from "@/robo/robots";
import { fortressOpen, loadSave, markBeaten, markFortress, powersOf, writeSave, type AnswerResult, type SaveData } from "@/robo/rules";
import { MAX_ENERGY, POWER_MAX, startLives } from "@/robo/sim";
import { BOSS_WARNING, CITADEL_CLEARED, JINGLES, POWER_EARNED, RECHARGE, SELECT_SONG, SONGS, bossSongFor, stageSongFor } from "@/music";
import "@/robo/robo.css";

const GAME_ID = "robo-masters";

type Screen = "title" | "select" | "playing" | "cleared" | "over" | "victory";

interface Quiz {
  stage: StageId;
  from: RobotId;
  q: Question;
  picked: number | null;
  result: AnswerResult | null;
  line: string | null;
}

interface LogEntry {
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
}

const SUBJECT_TAG: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" };

/** Stage select layout: robots around the hero, row by row (null = the middle tile). */
const GRID: (RobotId | null)[] = ["splitz", "igneous", "syntaxor", "meridian", null, "cumulo", "polarix", "chlorophil", "clio"];

const EMPTY_HUD: Hud = {
  energy: MAX_ENERGY, lives: 3, power: POWER_MAX, sel: null, powers: [], score: 0, mode: "play", bossHp: 0, bossMax: 0, weakReady: false, progress: 0, checkpoint: -1,
};

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

function initialFocus(grade: Grade): { choice: FocusChoice; note: string | null } {
  const url = focusFromUrl(typeof window === "undefined" ? "" : window.location.search, grade, catalog);
  let note: string | null = null;
  if (url.unavailable) {
    const t = focusTopic(url.unavailable);
    note = `${t.label} is for ${catalog.gradesNote(t.id)}, not ${gradeLabel(grade)}.`;
  }
  return { choice: url.choice ?? validateFocus(loadFocus(), grade, catalog), note };
}

function stageName(id: StageId): string {
  return id === "fortress" ? FINAL_BOSS.stage.name : robotById(id).stage.name;
}
function bossName(id: StageId): string {
  return id === "fortress" ? FINAL_BOSS.name : robotById(id).name;
}
function bossLines(id: StageId) {
  return id === "fortress" ? FINAL_BOSS.lines : robotById(id).lines;
}

export default function RoboMasters() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RoboEngine | null>(null);
  const questionsRef = useRef<RoboQuestions | null>(null);
  const audio = useMemo(() => new ChipAudio(), []);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [focusInit] = useState(() => initialFocus(initialGrade("3")));
  const [focus, setFocus] = useState<FocusChoice>(focusInit.choice);
  const [focusNote, setFocusNote] = useState<string | null>(focusInit.note);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>("title");
  const [stage, setStage] = useState<StageId>("splitz");
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [say, setSay] = useState<{ who: string; text: string } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  useEffect(() => exposeMusicDebug(audio, SONGS, JINGLES), [audio]);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [selFocus, setSelFocus] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const stageIdRef = useRef(stage);
  stageIdRef.current = stage;
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  const early = isEarlyReader(grade);
  const runFocus = useMemo(() => validateFocus(focus, grade, catalog), [focus, grade]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScreenWidth(Math.floor(Math.min(width, height * 1.6)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const ask = useCallback(() => {
    const qs = questionsRef.current;
    if (!qs) return;
    const id = stageIdRef.current;
    const { q, from } = qs.draw(id);
    engineRef.current?.releaseAll();
    const dealt = dealQuestion(q);
    setQuiz({ stage: id, from, q: dealt, picked: null, result: null, line: null });
    if (readAloudRef.current) speakQuestion(dealt.prompt, dealt.choices);
  }, []);

  // The engine lives as long as the page; menus show a stage scrolling behind them.
  useEffect(() => {
    const engine = new RoboEngine(canvasRef.current!, audio, {
      onHud: setHud,
      onBossIntro: () => {
        const id = stageIdRef.current;
        audio.playJingle(BOSS_WARNING, { then: bossSongFor(id) });
        const line = bossLines(id).intro;
        setSay({ who: bossName(id), text: line });
        if (readAloudRef.current) speak(line);
      },
      onQuestion: () => ask(),
      onCleared: () => {
        const id = stageIdRef.current;
        setQuiz(null);
        setSay(null);
        setSave((s) => {
          const next = id === "fortress" ? markFortress(s) : markBeaten(s, id);
          writeSave(next);
          return next;
        });
        setHighScore(submitScore(GAME_ID, engine.sim?.s.score ?? 0));
        setScreen(id === "fortress" ? "victory" : "cleared");
        audio.playJingle(id === "fortress" ? CITADEL_CLEARED : POWER_EARNED, { then: "stop" });
        if (readAloudRef.current) speak(id === "fortress" ? FINAL_BOSS.lines.defeat : `${robotById(id as RobotId).lines.defeat}`);
      },
      onGameOver: () => {
        setQuiz(null);
        setSay(null);
        setHighScore(submitScore(GAME_ID, engine.sim?.s.score ?? 0));
        setScreen("over");
        audio.stopMusic();
        audio.playJingle(RECHARGE, { then: "stop" });
      },
    });
    engineRef.current = engine;
    engine.showPreview("splitz", bandOf(gradeRef.current));
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, ask]);

  // Debug / playtest hooks.
  useEffect(() => {
    if (!debug) return;
    const w = window as unknown as Record<string, unknown>;
    w.__rm = {
      engine: engineRef.current,
      get sim() {
        return engineRef.current?.sim ?? null;
      },
      warpToBoss: () => engineRef.current?.warpToBoss(),
      forceQuestion: () => engineRef.current?.forceQuestion(),
    };
    w.__rmQuiz = quiz;
    w.__rmSave = save;
    w.__rmScreen = screen;
  }, [quiz, save, screen]);

  const chooseGrade = useCallback((g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setFocus((f) => validateFocus(f, g, catalog));
    refocusSavedForGrade(g, catalog);
    setFocusNote(null);
    setReadAloud(readAloudPref(isEarlyReader(g)));
  }, []);

  const chooseFocus = useCallback((f: FocusChoice) => {
    setFocus(f);
    saveFocus(f);
    setFocusNote(null);
  }, []);

  const toSelect = useCallback(() => {
    audio.unlock();
    audio.playSong(SELECT_SONG);
    stopSpeaking();
    rememberGrade(grade);
    setQuiz(null);
    setSay(null);
    setPaused(false);
    setScreen("select");
    engineRef.current?.showPreview("splitz", bandOf(grade));
  }, [audio, grade]);

  const startStage = useCallback((id: StageId) => {
    audio.unlock();
    stopSpeaking();
    audio.playSong(stageSongFor(id), { restart: true });
    if (!questionsRef.current || questionsRef.current.grade !== grade || JSON.stringify(questionsRef.current.choice) !== JSON.stringify(runFocus)) {
      questionsRef.current = new RoboQuestions(grade, runFocus, catalog);
    }
    setStage(id);
    stageIdRef.current = id;
    setQuiz(null);
    setSay(null);
    setPaused(false);
    setHud({ ...EMPTY_HUD, lives: startLives(bandOf(grade)), powers: powersOf(save) });
    setScreen("playing");
    engineRef.current?.startStage(id, bandOf(grade), powersOf(save));
  }, [audio, grade, runFocus, save]);

  const answer = useCallback(
    (i: number) => {
      if (!quiz || quiz.picked !== null) return;
      audio.unlock();
      const correct = i === quiz.q.answer;
      recordAnswer(GAME_ID, quiz.q, correct);
      setLog((l) => [...l, { subject: quiz.q.subject, standard: quiz.q.standard, skill: quiz.q.skill, correct }]);
      const result = engineRef.current?.answer(correct) ?? null;
      const lines = bossLines(quiz.stage);
      const n = log.length;
      const line = result?.defeated ? lines.defeat : correct ? lines.hit[n % lines.hit.length] : lines.block[n % lines.block.length];
      setQuiz({ ...quiz, picked: i, result, line });
      if (readAloudRef.current) speak(correct ? `Correct! ${quiz.q.explanation}` : `The answer is ${quiz.q.choices[quiz.q.answer]}. ${quiz.q.explanation}`);
    },
    [quiz, audio, log.length],
  );

  const next = useCallback(() => {
    if (!quiz || quiz.picked === null) return;
    stopSpeaking();
    setQuiz(null);
    setSay(null);
    engineRef.current?.resume();
  }, [quiz]);

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
    if (quiz) speakQuestion(quiz.q.prompt, quiz.q.choices);
  }, [quiz]);

  const eraseSave = useCallback(() => {
    const empty: SaveData = { beaten: [], fortress: false };
    writeSave(empty);
    setSave(empty);
  }, []);

  // Keyboard. A-D are only ever answer keys, never movement.
  useEffect(() => {
    const HELD: Record<string, "left" | "right" | "jump"> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", " ": "jump" };
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
          toSelect();
        }
        return;
      }
      if (screen === "select") {
        if (ev.key === "Escape") setScreen("title");
        return;
      }
      if (screen !== "playing") return;
      const idx = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (quiz) {
        if (quiz.picked === null && idx >= 0) {
          ev.preventDefault();
          answer(idx);
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
      const held = HELD[ev.key];
      if (held) {
        ev.preventDefault();
        e.setHeld(held, true);
        return;
      }
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        return;
      }
      if (k === "z") {
        if (!ev.repeat) e.setHeld("shoot", true);
      } else if (k === "x") {
        if (!ev.repeat) e.press("power");
      } else if (k === "c") {
        if (!ev.repeat) e.press("cycle");
      }
    };
    const up = (ev: KeyboardEvent) => {
      const held = HELD[ev.key];
      if (held) engineRef.current?.setHeld(held, false);
      if (ev.key.toLowerCase() === "z") engineRef.current?.setHeld("shoot", false);
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
  }, [screen, quiz, paused, answer, next, togglePause, replay, toSelect, audio]);

  // Touch pad: arrows and jump/beam are held, power and switch fire on press.
  const holdProps = (k: "left" | "right" | "jump" | "shoot") => ({
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
  const pressProps = (a: "power" | "cycle") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      engineRef.current?.press(a);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const playing = screen === "playing";
  const showPad = touch && playing && !quiz;
  const owned = powersOf(save);

  return (
    <div className={`rm-root ${early ? "early" : ""}`}>
      <div className="rm-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="rm-tools">
          {playing && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          {playing && <button onClick={toSelect}>STAGES</button>}
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

      <div className={`rm-cabinet ${showPad ? "touch-on" : ""}`}>
        <div className="rm-hud rm-pixel">
          <div><span className="lbl">Stage</span><span className="val">{playing || screen === "over" ? stageName(stage) : "Select"}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, playing ? hud.lives : 0))}</span></div>
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div className="rm-hudpower">
            <span className="lbl">Power</span>
            <span className="val" style={{ color: hud.sel ? POWERS[hud.sel].color : undefined }}>{playing && hud.sel ? POWERS[hud.sel].name : "—"}</span>
          </div>
        </div>

        <div className="rm-stage" ref={stageRef}>
          <div className="rm-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Robo Masters game screen" />

            {screen === "title" && (
              <TitleScreen grade={grade} onGrade={chooseGrade} focus={focus} focusNote={focusNote} onFocus={chooseFocus} onStart={toSelect} save={save} onErase={eraseSave} highScore={highScore} />
            )}

            {screen === "select" && (
              <StageSelect grade={grade} focus={runFocus} save={save} onPick={startStage} onBack={() => setScreen("title")} sel={selFocus} onSel={setSelFocus} />
            )}

            {playing && paused && !quiz && (
              <div className="rm-overlay">
                <div className="rm-panel" style={{ textAlign: "center" }}>
                  <div className="rm-title rm-pixel">PAUSED</div>
                  <HowToPlay />
                  <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="rm-cta ghost" onClick={toSelect}>Stage select</button>
                    <button className="rm-cta" autoFocus onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "cleared" && stage !== "fortress" && (
              <Cleared robot={robotById(stage as RobotId)} save={save} onNext={toSelect} />
            )}

            {screen === "over" && (
              <div className="rm-overlay">
                <div className="rm-panel" style={{ textAlign: "center" }}>
                  <div className="rm-h rm-pixel" style={{ color: "var(--rm-red)" }}>OUT OF LIVES</div>
                  <div className="rm-help big">
                    Rivet needs a quick recharge! Your rebooted Robo Masters and powers are saved.
                  </div>
                  <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="rm-cta ghost" onClick={toSelect}>Stage select</button>
                    <button className="rm-cta" autoFocus onClick={() => startStage(stage)}>Try {stageName(stage)} again ▶</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "victory" && (
              <Victory log={log} grade={grade} focus={runFocus} score={hud.score} highScore={highScore} onMenu={() => setScreen("title")} onSelect={toSelect} />
            )}
          </div>
        </div>

        {playing && say && !quiz && (
          <div className="rm-say" role="status">
            <b>{say.who}</b>
            {say.text}
          </div>
        )}

        {playing && quiz && <QuizPanel quiz={quiz} grade={grade} focus={runFocus} onAnswer={answer} onNext={next} onSpeak={replay} />}

        <div className={`rm-controls ${showPad ? "show" : ""}`}>
          <div className="rm-pad move">
            <button className="rm-touch" {...holdProps("left")} aria-label="Move left">◀</button>
            <button className="rm-touch" {...holdProps("right")} aria-label="Move right">▶</button>
          </div>
          <div className="rm-pad act">
            <div className="rm-col">
              <button className="rm-touch cyc" {...pressProps("cycle")} disabled={owned.length < 2} aria-label="Switch power">SWAP</button>
              <button className="rm-touch word pow" {...pressProps("power")} disabled={owned.length === 0} aria-label="Use power">POWER</button>
            </div>
            <button className="rm-touch word beam" {...holdProps("shoot")} aria-label="Reboot beam">BEAM</button>
            <button className="rm-touch word jump" {...holdProps("jump")} aria-label="Jump">JUMP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ small pieces

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}

/** A robot (or the hero) drawn in a small pixel canvas. */
function Portrait({ who, size = 2 }: { who: RobotId | "static" | "hero"; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(size, 0, 0, size, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 40, 46);
    if (who === "hero") {
      ctx.save();
      ctx.translate(8, 8);
      ctx.scale(1.4, 1.4);
      drawHero(ctx, 0, 0, { facing: 1, frame: 0, air: false, colors: HERO_COLORS });
      ctx.restore();
    } else drawRobot(ctx, who, 7, 12, { t: 0, facing: -1 });
  }, [who, size]);
  return <canvas ref={ref} width={40 * size} height={46 * size} aria-hidden="true" />;
}

function PowerIcon({ p }: { p: PowerId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawPowerIcon(ctx, p, 0, 0, 2);
  }, [p]);
  return <canvas ref={ref} width={20} height={20} style={{ width: 14, height: 14, imageRendering: "pixelated", verticalAlign: "middle" }} aria-hidden="true" />;
}

function QuizPanel({ quiz, grade, focus, onAnswer, onNext, onSpeak }: { quiz: Quiz; grade: Grade; focus: FocusChoice; onAnswer: (i: number) => void; onNext: () => void; onSpeak: () => void }) {
  const { q, picked, result } = quiz;
  const name = bossName(quiz.stage);
  const done = picked !== null;
  const correct = done && picked === q.answer;
  const src = sourceLabel(resolveRobot(robotById(quiz.from), grade, focus, catalog));
  let verdict = "";
  if (done) {
    if (!correct) verdict = `✘ BLOCKED! THE ANSWER IS ${"ABCD"[q.answer]}`;
    else if (result?.defeated) verdict = `✔ ${result.weakness ? "DOUBLE REBOOT! " : ""}${name} IS REBOOTED!`;
    else if (result?.weakness) verdict = "✔ WEAK SPOT! DOUBLE REBOOT HIT!";
    else verdict = "✔ RIGHT! BIG REBOOT HIT!";
  }
  return (
    <div className={`rm-quiz ${done ? (correct ? "correct" : "wrong") : ""}`} role="dialog" aria-label="Robo Master question">
      <div className="head rm-pixel">
        <span>REBOOT PANEL · {name}{quiz.stage === "fortress" ? ` (${robotById(quiz.from).name}'S SUBJECT)` : ""}</span>
        <span className="std">
          {src} · {q.standard}
          {speechSupported() && (
            <button type="button" className="rm-speak" onClick={onSpeak} aria-label="Read the question aloud" title="Read aloud (R)">
              <SpeakerIcon />
            </button>
          )}
        </span>
      </div>
      {q.passage && <div className="passage">{q.passage}</div>}
      <div className="prompt">{q.prompt}</div>
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
          <div className={`verdict rm-pixel ${correct ? "ok" : "no"}`}>{verdict}</div>
          <div className="why">{q.explanation}</div>
          {quiz.line && <div className="boss-line">{name}: “{quiz.line}”</div>}
          <div className="row">
            <span className="dim">{!correct ? "Wrong answers never cost energy or lives. Open the panel again for a new question!" : ""}</span>
            <button className="rm-cta" autoFocus onClick={onNext}>{result?.defeated ? "Reboot complete ▶" : "Back to the fight ▶"}</button>
          </div>
        </div>
      )}
      {!done && <div className="hint dim">Press 1–4 or A–D, or tap an answer.</div>}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="rm-help" style={{ marginTop: 10, textAlign: "left" }}>
      <kbd>◀</kbd> <kbd>▶</kbd> move · <kbd>▲</kbd> or <kbd>SPACE</kbd> jump · <kbd>Z</kbd> reboot beam (hold to keep firing) · <kbd>X</kbd> use your power ·{" "}
      <kbd>C</kbd> switch power · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>ESC</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud.
      On a phone or tablet: ◀ ▶, JUMP, BEAM, POWER and SWAP.
      <br />
      You are <span className="c">{HERO.name}</span>, {HERO.blurb}. Eight <span className="r">Robo Masters</span> got glitched! Pick any stage, hop
      past pits and <span className="y">timed hazards</span>, and zap the glitched mini-bots — they short-circuit into sparks and bolts. Lights are{" "}
      <span className="g">checkpoints</span>. At the end, beam the Robo Master to open its <span className="y">reboot panel</span>: a right answer is a big
      reboot hit, a wrong one is only blocked (you never lose a fight by answering wrong). Reboot a Robo Master to earn its <span className="y">power</span>.
      Use a robot's <span className="y">weak-spot power</span> during its fight to make your next right answer a double reboot, and use the matching power at a
      stage's glowing <span className="y">power spot</span> for a 1-up. Reboot all eight to open the <span className="r">Static Citadel</span>!
    </div>
  );
}

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

function FocusPicker({ grade, focus, note, onFocus }: { grade: Grade; focus: FocusChoice; note: string | null; onFocus: (f: FocusChoice) => void }) {
  const avail = catalog.available(grade);
  const subj = focus.subject === "mixed" ? null : focus.subject;
  const pickSubject = (s: RoboSubject) => {
    if (s === "mixed") onFocus(MIXED);
    else if (s !== focus.subject) onFocus({ subject: s, topic: topicForSubject(s, grade, catalog) });
  };
  const topics: { id: TopicChoice; label: string; ok: boolean; note?: string }[] = subj
    ? [{ id: "all", label: allLabel(subj), ok: true }, ...topicsOf(subj).map((t) => ({ id: t.id, label: t.label, ok: avail.includes(t.id), note: catalog.gradesNote(t.id) }))]
    : [];
  return (
    <div className="rm-focus">
      <div className="rm-h rm-pixel" style={{ marginTop: 14 }}>PICK A SUBJECT</div>
      <div className="rm-subjects" role="radiogroup" aria-label="Subject" onKeyDown={radioKeys}>
        {SUBJECT_CHOICES.map((s) => {
          const on = focus.subject === s.id;
          return (
            <button key={s.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} data-subject={s.id} className={`rm-subject ${on ? "on" : ""}`} onClick={() => pickSubject(s.id)}>
              <span className="rm-pixel">{s.label}</span>
              <small>{s.note}</small>
            </button>
          );
        })}
      </div>
      {note && <div className="rm-help rm-focusnote">{note}</div>}
      {subj && (
        <div className="rm-chips topics" role="radiogroup" aria-label="Topic" onKeyDown={radioKeys}>
          {topics.map((t) => {
            const on = t.ok && focus.subject !== "mixed" && focus.topic === t.id;
            return (
              <button key={t.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} disabled={!t.ok} className={`rm-chip ${t.id === "all" ? "all" : ""} ${on ? "on" : ""}`} data-topic={t.id} onClick={() => onFocus({ subject: subj, topic: t.id })} title={t.ok ? t.label : `${t.label}: ${t.note}`}>
                {t.label}
                {!t.ok && <small>{t.note}</small>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TitleScreen({
  grade, onGrade, focus, focusNote, onFocus, onStart, save, onErase, highScore,
}: {
  grade: Grade; onGrade: (g: Grade) => void; focus: FocusChoice; focusNote: string | null; onFocus: (f: FocusChoice) => void; onStart: () => void;
  save: SaveData; onErase: () => void; highScore: number;
}) {
  const fromArcade = gradeFromArcade();
  const [confirmErase, setConfirmErase] = useState(false);
  const one = focus.subject === "mixed" ? null : focus.topic === "all" ? `${FOCUS_SUBJECTS.find((x) => x.id === focus.subject)!.label} (each robot picks a topic)` : focusTopic(focus.topic).label;
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { startRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="rm-overlay title">
      <div className="rm-panel title">
        <div className="rm-logo"><Portrait who="hero" /></div>
        <div className="rm-title rm-pixel">ROBO MASTERS</div>
        <div className="rm-sub rm-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>
        <div className="rm-tag">Eight robots got glitched. Help <b className="c">{HERO.name}</b> reboot them — with right answers!</div>

        {fromArcade ? (
          <div className="rm-sub rm-pixel rm-gradebadge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="rm-h rm-pixel" style={{ marginTop: 14 }}>PICK YOUR GRADE</div>
            <div className="rm-grades" role="radiogroup" aria-label="Grade" onKeyDown={radioKeys}>
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={g === grade} tabIndex={g === grade ? 0 : -1} className={`rm-grade rm-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <FocusPicker grade={grade} focus={focus} note={focusNote} onFocus={onFocus} />
        {one && (
          <div className="rm-help rm-focusline">
            All eight Robo Masters ask: <b className="c">{one}</b>
          </div>
        )}

        <div style={{ textAlign: "center", margin: "12px 0 4px" }}>
          <button ref={startRef} className="rm-cta big" onClick={onStart}>Press start ▶</button>
        </div>
        <div className="rm-savebar rm-help">
          <span>
            Rebooted <b className="g">{save.beaten.length}/8</b>
            {save.fortress ? <b className="y"> · CITADEL CLEARED!</b> : ""}
          </span>
          {save.beaten.length > 0 && (
            <span className="rm-powerchips" aria-label="Powers earned">
              {powersOf(save).map((p) => (
                <span key={p} className="rm-powerchip"><PowerIcon p={p} />{POWERS[p].name}</span>
              ))}
            </span>
          )}
          {(save.beaten.length > 0 || save.fortress) && (
            <button className="rm-cta ghost" style={{ padding: "6px 8px", fontSize: 8 }} onClick={() => (confirmErase ? (onErase(), setConfirmErase(false)) : setConfirmErase(true))}>
              {confirmErase ? "Tap again to erase" : "Erase save"}
            </button>
          )}
        </div>
        <div className="rm-h rm-pixel" style={{ marginTop: 10 }}>HOW TO PLAY</div>
        <HowToPlay />
        <div className="rm-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")} · Progress saves on this device.</div>
      </div>
    </div>
  );
}

function StageSelect({ grade, focus, save, onPick, onBack, sel, onSel }: { grade: Grade; focus: FocusChoice; save: SaveData; onPick: (id: StageId) => void; onBack: () => void; sel: number; onSel: (i: number) => void }) {
  const open = fortressOpen(save);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    refs.current[sel]?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" ? -3 : e.key === "ArrowDown" ? 3 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (sel + d + 9) % 9;
    onSel(j);
    refs.current[j]?.focus();
  };
  return (
    <div className="rm-overlay title">
      <div className="rm-select">
        <div className="rm-panel title">
          <div className="rm-h rm-pixel" style={{ textAlign: "center", color: "var(--rm-yellow)" }}>STAGE SELECT · {gradeLabel(grade).toUpperCase()} · {focusLabel(focus).toUpperCase()}</div>
          <div className="rm-grid" onKeyDown={onKey}>
            {GRID.map((id, i) => {
              if (!id) {
                return (
                  <button
                    key="center"
                    ref={(el) => (refs.current[i] = el)}
                    className={`rm-tile center ${open ? "open" : "locked"}`}
                    data-stage="fortress"
                    aria-disabled={!open}
                    onFocus={() => onSel(i)}
                    onClick={() => open && onPick("fortress")}
                    title={open ? FINAL_BOSS.stage.name : "Reboot all eight Robo Masters to open the Static Citadel"}
                  >
                    <Portrait who={open ? "static" : "hero"} />
                    <span className="nm">{open ? "STATIC CITADEL" : HERO.name}</span>
                    <span className="subj">{open ? "Every subject!" : `${save.beaten.length}/8 rebooted`}</span>
                    <span className="pw">{open ? (save.fortress ? "CLEARED ✓ — play again" : "FINAL BOSS") : "Citadel locked"}</span>
                  </button>
                );
              }
              const r = robotById(id);
              const beaten = save.beaten.includes(id);
              const src = sourceLabel(resolveRobot(r, grade, focus, catalog));
              return (
                <button key={id} ref={(el) => (refs.current[i] = el)} className={`rm-tile ${beaten ? "beaten" : ""}`} data-stage={id} data-beaten={beaten ? "1" : "0"} onFocus={() => onSel(i)} onClick={() => onPick(id)} title={`${r.name}: ${r.title}`}>
                  {beaten && <span className="done">✓</span>}
                  <Portrait who={id} />
                  <span className="nm">{r.name}</span>
                  <span className="subj">{src}</span>
                  <span className="pw">{beaten ? <><PowerIcon p={r.power} /> {POWERS[r.power].name}</> : r.stage.name}</span>
                </button>
              );
            })}
          </div>
          <div className="rm-help" style={{ marginTop: 8, textAlign: "center" }}>
            Arrows + Enter or tap a Robo Master. Any order! {save.beaten.length > 0 ? "Earned powers work in every stage (C / SWAP to pick one, X / POWER to use it)." : ""}
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button className="rm-cta ghost" onClick={onBack}>◀ Title</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cleared({ robot, save, onNext }: { robot: Robot; save: SaveData; onNext: () => void }) {
  const P = POWERS[robot.power];
  const helps = ROBOTS.filter((r) => r.weakness === robot.power || gatePowerFor(r.id) === robot.power);
  const weakTo = ROBOTS.find((r) => r.weakness === robot.power);
  return (
    <div className="rm-overlay">
      <div className="rm-panel won" style={{ textAlign: "center" }}>
        <div className="rm-h rm-pixel" style={{ color: "var(--rm-yellow)" }}>{robot.name} REBOOTED!</div>
        <div className="rm-help">“{robot.lines.defeat}”</div>
        <div className="rm-earned">
          <Portrait who={robot.id} />
          <div style={{ textAlign: "left" }}>
            <div className="rm-pixel" style={{ fontSize: 11, color: P.color }} data-power={robot.power}>YOU GOT: {P.name.toUpperCase()}</div>
            <div className="rm-help">It {P.desc}. Press <kbd>C</kbd> (or SWAP) to pick it and <kbd>X</kbd> (or POWER) to use it.</div>
            {weakTo && <div className="rm-help rm-hint">Tip: {weakTo.name} has a weak spot for it, and {helps.map((r) => r.stage.name).filter((v, i, a) => a.indexOf(v) === i).join(" and ")} hides a power spot it opens.</div>}
          </div>
        </div>
        <div className="rm-help">Rebooted {save.beaten.length}/8{fortressOpen(save) ? " — the STATIC CITADEL is open!" : ""}</div>
        <div style={{ marginTop: 12 }}>
          <button className="rm-cta" autoFocus onClick={onNext}>Stage select ▶</button>
        </div>
      </div>
    </div>
  );
}

function Victory({ log, grade, focus, score, highScore, onMenu, onSelect }: { log: LogEntry[]; grade: Grade; focus: FocusChoice; score: number; highScore: number; onMenu: () => void; onSelect: () => void }) {
  const byStd = new Map<string, { skill: string; subject: Subject; n: number; c: number }>();
  for (const l of log) {
    const cur = byStd.get(l.standard) ?? { skill: l.skill, subject: l.subject, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.standard, cur);
  }
  const right = log.filter((l) => l.correct).length;
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);
  return (
    <div className="rm-overlay">
      <div className="rm-panel won">
        <div className="rm-h rm-pixel" style={{ color: "var(--rm-yellow)" }}>THE STATIC CITADEL IS CLEARED! · {gradeLabel(grade).toUpperCase()}</div>
        <div className="rm-help">“{FINAL_BOSS.lines.defeat}”</div>
        <div className="rm-help big">
          Every robot is rebooted. You are a true <b className="y">ROBO MASTER</b>! Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Questions <b className="g">{right}/{log.length}</b> · {focusLabel(focus)}
        </div>
        {byStd.size > 0 && (
          <div className="rm-tablewrap">
            <table className="rm-report-table">
              <thead><tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr></thead>
              <tbody>
                {[...byStd.entries()].map(([std, v]) => (
                  <tr key={std}>
                    <td className="c">{std}</td>
                    <td><span className={`rm-dot ${v.subject}`} />{v.skill} <span className="dim">({SUBJECT_TAG[v.subject]})</span></td>
                    <td style={{ color: v.c === v.n ? "var(--rm-green)" : v.c / v.n >= 0.75 ? "var(--rm-yellow)" : "var(--rm-red)" }}>{v.c}/{v.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {practice.length > 0 && (
          <div className="rm-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="rm-cta ghost" onClick={onMenu}>Title screen</button>
          <button className="rm-cta" autoFocus onClick={onSelect}>Stage select ▶</button>
        </div>
      </div>
    </div>
  );
}

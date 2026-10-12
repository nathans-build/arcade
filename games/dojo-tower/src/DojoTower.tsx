import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
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
  type DealtQuestion,
  type Grade,
  type Subject,
} from "@/kit";
import { DojoEngine } from "@/dojo/engine";
import { FLOOR_INFO, TOPIC_LABEL, TOPIC_NOTES } from "@/dojo/floors";
import { bandOf } from "@/dojo/qmake";
import { METER_MAX, type BossResult } from "@/dojo/rules";
import { START_LIVES, MAX_ENERGY, type Hud } from "@/dojo/sim";
import { TopicDecks, focusCatalog } from "@/dojo/topics";
import {
  FOCUS_SUBJECTS,
  MIXED,
  SUBJECT_CHOICES,
  allLabel,
  focusFromUrl,
  focusLabel,
  focusTag,
  focusTopic,
  loadFocus,
  refocusSavedForGrade,
  saveFocus,
  topicForSubject,
  topicsOf,
  validateFocus,
  type DojoSubject,
  type FocusChoice,
  type TopicChoice,
} from "@/dojo/focus";
import "@/dojo/dojo.css";

const GAME_ID = "dojo-tower";

/** Dojo Tower's own 16-step bassline (a marching minor-key climb; Hz, 0 = rest). */
const BASS = [110, 0, 110, 165, 0, 147, 131, 0, 98, 0, 98, 147, 0, 131, 123, 110];

type Screen = "title" | "playing" | "over" | "won";

interface Quiz {
  kind: "boss" | "scroll";
  floor: number;
  q: DealtQuestion;
  picked: number | null;
  result: BossResult | null;
}

interface LogEntry {
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
  kind: "boss" | "scroll";
}

const SUBJECT_LABELS: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "CIVICS" };

const EMPTY_HUD: Hud = {
  score: 0, lives: START_LIVES, energy: MAX_ENERGY, floor: 1, meter: 0, streak: 0, mode: "intro", bossHp: 0, bossMaxHp: 0, progress: 0,
};

const HELD_KEYS: Record<string, "left" | "right" | "down"> = { ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down" };

/** First visit state: `?topic=` / `?subject=` from the arcade menu win for this visit, then the saved choice. */
function initialFocus(grade: Grade): { choice: FocusChoice; note: string | null } {
  const url = focusFromUrl(typeof window === "undefined" ? "" : window.location.search, grade, focusCatalog);
  let note: string | null = null;
  if (url.unavailable) {
    const t = focusTopic(url.unavailable);
    note = `${t.label} is for ${focusCatalog.gradesNote(t.id)}, not ${gradeLabel(grade)}.`;
  }
  return { choice: url.choice ?? validateFocus(loadFocus(), grade, focusCatalog), note };
}

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

export default function DojoTower() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DojoEngine | null>(null);
  const decksRef = useRef<TopicDecks | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 132), []);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [focusInit] = useState(() => initialFocus(initialGrade("3")));
  const [focus, setFocus] = useState<FocusChoice>(focusInit.choice);
  const [focusNote, setFocusNote] = useState<string | null>(focusInit.note);
  /** The focus the current run was started with (the report and question headers use it). */
  const [runFocus, setRunFocus] = useState<FocusChoice>(MIXED);
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
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
  const runTag = focusTag(runFocus);
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

  const ask = useCallback((kind: Quiz["kind"], floor: number) => {
    const decks = decksRef.current;
    if (!decks) return;
    const topic = FLOOR_INFO[floor - 1].topic;
    const q = decks.draw(topic, kind === "scroll");
    engineRef.current?.releaseAll();
    setQuiz({ kind, floor, q, picked: null, result: null });
    if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
  }, []);

  // Create the engine once; it plays an attract-mode demo behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new DojoEngine(canvas, audio, {
      onHud: setHud,
      onScroll: () => ask("scroll", engine.sim.floor),
      onBossStart: (floor) => ask("boss", floor),
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
    engine.showDemo(bandOf(gradeRef.current));
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, ask]);

  // Mirror the open question on the game screen's hanging scroll.
  useEffect(() => {
    engineRef.current?.setCard(
      quiz
        ? {
            title: `${quiz.kind === "boss" ? `VS ${FLOOR_INFO[quiz.floor - 1].bossName}` : "QUESTION SCROLL"} · ${runTag ?? SUBJECT_LABELS[quiz.q.subject]}`,
            prompt: quiz.q.prompt,
            choices: quiz.q.choices,
            picked: quiz.picked,
            answer: quiz.q.answer,
          }
        : null,
    );
    // Playtest hook: the open question (with its answer) for automated tests.
    if (debug) (window as unknown as { __dtQuiz: Quiz | null }).__dtQuiz = quiz;
  }, [quiz, runTag]);

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
    // Re-check the focus for the new grade: a topic it can't offer falls back to the subject's first one, or MIX.
    setFocus((f) => validateFocus(f, g, focusCatalog));
    refocusSavedForGrade(g, focusCatalog);
    setFocusNote(null);
    setReadAloud(readAloudPref(isEarlyReader(g)));
    engineRef.current?.showDemo(bandOf(g));
  }, []);

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    const f = validateFocus(focus, grade, focusCatalog);
    setRunFocus(f);
    engineRef.current?.setFocusTag(focusTag(f));
    decksRef.current = new TopicDecks(grade, GAME_ID, f);
    setLog([]);
    setQuiz(null);
    setPaused(false);
    setHud(EMPTY_HUD);
    setScreen("playing");
    engineRef.current?.newGame(bandOf(grade));
  }, [audio, grade, focus]);

  const chooseFocus = useCallback((f: FocusChoice) => {
    setFocus(f);
    saveFocus(f);
    setFocusNote(null);
  }, []);

  const toMenu = useCallback(() => {
    engineRef.current?.setFocusTag(null);
    engineRef.current?.showDemo(bandOf(grade));
    setScreen("title");
  }, [grade]);

  const answer = useCallback(
    (i: number) => {
      if (!quiz || quiz.picked !== null) return;
      audio.unlock();
      const correct = i === quiz.q.answer;
      recordAnswer(GAME_ID, quiz.q, correct);
      setLog((l) => [...l, { subject: quiz.q.subject, standard: quiz.q.standard, skill: quiz.q.skill, correct, kind: quiz.kind }]);
      let result: BossResult | null = null;
      if (quiz.kind === "boss") result = engineRef.current?.answerBoss(correct) ?? null;
      else if (correct) audio.correct();
      else audio.wrong();
      setQuiz({ ...quiz, picked: i, result });
      if (readAloudRef.current) speak(correct ? `Correct! ${quiz.q.explanation}` : `The answer is ${quiz.q.choices[quiz.q.answer]}. ${quiz.q.explanation}`);
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
    } else if (quiz.result?.defeated) {
      e?.finishFloor();
      setQuiz(null);
    } else {
      ask("boss", quiz.floor);
    }
  }, [quiz, ask]);

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

  // Keyboard. A-D are only ever answer keys, never movement.
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
  }, [screen, quiz, paused, answer, next, togglePause, replay, startGame, audio]);

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
  const pressProps = (a: "jump" | "punch" | "kick" | "thunder") => ({
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

  return (
    <div className={`dt-root ${early ? "early" : ""}`}>
      <div className="dt-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="dt-tools">
          {playing && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
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
          <div><span className="lbl">Floor</span><span className="val">{hud.floor}/5</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, hud.lives))}</span></div>
          <div><span className="lbl">Streak</span><span className={`val ${thunderReady ? "ready" : ""}`}>{hud.streak}{thunderReady ? " ⚡" : ""}</span></div>
        </div>

        <div className="dt-stage" ref={stageRef}>
          <div className="dt-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Dojo Tower game screen" />

            {screen === "title" && (
              <TitleScreen grade={grade} onGrade={chooseGrade} focus={focus} focusNote={focusNote} onFocus={chooseFocus} onStart={startGame} highScore={highScore} />
            )}

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
                grade={grade}
                score={hud.score}
                floor={hud.floor}
                highScore={highScore}
                focus={runFocus}
                onAgain={startGame}
                onMenu={toMenu}
              />
            )}
          </div>
        </div>

        {playing && quiz && <QuizPanel quiz={quiz} tag={runTag} onAnswer={answer} onNext={next} onSpeak={replay} />}

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
            <button className={`dt-touch thunder ${thunderReady ? "ready" : ""}`} {...pressProps("thunder")} aria-label="Thunder Kick">⚡</button>
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

function QuizPanel({ quiz, tag, onAnswer, onNext, onSpeak }: { quiz: Quiz; tag: string | null; onAnswer: (i: number) => void; onNext: () => void; onSpeak: () => void }) {
  const { q, picked, result } = quiz;
  const f = FLOOR_INFO[quiz.floor - 1];
  const done = picked !== null;
  const correct = done && picked === q.answer;
  let verdict = "";
  if (done && quiz.kind === "scroll") verdict = correct ? "✔ CORRECT! +ENERGY" : `✘ NOT QUITE — THE ANSWER IS ${"ABCD"[q.answer]}`;
  if (done && quiz.kind === "boss") {
    if (!correct) verdict = `✘ BLOCKED! THE ANSWER IS ${"ABCD"[q.answer]}`;
    else if (result?.defeated) verdict = `✔ ${result.thunder ? "THUNDER KICK! " : ""}${f.bossName} IS BEATEN!`;
    else if (result?.thunder) verdict = "✔ THUNDER KICK! DOUBLE HIT!";
    else verdict = "✔ RIGHT! COMBO HIT!";
  }
  const nextLabel = quiz.kind === "scroll" ? "Back to the fight ▶" : result?.defeated ? (quiz.floor >= 5 ? "Claim the tower ▶" : "Climb to the next floor ▶") : "Next question ▶";
  return (
    <div className={`dt-quiz ${quiz.kind} ${done ? (correct ? "correct" : "wrong") : ""}`} role="dialog" aria-label={quiz.kind === "boss" ? "Floor master question" : "Question scroll"}>
      <div className="head dt-pixel">
        <span>{quiz.kind === "boss" ? `VS ${f.bossName}` : "QUESTION SCROLL"}</span>
        <span className="std">
          {tag ?? SUBJECT_LABELS[q.subject]} · {q.standard}
          {speechSupported() && (
            <button type="button" className="dt-speak" onClick={onSpeak} aria-label="Read the question aloud" title="Read aloud (R)">
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
          <div className={`verdict dt-pixel ${correct ? "ok" : "no"}`}>{verdict}</div>
          <div className="why">{q.explanation}</div>
          <div className="row">
            <span className="dim">{quiz.kind === "boss" && !correct ? "Wrong answers never cost a life — try the next one!" : ""}</span>
            <button className="dt-cta" autoFocus onClick={onNext}>{nextLabel}</button>
          </div>
        </div>
      )}
      {!done && <div className="hint dim">Press 1–4 or A–D, or tap an answer.</div>}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="dt-help" style={{ marginTop: 10, textAlign: "left" }}>
      <kbd>◀</kbd> <kbd>▶</kbd> walk · <kbd>▼</kbd> duck · <kbd>▲</kbd> or <kbd>SPACE</kbd> jump · <kbd>Z</kbd> punch · <kbd>X</kbd> kick ·{" "}
      <kbd>T</kbd> Thunder Kick · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>P</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud
      <br />
      Poof the <span className="c">Ink Ninjas</span> into confetti. <span className="y">Duck</span> under high ink stars, <span className="y">jump</span> over low
      ones, and <span className="y">duck + punch</span> the little ink blobs. Beat a ninja carrying a <span className="y">gold scroll</span> to answer a bonus
      question for energy. At the end of each floor a <span className="r">floor master</span> fights with questions: every right answer lands a combo hit,
      and a wrong answer is only blocked. Get <span className="g">{METER_MAX} right in a row</span> to charge the <span className="y">THUNDER KICK</span>!
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

/** Subject row (MATH · SCIENCE · ELA · SOCIAL STUDIES · MIXED), then, for one subject, its topics. */
function FocusPicker({ grade, focus, note, onFocus }: { grade: Grade; focus: FocusChoice; note: string | null; onFocus: (f: FocusChoice) => void }) {
  const avail = focusCatalog.available(grade);
  const subj = focus.subject === "mixed" ? null : focus.subject;
  const pickSubject = (s: DojoSubject) => {
    if (s === "mixed") onFocus(MIXED);
    else if (s !== focus.subject) onFocus({ subject: s, topic: topicForSubject(s, grade, focusCatalog) });
  };
  const topics: { id: TopicChoice; label: string; ok: boolean; note?: string }[] = subj
    ? [
        { id: "all", label: allLabel(subj), ok: true },
        ...topicsOf(subj).map((t) => ({ id: t.id, label: t.label, ok: avail.includes(t.id), note: focusCatalog.gradesNote(t.id) })),
      ]
    : [];
  return (
    <div className="dt-focus">
      <div className="dt-h dt-pixel" style={{ marginTop: 14 }}>PICK A SUBJECT</div>
      <div className="dt-subjects" role="radiogroup" aria-label="Subject" onKeyDown={radioKeys}>
        {SUBJECT_CHOICES.map((s) => {
          const on = focus.subject === s.id;
          return (
            <button key={s.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} data-subject={s.id} className={`dt-subject ${on ? "on" : ""}`} onClick={() => pickSubject(s.id)}>
              <span className="dt-pixel">{s.label}</span>
              <small>{s.note}</small>
            </button>
          );
        })}
      </div>
      {note && <div className="dt-help dt-focusnote">{note}</div>}
      {subj && (
        <div className="dt-chips topics" role="radiogroup" aria-label="Topic" onKeyDown={radioKeys}>
          {topics.map((t) => {
            const on = t.ok && focus.subject !== "mixed" && focus.topic === t.id;
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                disabled={!t.ok}
                className={`dt-chip ${t.id === "all" ? "all" : ""} ${on ? "on" : ""}`}
                data-topic={t.id}
                onClick={() => onFocus({ subject: subj, topic: t.id })}
                title={t.ok ? t.label : `${t.label}: ${t.note}`}
              >
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
  grade, onGrade, focus, focusNote, onFocus, onStart, highScore,
}: {
  grade: Grade; onGrade: (g: Grade) => void; focus: FocusChoice; focusNote: string | null; onFocus: (f: FocusChoice) => void; onStart: () => void; highScore: number;
}) {
  const fromArcade = gradeFromArcade();
  const band = bandOf(grade);
  const one = focus.subject === "mixed" ? null : focus.topic === "all" ? `${FOCUS_SUBJECTS.find((x) => x.id === focus.subject)!.label} (any topic)` : focusTopic(focus.topic).label;
  // Focus the start button without scrolling the panel down past the title and subject picker.
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { startRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="dt-overlay title">
      <div className="dt-panel title">
        <div className="dt-title dt-pixel">DOJO TOWER</div>
        <div className="dt-sub dt-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>

        {fromArcade ? (
          <div className="dt-sub dt-pixel dt-gradebadge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="dt-h dt-pixel" style={{ marginTop: 14 }}>PICK YOUR GRADE</div>
            <div className="dt-grades" role="radiogroup" aria-label="Grade" onKeyDown={radioKeys}>
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={g === grade} tabIndex={g === grade ? 0 : -1} className={`dt-grade dt-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <FocusPicker grade={grade} focus={focus} note={focusNote} onFocus={onFocus} />

        {one && (
          <div className="dt-help dt-focusline">
            All 5 floor masters and every gold scroll ask: <b className="c">{one}</b>
          </div>
        )}
        <div className={`dt-floors ${one ? "compact" : ""}`}>
          {[...FLOOR_INFO].reverse().map((f) => (
            <div key={f.n} className="dt-floorrow">
              <span className="n dt-pixel">{f.n}F</span>
              <span className="hall">{f.hall}{!one && <span className="dim"> · {TOPIC_LABEL[f.topic]}</span>}</span>
              {!one && <span className="topic">{TOPIC_NOTES[band][f.topic]}</span>}
              <span className="boss">{f.bossName}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", margin: "12px 0 4px" }}>
          <button ref={startRef} className="dt-cta big" onClick={onStart}>Enter the tower ▶</button>
        </div>
        <div className="dt-h dt-pixel" style={{ marginTop: 10 }}>HOW TO PLAY</div>
        <HowToPlay />
        <div className="dt-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function Report({
  won, log, grade, score, floor, highScore, focus, onAgain, onMenu,
}: {
  won: boolean; log: LogEntry[]; grade: Grade; score: number; floor: number; highScore: number; focus: FocusChoice; onAgain: () => void; onMenu: () => void;
}) {
  const one = focus.subject !== "mixed";
  const wholeSubject = focus.subject !== "mixed" && focus.topic === "all";
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
    <div className="dt-overlay">
      <div className={`dt-panel ${won ? "won" : ""}`}>
        <div className="dt-h dt-pixel" style={{ color: won ? "var(--dt-yellow)" : "var(--dt-red)" }}>
          {won ? "TOWER CLEARED! YOU ARE A DOJO MASTER" : "OUT OF LIVES — TRAINING REPORT"} · {gradeLabel(grade).toUpperCase()}
        </div>
        <div className="dt-help dt-reportmode">
          {one ? (
            <>
              <span className="y">FOCUS:</span> {focusLabel(focus)} — every question was {wholeSubject ? "in this subject" : "on this topic"}.
            </>
          ) : (
            <>
              <span className="y">MIXED:</span> ELA, math, civics, forces and a mixed roof.
            </>
          )}
        </div>
        <div className="dt-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · {won ? "All 5 floors" : <>Reached floor <b className="c">{floor}</b></>} · Questions{" "}
          <b className="g">{right}/{log.length}</b>
        </div>
        {byStd.size > 0 ? (
          <div className="dt-tablewrap">
            <table className="dt-report-table">
              <thead>
                <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
              </thead>
              <tbody>
                {[...byStd.entries()].map(([std, v]) => (
                  <tr key={std}>
                    <td className="c">{std}</td>
                    <td><span className={`dt-dot ${v.subject}`} />{v.skill}</td>
                    <td style={{ color: v.c === v.n ? "var(--dt-green)" : v.c / v.n >= 0.75 ? "var(--dt-yellow)" : "var(--dt-red)" }}>{v.c}/{v.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dt-help" style={{ marginTop: 8 }}>No questions answered yet. Reach a floor master or a scroll ninja next time!</div>
        )}
        {practice.length > 0 && (
          <div className="dt-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}. These come up more often.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="dt-cta ghost" onClick={onMenu}>Title screen</button>
          <button className="dt-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

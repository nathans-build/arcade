import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipAudio, exposeMusicDebug } from "@/kit/audio";
import { GRADES, arcadeLink, gradeFromArcade, gradeLabel, initialGrade, isEarlyReader, rememberGrade } from "@/kit/grades";
import { loadProgress, recordAnswer, submitScore } from "@/kit/progress";
import { readAloudPref, setReadAloudPref, speak, speakQuestion, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade } from "@/kit/types";
import { COLS, ROWS } from "@/lab/board";
import { gradeN, makeLevelSet, type KindDef, type LabQuestion, type LevelSet } from "@/lab/content";
import { LabGame, SPEEDS, isSpeed, type GameEvent, type SpeedId } from "@/lab/game";
import { KIND_COLORS, KIND_NAMES, MASCOT_H, MASCOT_W, bottleMetrics, drawBottle, drawLegendGerm, drawMascot, drawNext, type Mood, type Popup } from "@/lab/render";
import { seeded } from "@/lab/rng";
import { LabRun, QUIZ_BONUS } from "@/lab/run";
import {
  SUBJECT_MODES, focusName, subjectNote, focusTag, gradesNote, loadPref, prefOf, readUrlFocus, resolveFocus, savePref, setForLevel, topicAvailable, topicsFor,
  type Focus, type FocusPref,
} from "@/lab/topics";
import { BOTTLE_FULL, CHAIN_REACTION, EUREKA, JINGLES, LAB_CLEAN, SONGS, speedSong } from "@/music";
import "@/lab/lab.css";

const GAME_ID = "lab-capsules";
const SPEED_KEY = "arcade.lab-capsules.speed";
const HINT_KEY = "arcade.lab-capsules.hints";


type Screen = "title" | "play" | "clear" | "quiz" | "over";

interface Hud {
  score: number;
  level: number;
  germs: number;
  nextKey: string;
}

interface QuizView {
  q: LabQuestion;
  picked: number | null;
}

function loadSpeed(): SpeedId {
  try {
    const v = localStorage.getItem(SPEED_KEY);
    if (isSpeed(v)) return v;
  } catch {
    // ignore
  }
  return "slow";
}
function loadHints(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
}
function store(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    // ignore
  }
}

/** Arrow keys move between the buttons of a radiogroup. */
function arrowNav(e: React.KeyboardEvent<HTMLElement>) {
  const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
  if (!step) return;
  const btns = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
  const i = btns.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0) return;
  e.preventDefault();
  e.stopPropagation();
  btns[(i + step + btns.length) % btns.length].focus();
}

const debugOn = (() => {
  try {
    return new URLSearchParams(window.location.search).has("debug");
  } catch {
    return false;
  }
})();

/** ?debug&level=N starts at level N (playtests and screenshots only). */
const debugLevel = (() => {
  try {
    const p = new URLSearchParams(window.location.search);
    const n = Number(p.get("level"));
    return p.has("debug") && Number.isInteger(n) && n >= 1 && n <= 30 ? n : 1;
  } catch {
    return 1;
  }
})();

/** A still bottle for the title screen. */
function demoGame(g: Grade, f: Focus): LabGame {
  const rng = seeded(42);
  const set = makeLevelSet(setForLevel(f, g, 3), g, 3, rng);
  return new LabGame({ set, speed: "slow", rng });
}

export default function LabCapsules() {
  const audio = useMemo(() => new ChipAudio(), []);
  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [urlFocus] = useState(() => readUrlFocus(window.location.search, initialGrade("3")));
  const [pref, setPref] = useState<FocusPref>(() => urlFocus.pref ?? loadPref());
  const focus = useMemo(() => resolveFocus(pref, grade), [pref, grade]);
  const [speed, setSpeed] = useState<SpeedId>(loadSpeed);
  const [hints, setHints] = useState<boolean>(loadHints);
  const [screen, setScreen] = useState<Screen>("title");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  useEffect(() => exposeMusicDebug(audio, SONGS, JINGLES), [audio]);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch, setTouch] = useState(false);
  const [hud, setHud] = useState<Hud>({ score: 0, level: 1, germs: 0, nextKey: "" });
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [notes, setNotes] = useState<React.ReactNode>("");
  const [setInfo, setSetInfo] = useState<LevelSet | null>(null);
  const [quiz, setQuiz] = useState<QuizView | null>(null);
  const [help, setHelp] = useState(false);

  const runRef = useRef<LabRun | null>(null);
  const demoRef = useRef<LabGame>(demoGame(grade, focus));
  const screenRef = useRef<Screen>("title");
  screenRef.current = screen;
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const hintsRef = useRef(hints);
  hintsRef.current = hints;
  const quizRef = useRef<QuizView | null>(null);
  quizRef.current = quiz;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);
  const mascotRef = useRef<HTMLCanvasElement>(null);
  const cellRef = useRef(24);
  const popupsRef = useRef<Popup[]>([]);
  const moodRef = useRef<{ mood: Mood; until: number }>({ mood: "idle", until: 0 });
  const timersRef = useRef<number[]>([]);
  const early = isEarlyReader(grade);

  useEffect(() => {
    rememberGrade(grade);
  }, [grade]);

  // the title screen's still bottle follows the grade/subject picked
  useEffect(() => {
    if (screen === "title") demoRef.current = demoGame(grade, focus);
  }, [grade, focus, screen]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const on = () => setTouch(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timersRef.current.forEach((t) => clearTimeout(t)), []);

  const say = useCallback((text: string) => {
    if (readAloudRef.current) speak(text);
  }, []);

  /* ------------------------------------------------------------------ sizing */

  const fit = useCallback(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;
    const { width, height } = wrap.getBoundingClientRect();
    // cell so that the whole bottle (with its neck and frame) fits
    const cell = Math.max(12, Math.floor(Math.min(width / (COLS + 0.6), height / (ROWS + 1.2))));
    cellRef.current = cell;
    const m = bottleMetrics(cell);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.style.width = `${m.w}px`;
    cv.style.height = `${m.h}px`;
    cv.width = Math.round(m.w * dpr);
    cv.height = Math.round(m.h * dpr);
  }, []);

  useEffect(() => {
    fit();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fit]);

  /* ------------------------------------------------------------------ levels */

  const showLevel = useCallback(
    (run: LabRun) => {
      const set = run.game.set;
      setSetInfo(set);
      setHud({ score: run.game.score, level: run.level, germs: run.game.germs, nextKey: "" });
      setNotes(
        <>
          <b>Level {run.level}: {set.title}.</b> {set.rule}
        </>,
      );
      say(`Level ${run.level}. ${set.rule}`);
    },
    [say],
  );

  const start = useCallback(() => {
    audio.unlock();
    const run = new LabRun(grade, focus, speed, seeded((Date.now() ^ (Math.random() * 1e9)) >>> 0), debugLevel);
    runRef.current = run;
    popupsRef.current = [];
    savePref(prefOf(focus));
    setPaused(false);
    setQuiz(null);
    setScreen("play");
    showLevel(run);
    audio.duckLevel = isEarlyReader(grade) ? 0.18 : 0.28;
    audio.duck(false);
    audio.setTempoScale(1);
    audio.setIntensity("full");
    audio.playSong(speedSong(speed), { restart: true });
  }, [audio, grade, focus, speed, showLevel]);

  const openQuiz = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    const q = run.finishLevel();
    setHighScore(submitScore(GAME_ID, run.score));
    setHud((h) => ({ ...h, score: run.score }));
    setQuiz({ q, picked: null });
    setScreen("quiz");
    // Thin the music to lead + bass while the lab-quiz question is on screen.
    audio.setTempoScale(1);
    audio.setIntensity("calm");
    if (readAloudRef.current) speakQuestion(`Lab quiz! ${q.prompt}`, q.choices);
  }, [audio]);

  const answer = useCallback(
    (i: number) => {
      const run = runRef.current;
      const cur = quizRef.current;
      if (!run || !cur || cur.picked !== null) return;
      const res = run.answer(i);
      recordAnswer(GAME_ID, cur.q, res.correct);
      setQuiz({ ...cur, picked: i });
      setHud((h) => ({ ...h, score: run.score }));
      if (res.correct) {
        audio.playJingle(EUREKA);
        moodRef.current = { mood: "cheer", until: performance.now() + 1500 };
      } else audio.wrong();
      say(`${res.correct ? "Correct!" : `The answer is ${cur.q.choices[cur.q.answer]}.`} ${cur.q.explanation}`);
    },
    [audio, say],
  );

  const nextLevel = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    stopSpeaking();
    run.nextLevel();
    popupsRef.current = [];
    setQuiz(null);
    setScreen("play");
    showLevel(run);
    audio.setIntensity("full");
  }, [audio, showLevel]);

  const retry = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    run.retry();
    popupsRef.current = [];
    setScreen("play");
    setPaused(false);
    showLevel(run);
    audio.duck(false);
    audio.setTempoScale(1);
    audio.setIntensity("full");
    audio.playSong(speedSong(run.speed), { restart: true });
  }, [audio, showLevel]);

  const toTitle = useCallback(() => {
    stopSpeaking();
    audio.stopMusic();
    setPaused(false);
    setQuiz(null);
    setScreen("title");
  }, [audio]);

  /* ------------------------------------------------------------------ events from the game */

  const handle = useCallback(
    (ev: GameEvent, game: LabGame, run: LabRun) => {
      const now = performance.now();
      switch (ev.type) {
        case "move":
        case "rotate":
          audio.tone(ev.type === "move" ? 520 : 760, 0.03, "square", 0.12);
          break;
        case "land":
          audio.tone(ev.hard ? 160 : 220, 0.07, "triangle", 0.4);
          break;
        case "clear": {
          if (ev.germs) audio.correct();
          else audio.checkpoint();
          if (ev.chain > 1) audio.playJingle(CHAIN_REACTION);
          moodRef.current = { mood: "cheer", until: now + 1200 };
          const parts: React.ReactNode[] = [];
          const spoken: string[] = [];
          for (const g of ev.groups) {
            const [r, c] = g.cells[0];
            if (g.bonus) {
              popupsRef.current.push({ text: g.bonus.title, r, c, t0: now, color: "#7fe7ff" });
              parts.push(<span key={parts.length}><b>{g.bonus.title}</b> {g.bonus.detail} </span>);
              spoken.push(g.bonus.say);
            } else {
              const kd: KindDef = game.set.kinds[g.kind];
              const names = ev.tiles.filter((t) => t.tok.kind === g.kind).map((t) => t.tok.label).filter(Boolean);
              const uniq = [...new Set(names)].slice(0, 5);
              const what = game.set.colored ? `${g.cells.length} ${kd.say}s` : `${uniq.join(", ")}`;
              parts.push(
                <span key={parts.length}>
                  <b>{game.set.colored ? `${g.cells.length} in a row!` : `All ${kd.anchor}!`}</b> {what}
                  {game.set.colored ? "" : ` all mean ${kd.say}.`}{" "}
                </span>,
              );
              spoken.push(game.set.colored ? `${g.cells.length} ${kd.say}s!` : `All ${kd.say}!`);
            }
          }
          const [pr, pc] = ev.groups[0].cells[0];
          popupsRef.current.push({ text: ev.chain > 1 ? `CHAIN ×${ev.chain} +${ev.points}` : `+${ev.points}`, r: pr + 1, c: pc, t0: now + 120, color: "#ffd23f" });
          setNotes(<>{parts}</>);
          if (spoken.length) say(spoken.join(" "));
          break;
        }
        case "won":
          audio.setTempoScale(1);
          audio.playJingle(LAB_CLEAN);
          moodRef.current = { mood: "cheer", until: now + 2500 };
          setHud((h) => ({ ...h, germs: 0, score: game.score }));
          setScreen("clear");
          say("Lab clean! Great job!");
          later(() => {
            if (screenRef.current === "clear" && runRef.current === run) openQuiz();
          }, 1500);
          break;
        case "lost":
          audio.setTempoScale(1);
          audio.playJingle(BOTTLE_FULL, { then: "stop" });
          moodRef.current = { mood: "worried", until: now + 60000 };
          run.lose();
          setHighScore(submitScore(GAME_ID, run.score));
          setHud((h) => ({ ...h, score: run.score }));
          setScreen("over");
          say("Oh no, the bottle is full! Try again!");
          break;
        default:
          break;
      }
    },
    [audio, openQuiz, say],
  );

  // "Almost clean!": the music speeds up a little when only a few germs are left (not for K-2).
  useEffect(() => {
    if (screen !== "play") return;
    audio.setTempoScale(!early && hud.germs > 0 && hud.germs <= 3 ? 1.1 : 1);
  }, [audio, screen, hud.germs, early]);

  /* ------------------------------------------------------------------ main loop */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastNext = "";
    let lastMascot = -1;
    const frame = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      const run = runRef.current;
      const sc = screenRef.current;
      const live = run && sc !== "title";
      const game = live ? run.game : demoRef.current;
      if (live && sc === "play" && !pausedRef.current) {
        game.update(dt);
        const evs = game.events.splice(0);
        for (const ev of evs) handle(ev, game, run);
        setHud((h) =>
          h.score === game.score && h.germs === game.germs && h.level === run.level ? h : { ...h, score: game.score, germs: game.germs, level: run.level },
        );
      } else if (!live) game.events.length = 0;
      // board
      const cv = canvasRef.current;
      if (cv) {
        const ctx = cv.getContext("2d");
        if (ctx) {
          const dpr = cv.width / Math.max(1, parseFloat(cv.style.width) || cv.width);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          popupsRef.current = popupsRef.current.filter((p) => now - p.t0 < 1500);
          drawBottle(ctx, game, { cell: cellRef.current, t: now, hint: hintsRef.current, popups: popupsRef.current, ghost: true });
        }
      }
      // next capsule
      const nk = `${game.set.id}|${game.set.level}|${game.next[0].label}${game.next[0].kind}|${game.next[1].label}${game.next[1].kind}|${hintsRef.current}`;
      const nc = nextRef.current;
      if (nc && nk !== lastNext) {
        lastNext = nk;
        const ctx = nc.getContext("2d");
        if (ctx) {
          const dpr = nc.width / 96;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          drawNext(ctx, game.set, game.next, 96, 48, !game.set.colored && !hintsRef.current);
        }
      }
      // mascot (8 fps is plenty)
      const mc = mascotRef.current;
      const mf = Math.floor(now / 125);
      if (mc && mf !== lastMascot) {
        lastMascot = mf;
        const ctx = mc.getContext("2d");
        if (ctx) {
          const mood = now < moodRef.current.until ? moodRef.current.mood : sc === "over" ? "worried" : "idle";
          ctx.clearRect(0, 0, mc.width, mc.height);
          drawMascot(ctx, 4, 4 + 3 * 3, 3, mood, now);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [handle]);

  /* ------------------------------------------------------------------ controls */

  const act = useCallback((a: "left" | "right" | "cw" | "ccw" | "down" | "drop") => {
    const run = runRef.current;
    if (!run || screenRef.current !== "play" || pausedRef.current) return;
    const g = run.game;
    if (a === "left") g.move(-1);
    else if (a === "right") g.move(1);
    else if (a === "cw") g.rotate(1);
    else if (a === "ccw") g.rotate(-1);
    else if (a === "down") g.stepDown();
    else g.hardDrop();
  }, []);

  const togglePause = useCallback(() => {
    if (screenRef.current !== "play") return;
    setPaused((p) => {
      // Paused: the music carries on quietly underneath.
      audio.duck(!p);
      return !p;
    });
  }, [audio]);

  const toggleMute = useCallback(() => {
    audio.unlock();
    setMuted(audio.toggleMute());
  }, [audio]);

  const toggleRead = useCallback(() => {
    setReadAloud((r) => {
      setReadAloudPref(!r);
      return !r;
    });
  }, []);

  const readCapsule = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    const g = run.game;
    const p = g.piece;
    const parts = p ? [p.a.say, p.b.say] : [];
    speak(`${parts.length ? `This capsule: ${parts.join(" and ")}.` : ""} Next: ${g.next[0].say} and ${g.next[1].say}.`);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const sc = screenRef.current;
      const k = e.key;
      if (k === "m" || k === "M") return toggleMute();
      if (k === "r" || k === "R") return toggleRead();
      if (sc === "title") {
        if (k === "Enter" && !(document.activeElement instanceof HTMLButtonElement)) start();
        return;
      }
      if (sc === "quiz") {
        const cur = quizRef.current;
        if (!cur) return;
        if (cur.picked === null) {
          const i = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k.toLowerCase());
          if (k.length === 1 && i >= 0) {
            e.preventDefault();
            answer(i);
          }
        } else if (k === "Enter" || k === " ") {
          e.preventDefault();
          nextLevel();
        }
        return;
      }
      if (sc === "over") {
        if (k === "Enter" && !(document.activeElement instanceof HTMLButtonElement)) retry();
        return;
      }
      if (sc !== "play") return;
      if (k === "Escape" || k === "p" || k === "P") {
        e.preventDefault();
        return togglePause();
      }
      if (pausedRef.current) return;
      switch (k) {
        case "ArrowLeft":
          e.preventDefault();
          act("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          act("right");
          break;
        case "ArrowUp":
        case "x":
        case "X":
          e.preventDefault();
          if (!e.repeat) act("cw");
          break;
        case "z":
        case "Z":
          e.preventDefault();
          if (!e.repeat) act("ccw");
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!e.repeat) act("down");
          runRef.current?.game.setSoft(true);
          break;
        case " ":
        case "Spacebar":
          e.preventDefault();
          if (!e.repeat) act("drop");
          break;
        default:
          break;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") runRef.current?.game.setSoft(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [act, answer, nextLevel, retry, start, toggleMute, togglePause, toggleRead]);

  // swipe / tap on the bottle: drag sideways to move, drag down to drop faster, flick down to hard-drop, tap to rotate
  const drag = useRef<{ x: number; y: number; x0: number; y0: number; t0: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screenRef.current !== "play") return;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // some browsers refuse capture for synthetic pointers: dragging still works
    }
    drag.current = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const cell = cellRef.current;
    while (e.clientX - d.x >= cell * 0.8) (d.x += cell * 0.8), (d.moved = true), act("right");
    while (d.x - e.clientX >= cell * 0.8) (d.x -= cell * 0.8), (d.moved = true), act("left");
    while (e.clientY - d.y >= cell) (d.y += cell), (d.moved = true), act("down");
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dt = performance.now() - d.t0;
    const dy = e.clientY - d.y0;
    const dx = e.clientX - d.x0;
    if (dy > cellRef.current * 2 && dt < 260 && Math.abs(dy) > Math.abs(dx) * 1.5) act("drop");
    else if (!d.moved && Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 350) act("cw");
  };

  // touch buttons: ◀ ▶ repeat while held, ▼ holds soft drop
  const repeatRef = useRef<number | null>(null);
  const stopRepeat = () => {
    if (repeatRef.current !== null) {
      clearTimeout(repeatRef.current);
      repeatRef.current = null;
    }
    runRef.current?.game.setSoft(false);
  };
  const press = (a: "left" | "right" | "cw" | "ccw" | "down" | "drop") => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    audio.unlock();
    act(a);
    if (a === "left" || a === "right") {
      const rep = (delay: number) => {
        repeatRef.current = window.setTimeout(() => {
          act(a);
          rep(90);
        }, delay);
      };
      rep(240);
    }
    if (a === "down") runRef.current?.game.setSoft(true);
  };

  // leaving the tab pauses the lab
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && screenRef.current === "play" && !pausedRef.current) togglePause();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [togglePause]);

  /* ------------------------------------------------------------------ debug hook (?debug) */

  useEffect(() => {
    if (!debugOn) return;
    const w = window as unknown as Record<string, unknown>;
    w.__lc = () => ({ run: runRef.current, game: runRef.current?.game ?? null, screen: screenRef.current, paused: pausedRef.current });
    w.__lcDebug = {
      clearGerms: () => runRef.current?.game.debugClearGerms(),
      setPiece: (a: number, b: number) => runRef.current?.game.debugSetPiece(a, b),
    };
  }, []);

  /* ------------------------------------------------------------------ render */

  const set = setInfo;
  const legendRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    if (!set) return;
    legendRefs.current.forEach((cv, k) => {
      if (!cv) return;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const dpr = cv.width / 22;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawLegendGerm(ctx, set, k, 22);
    });
  }, [set, screen]);

  const dpr = typeof window !== "undefined" ? Math.min(3, window.devicePixelRatio || 1) : 1;
  const playing = screen !== "title";
  const tag = focusTag(focus);

  return (
    <div className={`lc-root ${early ? "early" : ""} ${touch ? "touch" : ""}`}>
      <div className="lc-toolbar">
        <a href={arcadeLink(grade)} title="Back to SpiderBen10's Arcade">◀ ARCADE</a>
        <span className="brand lc-pixel">LAB CAPSULES</span>
        <div className="lc-tools">
          {playing && (
            <button onClick={screen === "play" ? togglePause : toTitle} aria-label={screen === "play" ? "Pause" : "Title screen"}>
              {screen === "play" ? (paused ? "▶ RESUME" : "❚❚ PAUSE") : "TITLE"}
            </button>
          )}
          {muted ? (
            <button onClick={toggleMute} aria-pressed={false} title="Sound is off on this device (M)">SOUND OFF</button>
          ) : (
            <>
              <button onClick={() => setMusicOn(audio.toggleMusic())} className={musicOn ? "on" : ""} aria-pressed={musicOn} title="Music on/off">MUSIC {musicOn ? "ON" : "OFF"}</button>
              <button onClick={() => setSfxOn(audio.toggleSfx())} className={sfxOn ? "on" : ""} aria-pressed={sfxOn} title="Sound effects on/off">SFX {sfxOn ? "ON" : "OFF"}</button>
            </>
          )}
          {speechSupported() && (
            <button onClick={toggleRead} className={readAloud ? "on" : ""} aria-pressed={readAloud}>
              READ ALOUD {readAloud ? "ON" : "OFF"}
            </button>
          )}
        </div>
      </div>

      <main className="lc-main">
        <section className="lc-left">
          <div className="lc-mascot">
            <canvas ref={mascotRef} width={MASCOT_W * 3 + 8} height={MASCOT_H * 3 + 20} style={{ width: MASCOT_W * 3 + 8, height: MASCOT_H * 3 + 20 }} aria-label="Professor Fizzwick" />
            <div className="lc-notes" aria-live="polite">
              {playing ? notes : <><b>Professor Fizzwick:</b> The germ blobs are loose in the lab! Match them by what they MEAN.</>}
            </div>
          </div>
          {set && playing && (
            <div className="lc-card lc-guide">
              <h3>GERM GUIDE</h3>
              {set.kinds.map((k, i) => (
                <div className="row" key={k.id + i}>
                  <canvas ref={(el) => (legendRefs.current[i] = el)} width={22 * dpr} height={22 * dpr} style={{ width: 22, height: 22 }} />
                  <span style={{ color: KIND_COLORS[i] }}>{set.colored ? `${KIND_NAMES[i]} ${k.shape}` : k.legend}</span>
                </div>
              ))}
              <div className="rule">{set.colored ? "Same color & shape match." : "Capsules fall as clear glass: read them! They glow their germ's color when they land."}</div>
            </div>
          )}
        </section>

        <section className="lc-center">
          <div className="lc-wrap" ref={wrapRef}>
            <canvas
              ref={canvasRef}
              className="board"
              aria-label="Lab bottle"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (drag.current = null)}
            />
          </div>
        </section>

        <section className="lc-right">
          <div className="lc-card lc-stats">
            <span className="lbl">SCORE</span>
            <span className="val y" data-hud="score">{hud.score}</span>
            <span className="lbl hi">HI</span>
            <span className="val hi">{Math.max(highScore, hud.score)}</span>
            <span className="lbl">LEVEL</span>
            <span className="val" data-hud="level">{playing ? hud.level : 1}</span>
            <span className="lbl">GERMS</span>
            <span className="val" data-hud="germs">{playing ? hud.germs : "--"}</span>
          </div>
          <div className="lc-card lc-next">
            <div>
              <h3>NEXT</h3>
              <canvas ref={nextRef} width={96 * dpr} height={48 * dpr} style={{ width: 96, height: 48 }} aria-label="Next capsule" />
            </div>
            {speechSupported() && playing && (
              <button className="lc-speak" onClick={readCapsule} title="Read the capsules aloud" aria-label="Read the capsules aloud">🔊</button>
            )}
          </div>
          {set && playing && <div className="lc-set">{set.title}{tag ? ` · ${tag}` : ""}</div>}
          <div className="lc-keys">
            <kbd>◀</kbd><kbd>▶</kbd> move · <kbd>▼</kbd> faster · <kbd>Z</kbd><kbd>X</kbd> turn · <kbd>SPACE</kbd> drop · <kbd>ESC</kbd> pause
          </div>
        </section>
      </main>

      <div className={`lc-touch ${touch ? "show" : ""}`}>
        <div className="pad">
          <button aria-label="Move left" onPointerDown={press("left")} onPointerUp={stopRepeat} onPointerLeave={stopRepeat} onPointerCancel={stopRepeat}>◀</button>
          <button aria-label="Move right" onPointerDown={press("right")} onPointerUp={stopRepeat} onPointerLeave={stopRepeat} onPointerCancel={stopRepeat}>▶</button>
          <button aria-label="Drop faster" onPointerDown={press("down")} onPointerUp={stopRepeat} onPointerLeave={stopRepeat} onPointerCancel={stopRepeat}>▼</button>
        </div>
        <div className="pad">
          <button aria-label="Turn left" onPointerDown={press("ccw")}>⟲</button>
          <button aria-label="Turn right" onPointerDown={press("cw")}>⟳</button>
          <button className="drop" aria-label="Drop" onPointerDown={press("drop")}>DROP</button>
        </div>
      </div>

      {screen === "title" && (
        <TitleScreen
          grade={grade}
          onGrade={(g) => setGrade(g)}
          focus={focus}
          onPref={(p) => {
            setPref(p);
            savePref(p);
          }}
          notice={urlFocus.note}
          speed={speed}
          onSpeed={(s) => {
            setSpeed(s);
            store(SPEED_KEY, s);
          }}
          hints={hints}
          onHints={(h) => {
            setHints(h);
            store(HINT_KEY, h ? "1" : "0");
          }}
          highScore={highScore}
          help={help}
          onHelp={() => setHelp((h) => !h)}
          onStart={start}
        />
      )}

      {screen === "play" && paused && (
        <div className="lc-overlay">
          <div className="lc-panel lc-banner">
            <div className="lc-title lc-pixel">PAUSED</div>
            <div className="lc-row">
              <button className="lc-cta" autoFocus onClick={togglePause}>Resume ▶</button>
              <button className="lc-cta ghost" onClick={toTitle}>Title screen</button>
            </div>
          </div>
        </div>
      )}

      {screen === "clear" && (
        <div className="lc-overlay clear">
          <div className="lc-panel lc-banner">
            <div className="big lc-pixel">LAB CLEAN!</div>
            <div className="lc-help center">Level {hud.level} cleared · Lab Quiz coming up…</div>
          </div>
        </div>
      )}

      {screen === "quiz" && quiz && (
        <QuizPanel quiz={quiz} level={hud.level} onAnswer={answer} onNext={nextLevel} />
      )}

      {screen === "over" && runRef.current && (
        <GameOver run={runRef.current} grade={grade} focus={focus} highScore={highScore} onRetry={retry} onTitle={toTitle} />
      )}
    </div>
  );
}

/* ==================================================================== title screen */

function TitleScreen(p: {
  grade: Grade; onGrade: (g: Grade) => void; focus: Focus; onPref: (pf: FocusPref) => void; notice: string | null;
  speed: SpeedId; onSpeed: (s: SpeedId) => void; hints: boolean; onHints: (h: boolean) => void;
  highScore: number; help: boolean; onHelp: () => void; onStart: () => void;
}) {
  const fromArcade = gradeFromArcade();
  const cur = prefOf(p.focus);
  const tag = focusTag(p.focus);
  const heroRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = (now: number) => {
      const cv = heroRef.current;
      const ctx = cv?.getContext("2d");
      if (cv && ctx) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        drawMascot(ctx, 2, 14, 4, Math.floor(now / 2000) % 3 === 0 ? "cheer" : "idle", now);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  const g = gradeN(p.grade);
  return (
    <div className="lc-overlay">
      <div className="lc-panel title">
        <div className="lc-title lc-pixel">LAB CAPSULES</div>
        <div className="lc-sub lc-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>
        <div className="lc-hero">
          <canvas ref={heroRef} width={MASCOT_W * 4 + 8} height={MASCOT_H * 4 + 18} style={{ width: MASCOT_W * 4 + 8, height: MASCOT_H * 4 + 18 }} aria-hidden="true" />
          <div className="bubble">
            I'm <b>Professor Fizzwick</b>! The germ blobs escaped into my bottle. Drop capsules and line up <b>4 that mean the same thing</b> to zap them!
          </div>
        </div>
        {fromArcade ? (
          <div className="lc-sub lc-pixel lc-gradebadge">
            {gradeLabel(p.grade).toUpperCase()} · <a href={arcadeLink(p.grade)}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="lc-h lc-pixel">PICK YOUR GRADE</div>
            <div className="lc-grades" role="radiogroup" aria-label="Grade">
              {GRADES.map((gr) => (
                <button key={gr} role="radio" aria-checked={gr === p.grade} className={`lc-grade lc-pixel ${gr === p.grade ? "on" : ""}`} onClick={() => p.onGrade(gr)} title={gradeLabel(gr)}>
                  {gr}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="lc-h lc-pixel">PICK YOUR SUBJECT</div>
        {p.notice && <div className="lc-help center y" role="status">{p.notice}</div>}
        <div className="lc-focus">
          <div className="lc-choices" role="radiogroup" aria-label="Subject" onKeyDown={arrowNav}>
            {SUBJECT_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={cur.subject === m.id}
                data-subject={m.id}
                className={`lc-choice ${cur.subject === m.id ? "on" : ""}`}
                onClick={() => cur.subject !== m.id && p.onPref({ subject: m.id, topic: "all" })}
              >
                <span className="lc-pixel">{m.label}</span>
                <small>{subjectNote(m.id, p.grade)}</small>
              </button>
            ))}
          </div>
          {cur.subject !== "mixed" && (
            <div className="lc-choices" role="radiogroup" aria-label={cur.subject === "math" ? "Math topic" : "Science topic"} onKeyDown={arrowNav}>
              <button
                type="button"
                role="radio"
                aria-checked={cur.topic === "all"}
                data-topic="all"
                className={`lc-choice ${cur.topic === "all" ? "on" : ""}`}
                onClick={() => p.onPref({ subject: cur.subject, topic: "all" })}
              >
                <span className="lc-pixel">{cur.subject === "math" ? "ALL MATH" : "ALL SCIENCE"}</span>
              </button>
              {topicsFor(cur.subject).map((t) => {
                const ok = topicAvailable(t.id, p.grade);
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={cur.topic === t.id}
                    disabled={!ok}
                    data-topic={t.id}
                    className={`lc-choice ${cur.topic === t.id ? "on" : ""}`}
                    onClick={() => p.onPref({ subject: cur.subject, topic: t.id })}
                  >
                    <span>{t.label}</span>
                    {!ok && <small>{gradesNote(t.id)}</small>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="lc-h lc-pixel">SPEED</div>
        <div className="lc-choices" role="radiogroup" aria-label="Speed" onKeyDown={arrowNav}>
          {SPEEDS.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={p.speed === s.id} data-speed={s.id} className={`lc-choice ${p.speed === s.id ? "on" : ""}`} onClick={() => p.onSpeed(s.id)}>
              <span className="lc-pixel">{s.label}</span>
              <small>{s.note}</small>
            </button>
          ))}
        </div>
        {g >= 3 && (
          <div className="lc-choices" style={{ marginTop: 8 }}>
            <button type="button" className={`lc-choice wide ${p.hints ? "on" : ""}`} aria-pressed={p.hints} data-hints onClick={() => p.onHints(!p.hints)}>
              <span className="lc-pixel">COLOR HINTS {p.hints ? "ON" : "OFF"}</span>
              <small>{p.hints ? "Falling capsules show their color" : "Read each capsule (the real challenge!)"}</small>
            </button>
          </div>
        )}
        <div className="lc-row">
          <button className="lc-cta big" autoFocus onClick={p.onStart}>{tag ? `Start: ${tag} ▶` : "Start lab ▶"}</button>
          <button className="lc-cta ghost" onClick={p.onHelp} aria-expanded={p.help}>How to play</button>
        </div>
        {p.help ? (
          <HowToPlay grade={p.grade} />
        ) : (
          <div className="lc-help center">Capsules drop into the bottle. Line up 4 halves and germs that mean the same thing, in a row or a column, to clear them. Clear every germ to win the level!</div>
        )}
        <div className="lc-help dim center">HI-SCORE {String(p.highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function HowToPlay({ grade }: { grade: Grade }) {
  const g = gradeN(grade);
  return (
    <div className="lc-help lc-howto">
      <div>
        <kbd>◀</kbd> <kbd>▶</kbd> move · <kbd>▼</kbd> drop faster · <kbd>Z</kbd> <kbd>X</kbd> (or <kbd>▲</kbd>) turn · <kbd>SPACE</kbd> drop · <kbd>ESC</kbd> pause ·{" "}
        <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer a quiz · <kbd>M</kbd> sound · <kbd>R</kbd> read aloud
      </div>
      <div className="dim">On a phone or tablet: use the buttons, or on the bottle swipe sideways to move, swipe down to drop, tap to turn.</div>
      <ul>
        <li>Each capsule has two halves. Germ blobs (the Wobblers) sit in the bottle. Line up <b>4 or more of the same kind</b> in a row or column and they pop. Pieces left hanging fall, and new lines make <b>chains</b> for extra points.</li>
        <li>
          {g <= 2
            ? <>Same kind = same <b>color and shape</b>. In number labs, a number touching its <b>partner to make 10</b> (3 and 7) pops too!</>
            : g <= 5
              ? <>Same kind = same <b>meaning</b>: <b>3×4</b>, <b>2×6</b> and <b>12</b> all match. In the matter lab, <b>milk</b> matches <b>juice</b> and <b>LIQUID</b>.</>
              : g <= 8
                ? <>Same kind = same <b>meaning</b>: <b>O</b> matches <b>oxygen</b>; <b>−5+2</b> matches <b>−3</b>; <b>2x=8</b> matches <b>x=4</b>. Atoms touching in the right numbers (<b>H, H, O</b>) build a molecule bonus!</>
                : <>Same kind = same <b>charge</b>: <b>Na⁺</b> matches <b>K⁺</b>; <b>SO₄²⁻</b> matches <b>O²⁻</b>. Ions touching with a <b>net charge of zero</b> (<b>Na⁺ + Cl⁻</b>) make a compound bonus!</>}
        </li>
        {g >= 3 && <li>Capsules fall as <b>clear glass</b> showing only their symbol, so read them! They glow their germ's color when they land. (COLOR HINTS shows colors early.)</li>}
        <li>Clear every germ to win the level, then answer a quick <b>Lab Quiz</b> about what you matched. A right answer gives bonus points; a wrong one just shows you why. If capsules fill the bottle's neck, the lab is over.</li>
      </ul>
    </div>
  );
}

/* ==================================================================== quiz and game over */

function QuizPanel({ quiz, level, onAnswer, onNext }: { quiz: QuizView; level: number; onAnswer: (i: number) => void; onNext: () => void }) {
  const { q, picked } = quiz;
  const done = picked !== null;
  const right = done && picked === q.answer;
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (done) nextRef.current?.focus();
  }, [done]);
  return (
    <div className="lc-overlay">
      <div className="lc-panel lc-quiz" role="dialog" aria-label="Lab Quiz">
        <div className="head lc-pixel">
          <span>LAB QUIZ · AFTER LEVEL {level}</span>
          <span className="std">{q.standard} · {q.skill}</span>
        </div>
        <div className="prompt">
          {speechSupported() && (
            <button className="lc-speak" onClick={() => speakQuestion(q.prompt, q.choices)} aria-label="Read the question aloud">🔊</button>
          )}
          <span>{q.prompt}</span>
        </div>
        <div className="opts">
          {q.choices.map((c, i) => (
            <button
              key={i}
              className={`lc-opt ${done && i === q.answer ? "right" : ""} ${done && i === picked && i !== q.answer ? "wrong" : ""}`}
              disabled={done}
              onClick={() => onAnswer(i)}
              data-choice={i}
            >
              <b>{i + 1} {"ABCD"[i]}</b>
              <span>{c}</span>
            </button>
          ))}
        </div>
        {done && (
          <div className={`lc-result ${right ? "right" : "wrong"}`} role="status">
            <span className="verdict">{right ? `CORRECT! +${QUIZ_BONUS}` : `NOT QUITE: IT'S "${q.choices[q.answer]}"`}</span>
            {q.explanation}
          </div>
        )}
        {done && (
          <div className="lc-row">
            <button ref={nextRef} className="lc-cta big" onClick={onNext}>Next level ▶</button>
          </div>
        )}
      </div>
    </div>
  );
}

function GameOver({ run, grade, focus, highScore, onRetry, onTitle }: { run: LabRun; grade: Grade; focus: Focus; highScore: number; onRetry: () => void; onTitle: () => void }) {
  const name = focusName(focus);
  const byStd = new Map<string, { skill: string; n: number; c: number }>();
  for (const l of run.quizLog) {
    const cur = byStd.get(l.q.standard) ?? { skill: l.q.skill, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.q.standard, cur);
  }
  return (
    <div className="lc-overlay">
      <div className="lc-panel">
        <div className="lc-h lc-pixel" style={{ color: "var(--lc-red)" }}>THE BOTTLE IS FULL! · LAB REPORT · {gradeLabel(grade).toUpperCase()}</div>
        <div className="lc-help center">{name ? <>Lab: <b className="c">{name}</b></> : <>Mixed lab: science and math from {gradeLabel(grade)}</>}</div>
        <div className="lc-help center" style={{ fontSize: 24 }}>
          Score <b className="y" data-final-score>{run.score}</b>
          {run.score >= highScore && run.score > 0 ? " · NEW HIGH SCORE!" : ""} · Level {run.level} · Quizzes {run.quizLog.filter((x) => x.correct).length}/{run.quizLog.length}
        </div>
        {byStd.size > 0 ? (
          <table className="lc-report">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>QUIZ</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td className="c">{std}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: v.c === v.n ? "var(--lc-green)" : "var(--lc-yellow)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="lc-help center">Clear a level to reach a Lab Quiz and see your standards here.</div>
        )}
        <div className="lc-row">
          <button className="lc-cta ghost" onClick={onTitle}>Title screen</button>
          <button className="lc-cta" autoFocus onClick={onRetry}>Try level {run.level} again ▶</button>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipAudio, exposeMusicDebug } from "@/kit/audio";
import { GRADES, arcadeLink, gradeFromArcade, gradeLabel, initialGrade, isEarlyReader, rememberGrade } from "@/kit/grades";
import { recordAnswer } from "@/kit/progress";
import { readAloudPref, setReadAloudPref, speak, speakQuestion, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade } from "@/kit/types";
import { cellKey, opp, sides, solve, sparkyPaths, DC, DR, type Grid, type PathStep, type SolveResult, type Tile } from "@/town/circuit";
import { judge, parseBoard, tileSig, toolLabel, type CircuitLevel, type Verdict } from "@/town/circuitLevels";
import { BAND_LABEL, bandOf, fmtTemp, type Band } from "@/town/common";
import { simulate, totalCost, type HeatLevel, type HeatRun } from "@/town/heat";
import { kitScience } from "@/town/kitwire";
import { Deck, type PutQuestion } from "@/town/questions";
import { boardGeom, drawBoard, drawHeat, drawRun, drawSparky, drawToolIcon, drawTown, townLayout, H, W } from "@/town/render";
import { RunSim, routeToBulb, type RDir } from "@/town/run";
import { isOpen, litCount, loadSave, nextLevel, recordRun, solveLevel, townLit, writeSave, type TownSave } from "@/town/save";
import {
  DEFAULT_FOCUS, MIXED, SUBJECT_MODES, focusFromUrl, focusTag, gradesNote, loadFocus, saveFocus, topicAvailable, topicInfo, topicsFor, validateFocus,
  type Focus,
} from "@/town/topics";
import { BUILDINGS, LEVEL_COUNT, levelFor, runMapFor, type Level } from "@/town/town";
import {
  BUILDING_POWERED, CIRCUIT_COMPLETE, HEATLAB_SONG, JINGLES, LIGHTS_ON, RUN_CLEAR, RUN_SONG, SHORT_BZZT, SONGS, TOWN_LIT, TOWN_SONG, WORKBENCH_SONG,
} from "@/music";
import "@/town/town.css";

const GAME_ID = "power-up-town";
type Screen = "title" | "town" | "circuit" | "heat" | "run";
type Overlay = null | "solved" | "question" | "runOffer" | "runDone" | "finale";

const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
const debug = params.has("debug");
/** Debug only: speeds up animations for the automated playtest. */
const speedUp = debug ? Math.max(1, Math.min(10, Number(params.get("speed")) || 1)) : 1;
const LETTERS = "ABCD";
const TAKE = -1;

interface InvItem {
  tile: Tile;
  count: number;
}

function initialFocus(grade: Grade): { focus: Focus; note: string | null } {
  const url = focusFromUrl(typeof window === "undefined" ? "" : window.location.search, grade);
  let note: string | null = null;
  if (url.unavailable) {
    const t = topicInfo(url.unavailable);
    note = `${t.label} is for ${gradesNote(t.id)}, not ${gradeLabel(grade)}. Here's all math instead.`;
  }
  return { focus: url.focus ?? validateFocus(loadFocus(), grade), note };
}

/** Turns a newly placed part so it joins as many neighbours as it can. */
function autoRotate(grid: Grid, r: number, c: number, tile: Tile): number {
  const n = tile.kind === "wire" ? (tile.shape === "straight" ? 2 : tile.shape === "cross" ? 1 : 4) : tile.kind === "battery" ? 2 : 2;
  let best = 0;
  let bestScore = -99;
  for (let rot = 0; rot < n; rot++) {
    const t = { ...tile, rot };
    let score = 0;
    for (const d of sides(t)) {
      const nb = grid[r + DR[d]]?.[c + DC[d]];
      if (nb && sides(nb).includes(opp(d))) score += 2;
      else score -= 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rot;
    }
  }
  return best;
}

export default function PowerUpTown() {
  const audio = useMemo(() => new ChipAudio(), []);
  useEffect(() => exposeMusicDebug(audio, SONGS, JINGLES), [audio]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [focusInit] = useState(() => initialFocus(initialGrade("3")));
  const [focus, setFocus] = useState<Focus>(focusInit.focus);
  const [notice, setNotice] = useState<string | null>(focusInit.note);
  const [save, setSave] = useState<TownSave>(() => loadSave());
  const [screen, setScreen] = useState<Screen>("title");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((n) => n + 1), []);

  const band: Band = bandOf(grade);
  const early = isEarlyReader(grade);
  const [selected, setSelected] = useState(() => nextLevel(loadSave(), bandOf(initialGrade("3"))));
  const [levelIdx, setLevelIdx] = useState(0);
  const level: Level = levelFor(band, levelIdx);

  // ---------- mutable game state (read by the animation loop)
  const clock = useRef(0);
  const st = useRef({
    screen: "title" as Screen,
    paused: false,
    // town
    lighting: null as { i: number; t0: number } | null,
    // circuit
    grid: [] as Grid,
    slots: [] as boolean[][],
    inv: [] as InvItem[],
    tool: null as number | null,
    closed: false,
    out: new Set<string>(),
    verdict: null as Verdict | null,
    res: null as SolveResult | null,
    paths: [] as PathStep[][],
    pathT0: 0,
    cursor: null as { r: number; c: number } | null,
    winAt: null as number | null,
    awaitingUnscrew: false,
    won: false,
    // heat
    chosen: [] as string[],
    heatRun: null as HeatRun | null,
    heatT0: 0,
    heatDone: false,
    // run
    run: null as RunSim | null,
  });
  const [message, setMessage] = useState<{ text: string; kind: "info" | "good" | "bad" | "short" } | null>(null);
  const [question, setQuestion] = useState<PutQuestion | null>(null);
  const [answered, setAnswered] = useState<{ picked: number; correct: boolean } | null>(null);
  const [runResult, setRunResult] = useState<{ stars: number; sparks: number; total: number; timeout: boolean } | null>(null);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  st.current.screen = screen;
  st.current.paused = paused;
  const levelRef = useRef(level);
  levelRef.current = level;
  const levelIdxRef = useRef(levelIdx);
  levelIdxRef.current = levelIdx;

  const finalePending = useRef(false);
  const deckRef = useRef<Deck | null>(null);
  const deck = useCallback(() => {
    const f = validateFocus(focus, grade);
    if (!deckRef.current || deckRef.current.grade !== grade || deckRef.current.focus !== f) deckRef.current = new Deck(grade, f, kitScience);
    return deckRef.current;
  }, [focus, grade]);
  const focusValid = useMemo(() => validateFocus(focus, grade), [focus, grade]);
  useEffect(() => {
    deckRef.current = null;
  }, [focusValid, grade]);

  const say = useCallback((s: string) => {
    if (readAloudRef.current) speak(s);
  }, []);

  // ---------- music
  useEffect(() => {
    const song = screen === "title" || screen === "town" ? TOWN_SONG : screen === "circuit" ? WORKBENCH_SONG : screen === "heat" ? HEATLAB_SONG : RUN_SONG;
    audio.playSong(song);
    audio.setIntensity(overlay === "question" ? "calm" : "full");
  }, [audio, screen, overlay]);
  useEffect(() => () => {
    audio.stopMusic();
    stopSpeaking();
  }, [audio]);

  // ---------- circuit helpers
  const loadCircuit = useCallback((l: CircuitLevel) => {
    const b = parseBoard(l);
    const s = st.current;
    s.grid = b.grid;
    s.slots = b.slots;
    const inv: InvItem[] = [];
    for (const t of l.tools) inv.push({ tile: { ...t.tile, fixed: false }, count: t.count });
    s.inv = inv;
    s.tool = inv.length ? 0 : (l.pre?.length ? TAKE : null);
    s.closed = false;
    s.out = new Set();
    s.verdict = null;
    s.res = null;
    s.paths = [];
    s.cursor = null;
    s.winAt = null;
    s.awaitingUnscrew = false;
    s.won = false;
  }, []);

  const resetEdits = useCallback(() => {
    const s = st.current;
    s.closed = false;
    s.out = new Set();
    s.verdict = null;
    s.res = null;
    s.paths = [];
  }, []);

  const addInv = (tile: Tile) => {
    const s = st.current;
    const k = tileSig(tile);
    const it = s.inv.find((x) => tileSig(x.tile) === k);
    if (it) it.count++;
    else s.inv.push({ tile: { ...tile, rot: 0, fixed: false }, count: 1 });
  };

  const onSolved = useCallback(() => {
    const s = st.current;
    s.won = true;
    stopSpeaking();
    const before = loadSave();
    const after = solveLevel(before, band, levelIdxRef.current);
    if (!townLit(before, band) && townLit(after, band)) finalePending.current = true;
    writeSave(after);
    setSave(after);
    audio.playJingle(BUILDING_POWERED);
    setOverlay("solved");
    say(`${BUILDINGS[levelIdxRef.current].name} has power! ${levelRef.current.lesson}`);
  }, [audio, band, say]);

  const flip = useCallback(() => {
    const s = st.current;
    const l = levelRef.current;
    if (l.kind !== "circuit" || s.won || overlayRef.current) return;
    audio.unlock();
    if (s.closed) {
      resetEdits();
      setMessage(null);
      audio.tone(300, 0.05, "square", 0.15);
      rerender();
      return;
    }
    s.closed = true;
    s.out = new Set();
    const v = judge(l, s.grid);
    s.verdict = v;
    s.res = v.res;
    s.paths = sparkyPaths(s.grid, v.res, { closed: true });
    s.pathT0 = clock.current;
    audio.tone(500, 0.04, "square", 0.15);
    if (v.win) {
      audio.playJingle(CIRCUIT_COMPLETE);
      if (l.type === "series" || l.type === "parallel") {
        s.awaitingUnscrew = true;
        setMessage({ text: "It works! Now tap a bulb to unscrew it, and watch the other one.", kind: "good" });
        say("It works! Now tap a bulb to unscrew it, and watch the other one.");
      } else {
        s.winAt = clock.current + 2.4;
        setMessage({ text: `Circuit complete! ${v.reading}`, kind: "good" });
      }
    } else if (v.res.short) {
      audio.playJingle(SHORT_BZZT);
      const safety = "Safety: never connect a wire straight across a battery, and never poke anything into a wall outlet.";
      setMessage({ text: `${v.message} ${safety}`, kind: "short" });
      say(`Bzzt! Short circuit! ${safety}`);
    } else {
      audio.tone(180, 0.18, "square", 0.18, 120);
      setMessage({ text: v.message, kind: "bad" });
      say(v.message);
    }
    rerender();
  }, [audio, rerender, resetEdits, say]);

  /** A tap on a board cell (mouse, touch or the keyboard cursor). */
  const tapCell = useCallback((r: number, c: number) => {
    const s = st.current;
    const l = levelRef.current;
    if (l.kind !== "circuit" || s.won || overlayRef.current || st.current.paused) return;
    audio.unlock();
    const tile = s.grid[r]?.[c];
    if (s.closed && tile?.kind === "bulb") {
      const k = cellKey(r, c);
      if (s.out.has(k)) s.out.delete(k);
      else s.out.add(k);
      const res = solve(s.grid, { closed: true, out: s.out });
      s.res = res;
      s.paths = sparkyPaths(s.grid, res, { closed: true, out: s.out });
      s.pathT0 = clock.current;
      const others = res.loads.filter((x) => x.kind !== "resistor" && !s.out.has(cellKey(x.r, x.c)));
      audio.tone(s.out.has(k) ? 260 : 520, 0.06, "triangle", 0.2);
      if (s.out.size) {
        const allOff = others.every((x) => !x.on);
        const allOn = others.length > 0 && others.every((x) => x.on);
        setMessage({
          text: allOff
            ? "One bulb out and everything went dark: there's only ONE path (series), so the loop is broken."
            : allOn
              ? "One bulb out, but the others stay lit: each has its OWN path (parallel)."
              : "Some parts stayed on and some went off.",
          kind: "info",
        });
        if (s.awaitingUnscrew) {
          s.awaitingUnscrew = false;
          s.winAt = clock.current + 3.2;
        }
      } else setMessage({ text: "Bulb back in.", kind: "info" });
      rerender();
      return;
    }
    if (tile?.kind === "switch" && tile.fixed) {
      flip();
      return;
    }
    if (!s.slots[r]?.[c]) return;
    if (s.closed) resetEdits();
    setMessage(null);
    const loose = tile && !tile.fixed ? tile : null;
    if (s.tool === TAKE) {
      if (loose) {
        addInv(loose);
        s.grid[r][c] = null;
        audio.tone(330, 0.05, "triangle", 0.2);
        if (s.inv.length && s.inv.every((x) => x.count === 0)) s.tool = TAKE;
      }
    } else if (s.tool !== null && s.inv[s.tool] && s.inv[s.tool].count > 0 && (!loose || tileSig(loose) !== tileSig(s.inv[s.tool].tile))) {
      const it = s.inv[s.tool];
      if (loose) addInv(loose);
      it.count--;
      s.grid[r][c] = null;
      const t: Tile = { ...it.tile, fixed: false };
      t.rot = autoRotate(s.grid, r, c, t);
      s.grid[r][c] = t;
      audio.blip();
    } else if (loose) {
      const n = loose.kind === "wire" ? (loose.shape === "straight" ? 2 : loose.shape === "cross" ? 1 : 4) : loose.kind === "battery" ? 4 : 2;
      loose.rot = (loose.rot + 1) % n;
      audio.tone(620, 0.03, "square", 0.12);
    }
    rerender();
  }, [audio, flip, rerender, resetEdits]);

  // ---------- heat helpers
  const chooseOption = useCallback((id: string) => {
    const s = st.current;
    const l = levelRef.current;
    if (l.kind !== "heat" || s.won || overlayRef.current) return;
    audio.unlock();
    if (s.heatRun && !s.heatDone) return;
    s.heatRun = null;
    s.heatDone = false;
    if (l.multi) s.chosen = s.chosen.includes(id) ? s.chosen.filter((x) => x !== id) : [...s.chosen, id];
    else s.chosen = [id];
    setMessage(null);
    audio.blip();
    rerender();
  }, [audio, rerender]);

  const runHeat = useCallback(() => {
    const s = st.current;
    const l = levelRef.current;
    if (l.kind !== "heat" || s.won || overlayRef.current) return;
    audio.unlock();
    if (!l.multi && !s.chosen.length) {
      setMessage({ text: "Pick one first!", kind: "info" });
      return;
    }
    if (l.multi && totalCost(l, s.chosen) > (l.budget ?? 0)) {
      setMessage({ text: `That costs ${totalCost(l, s.chosen)} coins, but you only have ${l.budget}. Take something off.`, kind: "bad" });
      audio.tone(200, 0.12, "square", 0.15);
      return;
    }
    s.heatRun = simulate(l, s.chosen, bandOf(grade));
    s.heatT0 = clock.current;
    s.heatDone = false;
    setMessage({ text: "Running the test…", kind: "info" });
    audio.tone(440, 0.06, "triangle", 0.2, 660);
    rerender();
  }, [audio, grade, rerender]);

  // ---------- level flow
  const startLevel = useCallback((i: number) => {
    audio.unlock();
    stopSpeaking();
    const l = levelFor(band, i);
    setLevelIdx(i);
    levelIdxRef.current = i;
    levelRef.current = l;
    setSelected(i);
    setOverlay(null);
    setPaused(false);
    setQuestion(null);
    setAnswered(null);
    setRunResult(null);
    const s = st.current;
    s.won = false;
    s.run = null;
    if (l.kind === "circuit") {
      loadCircuit(l);
      setMessage(null);
      setScreen("circuit");
    } else {
      s.chosen = [];
      s.heatRun = null;
      s.heatDone = false;
      setMessage(null);
      setScreen("heat");
    }
    say(`${l.title}. ${l.intro}`);
  }, [audio, band, loadCircuit, say]);

  const toTown = useCallback((light: number | null) => {
    stopSpeaking();
    const s = st.current;
    s.run = null;
    setOverlay(null);
    setPaused(false);
    setScreen("town");
    const sv = loadSave();
    setSave(sv);
    if (light !== null && sv[band].solved[light]) {
      s.lighting = { i: light, t0: clock.current };
      audio.playJingle(LIGHTS_ON);
      if (finalePending.current) {
        finalePending.current = false;
        window.setTimeout(() => {
          audio.playJingle(TOWN_LIT);
          setOverlay("finale");
          say("The whole town has power again! You did it, engineer!");
        }, 1600 / speedUp);
      }
      setSelected(townLit(sv, band) ? light : nextLevel(sv, band));
    } else setSelected(nextLevel(sv, band));
  }, [audio, band, say]);

  const askQuestion = useCallback(() => {
    const l = levelRef.current;
    const q = deck().next(l.kind === "circuit" ? "electric" : "heat");
    setQuestion(q);
    setAnswered(null);
    setOverlay("question");
    if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
  }, [deck]);

  const answer = useCallback((i: number) => {
    if (!question || answered) return;
    const ok = i === question.answer;
    recordAnswer(GAME_ID, question, ok);
    setAnswered({ picked: i, correct: ok });
    if (ok) audio.correct();
    else audio.wrong();
    if (readAloudRef.current) speak(`${ok ? "Correct!" : `Not quite. The answer is ${question.choices[question.answer]}.`} ${question.explanation}`);
  }, [answered, audio, question]);

  const startRun = useCallback(() => {
    audio.unlock();
    stopSpeaking();
    st.current.run = new RunSim(runMapFor(levelIdxRef.current), band);
    setRunResult(null);
    setOverlay(null);
    setScreen("run");
    say(band === "k2" ? "Sparky's Run! Follow the copper path to the bulb. No hurry!" : "Sparky's Run! Race along the copper to the bulb.");
  }, [audio, band, say]);

  const steer = useCallback((d: RDir) => {
    const r = st.current.run;
    if (!r || r.done || st.current.paused) return;
    audio.unlock();
    r.steer(d);
  }, [audio]);

  const togglePause = useCallback((v?: boolean) => {
    setPaused((p) => {
      const n = v ?? !p;
      audio.duck(n);
      return n;
    });
  }, [audio]);

  // ---------- animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = st.current;
      if (!s.paused) clock.current += dt * speedUp;
      const t = clock.current;
      const scr = s.screen;
      if (scr === "town" || scr === "title") {
        const sv = saveRef.current;
        const lit = sv[bandRef.current].solved;
        let lighting: { i: number; p: number } | null = null;
        if (s.lighting) {
          const p = (t - s.lighting.t0) / 2;
          if (p >= 1) s.lighting = null;
          else lighting = { i: s.lighting.i, p };
        }
        drawTown(ctx, {
          lit,
          open: BUILDINGS.map((_, i) => isOpen(sv, bandRef.current, i)),
          selected: scr === "town" ? selectedRef.current : -1,
          lighting,
          allLit: lit.every(Boolean),
        }, t);
      } else if (scr === "circuit" && s.grid.length) {
        let path: PathStep[] | null = null;
        let pathP = 0;
        if (s.closed && s.paths.length) {
          const lapT = 1.6;
          const lap = Math.floor((t - s.pathT0) / lapT);
          path = s.paths[lap % s.paths.length];
          pathP = ((t - s.pathT0) % lapT) / lapT;
        }
        drawBoard(ctx, {
          grid: s.grid, slots: s.slots, closed: s.closed, res: s.res, out: s.out, cursor: s.cursor, path, pathP,
          showBreaks: s.closed && !!s.res && !(s.verdict?.win && !s.out.size),
        }, t);
        if (s.winAt !== null && t >= s.winAt && !s.won && !overlayRef.current) {
          s.winAt = null;
          onSolvedRef.current();
        }
      } else if (scr === "heat") {
        const l = levelRef.current;
        if (l.kind === "heat") {
          let p = 0;
          if (s.heatRun) {
            p = Math.min(1, (t - s.heatT0) / 3.5);
            if (p >= 1 && !s.heatDone) {
              s.heatDone = true;
              heatDoneRef.current();
            }
          }
          drawHeat(ctx, { level: l, band: bandRef.current, chosen: s.chosen, run: s.heatRun, p }, t);
        }
      } else if (scr === "run" && s.run) {
        if (!s.paused && !overlayRef.current) {
          s.run.update(dt * speedUp);
          runEventsRef.current();
        }
        drawRun(ctx, s.run, t);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // refs used by the loop
  const saveRef = useRef(save);
  saveRef.current = save;
  const bandRef = useRef(band);
  bandRef.current = band;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onSolvedRef = useRef(onSolved);
  onSolvedRef.current = onSolved;
  const heatDoneRef = useRef(() => {});
  heatDoneRef.current = () => {
    const s = st.current;
    const run = s.heatRun;
    if (!run) return;
    if (run.win) {
      audio.playJingle(CIRCUIT_COMPLETE);
      setMessage({ text: run.verdict, kind: "good" });
      s.won = true;
      window.setTimeout(() => {
        s.won = false;
        onSolvedRef.current();
      }, 1800 / speedUp);
    } else {
      audio.tone(200, 0.2, "triangle", 0.2, 150);
      setMessage({ text: `${run.verdict} Pick again and run it!`, kind: "bad" });
      say(run.verdict);
    }
    rerender();
  };
  const runEventsRef = useRef(() => {});
  runEventsRef.current = () => {
    const r = st.current.run;
    if (!r) return;
    for (const e of r.drainEvents()) {
      switch (e.type) {
        case "spark":
          audio.tone(1200, 0.04, "square", 0.12, 1600);
          break;
        case "boost":
          audio.tone(400, 0.12, "square", 0.15, 900);
          break;
        case "switch":
          audio.tone(e.closed ? 700 : 350, 0.06, "square", 0.15);
          break;
        case "cool":
          audio.tone(900, 0.2, "triangle", 0.15, 300);
          break;
        case "hot":
          audio.tone(160, 0.12, "square", 0.12);
          break;
        case "power":
        case "shield-used":
          audio.checkpoint();
          break;
        case "goal":
        case "timeout": {
          audio.playJingle(RUN_CLEAR);
          const sv = recordRun(loadSave(), bandRef.current, levelIdxRef.current, e.stars);
          writeSave(sv);
          setSave(sv);
          setRunResult({ stars: e.stars, sparks: r.sparks, total: r.sparkTotal, timeout: e.type === "timeout" });
          setOverlay("runDone");
          break;
        }
      }
    }
  };

  // ---------- keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;
      const tag = (e.target as HTMLElement | null)?.tagName;
      const onButton = tag === "BUTTON" || tag === "A";
      if (k === "m" || k === "M") return void setMuted(audio.toggleMute());
      const s = st.current;
      const scr = s.screen;
      const ov = overlayRef.current;
      if (ov === "question") {
        if (!answered) {
          const n = "1234".indexOf(k);
          const l = "abcd".indexOf(k.toLowerCase());
          if (n >= 0 || (l >= 0 && k.length === 1)) {
            e.preventDefault();
            answer(n >= 0 ? n : l);
          }
        }
        if (k === "r" || k === "R") {
          if (question) {
            if (answered) speak(question.explanation);
            else speakQuestion(question.prompt, question.choices);
          }
        }
        return;
      }
      if (ov) return;
      if ((k === "Escape" || k === "p" || k === "P") && (scr === "circuit" || scr === "heat" || scr === "run")) {
        e.preventDefault();
        togglePause();
        return;
      }
      if (s.paused) return;
      if (k === "r" || k === "R") {
        if (scr === "circuit" || scr === "heat") speak(`${levelRef.current.goal}`);
        return;
      }
      if (scr === "town") {
        const order = BUILDINGS.map((_, i) => i).filter((i) => isOpen(saveRef.current, bandRef.current, i));
        const cur = order.indexOf(selectedRef.current);
        if (k === "ArrowRight" || k === "ArrowDown") {
          e.preventDefault();
          setSelected(order[Math.min(order.length - 1, cur + 1)] ?? 0);
        } else if (k === "ArrowLeft" || k === "ArrowUp") {
          e.preventDefault();
          setSelected(order[Math.max(0, cur - 1)] ?? 0);
        } else if ((k === "Enter" || k === " ") && !onButton) {
          e.preventDefault();
          startLevel(selectedRef.current);
        }
        return;
      }
      if (scr === "circuit") {
        const rows = s.grid.length;
        const cols = s.grid[0]?.length ?? 0;
        const mv: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (mv[k]) {
          e.preventDefault();
          const cur = s.cursor ?? firstSlot(s.slots);
          s.cursor = { r: Math.max(0, Math.min(rows - 1, cur.r + (s.cursor ? mv[k][0] : 0))), c: Math.max(0, Math.min(cols - 1, cur.c + (s.cursor ? mv[k][1] : 0))) };
          rerender();
        } else if ((k === " " || k === "Enter") && !onButton) {
          e.preventDefault();
          if (!s.cursor) s.cursor = firstSlot(s.slots);
          tapCell(s.cursor.r, s.cursor.c);
        } else if (k === "f" || k === "F") {
          e.preventDefault();
          flip();
        } else if (k === "q" || k === "Q" || k === "[" || k === "e" || k === "E" || k === "]") {
          e.preventDefault();
          const list = [...s.inv.map((_, i) => i), TAKE];
          const cur = list.indexOf(s.tool ?? 0);
          const dir = k === "q" || k === "Q" || k === "[" ? -1 : 1;
          s.tool = list[(cur + dir + list.length) % list.length];
          rerender();
        } else if (k === "x" || k === "X" || k === "Delete" || k === "Backspace") {
          e.preventDefault();
          s.tool = TAKE;
          if (s.cursor) tapCell(s.cursor.r, s.cursor.c);
          rerender();
        }
        return;
      }
      if (scr === "heat") {
        const l = levelRef.current;
        if (l.kind !== "heat") return;
        const n = "123456".indexOf(k);
        if (n >= 0 && n < l.options.length) {
          e.preventDefault();
          chooseOption(l.options[n].id);
        } else if ((k === "Enter" || k === " ") && !onButton) {
          e.preventDefault();
          runHeat();
        }
        return;
      }
      if (scr === "run") {
        const dirs: Record<string, RDir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
        if (k in dirs) {
          e.preventDefault();
          steer(dirs[k]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audio, answer, answered, chooseOption, flip, question, rerender, runHeat, startLevel, steer, tapCell, togglePause]);

  // ---------- pointer input on the canvas
  const swipe = useRef<{ x: number; y: number; done: boolean } | null>(null);
  const toLogical = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const cellAt = (x: number, y: number) => {
    const s = st.current;
    const g = boardGeom(s.grid.length, s.grid[0].length);
    const c = Math.floor((x - g.x0) / g.cs);
    const r = Math.floor((y - g.y0) / g.cs);
    return r >= 0 && c >= 0 && r < s.grid.length && c < s.grid[0].length ? { r, c } : null;
  };
  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLogical(e);
    const s = st.current;
    if (screen === "circuit") {
      const cell = cellAt(p.x, p.y);
      if (cell) {
        s.cursor = null;
        tapCell(cell.r, cell.c);
      }
    } else if (screen === "town") {
      const hit = townLayout().find((b) => p.x >= b.x - 3 && p.x <= b.x + b.w + 3 && p.y >= b.y - 14 && p.y <= b.y + b.h);
      if (hit && isOpen(save, band, hit.i)) {
        audio.unlock();
        if (selected === hit.i) startLevel(hit.i);
        else setSelected(hit.i);
      }
    } else if (screen === "run") {
      swipe.current = { x: e.clientX, y: e.clientY, done: false };
    }
  };
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sw = swipe.current;
    if (!sw || sw.done || screen !== "run") return;
    const dx = e.clientX - sw.x;
    const dy = e.clientY - sw.y;
    if (Math.hypot(dx, dy) < 18) return;
    sw.done = true;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0);
  };

  // Drag a part from the toolbox onto the board (mouse).
  const drag = useRef<{ idx: number; x: number; y: number } | null>(null);
  useEffect(() => {
    const up = (e: PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d || st.current.screen !== "circuit" || !canvasRef.current) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 10) return;
      const r = canvasRef.current.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      const p = { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
      const s = st.current;
      const g = boardGeom(s.grid.length, s.grid[0].length);
      const c = Math.floor((p.x - g.x0) / g.cs);
      const rr = Math.floor((p.y - g.y0) / g.cs);
      if (rr < 0 || c < 0 || rr >= s.grid.length || c >= s.grid[0].length) return;
      s.tool = d.idx;
      tapCell(rr, c);
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [tapCell]);

  // ---------- debug hooks for the automated playtest
  useEffect(() => {
    if (!debug) return;
    (window as unknown as Record<string, unknown>).__put = {
      state: () => {
        const s = st.current;
        const l = levelRef.current;
        return {
          screen: s.screen, overlay: overlayRef.current, levelId: l.id, levelIdx: levelIdxRef.current, kind: l.kind, band: bandRef.current,
          closed: s.closed, win: s.verdict?.win ?? null, short: s.res?.short ?? null, breaks: s.res?.breaks.length ?? 0,
          loads: (s.res?.loads ?? []).map((x) => ({ r: x.r, c: x.c, on: x.on, kind: x.kind })), paths: s.paths.length,
          grid: s.grid.map((row) => row.map((t) => (t ? { kind: t.kind, rot: t.rot, fixed: !!t.fixed, mat: t.mat ?? null, ohms: t.ohms ?? null, volts: t.volts ?? null, shape: t.shape ?? null } : null))),
          inv: s.inv.map((x) => ({ sig: tileSig(x.tile), count: x.count })), tool: s.tool,
          chosen: s.chosen, heatDone: s.heatDone, heatWin: s.heatRun?.win ?? null,
          run: s.run ? { r: s.run.r, c: s.run.c, t: s.run.t, dir: s.run.dir, done: s.run.done, pause: s.run.pause, stars: s.run.stars } : null,
        };
      },
      level: () => levelRef.current,
      geom: () => {
        const s = st.current;
        return boardGeom(s.grid.length, s.grid[0].length);
      },
      route: () => (st.current.run ? routeToBulb(st.current.run.grid) : null),
      sig: (t: Tile) => tileSig(t),
    };
  }, []);

  // ---------- UI pieces
  const chooseGrade = (g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setFocus((f) => validateFocus(f, g));
    setNotice(null);
    setSelected(nextLevel(save, bandOf(g)));
    if (!readAloudPrefSet()) setReadAloud(isEarlyReader(g));
  };
  const chooseFocus = (f: Focus) => {
    const v = validateFocus(f, grade);
    setFocus(v);
    saveFocus(v);
    setNotice(null);
  };
  const toggleReadAloud = () => {
    const n = !readAloud;
    setReadAloud(n);
    setReadAloudPref(n);
    if (!n) stopSpeaking();
  };

  const s = st.current;
  const inPlay = screen === "circuit" || screen === "heat" || screen === "run";
  const lit = litCount(save, band);
  const tag = focusTag(focusValid);

  return (
    <div className={`pt-root ${early ? "early" : ""}`}>
      <div className="pt-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="pt-tools">
          {inPlay && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          {muted ? (
            <button onClick={() => setMuted(audio.toggleMute())} title="Sound is off on this device (M)">SOUND OFF</button>
          ) : (
            <>
              <button className="pt-music" onClick={() => { audio.unlock(); setMusicOn(audio.toggleMusic()); }} aria-pressed={musicOn} title="Music on/off">{musicOn ? "MUSIC ON" : "MUSIC OFF"}</button>
              <button className="pt-sfx" onClick={() => setSfxOn(audio.toggleSfx())} aria-pressed={sfxOn} title="Sound effects on/off">{sfxOn ? "SFX ON" : "SFX OFF"}</button>
            </>
          )}
          {speechSupported() && (
            <button className="pt-read" onClick={toggleReadAloud} aria-pressed={readAloud}>{readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}</button>
          )}
        </div>
      </div>

      {screen !== "title" && (
        <div className="pt-hud pt-pixel">
          <span><span className="lbl">TOWN</span><span className="y" data-lit={lit}>{lit}/{LEVEL_COUNT} LIT</span></span>
          {inPlay ? <span className="c">{levelIdx + 1}. {BUILDINGS[levelIdx].name.toUpperCase()}</span> : <span className="c">{BAND_LABEL[band].toUpperCase()}</span>}
          <span className="hide-sm"><span className="lbl">RUN STARS</span>{save[band].run.reduce((a, b) => a + b, 0)}</span>
        </div>
      )}

      <div className={`pt-stage ${screen === "title" ? "title" : ""}`}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="pt-canvas"
          aria-label="Power Up Town game screen"
          onPointerDown={onCanvasDown}
          onPointerMove={onCanvasMove}
          onPointerUp={() => (swipe.current = null)}
        />
        {screen === "run" && s.run && <RunHud sim={s.run} />}
      </div>

      {screen === "title" && (
        <TitleScreen grade={grade} onGrade={chooseGrade} focus={focusValid} onFocus={chooseFocus} notice={notice} lit={lit} tag={tag}
          onStart={() => { audio.unlock(); audio.playSong(TOWN_SONG); setScreen("town"); }} />
      )}

      {screen === "town" && (
        <TownPanel save={save} band={band} selected={selected} onSelect={setSelected} onPlay={startLevel} onTitle={() => setScreen("title")} />
      )}

      {screen === "circuit" && level.kind === "circuit" && (
        <CircuitPanel level={level} inv={s.inv} tool={s.tool} closed={s.closed} message={message} reading={s.verdict?.reading ?? null}
          canTake={s.grid.some((row) => row.some((t) => t && !t.fixed)) || !!level.pre?.length}
          onTool={(i) => { s.tool = i; rerender(); }}
          onDragStart={(i, e) => { drag.current = { idx: i, x: e.clientX, y: e.clientY }; }}
          onFlip={flip}
          onReset={() => { loadCircuit(level); setMessage(null); rerender(); }}
          onTown={() => toTown(null)}
          onSkipDemo={s.awaitingUnscrew ? () => { s.awaitingUnscrew = false; s.winAt = clock.current; } : null}
        />
      )}

      {screen === "heat" && level.kind === "heat" && (
        <HeatPanel level={level} band={band} chosen={s.chosen} running={!!s.heatRun && !s.heatDone} message={message} onChoose={chooseOption} onRun={runHeat} onTown={() => toTown(null)} />
      )}

      {screen === "run" && (
        <div className="pt-dpad" role="group" aria-label="Steer Sparky">
          <button className="pt-pad up" data-dir="0" onPointerDown={(e) => { e.preventDefault(); steer(0); }} aria-label="Up">▲</button>
          <button className="pt-pad left" data-dir="3" onPointerDown={(e) => { e.preventDefault(); steer(3); }} aria-label="Left">◀</button>
          <button className="pt-pad right" data-dir="1" onPointerDown={(e) => { e.preventDefault(); steer(1); }} aria-label="Right">▶</button>
          <button className="pt-pad down" data-dir="2" onPointerDown={(e) => { e.preventDefault(); steer(2); }} aria-label="Down">▼</button>
          <div className="pt-help pt-padhelp">Arrow keys, swipe or tap the arrows. Copper is a conductor: Sparky can only run on it!</div>
        </div>
      )}

      {paused && inPlay && (
        <div className="pt-overlay">
          <div className="pt-panel small">
            <div className="pt-title pt-pixel">PAUSED</div>
            <HowToPlay early={early} />
            <div className="pt-row center">
              <button className="pt-cta ghost" onClick={() => toTown(null)}>Back to town</button>
              <button className="pt-cta" autoFocus onClick={() => togglePause(false)}>Resume ▶</button>
            </div>
          </div>
        </div>
      )}

      {overlay === "solved" && (
        <div className="pt-overlay">
          <div className="pt-panel small pt-solved" role="dialog" aria-label="Building powered">
            <div className="pt-title pt-pixel">⚡ {BUILDINGS[levelIdx].name.toUpperCase()} HAS POWER!</div>
            <p className="pt-lesson">{level.lesson}</p>
            <div className="pt-row center">
              <button className="pt-cta big" autoFocus onClick={askQuestion}>Science Check ▶</button>
            </div>
          </div>
        </div>
      )}

      {overlay === "question" && question && (
        <div className="pt-overlay">
          <QuestionCard q={question} answered={answered} onAnswer={answer} tag={tag}
            onSpeak={speechSupported() ? () => (answered ? speak(question.explanation) : speakQuestion(question.prompt, question.choices)) : null}
            readAloud={readAloud}
            onContinue={() => { stopSpeaking(); setOverlay("runOffer"); }} />
        </div>
      )}

      {overlay === "runOffer" && (
        <div className="pt-overlay">
          <div className="pt-panel small" role="dialog" aria-label="Sparky's Run">
            <div className="pt-title pt-pixel">BONUS: SPARKY'S RUN!</div>
            <SparkyPortrait />
            <p className="pt-lesson">
              Race Sparky the electron along the <b className="y">copper</b> to the bulb. Copper is a conductor; rubber and plastic are insulators, so they're walls.
              Step on a <b className="c">switch pad</b> to close switch gaps, a <b className="c">fan</b> cools hot wires, resistors slow you down and charge pads speed you up.
              {band === "k2" ? " No timer: take your time!" : " Beat the clock for bonus ★."}
            </p>
            <div className="pt-row center">
              <button className="pt-cta ghost" onClick={() => toTown(levelIdx)}>Skip: back to town</button>
              <button className="pt-cta big" autoFocus onClick={startRun}>Run, Sparky! ▶</button>
            </div>
          </div>
        </div>
      )}

      {overlay === "runDone" && runResult && (
        <div className="pt-overlay">
          <div className="pt-panel small" role="dialog" aria-label="Run finished">
            <div className="pt-title pt-pixel">{runResult.timeout ? "TIME'S UP!" : "BULB LIT!"}</div>
            <div className="pt-stars" data-stars={runResult.stars}>{"★".repeat(runResult.stars)}{"☆".repeat(3 - runResult.stars)}</div>
            <p className="pt-lesson center">
              Sparks collected: {runResult.sparks}/{runResult.total}.{" "}
              {runResult.timeout ? "Sparky still had fun. Try again next time!" : "Sparky completed the circuit!"}
            </p>
            <div className="pt-row center">
              <button className="pt-cta big" autoFocus onClick={() => toTown(levelIdx)}>Back to town ▶</button>
            </div>
          </div>
        </div>
      )}

      {overlay === "finale" && (
        <div className="pt-overlay">
          <div className="pt-panel small pt-solved" role="dialog" aria-label="Town lit">
            <div className="pt-title pt-pixel">THE WHOLE TOWN IS LIT!</div>
            <SparkyPortrait />
            <p className="pt-lesson center">Every home, shop and school has power again. Thank you, engineer! Try another grade band for new puzzles.</p>
            <div className="pt-row center">
              <button className="pt-cta big" autoFocus onClick={() => setOverlay(null)}>Hooray! ▶</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function readAloudPrefSet(): boolean {
  try {
    return localStorage.getItem("arcade.readAloud") !== null;
  } catch {
    return false;
  }
}

function firstSlot(slots: boolean[][]): { r: number; c: number } {
  for (let r = 0; r < slots.length; r++) for (let c = 0; c < slots[r].length; c++) if (slots[r][c]) return { r, c };
  return { r: 0, c: 0 };
}

/* ---------------------------------------------------------------- pieces */

function RunHud({ sim }: { sim: RunSim }) {
  const left = sim.limit === null ? null : Math.max(0, Math.ceil(sim.limit - sim.time));
  return (
    <div className="pt-runhud pt-pixel" aria-live="off">
      <span className="y">✦ {sim.sparks}/{sim.sparkTotal}</span>
      {left !== null ? <span>⏱ {left}</span> : <span className="g">NO RUSH</span>}
      {sim.dash > 0 && <span className="c">SUPERCONDUCTOR!</span>}
      {sim.shield > 0 && <span className="g">FUSE SHIELD</span>}
    </div>
  );
}

function SparkyPortrait() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      c.clearRect(0, 0, 40, 40);
      drawSparky(c, 20, 23, (now - t0) / 1000, 2.2);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={40} height={40} className="pt-portrait" aria-label="Sparky the electron" />;
}

function ToolIcon({ tile }: { tile: Tile }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (c) drawToolIcon(c, tile, 40);
  }, [tile]);
  return <canvas ref={ref} width={40} height={40} className="pt-toolicon" aria-hidden="true" />;
}

function CircuitPanel({
  level, inv, tool, closed, message, reading, canTake, onTool, onDragStart, onFlip, onReset, onTown, onSkipDemo,
}: {
  level: CircuitLevel; inv: InvItem[]; tool: number | null; closed: boolean; message: { text: string; kind: string } | null; reading: string | null;
  canTake: boolean; onTool: (i: number) => void; onDragStart: (i: number, e: React.PointerEvent) => void; onFlip: () => void; onReset: () => void;
  onTown: () => void; onSkipDemo: (() => void) | null;
}) {
  return (
    <div className="pt-controls">
      <div className="pt-goal"><b className="pt-pixel y">{level.title.toUpperCase()}</b> {level.goal}</div>
      {message && <div className={`pt-msg ${message.kind}`} role="status">{message.text}</div>}
      {closed && reading && !message?.text.includes(reading) && <div className="pt-reading pt-pixel">{reading}</div>}
      <div className="pt-toolbox" role="radiogroup" aria-label="Toolbox">
        {inv.map((it, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={tool === i}
            data-tool={i}
            data-sig={tileSig(it.tile)}
            className={`pt-tool ${tool === i ? "on" : ""}`}
            disabled={it.count <= 0}
            onClick={() => onTool(i)}
            onPointerDown={(e) => e.pointerType === "mouse" && onDragStart(i, e)}
            title={toolLabel(it.tile)}
          >
            <ToolIcon tile={it.tile} />
            <small>{toolLabel(it.tile)}</small>
            <i className="pt-count">×{it.count}</i>
          </button>
        ))}
        {canTake && (
          <button type="button" role="radio" aria-checked={tool === TAKE} data-tool="take" className={`pt-tool take ${tool === TAKE ? "on" : ""}`} onClick={() => onTool(TAKE)}>
            <span className="pt-take">✋</span>
            <small>Take a part</small>
          </button>
        )}
      </div>
      <div className="pt-row">
        <button className={`pt-cta big pt-flip ${closed ? "on" : ""}`} onClick={onFlip}>{closed ? "SWITCH OFF ✎" : "⚡ FLIP SWITCH"}</button>
        {onSkipDemo && <button className="pt-cta" onClick={onSkipDemo}>Done ▶</button>}
        <button className="pt-cta ghost" onClick={onReset}>↺ Reset</button>
        <button className="pt-cta ghost" onClick={onTown}>Town</button>
      </div>
      <div className="pt-help dim">Pick a part, then tap an empty dashed square. Tap a placed part to turn it. Desktop: drag parts, or arrows + Space, Q/E change part, X takes, F flips.</div>
    </div>
  );
}

function HeatPanel({
  level, band, chosen, running, message, onChoose, onRun, onTown,
}: { level: HeatLevel; band: Band; chosen: string[]; running: boolean; message: { text: string; kind: string } | null; onChoose: (id: string) => void; onRun: () => void; onTown: () => void }) {
  const cost = level.multi ? totalCost(level, chosen) : 0;
  return (
    <div className="pt-controls">
      <div className="pt-goal"><b className="pt-pixel y">{level.title.toUpperCase()}</b> {level.question ?? level.goal}</div>
      {level.question && <div className="pt-help dim">{level.goal}</div>}
      {message && <div className={`pt-msg ${message.kind}`} role="status">{message.text}</div>}
      {level.multi && <div className="pt-help pt-pixel pt-budget">COINS: <span className={cost > (level.budget ?? 0) ? "r" : "y"}>{cost}</span> / {level.budget}</div>}
      <div className={`pt-options ${level.multi ? "multi" : ""}`} role={level.multi ? "group" : "radiogroup"} aria-label="Choices">
        {level.options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role={level.multi ? "checkbox" : "radio"}
            aria-checked={chosen.includes(o.id)}
            data-option={o.id}
            className={`pt-option ${chosen.includes(o.id) ? "on" : ""}`}
            disabled={running}
            onClick={() => onChoose(o.id)}
          >
            <i className="sw" style={{ background: o.color }} />
            <span><b className="pt-pixel">{i + 1}</b> {o.label}</span>
            {o.detail && <small>{o.detail}</small>}
            {o.cost !== undefined && !o.detail && <small>{o.cost} coin{o.cost === 1 ? "" : "s"}</small>}
          </button>
        ))}
      </div>
      <div className="pt-row">
        <button className="pt-cta big pt-runheat" onClick={onRun} disabled={running}>{level.question ? "▶ TEST IT" : "▶ RUN"}</button>
        <button className="pt-cta ghost" onClick={onTown}>Town</button>
      </div>
      <div className="pt-help dim">Room: {fmtTemp(level.room, band)}. Heat always flows from warmer to cooler. Keys: 1–{level.options.length} pick, Enter runs.</div>
    </div>
  );
}

function TownPanel({ save, band, selected, onSelect, onPlay, onTitle }: { save: TownSave; band: Band; selected: number; onSelect: (i: number) => void; onPlay: (i: number) => void; onTitle: () => void }) {
  const nxt = nextLevel(save, band);
  const all = townLit(save, band);
  return (
    <div className="pt-controls">
      <div className="pt-goal">
        {all ? <><b className="pt-pixel y">THE TOWN IS LIT!</b> Replay any building, or try another grade band.</> : <>The storm knocked out the power. <span className="y">Light every building!</span> Tap a building on the map, or pick one below.</>}
      </div>
      <div className="pt-row">
        <button className="pt-cta big pt-playnext" autoFocus onClick={() => onPlay(selected)} data-level={selected}>
          {save[band].solved[selected] ? "Replay" : "Play"}: {selected + 1}. {BUILDINGS[selected].name} ▶
        </button>
        <button className="pt-cta ghost" onClick={onTitle}>Grade & subject</button>
      </div>
      <div className="pt-buildings" role="radiogroup" aria-label="Buildings">
        {BUILDINGS.map((b, i) => {
          const open = isOpen(save, band, i);
          const lit = save[band].solved[i];
          const l = levelFor(band, i);
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={selected === i}
              data-building={i}
              data-lit={lit ? "1" : "0"}
              disabled={!open}
              className={`pt-building ${selected === i ? "on" : ""} ${lit ? "lit" : ""} ${i === nxt && !lit ? "next" : ""}`}
              onClick={() => (selected === i ? onPlay(i) : onSelect(i))}
            >
              <span className="pt-pixel">{i + 1}. {b.name.toUpperCase()}</span>
              <small>{lit ? "💡 Lit" : open ? (l.kind === "circuit" ? "⚡ Circuit" : "🔥 Heat lab") : "🔒 Dark"}{save[band].run[i] ? ` · ${"★".repeat(save[band].run[i])}` : ""}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionCard({
  q, answered, onAnswer, onContinue, onSpeak, readAloud, tag,
}: { q: PutQuestion; answered: { picked: number; correct: boolean } | null; onAnswer: (i: number) => void; onContinue: () => void; onSpeak: (() => void) | null; readAloud: boolean; tag: string | null }) {
  const a = answered;
  const sci = q.subject === "science";
  const title = sci ? "SCIENCE CHECK" : "MATH CHECK";
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (a) btn.current?.focus();
  }, [a]);
  return (
    <div className={`pt-card ${a ? (a.correct ? "correct" : "wrong") : ""}`} role="dialog" aria-label={title}>
      <div className="pt-card-head pt-pixel">
        <span>{a ? (a.correct ? "✔ CORRECT!" : "✘ NOT QUITE: HERE'S WHY") : title}</span>
        <span className="std">{tag ? `${tag} · ` : ""}{q.standard}</span>
      </div>
      <div className="pt-prompt">
        {onSpeak && <button type="button" className={`pt-speak ${readAloud ? "on" : ""}`} onClick={onSpeak} aria-label="Read aloud" title="Read aloud (R)">🔊</button>}
        <span>{q.prompt}</span>
      </div>
      <div className="pt-opts">
        {q.choices.map((c, i) => {
          const cls = a ? (i === q.answer ? "right" : i === a.picked ? "picked-wrong" : "dim") : "";
          return (
            <button key={i} type="button" className={`pt-opt ${cls}`} disabled={!!a} onClick={() => onAnswer(i)} data-choice={i}>
              <b className="pt-pixel">{i + 1}·{LETTERS[i]}</b>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {a && (
        <div className="pt-after">
          <div className="pt-explain">{a.correct ? "" : <><b className="y">Answer: {q.choices[q.answer]}.</b> </>}{q.explanation}</div>
          <button ref={btn} className="pt-cta" onClick={onContinue}>Continue ▶</button>
        </div>
      )}
    </div>
  );
}

function HowToPlay({ early }: { early: boolean }) {
  return (
    <div className="pt-help">
      <ul>
        <li><b className="y">⚡ Circuits:</b> pick a part from the toolbox and tap an empty dashed square (or drag it there). Tap a placed part to turn it. ✋ takes a part away. Then <b>FLIP SWITCH</b>: Sparky runs the loop if it's complete. A red ✗ shows a break.</li>
        <li><b className="y">🔥 Heat labs:</b> pick a material or a spot, then run the test and read the thermometer and the graph.</li>
        <li><b className="y">🏃 Sparky's Run:</b> steer with the arrow keys, swipes or the arrow buttons. {early ? "No timer, no rush!" : "Beat the clock for a bonus star."}</li>
        <li>Wrong tries are fine: nothing is ever lost. Every building you power stays lit.</li>
      </ul>
      <div className="keys">
        <kbd>←↑↓→</kbd> move · <kbd>SPACE</kbd>/<kbd>ENTER</kbd> place, turn, run · <kbd>Q</kbd>/<kbd>E</kbd> part · <kbd>X</kbd> take · <kbd>F</kbd> flip switch · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>ESC</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud
      </div>
    </div>
  );
}

function TitleScreen({
  grade, onGrade, focus, onFocus, notice, lit, tag, onStart,
}: { grade: Grade; onGrade: (g: Grade) => void; focus: Focus; onFocus: (f: Focus) => void; notice: string | null; lit: number; tag: string | null; onStart: () => void }) {
  const fromArcade = gradeFromArcade();
  const [help, setHelp] = useState(false);
  return (
    <div className="pt-panel title">
      <div className="pt-logo">
        <SparkyPortrait />
        <div>
          <div className="pt-title pt-pixel">POWER UP TOWN</div>
          <div className="pt-sub pt-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>
          <div className="pt-help">A winter storm knocked out the town's power! You're the town's young engineer. Build circuits, master heat, and race <b className="y">Sparky the electron</b> to light every building.</div>
        </div>
      </div>
      {fromArcade ? (
        <div className="pt-sub pt-pixel pt-gradebadge">{gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a></div>
      ) : (
        <>
          <div className="pt-h pt-pixel">PICK YOUR GRADE</div>
          <div className="pt-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`pt-grade pt-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>{g}</button>
            ))}
          </div>
        </>
      )}
      <div className="pt-h pt-pixel">PICK YOUR SUBJECT</div>
      {notice && <div className="pt-help center y pt-notice" role="status">{notice}</div>}
      <div className="pt-subjects" role="radiogroup" aria-label="Subject">
        {SUBJECT_MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={focus.subject === m.id} data-subject={m.id} className={`pt-subject ${focus.subject === m.id ? "on" : ""}`}
            onClick={() => focus.subject !== m.id && onFocus(m.id === "mixed" ? MIXED : m.id === "science" ? DEFAULT_FOCUS : { subject: "math", topic: "all" })}>
            <span className="pt-pixel">{m.label}</span>
            <small>{m.note}</small>
          </button>
        ))}
      </div>
      {focus.subject !== "mixed" && (
        <div className="pt-topics" role="radiogroup" aria-label="Topic">
          {focus.subject === "math" && (
            <button type="button" role="radio" aria-checked={focus.topic === "all"} data-topic="all" className={`pt-topic ${focus.topic === "all" ? "on" : ""}`} onClick={() => onFocus({ subject: "math", topic: "all" })}>
              <span className="pt-pixel">ALL MATH</span>
            </button>
          )}
          {topicsFor(focus.subject).map((t) => {
            const ok = topicAvailable(t.id, grade);
            return (
              <button key={t.id} type="button" role="radio" aria-checked={focus.topic === t.id} disabled={!ok} data-topic={t.id} className={`pt-topic ${focus.topic === t.id ? "on" : ""}`}
                onClick={() => onFocus({ subject: focus.subject, topic: t.id })} title={ok ? t.label : `${t.label}: ${gradesNote(t.id)}`}>
                <span>{t.label}{t.id === "physical" ? ": energy, electricity & heat" : ""}</span>
                {!ok && <small>{gradesNote(t.id)}</small>}
              </button>
            );
          })}
        </div>
      )}
      <div className="pt-row center">
        <button className="pt-cta big pt-start" autoFocus onClick={onStart}>{lit ? `Back to town (${lit}/${LEVEL_COUNT} lit) ▶` : tag ? `To town: ${tag} ▶` : "To town ▶"}</button>
        <button className="pt-cta ghost" onClick={() => setHelp((h) => !h)} aria-expanded={help}>How to play</button>
      </div>
      {help && <HowToPlay early={isEarlyReader(grade)} />}
    </div>
  );
}

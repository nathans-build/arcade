import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipAudio, exposeMusicDebug } from "@/kit/audio";
import { GRADES, arcadeLink, gradeFromArcade, gradeLabel, initialGrade, isEarlyReader, rememberGrade } from "@/kit/grades";
import { loadProgress, recordAnswer, submitScore } from "@/kit/progress";
import { readAloudPref, setReadAloudPref, speak, speakQuestion, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade } from "@/kit/types";
import { dealQ, type CafeQ } from "@/cafe/common";
import { KITCHENS, STATIONS, kitchenById } from "@/cafe/kitchens";
import { drawChef, drawFrame, H, W } from "@/cafe/render";
import { randSeed } from "@/cafe/rng";
import { finishShift, isUnlocked, loadSave, writeSave, type CafeSave } from "@/cafe/save";
import { CafeSim, noClock, type AskKind, type LogEntry } from "@/cafe/sim";
import {
  MIXED, SUBJECT_MODES, focusFromUrl, focusTag, gradesNote, loadFocus, saveFocus, topicAvailable, topicInfo, topicsFor, validateFocus,
  type Focus,
} from "@/cafe/topics";
import { JINGLES, KITCHEN_SONG, KITCHEN_UNLOCKED, ORDER_SERVED, SHIFT_DONE, SONGS, rushTempo } from "@/music";
import "@/cafe/cafe.css";

const GAME_ID = "kitchen-cafe";
type Screen = "title" | "play" | "summary";

interface View {
  phase: string;
  orderIdx: number;
  orders: number;
  stars: number;
  till: number;
  score: number;
  step: number;
  next: number | null;
  working: number | null;
  dish: string;
  stepsText: string[];
  question: CafeQ | null;
  qKind: AskKind | null;
  answered: { picked: number; correct: boolean } | null;
}

const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
const debug = params.has("debug");
const speedUp = debug ? Math.max(1, Math.min(20, Number(params.get("speed")) || 1)) : 1;

function initialFocus(grade: Grade): { focus: Focus; note: string | null } {
  const url = focusFromUrl(typeof window === "undefined" ? "" : window.location.search, grade);
  let note: string | null = null;
  if (url.unavailable) {
    const t = topicInfo(url.unavailable);
    note = `${t.label} is for ${gradesNote(t.id)}, not ${gradeLabel(grade)}. Here's ${t.subject === "math" ? "all math" : "all science"} instead.`;
  }
  return { focus: url.focus ?? validateFocus(loadFocus(), grade), note };
}

function viewOf(sim: CafeSim): View {
  const o = sim.order;
  return {
    phase: sim.phase,
    orderIdx: sim.orderIdx,
    orders: sim.orders.length,
    stars: sim.stars,
    till: sim.till,
    score: sim.score,
    step: sim.step,
    next: sim.phase === "cook" ? sim.nextStation : null,
    working: sim.phase === "work" ? sim.work?.station ?? null : null,
    dish: o?.dish.name ?? "",
    stepsText: o ? o.dish.steps.map((s) => `${s.verb}`) : [],
    question: sim.question,
    qKind: sim.questionKind,
    answered: sim.answered,
  };
}

const sameView = (a: View | null, b: View) =>
  !!a && a.phase === b.phase && a.orderIdx === b.orderIdx && a.stars === b.stars && a.till === b.till && a.step === b.step && a.next === b.next &&
  a.working === b.working && a.question === b.question && a.answered === b.answered;

const LETTERS = "ABCD";

export default function KitchenCafe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<CafeSim | null>(null);
  const audio = useMemo(() => new ChipAudio(), []);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [focusInit] = useState(() => initialFocus(initialGrade("3")));
  const [focus, setFocus] = useState<Focus>(focusInit.focus);
  const [notice, setNotice] = useState<string | null>(focusInit.note);
  const [save, setSave] = useState<CafeSave>(() => loadSave());
  const [kitchen, setKitchen] = useState<number>(() => {
    const s = loadSave();
    const k = Number(params.get("kitchen"));
    return Number.isInteger(k) && isUnlocked(s, k) ? k : s.unlocked;
  });
  const [screen, setScreen] = useState<Screen>("title");
  const [view, setView] = useState<View | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  useEffect(() => exposeMusicDebug(audio, SONGS, JINGLES), [audio]);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [summary, setSummary] = useState<{ kitchen: number; stars: number; max: number; score: number; log: LogEntry[]; unlockedNew: boolean } | null>(null);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const kitchenRef = useRef(kitchen);
  kitchenRef.current = kitchen;
  const early = isEarlyReader(grade);

  const speakStep = useCallback((sim: CafeSim) => {
    if (!readAloudRef.current || !isEarlyReader(sim.grade)) return;
    const o = sim.order;
    if (!o || sim.step >= o.dish.steps.length) return;
    const st = o.dish.steps[sim.step];
    speak(`${sim.step === 0 ? `New order: ${o.dish.name}. ` : ""}${st.verb}. Go to the ${STATIONS.find((s) => s.id === st.station)!.name}.`);
  }, []);

  /** Handles what the sim did this frame: sounds, read-aloud, saving. */
  const handleEvents = useCallback((sim: CafeSim) => {
    for (const e of sim.drainEvents()) {
      switch (e.type) {
        case "arrive":
          audio.blip();
          break;
        case "wrong-station":
          audio.tone(220, 0.12, "square", 0.2);
          break;
        case "work-start":
          audio.tone(440, 0.06, "square", 0.2, 660);
          break;
        case "work-early":
          audio.tone(330, 0.05, "triangle", 0.2);
          break;
        case "step-done":
          if (e.quality === "perfect") audio.checkpoint();
          else audio.blip();
          break;
        case "ask": {
          const dealt = dealQ(e.q);
          sim.question = dealt;
          if (readAloudRef.current) speakQuestion(dealt.prompt, dealt.choices);
          break;
        }
        case "answer":
          if (e.correct) audio.correct();
          else audio.wrong();
          break;
        case "served":
          audio.playJingle(ORDER_SERVED);
          break;
        case "shift-done": {
          audio.stopMusic();
          audio.setTempoScale(1);
          const k = sim.kitchen.id;
          const before = loadSave();
          const after = finishShift(before, k, sim.stars);
          audio.playJingle(after.unlocked > before.unlocked ? KITCHEN_UNLOCKED : SHIFT_DONE, { then: "stop" });
          writeSave(after);
          setSave(after);
          setHighScore(submitScore(GAME_ID, sim.score));
          setSummary({ kitchen: k, stars: sim.stars, max: sim.maxStars, score: sim.score, log: [...sim.log], unlockedNew: after.unlocked > before.unlocked });
          setScreen("summary");
          break;
        }
      }
    }
  }, [audio]);

  // Main loop: draws the café (idle on the title screen) and steps the sim.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let lastPhase = "";
    let lastStep = -1;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sim = simRef.current;
      if (!pausedRef.current) {
        t += dt;
        if (sim && screenRef.current === "play") {
          sim.update(dt * speedUp);
          handleEvents(sim);
          if (screenRef.current === "play") {
            // Music: the boogie, a little quicker as the rush builds (not for K-2), calmer for a Science Check.
            const science = sim.phase === "ask" && (sim.questionKind === "science" || sim.questionKind === "exp");
            audio.playSong(KITCHEN_SONG);
            audio.setIntensity(science ? "calm" : "full");
            audio.setTempoScale(science ? 1 : rushTempo(sim.orderIdx, sim.orders.length, isEarlyReader(sim.grade)));
          }
          if ((sim.phase === "cook" && (lastPhase !== "cook" || lastStep !== sim.step))) speakStep(sim);
          lastPhase = sim.phase;
          lastStep = sim.step;
          const v = viewOf(sim);
          setView((old) => (sameView(old, v) ? old : v));
        }
      }
      drawFrame(ctx, screenRef.current === "play" ? sim : null, sim && screenRef.current === "play" ? sim.kitchen.id : kitchenRef.current, t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [handleEvents, speakStep, screen]);

  const start = useCallback((k: number = kitchenRef.current) => {
    audio.unlock();
    audio.setTempoScale(1);
    audio.setIntensity("full");
    audio.duck(false);
    audio.playSong(KITCHEN_SONG, { restart: true });
    stopSpeaking();
    const f = validateFocus(focus, grade);
    const sim = new CafeSim(grade, k, f, randSeed());
    simRef.current = sim;
    setKitchen(k);
    setSummary(null);
    setPaused(false);
    setView(viewOf(sim));
    setScreen("play");
  }, [audio, focus, grade]);

  const toTitle = useCallback(() => {
    audio.stopMusic();
    stopSpeaking();
    simRef.current = null;
    setPaused(false);
    setScreen("title");
  }, [audio]);

  const answer = useCallback((i: number) => {
    const sim = simRef.current;
    if (!sim || sim.phase !== "ask" || sim.answered || !sim.question) return;
    const q = sim.question;
    const ok = sim.answer(i);
    if (ok === null) return;
    recordAnswer(GAME_ID, q, ok);
    handleEvents(sim);
    setView(viewOf(sim));
    if (readAloudRef.current) speak(`${ok ? "Correct!" : `Not quite. The answer is ${q.choices[q.answer]}.`} ${q.explanation}`);
  }, [handleEvents]);

  const resume = useCallback(() => {
    const sim = simRef.current;
    if (!sim) return;
    stopSpeaking();
    sim.resume();
    handleEvents(sim);
    setView(viewOf(sim));
  }, [handleEvents]);

  const togglePause = useCallback((v?: boolean) => {
    setPaused((p) => {
      const n = v ?? !p;
      // Paused: the music carries on quietly underneath.
      audio.duck(n);
      return n;
    });
  }, [audio]);

  const replay = useCallback(() => {
    const sim = simRef.current;
    const q = sim?.question;
    if (q) {
      if (sim!.answered) speak(q.explanation);
      else speakQuestion(q.prompt, q.choices);
    } else if (sim) speakStep(sim);
  }, [speakStep]);

  const toggleReadAloud = () => {
    const n = !readAloud;
    setReadAloud(n);
    setReadAloudPref(n);
  };

  // Keyboard: arrows move, Space/Enter cook or continue, 1-4 / A-D answer, Esc/P pause, M mute, R read aloud.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (screenRef.current !== "play") {
        if (e.key === "m" || e.key === "M") setMuted(audio.toggleMute());
        return;
      }
      const sim = simRef.current;
      if (!sim) return;
      const k = e.key;
      if (k === "Escape" || k === "p" || k === "P") {
        e.preventDefault();
        togglePause();
        return;
      }
      if (k === "m" || k === "M") return void setMuted(audio.toggleMute());
      if (k === "r" || k === "R") return void replay();
      if (pausedRef.current) return;
      if (sim.phase === "ask") {
        const n = "1234".indexOf(k);
        const l = "abcd".indexOf(k.toLowerCase());
        if (!sim.answered && (n >= 0 || (l >= 0 && k.length === 1))) {
          e.preventDefault();
          answer(n >= 0 ? n : l);
        } else if (sim.answered && (k === "Enter" || k === " ")) {
          e.preventDefault();
          resume();
        }
        return;
      }
      if (k === "ArrowLeft") {
        e.preventDefault();
        sim.move(-1);
      } else if (k === "ArrowRight") {
        e.preventDefault();
        sim.move(1);
      } else if (k === " " || k === "Enter" || k === "ArrowUp" || k === "ArrowDown") {
        if (tag === "BUTTON" && (k === " " || k === "Enter")) return; // let the focused button click itself
        e.preventDefault();
        sim.use();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audio, answer, resume, replay, togglePause]);

  useEffect(() => () => {
    audio.stopMusic();
    stopSpeaking();
  }, [audio]);

  // Debug hooks for the automated playtest.
  useEffect(() => {
    if (!debug) return;
    (window as unknown as Record<string, unknown>).__kc = { sim: () => simRef.current, start, answer, resume };
  }, [start, answer, resume]);

  const chooseGrade = (g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setFocus((f) => validateFocus(f, g));
    setNotice(null);
  };
  const chooseFocus = (f: Focus) => {
    const v = validateFocus(f, grade);
    setFocus(v);
    saveFocus(v);
    setNotice(null);
  };

  const tapStation = (i: number) => {
    const sim = simRef.current;
    if (!sim || paused) return;
    audio.unlock();
    sim.tapStation(i);
    handleEvents(sim);
    setView(viewOf(sim));
  };

  const k = kitchenById(screen === "play" && simRef.current ? simRef.current.kitchen.id : kitchen);
  const tag = focusTag(focus);

  return (
    <div className={`kc-root ${early ? "early" : ""}`}>
      <div className="kc-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="kc-tools">
          {screen === "play" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
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

      {screen === "play" && view && (
        <div className="kc-hud kc-pixel" aria-live="off">
          <div><span className="lbl">{k.tag}</span></div>
          <div><span className="lbl">ORDER</span><span className="val">{Math.min(view.orderIdx + 1, view.orders)}/{view.orders}</span></div>
          <div><span className="lbl">★</span><span className="val y">{view.stars}</span></div>
          <div><span className="lbl">TILL</span><span className="val g">${(view.till / 100).toFixed(2)}</span></div>
          <div className="hide-sm"><span className="lbl">HI</span><span className="val">{String(Math.max(highScore, view.score)).padStart(5, "0")}</span></div>
        </div>
      )}

      {screen === "play" && view && <Ticket view={view} early={early} />}

      <div className={`kc-screen ${screen !== "play" ? "kc-hidden-screen" : ""}`}>
        <canvas ref={canvasRef} width={W} height={H} aria-label="Kitchen Chemistry Café game screen" onPointerDown={(e) => {
          const sim = simRef.current;
          if (!sim || screen !== "play") return;
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          const y = ((e.clientY - r.top) / r.height) * H;
          if (y > 96) tapStation(Math.max(0, Math.min(4, Math.floor(x / 64))));
        }} />
        {screen === "play" && paused && (
          <div className="kc-overlay">
            <div className="kc-panel small">
              <div className="kc-title kc-pixel">PAUSED</div>
              <HowToPlay early={early} />
              <div className="kc-row center">
                <button className="kc-cta ghost" onClick={toTitle}>Quit shift</button>
                <button className="kc-cta" autoFocus onClick={() => togglePause(false)}>Resume ▶</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {screen === "play" && view && view.phase === "ask" && view.question && (
        <QuestionCard view={view} onAnswer={answer} onResume={resume} onSpeak={speechSupported() ? replay : null} readAloud={readAloud} focus={focus} />
      )}

      {screen === "play" && view && view.phase !== "ask" && (
        <div className="kc-stations" role="group" aria-label="Kitchen stations">
          {STATIONS.map((s, i) => {
            const isNext = view.next === i;
            const isWorking = view.working === i;
            return (
              <button
                key={s.id}
                type="button"
                data-station={s.id}
                className={`kc-station ${isNext ? "next" : ""} ${isWorking ? "working" : ""}`}
                onClick={() => tapStation(i)}
              >
                <span className="kc-pixel">{isWorking ? (noClock(grade) ? "COOKING" : "DONE!") : s.short}</span>
                <small>{isWorking ? (noClock(grade) ? "wait…" : "tap in the green") : s.name}</small>
              </button>
            );
          })}
        </div>
      )}

      {screen === "title" && (
        <TitleScreen
          grade={grade} onGrade={chooseGrade} focus={focus} onFocus={chooseFocus} notice={notice} save={save} kitchen={kitchen}
          onKitchen={setKitchen} onStart={() => start(kitchen)} highScore={highScore} tag={tag}
        />
      )}

      {screen === "summary" && summary && (
        <Summary s={summary} grade={grade} save={save} onNext={() => start(Math.min(4, summary.kitchen + 1))} onAgain={() => start(summary.kitchen)} onTitle={toTitle} />
      )}
    </div>
  );
}

function Ticket({ view, early }: { view: View; early: boolean }) {
  const steps = view.stepsText;
  const doneAll = view.step >= steps.length;
  let line: string;
  if (view.phase === "arrive") line = "A customer is coming in…";
  else if (view.phase === "pay" || view.phase === "leave") line = "Order up! The customer pays and leaves a tip.";
  else if (doneAll) line = "Serving…";
  else {
    const st = steps[view.step];
    const station = view.next !== null ? STATIONS[view.next] : view.working !== null ? STATIONS[view.working] : null;
    line = view.working !== null
      ? early ? `${st}: cooking… watch the meter!` : `${st}: press SPACE or tap DONE! when the marker is in the green.`
      : `Next: ${st}${station ? ` at the ${station.name}` : ""}.`;
  }
  return (
    <div className="kc-ticket" aria-live="polite">
      <div className="kc-ticket-head kc-pixel">
        <span>TICKET #{view.orderIdx + 1}: {view.dish.toUpperCase()}</span>
      </div>
      <ol className="kc-steps">
        {steps.map((s, i) => (
          <li key={i} className={i < view.step ? "done" : i === view.step ? "now" : ""}>{i < view.step ? "✔ " : ""}{s}</li>
        ))}
      </ol>
      <div className="kc-ticket-line">{line}</div>
    </div>
  );
}

function Bars({ q }: { q: CafeQ }) {
  if (!q.chart) return null;
  const max = Math.max(...q.chart.bars.map((b) => b.value));
  return (
    <div className="kc-chart" aria-label={`Bar chart: ${q.chart.title}`}>
      <div className="kc-chart-title">{q.chart.title} ({q.chart.unit})</div>
      {q.chart.bars.map((b) => (
        <div key={b.label} className="kc-bar">
          <span className="lab">{b.label}</span>
          <span className="track"><i style={{ width: `${(b.value / max) * 100}%` }} /></span>
          <span className="num">{b.value}</span>
        </div>
      ))}
    </div>
  );
}

function QuestionCard({
  view, onAnswer, onResume, onSpeak, readAloud, focus,
}: { view: View; onAnswer: (i: number) => void; onResume: () => void; onSpeak: (() => void) | null; readAloud: boolean; focus: Focus }) {
  const q = view.question!;
  const a = view.answered;
  const sci = q.subject === "science";
  const title = view.qKind === "exp" ? "BAKE-OFF TEST" : sci ? "SCIENCE CHECK" : view.qKind === "chart" ? "JUDGES' CHART" : "MATH MOMENT";
  const ftag = focusTag(focus);
  const resumeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (a) resumeRef.current?.focus();
  }, [a]);
  return (
    <div className={`kc-card ${a ? (a.correct ? "correct" : "wrong") : ""} ${sci ? "sci" : "math"}`} role="dialog" aria-label={title}>
      <div className="kc-card-head kc-pixel">
        <span>{a ? (a.correct ? "✔ CORRECT! +1★" : "✘ NOT QUITE: NO STARS LOST") : `${title} · BONUS ★`}</span>
        <span className="std">{ftag ? `${ftag} · ` : ""}{q.standard}</span>
      </div>
      <div className="kc-prompt">
        {onSpeak && (
          <button type="button" className={`kc-speak ${readAloud ? "on" : ""}`} onClick={onSpeak} aria-label="Read aloud" title="Read aloud (R)">🔊</button>
        )}
        <span>{q.prompt}</span>
      </div>
      <Bars q={q} />
      <div className="kc-opts">
        {q.choices.map((c, i) => {
          const cls = a ? (i === q.answer ? "right" : i === a.picked ? "picked-wrong" : "dim") : "";
          return (
            <button key={i} type="button" className={`kc-opt ${cls}`} disabled={!!a} onClick={() => onAnswer(i)} data-choice={i}>
              <b className="kc-pixel">{i + 1}·{LETTERS[i]}</b>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {a && (
        <div className="kc-after">
          <div className="kc-explain">
            {a.correct ? "" : <><b className="y">Answer: {q.choices[q.answer]}.</b> </>}
            {q.explanation}
          </div>
          <button ref={resumeRef} className="kc-cta" onClick={onResume}>Back to the kitchen ▶</button>
        </div>
      )}
    </div>
  );
}

function HowToPlay({ early }: { early: boolean }) {
  return (
    <div className="kc-help">
      <div className="keys">
        <kbd>◀</kbd> <kbd>▶</kbd> walk · <kbd>SPACE</kbd>/<kbd>ENTER</kbd> cook &amp; take it off the heat · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer ·{" "}
        <kbd>ESC</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud
      </div>
      <div className="touchhelp">Phone or tablet: tap a station button (or the station in the picture), then tap DONE! when the marker is in the green. Tap an answer to pick it.</div>
      <ul>
        <li>Read the <span className="y">ticket</span>: it lists each step and its station (Cutting Board, Mixing Bowl, Stove, Oven, Freezer). The station to use next flashes.</li>
        <li>{early ? "Tap the station and Chef Bix cooks it for you. No rush: customers wait as long as you need!" : <>Use the station, watch the meter and stop in the <span className="g">green</span> for a perfect dish. Quick orders earn a speed star, but nobody ever walks out.</>}</li>
        <li>After a step, the <span className="c">Science Check</span> asks: {early ? "what happened to the food? Did it melt, freeze or cook?" : "physical or chemical change, and what's the evidence?"} Math moments pop up for measuring, timers and making change.</li>
        <li>Right answers earn bonus ★. Wrong answers just show why. You never lose an order or a star. Serve every order to open the next kitchen!</li>
      </ul>
    </div>
  );
}

function ChefPortrait() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      c.clearRect(0, 0, 40, 60);
      drawChef(c, 20, 58, (now - t0) / 1000, false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={40} height={60} className="kc-portrait" aria-label="Chef Bix" />;
}

function TitleScreen({
  grade, onGrade, focus, onFocus, notice, save, kitchen, onKitchen, onStart, highScore, tag,
}: {
  grade: Grade; onGrade: (g: Grade) => void; focus: Focus; onFocus: (f: Focus) => void; notice: string | null; save: CafeSave; kitchen: number;
  onKitchen: (k: number) => void; onStart: () => void; highScore: number; tag: string | null;
}) {
  const fromArcade = gradeFromArcade();
  const [help, setHelp] = useState(false);
  const n = grade === "K" ? 0 : Number(grade);
  return (
    <div className="kc-panel title">
      <div className="kc-logo">
        <ChefPortrait />
        <div>
          <div className="kc-title kc-pixel">KITCHEN CHEMISTRY CAFÉ</div>
          <div className="kc-sub kc-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>
          <div className="kc-help">Help <b className="y">Chef Bix</b> run the rush: cook at five stations, pass the Science Check, measure, time and make change.</div>
        </div>
      </div>
      {fromArcade ? (
        <div className="kc-sub kc-pixel kc-gradebadge">
          {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
        </div>
      ) : (
        <>
          <div className="kc-h kc-pixel">PICK YOUR GRADE</div>
          <div className="kc-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`kc-grade kc-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="kc-h kc-pixel">PICK YOUR SUBJECT</div>
      {notice && <div className="kc-help center y kc-notice" role="status">{notice}</div>}
      <FocusPicker grade={grade} focus={focus} onFocus={onFocus} />
      <div className="kc-h kc-pixel">PICK YOUR KITCHEN</div>
      <div className="kc-kitchens" role="radiogroup" aria-label="Kitchen">
        {KITCHENS.map((kk) => {
          const open = isUnlocked(save, kk.id);
          const exp = kk.id === 4 && n >= 5;
          return (
            <button
              key={kk.id}
              type="button"
              role="radio"
              aria-checked={kitchen === kk.id}
              disabled={!open}
              data-kitchen={kk.id}
              className={`kc-kitchen k${kk.id} ${kitchen === kk.id ? "on" : ""}`}
              onClick={() => onKitchen(kk.id)}
            >
              <span className="kc-pixel">{kk.id}. {kk.name.toUpperCase()}</span>
              <small>{open ? (exp ? "Fair tests: change one variable, compare the chart. " : "") + kk.blurb : `🔒 Serve every order in kitchen ${kk.id - 1} to open`}</small>
              {open && save.best[kk.id - 1] > 0 && <small className="y">Best: {save.best[kk.id - 1]}★</small>}
            </button>
          );
        })}
      </div>
      <div className="kc-row center">
        <button className="kc-cta big" autoFocus onClick={onStart}>
          {tag ? `Open: ${tag} ▶` : "Open the café ▶"}
        </button>
        <button className="kc-cta ghost" onClick={() => setHelp((h) => !h)} aria-expanded={help}>How to play</button>
      </div>
      {help && <HowToPlay early={isEarlyReader(grade)} />}
      <div className="kc-help dim center">HI-SCORE {String(highScore).padStart(5, "0")}</div>
    </div>
  );
}

function FocusPicker({ grade, focus, onFocus }: { grade: Grade; focus: Focus; onFocus: (f: Focus) => void }) {
  return (
    <div className="kc-focus">
      <div className="kc-subjects" role="radiogroup" aria-label="Subject">
        {SUBJECT_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={focus.subject === m.id}
            data-subject={m.id}
            className={`kc-subject ${focus.subject === m.id ? "on" : ""}`}
            onClick={() => focus.subject !== m.id && onFocus(m.id === "mixed" ? MIXED : { subject: m.id, topic: "all" })}
          >
            <span className="kc-pixel">{m.label}</span>
            <small>{m.note}</small>
          </button>
        ))}
      </div>
      {focus.subject !== "mixed" && (
        <div className="kc-topics" role="radiogroup" aria-label={focus.subject === "math" ? "Math topic" : "Science topic"}>
          <button
            type="button"
            role="radio"
            aria-checked={focus.topic === "all"}
            data-topic="all"
            className={`kc-topic all ${focus.topic === "all" ? "on" : ""}`}
            onClick={() => onFocus({ subject: focus.subject, topic: "all" })}
          >
            <span className="kc-pixel">{focus.subject === "math" ? "ALL MATH" : "ALL SCIENCE"}</span>
          </button>
          {topicsFor(focus.subject).map((t) => {
            const ok = topicAvailable(t.id, grade);
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={focus.topic === t.id}
                disabled={!ok}
                data-topic={t.id}
                className={`kc-topic ${focus.topic === t.id ? "on" : ""}`}
                onClick={() => onFocus({ subject: focus.subject, topic: t.id })}
                title={ok ? t.label : `${t.label}: ${gradesNote(t.id)}`}
              >
                <span>{t.label}</span>
                {!ok && <small>{gradesNote(t.id)}</small>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Summary({
  s, grade, save, onNext, onAgain, onTitle,
}: {
  s: { kitchen: number; stars: number; max: number; score: number; log: LogEntry[]; unlockedNew: boolean }; grade: Grade; save: CafeSave; onNext: () => void; onAgain: () => void; onTitle: () => void;
}) {
  const k = kitchenById(s.kitchen);
  const byStd = new Map<string, { skill: string; n: number; c: number }>();
  for (const l of s.log) {
    const cur = byStd.get(l.q.standard) ?? { skill: l.q.skill, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.q.standard, cur);
  }
  const right = s.log.filter((l) => l.correct).length;
  const last = s.kitchen >= KITCHENS.length;
  const pct = s.max ? s.stars / s.max : 0;
  const rating = pct >= 0.85 ? "★★★ FIVE-STAR SHIFT!" : pct >= 0.6 ? "★★ GREAT SHIFT!" : "★ SHIFT COMPLETE!";
  return (
    <div className="kc-panel">
      <div className="kc-h kc-pixel" style={{ color: "var(--kc-yellow)" }}>{last ? "CAFÉ CHAMPION! ALL FOUR KITCHENS SERVED" : `${k.name.toUpperCase()} · CLOSED FOR THE DAY`}</div>
      <div className="kc-help big center">
        {rating} <b className="y">{s.stars}★</b> of {s.max} · Score <b className="c">{s.score}</b> · Checks right <b className="g">{right}/{s.log.length}</b>
      </div>
      {s.unlockedNew && !last && <div className="kc-help center g kc-pixel kc-unlock">NEW KITCHEN OPEN: {kitchenById(s.kitchen + 1).name.toUpperCase()}!</div>}
      {byStd.size > 0 && (
        <table className="kc-report">
          <thead><tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr></thead>
          <tbody>
            {[...byStd.entries()].map(([std, v]) => (
              <tr key={std}>
                <td className="c">{std}</td>
                <td>{v.skill}</td>
                <td style={{ color: v.c === v.n ? "var(--kc-green)" : v.c / v.n >= 0.5 ? "var(--kc-yellow)" : "var(--kc-red)" }}>{v.c}/{v.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="kc-help dim center">{gradeLabel(grade)} · progress is saved on this device</div>
      <div className="kc-row center">
        <button className="kc-cta ghost" onClick={onTitle}>Title screen</button>
        <button className="kc-cta ghost" onClick={onAgain}>Play this kitchen again</button>
        {!last && isUnlocked(save, s.kitchen + 1) && (
          <button className="kc-cta" autoFocus onClick={onNext}>Next kitchen: {kitchenById(s.kitchen + 1).name} ▶</button>
        )}
      </div>
    </div>
  );
}

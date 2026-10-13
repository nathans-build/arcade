import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  arcadeLink,
  bankFor,
  gradeFromArcade,
  gradeLabel,
  gradeNumber,
  initialGrade,
  isEarlyReader,
  loadProgress,
  markAdaptive,
  mathGradeFor,
  mathQuestion,
  readAloudPref,
  recordAnswer,
  rememberGrade,
  setReadAloudPref,
  speak,
  speechSupported,
  stopSpeaking,
  submitScore,
  type Grade,
  type Subject,
} from "@/kit";
import { ALPHABET } from "@/pursuit/cipher";
import type { CPQuestion } from "@/pursuit/questions";
import { Renderer, LANE_COLORS, type Banner } from "@/pursuit/render";
import { GADGET_NAMES, H, PursuitSim, W, ZONE_NAMES, laneAt, type SimEvent } from "@/pursuit/sim";
import { CodeSource, type KitHooks } from "@/pursuit/source";
import {
  SUBJECT_MODES, focusName, focusTag, gradesNote, loadPref, prefOf, readUrlFocus, resolveFocus, savePref, topicAvailable, topicsFor,
  type Focus, type FocusPref,
} from "@/pursuit/topics";
import { TIMINGS, loadTiming, saveTiming, type Timing } from "@/pursuit/timing";
import "@/pursuit/pursuit.css";

const GAME_ID = "cipher-pursuit";

/** Cipher Pursuit's own 16-step bassline: a driving minor-key spy riff (Hz, 0 = rest). */
const BASS = [110, 110, 0, 131, 110, 0, 165, 156, 110, 110, 0, 131, 110, 0, 98, 104];

const PX_PER_MILE = 6545; // 100 px/s on screen = 55 mph

type Screen = "title" | "playing" | "over";

interface LogEntry {
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
}

interface HudState {
  score: number;
  lives: number;
  fuel: number;
  mph: number;
  miles: number;
  stage: number;
  zone: string;
  shield: boolean;
  turbo: number;
  smoke: number;
  cracked: number;
  cleared: number;
  boat: boolean;
  clock: ClockView | null;
}

/** The checkpoint countdown for the time bar (null when no question is waiting). */
interface ClockView {
  /** Infinity in RELAXED: the gate waits. */
  total: number;
  left: number;
  /** Still waiting for read-aloud before the countdown starts. */
  voice: boolean;
  /** The car is stopped at the gates. */
  waiting: boolean;
}

interface CodeView {
  q: CPQuestion;
  n: number;
  lock: number | null;
  picked: number | null;
  correct: boolean | null;
  points: number;
}

const EMPTY_HUD: HudState = {
  score: 0, lives: 3, fuel: 100, mph: 55, miles: 0, stage: 1, zone: ZONE_NAMES.city, shield: false, turbo: 0, smoke: 0, cracked: 0, cleared: 0, boat: false, clock: null,
};

/** True while the browser is still reading something out. */
function speechBusy(): boolean {
  try {
    return typeof window !== "undefined" && "speechSynthesis" in window && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
  } catch {
    return false;
  }
}

const KEYS: Record<string, "left" | "right" | "up" | "down"> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };

const kitHooks: KitHooks = {
  math: (g: Grade) => {
    const q = mathQuestion(mathGradeFor(g), { quick: true });
    markAdaptive(q, g);
    return q;
  },
  ela: (g: Grade) => bankFor("ela", g),
};

function sayCode(q: CPQuestion) {
  speak(`${q.prompt} ${q.choices.map((c, i) => `Lane ${i + 1}: ${c}.`).join(" ")}`);
}

const isCipher = (q: CPQuestion) => q.family.startsWith("cipher");

/** Arrow keys move between the buttons of a radiogroup (Tab still moves in and out). */
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

export default function CipherPursuit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 152), []);
  const simRef = useRef<PursuitSim | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const bannerRef = useRef<Banner | null>(null);
  const screenRef = useRef<Screen>("title");
  const pausedRef = useRef(false);
  const debriefAt = useRef(0);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  // ?topic= from the arcade menu wins for this visit (not saved); otherwise the saved choice.
  const [urlFocus] = useState(() => readUrlFocus(window.location.search, initialGrade("3")));
  const [pref, setPref] = useState<FocusPref>(() => urlFocus.pref ?? loadPref());
  const [notice, setNotice] = useState<string | null>(urlFocus.note);
  const focus = useMemo(() => resolveFocus(pref, grade), [pref, grade]);
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [code, setCode] = useState<CodeView | null>(null);
  const [tip, setTip] = useState<string>("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [splats, setSplats] = useState(0);
  const [timing, setTiming] = useState<Timing>(loadTiming);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const prefRef = useRef(pref);
  prefRef.current = pref;
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  screenRef.current = screen;
  pausedRef.current = paused;
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

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  /** A sim for the title screen: drives itself (no crashes) behind the menu. */
  const makeDemo = useCallback((g: Grade) => {
    const src = new CodeSource(g, kitHooks, Math.random, resolveFocus(prefRef.current, g));
    const sim = new PursuitSim({ gradeN: gradeNumber(g), nextQuestion: (ctx) => src.next(ctx), god: true });
    simRef.current = sim;
    setCode(null);
  }, []);

  const handleEvent = useCallback(
    (ev: SimEvent, sim: PursuitSim) => {
      const playing = screenRef.current === "playing";
      if (!playing) return;
      switch (ev.type) {
        case "fire": audio.shoot(); break;
        case "splat":
          audio.noise(0.18, 0.5);
          audio.tone(420, 0.18, "square", 0.25, 90);
          setSplats(sim.splats);
          break;
        case "crash":
          audio.crash();
          if (rendererRef.current) rendererRef.current.shake = 1;
          setTip(ev.livesLeft > 0 ? `BONK! The Smudge Gang got you. ${ev.livesLeft} ${ev.livesLeft === 1 ? "car" : "cars"} left.` : "Out of cars!");
          break;
        case "shieldHit": audio.tone(900, 0.2, "triangle", 0.4, 300); setTip("Your shield saved you!"); break;
        case "bump": audio.tone(110, 0.08, "square", 0.3); break;
        case "spin": audio.tone(600, 0.5, "sawtooth", 0.2, 150); setTip("Oil slick! Spinning out…"); break;
        case "fuel": audio.jump(); setTip("Fuel can: +35% fuel."); break;
        case "lowFuel": audio.tone(440, 0.12, "square", 0.3); setTip("Low fuel! Grab the red fuel cans."); break;
        case "zone":
          audio.levelUp();
          bannerRef.current = { text: ZONE_NAMES[ev.surface], sub: `STAGE ${ev.stage}`, t: 2.6, color: "#ffd23f" };
          setTip(ev.surface === "water" ? "River ahead: your car turns into a boat at the dock!" : `Next zone: ${ZONE_NAMES[ev.surface].toLowerCase()}.`);
          break;
        case "vehicle":
          audio.noise(0.4, 0.4);
          bannerRef.current = { text: ev.boat ? "BOAT MODE!" : "CAR MODE!", t: 1.6, color: "#7ff3ff" };
          break;
        case "extraLife": audio.levelUp(); bannerRef.current = { text: "EXTRA CAR!", t: 1.8, color: "#5fff8a" }; break;
        case "announce":
          audio.checkpoint();
          setCode({ q: ev.q, n: ev.n, lock: null, picked: null, correct: null, points: 0 });
          if (readAloudRef.current) sayCode(ev.q);
          break;
        case "lock":
          audio.blip();
          setCode((c) => (c ? { ...c, lock: ev.lane } : c));
          break;
        case "result": {
          const { q, correct, lane, points } = ev;
          if (correct) audio.correct();
          else audio.wrong();
          debriefAt.current = performance.now();
          recordAnswer(GAME_ID, q, correct);
          setLog((l) => [...l, { subject: q.subject, standard: q.standard, skill: q.skill, correct }]);
          setCode((c) => (c ? { ...c, picked: lane, correct, points } : c));
          if (readAloudRef.current) speak(correct ? `Correct! ${q.explanation}` : `The answer is lane ${q.answer + 1}: ${q.choices[q.answer]}. ${q.explanation}`);
          break;
        }
        case "gadget":
          audio.levelUp();
          bannerRef.current = { text: GADGET_NAMES[ev.gadget], sub: "GADGET DELIVERED!", t: 2, color: "#5fff8a" };
          break;
        case "gameover": {
          audio.gameOver();
          audio.stopMusic();
          stopSpeaking();
          setHighScore(submitScore(GAME_ID, ev.score));
          setScreen("over");
          break;
        }
      }
    },
    [audio],
  );

  // Renderer + main loop (runs the demo behind the title and game-over screens).
  useEffect(() => {
    const canvas = canvasRef.current!;
    rendererRef.current = new Renderer(canvas);
    makeDemo(gradeRef.current);
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __cp: () => PursuitSim | null }).__cp = () => simRef.current;
    }
    let raf = 0;
    let last = performance.now();
    let hudT = 0;
    let demoT = 0;
    let voiceT = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const sim = simRef.current;
      const playing = screenRef.current === "playing";
      if (sim) {
        if (playing && !pausedRef.current) {
          // The countdown waits while the question is being read out (at most a minute, in case
          // a browser never reports the end of speech).
          if (sim.phase === "approach" && sim.readAloud && speechBusy()) {
            voiceT += dt;
            sim.voiceBusy = voiceT < 60;
          } else {
            voiceT = 0;
            sim.voiceBusy = false;
          }
          sim.update(dt);
        } else if (!playing) {
          // Demo driver: follow the road, fire now and then, pick a lane, drive on.
          const road = sim.roadAt(sim.dist + 30);
          sim.input = { left: false, right: false, up: false, down: false, fire: Math.sin(now / 300) > 0.6, targetX: road.cx };
          if (sim.phase === "approach" && sim.cp.lock === null) sim.choose(Math.floor(Math.random() * 4));
          if (sim.phase === "debrief") {
            demoT += dt;
            if (demoT > 2.5) {
              demoT = 0;
              sim.continueDrive();
            }
          }
          if (screenRef.current === "title" || sim.phase !== "over") sim.update(dt);
        }
        for (const ev of sim.drainEvents()) handleEvent(ev, sim);
        const b = bannerRef.current;
        if (b && playing && !pausedRef.current) b.t -= dt;
        rendererRef.current!.draw(sim, playing ? b : null);
        hudT += dt;
        if (playing && hudT > 0.1) {
          hudT = 0;
          setHud({
            score: sim.score, lives: sim.lives, fuel: sim.fuel, mph: sim.mph, miles: sim.dist / PX_PER_MILE, stage: sim.stage,
            zone: ZONE_NAMES[sim.surfaceAt(sim.dist)], shield: sim.shield, turbo: sim.turbo, smoke: sim.smoke,
            cracked: sim.correctCount, cleared: sim.cleared, boat: sim.boat,
            clock: sim.phase === "approach" && !sim.cp.released
              ? { total: sim.cp.timeTotal, left: sim.cp.timeLeft, voice: sim.cp.voiceWait > 0 || sim.voiceBusy, waiting: sim.waiting }
              : null,
          });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, handleEvent, makeDemo]);

  const chooseGrade = useCallback(
    (g: Grade) => {
      setGrade(g);
      setNotice(null);
      rememberGrade(g);
      setReadAloud(readAloudPref(isEarlyReader(g)));
      makeDemo(g);
    },
    [makeDemo],
  );

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    const src = new CodeSource(grade, kitHooks, Math.random, focus);
    const god = new URLSearchParams(window.location.search).has("god");
    simRef.current = new PursuitSim({ gradeN: gradeNumber(grade), nextQuestion: (ctx) => src.next(ctx), god, timing, readAloud });
    bannerRef.current = { text: ZONE_NAMES.city, sub: "STAGE 1 · GO, AGENT!", t: 2.6, color: "#ffd23f" };
    setLog([]);
    setCode(null);
    setSplats(0);
    setHud(EMPTY_HUD);
    setTip(isEarlyReader(grade) ? "Steer with ◀ ▶. Press SPACE (or FIRE) to splat Smudge cars with foam!" : "Splat Smudge Gang cars with foam (Space). Dodge oil slicks and stay on the road!");
    setPaused(false);
    setScreen("playing");
  }, [audio, grade, focus, timing, readAloud]);

  const changeTiming = useCallback((t: Timing) => {
    setTiming(t);
    saveTiming(t);
  }, []);

  /** A change made on the title screen: saved for next time (the arcade swaps arcade.* keys per player). */
  const changePref = useCallback(
    (p: FocusPref) => {
      setPref(p);
      savePref(p);
      setNotice(null);
      // The demo behind the menu follows the new choice.
      prefRef.current = p;
      makeDemo(gradeRef.current);
    },
    [makeDemo],
  );

  const togglePause = useCallback((force?: boolean) => {
    setPaused((p) => {
      const next = force ?? !p;
      if (next) stopSpeaking();
      return next;
    });
  }, []);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      const sim = simRef.current;
      if (sim) {
        sim.readAloud = !on;
        if (on) sim.cp.voiceWait = 0; // turned off: no need to wait for the voice
      }
      return !on;
    });
  }, []);

  const pickLane = useCallback(
    (i: number) => {
      audio.unlock();
      simRef.current?.choose(i);
    },
    [audio],
  );

  const driveOn = useCallback(() => {
    const sim = simRef.current;
    if (!sim || sim.phase !== "debrief") return;
    stopSpeaking();
    sim.continueDrive();
    setCode(null);
    setTip(sim.correctCount > 0 && sim.van === null ? "Gadget ready! Keep driving to the next code checkpoint." : "Drive on to the next code checkpoint!");
  }, []);

  const replay = useCallback(() => {
    if (code) {
      if (code.correct === null) {
        sayCode(code.q);
        // Listening again: the countdown waits for it.
        if (readAloudRef.current) simRef.current?.holdForVoice();
      } else speak(code.q.explanation);
    }
  }, [code]);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k === "m") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const sim = simRef.current;
      if (!sim) return;
      if (k === "p" || ev.key === "Escape") {
        ev.preventDefault();
        togglePause();
        return;
      }
      if (paused) return;
      const dir = KEYS[ev.key];
      if (dir) {
        ev.preventDefault();
        sim.input[dir] = true;
        return;
      }
      const idx = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (idx >= 0) {
        ev.preventDefault();
        if (sim.phase === "approach") pickLane(idx);
        return;
      }
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        if (sim.phase === "debrief") {
          // A fresh press, a moment after the result (so a held fire button doesn't skip the explanation).
          if (!ev.repeat && performance.now() - debriefAt.current > 1200) driveOn();
          return;
        }
        if (ev.key === " ") sim.input.fire = true;
        return;
      }
      if (k === "r") replay();
    };
    const up = (ev: KeyboardEvent) => {
      const sim = simRef.current;
      if (!sim) return;
      const dir = KEYS[ev.key];
      if (dir) sim.input[dir] = false;
      if (ev.key === " ") sim.input.fire = false;
    };
    const blur = () => {
      const sim = simRef.current;
      if (sim) sim.input = { left: false, right: false, up: false, down: false, fire: false, targetX: null };
      if (screen === "playing") togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, paused, audio, togglePause, pickLane, driveOn, replay]);

  // Touch buttons: hold to steer / change speed / fire.
  const hold = (key: "left" | "right" | "up" | "down" | "fire") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      const sim = simRef.current;
      if (sim) sim.input[key] = true;
    },
    onPointerUp: () => {
      const sim = simRef.current;
      if (sim) sim.input[key] = false;
    },
    onPointerLeave: () => {
      const sim = simRef.current;
      if (sim) sim.input[key] = false;
    },
    onPointerCancel: () => {
      const sim = simRef.current;
      if (sim) sim.input[key] = false;
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  // Drag on the game screen to steer; tap a lane gate during a checkpoint to pick it.
  const canvasX = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  };
  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (screen !== "playing" || paused || !sim) return;
    audio.unlock();
    const x = canvasX(e);
    if (sim.phase === "approach") {
      pickLane(laneAt(x));
      return;
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointers can't be captured; steering still works.
    }
    sim.input.targetX = x;
  };
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    if (!sim || sim.input.targetX === null) return;
    sim.input.targetX = canvasX(e);
  };
  const onCanvasUp = () => {
    const sim = simRef.current;
    if (sim) sim.input.targetX = null;
  };

  const fuelPct = Math.round(hud.fuel);

  return (
    <div className={`cp-root ${early ? "early" : ""}`}>
      <div className="cp-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="cp-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`cp-cabinet ${touch && screen === "playing" ? "touch-on" : ""}`}>
        <div className="cp-hud cp-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Cars</span><span className="val lives">{"♥".repeat(Math.max(0, hud.lives))}</span></div>
          <div><span className="lbl">Speed</span><span className="val">{hud.mph} MPH</span></div>
          <div className="fuel">
            <span className="lbl">Fuel</span>
            <span className={`bar ${fuelPct < 25 ? "low" : ""}`}><i style={{ width: `${fuelPct}%` }} /></span>
          </div>
          <div>
            <span className="lbl">Gadget</span>
            <span className="val gadgets">
              <span className={hud.shield ? "on" : "off"} title="Shield">SHD</span>
              <span className={hud.turbo > 0 ? "on" : "off"} title="Turbo">TRB</span>
              <span className={hud.smoke > 0 ? "on" : "off"} title="Smoke screen">SMK</span>
            </span>
          </div>
        </div>

        {screen === "playing" && (
          <Radio code={code} tip={tip} hud={hud} focus={focus} onPick={pickLane} onDriveOn={driveOn} onSpeak={speechSupported() ? replay : null} readAloud={readAloud} timing={timing} />
        )}
        {screen === "playing" && <TimeBar clock={code && code.correct === null ? hud.clock : null} timing={timing} />}

        <div className="cp-stage" ref={stageRef}>
          <div className="cp-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              aria-label="Cipher Pursuit game screen"
              onPointerDown={onCanvasDown}
              onPointerMove={onCanvasMove}
              onPointerUp={onCanvasUp}
              onPointerCancel={onCanvasUp}
            />

            {screen === "title" && (
              <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} focus={focus} onPref={changePref} notice={notice} timing={timing} onTiming={changeTiming} />
            )}

            {screen === "playing" && paused && (
              <div className="cp-overlay">
                <div className="cp-panel">
                  <div className="cp-title cp-pixel">PAUSED</div>
                  <HowToPlay early={early} />
                  <div className="cp-row">
                    <button
                      className="cp-cta ghost"
                      onClick={() => {
                        audio.stopMusic();
                        setPaused(false);
                        setScreen("title");
                        makeDemo(grade);
                      }}
                    >
                      Quit mission
                    </button>
                    <button className="cp-cta" autoFocus onClick={() => togglePause(false)}>Resume ▶</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                grade={grade}
                focus={focus}
                score={hud.score}
                miles={hud.miles}
                splats={splats}
                highScore={highScore}
                onAgain={startGame}
                onMenu={() => {
                  makeDemo(grade);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`cp-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="cp-pad">
            <button className="cp-touch" {...hold("left")} aria-label="Steer left">◀</button>
            <button className="cp-touch" {...hold("right")} aria-label="Steer right">▶</button>
          </div>
          <div className="cp-pad">
            <button className="cp-touch small" {...hold("down")} aria-label="Slow down">▼</button>
            <button className="cp-touch small" {...hold("up")} aria-label="Speed up">▲</button>
            <button className="cp-touch fire" {...hold("fire")} aria-label="Fire foam">FIRE</button>
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

/** The agent radio above the screen: tips while driving, the coded question at a checkpoint, then the debrief. */
function Radio({
  code, tip, hud, focus, onPick, onDriveOn, onSpeak, readAloud, timing,
}: {
  code: CodeView | null; tip: string; hud: HudState; focus: Focus; onPick: (i: number) => void; onDriveOn: () => void; onSpeak: (() => void) | null; readAloud: boolean; timing: Timing;
}) {
  const tag = focusTag(focus);
  if (!code) {
    return (
      <div className="cp-radio idle" aria-live="polite">
        <div className="head cp-pixel">
          <span>AGENT RADIO · {hud.zone} · STAGE {hud.stage}</span>
          <span className="std">{tag ? <span className="cp-focustag">{tag} · </span> : null}CODES {hud.cracked}/{hud.cleared}</span>
        </div>
        <div className="tip">{tip}</div>
        <div className="tip dim">
          {hud.boat ? "Boat mode: dodge the floating logs." : "Watch for oil slicks and red fuel cans."} A code checkpoint comes up every stretch: steer into the lane with the right answer.
        </div>
      </div>
    );
  }
  const { q } = code;
  const done = code.correct !== null;
  let head = timing === "relaxed" ? "INCOMING CODE · TAKE YOUR TIME! · PRESS 1–4, TAP OR STEER" : "INCOMING CODE · STEER INTO A LANE, PRESS 1–4 OR TAP";
  if (!done && code.lock !== null) head = `LANE ${code.lock + 1} LOCKED IN · ARROWS TO STEER BY HAND`;
  if (done) head = code.correct ? `✔ CODE CRACKED! +${code.points}` : `✘ WRONG LANE · THE ANSWER WAS LANE ${q.answer + 1}`;
  return (
    <div className={`cp-radio ${done ? (code.correct ? "correct" : "wrong") : ""}`} aria-live="polite">
      <div className="head cp-pixel">
        <span>{head}</span>
        <span className="std">{tag && focus.mode === "focus" ? <span className="cp-focustag">{tag}</span> : q.subject === "ela" ? "ELA" : "MATH"} · {q.standard}</span>
      </div>
      <div className="prompt">
        {onSpeak && (
          <button type="button" className={`cp-speak ${readAloud ? "on" : ""}`} onClick={onSpeak} aria-label="Read aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        {done ? <span>{code.correct ? "The gadget van delivers! " : "The gadget van drives off. "}{q.explanation}</span> : <span>{q.prompt}</span>}
      </div>
      {!done && isCipher(q) && (
        <div className="decoder cp-pixel" aria-label="Alphabet decoder strip">
          {[...ALPHABET].map((ch) => <span key={ch}>{ch}</span>)}
        </div>
      )}
      {!done ? (
        <div className="opts">
          {q.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`opt ${code.lock === i ? "picked" : ""}`}
              style={{ borderLeftColor: LANE_COLORS[i] }}
              onPointerDown={(e) => {
                e.preventDefault();
                onPick(i);
              }}
              onClick={() => onPick(i)}
            >
              <b>{i + 1}</b>
              <span>{c}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="after">
          <span className="ans">Lane {q.answer + 1}: {q.choices[q.answer]}</span>
          <button className="cp-cta" onClick={onDriveOn}>Drive on ▶</button>
        </div>
      )}
    </div>
  );
}

/** The countdown under the radio: a shrinking bar in NORMAL / SPEEDY, a friendly note in RELAXED. */
function TimeBar({ clock, timing }: { clock: ClockView | null; timing: Timing }) {
  if (!clock) return <div className="cp-timebar idle" aria-hidden="true" />;
  if (!Number.isFinite(clock.total)) {
    return (
      <div className="cp-timebar relaxed cp-pixel" data-timing={timing} role="status">
        {clock.waiting ? "TAKE YOUR TIME! THE GATE WAITS FOR YOUR ANSWER" : "TAKE YOUR TIME · THE CAR WILL WAIT AT THE GATE"}
      </div>
    );
  }
  const frac = Math.max(0, Math.min(1, clock.left / clock.total));
  const secs = Math.ceil(clock.left);
  return (
    <div
      className={`cp-timebar timed ${frac <= 0.2 ? "low" : frac <= 0.5 ? "mid" : ""}`}
      data-timing={timing}
      data-left={clock.left.toFixed(1)}
      data-total={clock.total}
      role="timer"
      aria-label={clock.voice ? "Timer starts after the question is read" : `${secs} seconds left`}
    >
      <span className="lbl cp-pixel">{clock.voice ? "LISTEN…" : `TIME ${secs}s`}</span>
      <span className="bar"><i style={{ width: `${frac * 100}%` }} /></span>
    </div>
  );
}

function TimingPicker({ timing, onTiming }: { timing: Timing; onTiming: (t: Timing) => void }) {
  return (
    <div className="cp-timings" role="radiogroup" aria-label="Timing" onKeyDown={arrowNav}>
      {TIMINGS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={timing === t.id}
          data-timing={t.id}
          className={`cp-timing ${timing === t.id ? "on" : ""}`}
          onClick={() => onTiming(t.id)}
        >
          <span className="cp-pixel">{t.label}</span>
          <small>{t.note}</small>
        </button>
      ))}
    </div>
  );
}

function HowToPlay({ early }: { early: boolean }) {
  return (
    <div className="cp-help">
      <div>
        <kbd>◀</kbd> <kbd>▶</kbd> steer · <kbd>▲</kbd> <kbd>▼</kbd> speed · <kbd>SPACE</kbd> foam blaster · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> pick a lane ·{" "}
        <kbd>P</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud
      </div>
      <div className="touchhelp">On a phone or tablet: hold ◀ ▶ (or drag on the road) to steer, FIRE to blast, tap an answer to pick its lane.</div>
      <ul>
        <li>You're a junior secret agent in a gadget car. <span className="g">Splat Smudge Gang cars</span> with harmless foam, dodge <span className="y">oil slicks</span>, and stay on the road{early ? "" : " (the edges are a crash!)"}.</li>
        <li>At a <span className="c">CODE CHECKPOINT</span> the road splits into 4 lanes. Read the code, then steer into the lane with the right answer (or press its number). In <b>RELAXED</b> timing your car waits at the gates until you answer; <b>NORMAL</b> and <b>SPEEDY</b> show a time bar.</li>
        <li>Right lane: the <span className="c">gadget van</span> delivers a <b>shield</b>, <b>turbo</b> or <b>smoke screen</b>, plus fuel. Wrong lane: no gadget, but no crash either. Read the tip and try the next one!</li>
        <li>Grab red <span className="y">fuel cans</span>. Every two checkpoints the zone changes: city, coast, then the river, where your car becomes a boat.</li>
      </ul>
    </div>
  );
}

/**
 * The subject row (MATH · ELA · MIXED, like the other arcade games), then, for MATH or ELA, a topic
 * row: ALL <subject> first, then its topics. Topics the grade can't fill are disabled with a note.
 */
function FocusPicker({ grade, focus, onPref }: { grade: Grade; focus: Focus; onPref: (p: FocusPref) => void }) {
  const cur = prefOf(focus);
  return (
    <div className="cp-focus">
      <div className="cp-subjects" role="radiogroup" aria-label="Subject" onKeyDown={arrowNav}>
        {SUBJECT_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={cur.subject === m.id}
            data-subject={m.id}
            className={`cp-subject ${cur.subject === m.id ? "on" : ""}`}
            onClick={() => cur.subject !== m.id && onPref({ subject: m.id, topic: "all" })}
          >
            <span className="cp-pixel">{m.label}</span>
            <small>{m.note}</small>
          </button>
        ))}
      </div>
      {cur.subject !== "mixed" && (
        <div className="cp-topics" role="radiogroup" aria-label={cur.subject === "math" ? "Math topic" : "ELA topic"} onKeyDown={arrowNav}>
          <button
            type="button"
            role="radio"
            aria-checked={cur.topic === "all"}
            data-topic="all"
            className={`cp-topic all ${cur.topic === "all" ? "on" : ""}`}
            onClick={() => onPref({ subject: cur.subject, topic: "all" })}
          >
            <span className="cp-pixel">{cur.subject === "math" ? "ALL MATH" : "ALL ELA"}</span>
          </button>
          {topicsFor(cur.subject).map((t) => {
            const ok = topicAvailable(t.id, grade);
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={cur.topic === t.id}
                disabled={!ok}
                data-topic={t.id}
                className={`cp-topic ${cur.topic === t.id ? "on" : ""}`}
                onClick={() => onPref({ subject: cur.subject, topic: t.id })}
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

function TitleScreen({
  grade, onGrade, onStart, highScore, focus, onPref, notice, timing, onTiming,
}: {
  grade: Grade; onGrade: (g: Grade) => void; onStart: () => void; highScore: number; focus: Focus; onPref: (p: FocusPref) => void; notice: string | null;
  timing: Timing; onTiming: (t: Timing) => void;
}) {
  const fromArcade = gradeFromArcade();
  const [help, setHelp] = useState(false);
  const tag = focusTag(focus);
  return (
    <div className="cp-overlay title-bg">
      <div className="cp-panel title">
        <div className="cp-title cp-pixel">CIPHER PURSUIT</div>
        <div className="cp-sub cp-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>
        {fromArcade ? (
          <div className="cp-sub cp-pixel cp-gradebadge">
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="cp-h cp-pixel">PICK YOUR GRADE</div>
            <div className="cp-grades" role="radiogroup" aria-label="Grade">
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={g === grade} className={`cp-grade cp-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}
        <div className="cp-h cp-pixel">PICK YOUR SUBJECT</div>
        {notice && <div className="cp-help center y cp-notice" role="status">{notice}</div>}
        <FocusPicker grade={grade} focus={focus} onPref={onPref} />
        <div className="cp-h cp-pixel">TIMING</div>
        <TimingPicker timing={timing} onTiming={onTiming} />
        <div className="cp-row center">
          <button className="cp-cta big" autoFocus onClick={onStart}>
            {tag ? `Start: ${tag} ▶` : "Start mission ▶"}
          </button>
          <button className="cp-cta ghost" onClick={() => setHelp((h) => !h)} aria-expanded={help}>How to play</button>
        </div>
        {help ? (
          <HowToPlay early={isEarlyReader(grade)} />
        ) : (
          <div className="cp-help center">
            Drive the gadget car, splat the Smudge Gang with foam, and crack the coded checkpoints: steer into the lane with the right answer!
          </div>
        )}
        <div className="cp-help dim center">HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function MissionReport({
  log, grade, focus, score, miles, splats, highScore, onAgain, onMenu,
}: {
  log: LogEntry[]; grade: Grade; focus: Focus; score: number; miles: number; splats: number; highScore: number; onAgain: () => void; onMenu: () => void;
}) {
  const name = focusName(focus);
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
    <div className="cp-overlay">
      <div className="cp-panel">
        <div className="cp-h cp-pixel" style={{ color: "var(--cp-red)" }}>MISSION OVER · AGENT REPORT · {gradeLabel(grade).toUpperCase()}</div>
        <div className="cp-help center cp-reportfocus">
          {name ? (
            <>{focus.mode === "focus" ? "Focus mission" : "Subject mission"}: <b className="c">{name}</b></>
          ) : (
            <>Mixed mission: math and words from all over {gradeLabel(grade)}</>
          )}
        </div>
        <div className="cp-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " · NEW HIGH SCORE!" : ""} · {miles.toFixed(1)} miles · {splats} splats · Codes cracked <b className="c">{right}/{log.length}</b>
        </div>
        {byStd.size > 0 ? (
          <table className="cp-report">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([std, v]) => (
                <tr key={std}>
                  <td className="c">{std}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: v.c === v.n ? "var(--cp-green)" : v.c / v.n >= 0.75 ? "var(--cp-yellow)" : "var(--cp-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="cp-help">No code checkpoints reached yet. Next time, drive on to a checkpoint to see your standards here.</div>
        )}
        {practice.length > 0 && (
          <div className="cp-help" style={{ marginTop: 8 }}>
            <span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
          </div>
        )}
        <div className="cp-row">
          <button className="cp-cta ghost" onClick={onMenu}>Title screen</button>
          <button className="cp-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

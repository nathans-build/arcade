import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipAudio } from "@/kit/audio";
import { GRADES, arcadeLink, gradeFromArcade, gradeLabel, gradeNumber, initialGrade, isEarlyReader, rememberGrade } from "@/kit/grades";
import { loadProgress, submitScore } from "@/kit/progress";
import { readAloudPref, setReadAloudPref, speak, speechSupported, stopSpeaking } from "@/kit/speak";
import type { Grade } from "@/kit/types";
import { FINGER_COLORS, FINGER_NAMES, ROWS, fingerFor, fingerHint, keyFor, keyName, shiftSideFor, type Finger, type KeyDef } from "@/comets/keyboard";
import { FREE_ID, LESSONS, roundItems } from "@/comets/lessons";
import { Renderer } from "@/comets/render";
import { CometSim, H, W, multiplier, type Comet } from "@/comets/sim";
import {
  PASS_ACCURACY, accuracy as accuracyOf, applyResult, bestKey, isUnlocked, loadSave, makeResult, paceFor, practiceDefault,
  shieldFor, standardsFor, wpm as wpmOf, writeSave, type RoundResult, type Saved,
} from "@/comets/stats";
import { BAND_LABEL, bandOf } from "@/comets/words";
import "@/comets/comets.css";

const GAME_ID = "key-comets";

/** Key Comets' own 16-step bassline: a bouncy space-age riff (Hz, 0 = rest). */
const BASS = [131, 0, 196, 0, 175, 0, 196, 165, 131, 0, 196, 0, 233, 0, 220, 196];

type Screen = "title" | "playing" | "over";

interface Hud {
  score: number;
  combo: number;
  shield: number;
  shieldMax: number;
  zapped: number;
  total: number;
  wpm: number;
  accuracy: number;
}

const EMPTY_HUD: Hud = { score: 0, combo: 0, shield: 5, shieldMax: 5, zapped: 0, total: 0, wpm: 0, accuracy: 100 };

function lessonName(id: string): string {
  return id === FREE_ID ? "Free play" : LESSONS.find((l) => l.id === id)?.name ?? id;
}

/** Touch-first device (phone/tablet without a mouse): likely no physical keyboard. */
function touchFirst(): boolean {
  try {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    __kc?: () => { sim: CometSim | null; screen: Screen; paused: boolean; save: Saved; result: RoundResult | null; tap: boolean };
  }
}

export default function KeyComets() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 132), []);
  const simRef = useRef<CometSim | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [save, setSave] = useState<Saved>(() => loadSave());
  const [lessonId, setLessonId] = useState<string>(() => {
    const s = loadSave();
    return isUnlocked(s.lastLesson, s.passed) ? s.lastLesson : LESSONS[0].id;
  });
  const [practice, setPractice] = useState(() => practiceDefault(initialGrade("3")));
  const [screen, setScreen] = useState<Screen>("title");
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [next, setNext] = useState<string | null>(null);
  const [tip, setTip] = useState("");
  const [result, setResult] = useState<RoundResult | null>(null);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch] = useState(touchFirst);
  const [hasKeys, setHasKeys] = useState(() => !touchFirst());
  const [tap, setTap] = useState(touchFirst);
  const [shiftLatch, setShiftLatch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const screenRef = useRef(screen);
  screenRef.current = screen;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const saveRef = useRef(save);
  saveRef.current = save;
  const resultRef = useRef(result);
  resultRef.current = result;
  const tapRef = useRef(tap);
  tapRef.current = tap;
  const roundRef = useRef({ lessonId, grade });
  const lastTarget = useRef<number | null>(null);
  const overAt = useRef(0);
  /** The results screen's main button (Enter presses it). */
  const primaryRef = useRef<(() => void) | null>(null);

  const early = isEarlyReader(grade);
  const showKeyboard = save.keyboard || tap;

  // Debug hook for the automated playtest (?debug).
  useEffect(() => {
    if (!/[?&]debug\b/.test(window.location.search)) return;
    window.__kc = () => ({
      sim: simRef.current, screen: screenRef.current, paused: pausedRef.current, save: saveRef.current, result: resultRef.current, tap: tapRef.current,
    });
  }, []);

  // Fit the 16:10 screen into the height left over after the HUD, tip line and keyboard.
  const cabinetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cab = cabinetRef.current;
    if (!cab || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      let used = 0;
      for (const el of Array.from(cab.children) as HTMLElement[]) {
        if (el === stageRef.current || el.classList.contains("kc-overlay")) continue;
        used += el.offsetHeight;
      }
      const avail = cab.clientHeight - used - 6;
      setScreenWidth(Math.max(200, Math.floor(Math.min(cab.clientWidth, avail * 1.6))));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(cab);
    for (const el of Array.from(cab.children)) ro.observe(el);
    const mo = new MutationObserver(() => {
      for (const el of Array.from(cab.children)) ro.observe(el);
      fit();
    });
    mo.observe(cab, { childList: true });
    fit();
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const updateSave = useCallback((s: Saved) => {
    setSave(s);
    writeSave(s);
  }, []);

  const chooseGrade = (g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setPractice(practiceDefault(g));
    setReadAloud(readAloudPref(isEarlyReader(g)));
  };

  const finishRound = useCallback(
    (sim: CometSim) => {
      if (screenRef.current !== "playing") return;
      screenRef.current = "over";
      overAt.current = performance.now();
      const { lessonId: lid, grade: g } = roundRef.current;
      const r = makeResult(lid, g, sim.stats, sim);
      setHud({
        score: sim.score, combo: sim.combo, shield: sim.shield, shieldMax: sim.shieldMax, zapped: sim.zapped, total: sim.total,
        wpm: r.wpm, accuracy: r.accuracy,
      });
      const applied = applyResult(saveRef.current, r, sim.stats.missed);
      applied.save.lastLesson = applied.unlocked ?? lid;
      updateSave(applied.save);
      setHighScore(submitScore(GAME_ID, sim.score));
      setResult(r);
      setUnlocked(applied.unlocked);
      setNewBest(applied.newBest);
      audio.stopMusic();
      if (r.passed) audio.levelUp();
      else if (!r.completed) audio.gameOver();
      else audio.checkpoint();
      if (applied.unlocked) setLessonId(applied.unlocked);
      setScreen("over");
      setPaused(false);
    },
    [audio, updateSave],
  );

  const startRound = useCallback(
    (lid: string = lessonId) => {
      audio.unlock();
      stopSpeaking();
      const items = roundItems(lid, grade, Math.random);
      const sim = new CometSim({
        items, paceWpm: paceFor(grade, lid), practice: practice || tap, shieldMax: shieldFor(grade),
      });
      simRef.current = sim;
      roundRef.current = { lessonId: lid, grade };
      lastTarget.current = null;
      setLessonId(lid);
      setResult(null);
      setUnlocked(null);
      setTip(practice || tap ? "Practice mode: comets wait for you. Take your time!" : "Type the word on a comet to zap it. Esc pauses.");
      setHud({ ...EMPTY_HUD, shield: sim.shield, shieldMax: sim.shieldMax, total: sim.total });
      setNext(null);
      setShiftLatch(false);
      setPaused(false);
      setScreen("playing");
      updateSave({ ...saveRef.current, lastLesson: lid });
      audio.startMusic();
    },
    [audio, grade, lessonId, practice, tap, updateSave],
  );

  const togglePause = useCallback(
    (force?: boolean) => {
      if (screenRef.current !== "playing") return;
      const p = force ?? !pausedRef.current;
      setPaused(p);
      if (p) {
        audio.stopMusic();
        stopSpeaking();
      } else audio.startMusic();
    },
    [audio],
  );

  const quitToTitle = () => {
    audio.stopMusic();
    simRef.current = null;
    setPaused(false);
    setScreen("title");
  };

  /** Type one character into the round (keyboard or tap). */
  const typeChar = useCallback(
    (ch: string) => {
      const sim = simRef.current;
      if (!sim || screenRef.current !== "playing" || pausedRef.current) return;
      sim.type(ch);
    },
    [],
  );

  // Main loop: step the sim, play its events, draw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;
    try {
      void document.fonts?.load('16px "Press Start 2P"');
      void document.fonts?.load('24px "VT323"');
    } catch {
      // fonts API missing: canvas falls back to monospace
    }
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;
    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const sim = simRef.current;
      const playing = screenRef.current === "playing";
      if (sim && playing && !pausedRef.current) {
        sim.step(dt);
        for (const ev of sim.drainEvents()) handleEvent(ev, sim, renderer);
        // Glowing key + read-aloud when the target comet changes.
        const t = sim.target();
        const nk = sim.nextKey();
        setNext((old) => (old === nk ? old : nk));
        if (t && t.id !== lastTarget.current && !sim.buffer) {
          lastTarget.current = t.id;
          if (readAloudRef.current) sayComet(t, roundRef.current.grade);
        }
        if (now - hudAt > 100) {
          hudAt = now;
          setHud({
            score: sim.score, combo: sim.combo, shield: sim.shield, shieldMax: sim.shieldMax, zapped: sim.zapped, total: sim.total,
            wpm: wpmOf(sim.stats.chars, sim.stats.activeMs), accuracy: accuracyOf(sim.stats.correct, sim.stats.keystrokes),
          });
        }
        if (sim.phase === "over") finishRound(sim);
      }
      renderer.big = isEarlyReader(roundRef.current.grade);
      renderer.update(dt);
      renderer.draw(playing ? sim : null, now);
      raf = requestAnimationFrame(frame);
    };
    const handleEvent = (ev: ReturnType<CometSim["drainEvents"]>[number], sim: CometSim, r: Renderer) => {
      switch (ev.type) {
        case "key":
          audio.tone(660 + sim.buffer.length * 30, 0.03, "square", 0.12);
          break;
        case "zap":
          r.zap(ev.comet, ev.points);
          audio.shoot();
          audio.noise(0.18, 0.25);
          if (ev.comet.by) setTip(`"${ev.comet.text}" (${ev.comet.by})`);
          else if (ev.combo > 0 && ev.combo % 5 === 0) {
            audio.checkpoint();
            setTip(`${ev.combo} in a row! Combo x${multiplier(ev.combo + 1)}`);
          }
          break;
        case "miss": {
          const t = sim.target();
          if (t) r.oops(t.x, t.y - 20);
          audio.tone(150, 0.12, "square", 0.18, 110);
          if (ev.expected) setTip(`Oops! Look for ${keyName(ev.expected)}. ${fingerHint(ev.expected)}`);
          break;
        }
        case "hit":
          r.dent(ev.comet);
          audio.crash();
          setTip(ev.shield > 0 ? `A comet dented the shield! ${ev.shield} left.` : "The shield is down!");
          break;
        default:
          break;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [audio, finishRound]);

  // Keyboard: every letter key is game input while playing. Esc pauses.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 || e.key === "Escape") setHasKeys(true);
      if (screenRef.current === "over") {
        // Keys typed just as the round ends shouldn't skip the results.
        if (e.key === "Enter" && !e.repeat && performance.now() - overAt.current > 1000 && primaryRef.current) {
          e.preventDefault();
          primaryRef.current();
        } else if (e.key === " " || e.key === "Enter") e.preventDefault();
        return;
      }
      if (screenRef.current !== "playing") return;
      if (e.key === "Escape") {
        e.preventDefault();
        togglePause();
        return;
      }
      if (pausedRef.current) return;
      if (e.key === "Backspace" || e.key === "Tab") {
        e.preventDefault();
        return;
      }
      if (e.key.length !== 1) return;
      e.preventDefault();
      if (e.repeat) return;
      audio.unlock();
      typeChar(e.key);
    };
    const blur = () => {
      if (screenRef.current === "playing" && !pausedRef.current) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [audio, togglePause, typeChar]);

  // Read-aloud on the title is quiet; stop speech when leaving.
  useEffect(() => () => stopSpeaking(), []);

  const toggleReadAloud = () => {
    const on = !readAloud;
    setReadAloud(on);
    setReadAloudPref(on);
    if (on) speak("Read aloud is on.");
  };

  const toggleKeyboard = () => updateSave({ ...save, keyboard: !save.keyboard });

  /** Tap mode: tap a key on the on-screen keyboard. */
  const onTapKey = (key: KeyDef) => {
    if (!tap || screen !== "playing" || paused) return;
    audio.unlock();
    if (key.kind === "shiftL" || key.kind === "shiftR") {
      setShiftLatch((s) => !s);
      return;
    }
    const ch = shiftLatch && key.shift ? key.shift : key.base;
    setShiftLatch(false);
    typeChar(ch);
  };

  const hintFinger: Finger | null = next ? fingerFor(next) : null;
  const shiftSide = next ? shiftSideFor(next) : null;
  const playing = screen === "playing";

  return (
    <div className={`kc-root ${early ? "early" : ""}`}>
      <div className="kc-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="kc-tools">
          {playing && (
            <button onClick={() => togglePause()} aria-label={paused ? "Resume" : "Pause (Esc)"}>
              {paused ? "RESUME" : "PAUSE (ESC)"}
            </button>
          )}
          <button onClick={() => setMuted(audio.toggleMute())} aria-pressed={!muted}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>{readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}</button>
          )}
          {!tap && (
            <button onClick={toggleKeyboard} aria-pressed={save.keyboard} className="kc-kbtoggle">
              {save.keyboard ? "KEYBOARD ON" : "KEYBOARD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="kc-cabinet" ref={cabinetRef}>
        <div className="kc-hud kc-pixel" aria-live="off">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div className="hide-sm"><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Combo</span><span className="val y">x{multiplier(hud.combo)}</span></div>
          <div>
            <span className="lbl">{practice || tap ? "Practice" : "Shield"}</span>
            {practice || tap ? (
              <span className="val g">∞</span>
            ) : (
              <span className={`kc-shield ${hud.shield / hud.shieldMax <= 0.34 ? "low" : ""}`} aria-label={`Shield ${hud.shield} of ${hud.shieldMax}`}>
                {Array.from({ length: hud.shieldMax }, (_, i) => <i key={i} className={i < hud.shield ? "on" : ""} />)}
              </span>
            )}
          </div>
          <div><span className="lbl">WPM</span><span className="val c">{hud.wpm}</span></div>
          <div><span className="lbl">Acc</span><span className="val">{hud.accuracy}%</span></div>
          <div className="hide-sm"><span className="lbl">Comets</span><span className="val">{hud.zapped}/{hud.total}</span></div>
        </div>

        <div className="kc-stage" ref={stageRef}>
          <div className="kc-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} width={W} height={H} aria-label="Key Comets game screen" />
            {playing && paused && (
              <div className="kc-pause">
                <div className="kc-title small kc-pixel">PAUSED</div>
                <div className="kc-row center">
                  <button className="kc-cta" autoFocus onClick={() => togglePause(false)}>Resume ▶</button>
                  <button className="kc-cta ghost" onClick={quitToTitle}>Quit to title</button>
                </div>
                <div className="kc-help center dim">Esc also resumes. Your fingers can rest on the home row.</div>
              </div>
            )}
          </div>
        </div>

        {playing && (
          <div className="kc-tip" aria-live="polite">
            <span className="kc-lesson kc-pixel">{lessonName(lessonId).toUpperCase()}</span>
            <span>{tip}</span>
          </div>
        )}

        {showKeyboard && (
          <div className={`kc-kbwrap ${playing ? "" : "idle"}`}>
            <div className="kc-hint">
              {playing && next ? (
                <>
                  <Hands active={hintFinger} shiftFinger={shiftSide === "shiftL" ? "lp" : shiftSide === "shiftR" ? "rp" : null} />
                  <span className="txt">{fingerHint(next)}</span>
                </>
              ) : (
                <span className="txt dim">Rest your fingers on the home row: A S D F and J K L ;. Feel the bumps on F and J!</span>
              )}
            </div>
            <Keyboard next={playing && !paused ? next : null} shiftSide={shiftSide} tap={tap && playing} shiftLatch={shiftLatch} onTap={onTapKey} />
          </div>
        )}

        {screen === "title" && (
          <TitleScreen
            grade={grade}
            onGrade={chooseGrade}
            save={save}
            lessonId={lessonId}
            onLesson={setLessonId}
            practice={practice}
            onPractice={setPractice}
            onStart={() => startRound(lessonId)}
            touch={touch}
            hasKeys={hasKeys}
            tap={tap}
            onTap={setTap}
            highScore={highScore}
          />
        )}

        {screen === "over" && result && (
          <Results
            result={result}
            unlocked={unlocked}
            newBest={newBest}
            save={save}
            practice={roundRefPractice(simRef.current)}
            onAgain={() => startRound(result.lessonId)}
            onNext={unlocked ? () => startRound(unlocked) : null}
            primaryRef={primaryRef}
            onMenu={() => setScreen("title")}
          />
        )}
      </div>
    </div>
  );
}

function roundRefPractice(sim: CometSim | null): boolean {
  return !!sim?.practice;
}

/** Read the comet aloud: the key name for single keys, the word or sentence otherwise. */
function sayComet(c: Comet, g: Grade) {
  if (c.kind === "letter") speak(keyName(c.text));
  else if (c.kind === "word") speak(c.text.replace(/\//g, " or "));
  else if (gradeNumber(g) <= 5) speak(c.text);
}

/** Two pixel hands; the finger to use glows. */
function Hands({ active, shiftFinger }: { active: Finger | null; shiftFinger: Finger | null }) {
  const left: Finger[] = ["lp", "lr", "lm", "li", "th"];
  const right: Finger[] = ["th", "ri", "rm", "rr", "rp"];
  const heights: Record<string, number> = { lp: 12, lr: 16, lm: 18, li: 16, ri: 16, rm: 18, rr: 16, rp: 12, th: 9 };
  const hand = (fingers: Finger[], side: string) => (
    <span className={`kc-hand ${side}`}>
      {fingers.map((f, i) => (
        <i
          key={i}
          className={`${f === "th" ? "thumb" : ""} ${active === f || shiftFinger === f ? "on" : ""}`}
          style={{ height: heights[f], background: active === f || shiftFinger === f ? FINGER_COLORS[f] : undefined, borderColor: FINGER_COLORS[f] }}
          title={FINGER_NAMES[f]}
        />
      ))}
    </span>
  );
  return (
    <span className="kc-hands" aria-hidden="true">
      {hand(left, "l")}
      {hand(right, "r")}
    </span>
  );
}

function Keyboard({
  next, shiftSide, tap, shiftLatch, onTap,
}: { next: string | null; shiftSide: "shiftL" | "shiftR" | null; tap: boolean; shiftLatch: boolean; onTap: (k: KeyDef) => void }) {
  const info = next ? keyFor(next) : null;
  return (
    <div className={`kc-keyboard ${tap ? "tap" : ""}`} role={tap ? "group" : "img"} aria-label={tap ? "On-screen keyboard: tap the glowing key" : "Keyboard with finger colors"}>
      {ROWS.map((row, ri) => (
        <div className={`kc-krow r${ri}`} key={ri}>
          {row.map((key, ki) => {
            const isShift = key.kind === "shiftL" || key.kind === "shiftR";
            const glow = isShift ? shiftSide === key.kind : info?.key === key;
            const label = isShift ? "⇧" : key.kind === "space" ? "space" : key.base.toUpperCase();
            const cls = `kc-key ${glow ? "glow" : ""} ${key.bump ? "bump" : ""} ${isShift && shiftLatch ? "latched" : ""} ${key.kind ?? ""}`;
            const style = { flexGrow: key.w ?? 1, borderBottomColor: FINGER_COLORS[key.finger], ["--fc" as string]: FINGER_COLORS[key.finger] };
            const aria = isShift ? "Shift" : key.kind === "space" ? "Space" : keyName(key.base);
            return tap ? (
              <button
                key={ki}
                type="button"
                className={cls}
                style={style}
                aria-label={aria}
                data-key={isShift ? key.kind : key.base}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onTap(key);
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {key.shift && /[^A-Z]/.test(key.shift) && <small>{key.shift}</small>}
                {label}
              </button>
            ) : (
              <span key={ki} className={cls} style={style} data-key={isShift ? key.kind : key.base}>
                {key.shift && /[^A-Z]/.test(key.shift) && <small>{key.shift}</small>}
                {label}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HowToPlay({ early }: { early: boolean }) {
  return (
    <div className="kc-help">
      <ul>
        <li>Comets are falling toward your <span className="c">space station</span>! Each one carries {early ? "a letter" : "a letter, word or sentence"}.</li>
        <li><b>Type it</b> to lock on (the letters you typed turn <span className="g">green</span>), finish it and your laser zaps it into sparkles.</li>
        <li>A comet that reaches the station dents your <span className="c">shield</span>. If the shield runs out, the round ends, and you can try again! In <span className="g">Practice</span> the comets wait for you and you can't lose.</li>
        <li>Zap comets in a row with no mistakes for a <span className="y">combo</span> (x2, x3 … x5 points).</li>
        <li>The <span className="y">glowing key</span> on the keyboard is the next one to press, and its color shows which finger to use. Keep your fingers on the home row (feel the bumps on F and J).</li>
        <li>Pass a lesson (90% accuracy, zap at least 8 of 10 comets) to unlock the next one. <kbd>Esc</kbd> pauses. All letter keys are for typing, so use the buttons for sound.</li>
      </ul>
    </div>
  );
}

function TitleScreen({
  grade, onGrade, save, lessonId, onLesson, practice, onPractice, onStart, touch, hasKeys, tap, onTap, highScore,
}: {
  grade: Grade; onGrade: (g: Grade) => void; save: Saved; lessonId: string; onLesson: (id: string) => void; practice: boolean;
  onPractice: (p: boolean) => void; onStart: () => void; touch: boolean; hasKeys: boolean; tap: boolean; onTap: (t: boolean) => void; highScore: number;
}) {
  const fromArcade = gradeFromArcade();
  const [help, setHelp] = useState(false);
  const band = bandOf(grade);
  const cards = [...LESSONS.map((l, i) => ({ id: l.id, n: String(i + 1), name: l.name, keys: l.newKeys })), { id: FREE_ID, n: "★", name: "Free play", keys: `${BAND_LABEL[band]} words` }];
  return (
    <div className="kc-overlay">
      <div className="kc-panel">
        <div className="kc-title kc-pixel">KEY COMETS</div>
        <div className="kc-sub kc-pixel">SPIDERBEN10'S ARCADE · TYPING · K–12 · NC STANDARDS</div>
        {touch && !hasKeys && (
          <div className="kc-note" role="note">
            <b>Key Comets works best with a keyboard.</b> No keyboard? Use <b>Tap mode</b>: tap the glowing key on the screen keyboard to learn where every letter lives.
            <label className="kc-check">
              <input type="checkbox" checked={tap} onChange={(e) => onTap(e.target.checked)} /> Tap mode
            </label>
          </div>
        )}
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
        <div className="kc-h kc-pixel">PICK A LESSON</div>
        <div className="kc-lessons" role="radiogroup" aria-label="Lesson">
          {cards.map((c) => {
            const open = isUnlocked(c.id, save.passed);
            const passed = save.passed.includes(c.id);
            const best = save.bests[bestKey(c.id, grade)];
            const prev = LESSONS[LESSONS.findIndex((l) => l.id === c.id) - 1];
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={lessonId === c.id}
                disabled={!open}
                data-lesson={c.id}
                className={`kc-lessoncard ${lessonId === c.id ? "on" : ""} ${passed ? "passed" : ""} ${c.id === FREE_ID ? "free" : ""}`}
                onClick={() => onLesson(c.id)}
                title={open ? c.name : `Pass "${prev?.name}" to unlock`}
              >
                <span className="num kc-pixel">{open ? c.n : "🔒"}</span>
                <span className="body">
                  <span className="name">{c.name}{passed ? " ✓" : ""}</span>
                  <small className="keys">{open ? c.keys : `Pass ${prev?.name} to unlock`}</small>
                  {best && <small className="best">Best {best.wpm} WPM · {best.accuracy}%</small>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="kc-row center">
          <label className="kc-check" title="Comets wait for you and the shield never breaks">
            <input type="checkbox" checked={practice || tap} disabled={tap} onChange={(e) => onPractice(e.target.checked)} /> Practice (no losing)
          </label>
          {touch && hasKeys && (
            <label className="kc-check">
              <input type="checkbox" checked={tap} onChange={(e) => onTap(e.target.checked)} /> Tap mode
            </label>
          )}
        </div>
        <div className="kc-row center">
          <button className="kc-cta big" autoFocus onClick={onStart}>
            Start: {lessonName(lessonId)} ▶
          </button>
          <button className="kc-cta ghost" onClick={() => setHelp((h) => !h)} aria-expanded={help}>How to play</button>
        </div>
        {help ? (
          <HowToPlay early={isEarlyReader(grade)} />
        ) : (
          <div className="kc-help center">Defend the space station! Type the letters and words on the falling comets to zap them with your laser.</div>
        )}
        <div className="kc-help dim center">HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function Results({
  result: r, unlocked, newBest, save, practice, onAgain, onNext, onMenu, primaryRef,
}: {
  result: RoundResult; unlocked: string | null; newBest: boolean; save: Saved; practice: boolean; onAgain: () => void; onNext: (() => void) | null; onMenu: () => void;
  primaryRef: React.MutableRefObject<(() => void) | null>;
}) {
  primaryRef.current = onNext ?? onAgain;
  const n = gradeNumber(r.grade);
  const best = save.bests[bestKey(r.lessonId, r.grade)];
  const stars = r.passed ? (r.accuracy >= 98 ? 3 : r.accuracy >= 95 ? 2 : 1) : 0;
  const headline = !r.completed ? "THE SHIELD IS DOWN!" : r.passed ? "ROUND CLEAR!" : "ROUND COMPLETE!";
  const needZap = Math.ceil(r.total * 0.8);
  return (
    <div className="kc-overlay">
      <div className="kc-panel results">
        <div className="kc-h kc-pixel big" style={{ color: r.passed ? "var(--kc-green)" : r.completed ? "var(--kc-yellow)" : "var(--kc-red)" }}>{headline}</div>
        <div className="kc-help center">
          {lessonName(r.lessonId)} · {gradeLabel(r.grade)}{practice ? " · Practice" : ""}
          {stars > 0 && <span className="kc-stars" aria-label={`${stars} stars`}> {"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>}
        </div>
        <div className="kc-stats">
          <div><span className="kc-pixel lbl">WPM</span><b className="c">{r.wpm}</b></div>
          <div><span className="kc-pixel lbl">ACCURACY</span><b className={r.accuracy >= PASS_ACCURACY ? "g" : "y"}>{r.accuracy}%</b></div>
          <div><span className="kc-pixel lbl">COMETS</span><b>{r.zapped}/{r.total}</b></div>
          <div><span className="kc-pixel lbl">SCORE</span><b className="y">{r.score}</b></div>
          {n >= 6 && <div><span className="kc-pixel lbl">GROSS WPM</span><b>{r.gross}</b></div>}
          {n >= 6 && <div><span className="kc-pixel lbl">BEST COMBO</span><b>{r.bestCombo}</b></div>}
        </div>
        {r.passed ? (
          <div className="kc-help center g kc-passmsg">
            Lesson passed!{unlocked ? <> New lesson unlocked: <b className="y">{lessonName(unlocked)}</b>.</> : r.lessonId === "sentences" ? " You finished the whole lesson path. Keyboard champion!" : ""}
          </div>
        ) : r.lessonId !== FREE_ID ? (
          <div className="kc-help center">
            To pass: {PASS_ACCURACY}% accuracy and zap {needZap} of {r.total} comets{r.completed ? "" : " before the shield runs out"}. You can do it. Slow and steady wins!
          </div>
        ) : null}
        {newBest && <div className="kc-help center y">NEW PERSONAL BEST!</div>}
        {best && <div className="kc-help center dim">Personal best: {best.wpm} WPM · {best.accuracy}% · {best.score} points</div>}
        {r.missed.length > 0 ? (
          <div className="kc-help center">
            Keys to practice: {r.missed.map((m) => (
              <span key={m.key} className="kc-missed"><kbd>{m.key === "space" ? "SPACE" : m.key.toUpperCase()}</kbd> ×{m.count}</span>
            ))}
          </div>
        ) : (
          r.zapped > 0 && <div className="kc-help center g">No missed keys. Perfect fingers!</div>
        )}
        <div className="kc-help center dim kc-standards">
          {standardsFor(r.grade, r.lessonId).map((s) => (
            <span key={s.code}><b className="c">{s.code}</b> {s.skill}</span>
          ))}
        </div>
        <div className="kc-row center">
          {onNext && <button className="kc-cta big" onClick={onNext}>Next lesson ▶ <small>(Enter)</small></button>}
          <button className={`kc-cta ${onNext ? "ghost" : "big"}`} onClick={onAgain}>Play again{onNext ? "" : <small> (Enter)</small>}</button>
          <button className="kc-cta ghost" onClick={onMenu}>Lessons</button>
        </div>
      </div>
    </div>
  );
}

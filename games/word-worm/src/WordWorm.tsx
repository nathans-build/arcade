import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
  courseName,
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
} from "@/kit";
import { MAX_SHIELD, W, H, WormEngine, type Action, type HudState } from "@/worm/engine";
import { letterMode, trayCells, type Challenge } from "@/worm/challenges";
import { ChallengeDeck } from "@/worm/deck";
import { GRADE_BLURB } from "@/words";
import "@/worm/worm.css";

const GAME_ID = "word-worm";

type Screen = "title" | "playing" | "over";

interface LogEntry {
  standard: string;
  skill: string;
  correct: boolean;
  kind: "worm" | "checkpoint";
  word?: string;
}

interface WormView {
  ch: Challenge;
  strip: string[];
  step: number;
  msg: { text: string; ok: boolean } | null;
  solved: boolean;
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  " ": "fire",
  z: "fire", Z: "fire", x: "fire", X: "fire",
};

/** Word Worm's own 16-step bassline (G major wiggle, Hz; 0 = rest). */
const BASS = [98, 0, 147, 98, 123, 0, 147, 165, 131, 0, 196, 131, 147, 165, 147, 123];

const EMPTY_HUD: HudState = { score: 0, lives: 3, shield: MAX_SHIELD, level: 1, streak: 0, danger: 0, word: 0, wordsPerLevel: 3, step: 0 };

const KIND_HINT: Record<Challenge["kind"], string> = {
  spell: "SHOOT THE PARTS IN ORDER",
  build: "BUILD THE WORD IN ORDER",
  pick: "SHOOT THE RIGHT SEGMENT",
  fix: "SHOOT THE LETTER THAT DOESN'T BELONG",
};

/** Letters are read as letters; word parts are read in lower case so speech says them as words. */
function spoken(label: string): string {
  return label.length === 1 ? label : label.toLowerCase();
}

/** What read-aloud says for a worm: its prompt, where you are, and (for early readers) the pick strip. */
function sayFor(v: WormView, early: boolean): string {
  const { ch, strip, step } = v;
  let s = ch.say;
  if (step > 0 && step < ch.steps.length && ch.showWord) s += ` Next: ${spoken(ch.steps[step])}.`;
  if (early && ch.kind !== "spell") s += " " + strip.map((l, i) => `${i + 1}: ${spoken(l)}.`).join(" ");
  return s;
}

export default function WordWorm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WormEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 138), []);
  const deckRef = useRef<QuestionDeck | null>(null);
  const wormDeckRef = useRef<ChallengeDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("2"));
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [view, setView] = useState<WormView | null>(null);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; level: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("2"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
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

  const addLog = useCallback((e: LogEntry) => setLog((l) => [...l, e]), []);

  // Create the engine once; a worm wanders behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new WormEngine(canvas, audio, {
      onHud: setHud,
      nextChallenge: () => wormDeckRef.current!.next(),
      onChallenge: (ch, strip) => {
        const v: WormView = { ch, strip, step: 0, msg: null, solved: false };
        setView(v);
        if (readAloudRef.current) speak(sayFor(v, isEarlyReader(gradeRef.current)));
      },
      onStrip: (strip) => setView((v) => (v ? { ...v, strip } : v)),
      onShot: (ch, label, correct, why) => {
        setView((v) => (v && v.ch.id === ch.id ? { ...v, step: correct ? v.step + 1 : v.step, msg: correct ? { text: `✔ ${label}!`, ok: true } : { text: why, ok: false } } : v));
        if (!readAloudRef.current) return;
        if (correct) {
          if (ch.kind === "spell" || ch.kind === "build") speak(spoken(label));
        } else speak(why);
      },
      onSolved: (ch, clean) => {
        addLog({ standard: ch.standard, skill: ch.skill, correct: clean, kind: "worm", word: ch.word });
        if (!clean) wormDeckRef.current?.retry(ch);
        setView((v) => (v && v.ch.id === ch.id ? { ...v, solved: true, step: ch.steps.length, msg: { text: ch.explain, ok: true } } : v));
        if (readAloudRef.current) speak(`${clean ? "Perfect!" : "You got it!"} ${ch.explain}`);
      },
      onLevelClear: (level) => {
        const q = deckRef.current?.draw() ?? null;
        if (!q) {
          engine.resolveCheckpoint(true);
          return;
        }
        setPicked(null);
        setCheckpoint({ q, level });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
      },
    });
    engineRef.current = engine;
    // Playtest hook: ?debug exposes the engine to automated tests.
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __ww: WormEngine }).__ww = engine;
    engine.demo(gradeRef.current);
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, addLog]);

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
    engineRef.current?.demo(g);
  }, []);

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    deckRef.current = new QuestionDeck(grade, "ela", { gameId: GAME_ID });
    wormDeckRef.current = new ChallengeDeck(grade);
    setLog([]);
    setCheckpoint(null);
    setPaused(false);
    setScreen("playing");
    engineRef.current?.newGame(grade);
  }, [audio, grade]);

  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || picked !== null) return;
      setPicked(i);
      const correct = i === checkpoint.q.answer;
      if (correct) audio.correct();
      else audio.wrong();
      recordAnswer(GAME_ID, checkpoint.q, correct);
      addLog({ standard: checkpoint.q.standard, skill: checkpoint.q.skill, correct, kind: "checkpoint" });
      if (readAloudRef.current) speak(`${correct ? "Correct!" : `Not quite. The answer is ${checkpoint.q.choices[checkpoint.q.answer]}.`} ${checkpoint.q.explanation}`);
    },
    [checkpoint, picked, audio, addLog],
  );

  const continueFromCheckpoint = useCallback(() => {
    if (!checkpoint || picked === null) return;
    stopSpeaking();
    engineRef.current?.resolveCheckpoint(picked === checkpoint.q.answer);
    setCheckpoint(null);
    setPicked(null);
  }, [checkpoint, picked]);

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
    if (checkpoint) speakQuestion(checkpoint.q.prompt, checkpoint.q.choices);
    else if (view) speak(sayFor(view, early));
  }, [checkpoint, view, early]);

  const choose = useCallback((i: number) => {
    audio.unlock();
    engineRef.current?.pick(i);
  }, [audio]);

  const lettersOnly = !!view && letterMode(view.strip);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const k = ev.key.toLowerCase();
      const plain = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
      if (checkpoint) {
        const idx = plain ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
        if (picked === null && idx >= 0) {
          ev.preventDefault();
          answerCheckpoint(idx);
        } else if (picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          continueFromCheckpoint();
        } else if (k === "r" && plain) replay();
        return;
      }
      if (plain) {
        // Picks: 1-4 always; A-D too unless the worm carries single letters (then A-D would look like answers).
        let idx = "1234".includes(k) ? Number(k) - 1 : -1;
        if (idx < 0 && !lettersOnly) idx = "abcd".indexOf(k);
        if (idx >= 0) {
          ev.preventDefault();
          if (!paused) choose(idx);
          return;
        }
        if (k === "r") {
          replay();
          return;
        }
      }
      if (k === "p" || ev.key === "Escape") {
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
  }, [screen, checkpoint, picked, paused, lettersOnly, answerCheckpoint, continueFromCheckpoint, togglePause, replay, choose, audio]);

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

  // Tap a segment on the screen: homing dart at it.
  const onScreenTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing" || checkpoint || paused) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    audio.unlock();
    engineRef.current?.tapAt(x, y);
  };

  return (
    <div className={`ww-root ${early ? "early" : ""}`}>
      <div className="ww-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="ww-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`ww-cabinet ${touch && screen === "playing" ? "touch-on" : ""}`}>
        <div className="ww-hud ww-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Lvl</span><span className="val">{hud.level}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"▰".repeat(Math.max(0, hud.lives))}</span></div>
          <div>
            <span className="lbl">Shield</span>
            <span className="val shield">
              {Array.from({ length: MAX_SHIELD }, (_, i) => (
                <span key={i} className={i < hud.shield ? "on" : "off"}>◆</span>
              ))}
            </span>
            {hud.streak > 1 && <span className="streak">×{Math.min(hud.streak, 5)}</span>}
          </div>
        </div>

        {screen === "playing" && view ? (
          <WordBanner
            view={view}
            hud={hud}
            readAloud={readAloud}
            lettersOnly={lettersOnly}
            open={!paused && !checkpoint && !view.solved}
            onChoose={choose}
            onReplay={replay}
          />
        ) : (
          <div className="ww-banner idle">
            <div className="prompt"><span className="dim">{gradeLabel(grade)} · {GRADE_BLURB[grade]}</span></div>
          </div>
        )}

        <div className="ww-stage" ref={stageRef}>
          <div className="ww-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Word Worm game screen" onPointerDown={onScreenTap} />

            {screen === "title" && <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />}

            {screen === "playing" && checkpoint && (
              <div className="ww-overlay">
                <div className="ww-panel" role="dialog" aria-label="Transmission question">
                  <div className="ww-h ww-pixel ww-blink">◆ INCOMING TRANSMISSION — AFTER LEVEL {checkpoint.level}</div>
                  <div className="ww-tagrow">
                    <span className="ww-tag ww-pixel ela">ELA</span>
                    <span className="ww-tag ww-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                    {speechSupported() && (
                      <button className="ww-speak" onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)} aria-label="Read the question aloud">
                        <SpeakerIcon />
                      </button>
                    )}
                  </div>
                  {checkpoint.q.passage && <div className="ww-passage">{checkpoint.q.passage}</div>}
                  <div className="ww-prompt">{checkpoint.q.prompt}</div>
                  <div className="ww-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                      return (
                        <button key={i} className={`ww-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <div className="ww-feedback">
                      {picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! SHIELDS FULL · +{500 * checkpoint.level}</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — THE ANSWER IS {"ABCD"[checkpoint.q.answer]} · +1 SHIELD</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="ww-cta" autoFocus onClick={continueFromCheckpoint}>Next level ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !checkpoint && (
              <div className="ww-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="ww-title ww-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="ww-cta" onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                grade={grade}
                score={hud.score}
                level={hud.level}
                highScore={highScore}
                onAgain={startGame}
                onMenu={() => {
                  engineRef.current?.demo(grade);
                  setView(null);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`ww-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="ww-pad dpad">
            <button className="ww-touch" {...touchProps("left")} aria-label="Move left">◀</button>
            <button className="ww-touch" {...touchProps("up")} aria-label="Move up">▲</button>
            <button className="ww-touch" {...touchProps("down")} aria-label="Move down">▼</button>
            <button className="ww-touch" {...touchProps("right")} aria-label="Move right">▶</button>
          </div>
          <div className="ww-pad">
            <button className="ww-touch big fire ww-pixel" {...touchProps("fire")}>FIRE</button>
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

function WordBanner({
  view, hud, readAloud, lettersOnly, open, onChoose, onReplay,
}: {
  view: WormView;
  hud: HudState;
  readAloud: boolean;
  lettersOnly: boolean;
  open: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
}) {
  const { ch, strip, msg, solved } = view;
  const cells = trayCells(ch, solved ? ch.steps.length : view.step);
  const keys = lettersOnly ? "1234" : "ABCD";
  let head = `LEVEL ${hud.level} · WORM ${hud.word}/${hud.wordsPerLevel} · ${KIND_HINT[ch.kind]}`;
  if (solved) head = `✔ SOLVED: ${ch.word}`;
  const state = solved ? "correct" : msg && !msg.ok ? "wrong" : "";
  const info = msg
    ? msg.text
    : `Aim and FIRE, or press ${lettersOnly ? "1–4" : "A–D / 1–4"} (or tap a choice or a segment) to send a homing dart.`;
  return (
    <div className={`ww-banner ${state}`}>
      <div className="head ww-pixel">
        <span>{head}</span>
        <span className="std">{ch.standard} · {ch.skill}</span>
      </div>
      <div className="prompt">
        {speechSupported() && (
          <button type="button" className={`ww-speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read it aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        <span className="ptext">{ch.prompt}</span>
        <span className="tray" aria-label="Word so far">
          {cells.map((c, i) => (
            <span key={i} className={`cell ${c.state}`}>{c.text}</span>
          ))}
        </span>
      </div>
      <div className="opts">
        {strip.map((label, i) => (
          <button
            key={`${label}-${i}`}
            type="button"
            className="opt"
            disabled={!open}
            aria-label={`Choice ${keys[i]}: ${label}`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (open) onChoose(i);
            }}
          >
            <b>{lettersOnly ? i + 1 : keys[i]}</b>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className={`info ${msg ? (msg.ok ? "ok" : "no") : "hint"}`}>{info}</div>
      <div className="danger" aria-hidden="true">
        <div className="fill" style={{ width: `${Math.round(hud.danger * 100)}%` }} />
      </div>
    </div>
  );
}

function TitleScreen({
  grade, onGrade, onStart, highScore,
}: {
  grade: Grade; onGrade: (g: Grade) => void; onStart: () => void; highScore: number;
}) {
  const course = courseName(grade, "ela");
  return (
    <div className="ww-overlay" style={{ background: "rgba(5,8,24,0.55)" }}>
      <div className="ww-panel title">
        <div className="ww-title ww-pixel">WORD WORM</div>
        <div className="ww-sub ww-pixel">SPIDERBEN10'S ARCADE · NC ELA K–12</div>
        {gradeFromArcade() ? (
          <div className="ww-sub ww-pixel ww-badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="ww-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={g === grade}
                className={`ww-grade ww-pixel ${g === grade ? "on" : ""}`}
                onClick={() => onGrade(g)}
                title={gradeLabel(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="ww-help center">
          <b className="gl">{gradeLabel(grade)}{course ? ` · ${course}` : ""}</b> — {GRADE_BLURB[grade]}
        </div>
        <div style={{ textAlign: "center", margin: "14px 0 10px" }}>
          <button className="ww-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="ww-help">
          <kbd>◀</kbd> <kbd>▶</kbd> <kbd>▲</kbd> <kbd>▼</kbd> move · <kbd>SPACE</kbd>/<kbd>Z</kbd>/<kbd>X</kbd> fire ·{" "}
          <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> homing dart · <kbd>R</kbd> read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute
          <br />
          A word worm is winding down the page! Its segments carry letters and word parts. Read the banner and shoot the{" "}
          <span className="y">right segment</span> (in order, to spell a word). Wrong segments speed the worm up and cost a shield.
          Can't line up a shot? Press a number or tap a segment to send a homing dart.
        </div>
        <div className="ww-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function MissionReport({
  log, grade, score, level, highScore, onAgain, onMenu,
}: {
  log: LogEntry[]; grade: Grade; score: number; level: number; highScore: number;
  onAgain: () => void; onMenu: () => void;
}) {
  // One row per standard + skill (several skills share a code, e.g. RF.K.4).
  const byStd = new Map<string, { std: string; skill: string; kinds: Set<string>; n: number; c: number }>();
  for (const l of log) {
    const key = `${l.standard}|${l.skill}`;
    const cur = byStd.get(key) ?? { std: l.standard, skill: l.skill, kinds: new Set<string>(), n: 0, c: 0 };
    cur.n++;
    cur.kinds.add(l.kind);
    if (l.correct) cur.c++;
    byStd.set(key, cur);
  }
  const cps = log.filter((l) => l.kind === "checkpoint");
  const worms = log.filter((l) => l.kind === "worm");
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);
  const missedWords = [...new Set(worms.filter((l) => !l.correct).map((l) => l.word!))];

  return (
    <div className="ww-overlay">
      <div className="ww-panel">
        <div className="ww-h ww-pixel" style={{ color: "var(--ww-red)" }}>THE WORMS GOT THROUGH — MISSION REPORT</div>
        <div className="ww-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached level <b className="c">{level}</b> · {gradeLabel(grade)}
        </div>
        <div className="ww-help" style={{ marginTop: 4 }}>
          Worms solved with no mistakes {worms.filter((l) => l.correct).length}/{worms.length} · Transmissions {cps.filter((l) => l.correct).length}/{cps.length}
        </div>
        {byStd.size > 0 && (
          <table className="ww-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([key, v]) => (
                <tr key={key}>
                  <td className="c">{v.std}</td>
                  <td>{v.skill}</td>
                  <td className="dim">{[...v.kinds].map((k) => (k === "worm" ? "worms" : "questions")).join(" + ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--ww-green)" : v.c / v.n >= 0.75 ? "var(--ww-yellow)" : "var(--ww-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="ww-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([, v]) => `${v.skill} (${v.std})`).join(", ")}.
          </div>
        )}
        {missedWords.length > 0 && (
          <div className="ww-help" style={{ marginTop: 6 }}>
            <span className="y">Words to review:</span> {missedWords.join(", ")}. Missed worms come back sooner next time.
          </div>
        )}
        {log.length === 0 && <div className="ww-help" style={{ marginTop: 10 }}>No worms solved yet. Try the homing darts: press 1–4 or tap a segment.</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="ww-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="ww-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

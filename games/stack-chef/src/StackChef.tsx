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
import { ChefEngine, H, W, type Action, type HudState, type StripItem } from "@/chef/engine";
import { GRADE_BLURB, SequenceDeck, spokenLabel, type SeqMode, type Sequence } from "@/seq";
import "@/chef/chef.css";

const GAME_ID = "stack-chef";
const SUBJECT_KEY = "arcade.stack-chef.subject";

type Screen = "title" | "playing" | "over";

interface LogEntry {
  standard: string;
  skill: string;
  correct: boolean;
  kind: "stack" | "checkpoint";
  title?: string;
}

interface StackView {
  seq: Sequence;
  strip: StripItem[];
  open: boolean;
  placed: string[];
  msg: { text: string; ok: boolean } | null;
  done: boolean;
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  " ": "fire",
  z: "fire", Z: "fire", x: "fire", X: "fire",
};

/** Stack Chef's own 16-step bassline (a bouncy kitchen shuffle in F, Hz; 0 = rest). */
const BASS = [87, 0, 131, 87, 110, 0, 131, 147, 117, 0, 175, 117, 131, 147, 131, 98];

const EMPTY_HUD: HudState = { score: 0, lives: 3, spice: 0, maxSpice: 5, level: 1, placed: 0, total: 0 };

const SUBJECTS: { mode: SeqMode; label: string }[] = [
  { mode: "math", label: "MATH" },
  { mode: "science", label: "SCIENCE" },
  { mode: "ela", label: "ELA" },
  { mode: "mixed", label: "MIXED" },
];
const SUBJECT_TAG: Record<string, string> = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" };

function loadSubject(): SeqMode {
  try {
    const v = localStorage.getItem(SUBJECT_KEY);
    if (v === "math" || v === "science" || v === "ela" || v === "mixed") return v;
  } catch {
    // ignore
  }
  return "mixed";
}
function saveSubject(m: SeqMode) {
  try {
    localStorage.setItem(SUBJECT_KEY, m);
  } catch {
    // ignore
  }
}

/** What read-aloud says at the start of a level: the goal, the story, and (for early readers) the slabs. */
function sayFor(v: StackView, early: boolean): string {
  const { seq } = v;
  let s = `Build the stack: ${seq.title.toLowerCase()}. The bottom is ${seq.ends[0].toLowerCase()}, the top is ${seq.ends[1].toLowerCase()}.`;
  if (seq.passage) s += ` ${seq.passage}`;
  if (early && v.strip.length) {
    s += " The slabs are: " + v.strip.map((it) => `${"ABCD"[it.slot]}: ${spokenLabel(seq, seq.steps.indexOf(it.label))}.`).join(" ");
  }
  return s;
}

export default function StackChef() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ChefEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 132), []);
  const deckRef = useRef<QuestionDeck | null>(null);
  const seqDeckRef = useRef<SequenceDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [subject, setSubject] = useState<SeqMode>(loadSubject);
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [view, setView] = useState<StackView | null>(null);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; level: number } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
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

  // Create the engine once; critters chase the chef behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new ChefEngine(canvas, audio, {
      onHud: setHud,
      nextSequence: () => seqDeckRef.current!.next(),
      onSequence: (seq) => {
        const v: StackView = { seq, strip: engine.strip, open: engine.canPick(), placed: [], msg: null, done: false };
        setView(v);
        if (readAloudRef.current) speak(sayFor(v, isEarlyReader(gradeRef.current)));
      },
      onStrip: (strip, open) => setView((v) => (v ? { ...v, strip, open } : v)),
      onDelivered: (seq, label, correct, why) => {
        setView((v) =>
          v && v.seq.id === seq.id
            ? { ...v, placed: correct ? [...v.placed, label] : v.placed, msg: correct ? { text: `✔ ${label} is on the stack!`, ok: true } : { text: `✘ ${why}`, ok: false } }
            : v,
        );
        if (!readAloudRef.current) return;
        const i = seq.steps.indexOf(label);
        if (correct) speak(`${spokenLabel(seq, i)}. Yes!`);
        else speak(why);
      },
      onStackDone: (seq, clean) => {
        addLog({ standard: seq.standard, skill: seq.skill, correct: clean, kind: "stack", title: seq.title });
        if (!clean) seqDeckRef.current?.retry(seq);
        setView((v) => (v && v.seq.id === seq.id ? { ...v, done: true, placed: [...seq.steps], msg: { text: seq.explain, ok: true } } : v));
        if (readAloudRef.current) speak(`${clean ? "Order up! Perfect!" : "Order up!"} ${seq.explain}`);
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
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __sc: ChefEngine }).__sc = engine;
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

  const chooseSubject = useCallback((m: SeqMode) => {
    setSubject(m);
    saveSubject(m);
  }, []);

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    deckRef.current = new QuestionDeck(grade, subject, { gameId: GAME_ID });
    seqDeckRef.current = new SequenceDeck(grade, subject);
    setLog([]);
    setCheckpoint(null);
    setPaused(false);
    setScreen("playing");
    engineRef.current?.newGame(grade);
  }, [audio, grade, subject]);

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
    else if (view) speak(sayFor(view, true));
  }, [checkpoint, view]);

  const choose = useCallback((i: number) => {
    audio.unlock();
    engineRef.current?.pick(i);
  }, [audio]);

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
        // Picks: 1-4 and A-D (A-D are never movement keys here: moving is the arrow keys).
        const idx = "1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k);
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
        audio.unlock();
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
  }, [screen, checkpoint, picked, paused, answerCheckpoint, continueFromCheckpoint, togglePause, replay, choose, audio]);

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

  // Tap a slab on the screen: it drops straight to the plate.
  const onScreenTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing" || checkpoint || paused) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    audio.unlock();
    engineRef.current?.tapAt(x, y);
  };

  const qSubject = checkpoint?.q.subject ?? "math";

  return (
    <div className={`sc-root ${early ? "early" : ""}`}>
      <div className="sc-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="sc-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`sc-cabinet ${touch && screen === "playing" ? "touch-on" : ""}`}>
        <div className="sc-hud sc-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Lvl</span><span className="val">{hud.level}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, hud.lives))}</span></div>
          <div>
            <span className="lbl">Spice</span>
            <span className="val spice">{hud.spice}</span>
          </div>
        </div>

        {screen === "playing" && view ? (
          <StackBanner view={view} hud={hud} readAloud={readAloud} open={!paused && !checkpoint && !view.done && view.open} onChoose={choose} onReplay={replay} />
        ) : (
          <div className="sc-banner idle">
            <div className="prompt"><span className="dim">{gradeLabel(grade)} · {GRADE_BLURB[grade]}</span></div>
          </div>
        )}

        <div className="sc-stage" ref={stageRef}>
          <div className="sc-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Stack Chef game screen" onPointerDown={onScreenTap} />

            {screen === "title" && (
              <TitleScreen grade={grade} subject={subject} onGrade={chooseGrade} onSubject={chooseSubject} onStart={startGame} highScore={highScore} />
            )}

            {screen === "playing" && checkpoint && (
              <div className="sc-overlay">
                <div className="sc-panel" role="dialog" aria-label="Transmission question">
                  <div className="sc-h sc-pixel sc-blink">◆ INCOMING TRANSMISSION — AFTER LEVEL {checkpoint.level}</div>
                  <div className="sc-tagrow">
                    <span className={`sc-tag sc-pixel ${qSubject}`}>{SUBJECT_TAG[qSubject]}</span>
                    <span className="sc-tag sc-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                    {speechSupported() && (
                      <button className="sc-speak" onClick={() => speakQuestion(checkpoint.q.prompt, checkpoint.q.choices)} aria-label="Read the question aloud">
                        <SpeakerIcon />
                      </button>
                    )}
                  </div>
                  {checkpoint.q.passage && <div className="sc-passage">{checkpoint.q.passage}</div>}
                  <div className="sc-prompt">{checkpoint.q.prompt}</div>
                  <div className="sc-choices">
                    {checkpoint.q.choices.map((c, i) => {
                      const state = picked === null ? "" : i === checkpoint.q.answer ? "right" : i === picked ? "wrong" : "";
                      return (
                        <button key={i} className={`sc-btn ${state}`} disabled={picked !== null} onClick={() => answerCheckpoint(i)}>
                          <span className="key">{"ABCD"[i]}</span>
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && (
                    <div className="sc-feedback">
                      {picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! +2 SPICE · +{500 * checkpoint.level}</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — THE ANSWER IS {"ABCD"[checkpoint.q.answer]}</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="sc-cta" autoFocus onClick={continueFromCheckpoint}>Next level ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !checkpoint && (
              <div className="sc-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="sc-title sc-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="sc-cta" onClick={() => togglePause(false)}>Resume</button>
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

        <div className={`sc-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="sc-pad dpad">
            <button className="sc-touch" {...touchProps("left")} aria-label="Move left">◀</button>
            <button className="sc-touch" {...touchProps("up")} aria-label="Climb up">▲</button>
            <button className="sc-touch" {...touchProps("down")} aria-label="Climb down">▼</button>
            <button className="sc-touch" {...touchProps("right")} aria-label="Move right">▶</button>
          </div>
          <div className="sc-pad">
            <button className="sc-touch big fire sc-pixel" {...touchProps("fire")}>SPICE</button>
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

function StackBanner({
  view, hud, readAloud, open, onChoose, onReplay,
}: {
  view: StackView;
  hud: HudState;
  readAloud: boolean;
  open: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
}) {
  const { seq, strip, msg, done, placed } = view;
  const head = done ? `✔ ORDER UP: ${seq.title}` : `LEVEL ${hud.level} · STACK ${placed.length}/${seq.steps.length} · BOTTOM = ${seq.ends[0]}`;
  const state = done ? "correct" : msg && !msg.ok ? "wrong" : "";
  const info = msg ? msg.text : "Walk across a slab to drop it, or press A–D / 1–4 (or tap a slab) to send it to the plate. Build from the bottom up!";
  return (
    <div className={`sc-banner ${state}`}>
      <div className="head sc-pixel">
        <span>{head}</span>
        <span className="std">{seq.standard} · {seq.skill}</span>
      </div>
      <div className="prompt">
        {speechSupported() && (
          <button type="button" className={`sc-speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read it aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        <span className="ptext">
          Stack: <b className="y">{seq.title}</b> <span className="dim">· bottom = {seq.ends[0].toLowerCase()}, top = {seq.ends[1].toLowerCase()}</span>
        </span>
        <span className="tray" aria-label="Stack so far, bottom first">
          {seq.steps.map((_, i) => (
            <span key={i} className={`cell ${i < placed.length ? "done" : i === placed.length && !done ? "next" : ""}`}>{i < placed.length ? placed[i] : "?"}</span>
          ))}
        </span>
      </div>
      {seq.passage && <div className="story">{seq.passage}</div>}
      <div className="opts">
        {strip.map((it) => (
          <button
            key={it.slabId}
            type="button"
            className="opt"
            disabled={!open}
            aria-label={`Drop ${"ABCD"[it.slot]}: ${it.label}`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (open) onChoose(it.slot);
            }}
          >
            <b>{"ABCD"[it.slot]}</b>
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      <div className={`info ${msg ? (msg.ok ? "ok" : "no") : "hint"}`}>{info}</div>
    </div>
  );
}

function TitleScreen({
  grade, subject, onGrade, onSubject, onStart, highScore,
}: {
  grade: Grade; subject: SeqMode; onGrade: (g: Grade) => void; onSubject: (m: SeqMode) => void; onStart: () => void; highScore: number;
}) {
  const course = subject === "mixed" ? null : courseName(grade, subject);
  return (
    <div className="sc-overlay" style={{ background: "rgba(5,8,24,0.55)" }}>
      <div className="sc-panel title">
        <div className="sc-title sc-pixel">STACK CHEF</div>
        <div className="sc-sub sc-pixel">SPIDERBEN10'S ARCADE · SEQUENCES K–12</div>
        {gradeFromArcade() ? (
          <div className="sc-sub sc-pixel sc-badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="sc-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`sc-grade sc-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="sc-subjects" role="radiogroup" aria-label="Subject">
          {SUBJECTS.map((s) => (
            <button key={s.mode} role="radio" aria-checked={s.mode === subject} className={`sc-subject sc-pixel ${s.mode === subject ? "on" : ""}`} onClick={() => onSubject(s.mode)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="sc-help center">
          <b className="gl">{gradeLabel(grade)}{course ? ` · ${course}` : ""}</b> — {GRADE_BLURB[grade]}
        </div>
        <div style={{ textAlign: "center", margin: "14px 0 10px" }}>
          <button className="sc-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="sc-help">
          <kbd>◀</kbd> <kbd>▶</kbd> walk · <kbd>▲</kbd> <kbd>▼</kbd> climb · <kbd>SPACE</kbd>/<kbd>Z</kbd>/<kbd>X</kbd> spice ·{" "}
          <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> drop a slab · <kbd>R</kbd> read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute
          <br />
          Every level is an order to build: a life cycle, a story, the steps to solve an equation… Walk across a labelled
          slab to knock it down a girder; slabs that reach the counter slide onto the plate. Stack them <span className="y">in order,
          bottom first</span>. The wrong slab bounces back up. Squash the food critters with falling slabs, or stun them with spice.
          In a hurry? Press a letter or tap a slab and it drops straight to the plate.
        </div>
        <div className="sc-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
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
  const stacks = log.filter((l) => l.kind === "stack");
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);
  const review = [...new Set(stacks.filter((l) => !l.correct).map((l) => l.title!))];

  return (
    <div className="sc-overlay">
      <div className="sc-panel">
        <div className="sc-h sc-pixel" style={{ color: "var(--sc-red)" }}>KITCHEN CLOSED — MISSION REPORT</div>
        <div className="sc-help big">
          Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached level <b className="c">{level}</b> · {gradeLabel(grade)}
        </div>
        <div className="sc-help" style={{ marginTop: 4 }}>
          Stacks built with no bounces {stacks.filter((l) => l.correct).length}/{stacks.length} · Transmissions {cps.filter((l) => l.correct).length}/{cps.length}
        </div>
        {byStd.size > 0 && (
          <table className="sc-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([key, v]) => (
                <tr key={key}>
                  <td className="c">{v.std}</td>
                  <td>{v.skill}</td>
                  <td className="dim">{[...v.kinds].map((k) => (k === "stack" ? "stacks" : "questions")).join(" + ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--sc-green)" : v.c / v.n >= 0.75 ? "var(--sc-yellow)" : "var(--sc-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="sc-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([, v]) => `${v.skill} (${v.std})`).join(", ")}.
          </div>
        )}
        {review.length > 0 && (
          <div className="sc-help" style={{ marginTop: 6 }}>
            <span className="y">Orders to review:</span> {review.join(", ")}. Stacks with bounces come back two levels later.
          </div>
        )}
        {log.length === 0 && <div className="sc-help" style={{ marginTop: 10 }}>No stacks built yet. Try pressing A–D (or tapping a slab) to drop slabs straight onto the plate.</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="sc-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="sc-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

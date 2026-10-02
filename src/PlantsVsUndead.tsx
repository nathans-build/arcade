import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
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
import { bandOfGrade } from "@/data/bank";
import { PlantDeck } from "@/data/deck";
import { PARTS, RECIPE, type Band, type PlantKind } from "@/data/parts";
import { H, LEVELS, PLANTS, TRAY, UNDEAD, W, availableOn, tuningFor, type UndeadKind } from "@/pvu/defs";
import { Engine, type HudState, type Tool } from "@/pvu/engine";
import type { Stats } from "@/pvu/sim";
import { spriteURL } from "@/pvu/sprites";
import "@/pvu/pvu.css";

const GAME_ID = "plants-vs-undead";

/** Plants vs Undead's own 16-step bassline: a creepy-cute shuffle in E minor (Hz; 0 = rest). */
const BASS = [82, 0, 98, 82, 123, 0, 110, 98, 82, 0, 98, 117, 110, 0, 98, 73];

type Screen = "title" | "playing" | "over";

interface LogEntry {
  standard: string;
  skill: string;
  correct: boolean;
  kind: "card" | "checkpoint";
}

interface Asking {
  mode: "card" | "checkpoint";
  q: DealtQuestion;
  kind?: PlantKind;
  info?: { level: number; wave: number; lastOfLevel: boolean; final: boolean };
  picked: number | null;
}

const KEYS: Record<string, PlantKind> = Object.fromEntries(TRAY.map((k) => [PLANTS[k].key.toLowerCase(), k]));
const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

const EMPTY_HUD: HudState = {
  glucose: 0, score: 0, hearts: 3, maxHearts: 3, level: 1, levelName: "", wave: 1, waves: 3, phase: "prewave", countdown: 0,
  sky: 1, cold: false, store: { light: 0, water: 0, co2: 0 }, tool: null, cards: [], message: "",
};

/** Read-aloud: formulas spoken as letters and numbers. */
function sayable(t: string): string {
  const sub: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
  return t
    .replace(/C₆H₁₂O₆/g, " glucose, C 6 H 12 O 6, ")
    .replace(/(\d*)([A-Z][a-z]?)([₀-₉]+)/g, (_m, n: string, el: string, d: string) => `${n ? n + " " : ""}${el} ${[...d].map((c) => sub[c]).join("")} `)
    .replace(/→/g, " yields ")
    .replace(/⁺/g, " plus ")
    .replace(/\s+/g, " ");
}

/** Little pictures next to K–2 answer choices. */
function choiceIcon(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bleaves?\b|^green$/.test(t)) return "sunleaf";
  if (/\broots?\b/.test(t)) return "rootknot";
  if (/\bstem\b/.test(t)) return "stem";
  if (/\bflower\b|\bpollen\b|\bpetals?\b/.test(t)) return "pollen";
  if (/\bfruit\b|\bapple\b/.test(t)) return "berry";
  if (/\bseeds?\b/.test(t)) return "seedshot";
  if (/\bsun(light)?\b/.test(t)) return "sun";
  if (/\bwater\b/.test(t)) return "drop";
  if (/^air$|oxygen/.test(t)) return "o2";
  if (/^food$|to make food|a plant/.test(t)) return "glucose";
  return null;
}

const iconCache = new Map<string, string>();
function icon(name: string, scale = 3): string {
  const k = `${name}|${scale}`;
  let u = iconCache.get(k);
  if (!u) {
    u = spriteURL(name, scale);
    iconCache.set(k, u);
  }
  return u;
}

export default function PlantsVsUndead() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const deckRef = useRef<PlantDeck | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 120), []);
  const stageRef = useRef<HTMLDivElement>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  const [result, setResult] = useState<{ won: boolean; stats: Stats; level: number; wave: number; score: number } | null>(null);

  const band: Band = bandOfGrade(grade);
  const early = isEarlyReader(grade);
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const gradeRef = useRef(grade);
  gradeRef.current = grade;

  // Fit the 16:10 screen (plus the recipe line under it) into the space left under the tray.
  const tipRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const tipH = tipRef.current?.offsetHeight ?? 0;
      setScreenWidth(Math.floor(Math.max(160, Math.min(width, (height - tipH - 4) * 1.6))));
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const on = () => setTouch(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const addLog = useCallback((e: LogEntry) => setLog((l) => [...l, e]), []);

  useEffect(() => {
    const engine = new Engine(canvasRef.current!, audio, {
      onHud: setHud,
      onLearn: (kind) => {
        const q = deckRef.current!.card(kind);
        setAsking({ mode: "card", q, kind, picked: null });
        if (readAloudRef.current) speakQuestion(sayable(`New plant part: ${PARTS[kind].name}. ${q.prompt}`), q.choices.map(sayable));
      },
      onWaveClear: (info) => {
        const q = deckRef.current!.checkpoint();
        setAsking({ mode: "checkpoint", q, info, picked: null });
        engine.setModal(true);
        if (readAloudRef.current) speakQuestion(sayable(q.prompt), q.choices.map(sayable));
      },
      onLevelStart: (level) => {
        if (readAloudRef.current && level > 1) {
          const fresh = LEVELS[level - 1].unlock.map((k) => PARTS[k].name).join(" and ");
          speak(`Level ${level}. New plant parts: ${fresh}.`);
        }
      },
      onGameOver: (won) => {
        const s = engine.sim;
        setResult({ won, stats: { ...s.stats }, level: s.level, wave: s.wave, score: s.score });
        setHighScore(submitScore(GAME_ID, s.score));
        setAsking(null);
        setScreen("over");
        stopSpeaking();
        audio.stopMusic();
      },
    });
    engineRef.current = engine;
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __pvu: Engine }).__pvu = engine;
    engine.demo(bandOfGrade(initialGrade("3")));
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio]);

  const chooseGrade = useCallback((g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setReadAloud(readAloudPref(isEarlyReader(g)));
    engineRef.current?.demo(bandOfGrade(g));
  }, []);

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(grade);
    deckRef.current = new PlantDeck(grade, GAME_ID);
    setLog([]);
    setAsking(null);
    setResult(null);
    setPaused(false);
    setScreen("playing");
    engineRef.current?.newGame(bandOfGrade(grade));
    if (readAloudRef.current) speak(isEarlyReader(grade) ? "Tap the sunshine to catch it! Sunlight, water and air make food for your plants. Pick a plant card to grow a plant." : "Catch sunlight. Light, water and carbon dioxide make glucose. Spend glucose on plant parts.");
  }, [audio, grade]);

  const answer = useCallback(
    (i: number) => {
      const a = asking;
      if (!a || a.picked !== null) return;
      const correct = i === a.q.answer;
      if (correct) audio.correct();
      else audio.wrong();
      recordAnswer(GAME_ID, a.q, correct);
      addLog({ standard: a.q.standard, skill: a.q.skill, correct, kind: a.mode });
      if (readAloudRef.current) speak(sayable(`${correct ? "Correct!" : `Not quite. The answer is ${a.q.choices[a.q.answer]}.`} ${a.q.explanation}`));
      setAsking({ ...a, picked: i });
    },
    [asking, audio, addLog],
  );

  const continueAsk = useCallback(() => {
    const a = asking;
    if (!a || a.picked === null) return;
    stopSpeaking();
    const correct = a.picked === a.q.answer;
    setAsking(null);
    if (a.mode === "card" && a.kind) engineRef.current?.finishLearn(a.kind, correct);
    else engineRef.current?.resolveCheckpoint(correct);
  }, [asking]);

  const togglePause = useCallback((force?: boolean) => {
    const e = engineRef.current;
    if (!e) return;
    const p = e.togglePause(force);
    setPaused(p);
    if (p) {
      stopSpeaking();
      audio.stopMusic();
    } else audio.startMusic();
  }, [audio]);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const replay = useCallback(() => {
    if (asking) {
      if (asking.picked === null) speakQuestion(sayable(asking.q.prompt), asking.q.choices.map(sayable));
      else speak(sayable(`The answer is ${asking.q.choices[asking.q.answer]}. ${asking.q.explanation}`));
    } else speak(sayable(RECIPE[band]));
  }, [asking, band]);

  const pickTool = useCallback(
    (t: Tool) => {
      audio.unlock();
      engineRef.current?.select(t);
    },
    [audio],
  );

  // Keyboard: arrows move the cursor, Space/Enter plant, X/Delete dig, Q–P pick cards,
  // 1–4 / A–D answer questions (letters A–D are never cards or movement).
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k === "m") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const plain = ev.key.length === 1;
      if (asking) {
        const idx = plain ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
        if (asking.picked === null && idx >= 0) {
          ev.preventDefault();
          answer(idx);
        } else if (asking.picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          continueAsk();
        } else if (k === "l") replay();
        return;
      }
      if (ev.key === "Escape") {
        if (engineRef.current?.tool && !paused) pickTool(null);
        else togglePause();
        return;
      }
      if (paused) return;
      if (k === "l") {
        replay();
        return;
      }
      const card = plain ? KEYS[k] : undefined;
      if (card) {
        ev.preventDefault();
        pickTool(card);
        return;
      }
      const arrow = ARROWS[ev.key];
      if (arrow) {
        ev.preventDefault();
        engineRef.current?.moveCursor(arrow[0], arrow[1]);
        return;
      }
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        audio.unlock();
        engineRef.current?.actAtCursor();
        return;
      }
      if (k === "x" || ev.key === "Delete" || ev.key === "Backspace") {
        ev.preventDefault();
        engineRef.current?.shovelAtCursor();
      }
    };
    const blur = () => {
      if (screen === "playing" && !asking) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [screen, asking, paused, answer, continueAsk, replay, togglePause, pickTool, audio]);

  // Canvas pointer: tap motes, tap cells to plant; drag or hover sweeps up motes.
  const pressed = useRef(false);
  const toLogical = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing") return;
    audio.unlock();
    pressed.current = true;
    const p = toLogical(e);
    engineRef.current?.tapAt(p.x, p.y);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing") return;
    if (e.pointerType !== "mouse" && !pressed.current) return;
    const p = toLogical(e);
    engineRef.current?.hoverAt(p.x, p.y);
  };
  const onUp = () => {
    pressed.current = false;
  };

  const playing = screen === "playing";

  return (
    <div className={`pvu-root ${early ? "early" : ""} ${touch ? "touch" : ""}`}>
      <div className="pvu-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="pvu-tools">
          {playing && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="pvu-cabinet">
        <div className="pvu-hud pvu-pixel">
          <div><span className="lbl">Glucose</span><span className="val y">{hud.glucose}</span></div>
          <div><span className="lbl">Greenhouse</span><span className="val hearts">{"♥".repeat(Math.max(0, hud.hearts))}<span className="lost">{"♥".repeat(Math.max(0, hud.maxHearts - hud.hearts))}</span></span></div>
          <div><span className="lbl">Level</span><span className="val">{playing ? `${hud.level} · W${hud.wave}/${hud.waves}` : "-"}</span></div>
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
        </div>

        <SeedTray hud={hud} band={band} playing={playing && !paused && !asking} onPick={pickTool} />

        <div className="pvu-stage" ref={stageRef}>
          <div className="pvu-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas
              ref={canvasRef}
              aria-label="Plants vs Undead lawn"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onPointerLeave={() => {
                pressed.current = false;
                engineRef.current?.hideCursor();
              }}
              style={{ touchAction: "none" }}
            />

            {screen === "title" && <TitleScreen grade={grade} band={band} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />}

            {playing && asking && (
              <QuestionPanel asking={asking} band={band} early={early} onAnswer={answer} onContinue={continueAsk} onReplay={replay} />
            )}

            {playing && paused && !asking && (
              <div className="pvu-overlay">
                <div className="pvu-panel center">
                  <div className="pvu-title pvu-pixel">PAUSED</div>
                  <p className="pvu-help">{RECIPE[band]}</p>
                  <button className="pvu-cta" autoFocus onClick={() => togglePause(false)}>Resume</button>
                </div>
              </div>
            )}

            {screen === "over" && result && (
              <MissionReport
                result={result}
                log={log}
                grade={grade}
                band={band}
                highScore={highScore}
                onAgain={startGame}
                onMenu={() => {
                  engineRef.current?.demo(band);
                  setHud(EMPTY_HUD);
                  setScreen("title");
                }}
              />
            )}
          </div>
          <div className="pvu-tip" ref={tipRef} style={screenWidth ? { width: screenWidth } : undefined}>
            <RecipeLine band={band} hud={hud} />
            <span className="pvu-tiptext">
              {playing && hud.tool && hud.tool !== "shovel" && !asking
                ? `${PARTS[hud.tool].name} (${PARTS[hud.tool].part[band]}): ${PARTS[hud.tool].job[band]}`
                : playing && hud.tool === "shovel"
                  ? "Shovel: tap a plant to dig it up (half its glucose back)."
                  : touch
                    ? "Tap sunlight and CO₂ bubbles to catch them. Tap a card, then a square of grass to plant."
                    : "Arrows move · Space plants · Q–P pick cards · X digs up · catch sunlight by moving onto it or clicking it."}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

function RecipeLine({ band, hud }: { band: Band; hud: HudState }) {
  return (
    <span className="pvu-recipe">
      {hud.sky < 0.7 && <span className="warn">DIM LIGHT: less photosynthesis! · </span>}
      {hud.cold && <span className="cold">COLD slows photosynthesis! · </span>}
      <img src={icon("sun", 2)} alt="" /> <img src={icon("drop", 2)} alt="" /> <img src={icon("co2", 2)} alt="" /> → <img src={icon("glucose", 2)} alt="" /> <img src={icon("o2", 2)} alt="" />{" "}
      <b>{RECIPE[band]}</b>
    </span>
  );
}

function SeedTray({ hud, band, playing, onPick }: { hud: HudState; band: Band; playing: boolean; onPick: (t: Tool) => void }) {
  const cards = hud.cards.length ? hud.cards : TRAY.map((kind) => ({ kind, price: PLANTS[kind].cost, cost: PLANTS[kind].cost, available: availableOn(1).includes(kind), learned: false, discount: false, recharge: 0, affordable: true }));
  return (
    <div className="pvu-tray" role="toolbar" aria-label="Seed cards">
      {cards.map((c) => {
        const lvl = LEVELS.findIndex((l) => l.unlock.includes(c.kind)) + 1;
        const sel = hud.tool === c.kind;
        const state = !c.available ? "later" : !c.learned ? "new" : c.recharge > 0 ? "charging" : !c.affordable ? "poor" : "ready";
        return (
          <button
            key={c.kind}
            className={`pvu-card ${state} ${sel ? "sel" : ""}`}
            disabled={!playing || !c.available}
            onPointerDown={(e) => {
              e.preventDefault();
              if (playing && c.available) onPick(c.kind);
            }}
            onClick={(e) => e.preventDefault()}
            aria-label={`${PARTS[c.kind].name}, ${PARTS[c.kind].part[band]}, costs ${c.price} glucose, key ${PLANTS[c.kind].key}`}
            title={`${PARTS[c.kind].name} — ${PARTS[c.kind].job[band]}`}
          >
            <span className="key pvu-pixel">{PLANTS[c.kind].key}</span>
            <img src={icon(c.kind, 3)} alt="" />
            <span className="nm">{band === 0 ? PARTS[c.kind].kid : PARTS[c.kind].name}</span>
            <span className="cost pvu-pixel">{c.available ? (c.discount ? <><s>{c.cost}</s> {c.price}</> : c.price) : `LV${lvl}`}</span>
            {c.available && !c.learned && <span className="lock pvu-pixel">?</span>}
            {c.recharge > 0 && <span className="charge" style={{ height: `${Math.round(c.recharge * 100)}%` }} />}
          </button>
        );
      })}
      <button
        className={`pvu-card shovel ${hud.tool === "shovel" ? "sel" : ""}`}
        disabled={!playing}
        onPointerDown={(e) => {
          e.preventDefault();
          if (playing) onPick("shovel");
        }}
        aria-label="Shovel: dig up a plant (key X)"
      >
        <span className="key pvu-pixel">X</span>
        <ShovelIcon />
        <span className="nm">Dig up</span>
        <span className="cost pvu-pixel">½ back</span>
      </button>
    </div>
  );
}

function ShovelIcon() {
  return (
    <svg className="shovel-ico" viewBox="0 0 12 14" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="#9a6233" d="M5 0h2v8H5z" />
      <path fill="#ffd23f" d="M3 0h6v2H3z" />
      <path fill="#c8c8d8" d="M2 8h8v3l-2 3H4l-2-3z" />
      <path fill="#ffffff" d="M3 9h1v2H3z" />
    </svg>
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

function QuestionPanel({
  asking, band, early, onAnswer, onContinue, onReplay,
}: {
  asking: Asking; band: Band; early: boolean;
  onAnswer: (i: number) => void; onContinue: () => void; onReplay: () => void;
}) {
  const { q, picked, mode, kind, info } = asking;
  const done = picked !== null;
  const correct = done && picked === q.answer;
  let head: string;
  if (mode === "card" && kind) head = `◆ NEW PLANT PART: ${PARTS[kind].name.toUpperCase()}${done ? ` — ${PARTS[kind].part[band].toUpperCase()}` : ""}`;
  else if (info?.final) head = "◆ INCOMING TRANSMISSION — THE WEED LICH IS BEATEN!";
  else if (info?.lastOfLevel) head = `◆ INCOMING TRANSMISSION — LEVEL ${info.level} CLEAR!`;
  else head = `◆ INCOMING TRANSMISSION — WAVE ${info?.wave ?? ""} CLEARED!`;
  const next = info?.lastOfLevel && !info.final ? LEVELS[info.level] : null;
  const half = kind ? Math.floor(PLANTS[kind].cost / 2) : 0;
  return (
    <div className="pvu-overlay">
      <div className={`pvu-panel ${mode}`} role="dialog" aria-label={mode === "card" ? "Plant part question" : "Transmission question"}>
        <div className="pvu-h pvu-pixel pvu-blink">{head}</div>
        {mode === "card" && kind && (
          <div className="pvu-partrow">
            <img src={icon(kind, 4)} alt="" />
            <div>
              {done ? (
                <div className="pvu-job">{PARTS[kind].name} is a {PARTS[kind].part[band].toLowerCase()}: {PARTS[kind].job[band]}</div>
              ) : (
                <div className="pvu-job">What does this plant part do?</div>
              )}
              <div className="pvu-help dim">Answer to unlock it for this level. Right answer = the first one is half price ({half} glucose).</div>
            </div>
          </div>
        )}
        <div className="pvu-tagrow">
          <span className="pvu-tag pvu-pixel sci">SCIENCE{q.standard.includes(".Bio") ? " · BIOLOGY" : q.standard.includes(".Chm") ? " · CHEMISTRY" : q.standard.includes(".EES") ? " · EARTH & ENV." : ""}</span>
          <span className="pvu-tag pvu-pixel std">{q.standard} · {q.skill}</span>
          {speechSupported() && (
            <button className="pvu-speak" onClick={onReplay} aria-label="Read the question aloud" title="Read aloud (L)">
              <SpeakerIcon />
            </button>
          )}
        </div>
        {q.passage && <div className="pvu-passage">{q.passage}</div>}
        <div className="pvu-prompt">{q.prompt}</div>
        <div className="pvu-choices">
          {q.choices.map((c, i) => {
            const st = !done ? "" : i === q.answer ? "right" : i === picked ? "wrong" : "";
            const ic = early ? choiceIcon(c) : null;
            return (
              <button key={i} className={`pvu-btn ${st}`} disabled={done} onClick={() => onAnswer(i)}>
                <span className="key">{"ABCD"[i]}</span>
                {ic && <img className="ico" src={icon(ic, 2)} alt="" />}
                <span>{c}</span>
              </button>
            );
          })}
        </div>
        {done && (
          <div className="pvu-feedback">
            {correct ? (
              <div className="verdict ok">
                ✔ CORRECT! {mode === "card" ? `${PARTS[kind!].name.toUpperCase()} UNLOCKED · FIRST ONE ${half} GLUCOSE` : "+50 GLUCOSE · A GNOME CART IS READY"}
              </div>
            ) : (
              <div className="verdict no">
                ✘ NOT QUITE — THE ANSWER IS {"ABCD"[q.answer]}{mode === "card" ? " · UNLOCKED, BUT THE CARD RECHARGES FIRST" : ""}
              </div>
            )}
            <div>{q.explanation}</div>
            {next && (
              <div className="pvu-help" style={{ marginTop: 8 }}>
                <span className="y">Next: LEVEL {info!.level + 1} — {next.name}.</span> New plant parts:{" "}
                {next.unlock.map((k) => `${PARTS[k].name} (${PARTS[k].part[band]})`).join(", ")}.
                {next.light < 0.7 ? " The light is dim there, so leaves make less food." : ""}
              </div>
            )}
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button className="pvu-cta" autoFocus onClick={onContinue}>
                {mode === "card" ? "Plant it ▶" : info?.final ? "Mission report ▶" : info?.lastOfLevel ? "Next level ▶" : "Next wave ▶"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ROSTER: UndeadKind[] = ["grumbones", "rotling", "blightbug", "shade", "frostwraith", "stump", "weedlich"];

function TitleScreen({
  grade, band, onGrade, onStart, highScore,
}: {
  grade: Grade; band: Band; onGrade: (g: Grade) => void; onStart: () => void; highScore: number;
}) {
  const t = tuningFor(band);
  const course = band === 3 ? `plant biology (${courseName(grade, "science")} year)` : null;
  return (
    <div className="pvu-overlay" style={{ background: "rgba(5,8,24,0.55)" }}>
      <div className="pvu-panel title">
        <div className="pvu-title pvu-pixel">PLANTS VS UNDEAD</div>
        <div className="pvu-sub pvu-pixel">SPIDERBEN10'S ARCADE · SCIENCE K–12 · PLANT PARTS &amp; PHOTOSYNTHESIS</div>
        {gradeFromArcade() ? (
          <div className="pvu-sub pvu-pixel pvu-badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="pvu-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`pvu-grade pvu-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="pvu-help center">
          <b className="y">{gradeLabel(grade)}{course ? ` · ${course}` : ""}</b> — {t.lanes.length} lanes, {t.wavesPerLevel} waves a level, {t.hearts} greenhouse hearts
          {band === 0 ? ", slow undead and read-aloud." : band === 1 ? ", steady undead." : band === 2 ? ", quicker undead and the full chemical equation." : ", tough undead, light reactions and the Calvin cycle."}
        </div>
        <div style={{ textAlign: "center", margin: "12px 0 10px" }}>
          <button className="pvu-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="pvu-help">
          Undead shamble in from the right. Grow <span className="y">plant parts</span> to stop them before they reach your greenhouse.
          Plants cost <span className="y">glucose</span> (sugar), and you make glucose by <span className="c">photosynthesis</span>: catch falling
          sunlight, and with water (from soil and roots) and carbon dioxide (from the air and bubbles) your leaves make glucose and give off oxygen.
          The first time you pick a new plant part each level, answer a question about its job. Clear a wave for an incoming transmission.
        </div>
        <div className="pvu-help keys">
          <kbd>◀</kbd><kbd>▶</kbd><kbd>▲</kbd><kbd>▼</kbd> move · <kbd>SPACE</kbd> plant · <kbd>Q</kbd>–<kbd>P</kbd> seed cards · <kbd>X</kbd> dig up ·
          {" "}<kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>L</kbd> read aloud · <kbd>ESC</kbd> pause · <kbd>M</kbd> mute. Or tap and click everything.
        </div>
        <div className="pvu-roster">
          {TRAY.map((k) => (
            <div key={k} className="pvu-who">
              <img src={icon(k, 2)} alt="" />
              <span><b>{PARTS[k].name}</b> <i>{PARTS[k].part[band]}</i> — {PARTS[k].job[band]}</span>
            </div>
          ))}
        </div>
        <div className="pvu-roster undead">
          {ROSTER.map((k) => (
            <div key={k} className="pvu-who">
              <img src={icon(`${k}0`, 2)} alt="" />
              <span><b className="r">{UNDEAD[k].name}</b> — {UNDEAD[k].blurb}</span>
            </div>
          ))}
        </div>
        <div className="pvu-help dim" style={{ marginTop: 8, textAlign: "center" }}>
          HI-SCORE {String(highScore).padStart(6, "0")} · created by SpiderBen10 (NZDO)
        </div>
      </div>
    </div>
  );
}

function MissionReport({
  result, log, grade, band, highScore, onAgain, onMenu,
}: {
  result: { won: boolean; stats: Stats; level: number; wave: number; score: number };
  log: LogEntry[]; grade: Grade; band: Band; highScore: number; onAgain: () => void; onMenu: () => void;
}) {
  const byStd = new Map<string, { std: string; skill: string; n: number; c: number }>();
  for (const l of log) {
    const key = `${l.standard}|${l.skill}`;
    const cur = byStd.get(key) ?? { std: l.standard, skill: l.skill, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(key, cur);
  }
  const cards = log.filter((l) => l.kind === "card");
  const cps = log.filter((l) => l.kind === "checkpoint");
  const practice = [...byStd.values()].filter((v) => v.c / v.n < 0.75);
  const s = result.stats;
  return (
    <div className="pvu-overlay">
      <div className="pvu-panel">
        <div className="pvu-h pvu-pixel" style={{ color: result.won ? "var(--pvu-green)" : "var(--pvu-red)" }}>
          {result.won ? "THE GARDEN IS SAFE! — MISSION REPORT" : "THE UNDEAD REACHED THE GREENHOUSE — MISSION REPORT"}
        </div>
        <div className="pvu-help big">
          Score <b className="y">{result.score}</b>
          {result.score >= highScore && result.score > 0 ? " — NEW HIGH SCORE!" : ""} · Level <b className="c">{result.level}</b>, wave {result.wave} · {gradeLabel(grade)}
        </div>
        <div className="pvu-help pvu-photo">
          <img src={icon("glucose", 2)} alt="" /> Photosynthesis made <b className="y">{s.glucoseMade}</b> glucose in {s.batches} batches and released{" "}
          <b className="c">{s.o2}</b> O₂ bubbles. You gathered {s.light} light, {s.water} water and {s.co2} {band === 0 ? "air" : "CO₂"}. Planted {s.planted} plant parts ·
          {" "}{s.defeated} undead stopped · waves cleared: {s.wavesCleared}.
        </div>
        <div className="pvu-help" style={{ marginTop: 4 }}>
          Seed-card questions {cards.filter((l) => l.correct).length}/{cards.length} · Transmissions {cps.filter((l) => l.correct).length}/{cps.length}
        </div>
        {byStd.size > 0 && (
          <table className="pvu-report">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([key, v]) => (
                <tr key={key}>
                  <td className="c">{v.std}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: v.c === v.n ? "var(--pvu-green)" : v.c / v.n >= 0.75 ? "var(--pvu-yellow)" : "var(--pvu-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 ? (
          <div className="pvu-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}. Missed standards come up more often next time.
          </div>
        ) : (
          log.length > 0 && (
            <div className="pvu-help" style={{ marginTop: 10 }}>
              <span className="y">Practice next:</span> nothing missed — try the next grade up!
            </div>
          )
        )}
        {log.length === 0 && <div className="pvu-help" style={{ marginTop: 10 }}>No questions answered yet. Pick a seed card to get a plant-part question.</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="pvu-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="pvu-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

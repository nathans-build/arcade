import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
  arcadeLink,
  courseName,
  gradeFromArcade,
  gradeLabel,
  gradeNumber,
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
import { DIR_NAME, type Dir } from "@/jungle/compass";
import { mapDeck, timelineDeck, type Rotation } from "@/jungle/decks";
import type { MapChallenge } from "@/jungle/data/maps";
import { dateLabel, orderKey, type TimelineSet } from "@/jungle/data/timelines";
import { JungleEngine, TREASURE_NAMES, W, H, type Action, type Challenge, type HudState, type SceneInfo } from "@/jungle/engine";
import "@/jungle/jungle.css";

const GAME_ID = "jungle-run";

/** An original 16-step bassline for Jungle Run (Hz, 0 = rest): a stomping jungle-drum walk. */
const BASSLINE = [110, 0, 110, 131, 0, 147, 131, 0, 98, 0, 98, 123, 0, 131, 147, 165];

type Screen = "title" | "playing" | "over";
type Mode = "social" | "science" | "ela" | "math" | "mixed";
const MODES: Mode[] = ["social", "science", "ela", "math", "mixed"];
const MIXED: Subject[] = ["social", "science", "ela", "math"];

const SUBJECT_LABELS: Record<Subject, string> = { social: "SOCIAL STUDIES", science: "SCIENCE", ela: "ELA", math: "MATH" };
const SUBJECT_SHORT: Record<Subject, string> = { social: "SOC", science: "SCI", ela: "ELA", math: "MATH" };

interface LogEntry {
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
  kind: "treasure" | "map" | "gate" | "camp";
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  " ": "jump",
  z: "jump", Z: "jump", x: "jump", X: "jump",
};

const EMPTY_HUD: HudState = { score: 0, lives: 3, time: 0, scene: 1, leg: 1, treasures: 0 };

const DIR_HOW: Record<Dir, string> = { N: "rope ladder up", E: "trail to the right", S: "trapdoor down", W: "trail to the left" };

function modeNote(m: Mode, g: Grade): string {
  if (m === "mixed") return "All four subjects";
  const course = courseName(g, m);
  const notes: Record<Subject, string> = {
    social: "History, maps, civics",
    science: "Life, earth, physical",
    ela: "Reading & words",
    math: "Fresh problems",
  };
  return course ? `${course}` : notes[m];
}

function clockText(t: number): string {
  const s = Math.max(0, Math.ceil(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Stand-in Question so map and timeline results count toward their standard in the kit's progress store. */
function standIn(id: string, grade: Grade, standard: string, skill: string, prompt: string, correct: boolean): Question {
  return { id, subject: "social", grade, standard, skill, prompt, choices: ["Right", "Wrong", "—", "—"], answer: correct ? 0 : 1, explanation: "" };
}

function mapOptions(c: Extract<Challenge, { type: "map" }>) {
  return c.letters.map((d) => {
    const sign = c.signs?.[d];
    return { d, main: sign ? sign.label : DIR_NAME[d], sub: sign ? `${DIR_NAME[d].toLowerCase()} exit` : DIR_HOW[d] };
  });
}

function sayMap(c: Extract<Challenge, { type: "map" }>) {
  const opts = mapOptions(c).map((o, i) => `${"ABCD"[i]}: ${o.main.toLowerCase()}.`).join(" ");
  speak(`${c.ch.prompt} ${opts}`);
}

function sayGate(c: Extract<Challenge, { type: "gate" }>) {
  speak(`Timeline gate: ${c.set.title}. Open the tablets from earliest to latest. ${c.events.map((e, i) => `${"ABCD"[i]}: ${e.text}.`).join(" ")}`);
}

export default function JungleRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<JungleEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASSLINE, 120), []);
  const deckRef = useRef<QuestionDeck | null>(null);
  const mapsRef = useRef<Rotation<MapChallenge> | null>(null);
  const gatesRef = useRef<Rotation<TimelineSet> | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("4"));
  const [mode, setMode] = useState<Mode>("social");
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [scene, setScene] = useState<SceneInfo | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("4"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [hurtNote, setHurtNote] = useState<string | null>(null);
  const [endReason, setEndReason] = useState<"time" | "lives">("time");
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  const lastHintKind = useRef<string>("");
  const challengeRef = useRef<Challenge | null>(null);
  const hurtTimer = useRef<number | undefined>(undefined);
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

  const logResult = useCallback((e: LogEntry) => setLog((l) => [...l, e]), []);

  // Create the engine once; it runs an attract-mode scene behind the title screen.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new JungleEngine(canvas, audio, {
      onHud: setHud,
      onScene: (info) => {
        setScene(info);
        setHurtNote(null);
        if (readAloudRef.current && isEarlyReader(gradeRef.current) && info.kind !== lastHintKind.current
          && info.kind !== "crossroads" && info.kind !== "gate") {
          lastHintKind.current = info.kind;
          speak(info.hint.replace(/▼/g, "down").replace(/▲/g, "up"));
        }
      },
      onChallenge: (c) => {
        const prev = challengeRef.current;
        challengeRef.current = c;
        setChallenge(c);
        {
          const g = gradeRef.current;
          const isNew = c && (!prev || prev.type !== c.type || JSON.stringify(idOf(prev)) !== JSON.stringify(idOf(c)));
          if (c && isNew && readAloudRef.current) {
            if (c.type === "map") sayMap(c);
            else if (c.type === "gate") sayGate(c);
            else speakQuestion(c.q.prompt, c.q.choices);
          }
          // Newly answered: record it once.
          const wasOpen = prev && sameChallenge(prev, c) && !answered(prev);
          if (c && answered(c) && (wasOpen || isNew)) {
            if (c.type === "map") {
              recordAnswer(GAME_ID, standIn(`map:${c.ch.id}`, g, String(c.ch.standard), c.ch.skill, c.ch.prompt, !!c.correct), !!c.correct);
              logResult({ subject: "social", standard: String(c.ch.standard), skill: c.ch.skill, correct: !!c.correct, kind: "map" });
              if (readAloudRef.current) speak(`${c.correct ? "Right way!" : `The right exit was ${DIR_NAME[c.answer].toLowerCase()}.`} ${c.ch.explanation}`);
            } else if (c.type === "gate") {
              const std = String(c.set.standard);
              recordAnswer(GAME_ID, standIn(`gate:${c.set.id}`, g, std, c.set.skill, c.set.title, !!c.correct), !!c.correct);
              logResult({ subject: "social", standard: std, skill: c.set.skill, correct: !!c.correct, kind: "gate" });
              if (readAloudRef.current) speak(c.correct ? "The gate opens!" : `Not quite. The order is: ${sortedEvents(c).map((e) => e.text).join(", then ")}.`);
            } else {
              recordAnswer(GAME_ID, c.q, !!c.correct);
              logResult({ subject: c.q.subject, standard: c.q.standard, skill: c.q.skill, correct: !!c.correct, kind: c.type });
              if (readAloudRef.current) speak(c.correct ? `Right! ${c.q.explanation}` : `The answer is ${c.q.choices[c.q.answer]}. ${c.q.explanation}`);
            }
          }
        }
      },
      requestQuestion: () => deckRef.current!.draw(),
      requestMap: () => mapsRef.current!.next(),
      requestTimeline: () => gatesRef.current!.next(),
      onHurt: (msg) => {
        setHurtNote(msg);
        window.clearTimeout(hurtTimer.current);
        hurtTimer.current = window.setTimeout(() => setHurtNote(null), 2600);
      },
      onGameOver: (reason) => {
        setEndReason(reason);
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
        stopSpeaking();
      },
    });
    engineRef.current = engine;
    engine.demo();
    engine.start();
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __jungleRun: unknown }).__jungleRun = { engine };
    }
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, logResult]);

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
  }, []);

  const startGame = useCallback(
    (m: Mode) => {
      audio.unlock();
      audio.startMusic();
      rememberGrade(grade);
      setMode(m);
      deckRef.current = new QuestionDeck(grade, m === "mixed" ? MIXED : m, { gameId: GAME_ID });
      mapsRef.current = mapDeck(grade);
      gatesRef.current = timelineDeck(grade);
      lastHintKind.current = "";
      setLog([]);
      setChallenge(null);
      setPaused(false);
      setHurtNote(null);
      setScreen("playing");
      engineRef.current?.newGame({ grade: gradeNumber(grade) });
    },
    [audio, grade],
  );

  const chooseAnswer = useCallback((i: number) => engineRef.current?.answer(i), []);
  const continueOn = useCallback(() => {
    stopSpeaking();
    engineRef.current?.continue();
  }, []);

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
    const c = challenge;
    if (c?.type === "map") sayMap(c);
    else if (c?.type === "gate") sayGate(c);
    else if (c) speakQuestion(c.q.prompt, c.q.choices);
    else if (scene) speak(scene.hint.replace(/▼/g, "down").replace(/▲/g, "up"));
  }, [challenge, scene]);

  const isAnswered = challenge ? answered(challenge) : false;

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const k = ev.key.toLowerCase();
      if (ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        const idx = "1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k);
        if (idx >= 0) {
          ev.preventDefault();
          if (!paused) chooseAnswer(idx);
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
      if (isAnswered && (ev.key === "Enter" || ev.key === " ")) {
        ev.preventDefault();
        if (!ev.repeat && !paused) continueOn();
        return;
      }
      const a = KEYMAP[ev.key];
      if (a) {
        ev.preventDefault();
        if (!ev.repeat) engineRef.current?.setKey(a, true);
      }
    };
    const up = (ev: KeyboardEvent) => {
      const a = KEYMAP[ev.key];
      if (a) engineRef.current?.setKey(a, false);
    };
    const blur = () => {
      engineRef.current?.releaseAllKeys();
      if (screen === "playing" && !challenge) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, paused, challenge, isAnswered, chooseAnswer, togglePause, replay, continueOn, audio]);

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

  // Tap a sign at the crossroads or a tablet at a timeline gate.
  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== "playing") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    audio.unlock();
    if (engineRef.current?.tap(x, y)) e.preventDefault();
  };

  return (
    <div className={`jr-root ${early ? "early" : ""}`}>
      <div className="jr-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="jr-tools">
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="jr-cabinet">
        <div className="jr-hud jr-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Time</span><span className={`val ${hud.time <= 30 && screen === "playing" ? "low" : ""}`}>{clockText(hud.time)}</span></div>
          <div><span className="lbl">Scene</span><span className="val">{hud.scene}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, hud.lives))}</span></div>
          <div><span className="lbl">Treasure</span><span className="val">{hud.treasures}</span></div>
        </div>

        {screen === "playing" && !challenge && scene && <SceneBanner info={scene} hurt={hurtNote} readAloud={readAloud} onReplay={replay} />}
        {screen === "playing" && challenge && (challenge.type === "treasure" || challenge.type === "camp") && (
          <QuestionBanner c={challenge} leg={scene?.leg ?? hud.leg} readAloud={readAloud} onChoose={chooseAnswer} onReplay={replay} onContinue={continueOn} open={!paused} />
        )}
        {screen === "playing" && challenge?.type === "map" && (
          <MapBanner c={challenge} readAloud={readAloud} onChoose={chooseAnswer} onReplay={replay} onContinue={continueOn} open={!paused} />
        )}
        {screen === "playing" && challenge?.type === "gate" && (
          <GateBanner c={challenge} readAloud={readAloud} onChoose={chooseAnswer} onReplay={replay} onContinue={continueOn} open={!paused} />
        )}

        <div className="jr-stage" ref={stageRef}>
          <div className="jr-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Jungle Run game screen" onPointerDown={onCanvasPointer} />

            {screen === "title" && <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />}

            {screen === "playing" && paused && (
              <div className="jr-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="jr-title jr-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="jr-cta" onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                hud={hud}
                reason={endReason}
                grade={grade}
                highScore={highScore}
                onAgain={() => startGame(mode)}
                onMenu={() => {
                  engineRef.current?.demo();
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`jr-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="jr-pad">
            <button className="jr-touch jr-pixel" {...touchProps("left")} aria-label="Run left">◀</button>
            <button className="jr-touch jr-pixel" {...touchProps("right")} aria-label="Run right">▶</button>
          </div>
          <div className="jr-pad">
            <button className="jr-touch up jr-pixel" {...touchProps("up")} aria-label="Climb up">▲</button>
            <button className="jr-touch down jr-pixel" {...touchProps("down")} aria-label="Climb down">▼</button>
            <button className="jr-touch big fire jr-pixel" {...touchProps("jump")} aria-label="Jump">JUMP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

function idOf(c: Challenge): string {
  if (c.type === "map") return `map:${c.ch.id}:${c.letters.join("")}`;
  if (c.type === "gate") return `gate:${c.set.id}:${c.events.map((e) => e.id).join(",")}`;
  return `${c.type}:${c.q.id}`;
}
function sameChallenge(a: Challenge | null, b: Challenge | null): boolean {
  return !!a && !!b && idOf(a) === idOf(b);
}
function answered(c: Challenge): boolean {
  if (c.type === "gate") return c.correct !== null;
  return c.picked !== null && c.correct !== null;
}
function sortedEvents(c: Extract<Challenge, { type: "gate" }>) {
  return [...c.events].sort((a, b) => orderKey(a) - orderKey(b));
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}

function Speak({ readAloud, onReplay, label }: { readAloud: boolean; onReplay: () => void; label: string }) {
  if (!speechSupported()) return null;
  return (
    <button type="button" className={`speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label={label} title="Read aloud (R)">
      <SpeakerIcon />
    </button>
  );
}

function SceneBanner({ info, hurt, readAloud, onReplay }: { info: SceneInfo; hurt: string | null; readAloud: boolean; onReplay: () => void }) {
  const title = info.kind === "tunnel" ? "UNDERGROUND TUNNEL" : info.kind === "camp" ? "BASE CAMP" : `SCENE ${info.index + 1}`;
  return (
    <div className={`jr-banner ${hurt ? "wrong" : ""}`}>
      <div className="head jr-pixel">
        <span>LEG {info.leg} · {title}</span>
        <span className="std">{info.treasure ? "◆ TREASURE HERE" : "EXPLORE →"}</span>
      </div>
      <div className="prompt">
        <Speak readAloud={readAloud} onReplay={onReplay} label="Read the hint aloud" />
        <span className="rule">{info.hint}</span>
      </div>
      <div className={`info ${hurt ? "" : "hint"}`}>{hurt ?? "Treasures are questions: answer right to keep them. Crossroads test your map skills; timeline gates open in date order."}</div>
    </div>
  );
}

interface BannerProps<T> {
  c: T;
  readAloud: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
  onContinue: () => void;
  open: boolean;
}

function QuestionBanner({ c, leg, readAloud, onChoose, onReplay, onContinue, open }: BannerProps<Extract<Challenge, { type: "treasure" | "camp" }>> & { leg: number }) {
  const { q, correct } = c;
  let head = c.type === "camp"
    ? `◆ RADIO CALL FROM BASE CAMP — LEG ${leg} CHECKPOINT · PRESS A–D OR TAP`
    : `◆ TREASURE: ${TREASURE_NAMES[c.treasure ?? "coin"]} — ANSWER TO KEEP IT · A–D OR TAP`;
  if (correct === true) head = c.type === "camp" ? `✔ MESSAGE RECEIVED! +${c.bonus} · +30 SECONDS` : `✔ TREASURE KEPT! +${c.bonus} · +10 SECONDS`;
  if (correct === false) head = c.type === "camp" ? "✘ STATIC ON THE LINE — HERE'S THE ANSWER" : "✘ THE TREASURE CRUMBLED TO DUST";
  return (
    <div className={`jr-banner ${c.type === "camp" ? "camp" : ""} ${correct === true ? "correct" : correct === false ? "wrong" : ""}`} role="dialog" aria-label="Treasure question">
      <div className="head jr-pixel">
        <span>{head}</span>
        <span className="std">{SUBJECT_SHORT[q.subject]} · {q.standard} · {q.skill}</span>
      </div>
      {q.passage && <div className="passage">{q.passage}</div>}
      <div className="prompt">
        <Speak readAloud={readAloud} onReplay={onReplay} label="Read the question aloud" />
        <span>{q.prompt}</span>
      </div>
      <div className="opts">
        {q.choices.map((ch, i) => {
          const state = correct !== null && i === q.answer ? "ans" : c.picked === i ? (correct !== null ? "wrong" : "picked") : "";
          return (
            <button key={i} type="button" className={`opt ${state}`} disabled={!open || c.picked !== null}
              onPointerDown={(e) => { e.preventDefault(); onChoose(i); }}>
              <b>{"ABCD"[i]}</b>
              <span>{ch}</span>
            </button>
          );
        })}
      </div>
      {correct !== null && (
        <div className="info result">
          <span>{correct ? q.explanation : `Answer: ${"ABCD"[q.answer]}) ${q.choices[q.answer]}. ${q.explanation}`}</span>
          <button type="button" className="jr-cta small" autoFocus onClick={onContinue}>{c.type === "camp" ? "Next leg ▶" : "Keep exploring ▶"}</button>
        </div>
      )}
    </div>
  );
}

function MapBanner({ c, readAloud, onChoose, onReplay, onContinue, open }: BannerProps<Extract<Challenge, { type: "map" }>>) {
  const opts = mapOptions(c);
  let head = "◆ JUNGLE CROSSROADS — WALK TO AN EXIT (▲ LADDER · ▼ TRAPDOOR · ◀ ▶ TRAILS), PRESS A–D OR TAP";
  if (c.correct === true) head = `✔ RIGHT WAY! +${c.bonus} · +15 SECONDS`;
  if (c.correct === false) head = `✘ WRONG WAY — THE ${DIR_NAME[c.answer]} EXIT WAS RIGHT`;
  return (
    <div className={`jr-banner map ${c.correct === true ? "correct" : c.correct === false ? "wrong" : ""}`} role="dialog" aria-label="Map challenge">
      <div className="head jr-pixel">
        <span>{head}</span>
        <span className="std">SOC · {String(c.ch.standard)} · {c.ch.skill}</span>
      </div>
      <div className="prompt">
        <Speak readAloud={readAloud} onReplay={onReplay} label="Read the direction aloud" />
        <span>{c.ch.prompt}</span>
      </div>
      <div className="opts">
        {opts.map((o, i) => {
          const state = c.correct !== null && o.d === c.answer ? "ans" : c.picked === o.d ? (c.correct !== null ? "wrong" : "picked") : "";
          return (
            <button key={o.d} type="button" className={`opt ${state}`} disabled={!open || c.picked !== null}
              onPointerDown={(e) => { e.preventDefault(); onChoose(i); }}>
              <b>{"ABCD"[i]}</b>
              <span>{o.main}<small>{o.sub}</small></span>
            </button>
          );
        })}
      </div>
      {c.correct !== null && (
        <div className="info result">
          <span>{c.ch.explanation}</span>
          <button type="button" className="jr-cta small" autoFocus onClick={onContinue}>Onward ▶</button>
        </div>
      )}
    </div>
  );
}

function GateBanner({ c, readAloud, onChoose, onReplay, onContinue, open }: BannerProps<Extract<Challenge, { type: "gate" }>>) {
  const sorted = sortedEvents(c);
  const k2 = c.events.every((e) => e.year === undefined);
  let head = `◆ TIMELINE GATE — OPEN THE TABLETS ${k2 ? "FIRST TO LAST" : "EARLIEST TO LATEST"} · WALK UP + ▲, A–D OR TAP`;
  if (c.correct === true) head = `✔ THE GATE RUMBLES OPEN! +${c.bonus} · +20 SECONDS`;
  if (c.correct === false) head = "✘ WRONG ORDER — THE GATE OPENS, BUT NO BONUS";
  return (
    <div className={`jr-banner gate ${c.correct === true ? "correct" : c.correct === false ? "wrong" : ""}`} role="dialog" aria-label="Timeline gate">
      <div className="head jr-pixel">
        <span>{head}</span>
        <span className="std">SOC · {String(c.set.standard)} · {c.set.skill}</span>
      </div>
      <div className="prompt">
        <Speak readAloud={readAloud} onReplay={onReplay} label="Read the tablets aloud" />
        <span>Put {c.set.title} in order: which came {c.opened.length === 0 ? "FIRST" : "NEXT"}?</span>
      </div>
      <div className="opts">
        {c.events.map((e, i) => {
          const at = c.opened.indexOf(i);
          const reveal = c.correct !== null;
          const cls = at >= 0 ? "done" : c.wrong === i ? "wrong" : reveal ? "ans" : "";
          return (
            <button key={e.id} type="button" className={`opt gate ${cls}`} disabled={!open || c.correct !== null || at >= 0}
              onPointerDown={(ev) => { ev.preventDefault(); onChoose(i); }}>
              <b>{"ABCD"[i]}</b>
              <span>{e.text}</span>
              {(at >= 0 || reveal) && <span className="num">#{sorted.indexOf(e) + 1} · {dateLabel(e)}</span>}
            </button>
          );
        })}
      </div>
      {c.correct !== null && (
        <div className="info result">
          <span>{sorted.map((e) => `${dateLabel(e)}: ${e.text}`).join(" → ")}</span>
          <button type="button" className="jr-cta small" autoFocus onClick={onContinue}>Through the gate ▶</button>
        </div>
      )}
    </div>
  );
}

function TitleScreen({ grade, onGrade, onStart, highScore }: { grade: Grade; onGrade: (g: Grade) => void; onStart: (m: Mode) => void; highScore: number }) {
  const fromArcade = gradeFromArcade();
  return (
    <div className="jr-overlay" style={{ background: "rgba(10,15,46,0.62)" }}>
      <div className="jr-panel" style={{ borderColor: "var(--jr-red)" }}>
        <div className="jr-title jr-pixel">JUNGLE RUN</div>
        <div className="jr-sub jr-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>

        {fromArcade ? (
          <div className="jr-sub jr-pixel jr-badge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="jr-h jr-pixel" style={{ marginTop: 14 }}>1. PICK YOUR GRADE</div>
            <div className="jr-grades" role="radiogroup" aria-label="Grade">
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={g === grade} className={`jr-grade jr-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="jr-h jr-pixel" style={{ marginTop: 12 }}>
          {fromArcade ? "" : "2. "}PICK YOUR TREASURE HUNT · {gradeLabel(grade).toUpperCase()}
        </div>
        <div className="jr-subjects">
          {MODES.map((m, i) => (
            <button key={m} className={`jr-subject ${i === 0 ? "first" : ""}`} onClick={() => onStart(m)}>
              {m === "mixed" ? "MIXED" : m === "social" ? "SOCIAL STUDIES" : SUBJECT_LABELS[m]}
              <small>{modeNote(m, grade)}</small>
            </button>
          ))}
        </div>
        <div className="jr-help">
          <kbd>◀</kbd> <kbd>▶</kbd> run &nbsp;·&nbsp; <kbd>SPACE</kbd>/<kbd>Z</kbd>/<kbd>X</kbd> jump (and let go of vines) &nbsp;·&nbsp; <kbd>▲</kbd> <kbd>▼</kbd> climb
          &nbsp;·&nbsp; <kbd>A</kbd>–<kbd>D</kbd>/<kbd>1</kbd>–<kbd>4</kbd> answer &nbsp;·&nbsp; <kbd>P</kbd> pause &nbsp;·&nbsp; <kbd>M</kbd> mute &nbsp;·&nbsp; <kbd>R</kbd> read aloud
          <br />
          Explore before the clock runs out: jump logs, swing on vines, hop across swamp snappers.{" "}
          <span style={{ color: "var(--jr-yellow)" }}>Treasures are questions</span>. At a
          <span style={{ color: "var(--jr-cyan)" }}> crossroads</span>, read the compass rose and take the right exit; open
          <span style={{ color: "var(--jr-green)" }}> timeline gates</span> in date order.
        </div>
        <div className="jr-help" style={{ marginTop: 6, color: "var(--jr-dim)" }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function MissionReport({
  log, hud, reason, grade, highScore, onAgain, onMenu,
}: {
  log: LogEntry[]; hud: HudState; reason: "time" | "lives"; grade: Grade; highScore: number; onAgain: () => void; onMenu: () => void;
}) {
  const subjects: Subject[] = ["social", "science", "ela", "math"];
  const bySubject = subjects
    .map((s) => {
      const items = log.filter((l) => l.subject === s);
      return { s, n: items.length, c: items.filter((l) => l.correct).length };
    })
    .filter((x) => x.n > 0);
  const byStd = new Map<string, { skill: string; subject: Subject; n: number; c: number }>();
  for (const l of log) {
    const key = `${l.standard}|${l.skill}`;
    const cur = byStd.get(key) ?? { skill: l.skill, subject: l.subject, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(key, cur);
  }
  const practice = [...byStd.entries()].filter(([, v]) => v.c < v.n);
  const count = (k: LogEntry["kind"]) => {
    const xs = log.filter((l) => l.kind === k);
    return `${xs.filter((l) => l.correct).length}/${xs.length}`;
  };
  return (
    <div className="jr-overlay">
      <div className="jr-panel">
        <div className="jr-h jr-pixel" style={{ color: "var(--jr-red)" }}>
          {reason === "time" ? "TIME'S UP" : "EXPEDITION OVER"} — MISSION REPORT · {gradeLabel(grade).toUpperCase()}
        </div>
        <div className="jr-help" style={{ fontSize: 22 }}>
          Score <b style={{ color: "var(--jr-yellow)" }}>{hud.score}</b>
          {hud.score >= highScore && hud.score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached scene <b style={{ color: "var(--jr-cyan)" }}>{hud.scene}</b> ·
          Treasures kept {count("treasure")} · Crossroads {count("map")} · Timeline gates {count("gate")} · Radio checkpoints {count("camp")}
        </div>
        {bySubject.length > 0 && (
          <div className="jr-help" style={{ marginTop: 6 }}>
            {bySubject.map((b) => (
              <span key={b.s} style={{ marginRight: 16 }}>
                <span className={`jr-tag jr-pixel ${b.s}`}>{SUBJECT_LABELS[b.s]}</span>
                {b.c}/{b.n}
              </span>
            ))}
          </div>
        )}
        {byStd.size > 0 ? (
          <table className="jr-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([key, v]) => (
                <tr key={key}>
                  <td style={{ color: "var(--jr-cyan)" }}>{key.split("|")[0]}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: v.c === v.n ? "var(--jr-green)" : "var(--jr-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="jr-help" style={{ marginTop: 8 }}>No answers yet. Touch a treasure to open a question!</div>
        )}
        {practice.length > 0 && (
          <div className="jr-help" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--jr-yellow)" }}>Practice next:</span> {practice.map(([key, v]) => `${v.skill} (${key.split("|")[0]})`).join(", ")}.
            Treasure questions on these come up more often next time.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="jr-cta ghost" onClick={onMenu}>Change hunt</button>
          <button className="jr-cta" autoFocus onClick={onAgain}>Explore again ▶</button>
        </div>
      </div>
    </div>
  );
}

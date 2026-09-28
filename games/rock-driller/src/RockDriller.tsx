import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  QuestionDeck,
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
  type Question,
} from "@/kit";
import { DrillEngine, type Action, type GemInfo, type HudState, type LevelInfo } from "@/drill/engine";
import type { Challenge } from "@/drill/challenges";
import { ERA_BOUNDS, TYPE_NAMES, type SpecimenKind } from "@/drill/geology";
import type { GoalId } from "@/drill/levels";
import { gemSprite } from "@/drill/sprites";
import { gradeTopics } from "@/drill/topics";
import "@/drill/drill.css";

const GAME_ID = "rock-driller";

/** Rock Driller's own 16-step bassline (Hz, 0 = rest): a low, chugging drill riff in E minor. */
const BASS = [82, 82, 0, 98, 82, 0, 123, 110, 82, 82, 0, 98, 147, 0, 131, 123];

type Screen = "title" | "playing" | "over";
type Source = "gem" | "challenge" | "checkpoint";

interface AnswerLog {
  q: Question;
  correct: boolean;
  source: Source;
}

interface GemView {
  info: GemInfo;
  q: DealtQuestion;
  picked: number | null;
  respawned: boolean;
}

interface ChallengeView {
  ch: Challenge;
  picked: number | null;
}

const KEYMAP: Record<string, Action> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  " ": "fire",
  z: "fire", Z: "fire", x: "fire", X: "fire",
};

const EMPTY_HUD: HudState = { score: 0, lives: 3, level: 1, have: 0, need: 3, goal: "", site: "" };

const KIND_WORDS: Record<SpecimenKind, string> = {
  living: "a living thing",
  fossil: "a fossil (once living)",
  crystal: "a crystal (never living)",
  fuel: "a fossil fuel",
  ore: "an ore mineral",
  metal: "metal from Earth's core",
};

const GOAL_WORDS: Record<GoalId, string> = {
  living: "living things",
  fossil: "fossils",
  crystal: "crystals",
  sedimentary: "sedimentary rock",
  igneous: "igneous rock",
  metamorphic: "metamorphic rock",
  fuel: "fossil fuels",
  ore: "ore minerals",
  cenozoic: "Cenozoic fossils",
  mesozoic: "Mesozoic fossils",
  paleozoic: "Paleozoic fossils",
};

/** Why a collected gem did not count toward the goal. */
function missReason(info: GemInfo): string {
  const sp = info.specimen;
  const g = info.goalId;
  const name = info.unit.label.replace(/ \(.*\)$/, "");
  if (g === "sedimentary" || g === "igneous" || g === "metamorphic") {
    const t = info.unit.rock.type;
    const what = t === "soil" ? "soil, not rock" : t === "sediment" ? "loose sediment" : t === "earth" ? "a layer of Earth" : `${TYPE_NAMES[t].toLowerCase()} rock`;
    return `${name} is ${what}, so it doesn't count for ${GOAL_WORDS[g]}.`;
  }
  if (g === "cenozoic" || g === "mesozoic" || g === "paleozoic") {
    if (sp.kind !== "fossil") return `${sp.name} is not a fossil.`;
    const era = ERA_BOUNDS.find((e) => e.era === info.unit.def.era);
    return era ? `This layer is from the ${era.name} era, not the ${g.toUpperCase()}.` : "This layer has no era label.";
  }
  return `${sp.name} is ${KIND_WORDS[sp.kind]}, not one of the ${GOAL_WORDS[g]}.`;
}

function GemIcon({ info }: { info: GemInfo }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 8, 8);
    const sp = info.specimen;
    g.fillStyle = info.unit.rock.colors[1];
    g.fillRect(0, 0, 8, 8);
    g.drawImage(gemSprite(sp.shape, sp.colors[0], sp.colors[1]), 0, 0);
  }, [info]);
  return <canvas ref={ref} width={8} height={8} aria-hidden="true" />;
}

export default function RockDriller() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DrillEngine | null>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 126), []);
  const deckRef = useRef<QuestionDeck | null>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("4"));
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<HudState>(EMPTY_HUD);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [gem, setGem] = useState<GemView | null>(null);
  const [challenge, setChallenge] = useState<ChallengeView | null>(null);
  const [checkpoint, setCheckpoint] = useState<{ q: DealtQuestion; level: number; picked: number | null } | null>(null);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("4"))));
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
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

  const speakChallenge = useCallback((ch: Challenge) => {
    speak(`${ch.q.prompt} ${ch.q.choices.map((c, i) => `${i + 1}: ${c.replace(" · ", ", ")}.`).join(" ")}`);
  }, []);

  // Create the engine once; it runs an attract-mode demo behind the title screen.
  useEffect(() => {
    const engine = new DrillEngine(canvasRef.current!, audio, {
      onHud: setHud,
      onLevel: (info) => {
        setLevelInfo(info);
        if (readAloudRef.current) speak(`Level ${info.level}. ${info.site}. ${info.goalText}`);
      },
      onGem: (info) => {
        const q = deckRef.current?.draw();
        if (!q) {
          engine.resolveGem(true);
          return;
        }
        setGem({ info, q, picked: null, respawned: false });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onGemResolved: (info, correct) => {
        if (correct) setFound((f) => [...f, info.specimen.name]);
      },
      onChallenge: (ch) => {
        setChallenge({ ch, picked: null });
        if (readAloudRef.current) speakChallenge(ch);
      },
      onChallengeResult: (ch, choice, correct) => {
        recordAnswer(GAME_ID, ch.q, correct);
        setLog((l) => [...l, { q: ch.q, correct, source: "challenge" }]);
        setChallenge((c) => (c && c.ch === ch ? { ...c, picked: choice } : c));
        if (correct) audio.correct();
        else audio.wrong();
        if (readAloudRef.current) speak(correct ? `Correct! ${ch.q.explanation}` : `Not quite. ${ch.q.explanation}`);
      },
      onChallengeDone: () => setChallenge(null),
      onLevelClear: (level) => {
        const q = deckRef.current?.draw();
        if (!q) {
          engine.nextLevel(false);
          return;
        }
        setCheckpoint({ q, level, picked: null });
        if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
      },
      onGameOver: () => {
        setHighScore(submitScore(GAME_ID, engine.score));
        setScreen("over");
      },
    });
    engineRef.current = engine;
    engine.demo(grade);
    engine.start();
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __rockDriller: unknown }).__rockDriller = { engine };
    }
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

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
    deckRef.current = new QuestionDeck(grade, "science", { gameId: GAME_ID });
    setLog([]);
    setFound([]);
    setGem(null);
    setChallenge(null);
    setCheckpoint(null);
    setPaused(false);
    setScreen("playing");
    engineRef.current?.newGame(grade);
  }, [audio, grade]);

  /* ---------- gem questions ---------- */
  const answerGem = useCallback(
    (i: number) => {
      if (!gem || gem.picked !== null) return;
      const correct = i === gem.q.answer;
      recordAnswer(GAME_ID, gem.q, correct);
      setLog((l) => [...l, { q: gem.q, correct, source: "gem" }]);
      setGem({ ...gem, picked: i });
      if (correct) audio.correct();
      else audio.wrong();
      if (readAloudRef.current) {
        speak(correct ? `Correct! ${gem.q.explanation} ${gem.info.specimen.fact}` : `Not quite. The answer is ${gem.q.choices[gem.q.answer]}. ${gem.q.explanation}`);
      }
    },
    [gem, audio],
  );

  const continueGem = useCallback(() => {
    if (!gem || gem.picked === null) return;
    engineRef.current?.resolveGem(gem.picked === gem.q.answer);
    setGem(null);
    stopSpeaking();
  }, [gem]);

  /* ---------- transmissions ---------- */
  const answerCheckpoint = useCallback(
    (i: number) => {
      if (!checkpoint || checkpoint.picked !== null) return;
      const correct = i === checkpoint.q.answer;
      recordAnswer(GAME_ID, checkpoint.q, correct);
      setLog((l) => [...l, { q: checkpoint.q, correct, source: "checkpoint" }]);
      setCheckpoint({ ...checkpoint, picked: i });
      if (correct) audio.correct();
      else audio.wrong();
      if (readAloudRef.current) speak(correct ? `Correct! Extra drill. ${checkpoint.q.explanation}` : `Not quite. ${checkpoint.q.explanation}`);
    },
    [checkpoint, audio],
  );

  const continueCheckpoint = useCallback(() => {
    if (!checkpoint || checkpoint.picked === null) return;
    engineRef.current?.nextLevel(checkpoint.picked === checkpoint.q.answer);
    setCheckpoint(null);
  }, [checkpoint]);

  const chooseChallenge = useCallback((i: number) => {
    engineRef.current?.answerChallenge(i);
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
    if (gem) speakQuestion(gem.q.prompt, gem.q.choices);
    else if (checkpoint) speakQuestion(checkpoint.q.prompt, checkpoint.q.choices);
    else if (challenge) speakChallenge(challenge.ch);
    else if (levelInfo) speak(`${levelInfo.site}. ${levelInfo.goalText} ${levelInfo.intro}`);
  }, [gem, checkpoint, challenge, levelInfo, speakChallenge]);

  // Keyboard
  useEffect(() => {
    const pickIndex = (ev: KeyboardEvent) => {
      if (ev.key.length !== 1 || ev.ctrlKey || ev.metaKey || ev.altKey) return -1;
      const k = ev.key.toLowerCase();
      return "1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k);
    };
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen !== "playing") return;
      const i = pickIndex(ev);
      if (ev.key === "r" || ev.key === "R") {
        replay();
        return;
      }
      const modal = gem ?? checkpoint;
      if (modal) {
        ev.preventDefault();
        if (modal.picked === null && i >= 0) {
          if (gem) answerGem(i);
          else answerCheckpoint(i);
        } else if (modal.picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          if (gem) continueGem();
          else continueCheckpoint();
        }
        return;
      }
      if (i >= 0) {
        ev.preventDefault();
        if (!paused) chooseChallenge(i);
        return;
      }
      if (ev.key === "p" || ev.key === "P" || ev.key === "Escape") {
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
      if (screen === "playing" && !gem && !checkpoint) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, paused, gem, checkpoint, answerGem, answerCheckpoint, continueGem, continueCheckpoint, chooseChallenge, togglePause, replay, audio]);

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

  return (
    <div className={`rd-root ${early ? "rd-early" : ""}`}>
      <div className="rd-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {screen === "playing" && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="rd-cabinet">
        <div className="rd-hud rd-pixel">
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Lvl</span><span className="val">{hud.level}</span> <span className="lives">{"▰".repeat(Math.max(0, hud.lives))}</span></div>
          <div><span className="lbl">Goal</span><span className="goal">{screen === "playing" ? `${hud.have}/${hud.need}` : "—"}</span></div>
        </div>

        {screen === "playing" && (
          <MissionStrip
            hud={hud}
            level={levelInfo}
            challenge={challenge}
            readAloud={readAloud}
            onChoose={chooseChallenge}
            onReplay={replay}
            disabled={paused || !!gem || !!checkpoint}
          />
        )}

        <div className="rd-stage" ref={stageRef}>
          <div className="rd-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Rock Driller game screen" />

            {screen === "title" && <TitleScreen grade={grade} onGrade={chooseGrade} onStart={startGame} highScore={highScore} />}

            {screen === "playing" && gem && (
              <div className="rd-overlay modal">
                <div className="rd-panel" role="dialog" aria-label="Gem question">
                  <div className="rd-gemhead">
                    <GemIcon info={gem.info} />
                    <div>
                      <div className="rd-h rd-pixel" style={{ marginBottom: 4 }}>◆ GEM FOUND: {gem.info.specimen.name}</div>
                      <div className="rd-where">{gem.info.where} Answer to collect it!</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className="rd-tag rd-pixel science">SCIENCE</span>
                    <span className="rd-tag rd-pixel std">{gem.q.standard} · {gem.q.skill}</span>
                  </div>
                  {gem.q.passage && <div className="rd-help" style={{ marginTop: 6 }}>{gem.q.passage}</div>}
                  <QuestionBody
                    q={gem.q}
                    picked={gem.picked}
                    onPick={answerGem}
                  />
                  {gem.picked !== null && (
                    <div className="rd-feedback">
                      {gem.picked === gem.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! GEM COLLECTED</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — THE GEM CRACKED</div>
                      )}
                      <div>{gem.q.explanation}</div>
                      <div className="rd-fact"><b>{gem.info.specimen.name}:</b> {gem.info.specimen.fact}</div>
                      {gem.picked === gem.q.answer ? (
                        gem.info.target ? (
                          <div className="rd-note">★ It counts toward your goal: {Math.min(hud.need, hud.have + 1)}/{hud.need}!</div>
                        ) : (
                          <div className="rd-note miss">Bonus points, but it doesn't count: {missReason(gem.info)}</div>
                        )
                      ) : (
                        gem.info.target && <div className="rd-note miss">That one would have counted. If you need it, another will appear.</div>
                      )}
                      <div style={{ marginTop: 10, textAlign: "right" }}>
                        <button className="rd-cta" autoFocus onClick={continueGem}>Keep drilling ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && checkpoint && (
              <div className="rd-overlay modal">
                <div className="rd-panel" role="dialog" aria-label="Transmission question">
                  <div className="rd-h rd-pixel rd-blink">◆ INCOMING TRANSMISSION — LEVEL {checkpoint.level} CLEAR</div>
                  <div>
                    <span className="rd-tag rd-pixel science">SCIENCE</span>
                    <span className="rd-tag rd-pixel std">{checkpoint.q.standard} · {checkpoint.q.skill}</span>
                  </div>
                  {checkpoint.q.passage && <div className="rd-help" style={{ marginTop: 6 }}>{checkpoint.q.passage}</div>}
                  <QuestionBody q={checkpoint.q} picked={checkpoint.picked} onPick={answerCheckpoint} />
                  {checkpoint.picked !== null && (
                    <div className="rd-feedback">
                      {checkpoint.picked === checkpoint.q.answer ? (
                        <div className="verdict ok">✔ CORRECT! +{1000 * checkpoint.level} · DRILL UPGRADE: +1 LIFE</div>
                      ) : (
                        <div className="verdict no">✘ NOT QUITE — NO UPGRADE THIS TIME</div>
                      )}
                      <div>{checkpoint.q.explanation}</div>
                      <div style={{ marginTop: 12, textAlign: "right" }}>
                        <button className="rd-cta" autoFocus onClick={continueCheckpoint}>Next level ▶</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {screen === "playing" && paused && !gem && !checkpoint && (
              <div className="rd-overlay">
                <div style={{ textAlign: "center" }}>
                  <div className="rd-title rd-pixel">PAUSED</div>
                  {levelInfo && <div className="rd-help" style={{ margin: "14px 0" }}>{levelInfo.site}: {levelInfo.goalText} {levelInfo.intro}</div>}
                  <button className="rd-cta" onClick={() => togglePause(false)}>Resume</button>
                </div>
              </div>
            )}

            {screen === "over" && (
              <MissionReport
                log={log}
                found={found}
                score={hud.score}
                level={hud.level}
                grade={grade}
                highScore={highScore}
                onAgain={startGame}
                onMenu={() => {
                  engineRef.current?.demo(grade);
                  setScreen("title");
                }}
              />
            )}
          </div>
        </div>

        <div className={`rd-controls ${touch && screen === "playing" ? "show" : ""}`}>
          <div className="rd-dpad">
            <button className="rd-touch rd-pixel up" {...touchProps("up")} aria-label="Drill up">▲</button>
            <button className="rd-touch rd-pixel left" {...touchProps("left")} aria-label="Drill left">◀</button>
            <button className="rd-touch rd-pixel down" {...touchProps("down")} aria-label="Drill down">▼</button>
            <button className="rd-touch rd-pixel right" {...touchProps("right")} aria-label="Drill right">▶</button>
          </div>
          <button className="rd-touch fire rd-pixel" {...touchProps("fire")} aria-label="Foam blaster">FOAM</button>
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

function QuestionBody({ q, picked, onPick }: { q: Question; picked: number | null; onPick: (i: number) => void }) {
  return (
    <>
      <div className="rd-prompt">
        {speechSupported() && (
          <button type="button" className="rd-cta ghost small" style={{ marginRight: 10, verticalAlign: "middle" }} onClick={() => speakQuestion(q.prompt, q.choices)} aria-label="Read the question aloud">
            <SpeakerIcon />
          </button>
        )}
        {q.prompt}
      </div>
      <div className="rd-choices">
        {q.choices.map((c, i) => {
          const state = picked === null ? "" : i === q.answer ? "right" : i === picked ? "wrong" : "";
          return (
            <button key={i} className={`rd-btn ${state}`} disabled={picked !== null} onClick={() => onPick(i)}>
              <span className="key">{"ABCD"[i]}</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function MissionStrip({
  hud, level, challenge, readAloud, onChoose, onReplay, disabled,
}: {
  hud: HudState;
  level: LevelInfo | null;
  challenge: ChallengeView | null;
  readAloud: boolean;
  onChoose: (i: number) => void;
  onReplay: () => void;
  disabled: boolean;
}) {
  const stars = "★".repeat(Math.min(hud.have, hud.need)) + "☆".repeat(Math.max(0, hud.need - hud.have));
  const ch = challenge?.ch;
  const picked = challenge?.picked ?? null;
  const result = ch && picked !== null ? (picked === ch.q.answer ? "correct" : "wrong") : null;
  let head = level ? `LEVEL ${level.level} · ${level.site}` : "";
  if (ch) head = "◆ FIELD CHALLENGE — DRILL INTO A MARKER, PRESS 1–4 OR TAP";
  if (result === "correct") head = "✔ CORRECT! +1000";
  if (result === "wrong") head = `✘ NOT QUITE — IT WAS MARKER ${ch!.q.answer + 1}`;
  const info = ch
    ? result
      ? ch.q.explanation
      : "The numbered markers on screen show each layer. Keys A–D work too."
    : level
      ? `${level.intro}${level.notToScale ? " Layers not to scale." : ""}`
      : "";
  return (
    <div className={`rd-banner ${ch ? "challenge" : "idle"} ${result ?? ""}`}>
      <div className="head">
        <span>{head}</span>
        <span className="std">{ch ? `${ch.q.standard} · ${ch.q.skill}` : `GOAL ${hud.have}/${hud.need}`}</span>
      </div>
      <div className="prompt">
        {speechSupported() && (
          <button type="button" className={`speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read aloud" title="Read aloud (R)">
            <SpeakerIcon />
          </button>
        )}
        {ch ? <span>{ch.q.prompt}</span> : (
          <span>
            {level?.goalText}
            <span className="rd-stars">{stars}</span>
          </span>
        )}
      </div>
      <div className={`opts ${ch ? "" : "hidden"}`}>
        {(ch ? ch.q.choices : ["", "", "", ""]).map((c, i) => {
          const state = result && i === ch!.q.answer ? "ans" : picked === i ? "wrong" : "";
          return (
            <button
              key={i}
              type="button"
              className={`opt ${state}`}
              disabled={!ch || picked !== null || disabled}
              aria-label={ch ? `Marker ${i + 1}: ${c}` : undefined}
              tabIndex={ch ? 0 : -1}
              onPointerDown={(e) => {
                e.preventDefault();
                onChoose(i);
              }}
            >
              <b>{i + 1}</b>
              <span>{c || " "}</span>
            </button>
          );
        })}
      </div>
      <div className="info">{info}</div>
    </div>
  );
}

function TitleScreen({ grade, onGrade, onStart, highScore }: { grade: Grade; onGrade: (g: Grade) => void; onStart: () => void; highScore: number }) {
  const topics = useMemo(() => gradeTopics(grade), [grade]);
  return (
    <div className="rd-overlay" style={{ background: "rgba(10,15,46,0.55)" }}>
      <div className="rd-panel" style={{ borderColor: "var(--rd-red)" }}>
        <div className="rd-title rd-pixel">ROCK DRILLER</div>
        <div className="rd-sub rd-pixel">SPIDERBEN10'S ARCADE · K–12 EARTH SCIENCE · NC STANDARDS</div>
        {gradeFromArcade() ? (
          <div className="rd-sub rd-pixel" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} ·{" "}
            <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="rd-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`rd-grade ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="rd-learn">
          <b>{gradeLabel(grade)}:</b> {topics.summary}
          <br />
          <span style={{ color: "var(--rd-dim)" }}>Sites: {topics.sites.join(" · ")} · {topics.codes.join(", ")} + NC science questions</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <button className="rd-cta" autoFocus onClick={onStart}>Start drilling ▶</button>
        </div>
        <div className="rd-help">
          <kbd>◀</kbd> <kbd>▶</kbd> <kbd>▲</kbd> <kbd>▼</kbd> drill · <kbd>SPACE</kbd>/<kbd>Z</kbd>/<kbd>X</kbd> foam · <kbd>1</kbd>–<kbd>4</kbd>/<kbd>A</kbd>–<kbd>D</kbd> answer ·{" "}
          <kbd>P</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud · or tap the buttons
          <br />
          Dig into buried <span style={{ color: "var(--rd-yellow)" }}>gems</span> (fossils, crystals…) and answer to collect the ones your goal asks for.
          Foam critters until they pop, or drop boulders on them. Drill into the right numbered marker to answer a field challenge.
        </div>
        <div className="rd-help" style={{ marginTop: 8, color: "var(--rd-dim)" }}>
          HI-SCORE {String(highScore).padStart(6, "0")} · Created by SpiderBen10 (NZDO)
        </div>
      </div>
    </div>
  );
}

function MissionReport({
  log, found, score, level, grade, highScore, onAgain, onMenu,
}: {
  log: AnswerLog[]; found: string[]; score: number; level: number; grade: Grade; highScore: number;
  onAgain: () => void; onMenu: () => void;
}) {
  const byStd = new Map<string, { skill: string; n: number; c: number; src: Set<Source> }>();
  for (const l of log) {
    const key = `${l.q.standard}|${l.q.skill}`;
    const cur = byStd.get(key) ?? { skill: l.q.skill, n: 0, c: 0, src: new Set<Source>() };
    cur.n++;
    if (l.correct) cur.c++;
    cur.src.add(l.source);
    byStd.set(key, cur);
  }
  const practice = [...byStd.entries()].filter(([, v]) => v.c < v.n);
  const right = log.filter((l) => l.correct).length;
  const srcName: Record<Source, string> = { gem: "gems", challenge: "field", checkpoint: "transmission" };
  const uniqueFound = [...new Set(found)];
  return (
    <div className="rd-overlay">
      <div className="rd-panel">
        <div className="rd-h rd-pixel" style={{ color: "var(--rd-red)" }}>DRILL OUT OF POWER — MISSION REPORT · {gradeLabel(grade).toUpperCase()}</div>
        <div className="rd-help" style={{ fontSize: 22 }}>
          Score <b style={{ color: "var(--rd-yellow)" }}>{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Reached level <b style={{ color: "var(--rd-sky)" }}>{level}</b> · Answered {right}/{log.length} correctly
        </div>
        {uniqueFound.length > 0 && (
          <div className="rd-help" style={{ marginTop: 6 }}>
            <span style={{ color: "var(--rd-yellow)" }}>Specimens collected:</span> {uniqueFound.join(", ")}.
          </div>
        )}
        {byStd.size > 0 && (
          <table className="rd-report-table">
            <thead>
              <tr><th>STANDARD</th><th>SKILL</th><th>FROM</th><th>RESULT</th></tr>
            </thead>
            <tbody>
              {[...byStd.entries()].map(([key, v]) => (
                <tr key={key}>
                  <td style={{ color: "var(--rd-sky)" }}>{key.split("|")[0]}</td>
                  <td>{v.skill}</td>
                  <td style={{ color: "var(--rd-dim)" }}>{[...v.src].map((s) => srcName[s]).join(", ")}</td>
                  <td style={{ color: v.c === v.n ? "var(--rd-green)" : "var(--rd-red)" }}>{v.c}/{v.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {practice.length > 0 && (
          <div className="rd-help" style={{ marginTop: 10 }}>
            <span style={{ color: "var(--rd-yellow)" }}>Practice next:</span> {practice.map(([key, v]) => `${v.skill} (${key.split("|")[0]})`).join(", ")}.
            These come up more often next time.
          </div>
        )}
        {log.length === 0 && <div className="rd-help" style={{ marginTop: 10 }}>Dig into a gem to get a question — every gem teaches something!</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="rd-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="rd-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

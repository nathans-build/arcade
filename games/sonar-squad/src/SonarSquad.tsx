import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  arcadeLink,
  gradeFromArcade,
  gradeLabel,
  initialGrade,
  isEarlyReader,
  loadProgress,
  readAloudPref,
  rememberGrade,
  setReadAloudPref,
  speak,
  speakQuestion,
  speechSupported,
  stopSpeaking,
  type Grade,
} from "@/kit";
import { AI_LEVELS, type AiLevel } from "@/sonar/ai";
import { FLEET } from "@/sonar/core";
import { GAME_ID, SonarGame, shotGrade, type GameMode, type LogEntry, type PlayMode, type SeatStats } from "@/sonar/game";
import type { PowerUp } from "@/sonar/match";
import { formatCoord, notationHelp, schemeFor, type Scheme } from "@/sonar/notation";
import { SonarScreen, geomFor, spotAt } from "@/sonar/render";
import "@/sonar/sonar.css";

/** Sonar Squad's own 16-step bassline: a slow, sneaky submarine groove (Hz; 0 = rest). */
const BASS = [98, 0, 0, 98, 117, 0, 98, 0, 87, 0, 0, 87, 110, 0, 131, 117];

const SUBJECTS: { id: GameMode; label: string; note: string }[] = [
  { id: "math", label: "MATH", note: "Adaptive math" },
  { id: "science", label: "SCIENCE", note: "NC science" },
  { id: "ela", label: "ELA", note: "Reading & language" },
  { id: "social", label: "SOCIAL", note: "Social studies" },
  { id: "all", label: "MIXED", note: "All four in turn" },
];
const SUBJECT_LABELS: Record<string, string> = { ela: "ELA", math: "MATH", science: "SCIENCE", social: "SOCIAL STUDIES" };
const LEVEL_NOTE: Record<AiLevel, string> = { easy: "Random shots", medium: "Hunts after a hit", hard: "Probability map" };
const POWERS: { id: PowerUp; name: string; icon: string; what: string }[] = [
  { id: "sonar", name: "SONAR SWEEP", icon: "◎", what: "Find out if ships hide in a 3×3 area." },
  { id: "double", name: "DOUBLE SHOT", icon: "⇉", what: "Fire two torpedoes this turn." },
  { id: "repair", name: "REPAIR CREW", icon: "✚", what: "Fix one hit square on your ship." },
];

function schemeLine(s: Scheme): string {
  switch (s) {
    case "picture":
      return "Your grid: 10 picture rows (fish, crab, star…) and numbers 1–10, like “Crab 4”.";
    case "letters":
      return "Your grid: rows A–J and columns 1–10, like C7.";
    case "q1":
      return "Your grid: the first quadrant. Fire at points (x, y) from (0, 0) to (9, 9).";
    case "q4":
      return "Your grid: all four quadrants. Fire at points from (−5, −5) to (5, 5).";
  }
}

export default function SonarSquad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 104), []);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const game = useMemo(
    () =>
      new SonarGame(
        audio,
        {
          say: (t) => {
            if (readAloudRef.current && t) speak(t);
          },
          sayQuestion: (q) => {
            if (readAloudRef.current) speakQuestion(q.passage ? `${q.passage} ${q.prompt}` : q.prompt, q.choices);
          },
          onChange: () => bump(),
        },
        initialGrade("3"),
      ),
    [audio],
  );
  const [subject, setSubject] = useState<GameMode>("math");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [reportSeat, setReportSeat] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  const u = game.ui;
  const grade = u.grade;
  const early = isEarlyReader(grade);

  // Fit the 16:10 screen inside the space left over, limited by width or height.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    // The controls bar always keeps its height (hidden on the title screen), so the screen size doesn't jump.
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const ctl = controlsRef.current ? controlsRef.current.offsetHeight + 8 : 0;
      setScreenWidth(Math.floor(Math.max(120, Math.min(width, (height - ctl) * 1.6))));
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const screen = new SonarScreen(canvasRef.current!, game.scene);
    game.screen = screen;
    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) {
      (window as unknown as { __ss: SonarGame }).__ss = game;
      if (params.has("fast")) {
        game.fast = true;
        screen.speed = 8;
      }
    }
    screen.start();
    return () => {
      screen.stop();
      game.stopMatch();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [game, audio]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (u.phase === "over") setHighScore(loadProgress(GAME_ID).highScore);
  }, [u.phase]);

  const chooseGrade = useCallback(
    (g: Grade) => {
      rememberGrade(g);
      setReadAloud(readAloudPref(isEarlyReader(g)));
      game.setGrade(g);
    },
    [game],
  );

  const startGame = useCallback(() => {
    audio.unlock();
    audio.startMusic();
    rememberGrade(game.ui.grade);
    setPaused(false);
    game.setPaused(false);
    setReportSeat(0);
    void game.start(subject);
  }, [audio, game, subject]);

  const togglePause = useCallback(
    (force?: boolean) => {
      const ph = game.ui.phase;
      if (ph === "title" || ph === "over") return;
      setPaused((p) => {
        const np = force ?? !p;
        game.setPaused(np);
        if (np) stopSpeaking();
        return np;
      });
    },
    [game],
  );

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const replay = useCallback(() => {
    const q = game.ui.q;
    if (q) speakQuestion(q.q.passage ? `${q.q.passage} ${q.q.prompt}` : q.q.prompt, q.q.choices);
    else if (game.ui.challenge) speak(game.ui.challenge.spoken);
    else speak(game.ui.msg.text);
  }, [game]);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      const typing = document.activeElement === typeRef.current && !!typeRef.current;
      if (typing) return; // the TYPE box handles its own keys
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      const ph = game.ui.phase;
      if (ph === "title" || ph === "over") return;
      const k = ev.key.toLowerCase();
      const plain = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
      if (k === "p" || ev.key === "Escape") {
        if (ph === "powerpick" && ev.key === "Escape") game.cancelPower();
        else togglePause();
        return;
      }
      if (paused) return;
      const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      const arrow = arrows[ev.key];
      switch (ph) {
        case "cover":
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            game.coverReady();
          }
          return;
        case "question": {
          const q = game.ui.q!;
          const i = plain ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
          if (q.picked === null && i >= 0) {
            ev.preventDefault();
            game.answer(i);
          } else if (q.picked !== null && (ev.key === "Enter" || ev.key === " ")) {
            ev.preventDefault();
            game.continueQuestion();
          } else if (k === "r" && plain) replay();
          return;
        }
        case "powerpick": {
          const i = plain ? "123".indexOf(k) : -1;
          if (i >= 0) {
            ev.preventDefault();
            void game.choosePower(POWERS[i].id);
          }
          return;
        }
        case "place":
          if (arrow) {
            ev.preventDefault();
            game.placeMove(arrow[0], arrow[1]);
          } else if (k === "r" && plain) game.rotate();
          else if (k === "o" && plain) game.autoPlace();
          else if (ev.key === "Backspace") game.undoPlace();
          else if (ev.key === " " || ev.key === "Enter") {
            ev.preventDefault();
            if (game.ui.placing.current) game.placeHere();
            else game.ready();
          }
          return;
        case "aim":
        case "sonarAim":
          if (arrow) {
            ev.preventDefault();
            game.moveAim(arrow[0], arrow[1]);
          } else if (ev.key === " " || ev.key === "Enter") {
            ev.preventDefault();
            if (ph === "aim") game.fire();
            else game.confirmSonar();
          } else if (ph === "aim" && k === "u" && plain) game.openPower();
          else if (k === "r" && plain) replay();
          else if (ph === "aim" && plain && /[0-9(\-−]/.test(ev.key) && (game.ui.scheme === "q1" || game.ui.scheme === "q4") && typeRef.current) {
            // Start typing an ordered pair.
            ev.preventDefault();
            typeRef.current.focus();
            game.setTyped(ev.key === "(" ? "(" : `(${ev.key}`);
          }
          return;
      }
    };
    const blur = () => {
      const ph = game.ui.phase;
      if (ph === "aim" || ph === "busy") togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [game, audio, paused, togglePause, replay]);

  // Canvas pointer: tap or drag on the big board.
  const spotFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320;
    const y = ((e.clientY - r.top) / r.height) * 200;
    return spotAt(geomFor(game.ui.scheme, game.ui.size, "big"), x, y);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused) return;
    audio.unlock();
    const at = spotFromEvent(e);
    if (game.ui.phase === "place") {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      game.placePointer("down", at);
    } else if (at && (game.ui.phase === "aim" || game.ui.phase === "sonarAim")) game.tapSpot(at);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (game.ui.phase === "place" && e.buttons) game.placePointer("move", spotFromEvent(e));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (game.ui.phase === "place") game.placePointer("up", spotFromEvent(e));
  };

  const playing = u.phase !== "title" && u.phase !== "over";
  const seat = u.seat;
  const st = u.stats[u.mode === "pass" ? seat : 0];
  const charge = u.charge[u.mode === "pass" ? seat : 0] ?? 0;
  const need = u.chargeNeeded[0];
  const plane = u.scheme === "q1" || u.scheme === "q4";
  const hideInfo = u.phase === "cover";
  const aimText = u.phase === "sonarAim" ? formatCoord(u.scheme, u.sonarAim) : formatCoord(u.scheme, u.aim);
  // A coordinate challenge takes the message line (or a second line while a power-up result shows).
  const chShow = !!u.challenge && !hideInfo && (u.phase === "aim" || u.phase === "sonarAim" || u.phase === "powerpick" || u.phase === "question");
  const chInline = chShow && u.msg.tone === "info" && u.phase !== "question";
  const showAim = u.phase === "aim" || u.phase === "sonarAim" || u.phase === "question" || u.phase === "powerpick";

  return (
    <div className={`ss-root ${early ? "early" : ""}`}>
      <div className="ss-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="ss-tools">
          {playing && u.mode === "cpu" && (
            <button onClick={() => game.setCpuLevel(AI_LEVELS[(AI_LEVELS.indexOf(u.cpuLevel) + 1) % 3])} title="Change the computer's skill">
              CPU: {u.cpuLevel.toUpperCase()}
            </button>
          )}
          {playing && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="ss-cabinet">
        <div className="ss-hud ss-pixel">
          <div><span className="lbl">{u.mode === "pass" ? `P${seat + 1}` : "Score"}</span><span className="val">{hideInfo ? "------" : String(st.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, u.mode === "cpu" ? u.stats[0].score : 0)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Shots</span><span className="val">{hideInfo ? "--" : st.shots}</span></div>
          <div><span className="lbl">Hits</span><span className="val">{hideInfo ? "--" : st.hits}</span></div>
          <div className="power-meter" title="Power-up charge">
            <span className="lbl">Power</span>
            <span className="val">
              {Array.from({ length: need }, (_, i) => (
                <span key={i} className={!hideInfo && i < charge ? "on" : "off"}>▮</span>
              ))}
            </span>
          </div>
        </div>

        <div className={`ss-banner ${u.msg.tone}`}>
          <div className="head ss-pixel">
            <span className="kind">
              {u.phase === "title" && "SONAR SQUAD"}
              {u.phase === "place" && (u.mode === "pass" ? `PLAYER ${seat + 1}: PLACE YOUR FLEET` : "PLACE YOUR FLEET")}
              {u.phase === "cover" && "PASS THE DEVICE"}
              {(u.phase === "aim" || u.phase === "question" || u.phase === "powerpick" || u.phase === "sonarAim" || u.phase === "busy") &&
                (u.mode === "pass" ? `PLAYER ${seat + 1} · TURN ${u.turn}` : seat === 0 ? `YOUR TURN · ${u.turn}` : `ENEMY TURN · ${u.turn}`)}
              {u.phase === "over" && "MISSION OVER"}
            </span>
            <span className="std">{gradeLabel(grade)} · {schemeFor(grade) === "picture" ? "PICTURE GRID" : schemeFor(grade) === "letters" ? "LETTER-NUMBER GRID" : schemeFor(grade) === "q1" ? "QUADRANT I" : "FOUR QUADRANTS"}</span>
          </div>
          <div className="row">
            {speechSupported() && (
              <button type="button" className={`ss-speak ${readAloud ? "on" : ""}`} onClick={replay} aria-label="Read it aloud" title="Read aloud (R)">
                <SpeakerIcon />
              </button>
            )}
            <span className="msg">
              {hideInfo ? (
                "Pass the device. No peeking at the other player's screen!"
              ) : u.phase === "title" ? (
                schemeLine(u.scheme)
              ) : chInline ? (
                <span className="challenge">
                  <b className="ss-pixel">★ CHALLENGE</b> {u.challenge!.text}
                </span>
              ) : (
                u.msg.text
              )}
            </span>
            {showAim && !hideInfo && (
              <span className="aim ss-pixel" aria-live="polite">
                <small>{u.phase === "sonarAim" ? "SONAR" : "AIM"}</small> {aimText}
              </span>
            )}
          </div>
          {chShow && !chInline && (
            <div className="challenge ss-pixel-ish">
              <b className="ss-pixel">★ CHALLENGE</b> {u.challenge!.text}
            </div>
          )}
        </div>

        <div className="ss-fill" ref={stageRef}>
        <div className="ss-stage">
          <div className="ss-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas
              ref={canvasRef}
              aria-label="Sonar Squad game screen"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onContextMenu={(e) => e.preventDefault()}
            />

            {u.phase === "title" && (
              <TitleScreen
                grade={grade}
                subject={subject}
                mode={u.mode}
                level={u.cpuLevel}
                highScore={highScore}
                onGrade={chooseGrade}
                onSubject={setSubject}
                onMode={(m) => game.setMode(m)}
                onLevel={(l) => game.setCpuLevel(l)}
                onStart={startGame}
              />
            )}

            {u.phase === "cover" && (
              <div className="ss-overlay cover">
                <div className="ss-panel center" role="dialog" aria-label="Pass the device">
                  <div className="ss-title ss-pixel small">PASS TO PLAYER {u.coverSeat + 1}</div>
                  <div className="ss-sub ss-pixel" style={{ color: "var(--ss-yellow)" }}>DON'T PEEK, PLAYER {2 - u.coverSeat}!</div>
                  <div className="ss-help center" style={{ margin: "14px 0" }}>
                    {u.coverWhy === "place"
                      ? `Player ${u.coverSeat + 1}: hide your fleet where only you can see it.`
                      : `Player ${u.coverSeat + 1}: your turn. Tap READY when only you can see the screen.`}
                  </div>
                  <button className="ss-cta" autoFocus onClick={() => game.coverReady()}>
                    I'm Player {u.coverSeat + 1} — ready ▶
                  </button>
                </div>
              </div>
            )}

            {u.phase === "question" && u.q && (
              <QuestionPanel
                game={game}
                early={early}
                onSpeak={() => speakQuestion(u.q!.q.passage ? `${u.q!.q.passage} ${u.q!.q.prompt}` : u.q!.q.prompt, u.q!.q.choices)}
              />
            )}

            {u.phase === "powerpick" && (
              <div className="ss-overlay">
                <div className="ss-panel" role="dialog" aria-label="Choose a power-up">
                  <div className="ss-h ss-pixel">⚡ POWER-UP READY — PICK ONE, THEN ANSWER A HARDER QUESTION</div>
                  <div className="ss-powers">
                    {POWERS.map((p, i) => {
                      const off = p.id === "repair" && !u.canRepair;
                      return (
                        <button key={p.id} className={`ss-power ${off ? "off" : ""}`} onClick={() => void game.choosePower(p.id)} disabled={off}>
                          <span className="key ss-pixel">{i + 1}</span>
                          <span className="icon">{p.icon}</span>
                          <b className="ss-pixel">{p.name}</b>
                          <small>{off ? "No damaged ship to fix yet." : p.what}</small>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ textAlign: "right", marginTop: 10 }}>
                    <button className="ss-cta ghost" onClick={() => game.cancelPower()}>Not now (Esc)</button>
                  </div>
                </div>
              </div>
            )}

            {paused && playing && (
              <div className="ss-overlay cover">
                <div style={{ textAlign: "center" }}>
                  <div className="ss-title ss-pixel">PAUSED</div>
                  <div style={{ marginTop: 20 }}>
                    <button className="ss-cta" onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {u.phase === "over" && (
              <MissionReport
                stats={u.stats}
                mode={u.mode}
                winner={u.winner}
                grade={grade}
                seat={reportSeat}
                onSeat={setReportSeat}
                highScore={highScore}
                onAgain={startGame}
                onMenu={() => game.toTitle()}
              />
            )}
          </div>
        </div>

        <div className={`ss-controls show ${playing ? "" : "idle"} ${touch ? "touch" : ""}`} ref={controlsRef}>
          {u.phase === "place" && (
            <>
              <button className="ss-ctl" onClick={() => game.rotate()}>↻ ROTATE <kbd>R</kbd></button>
              <button className="ss-ctl" onClick={() => game.autoPlace()}>AUTO <kbd>O</kbd></button>
              <button className="ss-ctl" onClick={() => game.undoPlace()} disabled={!u.placing.placed.length}>UNDO</button>
              <span className="ss-legend">
                {u.placing.current ? `Placing: ${FLEET.find((f) => f.id === u.placing.current)!.name} (${FLEET.find((f) => f.id === u.placing.current)!.len})` : "All 5 ships placed"}
              </span>
              <button className="ss-ctl go" onClick={() => game.ready()} disabled={u.placing.placed.length !== FLEET.length}>READY ▶</button>
            </>
          )}
          {(u.phase === "aim" || u.phase === "busy" || u.phase === "question" || u.phase === "powerpick") && (
            <>
              <button className={`ss-ctl power ${game.powerReady ? "ready" : ""}`} onClick={() => game.openPower()} disabled={u.phase !== "aim"}>
                ⚡ POWER-UP <kbd>U</kbd>
                <span className="meter">
                  {Array.from({ length: need }, (_, i) => (
                    <span key={i} className={i < charge ? "on" : "off"}>▮</span>
                  ))}
                </span>
              </button>
              {plane ? (
                <form
                  className="ss-type"
                  onSubmit={(e) => {
                    e.preventDefault();
                    game.fireTyped();
                  }}
                >
                  <label className="ss-pixel" htmlFor="ss-type">TYPE</label>
                  <input
                    id="ss-type"
                    ref={typeRef}
                    value={u.typed}
                    placeholder={u.scheme === "q4" ? "(3, −2)" : "(3, 7)"}
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={u.phase !== "aim"}
                    onChange={(e) => game.setTyped(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") (e.target as HTMLInputElement).blur();
                    }}
                  />
                </form>
              ) : (
                <span className="ss-legend">{notationHelp(u.scheme)}</span>
              )}
              <button className="ss-ctl fire" onClick={() => game.fire()} disabled={u.phase !== "aim"}>
                FIRE <span className="tgt">{formatCoord(u.scheme, u.aim)}</span>
              </button>
            </>
          )}
          {u.phase === "sonarAim" && (
            <>
              <span className="ss-legend">Pick the middle of the 3×3 sonar area: tap it, or arrows + Space.</span>
              <button className="ss-ctl fire" onClick={() => game.confirmSonar()}>
                PING <span className="tgt">{formatCoord(u.scheme, u.sonarAim)}</span>
              </button>
            </>
          )}
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

function QuestionPanel({ game, early, onSpeak }: { game: SonarGame; early: boolean; onSpeak: () => void }) {
  const qs = game.ui.q!;
  const q = qs.q;
  const shot = qs.purpose === "shot";
  const right = qs.picked !== null && qs.picked === q.answer;
  const head = shot
    ? qs.retry
      ? "◆ SECOND TRY — ANSWER TO ARM THE TORPEDO"
      : "◆ ARM THE TORPEDO — ANSWER TO FIRE"
    : `⚡ POWER-UP QUESTION: ${qs.power === "sonar" ? "SONAR SWEEP" : qs.power === "double" ? "DOUBLE SHOT" : "REPAIR CREW"}`;
  return (
    <div className="ss-overlay">
      <div className={`ss-panel ${shot ? "shot" : "power"}`} role="dialog" aria-label={shot ? "Shot question" : "Power-up question"}>
        <div className="ss-h ss-pixel">{head}</div>
        <div className="ss-tagrow">
          <span className={`ss-tag ss-pixel ${q.subject}`}>{SUBJECT_LABELS[q.subject]}</span>
          <span className="ss-tag ss-pixel std">{q.standard} · {q.skill}</span>
          {speechSupported() && (
            <button className="ss-speak" onClick={onSpeak} aria-label="Read the question aloud">
              <SpeakerIcon />
            </button>
          )}
        </div>
        {q.passage && <div className="ss-passage">{q.passage}</div>}
        <div className="ss-prompt">{q.prompt}</div>
        <div className={`ss-choices ${early ? "big" : ""}`}>
          {q.choices.map((c, i) => {
            const state = qs.picked === null ? "" : i === q.answer ? "right" : i === qs.picked ? "wrong" : "";
            return (
              <button key={i} className={`ss-btn ${state}`} disabled={qs.picked !== null} onClick={() => game.answer(i)}>
                <span className="key">{"ABCD"[i]}</span>
                <span>{c}</span>
              </button>
            );
          })}
        </div>
        {qs.picked !== null && (
          <div className="ss-feedback">
            {right ? (
              <div className="verdict ok">✔ CORRECT! {shot ? "TORPEDO ARMED" : "POWER-UP EARNED"}</div>
            ) : (
              <div className="verdict no">
                ✘ NOT QUITE — THE ANSWER IS {"ABCD"[q.answer]}
                {shot ? (qs.willRetry ? " · ONE MORE TRY" : " · SONAR JAMMED, SHOT LOST") : " · NO POWER-UP, KEEP PLAYING"}
              </div>
            )}
            <div>{q.explanation}</div>
            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button className="ss-cta" autoFocus onClick={() => game.continueQuestion()}>
                {right ? (shot ? "Aim ▶" : "Use it ▶") : qs.willRetry ? "Try another ▶" : "OK ▶"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TitleScreen({
  grade, subject, mode, level, highScore, onGrade, onSubject, onMode, onLevel, onStart,
}: {
  grade: Grade; subject: GameMode; mode: PlayMode; level: AiLevel; highScore: number;
  onGrade: (g: Grade) => void; onSubject: (s: GameMode) => void; onMode: (m: PlayMode) => void; onLevel: (l: AiLevel) => void; onStart: () => void;
}) {
  const fromArcade = gradeFromArcade();
  const s = schemeFor(grade);
  return (
    <div className="ss-overlay" style={{ background: "rgba(3,8,24,0.72)" }}>
      <div className="ss-panel title">
        <div className="ss-title ss-pixel">SONAR SQUAD</div>
        <div className="ss-sub ss-pixel">SPIDERBEN10'S ARCADE · FIND THE FLEET BY ITS COORDINATES</div>
        {fromArcade ? (
          <div className="ss-sub ss-pixel ss-badge" style={{ marginTop: 10 }}>
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="ss-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`ss-grade ss-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="ss-help center" style={{ marginTop: 6 }}>{schemeLine(s)}</div>
        <div className="ss-label ss-pixel">QUESTIONS</div>
        <div className="ss-opts five" role="radiogroup" aria-label="Subject">
          {SUBJECTS.map((x) => (
            <button key={x.id} role="radio" aria-checked={x.id === subject} className={`ss-opt ${x.id === subject ? "on" : ""}`} onClick={() => onSubject(x.id)}>
              {x.label}
              <small>{x.note}</small>
            </button>
          ))}
        </div>
        <div className="ss-label ss-pixel">PLAYERS</div>
        <div className="ss-opts two" role="radiogroup" aria-label="Players">
          <button role="radio" aria-checked={mode === "cpu"} className={`ss-opt ${mode === "cpu" ? "on" : ""}`} onClick={() => onMode("cpu")}>
            1 PLAYER<small>You vs the computer</small>
          </button>
          <button role="radio" aria-checked={mode === "pass"} className={`ss-opt ${mode === "pass" ? "on" : ""}`} onClick={() => onMode("pass")}>
            2 PLAYERS<small>Pass and play on this device</small>
          </button>
        </div>
        {mode === "cpu" && (
          <>
            <div className="ss-label ss-pixel">COMPUTER</div>
            <div className="ss-opts three" role="radiogroup" aria-label="Computer level">
              {AI_LEVELS.map((l) => (
                <button key={l} role="radio" aria-checked={l === level} className={`ss-opt ${l === level ? "on" : ""}`} onClick={() => onLevel(l)}>
                  {l.toUpperCase()}
                  <small>{LEVEL_NOTE[l]}</small>
                </button>
              ))}
            </div>
          </>
        )}
        <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
          <button className="ss-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="ss-help">
          Hide your 5 ships, then take turns firing. Before every shot, answer a quick question ({shotGrade(grade) === grade ? gradeLabel(grade) : gradeLabel(shotGrade(grade))} level) to arm the torpedo; a
          wrong answer jams your sonar and the shot is lost{isEarlyReader(grade) ? " (K–2 get a second try)" : ""}. Every {isEarlyReader(grade) ? 2 : 3} turns the <span className="y">POWER-UP</span> charges:
          answer a harder question for a sonar sweep, a double shot or a repair. Sink every enemy ship to win!
          <br />
          <kbd>←↑↓→</kbd> aim · <kbd>Space</kbd>/<kbd>Enter</kbd> fire · {s === "q1" || s === "q4" ? <>type <kbd>(3, −2)</kbd> + <kbd>Enter</kbd> · </> : null}
          <kbd>U</kbd> power-up · <kbd>1</kbd>–<kbd>4</kbd>/<kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>R</kbd> rotate (placing) / read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute. Or just tap!
        </div>
        <div className="ss-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function groupBy(log: LogEntry[], cat: LogEntry["cat"]) {
  const m = new Map<string, { std: string; skill: string; subject: string; n: number; c: number }>();
  for (const l of log.filter((x) => x.cat === cat)) {
    const key = `${l.standard}|${l.skill}`;
    const cur = m.get(key) ?? { std: l.standard, skill: l.skill, subject: l.subject, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    m.set(key, cur);
  }
  return [...m.values()];
}

function ResultTable({ title, rows, empty }: { title: string; rows: ReturnType<typeof groupBy>; empty: string }) {
  const n = rows.reduce((a, r) => a + r.n, 0);
  const c = rows.reduce((a, r) => a + r.c, 0);
  return (
    <div className="ss-report-block">
      <div className="ss-label ss-pixel">{title} {n ? `· ${c}/${n} (${Math.round((100 * c) / n)}%)` : ""}</div>
      {rows.length ? (
        <table className="ss-report-table">
          <thead>
            <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={`${v.std}|${v.skill}`}>
                <td className="c">{v.std}</td>
                <td>{v.skill}</td>
                <td style={{ color: v.c === v.n ? "var(--ss-green)" : v.c / v.n >= 0.75 ? "var(--ss-yellow)" : "var(--ss-red)" }}>{v.c}/{v.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="ss-help dim">{empty}</div>
      )}
    </div>
  );
}

function MissionReport({
  stats, mode, winner, grade, seat, onSeat, highScore, onAgain, onMenu,
}: {
  stats: SeatStats[]; mode: PlayMode; winner: number; grade: Grade; seat: number; onSeat: (s: number) => void; highScore: number;
  onAgain: () => void; onMenu: () => void;
}) {
  const s = stats[mode === "pass" ? seat : 0];
  const coord = groupBy(s.log, "coord");
  const shotQ = groupBy(s.log, "shot");
  const powQ = groupBy(s.log, "power");
  const practice = [...coord, ...shotQ, ...powQ].filter((v) => v.c / v.n < 0.75);
  const acc = s.shots ? Math.round((100 * s.hits) / s.shots) : 0;
  const head = mode === "pass" ? `PLAYER ${winner + 1} WINS!` : winner === 0 ? "VICTORY! ENEMY FLEET SUNK" : "YOUR FLEET WAS SUNK";
  return (
    <div className="ss-overlay">
      <div className="ss-panel report">
        <div className="ss-h ss-pixel" style={{ color: winner === 0 || mode === "pass" ? "var(--ss-green)" : "var(--ss-red)" }}>{head} — MISSION REPORT</div>
        {mode === "pass" && (
          <div className="ss-tabs" role="tablist">
            {stats.map((x, i) => (
              <button key={i} role="tab" aria-selected={i === seat} className={`ss-opt ${i === seat ? "on" : ""}`} onClick={() => onSeat(i)}>
                {x.name.toUpperCase()}{i === winner ? " ★" : ""}
              </button>
            ))}
          </div>
        )}
        <div className="ss-help big">
          {mode === "pass" ? `${s.name}: ` : ""}Score <b className="y">{s.score}</b>
          {mode === "cpu" && s.score >= highScore && s.score > 0 ? " — NEW HIGH SCORE!" : ""} · {gradeLabel(grade)}
        </div>
        <div className="ss-help">
          Shots <b className="c">{s.shots}</b> · Hits <b className="c">{s.hits}</b> · Accuracy <b className="c">{acc}%</b> · Ships sunk <b className="c">{s.sunk.length}/5</b>
          {s.sunk.length ? ` (${s.sunk.join(", ")})` : ""} · Jammed turns {s.jams} · Power-ups earned {s.powers}
        </div>
        <ResultTable title="COORDINATE SKILLS (CHALLENGES)" rows={coord} empty="No coordinate challenges this game." />
        <ResultTable title="SHOT QUESTIONS (QUICK)" rows={shotQ} empty="No shot questions answered." />
        <ResultTable title="POWER-UP QUESTIONS (HARDER)" rows={powQ} empty="No power-up questions tried. Watch the POWER meter!" />
        {practice.length > 0 && (
          <div className="ss-help" style={{ marginTop: 8 }}>
            <span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 14, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="ss-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="ss-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

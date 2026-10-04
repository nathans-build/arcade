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
import { Diagram } from "@/splash/Diagram";
import { GAME_ID, SplashGame, type LogEntry, type PlayMode, type Seat } from "@/splash/game";
import { bandOf, hitBox } from "@/splash/levels";
import { MAX_ANGLE, MAX_POWER, MIN_ANGLE, MIN_POWER, speedText } from "@/splash/physics";
import { SplashScreen } from "@/splash/render";
import "@/splash/sa.css";

/** Splash Arc's own 16-step bassline: a bouncy, splashy loop (Hz; 0 = rest). */
const BASS = [131, 0, 196, 0, 165, 0, 196, 220, 147, 0, 220, 0, 175, 0, 220, 247];

const BAND_LINE: Record<string, string> = {
  K2: "Shapes and positions: name the 2-D or 3-D shape to aim, then splash it!",
  "3": "Quadrilaterals, right angles, perimeter and area pick your target.",
  "4": "Read and set the launch angle in degrees on the protractor.",
  "5": "Targets sit at (x, y) on the grid; tanks need the right volume.",
  "6": "Areas, nets, surface area and coordinate polygons choose the target.",
  "7": "Complements, supplements, vertical angles and cross-sections set your aim.",
  "8": "Pythagoras, parallel lines, reflections and cone/cylinder/sphere volumes.",
  HS: "Trig, parabolas, the projectile equation, volume and Cavalieri — even on Mars.",
};

export default function SplashArc() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 118), []);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("4"))));
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const game = useMemo(
    () =>
      new SplashGame(
        audio,
        {
          say: (t) => {
            if (readAloudRef.current && t) speak(t);
          },
          sayQuestion: (p, c) => {
            if (readAloudRef.current) speakQuestion(p, c);
          },
          onChange: () => bump(),
        },
        initialGrade("4"),
      ),
    [audio],
  );
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [reportSeat, setReportSeat] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ w: number; below: boolean } | null>(null);
  const drag = useRef(false);
  const u = game.ui;
  const grade = u.grade;
  const early = isEarlyReader(grade);
  const k2 = bandOf(grade) === "K2";

  // Fit the 16:10 screen in the space left; if lots of room is left below (portrait), the question goes there.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const ctl = controlsRef.current ? controlsRef.current.offsetHeight + 8 : 0;
      let w = Math.floor(Math.max(120, Math.min(width, (height - ctl) * 1.6)));
      const free = height - ctl - w / 1.6;
      const below = free >= 250 && width < 1000;
      if (below) w = Math.floor(Math.max(120, Math.min(width, (height - ctl - 250) * 1.6)));
      setFit({ w, below });
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const screen = new SplashScreen(canvasRef.current!, game.scene);
    screen.onTick = (dt) => game.tick(dt);
    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) {
      (window as unknown as { __sa: SplashGame }).__sa = game;
      if (params.has("fast")) game.fast = true;
    }
    screen.start();
    return () => {
      screen.stop();
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
    game.start();
  }, [audio, game]);

  const playing = u.phase !== "title" && u.phase !== "over";

  const togglePause = useCallback(
    (force?: boolean) => {
      if (!playing) return;
      setPaused((p) => {
        const np = force ?? !p;
        game.setPaused(np);
        if (np) stopSpeaking();
        return np;
      });
    },
    [game, playing],
  );

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const replay = useCallback(() => {
    const st = game.ui;
    if (st.phase === "transmission" && st.trans) speakQuestion(st.trans.q.passage ? `${st.trans.q.passage} ${st.trans.q.prompt}` : st.trans.q.prompt, st.trans.q.choices);
    else if (st.q && st.q.picked === null) speakQuestion(st.q.q.prompt, st.q.q.choices);
    else if (st.q && st.q.picked !== null) speak(st.q.q.explanation);
    else speak(st.msg.text);
  }, [game]);

  // Keyboard
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.key === "m" || ev.key === "M") {
        setMuted(audio.toggleMute());
        return;
      }
      const ph = game.ui.phase;
      if (ph === "title" || ph === "over") return;
      const k = ev.key.toLowerCase();
      const plain = ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
      if (k === "p" || ev.key === "Escape") {
        togglePause();
        return;
      }
      if (paused) return;
      if (k === "r" && plain) {
        replay();
        return;
      }
      const ansIdx = plain ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      const go = ev.key === "Enter" || ev.key === " ";
      if (ph === "pass") {
        if (go) {
          ev.preventDefault();
          game.passReady();
        }
        return;
      }
      if (ph === "transmission") {
        const t = game.ui.trans;
        if (t && t.picked === null && ansIdx >= 0) {
          ev.preventDefault();
          game.answer(ansIdx);
        } else if (t && t.picked !== null && go) {
          ev.preventDefault();
          game.continueTrans();
        }
        return;
      }
      if (ph === "question" && game.ui.q && game.ui.q.picked === null) {
        if (ansIdx >= 0) {
          ev.preventDefault();
          game.answer(ansIdx);
        }
        return;
      }
      if (ph === "question" || ph === "aim") {
        const step = ev.shiftKey ? 5 : 1;
        if (ev.key === "ArrowLeft") {
          ev.preventDefault();
          game.nudge(step, 0);
        } else if (ev.key === "ArrowRight") {
          ev.preventDefault();
          game.nudge(-step, 0);
        } else if (ev.key === "ArrowUp") {
          ev.preventDefault();
          game.nudge(0, step);
        } else if (ev.key === "ArrowDown") {
          ev.preventDefault();
          game.nudge(0, -step);
        } else if (go) {
          ev.preventDefault();
          if (ph === "question") game.continueQuestion();
          else game.fire();
        }
      }
    };
    const blur = () => {
      if (game.ui.phase === "aim" || game.ui.phase === "flight") togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [game, audio, paused, togglePause, replay]);

  // Canvas pointer: drag from the launcher to aim; tap a target to answer a "pick" question.
  const aimFrom = (x: number, y: number) => {
    const lv = game.lv;
    if (!lv) return;
    const dx = x - lv.launch.x;
    const dy = lv.launch.y - y;
    if (Math.hypot(dx, dy) < 4) return;
    game.setAngle((Math.atan2(dy, dx) * 180) / Math.PI);
    game.setPower(Math.hypot(dx, dy) * 1.25);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused) return;
    audio.unlock();
    const lv = game.lv;
    if (!lv) return;
    const [x, y] = SplashScreen.toLogical(e.currentTarget, e.clientX, e.clientY);
    const st = game.ui;
    if (st.phase === "question" && st.q && st.q.picked === null && st.q.q.effect.type === "pick") {
      const t = lv.targets.find((tt) => {
        const b = hitBox(tt);
        return x >= b.x - 4 && x <= b.x + b.w + 4 && y >= b.y - 12 && y <= b.y + b.h + 3;
      });
      if (t) game.answer(t.i);
      return;
    }
    if (st.phase === "question" && st.q && st.q.picked !== null) game.continueQuestion();
    if (game.ui.phase !== "aim") return;
    if (Math.hypot(x - lv.launch.x, y - lv.launch.y) < 60 || x < 120) {
      drag.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      aimFrom(x, y);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const [x, y] = SplashScreen.toLogical(e.currentTarget, e.clientX, e.clientY);
    aimFrom(x, y);
  };
  const onPointerUp = () => {
    drag.current = false;
  };

  const seat = u.seats[u.seat] ?? u.seats[0];
  const canAim = u.phase === "aim" || (u.phase === "question" && !!u.q && u.q.picked !== null);
  const showQ = u.phase === "question" && !!u.q;
  const dockBelow = !!fit?.below;
  const planetSpeed = game.lv ? speedText(u.power, game.lv.planet) : "";
  const angleTxt = u.hideAngle && u.phase === "question" ? "?°" : k2 ? "" : `${u.angle}°`;

  const questionPanel = showQ && (
    <ShotPanel
      game={game}
      early={early}
      below={dockBelow}
      onSpeak={() => speakQuestion(u.q!.q.prompt, u.q!.q.choices)}
    />
  );

  return (
    <div className={`sa-root ${early ? "early" : ""}`}>
      <div className="sa-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="sa-tools">
          {playing && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className="sa-cabinet">
        <div className="sa-hud sa-pixel">
          <div><span className="lbl">{u.mode === "pass" ? `P${u.seat + 1}` : "Score"}</span><span className="val">{String(seat.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, u.mode === "solo" ? u.seats[0].score : 0)).padStart(6, "0")}</span></div>
          <div><span className="lbl">Level</span><span className="val">{playing ? `${u.level + 1}/${u.levels}` : "-"}</span></div>
          <div title="Water balloons left"><span className="lbl">Balloons</span><span className="val balloons">{playing ? "●".repeat(Math.max(0, Math.min(10, u.balloons[u.seat] ?? 0))) || "0" : "-"}</span></div>
          <div><span className="lbl">Wind</span><span className="val">{!playing ? "-" : u.wind === 0 ? "CALM" : `${u.wind > 0 ? "→" : "←"}${Math.abs(u.wind).toFixed(1)}`}</span></div>
        </div>

        <div className={`sa-banner ${u.msg.tone}`}>
          <div className="head sa-pixel">
            <span className="kind">
              {u.phase === "title" ? "SPLASH ARC" : u.phase === "over" ? "MISSION OVER" : `${u.mode === "pass" ? `PLAYER ${u.seat + 1} · ` : ""}LEVEL ${u.level + 1} · ${u.levelTitle}`}
            </span>
            <span className="std">
              {gradeLabel(grade)}
              {playing && u.planet !== "EARTH" ? ` · ${u.planet} g` : ""}
              {playing ? ` · ${u.targetsLeft} TARGET${u.targetsLeft === 1 ? "" : "S"} LEFT` : ""}
            </span>
          </div>
          <div className="row">
            {speechSupported() && (
              <button type="button" className={`sa-speak ${readAloud ? "on" : ""}`} onClick={replay} aria-label="Read it aloud" title="Read aloud (R)">
                <SpeakerIcon />
              </button>
            )}
            <span className="msg">{u.phase === "title" ? BAND_LINE[bandOf(grade)] : u.msg.text}</span>
            {playing && (
              <span className="aim sa-pixel" aria-live="polite">
                {!k2 && <><small>ANGLE</small> {angleTxt} </>}
                <small>POWER</small> {u.power}
                {bandOf(grade) === "HS" && <small> · v {planetSpeed} m/s</small>}
              </span>
            )}
          </div>
        </div>

        <div className="sa-fill" ref={stageRef}>
          <div className="sa-stage">
            <div className="sa-screen" style={fit ? { width: fit.w } : undefined}>
              <canvas
                ref={canvasRef}
                aria-label="Splash Arc game screen"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onContextMenu={(e) => e.preventDefault()}
              />
              {u.phase === "title" && (
                <TitleScreen grade={grade} mode={u.mode} highScore={highScore} onGrade={chooseGrade} onMode={(m) => game.setMode(m)} onStart={startGame} />
              )}
              {!dockBelow && questionPanel}
              {u.phase === "pass" && (
                <div className="sa-overlay">
                  <div className="sa-panel center" role="dialog" aria-label="Next player">
                    <div className="sa-title sa-pixel small">PLAYER {u.seat + 1}</div>
                    <div className="sa-help center" style={{ margin: "12px 0" }}>
                      Your turn! {u.seats[u.seat].name} has {u.balloons[u.seat]} balloon{u.balloons[u.seat] === 1 ? "" : "s"} this level.
                    </div>
                    <button className="sa-cta" autoFocus onClick={() => game.passReady()}>Ready ▶</button>
                  </div>
                </div>
              )}
              {u.phase === "transmission" && u.trans && <TransmissionPanel game={game} early={early} />}
              {paused && playing && (
                <div className="sa-overlay solid">
                  <div style={{ textAlign: "center" }}>
                    <div className="sa-title sa-pixel">PAUSED</div>
                    <div style={{ marginTop: 20 }}>
                      <button className="sa-cta" onClick={() => togglePause(false)}>Resume</button>
                    </div>
                  </div>
                </div>
              )}
              {u.phase === "over" && (
                <MissionReport seats={u.seats} mode={u.mode} grade={grade} seat={reportSeat} onSeat={setReportSeat} highScore={highScore} onAgain={startGame} onMenu={() => game.toTitle()} />
              )}
            </div>
          </div>
          {dockBelow && questionPanel}

          <div className={`sa-controls ${playing ? "" : "idle"} ${touch ? "touch" : ""}`} ref={controlsRef}>
            <div className="sa-ctlgroup">
              <span className="sa-ctllbl sa-pixel">{k2 ? "AIM" : "ANGLE"}</span>
              <button className="sa-ctl small" aria-label="Aim lower" onClick={() => game.nudge(-1, 0)} disabled={!canAim}>◢</button>
              <input
                type="range"
                className="sa-range angle"
                min={MIN_ANGLE}
                max={MAX_ANGLE}
                value={u.angle}
                disabled={!canAim}
                aria-label="Launch angle"
                onChange={(e) => {
                  if (game.ui.phase === "question") game.continueQuestion();
                  game.setAngle(Number(e.target.value));
                }}
              />
              <button className="sa-ctl small" aria-label="Aim higher" onClick={() => game.nudge(1, 0)} disabled={!canAim}>◤</button>
              {!k2 && <span className="sa-val sa-pixel">{angleTxt}</span>}
            </div>
            <div className="sa-ctlgroup">
              <span className="sa-ctllbl sa-pixel">POWER</span>
              <button className="sa-ctl small" aria-label="Less power" onClick={() => game.nudge(0, -1)} disabled={!canAim}>−</button>
              <input
                type="range"
                className="sa-range power"
                min={MIN_POWER}
                max={MAX_POWER}
                value={u.power}
                disabled={!canAim}
                aria-label="Power"
                onChange={(e) => {
                  if (game.ui.phase === "question") game.continueQuestion();
                  game.setPower(Number(e.target.value));
                }}
              />
              <button className="sa-ctl small" aria-label="More power" onClick={() => game.nudge(0, 1)} disabled={!canAim}>+</button>
              <span className="sa-val sa-pixel">{k2 ? (u.power < 40 ? "LOW" : u.power < 70 ? "MID" : "HIGH") : u.power}</span>
            </div>
            <button className="sa-ctl fire" onClick={() => game.fire()} disabled={!canAim}>
              FIRE ▶<small>Space</small>
            </button>
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

function ShotPanel({ game, early, below, onSpeak }: { game: SplashGame; early: boolean; below: boolean; onSpeak: () => void }) {
  const st = game.ui.q!;
  const q = st.q;
  const picked = st.picked;
  const right = picked !== null && picked === q.answer;
  return (
    <div className={`sa-dock ${below ? "below" : ""} ${picked !== null ? "answered" : ""}`} role="dialog" aria-label="Aiming question">
      <div className="sa-tagrow">
        <span className="sa-tag sa-pixel geo">GEOMETRY AIM</span>
        <span className="sa-tag sa-pixel std">{q.standard} · {q.skill}</span>
        {speechSupported() && (
          <button className="sa-speak" onClick={onSpeak} aria-label="Read the question aloud">
            <SpeakerIcon />
          </button>
        )}
      </div>
      <div className={`sa-qbody ${q.diagram ? "has-dia" : ""}`}>
        {q.diagram && (
          <div className="sa-dia">
            <Diagram d={q.diagram} />
          </div>
        )}
        <div className="sa-qmain">
          <div className="sa-prompt">{q.prompt}</div>
          {picked === null ? (
            <div className={`sa-choices ${early ? "big" : ""} ${q.icons ? "icons" : ""}`}>
              {q.choices.map((c, i) => (
                <button key={i} className="sa-btn" onClick={() => game.answer(i)}>
                  <span className="key">{"ABCD"[i]}</span>
                  {q.icons ? <Diagram d={q.icons[i]} icon /> : <span>{c}</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="sa-feedback">
              <div className={`verdict ${right ? "ok" : "no"}`}>
                {right ? "✔ CORRECT! GUIDE LINE ON" : `✘ NOT QUITE — THE ANSWER IS ${"ABCD"[q.answer]}${q.icons ? "" : `: ${q.choices[q.answer]}`}`}
              </div>
              <div>{q.explanation}</div>
              <div className="sa-feedrow">
                <span className="dim">{right ? "Fine-tune with ←→↑↓ or the sliders." : "Your aim uses your answer. Adjust it if you like, then fire."}</span>
                <button className="sa-cta" autoFocus onClick={() => game.continueQuestion()}>Aim ▶</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransmissionPanel({ game, early }: { game: SplashGame; early: boolean }) {
  const st = game.ui.trans!;
  const q = st.q;
  const right = st.picked !== null && st.picked === q.answer;
  return (
    <div className="sa-overlay">
      <div className="sa-panel trans" role="dialog" aria-label="Transmission question">
        <div className="sa-h sa-pixel">◆ INCOMING TRANSMISSION — CHECKPOINT</div>
        <div className="sa-tagrow">
          <span className="sa-tag sa-pixel math">MATH</span>
          <span className="sa-tag sa-pixel std">{q.standard} · {q.skill}</span>
          {speechSupported() && (
            <button className="sa-speak" onClick={() => speakQuestion(q.passage ? `${q.passage} ${q.prompt}` : q.prompt, q.choices)} aria-label="Read the question aloud">
              <SpeakerIcon />
            </button>
          )}
        </div>
        {q.passage && <div className="sa-passage">{q.passage}</div>}
        <div className="sa-prompt">{q.prompt}</div>
        <div className={`sa-choices ${early ? "big" : ""}`}>
          {q.choices.map((c, i) => {
            const s = st.picked === null ? "" : i === q.answer ? "right" : i === st.picked ? "wrong" : "";
            return (
              <button key={i} className={`sa-btn ${s}`} disabled={st.picked !== null} onClick={() => game.answer(i)}>
                <span className="key">{"ABCD"[i]}</span>
                <span>{c}</span>
              </button>
            );
          })}
        </div>
        {st.picked !== null && (
          <div className="sa-feedback">
            <div className={`verdict ${right ? "ok" : "no"}`}>{right ? "✔ CORRECT! +50" : `✘ NOT QUITE — THE ANSWER IS ${"ABCD"[q.answer]}`}</div>
            <div>{q.explanation}</div>
            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button className="sa-cta" autoFocus onClick={() => game.continueTrans()}>
                {game.ui.level + 1 < game.ui.levels ? "Next level ▶" : "Mission report ▶"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TitleScreen({ grade, mode, highScore, onGrade, onMode, onStart }: { grade: Grade; mode: PlayMode; highScore: number; onGrade: (g: Grade) => void; onMode: (m: PlayMode) => void; onStart: () => void }) {
  const fromArcade = gradeFromArcade();
  return (
    <div className="sa-overlay" style={{ background: "rgba(3,8,24,0.72)" }}>
      <div className="sa-panel title">
        <div className="sa-title sa-pixel">SPLASH ARC</div>
        <div className="sa-sub sa-pixel">SPIDERBEN10'S ARCADE · AIM WITH GEOMETRY, SPLASH WITH WATER</div>
        {fromArcade ? (
          <div className="sa-sub sa-pixel sa-badge" style={{ marginTop: 10 }}>
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <div className="sa-grades" role="radiogroup" aria-label="Grade">
            {GRADES.map((g) => (
              <button key={g} role="radio" aria-checked={g === grade} className={`sa-grade sa-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="sa-help center" style={{ marginTop: 6 }}>{BAND_LINE[bandOf(grade)]}</div>
        <div className="sa-label sa-pixel">PLAYERS</div>
        <div className="sa-opts two" role="radiogroup" aria-label="Players">
          <button role="radio" aria-checked={mode === "solo"} className={`sa-opt ${mode === "solo" ? "on" : ""}`} onClick={() => onMode("solo")}>
            1 PLAYER<small>Water every target</small>
          </button>
          <button role="radio" aria-checked={mode === "pass"} className={`sa-opt ${mode === "pass" ? "on" : ""}`} onClick={() => onMode("pass")}>
            2 PLAYERS<small>Pass and play, take turns</small>
          </button>
        </div>
        <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
          <button className="sa-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <div className="sa-help">
          Campfires, thirsty gardens, bells, tanks and sun-baked dino eggs need water! Before each throw, answer a geometry question: it picks your target or sets
          your angle. A right answer shows a <span className="y">guide line</span>; three in a row earns a <span className="y">bonus balloon</span>. Then fine-tune and fire.
          Watch the windsock!
          <br />
          <kbd>←</kbd><kbd>→</kbd> angle · <kbd>↑</kbd><kbd>↓</kbd> power (<kbd>Shift</kbd> ×5) · <kbd>Space</kbd>/<kbd>Enter</kbd> fire · <kbd>1</kbd>–<kbd>4</kbd>/<kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>R</kbd> read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute. On a tablet, drag from the launcher to aim, or use the sliders.
        </div>
        <div className="sa-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")}</div>
      </div>
    </div>
  );
}

function groupBy(log: LogEntry[], cat: LogEntry["cat"]) {
  const m = new Map<string, { std: string; skill: string; n: number; c: number }>();
  for (const l of log.filter((x) => x.cat === cat)) {
    const key = `${l.standard}|${l.skill}`;
    const cur = m.get(key) ?? { std: l.standard, skill: l.skill, n: 0, c: 0 };
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
    <div className="sa-report-block">
      <div className="sa-label sa-pixel">{title} {n ? `· ${c}/${n} (${Math.round((100 * c) / n)}%)` : ""}</div>
      {rows.length ? (
        <table className="sa-report-table">
          <thead>
            <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={`${v.std}|${v.skill}`}>
                <td className="c">{v.std}</td>
                <td>{v.skill}</td>
                <td style={{ color: v.c === v.n ? "var(--sa-green)" : v.c / v.n >= 0.75 ? "var(--sa-yellow)" : "var(--sa-red)" }}>{v.c}/{v.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="sa-help dim">{empty}</div>
      )}
    </div>
  );
}

function MissionReport({ seats, mode, grade, seat, onSeat, highScore, onAgain, onMenu }: { seats: Seat[]; mode: PlayMode; grade: Grade; seat: number; onSeat: (s: number) => void; highScore: number; onAgain: () => void; onMenu: () => void }) {
  const s = seats[mode === "pass" ? seat : 0];
  const shots = groupBy(s.log, "shot");
  const trans = groupBy(s.log, "trans");
  const practice = [...shots, ...trans].filter((v) => v.c / v.n < 0.75);
  const acc = s.thrown ? Math.round((100 * s.hits) / s.thrown) : 0;
  const winner = mode === "pass" ? (seats[0].score === seats[1].score ? -1 : seats[0].score > seats[1].score ? 0 : 1) : 0;
  return (
    <div className="sa-overlay">
      <div className="sa-panel report">
        <div className="sa-h sa-pixel" style={{ color: "var(--sa-green)" }}>
          {mode === "pass" ? (winner < 0 ? "IT'S A TIE!" : `PLAYER ${winner + 1} WINS!`) : "SPLASH COMPLETE!"} — MISSION REPORT
        </div>
        {mode === "pass" && (
          <div className="sa-tabs" role="tablist">
            {seats.map((x, i) => (
              <button key={i} role="tab" aria-selected={i === seat} className={`sa-opt ${i === seat ? "on" : ""}`} onClick={() => onSeat(i)}>
                {x.name.toUpperCase()}{i === winner ? " ★" : ""}
              </button>
            ))}
          </div>
        )}
        <div className="sa-help big">
          {mode === "pass" ? `${s.name}: ` : ""}Score <b className="y">{s.score}</b>
          {mode === "solo" && s.score >= highScore && s.score > 0 ? " — NEW HIGH SCORE!" : ""} · {gradeLabel(grade)}
        </div>
        <div className="sa-help">
          Balloons thrown <b className="c">{s.thrown}</b> · Targets watered <b className="c">{s.hits}</b> · Accuracy <b className="c">{acc}%</b> · Bonus balloons <b className="c">{s.bonus}</b>
        </div>
        <ResultTable title="GEOMETRY AIMING QUESTIONS" rows={shots} empty="No aiming questions answered." />
        <ResultTable title="TRANSMISSIONS (MATH)" rows={trans} empty="No transmissions answered." />
        {practice.length > 0 && (
          <div className="sa-help" style={{ marginTop: 8 }}>
            <span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 14, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="sa-cta ghost" onClick={onMenu}>{gradeFromArcade() ? "Title screen" : "Change grade"}</button>
          <button className="sa-cta" autoFocus onClick={onAgain}>Play again ▶</button>
        </div>
      </div>
    </div>
  );
}

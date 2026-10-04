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
import { BAND_CONFIG, WORLD, casesFor, isOlder } from "@/data/bands";
import { GAME_ID, Game, loadSolved, type LogEntry } from "@/game";
import { Gfx } from "@/gfx/gfx";
import { Screen, paintIcon } from "@/gfx/render";
import "@/ui/cc.css";

/** Clue Compass's own 16-step bassline: a tiptoeing detective walk in E minor (Hz; 0 = rest). */
const BASS = [82, 0, 98, 0, 110, 0, 98, 0, 82, 0, 123, 110, 98, 0, 73, 0];

export default function ClueCompass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const audio = useMemo(() => new ChipAudio(BASS, 92), []);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const readRef = useRef(readAloud);
  readRef.current = readAloud;
  const game = useMemo(
    () =>
      new Game(
        audio,
        {
          say: (t) => {
            if (readRef.current && t) speak(t);
          },
          onChange: () => bump(),
        },
        initialGrade("3"),
      ),
    [audio],
  );
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [touch, setTouch] = useState(false);
  const [layout, setLayout] = useState<{ mode: "stack" | "side"; cw: number }>({ mode: "stack", cw: 640 });
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const u = game.ui;
  const grade = u.grade;
  const cfg = BAND_CONFIG[u.band];
  const early = cfg.pictures;

  useEffect(() => {
    const s = new Screen(canvasRef.current!);
    game.screen = s;
    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) {
      (window as unknown as { __cc: Game }).__cc = game;
      if (params.has("fast")) game.fast = true;
    }
    game.paint();
    s.start();
    return () => {
      s.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [game, audio]);

  // Fit the 16:10 screen and the text panel into the space under the toolbar.
  useEffect(() => {
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > height * 1.45) setLayout({ mode: "side", cw: Math.floor(Math.min(width * 0.56, height * 1.6)) });
      else setLayout({ mode: "stack", cw: Math.floor(Math.min(width, height * 0.5 * 1.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const on = () => setTouch(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  useEffect(() => {
    if (u.phase === "report") setHighScore(loadProgress(GAME_ID).highScore);
  }, [u.phase]);

  const chooseGrade = useCallback(
    (g: Grade) => {
      rememberGrade(g);
      setReadAloud(readAloudPref(isEarlyReader(g)));
      game.setGrade(g);
    },
    [game],
  );

  const begin = useCallback(
    (caseId?: string) => {
      audio.unlock();
      audio.startMusic();
      rememberGrade(game.ui.grade);
      setPaused(false);
      game.start(caseId);
    },
    [audio, game],
  );

  const togglePause = useCallback(() => {
    const ph = game.ui.phase;
    if (ph === "title" || ph === "report") return;
    setPaused((p) => {
      const np = !p;
      if (game.screen) game.screen.paused = np;
      if (np) {
        stopSpeaking();
        audio.stopMusic();
      } else audio.startMusic();
      return np;
    });
  }, [game, audio]);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  /** Read the current screen again (speaker button / R). */
  const replay = useCallback(() => {
    const ui = game.ui;
    const run = ui.run;
    if (ui.phase === "transmission" && ui.q) return speakQuestion(ui.q.q.passage ? `${ui.q.q.passage} ${ui.q.q.prompt}` : ui.q.q.prompt, ui.q.q.choices);
    if (!run) return speak("Clue Compass. Pick a case and press start.");
    if (ui.phase === "brief") return speak(`${run.c.title}. ${run.c.brief}`);
    if (ui.phase === "deadend") return speak(`${run.wrongAt!.local}: ${run.lesson}`);
    if (ui.phase === "found") return speak(`Gotcha! ${run.c.end}`);
    if (ui.phase === "stop") {
      const names = run.options.map((id) => WORLD.get(id).name);
      const clue = ui.lastClue ? ui.lastClue.text + " " : "";
      const q = run.finalPick ? "Where is Pocket's hideout?" : "Where did Pocket go?";
      const notes = run.finalPick ? `Your notebook says: ${run.notebook.map((n) => n.text).join(" ")} ` : "";
      return speakQuestion(`${clue}${notes}${q}`, names);
    }
  }, [game]);

  // Keyboard: arrows pick a witness, Enter/Space talk, 1–4 / A–D travel, V map, R read, P pause, M mute.
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = ev.key.toLowerCase();
      if (k === "m") {
        setMuted(audio.toggleMute());
        return;
      }
      const ph = game.ui.phase;
      if (k === "p" || (ev.key === "Escape" && paused)) {
        togglePause();
        return;
      }
      if (paused) return;
      const enter = ev.key === "Enter" || ev.key === " ";
      // A focused button already handles Enter/Space itself (no double actions).
      if (enter && t?.tagName === "BUTTON") return;
      const pick = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (k === "r" && ph !== "title") {
        replay();
        return;
      }
      switch (ph) {
        case "title":
          if (enter) {
            ev.preventDefault();
            begin();
          }
          return;
        case "brief":
          if (enter) {
            ev.preventDefault();
            game.startChase();
          }
          return;
        case "stop":
          if (pick >= 0) {
            ev.preventDefault();
            game.choose(pick);
          } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
            ev.preventDefault();
            game.moveFocus(-1);
          } else if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
            ev.preventDefault();
            game.moveFocus(1);
          } else if (enter) {
            ev.preventDefault();
            if (game.ui.run?.witnesses.length) game.talk(game.ui.focus);
            else game.toggleView();
          } else if (k === "v") game.toggleView();
          return;
        case "deadend":
          if (enter) {
            ev.preventDefault();
            game.back();
          }
          return;
        case "found":
        case "escaped":
          if (enter) {
            ev.preventDefault();
            game.next();
          }
          return;
        case "transmission":
          if (game.ui.q?.picked === null && pick >= 0) {
            ev.preventDefault();
            game.answer(pick);
          } else if (game.ui.q?.picked !== null && enter) {
            ev.preventDefault();
            game.continueTransmission();
          }
          return;
        case "report":
          if (enter) {
            ev.preventDefault();
            begin();
          }
          return;
      }
    };
    const blur = () => {
      if (game.ui.phase !== "title" && game.ui.phase !== "report" && !paused) togglePause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [game, audio, paused, togglePause, begin, replay]);

  const onCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused || !game.screen) return;
    audio.unlock();
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320;
    const y = ((e.clientY - r.top) / r.height) * 200;
    const ph = game.ui.phase;
    if (ph === "brief") return game.startChase();
    if (ph !== "stop") return;
    const h = game.screen.hit(x, y);
    if (h?.kind === "witness") game.talk(h.i);
    else if (h?.kind === "option") game.chooseId(h.id);
  };

  const playing = u.phase !== "title" && u.phase !== "report";

  return (
    <div className={`cc-root ${early ? "early" : ""} ${touch ? "touch" : ""}`}>
      <div className="cc-toolbar">
        <a href={arcadeLink(grade)} className="cc-pixel">◀ ARCADE</a>
        <div className="cc-tools">
          {playing && <button className="cc-pixel" onClick={togglePause}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button className="cc-pixel" onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button className="cc-pixel" onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`cc-main ${layout.mode}`} ref={mainRef}>
        <div className="cc-screen" style={{ width: layout.cw }}>
          <canvas ref={canvasRef} aria-label="Clue Compass game screen" onPointerDown={onCanvas} onContextMenu={(e) => e.preventDefault()} />
        </div>
        <div className="cc-panel" style={layout.mode === "stack" ? { maxWidth: Math.max(layout.cw, 760) } : undefined}>
          {u.phase === "title" && <Title game={game} grade={grade} highScore={highScore} onGrade={chooseGrade} onStart={begin} />}
          {u.phase === "brief" && <Brief game={game} onSpeak={replay} />}
          {(u.phase === "stop" || u.phase === "travel") && <Stop game={game} early={early} onSpeak={replay} />}
          {u.phase === "deadend" && <DeadEnd game={game} onSpeak={replay} />}
          {(u.phase === "found" || u.phase === "escaped") && <Caught game={game} onSpeak={replay} />}
          {u.phase === "transmission" && <Transmission game={game} early={early} onSpeak={replay} />}
          {u.phase === "report" && <Report game={game} highScore={highScore} onAgain={() => begin()} />}
        </div>
        {paused && playing && (
          <div className="cc-overlay">
            <div className="cc-card center">
              <div className="cc-title cc-pixel">PAUSED</div>
              <button className="cc-cta" autoFocus onClick={togglePause}>Resume</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ small pieces

export function Icon({ id, scale = 2, className }: { id: string; scale?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    paintIcon(new Gfx(ctx), id, 0, 0, 1);
  }, [id]);
  return <canvas ref={ref} width={id.startsWith("say:") ? 40 : 12} height={12} className={`cc-icon ${className ?? ""}`} style={{ height: 12 * scale }} aria-hidden="true" />;
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}

function Speak({ onSpeak }: { onSpeak: () => void }) {
  if (!speechSupported()) return null;
  return (
    <button className="cc-speak" onClick={onSpeak} aria-label="Read it aloud" title="Read aloud (R)">
      <SpeakerIcon />
    </button>
  );
}

function Title({ game, grade, highScore, onGrade, onStart }: { game: Game; grade: Grade; highScore: number; onGrade: (g: Grade) => void; onStart: (id?: string) => void }) {
  const fromArcade = gradeFromArcade();
  const band = game.ui.band;
  const list = casesFor(band);
  const solved = loadSolved();
  const older = isOlder(grade);
  return (
    <div className="cc-scroll">
      <div className="cc-head">
        <h1 className="cc-logo cc-pixel">CLUE COMPASS</h1>
        <span className="cc-credit">created by SpiderBen10 (NZDO)</span>
      </div>
      {fromArcade ? (
        <div className="cc-badge cc-pixel">
          {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
        </div>
      ) : (
        <div className="cc-grades" role="radiogroup" aria-label="Grade">
          {GRADES.map((g) => (
            <button key={g} role="radio" aria-checked={g === grade} className={`cc-grade cc-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
              {g}
            </button>
          ))}
        </div>
      )}
      {older && (
        <div className="cc-older" role="note">
          <b className="y">Hey, detective!</b> Clue Compass is made for grades K–5. For a chase through world <b>history</b> at your level, look for{" "}
          <b className="c">Thread Chasers</b> in the arcade. You can still play the Grade 5 cases here — have fun!
        </div>
      )}
      <p className="cc-lead">
        Pocket the runaway robot keeps <b className="y">borrowing</b> famous things! Ask witnesses, read the clues, and fly to the right place on the map.
        A wrong trip costs time, but a friendly local explains why. <span className="dim">{BAND_CONFIG[band].label}.</span>
      </p>
      <div className="cc-label cc-pixel">CASE FILES</div>
      <ul className="cc-cases">
        {list.map((c) => (
          <li key={c.id}>
            <button className="cc-case" onClick={() => onStart(c.id)}>
              <Icon id={c.itemIcon} scale={2} />
              <span className="t">{c.title}</span>
              <span className={`s cc-pixel ${solved.has(c.id) ? "ok" : ""}`}>{solved.has(c.id) ? "✔ SOLVED" : `${c.stops.length} STOPS`}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="cc-row">
        <button className="cc-cta cc-start" autoFocus onClick={() => onStart()}>Start the chase ▶</button>
        <span className="dim cc-pixel cc-hi">HI {String(highScore).padStart(6, "0")}</span>
      </div>
      <p className="cc-help">
        <kbd>←</kbd><kbd>→</kbd> pick a witness · <kbd>Enter</kbd> talk · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> travel · <kbd>V</kbd> map ·
        <kbd>R</kbd> read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute. Or just tap!
      </p>
    </div>
  );
}

function Brief({ game, onSpeak }: { game: Game; onSpeak: () => void }) {
  const c = game.ui.run!.c;
  return (
    <div className="cc-scroll">
      <div className="cc-tagrow">
        <span className="cc-tag cc-pixel">CASE {game.ui.caseIdx + 1} OF {game.ui.mission.length}</span>
        <Speak onSpeak={onSpeak} />
      </div>
      <h2 className="cc-h2">{c.title}</h2>
      <div className="cc-brief">
        <Icon id={c.itemIcon} scale={4} />
        <p>{c.brief}</p>
      </div>
      <p className="cc-help">Pip the pigeon will carry your notes. Pocket always leaves an <b className="y">IOU note</b> with a hint about the hideout.</p>
      <div className="cc-row">
        <button className="cc-cta" autoFocus onClick={() => game.startChase()}>Start the chase ▶</button>
      </div>
    </div>
  );
}

function Stop({ game, early, onSpeak }: { game: Game; early: boolean; onSpeak: () => void }) {
  const u = game.ui;
  const run = u.run!;
  const busy = u.phase === "travel";
  const here = run.here;
  const final = run.finalPick;
  const town = run.c.map === "town";
  return (
    <div className={`cc-stop ${busy ? "busy" : ""}`} aria-label="Investigation">
      <div className="cc-tagrow">
        <span className="cc-tag cc-pixel">STOP {run.stop + 1} OF {run.c.stops.length - 1}</span>
        <b className="cc-here">{here.name.replace(/^the /, "The ")}</b>
        <button className="cc-small cc-pixel" onClick={() => game.toggleView()} disabled={busy} aria-pressed={u.view === "map"}>
          {u.view === "map" ? "SCENE" : "MAP"} <kbd>V</kbd>
        </button>
        <Speak onSpeak={onSpeak} />
      </div>
      <div className="cc-cols">
        <div className="cc-col">
          {!final ? (
            <>
              <div className="cc-label cc-pixel">WITNESSES</div>
              <div className="cc-witnesses">
                {run.witnesses.map((w, i) => (
                  <button
                    key={i}
                    className={`cc-witness ${w.heard ? "heard" : ""} ${u.focus === i ? "focus" : ""}`}
                    onClick={() => game.talk(i)}
                    disabled={busy}
                    aria-label={`Witness ${i + 1}`}
                  >
                    <span className="n cc-pixel">{i + 1}</span>
                    {w.heard ? (
                      <span className="clue">
                        {w.icon && <Icon id={w.icon} scale={early ? 3 : 2} />}
                        <span>{w.text}</span>
                      </span>
                    ) : (
                      <span className="dim">{early ? "Tap to hear a clue" : "Ask this witness (1 hour)"}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="cc-final">
              <span className="cc-pixel y">POCKET'S HIDEOUT IS NEAR!</span> Every IOU note in your notebook describes the hideout. Pick the place that fits <b>all</b> of them.
            </div>
          )}
          <div className="cc-label cc-pixel">NOTEBOOK · POCKET'S HIDEOUT</div>
          <ul className="cc-notebook">
            {run.notebook.map((n, i) => (
              <li key={i} className={i === run.notebook.length - 1 && u.newNote ? "new" : ""}>
                {n.icon && <Icon id={n.icon} scale={early ? 3 : 2} />}
                <span>{n.text}</span>
              </li>
            ))}
            {!run.notebook.length && <li className="dim">No IOU notes yet.</li>}
          </ul>
        </div>
        <div className="cc-col">
          <div className="cc-label cc-pixel">{final ? "WHERE IS POCKET'S HIDEOUT?" : "WHERE DID POCKET GO?"}</div>
          <div className={`cc-choices ${early ? "big" : ""}`}>
            {run.options.map((id, i) => {
              const p = WORLD.get(id);
              const tried = run.tried.has(id);
              const ic = town ? p.facts.find((f) => f.k === "thing")?.icon : undefined;
              return (
                <button key={id} className={`cc-choice ${tried ? "tried" : ""}`} disabled={busy || tried} onClick={() => game.choose(i)}>
                  <span className="key cc-pixel">{"ABCD"[i]}</span>
                  {ic && <Icon id={ic} scale={2} />}
                  <span>{p.name.replace(/^the /, "The ")}</span>
                  {tried && <span className="x">✘</span>}
                </button>
              );
            })}
          </div>
          <div className="cc-help small">
            {run.charges === null ? "No clock in your grade: take your time!" : `Talking costs 1 hour, a trip 2, a wrong trip 4. ${run.charges} hours left.`}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadEnd({ game, onSpeak }: { game: Game; onSpeak: () => void }) {
  const run = game.ui.run!;
  const p = run.wrongAt!;
  return (
    <div className="cc-scroll" aria-label="Dead end">
      <div className="cc-tagrow">
        <span className="cc-tag cc-pixel no">WRONG TRIP · −4 HOURS</span>
        <Speak onSpeak={onSpeak} />
      </div>
      <h2 className="cc-h2">{p.name.replace(/^the /, "The ")}: no Pocket here!</h2>
      <p className="cc-lesson">
        <b className="c">{p.local[0].toUpperCase() + p.local.slice(1)}</b> says: “{run.lesson}”
      </p>
      <div className="cc-row">
        <button className="cc-cta" autoFocus onClick={() => game.back()}>Fly back to {run.here.name.replace(/^the /, "the ")} ▶</button>
      </div>
    </div>
  );
}

function Caught({ game, onSpeak }: { game: Game; onSpeak: () => void }) {
  const u = game.ui;
  const run = u.run!;
  const ok = u.phase === "found";
  const more = u.caseIdx + 1 < u.mission.length;
  return (
    <div className="cc-scroll" aria-label={ok ? "Case solved" : "Pocket got away"}>
      <div className="cc-tagrow">
        <span className={`cc-tag cc-pixel ${ok ? "ok" : "no"}`}>{ok ? "CASE SOLVED!" : "POCKET ZIPPED AWAY"}</span>
        <Speak onSpeak={onSpeak} />
      </div>
      <h2 className="cc-h2">{ok ? `Gotcha! Pocket was hiding at ${run.hideout.name.replace(/^the /, "the ")}.` : "Out of compass charges!"}</h2>
      <div className="cc-brief">
        <Icon id={run.c.itemIcon} scale={4} />
        <p>
          {ok ? <>Pocket says: “{run.c.end}”</> : <>Pocket left {run.c.item} behind with a sorry note. The hideout was {run.hideout.name.replace(/^the /, "the ")}. Next time, ask fewer witnesses or check the map first!</>}
        </p>
      </div>
      <p className="cc-help">Wrong trips this case: {run.mistakes}. Score so far: <b className="y">{u.score}</b>.</p>
      <div className="cc-row">
        <button className="cc-cta" autoFocus onClick={() => game.next()}>{more ? "Next: a transmission from Pip ▶" : "Mission report ▶"}</button>
      </div>
    </div>
  );
}

function Transmission({ game, early, onSpeak }: { game: Game; early: boolean; onSpeak: () => void }) {
  const qs = game.ui.q!;
  const q = qs.q;
  const right = qs.picked !== null && qs.picked === q.answer;
  return (
    <div className="cc-scroll" role="dialog" aria-label="Transmission question">
      <div className="cc-tagrow">
        <span className="cc-tag cc-pixel">◆ TRANSMISSION FROM PIP</span>
        <span className="cc-tag cc-pixel std">{q.standard} · {q.skill}</span>
        <Speak onSpeak={onSpeak} />
      </div>
      {q.passage && <div className="cc-passage">{q.passage}</div>}
      <div className="cc-prompt">{q.prompt}</div>
      <div className={`cc-choices ${early ? "big" : ""}`}>
        {q.choices.map((c, i) => {
          const st = qs.picked === null ? "" : i === q.answer ? "right" : i === qs.picked ? "wrong" : "";
          return (
            <button key={i} className={`cc-choice ${st}`} disabled={qs.picked !== null} onClick={() => game.answer(i)}>
              <span className="key cc-pixel">{"ABCD"[i]}</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {qs.picked !== null && (
        <div className="cc-feedback">
          <div className={`verdict cc-pixel ${right ? "ok" : "no"}`}>{right ? "✔ CORRECT! +150" : `✘ NOT QUITE — THE ANSWER IS ${"ABCD"[q.answer]}`}</div>
          <div>{q.explanation}</div>
          <div className="cc-row">
            <button className="cc-cta" autoFocus onClick={() => game.continueTransmission()}>Next case ▶</button>
          </div>
        </div>
      )}
    </div>
  );
}

function group(log: LogEntry[]) {
  const m = new Map<string, { std: string; skill: string; cat: string; n: number; c: number }>();
  for (const l of log) {
    const key = `${l.standard}|${l.skill}`;
    const cur = m.get(key) ?? { std: l.standard, skill: l.skill, cat: l.cat, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    m.set(key, cur);
  }
  return [...m.values()];
}

function Report({ game, highScore, onAgain }: { game: Game; highScore: number; onAgain: () => void }) {
  const u = game.ui;
  const rows = group(u.log);
  const practice = rows.filter((r) => r.c / r.n < 0.75);
  const solved = u.results.filter((r) => r.solved).length;
  const lessons = u.results.flatMap((r) => r.lessons).slice(0, 6);
  return (
    <div className="cc-scroll" aria-label="Mission report">
      <h2 className="cc-h2 cc-pixel y">MISSION REPORT</h2>
      <p className="cc-lead">
        Cases solved <b className="y">{solved}/{u.results.length}</b> · Score <b className="y">{u.score}</b>
        {u.score >= highScore && u.score > 0 ? " — NEW HIGH SCORE!" : ""} · {gradeLabel(u.grade)}
      </p>
      <ul className="cc-results">
        {u.results.map((r) => (
          <li key={r.id}>
            <span className={r.solved ? "ok" : "no"}>{r.solved ? "✔" : "✘"}</span> {r.title} <span className="dim">({r.mistakes} wrong {r.mistakes === 1 ? "trip" : "trips"})</span>
          </li>
        ))}
      </ul>
      <table className="cc-report">
        <thead>
          <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={`${v.std}|${v.skill}`}>
              <td className="c">{v.std}</td>
              <td>{v.skill}{v.cat === "transmission" ? " (transmission)" : v.cat === "reading" ? " (reading)" : ""}</td>
              <td className={v.c === v.n ? "ok" : v.c / v.n >= 0.75 ? "y" : "no"}>{v.c}/{v.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {practice.length > 0 && (
        <p className="cc-help">
          <span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}.
        </p>
      )}
      {lessons.length > 0 && (
        <>
          <div className="cc-label cc-pixel">WHAT THE LOCALS TAUGHT YOU</div>
          <ul className="cc-lessons">
            {lessons.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </>
      )}
      <div className="cc-row">
        <button className="cc-cta ghost" onClick={() => game.toTitle()}>Case files</button>
        <button className="cc-cta" autoFocus onClick={onAgain}>Next mission ▶</button>
      </div>
    </div>
  );
}

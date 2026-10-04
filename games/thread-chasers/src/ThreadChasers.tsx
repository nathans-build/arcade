import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ChipAudio,
  GRADES,
  arcadeLink,
  gradeFromArcade,
  gradeLabel,
  gradeNumber,
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
import { place } from "@/chase/places";
import { BAND_RULES } from "@/game/bands";
import { GAME_ID, ThreadGame } from "@/game/engine";
import { Screen, W, H } from "@/game/render";
import "@/tc.css";

/** Thread Chasers' own 16-step bassline: a winding, spinning-wheel line in E minor (Hz; 0 = rest). */
const BASS = [82, 0, 98, 123, 0, 110, 98, 0, 73, 0, 92, 110, 0, 98, 87, 0];

export default function ThreadChasers() {
  const audio = useMemo(() => new ChipAudio(BASS, 92), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<Screen | null>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("7"))));
  const readRef = useRef(readAloud);
  readRef.current = readAloud;
  const game = useMemo(
    () =>
      new ThreadGame(
        audio,
        {
          onChange: () => bump(),
          say: (t) => {
            if (readRef.current && t) speak(t);
          },
          sayQuestion: (q) => {
            if (readRef.current) speakQuestion(q.passage ? `${q.passage} ${q.prompt}` : q.prompt, q.choices);
          },
        },
        initialGrade("7"),
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
  const tooYoung = gradeNumber(grade) < 5;

  useEffect(() => {
    const s = new Screen(canvasRef.current!, game);
    screenRef.current = s;
    s.start();
    if (new URLSearchParams(window.location.search).has("debug")) (window as unknown as { __tc: unknown }).__tc = { game, screen: s };
    return () => {
      s.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [game, audio]);

  // Fit the 16:10 screen and the text panel into the space under the toolbar (like Page Quest).
  // Reading-heavy screens (questions, report, title) give the panel more room when stacked.
  const wordy = u.phase === "question" || u.phase === "report" || u.phase === "title" || u.phase === "brief";
  useEffect(() => {
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const share = wordy ? 0.37 : 0.5;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > height * 1.45) setLayout({ mode: "side", cw: Math.floor(Math.min(width * 0.58, height * 1.6)) });
      else setLayout({ mode: "stack", cw: Math.floor(Math.min(width, height * share * 1.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [wordy]);

  // New screen in the panel: start reading at the top (autofocus can scroll it).
  const qid = u.q?.q.id;
  useEffect(() => {
    requestAnimationFrame(() => document.querySelector(".tc-scroll")?.scrollTo(0, 0));
  }, [u.phase, qid, u.beadIx]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const on = () => setTouch(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  useEffect(() => {
    if (u.phase === "report" || u.phase === "solved") setHighScore(loadProgress(GAME_ID).highScore);
  }, [u.phase]);

  const chooseGrade = useCallback(
    (g: Grade) => {
      rememberGrade(g);
      setReadAloud(readAloudPref(isEarlyReader(g)));
      game.setGrade(g);
    },
    [game],
  );

  const start = useCallback(() => {
    audio.unlock();
    rememberGrade(game.ui.grade);
    game.start();
  }, [audio, game]);

  const togglePause = useCallback(
    (force?: boolean) => {
      if (game.ui.phase === "title") return;
      setPaused((p) => {
        const np = force ?? !p;
        if (screenRef.current) screenRef.current.paused = np;
        if (np) {
          stopSpeaking();
          audio.stopMusic();
        } else if (!game.ui.sensitive) audio.startMusic();
        return np;
      });
    },
    [audio, game],
  );

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const replay = useCallback(() => {
    const ui = game.ui;
    if (ui.phase === "question" && ui.q) speakQuestion(ui.q.q.passage ? `${ui.q.q.passage} ${ui.q.q.prompt}` : ui.q.q.prompt, ui.q.q.choices);
    else if (ui.phase === "bead" && game.bead) speak(`${game.bead.title}. ${game.text(game.bead.fact)} ${ui.msg}`);
    else if (ui.phase === "deadend" && ui.deadEnd) speak(`Dead end. ${ui.deadEnd.why}`);
    else speak(ui.msg);
  }, [game]);

  // Keyboard: arrows pick witnesses, Enter talks; answers on 1-4 / A-D; G map, F refuel, R read aloud, P pause, M mute.
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      const plain = ev.key.length === 1;
      if (plain && k === "m") return void setMuted(audio.toggleMute());
      const ui = game.ui;
      if (ui.phase === "title") {
        if (ev.key === "Enter" && !tooYoung) {
          ev.preventDefault();
          start();
        }
        return;
      }
      if ((plain && k === "p") || (ev.key === "Escape" && paused)) return void togglePause();
      if (paused) return;
      if (plain && k === "r") return replay();
      const abcd = plain ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      const enter = ev.key === "Enter" || ev.key === " ";
      switch (ui.phase) {
        case "cases":
          if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") game.moveCaseSel(-1);
          else if (ev.key === "ArrowDown" || ev.key === "ArrowRight") game.moveCaseSel(1);
          else if (enter) game.chooseCase(ui.caseSel);
          else return;
          ev.preventDefault();
          return;
        case "brief":
          if (enter) {
            ev.preventDefault();
            game.beginCase();
          }
          return;
        case "bead":
          if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") game.moveSel(-1);
          else if (ev.key === "ArrowRight" || ev.key === "ArrowDown") game.moveSel(1);
          else if (enter) game.activate();
          else if (plain && k === "g") game.openMap();
          else if (plain && k === "f") game.askRefuel();
          else return;
          ev.preventDefault();
          return;
        case "map":
          if (abcd >= 0) game.pick(abcd);
          else if (enter) game.confirmJump();
          else if (ev.key === "Escape" || ev.key === "Backspace") game.closeMap();
          else return;
          ev.preventDefault();
          return;
        case "deadend":
          if (enter || ev.key === "Escape") {
            ev.preventDefault();
            game.backFromDeadEnd();
          }
          return;
        case "slip":
          if (enter) {
            ev.preventDefault();
            game.continueAfterSlip();
          }
          return;
        case "question":
          if (ui.q?.picked === null && abcd >= 0) {
            ev.preventDefault();
            game.answer(abcd);
          } else if (ui.q && ui.q.picked !== null && enter) {
            ev.preventDefault();
            game.continueQuestion();
          }
          return;
        case "solved":
          if (enter) {
            ev.preventDefault();
            game.transmission();
          }
          return;
        case "report":
          if (enter) {
            ev.preventDefault();
            game.nextCase();
          }
          return;
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [game, audio, paused, togglePause, replay, start, tooYoung]);

  const onCanvasTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused) return;
    audio.unlock();
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const tap = screenRef.current?.tapAt(x, y);
    if (!tap) return;
    if (tap.kind === "item") game.activate(tap.i);
    else game.pick(tap.i);
  };

  const playing = u.phase !== "title";

  return (
    <div className={`tc-root ${touch ? "touch" : ""}`}>
      <div className="tc-toolbar">
        <a href={arcadeLink(grade)} className="tc-pixel">◀ ARCADE</a>
        <div className="tc-tools">
          {playing && <button className="tc-pixel" onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button className="tc-pixel" onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button className="tc-pixel" onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`tc-main ${layout.mode}`} ref={mainRef}>
        <div className="tc-screen" style={{ width: layout.cw }}>
          <canvas ref={canvasRef} aria-label="Thread Chasers screen" onPointerDown={onCanvasTap} onContextMenu={(e) => e.preventDefault()} />
        </div>
        <div className="tc-panel" style={layout.mode === "stack" ? { maxWidth: Math.max(layout.cw, 760) } : undefined}>
          {tooYoung ? (
            <TooYoung grade={grade} onGrade={chooseGrade} />
          ) : (
            <Panel game={game} onStart={start} onGrade={chooseGrade} highScore={highScore} readAloud={readAloud} onReplay={replay} />
          )}
        </div>
        {paused && (
          <div className="tc-overlay">
            <div className="tc-card center">
              <div className="tc-title tc-pixel">PAUSED</div>
              <button className="tc-cta" autoFocus onClick={() => togglePause(false)}>Resume</button>
            </div>
          </div>
        )}
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

function GradeBadge({ grade, onGrade }: { grade: Grade; onGrade: (g: Grade) => void }) {
  return gradeFromArcade() ? (
    <p className="tc-badge tc-pixel">
      {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
    </p>
  ) : (
    <div className="tc-grades" role="radiogroup" aria-label="Grade">
      {GRADES.map((g) => (
        <button key={g} role="radio" aria-checked={g === grade} className={`tc-grade tc-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
          {g}
        </button>
      ))}
    </div>
  );
}

function TooYoung({ grade, onGrade }: { grade: Grade; onGrade: (g: Grade) => void }) {
  return (
    <div className="tc-scroll tc-young">
      <h1 className="tc-pixel">THREAD CHASERS</h1>
      <p className="tc-credit">created by SpiderBen10 (NZDO)</p>
      <p className="big">
        <b className="y">Thread Chasers is for grades 5 and up.</b> Wick the lantern-moth is saving these threads of world history for you!
        Until then, the arcade has lots of games for {gradeLabel(grade)}.
      </p>
      <p>
        <a className="tc-cta" href={arcadeLink(grade)}>◀ ARCADE</a>
      </p>
      <GradeBadge grade={grade} onGrade={onGrade} />
    </div>
  );
}

function Panel({
  game, onStart, onGrade, highScore, readAloud, onReplay,
}: {
  game: ThreadGame; onStart: () => void; onGrade: (g: Grade) => void; highScore: number; readAloud: boolean; onReplay: () => void;
}) {
  const u = game.ui;
  const rules = BAND_RULES[u.band];
  const speakBtn = speechSupported() && (
    <button type="button" className={`tc-speak ${readAloud ? "on" : ""}`} onClick={onReplay} aria-label="Read aloud" title="Read aloud (R)">
      <SpeakerIcon />
    </button>
  );

  if (u.phase === "title") {
    return (
      <div className="tc-scroll">
        <h1 className="tc-logo tc-pixel">THREAD CHASERS</h1>
        <p className="tc-credit">created by SpiderBen10 (NZDO) · SpiderBen10's Arcade</p>
        <GradeBadge grade={u.grade} onGrade={onGrade} />
        <p>
          Outside time stands the <b className="y">Long Archive</b>, where the Great Loom weaves how the world got connected. <b className="pink">Knot</b>, a silly
          yarn-ball gremlin, has tugged its threads loose! With <b className="c">Wick</b> the lantern-moth, follow each thread bead by bead: ask witnesses, read
          plaques, then jump on the <b>chrono-map</b> to the right <b>place</b> and <b>time</b>.
        </p>
        <p className="dim">
          {rules.label}: {game.caseList.length} cases · {rules.beads[0] === rules.beads[1] ? rules.beads[0] : `${rules.beads[0]}–${rules.beads[1]}`} beads each · lantern {rules.lantern} hours ·{" "}
          {rules.map === "dial" ? "split dial (place, then era)" : rules.map === "named" ? "named pins with eras" : "named pins, era on tap"}
          {rules.sourceChecks ? ` · ${rules.sourceChecks} source check${rules.sourceChecks > 1 ? "s" : ""} per case` : ""}.
        </p>
        <p className="dim">
          Rank: <b className="y">{game.rank}</b> · Hi-score {String(highScore).padStart(6, "0")}
        </p>
        <div className="tc-btnrow">
          <button className="tc-cta" autoFocus onClick={onStart}>Start ▶</button>
        </div>
        <p className="tc-help kbd">
          <kbd>←</kbd><kbd>→</kbd> pick a witness · <kbd>Enter</kbd> talk · <kbd>G</kbd> chrono-map · <kbd>1</kbd>–<kbd>4</kbd>/<kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>F</kbd> refuel ·{" "}
          <kbd>R</kbd> read aloud · <kbd>P</kbd> pause · <kbd>M</kbd> mute. Or just tap!
        </p>
      </div>
    );
  }

  if (u.phase === "cases") {
    return (
      <div className="tc-scroll">
        <div className="tc-h tc-pixel">THE GREAT LOOM · RANK: {game.rank.toUpperCase()}</div>
        <div className="tc-cases">
          {game.caseList.map((c, i) => (
            <button key={c.id} className={`tc-case ${i === u.caseSel ? "on" : ""}`} onClick={() => game.chooseCase(i)} style={{ borderLeftColor: c.color }}>
              <span className="n tc-pixel">{c.n}</span>
              <span className="t">
                {c.title}
                <small>{c.thread}</small>
              </span>
              {game.isSolved(c.id) && <span className="ok tc-pixel">✔</span>}
            </button>
          ))}
        </div>
        {u.log.length > 0 && (
          <div className="tc-btnrow">
            <button className="tc-cta ghost small" onClick={() => game.toCases()}>
              Score {u.score}
            </button>
          </div>
        )}
      </div>
    );
  }

  const c = game.currentCase!;
  if (u.phase === "brief") {
    return (
      <div className="tc-scroll">
        <div className="tc-h tc-pixel" style={{ color: c.color }}>CASE {c.n}: {c.title.toUpperCase()} {speakBtn}</div>
        <p className="big">{game.text(c.brief)}</p>
        <ul className="tc-list">
          <li>At each bead, <b>witnesses</b> saw where the thread goes next. Each costs <b className="y">1 lantern hour</b>; the <b>plaque</b> is free.</li>
          {u.band === "b68" && <li>One witness is a <b>red herring</b>: true, but no help.</li>}
          {u.band === "b912" && <li>One witness is <b>unreliable</b>: notice who contradicts the evidence.</li>}
          <li>A wrong jump is a <b className="no">dead end</b> (−2 hours): a local explains why. Read it: that's the lesson!</li>
          <li>Quiet beads (slavery, war, famine) have <b>no clock</b>: take your time.</li>
        </ul>
        <div className="tc-btnrow">
          <button className="tc-cta" autoFocus onClick={() => game.beginCase()}>Start the chase ▶</button>
          <button className="tc-cta ghost small" onClick={() => game.toCases()}>◀ Cases</button>
        </div>
      </div>
    );
  }

  if (u.phase === "question" && u.q) return <QuestionPanel game={game} speakBtn={speakBtn} />;

  const b = game.bead!;
  if (u.phase === "bead" || u.phase === "slip") {
    const next = game.nextBead;
    const n = u.talkers.length;
    return (
      <div className="tc-scroll">
        <div className="tc-beadhead">
          <div>
            <div className="tc-h tc-pixel">{place(b.place).name.toUpperCase()} · {b.era.toUpperCase()}</div>
            <div className="tc-beadtitle">{b.title} <span className="dim">({place(b.place).today})</span></div>
          </div>
          {speakBtn}
        </div>
        <div className={`tc-fact ${b.sensitive ? "quiet" : ""}`}>{game.text(b.fact)}</div>
        {u.review && <div className="tc-review">{u.review}</div>}
        {u.phase === "slip" ? (
          <div className="tc-btnrow">
            <p className="no">{u.msg}</p>
            <button className="tc-cta" autoFocus onClick={() => game.continueAfterSlip()}>Try again from this bead ▶</button>
          </div>
        ) : (
          <>
            <div className="tc-actions">
              {u.talkers.map((t, i) => (
                <button key={t.who + i} className={`tc-act ${u.sel === i ? "sel" : ""} ${u.asked.includes(i) ? "done" : ""}`} onClick={() => game.activate(i)}>
                  {u.asked.includes(i) ? "Ask again" : "Ask"}: {t.who} <small>{u.asked.includes(i) ? "heard" : u.sensitive ? "no clock" : "1 hour"}</small>
                </button>
              ))}
              {next && (
                <button className={`tc-act ${u.sel === n ? "sel" : ""} ${u.plaqueRead ? "done" : ""}`} onClick={() => game.activate(n)}>
                  Read the plaque <small>free</small>
                </button>
              )}
              <button className={`tc-act go ${u.sel === n + 1 ? "sel" : ""}`} onClick={() => game.activate(n + 1)}>
                {next ? (u.sourcePending ? "Source check, then the chrono-map ▶" : "Open the chrono-map ▶") : u.sourcePending ? "Source check, then re-weave ▶" : "Re-weave the thread ▶"}
              </button>
              {game.canRefuel() && (
                <button className="tc-act refuel" onClick={() => game.askRefuel()}>
                  Refuel the lantern <small>+1 hour for a right answer (F)</small>
                </button>
              )}
            </div>
            {u.heard.length > 0 && (
              <div className="tc-notebook">
                <div className="tc-h tc-pixel">CLUE NOTEBOOK</div>
                {u.heard.map((h, i) => (
                  <p key={i}>
                    <b className={h.plaque ? "c" : "y"}>{h.who}:</b> {h.text}
                  </p>
                ))}
              </div>
            )}
            {!u.heard.length && next && <p className="tc-help">{u.msg}</p>}
          </>
        )}
      </div>
    );
  }

  if (u.phase === "map" && u.map) {
    const m = u.map;
    const dial = m.dial;
    const step = dial?.step;
    return (
      <div className="tc-scroll">
        <div className="tc-h tc-pixel">
          CHRONO-MAP{dial ? (step === "place" ? " · SPLIT DIAL 1/2: PLACE" : " · SPLIT DIAL 2/2: ERA") : ""} {speakBtn}
        </div>
        <p className="tc-help">{u.msg}</p>
        <div className="tc-answers">
          {dial && step === "era"
            ? dial.eras.map((e, i) => (
                <button key={e.era} className="tc-choice" onClick={() => game.pick(i)} disabled={m.tried.some((k) => k.endsWith(`|${e.era}`))}>
                  <span className="key tc-pixel">{"ABCD"[i]}</span>
                  <span>{e.era}</span>
                </button>
              ))
            : (dial ? dial.places : m.pins).map((p, i) => {
                const name = place(p.place).name;
                const tried = m.tried.some((k) => (dial ? k.startsWith(`${p.place}|`) : k === `${p.place}|${p.era}`));
                const showEra = u.band === "b5" || (u.band === "b68" && (m.selected === i || tried));
                return (
                  <button key={p.place + p.era} className={`tc-choice ${m.selected === i ? "sel" : ""}`} onClick={() => game.pick(i)} disabled={tried}>
                    <span className="key tc-pixel">{"ABCD"[i]}</span>
                    <span>
                      {name}
                      {showEra && !dial ? <b className="y"> · {p.era}</b> : null}
                      {u.band !== "b912" && <small className="dim"> ({place(p.place).today})</small>}
                    </span>
                  </button>
                );
              })}
        </div>
        <div className="tc-btnrow">
          {u.band === "b68" && m.selected !== null && (
            <button className="tc-cta" onClick={() => game.confirmJump()}>
              Jump to {"ABCD"[m.selected]} ▶
            </button>
          )}
          <button className="tc-cta ghost small" onClick={() => game.closeMap()}>◀ Back to the bead (Esc)</button>
        </div>
        {u.heard.length > 0 && (
          <div className="tc-notebook small">
            {u.heard.map((h, i) => (
              <p key={i}>
                <b className={h.plaque ? "c" : "y"}>{h.who}:</b> {h.text}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (u.phase === "deadend" && u.deadEnd) {
    const d = u.deadEnd;
    return (
      <div className="tc-scroll">
        <div className="tc-h tc-pixel no">DEAD END · {d.place.toUpperCase()}{d.era ? ` · ${d.era.toUpperCase()}` : ""} {speakBtn}</div>
        <p className="big">“{d.why}”</p>
        <p className="dim">{d.cost ? `Wick's lantern lost ${d.cost} hours.` : "No clock on a quiet bead."} Lantern: {u.lantern} of {u.lanternMax} hours.</p>
        <div className="tc-btnrow">
          <button className="tc-cta" autoFocus onClick={() => game.backFromDeadEnd()}>◀ Back to {b.title}</button>
        </div>
      </div>
    );
  }

  if (u.phase === "solved") {
    return (
      <div className="tc-scroll">
        <div className="tc-title tc-pixel small">THREAD RE-WOVEN!</div>
        <p className="big">{u.msg}</p>
        <p>{c.woven}</p>
        <p className="dim">Score {u.score} · Rank {game.rank}</p>
        <div className="tc-btnrow">
          <button className="tc-cta" autoFocus onClick={() => game.transmission()}>Receive transmission ▶</button>
        </div>
      </div>
    );
  }

  if (u.phase === "report") return <Report game={game} highScore={highScore} />;
  return null;
}

function QuestionPanel({ game, speakBtn }: { game: ThreadGame; speakBtn: React.ReactNode }) {
  const s = game.ui.q!;
  const q = s.q;
  const right = s.picked !== null && s.picked === q.answer;
  const [passage, cite] = (q.passage ?? "").split("\n— ");
  return (
    <div className="tc-scroll">
      <div className="tc-h tc-pixel">
        {s.title}
        {s.step ? ` · ${s.step[0]}/${s.step[1]}` : ""} {speakBtn}
      </div>
      <div className="tc-tagrow">
        <span className="tc-tag tc-pixel">{q.standard}</span>
        <span className="tc-tag std">{q.skill}</span>
      </div>
      {q.passage && (
        <div className="tc-passage">
          {passage}
          {cite && <div className="cite">— {cite}</div>}
        </div>
      )}
      <div className="tc-prompt">{q.prompt}</div>
      <div className="tc-answers">
        {q.choices.map((c, i) => {
          const st = s.picked === null ? "" : i === q.answer ? "right" : i === s.picked ? "wrong" : "";
          return (
            <button key={i} className={`tc-choice ${st}`} disabled={s.picked !== null} onClick={() => game.answer(i)}>
              <span className="key tc-pixel">{"ABCD"[i]}</span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {s.picked !== null && (
        <div className={`tc-feedback ${right ? "ok" : "no"}`}>
          <div className={`verdict tc-pixel ${right ? "ok" : "no"}`}>
            {right ? "✔ CORRECT!" : `✘ NOT QUITE: THE ANSWER IS ${"ABCD"[q.answer]}`}
            {s.purpose === "refuel" ? (right ? " · +1 LANTERN HOUR" : " · NO REFUEL") : ""}
          </div>
          <div>{q.explanation}</div>
          <div className="tc-btnrow right">
            <button className="tc-cta" autoFocus onClick={() => game.continueQuestion()}>Continue ▶</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Table({ title, rows, empty }: { title: string; rows: { std: string; skill: string; n: number; c: number }[]; empty: string }) {
  const n = rows.reduce((a, r) => a + r.n, 0);
  const c = rows.reduce((a, r) => a + r.c, 0);
  return (
    <div className="tc-reportblock">
      <div className="tc-h tc-pixel">
        {title} {n ? `· ${c}/${n} (${Math.round((100 * c) / n)}%)` : ""}
      </div>
      {rows.length ? (
        <table className="tc-report">
          <thead>
            <tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.std + v.skill}>
                <td className="c">{v.std}</td>
                <td>{v.skill}</td>
                <td className={v.c === v.n ? "ok" : v.c / v.n >= 0.75 ? "y" : "no"}>{v.c}/{v.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="dim">{empty}</p>
      )}
    </div>
  );
}

function Report({ game, highScore }: { game: ThreadGame; highScore: number }) {
  const u = game.ui;
  const caseRows = game.reportRows("case");
  const kitRows = game.reportRows("kit");
  const practice = [...caseRows, ...kitRows].filter((r) => r.c / r.n < 0.75);
  const allDone = game.caseList.every((c) => game.isSolved(c.id));
  return (
    <div className="tc-scroll">
      <div className="tc-h tc-pixel ok">MISSION REPORT · {gradeLabel(u.grade).toUpperCase()}</div>
      <p className="big">
        Score <b className="y">{u.score}</b>
        {u.score >= highScore && u.score > 0 ? " · NEW HIGH SCORE!" : ""} · Rank <b className="y">{game.rank}</b> · Threads re-woven this session: {u.solvedNow.length}
      </p>
      <Table title="CASE SKILLS (THE CHASE)" rows={caseRows} empty="No case questions yet." />
      <Table title="REFUELS AND TRANSMISSIONS" rows={kitRows} empty="No refuel or transmission questions yet." />
      {practice.length > 0 && (
        <p>
          <span className="y">Practice next:</span> {practice.map((v) => `${v.skill} (${v.std})`).join(", ")}.
        </p>
      )}
      {u.misses.length > 0 && (
        <div className="tc-reportblock">
          <div className="tc-h tc-pixel">DEAD ENDS (WHAT THEY TAUGHT)</div>
          <ul className="tc-list">
            {u.misses.slice(-8).map((m, i) => (
              <li key={i}>
                <b>{m.place}{m.era ? `, ${m.era}` : ""}</b> (looking for {m.bead}): {m.why}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="tc-btnrow">
        <button className="tc-cta" autoFocus onClick={() => game.nextCase()}>{allDone ? "Play a case again ▶" : "Next case ▶"}</button>
        <button className="tc-cta ghost small" onClick={() => game.toCases()}>The Loom (all cases)</button>
      </div>
    </div>
  );
}

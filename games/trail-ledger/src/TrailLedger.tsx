import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ChipAudio,
  arcadeLink,
  gradeFromArcade,
  initialGrade,
  isEarlyReader,
  loadProgress,
  readAloudPref,
  recordAnswer,
  rememberGrade,
  setReadAloudPref,
  speak,
  speechSupported,
  stopSpeaking,
  submitScore,
  type Grade,
} from "@/kit";
import { EXPEDITIONS } from "@/data/expeditions";
import { playable } from "@/data/standards";
import { Game } from "@/game/game";
import { BROWSER_HOOKS } from "@/game/kitmix";
import { GUIDE_LINES } from "@/render/guide";
import { Screen } from "@/render/screen";
import { LedgerBook, Panel } from "@/ui/Panel";
import "@/ui/tl.css";
import { exposeMusicDebug } from "@/kit/audio";
import { ARRIVED, JINGLES, MOTIFS, MUSEUM_SONG, OUT_OF_TIME, SONGS, TRAVEL_SONGS } from "@/music";

export const GAME_ID = "trail-ledger";

/** Trail Ledger's own 16-step bassline: a walking folk line in G (Hz; 0 = rest). */
const BASS = [98, 0, 123, 0, 147, 0, 123, 0, 110, 0, 131, 0, 147, 165, 147, 123];

const KEY_INDEX: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };

export default function TrailLedger() {
  const audio = useMemo(() => new ChipAudio(BASS, 100), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<Screen | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [grade, setGradeState] = useState<Grade>(() => initialGrade("6"));
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("6"))));
  const readRef = useRef(readAloud);
  readRef.current = readAloud;
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  const [touch, setTouch] = useState(false);
  const [layout, setLayout] = useState<{ mode: "side" | "stack"; cw: number }>({ mode: "side", cw: 640 });
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);

  const game = useMemo(
    () =>
      new Game(initialGrade("6"), {
        ...BROWSER_HOOKS,
        onAnswer: (q, correct) => recordAnswer(GAME_ID, q, correct),
        onChange: () => bump(),
        say: (t) => {
          if (readRef.current) speak(t);
        },
        sound: (s) => {
          if (s === "correct") audio.correct();
          else if (s === "wrong") audio.wrong();
          else if (s === "blip") audio.blip();
          else if (s === "checkpoint") {
            const motif = game.exp ? MOTIFS[game.exp.id] : undefined;
            if (motif) audio.playJingle(motif);
          } else if (s === "arrive") audio.playJingle(ARRIVED);
          else if (s === "late") audio.playJingle(OUT_OF_TIME);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audio],
  );

  // Canvas loop
  useEffect(() => {
    const sc = new Screen(canvasRef.current!, game, (dt) => {
      const before = game.sim?.day;
      game.update(dt);
      if (game.sim && game.sim.day !== before) bump();
    });
    screenRef.current = sc;
    sc.start();
    const params = new URLSearchParams(window.location.search);
    if (params.has("debug")) (window as unknown as { __tl: unknown }).__tl = { game, screen: sc };
    return () => {
      sc.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [game, audio]);

  // Music: the museum tune for choosing, packing and the report; the expedition's travel song on the
  // trail. It starts on the first tap or key, thins to lead + bass while you read or answer, and
  // hurries a little when the calendar is nearly out.
  const musicStarted = useRef(false);
  const startMusic = useCallback(() => {
    audio.unlock();
    if (!musicStarted.current) {
      musicStarted.current = true;
      bump();
    }
  }, [audio]);
  useEffect(() => {
    window.addEventListener("pointerdown", startMusic);
    window.addEventListener("keydown", startMusic);
    return () => {
      window.removeEventListener("pointerdown", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
  }, [startMusic]);
  useEffect(() => {
    audio.duckLevel = 0.22;
    exposeMusicDebug(audio, SONGS, JINGLES);
  }, [audio]);
  const ph = game.phase;
  const museum = !game.exp || ph === "select" || ph === "intro" || ph === "outfit" || ph === "arrived" || ph === "report" || (ph === "question" && game.asking?.purpose === "outfit");
  let hurry = false;
  if (ph === "travel" && game.exp && game.sim) {
    const left = game.exp.deadline[game.band] - game.sim.day;
    hurry = left - game.minDaysFrom(game.sim) <= 3;
  }
  useEffect(() => {
    if (!musicStarted.current) return;
    if (game.paused) {
      audio.stopSong();
      return;
    }
    audio.playSong(museum || !game.exp ? MUSEUM_SONG : TRAVEL_SONGS[game.exp.id] ?? MUSEUM_SONG);
    audio.setIntensity(museum || ph === "travel" ? "full" : "calm");
    audio.setTempoScale(hurry ? 1.06 : 1);
  });

  // A new step starts at the top of the panel.
  const stepKey = `${game.phase}|${game.at}|${game.asking?.q.id ?? ""}|${game.shown?.card.id ?? ""}`;
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [stepKey]);

  // Guide line on the museum canvas
  useEffect(() => {
    const sc = screenRef.current;
    if (!sc) return;
    sc.guideLine = !playable(grade) ? GUIDE_LINES.young : game.phase === "select" ? GUIDE_LINES.select : game.phase === "intro" ? game.exp!.guide.intro : game.phase === "report" ? game.exp!.guide.outro : "";
  });

  // Fit the 16:10 screen and the Ledger panel into the space under the toolbar.
  useEffect(() => {
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > height * 1.2) setLayout({ mode: "side", cw: Math.floor(Math.min(width * 0.56, height * 1.6)) });
      else setLayout({ mode: "stack", cw: Math.floor(Math.min(width, height * 0.42 * 1.6)) });
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
    if (game.phase === "report") {
      submitScore(GAME_ID, game.score);
      setHighScore(loadProgress(GAME_ID).highScore);
    }
  }, [game.phase, game]);

  const chooseGrade = useCallback(
    (g: Grade) => {
      rememberGrade(g);
      setGradeState(g);
      setReadAloud(readAloudPref(isEarlyReader(g)));
      game.setGrade(g);
    },
    [game],
  );

  const start = useCallback(
    (id: (typeof EXPEDITIONS)[number]["id"]) => {
      startMusic();
      rememberGrade(grade);
      game.choose(id);
    },
    [startMusic, game, grade],
  );

  const togglePause = useCallback(() => {
    if (game.phase !== "travel" && !game.paused) return;
    game.paused = !game.paused;
    if (game.paused) stopSpeaking();
    bump();
  }, [game, audio]);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  // Keyboard: 1–4 / A–D answer and choose, Enter/Space continue, P pause, M mute.
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      if (k === "m") {
        setMuted(audio.toggleMute());
        return;
      }
      if (!playable(grade)) return;
      if (k === "p" || (k === "Escape" && game.paused)) {
        togglePause();
        return;
      }
      if (game.paused) return;
      const go = k === "Enter" || k === " ";
      const idx = KEY_INDEX[k];
      // Let a focused button handle its own Enter/Space click.
      if (go && tag === "button") return;
      switch (game.phase) {
        case "select":
          if (k >= "1" && k <= String(EXPEDITIONS.length)) start(EXPEDITIONS[Number(k) - 1].id);
          break;
        case "intro":
          if (go) game.begin();
          break;
        case "outfit":
          if (go) game.finishOutfit();
          break;
        case "question":
          if (game.asking?.done) {
            if (go) game.continueQuestion();
          } else if (idx !== undefined) game.answer(idx);
          if (k === "r") speakQ();
          break;
        case "landmark":
          if (go) game.continueLandmark();
          break;
        case "travel":
          if (k === "w") game.workNow();
          else if (k === "t" || k === "ArrowRight") {
            game.fast = !game.fast;
            bump();
          } else if (k === "g") game.setPace((game.sim.pace + 1) % game.exp!.paces.length);
          else if (k === "f") game.setRation((game.sim.ration + 1) % game.exp!.rations.length);
          break;
        case "event":
          if (idx !== undefined) game.decide(idx);
          break;
        case "outcome":
          if (go) game.continueOutcome();
          break;
        case "notice":
          if (go) game.continueNotice();
          break;
        case "fork":
          if (k === "1" || k === "a") game.fork(true);
          else if (k === "2" || k === "b") game.fork(false);
          break;
        case "wintered":
          if (go) game.retry();
          break;
        case "arrived":
          if (go) game.showReport();
          break;
        case "report":
          if (go) game.toSelect();
          break;
      }
      if (go || idx !== undefined) ev.preventDefault();
    };
    const speakQ = () => {
      const a = game.asking;
      if (a) speak(`${a.header ? a.header.text + " " : ""}${a.q.passage ? a.q.passage + " " : ""}${a.q.prompt} ${a.q.choices.map((c, i) => `${"ABCD"[i]}: ${c}.`).join(" ")}`);
    };
    const blur = () => {
      if (game.phase === "travel" && !game.paused) togglePause();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("blur", blur);
    };
  }, [game, audio, grade, start, togglePause]);

  const fromArcade = gradeFromArcade();
  const early = isEarlyReader(grade);

  return (
    <div className={`tl-root ${touch ? "touch" : ""} ${early ? "early" : ""}`}>
      <div className="tl-toolbar">
        <a href={arcadeLink(grade)} className="tl-pixel">◀ ARCADE</a>
        <div className="tl-tools">
          {game.phase === "travel" || game.paused ? (
            <button className="tl-pixel" onClick={togglePause}>{game.paused ? "RESUME" : "PAUSE"}</button>
          ) : null}
          {muted ? (
            <button className="tl-pixel" onClick={() => setMuted(audio.toggleMute())} title="Sound is off on this device (M)">SOUND OFF</button>
          ) : (
            <>
              <button className="tl-pixel" onClick={() => setMusicOn(audio.toggleMusic())} aria-pressed={musicOn} title="Music on/off">{musicOn ? "MUSIC ON" : "MUSIC OFF"}</button>
              <button className="tl-pixel" onClick={() => setSfxOn(audio.toggleSfx())} aria-pressed={sfxOn} title="Sound effects on/off (M mutes everything)">{sfxOn ? "SFX ON" : "SFX OFF"}</button>
            </>
          )}
          {speechSupported() && (
            <button className="tl-pixel" onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>
      <div className={`tl-main ${layout.mode}`} ref={mainRef}>
        <div className="tl-left" style={{ width: layout.cw }}>
          <div className="tl-screen">
            <canvas ref={canvasRef} aria-label="Trail Ledger scene" onPointerDown={() => audio.unlock()} />
          </div>
          {layout.mode === "side" && playable(grade) && <LedgerBook game={game} />}
        </div>
        <div className="tl-panel" ref={panelRef} style={layout.mode === "stack" ? { maxWidth: Math.max(layout.cw, 760) } : undefined}>
          <Panel
            game={game}
            grade={grade}
            fromArcade={fromArcade}
            highScore={highScore}
            readAloud={readAloud}
            onGrade={chooseGrade}
            onStart={start}
            onPause={togglePause}
            onBump={bump}
          />
        </div>
        {game.paused && (
          <div className="tl-overlay">
            <div className="tl-card center">
              <div className="tl-title tl-pixel">PAUSED</div>
              <button className="tl-cta" autoFocus onClick={togglePause}>Resume ▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

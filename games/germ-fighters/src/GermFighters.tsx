import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  exposeMusicDebug,
  GRADES,
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
  type Grade,
  type Question,
  type Subject,
} from "@/kit";
import { bandOf } from "@/germs/band";
import { BOOSTS, BOOST_IDS, CLUES_PER_STAGE, type BoostId } from "@/germs/boosts";
import { catalog } from "@/germs/bank";
import { GermEngine, type Hud } from "@/germs/engine";
import {
  FOCUS_SUBJECTS,
  MIXED,
  SUBJECT_CHOICES,
  allLabel,
  focusFromUrl,
  focusLabel,
  focusTopic,
  loadFocus,
  refocusSavedForGrade,
  saveFocus,
  topicForSubject,
  topicsOf,
  validateFocus,
  type FocusChoice,
  type GermSubject,
  type TopicChoice,
} from "@/germs/focus";
import { GermQuestions, dealQuestion, resolveVirus, resolveZone, sourceLabel, type Slot } from "@/germs/questions";
import { bossNameOf, drawBoostIcon, drawBoss, drawHelper, drawHero, drawPowerIcon, HERO_COLORS, type BossKey } from "@/germs/render";
import { HERO, POWERS, RUSH, VIRUSES, ZONES, virusById, zoneById, type PowerId, type StageId, type VirusId, type Zone, type ZoneId } from "@/germs/roster";
import { loadSave, markBeaten, markRush, markVirus, powersOf, rushOpen, writeSave, type AnswerResult, type SaveData } from "@/germs/rules";
import { MAX_ENERGY, POWER_MAX, startLives } from "@/germs/sim";
import { BOSS_WARNING, GAME_OVER, JINGLES, SELECT_SONG, SONGS, STAGE_CLEARED, VICTORY, VIRUS_DOWN, bossSongFor, stageSongFor } from "@/music";
import "@/germs/germs.css";

const GAME_ID = "germ-fighters";

type Screen = "title" | "select" | "playing" | "cleared" | "over" | "victory";

interface Quiz {
  /** The boss's antigen panel, or Antigen Clue n (0-based) before the boss. */
  kind: "boss" | "clue";
  n: number;
  stage: StageId;
  /** The zone or Major Virus whose question source was used. */
  slot: Slot;
  q: Question;
  picked: number | null;
  result: AnswerResult | null;
  line: string | null;
}

interface LogEntry {
  stage: StageId;
  /** Answered at an Antigen Clue (not a boss). */
  clue: boolean;
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
}

const SUBJECT_TAG: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" };

/** Stage select layout: body zones around the Lymph Node (null = the middle tile). */
const GRID: (ZoneId | null)[] = ["nose", "throat", "lungs", "mouth", null, "blood", "stomach", "gut", "skin"];

const EMPTY_HUD: Hud = {
  energy: MAX_ENERGY, lives: 3, power: POWER_MAX, sel: null, powers: [], score: 0, mode: "play", bossHp: 0, bossMax: 0, weakReady: false, progress: 0, checkpoint: -1,
  boosts: [], cluesDone: 0, cluesTotal: CLUES_PER_STAGE, rushIdx: 0,
};

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
const isVirus = (k: string): k is VirusId => VIRUSES.some((v) => v.id === k);

function initialFocus(grade: Grade): { choice: FocusChoice; note: string | null } {
  const url = focusFromUrl(typeof window === "undefined" ? "" : window.location.search, grade, catalog);
  let note: string | null = null;
  if (url.unavailable) {
    const t = focusTopic(url.unavailable);
    note = `${t.label} is for ${catalog.gradesNote(t.id)}, not ${gradeLabel(grade)}.`;
  }
  return { choice: url.choice ?? validateFocus(loadFocus(), grade, catalog), note };
}

function stageName(id: StageId): string {
  return id === "rush" ? RUSH.stage.name : zoneById(id).stage.name;
}

function linesOf(key: BossKey) {
  return isVirus(key) ? virusById(key).lines : zoneById(key).lines;
}

export default function GermFighters() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GermEngine | null>(null);
  const questionsRef = useRef<GermQuestions | null>(null);
  const audio = useMemo(() => new ChipAudio(), []);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [focusInit] = useState(() => initialFocus(initialGrade("3")));
  const [focus, setFocus] = useState<FocusChoice>(focusInit.choice);
  const [focusNote, setFocusNote] = useState<string | null>(focusInit.note);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>("title");
  const [stage, setStage] = useState<StageId>("nose");
  const [hud, setHud] = useState<Hud>(EMPTY_HUD);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [say, setSay] = useState<{ who: string; text: string; card?: string[] } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  useEffect(() => exposeMusicDebug(audio, SONGS, JINGLES), [audio]);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch, setTouch] = useState(false);
  const [highScore, setHighScore] = useState(() => loadProgress(GAME_ID).highScore);
  const [selFocus, setSelFocus] = useState(0);
  /** Lymph Node: the Major Virus reached in this run (a retry can start there). */
  const [rushReached, setRushReached] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const stageIdRef = useRef(stage);
  stageIdRef.current = stage;
  const gradeRef = useRef(grade);
  gradeRef.current = grade;
  const early = isEarlyReader(grade);
  const runFocus = useMemo(() => validateFocus(focus, grade, catalog), [focus, grade]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScreenWidth(Math.floor(Math.min(width, height * 1.6)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const ask = useCallback((kind: "boss" | "clue", n: number) => {
    const qs = questionsRef.current;
    const sim = engineRef.current?.sim;
    if (!qs || !sim) return;
    const id = stageIdRef.current;
    // Clues ask from the same source as the stage's boss. In the Lymph Node, clues borrow a body zone's
    // health questions (saving each virus's own facts for its fight), and boss panels ask the virus that is up.
    const slot: Slot = id !== "rush" ? id : kind === "clue" ? ZONES[(n * 3 + 1) % ZONES.length].id : sim.bossKey;
    const q = qs.draw(slot);
    engineRef.current?.releaseAll();
    const dealt = dealQuestion(q);
    setQuiz({ kind, n, stage: id, slot, q: dealt, picked: null, result: null, line: null });
    if (readAloudRef.current) speakQuestion(dealt.prompt, dealt.choices);
  }, []);

  // The engine lives as long as the page; menus show a stage scrolling behind them.
  useEffect(() => {
    const engine = new GermEngine(canvasRef.current!, audio, {
      onHud: setHud,
      onBossIntro: (key) => {
        const id = stageIdRef.current;
        audio.playJingle(BOSS_WARNING, { then: bossSongFor(id) });
        const lines = linesOf(key);
        if (isVirus(key)) {
          const v = virusById(key);
          setRushReached(VIRUSES.indexOf(v));
          setSay({ who: v.name, text: lines.intro, card: v.card });
          if (readAloudRef.current) speak(`${lines.intro} ${v.card.join(" ")}`);
        } else {
          setSay({ who: bossNameOf(key), text: lines.intro });
          if (readAloudRef.current) speak(lines.intro);
        }
      },
      onQuestion: (kind, n) => ask(kind, n),
      onVirusDown: (virus, next) => {
        setSave((s) => {
          const nx = markVirus(s, virus);
          writeSave(nx);
          return nx;
        });
        if (next) audio.playJingle(VIRUS_DOWN, { then: bossSongFor("rush") });
        const v = virusById(virus);
        setSay({ who: v.name, text: v.lines.defeat, card: v.card });
      },
      onCleared: () => {
        const id = stageIdRef.current;
        setQuiz(null);
        setSay(null);
        setSave((s) => {
          const nx = id === "rush" ? markRush(s) : markBeaten(s, id);
          writeSave(nx);
          return nx;
        });
        setHighScore(submitScore(GAME_ID, engine.sim?.s.score ?? 0));
        setScreen(id === "rush" ? "victory" : "cleared");
        audio.playJingle(id === "rush" ? VICTORY : STAGE_CLEARED, { then: "stop" });
        if (readAloudRef.current) speak(id === "rush" ? RUSH.lines.defeat : zoneById(id).lines.defeat);
      },
      onGameOver: () => {
        setQuiz(null);
        setSay(null);
        setHighScore(submitScore(GAME_ID, engine.sim?.s.score ?? 0));
        setScreen("over");
        audio.stopMusic();
        audio.playJingle(GAME_OVER, { then: "stop" });
      },
    });
    engineRef.current = engine;
    engine.showPreview("nose", bandOf(gradeRef.current));
    engine.start();
    return () => {
      engine.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio, ask]);

  const chooseGrade = useCallback((g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setFocus((f) => validateFocus(f, g, catalog));
    refocusSavedForGrade(g, catalog);
    setFocusNote(null);
    setReadAloud(readAloudPref(isEarlyReader(g)));
  }, []);

  const chooseFocus = useCallback((f: FocusChoice) => {
    setFocus(f);
    saveFocus(f);
    setFocusNote(null);
  }, []);

  const toSelect = useCallback(() => {
    audio.unlock();
    audio.playSong(SELECT_SONG);
    stopSpeaking();
    rememberGrade(grade);
    setQuiz(null);
    setSay(null);
    setPaused(false);
    setScreen("select");
    engineRef.current?.showPreview("nose", bandOf(grade));
  }, [audio, grade]);

  const startStage = useCallback((id: StageId, rushFrom = 0) => {
    audio.unlock();
    stopSpeaking();
    audio.playSong(stageSongFor(id), { restart: true });
    if (!questionsRef.current || questionsRef.current.grade !== grade || JSON.stringify(questionsRef.current.choice) !== JSON.stringify(runFocus)) {
      questionsRef.current = new GermQuestions(grade, runFocus, catalog);
    }
    setStage(id);
    stageIdRef.current = id;
    setQuiz(null);
    setSay(null);
    setPaused(false);
    setRushReached(rushFrom);
    setHud({ ...EMPTY_HUD, lives: startLives(bandOf(grade)), powers: powersOf(save), rushIdx: rushFrom });
    setScreen("playing");
    engineRef.current?.startStage(id, bandOf(grade), powersOf(save), rushFrom);
  }, [audio, grade, runFocus, save]);

  // Debug / playtest hooks.
  useEffect(() => {
    if (!debug) return;
    const w = window as unknown as Record<string, unknown>;
    w.__gf = {
      engine: engineRef.current,
      get sim() {
        return engineRef.current?.sim ?? null;
      },
      warpToBoss: (virus?: number) => engineRef.current?.warpToBoss(virus),
      giveBoost: (id: BoostId) => engineRef.current?.giveBoost(id),
      forceQuestion: () => engineRef.current?.forceQuestion(),
      /** Skips to the Lymph Node's Major Virus rush (all eight zones counted as identified), at virus n. */
      skipToRush: (n = 0) => {
        const all: SaveData = { ...save, beaten: ZONES.map((z) => z.id) };
        writeSave(all);
        setSave(all);
        startStage("rush", n);
        setTimeout(() => engineRef.current?.warpToBoss(n), 50);
      },
    };
    w.__gfQuiz = quiz;
    w.__gfSave = save;
    w.__gfScreen = screen;
  }, [quiz, save, screen, startStage]);

  const answer = useCallback(
    (i: number) => {
      if (!quiz || quiz.picked !== null) return;
      audio.unlock();
      const correct = i === quiz.q.answer;
      recordAnswer(GAME_ID, quiz.q, correct);
      setLog((l) => [...l, { stage: quiz.stage, clue: quiz.kind === "clue", subject: quiz.q.subject, standard: quiz.q.standard, skill: quiz.q.skill, correct }]);
      const result = engineRef.current?.answer(correct) ?? null;
      const n = log.length;
      let line: string | null = null;
      if (quiz.kind === "boss") {
        const lines = linesOf(quiz.slot);
        line = result?.defeated ? lines.defeat : correct ? lines.hit[n % lines.hit.length] : lines.block[n % lines.block.length];
      }
      setQuiz({ ...quiz, picked: i, result, line });
      if (readAloudRef.current) speak(correct ? `Correct! ${quiz.q.explanation}` : `The answer is ${quiz.q.choices[quiz.q.answer]}. ${quiz.q.explanation}`);
    },
    [quiz, audio, log.length],
  );

  const next = useCallback(() => {
    if (!quiz || quiz.picked === null) return;
    stopSpeaking();
    setQuiz(null);
    if (!(quiz.stage === "rush" && quiz.result?.defeated)) setSay(null);
    engineRef.current?.resume();
  }, [quiz]);

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
    if (quiz) speakQuestion(quiz.q.prompt, quiz.q.choices);
  }, [quiz]);

  const eraseSave = useCallback(() => {
    const empty: SaveData = { beaten: [], viruses: [], rush: false };
    writeSave(empty);
    setSave(empty);
  }, []);

  // Keyboard. A-D are only ever answer keys, never movement.
  useEffect(() => {
    const HELD: Record<string, "left" | "right" | "jump"> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", " ": "jump" };
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      if (k === "m") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen === "title") {
        if (ev.key === "Enter" && !(ev.target instanceof HTMLButtonElement)) {
          ev.preventDefault();
          toSelect();
        }
        return;
      }
      if (screen === "select") {
        if (ev.key === "Escape") setScreen("title");
        return;
      }
      if (screen !== "playing") return;
      const idx = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (quiz) {
        if (quiz.picked === null && idx >= 0) {
          ev.preventDefault();
          answer(idx);
        } else if (quiz.picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          if (!ev.repeat) next();
        } else if (k === "r") replay();
        else if (ev.key === " " || ev.key.startsWith("Arrow")) ev.preventDefault();
        return;
      }
      if (k === "p" || ev.key === "Escape") {
        togglePause();
        return;
      }
      if (paused) return;
      const e = engineRef.current;
      if (!e) return;
      const held = HELD[ev.key];
      if (held) {
        ev.preventDefault();
        e.setHeld(held, true);
        return;
      }
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        return;
      }
      if (k === "z") {
        if (!ev.repeat) e.setHeld("shoot", true);
      } else if (k === "x") {
        if (!ev.repeat) e.press("power");
      } else if (k === "c") {
        if (!ev.repeat) e.press("cycle");
      }
    };
    const up = (ev: KeyboardEvent) => {
      const held = HELD[ev.key];
      if (held) engineRef.current?.setHeld(held, false);
      if (ev.key.toLowerCase() === "z") engineRef.current?.setHeld("shoot", false);
    };
    const blur = () => {
      engineRef.current?.releaseAll();
      if (screen === "playing" && !quiz) togglePause(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, quiz, paused, answer, next, togglePause, replay, toSelect, audio]);

  // Touch pad: arrows, jump and Granule Blast are held, skill and switch fire on press.
  const holdProps = (k: "left" | "right" | "jump" | "shoot") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      engineRef.current?.setHeld(k, true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        // pointer already gone
      }
    },
    onPointerUp: () => engineRef.current?.setHeld(k, false),
    onPointerCancel: () => engineRef.current?.setHeld(k, false),
    onLostPointerCapture: () => engineRef.current?.setHeld(k, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const pressProps = (a: "power" | "cycle") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      engineRef.current?.press(a);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const playing = screen === "playing";
  const showPad = touch && playing && !quiz;
  const owned = powersOf(save);

  return (
    <div className={`gf-root ${early ? "early" : ""}`}>
      <div className="gf-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="gf-tools">
          {playing && <button onClick={() => togglePause()}>{paused ? "RESUME" : "PAUSE"}</button>}
          {playing && <button onClick={toSelect}>STAGES</button>}
          {muted ? (
            <button onClick={() => setMuted(audio.toggleMute())} title="Sound is off on this device (M)">SOUND OFF</button>
          ) : (
            <>
              <button className="gf-music" onClick={() => setMusicOn(audio.toggleMusic())} aria-pressed={musicOn} title="Music on/off">{musicOn ? "MUSIC ON" : "MUSIC OFF"}</button>
              <button className="gf-sfx" onClick={() => setSfxOn(audio.toggleSfx())} aria-pressed={sfxOn} title="Sound effects on/off">{sfxOn ? "SFX ON" : "SFX OFF"}</button>
            </>
          )}
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`gf-cabinet ${showPad ? "touch-on" : ""}`}>
        <div className="gf-hud gf-pixel">
          <div><span className="lbl">Zone</span><span className="val">{playing || screen === "over" ? stageName(stage) : "Select"}</span></div>
          <div><span className="lbl">Lives</span><span className="val lives">{"♥".repeat(Math.max(0, playing ? hud.lives : 0))}</span></div>
          <div><span className="lbl">Score</span><span className="val">{String(hud.score).padStart(6, "0")}</span></div>
          <div><span className="lbl">Hi</span><span className="val">{String(Math.max(highScore, hud.score)).padStart(6, "0")}</span></div>
          <div className="gf-hudpower">
            <span className="lbl">Skill</span>
            <span className="val" style={{ color: hud.sel ? POWERS[hud.sel].color : undefined }}>{playing && hud.sel ? POWERS[hud.sel].name : "—"}</span>
          </div>
        </div>

        <div className="gf-stage" ref={stageRef}>
          <div className="gf-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Germ Fighters game screen" />
            {playing && hud.boosts.length > 0 && (
              <div className="gf-boosts gf-pixel" aria-live="polite">
                {hud.boosts.map((b) => (
                  <span key={b.id} className={`gf-boost ${b.left < 120 ? "ending" : ""}`} data-boost={b.id} style={{ borderColor: BOOSTS[b.id].color }}>
                    <BoostIcon id={b.id} />
                    <span className="nm">{BOOSTS[b.id].name}</span>
                    <span className="sec">{Math.ceil(b.left / 60)}s</span>
                    <span className="meter" style={{ width: `${(100 * b.left) / b.max}%`, background: BOOSTS[b.id].color }} />
                  </span>
                ))}
              </div>
            )}

            {screen === "title" && (
              <TitleScreen grade={grade} onGrade={chooseGrade} focus={focus} focusNote={focusNote} onFocus={chooseFocus} onStart={toSelect} save={save} onErase={eraseSave} highScore={highScore} />
            )}

            {screen === "select" && (
              <StageSelect grade={grade} focus={runFocus} save={save} onPick={(id) => startStage(id)} onBack={() => setScreen("title")} sel={selFocus} onSel={setSelFocus} />
            )}

            {playing && paused && !quiz && (
              <div className="gf-overlay">
                <div className="gf-panel" style={{ textAlign: "center" }}>
                  <div className="gf-title gf-pixel">PAUSED</div>
                  <HowToPlay />
                  <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="gf-cta ghost" onClick={toSelect}>Stage select</button>
                    <button className="gf-cta" autoFocus onClick={() => togglePause(false)}>Resume</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "cleared" && stage !== "rush" && (
              <Cleared zone={zoneById(stage)} save={save} onNext={toSelect} clues={log.filter((l) => l.clue && l.stage === stage).slice(-CLUES_PER_STAGE)} />
            )}

            {screen === "over" && (
              <div className="gf-overlay">
                <div className="gf-panel" style={{ textAlign: "center" }}>
                  <div className="gf-h gf-pixel" style={{ color: "var(--gf-red)" }}>OUT OF LIVES</div>
                  <div className="gf-help big">
                    {HERO.name} needs a quick rest! Your identified germs, immune skills and virus cards are saved.
                  </div>
                  <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="gf-cta ghost" onClick={toSelect}>Stage select</button>
                    {stage === "rush" && rushReached > 0 && (
                      <button className="gf-cta ghost" data-retry-virus={rushReached} onClick={() => startStage("rush", rushReached)}>Retry from {VIRUSES[rushReached].name} ▶</button>
                    )}
                    <button className="gf-cta" autoFocus onClick={() => startStage(stage)}>Try {stageName(stage)} again ▶</button>
                  </div>
                </div>
              </div>
            )}

            {screen === "victory" && (
              <Victory log={log} grade={grade} focus={runFocus} score={hud.score} highScore={highScore} onMenu={() => setScreen("title")} onSelect={toSelect} />
            )}
          </div>
        </div>

        {playing && say && !quiz && (
          <div className="gf-say" role="status">
            <b>{say.who}</b>
            {say.text}
            {say.card && (
              <ul className="gf-card" data-virus-card={say.who}>
                {say.card.map((c) => <li key={c}>{c}</li>)}
              </ul>
            )}
          </div>
        )}

        {playing && quiz && <QuizPanel quiz={quiz} grade={grade} focus={runFocus} rushIdx={hud.rushIdx} onAnswer={answer} onNext={next} onSpeak={replay} />}

        <div className={`gf-controls ${showPad ? "show" : ""}`}>
          <div className="gf-pad move">
            <button className="gf-touch" {...holdProps("left")} aria-label="Move left">◀</button>
            <button className="gf-touch" {...holdProps("right")} aria-label="Move right">▶</button>
          </div>
          <div className="gf-pad act">
            <div className="gf-col">
              <button className="gf-touch cyc" {...pressProps("cycle")} disabled={owned.length < 2} aria-label="Switch skill">SWAP</button>
              <button className="gf-touch word pow" {...pressProps("power")} disabled={owned.length === 0} aria-label="Use skill">SKILL</button>
            </div>
            <button className="gf-touch word blast" {...holdProps("shoot")} aria-label={HERO.attack.name}>{HERO.attack.button}</button>
            <button className="gf-touch word jump" {...holdProps("jump")} aria-label="Jump">JUMP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ small pieces

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}

/** A germ, a virus, the hero or the helper drawn in a small pixel canvas. */
function Portrait({ who, size = 2 }: { who: BossKey | "hero" | "helper"; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(size, 0, 0, size, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 40, 46);
    if (who === "hero") {
      ctx.save();
      ctx.translate(6, 10);
      ctx.scale(1.4, 1.4);
      drawHero(ctx, 0, 0, { facing: 1, frame: 0, air: false, colors: HERO_COLORS });
      ctx.restore();
    } else if (who === "helper") {
      ctx.save();
      ctx.translate(4, 8);
      ctx.scale(1.6, 1.6);
      drawHelper(ctx, 0, 0, 0);
      ctx.restore();
    } else drawBoss(ctx, who, 7, 10, { t: 0, facing: -1 });
  }, [who, size]);
  return <canvas ref={ref} width={40 * size} height={46 * size} aria-hidden="true" />;
}

function BoostIcon({ id }: { id: BoostId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawBoostIcon(ctx, id, 0, 0, 2);
  }, [id]);
  return <canvas ref={ref} width={20} height={20} className="ico" aria-hidden="true" />;
}

function PowerIcon({ p }: { p: PowerId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawPowerIcon(ctx, p, 0, 0, 2);
  }, [p]);
  return <canvas ref={ref} width={20} height={20} style={{ width: 14, height: 14, imageRendering: "pixelated", verticalAlign: "middle" }} aria-hidden="true" />;
}

function QuizPanel({ quiz, grade, focus, rushIdx, onAnswer, onNext, onSpeak }: { quiz: Quiz; grade: Grade; focus: FocusChoice; rushIdx: number; onAnswer: (i: number) => void; onNext: () => void; onSpeak: () => void }) {
  const { q, picked, result } = quiz;
  const name = bossNameOf(quiz.slot);
  const done = picked !== null;
  const correct = done && picked === q.answer;
  const src = isVirus(quiz.slot) ? sourceLabel(resolveVirus(quiz.slot, grade, focus, catalog)) : sourceLabel(resolveZone(zoneById(quiz.slot), grade, focus, catalog));
  const clue = quiz.kind === "clue";
  const reward = result?.reward;
  let verdict = "";
  if (done && clue) {
    const got = reward ? `+${reward.energy} ENERGY${reward.boost ? ` + ${BOOSTS[reward.boost].name.toUpperCase()}` : ""}` : "";
    verdict = correct ? `✔ RIGHT! ANTIGEN IDENTIFIED! ${got}` : `✘ THE ANSWER IS ${"ABCD"[q.answer]}. HANA STILL CRACKS THE CLUE: ${got}`;
  } else if (done) {
    if (!correct) verdict = `✘ BLOCKED! THE ANSWER IS ${"ABCD"[q.answer]}`;
    else if (result?.defeated) verdict = `✔ ${result.weakness ? "DOUBLE HIT! " : ""}${name} IS IDENTIFIED!`;
    else if (result?.weakness) verdict = "✔ WEAK SPOT! DOUBLE HIT!";
    else verdict = "✔ RIGHT! BIG HIT!";
  }
  const rush = quiz.stage === "rush";
  return (
    <div className={`gf-quiz ${clue ? "clue" : ""} ${done ? (correct ? "correct" : "wrong") : ""}`} role="dialog" aria-label={clue ? "Antigen Clue question" : "Boss question"} data-kind={quiz.kind}>
      <div className="head gf-pixel">
        <span>
          {clue ? `ANTIGEN CLUE ${quiz.n + 1}/${CLUES_PER_STAGE} · HANA ASKS` : `ANTIGEN PANEL · ${name}`}
          {!clue && rush ? ` · MAJOR VIRUS ${rushIdx + 1}/${VIRUSES.length}` : ""}
        </span>
        <span className="std">
          {src} · {q.standard}
          {speechSupported() && (
            <button type="button" className="gf-speak" onClick={onSpeak} aria-label="Read the question aloud" title="Read aloud (R)">
              <SpeakerIcon />
            </button>
          )}
        </span>
      </div>
      {q.passage && <div className="passage">{q.passage}</div>}
      <div className="prompt">{q.prompt}</div>
      <div className="opts">
        {q.choices.map((c, i) => {
          const state = done ? (i === q.answer ? "ans" : i === picked ? "wrong" : "") : "";
          return (
            <button key={i} type="button" className={`opt ${state}`} disabled={done} onClick={() => onAnswer(i)}>
              <b>{"ABCD"[i]}</b>
              <span>{c}</span>
            </button>
          );
        })}
      </div>
      {done && (
        <div className="feedback">
          <div className={`verdict gf-pixel ${correct ? "ok" : "no"}`}>{verdict}</div>
          <div className="why">{q.explanation}</div>
          {quiz.line && <div className="boss-line">{name}: “{quiz.line}”</div>}
          <div className="row">
            <span className="dim">
              {clue
                ? correct
                  ? reward?.boost ? `${BOOSTS[reward.boost].name}: ${BOOSTS[reward.boost].desc}. ${BOOSTS[reward.boost].science}` : "Energy refilled!"
                  : "No problem: wrong answers never cost energy or lives. The biofilm wall is gone either way."
                : !correct ? "Wrong answers never cost energy or lives. Open the panel again for a new question!" : ""}
            </span>
            <button className="gf-cta" autoFocus onClick={onNext}>{clue ? "Keep going ▶" : result?.defeated ? "Identified! ▶" : "Back to the fight ▶"}</button>
          </div>
        </div>
      )}
      {!done && <div className="hint dim">Press 1–4 or A–D, or tap an answer.</div>}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="gf-help" style={{ marginTop: 10, textAlign: "left" }}>
      <kbd>◀</kbd> <kbd>▶</kbd> move · <kbd>▲</kbd> or <kbd>SPACE</kbd> jump · <kbd>Z</kbd> {HERO.attack.name} (hold to keep launching granules) · <kbd>X</kbd> use your immune skill ·{" "}
      <kbd>C</kbd> switch skill · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>ESC</kbd> pause · <kbd>M</kbd> mute · <kbd>R</kbd> read aloud.
      On a phone or tablet: ◀ ▶, JUMP, {HERO.attack.button}, SKILL and SWAP.
      <br />
      You are <span className="c">{HERO.name}</span>, {HERO.blurb}. <span className="dim">{HERO.attack.science}</span> Germs have snuck into eight <span className="r">body zones</span>! Pick any zone, hop past
      pits and <span className="y">timed hazards</span>, and pop the germs with granules: they poof into harmless sparkles, and macrophage pals gobble them up. Rod bacteria
      left alone <span className="y">split in two</span>, just like real bacteria, so pop them early! Green flags are <span className="g">checkpoints</span>. At the end, hit the
      stage germ with granules to open its <span className="y">antigen panel</span>: a right answer is a big hit, a wrong one is only blocked (you never lose a fight by answering
      wrong). Identify a stage germ to earn its <span className="y">immune skill</span>. Use a germ's <span className="y">weak-spot skill</span> during its fight to make
      your next right answer a double hit, and use the matching skill to heal each zone's glowing <span className="y">infected cell</span> for a 1-up.
      Identify all eight to open the <span className="r">Lymph Node</span> and face the six <span className="r">Major Viruses</span>!
      <br />
      Halfway through each zone, {HERO.helper} the helper T cell runs a <span className="g">REST stop</span> with energy. After it, three glowing{" "}
      <span className="y">Antigen Clues</span> (germs with a <b>?</b>) sit in front of sticky biofilm walls. Hit one with a granule for a question: a right answer gives a big{" "}
      <span className="y">energy refill</span> and often a <span className="c">power-up</span>; a wrong answer is fine too (a little energy, nothing lost) and the wall
      still goes away. Power-ups last a few seconds (watch the timer):{" "}
      {BOOST_IDS.map((id, i) => (
        <span key={id}>
          <b style={{ color: BOOSTS[id].color }}>{BOOSTS[id].name}</b> ({BOOSTS[id].desc}, {Math.round(BOOSTS[id].frames / 60)} s){i < BOOST_IDS.length - 1 ? " · " : "."}
        </span>
      ))}{" "}
      Grabbing one you already have restarts its timer. Look for hidden <b>?</b> capsules on high shelves, and use Lymph Leap to reach the tall ledges!
    </div>
  );
}

function radioKeys(e: React.KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const btns = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[role=radio]:not(:disabled)")];
  if (btns.length === 0) return;
  e.preventDefault();
  const i = btns.indexOf(document.activeElement as HTMLButtonElement);
  let j = e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
  j = (j + btns.length) % btns.length;
  btns[j].focus();
  btns[j].click();
}

function FocusPicker({ grade, focus, note, onFocus }: { grade: Grade; focus: FocusChoice; note: string | null; onFocus: (f: FocusChoice) => void }) {
  const avail = catalog.available(grade);
  const subj = focus.subject === "mixed" ? null : focus.subject;
  const pickSubject = (s: GermSubject) => {
    if (s === "mixed") onFocus(MIXED);
    else if (s !== focus.subject) onFocus({ subject: s, topic: s === "science" && avail.includes("life") ? "life" : topicForSubject(s, grade, catalog) });
  };
  const topics: { id: TopicChoice; label: string; ok: boolean; note?: string }[] = subj
    ? [{ id: "all", label: allLabel(subj), ok: true }, ...topicsOf(subj).map((t) => ({ id: t.id, label: t.label, ok: avail.includes(t.id), note: catalog.gradesNote(t.id) }))]
    : [];
  return (
    <div className="gf-focus">
      <div className="gf-h gf-pixel" style={{ marginTop: 14 }}>PICK A SUBJECT</div>
      <div className="gf-subjects" role="radiogroup" aria-label="Subject" onKeyDown={radioKeys}>
        {SUBJECT_CHOICES.map((s) => {
          const on = focus.subject === s.id;
          return (
            <button key={s.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} data-subject={s.id} className={`gf-subject ${on ? "on" : ""}`} onClick={() => pickSubject(s.id)}>
              <span className="gf-pixel">{s.label}</span>
              <small>{s.note}</small>
            </button>
          );
        })}
      </div>
      {note && <div className="gf-help gf-focusnote">{note}</div>}
      {subj && (
        <div className="gf-chips topics" role="radiogroup" aria-label="Topic" onKeyDown={radioKeys}>
          {topics.map((t) => {
            const on = t.ok && focus.subject !== "mixed" && focus.topic === t.id;
            return (
              <button key={t.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} disabled={!t.ok} className={`gf-chip ${t.id === "all" ? "all" : ""} ${on ? "on" : ""}`} data-topic={t.id} onClick={() => onFocus({ subject: subj, topic: t.id })} title={t.ok ? t.label : `${t.label}: ${t.note}`}>
                {t.label}
                {!t.ok && <small>{t.note}</small>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function focusLine(focus: FocusChoice): string {
  if (focus.subject === "mixed") return "Health questions, mixed with math, ELA and social studies";
  if (focus.subject === "science" && (focus.topic === "life" || focus.topic === "all")) return focus.topic === "life" ? "Life science & health: germs, the body and how it fights back" : "Health plus all of science";
  return focus.topic === "all" ? `${FOCUS_SUBJECTS.find((x) => x.id === focus.subject)!.label} (each zone picks a topic)` : focusTopic(focus.topic).label;
}

function TitleScreen({
  grade, onGrade, focus, focusNote, onFocus, onStart, save, onErase, highScore,
}: {
  grade: Grade; onGrade: (g: Grade) => void; focus: FocusChoice; focusNote: string | null; onFocus: (f: FocusChoice) => void; onStart: () => void;
  save: SaveData; onErase: () => void; highScore: number;
}) {
  const fromArcade = gradeFromArcade();
  const [confirmErase, setConfirmErase] = useState(false);
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { startRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="gf-overlay title">
      <div className="gf-panel title">
        <div className="gf-logo"><Portrait who="hero" /><Portrait who="helper" /></div>
        <div className="gf-title gf-pixel">GERM FIGHTERS</div>
        <div className="gf-sub gf-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>
        <div className="gf-tag">Germs have snuck into the body! Help <b className="c">{HERO.name}</b> the killer T cell identify them — with right answers!</div>

        {fromArcade ? (
          <div className="gf-sub gf-pixel gf-gradebadge" style={{ marginTop: 12 }}>
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="gf-h gf-pixel" style={{ marginTop: 14 }}>PICK YOUR GRADE</div>
            <div className="gf-grades" role="radiogroup" aria-label="Grade" onKeyDown={radioKeys}>
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={g === grade} tabIndex={g === grade ? 0 : -1} className={`gf-grade gf-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <FocusPicker grade={grade} focus={focus} note={focusNote} onFocus={onFocus} />
        <div className="gf-help gf-focusline">
          Every zone asks: <b className="c">{focusLine(validateFocus(focus, grade, catalog))}</b>
        </div>

        <div style={{ textAlign: "center", margin: "12px 0 4px" }}>
          <button ref={startRef} className="gf-cta big" onClick={onStart}>Press start ▶</button>
        </div>
        <div className="gf-savebar gf-help">
          <span>
            Identified <b className="g">{save.beaten.length}/8</b> · Virus cards <b className="y">{save.viruses.length}/{VIRUSES.length}</b>
            {save.rush ? <b className="y"> · ALL MAJOR VIRUSES SPOTTED!</b> : ""}
          </span>
          {save.beaten.length > 0 && (
            <span className="gf-powerchips" aria-label="Immune skills earned">
              {powersOf(save).map((p) => (
                <span key={p} className="gf-powerchip"><PowerIcon p={p} />{POWERS[p].name}</span>
              ))}
            </span>
          )}
          {(save.beaten.length > 0 || save.rush || save.viruses.length > 0) && (
            <button className="gf-cta ghost" style={{ padding: "6px 8px", fontSize: 8 }} onClick={() => (confirmErase ? (onErase(), setConfirmErase(false)) : setConfirmErase(true))}>
              {confirmErase ? "Tap again to erase" : "Erase save"}
            </button>
          )}
        </div>
        <div className="gf-h gf-pixel" style={{ marginTop: 10 }}>HOW TO PLAY</div>
        <HowToPlay />
        <div className="gf-help dim" style={{ marginTop: 6 }}>HI-SCORE {String(highScore).padStart(6, "0")} · Progress saves on this device.</div>
      </div>
    </div>
  );
}

function StageSelect({ grade, focus, save, onPick, onBack, sel, onSel }: { grade: Grade; focus: FocusChoice; save: SaveData; onPick: (id: StageId) => void; onBack: () => void; sel: number; onSel: (i: number) => void }) {
  const open = rushOpen(save);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    refs.current[sel]?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" ? -3 : e.key === "ArrowDown" ? 3 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (sel + d + 9) % 9;
    onSel(j);
    refs.current[j]?.focus();
  };
  return (
    <div className="gf-overlay title">
      <div className="gf-select">
        <div className="gf-panel title">
          <div className="gf-h gf-pixel" style={{ textAlign: "center", color: "var(--gf-yellow)" }}>BODY MAP · {gradeLabel(grade).toUpperCase()} · {focusLabel(focus).toUpperCase()}</div>
          <div className="gf-grid" onKeyDown={onKey}>
            {GRID.map((id, i) => {
              if (!id) {
                return (
                  <button
                    key="center"
                    ref={(el) => (refs.current[i] = el)}
                    className={`gf-tile center ${open ? "open" : "locked"}`}
                    data-stage="rush"
                    aria-disabled={!open}
                    onFocus={() => onSel(i)}
                    onClick={() => open && onPick("rush")}
                    title={open ? "Lymph Node: the Major Virus rush" : "Identify all eight stage germs to open the Lymph Node"}
                  >
                    <Portrait who={open ? "corona" : "hero"} />
                    <span className="nm">{open ? "LYMPH NODE" : HERO.name}</span>
                    <span className="subj">{open ? "6 Major Viruses!" : `${save.beaten.length}/8 identified`}</span>
                    <span className="pw">{open ? (save.rush ? "CLEARED ✓ — play again" : "MAJOR VIRUS RUSH") : "Lymph Node locked"}</span>
                  </button>
                );
              }
              const z = zoneById(id);
              const beaten = save.beaten.includes(id);
              const src = sourceLabel(resolveZone(z, grade, focus, catalog));
              return (
                <button key={id} ref={(el) => (refs.current[i] = el)} className={`gf-tile ${beaten ? "beaten" : ""}`} data-stage={id} data-beaten={beaten ? "1" : "0"} onFocus={() => onSel(i)} onClick={() => onPick(id)} title={`${z.place}: ${z.bossFull}`}>
                  {beaten && <span className="done">✓</span>}
                  <Portrait who={id} />
                  <span className="nm">{z.place.toUpperCase()}</span>
                  <span className="subj">{src}</span>
                  <span className="pw">{beaten ? <><PowerIcon p={z.power} /> {POWERS[z.power].name}</> : z.boss}</span>
                </button>
              );
            })}
          </div>
          <div className="gf-help" style={{ marginTop: 8, textAlign: "center" }}>
            Arrows + Enter or tap a body zone. Any order! {save.beaten.length > 0 ? "Earned immune skills work in every zone (C / SWAP to pick one, X / SKILL to use it)." : ""}
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button className="gf-cta ghost" onClick={onBack}>◀ Title</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cleared({ zone, save, onNext, clues }: { zone: Zone; save: SaveData; onNext: () => void; clues: LogEntry[] }) {
  const P = POWERS[zone.power];
  const weakTo = ZONES.find((z) => z.weakness === zone.power);
  return (
    <div className="gf-overlay">
      <div className="gf-panel won" style={{ textAlign: "center" }}>
        <div className="gf-h gf-pixel" style={{ color: "var(--gf-yellow)" }}>{zone.boss} IDENTIFIED!</div>
        <div className="gf-help gf-fullname" data-full-name={zone.bossFull}>{zone.bossFull}</div>
        <div className="gf-help">“{zone.lines.defeat}”</div>
        <div className="gf-help gf-fact">
          <b className="g">{zone.place}:</b> {zone.defense} This stage germ is {zone.bossType}.
        </div>
        <div className="gf-earned">
          <Portrait who={zone.id} />
          <div style={{ textAlign: "left" }}>
            <div className="gf-pixel" style={{ fontSize: 11, color: P.color }} data-power={zone.power}>NEW SKILL: {P.name.toUpperCase()}</div>
            <div className="gf-help">It's {P.desc}. Press <kbd>C</kbd> (or SWAP) to pick it and <kbd>X</kbd> (or SKILL) to use it.</div>
            {weakTo && <div className="gf-help gf-hint">Tip: {weakTo.boss} in {weakTo.place} has a weak spot for it, and that zone's infected cell needs it too.</div>}
          </div>
        </div>
        {clues.length > 0 && (
          <div className="gf-help" data-clues={clues.filter((b) => b.correct).length}>
            Antigen Clues: <b className="g">{clues.filter((b) => b.correct).length}/{clues.length}</b> right
          </div>
        )}
        <div className="gf-help">Identified {save.beaten.length}/8{rushOpen(save) ? " — the LYMPH NODE is open!" : ""}</div>
        <div style={{ marginTop: 12 }}>
          <button className="gf-cta" autoFocus onClick={onNext}>Body map ▶</button>
        </div>
      </div>
    </div>
  );
}

function Victory({ log, grade, focus, score, highScore, onMenu, onSelect }: { log: LogEntry[]; grade: Grade; focus: FocusChoice; score: number; highScore: number; onMenu: () => void; onSelect: () => void }) {
  const byStd = new Map<string, { skill: string; subject: Subject; n: number; c: number }>();
  for (const l of log) {
    const cur = byStd.get(l.standard) ?? { skill: l.skill, subject: l.subject, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.standard, cur);
  }
  const right = log.filter((l) => l.correct).length;
  const clues = log.filter((l) => l.clue);
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);
  return (
    <div className="gf-overlay">
      <div className="gf-panel won">
        <div className="gf-h gf-pixel" style={{ color: "var(--gf-yellow)" }}>EVERY MAJOR VIRUS IS IDENTIFIED! · {gradeLabel(grade).toUpperCase()}</div>
        <div className="gf-help">“{RUSH.lines.defeat}”</div>
        <div className="gf-help big">
          You are a true <b className="y">GERM FIGHTER</b>! Score <b className="y">{score}</b>
          {score >= highScore && score > 0 ? " — NEW HIGH SCORE!" : ""} · Questions <b className="g">{right}/{log.length}</b>
          {clues.length > 0 ? <> (Antigen Clues <b className="g">{clues.filter((b) => b.correct).length}/{clues.length}</b>)</> : null} · {focusLabel(focus)}
        </div>
        <div className="gf-cards">
          {VIRUSES.map((v) => (
            <div key={v.id} className="gf-vcard" data-virus={v.id}>
              <Portrait who={v.id} size={1} />
              <div>
                <b className="r">{v.name}</b> <span className="dim">{v.title}</span>
                <div>{v.card[0]}</div>
              </div>
            </div>
          ))}
        </div>
        {byStd.size > 0 && (
          <div className="gf-tablewrap">
            <table className="gf-report-table">
              <thead><tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr></thead>
              <tbody>
                {[...byStd.entries()].map(([std, v]) => (
                  <tr key={std}>
                    <td className="c">{std}</td>
                    <td><span className={`gf-dot ${v.subject}`} />{v.skill} <span className="dim">({SUBJECT_TAG[v.subject]})</span></td>
                    <td style={{ color: v.c === v.n ? "var(--gf-green)" : v.c / v.n >= 0.75 ? "var(--gf-yellow)" : "var(--gf-red)" }}>{v.c}/{v.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {practice.length > 0 && (
          <div className="gf-help" style={{ marginTop: 10 }}>
            <span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button className="gf-cta ghost" onClick={onMenu}>Title screen</button>
          <button className="gf-cta" autoFocus onClick={onSelect}>Body map ▶</button>
        </div>
      </div>
    </div>
  );
}

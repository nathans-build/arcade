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
  readAloudPref,
  recordAnswer,
  rememberGrade,
  setReadAloudPref,
  speak,
  speakQuestion,
  speechSupported,
  stopSpeaking,
  type DealtQuestion,
  type Grade,
  type Subject,
} from "@/kit";
import { BOOKS, BOOK_BY_ID } from "@/library/books";
import { Game, clearSave, loadSave, writeSave, type GameEvent, type Sfx } from "@/library/game";
import { drawFrame, H, W } from "@/library/render";
import { pathTo, solveRoomBlocks } from "@/library/solver";
import { LibraryDecks, focusCatalog } from "@/library/questions";
import {
  AREAS, GUARDIANS, ITEMS, WINGS, roomById,
  type BookId, type Dir, type GuardianId, type ItemId,
} from "@/library/world";
import {
  MIXED, SUBJECT_CHOICES, allLabel, focusFromUrl, focusLabel, focusTag, focusTopic, loadFocus,
  refocusSavedForGrade, saveFocus, topicForSubject, topicsOf, validateFocus,
  type FocusChoice, type QuestSubject, type TopicChoice,
} from "@/library/focus";
import { BOOK_FOUND, FAINT, JINGLES, SONGS, WING_RESTORED, songFor } from "@/music";
import "@/library/library.css";

const GAME_ID = "lost-library";
export const HERO = "Pip Lampwick";

type Screen = "title" | "playing" | "ending";

type Overlay =
  | { kind: "msg"; text: string; title?: string; then?: () => void }
  | { kind: "book"; book: BookId }
  | { kind: "item"; item: ItemId };

interface Quiz {
  kind: "door" | "guardian";
  doorId?: string;
  guardian?: GuardianId;
  q: DealtQuestion;
  picked: number | null;
  /** The guardian's last right answer was the one that finished the quiz. */
  done: boolean;
}

interface LogEntry {
  subject: Subject;
  standard: string;
  skill: string;
  correct: boolean;
}

interface Hud {
  hearts: number;
  max: number;
  keys: number | null;
  selected: ItemId | null;
  items: ItemId[];
  books: number;
  area: string;
  room: string;
}

const SUBJECT_TAGS: Record<Subject, string> = { math: "MATH", science: "SCIENCE", ela: "ELA", social: "SOCIAL STUDIES" };
const ARROWS: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

function hudOf(g: Game): Hud {
  const w = g.wing;
  return {
    hearts: g.s.hearts, max: g.maxHearts, keys: w ? g.s.keys[w] : null, selected: g.s.selected, items: [...g.s.items],
    books: g.s.books.length, area: AREAS[g.s.at.area].short, room: g.room.name,
  };
}

function initialFocus(grade: Grade): { choice: FocusChoice; note: string | null } {
  const url = focusFromUrl(typeof window === "undefined" ? "" : window.location.search, grade, focusCatalog);
  let note: string | null = null;
  if (url.unavailable) {
    const t = focusTopic(url.unavailable);
    note = `${t.label} is for ${focusCatalog.gradesNote(t.id)}, not ${gradeLabel(grade)}.`;
  }
  return { choice: url.choice ?? validateFocus(loadFocus(), grade, focusCatalog), note };
}

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

function playSfx(audio: ChipAudio, name: Sfx) {
  const later = (ms: number, f: () => void) => window.setTimeout(f, ms);
  switch (name) {
    case "push": audio.tone(180, 0.08, "square", 0.2, 120); break;
    case "bump": audio.tone(110, 0.06, "square", 0.12); break;
    case "key": case "chest": audio.checkpoint(); break;
    case "item": case "solve": audio.levelUp(); break;
    case "book": break; // the Book Found jingle plays instead
    case "door": audio.tone(330, 0.1, "square", 0.25); later(90, () => audio.tone(494, 0.14, "square", 0.25)); break;
    case "dust": audio.noise(0.07, 0.25); break;
    case "poof": audio.tone(900, 0.15, "triangle", 0.35, 1800); break;
    case "hurt": audio.tone(240, 0.22, "sawtooth", 0.3, 110); break;
    case "torch": audio.noise(0.18, 0.3); audio.tone(300, 0.2, "triangle", 0.3, 640); break;
    case "throw": audio.tone(700, 0.22, "square", 0.15, 1200); break;
    case "hit": audio.blip(); break;
    case "quill": audio.tone(400, 0.25, "triangle", 0.4, 1200); break;
    case "magnify": audio.tone(1200, 0.3, "triangle", 0.25, 600); break;
    case "bell": audio.tone(880, 0.9, "triangle", 0.45); later(120, () => audio.tone(1320, 0.7, "triangle", 0.25)); break;
    case "warp": audio.jump(); break;
    case "heart": audio.tone(660, 0.08, "square", 0.2); later(80, () => audio.tone(990, 0.12, "square", 0.2)); break;
    case "right": audio.correct(); break;
    case "wrong": audio.wrong(); break;
    case "faint": audio.playJingle(FAINT); break;
  }
}

export default function LostLibrary() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const demoRef = useRef<Game | null>(null);
  const decksRef = useRef<LibraryDecks | null>(null);
  const audio = useMemo(() => new ChipAudio(), []);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("3"));
  const [focusInit] = useState(() => initialFocus(initialGrade("3")));
  const [focus, setFocus] = useState<FocusChoice>(focusInit.choice);
  const [focusNote, setFocusNote] = useState<string | null>(focusInit.note);
  const [runFocus, setRunFocus] = useState<FocusChoice>(MIXED);
  const [screen, setScreen] = useState<Screen>("title");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<Hud | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [muted, setMuted] = useState(audio.muted);
  const [musicOn, setMusicOn] = useState(audio.musicOn);
  const [sfxOn, setSfxOn] = useState(audio.sfxOn);
  useEffect(() => exposeMusicDebug(audio, SONGS, JINGLES), [audio]);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("3"))));
  const [touch, setTouch] = useState(false);
  const [saved, setSaved] = useState(() => loadSave());
  const [bookCard, setBookCard] = useState<BookId | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState<number | null>(null);

  const heldRef = useRef<Dir[]>([]);
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const blockedRef = useRef(true);
  blockedRef.current = screen !== "playing" || overlays.length > 0 || !!quiz || paused;
  const quizRef = useRef(quiz);
  quizRef.current = quiz;
  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const early = isEarlyReader(grade);

  // Fit the 16:10 screen in the space left over.
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

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const releaseHeld = useCallback(() => {
    heldRef.current = [];
  }, []);

  const pushOverlay = useCallback((...o: Overlay[]) => setOverlays((list) => [...list, ...o]), []);

  /** The subject a Question Door / guardian asks in the current area (MIXED), null = any. */
  const subjectHere = useCallback((): Subject | null => {
    const g = gameRef.current;
    return g ? AREAS[g.s.at.area].subject : null;
  }, []);

  const startQuiz = useCallback((kind: Quiz["kind"], extra: { doorId?: string; guardian?: GuardianId }) => {
    const decks = decksRef.current;
    if (!decks) return;
    releaseHeld();
    const q = decks.draw(subjectHere());
    setQuiz({ kind, ...extra, q, picked: null, done: false });
    if (readAloudRef.current) speakQuestion(q.prompt, q.choices);
  }, [releaseHeld, subjectHere]);

  // Game events -> sounds, messages, questions, cards. Kept in a ref so the loop always calls the latest.
  const onEvents = useRef<(ev: GameEvent[]) => void>(() => {});
  onEvents.current = (events: GameEvent[]) => {
    for (const e of events) {
      if (e.type === "sfx") playSfx(audio, e.name);
      else if (e.type === "msg") pushOverlay({ kind: "msg", text: e.text, title: e.title });
      else if (e.type === "question") startQuiz("door", { doorId: e.doorId });
      else if (e.type === "guardian") {
        const gd = GUARDIANS[e.guardian];
        const g = gameRef.current;
        const have = g ? g.guardianProgress(e.guardian) : 0;
        const intro = have > 0 ? `${gd.name}: Back again? You have ${have} of ${gd.need} right answers. Let's continue!` : gd.intro;
        releaseHeld();
        pushOverlay({ kind: "msg", title: `${gd.name}, ${gd.title.toUpperCase()}`, text: intro, then: () => startQuiz("guardian", { guardian: e.guardian }) });
      } else if (e.type === "book") {
        audio.playJingle(BOOK_FOUND);
        pushOverlay({ kind: "book", book: e.book });
      }
      else if (e.type === "item") pushOverlay({ kind: "item", item: e.item });
      else if (e.type === "restored") {
        const gid = AREAS[e.wing].guardian!;
        audio.playJingle(WING_RESTORED);
        pushOverlay({ kind: "msg", title: GUARDIANS[gid].name, text: `${GUARDIANS[gid].win} The ${AREAS[e.wing].name} is restored!` });
      } else if (e.type === "finished") {
        pushOverlay({ kind: "msg", title: GUARDIANS.smudge.name, text: GUARDIANS.smudge.win, then: () => setScreen("ending") });
      }
      if (e.type === "hurt" || e.type === "faint" || e.type === "question" || e.type === "guardian") releaseHeld();
    }
  };

  // Read the top message aloud.
  const top = overlays[0];
  useEffect(() => {
    if (!top || !readAloudRef.current) return;
    if (top.kind === "msg") speak(`${top.title ? `${top.title}. ` : ""}${top.text}`);
    else if (top.kind === "book") {
      const b = BOOK_BY_ID.get(top.book)!;
      speak(`You found a lost book: ${b.title}! Fun fact: ${b.fact}`);
    } else speak(`You got the ${ITEMS[top.item].name}! ${ITEMS[top.item].how}`);
  }, [top]);

  // The main loop: a town demo behind the title screen, the real game while playing.
  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    demoRef.current = new Game(null, { early: false, enemies: true });
    let raf = 0;
    let last = performance.now();
    let lastV = -1;
    let lastGame: Game | null = null;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = gameRef.current;
      if (g) {
        if (!blockedRef.current) {
          const held = heldRef.current;
          g.tick(dt, held.length ? held[held.length - 1] : null);
        } else g.tick(0, null);
        const evs = g.takeEvents();
        if (evs.length) onEvents.current(evs);
        // Music follows the player: town, each wing, the Reading Room, or a guardian's riddle.
        audio.playSong(songFor(g.s.at.area, quizRef.current?.kind === "guardian"));
        if (g.dirty) {
          writeSave(g.s);
          g.dirty = false;
        }
        if (g.version !== lastV || g !== lastGame) {
          lastV = g.version;
          lastGame = g;
          setHud(hudOf(g));
        }
        drawFrame(ctx, g, now / 1000, g.room.name);
      } else if (demoRef.current) {
        const d = demoRef.current;
        d.tick(dt, null);
        d.takeEvents();
        drawFrame(ctx, d, now / 1000, "Bramblebury Square");
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio]);

  // Playtest hook (?debug only).
  useEffect(() => {
    if (!debug) return;
    (window as unknown as { __ll: unknown }).__ll = {
      get game() { return gameRef.current; },
      get quiz() { return quizRef.current; },
      get overlay() { return overlaysRef.current[0] ?? null; },
      get screen() { return screenRef.current; },
      pathTo: (x: number, y: number) => (gameRef.current ? pathTo(gameRef.current, x, y) : null),
      blocksPlan: () => (gameRef.current ? solveRoomBlocks(gameRef.current) : null),
      /** Skips to the Reading Room with all four wings restored (books given back). */
      toReadingRoom: () => {
        const g = gameRef.current;
        if (!g) return;
        for (const w of WINGS) {
          if (!g.s.restored.includes(w)) g.s.restored.push(w);
          if (!g.s.books.includes(w)) g.s.books.push(w);
        }
        g.goTo(AREAS.reading.start);
      },
    };
  }, []);

  const chooseGrade = useCallback((g: Grade) => {
    setGrade(g);
    rememberGrade(g);
    setFocus((f) => validateFocus(f, g, focusCatalog));
    refocusSavedForGrade(g, focusCatalog);
    setFocusNote(null);
    setReadAloud(readAloudPref(isEarlyReader(g)));
  }, []);

  const chooseFocus = useCallback((f: FocusChoice) => {
    setFocus(f);
    saveFocus(f);
    setFocusNote(null);
  }, []);

  const begin = useCallback((fresh: boolean) => {
    audio.unlock();
    rememberGrade(grade);
    const save = fresh ? null : loadSave();
    if (fresh) clearSave();
    const g = new Game(save, { early: isEarlyReader(grade), enemies: true });
    gameRef.current = g;
    writeSave(g.s);
    const f = validateFocus(focus, grade, focusCatalog);
    setRunFocus(f);
    decksRef.current = new LibraryDecks(grade, GAME_ID, f);
    setLog([]);
    setQuiz(null);
    setPaused(false);
    setConfirmNew(false);
    setHud(hudOf(g));
    setScreen("playing");
    if (fresh || !save) {
      setOverlays([
        { kind: "msg", title: "MADAME FOLIO", text: `${HERO}! Thank goodness you're here. The Ink Smudge knocked every book off the shelves of the Grand Lantern Library, and ink sprites are everywhere! Each of our four wings has a guardian keeping its book safe.` },
        { kind: "msg", title: "HOW TO PLAY", text: "Arrow keys walk. Z swings your feather duster to tidy ink sprites. X uses your item (your lantern lights cold torches). Enter reads signs and talks. Esc shows the map. Answer questions with 1-4 or A-D." },
      ]);
    } else {
      setOverlays([{ kind: "msg", title: "WELCOME BACK", text: `Welcome back, ${HERO}! You're in ${g.room.name}. Books found: ${g.s.books.length} of ${BOOKS.length}.` }]);
    }
  }, [audio, grade, focus]);

  const closeOverlay = useCallback(() => {
    stopSpeaking();
    setOverlays((list) => {
      const [first, ...rest] = list;
      if (first && first.kind === "msg" && first.then) window.setTimeout(first.then, 0);
      return rest;
    });
  }, []);

  const answer = useCallback((i: number) => {
    const qz = quizRef.current;
    const g = gameRef.current;
    if (!qz || qz.picked !== null || !g) return;
    audio.unlock();
    const correct = i === qz.q.answer;
    recordAnswer(GAME_ID, qz.q, correct);
    setLog((l) => [...l, { subject: qz.q.subject, standard: qz.q.standard, skill: qz.q.skill, correct }]);
    playSfx(audio, correct ? "right" : "wrong");
    let done = false;
    if (correct && qz.kind === "door" && qz.doorId) g.openQuestionDoor(qz.doorId);
    if (correct && qz.kind === "guardian" && qz.guardian) done = g.guardianAnswer(qz.guardian, true);
    setQuiz({ ...qz, picked: i, done });
    if (readAloudRef.current) speak(correct ? `Correct! ${qz.q.explanation}` : `Not quite. The answer is ${qz.q.choices[qz.q.answer]}. ${qz.q.explanation}`);
  }, [audio]);

  const nextQuestion = useCallback(() => {
    const qz = quizRef.current;
    if (!qz || qz.picked === null) return;
    stopSpeaking();
    const correct = qz.picked === qz.q.answer;
    if ((qz.kind === "door" && correct) || qz.done) {
      setQuiz(null);
      return;
    }
    startQuiz(qz.kind, { doorId: qz.doorId, guardian: qz.guardian });
  }, [startQuiz]);

  const stepBack = useCallback(() => {
    stopSpeaking();
    setQuiz(null);
  }, []);

  const togglePause = useCallback((force?: boolean) => {
    setPaused((p) => {
      const n = force ?? !p;
      if (n) {
        stopSpeaking();
        releaseHeld();
      }
      return n;
    });
  }, [releaseHeld]);

  const act = useCallback((a: "dust" | "item" | "talk" | "swap") => {
    const g = gameRef.current;
    if (!g || blockedRef.current) return;
    audio.unlock();
    if (a === "dust") g.dust();
    else if (a === "item") g.useItem();
    else if (a === "talk") g.interact();
    else g.selectNext();
  }, [audio]);

  const resetRoom = useCallback(() => {
    gameRef.current?.resetRoom();
    setPaused(false);
  }, []);

  const toTitle = useCallback(() => {
    gameRef.current = null;
    setScreen("title");
    setPaused(false);
    setQuiz(null);
    setOverlays([]);
    setSaved(loadSave());
    audio.stopMusic();
    stopSpeaking();
  }, [audio]);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  const replay = useCallback(() => {
    const qz = quizRef.current;
    if (qz) speakQuestion(qz.q.prompt, qz.q.choices);
    else if (top?.kind === "msg") speak(top.text);
  }, [top]);

  // Keyboard. A-D are only ever answer keys, never movement.
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const k = ev.key.toLowerCase();
      const onButton = ev.target instanceof HTMLButtonElement || ev.target instanceof HTMLAnchorElement;
      if (k === "m") {
        setMuted(audio.toggleMute());
        return;
      }
      if (screen === "title") {
        if (ev.key === "Enter" && !onButton) {
          ev.preventDefault();
          begin(!saved);
        }
        return;
      }
      if (screen !== "playing") return;
      if (ev.key.startsWith("Arrow") || ev.key === " ") ev.preventDefault();
      const idx = ev.key.length === 1 ? ("1234".includes(k) ? Number(k) - 1 : "abcd".indexOf(k)) : -1;
      if (quiz) {
        if (quiz.picked === null && idx >= 0) {
          ev.preventDefault();
          answer(idx);
        } else if (quiz.picked !== null && (ev.key === "Enter" || ev.key === " ")) {
          ev.preventDefault();
          if (!ev.repeat) nextQuestion();
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          stepBack();
        } else if (k === "r") replay();
        return;
      }
      if (overlays.length) {
        if (!ev.repeat && (ev.key === "Enter" || ev.key === " " || k === "z" || k === "x" || ev.key === "Escape")) {
          ev.preventDefault();
          closeOverlay();
        } else if (k === "r") replay();
        return;
      }
      if (ev.key === "Escape" || k === "p") {
        ev.preventDefault();
        togglePause();
        return;
      }
      if (paused) {
        if (ev.key === "Enter" && !onButton) togglePause(false);
        return;
      }
      const dir = ARROWS[ev.key];
      if (dir) {
        heldRef.current = [...heldRef.current.filter((d) => d !== dir), dir];
        return;
      }
      if (ev.repeat) return;
      if (k === "z") act("dust");
      else if (k === "x") act("item");
      else if (k === "s") act("swap");
      else if (ev.key === "Enter" && !onButton) {
        ev.preventDefault();
        act("talk");
      }
    };
    const up = (ev: KeyboardEvent) => {
      const dir = ARROWS[ev.key];
      if (dir) heldRef.current = heldRef.current.filter((d) => d !== dir);
    };
    const blur = () => releaseHeld();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [screen, quiz, overlays, paused, saved, answer, nextQuestion, stepBack, closeOverlay, togglePause, act, begin, replay, releaseHeld, audio]);

  // Touch pad: arrows are held, buttons fire on press.
  const holdProps = (d: Dir) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      heldRef.current = [...heldRef.current.filter((x) => x !== d), d];
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        // pointer already gone
      }
    },
    onPointerUp: () => (heldRef.current = heldRef.current.filter((x) => x !== d)),
    onPointerCancel: () => (heldRef.current = heldRef.current.filter((x) => x !== d)),
    onLostPointerCapture: () => (heldRef.current = heldRef.current.filter((x) => x !== d)),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const pressProps = (f: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      f();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const playing = screen === "playing";
  const showPad = touch && playing && !quiz && !paused;
  const tag = focusTag(runFocus);
  const g = gameRef.current;

  return (
    <div className={`ll-root ${early ? "early" : ""}`}>
      <div className="ll-toolbar">
        <a href={arcadeLink(grade)}>◀ ARCADE</a>
        <div className="ll-tools">
          {playing && <button onClick={() => (quiz || overlays.length ? null : togglePause())}>{paused ? "RESUME" : "MAP / PAUSE"}</button>}
          {muted ? (
            <button onClick={() => setMuted(audio.toggleMute())} title="Sound is off on this device (M)">SOUND OFF</button>
          ) : (
            <>
              <button onClick={() => setMusicOn(audio.toggleMusic())} aria-pressed={musicOn} title="Music on/off">{musicOn ? "MUSIC ON" : "MUSIC OFF"}</button>
              <button onClick={() => setSfxOn(audio.toggleSfx())} aria-pressed={sfxOn} title="Sound effects on/off">{sfxOn ? "SFX ON" : "SFX OFF"}</button>
            </>
          )}
          {speechSupported() && (
            <button onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`ll-cabinet ${showPad ? "touch-on" : ""}`}>
        {playing && hud && (
          <div className="ll-hud ll-pixel">
            <div className="hearts" aria-label={`${hud.hearts} of ${hud.max} hearts`}>
              {Array.from({ length: hud.max }, (_, i) => (
                <span key={i} className={i < hud.hearts ? "on" : "off"}>♥</span>
              ))}
            </div>
            <div className="keys">{hud.keys === null ? <span className="dim">TOWN</span> : <>KEY ×{hud.keys}</>}</div>
            <button className="item" onClick={() => act("swap")} title="Swap item (S)" aria-label={`Item: ${hud.selected ? ITEMS[hud.selected].name : "Lantern"}. Tap to swap.`}>
              <ItemIcon item={hud.selected} /> {hud.selected ? ITEMS[hud.selected].short : "LANTERN"}
              {hud.items.length > 0 && <small> ⇄</small>}
            </button>
            <div className="books">BOOKS {hud.books}/{BOOKS.length}</div>
            <div className="area">{hud.area}</div>
          </div>
        )}

        <div className="ll-stage" ref={stageRef}>
          <div className="ll-screen" style={screenWidth ? { width: screenWidth } : undefined}>
            <canvas ref={canvasRef} aria-label="Quest of the Lost Library game screen" />

            {screen === "title" && (
              <TitleScreen
                grade={grade} onGrade={chooseGrade} focus={focus} focusNote={focusNote} onFocus={chooseFocus} saved={saved}
                confirmNew={confirmNew} onNew={() => (saved && !confirmNew ? setConfirmNew(true) : begin(true))} onContinue={() => begin(false)}
                onBook={setBookCard}
              />
            )}

            {playing && !quiz && top && <OverlayView o={top} onClose={closeOverlay} early={early} />}

            {playing && paused && !quiz && g && (
              <div className="ll-overlay">
                <div className="ll-panel ll-pause">
                  <div className="ll-h ll-pixel">PAUSED · {AREAS[g.s.at.area].name.toUpperCase()}</div>
                  <MapView g={g} />
                  <Inventory g={g} />
                  <div className="ll-row">
                    <button className="ll-cta ghost" onClick={toTitle}>Title screen</button>
                    <button className="ll-cta ghost" onClick={resetRoom} title="Puts the crates back and returns you to the door you came in">Reset room</button>
                    <button className="ll-cta" autoFocus onClick={() => togglePause(false)}>Resume ▶</button>
                  </div>
                  <HowToPlay />
                </div>
              </div>
            )}

            {screen === "ending" && g && (
              <Ending g={g} log={log} grade={grade} focus={runFocus} onKeep={() => setScreen("playing")} onTitle={toTitle} onBook={setBookCard} />
            )}

            {bookCard && (screen !== "playing" || paused) && (
              <div className="ll-overlay top" onClick={() => setBookCard(null)}>
                <BookCard book={bookCard} onClose={() => setBookCard(null)} />
              </div>
            )}
          </div>
        </div>

        {playing && quiz && g && (
          <QuizPanel quiz={quiz} g={g} tag={tag} onAnswer={answer} onNext={nextQuestion} onBack={stepBack} onSpeak={replay} />
        )}

        <div className={`ll-controls ${showPad ? "show" : ""}`}>
          <div className="ll-dpad">
            <button className="ll-touch up" {...holdProps("up")} aria-label="Move up">▲</button>
            <button className="ll-touch left" {...holdProps("left")} aria-label="Move left">◀</button>
            <button className="ll-touch right" {...holdProps("right")} aria-label="Move right">▶</button>
            <button className="ll-touch down" {...holdProps("down")} aria-label="Move down">▼</button>
          </div>
          <div className="ll-acts">
            <button className="ll-touch word dust" {...pressProps(() => act("dust"))} aria-label="Dust (Z)">DUST</button>
            <button className="ll-touch word use" {...pressProps(() => act("item"))} aria-label="Use item (X)">ITEM</button>
            <button className="ll-touch word talk" {...pressProps(() => (overlays.length ? closeOverlay() : act("talk")))} aria-label="Talk or read (Enter)">TALK</button>
            <button className="ll-touch word map" {...pressProps(() => (overlays.length ? closeOverlay() : togglePause(true)))} aria-label="Map (Esc)">MAP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------ pieces */

function ItemIcon({ item }: { item: ItemId | null }) {
  const color = item === "boomerang" ? "#e3262f" : item === "quill" ? "#f2f4ff" : item === "magnifier" ? "#b05cff" : item === "bell" ? "#6ea0ff" : "#ffd23f";
  return <span className="ll-icon" style={{ background: color }} aria-hidden="true" />;
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="currentColor" d="M1 5h3l4-4v14l-4-4H1z" />
      <path fill="currentColor" d="M10 5h1v6h-1zM12 3h1v10h-1zM14 1h1v14h-1z" />
    </svg>
  );
}

function OverlayView({ o, onClose, early }: { o: Overlay; onClose: () => void; early: boolean }) {
  if (o.kind === "book") {
    return (
      <div className="ll-overlay">
        <BookCard book={o.book} onClose={onClose} found />
      </div>
    );
  }
  if (o.kind === "item") {
    const it = ITEMS[o.item];
    return (
      <div className="ll-overlay">
        <div className="ll-panel ll-card item" role="dialog" aria-label={it.name}>
          <div className="ll-h ll-pixel">YOU GOT THE {it.name.toUpperCase()}!</div>
          <div className="ll-help">{it.how}</div>
          <div className="ll-help dim">Your lantern is always with you too: press S (or tap the item box) to swap between them.</div>
          <div className="ll-row"><button className="ll-cta" autoFocus onClick={onClose}>OK ▶</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className={`ll-dialog ${early ? "big" : ""}`} role="dialog" aria-live="polite" onClick={onClose}>
      {o.title && <div className="who ll-pixel">{o.title}</div>}
      <div className="text">{o.text}</div>
      <div className="more ll-pixel">▼ ENTER</div>
    </div>
  );
}

function BookCard({ book, onClose, found }: { book: BookId; onClose: () => void; found?: boolean }) {
  const b = BOOK_BY_ID.get(book)!;
  return (
    <div className="ll-panel ll-card book" role="dialog" aria-label={b.title} onClick={(e) => e.stopPropagation()}>
      <div className="ll-bookcover" style={{ background: b.color }} aria-hidden="true" />
      <div>
        <div className="ll-h ll-pixel">{found ? "A LOST BOOK IS FOUND!" : "FROM YOUR BOOKSHELF"}</div>
        <div className="ll-help big">{b.title}</div>
        <div className="ll-help"><span className="y">Fun fact:</span> {b.fact}</div>
        <div className="ll-row"><button className="ll-cta" autoFocus onClick={onClose}>{found ? "Shelve it ▶" : "Close"}</button></div>
      </div>
    </div>
  );
}

function Bookshelf({ have, onBook }: { have: BookId[]; onBook: (b: BookId) => void }) {
  return (
    <div className="ll-shelf" aria-label={`Bookshelf: ${have.length} of ${BOOKS.length} books returned`}>
      {BOOKS.map((b) => {
        const on = have.includes(b.id);
        return (
          <button
            key={b.id}
            className={`ll-spine ${on ? "on" : ""}`}
            style={on ? { background: b.color } : undefined}
            disabled={!on}
            onClick={() => onBook(b.id)}
            title={on ? b.title : "A missing book"}
            aria-label={on ? `${b.title}: read its fun fact` : "Missing book"}
          />
        );
      })}
      <span className="ll-shelfcount ll-pixel">{have.length}/{BOOKS.length}</span>
    </div>
  );
}

function MapView({ g }: { g: Game }) {
  const area = AREAS[g.s.at.area];
  const wing = g.wing;
  const hasMap = wing ? g.s.maps.includes(wing) : true;
  const cols = Math.max(...area.rooms.map((r) => r.at[0])) + 1;
  const rows = Math.max(...area.rooms.map((r) => r.at[1])) + 1;
  return (
    <div className="ll-map" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, auto)` }} aria-label="Map">
      {area.rooms.map((r) => {
        const seen = g.s.visited.includes(r.id);
        const here = r.id === g.s.at.room;
        const known = seen || hasMap;
        const guardian = area.guardian && r.rows.some((row) => row.includes("G"));
        return (
          <div
            key={r.id}
            className={`ll-maproom ${here ? "here" : ""} ${seen ? "seen" : ""} ${known ? "" : "unknown"}`}
            style={{ gridColumn: r.at[0] + 1, gridRow: r.at[1] + 1 }}
          >
            {known ? r.name : "?"}
            {here && <b className="ll-pixel"> ◆ YOU</b>}
            {known && guardian && <span className="y"> ★</span>}
          </div>
        );
      })}
      {wing && !hasMap && <div className="ll-help dim ll-mapnote">Find this wing's map to see the rooms you haven't visited.</div>}
    </div>
  );
}

function Inventory({ g }: { g: Game }) {
  return (
    <div className="ll-help ll-inv">
      <div><span className="y">{HERO}</span> carries a feather duster and a lantern{g.s.items.length ? ", plus:" : "."}</div>
      {g.s.items.map((i) => (
        <div key={i}><ItemIcon item={i} /> <b>{ITEMS[i].name}</b>: {ITEMS[i].how}</div>
      ))}
      <div className="dim">
        Wings restored: {WINGS.filter((w) => g.s.restored.includes(w)).map((w) => AREAS[w].name).join(", ") || "none yet"} · Books {g.s.books.length}/{BOOKS.length}
      </div>
    </div>
  );
}

function QuizPanel({ quiz, g, tag, onAnswer, onNext, onBack, onSpeak }: {
  quiz: Quiz; g: Game; tag: string | null; onAnswer: (i: number) => void; onNext: () => void; onBack: () => void; onSpeak: () => void;
}) {
  const { q, picked } = quiz;
  const done = picked !== null;
  const correct = done && picked === q.answer;
  const gd = quiz.guardian ? GUARDIANS[quiz.guardian] : null;
  const have = quiz.guardian ? g.guardianProgress(quiz.guardian) : 0;
  let verdict = "";
  if (done) {
    if (quiz.kind === "door") verdict = correct ? "✔ CORRECT! THE QUESTION DOOR SWINGS OPEN!" : `✘ NOT QUITE — THE ANSWER IS ${"ABCD"[q.answer]}`;
    else if (correct) verdict = quiz.done ? `✔ CORRECT! ${gd!.name} IS DELIGHTED!` : `✔ CORRECT! ${have} OF ${gd!.need}`;
    else verdict = `✘ NOT QUITE — THE ANSWER IS ${"ABCD"[q.answer]}`;
  }
  const nextLabel = quiz.kind === "door" ? (correct ? "Walk on ▶" : "Try another question ▶") : quiz.done ? "Take the book ▶" : "Next question ▶";
  return (
    <div className={`ll-quiz ${quiz.kind} ${done ? (correct ? "correct" : "wrong") : ""}`} role="dialog" aria-label={quiz.kind === "door" ? "Question Door" : `${gd?.name} asks`}>
      <div className="head ll-pixel">
        <span>
          {quiz.kind === "door" ? "QUESTION DOOR" : gd!.name}
          {gd && <span className="stars"> {"★".repeat(Math.min(have, gd.need))}{"☆".repeat(Math.max(0, gd.need - have))}</span>}
        </span>
        <span className="std">
          {tag ?? SUBJECT_TAGS[q.subject]} · {q.standard}
          {speechSupported() && (
            <button type="button" className="ll-speak" onClick={onSpeak} aria-label="Read the question aloud" title="Read aloud (R)">
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
      {done ? (
        <div className="feedback">
          <div className={`verdict ll-pixel ${correct ? "ok" : "no"}`}>{verdict}</div>
          <div className="why">{q.explanation}</div>
          <div className="row">
            <span className="dim">{correct ? "" : "Wrong answers never cost a heart. Every question teaches something!"}</span>
            <button className="ll-cta" autoFocus onClick={onNext}>{nextLabel}</button>
          </div>
        </div>
      ) : (
        <div className="row hintrow">
          <span className="hint dim">Press 1–4 or A–D, or tap an answer.</span>
          <button className="ll-cta ghost small" onClick={onBack}>Step back (Esc)</button>
        </div>
      )}
    </div>
  );
}

function HowToPlay() {
  return (
    <div className="ll-help ll-howto">
      <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> walk · <kbd>Z</kbd> feather duster · <kbd>X</kbd> use item · <kbd>S</kbd> swap item ·{" "}
      <kbd>ENTER</kbd> talk / read / open chests · <kbd>ESC</kbd> map &amp; pause · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> answer · <kbd>M</kbd> mute ·{" "}
      <kbd>R</kbd> read aloud. On a phone or tablet: the arrow pad, DUST, ITEM, TALK and MAP.
      <br />
      Explore the town and the four wings of the library. <span className="c">Push book crates</span> onto switches, <span className="y">light cold torches</span>{" "}
      with your lantern, and find each wing's <span className="y">small key</span>, <span className="y">map</span> and special <span className="y">item</span>.{" "}
      <span className="c">Question Doors</span> open with a right answer; a wrong answer explains and gives you another question. Tidy{" "}
      <span className="r">ink sprites</span> with your duster: if one touches you, you lose a heart. Out of hearts? You go back to the wing's entrance
      and keep everything you found. Answer each wing's <span className="r">guardian</span> to restore the wing, then open the Reading Room!
    </div>
  );
}

/** Arrow keys move between (and pick) the buttons of a radio group. */
function radioKeys(e: React.KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const btns = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button[role=radio]:not(:disabled)")];
  if (btns.length === 0) return;
  e.preventDefault();
  e.stopPropagation();
  const i = btns.indexOf(document.activeElement as HTMLButtonElement);
  let j = e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
  j = (j + btns.length) % btns.length;
  btns[j].focus();
  btns[j].click();
}

function FocusPicker({ grade, focus, note, onFocus }: { grade: Grade; focus: FocusChoice; note: string | null; onFocus: (f: FocusChoice) => void }) {
  const avail = focusCatalog.available(grade);
  const subj = focus.subject === "mixed" ? null : focus.subject;
  const pickSubject = (s: QuestSubject) => {
    if (s === "mixed") onFocus(MIXED);
    else if (s !== focus.subject) onFocus({ subject: s, topic: topicForSubject(s, grade, focusCatalog) });
  };
  const topics: { id: TopicChoice; label: string; ok: boolean; note?: string }[] = subj
    ? [
        { id: "all", label: allLabel(subj), ok: true },
        ...topicsOf(subj).map((t) => ({ id: t.id, label: t.label, ok: avail.includes(t.id), note: focusCatalog.gradesNote(t.id) })),
      ]
    : [];
  return (
    <div className="ll-focus">
      <div className="ll-h ll-pixel">PICK A SUBJECT</div>
      <div className="ll-subjects" role="radiogroup" aria-label="Subject" onKeyDown={radioKeys}>
        {SUBJECT_CHOICES.map((s) => {
          const on = focus.subject === s.id;
          return (
            <button key={s.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} data-subject={s.id} className={`ll-subject ${on ? "on" : ""}`} onClick={() => pickSubject(s.id)}>
              <span className="ll-pixel">{s.label}</span>
              <small>{s.note}</small>
            </button>
          );
        })}
      </div>
      {note && <div className="ll-help ll-focusnote">{note}</div>}
      {subj && (
        <div className="ll-chips" role="radiogroup" aria-label="Topic" onKeyDown={radioKeys}>
          {topics.map((t) => {
            const on = t.ok && focus.subject !== "mixed" && focus.topic === t.id;
            return (
              <button
                key={t.id} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} disabled={!t.ok}
                className={`ll-chip ${t.id === "all" ? "all" : ""} ${on ? "on" : ""}`} data-topic={t.id}
                onClick={() => onFocus({ subject: subj, topic: t.id })} title={t.ok ? t.label : `${t.label}: ${t.note}`}
              >
                {t.label}
                {!t.ok && <small>{t.note}</small>}
              </button>
            );
          })}
        </div>
      )}
      <div className="ll-help ll-focusline">
        {focus.subject === "mixed" ? (
          <>Each wing asks its own subject: <span className="r">Math</span>, <span className="g">Science</span>, <span className="c">Story (ELA)</span> and <span className="y">History &amp; Maps (Social Studies)</span>.</>
        ) : (
          <>Every Question Door and guardian asks: <b className="c">{focusLabel(focus)}</b></>
        )}
      </div>
    </div>
  );
}

function TitleScreen({
  grade, onGrade, focus, focusNote, onFocus, saved, confirmNew, onNew, onContinue, onBook,
}: {
  grade: Grade; onGrade: (g: Grade) => void; focus: FocusChoice; focusNote: string | null; onFocus: (f: FocusChoice) => void;
  saved: ReturnType<typeof loadSave>; confirmNew: boolean; onNew: () => void; onContinue: () => void; onBook: (b: BookId) => void;
}) {
  const fromArcade = gradeFromArcade();
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { startRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="ll-overlay title">
      <div className="ll-panel title">
        <div className="ll-title ll-pixel">QUEST OF THE<br />LOST LIBRARY</div>
        <div className="ll-sub ll-pixel">SPIDERBEN10'S ARCADE · K–12 · NC STANDARDS</div>
        <div className="ll-help ll-story">
          The Ink Smudge has knocked every book off the shelves of the Grand Lantern Library! You are <span className="y">{HERO}</span>, junior
          page-keeper, with a trusty <span className="c">feather duster</span> and a <span className="y">lantern</span>. Restore the four wings and find the lost books.
        </div>

        {fromArcade ? (
          <div className="ll-sub ll-pixel ll-gradebadge">
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)} style={{ color: "inherit" }}>CHANGE GRADE IN THE ARCADE</a>
          </div>
        ) : (
          <>
            <div className="ll-h ll-pixel">PICK YOUR GRADE</div>
            <div className="ll-grades" role="radiogroup" aria-label="Grade" onKeyDown={radioKeys}>
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={g === grade} tabIndex={g === grade ? 0 : -1} className={`ll-grade ll-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
                  {g}
                </button>
              ))}
            </div>
          </>
        )}

        <FocusPicker grade={grade} focus={focus} note={focusNote} onFocus={onFocus} />

        <div className="ll-h ll-pixel">YOUR BOOKSHELF</div>
        <Bookshelf have={saved?.books ?? []} onBook={onBook} />

        <div className="ll-start">
          {saved && (
            <button ref={startRef} className="ll-cta big" onClick={onContinue}>Continue ▶</button>
          )}
          <button ref={saved ? undefined : startRef} className={`ll-cta big ${saved ? "ghost" : ""}`} onClick={onNew}>
            {saved ? (confirmNew ? "Erase save & start over?" : "New quest") : "Start the quest ▶"}
          </button>
        </div>
        {saved && (
          <div className="ll-help dim ll-savenote">
            Saved quest: {roomById(saved.at.room).name} · {saved.restored.length}/4 wings restored · {saved.books.length}/{BOOKS.length} books
          </div>
        )}
        <div className="ll-h ll-pixel">HOW TO PLAY</div>
        <HowToPlay />
      </div>
    </div>
  );
}

function Ending({ g, log, grade, focus, onKeep, onTitle, onBook }: {
  g: Game; log: LogEntry[]; grade: Grade; focus: FocusChoice; onKeep: () => void; onTitle: () => void; onBook: (b: BookId) => void;
}) {
  const byStd = new Map<string, { skill: string; subject: Subject; n: number; c: number }>();
  for (const l of log) {
    const cur = byStd.get(l.standard) ?? { skill: l.skill, subject: l.subject, n: 0, c: 0 };
    cur.n++;
    if (l.correct) cur.c++;
    byStd.set(l.standard, cur);
  }
  const right = log.filter((l) => l.correct).length;
  const practice = [...byStd.entries()].filter(([, v]) => v.c / v.n < 0.75);
  const missing = BOOKS.length - g.s.books.length;
  return (
    <div className="ll-overlay">
      <div className="ll-panel won">
        <div className="ll-title small ll-pixel">THE LOST LIBRARY IS FOUND!</div>
        <div className="ll-help big" style={{ textAlign: "center" }}>
          {HERO} restored all four wings and the Reading Room. {gradeLabel(grade)} ·{" "}
          {focus.subject === "mixed" ? "Mixed subjects" : focusLabel(focus)}
        </div>
        <Bookshelf have={g.s.books} onBook={onBook} />
        <div className="ll-help">
          Questions this visit: <b className="g">{right}/{log.length}</b> right
          {missing > 0 ? <> · <span className="y">{missing} bonus {missing === 1 ? "book is" : "books are"} still hidden in the wings!</span></> : <> · <span className="y">Every book is home!</span></>}
        </div>
        {byStd.size > 0 && (
          <div className="ll-tablewrap">
            <table className="ll-report-table">
              <thead><tr><th>STANDARD</th><th>SKILL</th><th>RESULT</th></tr></thead>
              <tbody>
                {[...byStd.entries()].map(([std, v]) => (
                  <tr key={std}>
                    <td className="c">{std}</td>
                    <td><span className={`ll-dot ${v.subject}`} />{v.skill}</td>
                    <td style={{ color: v.c === v.n ? "var(--ll-green)" : v.c / v.n >= 0.75 ? "var(--ll-yellow)" : "var(--ll-red)" }}>{v.c}/{v.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {practice.length > 0 && (
          <div className="ll-help"><span className="y">Practice next:</span> {practice.map(([std, v]) => `${v.skill} (${std})`).join(", ")}. These come up more often.</div>
        )}
        <div className="ll-row">
          <button className="ll-cta ghost" onClick={onTitle}>Title screen</button>
          <button className="ll-cta" autoFocus onClick={onKeep}>Keep exploring ▶</button>
        </div>
      </div>
    </div>
  );
}

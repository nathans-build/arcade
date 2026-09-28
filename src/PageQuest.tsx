import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChipAudio,
  arcadeLink,
  gradeFromArcade,
  gradeLabel,
  gradeNumber,
  initialGrade,
  isEarlyReader,
  readAloudPref,
  rememberGrade,
  setReadAloudPref,
  speechSupported,
  stopSpeaking,
  type Grade,
} from "@/kit";
import { SceneView } from "@/engine/view";
import { SHELF_BOOKS, makeBook, type Book } from "@/books";
import { bandOfGrade } from "@/story/roster";
import { draftToText, loadDrafts, saveDrafts, type Draft } from "@/writer/draft";
import { GradePicker, Library } from "@/ui/Library";
import { Reader, type ReaderStart } from "@/ui/Reader";
import { WriterDesk } from "@/ui/WriterDesk";
import { isTyping } from "@/game";
import "@/ui/pq.css";

/** Page Quest's own 16-step bassline: a gentle walking line in D (Hz; 0 = rest). */
const BASS = [147, 0, 185, 0, 220, 0, 185, 165, 147, 0, 123, 0, 110, 123, 139, 0];

type Screen = "library" | "read" | "writer";

interface Reading {
  book: Book;
  start: ReaderStart;
  /** Came from the Writer's Desk: return there afterwards. */
  playtest: boolean;
}

export default function PageQuest() {
  const audio = useMemo(() => new ChipAudio(BASS, 96), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<SceneView | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const [grade, setGrade] = useState<Grade>(() => initialGrade("6"));
  const [screen, setScreen] = useState<Screen>("library");
  const [reading, setReading] = useState<Reading | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>(() => loadDrafts());
  const [writerDraft, setWriterDraft] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(audio.muted);
  const [readAloud, setReadAloud] = useState(() => readAloudPref(isEarlyReader(initialGrade("6"))));
  const [layout, setLayout] = useState<{ mode: "stack" | "side"; cw: number }>({ mode: "stack", cw: 640 });
  const [touch, setTouch] = useState(false);
  const [libKey, setLibKey] = useState(0);

  const g = gradeNumber(grade);
  const tooYoung = g < 4;

  // Scene renderer (one canvas for the library and the reading screen)
  useEffect(() => {
    const v = new SceneView(canvasRef.current!);
    viewRef.current = v;
    v.start();
    return () => {
      v.stop();
      audio.stopMusic();
      stopSpeaking();
    };
  }, [audio]);

  // Fit the 16:10 screen and the text panel into the space left under the toolbar.
  useEffect(() => {
    const el = mainRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // The library needs a taller panel (shelf + book details) than the reading screen.
      const share = screen === "read" ? 0.54 : 0.44;
      // Wide screens (desktop, phones on their side): scene on the left, text on the right, like an open book.
      if (width > height * 1.45) setLayout({ mode: "side", cw: Math.floor(Math.min(width * 0.56, height * 1.6)) });
      else setLayout({ mode: "stack", cw: Math.floor(Math.min(width, height * share * 1.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [screen]);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setTouch(mq.matches);
    const on = () => setTouch(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const chooseGrade = useCallback((ng: Grade) => {
    setGrade(ng);
    rememberGrade(ng);
    setReadAloud(readAloudPref(isEarlyReader(ng)));
  }, []);

  const draftBooks = useMemo(
    () => drafts.map((d) => makeBook(`draft/${d.id}`, draftToText(d), { draft: true })),
    [drafts],
  );

  const openBook = useCallback(
    (book: Book, start: ReaderStart, playtest = false) => {
      audio.unlock();
      audio.startMusic();
      setPaused(false);
      setReading({ book, start, playtest });
      setScreen("read");
    },
    [audio],
  );

  const exitReading = useCallback(() => {
    stopSpeaking();
    setPaused(false);
    const r = reading;
    setReading(null);
    if (r?.playtest) setScreen("writer");
    else {
      setScreen("library");
      setLibKey((k) => k + 1);
    }
  }, [reading]);

  const updateDrafts = useCallback((next: Draft[]) => {
    setDrafts(next);
    saveDrafts(next);
  }, []);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const np = !p;
      if (viewRef.current) viewRef.current.paused = np;
      if (np) {
        stopSpeaking();
        audio.stopMusic();
      } else if (screen === "read") audio.startMusic();
      return np;
    });
  }, [audio, screen]);

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      setReadAloudPref(!on);
      return !on;
    });
  }, []);

  // Global keys: M mute, P pause (never while typing in a field).
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      if (isTyping(ev)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === "m" || ev.key === "M") setMuted(audio.toggleMute());
      else if ((ev.key === "p" || ev.key === "P") && screen === "read") togglePause();
      else if (ev.key === "Escape" && paused) togglePause();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [audio, screen, paused, togglePause]);

  // Playtest hook: ?debug exposes a few handles to automated tests.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    (window as unknown as { __pq: unknown }).__pq = {
      view: viewRef.current,
      books: SHELF_BOOKS.map((b) => ({ id: b.id, title: b.story.title, genre: b.story.genre, band: b.story.band })),
      screen,
      playText: (text: string, from?: string) => openBook(makeBook("debug/test", text), from ? { kind: "page", page: from } : { kind: "new" }),
    };
  }, [screen, openBook]);

  const playerBand = bandOfGrade(g);
  const showStage = screen !== "writer";

  return (
    <div className={`pq-root ${touch ? "touch" : ""}`}>
      <div className="pq-toolbar">
        <a href={arcadeLink(grade)} className="pq-pixel">◀ ARCADE</a>
        <div className="pq-tools">
          {screen === "read" && <button className="pq-pixel" onClick={togglePause}>{paused ? "RESUME" : "PAUSE"}</button>}
          <button className="pq-pixel" onClick={() => setMuted(audio.toggleMute())}>{muted ? "SOUND OFF" : "SOUND ON"}</button>
          {speechSupported() && (
            <button className="pq-pixel" onClick={toggleReadAloud} aria-pressed={readAloud}>
              {readAloud ? "READ ALOUD ON" : "READ ALOUD OFF"}
            </button>
          )}
        </div>
      </div>

      <div className={`pq-main ${showStage ? layout.mode : "writer"}`} ref={mainRef}>
        <div className="pq-screen" style={{ width: layout.cw, display: showStage ? undefined : "none" }}>
          <canvas ref={canvasRef} aria-label="Page Quest scene" onPointerDown={() => window.dispatchEvent(new CustomEvent("pq-skip"))} />
        </div>

        {showStage && (
          <div className="pq-panel" style={layout.mode === "stack" ? { maxWidth: Math.max(layout.cw, 720) } : undefined}>
            {tooYoung && screen === "library" ? (
              <TooYoung grade={grade} onGrade={chooseGrade} view={viewRef.current} />
            ) : screen === "library" ? (
              <Library
                key={libKey}
                grade={grade}
                playerBand={playerBand}
                books={SHELF_BOOKS}
                draftBooks={draftBooks}
                view={viewRef.current}
                onGrade={chooseGrade}
                onOpen={(b, start) => openBook(b, start)}
                onWriter={(draftId) => {
                  setWriterDraft(draftId);
                  setScreen("writer");
                }}
              />
            ) : reading ? (
              <Reader
                key={reading.book.id + JSON.stringify(reading.start)}
                book={reading.book}
                start={reading.start}
                playtest={reading.playtest}
                grade={grade}
                view={viewRef.current}
                audio={audio}
                readAloud={readAloud}
                paused={paused}
                onExit={exitReading}
              />
            ) : null}
          </div>
        )}

        {screen === "writer" && (
          <WriterDesk
            drafts={drafts}
            initialId={writerDraft}
            grade={grade}
            onChange={updateDrafts}
            onPlaytest={(book, page) => openBook(book, { kind: "page", page }, true)}
            onExit={() => {
              setScreen("library");
              setLibKey((k) => k + 1);
            }}
          />
        )}

        {paused && screen === "read" && (
          <div className="pq-overlay">
            <div className="pq-card center">
              <div className="pq-title pq-pixel">PAUSED</div>
              <button className="pq-cta" autoFocus onClick={togglePause}>Resume</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TooYoung({ grade, onGrade, view }: { grade: Grade; onGrade: (g: Grade) => void; view: SceneView | null }) {
  useEffect(() => {
    view?.set({ scene: "library", cast: [{ id: "quill", mood: "happy" }], speaking: null, title: true, banner: null, bubble: { who: "quill", text: "HOO! SEE YOU IN GRADE 4!" } });
  }, [view]);
  return (
    <div className="pq-young">
      <h1 className="pq-pixel">PAGE QUEST</h1>
      <p className="pq-credit pq-pixel">co-authored by SpiderBen10 (NZDO)</p>
      <p className="big">
        <b className="y">Page Quest is for grades 4 and up.</b> Quill the owl is saving these books for you!
        Until then, the arcade has lots of games for {gradeLabel(grade)}.
      </p>
      <p>
        <a className="pq-cta" href={arcadeLink(grade)}>◀ ARCADE</a>
      </p>
      {gradeFromArcade() ? (
        <p className="pq-badge pq-pixel">
          {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
        </p>
      ) : (
        <GradePicker grade={grade} onGrade={onGrade} />
      )}
    </div>
  );
}

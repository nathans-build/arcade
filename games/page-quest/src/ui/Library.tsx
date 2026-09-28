import { useEffect, useMemo, useRef, useState } from "react";
import { GRADES, arcadeLink, gradeFromArcade, gradeLabel, type Grade } from "@/kit";
import { HOW_TO_PLAY, bandTag, genreBooks, type Book } from "@/books";
import { GENRES, SCENE_LABEL, type Band, type Genre, type SceneId } from "@/story/roster";
import { SceneView } from "@/engine/view";
import { loadEndings, loadRun } from "@/play/storage";
import type { ReaderStart } from "./Reader";

type Tab = Genre | "mine";

const GENRE_LABEL: Record<Genre, string> = { mystery: "MYSTERY", adventure: "ADVENTURE", space: "SPACE" };
const QUILL_SAYS: Record<Tab, string> = {
  mystery: "A MYSTERY? BRING YOUR DETECTIVE EYES!",
  adventure: "ADVENTURE! PACK A MAP AND A SNACK.",
  space: "SPACE! MIND THE ASTEROIDS, READER.",
  mine: "YOUR OWN BOOKS! HOO, AN AUTHOR!",
};

export function GradePicker({ grade, onGrade }: { grade: Grade; onGrade: (g: Grade) => void }) {
  return (
    <div className="pq-grades" role="radiogroup" aria-label="Grade">
      {GRADES.map((g) => (
        <button key={g} role="radio" aria-checked={g === grade} className={`pq-grade pq-pixel ${g === grade ? "on" : ""}`} onClick={() => onGrade(g)} title={gradeLabel(g)}>
          {g}
        </button>
      ))}
    </div>
  );
}

export function bandLabel(band: string): string {
  return band === "4-5" ? "Grades 4–5" : band === "6-8" ? "Grades 6–8" : band === "9-12" ? "Grades 9–12" : band;
}

/** A small live scene (book covers, Writer's Desk preview). */
export function MiniScene({ scene, cast, className }: { scene: string; cast: { id: string; mood: string }[]; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const view = useRef<SceneView | null>(null);
  useEffect(() => {
    const v = new SceneView(ref.current!);
    view.current = v;
    v.start();
    return () => v.stop();
  }, []);
  useEffect(() => {
    view.current?.set({ scene, cast, speaking: null, title: false, bubble: null, banner: null });
  }, [scene, cast]);
  return <canvas ref={ref} className={`pq-mini ${className ?? ""}`} aria-label={`Scene: ${SCENE_LABEL[scene as SceneId] ?? scene}`} />;
}

export function Library({
  grade, playerBand, books, draftBooks, view, onGrade, onOpen, onWriter,
}: {
  grade: Grade;
  playerBand: Band | null;
  books: Book[];
  draftBooks: Book[];
  view: SceneView | null;
  onGrade: (g: Grade) => void;
  onOpen: (b: Book, start: ReaderStart) => void;
  onWriter: (draftId: string | null) => void;
}) {
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const t = localStorage.getItem("pageQuest.tab") as Tab | null;
      if (t && (t === "mine" || (GENRES as readonly string[]).includes(t))) return t;
    } catch {
      // ignore
    }
    return "mystery";
  });
  const list = useMemo(() => (tab === "mine" ? draftBooks : genreBooks(books, tab)), [tab, books, draftBooks]);
  const defaultPick = (l: Book[]) => (l.find((b) => bandTag(b.story.band, playerBand) === "YOUR LEVEL" && !b.sample) ?? l[0])?.id ?? null;
  const [picked, setPicked] = useState<string | null>(() => defaultPick(list));
  useEffect(() => {
    if (!list.some((b) => b.id === picked)) setPicked(defaultPick(list));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);
  const book = list.find((b) => b.id === picked) ?? null;
  const htp = HOW_TO_PLAY;

  // Keys: ← → pick a book, Enter reads it (never while typing in a field).
  useEffect(() => {
    const down = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      const i = list.findIndex((b) => b.id === picked);
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        const n = list.length ? (i + (ev.key === "ArrowRight" ? 1 : -1) + list.length) % list.length : -1;
        if (n >= 0) setPicked(list[n].id);
      } else if (ev.key === "Enter" && (!t || t.tagName !== "BUTTON" && t.tagName !== "A") && book && book.errors.length === 0) {
        ev.preventDefault();
        const save = loadRun(book.id);
        onOpen(book, save && save.page !== book.story.start ? { kind: "continue" } : { kind: "new" });
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [list, picked, book, onOpen]);

  useEffect(() => {
    try {
      localStorage.setItem("pageQuest.tab", tab);
    } catch {
      // ignore
    }
  }, [tab]);

  useEffect(() => {
    view?.set({
      scene: "library",
      cast: [
        { id: "hero", mood: "normal" },
        { id: "quill", mood: "happy" },
      ],
      speaking: "quill",
      title: true,
      banner: null,
      bubble: { who: "quill", text: QUILL_SAYS[tab] },
    });
    const t = window.setTimeout(() => view?.set({ speaking: null }), 1600);
    return () => window.clearTimeout(t);
  }, [view, tab]);

  return (
    <div className="pq-library">
      <div className="pq-libhead">
        <div>
          <span className="pq-logo pq-pixel">PAGE QUEST</span>
          <span className="pq-credit"> · co-authored by SpiderBen10 (NZDO)</span>
        </div>
        {gradeFromArcade() ? (
          <span className="pq-badge pq-pixel">
            {gradeLabel(grade).toUpperCase()} · <a href={arcadeLink(grade)}>CHANGE GRADE IN THE ARCADE</a>
          </span>
        ) : (
          <GradePicker grade={grade} onGrade={onGrade} />
        )}
      </div>

      <div className="pq-tabs" role="tablist">
        {GENRES.map((g) => (
          <button key={g} role="tab" aria-selected={tab === g} className={`pq-tab pq-pixel ${g} ${tab === g ? "on" : ""}`} onClick={() => setTab(g)}>
            {GENRE_LABEL[g]}
          </button>
        ))}
        <button role="tab" aria-selected={tab === "mine"} className={`pq-tab pq-pixel mine ${tab === "mine" ? "on" : ""}`} onClick={() => setTab("mine")}>
          MY BOOKS
        </button>
        <span className="dim pq-kbd">← → pick · ENTER read</span>
      </div>

      <div className="pq-shelfwrap">
        {tab === "mine" && <div className="pq-shelf-label pq-pixel">MY BOOKS · by SpiderBen10</div>}
        <div className="pq-shelf" role="list">
          {list.map((b) => {
            const tag = b.draft ? "MY BOOK" : b.sample ? "HOW TO PLAY" : bandTag(b.story.band, playerBand);
            return (
              <button
                key={b.id}
                role="listitem"
                className={`pq-spine ${b.story.genre} band-${b.story.band} ${picked === b.id ? "on" : ""}`}
                onClick={() => setPicked(b.id)}
                onDoubleClick={() => b.errors.length === 0 && onOpen(b, { kind: "new" })}
                aria-label={`${b.story.title}, ${tag}`}
              >
                <span className="t">{b.story.title || "(untitled)"}</span>
                <span className={`tag pq-pixel ${tag.replace(/\s/g, "-").toLowerCase()}`}>{tag}</span>
              </button>
            );
          })}
          {tab === "mine" && (
            <button className="pq-spine new" onClick={() => onWriter(null)}>
              <span className="t">+ NEW BOOK</span>
              <span className="tag pq-pixel">WRITE</span>
            </button>
          )}
          {list.length === 0 && tab !== "mine" && <div className="pq-empty">Quill is still shelving these books. Come back soon!</div>}
        </div>
      </div>

      {book && <BookDetail key={book.id} book={book} playerBand={playerBand} onOpen={onOpen} onWriter={onWriter} />}

      <div className="pq-librow">
        {htp && (
          <button className="pq-cta ghost" onClick={() => onOpen(htp, { kind: "new" })}>
            ? How to play
          </button>
        )}
        <button className="pq-cta ghost desk" onClick={() => onWriter(null)}>
          ✎ Writer's Desk
        </button>
      </div>
    </div>
  );
}

function BookDetail({ book, playerBand, onOpen, onWriter }: { book: Book; playerBand: Band | null; onOpen: (b: Book, s: ReaderStart) => void; onWriter: (id: string | null) => void }) {
  const s = book.story;
  const found = loadEndings(book.id);
  const save = book.errors.length ? null : loadRun(book.id);
  const startPage = s.pages.find((p) => p.id === s.start);
  const cast = useMemo(() => startPage?.cast.slice(0, 3) ?? [], [startPage]);
  const tag = book.draft ? "MY BOOK" : book.sample ? "HOW TO PLAY" : bandTag(s.band, playerBand);
  const nFound = book.endings.filter((e) => found.includes(e.page)).length;
  return (
    <div className="pq-detail">
      <MiniScene scene={s.cover} cast={cast} className="cover" />
      <div className="info">
        <div className="title">{s.title || "(untitled)"}</div>
        <div className="meta">
          by {s.author || "?"} · {bandLabel(s.band)} · <span className="y">{tag}</span> · reading level {book.readingLevel.toFixed(1)}
        </div>
        {book.errors.length > 0 ? (
          <div className="pq-btnrow">
            <span className="no">{book.errors.length} problem{book.errors.length > 1 ? "s" : ""} to fix first.</span>
            {book.draft && <button className="pq-cta" onClick={() => onWriter(book.id.replace(/^draft\//, ""))}>Fix in Writer's Desk</button>}
          </div>
        ) : (
          <div className="pq-btnrow">
            {save && save.page !== s.start ? (
              <>
                <button className="pq-cta" onClick={() => onOpen(book, { kind: "continue" })}>Continue ▶</button>
                <button className="pq-cta ghost" onClick={() => onOpen(book, { kind: "new" })}>Start over</button>
              </>
            ) : (
              <button className="pq-cta" onClick={() => onOpen(book, { kind: "new" })}>Read ▶</button>
            )}
            {book.draft && <button className="pq-cta ghost" onClick={() => onWriter(book.id.replace(/^draft\//, ""))}>Edit</button>}
          </div>
        )}
        <div className="blurb">{s.blurb}</div>
        <div className="meta">
          Endings found: <b className="y">{nFound} / {book.endings.length}</b>
          {nFound > 0 && (
            <span className="dim">
              {" "}— {book.endings.filter((e) => found.includes(e.page)).map((e) => e.name).join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
